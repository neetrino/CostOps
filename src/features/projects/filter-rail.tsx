'use client';

import type { DatePreset } from '@/shared/date-presets';
import type { GroupBy } from '@/shared/dashboard-query';
import type { DashboardUrlState } from '@/features/dashboard/dashboard-url';
import { Button } from '@/shared/ui/button';
import { AppIcon } from '@/shared/ui/app-icon';
import { DateField } from '@/shared/ui/date-field';
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
      <aside className="hidden w-[18rem] shrink-0 border-r border-[var(--line-strong)] bg-[var(--paper)]/88 lg:block">
        <div className="sticky top-[4.75rem] max-h-[calc(100vh-4.75rem)] overflow-y-auto p-5">
          <div className="mb-6 overflow-hidden rounded-[1.3rem] bg-[var(--inverse)] p-4 text-[var(--inverse-ink)] shadow-[var(--shadow-color)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow !text-white/45">03 / Time lens</p>
                <p className="wordmark mt-3 text-2xl leading-none">Shape the signal.</p>
              </div>
              <span className="money flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--signal)] text-[10px] text-[var(--signal-ink)]">
                UTC
              </span>
            </div>
            <div className="mt-5 flex items-center gap-2 text-[10px] text-white/50">
              <span className="h-px flex-1 bg-white/15" />
              RANGE + RHYTHM
            </div>
          </div>
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
        <DateField
          label="UTC From"
          value={from}
          onChange={(next) => onCustomRange(next, to || next)}
        />
        <DateField
          label="UTC To"
          value={to}
          onChange={(next) => onCustomRange(from || next, next)}
        />
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
      className={`relative min-h-11 overflow-hidden rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm font-semibold transition-[color,background-color,transform] hover:-translate-y-0.5 ${
        active
          ? 'bg-[var(--inverse)] text-[var(--inverse-ink)] shadow-[var(--shadow)]'
          : 'border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] hover:border-[var(--line-strong)]'
      }`}
    >
      {label}
    </button>
  );
}
