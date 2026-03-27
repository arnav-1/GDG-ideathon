# Integration Frontend

This document describes the frontend implementation: how to interact with the `/api/v1/query` and `/api/v1/ingest` endpoints, component responsibilities, state management, and UI patterns.

## Overview: Frontend Architecture

```
┌─────────────────────────────────────────┐
│  Browser                                │
│  ┌────────────────────────────────────┐ │
│  │ RagDashboard (Main Page)           │ │
│  │ - Query input form                 │ │
│  │ - Conversation display             │ │
│  │ - Sources panel                    │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │ AgentTrace (Debug Panel)           │ │
│  │ - HyDE document                    │ │
│  │ - Retrieved docs                   │ │
│  │ - Conflict notes                   │ │
│  │ - Evaluator feedback               │ │
│  └────────────────────────────────────┘ │
└────────────────────────────────────────│─┘
      │ useAgentStore (Zustand)           │
      │ ├─ thread_id                      │
      │ ├─ conversation history           │
      │ └─ loading states                 │
      │                                   │
      │ HTTP/JSON                         │
      ▼                                   │
┌─────────────────────────────────────────┐
│  Backend                                │
│  /api/v1/query                          │
│  /api/v1/ingest                         │
└─────────────────────────────────────────┘
```

## 1. Query Endpoint Integration

### Component: RagDashboard (`frontend/src/pages/RagDashboard.jsx`)

**Responsibilities:**
- Render query input form and conversation UI
- Maintain `thread_id` state across requests
- Display synthesized answers with inline citations
- Render sources as informational cards
- Show evaluation/conflict badges

**Typical Component Structure:**
```javascript
import { useState, useEffect } from 'react';
import { useAgentStore } from '../store/useAgentStore';

export function RagDashboard() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Pull thread_id from Zustand store
  const { threadId, setThreadId, addMessage } = useAgentStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        query: input,
        persona: "Standard User",      // or from user selection
        language: "English",            // or from user selection
        thread_id: threadId || undefined
      };
      
      const response = await fetch('/api/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error('Query failed');
      }
      
      const data = await response.json();
      
      // First request: capture returned thread_id
      if (!threadId) {
        setThreadId(data.thread_id);
      }
      
      // Add to conversation history
      addMessage({ role: 'user', content: input });
      addMessage({ role: 'assistant', content: data.answer });
      
      setInput('');
      
    } catch (err) {
      console.error('Error:', err);
      // Show error UI
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about enterprise solutions..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Thinking...' : 'Ask'}
        </button>
      </form>
      
      {/* Render conversation */}
      {/* Render sources */}
    </div>
  );
}
```

### Handling Response Fields

**Answer Rendering:**
```javascript
// Response contains inline citations: [Source: file.pdf, Page: X]
// Parse and format for display

const formatAnswer = (answer) => {
  return answer.split(/(\[Source:.*?\])/).map((part, i) => 
    part.match(/\[Source:/) ? 
      <Citation key={i} text={part} /> : 
      part
  );
};
```

**Source Cards:**
```javascript
// Response.sources is array: [{source, page, preview}, ...]

const SourceCard = ({ source, page, preview }) => (
  <div className="source-card">
    <h4>{source}</h4>
    <p className="page">Page {page}</p>
    <p className="preview">{preview}</p>
  </div>
);
```

**Conflict Resolution Badge:**
```javascript
// If response.conflict_resolution_notes != "No conflicts detected."
// Show highlighted warning

const ConflictNotice = ({ notes }) => {
  if (notes === "No conflicts detected.") return null;
  
  return (
    <div className="conflict-notice">
      ⚠️ Conflict Detected & Resolved
      <details>
        <summary>Details</summary>
        <pre>{notes}</pre>
      </details>
    </div>
  );
};
```

**Evaluator Feedback Badge:**
```javascript
// If response.evaluation_feedback is present
// Show that system self-corrected

const EvaluationBadge = ({ feedback }) => {
  if (!feedback) return null;
  
  return (
    <div className="evaluation-badge">
      ℹ️ System re-evaluated and corrected itself
      <details>
        <summary>What was corrected?</summary>
        <p>{feedback}</p>
      </details>
    </div>
  );
};
```

