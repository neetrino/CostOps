import { describe, expect, it } from 'vitest';
import { credentialHealth } from '@/core/alerts/credential-health';

describe('credentialHealth', () => {
  it('treats a live 401/403 as auth_failed even if a leftover expiry date exists', () => {
    expect(
      credentialHealth({
        lastAuthFailureAt: new Date('2026-09-07T10:00:00Z'),
        lastErrorAt: new Date('2026-09-07T10:00:00Z'),
        lastSuccessfulSyncAt: new Date('2026-09-01T00:00:00Z'),
      }).health,
    ).toBe('auth_failed');
  });

  it('shows error when the last request failed without an auth rejection', () => {
    expect(
      credentialHealth({
        lastAuthFailureAt: null,
        lastErrorAt: new Date('2026-09-07T10:00:00Z'),
        lastSuccessfulSyncAt: new Date('2026-09-01T00:00:00Z'),
      }).health,
    ).toBe('error');
  });

  it('is ok after a successful sync', () => {
    expect(
      credentialHealth({
        lastAuthFailureAt: null,
        lastErrorAt: null,
        lastSuccessfulSyncAt: new Date('2026-09-07T10:00:00Z'),
      }).health,
    ).toBe('ok');
  });

  it('is unknown before the first successful request', () => {
    expect(
      credentialHealth({
        lastAuthFailureAt: null,
        lastErrorAt: null,
        lastSuccessfulSyncAt: null,
      }).health,
    ).toBe('unknown');
  });
});
