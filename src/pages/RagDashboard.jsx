import { useState } from 'react';
import AgentTrace from '../components/AgentTrace';
import Navbar from '../components/Navbar';
import { Send, FileText, Anchor } from 'lucide-react';

function RagDashboard() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsProcessing(true);
    setShowResult(false);
  };

  const handleTraceComplete = () => {
    setIsProcessing(false);
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-transparent text-[#444444] font-sans selection:bg-[#0076CE] selection:text-white pb-20 relative">
      <Navbar />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <div className="text-center mb-10 opacity-0 animate-[fadeIn_1s_ease-out_forwards]">
          <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight drop-shadow-sm">
            Query the Corpus
          </h2>
          <p className="text-lg text-[#444444] max-w-2xl mx-auto">
            Engage the multi-agent system to synthesize verified answers from distributed data.
          </p>
        </div>

        {/* Input Form */}
        <div className="max-w-3xl mx-auto mb-16 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-2xl bg-white/90 backdrop-blur-md p-2 shadow-sm border border-gray-200 relative z-20">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. What is the updated remote work policy for 2026?"
              className="flex-grow bg-transparent border-0 px-6 py-4 text-lg text-gray-900 focus:ring-0 focus:outline-none placeholder-gray-400"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              className="bg-[#0076CE] hover:bg-[#0058A3] text-white px-8 py-4 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(0,118,206,0.3)]"
            >
              {isProcessing ? 'Analyzing...' : 'Search'}
              {!isProcessing && <Send className="w-5 h-5 ml-1 -mr-1" />}
            </button>
          </form>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-20">
          
          {/* Left Column: Trace */}
          <div className="lg:col-span-5">
            <div className={`transition-opacity duration-300 ${isProcessing || showResult ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
               <AgentTrace isActive={isProcessing || showResult} onComplete={handleTraceComplete} />
            </div>
          </div>

          {/* Right Column: Output */}
          <div className="lg:col-span-7">
            {showResult ? (
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 p-8 h-full animate-[slideIn_0.5s_ease-out_forwards]">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                  <div className="bg-green-50 p-2 rounded-lg text-green-600 border border-green-100">
                    <CheckIcon />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Verified Answer</h3>
                    <p className="text-xs text-gray-500 font-mono">Generation time: 4.2s | Confidence: 99.8%</p>
                  </div>
                </div>

                <div className="prose prose-blue max-w-none text-[#444444] font-medium leading-relaxed">
                  <p>
                    Effective starting <strong className="text-gray-900">January 1, 2026</strong>, the remote work policy has been updated to mandate a fully hybrid model requiring a minimum of three core days in the office. 
                  </p>
                  <p className="mt-4">
                    The previous 2024 policy which allowed generic "work from anywhere" exceptions has been explicitly sunset. Conflict resolved automatically prioritizing the 2026 Addendum.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Anchor className="w-4 h-4" /> Supporting Citations
                  </h4>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3 bg-blue-50/80 p-3 rounded-lg border border-blue-100 transition-colors hover:bg-blue-50">
                      <FileText className="w-5 h-5 text-[#0076CE] flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">2026 Remote Work Addendum</p>
                        <p className="text-xs text-gray-500">Page 2, Section A. Timestamp: Feb 12, 2026</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 line-through opacity-60">
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-gray-500">Global HR Policy V3.1</p>
                        <p className="text-xs text-gray-400">Page 14. Timestamp: Mar 01, 2024 (Superseded)</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
             <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-sm border border-gray-300 border-dashed p-8 h-full flex flex-col items-center justify-center text-center text-gray-500 min-h-[400px]">
                {!isProcessing ? (
                  <>
                    <FileText className="w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-lg text-gray-600 font-semibold">Ready for synthesis.</p>
                    <p className="text-sm mt-2 text-gray-500 max-w-sm">Enter a query above to dispatch the multi-agent system into the enterprise document corpus.</p>
                  </>
                ) : (
                  <div className="space-y-4 animate-pulse">
                     <div className="w-16 h-16 border-4 border-[#0058A3] border-t-transparent rounded-full animate-spin mx-auto shadow-sm"></div>
                     <p className="text-[#0076CE] font-bold text-lg">Synthesizing Answer...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
}

export default RagDashboard;
