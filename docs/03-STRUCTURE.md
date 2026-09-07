# Structure — Neetrino CostOps

Size B feature layout. Import features and providers through public barrels only.

---

## Tree

```
CostOps/
├── src/
│   ├── app/                      # Next.js routes, layouts, Route Handlers
│   ├── features/
│   │   ├── overview/             # company totals, health, top spenders
│   │   ├── projects/             # list + /projects/[slug]
│   │   ├── providers/            # list + /providers/[key] boards
│   │   ├── budgets/              # inline + settings budget UI
│   │   ├── alerts/               # alert history surfaces
│   │   ├── settings/             # projects, accounts, mapping, backfill
│   │   └── integrations/         # connection health
│   ├── core/
│   │   ├── cost/                 # normalize, aggregate, freshness
│   │   ├── metrics/              # generic metric store helpers
│   │   ├── sync/                 # scheduler + orchestration
│   │   ├── budgets/              # scope resolve + usage %
│   │   ├── alerts/               # first breach + escalation
│   │   └── mapping/              # resource → project
│   ├── scripts/                  # CLI helpers (migrate-from-neon)
│   ├── providers/
│   │   ├── registry.ts           # key → adapter
│   │   ├── neon/
│   │   ├── vercel/
│   │   └── …
│   ├── notifications/telegram/
│   ├── shared/                   # UI primitives, dates, logger, env
│   └── config/
├── prisma/
├── tests/                        # extra integration/e2e if not colocated
├── scripts/                      # backfill, migrate-from-neon, reconcile
└── docs/
```

Each feature folder: `components/`, `hooks/`, `services/`, `types/`, `index.ts`.

Each provider folder: `adapter.ts`, `client.ts`, `schemas.ts`, `map-metrics.ts`, `pricing.ts` (only if estimated), `index.ts`.

---

## Import rules

```text
app        → features, shared, config
features/X → core, shared, providers/registry, features/X internals
core       → shared, prisma/db helpers
providers  → core types, shared/env+logger, own client
shared     → nothing in features or providers
```

Forbidden:

- `features/overview` importing `@/features/projects/components/...`
- `shared` importing `@/providers/neon/...`
- generic `CostEntry` columns for Neon-only metrics
- calling Telegram from an adapter

---

## Route map (v1)

| Route | Feature |
|-------|---------|
| `/` | projects board (home) |
| `/login` | auth (shared) |
| `/projects` | redirect → `/` (query preserved) |
| `/projects/[slug]` | projects |
| `/providers` | providers |
| `/providers/[key]` | providers |
| `/settings` | settings / mapping / accounts |
| `/api/cron/sync` | generic scheduler |
| `/api/usage/*` | read models (ported from Neon, then generalized) |
| `/api/auth/*` | login/logout |

---

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/migrate-from-neon.ts` | Read-only old Neon history → CostOps (`pnpm migrate:from-neon`, dry-run default) |
| `scripts/backfill.ts` | Date-range backfill via adapters |
| `scripts/reconcile.ts` | Compare provider API vs stored rows |

---

## Alias

`@/` → `src/`. `@/features/<name>` is the public barrel.
