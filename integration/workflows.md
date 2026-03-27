# Integration Workflows

This document describes the complete data and control flow through the system for ingestion and query processing.

## 1. Document Ingestion Workflow

**Trigger:** User (admin or frontend) uploads PDF files via `POST /api/v1/ingest`

**Flow Diagram:**
```
User uploads PDFs
        │
        ▼
FastAPI /ingest endpoint receives multipart/form-data
        │
        ├─ Validate file extensions (.pdf only)
        │
        ▼
Call ingest_from_files() with file tuples
        │
        ├─ Write files to temp directory
        └─ Parse each PDF with PyMuPDFLoader
        │
        ▼
Split documents into chunks (1000 tokens, 200 overlap)
        │
        ▼
Enrich metadata for each chunk:
  ├─ source: filename
  ├─ page_number: from PDF metadata
  ├─ category: get_category_tag(filename)  [ML-based]
  ├─ timestamp: current Unix time
  └─ text: first 500 chars preview
        │
        ▼
Embed chunks with HuggingFace model (384-dim vectors)
        │
        ▼
Create chunk IDs: chunk_{timestamp}_{index}
        │
        ▼
Batch upsert to Pinecone (100 vectors per batch)
        │
        ├─ Pinecone deduplicates on chunk_id match
        └─ Metadata stored with vector
        │
        ▼
Clean up temporary files
        │
        ▼
Return IngestResponse with:
  ├─ status: "success" or "failed"
  ├─ vectors_upserted: count
  ├─ documents_processed: count
  └─ errors: array of issues (if any)
```

**Detailed Process:**

### Step 1: File Validation
```python
for file in uploaded_files:
    if not file.filename.lower().endswith('.pdf'):
        errors.append(f"Skipped {filename}: only PDF files are supported")
        continue
    # Proceed with file
```

### Step 2: PDF Parsing
```python
loader = PyMuPDFLoader(file_path)
documents = loader.load()
# Each document has: page_content, metadata {"page": N}
```

### Step 3: Chunking
```python
splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", " ", ""]
)
chunks = splitter.split_documents(documents)
# Result: 15-50 chunks per typical PDF
```

### Step 4: Category Classification
```python
def get_category_tag(filename: str) -> str:
    filename_lower = filename.lower()
    
    technical_keywords = ["spec", "architecture", "hardware", "api", ...]
    sales_keywords = ["pricing", "license", "sla", "benefits", ...]
    support_keywords = ["troubleshoot", "faq", "install", ...]
    
    scores = {
        "Technical": count_matches(technical_keywords),
        "Commercial": count_matches(sales_keywords),
        "Support": count_matches(support_keywords)
    }
    
    return max(scores, key=scores.get) or "General"
```

### Step 5: Embedding
```python
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

for chunk in chunks:
    vector = embeddings.embed_query(chunk.page_content)
    # vector is 384-dimensional numpy array
    
    chunk_id = f"chunk_{int(time.time())}_{idx}"
    metadata = {
        "source": chunk.metadata["source"],
        "page_number": chunk.metadata["page"],
        "category": category_tag,
        "timestamp": int(time.time()),
        "text": chunk.page_content[:500]
    }
    
    vectors_to_upsert.append((chunk_id, vector, metadata))
```

### Step 6: Batch Upsert
```python
batch_size = 100
for i in range(0, len(vectors_to_upsert), batch_size):
    batch = vectors_to_upsert[i:i + batch_size]
    index.upsert(vectors=batch)
    # Pinecone stores: (id) -> (vector embeddings, metadata)
    
    # Deduplication: If chunk_id already exists, metadata overwrites
```

**Example Outcome:**
- Input: `poweredge-r760-spec-sheet.pdf` (18 pages)
- Output after chunking: ~340 chunks
- Output after embedding: 340 vectors in Pinecone
- Metadata stored: source, page, category, timestamp for each vector

---

## 2. Query Processing Workflow

**Trigger:** User (frontend) sends query via `POST /api/v1/query`

