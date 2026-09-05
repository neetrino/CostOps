import { z } from 'zod';
import { clearAuthFailureIncident } from '@/core/alerts/evaluate-credentials';
import { createPrismaCredentialStore } from '@/core/alerts/prisma-credential-store';
import { parseIsoDateOnly, utcDayKey } from '@/shared/dates';
import { prisma } from '@/shared/db';
import { isPrismaRecordNotFound } from '@/shared/prisma-errors';

const isoDateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => utcDayKey(parseIsoDateOnly(value)) === value, 'Invalid UTC calendar date');

export const credentialPatchBodySchema = z
  .object({
    credentialExpiresAt: z.union([isoDateOnly, z.string().datetime(), z.null()]).optional(),
    markRotated: z.boolean().optional(),
  })
  .refine((data) => data.credentialExpiresAt !== undefined || data.markRotated === true, {
    message: 'Provide credentialExpiresAt and/or markRotated',
  });

export type CredentialPatchView = {
  id: string;
  credentialExpiresAt: string | null;
  credentialRotatedAt: string | null;
  lastAuthFailureAt: string | null;
};

export async function patchProviderAccountCredential(
  id: string,
  input: z.infer<typeof credentialPatchBodySchema>,
  now: Date = new Date(),
): Promise<CredentialPatchView | null> {
  try {
    const updated = await prisma.providerAccount.update({
      where: { id },
      data: {
        ...(input.credentialExpiresAt !== undefined
          ? { credentialExpiresAt: parseExpiresAt(input.credentialExpiresAt) }
          : {}),
        ...(input.markRotated
          ? {
              credentialRotatedAt: now,
              lastAuthFailureAt: null,
              lastAuthFailureCode: null,
            }
          : {}),
      },
      select: {
        id: true,
        credentialExpiresAt: true,
        credentialRotatedAt: true,
        lastAuthFailureAt: true,
      },
    });
    if (input.markRotated) {
      await clearAuthFailureIncident(createPrismaCredentialStore(), id);
    }
    return {
      id: updated.id,
      credentialExpiresAt: updated.credentialExpiresAt?.toISOString() ?? null,
      credentialRotatedAt: updated.credentialRotatedAt?.toISOString() ?? null,
      lastAuthFailureAt: updated.lastAuthFailureAt?.toISOString() ?? null,
    };
  } catch (error) {
    if (isPrismaRecordNotFound(error)) {
      return null;
    }
    throw error;
  }
}

function parseExpiresAt(value: string | null): Date | null {
  if (value === null) {
    return null;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return parseIsoDateOnly(value);
  }
  return new Date(value);
}
