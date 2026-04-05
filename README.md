# 🚀 Smart Knowledge Navigator (SKN)
### **Production-Grade Multi-Agent RAG Orchestration Engine**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/frontend-React%2019-61dafb.svg)](https://reactjs.org/)
[![AI-Powered](https://img.shields.io/badge/AI-Agentic%20RAG-orange.svg)]()

---

##  Project Essence
The **Smart Knowledge Navigator (SKN)** is an advanced **Agentic Retrieval-Augmented Generation (RAG)** platform designed to transform static documentation into a dynamic, verified intelligence layer. Unlike traditional RAG systems that follow a linear "Retrieve → Generate" path, SKN employs **Stateful Multi-Agent Orchestration** to simulate expert reasoning—decomposing complex queries, reconciling conflicting data, and self-correcting outputs for maximum precision.

---

##  Novelty & Core Capabilities

SKN addresses common failure modes in standard AI retrieval by introducing:

*   **Recursive Self-Correction Loop:** A dedicated "Evaluator Agent" audits the generated response against retrieved sources. If citations are missing or logic is inconsistent, the graph loops back for re-synthesis until a high-confidence threshold is met.
*   **Intelligent Conflict Resolution:** Built-in logic to handle temporal or factual contradictions (e.g., comparing older spec sheets with current updates) by prioritizing the most recent verified information.
*   **Persona-Driven Synthesis:** The engine adapts its depth and focus (Technical, Commercial, or Support) via a dynamic **Persona Selector**, ensuring output is tailored to the specific stakeholder's needs.
*   **Reasoning Transparency:** Full "Chain of Thought" (CoT) visibility. Users can monitor the **Agent Trace** panel to see exactly how the Planner, Retriever, and Synthesizer collaborated to reach an answer.

---

##  The Tech Stack

### **Backend: Multi-Agent Orchestration (Python & FastAPI)**
*   **LangGraph:** Manages complex, stateful, and cyclic multi-agent workflows.
*   **Groq LPU™ Inference:** Powers `Llama 3.3-70B` for ultra-fast response times, making agentic loops feel near-instant.
*   **Stateful Memory:** Session persistence via `MemorySaver` checkpointers, enabling multi-turn reasoning and context retention.
*   **Hybrid Retrieval:** Combines **Pinecone Serverless** vector search with **BM25 Keyword Search** to ensure high recall and precision.

### **Frontend: Reactive Interface (React 19 & Vite)**
*   **Zustand:** Lightweight and performant state management for agent telemetry and UI synchronization.
*   **Framer Motion & Tailwind CSS:** A polished, glassmorphic UI designed for readability and fluid interaction.
*   **Asset Visualization:** Includes real-time agent execution traces and interactive persona toggling.

---

##  Technical Architecture
The system follows a strictly decoupled micro-architecture:

1.  **Ingestion Pipeline:** Pre-processes documents into semantic chunks via HuggingFace Embeddings.
2.  **State Graph:** A custom LangGraph workflow:
    - `Planner`: Deconstructs query.
    - `Retriever`: Fetches relevant context.
    - `Conflict Manager`: Handles data inconsistencies.
    - `Synthesizer`: Generates response.
    - `Evaluator`: Self-corrects and verifies citations.
3.  **Real-Time Telemetry:** Websocket-driven updates to the **Agent Trace** panel for live monitoring of the agentic lifecycle.

---

##  Deployment & Installation

### **Prerequisites**
- Python 3.11+
- Node.js 20+
- API Keys: Groq, Pinecone, Supabase.

### **Quick Start**
```powershell
# Backend Setup
cd backend
python -m venv venv
./venv/Scripts/activate
pip install -r requirements.txt
python main.py

# Frontend Setup
cd ../frontend
npm install
npm run dev
```

---

##  Documentation
For deep dives into specific subsystems, see the `integration/` folder:
- [Architecture Details](integration/architecture.md)
- [API Endpoints](integration/endpoints.md)
- [Workflow Logic](integration/workflows.md)

---

**Built for the GDG Hackathon | Driven by Agentic Intelligence**
