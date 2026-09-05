# Existing Neon audit

Local reference: `/Users/user/{} Development/1. Production/neon`  
Remote: https://github.com/neetrino/neon (private)  
Live: https://neon-neetrino.vercel.app  

Audited 2026-09-05. Do not modify that repository while CostOps is built.

---

## What it is

Size A Next.js 15 App Router app (`neon-usage-dashboard`). Daily + hourly Neon consumption sync → Postgres → dashboard + Telegram spend alerts.

Stack: Next 15.5, React 19, Tailwind 4, Prisma 6, Zod, Pino, Recharts, pnpm 10, Vercel Cron. No Auth.js, Redis, or test suite.

---

## Architecture

```
Vercel Cron 02:00 UTC  →  /api/cron/sync-neon-usage      (yesterday, daily granularity)
Vercel Cron hourly     →  /api/cron/sync-neon-usage-today (today, hourly slots summed)
                         →  Neon Console API
                         →  upsert usage_snapshots
                         →  evaluateSpendAlertsForSyncedDay
Browser                →  / + /api/usage/*  (optional password JWT)
```

Layout: `app/`, `components/dashboard/`, `lib/{neon,sync,alerts,usage,auth,telegram}`, `prisma/`, `scripts/`.

---

## Schema (keep behavior)

| Table | Role | Unique |
|-------|------|--------|
| `neon_projects` | id, name, region, per-project threshold + escalation % | `neon_project_id` |
| `usage_snapshots` | seven Neon metrics per project/UTC day | `(neon_project_id, snapshot_date)` |
| `sync_runs` | job audit (no provider id) | — |
| `spend_alert_sent` | first breach + `last_notified_spend_usd` | `(neon_project_id, snapshot_date)` |

Defaults: threshold `$1`, escalation `30%` of threshold (`lib/constants/spend-alert-default.ts`).

---

## Reuse with little change

| Area | Paths | Notes |
|------|-------|-------|
| Neon HTTP + Zod | `lib/neon/client.ts`, `schemas.ts`, `fetch-consumption-v2.ts`, `list-projects.ts` | Paginated v2 consumption, metric allow-list |
| Metric map | `lib/sync/map-metrics.ts`, `lib/constants/neon-metrics.ts` | |
| Cost formula | `lib/usage/neon-conversions.ts`, `aggregate-project-costs.ts` | launch/scale rates, 100 GB public transfer allowance |
| Retry | `lib/sync/retry.ts` | 3 attempts, 500ms × 2^n |
| Dates | `lib/dates.ts`, `components/dashboard/date-presets.ts` | UTC current/prev month, 1/7/30/60 |
| Auth | `lib/auth/*`, `middleware.ts`, `app/login`, `app/api/auth/*` | Password + httpOnly JWT; cron + health public |
| Telegram send | `lib/telegram/send-telegram-message.ts` | |
| Alert math | `evaluate-spend-alerts.ts`, `escalationStepUsd` | Send-then-insert; P2002 swallow |
| Logger / env / db | `lib/logger.ts`, `env.ts`, `db.ts` | Zod env |
| Dashboard UI | `components/dashboard/*` | KPI, line chart, compare bars, cards/list, filter sidebar, inline threshold |
| Ops scripts | `scripts/backfill-neon-usage.ts`, `reconcile-neon-usage.ts` | |
| Cron lock | `vercel.json` + Bearer `CRON_SECRET` | |

---

## Generalize (do not copy as core entities)

| Neon | CostOps |
|------|---------|
| `NeonProject` | `Project` + `ProjectProvider` + `Resource` (type `neon_project`) |
| Threshold columns on project | `BudgetRule` scope `PROJECT_PROVIDER` |
| `UsageSnapshot` wide metrics | `MetricEntry` + derived `CostEntry` (ESTIMATED) |
| `SpendAlertSent` | `AlertEvent` keyed by `budgetRuleId` |
| `SyncRun` (global, `targetDate` only) | `SyncRun` per `ProviderAccount` + range |
| `run-usage-sync` / `run-intraday-sync` | `core/sync` orchestration |
| Ignored project IDs constant | Settings/resource archive or ignore flag |
| `NEON_PRICING_PLAN` env | Neon adapter config |
| Message title `Neon` | Provider + project fields |

---

## Do not reuse as-is

- Size A folder layout as the long-term tree
- Wide `UsageSnapshot` columns as the generic cost table
- Hardcoded single-org Neon assumptions in UI types (`neonProjectId` everywhere)
- README leftover template Armenian/onboarding text (not product logic)
- Absence of tests — CostOps must add Vitest coverage for money and alerts
- Prisma 6 client style if TECH_CARD confirms Prisma 7 (port, do not copy `package.json` blindly)
- `db push` habits — CostOps uses migrate-on-deploy

---

## UI baseline to preserve

From `UsageDashboard` + sidebar + table:

- Presets: current month, previous month, 1 / 7 / 30 / 60 days, custom from/to
- Grouping: day / month (extend with week in CostOps)
- Cards / list presentation
- Search / filter
- Project comparison bars
- Usage over time
- KPI strip + tooltips
- Inline spend limit + escalation %
- Sync status / refresh awareness
- Estimated cost clearly estimated

---

## Alert behavior (parity)

1. After successful day or intraday sync, load that UTC day’s snapshots, estimate cost, compare to per-project or env default.
2. Skip `isIgnoredProjectId`.
3. If spend ≤ limit: no-op.
4. If no row for `(project, day)`: Telegram first, then insert anchor.
5. Else if spend > anchor + step: Telegram escalation, update `lastNotifiedSpendUsd`.
6. Telegram failure: log, no DB write (retry next sync).

Format today is Neon-specific compact HTML (`📦 name`, `📅 Day NN`, estimated vs limit). CostOps messages add provider and freshness (see `ALERT_RULES.md`) without losing escape/safety.

---

## API surface to port then generalize

```text
GET  /api/usage/projects
GET  /api/usage/project-totals
GET  /api/usage/series
GET  /api/usage/sync-status
POST /api/usage/sync-now
PATCH /api/usage/projects/[neonProjectId]/spend-alert
GET  /api/cron/sync-neon-usage
GET  /api/cron/sync-neon-usage-today
GET  /api/neon/health
POST /api/auth/login|logout
```

---

## Gaps vs CostOps spec

- One provider only; no Project as a business entity
- No unmapped-resource inbox (ignored IDs are a denylist)
- No freshness enum — missing looks like empty/zero in places
- SyncRun not scoped to an account
- No optional project/provider/global budgets
- No automated tests
- Intraday SyncRun is not written (`runIntradaySync` skips SyncRun create)

CostOps must keep the useful behavior and close these gaps in core, not inside the Neon adapter.
