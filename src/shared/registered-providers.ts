export const REGISTERED_PROVIDER_KEYS = ['NEON', 'UPSTASH', 'VERCEL', 'HETZNER'] as const;
export type RegisteredProviderKey = (typeof REGISTERED_PROVIDER_KEYS)[number];

/** Nav / KPI order: Neon → Vercel → Upstash → VPS. */
export const PROVIDER_NAV_ORDER = ['NEON', 'VERCEL', 'UPSTASH', 'HETZNER'] as const;

export function compareProviderNavOrder(left: string, right: string): number {
  const leftIndex = PROVIDER_NAV_ORDER.indexOf(left as (typeof PROVIDER_NAV_ORDER)[number]);
  const rightIndex = PROVIDER_NAV_ORDER.indexOf(right as (typeof PROVIDER_NAV_ORDER)[number]);
  return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
}

export function parseRegisteredProviderKey(value: string): RegisteredProviderKey | null {
  const normalized = value.trim().toUpperCase();
  return REGISTERED_PROVIDER_KEYS.find((key) => key === normalized) ?? null;
}
