import { describe, expect, it } from 'vitest';
import { parseEnv } from '@/shared/env';

const validEnv = {
  DATABASE_URL: 'postgresql://costops:costops@127.0.0.1:5432/costops',
  JWT_SECRET: 'abcdefghijklmnopqrstuvwxyz012345',
  DASHBOARD_PASSWORD: 'test-password',
  CRON_SECRET: 'cron-secret-16ch',
  NEON_ORG_ID: 'org-example',
};

describe('parseEnv', () => {
  it('accepts a valid CostOps environment', () => {
    const env = parseEnv(validEnv);
    expect(env.DATABASE_URL).toContain('postgresql://');
    expect(env.NEON_PRICING_PLAN).toBe('launch');
    expect(env.TELEGRAM_SPEND_ALERT_DEFAULT_USD).toBe(1);
    expect(env.OLD_NEON_PROJECT_DATABASE_URL).toBeUndefined();
    expect(env.UPSTASH_API_KEY).toBeUndefined();
    expect(env.GCP_PROJECT_ID).toBeUndefined();
  });

  it('accepts optional Upstash and GCP credential keys', () => {
    const env = parseEnv({
      ...validEnv,
      UPSTASH_EMAIL: 'ops@neetrino.com',
      UPSTASH_API_KEY: 'upstash-test-key',
      GCP_PROJECT_ID: 'neetrino-billing',
      GCP_BILLING_ACCOUNT_ID: '012345-ABCDEF-678901',
      GOOGLE_APPLICATION_CREDENTIALS: '/tmp/gcp-sa.json',
    });
    expect(env.UPSTASH_EMAIL).toBe('ops@neetrino.com');
    expect(env.GCP_BILLING_ACCOUNT_ID).toBe('012345-ABCDEF-678901');
  });

  it('requires JWT_SECRET when dashboard password is set', () => {
    expect(() =>
      parseEnv({ DATABASE_URL: validEnv.DATABASE_URL, DASHBOARD_PASSWORD: 'x' }),
    ).toThrow(/Invalid environment/);
  });
});
