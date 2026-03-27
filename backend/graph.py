import os
import json
import re
import numpy as np
from typing import TypedDict, List, Dict, Optional, Annotated
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langgraph.graph import StateGraph, END, add_messages
from langgraph.checkpoint.memory import MemorySaver
from langchain_core.messages import HumanMessage, SystemMessage
from rank_bm25 import BM25Okapi
from pinecone import Pinecone

load_dotenv()


class AgentState(TypedDict):
    messages: Annotated[List, add_messages]
    user_query: str
    persona: str
    language: str
    hypothetical_document: str
    search_query: str
    filters: Dict
    retrieved_docs: List[Dict]
    final_answer: str
    sources: List[Dict]
    is_valid: bool
    evaluation_feedback: str



def planner_node(state: AgentState) -> Dict:
    """Agent 1: Generate HyDE, extract filters, and expand query variations."""
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    
    system_prompt = (
        "You are an expert Search Retrieval Architect. Your task is to optimize a user's query for a Vector Database search. "
        "You must perform three tasks:\n"
        "1. Generate a Hypothetical Document (HyDE): Write a brief, highly technical paragraph that directly answers the user's query. Write it as if you are the official documentation. Include highly relevant keywords, technical terms, and jargon that would likely appear in the actual source document.\n"
        "2. Extract Metadata Filters: Analyze the user's query for implied category. "
        "- If the query implies technical specifications or implementation, tag the category as 'Technical'.\n"
        "- If the query implies pricing, features, or business value, tag the category as 'Commercial'.\n"
        "- If the query implies troubleshooting or operations, tag the category as 'Support'.\n"
        "3. Generate Query Variations: Create 2 alternative phrasings of the user query that capture different aspects or terminology.\n\n"
        "OUTPUT FORMAT:\n"
        "You must output ONLY a valid JSON object. Do not include any markdown formatting, explanations, or conversational text.\n"
        "{\n"
        '  "hypothetical_document": "<your generated hypothetical answer>",\n'
        '  "filters": {\n'
        '    "category": "<Technical OR Commercial OR Support OR null>"\n'
        "  },\n"
        '  "query_variations": ["<alternative query 1>", "<alternative query 2>"]\n'
        "}"
    )
    
    user_msg = f"User Query: {state['user_query']}"
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_msg)
    ])
    
    try:
        # Extract content string from response (handle various response types)
        if hasattr(response, 'content'):
            response_text = response.content
        else:
            response_text = str(response)
        
        # Ensure it's a string
        if isinstance(response_text, str):
            response_text = response_text
        else:
            response_text = str(response_text)
        
        # Clean markdown code blocks if present
        clean_content = re.sub(r'^```json\s*|\s*```$', '', response_text.strip(), flags=re.MULTILINE)
        data = json.loads(clean_content)
        
        # Extract query variations for multi-query retrieval
        query_variations = data.get("query_variations", [])
        
        return {
            "hypothetical_document": data.get("hypothetical_document", state['user_query']),
            "search_query": json.dumps({
                "hyde": data.get("hypothetical_document", state['user_query']),
                "variations": query_variations
            }),
            "filters": data.get("filters", {})
        }
    except json.JSONDecodeError as e:
        print(f"JSON Parse Error in planner_node: {e}. Falling back to raw query.")
        return {
            "hypothetical_document": state['user_query'],
            "search_query": json.dumps({"hyde": state['user_query'], "variations": []}),
            "filters": {}
        }
    except Exception as e:
        print(f"Unexpected error in planner_node: {e}. Falling back to raw query.")
        return {
            "hypothetical_document": state['user_query'],
            "search_query": json.dumps({"hyde": state['user_query'], "variations": []}),
            "filters": {}
        }

