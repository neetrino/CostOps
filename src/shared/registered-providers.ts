export const REGISTERED_PROVIDER_KEYS = ['NEON', 'UPSTASH', 'VERCEL'] as const;
export type RegisteredProviderKey = (typeof REGISTERED_PROVIDER_KEYS)[number];

export function parseRegisteredProviderKey(value: string): RegisteredProviderKey | null {
  const normalized = value.trim().toUpperCase();
  return REGISTERED_PROVIDER_KEYS.find((key) => key === normalized) ?? null;
}
