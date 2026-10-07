import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';
import { fireWebhook } from '@/lib/webhook';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await prisma.gatewayConfig.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        upiId: '9726147047@omni',
        webhookUrl: '',
      },
    });

    return NextResponse.json({
      upiId: config.upiId,
      webhookUrl: config.webhookUrl,
      updatedAt: config.updatedAt,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { upiId, webhookUrl, testWebhook } = body;

    // Handle test webhook request
    if (testWebhook) {
      const targetUrl = webhookUrl || (await prisma.gatewayConfig.findUnique({ where: { id: 'default' } }))?.webhookUrl;
      if (!targetUrl) {
        return NextResponse.json({ error: 'No webhook URL provided to test' }, { status: 400 });
      }

      const testResult = await fireWebhook(targetUrl, {
        event: 'PAYMENT_SUCCESS',
        orderId: `TEST_${Date.now()}`,
        amount: 100.0,
        utr: '123456789012',
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
      });

      return NextResponse.json({
        success: testResult.success,
        message: testResult.success
          ? `Webhook received HTTP ${testResult.status} successfully!`
          : `Webhook failed: ${testResult.error}`,
      });
    }

    // Build update object
    const updateData: any = {};
    if (typeof upiId === 'string' && upiId.trim()) updateData.upiId = upiId.trim();
    if (typeof webhookUrl === 'string') updateData.webhookUrl = webhookUrl.trim();

    const updated = await prisma.gatewayConfig.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        upiId: upiId || '9726147047@omni',
        webhookUrl: webhookUrl || '',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Gateway configuration updated successfully',
      config: {
        upiId: updated.upiId,
        webhookUrl: updated.webhookUrl,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Internal server error updating settings' },
      { status: 500 }
    );
  }
}
