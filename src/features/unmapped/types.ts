import type { CostView } from '@/core/cost/types';
import type { ProjectSuggestion } from '@/core/mapping/suggest-project';
import type { RangePayload } from '@/shared/dashboard-query';

export type InboxResourceRow = {
  id: string;
  providerKey: string;
  providerAccountId: string;
  externalId: string;
  displayName: string;
  resourceType: string;
  discoveredAt: string;
  archivedAt: string | null;
  suggestion: ProjectSuggestion | null;
  today: CostView;
  period: CostView;
};

export type InboxResourcesResponse = {
  range: RangePayload;
  inbox: 'open' | 'archived';
  openCount: number;
  archivedCount: number;
  resources: InboxResourceRow[];
};

export type InboxProjectOption = {
  id: string;
  name: string;
  slug: string;
  archived: boolean;
  providerKeys: string[];
};

export type ProjectOptionsResponse = {
  projects: InboxProjectOption[];
};

export type InboxStatusPreview = {
  id: string;
  displayName: string;
  providerKey: string;
  suggestion: ProjectSuggestion | null;
};

export type InboxStatusResponse = {
  unmappedCount: number;
  preview: InboxStatusPreview[];
};
