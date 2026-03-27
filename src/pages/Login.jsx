import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setErrorMsg("Access Denied: " + error.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 bg-transparent font-sans">
      <Navbar />
      <div className="w-full max-w-[420px] bg-white/80 backdrop-blur-lg p-10 border border-white/20 shadow-2xl relative z-20 rounded-xl mt-16">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-[#0672CE] rounded-t-xl"></div>
        
        <h1 className="text-2xl font-light text-slate-800 mb-8 uppercase tracking-widest text-center">Employee Sign In</h1>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-tighter">Email Address</label>
            <input 
               type="email" 
               required 
               value={email}
               onChange={e => setEmail(e.target.value)}
               className="w-full p-2 border border-slate-300 rounded-none focus:border-[#0672CE] outline-none transition-all bg-white/50" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-tighter">Password</label>
            <input 
               type="password" 
               required 
               value={password}
               onChange={e => setPassword(e.target.value)}
               className="w-full p-2 border border-slate-300 rounded-none focus:border-[#0672CE] outline-none transition-all bg-white/50" 
            />
          </div>
          
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

          <button type="submit" className="w-full bg-[#0672CE] text-white py-3 font-bold rounded-none hover:bg-[#004A77] transition-all tracking-widest cursor-pointer shadow-md">
            SIGN IN
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-200 pt-6">
          <p className="text-sm text-slate-600">
            New Employee? 
            <Link to="/signup" className="text-[#0672CE] font-bold ml-1 hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
