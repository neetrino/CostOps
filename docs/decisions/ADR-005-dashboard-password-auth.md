# ADR-005: Dashboard password session

**Status.** Accepted  
**Date.** 2026-09-05

## Context

Internal single-org tool. Neon already ships password + httpOnly JWT + middleware.

## Decision

Reuse that gate. Production must set `DASHBOARD_PASSWORD` and `JWT_SECRET`. Cron and health stay bearer/public as today.

## Alternatives

- **Auth.js + GitHub:** Better identity, more setup, no current user table.
- **Clerk:** Extra vendor for a password door.
- **Vercel Deployment Protection only:** Weaker API story for same-origin fetches.

## Consequences

No RBAC, no password-reset flow. argon2 user hashes are N/A. Rate-limit login.
