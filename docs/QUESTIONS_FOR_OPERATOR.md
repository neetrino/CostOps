# Questions for the operator

Filled only when a decision cannot be made from the spec, TECH_CARD, or project goal (control spend, Telegram when it matters, own the history).

If this list is empty at the end of Phase 1, nothing is blocked on you.

---

## Open

1. **Local `.env` typo** — ключ записан как `OLD_NEON_PROJECTDATABASE_URL` (нет `_` перед `DATABASE`). Переименуй в `OLD_NEON_PROJECT_DATABASE_URL`. Hose: `53b9da9` + merge `b067bf8` (`pnpm migrate:from-neon`, dry-run по умолчанию). Старый Neon с явным порогом перезапишет правило; дефолт $1 **не** затирает UI Set. Не подставляй CostOps `DATABASE_URL`. После переименования напиши — прогоним dry-run, потом `--apply`.
2. **Preview / Vercel** — Phase 1 код локально готов (кроме live history copy). Деплой не делаю, пока не дашь CostOps Vercel project.

---

## Resolved during the run

1. **Telegram при первом sync** — first-breach по проектам выше $1 мог уйти один раз (`ead5a40`). В `d7399ff` авто-правила больше не создаются включёнными; локально отключены **42** дефолтных $1 `PROJECT_PROVIDER` rule. Повторного спама с cron не будет (не задеплоен). Лимиты включатся после migrate-from-neon или inline Set.
