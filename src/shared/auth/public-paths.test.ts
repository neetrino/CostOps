import { describe, expect, it } from 'vitest';
import { isPublicRequestPath } from '@/shared/auth/public-paths';

describe('isPublicRequestPath', () => {
  it('allows PWA install assets and the offline fallback', () => {
    expect(isPublicRequestPath('/sw.js')).toBe(true);
    expect(isPublicRequestPath('/manifest.webmanifest')).toBe(true);
    expect(isPublicRequestPath('/offline')).toBe(true);
    expect(isPublicRequestPath('/icons/icon-192.png')).toBe(true);
    expect(isPublicRequestPath('/icons/icon-512.png')).toBe(true);
  });

  it('allows the existing unauthenticated app and health paths', () => {
    expect(isPublicRequestPath('/login')).toBe(true);
    expect(isPublicRequestPath('/api/auth/login')).toBe(true);
    expect(isPublicRequestPath('/api/auth/logout')).toBe(true);
    expect(isPublicRequestPath('/api/health')).toBe(true);
    expect(isPublicRequestPath('/api/cron/sync/neon')).toBe(true);
    expect(isPublicRequestPath('/_next/static/chunks/app.js')).toBe(true);
    expect(isPublicRequestPath('/favicon.ico')).toBe(true);
    expect(isPublicRequestPath('/icon')).toBe(true);
    expect(isPublicRequestPath('/icon.svg')).toBe(true);
    expect(isPublicRequestPath('/apple-icon')).toBe(true);
  });

  it('keeps the dashboard and JSON APIs behind the session gate', () => {
    expect(isPublicRequestPath('/')).toBe(false);
    expect(isPublicRequestPath('/projects/demo')).toBe(false);
    expect(isPublicRequestPath('/api/overview')).toBe(false);
    expect(isPublicRequestPath('/api/sync/now')).toBe(false);
    expect(isPublicRequestPath('/sw.js.bak')).toBe(false);
  });
});
