# Progress — Neetrino CostOps

**Phase.** 4 — Upstash + VPS FIXED  
**Overall.** 96% (Neon + Vercel + project totals + Upstash + Hetzner/VPS fixed lines; operator mapping still open)  
**Updated.** 2026-09-07 (VPS static monthly costs)

---

## Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 0. Architecture + docs | ✅ TECH_CARD confirmed | 100% |
| 1. Core + Neon parity | 🔄 UI + history script; preview/parity next | 86% |
| 2. Vercel | 🔄 Adapter + board + tests; operator mapping next | 80% |
| 3. Project totals | ✅ UI + PROJECT_TOTAL + history apply | 90% |
| 4. Next providers | 🔄 Upstash + VPS FIXED; GCP postponed | 70% |
| 5. Advanced FinOps | ⏳ Out of v1 cutover | 0% |

---

## Done

- [x] Read spec `docs/Neetrino_CostOps_CURSOR_SPEC.md`
- [x] Size **B** recorded
- [x] Audited local `neetrino/neon`
- [x] Product docs (BRIEF, TECH_CARD, architecture, stack, structure, API, database, data model)
- [x] EXISTING_NEON_AUDIT, MIGRATION_MAP, adapter contract, alert rules, implementation plan
- [x] ADRs + DECISIONS
- [x] Cursor rules: Size B, CostOps constraints, NestJS/i18n globs fixed
- [x] README, `.env.example`, quality plan
- [x] Next.js 16 App Router + React 19 + Tailwind 4 + pnpm
- [x] Size B folders (`src/app`, `features`, `core`, `providers`, `notifications`, `shared`, `config`)
- [x] Prisma 7 schema from `DATA_MODEL.md` (including `CredentialAlert`) + initial migration
- [x] Zod env, Pino logger, Prisma client
- [x] Password + httpOnly JWT auth (Next.js 16 `src/proxy.ts` request gate)
- [x] Routes: `/`, `/login`, `/api/health`, `/api/auth/login`, `/api/auth/logout`
- [x] ESLint, Prettier, Vitest, Husky, commitlint, CI (Node 24)
- [x] Seed: Provider `NEON`/`VERCEL` + ProviderAccount from `NEON_ORG_ID` / `VERCEL_TEAM_ID` when set
- [x] Neon `CostProviderAdapter` (client, Zod, consumption v2, list projects, map-metrics, launch/scale pricing, credential meta)
- [x] Provider registry + contract check (`credentialCreateUrl` required)
- [x] Generic sync orchestration with SyncRun on **intraday** and daily reconcile
- [x] CostEntry / MetricEntry upsert by idempotency key; current day PARTIAL / ESTIMATED; yesterday FINAL
- [x] Spend alerts: first breach, escalation, P2002, Telegram-then-write
- [x] Credential AUTH_FAILED once per incident (calendar 30d / 7d / expired disabled; no stored expiry date)
- [x] Cron: per-provider `GET /api/cron/sync/{neon,upstash,vercel}` (staggered hourly) + matching yesterday reconcile; `GET /api/cron/sync` is alert-only
- [x] `POST /api/sync/now` (session + rate limit), `GET /api/sync/status`
- [x] Vitest: aggregation, alerts, freshness, Neon formula, credential 401, adapter contract
- [x] Dashboard read APIs: overview, projects, providers, usage series/totals, alerts, integrations, unmapped
- [x] Shared UTC date presets + Zod range (`current_month` / `previous_month` / 1 / 7 / 30 / 60 / custom, 400-day cap)
- [x] CostView on every cost (`costUsd` null when missing/error — never a bare 0)
- [x] Inline writes: project-provider budget, project rename/archive, resource mapping, credential expiry/rotate
- [x] Visual dashboard: app shell, home `/` is the projects board (URL filters, KPI strip, Recharts, cards/list, inline budget, freshness, sync chip); `/projects` redirects to `/`
- [x] Phase 1 detail routes: `/projects/[slug]`, `/providers/[key]`, `/unmapped`, `/integrations` (filter rail, charts, inline budget, mapping, credential health)
- [x] Nav: Projects (home), Neon, Vercel, Upstash, Unmapped, Integrations; project cards link to detail
- [x] Vercel `CostProviderAdapter` (`src/providers/vercel/`): GET `/v10/projects`, FOCUS GET `/v1/billing/charges`, Zod, credential meta (`supportsExpiryDate: false`)
- [x] Seed + cron ensure Provider `VERCEL` + ProviderAccount from `VERCEL_TEAM_ID`
- [x] `/providers/vercel` board + unmapped inbox for `vercel_project` / `vercel_unallocated`
- [x] Design tokens extended in `globals.css` (warning/stale/chart solids; no gradients)
- [x] `scripts/migrate-from-neon.ts` (dry-run default; `--apply` not run in this slice)
- [x] Phase 3 project totals: `combineProviderCostViews` (mapped only; missing provider → `partial`, never bare $0)
- [x] Project detail story: hero Total → Neon/Vercel lines + PROJECT_TOTAL inline limit → resources
- [x] Stacked provider series on `/projects/[slug]`; Overview “By project” uses the same mapped-provider rollup
- [x] `PATCH /api/projects/[slug]/budget-total` (ensure PROJECT_TOTAL, `enabled: true` only when a limit is set)
- [x] Upstash `CostProviderAdapter` (`src/providers/upstash/`): Management API Redis + QStash, Zod, credential meta (`supportsExpiryDate: false`)
- [x] Seed + cron ensure Provider `UPSTASH` + ProviderAccount from `UPSTASH_EMAIL`
- [x] `/providers/upstash` nav + generic provider board + unmapped `upstash_redis` / `upstash_qstash`
- [x] Hetzner/VPS FIXED: `Resource.fixedMonthlyUsd` + `fixedEffectiveOn`, adapter without API, add/update/stop only on `/providers/hetzner`, daily alerts skip FIXED

