import { describe, expect, it } from 'vitest';
import { isVercelAuthFailure, VercelApiError } from '@/providers/vercel/errors';

describe('isVercelAuthFailure', () => {
  it('treats 401 and 403 API errors as auth failures', () => {
    expect(isVercelAuthFailure(new VercelApiError(401, '/v10/projects', 'unauthorized'))).toBe(
      true,
    );
    expect(isVercelAuthFailure(new VercelApiError(403, '/v10/projects', 'forbidden'))).toBe(true);
    expect(isVercelAuthFailure(new Error('Vercel API 401: denied'))).toBe(true);
    expect(isVercelAuthFailure(new Error('Vercel API 403: denied'))).toBe(true);
  });

  it('does not treat other failures as auth failures', () => {
    expect(isVercelAuthFailure(new VercelApiError(404, '/v1/billing/charges', 'not found'))).toBe(
      false,
    );
    expect(isVercelAuthFailure(new VercelApiError(500, '/v10/projects', 'oops'))).toBe(false);
    expect(isVercelAuthFailure(new Error('network down'))).toBe(false);
    expect(isVercelAuthFailure('nope')).toBe(false);
  });
});
