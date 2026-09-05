import type { CostSourceType, Freshness } from '@/providers/types';

export type CostRow = {
  costUsd: number;
  sourceStatus: Freshness;
  sourceType: CostSourceType;
  isPartial: boolean;
  projectId: string | null;
  projectProviderId: string | null;
  providerKey: string;
};

export type CostAggregate =
  | {
      kind: 'value';
      costUsd: number;
      sourceStatus: Freshness;
      sourceType: CostSourceType;
      isPartial: boolean;
    }
  | {
      kind: 'missing';
      costUsd: null;
      sourceStatus: 'missing';
      sourceType: null;
      isPartial: false;
    }
  | {
      kind: 'error';
      costUsd: null;
      sourceStatus: 'error';
      sourceType: null;
      isPartial: false;
    };

export type BudgetScopeFilter =
  | { scope: 'PROJECT_PROVIDER'; projectProviderId: string }
  | { scope: 'PROJECT_TOTAL'; projectId: string }
  | { scope: 'PROVIDER_TOTAL'; providerKey: string }
  | { scope: 'GLOBAL_TOTAL' };
