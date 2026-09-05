import { Client } from 'pg';
import { parseIsoDateOnly } from '@/shared/dates';
import type {
  OldNeonProjectRow,
  OldSpendAlertRow,
  OldSyncRunRow,
  OldUsageSnapshotRow,
} from '@/scripts/migrate-from-neon/types';

export type OldNeonHistory = {
  projects: OldNeonProjectRow[];
  snapshots: OldUsageSnapshotRow[];
  alerts: OldSpendAlertRow[];
  syncRuns: OldSyncRunRow[];
};

function optionalNumber(value: string | number | null): number | null {
  if (value === null || value === '') {
    return null;
  }
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Invalid numeric value from old Neon DB: ${String(value)}`);
  }
  return numeric;
}

function requiredNumber(value: string | number | null, field: string): number {
  const numeric = optionalNumber(value);
  if (numeric === null) {
    throw new Error(`Expected ${field} from old Neon DB`);
  }
  return numeric;
}

function optionalBigint(value: string | number | bigint | null): bigint | null {
  if (value === null || value === '') {
    return null;
  }
  return BigInt(value);
}

function asDate(value: Date | string): Date {
  return value instanceof Date ? value : parseIsoDateOnly(value);
}

type ProjectQueryRow = {
  neon_project_id: string;
  name: string;
  region_id: string | null;
  spend_alert_threshold_usd: string | number | null;
  spend_alert_escalation_percent_of_threshold: string | number | null;
};

type SnapshotQueryRow = {
  neon_project_id: string;
  snapshot_date: Date | string;
  compute_unit_seconds: string | number | bigint | null;
  root_branch_bytes_month: string | number | bigint | null;
  child_branch_bytes_month: string | number | bigint | null;
  instant_restore_bytes_month: string | number | bigint | null;
  public_network_transfer_bytes: string | number | bigint | null;
  private_network_transfer_bytes: string | number | bigint | null;
  extra_branches_month: string | number | bigint | null;
};

type AlertQueryRow = {
  neon_project_id: string;
  snapshot_date: Date | string;
  sent_at: Date | string;
  spend_usd: string | number | null;
  threshold_usd: string | number | null;
  last_notified_spend_usd: string | number | null;
};

type SyncRunQueryRow = {
  id: string;
  started_at: Date | string;
  finished_at: Date | string | null;
  status: string;
  error_message: string | null;
  rows_upserted: number | null;
  target_date: Date | string;
};

async function connectReadOnly(connectionString: string): Promise<Client> {
  const client = new Client({ connectionString });
  await client.connect();
  await client.query('SET default_transaction_read_only = on');
  return client;
}

/**
 * SELECT-only copy of the old Neon app tables. Never pass this URL to Prisma.
 */
export async function readOldNeonHistory(connectionString: string): Promise<OldNeonHistory> {
  const client = await connectReadOnly(connectionString);
  try {
    const projects = await client.query<ProjectQueryRow>(
      `SELECT neon_project_id, name, region_id,
              spend_alert_threshold_usd, spend_alert_escalation_percent_of_threshold
         FROM neon_projects
        ORDER BY neon_project_id`,
    );
    const snapshots = await client.query<SnapshotQueryRow>(
      `SELECT neon_project_id, snapshot_date, compute_unit_seconds, root_branch_bytes_month,
              child_branch_bytes_month, instant_restore_bytes_month,
              public_network_transfer_bytes, private_network_transfer_bytes, extra_branches_month
         FROM usage_snapshots
        ORDER BY neon_project_id, snapshot_date`,
    );
    const alerts = await client.query<AlertQueryRow>(
      `SELECT neon_project_id, snapshot_date, sent_at, spend_usd, threshold_usd,
              last_notified_spend_usd
         FROM spend_alert_sent
        ORDER BY neon_project_id, snapshot_date`,
    );
    const syncRuns = await client.query<SyncRunQueryRow>(
      `SELECT id, started_at, finished_at, status, error_message, rows_upserted, target_date
         FROM sync_runs
        ORDER BY started_at`,
    );
    return {
      projects: projects.rows.map((row) => ({
        neonProjectId: row.neon_project_id,
        name: row.name,
        regionId: row.region_id,
        spendAlertThresholdUsd: optionalNumber(row.spend_alert_threshold_usd),
        spendAlertEscalationPercentOfThreshold: optionalNumber(
          row.spend_alert_escalation_percent_of_threshold,
        ),
      })),
      snapshots: snapshots.rows.map((row) => ({
        neonProjectId: row.neon_project_id,
        snapshotDate: asDate(row.snapshot_date),
        computeUnitSeconds: optionalBigint(row.compute_unit_seconds),
        rootBranchBytesMonth: optionalBigint(row.root_branch_bytes_month),
        childBranchBytesMonth: optionalBigint(row.child_branch_bytes_month),
        instantRestoreBytesMonth: optionalBigint(row.instant_restore_bytes_month),
        publicNetworkTransferBytes: optionalBigint(row.public_network_transfer_bytes),
        privateNetworkTransferBytes: optionalBigint(row.private_network_transfer_bytes),
        extraBranchesMonth: optionalBigint(row.extra_branches_month),
      })),
      alerts: alerts.rows.map((row) => ({
        neonProjectId: row.neon_project_id,
        snapshotDate: asDate(row.snapshot_date),
        sentAt: asDate(row.sent_at),
        spendUsd: requiredNumber(row.spend_usd, 'spend_usd'),
        thresholdUsd: requiredNumber(row.threshold_usd, 'threshold_usd'),
        lastNotifiedSpendUsd: optionalNumber(row.last_notified_spend_usd),
      })),
      syncRuns: syncRuns.rows.map((row) => ({
        id: row.id,
        startedAt: asDate(row.started_at),
        finishedAt: row.finished_at ? asDate(row.finished_at) : null,
        status: row.status,
        errorMessage: row.error_message,
        rowsUpserted: row.rows_upserted,
        targetDate: asDate(row.target_date),
      })),
    };
  } finally {
    await client.end();
  }
}
