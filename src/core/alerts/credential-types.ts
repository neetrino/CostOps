import type { CredentialAlertKind } from '@/generated/prisma/enums';

export type CredentialAlertRecord = {
  providerAccountId: string;
  kind: CredentialAlertKind;
  windowKey: string;
};

export type CredentialAlertStore = {
  has(record: CredentialAlertRecord): Promise<boolean>;
  insert(record: CredentialAlertRecord): Promise<void>;
  deleteAuthFailed(providerAccountId: string): Promise<void>;
};

export type CredentialNotifier = {
  sendHtml(text: string): Promise<void>;
};

export type CredentialAccountView = {
  id: string;
  name: string;
  providerKey: string;
  providerDisplayName: string;
  credentialExpiresAt: Date | null;
};
