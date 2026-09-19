import { toUtcDateOnly } from '@/shared/dates';

/**
 * Amount edits rewrite from the chosen day (default today).
 * Earlier booked days stay. Never walk back before the purchase start.
 */
export function vpsMaterializeFrom(input: {
  now: Date;
  purchaseStart: Date;
  amountFrom: Date;
  amountChanged: boolean;
}): Date {
  const purchaseStart = toUtcDateOnly(input.purchaseStart);
  if (!input.amountChanged) {
    return purchaseStart;
  }
  const today = toUtcDateOnly(input.now);
  const amountFrom = toUtcDateOnly(input.amountFrom);
  const from = amountFrom.getTime() < purchaseStart.getTime() ? purchaseStart : amountFrom;
  return from.getTime() > today.getTime() ? today : from;
}
