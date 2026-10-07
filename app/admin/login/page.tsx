'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, User, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('adminpassword123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
        const errMsg = data.details ? `${data.error} — ${data.details}` : (data.error || 'Authentication failed');
        setError(errMsg);
        setLoading(false);
        return;

      router.push('/admin');
    } catch {
      setError('Unable to communicate with authentication service');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#080c14] relative">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-card max-w-sm w-full p-8 rounded-2xl border border-white/10 shadow-2xl relative z-10 space-y-6">
        {/* Brand Badge */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black mx-auto shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Merchant Admin Login</h1>
          <p className="text-xs text-slate-400">
            Access your UPI Gateway and IMAP reconciliation engine
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" /> Username
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl gold-gradient-btn flex items-center justify-center gap-2 text-sm font-bold shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-slate-400 space-y-1">
          <p className="font-semibold text-amber-400/90">Default Seed Credentials:</p>
          <div className="font-mono text-slate-300">
            Username: <span className="text-white">admin</span>
          </div>
          <div className="font-mono text-slate-300">
            Password: <span className="text-white">adminpassword123</span>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-slate-500 hover:text-amber-400 transition-colors">
            ← Return to Checkout Demo
          </Link>
        </div>
      </div>
    </div>
  );
}
