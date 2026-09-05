# Migration map — neetrino/neon → CostOps

Old Neon stays live. Cut over only after 7-day parity (spec §26–28).

---

## Entity map

| Old | New | Rule |
|-----|-----|------|
| `NeonProject.neonProjectId` | `Resource.externalId` + `Resource.resourceType=neon_project` | Same Neon id |
| `NeonProject.name` | `Project.name` + `Resource.displayName` | Create `Project.slug` from name (unique, collision suffix) |
| — | `Provider` row `NEON` | Seed |
| — | `ProviderAccount` | One account from `NEON_ORG_ID` + `credentialRef=NEON` (`NEON_API_KEY`) |
| — | `ProjectProvider` | Each migrated project × NEON |
| `spendAlertThresholdUsd` | `BudgetRule.limitUsd` | Scope PROJECT_PROVIDER; null → env default, still persist a rule if the UI showed an override |
| `spendAlertEscalationPercentOfThreshold` | `BudgetRule.escalationPercent` | Null → 30 |
| `UsageSnapshot` metrics | 7× `MetricEntry` | Same UTC `snapshotDate` → `bucketDate`; `valueBigint` |
| Derived estimate | `CostEntry` | `sourceType=ESTIMATED`, recompute with `estimateProjectCost` for that one day (`periodHours=24`) |
| `SpendAlertSent` | `AlertEvent` | Map after BudgetRule exists |
| `SyncRun` | `SyncRun` | Attach Neon `ProviderAccount`; `targetDate` → `rangeFrom/rangeTo` that UTC day |
| `lib/constants/ignored-projects` | `Resource.archivedAt` or ignore flag | Do not drop history |

If a Neon project name should map to an existing business project (Degusto, …), use a **manual mapping table** in the migration script. Do not guess only by string equality.

---

## File map

| Old path | New path | Action |
|----------|----------|--------|
| `lib/neon/*` | `src/providers/neon/*` | Move/port |
| `lib/sync/map-metrics.ts` | `src/providers/neon/map-metrics.ts` | Move |
| `lib/sync/sync-usage-day.ts` | `src/providers/neon/sync-day.ts` + `core/sync` upsert | Split |
| `lib/sync/sync-usage-intraday-today.ts` | `src/providers/neon/sync-intraday.ts` + `core/sync` | Split |
| `lib/sync/run-usage-sync.ts` | `src/core/sync/run-account-sync.ts` | Generalize |
| `lib/sync/run-intraday-sync.ts` | same orchestrator, `supportsIntraday` | Generalize |
| `lib/sync/retry.ts` | `src/shared/retry.ts` | Move |
| `lib/usage/neon-conversions.ts` | `src/providers/neon/pricing.ts` | Move |
| `lib/usage/aggregate-project-costs.ts` | `src/core/cost` + neon pricing | Split formula vs generic sum |
| `lib/alerts/*` | `src/core/alerts/*` + `src/notifications/telegram` | Generalize |
| `lib/telegram/*` | `src/notifications/telegram` | Move |
| `lib/auth/*`, `middleware.ts` | `src/shared/auth`, `src/middleware.ts` | Reuse |
| `lib/env.ts` | `src/shared/env.ts` | Extend |
| `lib/db.ts`, `lib/logger.ts`, `lib/dates.ts` | `src/shared/*` | Reuse |
| `components/dashboard/*` | `src/features/providers/neon` then generic widgets in `shared` / `features` | Port UI; replace `neonProjectId` with view models |
| `app/api/usage/*` | `src/app/api/...` | Generalize, keep aliases |
| `app/api/cron/*` | `src/app/api/cron/sync` | One scheduler |
| `scripts/backfill-neon-usage.ts` | `scripts/backfill.ts --provider=neon` | Generalize |
| `scripts/reconcile-neon-usage.ts` | `scripts/reconcile.ts --provider=neon` | Generalize |
| `prisma/schema.prisma` | new schema | Do not copy models |

---

## SpendAlertSent → AlertEvent

| Old field | New field |
|-----------|-----------|
| `neonProjectId` + date | Resolve `BudgetRule` for that ProjectProvider |
| `snapshotDate` | `budgetDate` |
| `spendUsd` | `firstBreachCostUsd` |
| `thresholdUsd` | informational only (rule may have changed; do not rewrite history) |
| `lastNotifiedSpendUsd` ?? `spendUsd` | `lastNotifiedCostUsd` |
| `sentAt` | `lastNotifiedAt` / `createdAt` |

If a project has alert history but no resolvable BudgetRule, **skip and log** — do not invent a rule from the historical threshold unless `--create-missing-rules` is passed.

---

## History backfill options

1. **DB copy (preferred):** read old `DATABASE_URL` (read-only) and write CostOps. Preserves days Neon API no longer returns.
2. **API backfill:** `syncUsageForUtcDay` per day — fills gaps only.
3. **Reconcile:** after copy, run Neon reconcile for recent N days.

Do not delete old rows. CostOps writes to a **new** database.

---

## Parity checklist (before cutover)

Same UTC range, provider filter Neon:

- [ ] Project set and names
- [ ] Metric totals per project
- [ ] Estimated USD within formula precision
- [ ] Presets + custom range
- [ ] Charts
- [ ] Thresholds + escalation %
- [ ] First-breach and escalation Telegram (staging bot)
- [ ] Sync status
- [ ] Backfill/reconcile totals

Document any intentional difference in `docs/PROGRESS.md`.

---

## Cutover

```text
Old Neon live
  → CostOps core + Neon adapter
  → migrate/backfill
  → parallel run ≥ 7 days
  → compare totals, charts, alerts
  → DNS/bookmark cutover
  → archive old app (do not delete data)
```

CostOps must not point its runtime at the old Neon **application** database except the one-off read-only migration job.
