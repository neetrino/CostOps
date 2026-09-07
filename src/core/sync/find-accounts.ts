import { isAccountDue } from '@/core/sync/due-accounts';
import { sortProviderAccountsForSync } from '@/core/sync/sort-accounts-for-sync';
import { prisma } from '@/shared/db';
import { tryGetAdapter } from '@/providers/registry';

export async function findDueProviderAccounts(now: Date) {
  const accounts = await prisma.providerAccount.findMany({
    where: { status: 'ACTIVE', syncEnabled: true },
  });
  return sortProviderAccountsForSync(accounts.filter((account) => isAccountDue(account, now)));
}

export async function findEnabledProviderAccounts() {
  const accounts = await prisma.providerAccount.findMany({
    where: { status: { not: 'DISABLED' }, syncEnabled: true },
  });
  return sortProviderAccountsForSync(
    accounts.filter((account) => tryGetAdapter(account.providerKey) !== null),
  );
}
