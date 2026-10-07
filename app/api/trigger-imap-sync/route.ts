import { NextRequest, NextResponse } from 'next/server';
import { triggerImapSync } from '@/lib/imap-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 seconds maximum duration for IMAP network traversal

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty when triggered via standard cron or simple POST
      body = {};
    }

    const { mockEmails } = body;

    const syncResult = await triggerImapSync({
      mockEmails: Array.isArray(mockEmails) ? mockEmails : undefined,
    });

    return NextResponse.json({
      success: syncResult.success,
      timestamp: new Date().toISOString(),
      foldersScanned: syncResult.foldersScanned,
      totalEmailsInspected: syncResult.totalEmailsInspected,
      matchedCount: syncResult.matchedCount,
      matchedTransactions: syncResult.matchedTransactions,
      errors: syncResult.errors,
      logs: syncResult.log,
    });
  } catch (error: any) {
    console.error('Unhandled exception during IMAP sync:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal error in IMAP sync engine',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Allow GET for quick browser/curl trigger or health checks
export async function GET() {
  const syncResult = await triggerImapSync();
  return NextResponse.json({
    success: syncResult.success,
    timestamp: new Date().toISOString(),
    foldersScanned: syncResult.foldersScanned,
    totalEmailsInspected: syncResult.totalEmailsInspected,
    matchedCount: syncResult.matchedCount,
    matchedTransactions: syncResult.matchedTransactions,
    errors: syncResult.errors,
  });
}
