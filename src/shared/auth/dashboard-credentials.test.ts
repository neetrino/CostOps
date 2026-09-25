import { describe, expect, it } from 'vitest';
import { dashboardCredentialsMatch } from '@/shared/auth/dashboard-credentials';

const expected = { login: 'operator@example.com', password: 'secret' };

describe('dashboardCredentialsMatch', () => {
  it('accepts the shared login regardless of case or surrounding space', () => {
    expect(
      dashboardCredentialsMatch(
        { login: '  Operator@Example.com  ', password: 'secret' },
        expected,
      ),
    ).toBe(true);
  });

  it('rejects a wrong login or a wrong password', () => {
    expect(
      dashboardCredentialsMatch({ login: 'other@neetrino.com', password: 'secret' }, expected),
    ).toBe(false);
    expect(
      dashboardCredentialsMatch({ login: 'operator@example.com', password: 'other' }, expected),
    ).toBe(false);
  });
});
