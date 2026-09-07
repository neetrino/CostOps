import {
  UPSTASH_CREATE_TOKEN_URL,
  UPSTASH_CREDENTIAL_CREATE_PATH,
  UPSTASH_CREDENTIAL_DOCS_URL,
  UPSTASH_CREDENTIAL_ENV_VARS,
  UPSTASH_CREDENTIAL_REF,
} from '@/config/constants';
import { isUpstashAuthFailure } from '@/providers/upstash/errors';
import { getEnv } from '@/shared/env';
import type { ProviderCredentialMeta } from '@/providers/types';

export const upstashCredentialMeta: ProviderCredentialMeta = {
  envVarNames: [...UPSTASH_CREDENTIAL_ENV_VARS],
  credentialCreateUrl: UPSTASH_CREATE_TOKEN_URL,
  credentialDocsUrl: UPSTASH_CREDENTIAL_DOCS_URL,
  credentialCreatePath: UPSTASH_CREDENTIAL_CREATE_PATH,
  supportsExpiryDate: false,
  isAuthFailure: isUpstashAuthFailure,
};

export type UpstashApiCredentials = {
  email: string;
  apiKey: string;
};

export function resolveUpstashCredentials(credentialRef: string): UpstashApiCredentials {
  if (credentialRef !== UPSTASH_CREDENTIAL_REF) {
    throw new Error('Unsupported Upstash credentialRef');
  }
  const env = getEnv();
  if (!env.UPSTASH_EMAIL || !env.UPSTASH_API_KEY) {
    throw new Error('UPSTASH_EMAIL and UPSTASH_API_KEY are required');
  }
  return { email: env.UPSTASH_EMAIL, apiKey: env.UPSTASH_API_KEY };
}

export function upstashBasicAuthHeader(credentials: UpstashApiCredentials): string {
  const raw = `${credentials.email}:${credentials.apiKey}`;
  return `Basic ${Buffer.from(raw).toString('base64')}`;
}
