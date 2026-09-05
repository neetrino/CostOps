# Tech stack — Neetrino CostOps

Aligned with `docs/TECH_CARD.md` and the Neon baseline. Confirm 🔄 rows on the tech card before locking versions in `package.json`.

---

## Runtime

| Piece | Version | Role |
|-------|---------|------|
| pnpm | 10.x | Package manager |
| Node.js | 24.x LTS (proposed) | Runtime |
| TypeScript | 5.9, strict | Language |

---

## Application

| Piece | Version | Role |
|-------|---------|------|
| Next.js | 16.x (proposed; Neon is 15) | App Router, RSC, Route Handlers |
| React | 19 | UI |
| Tailwind CSS | 4.x | Styling |
| Recharts | 2.x | Charts (reuse Neon panels) |
| Zod | 3.x / current | Env + API + provider payloads |
| Pino | 9.x | Structured logs |

No Zustand, next-intl, next-themes platform, or Framer Motion in v1.

---

## Data

| Piece | Version | Role |
|-------|---------|------|
| PostgreSQL | 17 (Neon) | History and config |
| Prisma | 7.x (proposed; Neon is 6) | ORM + migrations |

---

## Hosting and jobs

| Piece | Role |
|-------|------|
| Vercel | App hosting |
| Vercel Cron | Scheduler (`vercel.json`) |
| GitHub Actions | CI + migrate-on-deploy job |

---

## External APIs

| API | Used for |
|-----|----------|
| Neon Console ` /api/v2` | Projects + `consumption_history/v2` |
| Telegram Bot API | HTML alerts |
| Vercel REST/billing | Phase 2 — verify current contract first |

---

## Quality

| Piece | Role |
|-------|------|
| ESLint + Prettier | Lint / format |
| Husky + commitlint | Hooks |
| Vitest | Unit + handler tests |
| Playwright | Later: login + Neon board smoke |

---

## Explicitly out of v1

Grafana, OpenCost, Apprise, Kafka, RabbitMQ, Kubernetes, NestJS, Redis, BullMQ, Auth.js, Clerk, R2, Resend, Stripe.
