#!/bin/bash
set -e

echo "=============================================="
echo "    UPI Gateway Automated VPS Setup Script   "
echo "=============================================="

# 0. Auto-create .env file with embedded production variables if not present
if [ ! -f .env ]; then
    echo "-> Auto-generating .env file with embedded production configuration..."
    cat << 'EOF' > .env
DATABASE_URL="postgresql://postgres.pbalmdgeqarijsgjkykn:pZL75bYTyI0PIUey@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://pbalmdgeqarijsgjkykn.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNDE3MjQsImV4cCI6MjEwNjkxNzcyNH0.ihAMjzHPdOPBc5P8JTqenYrNWw7BcDdkly5o_HzF7_Q"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNDE3MjQsImV4cCI6MjEwNjkxNzcyNH0.ihAMjzHPdOPBc5P8JTqenYrNWw7BcDdkly5o_HzF7_Q"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM0MTcyNCwiZXhwIjoyMTA2OTE3NzI0fQ.w5c4k4lmI3qsOaMWbQ2UGn0xgg4z-N7ES585puUlmy8"
JWT_SECRET="super-secret-gateway-key-change-in-production-12345"
EOF
    echo "-> .env created successfully!"
fi

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
