import { budgetScopeKey } from '@/core/budgets/scope-key';
import { slugWithSuffix } from '@/core/mapping/slugify';
import type { ResourceLink } from '@/core/sync/upsert-resources';
import { NEON_RESOURCE_TYPE } from '@/config/constants';
import { prisma } from '@/shared/db';
import { getEnv } from '@/shared/env';
import { mergeBudgetRule } from '@/scripts/migrate-from-neon/budget-merge';
import type { PlannedBudgetRule, PlannedProject } from '@/scripts/migrate-from-neon/types';

type ProjectLink = {
  projectId: string;
  projectProviderId: string;
};

async function allocateDbSlug(preferred: string, reserved: Set<string>): Promise<string> {
  for (let attempt = 1; attempt < 50; attempt += 1) {
    const slug = slugWithSuffix(preferred, attempt);
    if (reserved.has(slug)) {
      continue;
    }
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (!existing) {
      reserved.add(slug);
      return slug;
    }
  }
  const fallback = `${preferred}-mig`;
  reserved.add(fallback);
  return fallback;
}

async function projectProviderFor(projectId: string): Promise<ProjectLink> {
  const row = await prisma.projectProvider.upsert({
    where: { projectId_providerKey: { projectId, providerKey: 'NEON' } },
    create: { projectId, providerKey: 'NEON' },
    update: {},
  });
  return { projectId, projectProviderId: row.id };
}

async function resolveProjectLink(
  planned: PlannedProject,
  reservedSlugs: Set<string>,
): Promise<ProjectLink> {
  if (planned.remapSlug) {
    const remapped = await prisma.project.findUnique({ where: { slug: planned.remapSlug } });
    if (!remapped) {
      throw new Error(`Manual remap slug not found: ${planned.remapSlug}`);
    }
    return projectProviderFor(remapped.id);
  }
  const slug = await allocateDbSlug(planned.slug, reservedSlugs);
  const project = await prisma.project.create({
    data: { slug, name: planned.displayName },
  });
  return projectProviderFor(project.id);
}

export async function upsertBudgetRule(
  link: ProjectLink,
  budget: PlannedBudgetRule,
): Promise<string> {
  const scopeKey = budgetScopeKey({
    scope: 'PROJECT_PROVIDER',
    projectProviderId: link.projectProviderId,
  });
  const existing = await prisma.budgetRule.findUnique({ where: { scopeKey } });
  const merge = mergeBudgetRule(
    existing
      ? {
          limitUsd: Number(existing.limitUsd),
          escalationPercent: Number(existing.escalationPercent),
          enabled: existing.enabled,
        }
      : null,
    budget,
  );

  if (merge.action === 'keep') {
    return existing!.id;
  }

  const rule = merge.rule;
  const row = await prisma.budgetRule.upsert({
    where: { scopeKey },
    create: {
      scopeKey,
      scope: 'PROJECT_PROVIDER',
      projectId: link.projectId,
      projectProviderId: link.projectProviderId,
      providerKey: 'NEON',
      limitUsd: rule.limitUsd.toFixed(4),
      escalationPercent: rule.escalationPercent.toFixed(2),
      enabled: rule.enabled,
    },
    update: {
      limitUsd: rule.limitUsd.toFixed(4),
      escalationPercent: rule.escalationPercent.toFixed(2),
      enabled: rule.enabled,
    },
  });
  return row.id;
}

async function persistResource(input: {
  accountId: string;
  planned: PlannedProject;
  link: ProjectLink;
  resourceId?: string;
  now: Date;
  existingArchivedAt: Date | null;
}): Promise<string> {
  const archivedAt = input.planned.ignored
    ? (input.existingArchivedAt ?? input.now)
    : input.existingArchivedAt;
  const data = {
    displayName: input.planned.displayName,
    metadata: { regionId: input.planned.regionId },
    archivedAt,
    projectId: input.link.projectId,
    projectProviderId: input.link.projectProviderId,
  };
  if (input.resourceId) {
    await prisma.resource.update({ where: { id: input.resourceId }, data });
    return input.resourceId;
  }
  const created = await prisma.resource.create({
    data: {
      providerKey: 'NEON',
      providerAccountId: input.accountId,
      externalId: input.planned.externalId,
      resourceType: NEON_RESOURCE_TYPE,
      ...data,
    },
  });
  return created.id;
}

async function upsertOnePlannedProject(input: {
  accountId: string;
  planned: PlannedProject;
  reservedSlugs: Set<string>;
  now: Date;
}): Promise<ResourceLink> {
  const existing = await prisma.resource.findUnique({
    where: {
      providerAccountId_externalId: {
        providerAccountId: input.accountId,
        externalId: input.planned.externalId,
      },
    },
  });
  const reuseLink =
    existing?.projectId && existing.projectProviderId && !input.planned.remapSlug
      ? { projectId: existing.projectId, projectProviderId: existing.projectProviderId }
      : null;
  const link = reuseLink ?? (await resolveProjectLink(input.planned, input.reservedSlugs));
  const resourceId = await persistResource({
    accountId: input.accountId,
    planned: input.planned,
    link,
    resourceId: existing?.id,
    now: input.now,
    existingArchivedAt: existing?.archivedAt ?? null,
  });
  await upsertBudgetRule(link, input.planned.budget);
  return {
    id: resourceId,
    projectId: link.projectId,
    projectProviderId: link.projectProviderId,
    externalId: input.planned.externalId,
  };
}

export async function requireNeonAccountId(): Promise<string> {
  const orgId = getEnv().NEON_ORG_ID;
  if (!orgId) {
    throw new Error(
      'NEON_ORG_ID is required to attach migrated Neon resources to a ProviderAccount.',
    );
  }
  const account = await prisma.providerAccount.findUniqueOrThrow({
    where: { providerKey_externalAccountId: { providerKey: 'NEON', externalAccountId: orgId } },
  });
  return account.id;
}

/** Upserts Resource + Project + ProjectProvider + BudgetRule. Includes ignored IDs. */
export async function upsertPlannedProjects(
  accountId: string,
  projects: PlannedProject[],
  now: Date,
): Promise<Map<string, ResourceLink>> {
  const existing = await prisma.project.findMany({ select: { slug: true } });
  const reservedSlugs = new Set(existing.map((row) => row.slug));
  const links = new Map<string, ResourceLink>();
  for (const planned of projects) {
    const link = await upsertOnePlannedProject({
      accountId,
      planned,
      reservedSlugs,
      now,
    });
    links.set(planned.externalId, link);
  }
  return links;
}
