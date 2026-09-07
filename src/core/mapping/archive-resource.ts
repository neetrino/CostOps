import { z } from 'zod';
import { prisma } from '@/shared/db';

export const resourceArchiveBodySchema = z.object({
  archived: z.boolean(),
});

export type ResourceArchiveView = {
  id: string;
  archivedAt: string | null;
};

export type ResourceArchiveResult =
  | { ok: true; data: ResourceArchiveView }
  | { ok: false; code: 'NOT_FOUND' | 'MAPPED'; message: string };

/**
 * Hide an unmapped resource from the inbox, or restore it. History rows stay.
 */
export async function setResourceArchived(input: {
  resourceId: string;
  archived: boolean;
}): Promise<ResourceArchiveResult> {
  const resource = await prisma.resource.findUnique({ where: { id: input.resourceId } });
  if (!resource) {
    return { ok: false, code: 'NOT_FOUND', message: 'Resource not found' };
  }
  if (input.archived && resource.projectId) {
    return { ok: false, code: 'MAPPED', message: 'Unmap the resource before archiving' };
  }
  const nextArchivedAt = input.archived ? (resource.archivedAt ?? new Date()) : null;
  if (resource.archivedAt?.getTime() === nextArchivedAt?.getTime()) {
    return { ok: true, data: toView(resource.id, resource.archivedAt) };
  }
  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: { archivedAt: nextArchivedAt },
    select: { id: true, archivedAt: true },
  });
  return { ok: true, data: toView(updated.id, updated.archivedAt) };
}

function toView(id: string, archivedAt: Date | null): ResourceArchiveView {
  return { id, archivedAt: archivedAt?.toISOString() ?? null };
}