def retriever_node(state: AgentState) -> Dict:
    """
    Agent 2: Hybrid Retrieval with Query Expansion, BM25+Semantic Search, and Re-ranking.
    
    Implements:
    1. Query Expansion: Retrieves using HyDE + generated query variations
    2. Hybrid Search: Combines BM25 (keyword) + semantic (vector) search
    3. Re-ranking: Combines scores and re-ranks top-10
    """
    embeddings = HuggingFaceEmbeddings(model_name=os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2"))
    
    # Initialize Pinecone client and index
    pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
    index_name = os.getenv("PINECONE_INDEX_NAME")
    index = pc.Index(index_name)
    
    filter_dict = state.get("filters", {})
    
    # Build Pinecone filter if category is specified
    pinecone_filter = None
    if filter_dict and "category" in filter_dict and filter_dict["category"]:
        pinecone_filter = {"category": {"$eq": filter_dict["category"]}}
    
    # Parse search query to extract HyDE and variations
    try:
        search_data = json.loads(state.get("search_query", "{}"))
        hyde_query = search_data.get("hyde", state["user_query"])
        query_variations = search_data.get("variations", [])
    except:
        hyde_query = state.get("hypothetical_document", state["user_query"])
        query_variations = []
    all_queries = [hyde_query] + query_variations
    semantic_results = {}  
    
    # --- SEMANTIC SEARCH PHASE ---
    for query in all_queries:
        try:
            # Get embedding for query
            query_embedding = embeddings.embed_query(query)
            
            # Query Pinecone
            results = index.query(
                vector=query_embedding,
                top_k=15,
                include_metadata=True,
                filter=pinecone_filter
            )
            
            # Process results
            for match in results.get("matches", []):
                doc_content = match.get("metadata", {}).get("text", "")
                similarity = match.get("score", 0)
                
                if doc_content:
                    # Store max score across all query variations
                    if doc_content not in semantic_results:
                        semantic_results[doc_content] = {
                            "score": similarity,
                            "source": match.get("metadata", {}).get("source", "Unknown"),
                            "page": match.get("metadata", {}).get("page_number", 0)
                        }
                    else:
                        semantic_results[doc_content]["score"] = max(
                            semantic_results[doc_content]["score"], similarity
                        )
        except Exception as e:
            print(f"Error in semantic search for query '{query}': {e}")
            continue
    
    if not semantic_results:
        print(f"Warning: No documents found. Original query: {state['user_query']}")
        return {"retrieved_docs": [], "sources": []}
    
    # --- BM25 KEYWORD SEARCH ---
    bm25_results = {}  # {doc_content: bm25_score}
    
    # Build corpus from semantic results (to ensure consistency)
    corpus = list(semantic_results.keys())
    
    # Tokenize for BM25
    tokenized_corpus = [doc.lower().split() for doc in corpus]
    bm25 = BM25Okapi(tokenized_corpus)
    
    # Score all queries with BM25
    for query in all_queries:
        tokenized_query = query.lower().split()
        scores = bm25.get_scores(tokenized_query)
        
        for idx, score in enumerate(scores):
            doc_content = corpus[idx]
            if doc_content not in bm25_results:
                bm25_results[doc_content] = score
            else:
                bm25_results[doc_content] = max(bm25_results[doc_content], score)
    
    # --- RE-RANKING: Combine Semantic + BM25 Scores ---
    final_scores = {}
    for doc_content, semantic_data in semantic_results.items():
        # Normalize scores to [0, 1]
        semantic_score = (semantic_data["score"] + 1) / 2  # Normalize from [-1, 1] to [0, 1]
        bm25_score = bm25_results.get(doc_content, 0)
        
        # Normalize BM25 score
        max_bm25 = max(bm25_results.values()) if bm25_results else 1
        bm25_normalized = bm25_score / (max_bm25 + 1e-8)
        
        # Weighted combination: 70% semantic (semantic alignment), 30% keyword (lexical match)
        combined_score = (0.7 * semantic_score) + (0.3 * bm25_normalized)
        
        final_scores[doc_content] = {
            "combined_score": combined_score,
            "semantic_score": semantic_score,
            "bm25_score": bm25_normalized,
            "source": semantic_data["source"],
            "page": semantic_data["page"],
            "content": doc_content
        }
    
    # Sort by combined score (descending)
    ranked_docs = sorted(final_scores.items(), key=lambda x: x[1]["combined_score"], reverse=True)
    
    # Keep top-5 after re-ranking
    top_docs = ranked_docs[:5]
    
    retrieved_docs = []
    sources = []
    seen_sources = set()
    
    for _, doc_data in top_docs:
        retrieved_docs.append({
            "content": doc_data["content"],
            "source": doc_data["source"],
            "page": doc_data["page"]
        })
        
        # Deduplicate sources
        source_key = (doc_data["source"], doc_data["page"])
        if source_key not in seen_sources:
            sources.append({
                "title": doc_data["source"],
                "page": doc_data["page"]
            })
            seen_sources.add(source_key)
    
    print(f"Retrieved {len(retrieved_docs)} documents after hybrid retrieval & re-ranking.")
    
    return {"retrieved_docs": retrieved_docs, "sources": sources}

def synthesizer_node(state: AgentState) -> Dict:
    """Agent 3: Synthesizes final answer with step-by-step reasoning and citations."""
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.2)
    
    context_str = "\n".join([f"Source: {d['source']}, Page: {d['page']}\nContent: {d['content']}" for d in state["retrieved_docs"]])
    
    system_prompt = (
        "You are an expert Knowledge Synthesizer. Your task is to provide a highly accurate, professional answer to the user's query based EXCLUSIVELY on the provided <context>.\n\n"
        "<instructions>\n"
        "1. Evaluate the Context: Read the provided <context> documents. If the answer to the user's query cannot be found within these documents, you must state: \"I cannot find sufficient information in the provided documentation to answer this.\" Do not use outside knowledge.\n"
        "2. Adopt the Persona: You must tailor your tone, vocabulary, and structural formatting to match the user's requested <persona>.\n"
        "3. Cite Your Sources: Every factual claim must be followed by an inline citation using the source metadata provided in the context. Format citations like this: [Source: DocumentName.pdf, Page: X].\n"
        "4. Language: The final output must be translated natively into the requested <language>.\n"
        "</instructions>\n\n"
        "Take a deep breath and think step-by-step. First, write out your reasoning and map out which facts from the <context> answer the <user_query> inside <thinking> tags. Then, provide your final formatted response."
    )
    
    user_msg = (
        f"<persona>{state['persona']}</persona>\n"
        f"<language>{state['language']}</language>\n"
        f"<context>\n{context_str}\n</context>\n"
        f"<user_query>{state['user_query']}</user_query>"
    )
    
    # If there's evaluation feedback from the evaluator, include it to guide corrections
    if state.get("evaluation_feedback"):
        user_msg += f"\n<evaluation_feedback>Previous response had issues: {state['evaluation_feedback']}. Please fix these issues in your new response.</evaluation_feedback>"
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_msg)
    ])
    
    return {"final_answer": response.content}

