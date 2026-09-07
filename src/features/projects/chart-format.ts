/** Axis / bar labels — compact, no invented $0 for non-finite values. */

export function formatChartAxisUsd(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  if (abs >= 10) {
    return `$${Math.round(value)}`;
  }
  return `$${value.toFixed(2)}`;
}

export function formatChartBarLabel(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }
  return formatChartAxisUsd(value);
}