---

## In progress

- [x] Live Neon history `--apply` (2026-09-07, ~60 min): 65 resources, 42938 metrics, 6134 costs, 21 alerts
- [ ] Operator confirms suggested Vercel / Upstash maps (or archives trash) and enables Project × Provider limits

---

## Next

1. Confirm suggested maps in `/unmapped` (or archive trash) and enable Project × Provider limits
2. Operator deploys CostOps when ready (no preview wait)
3. GCP later (billing quota / SA JSON)
4. Operator adds VPS lines (NBOS, OMMM, …) from the VPS board — amounts are not seeded

---

## Notes

### 2026-09-07 — Phase 4 Upstash adapter (live API)

Management API Basic auth (`UPSTASH_EMAIL` + `UPSTASH_API_KEY`). GET only. Response bodies are not logged (list payloads include rest/QStash tokens). Zod list schemas keep identity fields only.

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /v2/redis/databases` | 200 | Array. 22 DBs observed (`database_id` / `database_name`). `type` is `paid`; `database_type` is `Pay as You Go`. `state` includes `archived`. Extra `read_only_rest_token` stripped. |
| `GET /v2/redis/stats/{id}?period=7d` | 200 | Seven recent UTC days. Live 2026-09-07 sum: `$0.422` vs `total_monthly_billing` `$0.423`; default five-point response undercounted the dashboard. |
| `GET /v2/qstash/users` | 200 | Two regional users (eu-central-1, us-east-1). `token` / `read_only_token` stripped. |
| `GET /v2/qstash/stats/{id}` | 200 | Default (no `period`) returns calendar-month `daily_billings`. `?period=30d` is **400** — unused. |
| `GET /v2/vector/index` | 200 | Empty list. Adapter still lists when indexes appear. |
| `GET /v2/search` | 200 | Empty list. |
| `GET /v2/teams` | 200 | Empty — personal account. `externalAccountId` = `UPSTASH_EMAIL`. |

Discrepancies vs docs:

- OpenAPI Redis `type` enum (`free`/`payg`/…) vs live `type: paid` + `database_type: Pay as You Go`.
- OpenAPI QStash `period=30d` vs live 400.
- Vector/Search stats expose `monthly_cost` only — daily CostOps rows stay `missing` until a daily USD series exists.
- Redis `dailybilling` uses the widest accepted window (`period=7d`); `30d` returns 400. Days outside the series are `missing`, not `$0`. Daily sync preserves days before they age out.

`supportsIntraday: true`. `supportsBackfill: true` (QStash month; Redis only the observed window).

---

### 2026-09-07 — Phase 3 project totals

- Project total = sum of **mapped** Project × Provider CostViews. Unmapped spend stays on provider/global.
- If any mapped provider is missing/error, the total is `partial` (or `stale` if worse) — not a fake complete sum. All-missing → `costUsd: null`.
- Optional `PROJECT_TOTAL` BudgetRule via `PATCH /api/projects/[slug]/budget-total`. Same enable-on-limit rule as Project × Provider. Telegram eval was already in `evaluate-spend.ts`.
- UI: `/projects/[slug]` hero Total + provider lines + stacked Recharts series (no gradients).
- This slice did **not** write CostOps `DATABASE_URL` (no `--apply`, migrate, seed, or sync). `migrate-from-neon --apply` may still be running separately.

### 2026-09-07 — Sync function timeout

- Production **Sync now** / hourly cron hit `FUNCTION_INVOCATION_TIMEOUT` at 60s (three providers + alerts). Telegram never ran.
- Same model as old Neon: **one provider per invocation**. Hourly cron staggered (`:00` Neon, `:10` Upstash, `:20` Vercel). Sync now calls them as three HTTP requests. Alerts also run from stored spend before each pull.
- Sync/cron/reconcile `maxDuration` is **300s** (Vercel Pro).

### 2026-09-07 — CI on main

- GitHub ruleset `main` requires the **Quality checks** job (Prisma validate, format, lint, typecheck, test, build).
- `next build` was failing: `maxDuration` must be a numeric literal, not `CRON_MAX_DURATION_SECONDS`.

---

### 2026-09-05 — foundation

- Scaffolded the runnable app. No Neon API sync, no Telegram spend engine, no charts.
- Auth uses Next.js 16 `proxy.ts` (successor to `middleware.ts`) with the Neon password + JWT cookie model.
- Prisma CLI uses `DIRECT_URL` when set; runtime uses pooled `DATABASE_URL`. Never points at `OLD_NEON_PROJECT_DATABASE_URL`.
- Local `.env` has a typo key `OLD_NEON_PROJECTDATABASE_URL` (missing underscore). Runtime ignores it; rename to `OLD_NEON_PROJECT_DATABASE_URL` before the history-copy script.

### 2026-09-05 — adapter + sync

- Ported Neon Console API + pricing formula; public transfer allowance is still org-wide (100 GB), same as `neetrino/neon`.
- Intraday writes `SyncRun` (old Neon skipped this).
- Unmapped Neon projects auto-create a CostOps Project + `PROJECT_PROVIDER` budget (env $1 / 30%) so alerts work before `migrate-from-neon`.
- Missing/error cost never becomes `$0`. Failed syncs do not invent spend rows.
- `OLD_NEON_PROJECT_DATABASE_URL` is unused in this slice.
- Neon pooled `DATABASE_URL` (PgBouncer) rejects startup `statement_timeout`. Runtime skips those `-c` options on `*-pooler.*` hosts; unpooled/local still apply TECH_CARD 30s/15s/10s.
- Live forced sync against the configured `NEON_API_KEY` succeeded (378 rows read, 336 written). Telegram may have sent first-breach messages if daily spend already exceeded the $1 default.

### 2026-09-05 — visual dashboard (Overview + Projects)

- App shell: nav (Overview, Projects), brand, sync status chip, Sync now (disabled while pending), Sign out. Login uses same canvas/paper tokens.
- Overview `/`: hero today + period totals as `CostView`, provider/project mix, near-limit, sync/credential/unmapped health.
- Projects `/projects`: filter rail (presets, UTC from/to, groupBy, refresh), URL-backed query string, KPI strip from `/api/usage/totals`, project comparison bars + usage-over-time lines (Recharts, flat solids), cards/list toggle, search, inline daily limit + escalation → `PATCH /api/project-providers/[id]/budget`.
- Freshness badge on every cost; missing/error never renders bare `$0`.
- Added `recharts` dependency.

### 2026-09-05 — Phase 1 detail routes

- Nav extended: Neon (`/providers/neon`), Unmapped, Integrations; project cards/list link to `/projects/[slug]`.
- `/projects/[slug]`: filter rail, today/period hero, provider compare + usage series (`projectId`), provider/resource breakdown, inline budget, rename, archive confirm.
- `/providers/[key]`: Neon-board quality — today/period/unmapped KPIs, compare + series (`providerKey`), project cards/list with Set limit.
- `/unmapped`: inbox list with CostView, project picker → `PATCH /api/resources/[id]/mapping`.
- `/integrations`: account status, last error, credential health badge, rotate external link, expiry + mark rotated (no secrets).
- Verified at ~1280px on `:3001`: Overview/Projects regression OK; project detail, Neon board, empty unmapped, integrations health + rotate link.

### 2026-09-05 — dashboard read APIs

- Session-gated JSON reads for Overview / Projects / Providers / usage series+totals / alerts / integrations / unmapped. `GET /api/sync/status` reused as-is.
- Inline writes: `PATCH /api/project-providers/[id]/budget` (limit + escalation; setting a limit enables the rule), project rename/archive, resource mapping, credential expiry / mark rotated.
- Missing/error costs return `costUsd: null` plus `sourceStatus` — never a bare `$0`.
- Neon-shaped aliases (`/api/usage/projects`, spend-alert) still outstanding.
- **Phase 1 safety (reversed 2026-09-07):** ignored Neon project IDs ported; auto-created PROJECT_PROVIDER rules started `enabled: false` so the first live sync would not Telegram-spam every leftover project over $1.

### 2026-09-05 — Neon history hose

- `pnpm migrate:from-neon` reads only `OLD_NEON_PROJECT_DATABASE_URL` via a read-only `pg` client (SELECT). The typo key is ignored. Aborts when old URL is missing or host+db match CostOps `DATABASE_URL`.
- Maps `neon_projects` → Resource `neon_project` + Project (slug + collision suffix) + ProjectProvider; explicit `spendAlertThresholdUsd` enables a PROJECT_PROVIDER rule; null keeps the rule disabled.
- `usage_snapshots` → 7× MetricEntry + CostEntry `ESTIMATED` via `estimateProjectCost` (`periodHours=24`) using existing upsert keys (merge with live sync). Ignored Neon IDs are archived and history is kept.
- `spend_alert_sent` → AlertEvent after a rule exists; skip+log unless `--create-missing-rules`. `sync_runs` optional, idempotent on `metadata.oldSyncRunId`.
- Manual remap table is an empty stub — no Degusto-style merges by name.
- Default is dry-run. This slice did not run `--apply` against a live database.
- `mergeBudgetRule` on apply: explicit old thresholds update; env-default rows no longer clobber operator UI sets.

### 2026-09-07 — Phase 2 Vercel adapter (live API)

Token + team env present. GET only. No secrets logged.

| Endpoint | Status | Notes |
|----------|--------|-------|
| `GET /v2/user` | 200 | Token valid |
| `GET /v10/projects?limit=100` | 200 | `{ projects, pagination }`. 37 team projects; `id`/`name`; `pagination.next` null on last page |
| `GET /v9/projects` | 200 | Same shape (v10 used) |
| `GET /v1/billing/charges` | 200 | `application/jsonl` FOCUS v1.3. `from`/`to` required. BilledCost **number**. Tags `{ ProjectId, ProjectName }` or `{}` |
| `GET /v1/billing/charges` current incomplete window | 404 | `{ error: { code: "costs_not_found" } }` |
| `GET /v1/billing/charges` missing `from` | 400 | `bad_request` |
| `GET /v2/billing` | 404 | `not_found` — unused |
| `GET /v1/invoices` | 200 | Invoice list exists; not used (charges are project-attributed) |

Discrepancies vs docs:

- Docs example `BilledCost`/`Tags` as strings; live `BilledCost` is number and `Tags` is an object.
- `RegionId`/`RegionName` often absent.
- Charge periods are **America/Los_Angeles** midnight (`2026-09-04T07:00:00.000Z` PDT). A naive UTC midnight window returns the **previous** Pacific day. Adapter requests the Pacific day for CostOps UTC date D.
- Current Pacific/incomplete day is `404 costs_not_found` — written as `missing`, not `$0`, and does **not** fail the SyncRun. Billing `403` would be `error` costs (token can still list projects). `401`/`403` on `/v10/projects` still trip credential AUTH_FAILED.
- `supportsIntraday: false`. `supportsBackfill: true`.
- Team-level usage charges with empty Tags land on resource `_unallocated`. Pro and seat subscription accruals are excluded because `EffectiveCost` already counts the included credit they fund; adding both would double-count usage.
- Listed projects with no charges on a **200** day get API `$0` `fresh` (the API returned a complete charge set).
- No ESTIMATED formula. `costUsd` is FOCUS **EffectiveCost** (usage, including included credit). `BilledCost` is metadata only.
- The active billing-cycle bounds come from `/v1/invoices` Pro line items and are stored in cost metadata. The `current_month` board filters Vercel to that cycle (Sep 3–7 = about `$27.29` in the live verification); custom ranges retain calendar history, including Sep 1–2.

Charges exist: yes. Yesterday-style Pacific day ~1.8k lines / ~$7.5 billed team-wide in the probe window.

Live adapter sync (Vercel account only): today `ok` 140 read / 102 written (38 `PARTIAL` cost rows — Pacific window for the current UTC date returned 200, not the short-window `404`); yesterday reconcile `ok` 418 read / 380 written (38 `FINAL`). 38 resources, all unmapped (`37` projects + `_unallocated`).

The `404 costs_not_found` was observed on a short UTC `from=today 00:00Z&to=now` request, not on the Pacific-aligned 24h window the adapter uses.

### 2026-09-07 — unmapped inbox

- Suggested project is prefilled from name similarity. Nothing is mapped until Map.
- Archive sets `Resource.archivedAt` (not delete). Archived tab restores. Spend stays on the resource.
- Full-screen inbox popup on each dashboard visit while open unmapped work exists. × / Not now dismisses this tab visit; new rows reopen it.
- Mapping picker is a searchable list (name, slug, provider chips). Duplicate names stay separate. Unmapped is a valid choice. A project does not need all three providers.
- After a non-empty provider discover, resources missing from the live list are archived (history kept). Picker hides projects with no live resource. Extra ToonExpo rows were leftover Neon IDs, not extra DBs in the console.
- Inbox **Save as project** (`POST /api/resources/[id]/project`) creates a CostOps project from one resource. Vercel/Upstash-only is valid. Team leftover (`_unallocated`) cannot become a project — Archive only.
- `POST /api/sync/backfill` + `scripts/backfill.ts` fill missing UTC days (Sync now is today only). Vercel totals and Telegram use **EffectiveCost** (who spent, including plan credit).

### 2026-09-07 — daily $1 alerts on by default

- Operator decision: every Neon / Vercel / Upstash Project × Provider rule is `$1` **and enabled**. No Set / Sync now to arm Telegram. VPS stays analytics-only.
- `ensureProjectProviderBudgetRule` creates `enabled: true`. One-shot `pnpm exec tsx src/scripts/enable-project-provider-rules.ts` turns on existing disabled live-provider rules. `pnpm exec tsx src/scripts/run-stored-alert-pass.ts` evaluates stored today without a provider pull.
- Near daily limit only lists **enabled** rules (same gate as Telegram). Disabled leftover rules no longer appear as if they were watching.

### 2026-09-07 — home = projects board

- `/` is the projects board (rail, KPI, near-limit strip, full-width compare + series, cards/list). `/projects` redirects to `/` and keeps the query string.
- Nav no longer has a separate Overview. Project detail breadcrumb goes to `/`.
- Charts stack full width (not two columns). Compare shows every project with cost; series uses a ranked highlight legend. Search also filters the charts.
- `/api/overview` stays; the Overview page was removed.

---

## Links

- Spec: [Neetrino_CostOps_CURSOR_SPEC.md](./Neetrino_CostOps_CURSOR_SPEC.md)
- Card: [TECH_CARD.md](./TECH_CARD.md)
- Plan: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- Baseline: https://github.com/neetrino/neon
