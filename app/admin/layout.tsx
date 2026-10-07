'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Settings,
  LogOut,
  Shield,
  ExternalLink,
  ChevronRight,
  Bell,
  KeyRound,
  Smartphone
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
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
              <p className="text-[10px] text-amber-400 font-medium">Android Notification Sync</p>
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

        {/* Status Box & Session */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <Link
            href="/admin/notifications"
            className="w-full py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 flex items-center justify-between text-xs font-semibold text-slate-300 transition-all hover:text-white"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-amber-400" />
              Listener App
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </Link>

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
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Gateway Active
            </span>
            <Link
              href="/"
              target="_blank"
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-amber-500/40 transition-colors"
            >
              Launch Testbench <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">{children}</div>
      </main>
    </div>
  );
}
