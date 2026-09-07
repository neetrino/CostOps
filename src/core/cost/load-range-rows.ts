import type { CostEntryRow } from '@/core/cost/types';
import { toCostSourceType, toFreshness } from '@/core/cost/map-status';
import type { ProviderKey } from '@/generated/prisma/enums';
import { prisma } from '@/shared/db';
import { decimalToNumber } from '@/shared/money';

export type CostRangeFilter = {
  from: Date;
  to: Date;
  projectId?: string;
  providerKey?: ProviderKey;
};

export async function loadRangeCostRows(filter: CostRangeFilter): Promise<CostEntryRow[]> {
  const rows = await prisma.costEntry.findMany({
    where: {
      bucketDate: { gte: filter.from, lte: filter.to },
      ...(filter.projectId ? { projectId: filter.projectId } : {}),
      ...(filter.providerKey ? { providerKey: filter.providerKey } : {}),
    },
  });
  return rows.map((row) => ({
    costUsd: decimalToNumber(row.costUsd),
    sourceStatus: toFreshness(row.sourceStatus),
    sourceType: toCostSourceType(row.sourceType),
    isPartial: row.isPartial,
    projectId: row.projectId,
    projectProviderId: row.projectProviderId,
    providerKey: row.providerKey,
    bucketDate: row.bucketDate,
    resourceId: row.resourceId,
    providerAccountId: row.providerAccountId,
    providerBillingCycleStart: metadataString(row.metadata, 'billingCycleStart'),
  }));
}

function metadataString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

export type AccountSyncRow = {
  id: string;
  providerKey: string;
  lastSuccessfulSyncAt: Date | null;
};

export async function loadAccountSyncRows(): Promise<AccountSyncRow[]> {
  const accounts = await prisma.providerAccount.findMany({
    select: { id: true, providerKey: true, lastSuccessfulSyncAt: true },
  });
  return accounts;
}

export function accountSyncMap(accounts: AccountSyncRow[]): Map<string, Date | null> {
  return new Map(accounts.map((account) => [account.id, account.lastSuccessfulSyncAt]));
}
