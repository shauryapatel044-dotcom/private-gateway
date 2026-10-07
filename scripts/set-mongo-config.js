const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const updated = await prisma.gatewayConfig.upsert({
    where: { id: 'default' },
    update: {
      upiId: '9726147047@omni',
      imapEmail: 'nikkipritspatel@gmail.com',
    },
    create: {
      id: 'default',
      upiId: '9726147047@omni',
      imapEmail: 'nikkipritspatel@gmail.com',
    },
  });
  console.log('MongoDB GatewayConfig updated successfully:', updated);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
