# Quality automation plan

Applied during Phase 1 scaffold. Do not add a failing `ci.yml` before `package.json` scripts exist.

---

## Local (Phase 1)

| Tool | Role |
|------|------|
| Prettier | `pnpm format` / `format:check` |
| ESLint | `pnpm lint` |
| TypeScript | `pnpm typecheck` |
| Vitest | `pnpm test` |
| Husky | pre-commit: lint-staged; commit-msg: commitlint |
| Prisma | `pnpm db:migrate:deploy` in CI job only for prod |

---

## GitHub Actions

Copy `docs/reference/workflows/ci-quality.yml.example` → `.github/workflows/ci.yml` and set:

- `NODE_VERSION`: `24`
- `PNPM_VERSION` to the repo `packageManager`

Jobs: format, lint, typecheck, test, build. Audit job non-blocking at high.

Migrate-on-deploy: follow `setup-production-migrations` + `docs/reference/workflows/production-database-migrations.md`. `DIRECT_URL` only in that job.

---

## Human (developer)

- Branch protection on `main` (required CI) — **done 2026-09-07:** ruleset `main` requires the GitHub Actions check **Quality checks** (format, Prisma validate, lint, typecheck, test, build). Audit stays informational.
- Secret scanning
- Dependabot: GitHub Actions + npm

---

## Coverage

Confirmed: 80% statements on `src/core/**` + neon pricing + alerts; 70% overall.
