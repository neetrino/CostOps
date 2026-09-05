# Neetrino CostOps

Internal multi-provider FinOps platform. Pulls usage and cost from infrastructure providers, maps resources to Neetrino projects, stores history, and sends Telegram alerts from Project × Provider budget rules.

**Size B.** Visual and operational baseline: [neetrino/neon](https://github.com/neetrino/neon) (do not modify that repo).

---

## Status

Phase 0 is complete. `docs/TECH_CARD.md` is **confirmed**. Next: Phase 1 scaffold (`docs/IMPLEMENTATION_PLAN.md`).

Docs index: [docs/README.md](./docs/README.md).

---

## When Phase 1 starts

1. Copy `.env.example` → `.env` (dev database only — never production URLs).
2. Install: `pnpm install`
3. Migrate the **dev** database: `pnpm exec prisma migrate dev`
4. `pnpm dev`
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
