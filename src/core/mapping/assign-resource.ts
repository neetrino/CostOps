import { z } from 'zod';
import { ensureProjectProviderBudgetRule } from '@/core/budgets/ensure-project-provider-rule';
import type { ProviderKey } from '@/generated/prisma/enums';
import { prisma } from '@/shared/db';
import { isPrismaUniqueViolation } from '@/shared/prisma-errors';

export const resourceMappingBodySchema = z.object({
  projectId: z.string().min(1).max(128).nullable(),
});

export type ResourceMappingView = {
  id: string;
  projectId: string | null;
  projectProviderId: string | null;
};

export type ResourceMappingResult =
  | { ok: true; data: ResourceMappingView }
  | { ok: false; code: 'NOT_FOUND' | 'CONFLICT'; message: string };

/**
 * Assign or unassign a Resource to a Project. History rows follow the mapping.
 */
export async function assignResourceToProject(input: {
  resourceId: string;
  projectId: string | null;
}): Promise<ResourceMappingResult> {
  const resource = await prisma.resource.findUnique({ where: { id: input.resourceId } });
  if (!resource) {
    return { ok: false, code: 'NOT_FOUND', message: 'Resource not found' };
  }
  if (input.projectId === null) {
    return applyMapping(resource.id, null, null);
  }
  const project = await prisma.project.findUnique({ where: { id: input.projectId } });
  if (!project) {
    return { ok: false, code: 'NOT_FOUND', message: 'Project not found' };
  }
  try {
    const projectProvider = await findOrCreateProjectProvider(project.id, resource.providerKey);
    const mapped = await applyMapping(resource.id, project.id, projectProvider.id);
    await ensureProjectProviderBudgetRule({
      projectId: project.id,
      projectProviderId: projectProvider.id,
      providerKey: resource.providerKey,
    });
    return mapped;
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return { ok: false, code: 'CONFLICT', message: 'Mapping conflict' };
    }
    throw error;
  }
}

async function findOrCreateProjectProvider(
  projectId: string,
  providerKey: ProviderKey,
): Promise<{ id: string }> {
  const existing = await prisma.projectProvider.findUnique({
    where: { projectId_providerKey: { projectId, providerKey } },
    select: { id: true },
  });
  if (existing) {
    return existing;
  }
  try {
    return await prisma.projectProvider.create({
      data: { projectId, providerKey },
      select: { id: true },
    });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return prisma.projectProvider.findUniqueOrThrow({
        where: { projectId_providerKey: { projectId, providerKey } },
        select: { id: true },
      });
    }
    throw error;
  }
}

async function applyMapping(
  resourceId: string,
  projectId: string | null,
  projectProviderId: string | null,
): Promise<ResourceMappingResult> {
  await prisma.$transaction([
    prisma.resource.update({
      where: { id: resourceId },
      data: {
        projectId,
        projectProviderId,
        ...(projectId ? { archivedAt: null } : {}),
      },
    }),
    prisma.costEntry.updateMany({
      where: { resourceId },
      data: { projectId, projectProviderId },
    }),
    prisma.metricEntry.updateMany({
      where: { resourceId },
      data: { projectId, projectProviderId },
    }),
  ]);
  return { ok: true, data: { id: resourceId, projectId, projectProviderId } };
}
