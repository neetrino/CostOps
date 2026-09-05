export type DateRange = {
  from: Date;
  to: Date;
};

export type ProviderContext = {
  account: {
    id: string;
    providerKey: string;
    externalAccountId: string;
    credentialRef: string;
  };
  now: Date;
};

export type ResourceSyncResult = {
  discovered: Array<{
    externalId: string;
    displayName: string;
    resourceType: string;
    metadata?: Record<string, string | number | boolean | null>;
  }>;
};

export type CostSourceType = 'API' | 'ESTIMATED' | 'FIXED' | 'MANUAL';

export type Freshness = 'fresh' | 'partial' | 'final' | 'stale' | 'error' | 'missing';

export type NormalizedCost = {
  externalId: string;
  bucketDate: Date;
  costUsd: number;
  originalAmount?: number;
  originalCurrency?: string;
  sourceType: CostSourceType;
  sourceStatus: Freshness;
  isPartial: boolean;
  dimensionKey?: string;
  sourceRecordId?: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type NormalizedMetric = {
  externalId: string;
  bucketDate: Date;
  metricKey: string;
  valueNumeric?: number;
  valueBigint?: bigint;
  unit: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ProviderCredentialMeta = {
  envVarNames: string[];
  credentialCreateUrl: string;
  credentialDocsUrl: string;
  credentialCreatePath: string;
  supportsExpiryDate: boolean;
  isAuthFailure(error: unknown): boolean;
};

export interface CostProviderAdapter {
  providerKey: string;
  supportsIntraday: boolean;
  supportsBackfill: boolean;
  recommendedSyncIntervalMinutes?: number;
  credentials: ProviderCredentialMeta;
  syncResources(ctx: ProviderContext): Promise<ResourceSyncResult>;
  fetchCosts(ctx: ProviderContext, range: DateRange): Promise<NormalizedCost[]>;
  fetchMetrics?(ctx: ProviderContext, range: DateRange): Promise<NormalizedMetric[]>;
}
