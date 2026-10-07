'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Power,
  ShieldCheck,
  Code2,
  Terminal,
  Clock,
  Layers,
  AlertTriangle,
  Eye,
  EyeOff
} from 'lucide-react';

interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  status: 'ACTIVE' | 'REVOKED';
  totalOrders: number;
  lastUsed: string | null;
  createdAt: string;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Create Key Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<ApiKeyItem | null>(null);

  // Active Doc Tab
  const [activeTab, setActiveTab] = useState<'curl' | 'node' | 'python'>('curl');

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/api-keys');
      if (res.ok) {
        const data = await res.json();
        setKeys(data.apiKeys || []);
      }
    } catch (err) {
      console.error('Failed to fetch API keys:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.apiKey) {
        setCreatedKey(data.apiKey);
        setNewKeyName('');
        fetchKeys();
      } else {
        alert(data.error || 'Failed to create API key');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete API key "${name}"? Any external apps using this key will immediately stop working.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/api-keys?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchKeys();
      }
    } catch (err) {
      console.error('Failed to delete API key:', err);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (fullKey: string) => {
    if (fullKey.length <= 16) return fullKey;
    return `${fullKey.slice(0, 11)}••••••••••••••••${fullKey.slice(-4)}`;
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Merchant API Keys</h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Developer System
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create named API keys to programmatically generate checkout links from your websites, apps, or bots.
          </p>
        </div>

        <button
          onClick={() => {
            setCreatedKey(null);
            setShowCreateModal(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-xs font-black text-slate-950 flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Create New API Key</span>
        </button>
      </div>

      {/* Newly Created Key Alert Box */}
      {createdKey && (
        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
              API Key Generated: "{createdKey.name}"
            </div>
            <button
              onClick={() => setCreatedKey(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              ✕ Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-300">
            Please copy this key now. For your security, authenticate your requests by passing this in the <code className="text-emerald-300 bg-black/40 px-1 py-0.5 rounded font-mono">x-api-key</code> header:
          </p>
          <div className="flex items-center gap-2 bg-slate-950/80 p-3 rounded-xl border border-emerald-500/20 font-mono text-xs text-emerald-300 overflow-x-auto">
            <span className="flex-1 select-all">{createdKey.key}</span>
            <button
              onClick={() => copyToClipboard(createdKey.key, 'newly-created')}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
            >
              {copiedId === 'newly-created' ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Key
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* API Keys Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-sm">Active & Configured Keys ({keys.length})</h3>
            <p className="text-xs text-slate-400">Keys authorized to invoke payment creation endpoints</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading API keys...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-white text-sm">No API Keys Created Yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Generate an API key to integrate this gateway into your WooCommerce store, Telegram bot, or external websites.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create First API Key
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-white/5 text-[11px]">
                <tr>
                  <th className="py-3.5 px-5">Name & Label</th>
                  <th className="py-3.5 px-5">API Key Token</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Orders</th>
                  <th className="py-3.5 px-5">Last Used</th>
                  <th className="py-3.5 px-5">Created</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((k) => {
                  const isRevealed = revealedKeys[k.id];
                  return (
                    <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-5">
                        <div className="font-bold text-white">{k.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {k.id.slice(-6)}</div>
                      </td>

                      <td className="py-4 px-5 font-mono">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300">
                            {isRevealed ? k.key : maskKey(k.key)}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleReveal(k.id)}
                            className="p-1 hover:text-white text-slate-500 transition-colors"
                            title={isRevealed ? 'Mask key' : 'Reveal key'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(k.key, k.id)}
                            className="p-1 hover:text-amber-400 text-slate-500 transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedId === k.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            k.status === 'ACTIVE'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              k.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          {k.status}
                        </span>
                      </td>

                      <td className="py-4 px-5 font-bold text-slate-300">
                        {k.totalOrders}
                      </td>

                      <td className="py-4 px-5 text-slate-400">
                        {k.lastUsed ? new Date(k.lastUsed).toLocaleString() : 'Never'}
                      </td>

                      <td className="py-4 px-5 text-slate-500">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleStatus(k.id, k.status)}
                            title={k.status === 'ACTIVE' ? 'Revoke this API Key' : 'Reactivate API Key'}
                            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                              k.status === 'ACTIVE'
                                ? 'border-amber-500/30 hover:bg-amber-500/10 text-amber-400'
                                : 'border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>{k.status === 'ACTIVE' ? 'Revoke' : 'Activate'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(k.id, k.name)}
                            title="Delete permanently"
                            className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Developer Integration Code Guide */}
      <div className="glass-card rounded-2xl border border-white/10 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm">How to Use Your API Keys</h3>
              <p className="text-xs text-slate-400">Generate checkout sessions from any external platform or bot</p>
            </div>
          </div>

          <div className="flex gap-1.5 bg-slate-900/60 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('curl')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'curl' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveTab('node')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'node' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Node.js
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'python' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Python
            </button>
          </div>
        </div>

        {activeTab === 'curl' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Pass your key in the <code className="text-amber-300 bg-black/40 px-1 py-0.5 rounded font-mono">x-api-key</code> header:
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-white/5 leading-relaxed">
{`curl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/create-order" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${keys[0]?.key || 'og_live_your_api_key_here'}" \\
  -d '{
    "amount": 250.00,
    "customOrderId": "MY_STORE_ORD_101"
  }'`}
            </pre>
          </div>
        )}

        {activeTab === 'node' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              JavaScript (Fetch / Axios in Next.js, Express, or Node):
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-white/5 leading-relaxed">
{`const response = await fetch("${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/create-order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": "${keys[0]?.key || 'og_live_your_api_key_here'}",
  },
  body: JSON.stringify({
    amount: 250.00,
    customOrderId: "ORDER_9942",
  }),
});

const data = await response.json();
console.log("Customer Checkout URL:", data.checkoutUrl);
// Redirect user to data.checkoutUrl`}
            </pre>
          </div>
        )}

        {activeTab === 'python' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-300">
              Python (<code className="text-amber-300 font-mono">requests</code> for Telegram Bot / Flask / Django):
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-xs overflow-x-auto border border-white/5 leading-relaxed">
{`import requests

res = requests.post(
    "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/create-order",
    headers={"x-api-key": "${keys[0]?.key || 'og_live_your_api_key_here'}"},
    json={"amount": 250.00, "customOrderId": "TG_ORDER_481"}
)

checkout_info = res.json()
print("Checkout URL:", checkout_info.get("checkoutUrl"))`}
            </pre>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-white/10 space-y-5 bg-[#0b101b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Create New API Key</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Key Name / Platform Identifier
                </label>
                <input
                  type="text"
                  required
                  placeholder='e.g. "Main Shopify Store", "Discord Bot", "Mobile App"'
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 text-xs"
                />
                <p className="text-[11px] text-slate-400">
                  A recognizable label so you can track which platform or client is making payment requests.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2"
                >
                  {creating ? 'Generating...' : 'Generate API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
