import { allocateUniqueProjectSlug } from '@/core/mapping/allocate-slug';
import { assignResourceToProject } from '@/core/mapping/assign-resource';
import { slugifyName } from '@/core/mapping/slugify';
import { standaloneProjectBlockReason } from '@/core/mapping/standalone-project';
import { prisma } from '@/shared/db';

export type CreateProjectForResourceResult =
  | { ok: true; data: { projectId: string; slug: string; name: string } }
  | { ok: false; code: 'NOT_FOUND' | 'MAPPED' | 'UNALLOCATED' | 'CONFLICT'; message: string };

export { standaloneProjectBlockReason } from '@/core/mapping/standalone-project';

/**
 * Turns an inbox resource into its own CostOps project (one provider is enough).
 */
export async function createProjectForResource(
  resourceId: string,
): Promise<CreateProjectForResourceResult> {
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource) {
    return { ok: false, code: 'NOT_FOUND', message: 'Resource not found' };
  }
  const blocked = standaloneProjectBlockReason(resource);
  if (blocked === 'MAPPED') {
    return { ok: false, code: 'MAPPED', message: 'Resource is already mapped' };
  }
  if (blocked === 'UNALLOCATED') {
    return {
      ok: false,
      code: 'UNALLOCATED',
      message: 'Team leftover spend cannot become a project',
    };
  }
  const slug = await allocateUniqueProjectSlug(
    slugifyName(resource.displayName, resource.externalId),
  );
  const project = await prisma.project.create({
    data: { slug, name: resource.displayName },
  });
  const mapped = await assignResourceToProject({
    resourceId: resource.id,
    projectId: project.id,
  });
  if (!mapped.ok) {
    await prisma.project.delete({ where: { id: project.id } });
    return { ok: false, code: mapped.code, message: mapped.message };
  }
  return { ok: true, data: { projectId: project.id, slug: project.slug, name: project.name } };
}
