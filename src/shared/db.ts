import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '@/generated/prisma/client';
import {
  DATABASE_IDLE_IN_TX_TIMEOUT_MS,
  DATABASE_LOCK_TIMEOUT_MS,
  DATABASE_POOL_MAX_DEFAULT,
  DATABASE_POOL_TIMEOUT_SECONDS_DEFAULT,
  DATABASE_STATEMENT_TIMEOUT_MS_DEFAULT,
} from '@/config/constants';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

function readPositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set');
  }

  const max = readPositiveInt(process.env.DATABASE_CONNECTION_LIMIT, DATABASE_POOL_MAX_DEFAULT);
  const poolTimeoutSeconds = readPositiveInt(
    process.env.DATABASE_POOL_TIMEOUT,
    DATABASE_POOL_TIMEOUT_SECONDS_DEFAULT,
  );
  const statementTimeoutMs = readPositiveInt(
    process.env.DATABASE_STATEMENT_TIMEOUT_MS,
    DATABASE_STATEMENT_TIMEOUT_MS_DEFAULT,
  );

  const pooled =
    connectionString.includes('-pooler.') || connectionString.includes('pgbouncer=true');

  return new Pool({
    connectionString,
    max,
    connectionTimeoutMillis: poolTimeoutSeconds * 1000,
    // Neon PgBouncer rejects startup `-c statement_timeout`. Unpooled/local still get TECH_CARD timeouts.
    ...(pooled
      ? {}
      : {
          options: [
            `-c statement_timeout=${statementTimeoutMs}`,
            `-c idle_in_transaction_session_timeout=${DATABASE_IDLE_IN_TX_TIMEOUT_MS}`,
            `-c lock_timeout=${DATABASE_LOCK_TIMEOUT_MS}`,
          ].join(' '),
        }),
  });
}

function createPrismaClient(): PrismaClient {
  const pool = globalForPrisma.prismaPool ?? createPool();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaPool = pool;
  }
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
