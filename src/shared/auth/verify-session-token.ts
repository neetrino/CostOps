import { z } from 'zod';
import { base64UrlDecodeToBytes } from '@/shared/auth/jwt-b64url';

const jwtPayloadSchema = z.object({
  exp: z.number(),
});

/**
 * Verifies HS256 JWT using Web Crypto. Must match `signSessionToken`.
 */
export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  const [header, payload, signature] = parts as [string, string, string];
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const sigBytes = new Uint8Array(base64UrlDecodeToBytes(signature));
  const data = new TextEncoder().encode(`${header}.${payload}`);
  let ok: boolean;
  try {
    ok = await crypto.subtle.verify('HMAC', key, sigBytes, data);
  } catch {
    return false;
  }
  if (!ok) {
    return false;
  }

  try {
    const json = new TextDecoder().decode(base64UrlDecodeToBytes(payload));
    const parsed = jwtPayloadSchema.safeParse(JSON.parse(json) as unknown);
    if (!parsed.success) {
      return false;
    }
    return parsed.data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
