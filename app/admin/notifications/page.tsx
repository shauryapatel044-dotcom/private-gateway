'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Bell,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Send,
  Zap,
  Clock,
  Layers,
  ArrowRight,
  Download
} from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  packageName: string;
  title: string;
  text: string;
  amount: number | null;
  utr: string | null;
  matchedOrderId: string | null;
  status: 'MATCHED' | 'UNMATCHED' | 'IGNORED';
  createdAt: string;
}

export default function NotificationsStreamPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Simulator Form State
  const [simApp, setSimApp] = useState('com.eroute.omnicard');
  const [simTitle, setSimTitle] = useState('OmniCard Alert: Money Added');
  const [simText, setSimText] = useState('Rs. 150.00 credited to your OmniCard via UPI. UPI Ref: 428190184712');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setTotalCount(data.totalCount || 0);
        setMatchedCount(data.matchedCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notification logs:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000); // 5-second polling for live stream
    return () => clearInterval(interval);
  }, [fetchLogs]);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimulating(true);
    setSimResult(null);

    try {
      const res = await fetch('/api/notification-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageName: simApp,
          title: simTitle,
          text: simText,
        }),
      });

      const data = await res.json();
      setSimResult(data);
      fetchLogs();
    } catch (err: any) {
      setSimResult({ success: false, error: err.message });
    } finally {
      setSimulating(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/notification-webhook`;
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const setPreset = (app: string, title: string, text: string) => {
    setSimApp(app);
    setSimTitle(title);
    setSimText(text);
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Live Phone Notifications Stream</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Live Ingest Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of all push notifications forwarded from your Android phone to this website.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/UpiListener.apk"
            download="UpiListener.apk"
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Download Android APK (11 MB)</span>
          </a>

          <button
            onClick={copyWebhookUrl}
            className="py-2.5 px-4 rounded-xl glass-card hover:bg-white/5 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all shadow-sm"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copiedUrl ? 'Copied Webhook URL!' : 'Copy Webhook URL'}</span>
          </button>
        </div>
      </div>

      {/* Android Listener Setup Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[11px]">1</span>
            Install APK
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Download <strong className="text-white">UpiListener.apk</strong> on your Android phone (or visit <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded font-mono">http://192.168.1.4:3000/UpiListener.apk</code> in your phone's browser).
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[11px]">2</span>
            Grant Notification Access
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Open the app and tap <strong className="text-white">Grant Notification Access</strong>. In Android Settings, turn the toggle <strong>ON</strong> for UpiListener.
          </p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
            <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[11px]">3</span>
            Auto Verification Active
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tap <strong className="text-white">Test Ping</strong> in the app to confirm server connectivity. Whenever OmniCard / UPI receives money, checkout orders verify instantly!
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Received from Phone</span>
          <div className="text-2xl font-extrabold text-white">{totalCount}</div>
          <p className="text-[11px] text-slate-400">All intercepted notifications</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Reconciled Payments</span>
          <div className="text-2xl font-extrabold text-emerald-400">{matchedCount}</div>
          <p className="text-[11px] text-slate-400">Matched to pending customer orders</p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Verification Speed</span>
          <div className="text-2xl font-extrabold text-amber-400">Instant (&lt;50ms)</div>
          <p className="text-[11px] text-slate-400">Direct HTTP webhook processing</p>
        </div>
      </div>

      {/* Simulator Form */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-white text-sm">Test Notification Simulator</h3>
          </div>
          <span className="text-slate-400 text-xs">Simulate what your Android phone sends</span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-slate-400 text-xs self-center">Presets:</span>
          <button
            type="button"
            onClick={() => setPreset('com.eroute.omnicard', 'OmniCard Alert: Money Added', 'Rs. 150.00 credited to your OmniCard via UPI. UPI Ref: 428190184712')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 font-medium"
          >
            OmniCard (₹150)
          </button>
          <button
            type="button"
            onClick={() => setPreset('com.phonepe.app', 'PhonePe', 'Received ₹250.00 from John Doe (UTR: 881920384712)')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 font-medium"
          >
            PhonePe (₹250)
          </button>
          <button
            type="button"
            onClick={() => setPreset('com.fampay.in', 'FamPay Payment Received', 'You received ₹499.00 via UPI. Ref No: 512398471203')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 font-medium"
          >
            FamPay (₹499)
          </button>
        </div>

        <form onSubmit={handleSimulate} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">App Package Name</label>
              <input
                type="text"
                required
                value={simApp}
                onChange={(e) => setSimApp(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Notification Title</label>
              <input
                type="text"
                required
                value={simTitle}
                onChange={(e) => setSimTitle(e.target.value)}
                className="glass-input w-full px-3 py-2 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-300">Notification Body / Text</label>
            <input
              type="text"
              required
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              className="glass-input w-full px-3 py-2 rounded-xl text-xs font-mono"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            {simResult && (
              <span className={`text-xs font-semibold ${simResult.matched ? 'text-green-400' : 'text-amber-300'}`}>
                {simResult.message || (simResult.matched ? 'Order matched!' : 'Logged as unmatched.')}
              </span>
            )}
            <button
              type="submit"
              disabled={simulating}
              className="ml-auto py-2 px-5 rounded-xl gold-gradient-btn text-xs font-bold flex items-center gap-2 shadow-md hover:brightness-105"
            >
              <Send className="w-3.5 h-3.5" />
              {simulating ? 'Sending...' : 'Simulate Notification Send'}
            </button>
          </div>
        </form>
      </div>

      {/* Notifications Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl space-y-2">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">Intercepted Phone Notifications (Live)</h3>
          <button
            onClick={() => fetchLogs()}
            className="text-slate-400 hover:text-white text-xs flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">App Source</th>
                <th className="py-3.5 px-4">Notification Content</th>
                <th className="py-3.5 px-4">Extracted Amount</th>
                <th className="py-3.5 px-4">12-Digit UTR</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-500" />
                    Loading notifications...
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No phone notifications received yet. Use the simulator above or configure MacroDroid on your phone!
                  </td>
                </tr>
              ) : (
                notifications.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-mono text-[11px] text-amber-400/90 whitespace-nowrap">
                      {item.packageName}
                    </td>
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-white truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">{item.text}</div>
                      {item.matchedOrderId && (
                        <div className="mt-1 text-[11px] text-green-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Matched Order: {item.matchedOrderId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sm text-amber-400 whitespace-nowrap">
                      {item.amount ? `₹${item.amount.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-200 whitespace-nowrap">
                      {item.utr || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.status === 'MATCHED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-500/15 text-green-400 border border-green-500/30">
                          MATCHED
                        </span>
                      ) : item.status === 'UNMATCHED' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          LOGGED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-white/10">
                          IGNORED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(item.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
