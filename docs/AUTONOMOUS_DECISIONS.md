# Autonomous decisions (orchestrator)

Product goal: see cost by project and period, get Telegram when spend breaks a limit, keep our own history, understand *why* spend moved.

---

## 2026-09-05 — start Phase 1

| Decision | Why |
|----------|-----|
| Start with **app foundation** (Next.js 16, Prisma 7, env, CI, schema, auth) before adapters/UI | Everything else depends on this tree; parallel edits would collide |
| First executor: **Grok 4.6** (`cursor-grok-4.6-high`) | Multi-file scaffold + Prisma + Size B layout is too easy to get wrong on a thin Composer pass; Grok is free and reliable here |
| Composer reserved for later UI slices | DESIGN.md + dashboard port is Composer-shaped once APIs exist |
| No production deploy / no cutover of `neetrino/neon` | Spec: 7-day parity first; deploy needs your Vercel project |
| Do not run history copy from `OLD_NEON_PROJECT_DATABASE_URL` in the first slice | Schema and Neon adapter must exist; avoid touching the live Neon DB until the script is reviewed |
| UI later must beat live Neon visually, **no gradients** | Your last design instruction |
| Spend alerts stay pull-based after sync | Goal is “notify the right project at the right time”, not provider webhooks |

Paid models: not used. Fable 5: orchestrator only.

---

## 2026-09-05 — after foundation (`6f83adb`)

| Decision | Why |
|----------|-----|
| Next slice: Neon adapter + generic sync + cost upsert + spend/credential alerts + unit tests (one Grok run) | Tight vertical: adapter output must match core upsert/alert contracts; splitting would stall on types |
| Leave `.env` typo for you | Orchestrator will not edit `.env` (secrets). Noted in QUESTIONS |
| Port `:3001` locally | `:3000` already taken; no need to change APP_URL unless cookies break |

---

## 2026-09-05 — after sync slice (`ead5a40`)

| Decision | Why |
|----------|-----|
| New auto-created `BudgetRule`s start **disabled**; disable existing default $1 rules | First live sync may have Telegram-spammed every Neon project over $1. Goal is “alert the right project”, not a flood. Limits turn on after migrate-from-neon or inline Set |
| Port old Neon ignored project IDs as skipped/archived | Same denylist as production Neon dashboard |
| Next: Composer = alert safety; Grok = read APIs | Independent files; APIs unblock the dashboard |

---

## 2026-09-05 — after alert safety (`d7399ff`)

| Decision | Why |
|----------|-----|
| Safety slice accepted; no extra alert work | Ignored IDs ported; new rules `enabled: false`; 42 default $1 rules disabled locally |
| Wait for read APIs before dashboard UI | DESIGN.md needs freshness + CostView on every cost surface |

---

## 2026-09-05 — after read APIs (`ef2dbd8`)

| Decision | Why |
|----------|-----|
| Read APIs accepted; no Neon aliases this slice | UI consumes CostOps `/api/overview`, `/api/projects`, `/api/usage/*`, PATCH budget — aliases are optional later |
| Next: Composer = dashboard shell + Overview + Projects board | DESIGN.md visual bar; Neon workflows (rail, KPI, charts, cards/list, inline `$`+`%`); no gradients |
| Project detail / Unmapped / Integrations = following slice if this one stays dense | One commit must look designed, not a stub of every route |

---

## 2026-09-05 — after first UI (`b58c852`)

| Decision | Why |
|----------|-----|
| Overview + Projects accepted | Browser-checked on :3001 (login, period, cards/list, budget 1→2.5, Sync now) |
| Next: Composer = remaining Phase 1 screens | APIs already exist; reuse shell, CostView, filter rail, charts, inline budget |
| Still no migrate-from-neon | UI must exist first; `.env` typo still blocks history copy |

---

## 2026-09-05 — after detail UI (`8b4f1fe`)

| Decision | Why |
|----------|-----|
| Phase 1 screens accepted | Browser-checked detail, Neon board, empty Unmapped, Integrations |
| Next: Grok = `scripts/migrate-from-neon.ts` (write + dry-run only) | Data hose; do not `--apply` until script exists and URL is the real `OLD_NEON_PROJECT_DATABASE_URL` |
| No Neon API aliases | Dashboard already uses CostOps routes |
| Do not guess business-project remaps | Manual table only; auto-created CostOps projects stay until operator maps |

---

## 2026-09-05 — after migrate script (`53b9da9`)

| Decision | Why |
|----------|-----|
| Script accepted; **do not `--apply` yet** | Correct env key unset; no live dry-run. Operator typo still blocks the hose |
| Fix budget merge before apply | `upsertBudgetRule` update always writes `enabled` + `limitUsd` — would clobber UI Set (e.g. Aibonacci $2.5) and re-shape the 42 disabled defaults |
| Merge rule: existing + old null → keep CostOps; existing + old explicit → take old Neon | Old app is source of truth for real thresholds; CostOps UI/safety wins when old used env default |
| No preview deploy | Needs your Vercel project — stop per IMPLEMENTATION_PLAN |

---

## 2026-09-05 — after budget merge (`b067bf8`)

| Decision | Why |
|----------|-----|
| Merge fix accepted; stop Phase 1 coding | Hose is reviewable. Next actions are operator: rename env key → dry-run → `--apply`; then Vercel preview |
| Do not start Phase 2 (Vercel adapter) | Spec: 7-day Neon parity after history copy + preview, not a new provider |
