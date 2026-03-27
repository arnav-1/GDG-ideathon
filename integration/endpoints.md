**Integration Guide — Endpoints**

This document lists public endpoints, expected request & response payloads, and where to find the implementation.

1) POST /api/v1/query
- Purpose: Main user-facing endpoint. Accepts a conversational query and returns a synthesized answer with inline citations and metadata.
- Implementation: [backend/main.py](backend/main.py)
- Request (JSON):

  {
    "query": "How much RAM does the PowerEdge R760 support?",
    "persona": "Standard User",      // optional
    "language": "English",          // optional
    "thread_id": "<uuid>"           // optional; backend generates one if omitted
  }

- Response (JSON):

  {
    "status": "success",
    "answer": "<synthesized answer with inline citations>",
    "sources": [
      {"source": "poweredge-r760-spec-sheet.pdf", "page": 3, "preview": "..."},
      {"source": "dell-apex-subscription-solution-brief.pdf", "page": 1, "preview": "..."}
    ],
    "thread_id": "<uuid>",
    "evaluation_feedback": "<optional feedback from evaluator>",
    "conflict_resolution_notes": "<optional conflict manager notes>"
  }

- HTTP codes:
  - 200: OK (valid response)
  - 400: Bad request (missing required fields or invalid JSON)
  - 500: Internal server error (LLM or DB errors)

Notes:
- The backend will create a `thread_id` when missing. The frontend should persist and resend the `thread_id` for multi-turn conversations so MemorySaver can attach conversation history.
- `sources` contains the final top-k sources used for synthesis. Each source has `source`, `page` and a short `preview` field.

2) POST /api/v1/ingest
- Purpose: Admin/user-facing endpoint. Accepts one or more PDF files via multipart/form-data and ingests them into Pinecone.
- Implementation: [backend/main.py](backend/main.py) — delegates to [backend/ingest.py](backend/ingest.py) `ingest_from_files()` function.
- Request (multipart/form-data):

  ```
  POST /api/v1/ingest
  Content-Type: multipart/form-data

  file: <binary PDF 1>
  file: <binary PDF 2>
  ...
  ```

- Response (JSON):

  {
    "status": "success",
    "message": "Successfully ingested 150 vectors",
    "vectors_upserted": 150,
    "documents_processed": 2,
    "errors": null
  }

- HTTP codes:
  - 200: OK (ingestion completed, check `status` field)
  - 400: Bad request (no valid PDFs provided)
  - 500: Internal server error (Pinecone or embedding errors)

Notes:
- Only PDF files are accepted; other formats are skipped with warnings in the `errors` array.
- Each upload is assigned a unique timestamp-based chunk ID to prevent collisions.
- Large file uploads may take time; consider implementing a progress bar on the frontend or async job tracking for future versions.
- Files are temporarily stored, processed, and then cleaned up automatically.

Example curl command:

```
curl -X POST http://localhost:8000/api/v1/ingest \
  -F "files=@document1.pdf" \
  -F "files=@document2.pdf"
```

Example frontend fetch:

```javascript
const formData = new FormData();
formData.append('files', file1);
formData.append('files', file2);

const res = await fetch('/api/v1/ingest', {
  method: 'POST',
  body: formData
});
const json = await res.json();
console.log(`Ingested ${json.vectors_upserted} vectors`);
```

3) Ingest (CLI / script)
- Purpose: The ingestion flow is currently implemented as a script rather than an exposed API. Use `backend/ingest.py` to process PDF documents and upsert vectors to Pinecone.
- Implementation: [backend/ingest.py](backend/ingest.py)
- Typical usage (run from `backend` folder):

```
python ingest.py --dir ./data
```

