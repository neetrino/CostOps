# Old Neon database (`OLD_NEON_PROJECT_DATABASE_URL`)

Env var: **`OLD_NEON_PROJECT_DATABASE_URL`**

This is the PostgreSQL URL of the **existing** analytics app:

- Repository: https://github.com/neetrino/neon  
- Live baseline: https://neon-neetrino.vercel.app  

It is **not** the CostOps database. CostOps uses `DATABASE_URL` / `DIRECT_URL` on its own Neon branch.

---

## Why it exists

When CostOps can ingest history, a one-off (or repeatable) **read** from this URL copies:

- `neon_projects` (names, thresholds, escalation)
- `usage_snapshots` (days the Neon API may no longer return)
- `spend_alert_sent` (if mappable)
- `sync_runs` (optional ops history)

Then CostOps writes into **its** schema (`Project`, `Resource`, `MetricEntry`, `CostEntry`, `BudgetRule`, …). See [MIGRATION_MAP.md](./MIGRATION_MAP.md).

Preferred over API-only backfill because provider retention is shorter than our history.

---

## Rules

| Do | Do not |
|----|--------|
| Read-only queries from `scripts/migrate-from-neon.ts` | Point CostOps runtime `DATABASE_URL` at this URL |
| Use when Phase 1 schema + Neon adapter exist | Run Prisma migrate / `db push` / reset against it |
| Treat as a secret (same as any prod URL) | Commit the value or put it in Vercel **app** env unless a dedicated one-shot job needs it |
| Stop if the URL looks like CostOps prod | Write, delete, or “fix” rows in the old app |

The old Neon **application** stays live until 7-day parity. This URL is only a data hose.

---

## When to use

Not on first scaffold. Use after:

1. CostOps migrations applied on the **new** DB
2. Neon adapter can upsert idempotently
3. Mapping script is reviewed

Command shape (Phase 1): `pnpm migrate:from-neon` reading `OLD_NEON_PROJECT_DATABASE_URL` and writing `DATABASE_URL`.

If the var is empty, the script exits with a clear error — do not invent a connection string.
