# Technical card — Neetrino CostOps

**Project.** Neetrino CostOps  
**Size.** B (medium)  
**Date.** 2026-09-05  
**Status.** confirmed — Phase 1 authorized

> Status: ⬜ not started · 🔄 proposed · ✅ decided · ➖ not needed

---

## 1. Foundation

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 1.1 | Project size | **B** | ✅ | ADR-001 |
| 1.2 | Architecture | Feature-based + provider adapters | ✅ | `features/`, `core/`, `providers/` |
| 1.3 | Package manager | pnpm | ✅ | |
| 1.4 | Node.js | 24.x LTS | ✅ | Confirmed |
| 1.5 | TypeScript | 5.9, `strict: true` | ✅ | |
| 1.6 | Monorepo tool | — | ➖ | |
| 1.7 | Git strategy | Feature branches | ✅ | |
| 1.8 | Commit convention | Conventional Commits | ✅ | |

---

## 2. Frontend

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 2.1 | Framework | Next.js 16.x (App Router) | ✅ | Port Neon 15 UI |
| 2.2 | Styles | Tailwind CSS 4.x | ✅ | |
| 2.3 | UI kit | Custom (Neon dashboard) | ✅ | Every screen designed per `docs/DESIGN.md` |
| 2.4 | State | URL + local prefs + React state | ✅ | |
| 2.5 | Forms | Server Actions + Zod | ✅ | |
| 2.6 | Data fetching | Server Components + Route Handlers | ✅ | |
| 2.7 | i18n | not needed | ➖ | |
| 2.8 | SEO | not needed | ➖ | |
| 2.9 | Dark theme | Follow Neon dashboard | ✅ | |
| 2.10 | Animations | CSS transitions | ✅ | |
| 2.11 | PWA | not needed | ➖ | |

---

## 3. Backend

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 3.1 | Type | Next.js Route Handlers | ✅ | ADR-002 |
| 3.2 | Validation | Zod | ✅ | |
| 3.3 | API format | REST (internal JSON) | ✅ | |
| 3.4 | Rate limiting | 5 login/min/IP; cron via `CRON_SECRET` | ✅ | |
| 3.5 | API docs | Markdown `docs/04-API.md` | ✅ | |
| 3.6 | Cron | Vercel Cron | ✅ | |
| 3.7 | File uploads | not needed | ➖ | |

---

