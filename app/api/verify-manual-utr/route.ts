import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerImapSync } from '@/lib/imap-sync';

export async function POST(req: NextRequest) {
  try {
    const { orderId, utr } = await req.json();

    if (!orderId || !utr) {
      return NextResponse.json({ error: 'orderId and utr are required' }, { status: 400 });
    }

    const cleanUtr = String(utr).trim();
    if (!/^\d{12}$/.test(cleanUtr)) {
      return NextResponse.json({ error: 'Invalid UTR format. Must be exactly 12 digits.' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (transaction.status === 'SUCCESS') {
      return NextResponse.json({ success: true, message: 'Order already paid and verified!', status: 'SUCCESS' });
    }

    // Trigger IMAP sync in case the notification email has arrived
    await triggerImapSync();

    // Check if the order was verified during sync
    const refreshed = await prisma.transaction.findUnique({
      where: { orderId },
    });

    if (refreshed?.status === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        message: 'Payment verified via IMAP email reconciliation!',
        status: 'SUCCESS',
        utr: refreshed.utr,
      });
    }

    return NextResponse.json({
      success: false,
      message: 'UTR submitted. IMAP sync initiated. Verification will automatically update once the bank email confirms.',
      status: refreshed?.status || 'PENDING',
    });
  } catch (error: any) {
    console.error('Error verifying manual UTR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
