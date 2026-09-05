import type { CostAggregate } from '@/core/cost/types';
import type { BudgetScope } from '@/generated/prisma/enums';

export type SpendAlertTarget = {
  budgetRuleId: string;
  scope: BudgetScope;
  projectName: string;
  providerName: string;
  limitUsd: number;
  escalationPercent: number;
  spend: CostAggregate;
  lastSyncAt: Date;
};

export type AlertEventRecord = {
  lastNotifiedCostUsd: number;
};

export type SpendAlertStore = {
  findEvent(budgetRuleId: string, budgetDate: Date): Promise<AlertEventRecord | null>;
  createFirstBreach(input: {
    budgetRuleId: string;
    budgetDate: Date;
    spendUsd: number;
    notifiedAt: Date;
  }): Promise<void>;
  updateEscalation(input: {
    budgetRuleId: string;
    budgetDate: Date;
    spendUsd: number;
    notifiedAt: Date;
  }): Promise<void>;
};

export type SpendNotifier = {
  sendHtml(text: string): Promise<void>;
};

export type SpendEvalResult = 'sent_first' | 'sent_escalation' | 'skipped';
