'use client';

import React, { useEffect, useState } from 'react';
import {
  Save,
  QrCode,
  Globe,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Trash2,
  AlertTriangle,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [upiId, setUpiId] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<{ text: string; error?: boolean } | null>(null);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearHistoryMsg, setClearHistoryMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [hostUrl, setHostUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setHostUrl(`${window.location.origin}/api/notification-webhook`);
    }

    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setUpiId(data.upiId || '');
          setWebhookUrl(data.webhookUrl || '');
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleClearTransactions = async () => {
    if (
      !confirm(
        '⚠️ ARE YOU SURE? This will permanently delete ALL customer transactions, orders, and phone notification logs. Gateway settings and API keys will NOT be affected.'
      )
    ) {
      return;
    }

    setClearingHistory(true);
    setClearHistoryMsg(null);

    try {
      const res = await fetch('/api/admin/transactions?clearAll=true', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setClearHistoryMsg({ text: `✓ ${data.message || 'All transaction history cleared successfully!'}` });
      } else {
        setClearHistoryMsg({ text: data.error || 'Failed to clear transaction history', error: true });
      }
    } catch (err: any) {
      setClearHistoryMsg({ text: `Network error: ${err.message}`, error: true });
    } finally {
      setClearingHistory(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          upiId,
          webhookUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: 'Gateway configuration updated successfully!' });
      } else {
        setStatusMsg({ text: data.error || 'Failed to update settings', error: true });
      }
    } catch (err: any) {
      setStatusMsg({ text: `Network error: ${err.message}`, error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl.trim()) {
      setWebhookTestResult({ text: 'Please enter a webhook URL first.', error: true });
      return;
    }

    setTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testWebhook: true, webhookUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookTestResult({ text: data.message });
      } else {
        setWebhookTestResult({ text: data.message, error: true });
      }
    } catch (err: any) {
      setWebhookTestResult({ text: `Webhook test network failure: ${err.message}`, error: true });
    } finally {
      setTestingWebhook(false);
    }
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(hostUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Gateway Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure merchant UPI identification, Android notification listener webhook, and external endpoints.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            statusMsg.error
              ? 'bg-red-500/10 text-red-400 border-red-500/20'
              : 'bg-green-500/10 text-green-400 border-green-500/20'
          }`}
        >
          {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          {statusMsg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* UPI Merchant ID */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Merchant UPI Receiving ID</h2>
              <p className="text-[11px] text-slate-400">The Virtual Payment Address (VPA) encoded in customer checkout QR codes</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">UPI ID / VPA</label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="9726147047@omni"
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Customer payments will be addressed directly to this VPA.
            </p>
          </div>
        </div>

        {/* Android Notification Listener App Info */}
        <div className="glass-card rounded-2xl p-6 border border-amber-500/20 bg-amber-500/[0.02] space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Android Notification Listener App</h2>
              <p className="text-[11px] text-slate-400">Real-time payment capture via background Android app</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-300">
              Notification Webhook Ingestion URL (Enter this in Android App):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={hostUrl}
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-amber-400 select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={copyWebhookUrl}
                className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
              >
                {copiedWebhook ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedWebhook ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-white/5 space-y-1.5 text-xs text-slate-300">
              <p className="font-semibold text-amber-300">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Install <code className="text-white">UpiListener.apk</code> on your phone with the OmniCard app.</li>
                <li>Grant Notification Access to capture payment confirmations automatically.</li>
                <li>When money arrives, the app sends the notification payload here in real time.</li>
                <li>View live captured notifications under <strong>Phone Notifications</strong> in the sidebar.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Merchant Webhook Delivery */}
        <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Merchant Webhook URL</h2>
              <p className="text-[11px] text-slate-400">Receive HTTP POST callbacks whenever a payment is confirmed</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Webhook Endpoint URL (Optional)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://yourstore.com/api/payment-callback"
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              <button
                type="button"
                onClick={handleTestWebhook}
                disabled={testingWebhook}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-200 flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${testingWebhook ? 'animate-pulse text-amber-400' : ''}`} />
                {testingWebhook ? 'Testing...' : 'Test'}
              </button>
            </div>

            {webhookTestResult && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
                  webhookTestResult.error
                    ? 'bg-red-500/10 text-red-400 border-red-500/20'
                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                }`}
              >
                {webhookTestResult.error ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                {webhookTestResult.text}
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="gold-gradient-btn px-6 py-2.5 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2 hover:brightness-105 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset / Clear Transaction History */}
      <div className="glass-card rounded-2xl p-6 border border-red-500/30 bg-red-950/10 space-y-4">
        <div className="flex items-center gap-3 border-b border-red-500/20 pb-4">
          <div className="w-9 h-9 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-red-400">Danger Zone: Clear Transaction History</h2>
            <p className="text-[11px] text-slate-400">Permanently purge all past orders, test transactions, and phone notification logs</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          This operation resets all order counters and history back to a clean state. Your gateway UPI ID and API Keys will <strong>NOT</strong> be deleted.
        </p>

        {clearHistoryMsg && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
              clearHistoryMsg.error
                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                : 'bg-green-500/10 text-green-400 border-green-500/20'
            }`}
          >
            {clearHistoryMsg.error ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            {clearHistoryMsg.text}
          </div>
        )}

        <div className="pt-2">
          <button
            type="button"
            onClick={handleClearTransactions}
            disabled={clearingHistory}
            className="px-4 py-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-xs font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {clearingHistory ? 'Purging records...' : 'Clear All Transaction History'}
          </button>
        </div>
      </div>
    </div>
  );
}
