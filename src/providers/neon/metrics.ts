/** Neon consumption_history/v2 metric names (query + storage). */
export const NEON_USAGE_METRICS = [
  'compute_unit_seconds',
  'root_branch_bytes_month',
  'child_branch_bytes_month',
  'instant_restore_bytes_month',
  'public_network_transfer_bytes',
  'private_network_transfer_bytes',
  'extra_branches_month',
] as const;

export type NeonUsageMetricName = (typeof NEON_USAGE_METRICS)[number];

export const NEON_METRIC_UNITS: Record<NeonUsageMetricName, string> = {
  compute_unit_seconds: 's',
  root_branch_bytes_month: 'byte_hours',
  child_branch_bytes_month: 'byte_hours',
  instant_restore_bytes_month: 'byte_hours',
  public_network_transfer_bytes: 'bytes',
  private_network_transfer_bytes: 'bytes',
  extra_branches_month: 'branch_hours',
};
