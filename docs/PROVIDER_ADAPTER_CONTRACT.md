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
  supportsExpiryDate: boolean; // always false; CostOps does not store token expiry dates
  isAuthFailure(error: unknown): boolean;
};

export interface CostProviderAdapter {
  providerKey: string;
  supportsIntraday: boolean;
  supportsBackfill: boolean;
  recommendedSyncIntervalMinutes?: number;
  requiresCredentials?: boolean; // default true; false for FIXED/manual
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
4. Cost sources: API (provider usage/billing feed), ESTIMATED (formula from usage), FIXED (Hetzner-like), MANUAL (import). Prefer usage (who spent) over invoice remainder. Vercel: `EffectiveCost` → `costUsd`.
5. Estimated cost must stay labeled estimated in UI and Telegram.
6. Adapters never send Telegram, never evaluate BudgetRules, never write generic columns for one-off metrics.
7. Credentials are read via `credentialRef` → env. No secrets in adapter source.
8. Every adapter **must** ship `credentials` metadata (create URL, docs, auth-failure detector). See [CREDENTIAL_ROTATION.md](./CREDENTIAL_ROTATION.md).
9. `requiresCredentials: false` skips rotate-token URLs and env vars (Hetzner/VPS FIXED). `isAuthFailure` still required and returns false.
10. FIXED Hetzner: for each UTC month that **overlaps** the fetch range and is on/after `fixedEffectiveOn`, emit one row on the 1st (`sourceType=FIXED`). Do not write `$fee / days`. Amount edits rewrite the current month only; existing past month rows stay.
11. If docs disagree with a live response, record it in `docs/PROGRESS.md` and adapter comments. Observed API wins for implementation, documented as a discrepancy.

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
| VERCEL | no (current Pacific day often `404 costs_not_found`) | yes (FOCUS daily) | API `GET /v1/billing/charges` (JSONL) | Observed API in `docs/PROGRESS.md`. GET only. |
| UPSTASH | yes (current UTC day in Redis `dailybilling` / QStash `daily_billings`) | yes (QStash month; Redis ~5 recent UTC days) | API `GET /v2/redis/stats/{id}` + `GET /v2/qstash/stats/{id}` | Observed API in `docs/PROGRESS.md`. Basic auth. GET only. Days outside the series window are `missing`, not `$0`. |
| GCP | provider-specific | yes if export/API | API | |
| HETZNER | no | yes | FIXED recurring | UI label **VPS**. No API token. Operator-entered `$ / month`. |

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
