'use client'

import { useState } from 'react'
import { auth } from '../../lib/firebase'
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Key, Globe } from 'lucide-react' // Using Globe as a clean substitute or just text

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const ADMIN_EMAIL = 'novexelstudio@gmail.com';

  const handleAdminCheck = (userEmail: string | null) => {
    if (userEmail?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      document.cookie = "admin_session=true; path=/; SameSite=Strict";
      router.push('/');
      router.refresh();
    } else {
      setError('Access Denied: Unauthorized Admin Account');
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      handleAdminCheck(result.user.email);
    } catch (err: any) {
      setError('Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      handleAdminCheck(userCredential.user.email);
    } catch (err: any) {
      setError('Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-[#0f0f0f] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#D62323] blur-[100px] opacity-20"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="w-20 h-20 bg-[#D62323] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(214,35,35,0.4)]">
            <Lock className="text-white" size={36} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
            Payvyr<span className="text-[#D62323]">.Admin</span>
          </h1>
          <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-black italic">Terminal Restricted</p>
        </div>

        {/* GOOGLE LOGIN - NO IMAGE VERSION */}
        <button 
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-4 px-4 bg-white hover:bg-gray-200 text-black font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 mb-8"
        >
          {/* No image tag here, just clean typography */}
          <span className="text-[13px] tracking-widest uppercase">
            {loading ? 'Authorizing...' : 'Continue with Google'}
          </span>
        </button>

        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
          <span className="relative bg-[#0f0f0f] px-4 text-[10px] text-gray-600 uppercase font-black tracking-widest">Manual Override</span>
        </div>
        
        <form onSubmit={handleEmailLogin} className="space-y-4 relative z-10">
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors" size={18} />
            <input
              type="email"
              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D62323] transition-all placeholder:text-gray-700"
              placeholder="Admin Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="relative group">
            <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 transition-colors" size={18} />
            <input
              type="password"
              className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#D62323] transition-all placeholder:text-gray-700"
              placeholder="Security Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-2xl text-[#D62323] text-xs font-black text-center uppercase italic tracking-tighter">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#D62323] hover:bg-[#ff1a1a] text-white font-black py-5 rounded-2xl shadow-[0_10px_30px_rgba(214,35,35,0.2)] transition-all active:scale-95 mt-4 uppercase text-xs tracking-[0.2em]"
          >
            {loading ? "Decrypting..." : 'Initialize Session'}
          </button>
        </form>
      </div>
    </div>
  )
}