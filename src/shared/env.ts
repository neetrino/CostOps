import { z } from 'zod';
import {
  DEFAULT_SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD,
  DEFAULT_TELEGRAM_SPEND_ALERT_USD,
} from '@/config/constants';

const optionalNonEmptyString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);

const optionalPositiveInt = z.preprocess((value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return value;
}, z.coerce.number().int().positive().optional());

export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    APP_URL: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().url().optional(),
    ),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: optionalNonEmptyString,
    DATABASE_CONNECTION_LIMIT: optionalPositiveInt,
    DATABASE_POOL_TIMEOUT: optionalPositiveInt,
    DATABASE_STATEMENT_TIMEOUT_MS: optionalPositiveInt,
    DASHBOARD_PASSWORD: optionalNonEmptyString,
    JWT_SECRET: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().min(32).optional(),
    ),
    CRON_SECRET: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z.string().min(16).optional(),
    ),
    NEON_API_KEY: optionalNonEmptyString,
    NEON_ORG_ID: z.preprocess(
      (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
      z
        .string()
        .regex(/^[a-z0-9-]{1,60}$/)
        .optional(),
    ),
    NEON_PRICING_PLAN: z.enum(['launch', 'scale']).default('launch'),
    TELEGRAM_BOT_TOKEN: optionalNonEmptyString,
    TELEGRAM_CHAT_ID: optionalNonEmptyString,
    TELEGRAM_SPEND_ALERT_DEFAULT_USD: z.preprocess((value) => {
      if (value === undefined || value === null || value === '') {
        return DEFAULT_TELEGRAM_SPEND_ALERT_USD;
      }
      return value;
    }, z.coerce.number().positive()),
    SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD: z.preprocess((value) => {
      if (value === undefined || value === null || value === '') {
        return DEFAULT_SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD;
      }
      return value;
    }, z.coerce.number().min(0.1).max(100)),
    VERCEL_API_TOKEN: optionalNonEmptyString,
    VERCEL_TEAM_ID: optionalNonEmptyString,
    UPSTASH_EMAIL: optionalNonEmptyString,
    UPSTASH_API_KEY: optionalNonEmptyString,
    GCP_PROJECT_ID: optionalNonEmptyString,
    GCP_BILLING_ACCOUNT_ID: optionalNonEmptyString,
    GOOGLE_APPLICATION_CREDENTIALS: optionalNonEmptyString,
    OLD_NEON_PROJECT_DATABASE_URL: optionalNonEmptyString,
  })
  .superRefine((value, ctx) => {
    if (value.DASHBOARD_PASSWORD && !value.JWT_SECRET) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'JWT_SECRET is required when DASHBOARD_PASSWORD is set (session signing).',
        path: ['JWT_SECRET'],
      });
    }
    if (value.NODE_ENV === 'production' && !value.DASHBOARD_PASSWORD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'DASHBOARD_PASSWORD is required in production.',
        path: ['DASHBOARD_PASSWORD'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function parseEnv(source: Record<string, string | undefined>): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`Invalid environment: ${parsed.error.message}`);
  }
  return parsed.data;
}

/**
 * Validated server-side environment. Call only from server/cron routes.
 */
export function getEnv(): Env {
  if (cached) {
    return cached;
  }
  cached = parseEnv({ ...process.env });
  return cached;
}

export function resetEnvCache(): void {
  cached = null;
}

export function getPublicEnv(): { hasDashboardAuth: boolean } {
  return {
    hasDashboardAuth: Boolean(process.env.DASHBOARD_PASSWORD?.length),
  };
}
