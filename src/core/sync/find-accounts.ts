import { isAccountDue } from '@/core/sync/due-accounts';
import { prisma } from '@/shared/db';
import { tryGetAdapter } from '@/providers/registry';

export async function findDueProviderAccounts(now: Date) {
  const accounts = await prisma.providerAccount.findMany({
    where: { status: 'ACTIVE', syncEnabled: true },
  });
  return accounts.filter((account) => isAccountDue(account, now));
}

export async function findEnabledProviderAccounts() {
  const accounts = await prisma.providerAccount.findMany({
    where: { status: { not: 'DISABLED' }, syncEnabled: true },
  });
  return accounts.filter((account) => tryGetAdapter(account.providerKey) !== null);
}
