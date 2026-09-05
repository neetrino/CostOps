import { CREDENTIAL_WARN_DAYS_LONG, MS_PER_DAY } from '@/config/constants';

export type CredentialHealth = 'ok' | 'expiring' | 'expired' | 'auth_failed' | 'unknown';

export function daysUntilExpiry(expiresAt: Date, now: Date): number {
  return Math.floor((expiresAt.getTime() - now.getTime()) / MS_PER_DAY);
}

/**
 * Admin credential health. Auth failure wins over expiry.
 */
export function credentialHealth(input: {
  lastAuthFailureAt: Date | null;
  credentialExpiresAt: Date | null;
  lastSuccessfulSyncAt: Date | null;
  now: Date;
}): { health: CredentialHealth; daysUntilExpiry: number | null } {
  if (input.lastAuthFailureAt) {
    return {
      health: 'auth_failed',
      daysUntilExpiry: input.credentialExpiresAt
        ? daysUntilExpiry(input.credentialExpiresAt, input.now)
        : null,
    };
  }
  if (input.credentialExpiresAt) {
    const days = daysUntilExpiry(input.credentialExpiresAt, input.now);
    if (days < 0) {
      return { health: 'expired', daysUntilExpiry: days };
    }
    if (days <= CREDENTIAL_WARN_DAYS_LONG) {
      return { health: 'expiring', daysUntilExpiry: days };
    }
    return { health: 'ok', daysUntilExpiry: days };
  }
  if (input.lastSuccessfulSyncAt) {
    return { health: 'ok', daysUntilExpiry: null };
  }
  return { health: 'unknown', daysUntilExpiry: null };
}
