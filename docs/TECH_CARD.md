# Technical card — Neetrino CostOps

> Filled during Phase 0 from `docs/BRIEF.md` and `docs/Neetrino_CostOps_CURSOR_SPEC.md`.
> Confirm adaptive rows (🔄) before Phase 1 scaffolding.

**Project.** Neetrino CostOps  
**Size.** B (medium)  
**Date.** 2026-09-05  
**Status.** proposed — Phase 0 complete; confirm adaptive limits, then start Phase 1

> Status: ⬜ not started · 🔄 proposed / confirm · ✅ decided · ➖ not needed

---

## 1. Foundation

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 1.1 | Project size | **B** | ✅ | ~3–6 months, 1–2 people, 25–40 capabilities, adapter architecture. Not A (too many features). Not C (single Next.js app, one team, spec rejects monorepo/K8s). ADR-001 |
| 1.2 | Architecture | Feature-based + provider adapters | ✅ | `features/`, `core/`, `providers/` |
| 1.3 | Package manager | pnpm | ✅ | Match Neon (`pnpm@10`) and template |
| 1.4 | Node.js | 24.x LTS | 🔄 | Template default. Neon runs `>=20.9`. Confirm 24 vs 22 LTS on Vercel |
| 1.5 | TypeScript | 5.9, `strict: true` | ✅ | |
| 1.6 | Monorepo tool | — | ➖ | Size C only |
| 1.7 | Git strategy | Feature branches | ✅ | |
| 1.8 | Commit convention | Conventional Commits | ✅ | |

---

## 2. Frontend

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 2.1 | Framework | Next.js 16.x (App Router) | 🔄 | Template default. Neon is Next 15 — port UI, do not stay on 15 unless 16 blocks reuse |
| 2.2 | Styles | Tailwind CSS 4.x | ✅ | Reuse Neon tokens/patterns |
| 2.3 | UI kit | Custom (Neon dashboard) | ✅ | shadcn only if a new primitive is missing |
| 2.4 | State | URL + local prefs + React state | ✅ | No Zustand in v1. Filters persist like Neon |
| 2.5 | Forms | Server Actions + Zod | ✅ | Inline budget edits stay one-field-fast |
| 2.6 | Data fetching | Server Components + Route Handlers | ✅ | Same shape as Neon `/api/usage/*` |
| 2.7 | i18n | not needed | ➖ | English UI |
| 2.8 | SEO | not needed | ➖ | Internal, auth-gated |
| 2.9 | Dark theme | Follow Neon dashboard | ✅ | Decide against current Neon look, not a new theme system |
| 2.10 | Animations | CSS transitions | ✅ | No Framer Motion in v1 |
| 2.11 | PWA | not needed | ➖ | |

---

## 3. Backend

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 3.1 | Type | Next.js Route Handlers | ✅ | Not NestJS. ADR-002 |
| 3.2 | Validation | Zod | ✅ | Especially provider API boundaries |
| 3.3 | API format | REST (internal JSON) | ✅ | No public OpenAPI in v1 |
| 3.4 | Rate limiting | Login + sync-now | 🔄 | Recommend: 5 login/min/IP; cron uses `CRON_SECRET` only |
| 3.5 | API docs | Markdown `docs/04-API.md` | ✅ | No Swagger in v1 |
| 3.6 | Cron | Vercel Cron | ✅ | Generic scheduler route, not one forever-hardcoded path per provider |
| 3.7 | File uploads | not needed | ➖ | |

---

## 4. Database

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 4.1 | DBMS | PostgreSQL 17 (Neon) | ✅ | Dedicated analytics DB, not mixed with product DBs |
| 4.2 | ORM | Prisma 7.x | 🔄 | Template default. Neon uses Prisma 6 — confirm 7 vs stay on 6 for porting speed |
| 4.3 | DB roles | `app_user` + `readonly_user` | ✅ | Runtime is not owner |
| 4.4 | Connection limit | **5** pooled | 🔄 | Serverless + Neon pooler. Options: 1–3 (too tight), **5 (recommended)**, 10 (template, easier to hit Neon cap) |
| 4.5 | statement_timeout | **30s** default | 🔄 | Dashboard/API. Sync/backfill use app AbortSignal 60–120s, not a global 120s |
| 4.6 | idle_in_transaction_session_timeout | **15s** | 🔄 | Kill stuck transactions |
| 4.7 | lock_timeout | **10s** | 🔄 | Avoid indefinite waits |
| 4.8 | Seed data | prisma db seed (dev) | ✅ | Providers + sample Project slugs, no production credentials |
| 4.9 | Cache (Redis) | not needed | ➖ | Revisit if dashboard aggregates become slow |
| 4.10 | Queues | not needed | ➖ | Vercel Cron + idempotent upsert. Worker later without rewriting adapters |
| 4.11 | Production migrations | GitHub Actions or Vercel deploy job | ✅ | `prisma migrate deploy`. Never from a laptop. `DIRECT_URL` only in the job |

---

## 5. Auth

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 5.1 | Solution | Custom password + httpOnly JWT | ✅ | Reuse Neon. Not Auth.js/Clerk in v1. ADR-005 |
| 5.2 | Providers | Shared dashboard password | ✅ | Single organization |
| 5.3 | Session | Signed JWT cookie | ✅ | Edge-verifiable, like Neon `middleware.ts` |
| 5.4 | Roles / RBAC | not needed | ➖ | Internal operators only |
| 5.5 | Email verification | not needed | ➖ | |
| 5.6 | Password recovery | not needed | ➖ | |

