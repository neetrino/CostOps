import {
  NEON_CREATE_TOKEN_URL,
  NEON_CREDENTIAL_CREATE_PATH,
  NEON_CREDENTIAL_DOCS_URL,
  NEON_CREDENTIAL_ENV_VARS,
  NEON_CREDENTIAL_REF,
} from '@/config/constants';
import { getEnv } from '@/shared/env';
import { isNeonAuthFailure } from '@/providers/neon/errors';
import type { ProviderCredentialMeta } from '@/providers/types';

export const neonCredentialMeta: ProviderCredentialMeta = {
  envVarNames: [...NEON_CREDENTIAL_ENV_VARS],
  credentialCreateUrl: NEON_CREATE_TOKEN_URL,
  credentialDocsUrl: NEON_CREDENTIAL_DOCS_URL,
  credentialCreatePath: NEON_CREDENTIAL_CREATE_PATH,
  supportsExpiryDate: false,
  isAuthFailure: isNeonAuthFailure,
};

export type NeonApiCredentials = {
  apiKey: string;
  orgId: string;
};

export function resolveNeonCredentials(credentialRef: string): NeonApiCredentials {
  if (credentialRef !== NEON_CREDENTIAL_REF) {
    throw new Error(`Unsupported Neon credentialRef`);
  }
  const env = getEnv();
  if (!env.NEON_API_KEY || !env.NEON_ORG_ID) {
    throw new Error('NEON_API_KEY and NEON_ORG_ID are required');
  }
  return { apiKey: env.NEON_API_KEY, orgId: env.NEON_ORG_ID };
}
