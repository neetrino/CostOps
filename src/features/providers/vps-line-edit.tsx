'use client';

import { useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { Button } from '@/shared/ui/button';
import { DateField } from '@/shared/ui/date-field';

type VpsLineEditProps = {
  resourceId: string;
  monthlyAmountUsd: number | null;
  effectiveOn: string | null;
  onChanged: () => void;
};

export function VpsLineEdit({
  resourceId,
  monthlyAmountUsd,
  effectiveOn,
  onChanged,
}: VpsLineEditProps) {
  const [amount, setAmount] = useState(String(monthlyAmountUsd ?? ''));
  const [startDate, setStartDate] = useState(effectiveOn ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const nextAmount = Number(amount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setError('Enter a positive monthly amount');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      setError('Enter a start date');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/resources/${resourceId}/vps-line`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyAmountUsd: nextAmount, effectiveOn: startDate }),
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const archive = async () => {
    if (!window.confirm('Stop this VPS line? Past months stay in history.')) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/resources/${resourceId}/vps-line`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label="Monthly VPS amount"
          className="field-control money w-28 text-xs"
        />
        <DateField
          value={startDate}
          onChange={setStartDate}
          aria-label="VPS start date"
          allowClear={false}
          className="w-36"
          triggerClassName="text-xs"
        />
        <Button
          variant="secondary"
          className="text-xs"
          disabled={saving}
          onClick={() => void save()}
        >
          Update
        </Button>
        <Button
          variant="ghost"
          className="text-xs"
          disabled={saving}
          onClick={() => void archive()}
        >
          Stop
        </Button>
      </div>
      <p className="text-[11px] text-[var(--muted)]">
        Amount applies to this month from the start date. Days before the start date are dropped.
      </p>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
