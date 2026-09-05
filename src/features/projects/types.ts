import type { BudgetRuleView } from '@/core/budgets/rule-view';
import type { CostView } from '@/core/cost/types';
import type { RangePayload } from '@/shared/dashboard-query';

export type BudgetView = BudgetRuleView;

export type ProjectProviderRow = {
  providerKey: string;
  projectProviderId: string;
  today: CostView;
  period: CostView;
  budget: BudgetView | null;
};

export type ProjectListRow = {
  id: string;
  slug: string;
  name: string;
  archived: boolean;
  today: CostView;
  period: CostView;
  providers: ProjectProviderRow[];
};

export type ProjectListResponse = {
  range: RangePayload;
  projects: ProjectListRow[];
};

export type ProjectResourceRow = {
  id: string;
  externalId: string;
  displayName: string;
  resourceType: string;
  today: CostView;
  period: CostView;
};

export type ProjectDetailResponse = {
  range: RangePayload;
  project: {
    id: string;
    slug: string;
    name: string;
    archived: boolean;
    createdAt: string;
  };
  today: CostView;
  period: CostView;
  providers: Array<
    ProjectProviderRow & {
      resources: ProjectResourceRow[];
    }
  >;
};
