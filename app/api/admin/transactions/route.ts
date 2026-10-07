import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const where: any = {};
    if (status && ['PENDING', 'SUCCESS', 'FAILED'].includes(status)) {
      where.status = status;
    }
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { orderId: { contains: q } },
        { utr: { contains: q } },
      ];
    }

    const [transactions, totalCount, successAggregate, pendingCount, failedCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.transaction.count(),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: 'SUCCESS' },
      }),
      prisma.transaction.count({ where: { status: 'PENDING' } }),
      prisma.transaction.count({ where: { status: 'FAILED' } }),
    ]);

    const totalRevenue = successAggregate._sum.amount || 0;
    const successCount = await prisma.transaction.count({ where: { status: 'SUCCESS' } });

    return NextResponse.json({
      transactions,
      stats: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalTransactions: totalCount,
        successCount,
        pendingCount,
        failedCount,
        conversionRate: totalCount > 0 ? Math.round((successCount / totalCount) * 1000) / 10 : 0,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/admin/transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error fetching transactions' },
      { status: 500 }
    );
  }
}
