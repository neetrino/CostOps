# Neetrino CostOps

> **AI / Cursor Technical Specification**  
> **Purpose:** build a multi-provider internal FinOps platform for Neetrino by reusing and generalizing the existing Neon Usage Analytics project.  
> **Primary implementation environment:** Cursor AI.  
> **Language of code, comments, commits, schemas, and technical docs:** English.  
> **Specification language:** Russian.

---

## 0. ОБЯЗАТЕЛЬНО ПРОЧИТАТЬ ПЕРЕД ЛЮБЫМ КОДОМ

### 0.1. Existing reference project — source of truth

**Repository:** https://github.com/neetrino/neon  
**Current deployed reference:** https://neon-neetrino.vercel.app  
**Repository visibility:** private; executor is expected to have access through the Neetrino GitHub organization.

### 0.2. Что представляет собой `neetrino/neon`

`neetrino/neon` — уже работающий production-like внутренний dashboard для контроля потребления и оценочной стоимости Neon по проектам.

Он уже реализует ключевые механики, которые должны быть сохранены в новом CostOps:

- регулярный daily и intraday sync данных Neon;
- получение usage через Neon API;
- хранение исторических snapshots в PostgreSQL;
- Prisma schema и migrations;
- idempotent upsert без дублей за одну дату;
- reconciliation / backfill исторических данных;
- dashboard с аналитикой и графиками;
- фильтры по датам и периодам;
- Current month / Previous month / 1 / 7 / 30 / 60 days / custom range;
- project comparison;
- usage over time;
- Cards / List presentation;
- search / filtering;
- provider-specific usage metrics;
- estimated cost calculation;
- индивидуальный дневной spend limit для каждого проекта;
- индивидуальный escalation percentage;
- Telegram Bot alerts;
- first breach alert;
- повторные escalation alerts без спама;
- хранение `lastNotifiedSpendUsd` для dedupe/escalation;
- SyncRun / error tracking / retries;
- защищённый dashboard / auth;
- Vercel Cron infrastructure;
- logging.

### 0.3. Что именно смотреть в старом репозитории

Перед реализацией нового проекта AI обязан изучить минимум следующие участки `neetrino/neon`:

```text
README.md

docs/
  01-ARCHITECTURE.md
  TECH_CARD.md
  project.md

prisma/
  schema.prisma

components/dashboard/
  UsageDashboard.tsx
  UsageKpiStrip.tsx
  UsageLineChartPanel.tsx
  ProjectCompareBars.tsx
  ProjectTable.tsx
  ProjectTableCards.tsx
  ProjectTableList.tsx
  ProjectSpendAlertField.tsx
  DashboardFilterSidebar.tsx

lib/neon/
  client.ts
  fetch-consumption-v2.ts
  list-projects.ts
  schemas.ts

lib/sync/
  run-intraday-sync.ts
  run-usage-sync.ts
  sync-usage-day.ts
  sync-usage-intraday-today.ts
  retry.ts
  map-metrics.ts

lib/alerts/
  evaluate-spend-alerts.ts
  format-spend-alert-message.ts

lib/telegram/
  send-telegram-message.ts

lib/usage/
  [all aggregation / cost calculation logic]

lib/auth/
lib/env.ts
lib/db.ts
lib/logger.ts
```

The exact repository structure may evolve. If files have moved, Cursor must locate their current equivalents instead of assuming they are missing.

### 0.4. Existing code is a functional baseline, not a throwaway prototype

The new project **must not regress** compared with the current Neon dashboard.

The old application is the baseline for:

1. UX patterns;
2. historical analytics;
3. date filters;
4. chart behavior;
5. intraday synchronization;
6. threshold editing;
7. Telegram alert behavior;
8. dedupe/escalation behavior;
9. backfill/reconciliation;
10. operational reliability.

The task is **not** to recreate a simpler dashboard from scratch. The task is to extract what already works, generalize it and expand it to multiple infrastructure providers.

### 0.5. Mandatory Cursor workflow before coding

Before touching implementation, Cursor AI must:

1. Read this specification completely.
2. Inspect the existing `neetrino/neon` repository.
3. Produce `docs/EXISTING_NEON_AUDIT.md` with:
   - existing architecture;
   - reusable modules;
   - Neon-specific modules;
   - code that can be copied with minimal change;
   - code that must be generalized;
   - code that should not be reused.
4. Produce `docs/MIGRATION_MAP.md` mapping old entities/files to the new architecture.
5. Produce `docs/TECH_CARD.md` for CostOps.
6. Produce `docs/IMPLEMENTATION_PLAN.md` split into phases.
7. Produce `docs/PROGRESS.md` and update it during development.
8. Present architecture and migration plan for approval **before large-scale coding**.

Do not modify or destabilize `neetrino/neon` while CostOps is being built.

---

# 1. PRODUCT VISION

Create a single internal Neetrino platform that continuously collects infrastructure cost/usage data from multiple providers, stores its own history, maps external resources to Neetrino business projects, aggregates total project cost and provider cost, and sends Telegram alerts based on Neetrino-defined budget rules.

Working name:

```text
Neetrino CostOps
```

Possible repository:

```text
https://github.com/neetrino/costops
```

The final repository name can be changed later without affecting architecture.

---

# 2. CORE BUSINESS CONCEPT

The central business object is a **Neetrino Project**.

Examples:

```text
Degusto
Mobee
NBOS
Ommm
Grill
Marco
Ilona
...
```

