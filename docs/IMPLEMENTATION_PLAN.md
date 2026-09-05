# Implementation plan — Neetrino CostOps

No broad implementation until `docs/TECH_CARD.md` is confirmed.

---

## Phase 0 — Architecture (this delivery)

- [x] Size B
- [x] TECH_CARD, architecture, data model, adapter contract, alert rules
- [x] Neon audit + migration map
- [x] Cursor rules adapted
- [ ] Human confirmation of 🔄 TECH_CARD rows

**Exit:** TECH_CARD confirmed. No application scaffold yet.

---

## Phase 1 — Generic core + Neon parity

Goal: CostOps can replace the Neon dashboard for Neon-only use.

1. Scaffold Next.js 16 (or confirmed 15) + Tailwind 4 + Prisma + Vitest + CI
2. Env contract, logger, auth middleware (port Neon)
3. Apply schema from `DATA_MODEL.md` via migration
4. Seed Provider `NEON` + ProviderAccount from env
5. Core: upsert, aggregates, freshness, budget eval, Telegram
6. Neon adapter (port client, metrics, pricing, day + intraday sync)
7. Scheduler routes + SyncRun
8. UI: Overview shell, Projects, Project detail (Neon only), Neon provider board
9. Port filters, charts, cards/list, inline limits
10. `scripts/migrate-from-neon.ts` + backfill/reconcile
11. Unit tests (aggregates, alerts, formula) + Neon fixture parity tests
12. Deploy to a CostOps preview; run parallel with old Neon

**DoD:** Neon mode is functionally equivalent or better for essential workflows.

---

## Phase 2 — Vercel

1. Verify current Vercel billing/usage API (record real payload shape)
2. Vercel adapter + account connection
3. Discover projects, mapping UI, unmapped inbox
4. Costs/metrics, board, Project × Vercel budgets, alerts
5. Tests

**DoD:** Each mapped project shows Vercel today + history and can alert independently.

---

## Phase 3 — Cross-provider project totals

- Project detail breakdown
- Optional PROJECT_TOTAL rules + Telegram
- Unmapped spend visible on provider/global, not silently dropped
- Multi-provider overview

---

## Phase 4 — Next providers

Upstash → GCP → Hetzner, one adapter at a time. If core must change, write an ADR first.

---

## Phase 5 — Advanced FinOps (not cutover)

Anomaly, forecast, monthly budgets, CSV, Slack/email, invoice reconcile, revenue ratio.

---

## Suggested build order inside Phase 1

```text
scaffold + CI
  → schema + seed
  → auth
  → neon adapter + sync
  → cost/alert core + tests
  → read APIs
  → dashboard port
  → migration script
  → preview deploy + parallel
```

Keep each slice deployable.

---

## Credentials needed at Phase 1 start (do not invent)

- Dev `DATABASE_URL` / `DIRECT_URL` (non-prod Neon)
- `NEON_API_KEY`, `NEON_ORG_ID`
- `CRON_SECRET`, `JWT_SECRET`, `DASHBOARD_PASSWORD`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (or a staging bot)
- Read-only URL to old Neon DB for migration (when ready)
- Vercel project for CostOps (new, not the old Neon project)
