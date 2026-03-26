import { ShieldCheck, ArrowRight, BrainCircuit, Globe, Lock, CodeIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans text-[#444444] selection:bg-[#0076CE] selection:text-white relative bg-transparent">
      {/* Shared Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center mt-12 mb-20 animate-[fadeIn_0.8s_ease-out]">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#0076CE] text-sm font-medium mb-8">
            <ShieldCheck className="w-4 h-4" /> Enterprise-Grade Agentic Intelligence
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 drop-shadow-sm text-gray-900">
            Unify your company's <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0076CE] to-[#0058A3]">collective intelligence.</span>
          </h1>
          <p className="text-xl text-[#444444] max-w-3xl mx-auto mb-10 leading-relaxed bg-transparent relative z-20">
            Stop searching through outdated wikis and scattered PDFs. Our multi-agent RAG system automatically resolves document conflicts, verifying timestamps to bring you the single source of truth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
            <Link to="/rag" className="group flex items-center gap-2 bg-[#0076CE] hover:bg-[#0058A3] text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-[0_4px_15px_rgba(0,118,206,0.3)] hover:shadow-[0_4px_25px_rgba(0,118,206,0.5)]">
              Launch RAG Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* --- ID Sections for Navbar Scrolling --- */}

        {/* Features Section */}
        <section id="features" className="max-w-7xl mx-auto mt-32 pt-16 scroll-mt-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Features</h2>
            <p className="text-[#444444] max-w-2xl mx-auto">The autonomous power behind the Smart Knowledge Navigator.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BrainCircuit className="w-6 h-6 text-[#0076CE]" />}
              title="Multi-Agent Workflow"
              desc="Planning, Retrieval, Resolution, Synthesis, and Verification handled by dedicated autonomous agents."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6 text-[#0076CE]" />}
              title="Zero Hallucinations"
              desc="Every answer is strictly cited against source material with deep-linking to exact pages."
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6 text-[#0076CE]" />}
              title="Temporal Resolution"
              desc="Automatically detect conflicting policies and prioritize the most recent, valid documentation."
            />
          </div>
        </section>

        {/* Enterprise Section */}
        <section id="enterprise" className="max-w-7xl mx-auto mt-32 pt-16 scroll-mt-24">
           <div className="bg-white rounded-3xl p-10 shadow-sm border border-gray-200 flex flex-col md:flex-row items-center gap-12">
             <div className="flex-1">
               <h2 className="text-3xl font-bold text-gray-900 mb-6">Built for the Enterprise Scale</h2>
               <p className="text-[#444444] mb-6 leading-relaxed">
                 Seamlessly integrations across thousands of Confluence spaces, SharePoint drives, and internal HR wikis. Our vector-based intelligence doesn't just read documents—it understands context, permissions, and hierarchy automatically.
               </p>
               <ul className="space-y-4 text-sm font-semibold text-gray-800">
                  <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#0076CE]"></div> SSO & Active Directory Native</li>
                  <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#0076CE]"></div> Scalable Vector Store Architecture</li>
                  <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#0076CE]"></div> Automatic Data Ingestion Pipelines</li>
               </ul>
             </div>
             <div className="flex-1">
                <div className="w-full h-72 bg-gradient-to-br from-blue-50 to-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center flex-col text-gray-400">
                   <CodeIcon className="w-16 h-16 text-blue-200 mb-4" />
                   <p>API Integration Mockup</p>
                </div>
             </div>
           </div>
        </section>

        {/* Security Section */}
        <section id="security" className="max-w-7xl mx-auto mt-32 pt-16 mb-20 scroll-mt-24 text-center">
            <Lock className="w-12 h-12 text-[#0076CE] mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Ironclad Security & Privacy</h2>
            <p className="text-[#444444] max-w-2xl mx-auto mb-10">
              Your data never trains public LLMs. We deploy via strict localized containerized models or isolated tenant architecture guaranteeing Zero Trust operations.
            </p>
            <div className="inline-flex gap-8 justify-center pb-20">
               <div className="text-center font-bold text-gray-400">SOC 2 Type II</div>
               <div className="text-center font-bold text-gray-400">GDPR Compliant</div>
               <div className="text-center font-bold text-gray-400">HIPAA Ready</div>
            </div>
        </section>

      </main>
      
      {/* Basic keyframes */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="p-8 rounded-2xl bg-white border border-gray-200 hover:border-[#0076CE]/50 transition-all shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-6 shadow-inner text-[#0076CE]">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-gray-900">{title}</h3>
      <p className="text-[#444444] leading-relaxed">{desc}</p>
    </div>
  );
}
