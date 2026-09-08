'use client';

import type { DatePreset } from '@/shared/date-presets';
import type { GroupBy } from '@/shared/dashboard-query';
import type { DashboardUrlState } from '@/features/dashboard/dashboard-url';
import { Button } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/app-icon';
import { MobileSheet } from '@/shared/ui/mobile-sheet';

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

  const fields = (
    <FilterFields
      state={state}
      from={from}
      to={to}
      groupBy={groupBy}
      loading={loading}
      onPreset={setPreset}
      onCustomRange={setCustomRange}
      onGroupBy={(value) => onChange({ groupBy: value })}
      onRefresh={onRefresh}
    />
  );

  const activeLabel =
    state.preset === 'custom'
      ? `${from || 'From'} → ${to || 'To'}`
      : (PRESET_BUTTONS.find((item) => item.preset === (state.preset ?? 'current_month'))?.label ??
        'Current month');

  return (
    <>
      <div className="sticky top-14 z-20 flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[var(--sidebar)] px-4 py-2 lg:hidden">
        <div className="min-w-0">
          <p className="eyebrow">Viewing</p>
          <p className="truncate text-sm font-semibold text-[var(--ink)]">{activeLabel}</p>
        </div>
        <MobileSheet
          title="Dashboard filters"
          description={`${activeLabel} · grouped by ${groupBy}`}
          triggerClassName="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3.5 text-sm font-semibold text-[var(--ink)]"
          trigger={
            <>
              <AppIcon name="filter" size={18} /> Filters
            </>
          }
        >
          <div className="p-5">{fields}</div>
        </MobileSheet>
      </div>
      <aside className="hidden w-[17.5rem] shrink-0 border-r border-[var(--line-strong)] bg-[var(--sidebar)] lg:block">
        <div className="sticky top-[4.75rem] max-h-[calc(100vh-4.75rem)] overflow-y-auto p-5">
          <p className="eyebrow mb-5">Range & grouping</p>
          {fields}
        </div>
      </aside>
    </>
  );
}

function FilterFields({
  state,
  from,
  to,
  groupBy,
  loading,
  onPreset,
  onCustomRange,
  onGroupBy,
  onRefresh,
}: {
  state: DashboardUrlState;
  from: string;
  to: string;
  groupBy: GroupBy;
  loading: boolean;
  onPreset: (preset: DatePreset) => void;
  onCustomRange: (from: string, to: string) => void;
  onGroupBy: (groupBy: GroupBy) => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
        {PRESET_BUTTONS.map((item) => (
          <PresetButton
            key={item.preset}
            label={item.label}
            active={
              state.preset === item.preset || (!state.preset && item.preset === 'current_month')
            }
            onClick={() => onPreset(item.preset)}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <label className="text-xs font-medium text-[var(--muted)]">
          UTC From
          <input
            type="date"
            value={from}
            onChange={(event) => onCustomRange(event.target.value, to || event.target.value)}
            className="field-control mt-1.5 text-sm"
          />
        </label>
        <label className="text-xs font-medium text-[var(--muted)]">
          UTC To
          <input
            type="date"
            value={to}
            onChange={(event) => onCustomRange(from || event.target.value, event.target.value)}
            className="field-control mt-1.5 text-sm"
          />
        </label>
      </div>

      <label className="text-xs font-medium text-[var(--muted)]">
        Group by
        <select
          value={groupBy}
          onChange={(event) => onGroupBy(event.target.value as GroupBy)}
          className="field-control mt-1.5 text-sm"
        >
          <option value="day">Day</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
        </select>
      </label>

      <Button variant="secondary" onClick={onRefresh} disabled={loading}>
        <AppIcon name="sync" size={17} className={loading ? 'animate-spin' : ''} />
        {loading ? 'Refreshing…' : 'Refresh data'}
      </Button>
    </div>
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
      className={`min-h-11 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--accent)] text-[var(--accent-ink)]'
          : 'border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--line-strong)]'
      }`}
    >
      {label}
    </button>
  );
}
