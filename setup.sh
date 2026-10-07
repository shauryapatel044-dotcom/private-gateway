#!/usr/bin/env bash

# ==============================================================================
#  UPI GATEWAY - 100% AUTOMATED ALL-IN-ONE VPS SETUP SCRIPT
#  Works on: Ubuntu 20.04 / 22.04 / 24.04, Debian 11 / 12
#  Sets up: Node.js 20, PM2, Firewall Port 3000, Cloudflared, Supabase DB & Build
# ==============================================================================

set -eo pipefail

# Helper for colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}"
echo "=============================================================="
echo "      🚀 AUTOMATED UPI GATEWAY & CLOUDFLARE SETUP SCRIPT     "
echo "=============================================================="
echo -e "${NC}"

# Check for root or sudo
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
else
    SUDO=""
fi

# Detect Server IP
PUBLIC_IP=$(curl -s --max-time 4 https://ifconfig.me || curl -s --max-time 4 https://api.ipify.org || echo "YOUR_VPS_IP")

# 1. System Package Update & Essentials
echo -e "${YELLOW}[1/7] Updating system packages and installing prerequisites...${NC}"
$SUDO apt-get update -y -q
$SUDO apt-get install -y -q curl wget git build-essential ufw

# 2. Open Port 3000 on Firewall
echo -e "${YELLOW}[2/7] Opening Port 3000 on firewall...${NC}"
if command -v ufw &> /dev/null; then
    $SUDO ufw allow 3000/tcp || true
    echo -e "${GREEN}✓ Port 3000/tcp allowed in UFW${NC}"
fi

# 3. Check & Install Node.js 20 LTS
echo -e "${YELLOW}[3/7] Checking Node.js installation...${NC}"
NODE_OK=0
if command -v node &> /dev/null; then
    NODE_MAJOR=$(node -v | cut -d'.' -f1 | tr -d 'v')
    if [ "$NODE_MAJOR" -ge 18 ]; then
        NODE_OK=1
        echo -e "${GREEN}✓ Node.js $(node -v) is already installed${NC}"
    fi
fi

if [ "$NODE_OK" -eq 0 ]; then
    echo -e "${CYAN}-> Installing Node.js 20 LTS via NodeSource...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
    $SUDO apt-get install -y -q nodejs
    echo -e "${GREEN}✓ Installed Node.js $(node -v)${NC}"
fi

# 4. Check & Install PM2 Process Manager
echo -e "${YELLOW}[4/7] Checking PM2 process manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${CYAN}-> Installing PM2 globally...${NC}"
    $SUDO npm install -g pm2
    echo -e "${GREEN}✓ PM2 installed${NC}"
else
    echo -e "${GREEN}✓ PM2 is already installed ($(pm2 -v))${NC}"
fi

# 5. Check & Install Cloudflared (Cloudflare Tunnel)
echo -e "${YELLOW}[5/7] Checking Cloudflare Tunnel (cloudflared)...${NC}"
if ! command -v cloudflared &> /dev/null; then
    echo -e "${CYAN}-> Installing cloudflared...${NC}"
    ARCH=$(dpkg --print-architecture 2>/dev/null || echo "amd64")
    if [ "$ARCH" = "amd64" ] || [ "$ARCH" = "x86_64" ]; then
        curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
        $SUDO dpkg -i /tmp/cloudflared.deb || $SUDO apt-get install -f -y
        rm -f /tmp/cloudflared.deb
    elif [ "$ARCH" = "arm64" ] || [ "$ARCH" = "aarch64" ]; then
        curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb -o /tmp/cloudflared.deb
        $SUDO dpkg -i /tmp/cloudflared.deb || $SUDO apt-get install -f -y
        rm -f /tmp/cloudflared.deb
    fi
    echo -e "${GREEN}✓ cloudflared installed successfully ($(cloudflared --version | head -n 1))${NC}"
else
    echo -e "${GREEN}✓ cloudflared is already installed ($(cloudflared --version | head -n 1))${NC}"
fi

# 6. Auto-generate .env file if missing
echo -e "${YELLOW}[6/7] Verifying environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${CYAN}-> Generating .env file with pre-configured Supabase credentials...${NC}"
    cat << 'EOF' > .env
DATABASE_URL="postgresql://postgres.pbalmdgeqarijsgjkykn:pZL75bYTyI0PIUey@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
NEXT_PUBLIC_SUPABASE_URL="https://pbalmdgeqarijsgjkykn.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNDE3MjQsImV4cCI6MjEwNjkxNzcyNH0.ihAMjzHPdOPBc5P8JTqenYrNWw7BcDdkly5o_HzF7_Q"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNDE3MjQsImV4cCI6MjEwNjkxNzcyNH0.ihAMjzHPdOPBc5P8JTqenYrNWw7BcDdkly5o_HzF7_Q"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiYWxtZGdlcWFyaWpzZ2preWtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTM0MTcyNCwiZXhwIjoyMTA2OTE3NzI0fQ.w5c4k4lmI3qsOaMWbQ2UGn0xgg4z-N7ES585puUlmy8"
JWT_SECRET="super-secret-gateway-key-change-in-production-12345"
EOF
    echo -e "${GREEN}✓ .env created successfully${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# 7. Project Build & PM2 Startup
echo -e "${YELLOW}[7/7] Installing dependencies, generating Prisma client, and building Next.js...${NC}"
npm install --no-audit --prefer-offline || npm install

echo -e "${CYAN}-> Generating Prisma database client...${NC}"
npx prisma generate

echo -e "${CYAN}-> Compiling Next.js production bundle...${NC}"
npm run build

echo -e "${CYAN}-> Starting application with PM2 24/7...${NC}"
pm2 delete upi-gateway 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
$SUDO env PATH=$PATH:/usr/bin pm2 startup systemd -u $(whoami) --hp $HOME 2>/dev/null || true

# ==============================================================================
#  COMPLETION SUMMARY BANNER
# ==============================================================================
echo ""
echo -e "${GREEN}==============================================================${NC}"
echo -e "${GREEN}     🎉 UPI GATEWAY IS LIVE AND RUNNING 24/7 ON PORT 3000!    ${NC}"
echo -e "${GREEN}==============================================================${NC}"
echo ""
echo -e "  🌐 Direct IP URL:     ${CYAN}http://${PUBLIC_IP}:3000${NC}"
echo -e "  🔐 Admin Portal:      ${CYAN}http://${PUBLIC_IP}:3000/admin/login${NC}"
echo -e "  🔑 Admin Username:    ${YELLOW}admin${NC}"
echo -e "  🔑 Admin Password:    ${YELLOW}adminpassword123${NC}"
echo ""
echo -e "${CYAN}--------------------------------------------------------------${NC}"
echo -e "${YELLOW}  ⚡ CLOUDFLARE TUNNEL (Choose Option A or Option B):${NC}"
echo -e "${CYAN}--------------------------------------------------------------${NC}"
echo ""
echo -e "  ${GREEN}Option A: Instant FREE Public HTTPS Tunnel (No Cloudflare account needed):${NC}"
echo -e "    Run in terminal:"
echo -e "    ${CYAN}cloudflared tunnel --url http://localhost:3000${NC}"
echo -e "    (It will instantly print a public ${YELLOW}https://*.trycloudflare.com${CYAN} URL for you!)"
echo ""
echo -e "  ${GREEN}Option B: Your Own Cloudflare Dashboard Tunnel (Permanent):${NC}"
echo -e "    1. Create a Tunnel in Cloudflare Zero Trust Dashboard ➔ Networks ➔ Tunnels."
echo -e "    2. Copy the tunnel connector command and paste it here on your VPS, e.g.:"
echo -e "       ${CYAN}sudo cloudflared service install <YOUR_TUNNEL_TOKEN>${NC}"
echo -e "    3. Route service to: ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${CYAN}--------------------------------------------------------------${NC}"
echo -e "  Useful PM2 Commands:"
echo -e "  - Check status:   ${CYAN}pm2 status${NC}"
echo -e "  - View live logs: ${CYAN}pm2 logs upi-gateway${NC}"
echo -e "  - Restart server: ${CYAN}pm2 restart upi-gateway${NC}"
echo -e "${GREEN}==============================================================${NC}"
