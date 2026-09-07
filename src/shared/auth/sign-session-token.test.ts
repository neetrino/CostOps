import { describe, expect, it } from 'vitest';
import { signSessionToken } from '@/shared/auth/sign-session-token';
import { verifySessionToken } from '@/shared/auth/verify-session-token';

describe('session token', () => {
  it('signs and verifies a JWT', async () => {
    const secret = 'abcdefghijklmnopqrstuvwxyz012345';
    const token = signSessionToken(secret, 60);
    await expect(verifySessionToken(token, secret)).resolves.toBe(true);
    await expect(verifySessionToken(token, 'wrong-secret-must-be-32-chars-xx')).resolves.toBe(
      false,
    );
  });
});
