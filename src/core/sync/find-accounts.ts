import { isAccountDue } from '@/core/sync/due-accounts';
import { sortProviderAccountsForSync } from '@/core/sync/sort-accounts-for-sync';
import { prisma } from '@/shared/db';
import { tryGetAdapter } from '@/providers/registry';
import type { RegisteredProviderKey } from '@/shared/registered-providers';

export async function findDueProviderAccounts(now: Date, providerKey?: RegisteredProviderKey) {
  const accounts = await prisma.providerAccount.findMany({
    where: {
      status: 'ACTIVE',
      syncEnabled: true,
      ...(providerKey ? { providerKey } : {}),
    },
  });
  return sortProviderAccountsForSync(accounts.filter((account) => isAccountDue(account, now)));
}

export async function findEnabledProviderAccounts(providerKey?: RegisteredProviderKey) {
  const accounts = await prisma.providerAccount.findMany({
    where: {
      status: { not: 'DISABLED' },
      syncEnabled: true,
      ...(providerKey ? { providerKey } : {}),
    },
  });
  return sortProviderAccountsForSync(
    accounts.filter((account) => tryGetAdapter(account.providerKey) !== null),
  );
}
