# Progress — Neetrino CostOps

**Phase.** 1 — foundation in progress  
**Overall.** 28% (runnable app + schema + auth)  
**Updated.** 2026-09-05

---

## Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 0. Architecture + docs | ✅ TECH_CARD confirmed | 100% |
| 1. Core + Neon parity | 🔄 Foundation slice done | 20% |
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

---

## In progress

- [ ] Neon adapter + sync
- [ ] Cost / alert core + Telegram spend engine
- [ ] Dashboard boards (Overview / Projects / Neon)
- [ ] `scripts/migrate-from-neon.ts`

**Blocker.** None for the next Phase 1 slice (adapter + sync).

---

## Next

1. Port Neon adapter (client, metrics, pricing, day + intraday sync)
2. Core upsert / aggregates / freshness / budget eval
3. Telegram spend alerts + credential rotation warnings
4. Read APIs + dashboard port per `docs/DESIGN.md`

---

## Notes

### 2026-09-05 — foundation

- Scaffolded the runnable app. No Neon API sync, no Telegram spend engine, no charts.
- Auth uses Next.js 16 `proxy.ts` (successor to `middleware.ts`) with the Neon password + JWT cookie model.
- Prisma CLI uses `DIRECT_URL` when set; runtime uses pooled `DATABASE_URL`. Never points at `OLD_NEON_PROJECT_DATABASE_URL`.
- Local `.env` has a typo key `OLD_NEON_PROJECTDATABASE_URL` (missing underscore). Runtime ignores it; rename to `OLD_NEON_PROJECT_DATABASE_URL` before the history-copy script.

---

## Links

- Spec: [Neetrino_CostOps_CURSOR_SPEC.md](./Neetrino_CostOps_CURSOR_SPEC.md)
- Card: [TECH_CARD.md](./TECH_CARD.md)
- Plan: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- Baseline: https://github.com/neetrino/neon
