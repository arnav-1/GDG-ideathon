import React, { useState, useEffect, useRef } from 'react';
import AgentTrace from '../components/AgentTrace';
import Navbar from '../components/Navbar';
import { useAgentStore } from '../store/useAgentStore';
import { Send, FileText, Anchor, FileQuestion, Play, Pause, Square, Paperclip, Mic, ChevronDown, CheckCircle2, Brain, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = {
  'English': 'en-US',
  'Spanish': 'es-ES',
  'French': 'fr-FR',
  'German': 'de-DE',
  'Hindi': 'hi-IN'
};

function Citation({ tag }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0076CE]/10 border border-[#0076CE]/20 text-[#0076CE] text-xs font-semibold hover:bg-[#0076CE]/20 transition-colors cursor-pointer mr-2 mb-2">
      <FileText className="w-3.5 h-3.5" />
      {tag}
    </span>
  );
}

function ThinkingSection({ thinking, isExpanded, onToggle }) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gradient-to-r from-[#0076CE]/5 to-[#0076CE]/0 border border-[#0076CE]/20 hover:border-[#0076CE]/40 transition-all group"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[#0076CE] group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold text-[#0076CE]">Reasoning Trace</span>
          <span className="text-xs text-slate-500">({thinking.split('\n').length} steps)</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-[#0076CE] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 bg-slate-50/50 border border-slate-200/50 rounded-lg p-4 overflow-hidden"
          >
            <div className="text-sm text-slate-700 font-mono whitespace-pre-wrap leading-relaxed text-[13px] max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {thinking}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EvaluationSection({ evaluation, isExpanded, onToggle }) {
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:border-green-300 transition-all group"
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform" />
          <span className="text-sm font-semibold text-green-700">Verification</span>
          <span className="text-xs text-green-600 font-medium">✓ Verified</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-2 bg-green-50/50 border border-green-200/50 rounded-lg p-4 overflow-hidden"
          >
            <div className="text-sm text-green-800 leading-relaxed text-[13px] max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-green-300 scrollbar-track-transparent">
              {evaluation}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function RagDashboard() {
  const [localQuery, setLocalQuery] = useState('');
  const [expandedThinking, setExpandedThinking] = useState({});
  const [expandedEvaluation, setExpandedEvaluation] = useState({});
  const messagesEndRef = useRef(null);
  
  // Get real data from Zustand store
  const { status, error, startProcessing, chatHistory, language } = useAgentStore();

  const isProcessing = status === 'processing';
  const showError = status === 'error';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isProcessing]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localQuery.trim() || isProcessing) return;
    startProcessing(localQuery);
    setLocalQuery('');
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleVoicePlay = (text) => {
    if ('speechSynthesis' in window && text) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.lang = LANGUAGES[language] || 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  const handleVoicePause = () => {
    if ('speechSynthesis' in window) {
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
      }
    }
  };

  const handleVoiceStop = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-transparent text-slate-500 font-sans selection:bg-[#0076CE] selection:text-white relative overflow-hidden">
      <Navbar />

      <main className="flex-grow flex flex-col max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-6 min-h-0">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center mb-6 shrink-0 z-20"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-3">
            Knowledge Navigator
          </h2>
          <p className="text-sm md:text-base text-slate-500 max-w-2xl mx-auto">
             Multi-turn synthesized answers mapped across the Dell enterprise corpus.
          </p>
        </motion.div>

        {/* Dashboard Workspace */}
        <div className="flex flex-1 gap-6 md:gap-8 min-h-0 w-full relative z-20">
          
          {/* Left Sidebar: Agent Trace */}
          <div className="hidden lg:block w-[360px] shrink-0 h-full overflow-y-auto scrollbar-none pb-4">
               <AgentTrace />
          </div>

          {/* Center: Main Chat Feed */}
          <div className="flex-1 flex justify-center min-w-0 h-full">
            <div className="w-full max-w-[880px] flex flex-col h-full bg-white/50 backdrop-blur-2xl border border-white/60 shadow-[0_8px_40px_rgb(0,0,0,0.06)] rounded-[2rem] overflow-hidden relative">
              
              {/* Scrollable Chat Message Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                <AnimatePresence>
                  {chatHistory.length === 0 && !isProcessing && !showError && (
                     <motion.div 
                       initial={{ opacity: 0 }}
                       animate={{ opacity: 1 }}
                       exit={{ opacity: 0 }}
                       className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-sm border border-white/80 p-10 h-full flex flex-col items-center justify-center text-center mt-4 mx-4"
                     >
                        <div className="w-20 h-20 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white">
                           <FileText className="w-10 h-10 text-[#0076CE]" />
                        </div>
                        <p className="text-xl tracking-tight font-bold text-slate-900 mb-3">Ready to Synthesize</p>
                        <p className="text-[15px] text-slate-500 max-w-sm leading-relaxed">Submit a query securely to dispatch the neural multi-agent system across internal documents.</p>
                     </motion.div>
                  )}

                  {chatHistory.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, scale: 0.98, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.type === 'user' ? (
                        <div className="bg-gradient-to-br from-[#0076CE]/15 to-[#0076CE]/5 text-slate-900 border border-[#0076CE]/20 rounded-2xl rounded-tr-sm shadow-sm px-5 py-3.5 max-w-[85%]">
                          <p className="font-medium text-[15px]">{msg.text}</p>
                        </div>
                      ) : (
                        <div className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl rounded-tl-sm shadow-md p-5 sm:p-7 max-w-[100%] w-full">
                          <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2.5">
                              <div className="bg-[#0076CE] p-1.5 rounded-lg text-white shadow-md">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <h3 className="text-base font-bold tracking-tight text-slate-900">Verified Answer</h3>
                              <span className="text-xs text-slate-400 font-mono ml-2 border-l border-slate-200 pl-3">
                                {msg.time} • {msg.confidence}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 border border-slate-100 bg-slate-50/50 rounded-lg p-0.5">
                              <button 
                                onClick={() => handleVoicePlay(msg.text)}
                                aria-label="Play Voice"
                                className="p-1.5 text-slate-400 hover:text-[#0076CE] hover:bg-white rounded-md transition-all shadow-sm"
                              >
                                <Play className="w-4 h-4 fill-current" />
                              </button>
                              <button 
                                onClick={handleVoicePause}
                                aria-label="Pause Voice"
                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-white rounded-md transition-all shadow-sm"
                              >
                                <Pause className="w-4 h-4 fill-current" />
                              </button>
                              <button 
                                onClick={handleVoiceStop}
                                aria-label="Stop Voice"
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-md transition-all shadow-sm"
                              >
                                <Square className="w-3.5 h-3.5 ml-0.5 fill-current" />
                              </button>
                            </div>
                          </div>

                          {msg.thinking && (
                            <ThinkingSection 
                              thinking={msg.thinking}
                              isExpanded={expandedThinking[msg.id]}
                              onToggle={() => setExpandedThinking(prev => ({
                                ...prev,
                                [msg.id]: !prev[msg.id]
                              }))}
                            />
                          )}

                          {msg.evaluation && (
                            <EvaluationSection 
                              evaluation={msg.evaluation}
                              isExpanded={expandedEvaluation[msg.id]}
                              onToggle={() => setExpandedEvaluation(prev => ({
                                ...prev,
                                [msg.id]: !prev[msg.id]
                              }))}
                            />
                          )}

                          <div className="prose prose-slate max-w-none text-slate-800 font-medium leading-relaxed mb-6 text-[13px]">
                            <p>{msg.text}</p>
                          </div>

                          {msg.citations && msg.citations.length > 0 && (
                            <div className="bg-[#F8FAFC] rounded-xl p-4 sm:p-5 border border-slate-200/60 shadow-inner">
                              <h4 className="text-xs font-bold tracking-tight text-slate-800 uppercase mb-3 flex items-center gap-1.5">
                                <Anchor className="w-3.5 h-3.5 text-[#0076CE]" /> Source Citations
                              </h4>
                              
                              <div className="flex flex-wrap mb-3">
                                {msg.citations.map(cit => (
                                   <Citation key={cit.id} tag={cit.file} />
                                ))}
                              </div>

                              <ul className="space-y-2">
                                {msg.citations.map((cit, idx) => (
                                   <li key={idx} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${idx === 0 ? 'bg-white shadow-sm border border-[#0076CE]/20 border-l-[3px] border-l-[#0076CE]' : 'bg-transparent border border-slate-200/60 opacity-60 line-through'}`}>
                                     <FileText className={`w-4 h-4 flex-shrink-0 mt-0.5 ${idx === 0 ? 'text-[#0076CE]' : 'text-slate-400'}`} />
                                     <div>
                                       <p className={`text-[13px] font-bold tracking-tight leading-tight mb-0.5 ${idx === 0 ? 'text-slate-900' : 'text-slate-500'}`}>{cit.title}</p>
                                       <p className={`text-[11px] ${idx === 0 ? 'text-[#0076CE]' : 'text-slate-400'}`}>{cit.details}</p>
                                     </div>
                                   </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {isProcessing && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.98 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.98 }}
                       className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-md p-6 sm:p-7 max-w-[100%] w-full"
                     >
                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse"></div>
                          <div className="space-y-2.5">
                             <div className="w-40 h-3.5 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                             <div className="w-20 h-2bg-slate-100 rounded animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                           <div className="w-full h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                           <div className="w-full h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                           <div className="w-4/5 h-3 bg-gradient-to-r from-slate-200 to-slate-100 rounded animate-pulse"></div>
                        </div>
                     </motion.div>
                  )}

                  {showError && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.98 }}
                       animate={{ opacity: 1, scale: 1 }}
                       className="bg-red-50/90 backdrop-blur-xl rounded-2xl shadow-md border border-red-500/20 p-8 flex flex-col items-center justify-center text-center text-slate-900"
                     >
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-4 border border-red-100 shadow-sm">
                           <FileQuestion className="w-7 h-7 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold tracking-tight text-red-600 mb-2">No Documents Found</h3>
                        <p className="text-[15px] max-w-sm leading-relaxed text-slate-500 mb-5">
                          The retrieval agent was unable to locate any internal documentation matching your query.
                        </p>
                        <button aria-label="Modify Search Parameters" className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold tracking-tight rounded-lg shadow-sm transition-colors text-sm">
                          Modify Search Parameters
                        </button>
                     </motion.div>
                  )}
                </AnimatePresence>
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Sticky Input Field */}
              <div className="p-4 sm:p-5 bg-white/70 backdrop-blur-xl border-t border-white/80">
                <div className="transform transition-all duration-300 hover:shadow-lg rounded-2xl bg-white p-1.5 shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-[#0076CE]/30 focus-within:border-[#0076CE]">
                  <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                    <div className="flex items-center pl-2 gap-1.5 shrink-0">
                      <button type="button" aria-label="Upload File" className="p-2 text-slate-400 hover:text-[#0076CE] hover:bg-slate-50 rounded-xl transition-colors">
                        <Paperclip className="w-[18px] h-[18px]" />
                      </button>
                      <button type="button" aria-label="Use Microphone" className="p-2 text-slate-400 hover:text-[#0076CE] hover:bg-slate-50 rounded-xl transition-colors">
                        <Mic className="w-[18px] h-[18px]" />
                      </button>
                    </div>
                    
                    <input
                      type="text"
                      aria-label="Search Query"
                      value={localQuery}
                      onChange={(e) => setLocalQuery(e.target.value)}
                      placeholder="Ask about HR policies, remote work, or benefits..."
                      className="flex-grow bg-transparent border-0 px-2 py-3 text-[15px] text-slate-900 focus:ring-0 focus:outline-none placeholder-slate-400 font-medium tracking-tight"
                      disabled={isProcessing}
                    />
                    
                    <button
                      type="submit"
                      aria-label="Submit Search"
                      disabled={isProcessing || !localQuery.trim()}
                      className="bg-gradient-to-r from-[#0076CE] to-[#0058A3] hover:scale-105 text-white p-3.5 rounded-xl transition-all duration-300 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(0,118,206,0.2)]"
                    >
                      {isProcessing ? <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-[18px] h-[18px]" />}
                    </button>
                  </form>
                </div>
                <div className="text-center mt-3">
                  <span className="text-[11px] text-slate-500 font-medium">Verify system responses with original documents. Output may be inaccurate.</span>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
}

