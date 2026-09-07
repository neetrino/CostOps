import type { CostView } from '@/core/cost/types';
import type { CredentialHealth } from '@/core/alerts/credential-health';
import type { SyncStatusView } from '@/core/sync/load-status';
import type { RangePayload } from '@/shared/dashboard-query';

export type { RangePayload };

export type OverviewProviderRow = {
  providerKey: string;
  displayName: string;
  today: CostView;
  period: CostView;
};

export type OverviewProjectRow = {
  projectId: string;
  slug: string;
  name: string;
  today: CostView;
  period: CostView;
};

export type NearLimitRow = {
  budgetRuleId: string;
  scope: string;
  projectId: string | null;
  projectSlug: string | null;
  projectName: string | null;
  providerKey: string | null;
  limitUsd: number;
  escalationPercent: number;
  spend: CostView;
  usagePercent: number;
};

export type OverviewResponse = {
  range: RangePayload;
  today: CostView;
  period: CostView;
  byProvider: OverviewProviderRow[];
  byProject: OverviewProjectRow[];
  nearLimit: NearLimitRow[];
  health: {
    sync: SyncStatusView;
    unmappedResourceCount: number;
    credentialAlerts: Array<{
      accountId: string;
      providerKey: string;
      name: string;
      health: CredentialHealth;
    }>;
  };
};
