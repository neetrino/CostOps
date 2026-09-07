import { NEON_RESOURCE_TYPE } from '@/config/constants';
import { prisma } from '@/shared/db';
import { slugifyName, slugWithSuffix } from '@/core/mapping/slugify';
import type { ProviderKey } from '@/generated/prisma/enums';

async function uniqueProjectSlug(base: string): Promise<string> {
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const slug = slugWithSuffix(base, attempt);
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (!existing) {
      return slug;
    }
  }
  return `${base}-${Date.now().toString(36)}`;
}

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
  const slug = await uniqueProjectSlug(slugifyName(input.displayName, input.externalId));
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
