'use client';

import React, { useEffect, useState, useCallback, use } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  Clock,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface OrderData {
  orderId: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  utr: string | null;
  upiId: string;
  createdAt: string;
  expiresAt: string;
  isExpired: boolean;
  secondsRemaining: number;
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }> | { orderId: string };
}) {
  // Unwrap params using React.use() if it's a promise, or directly
  const unwrappedParams = typeof (params as any).then === 'function' ? use(params as Promise<{ orderId: string }>) : (params as { orderId: string });
  const { orderId } = unwrappedParams;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(900); // 15 mins default
  const [isVerifying, setIsVerifying] = useState(false);
  const [manualUtr, setManualUtr] = useState('');
  const [manualUtrMsg, setManualUtrMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [showUtrInput, setShowUtrInput] = useState(false);

  // Fetch current order status
  const fetchOrderStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/order-status?orderId=${encodeURIComponent(orderId)}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Order not found. Please verify the URL or create a new checkout session.');
        } else {
          setError('Unable to fetch order details.');
        }
        setLoading(false);
        return null;
      }
      const data: OrderData = await res.json();
      setOrder(data);
      setLoading(false);

      if (data.secondsRemaining !== undefined) {
        setSecondsLeft(data.secondsRemaining);
      }
      return data;
    } catch (err: any) {
      console.error('Polling error:', err);
      return null;
    }
  }, [orderId]);

  // Initial load
  useEffect(() => {
    fetchOrderStatus();
  }, [fetchOrderStatus]);

  // Polling every 5 seconds while PENDING
  useEffect(() => {
    if (!order || order.status !== 'PENDING' || secondsLeft <= 0) {
      return;
    }

    const intervalId = setInterval(async () => {
      const updated = await fetchOrderStatus();
      if (updated && updated.status === 'SUCCESS') {
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [order, secondsLeft, fetchOrderStatus]);

  // Countdown timer effect
  useEffect(() => {
    if (!order || order.status !== 'PENDING' || secondsLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchOrderStatus(); // update status when expired
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [order, secondsLeft, fetchOrderStatus]);

  const copyToClipboard = (text: string, type: 'upi' | 'amount') => {
    navigator.clipboard.writeText(text);
    if (type === 'upi') {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const handleInstantVerify = async () => {
    setIsVerifying(true);
    setManualUtrMsg(null);
    try {
      // Trigger IMAP check
      await fetch('/api/trigger-imap-sync', { method: 'POST' });
      const updated = await fetchOrderStatus();
      if (updated?.status === 'SUCCESS') {
        // Updated!
      } else {
        setManualUtrMsg({ text: 'Sync ran: No matching bank email found yet. If you just paid, please allow 10-30 seconds.' });
      }
    } catch {
      setManualUtrMsg({ text: 'Failed to verify. Please try again.', error: true });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{12}$/.test(manualUtr.trim())) {
      setManualUtrMsg({ text: 'UTR must be exactly 12 numeric digits.', error: true });
      return;
    }

    setIsVerifying(true);
    setManualUtrMsg(null);
    try {
      const res = await fetch('/api/verify-manual-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, utr: manualUtr.trim() }),
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setOrder((prev) => (prev ? { ...prev, status: 'SUCCESS', utr: manualUtr.trim() } : null));
        setManualUtrMsg({ text: 'Payment confirmed and verified!' });
      } else {
        setManualUtrMsg({ text: data.message || 'Verification pending email arrival.' });
      }
    } catch {
      setManualUtrMsg({ text: 'Verification request failed.', error: true });
    } finally {
      setIsVerifying(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c14] p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-slate-400 font-medium">Securing payment session...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c14] p-4">
        <div className="glass-card max-w-md w-full p-8 rounded-2xl text-center space-y-4">
          <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">Payment Session Error</h2>
          <p className="text-slate-400 text-sm">{error || 'Order could not be loaded.'}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 text-sm font-medium pt-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Merchant Gateway
          </Link>
        </div>
      </div>
    );
  }

  // Exact UPI intent string according to specifications:
  // upi://pay?pa={upiId}&pn=Merchant&am={amount}&tr={orderId}
  const upiIntentUrl = `upi://pay?pa=${encodeURIComponent(order.upiId)}&pn=Merchant&am=${order.amount.toFixed(2)}&tr=${encodeURIComponent(order.orderId)}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-10 bg-[#080c14]">
      {/* Brand Header */}
      <div className="mb-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          OmniCard & FamPay Verified Gateway
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white">
          Secure UPI Checkout
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Order ID: <span className="font-mono text-slate-300">{order.orderId}</span></p>
      </div>

      <div className="glass-card max-w-md w-full rounded-2xl p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl relative overflow-hidden">
        {/* Glow Accent Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

        {/* ================= SUCCESS STATE ================= */}
        {order.status === 'SUCCESS' ? (
          <div className="py-6 text-center space-y-5 animate-in fade-in duration-500">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-green-400 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Payment Confirmed!</h2>
              <p className="text-slate-400 text-sm mt-1">
                Your transaction has been verified via bank confirmation email.
              </p>
            </div>

            <div className="bg-slate-900/70 border border-white/5 rounded-xl p-4 text-left space-y-2.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Amount Paid</span>
                <span className="text-white font-bold text-sm">₹{order.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Order ID</span>
                <span className="text-slate-200">{order.orderId}</span>
              </div>
              {order.utr && (
                <div className="flex justify-between text-slate-400 pt-1 border-t border-white/5">
                  <span className="text-amber-400 font-semibold">Bank UTR</span>
                  <span className="text-amber-300 font-bold">{order.utr}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Status</span>
                <span className="text-green-400 font-semibold uppercase tracking-wider">SUCCESS</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/admin"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl gold-gradient-btn text-sm font-semibold shadow-lg"
              >
                Go to Admin Dashboard <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        ) : order.status === 'FAILED' || secondsLeft <= 0 ? (
          /* ================= EXPIRED / FAILED STATE ================= */
          <div className="py-6 text-center space-y-5 animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-400">
              <Clock className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Session Expired</h2>
              <p className="text-slate-400 text-sm mt-1">
                The 15-minute payment window for this order has expired.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-white/5 rounded-xl p-4 text-xs text-slate-400">
              If your account was already debited, please contact the merchant with your 12-digit UTR reference number.
            </div>

            <Link
              href="/"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold border border-white/10"
            >
              Create New Order
            </Link>
          </div>
        ) : (
          /* ================= ACTIVE PAYMENT STATE ================= */
          <div className="space-y-6">
            {/* Amount & Timer Header */}
            <div className="flex items-center justify-between bg-slate-900/80 border border-white/5 p-4 rounded-xl">
              <div>
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Amount to Pay</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400 tracking-tight">
                    ₹{order.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(order.amount.toFixed(2), 'amount')}
                    className="text-slate-400 hover:text-slate-200 transition-colors p-1"
                    title="Copy Amount"
                  >
                    {copiedAmount ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Countdown Pill */}
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block">Expires In</span>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-sm font-bold mt-0.5">
                  <Clock className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                  {formatTime(secondsLeft)}
                </div>
              </div>
            </div>

            {/* Visual Timer Progress Bar */}
            <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-yellow-400 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${Math.min(100, (secondsLeft / 900) * 100)}%` }}
              />
            </div>

            {/* Dynamic UPI QR Code Display */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative p-4 bg-white rounded-2xl shadow-xl border-4 border-amber-500/30 group">
                {/* Glowing Corner Accents */}
                <div className="absolute -top-1.5 -left-1.5 w-4 h-4 border-t-2 border-l-2 border-amber-500" />
                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 border-t-2 border-r-2 border-amber-500" />
                <div className="absolute -bottom-1.5 -left-1.5 w-4 h-4 border-b-2 border-l-2 border-amber-500" />
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 border-b-2 border-r-2 border-amber-500" />

                <QRCodeSVG
                  value={upiIntentUrl}
                  size={210}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-xs text-slate-400 mt-3 text-center">
                Scan with any UPI App (<span className="text-slate-300">FamPay, PhonePe, GPay, Paytm</span>)
              </p>
            </div>

            {/* Mobile UPI Deep Link Button */}
            <div className="space-y-2">
              <a
                href={upiIntentUrl}
                className="w-full py-3 px-4 rounded-xl gold-gradient-btn flex items-center justify-center gap-2 text-sm font-semibold shadow-lg hover:brightness-105 active:scale-[0.99] transition-all"
              >
                <Smartphone className="w-4 h-4" /> Pay via Installed UPI App
              </a>

              {/* Merchant UPI Details with Copy Button */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-white/5 text-xs">
                <div className="truncate pr-2">
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Merchant UPI VPA</span>
                  <span className="font-mono text-slate-200 select-all font-medium">{order.upiId}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(order.upiId, 'upi')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 flex items-center gap-1 font-medium transition-colors shrink-0"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy UPI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Polling Status Banner */}
            <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-300">
                  Listening for payment confirmation...
                </span>
              </div>
              <button
                onClick={handleInstantVerify}
                disabled={isVerifying}
                className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 disabled:opacity-50"
                title="Trigger immediate email sync"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                Check Now
              </button>
            </div>

            {/* Manual UTR Fallback Accordion */}
            <div className="border-t border-white/5 pt-4 text-xs">
              {!showUtrInput ? (
                <button
                  type="button"
                  onClick={() => setShowUtrInput(true)}
                  className="text-slate-400 hover:text-amber-300 underline underline-offset-4 text-[11px] block mx-auto transition-colors"
                >
                  Already paid? Enter 12-digit UTR manually
                </button>
              ) : (
                <form onSubmit={handleManualUtrSubmit} className="space-y-2 bg-slate-900/40 p-3 rounded-xl border border-white/5">
                  <label className="block text-slate-300 font-medium">
                    Submit Bank UTR / RRN (12 Digits)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={12}
                      placeholder="e.g. 428190184712"
                      value={manualUtr}
                      onChange={(e) => setManualUtr(e.target.value.replace(/\D/g, ''))}
                      className="glass-input flex-1 px-3 py-2 rounded-lg text-xs font-mono tracking-wider"
                    />
                    <button
                      type="submit"
                      disabled={isVerifying || manualUtr.length !== 12}
                      className="px-3 py-2 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-amber-400 disabled:opacity-40 transition-colors"
                    >
                      {isVerifying ? 'Verifying...' : 'Submit'}
                    </button>
                  </div>
                  {manualUtrMsg && (
                    <p className={`text-[11px] mt-1 ${manualUtrMsg.error ? 'text-red-400' : 'text-amber-300'}`}>
                      {manualUtrMsg.text}
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Security Footer */}
      <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-500/70" /> 256-bit Encrypted
        </span>
        <span>•</span>
        <span>IMAP Multi-Folder Verification</span>
        <span>•</span>
        <Link href="/admin" className="hover:text-amber-400 transition-colors">
          Admin Portal
        </Link>
      </div>
    </div>
  );
}
