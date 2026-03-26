import React, { useState, useEffect } from 'react';
import AgentTrace from '../components/AgentTrace';
import Navbar from '../components/Navbar';
import { useAgentStore } from '../store/useAgentStore';
import { Send, FileText, Anchor, FileQuestion } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function Citation({ tag }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0076CE]/10 border border-[#0076CE]/20 text-[#0076CE] text-xs font-semibold hover:bg-[#0076CE]/20 transition-colors cursor-pointer mr-2 mb-2">
      <FileText className="w-3.5 h-3.5" />
      {tag}
    </span>
  );
}

export default function RagDashboard() {
  const [localQuery, setLocalQuery] = useState('');
  
  // Teammate Integration: Easy plug-and-play hook for backend synthesis payloads.
  const [synthesisData, setSynthesisData] = useState(null);
  
  // Zustand handles the Agent simulation states globally (Planning -> Retrieval -> etc.)
  const { status, error, startProcessing } = useAgentStore();

  const isProcessing = status === 'processing';
  const showError = status === 'error';

  // Listen for Zustand simulation completion and set the teammate integration payload automatically for the demo
  useEffect(() => {
    if (status === 'complete') {
        const dummyPayload = {
           text: 'Effective starting January 1, 2026, the remote work policy has been updated to mandate a fully hybrid model requiring a minimum of three core days in the office. The previous 2024 policy which allowed generic exceptions has been explicitly sunset. Conflict resolved automatically prioritizing the 2026 Addendum.',
           confidence: '99.8%',
           time: '4.2s',
           citations: [
               { id: '1', title: '2026 Remote Work Addendum', file: 'HR_Policy_2026.pdf', details: 'Page 2, Section A. Timestamp: Feb 12, 2026' },
               { id: '2', title: 'Global HR Policy V3.1', file: 'Global_HR_v3.pdf', details: 'Page 14. Timestamp: Mar 01, 2024 (Superseded)' }
           ]
        };
        setSynthesisData(dummyPayload);
    } else if (status === 'idle' || status === 'error' || status === 'processing') {
        setSynthesisData(null);
    }
  }, [status]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localQuery.trim() || isProcessing) return;
    startProcessing(localQuery); // Kicks off AgentTrace sequence
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-500 font-sans selection:bg-[#0076CE] selection:text-white pb-20 relative">
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            Knowledge Navigator
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
             Multi-agent synthesized answers mapped across the Dell enterprise corpus.
          </p>
        </motion.div>

        {/* Floating Search Bar with #0076CE logic and gradient */}
        <div className="max-w-4xl mx-auto mb-12 transform transition-all duration-300 hover:shadow-2xl rounded-2xl bg-white p-2 shadow-xl border border-white/20 focus-within:ring-2 focus-within:ring-[#0076CE]/50 focus-within:border-[#0076CE] relative z-20">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="e.g. Try searching for 'updated remote work policy for 2026', or 'fail' to test errors..."
              className="flex-grow bg-transparent border-0 px-6 py-4 text-lg text-slate-900 focus:ring-0 focus:outline-none placeholder-slate-400 font-medium tracking-tight"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !localQuery.trim()}
              className="bg-gradient-to-r from-[#0076CE] to-[#00447C] hover:text-white hover:scale-105 text-white px-8 py-4 rounded-xl font-bold transition-transform duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-[0_0_15px_rgba(0,118,206,0.3)] tracking-tight"
            >
              {isProcessing ? 'Analyzing...' : 'Search'}
              {!isProcessing && <Send className="w-5 h-5 ml-1 -mr-1" />}
            </button>
          </form>
        </div>

        {/* 40/60 Split Layout */}
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
          
          {/* Column 1: Agent Trace (40%) */}
          <div className="lg:col-span-5">
               <AgentTrace />
          </div>

          {/* Column 2: The Synthesis Output Window (60%) */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              {isProcessing ? (
                 // High Fidelity Shimmering Skeleton Loader
                 <motion.div 
                   key="skeleton"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 h-full min-h-[500px]"
                 >
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                      <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse"></div>
                      <div className="space-y-2">
                         <div className="w-48 h-5 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                         <div className="w-24 h-3 bg-slate-100 rounded animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                       <div className="w-full h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                       <div className="w-full h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                       <div className="w-5/6 h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                    </div>
                    
                    <div className="mt-12 space-y-4">
                       <div className="w-40 h-4 bg-slate-200 rounded animate-pulse mb-6"></div>
                       <div className="w-full h-16 bg-[#0076CE]/5 rounded-lg border border-[#0076CE]/10 animate-pulse"></div>
                       <div className="w-full h-16 bg-[#0076CE]/5 rounded-lg border border-[#0076CE]/10 animate-pulse"></div>
                    </div>
                 </motion.div>
              ) : synthesisData ? (
                 // Success State
                 <motion.div 
                   key="success"
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 h-full min-h-[500px]"
                 >
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                    <div className="bg-[#0076CE] p-2 rounded-md text-white shadow-sm">
                      <CheckIcon />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-slate-900">Verified Answer</h3>
                      <p className="text-xs text-slate-500 font-mono">Synthesized in {synthesisData.time} | Confidence: {synthesisData.confidence}</p>
                    </div>
                  </div>

                  <div className="prose prose-slate max-w-none text-slate-900 font-medium leading-relaxed mb-8">
                    <p>{synthesisData.text}</p>
                  </div>

                  <div className="pt-6 border-t border-slate-200">
                    <h4 className="text-sm font-bold tracking-tight text-slate-900 uppercase mb-4 flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-[#0076CE]" /> Source Citations
                    </h4>
                    
                    <div className="flex flex-wrap mb-4">
                      {synthesisData.citations.map(cit => (
                         <Citation key={cit.id} tag={cit.file} />
                      ))}
                    </div>

                    <ul className="space-y-3">
                      {synthesisData.citations.map((cit, idx) => (
                         <li key={idx} className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${idx === 0 ? 'bg-white shadow border-[#0076CE]/20 border-l-4 border-l-[#0076CE]' : 'bg-transparent border-slate-200 opacity-60 line-through'}`}>
                           <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${idx === 0 ? 'text-[#0076CE]' : 'text-slate-400'}`} />
                           <div>
                             <p className={`text-sm font-bold tracking-tight ${idx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>{cit.title}</p>
                             <p className={`text-xs ${idx === 0 ? 'text-[#0076CE]' : 'text-slate-400'}`}>{cit.details}</p>
                           </div>
                         </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ) : showError ? (
                 // Error State: No Documents Found Placeholder
                 <motion.div 
                   key="error"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-red-500/20 p-8 h-full flex flex-col items-center justify-center text-center text-slate-900 min-h-[500px]"
                 >
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                       <FileQuestion className="w-10 h-10 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight text-red-600 mb-2">No Documents Found</h3>
                    <p className="text-sm max-w-sm leading-relaxed text-slate-500 mb-6">
                      The retrieval agent was unable to locate any internal documentation matching your query within the selected permission scope.
                    </p>
                    <button className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-900 font-bold tracking-tight rounded-lg shadow-sm transition-colors text-sm">
                      Modify Search Parameters
                    </button>
                 </motion.div>
              ) : (
                 // Idle Placeholder
                 <motion.div 
                   key="idle"
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 h-full flex flex-col items-center justify-center text-center min-h-[500px]"
                 >
                    <div className="w-20 h-20 bg-gradient-to-br from-[#F8FAFC] to-[#F1F5F9] rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white">
                       <FileText className="w-10 h-10 text-[#0076CE]" />
                    </div>
                    <p className="text-xl tracking-tight font-bold text-slate-900 mb-2">Ready to Synthesize</p>
                    <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Submit a query using the search bar to dispatch the multi-agent system across the internal corpus.</p>
                 </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
}