### State Management: Zustand Store (`frontend/src/store/useAgentStore.js`)

**Store Schema:**
```javascript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAgentStore = create(
  persist(
    (set, get) => ({
      threadId: null,
      conversation: [],        // [{ role: 'user'|'assistant', content: str }, ...]
      loading: false,
      error: null,
      
      setThreadId: (id) => set({ threadId: id }),
      addMessage: (msg) => set(state => ({
        conversation: [...state.conversation, msg]
      })),
      clearConversation: () => set({ 
        conversation: [], 
        threadId: null 
      }),
      setError: (err) => set({ error: err }),
    }),
    {
      name: 'agent-store',  // localStorage key
      partialize: (state) => ({
        threadId: state.threadId,
        conversation: state.conversation
      })
    }
  )
);
```

**How It Works:**
- `thread_id` persisted to localStorage on first request
- Subsequent page refreshes: Load `thread_id` from localStorage
- Send saved `thread_id` with next query for conversation continuity
- Backend's MemorySaver loads previous messages using this ID

---

## 2. Document Upload Endpoint Integration

### Component: DocumentUpload (Upload Page or Modal)

**Typical Implementation:**
```javascript
import { useState } from 'react';

export function DocumentUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  
  const handleFileChange = (e) => {
    // Filter to only .pdf files
    const pdfFiles = Array.from(e.target.files).filter(f =>
      f.type === 'application/pdf' || f.name.endsWith('.pdf')
    );
    setFiles(pdfFiles);
  };
  
  const handleUpload = async () => {
    if (!files.length) {
      setError('No files selected');
      return;
    }
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    
    setUploading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/v1/ingest', {
        method: 'POST',
        body: formData
        // Note: Do NOT set 'Content-Type' header;
        // browser auto-sets it with boundary for multipart/form-data
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      
      if (data.status === 'success') {
        // Show success message
        console.log(`✓ Ingested ${data.vectors_upserted} vectors`);
        
        // Clear file input
        setFiles([]);
        
        // Show warnings if any
        if (data.errors?.length) {
          console.warn('Warnings:', data.errors);
        }
      } else {
        setError(data.message || 'Upload failed');
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };
  
  return (
    <div className="upload-container">
      <h2>Upload Documents</h2>
      
      <input
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
      />
      
      {files.length > 0 && (
        <div className="files-list">
          <h3>Selected ({files.length}):</h3>
          <ul>
            {files.map(f => <li key={f.name}>{f.name}</li>)}
          </ul>
        </div>
      )}
      
      <button
        onClick={handleUpload}
        disabled={!files.length || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {result && (
        <div className="result">
          <p className={result.status === 'success' ? 'success' : 'failed'}>
            {result.message}
          </p>
          
          {result.vectors_upserted > 0 && (
            <p className="success">
              ✓ Ingested {result.vectors_upserted} vectors from {result.documents_processed} document(s)
            </p>
          )}
          
          {result.errors?.length > 0 && (
            <div className="warnings">
              <h4>Warnings:</h4>
              <ul>
                {result.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

**Key Implementation Notes:**
- Use `<input accept=".pdf" multiple />` for file selection
- Create `FormData()` and append files with key name `files`
- Do NOT manually set `Content-Type` header (browser auto-handles for multipart)
- Handle both success and partial-success responses
- Display errors array to user for transparency

---

## 3. Debug Panel: AgentTrace Component

**Purpose:** Display intermediate agent execution data for debugging and demo purposes.

```javascript
import { useAgentStore } from '../store/useAgentStore';

