# Integration Endpoints

This document details the two primary HTTP endpoints, their request/response formats, error handling, and real-world examples.

## 1. POST /api/v1/query

**Purpose:** Process a user query through the agentic RAG pipeline and return a synthesized answer with inline citations.

**Implementation:** [backend/main.py](backend/main.py) → delegates to [backend/graph.py](backend/graph.py) `app_graph.ainvoke()`

**URL:** `http://localhost:8000/api/v1/query`

### Request Format

**Content-Type:** `application/json`

**Body Schema:**
```python
{
  "query": str,              # REQUIRED - User's natural language question
  "persona": str,            # OPTIONAL - Default: "Standard User"
  "language": str,           # OPTIONAL - Default: "English"
  "thread_id": str           # OPTIONAL - UUID; auto-generated if omitted
}
```

**Persona Options (tested values):**
- `"Standard User"` - Neutral, informative tone
- `"Enthusiastic Tech Salesperson"` - Marketing angle, benefits-focused
- `"Technical Expert"` - Deep technical details, architecture-oriented
- Any custom string will be passed to the synthesizer for interpretation

**Language Options (tested values):**
- `"English"`
- `"Spanish"`
- `"French"` 
- Any ISO 639-1 language code will be attempted

### Real-World Examples

**Example 1: Basic Query (first request)**
```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the maximum RAM supported by the PowerEdge R760?"
  }'
```

**Response:**
```json
{
  "status": "success",
  "answer": "The PowerEdge R760 supports up to 6TB of DRAM [Source: poweredge-r760-spec-sheet.pdf, Page: 3], making it suitable for memory-intensive workloads such as database servers and analytics.",
  "sources": [
    {
      "source": "poweredge-r760-spec-sheet.pdf",
      "page": 3,
      "preview": "The PowerEdge R760 is a 2-socket 2U server that supports up to 6TB of DRAM..."
    }
  ],
  "thread_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example 2: Multi-turn Conversation (reusing thread_id)**
```bash
# First request establishes thread
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about PowerEdge R760 specifications"
  }'

# Response contains thread_id (captured as $THREAD_ID)

# Second request reuses thread for context continuity
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What about storage capacity?",
    "thread_id": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Response to second request:**
```json
{
  "status": "success",
  "answer": "The PowerEdge R760 supports up to 24 NVMe direct-attached storage drives [Source: poweredge-r760-spec-sheet.pdf, Page: 5], providing substantial capacity for high-performance storage requirements. Combined with the 6TB memory we discussed earlier, this makes it ideal for demanding enterprise workloads.",
  "sources": [
    {
      "source": "poweredge-r760-spec-sheet.pdf",
      "page": 5,
      "preview": "Storage: Up to 24 x 2.5-inch NVMe SSD drives..."
    }
  ],
  "thread_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Example 3: Persona Adaptation (Salesperson)**
```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the benefits of the PowerEdge R760?",
    "persona": "Enthusiastic Tech Salesperson"
  }'
