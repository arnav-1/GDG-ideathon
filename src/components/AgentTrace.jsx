import { useState, useEffect } from 'react';
import { Network, Search, ArrowRightLeft, PenTool, CheckCircle, Usb, Globe2 } from 'lucide-react';

const AGENTS = [
  { id: 'planning', name: 'Planning Agent', icon: Network, desc: 'Decomposes query' },
  { id: 'retrieval', name: 'Retrieval Agent', icon: Search, desc: 'Semantic search with timestamps' },
  { id: 'conflict', name: 'Conflict Resolution Agent', icon: ArrowRightLeft, desc: 'Resolves contradictions' },
  { id: 'synthesis', name: 'Synthesis Agent', icon: PenTool, desc: 'Drafts cited response' },
  { id: 'verifier', name: 'Verifier Agent', icon: CheckCircle, desc: 'Cross-references source' },
  { id: 'persona', name: 'Persona Agent', icon: Usb, desc: 'Adjusts tone' },
  { id: 'translator', name: 'Translator Agent', icon: Globe2, desc: 'Localizes output' },
];

export default function AgentTrace({ isActive, onComplete }) {
  const [activeIdx, setActiveIdx] = useState(-1);

  useEffect(() => {
    if (!isActive) {
      setActiveIdx(-1);
      return;
    }

    let currentIdx = 0;
    const interval = setInterval(() => {
      setActiveIdx(currentIdx);
      if (currentIdx === AGENTS.length - 1) {
        clearInterval(interval);
        setTimeout(() => onComplete(), 800);
      }
      currentIdx++;
    }, 1200);

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-sm border border-gray-200 p-6 overscroll-contain">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-900">
        <Network className="text-[#0076CE] w-6 h-6" />
        Reasoning Trace
      </h3>
      
      <div className="space-y-4 relative">
        {/* Draw a connecting line behind the icons */}
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-100 z-0" />

        {AGENTS.map((agent, idx) => {
          const isPast = activeIdx > idx;
          const isCurrent = activeIdx === idx;
          const isFuture = activeIdx < idx && activeIdx !== -1;
          const isIdle = activeIdx === -1;

          const Icon = agent.icon;

          return (
            <div 
              key={agent.id} 
              className={`relative z-10 flex items-start gap-4 transition-all duration-500 ease-in-out ${isFuture ? 'opacity-40 grayscale' : 'opacity-100'} ${isCurrent ? 'scale-105 ml-2' : ''}`}
            >
              <div 
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-white transition-colors duration-300 ${
                  isCurrent ? 'border-[#0076CE] text-[#0076CE] shadow-[0_0_10px_rgba(0,118,206,0.3)] ring-4 ring-blue-50' : 
                  isPast ? 'border-green-500 text-green-600 bg-green-50' : 
                  'border-gray-200 text-gray-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="pt-2 flex-grow">
                <p className={`font-bold transition-colors duration-300 ${
                  isCurrent ? 'text-[#0076CE]' : 
                  isPast ? 'text-gray-900' : 
                  'text-gray-500'
                }`}>
                  {agent.name}
                </p>
                <p className="text-sm text-[#444444] font-medium">{agent.desc}</p>

                {isCurrent && (
                  <div className="mt-2 text-xs italic text-gray-400 animate-pulse font-mono">
                    Processing payload...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
