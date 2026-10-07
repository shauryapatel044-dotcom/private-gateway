import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'UPI Gateway | Automated OmniCard Payment Verification',
  description: 'Production-grade UPI Payment Gateway with real-time Android notification reconciliation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#080c14] text-slate-100 min-h-screen selection:bg-amber-500/30 selection:text-amber-200">
        <div className="fixed inset-0 pointer-events-none z-0">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
