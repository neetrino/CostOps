export function decimalToNumber(value: { toString(): string } | number | string): number {
  const numeric = typeof value === 'number' ? value : Number(value.toString());
  if (!Number.isFinite(numeric)) {
    throw new Error('Invalid decimal value');
  }
  return numeric;
}

export function formatUsd(amount: number): string {
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function usagePercent(spendUsd: number, limitUsd: number): number {
  if (limitUsd <= 0) {
    return 0;
  }
  return Math.round((spendUsd / limitUsd) * 100);
}

export function toFixedUsd(amount: number, digits: number): string {
  return amount.toFixed(digits);
}
