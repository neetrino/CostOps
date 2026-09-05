# Neetrino CostOps

Internal multi-provider FinOps platform. Pulls usage and cost from infrastructure providers, maps resources to Neetrino projects, stores history, and sends Telegram alerts from Project × Provider budget rules.

**Size B.** Visual and operational baseline: [neetrino/neon](https://github.com/neetrino/neon) (do not modify that repo).

---

## Status

Phase 1 foundation is in place: runnable Next.js 16 app, Prisma 7 schema, dashboard password auth. Next: Neon adapter + sync (`docs/IMPLEMENTATION_PLAN.md`).

Docs index: [docs/README.md](./docs/README.md).

---

## Local run

1. Copy `.env.example` → `.env` (dev database only — never production URLs).
2. Install: `pnpm install`
3. Migrate the **dev** database: `pnpm db:migrate` (or `pnpm db:migrate:deploy` for committed history)
4. Seed: `pnpm db:seed`
5. `pnpm dev` — open `/login`, then `/`. Health: `GET /api/health`
5. Cron locally: `curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/sync`

Production migrations run from the deploy job (`prisma migrate deploy`), not from a laptop.

---

## Stack

Next.js App Router · TypeScript strict · PostgreSQL + Prisma · Tailwind 4 · Recharts · Zod · Pino · Vercel Cron · Telegram Bot API.

---

## Agent / quality

- Product rules: `.cursor/rules/02-costops.mdc`
- Skills: `.agents/skills/`
- After implementation work: `.agents/skills/verify-before-completion/`
