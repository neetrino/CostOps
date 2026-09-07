import type { ProjectOptionsResponse } from '@/features/unmapped/types';
import { prisma } from '@/shared/db';

const LIVE_BOARD_PROVIDER_KEYS = ['NEON', 'VERCEL', 'UPSTASH'] as const;

/** Lightweight catalog for pickers — no cost aggregates. */
export async function loadProjectOptions(
  input: { includeEmpty?: boolean; liveBoard?: boolean } = {},
): Promise<ProjectOptionsResponse> {
  const rows = await prisma.project.findMany({
    where: {
      archived: false,
      ...(input.liveBoard
        ? {
            resources: {
              some: {
                archivedAt: null,
                providerKey: { in: [...LIVE_BOARD_PROVIDER_KEYS] },
              },
            },
          }
        : input.includeEmpty
          ? {}
          : { resources: { some: { archivedAt: null } } }),
    },
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
