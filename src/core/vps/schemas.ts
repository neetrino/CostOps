import { z } from 'zod';

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'effectiveOn must be YYYY-MM-DD');

export const createVpsLineBodySchema = z.object({
  displayName: z.string().trim().min(1).max(80),
  monthlyAmountUsd: z.number().finite().positive().max(100_000),
  effectiveOn: isoDateSchema.optional(),
});

export const patchVpsLineBodySchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).optional(),
    monthlyAmountUsd: z.number().finite().positive().max(100_000).optional(),
    effectiveOn: isoDateSchema.optional(),
    archived: z.boolean().optional(),
  })
  .refine(
    (value) =>
      value.displayName !== undefined ||
      value.monthlyAmountUsd !== undefined ||
      value.effectiveOn !== undefined ||
      value.archived !== undefined,
    { message: 'At least one field is required' },
  );

export type CreateVpsLineBody = z.infer<typeof createVpsLineBodySchema>;
export type PatchVpsLineBody = z.infer<typeof patchVpsLineBodySchema>;
