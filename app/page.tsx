'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  QrCode,
  Globe,
  RefreshCw,
  ExternalLink,
  Lock,
  Cpu,
  CheckCircle2,
  Bell,
  FlaskConical,
  Activity
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'TEST' | 'LIVE'>('TEST');
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunchCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than 0.');
      setLoading(false);
      return;
    }

    try {
      const customOrderId =
        mode === 'TEST'
          ? `TEST_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          : undefined;

      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          customOrderId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create order');
        setLoading(false);
        return;
      }

      router.push(`/checkout/${data.orderId}`);
    } catch {
      setError('Connection failure while generating checkout session.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col justify-between">
      {/* Navigation Header */}
      <header className="border-b border-white/5 glass-panel sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-white text-sm tracking-wide">UPI GATEWAY</span>
              <span className="text-[10px] text-amber-400 block font-semibold leading-none">OmniCard & FamPay</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mode Switcher in Header */}
            <div className="bg-slate-900/80 p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('TEST');
                  setAmount('10');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  mode === 'TEST'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FlaskConical className="w-3.5 h-3.5" />
                <span>Test Mode</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('LIVE');
                  setAmount('150');
                }}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                  mode === 'LIVE'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-950 animate-pulse" />
                <span>Live Mode</span>
              </button>
            </div>

            <Link
              href="/admin"
              className="text-xs font-semibold px-4 py-2 rounded-xl gold-gradient-btn flex items-center gap-1.5 shadow-md hover:brightness-105 transition-all"
            >
              <Lock className="w-3.5 h-3.5" /> Admin Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Introduction & Features */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" /> Unofficial UPI Payment Gateway Architecture
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Instant UPI Reconciliation via <span className="gold-gradient-text">Android Notification Listener</span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Bypass official aggregator rejections for OmniCard prepaid accounts.
              Our dedicated Android listener intercepts push notifications on your phone in &lt;50ms, parses 18-digit transaction IDs and 12-digit UPI UTRs, and updates orders automatically.
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="glass-card p-3.5 rounded-xl border border-white/5 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Dynamic UPI QR</h4>
                <p className="text-[11px] text-slate-400">Strict intent specification with 15m countdown timer.</p>
              </div>

              <div className="glass-card p-3.5 rounded-xl border border-white/5 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Phone Listener</h4>
                <p className="text-[11px] text-slate-400">Captures OmniCard push alerts in &lt;50ms.</p>
              </div>

              <div className="glass-card p-3.5 rounded-xl border border-white/5 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Instant Webhooks</h4>
                <p className="text-[11px] text-slate-400">Dispatches real-time callbacks on payment confirmation.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Checkout Launcher with Mode Switch */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  mode === 'TEST'
                    ? 'from-amber-500 to-yellow-400'
                    : 'from-emerald-500 to-teal-400'
                }`}
              />

              {/* Mode Toggle Switch Bar */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">Launch Checkout</h3>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                      mode === 'TEST'
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        mode === 'TEST' ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'
                      }`}
                    />
                    {mode === 'TEST' ? 'SANDBOX MODE' : 'LIVE PRODUCTION'}
                  </span>
                </div>

                {/* Big Mode Switch Buttons */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/90 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('TEST');
                      setAmount('10');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      mode === 'TEST'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Test Sandbox</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMode('LIVE');
                      setAmount('150');
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      mode === 'LIVE'
                        ? 'bg-emerald-500 text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Live Gateway</span>
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {mode === 'TEST'
                    ? '🧪 Sandbox Mode: Includes an instant payment simulator on checkout. No bank funds required.'
                    : '⚡ Live Mode: Generates actual UPI QR code for OmniCard / FamPay. Verified automatically when payment is received.'}
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleLaunchCheckout} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Payment Amount (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="glass-input w-full pl-9 pr-3.5 py-3 rounded-xl text-base font-bold text-white"
                      placeholder={mode === 'TEST' ? '10' : '150'}
                    />
                  </div>
                </div>

                {/* Amount Quick Presets */}
                <div className="flex gap-2">
                  {(mode === 'TEST' ? [1, 10, 50, 100] : [25, 50, 150, 500]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val.toString())}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                        amount === val.toString()
                          ? mode === 'TEST'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-white/10'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 text-slate-950 ${
                    mode === 'TEST'
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                >
                  {loading
                    ? 'Creating Order...'
                    : mode === 'TEST'
                    ? 'Launch Test Sandbox Checkout'
                    : 'Proceed to Live UPI Checkout'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> MongoDB Atlas + Prisma ORM
                </span>
                <Link
                  href="/admin"
                  className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
                >
                  Admin Portal →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>Production-Grade Unofficial UPI Gateway • Next.js App Router • Tailwind CSS</p>
      </footer>
    </div>
  );
}
