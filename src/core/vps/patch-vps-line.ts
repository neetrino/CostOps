import { materializeFixedVpsCosts } from '@/core/cost/materialize-fixed';
import type { VpsLineView } from '@/core/vps/create-vps-line';
import { vpsMaterializeFrom } from '@/core/vps/materialize-from';
import type { PatchVpsLineBody } from '@/core/vps/schemas';
import { prisma } from '@/shared/db';
import { parseIsoDateOnly, toUtcDateOnly, utcDayKey } from '@/shared/dates';
import { decimalToNumber, toFixedUsd } from '@/shared/money';

export type PatchVpsLineResult =
  { ok: true; data: VpsLineView } | { ok: false; code: 'NOT_FOUND'; message: string };

export async function patchVpsLine(
  resourceId: string,
  body: PatchVpsLineBody,
  now: Date = new Date(),
): Promise<PatchVpsLineResult> {
  const resource = await prisma.resource.findUnique({ where: { id: resourceId } });
  if (!resource || resource.providerKey !== 'HETZNER') {
    return { ok: false, code: 'NOT_FOUND', message: 'VPS line not found' };
  }
  const purchaseStart = resource.fixedEffectiveOn ?? toUtcDateOnly(now);
  const amountFrom = body.effectiveOn
    ? toUtcDateOnly(parseIsoDateOnly(body.effectiveOn))
    : toUtcDateOnly(now);
  const nextArchivedAt =
    body.archived === undefined
      ? resource.archivedAt
      : body.archived
        ? (resource.archivedAt ?? now)
        : null;
  const updated = await prisma.resource.update({
    where: { id: resource.id },
    data: {
      displayName: body.displayName ?? resource.displayName,
      fixedMonthlyUsd:
        body.monthlyAmountUsd !== undefined
          ? toFixedUsd(body.monthlyAmountUsd, 4)
          : resource.fixedMonthlyUsd,
      archivedAt: nextArchivedAt,
    },
  });
  const effectiveOn = updated.fixedEffectiveOn ?? purchaseStart;
  if (!updated.archivedAt && updated.fixedMonthlyUsd) {
    await rematerializePatchedLine({
      providerAccountId: updated.providerAccountId,
      resourceId: updated.id,
      purchaseStart: effectiveOn,
      amountFrom,
      amountChanged: body.monthlyAmountUsd !== undefined,
      now,
    });
  }
  return {
    ok: true,
    data: {
      id: updated.id,
      displayName: updated.displayName,
      monthlyAmountUsd: updated.fixedMonthlyUsd
        ? decimalToNumber(updated.fixedMonthlyUsd)
        : (body.monthlyAmountUsd ?? 0),
      effectiveOn: utcDayKey(effectiveOn),
      archived: Boolean(updated.archivedAt),
    },
  };
}

async function rematerializePatchedLine(input: {
  providerAccountId: string;
  resourceId: string;
  purchaseStart: Date;
  amountFrom: Date;
  amountChanged: boolean;
  now: Date;
}): Promise<void> {
  const from = vpsMaterializeFrom({
    now: input.now,
    purchaseStart: input.purchaseStart,
    amountFrom: input.amountFrom,
    amountChanged: input.amountChanged,
  });
  await materializeFixedVpsCosts({
    providerAccountId: input.providerAccountId,
    resourceId: input.resourceId,
    range: { from, to: toUtcDateOnly(input.now) },
    now: input.now,
  });
}
