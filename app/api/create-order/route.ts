import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, customOrderId } = body;

    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    // Format amount to 2 decimal places
    const cleanAmount = Math.round(parsedAmount * 100) / 100;

    // Generate unique order ID
    const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId =
      customOrderId && typeof customOrderId === 'string' && customOrderId.trim().length > 0
        ? customOrderId.trim()
        : `ORD_${Date.now()}_${randomSuffix}`;

    // Expiration: 15 minutes from now
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const transaction = await prisma.transaction.create({
      data: {
        orderId,
        amount: cleanAmount,
        status: 'PENDING',
        expiresAt,
      },
    });

    const origin = req.nextUrl.origin || 'http://localhost:3000';
    const checkoutUrl = `${origin}/checkout/${orderId}`;

    return NextResponse.json({
      success: true,
      orderId: transaction.orderId,
      amount: transaction.amount,
      status: transaction.status,
      checkoutUrl,
      expiresAt: transaction.expiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An order with this orderId already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Internal server error while creating order.' },
      { status: 500 }
    );
  }
}
