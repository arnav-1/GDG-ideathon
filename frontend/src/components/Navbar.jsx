import { BrainCircuit } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, signOut } = useAuthStore();

  const handleNav = (e, id) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      navigate('/#' + id);
      setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }} 
      animate={{ y: 0, opacity: 1 }} 
      className="border-b border-white/20 bg-white/70 backdrop-blur-xl fixed w-full top-0 z-50 shadow-sm"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Home" className="w-9 h-9 rounded-full bg-[#0076CE] flex items-center justify-center text-white transition-transform hover:scale-105 shadow-[0_0_15px_rgba(0,118,206,0.3)]">
            <BrainCircuit className="w-5 h-5" />
          </Link>
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-900 hover:text-[#0076CE] transition-colors">
            Smart Knowledge
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-6 text-sm font-bold text-slate-500">
            <a href="#features" aria-label="Features" onClick={(e) => handleNav(e, 'features')} className="hover:text-[#0076CE] transition-colors cursor-pointer tracking-tight">Features</a>
            <a href="#enterprise" aria-label="Enterprise" onClick={(e) => handleNav(e, 'enterprise')} className="hover:text-[#0076CE] transition-colors cursor-pointer tracking-tight">Enterprise</a>
            <a href="#security" aria-label="Security" onClick={(e) => handleNav(e, 'security')} className="hover:text-[#0076CE] transition-colors cursor-pointer tracking-tight">Security</a>
            {role === 'admin' && (
              <Link to="/admin" className={`transition-colors cursor-pointer tracking-tight ${location.pathname === '/admin' ? 'text-[#0672CE] border-b-2 border-[#0672CE] -mb-[2px]' : 'hover:text-[#0672CE]'}`}>
                HR Portal
              </Link>
            )}
          </div>
          
          <div className="flex items-center gap-3 border-l border-slate-200 pl-6 h-8">
            {!user ? (
               <>
                 <Link to="/login" aria-label="Log In" className="text-sm font-bold text-slate-500 hover:text-[#0076CE] px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors tracking-tight">
                   Log In
                 </Link>
                 <Link to="/signup" aria-label="Sign In" className="bg-gradient-to-r from-[#0076CE] to-[#0058A3] hover:scale-105 text-sm font-bold text-white px-5 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(0,118,206,0.3)] tracking-tight inline-block text-center mt-0.5">
                   Sign In
                 </Link>
               </>
            ) : (
               <>
                 <Link to="/dashboard" aria-label="Dashboard" className="text-sm font-bold text-slate-500 hover:text-[#0076CE] px-4 py-2 hover:bg-slate-50 rounded-lg transition-colors tracking-tight">
                   Dashboard
                 </Link>
                 <button onClick={async () => { await signOut(); navigate('/login'); }} aria-label="Log Out" className="text-sm font-bold text-red-500 hover:text-red-700 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors tracking-tight mt-0.5">
                   Log Out
                 </button>
               </>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