```

**Response:**
```json
{
  "status": "success",
  "answer": "The PowerEdge R760 is an outstanding choice for enterprise data centers! It delivers exceptional performance with dual 3rd Gen Intel Xeon Scalable processors [Source: poweredge-r760-spec-sheet.pdf, Page: 2] and industry-leading reliability. With support for up to 6TB of DRAM and 24 NVMe drives [Source: poweredge-r760-spec-sheet.pdf, Page: 3], you get unmatched flexibility for any mission-critical application. Your customers will appreciate the energy-efficient design and outstanding ROI!",
  "sources": [
    {
      "source": "poweredge-r760-spec-sheet.pdf",
      "page": 2,
      "preview": "Processors: Dual Intel Xeon Scalable 3rd Gen..."
    },
    {
      "source": "poweredge-r760-spec-sheet.pdf",
      "page": 3,
      "preview": "Memory: Up to 6TB DRAM..."
    }
  ],
  "thread_id": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Example 4: Conflict Resolution in Action**
When documents have contradictory information, the system detects and resolves:

```json
{
  "status": "success",
  "answer": "According to the latest specification document from March 2024 [Source: poweredge-r760-spec-sheet-updated.pdf, Page: 2], the PowerEdge R760 maximum RAM is 6TB. Note: An older document listed 4TB, but this specification has been superseded by the current version.",
  "sources": [
    {
      "source": "poweredge-r760-spec-sheet-updated.pdf",
      "page": 2,
      "preview": "Latest (2024): Maximum RAM: 6TB..."
    },
    {
      "source": "poweredge-r760-spec-sheet-archive.pdf",
      "page": 1,
      "preview": "Archive (2023): Maximum RAM: 4TB..."
    }
  ],
  "thread_id": "550e8400-e29b-41d4-a716-446655440002",
  "conflict_resolution_notes": "CONFLICT DETECTED: Maximum RAM specifications differ between documents. Document from 2024-03-31 (timestamp: 1711929600) specifies 6TB. Document from 2023-12-15 (timestamp: 1702598400) specifies 4TB. RESOLUTION: Use 6TB specification from the latest document."
}
```

**Example 5: Evaluator Self-Correction**
```json
{
  "status": "success",
  "answer": "The PowerEdge R760 supports up to 6TB of DRAM [Source: poweredge-r760-spec-sheet.pdf, Page: 3]. The system initially suggested 8TB but corrected this based on the source documents.",
  "sources": [
    {
      "source": "poweredge-r760-spec-sheet.pdf",
      "page": 3,
      "preview": "Memory: Up to 6TB DRAM..."
    }
  ],
  "thread_id": "550e8400-e29b-41d4-a716-446655440003",
  "evaluation_feedback": "First synthesis claimed 8TB RAM (initial error), corrected to 6TB on second pass using source validation."
}
```

**Example 6: Language Translation (Spanish)**
```bash
curl -X POST http://localhost:8000/api/v1/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the maximum RAM supported by the PowerEdge R760?",
    "language": "Spanish"
  }'
```

**Response:**
```json
{
  "status": "success",
  "answer": "El PowerEdge R760 admite hasta 6TB de DRAM [Source: poweredge-r760-spec-sheet.pdf, Page: 3], lo que lo hace adecuado para cargas de trabajo que requieren mucha memoria como servidores de base de datos y análisis.",
  "sources": [
    {
      "source": "poweredge-r760-spec-sheet.pdf",
      "page": 3,
      "preview": "The PowerEdge R760 is a 2-socket 2U server that supports up to 6TB of DRAM..."
    }
  ],
  "thread_id": "550e8400-e29b-41d4-a716-446655440004"
}
```

### Response Status Codes

| Code | Status Field | Meaning | Action |
|------|------|---------|--------|
| 200 | `"success"` | Query processed, documents retrieved and synthesized | Display answer and sources normally |
| 200 | `"partial_success"` | Query processed but no documents retrieved | Display message about insufficient knowledge base data |
| 400 | N/A | Bad request (invalid JSON, missing required field `query`) | Validate request payload |
| 500 | N/A | Server error (LLM timeout, Pinecone connectivity, embedding error) | Retry with exponential backoff |

**400 Bad Request Example:**
```json
{
  "detail": "Query processing failed: QueryRequest.query field is required"
}
```

**500 Server Error Example:**
```json
{
  "detail": "Query processing failed: Groq API timeout after 30 seconds"
}
```

### Response Field Details

**`status`** ─ String
- `"success"`: Full query-answer-sources cycle completed with retrieved documents
- `"partial_success"`: Query processed but no relevant documents found; generic fallback message returned

**`answer`** ─ String
- The synthesized answer text with inline citations
- Citations are formatted as: `[Source: filename.pdf, Page: X]`
- If documents empty: `"I cannot find sufficient information in the provided knowledge base to answer this query."`
- Max length: ~2000 characters (Groq context dependent)

**`sources`** ─ Array of Objects
```python
[
  {
    "source": "poweredge-r760-spec-sheet.pdf",
    "page": 3,
    "preview": "First 500 characters of the chunk used..."
  }
]
```
- Contains only documents that were actually cited in the answer
- Deduplicated by filename + page (no duplicates in response)
- Ordered by relevance score (top retrieved first)

**`thread_id`** ─ String (UUID)
- Echoed back to client
- Client must persist and resend on subsequent messages for conversation continuity
- Format: RFC4122 UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)