Each project may use multiple infrastructure providers:

```text
Degusto
├── Neon
├── Vercel
├── Upstash
├── Google Cloud
├── Cloudflare R2
└── future providers
```

For every provider used by a project, CostOps must know:

- today's cost;
- selected-period cost;
- historical cost;
- data freshness;
- provider-specific usage metrics;
- configured daily budget limit;
- configured escalation percentage;
- alert state.

---

# 3. MOST IMPORTANT BUDGET RULE

The primary budget scope is:

```text
PROJECT × PROVIDER
```

Examples:

```text
Degusto / Neon       $2.00 per day
Degusto / Vercel     $1.00 per day
Degusto / Upstash    $0.50 per day
Degusto / GCP        $1.50 per day

Mobee / Neon         $3.00 per day
Mobee / Vercel       $8.00 per day

NBOS / Neon          $10.00 per day
NBOS / Vercel        $5.00 per day
```

There must be **no assumption that all projects have the same normal daily spend**.

Every Project × Provider pair must be independently configurable.

This is the most important budget/alert level in v1.

---

# 4. ADDITIONAL BUDGET LEVELS

Besides the mandatory Project × Provider budget, CostOps must support optional aggregate limits.

| Scope | Required | Example | Meaning |
|---|---:|---|---|
| `PROJECT_PROVIDER` | Yes | Degusto / Neon > $2/day | Main alert level |
| `PROJECT_TOTAL` | Optional | Degusto total > $5/day | Entire project across all providers |
| `PROVIDER_TOTAL` | Optional | All Vercel > $30/day | Entire provider across all projects |
| `GLOBAL_TOTAL` | Optional | All infrastructure > $80/day | Company-wide total |
| `RESOURCE` | Future | One specific DB/service | Reserved for later |

Important:

- Project total budget must **not replace** Project × Provider budgets.
- Global budget must **not be required** for the product to be useful.
- Provider total and global total are secondary safety controls.

---

# 5. EXAMPLE: DEGUSTO

Example state for one day:

```text
Degusto

Neon
Current spend:       $1.42
Daily limit:         $2.00
Usage:               71%

Vercel
Current spend:       $0.81
Daily limit:         $1.00
Usage:               81%

Upstash
Current spend:       $0.18
Daily limit:         $0.50
Usage:               36%

Google Cloud
Current spend:       $1.07
Daily limit:         $1.50
Usage:               71%

--------------------------------
Project total:       $3.48
Project daily limit: $5.00 (optional)
```

The user must be able to open Degusto and immediately see where the money is being spent.

---

# 6. DATA ACQUISITION MODEL — PULL, NOT PROVIDER ALERTS

CostOps owns the alerting logic.

The normal flow is:

```text
Provider API
    ↓
CostOps Scheduler
    ↓
Provider Adapter
    ↓
Normalize data
    ↓
Upsert into CostOps DB
    ↓
Recalculate current-day aggregates
    ↓
Evaluate BudgetRules
    ↓
Telegram if needed
```

Do **not** depend on Vercel Spend Management webhooks, Neon alerts or provider-side notification rules for the core product.

Provider webhooks may be added later as an optimization, but they are not the source of truth for CostOps alerting.

---

# 7. SYNC FREQUENCY

Sync cadence must be configurable per provider/account.

Examples:

```text
Neon          hourly if current-day data is available
Vercel        hourly or according to actual billing API freshness
Upstash       provider-specific
Google Cloud  provider-specific
Hetzner       daily may be enough for fixed costs
```

Do not call an API 50 times per day if the provider only refreshes billing data every several hours.

Each adapter must explicitly describe:

```ts
supportsIntraday: boolean;
supportsBackfill: boolean;
recommendedSyncIntervalMinutes?: number;
```

The scheduler may run frequently, but the adapter must respect provider rate limits and data freshness.

---

# 8. DATA FRESHNESS IS PART OF THE PRODUCT

Never silently convert missing or stale data into `$0`.

Every cost aggregate must expose a freshness state such as:

```text
fresh
partial
final
stale
error
missing
```

Example UI:

```text
Vercel · updated 18 min ago · partial current day
Neon · updated 4 min ago · partial current day
Upstash · stale · last successful sync 3h ago
```

The user must understand whether today's number is reliable and current.

---

# 9. PROVIDERS

Initial roadmap:

## P0 — Neon

First adapter and migration target.

Requirements:

- preserve existing Neon API behavior;
- preserve current usage metrics;
- preserve historical snapshots;
- preserve estimated cost calculation where applicable;
- preserve intraday sync;
- preserve current alert behavior;
- preserve backfill/reconciliation.

## P0 — Vercel

Collect cost/usage by Vercel project and relevant billing/service dimensions.

Requirements:

- map Vercel projects to Neetrino Projects;
- support selected-period history;
- support current-day cost if API freshness permits;
- expose provider-specific Vercel metrics;
- build a Vercel provider board;
- support Project × Vercel budgets.

Cursor must verify the current Vercel Billing API and its current response format before implementation. Do not hard-code assumptions based solely on outdated docs.

## P0/P1 — Upstash

Collect cost/usage for Redis or other actually used Upstash products where billing APIs allow it.

If direct cost is not available, adapter may calculate estimated cost from authoritative usage/pricing only if that calculation is explicitly documented and marked as estimated.

## P1 — Google Cloud

