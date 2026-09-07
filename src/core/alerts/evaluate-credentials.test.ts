import { describe, expect, it } from 'vitest';
import {
  clearAuthFailureIncident,
  evaluateExpiryAlerts,
  sendAuthFailureAlert,
} from '@/core/alerts/evaluate-credentials';
import type { CredentialAlertRecord, CredentialAlertStore } from '@/core/alerts/credential-types';
import { neonCredentialMeta } from '@/providers/neon/credentials';

function memoryCredentialStore(): CredentialAlertStore & {
  rows: CredentialAlertRecord[];
  inserts: number;
} {
  const rows: CredentialAlertRecord[] = [];
  return {
    rows,
    inserts: 0,
    async has(record) {
      return rows.some(
        (row) =>
          row.providerAccountId === record.providerAccountId &&
          row.kind === record.kind &&
          row.windowKey === record.windowKey,
      );
    },
    async insert(record) {
      this.inserts += 1;
      rows.push(record);
    },
    async deleteAuthFailed(providerAccountId) {
      for (let index = rows.length - 1; index >= 0; index -= 1) {
        if (
          rows[index]?.providerAccountId === providerAccountId &&
          rows[index]?.kind === 'AUTH_FAILED'
        ) {
          rows.splice(index, 1);
        }
      }
    },
  };
}

const account = {
  id: 'acc-1',
  name: 'org-quiet-mode',
  providerKey: 'NEON',
  providerDisplayName: 'Neon',
  credentialExpiresAt: null as Date | null,
};

describe('credential alerts', () => {
  it('sends a 401 alert once per incident', async () => {
    const store = memoryCredentialStore();
    const sent: string[] = [];
    const notifier = {
      sendHtml: async (html: string) => {
        sent.push(html);
      },
    };
    const first = await sendAuthFailureAlert({
      account,
      meta: neonCredentialMeta,
      statusCode: '401',
      store,
      notifier,
    });
    const second = await sendAuthFailureAlert({
      account,
      meta: neonCredentialMeta,
      statusCode: '401',
      store,
      notifier,
    });
    expect(first).toBe('sent');
    expect(second).toBe('skipped');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('CREDENTIAL ALERT');
    expect(sent[0]).toContain('401');
    expect(sent[0]).not.toContain('COST ALERT');
  });

  it('clears AUTH_FAILED on success so a later 401 is a new incident', async () => {
    const store = memoryCredentialStore();
    const sent: string[] = [];
    const notifier = {
      sendHtml: async (html: string) => {
        sent.push(html);
      },
    };
    await sendAuthFailureAlert({
      account,
      meta: neonCredentialMeta,
      statusCode: '401',
      store,
      notifier,
    });
    await clearAuthFailureIncident(store, account.id);
    const again = await sendAuthFailureAlert({
      account,
      meta: neonCredentialMeta,
      statusCode: '401',
      store,
      notifier,
    });
    expect(again).toBe('sent');
    expect(sent).toHaveLength(2);
  });

  it('does not send a recovered-$0 spend message after clearing auth failure', async () => {
    const store = memoryCredentialStore();
    await sendAuthFailureAlert({
      account,
      meta: neonCredentialMeta,
      statusCode: '401',
      store,
      notifier: { sendHtml: async () => undefined },
    });
    await clearAuthFailureIncident(store, account.id);
    expect(store.rows.some((row) => row.kind === 'AUTH_FAILED')).toBe(false);
  });

  it('does not send calendar expiry alerts even if a leftover date is stored', async () => {
    const store = memoryCredentialStore();
    const sent: string[] = [];
    const kinds = await evaluateExpiryAlerts({
      account: { ...account, credentialExpiresAt: new Date('2026-09-08T00:00:00.000Z') },
      meta: neonCredentialMeta,
      now: new Date('2026-09-07T00:00:00.000Z'),
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
    });
    expect(kinds).toEqual([]);
    expect(sent).toEqual([]);
    expect(store.inserts).toBe(0);
  });
});
