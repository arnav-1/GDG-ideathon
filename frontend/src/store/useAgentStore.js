import { create } from 'zustand';

// Real API integration with thread_id management and conversation history
export const useAgentStore = create((set, get) => ({
  status: 'idle', // 'idle' | 'processing' | 'complete' | 'error'
  activeAgent: null,
  threadId: null,
  chatHistory: [],
  language: 'English',
  persona: 'standard', // Add persona field
  query: '',
  result: null,
  error: null,
  apiResponse: null,
  
  setQuery: (query) => set({ query }),
  setLanguage: (language) => set({ language }),
  setPersona: (persona) => set({ persona }),
  
  setThreadId: (threadId) => set({ threadId }),
  
  addMessage: (message) => set((state) => ({
    chatHistory: [...state.chatHistory, message]
  })),
  
  clearHistory: () => set({ chatHistory: [], threadId: null }),
  
  startProcessing: async (userQuery) => {
    const state = get();
    const newChat = [...state.chatHistory, { id: Date.now().toString(), type: 'user', text: userQuery }];
    set({ 
      status: 'processing', 
      query: userQuery, 
      result: null, 
      error: null,
      activeAgent: 'planning',
      chatHistory: newChat
    });

    try {
      // Simulate agent sequence for visualization
      const agentsSequence = ['planning', 'retrieval', 'conflict', 'synthesis', 'verifier'];
      
      for (let i = 0; i < agentsSequence.length; i++) {
        set({ activeAgent: agentsSequence[i] });
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      }
      
      // Call actual backend API
      const payload = {
        query: userQuery,
        persona: state.persona,
        language: state.language,
        thread_id: state.threadId || undefined
      };
      
      const response = await fetch('/api/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        timeout: 30000
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store thread_id on first response
      if (!state.threadId) {
        set({ threadId: data.thread_id });
      }
      
      // Create AI message for chat history with thinking support
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        type: 'agent',
        text: data.answer,
        thinking: data.thinking || '', // Store thinking separately
        evaluation: data.evaluation || '', // Store evaluation separately
        confidence: data.confidence || '95%',
        time: data.time || '3.2s',
        citations: (data.sources || []).map((source, idx) => ({
          id: `${idx + 1}`,
          title: source.title || 'Unknown Source',
          file: source.title || 'document',
          details: `Page ${source.page || 'N/A'}`
        }))
      };
      
      // Set success result and update chat history
      set((s) => ({ 
        status: 'complete', 
        activeAgent: null,
        result: aiMessage,
        chatHistory: [...s.chatHistory, aiMessage],
        apiResponse: data
      }));
      
    } catch (err) {
      console.error('API Error:', err);
      
      // Check if error is due to no documents found
      const isNoDocsFound = err.message.toLowerCase().includes('cannot find') || 
                           err.message.toLowerCase().includes('no_docs');
      
      set({ 
        status: 'error', 
        activeAgent: null, 
        error: isNoDocsFound ? 'NO_DOCS_FOUND' : 'API_ERROR',
        apiResponse: null
      });
    }
  },

  reset: () => set({ status: 'idle', activeAgent: null, result: null, error: null, query: '', chatHistory: [] })
}));
