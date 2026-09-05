import { AUTH_FAILED_WINDOW_KEY } from '@/config/constants';
import type { CredentialAlertStore } from '@/core/alerts/credential-types';
import { prisma } from '@/shared/db';

export function createPrismaCredentialStore(): CredentialAlertStore {
  return {
    async has(record) {
      const row = await prisma.credentialAlert.findUnique({
        where: {
          providerAccountId_kind_windowKey: {
            providerAccountId: record.providerAccountId,
            kind: record.kind,
            windowKey: record.windowKey,
          },
        },
      });
      return row !== null;
    },
    async insert(record) {
      await prisma.credentialAlert.create({
        data: {
          providerAccountId: record.providerAccountId,
          kind: record.kind,
          windowKey: record.windowKey,
        },
      });
    },
    async deleteAuthFailed(providerAccountId) {
      await prisma.credentialAlert.deleteMany({
        where: {
          providerAccountId,
          kind: 'AUTH_FAILED',
          windowKey: AUTH_FAILED_WINDOW_KEY,
        },
      });
    },
  };
}