Collect cost/usage by mapped GCP projects/services.

## P1 — Hetzner

Support actual recurring server costs. If detailed daily API billing is unavailable or unnecessary, use normalized fixed recurring costs.

## P2 — Resend

Add when material costs or relevant usage analytics justify it.

## P2 — Cloudflare / R2 / other providers

Add through separate adapters as costs become relevant.

---

# 10. EXTENSIBILITY REQUIREMENT

Adding a provider must **not** require rewriting the alert engine, project dashboard or budget model.

Provider-specific code belongs inside:

```text
src/providers/<provider>/
```

Core must operate on normalized entities.

Recommended interface:

```ts
interface CostProviderAdapter {
  providerKey: string;

  supportsIntraday: boolean;
  supportsBackfill: boolean;
  recommendedSyncIntervalMinutes?: number;

  syncResources(ctx: ProviderContext): Promise<ResourceSyncResult>;

  fetchCosts(
    ctx: ProviderContext,
    range: DateRange,
  ): Promise<NormalizedCost[]>;

  fetchMetrics?(
    ctx: ProviderContext,
    range: DateRange,
  ): Promise<NormalizedMetric[]>;
}
```

The exact TypeScript types can evolve during architecture phase, but the separation of responsibilities is mandatory.

---

# 11. THREE TYPES OF COST SOURCES

Future providers may expose billing differently. CostOps should support:

```text
1. API-based cost
2. Fixed recurring cost
3. Manual/imported cost
```

Examples:

```text
Vercel     → API-based
Neon       → API / calculated estimated cost
Hetzner    → fixed recurring may be acceptable
Unknown SaaS → manual/import until API exists
```

All three must normalize into the same cost model for project totals.

---

# 12. DOMAIN MODEL

Do not create separate core entities like:

```text
NeonProject
VercelProject
UpstashProject
```

These names may exist inside provider adapters, but not as the main business data model.

Recommended core entities:

## Project

Business/client/internal project.

```text
Degusto
Mobee
NBOS
```

## Provider

```text
NEON
VERCEL
UPSTASH
GCP
HETZNER
RESEND
CLOUDFLARE
...
```

## ProviderAccount

Represents a connected provider organization/account/team.

Fields conceptually include:

```text
id
providerId
name
externalAccountId
sync settings
status
lastSuccessfulSyncAt
credentials reference / encrypted config
```

## ProjectProvider

The most important relation for budget logic.

Represents:

```text
Degusto × Neon
Degusto × Vercel
Mobee × Neon
...
```

This is the main daily budget aggregation object.

## Resource

Concrete external object:

```text
Neon project/database
Vercel project
Upstash database
GCP project/service
server
bucket
etc.
```

One ProjectProvider may own multiple resources.

## CostEntry

Normalized cost record.

Minimum conceptual fields:

```text
id
projectId
projectProviderId
providerId
providerAccountId
resourceId? 
startAt / date bucket
endAt?
costUsd
currency
sourceType
sourceStatus
isPartial
sourceRecordId?
metadata?
createdAt
updatedAt
```

## MetricEntry

Provider-specific usage metric.

Conceptual fields:

```text
id
projectId
projectProviderId
providerId
resourceId?
date/time bucket
metricKey
value
unit
metadata?
```

Examples:

```text
NEON
compute_unit_hours
storage_gb
network_transfer_gb

VERCEL
fluid_compute
fast_data_transfer
image_transformations
function_invocations
...
```

## BudgetRule

Fields conceptually include:

```text
id
scope
projectId?
projectProviderId?
providerId?
period = DAILY initially
limitUsd
escalationPercent
enabled
createdAt
updatedAt
```

## AlertEvent

Stores alert history and dedupe anchor.

Conceptually:

```text
id
budgetRuleId
date
firstBreachCostUsd
lastNotifiedCostUsd
lastNotifiedAt
notificationChannel
status
```

## SyncRun

```text
id
providerAccountId
providerId
startedAt
finishedAt
status
rangeFrom
rangeTo
rowsRead
rowsWritten
errorMessage?
```

---

# 13. DATABASE DESIGN PRINCIPLES

Mandatory principles:

1. PostgreSQL.
2. Prisma unless architecture review identifies a strong reason to change.
3. Idempotent sync.
4. Unique external provider identities.
5. No duplicated rows when the same day is synchronized repeatedly.
6. Historical data survives provider retention changes.
7. Current-day data may be repeatedly updated.
8. Finalized historical days may be reconciled later if provider billing is corrected.
9. Provider-specific metrics must not force provider-specific columns into the generic `CostEntry` table.
10. JSON metadata can be used for non-critical provider details, but core query fields must remain normalized/indexed.

---

# 14. FOCUS-INSPIRED NORMALIZATION

Use a FOCUS-compatible / FOCUS-inspired mental model for normalized cost fields where practical, especially for providers that already expose FOCUS-like billing data.

Do not make strict FOCUS compliance a blocker for providers like Neon or Upstash.

The goal is consistent internal cost semantics, not specification bureaucracy.

---

# 15. ALERT ENGINE

The alert engine is internal to CostOps.

It must evaluate after successful syncs affecting the current day.

## 15.1. First breach

Example:

```text
Degusto / Neon limit = $2.00/day
Current cost = $2.01
```

Send Telegram alert.

## 15.2. Escalation behavior

Preserve the current Neon logic.

Example:

