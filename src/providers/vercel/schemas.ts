import { z } from 'zod';

const paginationCursorSchema = z.union([z.number(), z.string(), z.null()]).optional();

export const vercelProjectsResponseSchema = z
  .object({
    projects: z.array(
      z
        .object({
          id: z.string().min(1),
          name: z.string().min(1),
          framework: z.string().nullable().optional(),
        })
        .passthrough(),
    ),
    pagination: z
      .object({
        count: z.number().optional(),
        next: paginationCursorSchema,
        prev: paginationCursorSchema,
      })
      .passthrough(),
  })
  .passthrough();

export type VercelProjectsResponse = z.infer<typeof vercelProjectsResponseSchema>;
export type VercelProjectListItem = VercelProjectsResponse['projects'][number];

export const vercelFocusTagsSchema = z
  .object({
    ProjectId: z.string().optional(),
    ProjectName: z.string().optional(),
  })
  .passthrough();

export const vercelFocusChargeSchema = z
  .object({
    BilledCost: z.number(),
    BillingCurrency: z.string(),
    ChargeCategory: z.string(),
    ChargePeriodStart: z.string(),
    ChargePeriodEnd: z.string(),
    ConsumedQuantity: z.number().nullable(),
    ConsumedUnit: z.string().nullable(),
    EffectiveCost: z.number(),
    ServiceName: z.string(),
    ServiceCategory: z.string().optional(),
    ServiceProviderName: z.string().optional(),
    Tags: vercelFocusTagsSchema,
    PricingCategory: z.string().optional(),
    PricingCurrency: z.string().optional(),
    PricingQuantity: z.number().optional(),
    PricingUnit: z.string().optional(),
    RegionId: z.string().optional(),
    RegionName: z.string().optional(),
  })
  .passthrough();

export type VercelFocusCharge = z.infer<typeof vercelFocusChargeSchema>;

export const vercelErrorEnvelopeSchema = z
  .object({
    error: z
      .object({
        code: z.string().optional(),
        message: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export function parseVercelErrorCode(body: string): string | null {
  try {
    const parsed = vercelErrorEnvelopeSchema.safeParse(JSON.parse(body));
    return parsed.success ? (parsed.data.error.code ?? null) : null;
  } catch {
    return null;
  }
}

export function parseVercelJsonlCharges(body: string): VercelFocusCharge[] {
  const charges: VercelFocusCharge[] = [];
  const lines = body.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!line || line.trim().length === 0) {
      continue;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(line);
    } catch {
      throw new Error(`Invalid Vercel charges JSONL at line ${index + 1}`);
    }
    const parsed = vercelFocusChargeSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Invalid Vercel charge at line ${index + 1}: ${parsed.error.message}`);
    }
    charges.push(parsed.data);
  }
  return charges;
}
