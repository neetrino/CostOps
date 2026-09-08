'use client';

import { useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { Button } from '@/shared/ui/button';

type VpsLineEditProps = {
  resourceId: string;
  monthlyAmountUsd: number | null;
  onChanged: () => void;
};

export function VpsLineEdit({ resourceId, monthlyAmountUsd, onChanged }: VpsLineEditProps) {
  const [amount, setAmount] = useState(String(monthlyAmountUsd ?? ''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveAmount = async () => {
    const nextAmount = Number(amount);
    if (!Number.isFinite(nextAmount) || nextAmount <= 0) {
      setError('Enter a positive monthly amount');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/resources/${resourceId}/vps-line`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthlyAmountUsd: nextAmount }),
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
        <Button
          variant="secondary"
          className="text-xs"
          disabled={saving}
          onClick={() => void saveAmount()}
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
        Update applies to this month and later. Past months stay as booked.
      </p>
      {error ? <p className="text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
