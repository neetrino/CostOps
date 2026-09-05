# Provider adapter contract

Adding a provider must not rewrite alerts, budgets, or project dashboards. All provider I/O stays under `src/providers/<key>/`.

---

## Capabilities

```ts
export type DateRange = {
  from: Date; // inclusive UTC day
  to: Date;   // inclusive UTC day
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
    metadata?: Record<string, unknown>;
  }>;
};

export type NormalizedCost = {
  externalId: string;
  bucketDate: Date;
  costUsd: number;
  originalAmount?: number;
  originalCurrency?: string;
  sourceType: "API" | "ESTIMATED" | "FIXED" | "MANUAL";
  sourceStatus: "fresh" | "partial" | "final" | "stale" | "error" | "missing";
  isPartial: boolean;
  dimensionKey?: string;
  sourceRecordId?: string;
  metadata?: Record<string, unknown>;
};

export type NormalizedMetric = {
  externalId: string;
  bucketDate: Date;
  metricKey: string;
  valueNumeric?: number;
  valueBigint?: bigint;
  unit: string;
  metadata?: Record<string, unknown>;
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

  fetchMetrics?(
    ctx: ProviderContext,
    range: DateRange,
  ): Promise<NormalizedMetric[]>;
}
```

Exact type names may live in `src/core` once Phase 1 starts. The split of responsibilities is mandatory.

---

## Rules

1. Validate every provider HTTP payload with Zod. Fail the SyncRun on malformed data. Do not coerce to zero.
2. Respect provider rate limits. The process scheduler may tick often; the adapter decides whether a fetch is due.
3. `supportsIntraday` is false unless the API can return a useful current-day number.
4. Cost sources: API (invoiced/billing), ESTIMATED (formula from usage), FIXED (Hetzner-like), MANUAL (import).
5. Estimated cost must stay labeled estimated in UI and Telegram.
6. Adapters never send Telegram, never evaluate BudgetRules, never write generic columns for one-off metrics.
7. Credentials are read via `credentialRef` → env. No secrets in adapter source.
8. Every adapter **must** ship `credentials` metadata (create URL, docs, auth-failure detector). See [CREDENTIAL_ROTATION.md](./CREDENTIAL_ROTATION.md).
9. If docs disagree with a live response, record it in `docs/PROGRESS.md` and adapter comments. Observed API wins for implementation, documented as a discrepancy.

---

## Registry

`src/providers/registry.ts` maps `ProviderKey` → adapter instance.

Scheduler:

```text
load enabled accounts due for sync
  → adapter.syncResources
  → adapter.fetchCosts / fetchMetrics
  → core upsert by idempotencyKey
  → SyncRun success/error
  → evaluate alerts for affected UTC day
```

---

## First adapters

| Key | Intraday | Backfill | Cost source | Notes |
|-----|----------|----------|-------------|-------|
| NEON | yes (hourly slots summed) | yes | ESTIMATED from usage + plan rates | Port `lib/neon/*`, `lib/sync/*`, `lib/usage/*` |
| VERCEL | verify API | verify API | API if billing exists | Do not hard-code stale billing fields |
| UPSTASH | provider-specific | if API allows | API or documented ESTIMATED | |
| GCP | provider-specific | yes if export/API | API | |
| HETZNER | no | n/a | FIXED recurring | |

---

## Neon port list

Copy with minimal change into `src/providers/neon/`:

- `lib/neon/client.ts`
- `lib/neon/schemas.ts`
- `lib/neon/fetch-consumption-v2.ts`
- `lib/neon/list-projects.ts`
- `lib/sync/map-metrics.ts`
- `lib/usage/neon-conversions.ts`
- `lib/constants/neon-metrics.ts`

Orchestration (`run-usage-sync`, `run-intraday-sync`) moves to `src/core/sync` and must become provider-agnostic.
