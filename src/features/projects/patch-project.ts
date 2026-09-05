import { z } from 'zod';
import { prisma } from '@/shared/db';
import { isPrismaRecordNotFound } from '@/shared/prisma-errors';

export const projectPatchBodySchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    archived: z.boolean().optional(),
  })
  .refine((data) => data.name !== undefined || data.archived !== undefined, {
    message: 'Provide name and/or archived',
  });

export type ProjectPatchView = {
  id: string;
  slug: string;
  name: string;
  archived: boolean;
};

export async function patchProjectBySlug(
  slug: string,
  input: z.infer<typeof projectPatchBodySchema>,
): Promise<ProjectPatchView | null> {
  try {
    const updated = await prisma.project.update({
      where: { slug },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.archived !== undefined ? { archived: input.archived } : {}),
      },
      select: { id: true, slug: true, name: true, archived: true },
    });
    return updated;
  } catch (error) {
    if (isPrismaRecordNotFound(error)) {
      return null;
    }
    throw error;
  }
}
