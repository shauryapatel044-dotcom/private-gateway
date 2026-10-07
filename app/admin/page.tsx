'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  IndianRupee,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Plus,
  ArrowUpDown,
  Filter,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface TransactionItem {
  id: string;
  orderId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  utr: string | null;
  apiKeyName?: string | null;
  createdAt: string;
  expiresAt: string;
}

interface StatsData {
  totalRevenue: number;
  totalTransactions: number;
  successCount: number;
  pendingCount: number;
  failedCount: number;
  conversionRate: number;
}

export default function AdminOverviewPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalRevenue: 0,
    totalTransactions: 0,
    successCount: 0,
    pendingCount: 0,
    failedCount: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New order creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAmount, setNewAmount] = useState('100');
  const [creating, setCreating] = useState(false);

  const fetchTransactions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'ALL') params.append('status', filterStatus);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/transactions?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchTransactions();
    // Auto-refresh every 10 seconds to catch live updates
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, [fetchTransactions]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(newAmount) }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutUrl) {
        setShowCreateModal(false);
        fetchTransactions();
        window.open(data.checkoutUrl, '_blank');
      }
    } catch (err) {
      console.error('Order creation failed:', err);
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> PENDING
          </span>
        );
      case 'FAILED':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Order Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Payment Gateway Overview</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time reconciliation of OmniCard & FamPay UPI payments via Gmail IMAP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchTransactions()}
            className="p-2.5 rounded-xl glass-card hover:bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/admin/emails"
            className="py-2.5 px-4 rounded-xl glass-card hover:bg-white/5 text-amber-400 border border-amber-500/30 flex items-center gap-2 text-xs font-bold transition-all shadow-sm"
          >
            <Mail className="w-4 h-4" /> OmniCard Gmails
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="py-2.5 px-4 rounded-xl gold-gradient-btn flex items-center gap-2 text-xs font-bold shadow-md hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4" /> Create Test Order
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">
            ₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Reconciled via IMAP
          </p>
        </div>

        {/* Total Transactions */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.totalTransactions}</div>
          <p className="text-[11px] text-slate-400">All registered checkout sessions</p>
        </div>

        {/* Successful Transactions */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Verified Payments</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{stats.successCount}</div>
          <p className="text-[11px] text-slate-400">
            Conversion Rate: <span className="text-amber-400 font-semibold">{stats.conversionRate}%</span>
          </p>
        </div>

        {/* Pending Orders */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Pending Orders</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{stats.pendingCount}</div>
          <p className="text-[11px] text-slate-400">Awaiting bank confirmation email</p>
        </div>
      </div>

      {/* Transactions Section */}
      <div id="transactions" className="space-y-4">
        {/* Table Controls (Search & Status Filter) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID or UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input w-full pl-9 pr-3.5 py-2 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'PENDING', 'SUCCESS', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === st
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white glass-card'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Live Table */}
        <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">12-Digit UTR</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading live transactions...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No transactions found matching criteria.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{tx.orderId}</span>
                          <button
                            onClick={() => copyToClipboard(tx.orderId, tx.id)}
                            className="text-slate-500 hover:text-slate-300 transition-colors"
                            title="Copy Order ID"
                          >
                            {copiedId === tx.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        {tx.apiKeyName && (
                          <span className="text-[10px] text-amber-400/90 font-sans block mt-0.5">
                            🔑 {tx.apiKeyName}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400 text-sm">
                        ₹{tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(tx.status)}</td>
                      <td className="py-3.5 px-4 font-mono">
                        {tx.utr ? (
                          <span className="text-white font-semibold bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            {tx.utr}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">Pending receipt</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(tx.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/checkout/${tx.orderId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 hover:border-amber-500/40 text-[11px] font-medium transition-all"
                        >
                          Checkout <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-card max-w-sm w-full p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create Test Payment Order</h3>
            <p className="text-xs text-slate-400">
              Generates a new PENDING order with a dynamic 15-minute checkout URL and UPI QR code.
            </p>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Amount (INR)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="glass-input w-full pl-8 pr-3.5 py-2.5 rounded-xl text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                {[10, 50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNewAmount(amt.toString())}
                    className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-medium text-slate-300 border border-white/5"
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl gold-gradient-btn text-xs font-bold shadow-md hover:brightness-105"
                >
                  {creating ? 'Generating...' : 'Launch Checkout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
