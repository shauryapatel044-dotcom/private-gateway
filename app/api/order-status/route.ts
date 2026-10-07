import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: orderId' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { orderId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const isExpired = new Date() > new Date(transaction.expiresAt);
    let effectiveStatus = transaction.status;

    // If still pending but time has elapsed, mark as FAILED (expired)
    if (transaction.status === 'PENDING' && isExpired) {
      effectiveStatus = 'FAILED';
      // Persist the expired state
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
    }

    // Also get the merchant UPI ID for convenient checkout display
    const config = await prisma.gatewayConfig.findUnique({
      where: { id: 'default' },
    });

    return NextResponse.json({
      orderId: transaction.orderId,
      amount: transaction.amount,
      status: effectiveStatus,
      utr: transaction.utr,
      upiId: config?.upiId || 'merchant@upi',
      createdAt: transaction.createdAt.toISOString(),
      expiresAt: transaction.expiresAt.toISOString(),
      isExpired,
      secondsRemaining: Math.max(
        0,
        Math.floor((new Date(transaction.expiresAt).getTime() - Date.now()) / 1000)
      ),
    });
  } catch (error: any) {
    console.error('Error fetching order status:', error);
    return NextResponse.json(
      { error: 'Internal server error while fetching order status.' },
      { status: 500 }
    );
  }
}
