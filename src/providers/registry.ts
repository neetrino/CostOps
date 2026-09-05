import { assertAdapterContract } from '@/providers/assert-adapter-contract';
import { neonAdapter } from '@/providers/neon/adapter';
import type { CostProviderAdapter } from '@/providers/types';

export const REGISTERED_PROVIDER_KEYS = ['NEON'] as const;
export type RegisteredProviderKey = (typeof REGISTERED_PROVIDER_KEYS)[number];

const adapters = new Map<string, CostProviderAdapter>();

export function registerAdapter(adapter: CostProviderAdapter): void {
  assertAdapterContract(adapter);
  adapters.set(adapter.providerKey, adapter);
}

registerAdapter(neonAdapter);

export function getAdapter(providerKey: string): CostProviderAdapter {
  const adapter = adapters.get(providerKey);
  if (!adapter) {
    throw new Error(`No adapter registered for ${providerKey}`);
  }
  return adapter;
}

export function tryGetAdapter(providerKey: string): CostProviderAdapter | null {
  return adapters.get(providerKey) ?? null;
}

export function listAdapters(): CostProviderAdapter[] {
  return [...adapters.values()];
}
