'use client';

import { useState } from 'react';
import { fetchJson } from '@/features/dashboard/api-client';
import { Button } from '@/shared/ui/button';

export function BackfillPeriodButton({
  providerKey,
  from,
  to,
  onComplete,
}: {
  providerKey: string;
  from: string;
  to: string;
  onComplete?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => {
          if (pending) {
            return;
          }
          setPending(true);
          setError(null);
          void fetchJson('/api/sync/backfill', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ providerKey: providerKey.toUpperCase(), from, to }),
          })
            .then(() => onComplete?.())
            .catch((err: unknown) => {
              setError(err instanceof Error ? err.message : 'Backfill failed');
            })
            .finally(() => setPending(false));
        }}
      >
        {pending ? 'Filling…' : 'Fill missing days'}
      </Button>
      {error ? (
        <p className="max-w-[14rem] text-right text-[10px] text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
