export type CredentialHealth = 'ok' | 'auth_failed' | 'error' | 'unknown';

/**
 * Admin credential health from the last live provider request.
 * Calendar expiry dates are not used — vendors do not return them, and we do not store them.
 */
export function credentialHealth(input: {
  lastAuthFailureAt: Date | null;
  lastErrorAt?: Date | null;
  lastSuccessfulSyncAt: Date | null;
}): { health: CredentialHealth } {
  if (input.lastAuthFailureAt) {
    return { health: 'auth_failed' };
  }
  if (input.lastErrorAt) {
    return { health: 'error' };
  }
  if (input.lastSuccessfulSyncAt) {
    return { health: 'ok' };
  }
  return { health: 'unknown' };
}
