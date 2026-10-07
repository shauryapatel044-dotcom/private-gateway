'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Settings,
  LogOut,
  RefreshCw,
  Shield,
  ExternalLink,
  ChevronRight,
  Inbox,
  Mail,
  Bell,
  CheckCircle2,
  AlertCircle,
  KeyRound
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Skip auth layout on login page
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isLoginPage) {
      setAuthChecked(true);
      return;
    }

    // Verify session
    fetch('/api/admin/auth')
      .then((res) => {
        if (!res.ok) {
          router.push('/admin/login');
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        router.push('/admin/login');
      });
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const handleTriggerSync = async () => {
    setSyncing(true);
    setShowSyncModal(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/trigger-imap-sync', { method: 'POST' });
      const data = await res.json();
      setSyncResult(data);
    } catch (err: any) {
      setSyncResult({ success: false, error: err.message, logs: ['Network failure'] });
    } finally {
      setSyncing(false);
    }
  };

  if (!authChecked && !isLoginPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c14]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Authenticating admin...</p>
        </div>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Transactions', href: '/admin#transactions', icon: Receipt },
    { label: 'API Keys', href: '/admin/api-keys', icon: KeyRound },
    { label: 'Phone Notifications', href: '/admin/notifications', icon: Bell },
    { label: 'OmniCard Gmails', href: '/admin/emails', icon: Mail },
    { label: 'Gateway Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 glass-panel border-r border-white/5 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo / Title */}
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white tracking-wide text-sm">UPI GATEWAY</h2>
              <p className="text-[10px] text-amber-400 font-medium">OmniCard / FamPay IMAP</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === '/admin' && pathname === '/admin');
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sync Trigger Action & Session Bottom Box */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <button
            onClick={handleTriggerSync}
            disabled={syncing}
            className="w-full py-2.5 px-3 rounded-xl gold-gradient-btn flex items-center justify-center gap-2 text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing IMAP...' : 'Trigger IMAP Sync'}
          </button>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate">Logged in as admin</span>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300 transition-colors p-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-white/5 glass-panel px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-amber-400 font-medium capitalize">
              {pathname === '/admin' ? 'Overview' : pathname.replace('/admin/', '')}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-amber-500/40 transition-colors"
            >
              Test Checkout <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">{children}</div>
      </main>

      {/* IMAP Sync Live Output Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass-card max-w-xl w-full rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className={`w-5 h-5 text-amber-400 ${syncing ? 'animate-spin' : ''}`} />
                <h3 className="font-bold text-white text-base">IMAP Verification Sync</h3>
              </div>
              <button
                onClick={() => setShowSyncModal(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                Close
              </button>
            </div>

            {syncing && (
              <div className="py-6 text-center space-y-2">
                <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-300">
                  Scanning Gmail folders: INBOX, [Gmail]/Spam, [Gmail]/Trash...
                </p>
              </div>
            )}

            {syncResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {syncResult.success ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Scan Completed Successfully
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      <AlertCircle className="w-3.5 h-3.5" /> Errors Encountered
                    </span>
                  )}
                  <span className="text-xs text-slate-400">
                    Matched: <strong className="text-amber-400">{syncResult.matchedCount || 0}</strong> orders
                  </span>
                </div>

                <div className="bg-slate-950 rounded-xl p-3 max-h-60 overflow-y-auto font-mono text-[11px] text-slate-300 border border-white/5 space-y-1">
                  {syncResult.logs?.map((l: string, i: number) => (
                    <div
                      key={i}
                      className={
                        l.includes('[MATCH FOUND]')
                          ? 'text-green-400 font-bold'
                          : l.includes('[Fatal]') || l.includes('[Error]')
                          ? 'text-red-400'
                          : l.includes('[Folder]')
                          ? 'text-amber-300 font-semibold'
                          : 'text-slate-400'
                      }
                    >
                      {l}
                    </div>
                  ))}
                </div>

                {syncResult.matchedTransactions?.length > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl text-xs space-y-1">
                    <p className="font-semibold text-green-300">Reconciled Transactions:</p>
                    {syncResult.matchedTransactions.map((tx: any, idx: number) => (
                      <div key={idx} className="text-slate-200">
                        Order: <span className="font-mono text-white font-bold">{tx.orderId}</span> | ₹{tx.amount} | UTR: {tx.utr}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
