import type { NeonUsageMetricName } from '@/providers/neon/metrics';

type MetricRow = { metric_name: string; value: number };

export type SnapshotMetrics = {
  computeUnitSeconds: bigint | null;
  rootBranchBytesMonth: bigint | null;
  childBranchBytesMonth: bigint | null;
  instantRestoreBytesMonth: bigint | null;
  publicNetworkTransferBytes: bigint | null;
  privateNetworkTransferBytes: bigint | null;
  extraBranchesMonth: bigint | null;
};

function addBigint(left: bigint | null, right: bigint | null): bigint | null {
  const sum = (left ?? 0n) + (right ?? 0n);
  return sum === 0n ? null : sum;
}

/** Sums Neon usage metrics (e.g. hourly slots into one daily snapshot). */
export function sumSnapshotMetrics(left: SnapshotMetrics, right: SnapshotMetrics): SnapshotMetrics {
  return {
    computeUnitSeconds: addBigint(left.computeUnitSeconds, right.computeUnitSeconds),
    rootBranchBytesMonth: addBigint(left.rootBranchBytesMonth, right.rootBranchBytesMonth),
    childBranchBytesMonth: addBigint(left.childBranchBytesMonth, right.childBranchBytesMonth),
    instantRestoreBytesMonth: addBigint(
      left.instantRestoreBytesMonth,
      right.instantRestoreBytesMonth,
    ),
    publicNetworkTransferBytes: addBigint(
      left.publicNetworkTransferBytes,
      right.publicNetworkTransferBytes,
    ),
    privateNetworkTransferBytes: addBigint(
      left.privateNetworkTransferBytes,
      right.privateNetworkTransferBytes,
    ),
    extraBranchesMonth: addBigint(left.extraBranchesMonth, right.extraBranchesMonth),
  };
}

const MAP: Record<NeonUsageMetricName, keyof SnapshotMetrics> = {
  compute_unit_seconds: 'computeUnitSeconds',
  root_branch_bytes_month: 'rootBranchBytesMonth',
  child_branch_bytes_month: 'childBranchBytesMonth',
  instant_restore_bytes_month: 'instantRestoreBytesMonth',
  public_network_transfer_bytes: 'publicNetworkTransferBytes',
  private_network_transfer_bytes: 'privateNetworkTransferBytes',
  extra_branches_month: 'extraBranchesMonth',
};

export function emptySnapshot(): SnapshotMetrics {
  return {
    computeUnitSeconds: null,
    rootBranchBytesMonth: null,
    childBranchBytesMonth: null,
    instantRestoreBytesMonth: null,
    publicNetworkTransferBytes: null,
    privateNetworkTransferBytes: null,
    extraBranchesMonth: null,
  };
}

/**
 * Maps Neon API metric rows to snapshot fields.
 */
export function mapMetricsToSnapshot(metrics: MetricRow[]): SnapshotMetrics {
  const base = emptySnapshot();
  for (const row of metrics) {
    const key = MAP[row.metric_name as NeonUsageMetricName];
    if (!key) {
      continue;
    }
    base[key] = BigInt(Math.trunc(row.value));
  }
  return base;
}

export function snapshotToRawTotals(metrics: SnapshotMetrics): Record<NeonUsageMetricName, bigint> {
  return {
    compute_unit_seconds: metrics.computeUnitSeconds ?? 0n,
    root_branch_bytes_month: metrics.rootBranchBytesMonth ?? 0n,
    child_branch_bytes_month: metrics.childBranchBytesMonth ?? 0n,
    instant_restore_bytes_month: metrics.instantRestoreBytesMonth ?? 0n,
    public_network_transfer_bytes: metrics.publicNetworkTransferBytes ?? 0n,
    private_network_transfer_bytes: metrics.privateNetworkTransferBytes ?? 0n,
    extra_branches_month: metrics.extraBranchesMonth ?? 0n,
  };
}
