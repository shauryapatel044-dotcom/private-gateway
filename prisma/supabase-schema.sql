-- UPI Gateway Database Schema for Supabase PostgreSQL
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run

-- 1. Admin Table
CREATE TABLE IF NOT EXISTS "Admin" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "username" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. GatewayConfig Table
CREATE TABLE IF NOT EXISTS "GatewayConfig" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "upiId" TEXT NOT NULL DEFAULT '9726147047@omni',
    "imapEmail" TEXT NOT NULL DEFAULT '',
    "imapAppPassword" TEXT NOT NULL DEFAULT '',
    "webhookUrl" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. ApiKey Table
CREATE TABLE IF NOT EXISTS "ApiKey" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "key" TEXT UNIQUE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "lastUsed" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Transaction Table
CREATE TABLE IF NOT EXISTS "Transaction" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "orderId" TEXT UNIQUE NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "utr" TEXT,
    "apiKeyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. NotificationLog Table
CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "packageName" TEXT NOT NULL DEFAULT '',
    "title" TEXT NOT NULL DEFAULT '',
    "text" TEXT NOT NULL DEFAULT '',
    "amount" DOUBLE PRECISION,
    "utr" TEXT,
    "matchedOrderId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning-fast lookups
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction" ("status");
CREATE INDEX IF NOT EXISTS "Transaction_utr_idx" ON "Transaction" ("utr");
CREATE INDEX IF NOT EXISTS "NotificationLog_status_idx" ON "NotificationLog" ("status");

-- Pre-seed Default GatewayConfig with OmniCard UPI ID
INSERT INTO "GatewayConfig" ("id", "upiId")
VALUES ('default', '9726147047@omni')
ON CONFLICT ("id") DO NOTHING;