**Complete Flow Diagram:**
```
User submits query (with optional thread_id, persona, language)
        │
        ▼
FastAPI /query endpoint receives request
        │
        ├─ Validate request schema
        └─ Generate thread_id if not provided
        │
        ▼
Create initial AgentState:
  ├─ messages: [] (or load from MemorySaver if thread_id exists)
  ├─ user_query: request.query
  ├─ persona: request.persona ("Standard User" default)
  ├─ language: request.language ("English" default)
  └─ All other fields: empty strings/lists
        │
        ▼
Execute LangGraph `app_graph.ainvoke(state, config={"thread_id": thread_id})`
        │
        ├─────────────────────────────────────────┐
        │                                         │
        ▼                                         │
    AGENT 1: PLANNER                             │
    ┌─────────────────────────────────────────┐  │
    │ Input: user_query, persona, language   │  │
    │                                         │  │
    │ 1. Prompt Groq to generate HyDE        │  │
    │    (hypothetical 200+ word document    │  │
    │     that would answer the query)       │  │
    │                                         │  │
    │ 2. Extract 2 query variations          │  │
    │    (different phrasings of same Q)     │  │
    │                                         │  │
    │ 3. Categorize: Technical/Commercial/   │  │
    │    Support/null                        │  │
    │                                         │  │
    │ Output: hypothetical_document,         │  │
    │         query_variations,              │  │
    │         filters: {category: ...}       │  │
    └─────────────────────────────────────────┘  │
        │                                         │
        ▼                                         │
    AGENT 2: RETRIEVER                          │
    ┌─────────────────────────────────────────┐  │
    │ Input: hypothetical_document,           │  │
    │        query_variations, filters        │  │
    │                                         │  │
    │ 1. Embed all 3 queries with             │  │
    │    HuggingFace (384-dim vectors)        │  │
    │                                         │  │
    │ 2. Query Pinecone for each              │  │
    │    (k=15 per query)                     │  │
    │                                         │  │
    │ 3. Deduplicate by (source, page)        │  │
    │                                         │  │
    │ 4. Compute BM25 keyword scores          │  │
    │    on dedup'd results                   │  │
    │                                         │  │
    │ 5. Combine scores:                      │  │
    │    score = 0.7*semantic + 0.3*BM25      │  │
    │                                         │  │
    │ 6. Return top-5 with metadata           │  │
    │                                         │  │
    │ Output: retrieved_docs (List[Dict])     │  │
    │ (each has source, page, text, score)    │  │
    └─────────────────────────────────────────┘  │
        │                                         │
        ▼                                         │
    AGENT 3: CONFLICT MANAGER                    │
    ┌─────────────────────────────────────────┐  │
    │ Input: retrieved_docs                   │  │
    │                                         │  │
    │ 1. Format docs with timestamps          │  │
    │                                         │  │
    │ 2. Prompt Groq to detect contradictions │  │
    │    ("CompanyX supports 4TB vs 6TB")     │  │
    │                                         │  │
    │ 3. If conflicts:                        │  │
    │    → Use most recent timestamp (latest) │  │
    │    → Generate resolution instructions   │  │
    │                                         │  │
    │ 4. If no conflicts:                     │  │
    │    → Output "No conflicts detected."    │  │
    │                                         │  │
    │ Output: conflict_resolution_notes       │  │
    │         (string with resolutions)       │  │
    └─────────────────────────────────────────┘  │
        │                                         │
        ▼                                         │
    AGENT 4: SYNTHESIZER                        │
    ┌─────────────────────────────────────────┐  │
    │ Input: user_query, retrieved_docs,      │  │
    │        conflict_resolution_notes,       │  │
    │        persona, language, messages      │  │
    │                                         │  │
    │ 1. Build comprehensive prompt:          │  │
    │    ├─ Full text of top-5 documents      │  │
    │    ├─ Conflict resolution notes         │  │
    │    ├─ Persona instructions              │  │
    │    ├─ Language requirements             │  │
    │    └─ Conversation history (messages)   │  │
    │                                         │  │
    │ 2. Call Groq with temperature=0.2       │  │
    │    (slight randomness for naturalness)  │  │
    │                                         │  │
    │ 3. Extract answer from <answer> tags   │  │
    │                                         │  │
    │ 4. Parse citations [Source: X, Page: Y] │  │
    │                                         │  │
    │ 5. Build sources[] from citations       │  │
    │                                         │  │
    │ Output: final_answer (string with       │  │
    │         inline citations), sources[]    │  │
    └─────────────────────────────────────────┘  │
        │                                         │
        ▼                                         │
    AGENT 5: EVALUATOR                          │
    ┌─────────────────────────────────────────┐  │
    │ Input: final_answer, retrieved_docs     │  │
    │                                         │  │
    │ 1. Extract factual claims from answer   │  │
    │                                         │  │
    │ 2. Validate against doc text:           │  │
    │    ├─ Each claim is in retrieved_docs   │  │
    │    └─ No hallucinated facts             │  │
    │                                         │  │
    │ 3. Return JSON:                         │  │
    │    {"pass": true/false, "feedback": ""} │  │
    │                                         │  │
    │ Output: is_valid (bool),                │  │
    │         evaluation_feedback (if failed) │  │
    └─────────────────────────────────────────┘  │
        │                                         │
        └─────────────┬──────────────────────────┘
                      │
                      ▼
        Decision: is_valid == true?
                      │
        ┌─────────────┴──────────────────┐
        │                                │
        YES (Valid)                      NO (Hallucination)
        │                                │
        ▼                                ▼
      END                         Loop back to SYNTHESIZER
    Return response               with evaluation_feedback
                                  │
                                  ├─ Attempt up to 3 times
                                  └─ If still fails, return
                                     partial answer with feedback
```

