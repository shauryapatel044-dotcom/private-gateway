const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const FALLBACK_DATABASE_URL =
  'postgresql://postgres.pbalmdgeqarijsgjkykn:pZL75bYTyI0PIUey@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DATABASE_URL;
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || FALLBACK_DATABASE_URL },
  },
});

async function main() {
  console.log('--- Seeding Database ---');

  // Seed Admin
  const adminUsername = 'admin';
  const defaultPassword = 'adminpassword123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
    create: {
      username: adminUsername,
      passwordHash,
    },
  });
  console.log(`Admin initialized: ${admin.username} (password: ${defaultPassword})`);

  // Seed GatewayConfig
  const config = await prisma.gatewayConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      upiId: '9726147047@omni',
      webhookUrl: '',
    },
  });
  console.log(`GatewayConfig initialized with UPI ID: ${config.upiId}`);

  // Seed a sample transaction if table is empty
  const txCount = await prisma.transaction.count();
  if (txCount === 0) {
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const sampleTx = await prisma.transaction.create({
      data: {
        orderId: `ORD_${Date.now()}_SAMPLE`,
        amount: 250.0,
        status: 'PENDING',
        expiresAt,
      },
    });
    console.log(`Created sample PENDING transaction: ${sampleTx.orderId} for ₹${sampleTx.amount}`);
  }

  console.log('--- Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
