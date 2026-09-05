# Progress — Neetrino CostOps

**Phase.** 0 — architecture  
**Overall.** 15% (docs + rules; no application code)  
**Updated.** 2026-09-05

---

## Overview

| Phase | Status | Progress |
|-------|--------|----------|
| 0. Architecture + docs | 🔄 Awaiting TECH_CARD confirmation | 95% |
| 1. Core + Neon parity | ⏳ Blocked on confirmation | 0% |
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

---

## In progress

- [ ] Confirm TECH_CARD 🔄 rows (Node, Next, Prisma, pool, timeouts, coverage, rate limit, Sentry, domain)

**Blocker.** Phase 1 scaffold waits on that confirmation.

---

## Next

1. Confirm TECH_CARD
2. Provide dev database + Neon API credentials (when starting Phase 1)
3. Scaffold app and apply first migration
4. Port Neon adapter and dashboard

---

## Notes

### 2026-09-05

- Size B: feature modules + provider plugins; not Size A (too much domain) and not Size C (spec forbids microservice/K8s theater).
- Neon remains the visual and operational baseline. Intraday hourly cron does not write `SyncRun` today — CostOps will record account-scoped runs for both cadences.
- Adaptive DB limits proposed: pool 5, statement 30s, idle-in-tx 15s, lock 10s.

---

## Links

- Spec: [Neetrino_CostOps_CURSOR_SPEC.md](./Neetrino_CostOps_CURSOR_SPEC.md)
- Card: [TECH_CARD.md](./TECH_CARD.md)
- Plan: [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)
- Baseline: https://github.com/neetrino/neon
