# Questions for the operator

Filled only when a decision cannot be made from the spec, TECH_CARD, or project goal (control spend, Telegram when it matters, own the history).

If this list is empty at the end of Phase 1, nothing is blocked on you.

---

## Open

1. **Vercel token expiry** — на `/integrations` поставь дату, которую выбрал при создании токена (API её не отдаёт).
2. **Vercel → проекты** — 38 строк в `/unmapped`. Сам по имени не склеиваю. Когда будет минута — разметь в инбоксе, потом лимиты Project × Vercel.
3. **Upstash → проекты** — Redis/QStash строки в `/unmapped`. По имени не склеиваю.
4. **GCP** — отложили. Проект `neetrino` создан, биллинг не привязан (лимит 5 billed-проектов). `GOOGLE_APPLICATION_CREDENTIALS` пустой. Вернёмся позже.

---

## Resolved during the run

1. **Telegram при первом sync** — first-breach по проектам выше $1 мог уйти один раз (`ead5a40`). В `d7399ff` авто-правила больше не создаются включёнными; локально отключены **42** дефолтных $1 `PROJECT_PROVIDER` rule. Повторного спама с cron не будет (не задеплоен). Лимиты включатся после migrate-from-neon или inline Set.
2. **История старого Neon** — `--apply` 2026-09-07 успешен: 65 ресурсов, 42938 метрик, 6134 cost, 21 алерт. В CostOps 6 включённых PROJECT_PROVIDER (5 из старого Neon + UI Set).
3. **Upstash ключи** — `UPSTASH_EMAIL` / `UPSTASH_API_KEY` есть; адаптер читает Management API (Basic auth).
