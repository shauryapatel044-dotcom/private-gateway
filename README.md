# Unofficial UPI Payment Gateway Dashboard (OmniCard Android Notification Sync)

A high-performance, production-grade UPI payment gateway built for personal and prepaid UPI wallets (OmniCard, etc.). It bypasses traditional merchant aggregator banking APIs by verifying incoming payments in real time through an Android background notification listener app.

---

## 🚀 Key Features

- **Frontend Customer Checkout (`/checkout/[orderId]`)**:
  - Dynamically generated UPI QR Code strictly adhering to the standard UPI intent spec: `upi://pay?pa={upiId}&pn=Merchant&am={amount}&tr={orderId}`.
  - Live 15-minute countdown timer with real-time visual progress bar.
  - Active 5-second polling against `/api/order-status`.
  - Mobile deep linking (`Pay via UPI App`), click-to-copy UPI VPA & amount.
  - Manual Reference / UTR submission fallback with auto-match against captured notifications.
  - 1-Click Simulation button on test mode checkouts for effortless testing.
  - Smooth animated success state with payment receipt.

- **Real-Time Android Notification Engine (`/api/notification-webhook`)**:
  - Receives live notification payloads pushed by `UpiListener.apk` in <50ms.
  - Extracts 18-digit OmniCard Transaction IDs, 12-digit UPI UTRs, and transaction amounts.
  - Strips updated wallet balance to prevent false positives.
  - Automatically matches pending checkout orders by exact amount.
  - Built-in replay attack protection (prevents reuse of the same UTR).
  - Fires real-time HTTP POST callbacks to merchant `webhookUrl`.

- **Merchant API Keys Dashboard (`/admin/api-keys`)**:
  - Create named merchant API keys (`og_live_...`).
  - Track order counts and last-used timestamps per key.
  - Revoke or delete keys instantly.
  - Interactive code integration examples for cURL, Node.js, and Python.

- **Admin Portal (`/admin`)**:
  - **Overview**: Real-time revenue metrics, total transactions, conversion rates, and live transaction table.
  - **Phone Notifications (`/admin/notifications`)**: Live stream of intercepted Android notifications with simulation tools.
  - **Settings (`/admin/settings`)**: Manage UPI VPA, copy notification webhook endpoint, test outgoing webhooks, and Danger Zone for purging test transaction history.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (Dark Mode, Glassmorphism, Gold/Amber Accent)
- **Database**: Supabase PostgreSQL (via Prisma ORM & Supavisor Pooler)
- **Android App**: Kotlin background NotificationListenerService (`UpiListener.apk`)
- **Authentication**: JWT & Bcrypt

---

## ⚡ Quick Start

### 1. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Admin Portal
- **Login URL**: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- **Default Username**: `admin`

---

## 📱 Android App Setup

1. Install `UpiListener.apk` on your Android device with the OmniCard app installed.
2. Grant **Notification Access** permissions in Android settings when prompted.
3. In the app settings, set your gateway webhook URL:
   ```
   https://<your-domain>/api/notification-webhook
   ```
4. Whenever an OmniCard payment notification arrives, it is captured in <50ms and reconciled automatically.
