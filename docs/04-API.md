# API — Neetrino CostOps

Internal JSON API. No public versioning in v1. All routes except login, cron, and health require a dashboard session when `DASHBOARD_PASSWORD` is set.

Validate query/body with Zod. Never return secrets.

---

## Auth and cron

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/auth/login` | public | Set session cookie |
| POST | `/api/auth/logout` | session | Clear cookie |
| GET | `/api/health` | public | Liveness, no heavy DB |
| GET | `/api/cron/sync` | `CRON_SECRET` | Run due provider accounts |
| GET | `/api/cron/reconcile-yesterday` | `CRON_SECRET` | Finalize previous UTC day |

Cron checks `Authorization: Bearer <CRON_SECRET>` (same as Neon).

---

## Reads (dashboard)

Generalize Neon `/api/usage/*`. Keep response fields stable enough to port UI, then add provider/project dimensions.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/overview` | Today + period totals, breakdowns, health, near-limit |
| GET | `/api/projects` | Project list rows |
| GET | `/api/projects/[slug]` | Project detail + provider breakdown |
| GET | `/api/providers` | Provider cards |
| GET | `/api/providers/[key]` | Provider board (Neon board first) |
| GET | `/api/usage/series` | Time series (metric, groupBy day/week/month) |
| GET | `/api/usage/totals` | Aggregates for a range + filters |
| GET | `/api/sync/status` | Recent SyncRuns + account freshness |
| GET | `/api/resources/unmapped` | Discovered resources without `projectId` |
| GET | `/api/alerts` | Alert events for a date range |

### Shared query

```text
from=YYYY-MM-DD
to=YYYY-MM-DD
preset=current_month|previous_month|1|7|30|60|custom
groupBy=day|week|month
projectId?
providerKey?
```

Dates are **UTC** calendar days. Reject `from > to`. Cap range (recommend 400 days) to protect the DB.

Every cost payload includes:

```ts
type Freshness = "fresh" | "partial" | "final" | "stale" | "error" | "missing";

type CostView = {
  costUsd: number;
  sourceType: "API" | "ESTIMATED" | "FIXED" | "MANUAL";
  sourceStatus: Freshness;
  isPartial: boolean;
  lastSuccessfulSyncAt: string | null;
};
```

Do not emit `0` when status is `missing` or `error` without also sending that status.

---

## Writes

| Method | Path | Purpose |
|--------|------|---------|
| PATCH | `/api/projects/[slug]` | Rename / archive |
| POST | `/api/projects` | Create project |
| PATCH | `/api/project-providers/[id]/budget` | Daily limit + escalation % |
| PATCH | `/api/budget-rules/[id]` | Optional aggregate rules |
| POST | `/api/budget-rules` | Create optional scope rule |
| PATCH | `/api/resources/[id]/mapping` | Assign or unassign Project |
| POST | `/api/sync/now` | Manual sync (rate limited) |
| POST | `/api/sync/backfill` | Range backfill for one account |

Inline budget PATCH must stay as small as Neon `spend-alert` (limit + escalation only).

---

## Errors

```ts
{ "error": { "code": "VALIDATION_ERROR", "message": "from must be <= to" } }
```

| HTTP | When |
|------|------|
| 400 | Zod failure |
| 401 | Missing session / bad cron secret |
| 404 | Unknown slug/id |
| 409 | Unique conflict (duplicate mapping) |
| 429 | Login or sync-now limit |
| 500 | Unexpected; log details server-side only |

---

## Neon compatibility (Phase 1)

Until the UI is fully generalized, CostOps may expose Neon-shaped aliases:

- `/api/usage/projects`
- `/api/usage/project-totals`
- `/api/usage/series`
- `/api/usage/projects/[id]/spend-alert`

Those aliases must read the generic model (Project + Resource + MetricEntry + BudgetRule), not a `NeonProject` table.