```text
Limit:             $2.00
Escalation:        30%
Escalation step:   $0.60

First alert:       $2.01
Next alert:        around $2.61
Next alert:        around $3.21
```

Do not resend the same breach on every hourly sync.

## 15.3. Dedupe

Per budget rule and budget day, store the last notified spend anchor.

Conceptually:

```text
unique(budgetRuleId, budgetDate)
```

A new calendar budget day creates a new logical alert state.

## 15.4. Alert scopes

Evaluate enabled rules for:

```text
PROJECT_PROVIDER
PROJECT_TOTAL
PROVIDER_TOTAL
GLOBAL_TOTAL
```

## 15.5. Data confidence rule

Do not send misleading alerts based on clearly invalid/missing data.

If a provider returns an error or incomplete malformed response:

- record sync failure;
- show stale/error state;
- keep previous known cost distinct from current unknown cost;
- do not silently recalculate the provider to zero.

---

# 16. TELEGRAM

Keep direct Telegram Bot API integration unless there is a strong future reason to add a notification abstraction.

Do not introduce Apprise/Grafana merely for notifications in v1.

Recommended future-ready abstraction:

```ts
interface NotificationChannel {
  send(message: NotificationMessage): Promise<void>;
}
```

First implementation:

```text
TelegramNotificationChannel
```

But avoid unnecessary framework complexity in MVP.

---

# 17. TELEGRAM MESSAGE EXAMPLES

## Project × Provider alert

```text
COST ALERT

Project: Degusto
Provider: Vercel
Today: $1.08
Daily limit: $1.00
Usage: 108%

Last sync: 14:05 UTC
Status: partial current day
```

## Escalation

```text
COST ESCALATION

Project: Degusto
Provider: Neon
Today: $2.67
Daily limit: $2.00
Previous alert: $2.01
Escalation step: $0.60
```

## Project total

```text
PROJECT COST ALERT

Project: Degusto
Today total: $5.42
Project limit: $5.00

Neon      $2.18
Vercel    $1.34
GCP       $1.42
Upstash   $0.48
```

## Provider total

```text
PROVIDER COST ALERT

Provider: Vercel
Today total: $31.20
Provider limit: $30.00

Top projects:
1. Mobee      $8.60
2. Degusto    $5.20
3. NBOS       $4.90
```

---

# 18. DASHBOARD — PRESERVE CURRENT NEON STRENGTHS

The current Neon UI is the visual/interaction baseline.

Must preserve or improve:

```text
Current month
Previous month
1 day
7 days
30 days
60 days
Custom range
Date From / To
Daily / weekly / monthly grouping
Charts
Project comparison
Usage over time
Cards / List
Search
Historical analytics
Refresh / sync awareness
Inline budget editing or similarly fast budget management
```

Do not replace this with a simplistic admin table.

---

# 19. MAIN SCREENS

## 19.1. Overview

Purpose: global FinOps overview.

Show:

- total cost today;
- total cost for selected period;
- provider breakdown;
- project breakdown;
- cost over time;
- highest-spending projects;
- projects closest to limits;
- providers closest to limits;
- active alerts;
- stale/error provider accounts;
- last successful sync status.

Example:

```text
Today total      $42.83
Selected period  $311.48

Vercel   $15.22
Neon     $11.40
GCP       $9.77
Upstash   $3.14
Hetzner   $3.30
```

## 19.2. Projects

Show all business projects.

Each card/list item should include:

- project name;
- today total;
- selected-period total;
- optional project budget;
- project budget usage percentage if configured;
- provider breakdown preview;
- warning state;
- last freshness status.

## 19.3. Project Detail

Example route concept:

```text
/projects/degusto
```

Show:

```text
Degusto

Today total
Period total
Optional project budget
Cost over time

Providers:
Neon
Vercel
Upstash
GCP
...
```

For each ProjectProvider:

- today's cost;
- selected-period cost;
- daily limit;
- escalation %;
- limit usage %;
- last sync;
- data status;
- provider-specific metrics;
- expandable resource breakdown.

## 19.4. Providers

Provider overview page:

```text
/providers
```

Show provider cards:

```text
Neon
Vercel
Upstash
Google Cloud
Hetzner
...
```

## 19.5. Provider Detail Board

Examples:

```text
/providers/neon
/providers/vercel
/providers/upstash
```

This screen must behave like a provider-specific analytics board.

For Neon, it should closely reproduce the useful parts of the existing `neetrino/neon` experience.

Show:

- all Neetrino projects using provider;
- today's provider total;
- selected-period provider total;
- optional provider-wide daily limit;
- cost comparison by project;
- cost over time;
- provider-specific usage metrics;
- Project × Provider daily budgets;
- last sync state.

---

# 20. PROJECT MAPPING

External provider resources must map to internal Neetrino Projects.

Example:

```text
Project: Degusto

Neon resource
externalId: orange-star-39250135

Vercel resource
externalId: prj_xxxxx

Upstash resource
externalId: redis_xxxxx
```

Do not rely only on matching resource names because provider names may differ.

Mapping should be persisted explicitly.

Admin workflow must support assigning discovered external resources to a Project.

Future enhancement may suggest mappings automatically by name, repo, domain or tags, but manual confirmation remains authoritative.

---

# 21. DISCOVERED / UNMAPPED RESOURCES

New provider resources may appear after a new project is created externally.

CostOps must not ignore them silently.

Introduce an "Unmapped resources" state/page.

