# Repository guidance

This repository is **Neetrino CostOps**, an internal multi-provider FinOps platform. Keep product documentation and Agent-system concerns separate.

**Size B** is recorded in `docs/TECH_CARD.md`. Do not rerun project onboarding unless the team explicitly restarts it. Do not modify the reference app `neetrino/neon`.

## Before substantial work

1. Read the explicit user task and preserve its scope.
2. Read `docs/TECH_CARD.md` and `docs/01-ARCHITECTURE.md`.
3. For domain work, read the matching doc: adapter contract, alert rules, data model, or Neon migration map.
4. Preserve the existing architecture and approved project decisions.
5. `docs/TECH_CARD.md` is confirmed. Implement from `docs/IMPLEMENTATION_PLAN.md`.

## Instruction locations

```text
Product documentation
→ docs/

Cursor coding standards
→ .cursor/rules/

Reusable workflows
→ .agents/skills/

Skill catalog and profiles
→ .agents/catalog/

Agent-system documentation
→ .agents/system/
```

Use the applicable Rule or Skill instead of copying its full content into this file.

## Decision precedence

```text
explicit approved task
→ approved TECH_CARD
→ existing project implementation
→ template recommendation
→ generic fallback
```

Preserve the existing implementation unless the approved task or TECH_CARD explicitly requires a migration or replacement.

## Working boundaries

- Do not change architecture, stack, public APIs, database schema, or business behavior outside the approved task.
- Do not perform production deployment.
- Do not perform production database migrations.
- Do not delete data.
- Do not commit or push without an explicit request.
- Do not hide or bypass test, lint, build, or validation failures.
- Do not weaken security controls to make a check pass.
- Preserve unrelated user changes and keep edits scoped.
- After meaningful changes, run project-appropriate validation and use `.agents/skills/verify-before-completion/`.

Report checks that were not run and any remaining uncertainty instead of claiming unsupported success.
