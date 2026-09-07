# Implementation plan — Neetrino CostOps

`docs/TECH_CARD.md` is confirmed. Phase 1 may start.

---

## Phase 0 — Architecture (this delivery)

- [x] Size B
- [x] TECH_CARD, architecture, data model, adapter contract, alert rules
- [x] Neon audit + migration map
- [x] Cursor rules adapted
- [x] Human confirmation of TECH_CARD rows

**Exit:** TECH_CARD confirmed. Env names match Neon. Scaffold is the next step.

---

## Phase 1 — Generic core + Neon parity

Goal: CostOps can replace the Neon dashboard for Neon-only use.

1. Scaffold Next.js 16 (or confirmed 15) + Tailwind 4 + Prisma + Vitest + CI
2. Env contract, logger, auth middleware (port Neon)
3. Apply schema from `DATA_MODEL.md` via migration
4. Seed Provider `NEON` + ProviderAccount from env
5. Core: upsert, aggregates, freshness, budget eval, Telegram
6. Credential health: expiry warnings (30d / 7d / expired), 401/403 alerts, Settings Integrations UI + Telegram with create-token URL ([CREDENTIAL_ROTATION.md](./CREDENTIAL_ROTATION.md))
7. Neon adapter (port client, metrics, pricing, day + intraday sync) + Neon `credentials` meta (org API keys page; no auto-expiry)
8. Scheduler routes + SyncRun
9. UI: Overview shell, Projects, Project detail (Neon only), Neon provider board — [DESIGN.md](./DESIGN.md)
10. Port filters, charts, cards/list, inline limits; browser-verify empty/error/freshness
11. `scripts/migrate-from-neon.ts` (reads `OLD_NEON_PROJECT_DATABASE_URL`) + backfill/reconcile
12. Unit tests (aggregates, alerts, formula, credential rotation) + Neon fixture parity tests
13. Deploy to a CostOps preview; run parallel with old Neon

**DoD:** Neon mode is functionally equivalent or better for essential workflows.

---

## Phase 2 — Vercel

1. Verify current Vercel billing/usage API (record real payload shape)
2. Vercel adapter + account connection (`credentials` → [account tokens](https://vercel.com/account/tokens); operator stores 1-year `credentialExpiresAt`)
3. Discover projects, mapping UI, unmapped inbox
4. Costs/metrics, board, Project × Vercel budgets, alerts
5. Tests

**DoD:** Each mapped project shows Vercel today + history and can alert independently.

---

## Phase 3 — Cross-provider project totals

- [x] Project detail breakdown
- [x] Optional PROJECT_TOTAL rules + Telegram
- [x] Unmapped spend visible on provider/global, not silently dropped
- [x] Multi-provider overview

---

## Phase 4 — Next providers

- [x] Upstash Management API adapter (Redis + QStash; Vector/Search discovered when present)
- [ ] GCP — postponed (billing quota on project `neetrino`; no SA JSON)
- [ ] Hetzner — no token yet

Each adapter must include `credentialCreateUrl` and auth-failure detection. If core must change, write an ADR first.

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

UI work follows [DESIGN.md](./DESIGN.md): design every state; verify in the browser. Do not ship leftover template chrome.

---

## Autonomous run (when the operator says start)

Work through Phase 1 without waiting on cosmetic questions. Stop and ask only for:

- missing secrets that cannot be invented
- schema or architecture changes that contradict the confirmed TECH_CARD
- production deploy / production migrate
- retiring `neetrino/neon`

Study the Neon repo, run tests, and use the browser yourself. Update `PROGRESS.md` as you go.

---

## Credentials needed at Phase 1 start (do not invent)

- Dev `DATABASE_URL` / `DIRECT_URL` (non-prod Neon)
- `NEON_API_KEY`, `NEON_ORG_ID`
- `CRON_SECRET`, `JWT_SECRET`, `DASHBOARD_PASSWORD`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (or a staging bot)
- `OLD_NEON_PROJECT_DATABASE_URL` — read-only Postgres of https://github.com/neetrino/neon; use only for `migrate-from-neon` ([OLD_NEON_DATABASE.md](./OLD_NEON_DATABASE.md)). Not the CostOps runtime DB.
- Vercel project for CostOps (new, not the old Neon project)
