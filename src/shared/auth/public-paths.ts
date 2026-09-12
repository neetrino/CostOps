const PUBLIC_STATIC_EXT = /\.(?:ico|png|jpg|jpeg|gif|webp|svg|avif|woff2?)$/i;

const PUBLIC_EXACT_PATHS = new Set([
  '/favicon.ico',
  '/sw.js',
  '/manifest.webmanifest',
  '/offline',
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
]);

/**
 * Paths the request gate serves without a session.
 * PWA install assets stay public so the worker can precache them.
 */
export function isPublicRequestPath(pathname: string): boolean {
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/cron/')) {
    return true;
  }
  if (PUBLIC_EXACT_PATHS.has(pathname)) {
    return true;
  }
  return PUBLIC_STATIC_EXT.test(pathname);
}
