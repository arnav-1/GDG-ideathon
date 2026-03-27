import { create } from 'zustand';

// Simulated states: 'idle' | 'planning' | 'retrieval' | 'conflict' | 'synthesis' | 'verifier' | 'persona' | 'translator' | 'complete' | 'error'
export const useAgentStore = create((set, get) => ({
  status: 'idle',
  activeAgent: null, // Holds the ID of the current agent processing
  query: '',
  result: null,
  error: null,
  
  setQuery: (query) => set({ query }),
  
  startProcessing: async (userQuery) => {
    // Teammates will replace this logic with actual API calls to LangGraph
    set({ status: 'processing', query: userQuery, result: null, error: null });

    const agentsSequence = ['planning', 'retrieval', 'conflict', 'synthesis', 'verifier', 'persona', 'translator', 'voice'];
    
    // Simulate error condition for testing: if query contains 'fail'
    const willFail = userQuery.toLowerCase().includes('fail') || userQuery.toLowerCase().includes('empty');

    for (let i = 0; i < agentsSequence.length; i++) {
       const agent = agentsSequence[i];
       set({ activeAgent: agent });
       
       // Simulate time per agent
       await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));

       // If "empty" is simulated, fail at retrieval
       if (willFail && agent === 'retrieval') {
         set({ status: 'error', activeAgent: null, error: 'NO_DOCS_FOUND' });
         return;
       }
    }

    // Success payload
    set({ 
       status: 'complete', 
       activeAgent: null, 
       result: {
           text: 'Effective starting January 1, 2026, the remote work policy has been updated to mandate a fully hybrid model requiring a minimum of three core days in the office. The previous 2024 policy which allowed generic exceptions has been explicitly sunset.',
           confidence: '99.8%',
           time: '4.2s',
           citations: [
               { id: '1', title: '2026 Remote Work Addendum', details: 'Page 2, Section A. Timestamp: Feb 12, 2026' },
               { id: '2', title: 'Global HR Policy V3.1', details: 'Page 14. Timestamp: Mar 01, 2024 (Superseded)' }
           ]
       }
    });
  },

  reset: () => set({ status: 'idle', activeAgent: null, result: null, error: null, query: '' })
}));
