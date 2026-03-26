import { BrainCircuit } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  const handleScroll = (e, id) => {
    e.preventDefault();
    if (!isHome) {
      // If we're not on home, we just go to home. Realistically you'd pass state to scroll after navigation.
      window.location.href = `/#${id}`;
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="w-10 h-10 rounded-full bg-[#0076CE] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105">
            <BrainCircuit className="w-5 h-5" />
          </Link>
          <Link to="/" className="text-xl font-bold tracking-tight text-[#444444] hover:text-[#0076CE] transition-colors">
            Smart Knowledge
          </Link>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-6 text-sm font-semibold text-[#444444]">
            <a href="#features" onClick={(e) => handleScroll(e, 'features')} className="hover:text-[#0076CE] transition-colors cursor-pointer">Features</a>
            <a href="#enterprise" onClick={(e) => handleScroll(e, 'enterprise')} className="hover:text-[#0076CE] transition-colors cursor-pointer">Enterprise</a>
            <a href="#security" onClick={(e) => handleScroll(e, 'security')} className="hover:text-[#0076CE] transition-colors cursor-pointer">Security</a>
          </div>
          
          <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
            <button className="text-sm font-bold text-[#444444] hover:text-[#0076CE] px-4 py-2 hover:bg-[#F8F8F8] rounded-lg transition-colors">
              Log In
            </button>
            <button className="bg-[#0076CE] hover:bg-[#0058A3] text-sm font-bold text-white px-5 py-2.5 rounded-lg transition-all shadow-sm">
              Sign In
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
