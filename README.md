# Unofficial UPI Payment Gateway Dashboard (OmniCard / FamPay IMAP Reconciliation)

A production-grade, unofficial UPI payment gateway built for personal and prepaid UPI wallets (OmniCard, FamPay, etc.). It bypasses traditional merchant aggregator banking APIs by verifying incoming payments through automated multi-folder Gmail IMAP polling.

---

## 🚀 Key Features

- **Frontend Customer Checkout (`/checkout/[orderId]`)**:
  - Dynamically generated UPI QR Code (`qrcode.react`) strictly adhering to the standard UPI intent spec: `upi://pay?pa={upiId}&pn=Merchant&am={amount}&tr={orderId}`.
  - Live 15-minute countdown timer with real-time visual progress bar.
  - Active 5-second polling against `/api/order-status`.
  - Mobile deep linking (`Pay via UPI App`), click-to-copy UPI VPA & amount.
  - Manual 12-digit UTR submission fallback with auto-sync trigger.
  - Smooth animated success state with payment receipt.

- **Multi-Folder IMAP Verification Engine (`/api/trigger-imap-sync`)**:
  - Connects securely to Gmail IMAP via TLS over port 993.
  - **Iterates through multiple Gmail folders**: `INBOX`, `[Gmail]/Spam`, and `[Gmail]/Trash` (or `[Gmail]/Bin`).
  - Filters `UNSEEN` emails for OmniCard and FamPay senders.
  - Extracts 12-digit UPI reference numbers (UTR / RRN) and amounts via optimized regex engines.
  - Reconciles amounts against active `PENDING` orders.
  - Built-in replay attack protection (prevents UTR reuse).
  - Fires real-time HTTP POST notifications to merchant `webhookUrl`.

- **Admin Portal (`/admin`)**:
  - **Overview**: Real-time revenue metrics, total transactions, conversion rates, and live transaction table.
  - **Transactions Table**: Filterable by status (`PENDING`, `SUCCESS`, `FAILED`), searchable by Order ID or UTR.
  - **Settings (`/admin/settings`)**: Securely manage UPI ID, Gmail address, Google App Password, and Webhook URL. Includes a live Webhook test dispatcher.
  - **Manual Trigger**: Instant "Trigger IMAP Sync" button with live terminal log output modal.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark Mode, Glassmorphism, Gold/Amber Accent)
- **Database**: SQLite via Prisma ORM
- **Icons**: Lucide Icons
- **QR Codes**: `qrcode.react`
- **Email Parser**: `imap-simple`, `mailparser`
- **Authentication**: JWT & Bcrypt

---

## 📦 Project Structure

```
upi-gateway/
├── prisma/
│   ├── schema.prisma              # Database schema (Admin, GatewayConfig, Transaction)
│   └── dev.db                    # SQLite database
├── lib/
│   ├── prisma.ts                  # Global Prisma singleton
│   ├── auth.ts                    # Admin JWT verification & bcrypt hashing
│   ├── imap-sync.ts               # Core multi-folder IMAP reconciliation engine
│   └── webhook.ts                 # Webhook dispatcher
├── app/
│   ├── layout.tsx                 # Root layout with dark ambient glow
│   ├── globals.css                # Glassmorphic UI styling
│   ├── page.tsx                   # Test bench & order launcher
│   ├── checkout/
│   │   └── [orderId]/
│   │       └── page.tsx           # Dynamic Customer Checkout with QR code & 5s polling
│   ├── admin/
│   │   ├── layout.tsx             # Protected Admin Layout with sync modal
│   │   ├── page.tsx               # Admin Overview & Live Transactions Table
│   │   ├── login/
│   │   │   └── page.tsx           # Admin Login Page
│   │   └── settings/
│   │       └── page.tsx           # UPI ID, IMAP credentials & Webhook settings
│   └── api/
│       ├── create-order/          # POST /api/create-order
│       ├── order-status/          # GET /api/order-status?orderId=...
│       ├── trigger-imap-sync/     # POST /api/trigger-imap-sync (Multi-folder scan)
│       ├── verify-manual-utr/     # POST /api/verify-manual-utr
│       └── admin/
│           ├── auth/              # Admin login & session check
│           ├── transactions/      # Aggregated metrics & transaction queries
│           └── settings/          # Read and update gateway configuration
└── scripts/
    ├── seed.js                    # Database seeder (Admin & default config)
    └── test-mock-sync.js          # Verification test script for IMAP engine
```

---

## ⚡ Quick Start

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Default Admin Credentials
- **Username**: `admin`
- **Password**: `adminpassword123`
- **Login URL**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

### 3. Running Mock IMAP Test Suite
To verify the end-to-end reconciliation engine without live Gmail credentials:
```bash
node scripts/test-mock-sync.js
```

---

## ✉️ Gmail IMAP Configuration Guide

1. Go to your Google Account > **Security**.
2. Ensure **2-Step Verification** is turned ON.
3. Under **2-Step Verification**, scroll to **App passwords**.
4. Generate a 16-character App Password (e.g. `abcd efgh ijkl mnop`).
5. Enter your Gmail address and the 16-character App Password in `/admin/settings`.
6. Set your merchant UPI ID (e.g. `merchant@fam` or `username@omnicard`).

---

## 🔔 Webhook Specification

When a payment is matched and verified, the gateway sends an HTTP POST request to your configured `webhookUrl`:

```json
{
  "event": "PAYMENT_SUCCESS",
  "orderId": "ORD_1728210492_ABC",
  "amount": 250.00,
  "utr": "428190184712",
  "status": "SUCCESS",
  "timestamp": "2026-10-06T05:00:00.000Z"
}
```
Headers sent:
- `Content-Type: application/json`
- `X-Gateway-Event: PAYMENT_SUCCESS`
- `User-Agent: Unofficial-UPI-Gateway-Webhooks/1.0`
