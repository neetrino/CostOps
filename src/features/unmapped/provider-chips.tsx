import { providerUiLabel } from '@/shared/provider-label';

export function ProviderChips({ providerKeys }: { providerKeys: readonly string[] }) {
  if (providerKeys.length === 0) {
    return <span className="text-[11px] text-[var(--muted)]">No providers yet</span>;
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {providerKeys.map((key) => (
        <span
          key={key}
          className="rounded-full border border-[var(--accent-mid)] bg-[var(--accent-soft)] px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-[var(--accent)] uppercase"
        >
          {providerUiLabel(key)}
        </span>
      ))}
    </span>
  );
}
