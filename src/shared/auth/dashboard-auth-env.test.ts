import { describe, expect, it } from 'vitest';
import { readDashboardAuth } from '@/shared/auth/dashboard-auth-env';

const jwtSecret = 'abcdefghijklmnopqrstuvwxyz012345';

describe('readDashboardAuth', () => {
  it('stays disabled when login and password are unset', () => {
    expect(readDashboardAuth({})).toEqual({ status: 'disabled' });
  });

  it('treats a partial pair as misconfigured', () => {
    expect(readDashboardAuth({ DASHBOARD_PASSWORD: 'secret', JWT_SECRET: jwtSecret })).toEqual({
      status: 'misconfigured',
    });
    expect(readDashboardAuth({ DASHBOARD_LOGIN: 'operator@example.com' })).toEqual({
      status: 'misconfigured',
    });
  });

  it('returns trimmed login with the password and jwt secret', () => {
    expect(
      readDashboardAuth({
        DASHBOARD_LOGIN: '  operator@example.com  ',
        DASHBOARD_PASSWORD: 'secret',
        JWT_SECRET: jwtSecret,
      }),
    ).toEqual({
      status: 'configured',
      login: 'operator@example.com',
      password: 'secret',
      jwtSecret,
    });
  });
});
