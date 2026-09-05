import { describe, expect, it } from 'vitest';
import { evaluateSpendForTarget } from '@/core/alerts/evaluate-spend-target';
import type {
  AlertEventRecord,
  SpendAlertStore,
  SpendAlertTarget,
} from '@/core/alerts/spend-types';
import { isPrismaUniqueViolation } from '@/shared/prisma-errors';

function valueSpend(costUsd: number): SpendAlertTarget['spend'] {
  return {
    kind: 'value',
    costUsd,
    sourceStatus: 'partial',
    sourceType: 'ESTIMATED',
    isPartial: true,
  };
}

function target(overrides: Partial<SpendAlertTarget> = {}): SpendAlertTarget {
  return {
    budgetRuleId: 'rule-1',
    scope: 'PROJECT_PROVIDER',
    projectName: 'Degusto',
    providerName: 'Neon',
    limitUsd: 1,
    escalationPercent: 30,
    spend: valueSpend(1.08),
    lastSyncAt: new Date('2026-09-05T14:05:00.000Z'),
    ...overrides,
  };
}

function memoryStore(seed: AlertEventRecord | null = null): SpendAlertStore & {
  events: Map<string, AlertEventRecord>;
  creates: number;
} {
  const events = new Map<string, AlertEventRecord>();
  if (seed) {
    events.set('rule-1:2026-09-05', seed);
  }
  return {
    events,
    creates: 0,
    async findEvent(budgetRuleId, budgetDate) {
      return events.get(`${budgetRuleId}:${budgetDate.toISOString().slice(0, 10)}`) ?? null;
    },
    async createFirstBreach(input) {
      this.creates += 1;
      events.set(`${input.budgetRuleId}:${input.budgetDate.toISOString().slice(0, 10)}`, {
        lastNotifiedCostUsd: input.spendUsd,
      });
    },
    async updateEscalation(input) {
      events.set(`${input.budgetRuleId}:${input.budgetDate.toISOString().slice(0, 10)}`, {
        lastNotifiedCostUsd: input.spendUsd,
      });
    },
  };
}

describe('spend alerts', () => {
  const day = new Date('2026-09-05T00:00:00.000Z');
  const now = new Date('2026-09-05T14:05:00.000Z');

  it('sends first breach and writes the event after Telegram succeeds', async () => {
    const store = memoryStore();
    const sent: string[] = [];
    const result = await evaluateSpendForTarget({
      target: target(),
      budgetDate: day,
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now,
    });
    expect(result).toBe('sent_first');
    expect(sent).toHaveLength(1);
    expect(sent[0]).toContain('COST ALERT');
    expect(sent[0]).toContain('Degusto');
    expect(sent[0]).toContain('Neon');
    expect(store.creates).toBe(1);
  });

  it('does not duplicate the first breach on the same UTC day', async () => {
    const store = memoryStore({ lastNotifiedCostUsd: 1.08 });
    const sent: string[] = [];
    const result = await evaluateSpendForTarget({
      target: target({ spend: valueSpend(1.2) }),
      budgetDate: day,
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now,
    });
    expect(result).toBe('skipped');
    expect(sent).toHaveLength(0);
  });

  it('escalates when spend grows by the step', async () => {
    const store = memoryStore({ lastNotifiedCostUsd: 2.01 });
    const sent: string[] = [];
    const result = await evaluateSpendForTarget({
      target: target({ limitUsd: 2, spend: valueSpend(2.62) }),
      budgetDate: day,
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now,
    });
    expect(result).toBe('sent_escalation');
    expect(sent[0]).toContain('Previous notified');
    expect(store.events.get('rule-1:2026-09-05')?.lastNotifiedCostUsd).toBe(2.62);
  });

  it('does not escalate below the step', async () => {
    const store = memoryStore({ lastNotifiedCostUsd: 2.01 });
    const sent: string[] = [];
    const result = await evaluateSpendForTarget({
      target: target({ limitUsd: 2, spend: valueSpend(2.5) }),
      budgetDate: day,
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now,
    });
    expect(result).toBe('skipped');
    expect(sent).toHaveLength(0);
  });

  it('starts a new first breach on a new UTC day', async () => {
    const store = memoryStore({ lastNotifiedCostUsd: 5 });
    store.events.set('rule-1:2026-09-05', { lastNotifiedCostUsd: 5 });
    const sent: string[] = [];
    const result = await evaluateSpendForTarget({
      target: target({ spend: valueSpend(1.5) }),
      budgetDate: new Date('2026-09-06T00:00:00.000Z'),
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now: new Date('2026-09-06T01:00:00.000Z'),
    });
    expect(result).toBe('sent_first');
    expect(sent).toHaveLength(1);
  });

  it('does not write an AlertEvent when Telegram fails', async () => {
    const store = memoryStore();
    await expect(
      evaluateSpendForTarget({
        target: target(),
        budgetDate: day,
        store,
        notifier: {
          sendHtml: async () => {
            throw new Error('Telegram API 500');
          },
        },
        now,
      }),
    ).rejects.toThrow(/Telegram/);
    expect(store.creates).toBe(0);
    expect(store.events.size).toBe(0);
  });

  it('swallows P2002 and does not send a second time from the insert race', async () => {
    const sent: string[] = [];
    const store: SpendAlertStore = {
      async findEvent() {
        return null;
      },
      async createFirstBreach() {
        const error = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
        throw error;
      },
      async updateEscalation() {
        throw new Error('should not update');
      },
    };
    const result = await evaluateSpendForTarget({
      target: target(),
      budgetDate: day,
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now,
    });
    expect(isPrismaUniqueViolation(Object.assign(new Error('x'), { code: 'P2002' }))).toBe(true);
    expect(result).toBe('skipped');
    expect(sent).toHaveLength(1);
  });

  it('skips missing and error spend instead of alerting $0', async () => {
    const store = memoryStore();
    const sent: string[] = [];
    const missing = await evaluateSpendForTarget({
      target: target({
        spend: {
          kind: 'missing',
          costUsd: null,
          sourceStatus: 'missing',
          sourceType: null,
          isPartial: false,
        },
      }),
      budgetDate: day,
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now,
    });
    const errored = await evaluateSpendForTarget({
      target: target({
        spend: {
          kind: 'error',
          costUsd: null,
          sourceStatus: 'error',
          sourceType: null,
          isPartial: false,
        },
      }),
      budgetDate: day,
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now,
    });
    expect(missing).toBe('skipped');
    expect(errored).toBe('skipped');
    expect(sent).toHaveLength(0);
  });

  it('evaluates PROJECT_TOTAL independently of PROJECT_PROVIDER', async () => {
    const store = memoryStore();
    const sent: string[] = [];
    const result = await evaluateSpendForTarget({
      target: target({
        budgetRuleId: 'rule-total',
        scope: 'PROJECT_TOTAL',
        spend: valueSpend(4),
        limitUsd: 3,
      }),
      budgetDate: day,
      store,
      notifier: {
        sendHtml: async (html) => {
          sent.push(html);
        },
      },
      now,
    });
    expect(result).toBe('sent_first');
    expect(sent[0]).toContain('COST ALERT');
  });
});
