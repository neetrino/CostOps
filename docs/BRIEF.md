# Neetrino CostOps — brief

Internal FinOps platform for Neetrino. Collects infrastructure usage and cost from multiple providers, maps resources to business projects, stores history, and sends Telegram alerts from Neetrino-defined budget rules.

**Spec:** [Neetrino_CostOps_CURSOR_SPEC.md](./Neetrino_CostOps_CURSOR_SPEC.md)  
**Baseline app:** https://github.com/neetrino/neon (do not modify)  
**Size:** B (medium) — see [TECH_CARD.md](./TECH_CARD.md)

---

## Audience

Neetrino operators who need to answer:

- How much does a business project (Degusto, Mobee, NBOS, …) cost today, and where does the money go?
- How much does one provider (Neon, Vercel, …) cost across all projects?
- Which Project × Provider pairs are near or over their daily limit?

Single-organization internal use. Not a customer-facing billing portal.

---

## Must-have features (priority)

1. **Neon parity** — preserve the existing Neon dashboard: history, filters, charts, estimated cost, per-project daily limits, escalation Telegram alerts, sync/backfill/reconciliation — high
2. **Project × Provider budgets** — independent daily USD limit and escalation % per pair — high
3. **Generic core** — Project, Provider, ProviderAccount, Resource, CostEntry, MetricEntry, BudgetRule, AlertEvent, SyncRun — high
4. **Provider adapters** — isolated I/O; first Neon, then Vercel — high
5. **Overview / Projects / Project detail / Provider boards** — high
6. **Resource mapping + unmapped spend** — high
7. **Freshness states** — never show missing data as `$0` — high
8. **Credential rotation** — expiry + 401 alerts in admin and Telegram, with a create-token link per provider — high
9. **Optional aggregate budgets** — project total, provider total, global total — medium
10. **Upstash / GCP / Hetzner adapters** — medium
11. **Anomaly / forecast / extra channels** — low (Phase 5)

---

## Stack (locked by spec + template)

- Fullstack Next.js on Vercel (not NestJS)
- PostgreSQL + Prisma
- Tailwind CSS + Recharts (reuse Neon UI)
- Pino, Zod, Vercel Cron, Telegram Bot API
- Auth: reused Neon dashboard password + httpOnly JWT session

---

## Design

- No Figma file. Baseline: https://neon-neetrino.vercel.app plus [DESIGN.md](./DESIGN.md)
- More refined than the live Neon board: type, surfaces, hierarchy — **no gradients**
- Browser-verify UX (empty, loading, error, freshness, filters). Do not ship “default admin” UI

---

## Integrations

- [x] Neon Console API (P0)
- [x] Telegram Bot API
- [x] Vercel Billing API (P0, verify current API before coding)
- [ ] Upstash (P0/P1)
- [ ] Google Cloud (P1)
- [ ] Hetzner (P1)
- [ ] Resend / Cloudflare (P2)
- [ ] Payments / email / R2 / Redis — not in v1

---

## Content language

- UI: English
- i18n: no

---

## Constraints

- Timeline: Size B, about 3–6 months to full v1 (Neon cutover + Vercel + project totals)
- Do not retire `neetrino/neon` until 7-day parity
- Do not depend on provider-side alerts or webhooks for core product
- UTC storage and UTC budget day in v1
- Reporting currency: USD
- Adaptive DB limits need confirmation in TECH_CARD section 4
