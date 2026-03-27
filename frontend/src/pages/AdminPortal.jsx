import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { FileUp, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

export default function AdminPortal() {
  const role = useAuthStore(state => state.role);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0].name);
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-slate-500 font-sans selection:bg-[#0076CE] selection:text-white pb-20 relative">
      <Navbar />

      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 mt-32">
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            HR Document Portal
          </h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
             Securely upload and index new enterprise policies into the Agentic RAG corpus.
          </p>
        </motion.div>

        {role === 'admin' ? (
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8 md:p-12 relative z-20"
          >
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-all duration-300 cursor-pointer 
                ${isDragging 
                   ? 'border-[#0076CE] bg-[#0076CE]/5 shadow-[inset_0_0_20px_rgba(0,118,206,0.1)]' 
                   : 'border-slate-300 hover:border-[#0076CE]/50 hover:bg-slate-50'}`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors duration-300 ${isDragging ? 'bg-[#0076CE]/10 text-[#0076CE]' : 'bg-slate-100 text-slate-400'}`}>
                <FileUp className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold tracking-tight text-slate-900 mb-2">
                {uploadedFile ? 'File Ready for Processing' : 'Drag & Drop your documents'}
              </h3>
              
              <p className="text-slate-500 mb-6 max-w-sm">
                {uploadedFile 
                   ? uploadedFile 
                   : 'Support for PDF, DOCX, and TXT files. Maximum size 50MB per file.'}
              </p>

              <button 
                aria-label="Select files to upload"
                className="bg-white border border-slate-200 hover:border-[#0076CE]/30 hover:bg-slate-50 text-slate-900 px-6 py-2.5 rounded-lg font-bold shadow-sm transition-all focus:ring-2 focus:ring-[#0076CE]/50 tracking-tight"
              >
                 Browse Files
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-200">
              <h4 className="text-sm font-bold tracking-tight text-slate-900 uppercase mb-4 flex items-center gap-2">
                 <Clock className="w-4 h-4 text-[#0076CE]" /> Recent Vectorizations
              </h4>
              
              <div className="space-y-3">
                 {[
                   { doc: 'Global_HR_v3.pdf', time: '12 mins ago', status: 'Indexed' },
                   { doc: '2026_Remote_Work_Addendum.pdf', time: '1 hour ago', status: 'Indexed' }
                 ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white/50 border border-slate-200 rounded-lg hover:shadow-sm transition-all">
                       <div className="flex items-center gap-3">
                          <FileUp className="w-5 h-5 text-slate-400" />
                          <span className="font-semibold text-sm text-slate-700">{item.doc}</span>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400 font-mono">{item.time}</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100">
                             {item.status}
                          </span>
                       </div>
                    </div>
                 ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-red-500/20 p-10 mt-8 text-center flex flex-col items-center"
          >
             <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <ShieldAlert className="w-8 h-8 text-red-500" />
             </div>
             <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
             <p className="text-slate-500 max-w-lg">Only authorized HR administrators have clearance to manually modify the knowledge vault here. Please log in with a valid HR account (e.g., using an &#64;hr.dell.com email address).</p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
