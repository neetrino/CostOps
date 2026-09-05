export const REGISTERED_PROVIDER_KEYS = ['NEON'] as const;

export type RegisteredProviderKey = (typeof REGISTERED_PROVIDER_KEYS)[number];
