# ADR-003: Provider credentials via env

**Status.** Accepted  
**Date.** 2026-09-05

## Context

`ProviderAccount` needs credentials. Spec allows encrypted DB or secret manager. The Neon baseline already uses `NEON_API_KEY` and `NEON_ORG_ID`. A prefix scheme (`NEON_PRIMARY_*`) duplicated those names and did not match the live project.

## Decision

v1 reads the **same env names as `neetrino/neon`**:

```text
NEON_API_KEY
NEON_ORG_ID
NEON_PRICING_PLAN
```

`ProviderAccount.credentialRef` for the first Neon org is `NEON` (documentation label only). It does not invent a second pair of variables.

Vercel (Phase 2): `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`.

Secrets stay in env / Vercel. No ciphertext in Postgres in v1.

`NEON_PERSONAL_API_KEY` is not a CostOps contract. The Neon app does not read it; only the org Console key (`NEON_API_KEY`) is used for consumption sync.

## Alternatives

- **Prefix family (`NEON_PRIMARY_*`):** Useful only with several accounts per provider. Rejected for v1 — one Neon org, copy-paste from the existing `.env`.
- **Encrypted columns now:** Extra key management for one org.

## Consequences

Copy the Neon project env block as-is. Add a second env pair only when a second ProviderAccount exists.
