# CostOps start checklist

- [x] Repository opened from the rules template
- [x] Spec read (`docs/Neetrino_CostOps_CURSOR_SPEC.md`)
- [x] Project size set: **B**
- [x] `docs/BRIEF.md` filled
- [x] `docs/TECH_CARD.md` confirmed
- [x] Architecture and Phase 0 docs written
- [x] `.env.example` matches Neon names (`NEON_API_KEY`, `NEON_ORG_ID`)
- [x] Local `.env` remapped to those names
- [x] `OLD_NEON_PROJECT_DATABASE_URL` documented (read-only old Neon DB)
- [x] `docs/DESIGN.md` — UI/UX bar
- [x] Phase 1 foundation — Next.js 16, Prisma 7 schema, auth, CI
- [ ] Quality: branch protection + migrate-on-deploy job (when deploying)

After TECH_CARD confirmation, implementation may start from `docs/IMPLEMENTATION_PLAN.md` Phase 1.
