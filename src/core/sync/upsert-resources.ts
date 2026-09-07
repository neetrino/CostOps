import { ensureProjectForUnmappedResource } from '@/core/mapping/ensure-project-for-resource';
import { prisma } from '@/shared/db';
import type { ProviderKey } from '@/generated/prisma/enums';
import type { ResourceSyncResult } from '@/providers/types';

export type ResourceLink = {
  id: string;
  projectId: string | null;
  projectProviderId: string | null;
  externalId: string;
};

export async function upsertDiscoveredResources(input: {
  providerKey: ProviderKey;
  providerAccountId: string;
  discovered: ResourceSyncResult['discovered'];
}): Promise<Map<string, ResourceLink>> {
  const byExternalId = new Map<string, ResourceLink>();
  for (const item of input.discovered) {
    const row = await prisma.resource.upsert({
      where: {
        providerAccountId_externalId: {
          providerAccountId: input.providerAccountId,
          externalId: item.externalId,
        },
      },
      create: {
        providerKey: input.providerKey,
        providerAccountId: input.providerAccountId,
        externalId: item.externalId,
        displayName: item.displayName,
        resourceType: item.resourceType,
        metadata: item.metadata ?? undefined,
      },
      update: {
        displayName: item.displayName,
        metadata: item.metadata ?? undefined,
      },
    });
    await ensureProjectForUnmappedResource({
      resourceId: row.id,
      providerKey: input.providerKey,
      resourceType: item.resourceType,
      displayName: item.displayName,
      externalId: item.externalId,
      projectId: row.projectId,
    });
    const fresh = await prisma.resource.findUniqueOrThrow({ where: { id: row.id } });
    // Archived rows stay linked so spend does not detach from the resource.
    byExternalId.set(fresh.externalId, {
      id: fresh.id,
      projectId: fresh.projectId,
      projectProviderId: fresh.projectProviderId,
      externalId: fresh.externalId,
    });
  }
  return byExternalId;
}

export async function loadAccountResources(
  providerAccountId: string,
): Promise<Map<string, ResourceLink>> {
  const rows = await prisma.resource.findMany({
    where: { providerAccountId },
  });
  return new Map(
    rows.map((row) => [
      row.externalId,
      {
        id: row.id,
        projectId: row.projectId,
        projectProviderId: row.projectProviderId,
        externalId: row.externalId,
      },
    ]),
  );
}
