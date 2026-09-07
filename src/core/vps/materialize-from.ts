import { startOfUtcMonth } from '@/shared/dates';

/**
 * Amount edits rewrite the current UTC month and later.
 * Past booked months stay as written.
 */
export function vpsMaterializeFrom(input: {
  now: Date;
  effectiveOn: Date;
  amountChanged: boolean;
}): Date {
  const rewriteFrom = input.amountChanged ? startOfUtcMonth(input.now) : input.effectiveOn;
  return rewriteFrom.getTime() < input.effectiveOn.getTime() ? input.effectiveOn : rewriteFrom;
}
