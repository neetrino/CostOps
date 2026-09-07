import { assertAdapterContract } from '@/providers/assert-adapter-contract';
import { hetznerAdapter } from '@/providers/hetzner/adapter';
import { neonAdapter } from '@/providers/neon/adapter';
import { upstashAdapter } from '@/providers/upstash/adapter';
import { vercelAdapter } from '@/providers/vercel/adapter';
import type { CostProviderAdapter } from '@/providers/types';

export {
  REGISTERED_PROVIDER_KEYS,
  type RegisteredProviderKey,
} from '@/shared/registered-providers';

const adapters = new Map<string, CostProviderAdapter>();

export function registerAdapter(adapter: CostProviderAdapter): void {
  assertAdapterContract(adapter);
  adapters.set(adapter.providerKey, adapter);
}

registerAdapter(neonAdapter);
registerAdapter(vercelAdapter);
registerAdapter(upstashAdapter);
registerAdapter(hetznerAdapter);

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
