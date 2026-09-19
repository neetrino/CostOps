import { providerUiLabel } from '@/shared/provider-label';
import { ProviderSwatch } from '@/shared/ui/provider-swatch';

export function ProviderChips({ providerKeys }: { providerKeys: readonly string[] }) {
  if (providerKeys.length === 0) {
    return <span className="text-[11px] text-[var(--muted)]">No providers yet</span>;
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {providerKeys.map((key) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-2 py-0.5 text-[9px] font-semibold tracking-[0.1em] text-[var(--ink)] uppercase"
        >
          <ProviderSwatch providerKey={key} />
          {providerUiLabel(key)}
        </span>
      ))}
    </span>
  );
}
