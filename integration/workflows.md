**Integration Guide — Workflows**

This document breaks down the main workflows: ingestion, query processing, and session management.

1) Ingestion workflow (offline/admin)
- Trigger: Developer or admin runs the ingestion script to add or refresh documents in the vector store.
- Steps:
  1. `ingest.py` loads PDFs from `backend/data/` using PyMuPDFLoader and splits text into chunks (see [backend/ingest.py](backend/ingest.py)).
  2. Each chunk is embedded using the HuggingFace embedding model and enriched with metadata (source filename, page number, timestamp, category).
  3. Chunks + metadata are upserted into Pinecone's index.
  4. Monitor the index size and confirm successful upserts.

2) Query workflow (user-facing, main flow)
- Trigger: Frontend posts a JSON payload to `POST /api/v1/query`.
- Steps (detailed):
  1. `main.py` validates request and creates an initial `AgentState` containing `user_query`, `persona`, `language`, and `thread_id`.
  2. `app_graph` (from [backend/graph.py](backend/graph.py)) executes the following nodes in sequence:
     - **Planner** (`planner_node`): calls Groq to generate a HyDE hypothetical document, extracts a category filter, and returns 2 query variations.
     - **Retriever** (`retriever_node`): runs hybrid retrieval (semantic vector query + BM25 re-ranking) and returns top candidate chunks with metadata.
     - **Conflict Manager** (`conflict_manager_node`): inspects retrieved documents and timestamps to detect contradictions and emits `conflict_resolution_notes` (or "No conflicts detected.").
     - **Synthesizer** (`synthesizer_node`): synthesizes the final answer, injects citations, follows conflict resolution notes (if any), and formats the response for the front end.
     - **Evaluator** (`evaluator_node`): runs hallucination checks and JSON validation. If the evaluation fails, the graph loops back to synthesizer with `evaluation_feedback`.
  3. On successful completion, the graph returns `final_answer`, `sources`, `conflict_resolution_notes` (if present), and `thread_id`.

3) Multi-turn (conversation) workflow
- The frontend must pass `thread_id` with each request to enable MemorySaver to append messages and preserve context. The backend's memory saver uses `thread_id` as the checkpoint key. See [backend/graph.py](backend/graph.py) for `MemorySaver` usage.

4) Error & retry behavior
- LLM timeouts or Pinecone errors should be surfaced as 500-level responses. Implement frontend retries and graceful error messages for users.
- Evaluator-driven self-correction: when `evaluator_node` sets `is_valid` false, the synthesizer is invoked again with `evaluation_feedback` to reduce hallucinations.

5) Observability hooks
- Add structured logging around these key points:
  - ingestion upserts
  - retrieval results (top-k ids and scores)
  - conflict detection count and reasons
  - evaluator pass/fail rates and feedback messages
