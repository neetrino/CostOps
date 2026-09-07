const PROVIDER_LABEL: Record<string, string> = {
  NEON: 'Neon',
  VERCEL: 'Vercel',
  UPSTASH: 'Upstash',
};

export function ProviderChips({ providerKeys }: { providerKeys: readonly string[] }) {
  if (providerKeys.length === 0) {
    return <span className="text-[11px] text-[var(--muted)]">No providers yet</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {providerKeys.map((key) => (
        <span
          key={key}
          className="rounded-[var(--radius-sm)] bg-[var(--accent-soft)] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--ok)] uppercase"
        >
          {PROVIDER_LABEL[key] ?? key}
        </span>
      ))}
    </span>
  );
}
