import { utcDayKey } from '@/shared/dates';

export function metricIdempotencyKey(input: {
  providerKey: string;
  providerAccountId: string;
  externalId: string;
  bucketDate: Date;
  metricKey: string;
}): string {
  const day = utcDayKey(input.bucketDate);
  return `metric:${input.providerKey}:${input.providerAccountId}:${input.externalId}:${day}:${input.metricKey}`;
}
