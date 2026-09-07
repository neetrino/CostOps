'use client';

import { useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { VpsProjectPicker } from '@/features/providers/vps-project-picker';
import type { InboxProjectOption, ProjectOptionsResponse } from '@/features/unmapped/types';
import { startOfUtcMonth, utcDayKey } from '@/shared/dates';
import { Button } from '@/shared/ui/button';

type VpsAddProjectProps = {
  onAdded: () => void;
};

function currentUtcMonthValue(now = new Date()): string {
  return utcDayKey(startOfUtcMonth(now)).slice(0, 7);
}

function monthValueToDate(value: string): string {
  return `${value}-01`;
}

export function VpsAddProject({ onAdded }: VpsAddProjectProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<InboxProjectOption[]>([]);
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('14');
  const [month, setMonth] = useState(currentUtcMonthValue);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openForm = async () => {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchJson<ProjectOptionsResponse>(
        '/api/projects/options?liveBoard=1',
      );
      setProjects(payload.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    const selected = projects.find((project) => project.id === projectId);
    const monthlyAmountUsd = Number(amount);
    if (!selected) {
      setError('Select a project');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await fetchJson(`/api/projects/${selected.slug}/vps-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: `${selected.name} VPS`,
          monthlyAmountUsd,
          effectiveOn: monthValueToDate(month),
        }),
      });
      setOpen(false);
      setProjectId('');
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add VPS');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] px-4 py-3">
      {open ? (
        <form
          className="grid gap-3 lg:grid-cols-[minmax(16rem,2fr)_8rem_9rem_auto] lg:items-end"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <VpsProjectPicker
            projects={projects}
            value={projectId}
            disabled={loading}
            onChange={setProjectId}
          />
          <label className="text-xs font-medium text-[var(--muted)]">
            $ / month
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
              required
            />
          </label>
          <label className="text-xs font-medium text-[var(--muted)]">
            Starts
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--line-strong)] bg-[var(--paper)] px-3 py-2 text-sm text-[var(--ink)]"
              required
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving || loading}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
          {error ? <p className="text-xs text-[var(--danger)] lg:col-span-4">{error}</p> : null}
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-[var(--muted)]">
            Add or edit static monthly fees here. Amount changes apply to this month and later —
            past months stay as booked. No Telegram alerts.
          </p>
          <Button variant="secondary" className="text-xs" onClick={() => void openForm()}>
            Add project
          </Button>
        </div>
      )}
    </div>
  );
}