Example:

```text
Vercel / new-storefront
Detected: 2026-09-05
Cost today: $0.34
Project mapping: NOT ASSIGNED
```

User should be able to assign it to an existing Project or create a new Project.

Unmapped spend must also be visible in provider/global totals so money does not disappear from analytics.

---

# 22. HISTORY

CostOps owns its historical database.

Requirements:

- daily history;
- selected-period queries;
- previous month;
- arbitrary custom date ranges;
- daily / weekly / monthly aggregation;
- historical project comparison;
- historical provider comparison;
- backfill;
- reconciliation;
- retention not dependent on provider API retention.

Do not discard raw enough data needed to reconstruct historical aggregates.

---

# 23. CURRENT DAY VS FINALIZED DAYS

Current-day cost is often partial.

Recommended concept:

```text
2026-09-05 → partial
2026-09-04 → finalized
```

At/after day close, run a final/reconciliation sync for previous day.

If providers later adjust costs, reconciliation may update historical data while preserving sync audit history.

---

# 24. TIMEZONE

Canonical storage:

```text
UTC
```

Budget day v1:

```text
UTC
```

Reason: match current Neon behavior and avoid ambiguity across providers.

Architecture should allow a configurable budget timezone later.

---

# 25. REUSE FROM `neetrino/neon`

## Reuse strongly

- design language;
- dashboard layout patterns;
- period filters;
- chart components where generic enough;
- card/list switch;
- project comparison chart patterns;
- usage-over-time chart patterns;
- auth patterns;
- date utilities;
- Prisma setup patterns;
- logger;
- retry logic;
- cron route protection patterns;
- Telegram sender;
- spend alert format concepts;
- first breach logic;
- escalation logic;
- dedupe anchor logic;
- sync run tracking;
- reconciliation/backfill patterns.

## Generalize

- `NeonProject` → generic `Project` + `ProjectProvider` + `Resource`;
- Neon-only `UsageSnapshot` → generic `CostEntry` + `MetricEntry`;
- Neon threshold fields → generic `BudgetRule`;
- Neon alert event → generic `AlertEvent`;
- Neon sync modules → provider adapter + generic sync orchestration;
- Neon-specific dashboard data types → generic project/provider view models.

## Keep provider-specific

- Neon API client;
- Neon response schemas;
- Neon metric mapping;
- Neon cost estimation formula if still needed;
- Neon pricing-plan logic;
- Neon-specific provider metrics.

---

# 26. IMPORTANT MIGRATION RULE

Do not delete the old Neon application until parity is proven.

Migration sequence:

```text
Old Neon stays live
        ↓
Build CostOps core
        ↓
Implement Neon adapter
        ↓
Migrate/backfill Neon history
        ↓
Run both systems in parallel
        ↓
Compare totals, charts and alerts
        ↓
Minimum 7-day parity observation
        ↓
Cut over
        ↓
Archive old Neon app
```

---

# 27. NEON MIGRATION

Cursor must design a migration/backfill script for existing data.

Old conceptual models include:

```text
NeonProject
UsageSnapshot
SpendAlertSent
SyncRun
```

Map them into:

```text
Project
Provider = NEON
ProviderAccount
ProjectProvider
Resource
CostEntry
MetricEntry
BudgetRule
AlertEvent
SyncRun
```

Preserve where possible:

- historical snapshot dates;
- project names;
- Neon external project IDs;
- existing per-project daily threshold;
- existing escalation percentage;
- historical usage metrics;
- historical cost estimates;
- alert history if migration is practical.

If some historical alert event fields cannot be cleanly migrated, document the limitation rather than inventing data.

---

# 28. NEON PARITY ACCEPTANCE TEST

Before old Neon can be retired:

With provider filter `Neon`, CostOps must match the old application for the same date range in:

- project list;
- project names;
- usage totals;
- cost totals within expected formula precision;
- date filters;
- charts;
- historical ranges;
- current month;
- previous month;
- custom range;
- project thresholds;
- escalation settings;
- Telegram first breach behavior;
- Telegram escalation behavior;
- sync status;
- backfill/reconciliation results.

Any intentional difference must be documented.

---

# 29. TECH STACK

Recommended initial stack: preserve the current project's technology choices to maximize reuse.

```text
Next.js App Router
React
TypeScript strict
PostgreSQL
Prisma
Tailwind CSS
Recharts
Pino / structured logging
Telegram Bot API
Vercel deployment initially
Vercel Cron initially where appropriate
```

Do not add these to MVP without a concrete need:

```text
Grafana
OpenCost
Apprise
Kafka
RabbitMQ
Kubernetes
large microservice decomposition
```

This is an internal cost-control platform, not a distributed-systems demonstration.

---

# 30. ARCHITECTURE SHAPE

Recommended high-level architecture:

```text
Provider APIs / Fixed Costs / Manual Imports
                 │
                 ▼
        Provider Adapters
                 │
                 ▼
        Normalization Layer
                 │
                 ▼
          PostgreSQL Store
             │       │
             │       └──────────────┐
             ▼                      ▼
         Dashboard              Alert Engine
                                    │
                                    ▼
                                 Telegram
```

Recommended module direction:

```text
src/
  app/

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
    neon/
    vercel/
    upstash/
    gcp/
    hetzner/

  notifications/
    telegram/

  db/

  shared/
```

Exact paths may differ if Cursor proposes a better coherent structure, but provider/core separation is non-negotiable.

