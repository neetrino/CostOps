# Decisions — Neetrino CostOps

| ID | Decision | Status |
|----|----------|--------|
| [ADR-001](./decisions/ADR-001-project-size-b.md) | Size B, feature + adapter layout | Accepted (Phase 0) |
| [ADR-002](./decisions/ADR-002-nextjs-fullstack.md) | Next.js Route Handlers, not NestJS | Accepted (Phase 0) |
| [ADR-003](./decisions/ADR-003-credentials-env-refs.md) | Env credential refs in v1 | Accepted (Phase 0) |
| [ADR-004](./decisions/ADR-004-utc-budget-day.md) | UTC storage and budget day | Accepted (Phase 0) |
| [ADR-005](./decisions/ADR-005-dashboard-password-auth.md) | Reuse Neon password JWT | Accepted (Phase 0) |

TECH_CARD confirmed 2026-09-05 (Node 24, Next 16, Prisma 7, pool 5, timeouts 30/15/10, coverage 80/70). Neon env names match `neetrino/neon`.

Product (2026-09-07): count **usage** (who spent, including plan credit), not invoice remainder. Vercel `costUsd` = FOCUS `EffectiveCost`. Telegram uses the same number. See `docs/BRIEF.md` and `.cursor/rules/02-costops.mdc`.

When a Phase 4 provider forces a core schema change, add an ADR before migrating.
