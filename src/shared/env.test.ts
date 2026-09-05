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
  });

  it('requires JWT_SECRET when dashboard password is set', () => {
    expect(() =>
      parseEnv({ DATABASE_URL: validEnv.DATABASE_URL, DASHBOARD_PASSWORD: 'x' }),
    ).toThrow(/Invalid environment/);
  });
});
