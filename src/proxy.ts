import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME } from '@/config/constants';
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

  const dashboardPassword = process.env.DASHBOARD_PASSWORD;
  if (!dashboardPassword) {
    return NextResponse.next();
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return NextResponse.redirect(new URL('/login?error=config', request.url));
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  const ok = token ? await verifySessionToken(token, jwtSecret) : false;

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
