import { createHmac, timingSafeEqual } from 'node:crypto';
import { base64UrlEncode } from '@/shared/auth/jwt-b64url';

function encodeJson(obj: unknown): string {
  const json = JSON.stringify(obj);
  return base64UrlEncode(new TextEncoder().encode(json));
}

/**
 * Creates a compact HS256 JWT (Node-only). Used by the login route.
 */
export function signSessionToken(secret: string, ttlSeconds: number): string {
  const header = encodeJson({ alg: 'HS256', typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const payload = encodeJson({
    role: 'viewer',
    iat: now,
    exp: now + ttlSeconds,
  });
  const signingInput = `${header}.${payload}`;
  const sig = createHmac('sha256', secret).update(signingInput).digest();
  return `${signingInput}.${base64UrlEncode(sig)}`;
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
