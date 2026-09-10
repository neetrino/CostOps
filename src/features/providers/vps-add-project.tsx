'use client';

import { useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { VpsProjectPicker } from '@/features/providers/vps-project-picker';
import type { InboxProjectOption, ProjectOptionsResponse } from '@/features/unmapped/types';
import { utcDayKey } from '@/shared/dates';
import { Button } from '@/shared/ui/button';

type VpsAddProjectProps = {
  onAdded: () => void;
};

export function VpsAddProject({ onAdded }: VpsAddProjectProps) {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<InboxProjectOption[]>([]);
  const [projectId, setProjectId] = useState('');
  const [amount, setAmount] = useState('14');
  const [startDate, setStartDate] = useState(utcDayKey(new Date()));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openForm = async () => {
    setOpen(true);
    setStartDate(utcDayKey(new Date()));
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchJson<ProjectOptionsResponse>('/api/projects/options?liveBoard=1');
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
          effectiveOn: startDate,
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
    <section className="overflow-visible rounded-[var(--radius)] border border-[var(--line-strong)] bg-[var(--paper-raised)] shadow-[var(--shadow-card)]">
      {open ? (
        <form
          className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(16rem,2fr)_8rem_11rem_auto] lg:items-end"
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
              className="field-control money mt-1.5 text-sm"
              required
            />
          </label>
          <label className="text-xs font-medium text-[var(--muted)]">
            Starts
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="field-control mt-1.5 text-sm"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-2 lg:flex">
            <Button type="submit" className="w-full" disabled={saving || loading}>
              Save
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
          {error ? <p className="text-xs text-[var(--danger)] lg:col-span-4">{error}</p> : null}
        </form>
      ) : (
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="eyebrow">Fixed infrastructure</p>
            <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[var(--muted)]">
              Add a monthly fee and the UTC start day. Cost starts that day at $fee / days in the
              month, so a mid-month purchase is less than a full month. Pick the 1st to bill the
              whole month. No Telegram alerts.
            </p>
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => void openForm()}>
            Add project
          </Button>
        </div>
      )}
    </section>
  );
}