**`evaluation_feedback`** ─ String (Optional)
- Present only if evaluator detected hallucinations in first synthesis pass
- Contains explanation of what was corrected
- Example: `"Initial answer claimed X, corrected to Y based on source documents"`
- If empty or missing: No correction was needed; first synthesis passed validation

**`conflict_resolution_notes`** ─ String (Optional)
- Present only if Conflict Manager detected contradictions
- Value: `"No conflicts detected."` if checked but none found
- Value: Detailed resolution instructions if conflicts found
- Example: `"CONFLICT DETECTED: Document A (2024) says 6TB, Document B (2023) says 4TB. Using 6TB from latest."`

### Conversation Persistence (MemorySaver)

**Mechanism:**
The LangGraph `MemorySaver` checkpointer stores conversation state keyed by `thread_id`:

1. **First Request (no thread_id):**
   - Backend generates UUID
   - State stored with empty `messages` list
   - GraphResult returned with new `thread_id`

2. **Subsequent Requests (with thread_id):**
   - MemorySaver loads previous messages for that `thread_id`
   - New user query appended to `messages` list
   - Entire conversation history available to all agents
   - Allows synthesizer to reference previous context

**Example conversation flow:**
```
Request 1: {"query": "Tell me about R760", "thread_id": auto}
Response 1: {"answer": "...", "thread_id": "abc-123"}

Request 2: {"query": "How much RAM?", "thread_id": "abc-123"}
# Agents now see: ["Tell me about R760", "...", "How much RAM?"]
```

---

## 2. POST /api/v1/ingest

**Purpose:** Upload PDF documents to the vector database. Handles file validation, chunking, embedding, and Pinecone upsert in a single request.

**Implementation:** [backend/main.py](backend/main.py) → calls [backend/ingest.py](backend/ingest.py) `ingest_from_files()`

**URL:** `http://localhost:8000/api/v1/ingest`

### Request Format

**Content-Type:** `multipart/form-data`

**Body:**
- Multiple files with key name `files`
- Only `.pdf` files accepted (other formats logged as errors but don't block ingestion)

### Real-World Examples

**Example 1: Single PDF Upload**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "files=@poweredge-r760-spec-sheet.pdf"
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully ingested 324 vectors",
  "vectors_upserted": 324,
  "documents_processed": 1,
  "errors": null
}
```

**Example 2: Multiple PDFs (Batch Upload)**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "files=@dell-apex-subscription-solution-brief.pdf" \
  -F "files=@poweredge-r760-spec-sheet.pdf" \
  -F "files=@storage-solution-datasheet.pdf"
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully ingested 1247 vectors",
  "vectors_upserted": 1247,
  "documents_processed": 3,
  "errors": null
}
```

**Example 3: Mixed File Types (PDFs + non-PDFs)**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "files=@document.pdf" \
  -F "files=@image.png" \
  -F "files=@spreadsheet.xlsx"
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully ingested 318 vectors",
  "vectors_upserted": 318,
  "documents_processed": 1,
  "errors": [
    "Skipped image.png: only PDF files are supported",
    "Skipped spreadsheet.xlsx: only PDF files are supported"
  ]
}
```

**Example 4: Partial Failure (Some PDFs Fail)**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "files=@valid-document.pdf" \
  -F "files=@corrupted.pdf" \
  -F "files=@another-valid.pdf"
```

