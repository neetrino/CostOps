import type { ProjectOptionsResponse } from '@/features/unmapped/types';
import { prisma } from '@/shared/db';

/** Lightweight catalog for the unmapped picker — no cost aggregates. */
export async function loadProjectOptions(): Promise<ProjectOptionsResponse> {
  const rows = await prisma.project.findMany({
    where: { archived: false },
    select: {
      id: true,
      name: true,
      slug: true,
      archived: true,
      projectProviders: { select: { providerKey: true }, orderBy: { providerKey: 'asc' } },
    },
    orderBy: [{ name: 'asc' }, { slug: 'asc' }],
  });
  return {
    projects: rows.map((project) => ({
      id: project.id,
      name: project.name,
      slug: project.slug,
      archived: project.archived,
      providerKeys: project.projectProviders.map((link) => link.providerKey),
    })),
  };
}
