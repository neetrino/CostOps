import { credentialHealth } from '@/core/alerts/credential-health';
import { tryGetAdapter } from '@/providers/registry';
import { prisma } from '@/shared/db';

export async function loadIntegrations() {
  const accounts = await prisma.providerAccount.findMany({
    orderBy: [{ providerKey: 'asc' }, { name: 'asc' }],
    include: { provider: { select: { displayName: true, enabled: true } } },
  });

  return {
    accounts: accounts.map((account) => {
      const adapter = tryGetAdapter(account.providerKey);
      const health = credentialHealth({
        lastAuthFailureAt: account.lastAuthFailureAt,
        lastErrorAt: account.lastErrorAt,
        lastSuccessfulSyncAt: account.lastSuccessfulSyncAt,
      });
      return {
        id: account.id,
        providerKey: account.providerKey,
        providerDisplayName: account.provider.displayName,
        name: account.name,
        externalAccountId: account.externalAccountId,
        status: account.status,
        syncEnabled: account.syncEnabled,
        lastSuccessfulSyncAt: account.lastSuccessfulSyncAt?.toISOString() ?? null,
        lastErrorAt: account.lastErrorAt?.toISOString() ?? null,
        lastErrorMessage: account.lastErrorMessage,
        lastAuthFailureAt: account.lastAuthFailureAt?.toISOString() ?? null,
        lastAuthFailureCode: account.lastAuthFailureCode,
        credentialRotatedAt: account.credentialRotatedAt?.toISOString() ?? null,
        credentialHealth: health.health,
        credentialCreateUrl: adapter?.credentials.credentialCreateUrl ?? null,
        credentialCreatePath: adapter?.credentials.credentialCreatePath ?? null,
        credentialDocsUrl: adapter?.credentials.credentialDocsUrl ?? null,
      };
    }),
  };
}
