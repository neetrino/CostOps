import { prisma } from '@/shared/db';

export type RemoveEmptyVpsAttachmentResult =
  | { ok: true; data: { id: string } }
  | { ok: false; code: 'NOT_FOUND' | 'CONFLICT'; message: string };

/**
 * Drops a VPS Project × Provider link that has no active line.
 * The project stays. Archived lines and past cost rows stay.
 */
export async function removeEmptyVpsAttachment(
  projectProviderId: string,
): Promise<RemoveEmptyVpsAttachmentResult> {
  const link = await prisma.projectProvider.findUnique({
    where: { id: projectProviderId },
    include: {
      _count: { select: { resources: { where: { archivedAt: null } } } },
    },
  });
  if (!link) {
    return { ok: false, code: 'NOT_FOUND', message: 'VPS attachment not found' };
  }
  if (link.providerKey !== 'HETZNER') {
    return {
      ok: false,
      code: 'CONFLICT',
      message: 'Only empty VPS attachments can be removed',
    };
  }
  if (link._count.resources > 0) {
    return {
      ok: false,
      code: 'CONFLICT',
      message: 'Stop the active VPS line first',
    };
  }
  await prisma.projectProvider.delete({ where: { id: link.id } });
  return { ok: true, data: { id: link.id } };
}
