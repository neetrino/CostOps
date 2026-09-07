const METRIC_KEY_MAX_LENGTH = 80;

/** Stable MetricEntry key from an observed FOCUS ServiceName. */
export function vercelMetricKey(serviceName: string): string {
  const slug = serviceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const trimmed = slug.length > 0 ? slug : 'service';
  return trimmed.slice(0, METRIC_KEY_MAX_LENGTH);
}
