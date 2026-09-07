'use client';

import type { DatePreset } from '@/shared/date-presets';
import type { GroupBy } from '@/shared/dashboard-query';
import type { DashboardUrlState } from '@/features/dashboard/dashboard-url';
import { Button } from '@/shared/ui/button';

const PRESET_BUTTONS: Array<{ preset: DatePreset; label: string }> = [
  { preset: 'current_month', label: 'Current month' },
  { preset: 'previous_month', label: 'Previous month' },
  { preset: '1', label: '1 day' },
  { preset: '7', label: '7 days' },
  { preset: '30', label: '30 days' },
  { preset: '60', label: '60 days' },
];

type FilterRailProps = {
  state: DashboardUrlState;
  onChange: (patch: Partial<DashboardUrlState>) => void;
  onRefresh: () => void;
  loading: boolean;
};

export function FilterRail({ state, onChange, onRefresh, loading }: FilterRailProps) {
  const from = state.from ?? '';
  const to = state.to ?? '';
  const groupBy = state.groupBy ?? 'day';

  const setPreset = (preset: DatePreset) => {
    if (preset === 'custom') {
      onChange({ preset: 'custom' });
      return;
    }
    onChange({ preset, from: undefined, to: undefined });
  };

  const setCustomRange = (nextFrom: string, nextTo: string) => {
    onChange({ preset: 'custom', from: nextFrom, to: nextTo });
  };

  return (
    <aside className="w-full shrink-0 border-b border-[var(--line)] bg-[var(--sidebar)] lg:w-[17.5rem] lg:border-b-0 lg:border-r">
      <div className="sticky top-[4.5rem] flex max-h-none flex-col gap-5 p-4 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto">
        <p className="text-[11px] font-semibold tracking-wide text-[var(--muted)] uppercase">
          Filters
        </p>

        <div className="grid gap-2">
          {PRESET_BUTTONS.map((item) => (
            <PresetButton
              key={item.preset}
              label={item.label}
              active={
                state.preset === item.preset || (!state.preset && item.preset === 'current_month')
              }
              onClick={() => setPreset(item.preset)}
            />
          ))}
        </div>

        <div className="grid gap-3">
          <label className="text-xs font-medium text-[var(--muted)]">
            UTC From
            <input
              type="date"
              value={from}
              onChange={(event) => setCustomRange(event.target.value, to || event.target.value)}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
          </label>
          <label className="text-xs font-medium text-[var(--muted)]">
            UTC To
            <input
              type="date"
              value={to}
              onChange={(event) => setCustomRange(from || event.target.value, event.target.value)}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm"
            />
          </label>
        </div>

        <label className="text-xs font-medium text-[var(--muted)]">
          Group by
          <select
            value={groupBy}
            onChange={(event) => onChange({ groupBy: event.target.value as GroupBy })}
            className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm"
          >
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </label>

        <Button variant="secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh data'}
        </Button>
      </div>
    </aside>
  );
}

function PresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium transition ${
        active
          ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
          : 'border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--line-strong)]'
      }`}
    >
      {label}
    </button>
  );
}
