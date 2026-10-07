import { PrismaClient } from '@prisma/client';

const FALLBACK_DATABASE_URL =
  'postgresql://postgres.pbalmdgeqarijsgjkykn:pZL75bYTyI0PIUey@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = process.env.SUPABASE_DATABASE_URL || FALLBACK_DATABASE_URL;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || FALLBACK_DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

globalForPrisma.prisma = prisma;

export default prisma;
