# Progress — Neetrino CostOps

**Phase.** 1 — dashboard UI complete (Overview through Integrations)  
**Overall.** 82% (foundation + sync/alerts + dashboard reads + Phase 1 UI)  
**Updated.** 2026-09-05

---

## Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 0. Architecture + docs | ✅ TECH_CARD confirmed | 100% |
| 1. Core + Neon parity | 🔄 Phase 1 UI complete; history copy next | 82% |
| 2. Vercel | ⏳ | 0% |
| 3. Project totals | ⏳ | 0% |
| 4. Next providers | ⏳ | 0% |
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
- [x] Seed: Provider `NEON` + ProviderAccount from `NEON_ORG_ID` when set
- [x] Neon `CostProviderAdapter` (client, Zod, consumption v2, list projects, map-metrics, launch/scale pricing, credential meta)
- [x] Provider registry + contract check (`credentialCreateUrl` required)
- [x] Generic sync orchestration with SyncRun on **intraday** and daily reconcile
- [x] CostEntry / MetricEntry upsert by idempotency key; current day PARTIAL / ESTIMATED; yesterday FINAL
- [x] Spend alerts: first breach, escalation, P2002, Telegram-then-write
- [x] Credential AUTH_FAILED once per incident + 30d / 7d / expired
- [x] Cron: `GET /api/cron/sync`, `GET /api/cron/reconcile-yesterday`; `vercel.json` `0 * * * *` and `0 2 * * *`
- [x] `POST /api/sync/now` (session + rate limit), `GET /api/sync/status`
- [x] Vitest: aggregation, alerts, freshness, Neon formula, credential 401, adapter contract
- [x] Dashboard read APIs: overview, projects, providers, usage series/totals, alerts, integrations, unmapped
- [x] Shared UTC date presets + Zod range (`current_month` / `previous_month` / 1 / 7 / 30 / 60 / custom, 400-day cap)
- [x] CostView on every cost (`costUsd` null when missing/error — never a bare 0)
- [x] Inline writes: project-provider budget, project rename/archive, resource mapping, credential expiry/rotate
- [x] Visual dashboard: app shell, Overview `/`, Projects `/projects` (URL filters, KPI strip, Recharts, cards/list, inline budget, freshness, sync chip)
- [x] Phase 1 detail routes: `/projects/[slug]`, `/providers/[key]`, `/unmapped`, `/integrations` (filter rail, charts, inline budget, mapping, credential health)
- [x] Nav: Overview, Projects, Neon, Unmapped, Integrations; project cards link to detail
- [x] Design tokens extended in `globals.css` (warning/stale/chart solids; no gradients)

---

## In progress

- [ ] `scripts/migrate-from-neon.ts`

---

## Next

1. History copy from `OLD_NEON_PROJECT_DATABASE_URL`
2. Preview deploy + 7-day Neon parity

---

## Notes

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
- **Phase 1 safety:** ignored Neon project IDs ported; auto-created PROJECT_PROVIDER rules default to `enabled: false`; one-shot `pnpm exec tsx src/scripts/disable-default-project-provider-rules.ts` disables existing env-default ($1) rules.

---

## Links

- Spec: [Neetrino_CostOps_CURSOR_SPEC.md](./Neetrino_CostOps_CURSOR_SPEC.md)
- Card: [TECH_CARD.md](./TECH_CARD.md)
- Plan: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- Baseline: https://github.com/neetrino/neon