export function AgentTrace() {
  const [visible, setVisible] = useState(false);
  const agentData = useAgentStore(state => state.agentData);
  
  if (!visible) {
    return <button onClick={() => setVisible(true)}>Show Trace</button>;
  }
  
  return (
    <div className="agent-trace-panel">
      <button onClick={() => setVisible(false)}>Hide Trace</button>
      
      {agentData?.hypothetical_document && (
        <section>
          <h3>HyDE Document (Planner)</h3>
          <pre>{agentData.hypothetical_document}</pre>
        </section>
      )}
      
      {agentData?.retrieved_docs && (
        <section>
          <h3>Retrieved Documents ({agentData.retrieved_docs.length})</h3>
          {agentData.retrieved_docs.map((doc, i) => (
            <div key={i} className="doc-item">
              <p><strong>{doc.source}</strong> (Page {doc.page})</p>
              <p className="score">Score: {doc.score?.toFixed(3)}</p>
              <p className="preview">{doc.text}</p>
            </div>
          ))}
        </section>
      )}
      
      {agentData?.conflict_resolution_notes && 
       agentData.conflict_resolution_notes !== "No conflicts detected." && (
        <section>
          <h3>⚠️ Conflict Manager Output</h3>
          <pre>{agentData.conflict_resolution_notes}</pre>
        </section>
      )}
      
      {agentData?.evaluation_feedback && (
        <section>
          <h3>ℹ️ Evaluator Feedback (Self-Correction)</h3>
          <p>{agentData.evaluation_feedback}</p>
        </section>
      )}
    </div>
  );
}
```

**Note:** To expose agent data, update backend response to include optional `agent_data` field with intermediate results.

---

## 4. Error Handling Patterns

### Network/Connection Errors
```javascript
const handleQuery = async () => {
  try {
    const response = await fetch('/api/v1/query', { ... });
    
    if (response.status === 500) {
      // Retry with exponential backoff
      await retry(async () => fetch(...), {
        maxRetries: 3,
        backoff: 'exponential',
        initialDelayMs: 1000
      });
    }
  } catch (err) {
    setError('Network error. Please check your connection and try again.');
  }
};
```

### Missing Required Fields
```javascript
const validateQuery = (query) => {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty');
  }
  if (query.length > 10000) {
    throw new Error('Query too long (max 10000 characters)');
  }
};
```

### Handling Partial Failures
```javascript
const result = await fetch('/api/v1/query');
const data = await result.json();

if (data.status === 'partial_success') {
  // No documents retrieved
  showWarning('Could not find relevant documents. Try rephrasing your question.');
} else if (data.status === 'success') {
  // Normal success
}
```

---

## 5. CSS/UI Patterns

### Query Input Form
```css
.query-form {
  display: flex;
  gap: 10px;
}

.query-input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
}

.query-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.submit-btn {
  padding: 12px 24px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:disabled {
  background-color: #ccc;
}
```

### Source Cards
```css
.source-card {
  border-left: 4px solid #007bff;
  padding: 12px;
  margin: 8px 0;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.source-card h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.source-card .page {
  color: #666;
  font-size: 12px;
}

.source-card .preview {
  color: #444;
  font-size: 12px;
  margin-top: 4px;
}
```

### Badges
```css
.conflict-notice,
.evaluation-badge {
  padding: 12px;
  margin: 12px 0;
  border-radius: 4px;
  font-size: 14px;
}

.conflict-notice {
  background-color: #fff3cd;
  border: 1px solid #ffc107;
  color: #856404;
}

.evaluation-badge {
  background-color: #d1ecf1;
  border: 1px solid #17a2b8;
  color: #0c5460;
}

details > summary {
  cursor: pointer;
  font-weight: bold;
}

details > * {
  margin-top: 8px;
}
```

---

## 6. Complete Integration Checklist

**Implementation:**
- [ ] Create `RagDashboard.jsx` with query form and conversation display
- [ ] Implement `DocumentUpload.jsx` for ingestion UI
- [ ] Create Zustand store (`useAgentStore.js`) with thread_id persistence
- [ ] Add `AgentTrace.jsx` debug panel (optional, for demos)
- [ ] Implement error handling with user-friendly messages
- [ ] Style components with proper visual feedback for loading/error states

**Functionality:**
- [ ] Query submission sends correct payload structure
- [ ] Thread IDs persist across page refreshes (localStorage)
- [ ] Multi-turn conversations work (backend MemorySaver receives thread_id)
- [ ] Sources display with page numbers and previews
- [ ] Inline citations render correctly
- [ ] Conflict badges display when conflicts detected
- [ ] Evaluation feedback shows when system self-corrects
- [ ] File upload sends multipart/form-data correctly
- [ ] Upload response properly displays vector count and errors

**User Experience:**
- [ ] Loading indicators during query processing
- [ ] Disable inputs during loading
- [ ] Clear error messages
- [ ] Success confirmations
- [ ] Responsive design for mobile/tablet
