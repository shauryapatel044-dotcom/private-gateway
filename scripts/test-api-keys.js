const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function test() {
  console.log('--- Testing API Key System ---');
  
  // 1. Create a named API key in MongoDB
  const generatedKey = 'og_live_' + crypto.randomBytes(16).toString('hex');
  const apiKey = await prisma.apiKey.create({
    data: {
      name: 'Shopify Store Integration',
      key: generatedKey,
      status: 'ACTIVE',
    },
  });
  console.log('1. Created API Key in MongoDB:', apiKey.name, '->', apiKey.key);

  // 2. Call POST /api/create-order using this API key in headers
  const res = await fetch('http://localhost:3000/api/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey.key,
    },
    body: JSON.stringify({
      amount: 450.00,
      customOrderId: 'STORE_ORDER_7781',
    }),
  });

  const orderData = await res.json();
  console.log('2. Order Created via API Key:', JSON.stringify(orderData, null, 2));

  // 3. Verify that ApiKey was updated with order count and lastUsed
  const updatedKey = await prisma.apiKey.findUnique({
    where: { id: apiKey.id },
  });
  console.log('3. Updated API Key Stats:', {
    name: updatedKey.name,
    totalOrders: updatedKey.totalOrders,
    lastUsed: updatedKey.lastUsed,
  });

  // 4. Verify Transaction record has apiKeyName
  const tx = await prisma.transaction.findUnique({
    where: { orderId: 'STORE_ORDER_7781' },
  });
  console.log('4. Transaction attributed to API Key:', tx.orderId, 'apiKeyName:', tx.apiKeyName);

  await prisma.$disconnect();
}

test().catch((e) => {
  console.error(e);
  process.exit(1);
});
