'use client';

import { useMemo, useState } from 'react';
import { Button as AriaButton, Dialog, DialogTrigger, Popover } from 'react-aria-components';
import { startOfUtcMonth, utcDayKey } from '@/shared/dates';
import { AppIcon } from '@/shared/ui/app-icon';
import {
  buildUtcMondayGrid,
  formatUtcDayLabel,
  formatUtcMonthTitle,
  shiftUtcDayKey,
  shiftUtcMonth,
  UTC_WEEKDAY_LABELS,
  utcMonthFromDayKey,
} from '@/shared/ui/calendar-month';

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

type DateFieldProps = {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  'aria-label'?: string;
  required?: boolean;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
  triggerClassName?: string;
};

function visibleMonthFromValue(value: string, now: Date): Date {
  return ISO_DAY.test(value) ? utcMonthFromDayKey(value) : startOfUtcMonth(now);
}

/**
 * CostOps UTC day picker. Replaces the native `input type="date"` popup
 * with a paper calendar that matches the product tokens.
 */
export function DateField({
  value,
  onChange,
  label,
  'aria-label': ariaLabel,
  required = false,
  disabled = false,
  allowClear = true,
  className = '',
  triggerClassName = '',
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const [now] = useState(() => new Date());
  const [visibleMonth, setVisibleMonth] = useState(() => visibleMonthFromValue(value, now));
  const todayKey = utcDayKey(now);
  const selectedKey = ISO_DAY.test(value) ? value : '';
  const display = selectedKey ? formatUtcDayLabel(selectedKey) : 'Pick a day';
  const title = formatUtcMonthTitle(visibleMonth);
  const weeks = useMemo(() => {
    const cells = buildUtcMondayGrid(visibleMonth);
    const rows: (typeof cells)[] = [];
    for (let index = 0; index < cells.length; index += 7) {
      rows.push(cells.slice(index, index + 7));
    }
    return rows;
  }, [visibleMonth]);

  const pick = (dayKey: string) => {
    onChange(dayKey);
    setOpen(false);
  };

  const control = (
    <DialogTrigger
      isOpen={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setVisibleMonth(visibleMonthFromValue(value, now));
        }
      }}
    >
      <AriaButton
        aria-label={ariaLabel ?? label ?? 'Choose date'}
        isDisabled={disabled}
        className={`field-control flex items-center justify-between gap-2 text-left ${triggerClassName}`}
      >
        <span
          className={`money truncate ${selectedKey ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}`}
        >
          {display}
        </span>
        <AppIcon name="calendar" size={16} className="shrink-0 text-[var(--muted)]" />
      </AriaButton>
      <Popover
        placement="bottom start"
        offset={8}
        className="z-[80] w-[18.5rem] origin-top rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] p-4 shadow-[var(--shadow-popover)] outline-none"
      >
        <Dialog className="outline-none" aria-label={`${title.month} ${title.year} calendar`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="wordmark text-xl leading-none text-[var(--ink)]">{title.month}</p>
              <p className="money mt-1 text-[11px] text-[var(--muted)]">{title.year} · UTC</p>
            </div>
            <div className="flex items-center gap-1.5">
              <MonthNavButton
                label={`Previous month, ${formatUtcMonthTitle(shiftUtcMonth(visibleMonth, -1)).month}`}
                icon="chevron-left"
                onPress={() => setVisibleMonth((current) => shiftUtcMonth(current, -1))}
              />
              <MonthNavButton
                label={`Next month, ${formatUtcMonthTitle(shiftUtcMonth(visibleMonth, 1)).month}`}
                icon="chevron-right"
                onPress={() => setVisibleMonth((current) => shiftUtcMonth(current, 1))}
              />
            </div>
          </div>

          <div role="grid" aria-label={`${title.month} ${title.year}`} className="mt-4">
            <div role="row" className="grid grid-cols-7">
              {UTC_WEEKDAY_LABELS.map((weekday, index) => (
                <span
                  key={`${weekday}-${index}`}
                  role="columnheader"
                  className="eyebrow py-1 text-center !text-[0.6rem]"
                >
                  {weekday}
                </span>
              ))}
            </div>
            {weeks.map((week) => (
              <div key={week[0]?.dayKey} role="row" className="mt-0.5 grid grid-cols-7">
                {week.map((cell) => {
                  const selected = cell.dayKey === selectedKey;
                  const today = cell.dayKey === todayKey;
                  return (
                    <div key={cell.dayKey} role="gridcell" aria-selected={selected}>
                      <AriaButton
                        aria-label={formatUtcDayLabel(cell.dayKey)}
                        aria-current={today ? 'date' : undefined}
                        autoFocus={cell.dayKey === (selectedKey || todayKey)}
                        onPress={() => pick(cell.dayKey)}
                        onKeyDown={(event) => {
                          const move = keyDelta(event.key);
                          if (move === 0) {
                            return;
                          }
                          event.preventDefault();
                          const next = shiftUtcDayKey(cell.dayKey, move);
                          setVisibleMonth(utcMonthFromDayKey(next));
                          queueMicrotask(() => {
                            document
                              .querySelector<HTMLButtonElement>(`[data-day="${next}"]`)
                              ?.focus();
                          });
                        }}
                        data-day={cell.dayKey}
                        className={`relative mx-auto flex size-9 items-center justify-center rounded-full text-sm transition-[background-color,color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-ui)] ${dayClassName(
                          {
                            selected,
                            today,
                            inCurrentMonth: cell.inCurrentMonth,
                          },
                        )}`}
                      >
                        <span className="money">{cell.day}</span>
                        {today && !selected ? (
                          <span
                            aria-hidden="true"
                            className="absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-[var(--signal)]"
                          />
                        ) : null}
                      </AriaButton>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-[var(--line)] pt-3">
            {allowClear ? (
              <AriaButton
                className="rounded-[var(--radius-xs)] px-2 py-1 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]"
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
              >
                Clear
              </AriaButton>
            ) : (
              <span />
            )}
            <AriaButton
              className="rounded-[var(--radius-xs)] bg-[var(--sunken)] px-2.5 py-1 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--accent-soft)]"
              onPress={() => pick(todayKey)}
            >
              Today
            </AriaButton>
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  );

  if (!label) {
    return <div className={className}>{control}</div>;
  }

  return (
    <label className={`text-xs font-medium text-[var(--muted)] ${className}`}>
      {label}
      {required ? <span className="sr-only"> (required)</span> : null}
      <span className="mt-1.5 block">{control}</span>
    </label>
  );
}

function MonthNavButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: 'chevron-left' | 'chevron-right';
  onPress: () => void;
}) {
  return (
    <AriaButton
      aria-label={label}
      onPress={onPress}
      className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--line)] text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]"
    >
      <AppIcon name={icon} size={16} />
    </AriaButton>
  );
}

function dayClassName({
  selected,
  today,
  inCurrentMonth,
}: {
  selected: boolean;
  today: boolean;
  inCurrentMonth: boolean;
}): string {
  if (selected) {
    return 'bg-[var(--accent)] font-semibold text-[var(--accent-ink)] shadow-[var(--shadow)]';
  }
  if (!inCurrentMonth) {
    return 'text-[var(--faint)] hover:bg-[var(--sunken)]';
  }
  if (today) {
    return 'font-semibold text-[var(--ink)] hover:bg-[var(--sunken)]';
  }
  return 'text-[var(--ink)] hover:bg-[var(--sunken)]';
}

function keyDelta(key: string): number {
  switch (key) {
    case 'ArrowLeft':
      return -1;
    case 'ArrowRight':
      return 1;
    case 'ArrowUp':
      return -7;
    case 'ArrowDown':
      return 7;
    default:
      return 0;
  }
}
