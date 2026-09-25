import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME } from '@/config/constants';
import { readDashboardAuth } from '@/shared/auth/dashboard-auth-env';
import { isPublicRequestPath } from '@/shared/auth/public-paths';
import { verifySessionToken } from '@/shared/auth/verify-session-token';

/**
 * Next.js 16 request gate (replaces middleware.ts). Ports Neon dashboard auth.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublicRequestPath(pathname)) {
    return NextResponse.next();
  }

  const auth = readDashboardAuth(process.env);
  if (auth.status === 'disabled') {
    return NextResponse.next();
  }
  if (auth.status === 'misconfigured') {
    return NextResponse.redirect(new URL('/login?error=config', request.url));
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const ok = token ? await verifySessionToken(token, auth.jwtSecret) : false;

  if (pathname.startsWith('/api/')) {
    if (!ok) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!ok) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