---

# 31. SCHEDULER DESIGN

Need generic orchestration, not one hardcoded cron route per provider forever.

Conceptually:

```text
Scheduler
  ↓
find enabled ProviderAccounts due for sync
  ↓
run adapter sync
  ↓
record SyncRun
  ↓
upsert cost + metrics
  ↓
recalculate affected scopes
  ↓
evaluate alerts
```

For v1 on Vercel, simple scheduled routes are acceptable.

Architecture should allow moving the scheduler to a worker later without rewriting provider adapters.

---

# 32. IDEMPOTENCY

Repeated sync of the same provider/date/range must not create duplicate financial data.

Use stable provider keys where available.

Otherwise derive deterministic uniqueness from:

```text
provider
providerAccount
external resource
billing bucket/date
cost dimension/service
source record identity
```

Cursor must define exact unique constraints during Phase 0 and document them.

---

# 33. RECONCILIATION

Billing providers may update previous-day costs later.

Implement reconciliation strategy:

- regular current-day sync;
- final sync for previous day;
- optional rolling reconciliation for last N days;
- manual backfill by date range;
- idempotent updates.

Do not assume first observed value is final invoice truth.

---

# 34. ESTIMATED VS ACTUAL COST

Cost may be:

```text
ACTUAL
ESTIMATED
FIXED
MANUAL
```

Store this status.

UI must not present estimated cost as exact invoiced cost without indication.

Example:

```text
Estimated today: $2.81
```

This is especially relevant when provider usage must be converted through a pricing formula.

---

# 35. CURRENCY

Internal reporting currency v1:

```text
USD
```

If a provider bills in another currency:

- store original currency/amount when useful;
- normalize reporting amount to USD;
- document exchange-rate source/time if conversion is required.

Do not silently mix currencies.

---

# 36. SECURITY

Mandatory:

- provider API credentials server-side only;
- Telegram token server-side only;
- DB credentials server-side only;
- no secrets in Git;
- no secrets in client bundle;
- protected dashboard;
- protected internal sync routes;
- structured logs without tokens;
- `.env.example` contains names only, no real secrets;
- provider credentials in DB only if encrypted;
- env/secret manager is acceptable initially.

Single-organization internal auth is acceptable for v1.

---

# 37. SETTINGS / ADMIN

Need internal settings for:

- Projects;
- ProviderAccounts;
- resource mapping;
- enable/disable providers;
- sync frequency where configurable;
- Project × Provider daily budgets;
- project total budgets;
- provider total budgets;
- global total budget;
- escalation %;
- Telegram channel settings or env-driven channel status;
- manual sync;
- backfill;
- provider connection health.

Avoid forcing normal budget edits into env variables. User should be able to update daily limits from UI, like in the current Neon dashboard.

---

# 38. BUDGET UI

ProjectProvider limit editing should remain extremely fast.

Example:

```text
Degusto / Neon
Daily alert >= $ 2.00
Escalation     30 %
[Save]
```

Recommended indicators:

```text
$0.71 / $2.00   35%
$1.84 / $2.00   92%  warning
$2.18 / $2.00  109%  exceeded
```

Do not require opening a complex settings wizard for every small budget change.

---

# 39. PROVIDER-SPECIFIC METRICS

Do not reduce the product to cost only.

The old Neon dashboard is useful because it explains *why* cost exists through usage metrics.

Examples:

## Neon

```text
CU-hours
CU-hours/day
storage average GB
network transfer
history / instant restore related metrics
other available metrics
```

## Vercel

Show metrics relevant to its current billing model, for example categories returned by the current API.

Do not invent metric names. Read actual provider API/schema at implementation time.

The provider board decides which metrics are meaningful.

---

# 40. ANALYTICS

Required v1 analytics:

- cost by project;
- cost by provider;
- cost by Project × Provider;
- cost over time;
- provider-specific usage over time;
- selected period totals;
- current month;
- previous month;
- custom date range;
- project ranking;
- provider ranking;
- daily/weekly/monthly grouping;
- budget usage %;
- threshold-exceeded state.

Future:

- anomaly detection;
- trend comparison;
- forecasting;
- month-end projection;
- month-over-month delta;
- cost per client/revenue ratio if business data is integrated later.

---

# 41. FUTURE ANOMALY DETECTION

Not required for initial cutover, but architecture should leave room for rules like:

```text
Today's ProjectProvider cost > 3× 7-day average
Today total > historical percentile
Unexpected provider spike
```

Do not block v1 on ML/anomaly logic.

---

# 42. ERRORS AND OBSERVABILITY

Every provider sync should produce a `SyncRun`.

Track:

- start time;
- end time;
- provider;
- provider account;
- date range;
- success/failure;
- rows fetched;
- rows written;
- error summary;
- retry count where useful.

Dashboard should surface provider health.

Example:

```text
Neon      OK      5 min ago
Vercel    OK      12 min ago
Upstash   ERROR   2h ago
GCP       STALE   4h ago
```

---

# 43. TESTING REQUIREMENTS

Cursor must create automated tests for core financial logic.

Minimum:

## Unit tests

- ProjectProvider aggregation;
- Project total aggregation;
- Provider total aggregation;
- Global total aggregation;
- threshold first breach;
- escalation step;
- dedupe;
- midnight/new budget day behavior;
- stale/missing data behavior;
- cost normalization;
- estimated/actual handling.

