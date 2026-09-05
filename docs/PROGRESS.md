# Progress — Neetrino CostOps

**Phase.** 1 — Neon adapter + sync slice done  
**Overall.** 48% (foundation + pull/sync/alerts; dashboard still next)  
**Updated.** 2026-09-05

---

## Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 0. Architecture + docs | ✅ TECH_CARD confirmed | 100% |
| 1. Core + Neon parity | 🔄 Adapter/sync/alerts done | 45% |
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

---

## In progress

- [ ] Dashboard boards (Overview / Projects / Neon)
- [ ] Read APIs beyond sync status
- [ ] `scripts/migrate-from-neon.ts`

**Blocker.** None for the dashboard / read-API slice.

---

## Next

1. Read APIs (`/api/overview`, projects, series) + dashboard port per `docs/DESIGN.md`
2. Inline budget PATCH + mapping UI
3. History copy from `OLD_NEON_PROJECT_DATABASE_URL`
4. Preview deploy + 7-day Neon parity

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

---

## Links

- Spec: [Neetrino_CostOps_CURSOR_SPEC.md](./Neetrino_CostOps_CURSOR_SPEC.md)
- Card: [TECH_CARD.md](./TECH_CARD.md)
- Plan: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- Baseline: https://github.com/neetrino/neon
