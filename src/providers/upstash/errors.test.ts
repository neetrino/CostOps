import { describe, expect, it } from 'vitest';
import { isUpstashAuthFailure, UpstashApiError } from '@/providers/upstash/errors';

describe('isUpstashAuthFailure', () => {
  it('treats 401 and 403 API errors as auth failures', () => {
    expect(isUpstashAuthFailure(new UpstashApiError(401, '/redis/databases', 'unauthorized'))).toBe(
      true,
    );
    expect(isUpstashAuthFailure(new UpstashApiError(403, '/redis/databases', 'forbidden'))).toBe(
      true,
    );
    expect(isUpstashAuthFailure(new Error('Upstash API 401: denied'))).toBe(true);
    expect(isUpstashAuthFailure(new Error('Upstash API 403: denied'))).toBe(true);
  });

  it('does not treat other failures as auth failures', () => {
    expect(isUpstashAuthFailure(new UpstashApiError(400, '/qstash/stats/id', 'bad period'))).toBe(
      false,
    );
    expect(isUpstashAuthFailure(new UpstashApiError(500, '/redis/stats/id', 'oops'))).toBe(false);
    expect(isUpstashAuthFailure(new Error('network down'))).toBe(false);
    expect(isUpstashAuthFailure('nope')).toBe(false);
  });
});
