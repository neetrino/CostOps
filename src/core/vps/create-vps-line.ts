import { randomUUID } from 'node:crypto';
import { HETZNER_RESOURCE_TYPE } from '@/config/constants';
import { materializeFixedVpsCosts } from '@/core/cost/materialize-fixed';
import { findOrCreateProjectProvider } from '@/core/mapping';
import { ensureHetznerAccount } from '@/core/sync/ensure-hetzner-account';
import type { CreateVpsLineBody } from '@/core/vps/schemas';
import { prisma } from '@/shared/db';
import { parseIsoDateOnly, startOfUtcMonth, toUtcDateOnly } from '@/shared/dates';
import { decimalToNumber, toFixedUsd } from '@/shared/money';

export type VpsLineView = {
  id: string;
  displayName: string;
  monthlyAmountUsd: number;
  effectiveOn: string;
  archived: boolean;
};

export type CreateVpsLineResult =
  { ok: true; data: VpsLineView } | { ok: false; code: 'NOT_FOUND'; message: string };

export async function createVpsLine(
  slug: string,
  body: CreateVpsLineBody,
  now: Date = new Date(),
): Promise<CreateVpsLineResult> {
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return { ok: false, code: 'NOT_FOUND', message: 'Project not found' };
  }
  const account = await ensureHetznerAccount();
  const effectiveOn = startOfUtcMonth(body.effectiveOn ? parseIsoDateOnly(body.effectiveOn) : now);
  const link = await findOrCreateProjectProvider(project.id, 'HETZNER');
  const resource = await prisma.resource.create({
    data: {
      providerKey: 'HETZNER',
      providerAccountId: account.id,
      projectId: project.id,
      projectProviderId: link.id,
      externalId: `vps:${randomUUID()}`,
      displayName: body.displayName,
      resourceType: HETZNER_RESOURCE_TYPE,
      fixedMonthlyUsd: toFixedUsd(body.monthlyAmountUsd, 4),
      fixedEffectiveOn: effectiveOn,
    },
  });
  await materializeFixedVpsCosts({
    providerAccountId: account.id,
    resourceId: resource.id,
    range: { from: effectiveOn, to: toUtcDateOnly(now) },
    now,
  });
  return {
    ok: true,
    data: {
      id: resource.id,
      displayName: resource.displayName,
      monthlyAmountUsd: decimalToNumber(resource.fixedMonthlyUsd ?? body.monthlyAmountUsd),
      effectiveOn: effectiveOn.toISOString().slice(0, 10),
      archived: false,
    },
  };
}