**State Evolution Example:**

```
Initial State (from request):
{
  "user_query": "What is R760 max RAM?",
  "persona": "Standard User",
  "language": "English",
  "hypothetical_document": "",
  "search_query": "",
  "filters": {},
  "retrieved_docs": [],
  "final_answer": "",
  "sources": [],
  "is_valid": False,
  "evaluation_feedback": "",
  "conflict_resolution_notes": ""
}

After Planner:
{
  "hypothetical_document": "The PowerEdge R760 is a 2-socket server with support for up to...",
  "search_query": "R760 maximum memory capacity",
  "filters": {"category": "Technical"},
  ... (rest unchanged)
}

After Retriever:
{
  "retrieved_docs": [
    {
      "source": "poweredge-r760-spec-sheet.pdf",
      "page": 3,
      "text": "Maximum RAM: 6TB",
      "timestamp": 1711929600
    },
    ...
  ],
  ... (rest updated)
}

After Conflict Manager:
{
  "conflict_resolution_notes": "No conflicts detected.",
  ... (rest unchanged)
}

After Synthesizer:
{
  "final_answer": "The PowerEdge R760 supports up to 6TB of DRAM [Source: poweredge-r760-spec-sheet.pdf, Page: 3].",
  "sources": [
    {"source": "poweredge-r760-spec-sheet.pdf", "page": 3, "preview": "..."}
  ],
  ... (rest updated)
}

After Evaluator (Pass):
{
  "is_valid": True,
  "evaluation_feedback": "",
  ... (ready to return)
}
```

---

## 3. Multi-Turn Conversation (Session Persistence)

**Mechanism:** MemorySaver checkpointer with thread_id

**Example Conversation:**
```
Request 1:
  POST /api/v1/query
  {
    "query": "Tell me about the PowerEdge R760",
    "thread_id": null  # Not provided
  }

Response 1:
  {
    "answer": "The PowerEdge R760 is a 2-socket 2U server...",
    "thread_id": "550e8400-e29b-41d4-a716-446655440000"
  }

[MemorySaver stores: thread_id:550e8400... -> [("user", "Tell me..."), ("assistant", "The PowerEdge...")])

Request 2:
  POST /api/v1/query
  {
    "query": "How much storage capacity?",
    "thread_id": "550e8400-e29b-41d4-a716-446655440000"  # Reuse
  }

[MemorySaver loads previous messages for this thread]
[Agents see full conversation history]

Response 2:
  {
    "answer": "...storage supports up to 24 NVMe drives, as mentioned earlier...",
    "thread_id": "550e8400-e29b-41d4-a716-446655440000"
  }

[MemorySaver appends: ("user", "How much..."), ("assistant", "...storage...")]
```

**How MemorySaver Works:**
```python
# In LangGraph graph execution:
config = {
  "configurable": {
    "thread_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}

# MemorySaver.get_tuple(config):
# Returns (values, metadata) where values contains previous messages

# During execution, messages are automatically accumulated via add_messages

# After execution, MemorySaver stores the full message history for this thread
```

---

## 4. Error Handling and Retry Behavior

### Ingestion Errors

| Error | Status Code | Response | Recovery |
|-------|------|----------|----------|
| No valid PDFs | 200 | `{"status": "failed", ...}` | Admin can retry with valid PDFs |
| File format error | 200 | Added to `errors[]` | Other files still processed |
| Pinecone unavailable | 500 | Server error | Retry entire request after Pinecone recovers |
| Embedding model timeout | 500 | Server error | Retry (model typically recovers in seconds) |

### Query Errors

| Error | Behavior | Resolution |
|-------|----------|-----------|
| Groq API timeout | 500 error | Frontend retries exponentially |
| No documents retrieved | 200 (partial_success) | Message: "Cannot find sufficient information" |
| LLM hallucination | Auto-retry loop | Evaluator triggers Synthesizer re-attempt up to 3x |
| Pinecone connection fail | 500 error | Frontend waits then retries |

### Evaluator Self-Correction Loop

```
Attempt 1:
  Synthesizer: "PowerEdge R760 supports 8TB RAM"
  Evaluator: {"pass": false, "feedback": "Docs say max 6TB, not 8TB"}
  
Attempt 2:
  Synthesizer (with feedback): "PowerEdge R760 supports 6TB RAM"
  Evaluator: {"pass": true, "feedback": ""}
  
Result: Return successful response with evaluation_feedback noting correction
```

**Max retries:** 3 attempts before returning best-effort answer

---

## 5. State Persistence in MemorySaver

**Storage:** In-memory by default (production should use persistent checkpointer)

**Key Format:** `config["configurable"]["thread_id"]`

**State Saved:** All `messages` (Annotated[List, add_messages])

**Retrieval:** Automatic at graph invocation if thread_id exists

**Cleanup:** No automatic cleanup; threads persist for session lifetime
