# ADR-002: Next.js fullstack on Vercel

**Status.** Accepted  
**Date.** 2026-09-05

## Context

Need an app host that can reuse `neetrino/neon` and run cron.

## Decision

One Next.js App Router app. Route Handlers for API. Vercel Cron for the scheduler. No NestJS, no separate worker in v1.

## Alternatives

- **NestJS + Next:** Clear API process, but doubles deploy and blocks copy-paste of Neon routes/UI.
- **Queue worker now:** Future-proof, unnecessary until cron timeouts or fan-out hurt.

## Consequences

Adapters stay framework-agnostic so a worker can be added later. Cron routes stay secret-gated.
