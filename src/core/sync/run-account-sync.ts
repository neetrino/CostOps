import { evaluateSpendAlertsForDay } from '@/core/alerts/evaluate-spend';
import { clearAuthFailureIncident } from '@/core/alerts/evaluate-credentials';
import { createPrismaCredentialStore } from '@/core/alerts/prisma-credential-store';
import { upsertCostEntries } from '@/core/cost/upsert';
import { upsertMetricEntries } from '@/core/metrics/upsert';
import { recordAuthFailure } from '@/core/sync/handle-auth-failure';
import { loadAccountResources, upsertDiscoveredResources } from '@/core/sync/upsert-resources';
import { shouldEvaluateSpendAlerts } from '@/core/sync/should-evaluate-spend-alerts';
import { addUtcDays, getStartOfTodayUtc, toUtcDateOnly } from '@/shared/dates';
import { prisma } from '@/shared/db';
import { logger } from '@/shared/logger';
import { safeErrorMessage } from '@/shared/http';
import { archiveIgnoredNeonResources } from '@/providers/neon/archive-ignored-resources';
import { getAdapter } from '@/providers/registry';
import type { DateRange } from '@/providers/types';
import type { ProviderKey } from '@/generated/prisma/enums';

export type SyncMode = 'intraday' | 'reconcile';

export type AccountSyncResult = {
  ok: boolean;
  skipped?: boolean;
  syncRunId: string;
  providerAccountId: string;
  rowsRead: number;
  rowsWritten: number;
  errorMessage?: string;
};

async function markSyncError(syncRunId: string, accountId: string, message: string): Promise<void> {
  await prisma.syncRun.update({
    where: { id: syncRunId },
    data: { status: 'ERROR', finishedAt: new Date(), errorMessage: message },
  });
  await prisma.providerAccount.update({
    where: { id: accountId },
    data: { status: 'ERROR', lastErrorAt: new Date(), lastErrorMessage: message },
  });
}

async function executeAdapterPull(input: {
  accountId: string;
  providerKey: ProviderKey;
  externalAccountId: string;
  credentialRef: string;
  range: DateRange;
  now: Date;
  finalize: boolean;
}): Promise<{ rowsRead: number; rowsWritten: number }> {
  const adapter = getAdapter(input.providerKey);
  const ctx = {
    account: {
      id: input.accountId,
      providerKey: input.providerKey,
      externalAccountId: input.externalAccountId,
      credentialRef: input.credentialRef,
    },
    now: input.now,
  };
  const resources = await adapter.syncResources(ctx);
  if (input.providerKey === 'NEON') {
    await archiveIgnoredNeonResources(input.accountId);
  }
  const resourceMap = await upsertDiscoveredResources({
    providerKey: input.providerKey,
    providerAccountId: input.accountId,
    discovered: resources.discovered,
  });
  const links = resourceMap.size > 0 ? resourceMap : await loadAccountResources(input.accountId);
  const metrics = adapter.fetchMetrics ? await adapter.fetchMetrics(ctx, input.range) : [];
  const costs = await adapter.fetchCosts(ctx, input.range);
  const metricWritten = await upsertMetricEntries({
    providerKey: input.providerKey,
    providerAccountId: input.accountId,
    metrics,
    resourcesByExternalId: links,
  });
  const costWritten = await upsertCostEntries({
    providerKey: input.providerKey,
    providerAccountId: input.accountId,
    costs,
    resourcesByExternalId: links,
    finalize: input.finalize,
  });
  return {
    rowsRead: resources.discovered.length + metrics.length + costs.length,
    rowsWritten: metricWritten + costWritten,
  };
}

/**
 * Runs one ProviderAccount. Always writes SyncRun, including intraday.
 * Failed syncs do not upsert cost as $0.
 */
export async function runAccountSync(input: {
  accountId: string;
  range: DateRange;
  mode: SyncMode;
  now?: Date;
}): Promise<AccountSyncResult> {
  const now = input.now ?? new Date();
  const account = await prisma.providerAccount.findUniqueOrThrow({
    where: { id: input.accountId },
  });
  const range: DateRange = {
    from: toUtcDateOnly(input.range.from),
    to: toUtcDateOnly(input.range.to),
  };
  const run = await prisma.syncRun.create({
    data: {
      providerAccountId: account.id,
      providerKey: account.providerKey,
      status: 'RUNNING',
      rangeFrom: range.from,
      rangeTo: addUtcDays(range.to, 1),
      granularity: input.mode === 'intraday' ? 'hourly' : 'daily',
    },
  });

  try {
    const pulled = await executeAdapterPull({
      accountId: account.id,
      providerKey: account.providerKey,
      externalAccountId: account.externalAccountId,
      credentialRef: account.credentialRef,
      range,
      now,
      finalize: input.mode === 'reconcile',
    });
    const finishedAt = new Date();
    await prisma.syncRun.update({
      where: { id: run.id },
      data: {
        status: 'SUCCESS',
        finishedAt,
        rowsRead: pulled.rowsRead,
        rowsWritten: pulled.rowsWritten,
      },
    });
    await prisma.providerAccount.update({
      where: { id: account.id },
      data: {
        status: 'ACTIVE',
        lastSuccessfulSyncAt: finishedAt,
        lastErrorAt: null,
        lastErrorMessage: null,
        lastAuthFailureAt: null,
        lastAuthFailureCode: null,
      },
    });
    await clearAuthFailureIncident(createPrismaCredentialStore(), account.id);

    if (shouldEvaluateSpendAlerts(range.from, now)) {
      try {
        await evaluateSpendAlertsForDay({
          budgetDate: range.from,
          lastSyncAt: finishedAt,
          now,
        });
      } catch (error) {
        logger.error({ err: error }, 'Spend alert evaluation failed after sync');
      }
    }

    return {
      ok: true,
      syncRunId: run.id,
      providerAccountId: account.id,
      rowsRead: pulled.rowsRead,
      rowsWritten: pulled.rowsWritten,
    };
  } catch (error) {
    const message = safeErrorMessage(error);
    logger.error({ err: error, providerAccountId: account.id }, 'Account sync failed');
    const adapter = getAdapter(account.providerKey);
    try {
      if (adapter.credentials.isAuthFailure(error)) {
        await recordAuthFailure({ accountId: account.id, adapter, error, now });
      }
    } catch (credentialError) {
      logger.error({ err: credentialError }, 'Credential auth-failure alert failed');
    }
    await markSyncError(run.id, account.id, message);
    return {
      ok: false,
      syncRunId: run.id,
      providerAccountId: account.id,
      rowsRead: 0,
      rowsWritten: 0,
      errorMessage: message,
    };
  }
}

export function currentDayRange(now: Date): DateRange {
  const day = getStartOfTodayUtc(now);
  return { from: day, to: day };
}
