import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useAgentStore } from '../store/useAgentStore';
import { motion, AnimatePresence } from 'framer-motion';

const LANGUAGES = [
  { id: 'en', name: 'English', locale: 'en-US' },
  { id: 'es', name: 'Spanish', locale: 'es-ES' },
  { id: 'fr', name: 'French', locale: 'fr-FR' },
  { id: 'de', name: 'German', locale: 'de-DE' },
  { id: 'hi', name: 'Hindi', locale: 'hi-IN' }
];

export default function LanguageSelector() {
  const { language, setLanguage } = useAgentStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLang = LANGUAGES.find(l => l.name === language) || LANGUAGES[0];

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
        aria-label="Select Language"
      >
        <Globe className="w-4 h-4 text-slate-600" />
        <span className="text-sm font-semibold tracking-tight text-slate-700 hidden sm:inline-block">
          {currentLang.name}
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
            className="absolute right-0 mt-2 w-48 bg-white/90 backdrop-blur-xl border border-white/20 shadow-xl rounded-xl z-50 overflow-hidden"
          >
            <div className="py-2">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => {
                    setLanguage(lang.name);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm font-medium tracking-tight flex items-center justify-between transition-colors ${
                    language === lang.name 
                      ? 'bg-[#0076CE]/10 text-[#0076CE]' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#0076CE]'
                  }`}
                >
                  {lang.name}
                  {language === lang.name && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