---

## 6. Storage and CDN

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 6.1 | File storage | not needed | ➖ | |
| 6.2 | CDN | Vercel | ✅ | |
| 6.3 | Image optimization | next/image if logos only | ➖ | No media product |

---

## 7. External services

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 7.1 | Email | not needed | ➖ | |
| 7.2 | Payments | not needed | ➖ | |
| 7.3 | Analytics | not needed | ➖ | Product *is* the analytics |
| 7.4 | Error tracking | pino first; Sentry later | 🔄 | Add Sentry after Neon parity if ops need it |
| 7.5 | Search | not needed | ➖ | In-memory/SQL project search |
| 7.6 | Push / WebSocket | not needed | ➖ | |
| 7.7 | SMS | not needed | ➖ | |
| 7.8 | AI | not needed | ➖ | |
| 7.9 | CMS | not needed | ➖ | |
| 7.10 | Maps | not needed | ➖ | |
| 7.11 | Telegram | Bot API | ✅ | Only notification channel in v1 |
| 7.12 | Neon API | Console API v2 | ✅ | First adapter |
| 7.13 | Vercel API | Billing/usage — verify live | ✅ | Phase 2; do not hard-code stale docs |

---

## 8. DevOps and hosting

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 8.1 | Frontend hosting | Vercel | ✅ | |
| 8.2 | Backend hosting | not needed | ➖ | Same Next.js app |
| 8.3 | CI/CD | GitHub Actions | ✅ | See `docs/QUALITY_AUTOMATION_PLAN.md` |
| 8.4 | Docker | not needed | ➖ | |
| 8.5 | WAF | Vercel protection + optional CF | 🔄 | Internal tool; confirm if a custom domain needs Cloudflare |
| 8.6 | Monitoring | Vercel + SyncRun UI | ✅ | Provider health on Overview |
| 8.7 | Logging | pino (prod JSON) | ✅ | Never log tokens or API keys |
| 8.8 | Environments | dev + prod | ✅ | Neon branches. Staging optional later |
| 8.9 | Domain | Vercel / later custom | 🔄 | Confirm `APP_URL` for cookies |
| 8.10 | DB backups | Neon PITR | ✅ | |
| 8.11 | Migration job | GitHub Actions or Vercel | ✅ | Same commit as the release |

---

## 9. Testing

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 9.1 | Unit tests | Vitest | ✅ | Aggregations, alerts, dedupe, freshness, Neon cost formula |
| 9.2 | Component tests | React Testing Library (critical widgets) | 🔄 | Not Storybook in v1 |
| 9.3 | E2E | Playwright for login + Neon board smoke | 🔄 | After UI exists |
| 9.4 | Coverage target | **80% core / 70% overall** | 🔄 | Core = `src/core/**` + alert + Neon estimate. Options: 70/70 (weaker), **80/70 (recommended)**, 90/80 (slows adapters) |
| 9.5 | API tests | Vitest against handlers | ✅ | Idempotent upsert, mapping, budget PATCH |

---

## 10. Security (mandatory)

| # | Parameter | Status | Notes |
|---|-----------|--------|-------|
| 10.1 | CORS | ✅ | Same-origin app; no `*` with credentials |
| 10.2 | CSRF | ✅ | Cookie session + same-site; mutations via Server Actions / same-origin |
| 10.3 | Helmet (NestJS) | ➖ | Next headers instead |
| 10.4 | Input validation | ✅ | Zod on query/body/provider payloads |
| 10.5 | argon2 | ➖ | Shared password compared via existing Neon pattern; no user table |
| 10.6 | Rate limiting | 🔄 | Confirm login/sync-now limits (3.4) |
| 10.7 | Env-only secrets | ✅ | Provider keys and Telegram token never in client |

---

## 11. Project documentation

| # | Document | Status | Notes |
|---|----------|--------|-------|
| 11.1 | docs/BRIEF.md | ✅ | |
| 11.2 | docs/TECH_CARD.md | ✅ | this file |
| 11.3 | docs/01-ARCHITECTURE.md | ✅ | |
| 11.4 | docs/PROGRESS.md | ✅ | |
| 11.5 | README.md | ✅ | |
| 11.6 | .env.example | ✅ | names only |
| 11.7 | Size B extras | ✅ | structure, API, database, decisions, audit, migration, alerts, adapters, plan |

---

## 12. Final project check

Filled at delivery. All ⬜.

---

## Summary

**Decided (✅):** size B, Next.js Route Handlers, Prisma/Postgres, Tailwind, Zod, Vercel Cron, Telegram, custom session, no Redis/R2/Nest/i18n.  
**Confirm (🔄):** Node 24 vs 22, Next 16 vs 15, Prisma 7 vs 6, pool=5, timeouts 30/15/10, coverage 80/70, rate limits, Sentry, domain/WAF.  
**Not needed (➖):** monorepo, NestJS, Auth.js, payments, email, Redis, queues, PWA, SEO, i18n.

> **Start Phase 1** after this card is confirmed (at least sections 1–10).  
> **Finish** when section 12 is all ✅.
