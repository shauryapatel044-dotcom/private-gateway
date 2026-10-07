import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { extractAmounts, extractUtrs } from '@/lib/imap-sync';
import { fireWebhook } from '@/lib/webhook';

export const dynamic = 'force-dynamic';

export interface NotificationPayload {
  packageName?: string;
  title?: string;
  text?: string;
  sender?: string;
  timestamp?: string;
  raw?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: NotificationPayload = await req.json();
    const title = body.title || '';
    const text = body.text || body.raw || '';
    const packageName = body.packageName || body.sender || 'Android Notification';
    const combined = `${title} ${text}`;

    console.log(`[Notification Ingest] App: "${packageName}" | Title: "${title}" | Text: "${text}"`);

    if (!combined.trim()) {
      return NextResponse.json({ error: 'Empty notification content' }, { status: 400 });
    }

    // Extract amounts and 12-digit UTRs
    const amounts = extractAmounts(combined);
    const utrs = extractUtrs(combined);

    console.log(`[Extracted] Amounts: [${amounts.join(', ')}] | UTRs: [${utrs.join(', ')}]`);

    const primaryUtr = utrs[0] || null;
    const primaryAmount = amounts[0] || null;

    // Check if UTR already reconciled
    if (primaryUtr) {
      const alreadyReconciled = await prisma.transaction.findFirst({
        where: { utr: primaryUtr, status: 'SUCCESS' },
      });

      if (alreadyReconciled) {
        await prisma.notificationLog.create({
          data: {
            packageName,
            title,
            text,
            amount: primaryAmount,
            utr: primaryUtr,
            matchedOrderId: alreadyReconciled.orderId,
            status: 'MATCHED',
          },
        });

        return NextResponse.json({
          success: true,
          matched: false,
          message: `UTR ${primaryUtr} already reconciled with Order ${alreadyReconciled.orderId}. Replay ignored.`,
        });
      }
    }

    // Fetch active pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    let matchedTx: any = null;

    // Match by amount
    for (const amt of amounts) {
      const found = pendingTransactions.find((tx) => Math.abs(tx.amount - amt) < 0.01);
      if (found) {
        matchedTx = found;
        break;
      }
    }

    // If no amount matched but 12-digit UTR is present and there's 1 pending transaction, match it
    if (!matchedTx && primaryUtr && pendingTransactions.length === 1) {
      matchedTx = pendingTransactions[0];
    }

    if (matchedTx) {
      const finalUtr = primaryUtr || `AUTO_${Date.now().toString().slice(-8)}`;

      // Update Database
      await prisma.transaction.update({
        where: { id: matchedTx.id },
        data: {
          status: 'SUCCESS',
          utr: finalUtr,
        },
      });

      // Record in Notification Log
      await prisma.notificationLog.create({
        data: {
          packageName,
          title,
          text,
          amount: matchedTx.amount,
          utr: finalUtr,
          matchedOrderId: matchedTx.orderId,
          status: 'MATCHED',
        },
      });

      // Fire Merchant Webhook
      const config = await prisma.gatewayConfig.findUnique({ where: { id: 'default' } });
      let webhookDelivered = false;

      if (config?.webhookUrl) {
        const hookRes = await fireWebhook(config.webhookUrl, {
          event: 'PAYMENT_SUCCESS',
          orderId: matchedTx.orderId,
          amount: matchedTx.amount,
          utr: finalUtr,
          status: 'SUCCESS',
          timestamp: new Date().toISOString(),
        });
        webhookDelivered = hookRes.success;
      }

      return NextResponse.json({
        success: true,
        matched: true,
        orderId: matchedTx.orderId,
        amount: matchedTx.amount,
        utr: finalUtr,
        webhookDelivered,
        message: `Order ${matchedTx.orderId} verified and updated to SUCCESS via notification!`,
      });
    }

    // Log unmatched notification
    await prisma.notificationLog.create({
      data: {
        packageName,
        title,
        text,
        amount: primaryAmount,
        utr: primaryUtr,
        matchedOrderId: null,
        status: (amounts.length > 0 || utrs.length > 0) ? 'UNMATCHED' : 'IGNORED',
      },
    });

    return NextResponse.json({
      success: true,
      matched: false,
      extracted: { amounts, utrs },
      message: 'Notification received and logged, but no matching PENDING transaction found in database.',
    });
  } catch (error: any) {
    console.error('Error handling notification webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
