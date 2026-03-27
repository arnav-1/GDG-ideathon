import re
import uuid
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict
from graph import app_graph

app = FastAPI(title="Smart Knowledge Navigator API v1")

# --- Pydantic Models ---
class QueryRequest(BaseModel):
    query: str
    persona: str = Field(default="Standard User")
    language: str = Field(default="English")
    thread_id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class Source(BaseModel):
    title: str
    page: int

class QueryResponse(BaseModel):
    status: str
    answer: str
    sources: List[Source]
    thread_id: str

# --- Endpoints ---

@app.post("/api/v1/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    try:
        initial_state = {
            "messages": [],
            "user_query": request.query,
            "persona": request.persona,
            "language": request.language,
            "hypothetical_document": "",
            "search_query": "",
            "filters": {},
            "retrieved_docs": [],
            "final_answer": "",
            "sources": []
        }
        
        config = {"configurable": {"thread_id": request.thread_id}}
        result = await app_graph.ainvoke(initial_state, config=config)
        
        # Extract the thinking and answer sections
        full_text = result["final_answer"]
        answer_match = re.search(r"<answer>(.*?)</answer>", full_text, re.DOTALL)
        
        # Clean answer: extract text between tags, or return full text if tags not found
        clean_answer = answer_match.group(1).strip() if answer_match else full_text
        
        # Fallback if no docs retrieved
        if not result["retrieved_docs"]:
            clean_answer = "I cannot find sufficient information in the provided knowledge base to answer this query."
        
        return QueryResponse(
            status="success" if result["retrieved_docs"] else "partial_success",
            answer=clean_answer,
            sources=result["sources"],
            thread_id=request.thread_id
        )
    except Exception as e:
        print(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
