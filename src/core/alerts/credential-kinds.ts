import { CREDENTIAL_WARN_DAYS_LONG, CREDENTIAL_WARN_DAYS_SHORT } from '@/config/constants';
import { utcDayKey } from '@/shared/dates';
import type { CredentialAlertKind } from '@/generated/prisma/enums';

const MS_PER_DAY = 86_400_000;

export function expiryWindowKey(expiresAt: Date): string {
  return utcDayKey(expiresAt);
}

export function expiryKindsDue(expiresAt: Date, now: Date): CredentialAlertKind[] {
  const daysLeft = (expiresAt.getTime() - now.getTime()) / MS_PER_DAY;
  if (daysLeft <= 0) {
    return ['EXPIRED'];
  }
  const kinds: CredentialAlertKind[] = [];
  if (daysLeft <= CREDENTIAL_WARN_DAYS_LONG) {
    kinds.push('EXPIRING_30D');
  }
  if (daysLeft <= CREDENTIAL_WARN_DAYS_SHORT) {
    kinds.push('EXPIRING_7D');
  }
  return kinds;
}

export function expiryStatusLine(kind: CredentialAlertKind, expiresAt: Date): string {
  const day = utcDayKey(expiresAt);
  if (kind === 'EXPIRED') {
    return `expired (${day} UTC)`;
  }
  if (kind === 'EXPIRING_7D') {
    return `expires in 7 days (${day} UTC)`;
  }
  return `expires in 30 days (${day} UTC)`;
}
