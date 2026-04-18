"use client";

import { useState } from "react";
import { supabase } from '@/lib/supabaseClient';
import { ShoppingBag, Lock, User, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. I-construct ang email. Kinahanglan @staff.com aron mag-match sa imong DB
    const emailToUse = username.includes('@') 
      ? username.trim() 
      : `${username.toLowerCase().trim()}@staff.com`;

    // 2. Sign in gamit ang Supabase Auth
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToUse,
      password: password,
    });

    if (authError) {
      // Kung mugawas gihapon ang "Email not confirmed", pasabot karaan to nga account
      // Kinahanglan i-delete ang karaan ug mag-create og bag-o sa User Management
      alert("Login Error: " + authError.message);
      setLoading(false);
      return;
    }

    // 3. Kuhaon ang role ug status gikan sa 'profiles' table
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      alert("Access Denied: Walay profile nga nakit-an sa database.");
      setLoading(false);
      return;
    }

    // 4. Status check (Dili pasudlon kung inactive)
    if (profile.status === 'inactive') {
      await supabase.auth.signOut();
      alert("Kini nga account kay Inactive. Kontaka ang imong Admin.");
      setLoading(false);
      return;
    }

    // 5. Redirect base sa Role
    if (profile.role === 'ADMIN') {
      window.location.href = "/owner/dashboard";
    } else {
      window.location.href = "/cashier/pos";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-10 border border-slate-100">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-100 mb-6 rotate-3">
              <ShoppingBag className="text-white w-10 h-10 -rotate-3" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">BugasPOS</h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Management System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-slate-900 font-bold placeholder:text-slate-400"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all text-slate-900 font-bold placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-100 transition-all active:scale-[0.97] flex items-center justify-center gap-3 uppercase tracking-widest text-sm mt-6"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Sign In"}
            </button>
          </form>
        </div>
        
        <p className="text-center mt-8 text-slate-400 text-xs font-medium">
          &copy; 2024 BugasPOS. All rights reserved.
        </p>
      </div>
    </div>
  );
}