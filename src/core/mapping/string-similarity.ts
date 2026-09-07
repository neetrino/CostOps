const MAX_COMPARE_LENGTH = 32;

function bounded(value: string): string {
  return value.slice(0, MAX_COMPARE_LENGTH);
}

/** Levenshtein similarity in 0..1 for short normalized strings. */
export function stringSimilarity(left: string, right: string): number {
  if (left === right) {
    return left.length === 0 ? 0 : 1;
  }
  if (!left || !right) {
    return 0;
  }
  const a = bounded(left);
  const b = bounded(right);
  const distance = levenshtein(a, b);
  return 1 - distance / Math.max(a.length, b.length);
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const prev = Array.from({ length: cols }, (_, index) => index);
  const next = Array.from({ length: cols }, () => 0);
  for (let i = 1; i < rows; i += 1) {
    next[0] = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      next[j] = Math.min((next[j - 1] ?? 0) + 1, (prev[j] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    for (let j = 0; j < cols; j += 1) {
      prev[j] = next[j] ?? 0;
    }
  }
  return prev[b.length] ?? 0;
}
