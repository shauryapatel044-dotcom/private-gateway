'use client';

import React, { useEffect, useState } from 'react';
import {
  Save,
  KeyRound,
  Mail,
  QrCode,
  Globe,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Eye,
  EyeOff,
  Send,
  RefreshCw,
  FolderTree
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [upiId, setUpiId] = useState('');
  const [imapEmail, setImapEmail] = useState('');
  const [imapAppPassword, setImapAppPassword] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [webhookTestResult, setWebhookTestResult] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setUpiId(data.upiId || '');
          setImapEmail(data.imapEmail || '');
          setWebhookUrl(data.webhookUrl || '');
          if (data.imapAppPassword) {
            setImapAppPassword(data.imapAppPassword);
          }
        }
      })
      .catch((err) => console.error('Failed to load settings:', err))
      .finally(() => setLoading(false));
  }, []);

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
          imapEmail,
          imapAppPassword,
          webhookUrl,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ text: 'Gateway configuration saved successfully!' });
      } else {
        setStatusMsg({ text: data.error || 'Failed to save settings', error: true });
      }
    } catch {
      setStatusMsg({ text: 'Network error saving settings', error: true });
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      setWebhookTestResult({ text: 'Please enter a webhook URL first.', error: true });
      return;
    }
    setTestingWebhook(true);
    setWebhookTestResult(null);

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          testWebhook: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setWebhookTestResult({ text: data.message });
      } else {
        setWebhookTestResult({ text: data.message || 'Webhook failed', error: true });
      }
    } catch (err: any) {
      setWebhookTestResult({ text: `Failed: ${err.message}`, error: true });
    } finally {
      setTestingWebhook(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-white">Gateway & Verification Settings</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure merchant UPI identification, Gmail IMAP credentials, and webhook endpoints.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2.5 text-xs font-semibold ${
            statusMsg.error
              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
          }`}
        >
          {statusMsg.error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Merchant UPI Configuration */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Merchant UPI Identifier</h2>
              <p className="text-[11px] text-slate-400">Used to dynamically generate checkout UPI QR codes</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Merchant UPI ID / VPA
            </label>
            <input
              type="text"
              required
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="merchant@fam or yourname@omnicard"
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
            />
            <p className="text-[11px] text-slate-500">
              Payments sent to this UPI ID will generate incoming transaction confirmation emails in your registered mailbox.
            </p>
          </div>
        </div>

        {/* Gmail IMAP Configuration */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-white/10 pb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Gmail IMAP Configuration</h2>
              <p className="text-[11px] text-slate-400">Automated multi-folder email scanning for OmniCard / FamPay receipts</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Gmail Address
              </label>
              <input
                type="email"
                required
                value={imapEmail}
                onChange={(e) => setImapEmail(e.target.value)}
                placeholder="merchant.payments@gmail.com"
                className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Google App Password (16-char)
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-amber-400 hover:text-amber-300 text-xs font-semibold flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide Password' : 'Show Password'}</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={imapAppPassword}
                  onChange={(e) => setImapAppPassword(e.target.value)}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="glass-input w-full pl-3.5 pr-10 py-2.5 rounded-xl text-xs font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Folder Coverage Notice */}
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-white/5 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <FolderTree className="w-3.5 h-3.5" /> Multi-Folder Scanning Active
            </div>
            <p className="text-slate-400">
              The engine automatically polls: <code className="text-slate-200">INBOX</code>, <code className="text-slate-200">[Gmail]/Spam</code>, and <code className="text-slate-200">[Gmail]/Trash</code> (or <code className="text-slate-200">[Gmail]/Bin</code>) to ensure transaction emails flagged by Google filters are never missed.
            </p>
          </div>
        </div>

        {/* Webhook Configuration */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Merchant Webhook Endpoint</h2>
                <p className="text-[11px] text-slate-400">Receives verified payment notifications via HTTP POST</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTestWebhook}
              disabled={testingWebhook || !webhookUrl}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 disabled:opacity-40 transition-colors"
            >
              <Send className="w-3 h-3" />
              {testingWebhook ? 'Dispatching...' : 'Test Webhook'}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">
              Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://yourstore.com/api/payment-webhook"
              className="glass-input w-full px-3.5 py-2.5 rounded-xl text-xs font-mono"
            />
          </div>

          {webhookTestResult && (
            <div
              className={`p-3 rounded-xl text-xs ${
                webhookTestResult.error
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              {webhookTestResult.text}
            </div>
          )}

          <div className="bg-slate-950 p-3.5 rounded-xl border border-white/5 space-y-1 font-mono text-[11px] text-slate-400">
            <p className="text-slate-300 font-semibold mb-1">Webhook JSON Payload Example:</p>
            <pre className="text-amber-400/90 whitespace-pre-wrap">
{`{
  "event": "PAYMENT_SUCCESS",
  "orderId": "ORD_1728210492_ABC",
  "amount": 250.00,
  "utr": "428190184712",
  "status": "SUCCESS",
  "timestamp": "2026-10-06T05:00:00.000Z"
}`}
            </pre>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="py-3 px-6 rounded-xl gold-gradient-btn flex items-center gap-2 text-xs font-bold shadow-lg hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
