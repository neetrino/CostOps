import type { CostProviderAdapter } from '@/providers/types';

function requireUrl(label: string, value: string): void {
  if (value.trim().length === 0) {
    throw new Error(`Adapter missing ${label}`);
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Adapter ${label} must be http(s)`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Adapter ')) {
      throw error;
    }
    throw new Error(`Adapter ${label} is not a valid URL`);
  }
}

/**
 * API adapters must ship rotate-token UX metadata. Fixed adapters skip credential URLs.
 */
export function assertAdapterContract(adapter: CostProviderAdapter): void {
  if (!adapter.providerKey.trim()) {
    throw new Error('Adapter missing providerKey');
  }
  if (typeof adapter.credentials.isAuthFailure !== 'function') {
    throw new Error(`Adapter ${adapter.providerKey} missing isAuthFailure`);
  }
  if (adapter.requiresCredentials === false) {
    return;
  }
  requireUrl('credentialCreateUrl', adapter.credentials.credentialCreateUrl);
  requireUrl('credentialDocsUrl', adapter.credentials.credentialDocsUrl);
  if (adapter.credentials.credentialCreatePath.trim().length === 0) {
    throw new Error(`Adapter ${adapter.providerKey} missing credentialCreatePath`);
  }
  if (adapter.credentials.envVarNames.length === 0) {
    throw new Error(`Adapter ${adapter.providerKey} missing envVarNames`);
  }
}
