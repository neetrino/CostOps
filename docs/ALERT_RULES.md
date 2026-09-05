# Alert rules — Neetrino CostOps

CostOps owns alerting. Providers only supply data. v1 channel: Telegram Bot API.

Preserve Neon first-breach + escalation + dedupe. Generalize the target from “Neon project” to a `BudgetRule` scope.

---

## When to evaluate

After a **successful** sync that affects the current UTC day (intraday or daily). Failed syncs do not invent `$0` and do not send “recovered to zero” alerts.

Skip evaluation when Telegram env is unset (same as Neon: log and return).

Do not alert from clearly invalid or missing cost (`error` / `missing`). `partial` current-day cost **may** alert — Neon already alerts on intraday estimates.

---

## Scopes

| Scope | Required | Spend series |
|-------|----------|--------------|
| `PROJECT_PROVIDER` | yes | Sum of CostEntry for that ProjectProvider, UTC day |
| `PROJECT_TOTAL` | optional | All providers for the project, including unmapped? **No** — project total uses mapped resources only. Unmapped spend still appears on provider/global |
| `PROVIDER_TOTAL` | optional | All CostEntry for provider key that day (includes unmapped) |
| `GLOBAL_TOTAL` | optional | All CostEntry that day |
| `RESOURCE` | future | — |

Defaults when a PROJECT_PROVIDER rule is missing after Neon migration: env `TELEGRAM_SPEND_ALERT_DEFAULT_USD` (Neon default `$1`) and `SPEND_ALERT_ESCALATION_PERCENT_OF_THRESHOLD` (30).

---

## First breach

```text
spendUsd > limitUsd  AND  no AlertEvent for (budgetRuleId, budgetDate)
```

Send Telegram. Insert:

```text
firstBreachCostUsd = spendUsd
lastNotifiedCostUsd = spendUsd
lastNotifiedAt = now
status = OPEN
```

Unique `(budgetRuleId, budgetDate)` is the dedupe lock. On `P2002`, stop (another worker already recorded the first alert).

Send **after** Telegram succeeds. If send fails, do not insert — next sync may retry. This matches Neon: failed Telegram leaves no `SpendAlertSent` row.

---

## Escalation

```text
step = limitUsd * (escalationPercent / 100)
spendUsd > lastNotifiedCostUsd + step
```

Neon helper: `escalationStepUsd(thresholdUsd, percent)`.

Example: limit `$2.00`, 30% → step `$0.60`. Alerts near `$2.01`, then `$2.61`, then `$3.21`.

Do not resend the same breach on every hourly tick.

A new UTC calendar day is a new `AlertEvent`. No carry-over of yesterday’s anchor.

---

## Dedupe key

```text
unique(budgetRuleId, budgetDate)
```

`budgetDate` = UTC date of the spend bucket, not “sent at”.

---

## Telegram content

Reuse Neon HTML escaping. Expand fields:

**Project × Provider (first)**

```text
COST ALERT

Project: Degusto
Provider: Vercel
Today: $1.08
Daily limit: $1.00
Usage: 108%

Last sync: 14:05 UTC
Status: partial current day
```

**Escalation** — include previous notified spend and step.

**Project / provider totals** — include breakdown (top providers or top projects).

Keep messages compact. Escape `<`, `>`, `&` in names.

Implementation: `NotificationChannel.send`. First class: `TelegramNotificationChannel`. Do not add Apprise/Slack in v1.

---

## Confidence

| Data state | Alert? |
|------------|--------|
| partial / fresh / final with spend > limit | yes |
| stale but last known spend > limit and already notified | no new first-breach; escalation only if spend **increased** via a successful sync |
| error / missing | no; show health error on dashboard |

---

## Tests (mandatory)

- first breach
- no duplicate first breach
- escalation step
- below step → no send
- new UTC day → new first breach
- Telegram failure → no AlertEvent row
- P2002 race → no second send
- PROJECT_TOTAL / PROVIDER_TOTAL / GLOBAL_TOTAL independently
- ignored/unmapped handling documented per scope
