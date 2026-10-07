const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const txBefore = await prisma.transaction.count();
  const logBefore = await prisma.notificationLog.count();
  const keysBefore = await prisma.apiKey.count();
  const configBefore = await prisma.gatewayConfig.count();
  console.log('Before count: Transactions =', txBefore, '| Logs =', logBefore, '| API Keys =', keysBefore, '| Config =', configBefore);
  await prisma.$disconnect();
}

test();