## Integration tests

- adapter normalized response → DB upsert;
- repeated sync idempotency;
- sync → alert evaluation;
- Neon migration mapping;
- budget rule updates.

## Parity tests

Where feasible, compare existing Neon calculations with new Neon adapter/core output using the same fixture data.

---

# 44. CURSOR AI CODING RULES

Cursor must follow these rules while implementing:

1. Do not perform a big-bang rewrite without audit.
2. Do not change `neetrino/neon` during initial CostOps development.
3. Do not add provider-specific columns to generic core tables unless architecturally justified.
4. Keep provider APIs behind adapters.
5. Keep budget logic provider-agnostic.
6. Keep Telegram logic independent of provider APIs.
7. Preserve current working behavior before adding enhancements.
8. Prefer reuse/refactor over rewriting proven code for cosmetic reasons.
9. Do not introduce infrastructure dependencies without necessity.
10. Use TypeScript strict.
11. Validate provider API responses at boundaries.
12. Use Zod or equivalent where current project patterns support it.
13. Never use `any` on external API boundaries without explicit justification.
14. Log errors with structured context but never secrets.
15. Add migrations; do not rely on uncontrolled schema push in production.
16. Keep every phase deployable/testable.
17. Update `docs/PROGRESS.md` after meaningful milestones.
18. Document assumptions and unknown provider API behavior.
19. When external provider docs conflict with observed API responses, record the discrepancy.
20. Ask for approval when a major architectural deviation from this spec is required.

---

# 45. CURSOR PHASE 0 — ARCHITECTURE ONLY

Before implementation, produce:

```text
docs/EXISTING_NEON_AUDIT.md
docs/MIGRATION_MAP.md
docs/TECH_CARD.md
docs/IMPLEMENTATION_PLAN.md
docs/DATA_MODEL.md
docs/PROVIDER_ADAPTER_CONTRACT.md
docs/ALERT_RULES.md
docs/PROGRESS.md
```

Phase 0 must define:

- exact Prisma schema proposal;
- exact indexes/unique constraints;
- provider account credential strategy;
- resource mapping approach;
- BudgetRule scope design;
- alert dedupe design;
- current-day partial/final state;
- sync orchestration;
- Neon migration plan.

**No broad implementation until Phase 0 is reviewed.**

---

# 46. CURSOR PHASE 1 — GENERIC CORE + NEON

Goal: CostOps can fully replace current Neon dashboard without functional loss.

Deliver:

- new repository/app foundation;
- generic schema;
- Projects;
- Providers;
- ProviderAccounts;
- ProjectProviders;
- Resources;
- CostEntry;
- MetricEntry;
- BudgetRule;
- AlertEvent;
- SyncRun;
- generic sync orchestration;
- generic alert engine;
- Telegram;
- Neon adapter;
- Neon resource discovery/mapping;
- migration/backfill from old Neon;
- Overview shell;
- Projects screens;
- Neon Provider Board;
- historical filters and charts;
- inline limits;
- parity tests.

Definition of done:

> Provider = Neon in CostOps is functionally equivalent or better than the existing Neon dashboard for all essential workflows.

---

# 47. CURSOR PHASE 2 — VERCEL

Deliver:

- Vercel ProviderAccount connection;
- current Vercel billing API verification;
- Vercel project/resource discovery;
- mapping to Neetrino Projects;
- normalized cost import;
- provider-specific Vercel metrics;
- historical Vercel sync/backfill where supported;
- current-day sync according to actual API freshness;
- Project × Vercel budgets;
- Vercel Provider Board;
- Telegram alerts;
- tests.

Definition of done:

> For each mapped Neetrino Project, user can see how much Vercel is costing today and historically, set its own Vercel daily limit, and receive CostOps-managed Telegram alerts.

---

# 48. CURSOR PHASE 3 — CROSS-PROVIDER PROJECT TOTALS

Deliver full project economics view.

Example:

```text
Degusto

Neon       $2.81
Vercel     $1.62
Upstash    $0.31
GCP        $1.08
----------------
Total      $5.82
```

Deliver:

- project total aggregation;
- Project Detail provider breakdown;
- optional Project Total BudgetRule;
- project-total Telegram alerts;
- project cost over time across providers;
- handling unmapped spend.

---

# 49. CURSOR PHASE 4 — UPSTASH / GCP / NEXT PROVIDERS

Add providers one by one through the adapter contract.

Do not redesign core for each provider.

If adding a provider requires core changes, Cursor must first determine whether:

1. the core abstraction is insufficient; or
2. provider-specific behavior is leaking into core incorrectly.

Document the decision before schema churn.

---

# 50. CURSOR PHASE 5 — ADVANCED FINOPS

Future features:

- anomaly detection;
- forecast;
- monthly budgets;
- projected month-end spend;
- provider invoice reconciliation;
- scheduled reports;
- CSV export;
- Slack/email notification channels;
- cost allocation tags;
- business/revenue integration.

Not required for initial production cutover.

---

# 51. ACCEPTANCE CRITERIA — V1

V1 is accepted when all of the following are true:

