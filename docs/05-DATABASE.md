# Database — Neetrino CostOps

PostgreSQL 17 on Neon. Prisma migrations only. Runtime uses least-privilege `DATABASE_URL`. `DIRECT_URL` exists only in the migrate-on-deploy job.

Full proposed schema: [DATA_MODEL.md](./DATA_MODEL.md).

---

## Principles

1. Idempotent sync — same provider/day/resource/dimension updates, never duplicates.
2. Unique external identities per `ProviderAccount`.
3. History survives provider retention.
4. Current UTC day may be rewritten; prior days are finalized then optionally reconciled.
5. Provider-specific metrics live in `MetricEntry`, not extra columns on `CostEntry`.
6. JSON `metadata` is non-critical only. Query fields stay columns + indexes.
7. Unmapped resources still store cost so money does not vanish from provider/global totals.

---

## Roles

| Role | Use |
|------|-----|
| Owner / migrator | `DIRECT_URL` in CI job only |
| `app_user` | App + cron DML |
| `readonly_user` | Optional analytics |

Local `.env` points at a **dev** branch only.

---

## Proposed limits (confirm on TECH_CARD)

| Setting | Proposed | Why |
|---------|----------|-----|
| Pool connections | 5 | Vercel serverless + Neon pooler |
| `statement_timeout` | 30s | Interactive queries |
| Sync AbortSignal | 60s (120s backfill) | App-level, not global DB timeout |
| `idle_in_transaction_session_timeout` | 15s | |
| `lock_timeout` | 10s | |

---

## Hot indexes

| Use | Index |
|-----|-------|
| Dashboard range | `CostEntry (projectId, bucketDate)`, `(providerKey, bucketDate)`, `(projectProviderId, bucketDate)` |
| Idempotent upsert | `CostEntry.idempotencyKey` unique, `MetricEntry.idempotencyKey` unique |
| Mapping inbox | `Resource (projectId)` where null |
| Alerts | `AlertEvent (budgetRuleId, budgetDate)` unique |
| Ops | `SyncRun (providerAccountId, startedAt)` |

---

## Production migrate

- Command: `pnpm db:migrate:deploy` → `prisma migrate deploy`
- Never `migrate dev`, `db push`, or `migrate reset` against production
- One job per release, same git SHA as the app
- Wire with `setup-production-migrations` during Phase 1 init

Schema changes: `safe-database-migration` skill. No laptop production deploys.
