import { useAgentStore } from '../store/useAgentStore';
import { Network, Search, ArrowRightLeft, PenTool, ShieldCheck, Usb, Globe2, Loader2, Volume2 } from 'lucide-react';

const AGENTS = [
  { id: 'planning', name: 'Planning Agent', icon: Network, desc: 'Decomposes query elements' },
  { id: 'retrieval', name: 'Retrieval Agent', icon: Search, desc: 'Semantic search with temporality' },
  { id: 'conflict', name: 'Conflict Resolution Agent', icon: ArrowRightLeft, desc: 'Resolves data contradictions' },
  { id: 'synthesis', name: 'Synthesis Agent', icon: PenTool, desc: 'Drafts cited response payload' },
  { id: 'verifier', name: 'Verifier Agent', icon: ShieldCheck, desc: 'Cross-references source material' },
  { id: 'persona', name: 'Persona Agent', icon: Usb, desc: 'Adjusts enterprise tone' },
  { id: 'translator', name: 'Translator Agent', icon: Globe2, desc: 'Localizes final output' },
  { id: 'voice', name: 'Voice Agent', icon: Volume2, desc: 'Generates audio output' },
];

export default function AgentTrace() {
  const { status, activeAgent } = useAgentStore();

  const isIdle = status === 'idle';
  const hasCompleted = status === 'complete' || status === 'error';

  const activeIdx = hasCompleted ? AGENTS.length : AGENTS.findIndex(a => a.id === activeAgent);

  return (
    <div className={`bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 overscroll-contain transition-all duration-500 h-full min-h-[500px] ${isIdle ? 'opacity-80 grayscale-[0.2]' : 'opacity-100'}`}>
      <h3 className="text-xl font-bold tracking-tight mb-8 flex items-center justify-between text-slate-900">
        <div className="flex items-center gap-2">
          <Network className={`w-6 h-6 transition-colors ${isIdle ? 'text-slate-400' : 'text-[#0076CE]'}`} />
          Reasoning Trace
        </div>
        {(status === 'processing') && <Loader2 className="w-5 h-5 text-[#0076CE] animate-spin" />}
      </h3>
      
      <div className="space-y-5 relative">
        <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-slate-200/60 z-0" />

        {AGENTS.map((agent, idx) => {
          const isPast = activeIdx > idx;
          const isCurrent = activeAgent === agent.id && status === 'processing';
          let   isFuture = activeIdx < idx;
          
          if (isIdle) {
             isFuture = true; 
          }

          const Icon = agent.icon;

          return (
            <div 
              key={agent.id} 
              className={`relative z-10 flex items-start gap-4 transition-all duration-500 ease-in-out ${isFuture ? 'opacity-30 grayscale' : 'opacity-100'} ${isCurrent ? 'scale-105 ml-2' : ''}`}
            >
              <div 
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center bg-white transition-all duration-300 ${
                  isCurrent ? (agent.id === 'conflict' ? 'border-[#ED8B00] text-[#ED8B00] shadow-[0_0_15px_rgba(237,139,0,0.5)] ring-4 ring-[#ED8B00]/10 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]' : 'border-[#0076CE] text-[#0076CE] shadow-[0_0_15px_rgba(0,118,206,0.5)] ring-4 ring-[#0076CE]/10 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]') : 
                  isPast && !isIdle ? 'border-green-500 text-green-600 bg-emerald-50' : 
                  'border-slate-200 text-slate-400 bg-slate-50/50'
                }`}
              >
                <Icon className="w-5 h-5 shadow-sm" />
              </div>
              <div className="pt-2 flex-grow">
                <p className={`font-bold tracking-tight transition-colors duration-300 ${
                  isCurrent ? (agent.id === 'conflict' ? 'text-[#ED8B00]' : 'text-[#0076CE]') : 
                  isPast && !isIdle ? 'text-slate-900' : 
                  'text-slate-500'
                }`}>
                  {agent.name}
                </p>
                <p className="text-sm text-slate-500 font-medium">{agent.desc}</p>

                {isCurrent && (
                  <div className={`mt-2 text-xs italic font-mono opacity-80 animate-pulse ${agent.id === 'conflict' ? 'text-[#ED8B00]' : 'text-[#0076CE]'}`}>
                    Executing neural logic...
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isIdle && (
         <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/90 via-white/80 to-transparent h-32 flex items-end justify-center pb-8 z-20 pointer-events-none rounded-b-2xl">
             <p className="text-sm font-bold tracking-tight text-[#0076CE]/70 bg-white/80 backdrop-blur-md px-5 py-2 rounded-full shadow-sm border border-slate-200/50">
                System Awaiting Query
             </p>
         </div>
      )}
    </div>
  );
}
