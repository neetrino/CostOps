# ADR-001: Project size B

**Status.** Accepted  
**Date.** 2026-09-05

## Context

Need a layout and delivery shape for CostOps: many screens, a plugin adapter model, one internal team.

## Decision

Size **B**: `src/features`, `src/core`, `src/providers`, `src/shared`. Timeline about 3–6 months.

## Alternatives

- **A:** Simple `app/components/lib`. Rejected — would collapse adapters into `lib/` and not match the spec tree.
- **C:** Monorepo `apps/*` + Nest. Rejected — one Next.js deploy, spec forbids K8s/microservice theater.

## Consequences

Public feature barrels. No `shared` → `features` imports. Provider code isolated. Docs include structure/API/database/ADRs.
