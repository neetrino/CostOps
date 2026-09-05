# ADR-003: Provider credentials via env refs

**Status.** Accepted  
**Date.** 2026-09-05

## Context

`ProviderAccount` needs credentials. Spec allows encrypted DB or secret manager.

## Decision

v1: `ProviderAccount.credentialRef` names an env prefix (example `NEON_PRIMARY`). Secrets stay in Vercel/env. No ciphertext in Postgres yet.

## Alternatives

- **Encrypted columns now:** Needed when many accounts per provider are edited in-app. Extra key management for one Neon org is unjustified.
- **Hardcode env names in adapters:** Breaks a second Vercel team/account.

## Consequences

Ask the developer for real keys at Phase 1. Do not commit placeholders that look like secrets. Revisit encryption when Settings grows a “paste token” flow.
