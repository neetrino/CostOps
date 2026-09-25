import { NextResponse } from 'next/server';
import { z } from 'zod';
import { COOKIE_NAME, SESSION_TTL_SECONDS } from '@/config/constants';
import { readDashboardAuth } from '@/shared/auth/dashboard-auth-env';
import { dashboardCredentialsMatch } from '@/shared/auth/dashboard-credentials';
import { clientIpFromHeaders, consumeLoginAttempt } from '@/shared/auth/login-rate-limit';
import { signSessionToken } from '@/shared/auth/sign-session-token';
import { logger } from '@/shared/logger';

const loginBodySchema = z.object({
  login: z.string().trim().min(1).max(320),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request): Promise<NextResponse> {
  const ip = clientIpFromHeaders(request.headers);
  if (!consumeLoginAttempt(ip)) {
    return NextResponse.json({ error: 'Too many login attempts' }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = loginBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const auth = readDashboardAuth(process.env);
  if (auth.status !== 'configured') {
    return NextResponse.json({ error: 'Dashboard auth not configured' }, { status: 503 });
  }

  if (!dashboardCredentialsMatch(parsed.data, auth)) {
    logger.warn({ ip }, 'dashboard login failed');
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = signSessionToken(auth.jwtSecret, SESSION_TTL_SECONDS);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  logger.info({ ip }, 'dashboard login succeeded');
  return res;
}
