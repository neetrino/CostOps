import { timingSafeStringEqual } from '@/shared/auth/sign-session-token';

/** Shared operator login. Comparison is case-insensitive; surrounding space is ignored. */
export function normalizeDashboardLogin(login: string): string {
  return login.trim().toLowerCase();
}

/**
 * Checks login and password together. Both comparisons always run.
 */
export function dashboardCredentialsMatch(
  input: { login: string; password: string },
  expected: { login: string; password: string },
): boolean {
  const loginMatches = timingSafeStringEqual(
    normalizeDashboardLogin(input.login),
    normalizeDashboardLogin(expected.login),
  );
  const passwordMatches = timingSafeStringEqual(input.password, expected.password);
  return loginMatches && passwordMatches;
}
