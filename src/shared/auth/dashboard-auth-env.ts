export type DashboardAuthState =
  | { status: 'disabled' }
  | { status: 'misconfigured' }
  | { status: 'configured'; login: string; password: string; jwtSecret: string };

/**
 * Shared dashboard gate. Auth stays off only when login and password are both unset.
 * A partial pair, or a pair without `JWT_SECRET`, is misconfigured.
 */
export function readDashboardAuth(env: Record<string, string | undefined>): DashboardAuthState {
  const login = env.DASHBOARD_LOGIN?.trim() ?? '';
  const password = env.DASHBOARD_PASSWORD ?? '';
  const jwtSecret = env.JWT_SECRET ?? '';
  if (login.length === 0 && password.length === 0) {
    return { status: 'disabled' };
  }
  if (login.length === 0 || password.length === 0 || jwtSecret.length === 0) {
    return { status: 'misconfigured' };
  }
  return { status: 'configured', login, password, jwtSecret };
}
