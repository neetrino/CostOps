type BudgetMeterProps = {
  spendUsd: number | null;
  limitUsd: number;
  compact?: boolean;
};

export function BudgetMeter({ spendUsd, limitUsd, compact = false }: BudgetMeterProps) {
  const rawPercent = spendUsd === null || limitUsd <= 0 ? 0 : (spendUsd / limitUsd) * 100;
  const percent = Math.max(0, Math.min(rawPercent, 100));
  const tone =
    rawPercent >= 100 ? 'var(--danger)' : rawPercent >= 80 ? 'var(--warning)' : 'var(--accent)';

  return (
    <div className={compact ? 'w-full' : 'w-full min-w-28'}>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--line)]" aria-hidden="true">
        <div
          className="h-full rounded-full transition-[width] duration-[var(--duration-layout)] ease-[var(--ease-ui)]"
          style={{ width: `${percent}%`, backgroundColor: tone }}
        />
      </div>
      <span className="sr-only">
        {spendUsd === null
          ? 'No spend data'
          : `${Math.round(rawPercent)} percent of daily budget used`}
      </span>
    </div>
  );
}
