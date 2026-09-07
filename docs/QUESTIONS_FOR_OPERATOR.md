# Questions for the operator

Filled only when a decision cannot be made from the spec, TECH_CARD, or project goal (control spend, Telegram when it matters, own the history).

If this list is empty at the end of Phase 1, nothing is blocked on you.

---

## Open

1. **Vercel + Upstash → проекты** — в `/unmapped`: Map на существующий, **Save as project** для одиночки (только Vercel/Upstash — нормально), Archive для leftover (`Team (unallocated)`) и мусора. Одинаковые имена не сливаю.
2. **GCP** — отложили. Проект `neetrino` создан, биллинг не привязан (лимит 5 billed-проектов). `GOOGLE_APPLICATION_CREDENTIALS` пустой. Вернёмся позже.
3. **Vercel $20 credit** — в Usage это included credit цикла, не invoice billed. CostOps оставляет billed. Если нужен второй столбец «usage / effective» — скажи.

---

## Resolved during the run

1. **Telegram при первом sync** — first-breach по проектам выше $1 мог уйти один раз (`ead5a40`). В `d7399ff` авто-правила больше не создаются включёнными; локально отключены **42** дефолтных $1 `PROJECT_PROVIDER` rule. Повторного спама с cron не будет (не задеплоен). Лимиты включатся после migrate-from-neon или inline Set.
2. **История старого Neon** — `--apply` 2026-09-07 успешен: 65 ресурсов, 42938 метрик, 6134 cost, 21 алерт. В CostOps 6 включённых PROJECT_PROVIDER (5 из старого Neon + UI Set).
3. **Upstash ключи** — `UPSTASH_EMAIL` / `UPSTASH_API_KEY` есть; адаптер читает Management API (Basic auth).
4. **Даты токенов** — не ставим в админке. Статус и Telegram только с живого запроса (401/403 / истёкший ключ). Один подход для Neon, Vercel, Upstash.
