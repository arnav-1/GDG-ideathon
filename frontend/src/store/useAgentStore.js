import { create } from 'zustand';

// Simulated states: 'idle' | 'planning' | 'retrieval' | 'conflict' | 'synthesis' | 'verifier' | 'persona' | 'translator' | 'complete' | 'error'
export const useAgentStore = create((set, get) => ({
  status: 'idle',
  activeAgent: null,
  query: '',
  result: null,
  error: null,
  chatHistory: [],
  language: 'English',
  
  setQuery: (query) => set({ query }),
  setLanguage: (language) => set({ language }),
  
  startProcessing: async (userQuery) => {
    const newChat = [...get().chatHistory, { id: Date.now().toString(), type: 'user', text: userQuery }];
    set({ status: 'processing', query: userQuery, result: null, error: null, chatHistory: newChat });

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

    const { language } = get();

    const translations = {
      'English': 'Effective starting January 1, 2026, the remote work policy has been updated to mandate a fully hybrid model requiring a minimum of three core days in the office. The previous 2024 policy which allowed generic exceptions has been explicitly sunset. Conflict resolved automatically prioritizing the 2026 Addendum.',
      'Spanish': 'A partir del 1 de enero de 2026, la política de trabajo remoto se ha actualizado para exigir un modelo totalmente híbrido que requiere un mínimo de tres días principales en la oficina. La política anterior de 2024 que permitía excepciones genéricas ha sido eliminada explícitamente. Se resolvió el conflicto de forma automática priorizando el Anexo de 2026.',
      'French': 'À compter du 1er janvier 2026, la politique de télétravail a été mise à jour pour imposer un modèle entièrement hybride exigeant un minimum de trois jours de base au bureau. La politique précédente de 2024, qui autorisait des exceptions génériques, a été explicitement supprimée. Conflit résolu automatiquement en donnant la priorité à l\'addendum de 2026.',
      'German': 'Mit Wirkung zum 1. Januar 2026 wurde die Homeoffice-Richtlinie dahingehend aktualisiert, dass ein vollständig hybrides Modell vorgeschrieben ist, das mindestens drei Kerntage im Büro erfordert. Die bisherige Richtlinie von 2024, die allgemeine Ausnahmen zuließ, wurde ausdrücklich außer Kraft gesetzt. Der Konflikt wurde automatisch gelöst, wobei der Anhang von 2026 priorisiert wurde.',
      'Hindi': '1 जनवरी, 2026 से प्रभावी, रिमोट वर्क पॉलिसी को एक पूरी तरह से हाइब्रिड मॉडल को अनिवार्य करने के लिए अपडेट किया गया है, जिसमें कार्यालय में न्यूनतम तीन मुख्य दिनों की आवश्यकता होती है। पिछली 2024 की नीति जो सामान्य अपवादों की अनुमति देती थी, उसे स्पष्ट रूप से समाप्त कर दिया गया है। 2026 परिशिष्ट को प्राथमिकता देते हुए संघर्ष अपने आप हल हो गया।'
    };

    const translatedText = translations[language] || translations['English'];

    const aiMessage = {
      id: (Date.now() + 1).toString(),
      type: 'agent',
      text: translatedText,
      confidence: '99.8%',
      time: '4.2s',
      citations: [
         { id: '1', title: '2026 Remote Work Addendum', file: 'HR_Policy_2026.pdf', details: 'Page 2, Section A. Timestamp: Feb 12, 2026' },
         { id: '2', title: 'Global HR Policy V3.1', file: 'Global_HR_v3.pdf', details: 'Page 14. Timestamp: Mar 01, 2024 (Superseded)' }
      ]
    };

    // Success payload
    set({ 
       status: 'complete', 
       activeAgent: null, 
       result: aiMessage,
       chatHistory: [...get().chatHistory, aiMessage]
    });
  },

  reset: () => set({ status: 'idle', activeAgent: null, result: null, error: null, query: '', chatHistory: [] })
}));
