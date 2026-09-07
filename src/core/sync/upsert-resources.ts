import { ensureProjectForUnmappedResource } from '@/core/mapping/ensure-project-for-resource';
import { shouldArchiveMissingResources } from '@/core/sync/archive-missing-resources';
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
    const fresh = await refreshDiscoveredResource(row.id);
    // Archived rows stay linked so spend does not detach from the resource.
    byExternalId.set(fresh.externalId, fresh);
  }
  await archiveResourcesMissingFromDiscovery({
    providerAccountId: input.providerAccountId,
    discoveredIds: input.discovered.map((item) => item.externalId),
  });
  return byExternalId;
}

async function refreshDiscoveredResource(resourceId: string): Promise<ResourceLink> {
  const row = await prisma.resource.findUniqueOrThrow({
    where: { id: resourceId },
    select: {
      id: true,
      projectId: true,
      projectProviderId: true,
      externalId: true,
      archivedAt: true,
    },
  });
  if (!row.archivedAt || !row.projectId) {
    return {
      id: row.id,
      projectId: row.projectId,
      projectProviderId: row.projectProviderId,
      externalId: row.externalId,
    };
  }
  return prisma.resource.update({
    where: { id: row.id },
    data: { archivedAt: null },
    select: { id: true, projectId: true, projectProviderId: true, externalId: true },
  });
}

async function archiveResourcesMissingFromDiscovery(input: {
  providerAccountId: string;
  discoveredIds: string[];
}): Promise<void> {
  if (!shouldArchiveMissingResources(input.discoveredIds.length)) {
    return;
  }
  await prisma.resource.updateMany({
    where: {
      providerAccountId: input.providerAccountId,
      archivedAt: null,
      externalId: { notIn: input.discoveredIds },
    },
    data: { archivedAt: new Date() },
  });
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
