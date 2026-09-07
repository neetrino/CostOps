import { NEON_RESOURCE_TYPE } from '@/config/constants';
import { allocateUniqueProjectSlug } from '@/core/mapping/allocate-slug';
import { slugifyName } from '@/core/mapping/slugify';
import { prisma } from '@/shared/db';
import type { ProviderKey } from '@/generated/prisma/enums';

/**
 * Neon parity: each discovered neon_project becomes a CostOps Project × NEON
 * until an operator remaps it. Other providers stay unmapped.
 */
export async function ensureProjectForUnmappedResource(input: {
  resourceId: string;
  providerKey: ProviderKey;
  resourceType: string;
  displayName: string;
  externalId: string;
  projectId: string | null;
}): Promise<void> {
  if (input.projectId || input.resourceType !== NEON_RESOURCE_TYPE) {
    return;
  }
  const slug = await allocateUniqueProjectSlug(slugifyName(input.displayName, input.externalId));
  const project = await prisma.project.create({
    data: { slug, name: input.displayName },
  });
  const projectProvider = await prisma.projectProvider.create({
    data: { projectId: project.id, providerKey: input.providerKey },
  });
  await prisma.resource.update({
    where: { id: input.resourceId },
    data: { projectId: project.id, projectProviderId: projectProvider.id },
  });
}
