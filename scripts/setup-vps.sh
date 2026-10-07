#!/bin/bash
set -e

echo "=============================================="
echo "    UPI Gateway Automated VPS Setup Script   "
echo "=============================================="

# 1. Check & Install Node.js 20
if ! command -v node &> /dev/null; then
    echo "-> Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "-> Node.js is already installed: $(node -v)"
fi

# 2. Check & Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "-> Installing PM2..."
    sudo npm install -g pm2
else
    echo "-> PM2 is already installed"
fi

# 3. Install project dependencies
echo "-> Installing dependencies..."
npm install

# 4. Generate Prisma Client
echo "-> Generating Prisma Client..."
npx prisma generate

# 5. Build Next.js Production Bundle
echo "-> Building Next.js for production..."
npm run build

# 6. Start or Restart with PM2
echo "-> Starting gateway with PM2..."
pm2 delete upi-gateway 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "=============================================="
echo "  SUCCESS! Gateway is running 24/7 on port 3000"
echo "  Check status: pm2 status"
echo "  View logs:    pm2 logs upi-gateway"
echo "=============================================="
