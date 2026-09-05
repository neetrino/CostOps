# ADR-004: UTC storage and UTC budget day

**Status.** Accepted  
**Date.** 2026-09-05

## Context

Providers and the current Neon app already bucket by UTC calendar day.

## Decision

Store dates and evaluate daily budgets in **UTC**. Reporting currency **USD**. Allow a configurable budget timezone later without rewriting history (new column/setting, not a silent retroactive change).

## Alternatives

- **Asia/Yerevan budget day:** Matches office hours, splits Neon history and provider invoices.
- **Per-provider timezone:** Breaks Project totals.

## Consequences

UI labels must say UTC where it matters. Midnight reset tests use UTC.
