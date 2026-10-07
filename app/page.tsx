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
  Mail,
  RefreshCw,
  ExternalLink,
  Lock,
  Cpu,
  CheckCircle2,
  FolderTree
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [testAmount, setTestAmount] = useState('150');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLaunchCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(testAmount) }),
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
            <Link
              href="/admin"
              className="text-xs font-semibold px-4 py-2 rounded-xl gold-gradient-btn flex items-center gap-1.5 shadow-md hover:brightness-105 transition-all"
            >
              <Lock className="w-3.5 h-3.5" /> Admin Dashboard
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
              Instant UPI Reconciliation via <span className="gold-gradient-text">Gmail IMAP</span>
            </h1>

            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Bypass official banking aggregator hurdles for OmniCard and FamPay personal/prepaid accounts.
              Our engine autonomously polls multi-folder incoming emails (<code className="text-amber-300">INBOX</code>, <code className="text-amber-300">[Gmail]/Spam</code>, <code className="text-amber-300">[Gmail]/Trash</code>), extracts 12-digit UTRs, and fires webhook confirmations in real-time.
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
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <FolderTree className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-white">Multi-Folder IMAP</h4>
                <p className="text-[11px] text-slate-400">Scans Inbox, Spam, and Trash for delayed receipts.</p>
              </div>

              <div className="glass-card p-3.5 rounded-xl border border-white/5 space-y-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-xs text-white">12-Digit UTR Parser</h4>
                <p className="text-[11px] text-slate-400">Regex extraction and replay protection.</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Checkout Launcher */}
          <div className="lg:col-span-5">
            <div className="glass-card p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden space-y-6">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400" />

              <div className="space-y-1">
                <h3 className="text-lg font-bold text-white">Launch Interactive Checkout</h3>
                <p className="text-xs text-slate-400">
                  Simulate a customer payment session with dynamic QR code & 5-second polling.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {error}
                </div>
              )}

              <form onSubmit={handleLaunchCheckout} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Payment Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={testAmount}
                      onChange={(e) => setTestAmount(e.target.value)}
                      className="glass-input w-full pl-9 pr-3.5 py-3 rounded-xl text-base font-bold text-white"
                      placeholder="150"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  {[25, 50, 150, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setTestAmount(val.toString())}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-xs font-semibold text-slate-300 border border-white/10 hover:border-amber-500/30 transition-all"
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl gold-gradient-btn flex items-center justify-center gap-2 text-sm font-bold shadow-lg hover:brightness-105 active:scale-98 transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating Order...' : 'Proceed to Checkout'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> SQLite + Prisma ORM
                </span>
                <Link href="/admin" className="text-amber-400 hover:text-amber-300 font-medium">
                  Admin Login (admin / adminpassword123) →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>Production-Grade Unofficial UPI Gateway Dashboard • Next.js App Router • Tailwind CSS</p>
      </footer>
    </div>
  );
}
