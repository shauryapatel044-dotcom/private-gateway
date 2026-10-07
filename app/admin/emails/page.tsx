'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  X,
  ExternalLink,
  ShieldAlert,
  Inbox,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface OmniCardEmail {
  id: string;
  folder: string;
  from: string;
  subject: string;
  date: string;
  type: 'CREDIT' | 'DEBIT' | 'NOTIFICATION';
  amount: number | null;
  utr: string | null;
  matchedOrderId: string | null;
  matchedStatus: string | null;
  snippet: string;
  fullBody?: string;
  isUnread?: boolean;
}

interface EmailStats {
  totalCredits: number;
  totalDebits: number;
  creditCount: number;
  debitCount: number;
}

export default function OmniCardEmailsPage() {
  const [emails, setEmails] = useState<OmniCardEmail[]>([]);
  const [stats, setStats] = useState<EmailStats>({
    totalCredits: 0,
    totalDebits: 0,
    creditCount: 0,
    debitCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isLiveImap, setIsLiveImap] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [isEmptyLive, setIsEmptyLive] = useState(false);
  const [realCount, setRealCount] = useState(0);
  const [imapError, setImapError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');
  const [folderFilter, setFolderFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal / Selected Email
  const [selectedEmail, setSelectedEmail] = useState<OmniCardEmail | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchEmails = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'ALL') params.append('type', typeFilter);
      if (folderFilter !== 'ALL') params.append('folder', folderFilter);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/admin/emails?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails || []);
        if (data.stats) setStats(data.stats);
        setIsLiveImap(Boolean(data.isLiveImap));
        setHasCredentials(Boolean(data.hasCredentials));
        setConnectedEmail(data.connectedEmail || null);
        setIsEmptyLive(Boolean(data.isEmptyLive));
        setRealCount(data.realCount || 0);
        setImapError(data.imapError || null);
      }
    } catch (err) {
      console.error('Failed to load OmniCard emails:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, folderFilter, searchQuery]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getFolderBadge = (folder: string) => {
    if (folder.includes('Spam')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <AlertTriangle className="w-3 h-3" /> Spam
        </span>
      );
    }
    if (folder.includes('Trash') || folder.includes('Bin')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-700/50 text-slate-300 border border-white/10">
          <Trash2 className="w-3 h-3" /> Trash
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <Inbox className="w-3 h-3" /> Inbox
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">OmniCard Financial Emails</h1>
            {loading ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <RefreshCw className="w-3 h-3 animate-spin" /> Connecting to Gmail...
              </span>
            ) : isLiveImap || connectedEmail || hasCredentials ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-400 border border-green-500/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live IMAP Connected ({connectedEmail || 'nikkipritspatel@gmail.com'})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-white/10">
                Demo Preview Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time feed of all incoming (Received/Credited) and outgoing (Debited/Spent) emails across Gmail folders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchEmails()}
            disabled={refreshing}
            className="py-2.5 px-4 rounded-xl gold-gradient-btn flex items-center gap-2 text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Scanning Gmail...' : 'Scan Mailbox Now'}
          </button>
        </div>
      </div>

      {/* Live Connected Status Banner */}
      {isLiveImap && isEmptyLive && (
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-white">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span>Gmail IMAP Authenticated Successfully ({connectedEmail})</span>
          </div>
          <p className="text-slate-300">
            We searched your <code className="text-amber-300">INBOX</code>, <code className="text-amber-300">Spam</code>, and <code className="text-amber-300">Trash</code>, but found <strong>0 emails from OmniCard or FamPay</strong> in this specific mailbox.
          </p>
          <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-white/5 space-y-1">
            <p className="text-amber-300 font-semibold">How to receive payments here:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Confirm if your OmniCard profile has <strong className="text-white">{connectedEmail}</strong> registered for transaction alerts.</li>
              <li>Try sending ₹10 to your OmniCard UPI ID (<strong className="text-white">9726147047@omni</strong>). Once the bank alert email lands, click <em>Scan Mailbox Now</em>!</li>
              <li>Displaying sample OmniCard receipts below so you can test the table and features in the meantime.</li>
            </ul>
          </div>
        </div>
      )}

      {/* Notice if IMAP is not yet configured */}
      {!hasCredentials && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              Gmail IMAP credentials not configured yet. Currently displaying sample OmniCard credit/debit receipts.
            </span>
          </div>
          <Link
            href="/admin/settings"
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 text-xs shrink-0 text-center transition-colors"
          >
            Connect Gmail Account →
          </Link>
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Money Received (Credited) */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Money Received / Added</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            +₹{stats.totalCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.creditCount} Credit / UPI Inward receipts
          </p>
        </div>

        {/* Total Money Spent (Debited) */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Money Spent / Debited</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400">
            -₹{stats.totalDebits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[11px] text-slate-400">
            {stats.debitCount} Card purchases / Outward debits
          </p>
        </div>

        {/* Multi-Folder Coverage */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Folders Scanned</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-sm font-bold text-white pt-1">
            INBOX, Spam, Trash
          </div>
          <p className="text-[11px] text-slate-400">Catches hidden or filtered receipts</p>
        </div>

        {/* Total Emails */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total OmniCard Emails</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white">{emails.length}</div>
          <p className="text-[11px] text-amber-400 font-medium">Logged in ledger</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by UTR, Amount, Merchant, or Subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="glass-input w-full pl-9 pr-3.5 py-2 rounded-xl text-xs"
          />
        </div>

        {/* Type & Folder Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                typeFilter === 'ALL' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter('CREDIT')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                typeFilter === 'CREDIT' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Received
            </button>
            <button
              onClick={() => setTypeFilter('DEBIT')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                typeFilter === 'DEBIT' ? 'bg-rose-500 text-slate-950 shadow' : 'text-slate-400 hover:text-rose-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" /> Debited
            </button>
          </div>

          {/* Folder Filter */}
          <select
            value={folderFilter}
            onChange={(e) => setFolderFilter(e.target.value)}
            className="glass-input px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 text-slate-300 border border-white/10"
          >
            <option value="ALL">All Folders</option>
            <option value="INBOX">INBOX Only</option>
            <option value="Spam">Spam Only</option>
            <option value="Trash">Trash Only</option>
          </select>
        </div>
      </div>

      {/* Emails Table */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">12-Digit UTR</th>
                <th className="py-3.5 px-4">Subject & Details</th>
                <th className="py-3.5 px-4">Folder</th>
                <th className="py-3.5 px-4">Date / Time</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching OmniCard financial receipts...
                  </td>
                </tr>
              ) : emails.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No OmniCard emails found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                emails.map((mail) => (
                  <tr key={mail.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Type Badge */}
                    <td className="py-3.5 px-4">
                      {mail.type === 'CREDIT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <ArrowDownLeft className="w-3.5 h-3.5" /> RECEIVED
                        </span>
                      ) : mail.type === 'DEBIT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <ArrowUpRight className="w-3.5 h-3.5" /> DEBITED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          NOTICE
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 font-mono font-bold text-sm whitespace-nowrap">
                      {mail.amount ? (
                        <span className={mail.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}>
                          {mail.type === 'CREDIT' ? '+' : '-'}₹{mail.amount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">N/A</span>
                      )}
                    </td>

                    {/* 12-Digit UTR */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {mail.utr ? (
                        <div className="inline-flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10 text-slate-200">
                          <span>{mail.utr}</span>
                          <button
                            onClick={() => copyToClipboard(mail.utr!, mail.id)}
                            className="text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                            title="Copy UTR"
                          >
                            {copiedId === mail.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Subject & Matched Order */}
                    <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                      <div className="font-medium text-white truncate">{mail.subject}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{mail.snippet}</div>

                      {/* If matched to a customer transaction */}
                      {mail.matchedOrderId && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Reconciled Order: </span>
                          <Link
                            href={`/checkout/${mail.matchedOrderId}`}
                            target="_blank"
                            className="font-mono underline hover:text-amber-300"
                          >
                            {mail.matchedOrderId}
                          </Link>
                        </div>
                      )}
                    </td>

                    {/* Folder */}
                    <td className="py-3.5 px-4 whitespace-nowrap">{getFolderBadge(mail.folder)}</td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(mail.date).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedEmail(mail)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-[11px] font-medium transition-colors"
                      >
                        <Eye className="w-3 h-3" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Body Inspector Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="glass-card max-w-2xl w-full rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  {selectedEmail.type === 'CREDIT' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ArrowDownLeft className="w-3.5 h-3.5" /> MONEY RECEIVED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <ArrowUpRight className="w-3.5 h-3.5" /> MONEY DEBITED
                    </span>
                  )}
                  {getFolderBadge(selectedEmail.folder)}
                </div>
                <h3 className="text-base font-bold text-white mt-1.5">{selectedEmail.subject}</h3>
                <p className="text-xs text-slate-400">From: {selectedEmail.from}</p>
              </div>

              <button
                onClick={() => setSelectedEmail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Details Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-900/60 p-3 rounded-xl border border-white/5 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Amount</span>
                <span
                  className={`text-base font-bold font-mono ${
                    selectedEmail.type === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {selectedEmail.amount ? `₹${selectedEmail.amount.toFixed(2)}` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">12-Digit UTR</span>
                <span className="text-white font-mono font-bold">{selectedEmail.utr || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">Timestamp</span>
                <span className="text-slate-300">
                  {new Date(selectedEmail.date).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Full Email Body */}
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-slate-300">Raw Email Message Content:</span>
              <div className="bg-slate-950 p-4 rounded-xl border border-white/5 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {selectedEmail.fullBody || selectedEmail.snippet}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              {selectedEmail.matchedOrderId ? (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Matched to Order {selectedEmail.matchedOrderId}
                </div>
              ) : (
                <div className="text-xs text-slate-400">Not linked to any checkout session</div>
              )}

              <button
                onClick={() => setSelectedEmail(null)}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-white/10"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
