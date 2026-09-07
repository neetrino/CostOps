import { z } from 'zod';
import { MAX_DASHBOARD_RANGE_DAYS } from '@/config/constants';
import { ProviderKey } from '@/generated/prisma/enums';
import { parseIsoDateOnly, toUtcDateOnly, utcDayKey } from '@/shared/dates';
import { DATE_PRESETS, type DatePreset, resolveDatePreset } from '@/shared/date-presets';

export type GroupBy = 'day' | 'week' | 'month';

export const GROUP_BY_VALUES = ['day', 'week', 'month'] as const;

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const emptyToUndefined = (value: unknown): unknown => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

const isoDateSchema = z
  .string()
  .regex(ISO_DATE_PATTERN, 'Date must be YYYY-MM-DD')
  .refine((value) => utcDayKey(parseIsoDateOnly(value)) === value, 'Invalid UTC calendar date');

const providerKeySchema = z.preprocess((value) => {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  return value.trim().toUpperCase();
}, z.nativeEnum(ProviderKey).optional());

export const dashboardQuerySchema = z.object({
  from: z.preprocess(emptyToUndefined, isoDateSchema.optional()),
  to: z.preprocess(emptyToUndefined, isoDateSchema.optional()),
  preset: z.preprocess(emptyToUndefined, z.enum(DATE_PRESETS).optional()),
  groupBy: z.preprocess(emptyToUndefined, z.enum(GROUP_BY_VALUES).optional()),
  projectId: z.preprocess(emptyToUndefined, z.string().min(1).max(128).optional()),
  providerKey: providerKeySchema,
  metric: z.preprocess(emptyToUndefined, z.string().min(1).max(80).optional()),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

export type ResolvedDashboardQuery = {
  from: Date;
  to: Date;
  fromKey: string;
  toKey: string;
  preset: DatePreset;
  groupBy: GroupBy;
  projectId?: string;
  providerKey?: ProviderKey;
  metric: string;
  calendarDays: number;
};

export type DashboardQueryResult =
  { ok: true; data: ResolvedDashboardQuery } | { ok: false; message: string };

export function calendarDaysInclusive(from: Date, to: Date): number {
  const start = toUtcDateOnly(from).getTime();
  const end = toUtcDateOnly(to).getTime();
  return Math.floor((end - start) / 86_400_000) + 1;
}

export function inferDatePreset(input: {
  preset?: DatePreset;
  from?: string;
  to?: string;
}): DatePreset {
  if (input.preset) {
    return input.preset;
  }
  if (input.from && input.to) {
    return 'custom';
  }
  return 'current_month';
}

/**
 * Zod-validate dashboard filters and resolve UTC from/to (cap 400 days).
 */
export function resolveDashboardQuery(
  raw: Record<string, string | undefined>,
  now: Date = new Date(),
): DashboardQueryResult {
  const parsed = dashboardQuerySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? 'Invalid query' };
  }
  return resolveParsedDashboardQuery(parsed.data, now);
}

export function resolveParsedDashboardQuery(
  input: DashboardQueryInput,
  now: Date = new Date(),
): DashboardQueryResult {
  const preset = inferDatePreset(input);
  const resolved = resolvePresetBounds(preset, input, now);
  if (!resolved.ok) {
    return resolved;
  }
  const from = parseIsoDateOnly(resolved.fromKey);
  const to = parseIsoDateOnly(resolved.toKey);
  if (from > to) {
    return { ok: false, message: 'from must be <= to' };
  }
  const calendarDays = calendarDaysInclusive(from, to);
  if (calendarDays > MAX_DASHBOARD_RANGE_DAYS) {
    return {
      ok: false,
      message: `Date range cannot exceed ${MAX_DASHBOARD_RANGE_DAYS} days`,
    };
  }
  return {
    ok: true,
    data: {
      from,
      to,
      fromKey: resolved.fromKey,
      toKey: resolved.toKey,
      preset,
      groupBy: input.groupBy ?? 'day',
      projectId: input.projectId,
      providerKey: input.providerKey,
      metric: input.metric ?? 'cost',
      calendarDays,
    },
  };
}

export type RangePayload = {
  from: string;
  to: string;
  preset: DatePreset;
  groupBy: GroupBy;
  calendarDays: number;
};

export function rangePayload(query: ResolvedDashboardQuery): RangePayload {
  return {
    from: query.fromKey,
    to: query.toKey,
    preset: query.preset,
    groupBy: query.groupBy,
    calendarDays: query.calendarDays,
  };
}

export function parseProviderKeyParam(key: string): ProviderKey | null {
  const normalized = key.trim().toUpperCase();
  return normalized in ProviderKey ? (normalized as ProviderKey) : null;
}

function resolvePresetBounds(
  preset: DatePreset,
  input: DashboardQueryInput,
  now: Date,
): { ok: true; fromKey: string; toKey: string } | { ok: false; message: string } {
  if (preset !== 'custom') {
    const bounds = resolveDatePreset(preset, now);
    return { ok: true, fromKey: bounds.from, toKey: bounds.to };
  }
  if (!input.from || !input.to) {
    return { ok: false, message: 'custom range requires from and to' };
  }
  return { ok: true, fromKey: input.from, toKey: input.to };
}
