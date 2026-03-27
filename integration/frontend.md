**Integration Guide — Frontend**

This document explains what the frontend must send to each endpoint and what to expect back. It also maps UI components to the backend files to check when debugging.

Primary endpoint: `POST /api/v1/query` (see [backend/main.py](backend/main.py)).

Request requirements (what frontend must send)
- `query` (string): user natural language question. Required.
- `persona` (string): optional; controls tone/format of the answer (e.g., "Enthusiastic Tech Salesperson"). If omitted, backend defaults to a neutral persona.
- `language` (string): optional target language (e.g., "English", "Spanish").
- `thread_id` (string): optional for the first request. If not provided, the backend will generate and return a `thread_id`. The frontend must persist the returned `thread_id` and send it on subsequent requests for the same conversation to enable MemorySaver.

Example fetch call (frontend)

```
const payload = { query, persona: "Standard User", language: "English", thread_id };
const res = await fetch('/api/v1/query', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
const json = await res.json();
```

Response (what frontend receives and should display)
- `status`: success or partial_success
- `answer`: the synthesized text. May contain inline citation markers like `[Source: poweredge-r760-spec-sheet.pdf, Page: 3]`.
- `sources`: array of objects with `{ source, page, preview }`. Render these as clickable/source cards for transparency.
- `thread_id`: save/update local conversation mapping.
- `evaluation_feedback`: optional string; if present, show a short notice that the system re-evaluated or corrected itself.
- `conflict_resolution_notes`: optional; if present and not equal to "No conflicts detected.", display a highlighted notice (e.g., "Conflict detected — using latest doc from X dated Y").

Frontend UI mapping (where to check code)
- Conversation page: [frontend/src/pages/RagDashboard.jsx](frontend/src/pages/RagDashboard.jsx)
  - Responsibilities: collect user input, send requests, maintain `thread_id`, display the `answer` and `sources`.
- Agent trace / debug panel: [frontend/src/components/AgentTrace.jsx](frontend/src/components/AgentTrace.jsx)
  - Responsibilities: display intermediate information (optional): planner HyDE, retrieved doc IDs, conflict notes, and evaluator feedback for debugging during demos.
- State management: [frontend/src/store/useAgentStore.js](frontend/src/store/useAgentStore.js)
  - Responsibilities: persist `thread_id`, conversation history, and UI state (e.g., loading, errors).

UI suggestions for better UX
- Show a small badge when `conflict_resolution_notes` is present (e.g., "Conflict resolved — using latest doc") and provide a collapsible view showing the raw `conflict_resolution_notes` text.
- Render `sources` as a list with preview, page, and a button to open/download the original PDF (serve PDFs via a static route or host them on a secure file store).
- Show evaluator indicators: a green check when `evaluation_feedback` is empty or "pass", and a warning icon with an explanation when the system had to re-evaluate.

Error handling & retries
- On 500 errors: show a friendly message and allow the user to retry.
- On network timeouts: show a spinner and an option to cancel.

Debugging tips
- If the frontend shows empty `sources`, check retrieval in [backend/graph.py](backend/graph.py) `retriever_node` and confirm Pinecone index health.
- If answers are inconsistent across requests, verify the `thread_id` is correctly persisted in [frontend/src/store/useAgentStore.js](frontend/src/store/useAgentStore.js).

---

## Document Upload (Admin/Ingestion UI)

The frontend should provide a document upload interface to allow admins or users to ingest new PDFs without restarting the backend.

**Upload endpoint:** `POST /api/v1/ingest` (see [backend/main.py](backend/main.py))

Request (what frontend sends)
- Multipart form data with one or more PDF files attached as `files` field.
- No additional metadata required from the frontend.

Response (what frontend receives)
- `status`: "success" or "failed"
- `message`: descriptive string
- `vectors_upserted`: integer count
- `documents_processed`: integer count of successfully processed PDFs
- `errors`: array of error strings (if any files failed to process)

Frontend UI suggestions
- Show a file input with `accept=".pdf"` and `multiple` to allow batch uploads.
- Display a progress indicator while uploading (use `UploadProgress` event if large files).
- Show results after upload: number of vectors ingested, any warnings/errors from the errors array.
- If a user tries to upload a non-PDF, show a friendly error message.
- Add a "recent documents" list showing recently uploaded PDFs with their ingestion date and vector count.

Example upload component (React):

```jsx
import { useState } from 'react';

export function DocumentUpload() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ingest', {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      setResult(json);
    } catch (err) {
      setResult({ status: 'failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept=".pdf"
        multiple
        onChange={(e) => setFiles(Array.from(e.target.files))}
      />
      <button onClick={handleUpload} disabled={!files.length || loading}>
        {loading ? 'Uploading...' : 'Upload'}
      </button>
      {result && (
        <div>
          <p>{result.message}</p>
          {result.vectors_upserted > 0 && (
            <p>✓ Ingested {result.vectors_upserted} vectors from {result.documents_processed} document(s)</p>
          )}
          {result.errors?.length > 0 && (
            <div>
              <p>Warnings:</p>
              <ul>
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

Placement in UI
- Consider adding an "Admin" or "Settings" page with a document management panel.
- Alternatively, add an "Upload" button in the RAG Dashboard sidebar for quick ingestion.
- Ensure only authorized users can access this endpoint (add auth check in the future).