## 4. Database

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 4.1 | DBMS | PostgreSQL 17 (Neon) | ✅ | Dedicated analytics DB |
| 4.2 | ORM | Prisma 7.x | ✅ | |
| 4.3 | DB roles | `app_user` + `readonly_user` | ✅ | |
| 4.4 | Connection limit | **5** pooled | ✅ | |
| 4.5 | statement_timeout | **30s** | ✅ | Sync/backfill AbortSignal 60–120s |
| 4.6 | idle_in_transaction_session_timeout | **15s** | ✅ | |
| 4.7 | lock_timeout | **10s** | ✅ | |
| 4.8 | Seed data | prisma db seed (dev) | ✅ | |
| 4.9 | Cache (Redis) | not needed | ➖ | |
| 4.10 | Queues | not needed | ➖ | |
| 4.11 | Production migrations | GitHub Actions or Vercel deploy job | ✅ | |
| 4.12 | Old Neon history DB | `OLD_NEON_PROJECT_DATABASE_URL` | ✅ | Read-only [neetrino/neon](https://github.com/neetrino/neon) Postgres. Not CostOps runtime. `docs/OLD_NEON_DATABASE.md` |

---

## 5. Auth

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 5.1 | Solution | Custom password + httpOnly JWT | ✅ | ADR-005 |
| 5.2 | Providers | Shared dashboard password | ✅ | |
| 5.3 | Session | Signed JWT cookie | ✅ | |
| 5.4 | Roles / RBAC | not needed | ➖ | |
| 5.5 | Email verification | not needed | ➖ | |
| 5.6 | Password recovery | not needed | ➖ | |

---

## 6. Storage and CDN

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 6.1 | File storage | not needed | ➖ | |
| 6.2 | CDN | Vercel | ✅ | |
| 6.3 | Image optimization | next/image if logos only | ➖ | |

---

## 7. External services

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 7.1 | Email | not needed | ➖ | |
| 7.2 | Payments | not needed | ➖ | |
| 7.3 | Analytics | not needed | ➖ | |
| 7.4 | Error tracking | pino first; Sentry after Neon parity if needed | ✅ | |
| 7.5–7.10 | Search / WS / SMS / AI / CMS / maps | not needed | ➖ | |
| 7.11 | Telegram | Bot API | ✅ | |
| 7.12 | Neon API | Console API v2 | ✅ | Env names: `NEON_API_KEY`, `NEON_ORG_ID` (same as `neetrino/neon`) |
| 7.13 | Vercel API | Billing/usage — verify live | ✅ | Env names: `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID` |
| 7.14 | Credential rotation | Admin + Telegram | ✅ | Live 401/403 only; no stored expiry date. Per-provider create-token URL. `docs/CREDENTIAL_ROTATION.md` |

---

## 8. DevOps and hosting

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 8.1 | Frontend hosting | Vercel | ✅ | |
| 8.2 | Backend hosting | not needed | ➖ | |
| 8.3 | CI/CD | GitHub Actions | ✅ | |
| 8.4 | Docker | not needed | ➖ | |
| 8.5 | WAF | Vercel protection | ✅ | Cloudflare later if a custom domain needs it |
| 8.6 | Monitoring | Vercel + SyncRun UI | ✅ | |
| 8.7 | Logging | pino (prod JSON) | ✅ | |
| 8.8 | Environments | dev + prod | ✅ | |
| 8.9 | Domain | Vercel auto | ✅ | Custom domain later; `APP_URL` follows the deploy URL |
| 8.10 | DB backups | Neon PITR | ✅ | |
| 8.11 | Migration job | GitHub Actions or Vercel | ✅ | |

---

## 9. Testing

| # | Parameter | Decision | Status | Notes |
|---|-----------|----------|--------|-------|
| 9.1 | Unit tests | Vitest | ✅ | |
| 9.2 | Component tests | RTL for critical widgets | ✅ | After UI exists; no Storybook |
| 9.3 | E2E | Playwright login + Neon board smoke | ✅ | After UI exists |
| 9.4 | Coverage target | **80% core / 70% overall** | ✅ | |
| 9.5 | API tests | Vitest against handlers | ✅ | |

---

## 10. Security (mandatory)

| # | Parameter | Status | Notes |
|---|-----------|--------|-------|
| 10.1 | CORS | ✅ | Same-origin |
| 10.2 | CSRF | ✅ | Same-site cookie + Server Actions |
| 10.3 | Helmet (NestJS) | ➖ | Next headers |
| 10.4 | Input validation | ✅ | Zod |
| 10.5 | argon2 | ➖ | Shared password, no user table |
| 10.6 | Rate limiting | ✅ | 5 login/min/IP |
| 10.7 | Env-only secrets | ✅ | Same Neon env names as the baseline app |

---

## 11. Project documentation

| # | Document | Status | Notes |
|---|----------|--------|-------|
| 11.1–11.7 | Brief, card, architecture, progress, README, env example, Size B extras | ✅ | |

---

## 12. Final project check

Filled at delivery. All ⬜.

---

## Summary

**Confirmed.** Size B, Next.js 16, Node 24, Prisma 7, pool 5, timeouts 30/15/10, coverage 80/70, Neon env = `NEON_API_KEY` + `NEON_ORG_ID` (no `NEON_PRIMARY_*`).

> **Phase 1** is authorized.  
> **Finish** when section 12 is all ✅.
