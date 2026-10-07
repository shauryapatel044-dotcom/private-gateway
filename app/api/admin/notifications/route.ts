import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    // Allow reading notifications for dashboard display

    const notifications = await prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const totalCount = await prisma.notificationLog.count();
    const matchedCount = await prisma.notificationLog.count({ where: { status: 'MATCHED' } });

    return NextResponse.json({
      success: true,
      totalCount,
      matchedCount,
      notifications,
    });
  } catch (error: any) {
    console.error('Error fetching notification logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
