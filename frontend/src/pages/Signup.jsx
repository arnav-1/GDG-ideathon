import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Navbar from '../components/Navbar';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [empId, setEmpId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          employee_id: empId
        }
      }
    });

    if (error) {
      setErrorMsg("Error: " + error.message);
    } else {
      alert("Account Created! You can now sign in.");
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 bg-transparent font-sans">
      <Navbar />
      <div className="w-full max-w-[450px] bg-white/80 backdrop-blur-lg p-10 border border-white/20 shadow-2xl relative z-20 rounded-xl mt-16">
        <div className="absolute top-0 left-0 w-full h-[5px] bg-[#0672CE] rounded-t-xl"></div>
        
        <h1 className="text-2xl font-light text-slate-800 mb-6 uppercase tracking-widest text-center">Registration</h1>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-tighter">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-none focus:border-[#0672CE] outline-none bg-white/50" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-tighter">Employee ID</label>
            <input type="text" value={empId} onChange={e => setEmpId(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-none focus:border-[#0672CE] outline-none bg-white/50" placeholder="DELL-XXXXX" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-tighter">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-none focus:border-[#0672CE] outline-none bg-white/50" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1 tracking-tighter">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 border border-slate-300 rounded-none focus:border-[#0672CE] outline-none bg-white/50" />
          </div>
          
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

          <button type="submit" className="w-full bg-[#0672CE] text-white py-3 font-bold rounded-none hover:bg-[#004A77] transition-all tracking-widest cursor-pointer shadow-md mt-2">
            CREATE ACCOUNT
          </button>
        </form>

        <div className="mt-6 text-center border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">
            Already registered? 
            <Link to="/login" className="text-[#0672CE] font-bold ml-1 hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
