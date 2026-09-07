import { HETZNER_DISPLAY_NAME } from '@/config/constants';

/** Operator-facing provider name. HETZNER is the VPS bucket. */
export function providerUiLabel(providerKey: string): string {
  if (providerKey === 'HETZNER') {
    return HETZNER_DISPLAY_NAME;
  }
  return providerKey;
}

export function isFixedVpsProvider(providerKey: string): boolean {
  return providerKey === 'HETZNER';
}
