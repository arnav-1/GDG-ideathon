import React, { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { motion, AnimatePresence } from 'framer-motion';

const PERSONAS = [
  { id: 'standard', name: 'Standard User', description: 'General inquiries' },
  { id: 'executive', name: 'Executive', description: 'High-level summaries' },
  { id: 'technical', name: 'Technical Lead', description: 'Detailed technical info' },
  { id: 'hr', name: 'HR Manager', description: 'HR-focused queries' }
];

export default function PersonaSelector() {
  const { persona, setPersona } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentPersona = PERSONAS.find(p => p.id === persona) || PERSONAS[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/50 hover:bg-white/80 border border-white/20 shadow-sm transition-all focus:outline-none"
        aria-label="Select Persona"
      >
        <Users className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold tracking-tight text-slate-700 hidden sm:inline-block">
          {currentPersona.name}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-xl z-50 overflow-hidden"
          >
            <div className="py-2">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setPersona(p.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium tracking-tight flex items-start justify-between transition-colors ${
                    persona === p.id 
                      ? 'bg-[#0076CE]/10 text-[#0076CE]' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#0076CE]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-xs opacity-75">{p.description}</span>
                  </div>
                  {persona === p.id && <Check className="w-4 h-4 flex-shrink-0 mt-1" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
