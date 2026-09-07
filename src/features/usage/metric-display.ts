import {
  BILLING_HOURS_PER_MONTH,
  BYTES_PER_DECIMAL_GB,
  NEON_USAGE_METRICS,
  SECONDS_PER_HOUR,
  type NeonUsageMetricName,
} from '@/providers/neon';

function isNeonUsageMetric(metric: string): metric is NeonUsageMetricName {
  return (NEON_USAGE_METRICS as readonly string[]).includes(metric);
}

export function metricDisplayUnit(metricKey: string): string {
  if (metricKey === 'cost') {
    return 'usd';
  }
  if (metricKey === 'compute_unit_seconds') {
    return 'cu_hours';
  }
  if (
    metricKey === 'public_network_transfer_bytes' ||
    metricKey === 'private_network_transfer_bytes'
  ) {
    return 'gb';
  }
  if (metricKey === 'extra_branches_month') {
    return 'branch_months';
  }
  if (isNeonUsageMetric(metricKey)) {
    return 'avg_gb';
  }
  return 'raw';
}

export function toMetricDisplayValue(
  metricKey: string,
  rawValue: number,
  periodHours: number,
): number {
  if (!isNeonUsageMetric(metricKey)) {
    return rawValue;
  }
  if (metricKey === 'compute_unit_seconds') {
    return rawValue / SECONDS_PER_HOUR;
  }
  if (
    metricKey === 'root_branch_bytes_month' ||
    metricKey === 'child_branch_bytes_month' ||
    metricKey === 'instant_restore_bytes_month'
  ) {
    return rawValue / Math.max(1, periodHours) / BYTES_PER_DECIMAL_GB;
  }
  if (
    metricKey === 'public_network_transfer_bytes' ||
    metricKey === 'private_network_transfer_bytes'
  ) {
    return rawValue / BYTES_PER_DECIMAL_GB;
  }
  return rawValue / BILLING_HOURS_PER_MONTH;
}