1. A business Project can contain multiple providers.
2. A ProjectProvider can contain one or more external resources.
3. Each Project × Provider can have its own independent daily USD limit.
4. Each Project × Provider can have its own escalation percentage or inherit a default.
5. Project total budget is available but optional.
6. Provider total budget is available but optional.
7. Global total budget is available but optional.
8. CostOps polls providers itself; provider webhooks are not required for core alerts.
9. Successful current-day sync automatically triggers budget evaluation.
10. Repeated syncs do not duplicate financial data.
11. Repeated syncs do not spam the same alert.
12. Telegram first-breach behavior works.
13. Telegram escalation behavior works.
14. Project detail shows project total and provider breakdown.
15. Provider board shows all mapped projects for that provider.
16. Overview shows aggregate cost by project and provider.
17. Historical data is stored internally.
18. Current month works.
19. Previous month works.
20. 1/7/30/60 day filters work.
21. Custom range works.
22. Daily/weekly/monthly grouping works where appropriate.
23. Provider-specific usage metrics are preserved.
24. Neon mode is not functionally worse than the old `neetrino/neon` app.
25. Old Neon history is migrated/backfilled or explicitly accounted for.
26. Stale/missing provider data is visible and not shown as false zero.
27. Provider adapters are isolated from generic budget logic.
28. New providers can be added without rewriting core alert logic.
29. Dashboard remains practical and visually polished, based on the current Neon experience.
30. Old Neon app is not retired until parity is proven.

---

# 52. NON-GOALS FOR FIRST RELEASE

Do not spend initial development time on:

- Kubernetes-based FinOps stack;
- provider-side alert configuration as a dependency;
- enterprise multi-tenant billing;
- customer-facing billing portal;
- complex RBAC beyond internal needs;
- AI cost recommendations;
- ML anomaly detection;
- invoice accounting system;
- replacing provider invoices as legal/accounting truth;
- dozens of notification channels;
- perfect FOCUS compliance for every provider.

---

# 53. PRODUCT PRINCIPLES

## Principle 1 — Project first

The key question is:

> How much does Degusto cost us, and where is that money going?

## Principle 2 — Provider accountability

The user must also be able to ask:

> How much are all our Vercel projects costing today?

## Principle 3 — Individual budgets

Normal spend differs by project and provider. Budgets must be individually configurable.

## Principle 4 — Our alert rules, not provider rules

Providers provide data. CostOps decides whether it is normal.

## Principle 5 — Own the history

Historical analytics must live in our database.

## Principle 6 — Preserve explainability

Cost alone is not enough. Keep useful usage metrics that explain the bill.

## Principle 7 — Extend through adapters

A new infrastructure provider should feel like adding a plugin, not rebuilding the application.

## Principle 8 — Reuse proven code

The current Neon dashboard already solved many operational problems. Do not throw that work away.

---

# 54. FINAL PRODUCT DEFINITION

**Neetrino CostOps** is an internal multi-provider FinOps platform that:

- periodically reads billing and usage data from infrastructure providers;
- maps external provider resources to Neetrino business projects;
- stores its own historical cost and usage data;
- calculates each project's total infrastructure cost;
- shows exactly how much each provider costs inside each project;
- provides separate provider-wide analytical boards;
- allows individual daily limits per Project × Provider;
- optionally supports Project Total, Provider Total and Global Total limits;
- independently evaluates those limits after sync;
- sends deduplicated Telegram first-breach and escalation alerts;
- preserves and generalizes the existing `neetrino/neon` analytics experience.

---

# 55. FIRST PROMPT FOR CURSOR

Use the following as the recommended first instruction in the new CostOps repository:

```text
Read this specification completely before making changes.

Then inspect the existing private reference repository:
https://github.com/neetrino/neon

The old Neon project is the functional and visual baseline. Do not modify it.

Your first task is architecture and migration analysis only — do not start broad implementation yet.

Create:
1. docs/EXISTING_NEON_AUDIT.md
2. docs/MIGRATION_MAP.md
3. docs/TECH_CARD.md
4. docs/DATA_MODEL.md
5. docs/PROVIDER_ADAPTER_CONTRACT.md
6. docs/ALERT_RULES.md
7. docs/IMPLEMENTATION_PLAN.md
8. docs/PROGRESS.md

Audit the current Neon repository carefully, especially its dashboard, historical snapshots, date filters, sync/backfill/reconciliation, Telegram alerts, per-project daily thresholds, escalation logic and Prisma schema.

Design CostOps as a provider-agnostic platform where the primary budget object is Project × Provider.

The new architecture must preserve 100% of the useful Neon dashboard functionality while allowing Vercel, Upstash, GCP and future providers to be added through adapters.

Do not begin the full implementation until the architecture, schema and migration plan are presented for approval.
```

---

# 56. REFERENCE SUMMARY FOR CURSOR

```text
OLD SYSTEM
https://github.com/neetrino/neon

Purpose:
Neon usage + cost analytics + historical dashboard + per-project daily Telegram alerts.

NEW SYSTEM
Neetrino CostOps

Purpose:
Multi-provider project cost analytics and alerting.

PRIMARY BUDGET SCOPE
Project × Provider

CORE ALERT MODEL
Poll provider → store/update data → aggregate today → evaluate our rules → Telegram

MUST PRESERVE
History
Charts
Filters
Provider metrics
Per-project limits
Escalation
Dedupe
Intraday sync
Backfill
Reconciliation
Operational status

FIRST ADAPTER
Neon

SECOND ADAPTER
Vercel

THEN
Upstash / GCP / Hetzner / others
```

---

**Document status:** AI/Cursor implementation specification v1.1  
**Date:** 2026-09-05  
**Reference repository:** https://github.com/neetrino/neon
