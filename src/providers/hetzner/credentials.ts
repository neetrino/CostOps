import type { ProviderCredentialMeta } from '@/providers/types';

export const hetznerCredentialMeta: ProviderCredentialMeta = {
  envVarNames: [],
  credentialCreateUrl: '',
  credentialDocsUrl: '',
  credentialCreatePath: '',
  supportsExpiryDate: false,
  isAuthFailure: () => false,
};
