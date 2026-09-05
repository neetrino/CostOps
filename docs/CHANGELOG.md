# Changelog

## Unreleased

### Phase 0 — 2026-09-05

- Recorded project size **B**
- Added CostOps product documentation and ADRs
- Adapted Cursor rules for Size B / Next.js (not NestJS)
- Audited `neetrino/neon` and wrote the migration map
- TECH_CARD confirmed (Node 24, Next 16, Prisma 7, pool/timeouts, coverage)
- Neon env contract aligned with `neetrino/neon`: `NEON_API_KEY`, `NEON_ORG_ID` only
- Credential rotation requirement: admin + Telegram, per-provider create-token links (`docs/CREDENTIAL_ROTATION.md`)
- `OLD_NEON_PROJECT_DATABASE_URL` documented as read-only hose from neetrino/neon
- Design/UX bar: `docs/DESIGN.md` (every state designed; browser-verify)
