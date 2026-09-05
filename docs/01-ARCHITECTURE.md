# Architecture — Neetrino CostOps

Internal FinOps platform: pull provider usage/cost, normalize it, map it to Neetrino projects, store history, and evaluate Telegram alerts.

**Project size.** B  
**Last updated.** 2026-09-05

---

## Purpose

Answer two questions without depending on provider-side alerts:

1. How much does a **business project** cost, and which providers drive it?
2. How much does a **provider** cost across all projects?

Primary budget object: **Project × Provider**.

---

## Users

- **Operator.** Views overview, projects, provider boards; edits daily limits; maps resources; runs manual sync/backfill.
- **System.** Vercel Cron runs due provider accounts, upserts data, evaluates budgets.

---

## High-level flow

```
Provider APIs / fixed costs / manual import
                 │
                 ▼
        Provider adapters   (src/providers/<key>)
                 │
                 ▼
        Normalization        (src/core/cost, src/core/metrics)
                 │
                 ▼
          PostgreSQL
             │       │
             ▼       ▼
        Dashboard   Alert engine → Telegram
```

Style: **modular monolith** on Next.js. One deployable. Adapters are plugins, not microservices.

---

## Components

| Component | Tech | Location | Role |
|-----------|------|----------|------|
| Web UI | Next.js 16 App Router, React 19, Tailwind 4, Recharts | `src/app`, `src/features` | Overview, projects, provider boards, settings |
| API | Route Handlers + Zod | `src/app/api` | Reads aggregates, mutations for budgets/mapping, cron |
| Core | TypeScript modules | `src/core` | Cost, metrics, sync orchestration, budgets, alerts, mapping |
| Adapters | Per-provider packages | `src/providers/<key>` | API clients, schemas, metric maps, cost source type |
| Notifications | Telegram Bot API | `src/notifications/telegram` | First implementation of `NotificationChannel` |
| Database | PostgreSQL 17 + Prisma 7 | `prisma/` | Source of truth for history |

No Redis, queues, or separate API process in v1. Scheduler may move to a worker later without rewriting adapters.

---

## Folder layout

```
src/
  app/                         # routes + Route Handlers
  features/
    overview/
    projects/
    providers/
    budgets/
    alerts/
    settings/
    integrations/
  core/
    cost/
    metrics/
    sync/
    budgets/
    alerts/
    mapping/
  providers/
    registry.ts
    neon/
    vercel/
    upstash/
    gcp/
    hetzner/
  notifications/
    telegram/
  shared/
  config/
prisma/
docs/
```

### Boundaries

- `features/*` public API is `index.ts`. No deep imports across features.
- `shared` must not import `features` or `providers`.
- `core` must not import feature UI or provider HTTP clients.
- `providers/<key>` may use `core` types and Prisma through `core`/`db` helpers. They must not call Telegram or budget evaluation directly.
- Sync orchestration (`core/sync`) calls adapters, writes normalized rows, then calls `core/alerts`.

---

## Data flows

### Sync

```
1. Cron / manual → Scheduler
2. Find enabled ProviderAccounts due for sync
3. Adapter.syncResources + fetchCosts/fetchMetrics
4. Validate with Zod
5. Upsert Resource / CostEntry / MetricEntry (idempotent)
6. Record SyncRun
7. Recalculate affected current-day scopes
8. Evaluate BudgetRules → Telegram if needed
```

### Dashboard read

```
1. Operator → page (RSC) or /api/*
2. Zod-validate range / filters
3. Aggregate CostEntry + MetricEntry for UTC range
4. Attach freshness from SyncRun + sourceStatus
5. Return view models (project / provider / overview)
```

### Auth

```
Optional DASHBOARD_PASSWORD
  → login sets httpOnly JWT cookie
  → middleware allows /login, /api/cron/*, health
  → all other UI/API require a valid session when password is set
```

---

## Core entities

| Entity | Meaning |
|--------|---------|
| Project | Neetrino business project (Degusto, Mobee, …) |
| Provider | NEON, VERCEL, … |
| ProviderAccount | Connected org/team + credential ref, optional expiry, sync settings |
| ProjectProvider | Degusto × Neon — main daily budget target |
| Resource | External object; `projectId` null = unmapped |
| CostEntry | Normalized USD cost for a UTC day (+ dimension) |
| MetricEntry | Provider-specific usage point |
| BudgetRule | Limit + escalation for a scope |
| AlertEvent | First breach + escalation anchor per rule/day |
| CredentialAlert | Token expiry / auth-failure dedupe per account |
| SyncRun | Operational audit row |

See [DATA_MODEL.md](./DATA_MODEL.md) and [05-DATABASE.md](./05-DATABASE.md).

---

## Integrations

| Service | Role | Notes |
|---------|------|-------|
| Neon Console API | First adapter | Copy/port `neetrino/neon` client + schemas |
| Vercel API | Second adapter | Verify live billing API before coding |
| Telegram Bot API | Alerts | Reuse HTML formatter concepts |
| PostgreSQL (Neon) | Store | Dedicated DB |
| Vercel Cron | Scheduler | Daily finalize + hourly due-accounts |

---

## Security

- Provider keys, Telegram token, DB URLs: server-only env
- Cron: `Authorization: Bearer CRON_SECRET`
- Dashboard: password session when configured (required in production)
- Structured logs without secrets
- v1 credentials: same env names as Neon (`NEON_API_KEY`, `NEON_ORG_ID`). ADR-003
- Token expiry and 401 alerts: [CREDENTIAL_ROTATION.md](./CREDENTIAL_ROTATION.md)

---

## Deploy

| Environment | Role |
|-------------|------|
| Local | `localhost:3000` + local/dev Neon branch |
| Production | Vercel + production Neon branch |

Order: exact commit → build → one `prisma migrate deploy` job → promote app. Local machines never migrate production.

---

## Key decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Size | B | Adapter + multi-screen product, one team |
| App | Next.js fullstack | Reuse Neon, Vercel Cron |
| Auth | Password JWT | Reuse Neon, single org |
| Currency / TZ | USD / UTC | Match Neon v1 |
| Alerts | Internal engine | Providers only supply data |

---

## Related docs

- [TECH_CARD.md](./TECH_CARD.md)
- [02-TECH_STACK.md](./02-TECH_STACK.md)
- [03-STRUCTURE.md](./03-STRUCTURE.md)
- [04-API.md](./04-API.md)
- [05-DATABASE.md](./05-DATABASE.md)
- [PROVIDER_ADAPTER_CONTRACT.md](./PROVIDER_ADAPTER_CONTRACT.md)
- [ALERT_RULES.md](./ALERT_RULES.md)
- [DECISIONS.md](./DECISIONS.md)

**Document version.** 1.0 · **Date.** 2026-09-05
