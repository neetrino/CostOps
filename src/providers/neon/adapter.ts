import { NEON_CREATE_TOKEN_URL } from '@/config/constants';

/** Neon Console API adapter — implemented in a later Phase 1 slice. */
export const neonAdapterStub = {
  key: 'NEON' as const,
  credentialCreateUrl: NEON_CREATE_TOKEN_URL,
} as const;