**Response:**
```json
{
  "status": "success",
  "message": "Successfully ingested 512 vectors",
  "vectors_upserted": 512,
  "documents_processed": 2,
  "errors": [
    "Error loading corrupted.pdf: PDF file is corrupted or encrypted"
  ]
}
```

**Example 5: No Valid PDFs**
```bash
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "files=@image.jpg" \
  -F "files=@video.mp4"
```

**Response:**
```json
{
  "status": "failed",
  "message": "No valid PDF files to ingest",
  "vectors_upserted": 0,
  "documents_processed": 0,
  "errors": [
    "Skipped image.jpg: only PDF files are supported",
    "Skipped video.mp4: only PDF files are supported"
  ]
}
```

**Example 6: JavaScript/Fetch Example (Frontend)**
```javascript
async function uploadDocuments(files) {
  const formData = new FormData();
  files.forEach(file => formData.append('files', file));

  const response = await fetch('http://localhost:8000/api/v1/ingest', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  
  if (response.status === 200 && result.status === 'success') {
    console.log(`✓ Ingested ${result.vectors_upserted} vectors from ${result.documents_processed} document(s)`);
    
    if (result.errors && result.errors.length > 0) {
      console.warn('Warnings:', result.errors);
    }
  } else {
    console.error('Ingestion failed:', result.message);
  }
  
  return result;
}
```

### Response Status Codes

| Code | Status Field | Meaning |
|------|------|---------|
| 200 | `"success"` | At least one PDF ingested successfully |
| 200 | `"failed"` | No valid PDFs processed; check errors array |
| 400 | N/A | No files provided in request |
| 500 | N/A | Server error (Pinecone unreachable, embedding model failure) |

### Response Field Details

**`status`** ─ String
- `"success"`: At least one vector was successfully upserted to Pinecone
- `"failed"`: No vectors were upserted (all files failed validation or parsing)

**`message`** ─ String
- Success: `"Successfully ingested {N} vectors"`
- Failed: `"No valid PDF files to ingest"` or `"Failed to ingest documents: {error detail}"`

**`vectors_upserted`** ─ Integer
- Number of vector embeddings successfully written to Pinecone
- Example: A 20-page PDF chunked into ~50 chunks = 50 vectors

**`documents_processed`** ─ Integer
- Count of successfully parsed PDFs (not total files sent)
- Example: If 3 PDFs sent and 1 is corrupted, this is 2

**`errors`** ─ Array of Strings or null
- Null if no errors occurred
- Lists file-level errors (e.g., file format, parsing errors)
- Does NOT include generic Pinecone connection errors (those cause 500)

### Ingestion Processing Details

**Chunking Strategy:**
```python
RecursiveCharacterTextSplitter(
    chunk_size=1000,           # ~250-300 tokens per chunk
    chunk_overlap=200,         # 20% overlap for context continuity
    separators=["\n\n", "\n", ".", " ", ""]  # Respect document structure
)
```

**Metadata Assigned to Each Vector:**
```json
{
  "source": "poweredge-r760-spec-sheet.pdf",
  "page_number": 3,
  "category": "Technical",
  "timestamp": 1711929600,
  "text": "The PowerEdge R760 is a 2-socket 2U server..."
}
```

**Categorization Algorithm:**
  Keywords scored in filename:
  - Technical: "spec", "architecture", "hardware", "api", "interface", etc.
  - Commercial: "pricing", "license", "sla", "benefits", "roi", etc.
  - Support: "troubleshoot", "faq", "install", "guide", "runbook", etc.
  - Returns highest-scoring category or "General"

**Vector Upsert Batching:**
- Vectors sent to Pinecone in batches of 100
- Each batch typically completes in 1-2 seconds
- Large uploads (500+ docs) may take 30+ seconds total

**Chunk ID Format:**
```
chunk_{unix_timestamp}_{chunk_index}
Example: chunk_1711929600_42
```
Timestamp-based IDs allow re-ingestion of updated documents without ID collisions.