def evaluator_node(state: AgentState) -> Dict:
    """Agent 4: Hallucination Evaluator - grades synthesizer output against retrieved context."""
    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0)
    
    context_str = "\n".join([f"Source: {d['source']}, Page: {d['page']}\nContent: {d['content']}" for d in state["retrieved_docs"]])
    
    system_prompt = (
        "You are a strict Hallucination Evaluator. Your task is to compare the draft answer against the retrieved context and determine if it contains any facts, numbers, or features not explicitly stated in the context.\n\n"
        "OUTPUT ONLY a JSON object with this exact format:\n"
        '{"pass": true/false, "feedback": "reasoning or corrections needed"}\n\n'
        "If 'pass' is true, the answer adheres strictly to the context. If 'pass' is false, 'feedback' must explain what facts are hallucinated or unsupported."
    )
    
    user_msg = (
        f"<retrieved_context>\n{context_str}\n</retrieved_context>\n\n"
        f"<draft_answer>\n{state['final_answer']}\n</draft_answer>\n\n"
        f"Compare the draft answer to the retrieved context. Does it contain ANY facts, numbers, or features not explicitly stated?"
    )
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_msg)
    ])
    
    try:
        clean_content = re.sub(r'^```json\s*|\s*```$', '', response.content.strip(), flags=re.MULTILINE)
        evaluation = json.loads(clean_content)
        return {
            "is_valid": evaluation.get("pass", True),
            "evaluation_feedback": evaluation.get("feedback", "")
        }
    except json.JSONDecodeError:
        print(f"Evaluator JSON parse error: {response.content}")
        return {"is_valid": True, "evaluation_feedback": ""}

def create_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("planner", planner_node)
    workflow.add_node("retriever", retriever_node)
    workflow.add_node("synthesizer", synthesizer_node)
    workflow.add_node("evaluator", evaluator_node)

    workflow.set_entry_point("planner")
    workflow.add_edge("planner", "retriever")
    workflow.add_edge("retriever", "synthesizer")
    workflow.add_edge("synthesizer", "evaluator")
    
    # Conditional routing: if is_valid=True go to END, else loop back to synthesizer for correction
    def should_end(state: AgentState) -> str:
        return "end" if state.get("is_valid", True) else "synthesizer"
    
    workflow.add_conditional_edges(
        "evaluator",
        should_end,
        {"end": END, "synthesizer": "synthesizer"}
    )

    memory = MemorySaver()
    return workflow.compile(checkpointer=memory)

app_graph = create_graph()
