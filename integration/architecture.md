**Integration Guide — Architecture**

Purpose: Provide a concise reference of the backend + frontend architecture so new developers or hackathon judges can understand components, responsibilities, and where to look in the codebase.

Components
- **API (FastAPI)**: Exposes the public REST endpoint(s) used by the frontend. See [backend/main.py](backend/main.py).
- **Agent Graph (LangGraph)**: Multi-agent orchestration (Planner, Retriever, Conflict Manager, Synthesizer, Evaluator). See [backend/graph.py](backend/graph.py).
- **Vector Store (Pinecone)**: Stores embeddings and metadata for document retrieval. Index name and keys configured via `.env` in the backend folder.
- **Embeddings (HuggingFace)**: `sentence-transformers/all-MiniLM-L6-v2` used to encode chunks. See [backend/ingest.py](backend/ingest.py).
- **LLM Provider (Groq)**: Used for HyDE, query expansion, synthesis, evaluation, and conflict resolution. Models configured in `graph.py`.
- **Document Ingest Pipeline**: `ingest.py` handles PDF parsing, chunking, metadata enrichment, and upserting to Pinecone. See [backend/ingest.py](backend/ingest.py).
- **Frontend (Vite + React)**: UI components and pages live in the `frontend/` folder. Key files: [frontend/src/pages/RagDashboard.jsx](frontend/src/pages/RagDashboard.jsx), [frontend/src/components/AgentTrace.jsx](frontend/src/components/AgentTrace.jsx), [frontend/src/store/useAgentStore.js](frontend/src/store/useAgentStore.js).

Data Flow (high-level)
1. Document ingestion (offline or admin-triggered): PDFs → `ingest.py` → embeddings → Pinecone index.
2. User query via frontend → `POST /api/v1/query` on FastAPI backend.
3. Backend builds an `AgentState` and executes the LangGraph `app_graph`:
   - Planner: HyDE + query expansion
   - Retriever: hybrid semantic + BM25 retrieval
   - Conflict Manager: detect and prioritize by timestamp
   - Synthesizer: generate final answer with citations
   - Evaluator: validate and, if needed, loop back to Synthesizer
4. Final JSON response returned to frontend with `answer`, `sources`, `thread_id`, and any `evaluation_feedback` or `conflict_resolution_notes`.

Important environment variables
- Copy `.env.example` to `.env` in the `backend/` folder and fill keys:
  - `GROQ_API_KEY` — Groq API key
  - `PINECONE_API_KEY` — Pinecone API key
  - `PINECONE_INDEX_NAME` — index name (e.g., `gdghackathon`)
  - `EMBEDDING_MODEL_NAME` — e.g., `sentence-transformers/all-MiniLM-L6-v2`

Files of interest (entry points)
- Backend API: [backend/main.py](backend/main.py)
- Agent graph & nodes: [backend/graph.py](backend/graph.py)
- Ingest pipeline: [backend/ingest.py](backend/ingest.py)
- Frontend dashboard: [frontend/src/pages/RagDashboard.jsx](frontend/src/pages/RagDashboard.jsx)

Deployment notes
- Local: run the FastAPI app (`uvicorn main:app --reload`) from the `backend` folder.
- Docker: recommended to dockerize the backend and ensure environment variables are passed securely.
- Pinecone: use a production index and monitor usage to avoid throttling.

Security & production considerations
- Do not commit keys to source control. Use environment variables or secret manager.
- Add rate limiting and authentication for public deployments.
