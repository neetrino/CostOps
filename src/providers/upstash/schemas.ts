import { z } from 'zod';

export const upstashTimeSeriesPointSchema = z
  .object({
    x: z.string().min(1),
    y: z.number(),
  })
  .passthrough();

export type UpstashTimeSeriesPoint = z.infer<typeof upstashTimeSeriesPointSchema>;

/** Safe Redis list fields only — live payloads also include rest tokens. */
export const upstashRedisDatabaseSchema = z.object({
  database_id: z.string().min(1),
  database_name: z.string().min(1),
  type: z.string().optional(),
  database_type: z.string().optional(),
  region: z.string().optional(),
  primary_region: z.string().optional(),
  state: z.string().optional(),
});

export type UpstashRedisDatabase = z.infer<typeof upstashRedisDatabaseSchema>;

export const upstashIndexSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().optional(),
  region: z.string().optional(),
});

export type UpstashIndex = z.infer<typeof upstashIndexSchema>;

/** QStash user without token / read_only_token. */
export const upstashQstashUserSchema = z.object({
  id: z.string().min(1),
  state: z.string().optional(),
  active: z.boolean().optional(),
  type: z.string().optional(),
  region: z.string().optional(),
});

export type UpstashQstashUser = z.infer<typeof upstashQstashUserSchema>;

export const upstashRedisStatsSchema = z
  .object({
    dailybilling: z.array(upstashTimeSeriesPointSchema).optional(),
    dailyrequests: z.array(upstashTimeSeriesPointSchema).optional(),
    total_monthly_billing: z.number().optional(),
  })
  .passthrough();

export type UpstashRedisStats = z.infer<typeof upstashRedisStatsSchema>;

export const upstashQstashStatsSchema = z
  .object({
    daily_billings: z.array(upstashTimeSeriesPointSchema).optional(),
    daily_requests: z.array(upstashTimeSeriesPointSchema).optional(),
    total_monthly_billing: z.number().optional(),
  })
  .passthrough();

export type UpstashQstashStats = z.infer<typeof upstashQstashStatsSchema>;

export const upstashVectorSearchStatsSchema = z
  .object({
    monthly_cost: z.number().optional(),
  })
  .passthrough();

export function parseUpstashList<T>(schema: z.ZodType<T>, raw: unknown, label: string): T[] {
  const parsed = z.array(schema).safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid Upstash ${label}: ${parsed.error.message}`);
  }
  return parsed.data;
}

export function parseUpstashObject<T>(schema: z.ZodType<T>, raw: unknown, label: string): T {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(`Invalid Upstash ${label}: ${parsed.error.message}`);
  }
  return parsed.data;
}
