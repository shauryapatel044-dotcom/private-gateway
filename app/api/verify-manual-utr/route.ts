import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fireWebhook } from '@/lib/webhook';

export async function POST(req: NextRequest) {
  try {
    const { orderId, utr } = await req.json();

    if (!orderId || !utr) {
      return NextResponse.json({ error: 'orderId and utr are required' }, { status: 400 });
    }

    const cleanUtr = String(utr).trim();
    // Allow 12-digit UTRs or 10-24 character OmniCard Transaction IDs
    if (!/^[0-9a-zA-Z]{10,24}$/.test(cleanUtr)) {
      return NextResponse.json({ error: 'Invalid reference/UTR format. Must be between 10 to 24 characters.' }, { status: 400 });
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

    // Check if an incoming notification from the Android app matches this UTR
    const matchedNotification = await prisma.notificationLog.findFirst({
      where: {
        OR: [
          { utr: cleanUtr },
          { text: { contains: cleanUtr } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    if (matchedNotification) {
      // Reconcile transaction immediately
      const updated = await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'SUCCESS',
          utr: cleanUtr,
        },
      });

      // Update NotificationLog
      await prisma.notificationLog.update({
        where: { id: matchedNotification.id },
        data: {
          matchedOrderId: orderId,
          status: 'MATCHED',
        },
      });

      // Trigger Webhook if configured
      const config = await prisma.gatewayConfig.findUnique({ where: { id: 'default' } });
      if (config?.webhookUrl) {
        await fireWebhook(config.webhookUrl, {
          event: 'PAYMENT_SUCCESS',
          orderId: updated.orderId,
          amount: updated.amount,
          utr: cleanUtr,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully from OmniCard notification!',
        status: 'SUCCESS',
        utr: cleanUtr,
      });
    }

    // Notification hasn't arrived yet; store UTR as provisional so it will match when received
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        utr: cleanUtr,
      },
    });

    return NextResponse.json({
      success: false,
      message: 'UTR submitted. Awaiting incoming notification from Android app to finalize verification.',
      status: transaction.status,
    });
  } catch (error: any) {
    console.error('Error verifying manual UTR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
