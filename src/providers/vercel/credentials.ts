import {
  VERCEL_CREATE_TOKEN_URL,
  VERCEL_CREDENTIAL_CREATE_PATH,
  VERCEL_CREDENTIAL_DOCS_URL,
  VERCEL_CREDENTIAL_ENV_VARS,
  VERCEL_CREDENTIAL_REF,
} from '@/config/constants';
import { isVercelAuthFailure } from '@/providers/vercel/errors';
import { getEnv } from '@/shared/env';
import type { ProviderCredentialMeta } from '@/providers/types';

export const vercelCredentialMeta: ProviderCredentialMeta = {
  envVarNames: [...VERCEL_CREDENTIAL_ENV_VARS],
  credentialCreateUrl: VERCEL_CREATE_TOKEN_URL,
  credentialDocsUrl: VERCEL_CREDENTIAL_DOCS_URL,
  credentialCreatePath: VERCEL_CREDENTIAL_CREATE_PATH,
  supportsExpiryDate: true,
  isAuthFailure: isVercelAuthFailure,
};

export type VercelApiCredentials = {
  token: string;
  teamId: string;
};

export function resolveVercelCredentials(credentialRef: string): VercelApiCredentials {
  if (credentialRef !== VERCEL_CREDENTIAL_REF) {
    throw new Error(`Unsupported Vercel credentialRef`);
  }
  const env = getEnv();
  if (!env.VERCEL_API_TOKEN || !env.VERCEL_TEAM_ID) {
    throw new Error('VERCEL_API_TOKEN and VERCEL_TEAM_ID are required');
  }
  return { token: env.VERCEL_API_TOKEN, teamId: env.VERCEL_TEAM_ID };
}
