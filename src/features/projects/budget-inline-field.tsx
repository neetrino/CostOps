'use client';

import {
  DEFAULT_SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD,
  DEFAULT_TELEGRAM_SPEND_ALERT_USD,
} from '@/config/constants';
import { escalationStepUsd } from '@/core/budgets/escalation';
import type { BudgetView } from '@/features/projects/types';
import { useCallback, useMemo, useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { Button } from '@/shared/ui/button';

type BudgetInlineFieldProps = {
  savePath: string;
  budget: BudgetView | null;
  onSaved: () => void;
};

function parseLimit(value: string): { ok: true; limitUsd: number } | { ok: false; error: string } {
  const trimmed = value.trim();
  const n = Number.parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: 'Enter a positive daily limit.' };
  }
  return { ok: true, limitUsd: n };
}

function parsePct(value: string): { ok: true; pct: number } | { ok: false; error: string } {
  const trimmed = value.trim();
  const n = Number.parseFloat(trimmed.replace(',', '.'));
  if (!Number.isFinite(n) || n < 0.1 || n > 100) {
    return { ok: false, error: 'Escalation % must be 0.1–100.' };
  }
  return { ok: true, pct: n };
}

export function BudgetInlineField({ savePath, budget, onSaved }: BudgetInlineFieldProps) {
  const defaultLimit = budget?.limitUsd ?? DEFAULT_TELEGRAM_SPEND_ALERT_USD;
  const defaultPct =
    budget?.escalationPercent ?? DEFAULT_SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD;
  const [limit, setLimit] = useState(String(defaultLimit));
  const [pct, setPct] = useState(String(defaultPct));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = useMemo(() => {
    const limitParsed = parseLimit(limit);
    const pctParsed = parsePct(pct);
    if (!limitParsed.ok || !pctParsed.ok) {
      return null;
    }
    return escalationStepUsd(limitParsed.limitUsd, pctParsed.pct);
  }, [limit, pct]);

  const save = useCallback(async () => {
    setError(null);
    const limitParsed = parseLimit(limit);
    if (!limitParsed.ok) {
      setError(limitParsed.error);
      return;
    }
    const pctParsed = parsePct(pct);
    if (!pctParsed.ok) {
      setError(pctParsed.error);
      return;
    }
    setSaving(true);
    try {
      await fetchJson(savePath, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limitUsd: limitParsed.limitUsd,
          escalationPercent: pctParsed.pct,
        }),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [limit, onSaved, pct, savePath]);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-1">
        <span className="text-[10px] text-[var(--muted)]">$</span>
        <input
          type="text"
          inputMode="decimal"
          aria-label="Daily limit USD"
          value={limit}
          onChange={(event) => setLimit(event.target.value)}
          className="w-16 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-1.5 py-0.5 text-right font-[family-name:var(--font-mono)] text-xs"
        />
        <span className="text-[10px] text-[var(--muted)]">%</span>
        <input
          type="text"
          inputMode="decimal"
          aria-label="Escalation percent"
          value={pct}
          onChange={(event) => setPct(event.target.value)}
          className="w-12 rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-1 py-0.5 text-right font-[family-name:var(--font-mono)] text-xs"
        />
        <Button
          variant="secondary"
          className="px-2 py-0.5 text-[10px] uppercase"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? '…' : 'Set'}
        </Button>
      </div>
      {error ? (
        <p className="max-w-[14rem] text-right text-[10px] text-[var(--danger)]">{error}</p>
      ) : null}
      {step !== null ? (
        <p className="text-[10px] text-[var(--muted)]">
          +{pct}% ≈ ${step.toFixed(2)} step
        </p>
      ) : null}
    </div>
  );
}
