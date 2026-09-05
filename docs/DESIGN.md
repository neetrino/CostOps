# Design and UX — Neetrino CostOps

The product is used daily by operators who decide spend in seconds. **Every screen, state, and control must be designed on purpose.** Do not ship a default admin table, leftover template chrome, or “good enough” spacing.

Visual and interaction baseline: the live Neon dashboard ([neon-neetrino.vercel.app](https://neon-neetrino.vercel.app)) and `neetrino/neon` `components/dashboard/*`. Preserve what already works; raise polish. No Figma file — the baseline plus this document are the spec.

When implementing UI, follow [`.agents/skills/figma-to-production`](../.agents/skills/figma-to-production/SKILL.md) (design analysis + browser verification), even without Figma.

---

## Intent

CostOps must feel like a **modern FinOps console**: dense enough for money, calm enough to scan, with real charts — not decoration.

The operator should always know:

1. How much are we spending (today / selected period)?
2. Is this number fresh, partial, stale, or wrong?
3. Who is near a limit, and can I change that limit in one gesture?
4. Where do I go next (project, provider, unmapped, settings)?

If a screen does not answer those without hunting, it is not done.

---

## Do not

- Drop in unstyled HTML or generic shadcn pages “to fill the route”
- Invent a second visual language that fights the Neon dashboard
- Hide freshness so `$0` looks like a real day
- Require a settings wizard to change a daily limit
- Leave empty / loading / error as a blank page or raw JSON
- Use charts without axis labels, units, or an empty-range state
- Ignore keyboard, focus rings, contrast, or tap targets
- Copy Neon 1:1 including clutter if a clearer pattern exists — **improve, do not regress**

---

## Visual system

Reuse and extend Neon tokens (CSS variables / Tailwind theme). Name new values. Do not scatter one-off hex.

| Layer | Expectation |
|-------|-------------|
| Type | Clear hierarchy: page title, KPI figure, table, meta/freshness. Tabular nums for money |
| Color | Semantic: ok / warning / over-limit / stale / error. Charts use a stable project palette (`chart-colors`) |
| Space | Consistent card padding, KPI strip rhythm, sidebar vs main |
| Motion | Short CSS transitions on hover/focus. No novelty animation |
| Density | Desktop-first dashboard; usable at 1280px; filters stay reachable on smaller widths |
| Dark/light | Follow the Neon dashboard. Do not invent a third theme |

Charts (Recharts): readable grid, legend, tooltip with USD + unit, no overlapping labels, comparison bars and usage-over-time as first-class — not an afterthought.

---

## UX rules (every screen)

Before marking a UI task done, walk this list:

| Detail | Required |
|--------|----------|
| Loading | Skeleton or explicit pending that matches layout, not a flash of empty zeros |
| Empty | Honest copy (“no sync yet” / “no projects in range”) + next action |
| Error | Human message + retry; details in logs only |
| Freshness | Visible on every cost (`partial` / `final` / `stale` / `error` / `missing`) |
| Filters | URL + optional local prefs; Current / Previous month, 1/7/30/60, custom; grouping |
| Presentation | Cards **and** list, switch preserved |
| Search | Instant filter on project/provider names |
| Limits | Inline edit, one save, same speed as Neon spend-alert field |
| Health | Sync / credential status on Overview and Integrations |
| Compare | Project and provider comparison charts where the spec asks |
| Overflow | Long names truncate with title; money never wrap into unreadability |
| Focus | Visible focus, labels on inputs, tooltips on KPI jargon |
| Dangerous | Archive / unmap confirm; sync-now not a silent double-submit |

---

## Screen bar

| Screen | Design focus |
|--------|----------------|
| Overview | Hero totals, provider/project mix, near-limit, health. Not a dump of every table |
| Projects | Cards/list with today, period, mini provider split, warning state |
| Project detail | Story of one business: total → providers → resources; charts first |
| Provider board | Neon board quality for every provider: compare, series, budgets |
| Unmapped | Obvious inbox; money still in provider totals |
| Settings / Integrations | Credential expiry, rotate links, last error — calm ops, not a form graveyard |
| Login | Same brand, no leftover template |

---

## Verification

A screenshot of the happy path is **not** enough. Exercise the flow in the browser: filter, switch cards/list, edit a limit, empty range, error, mobile width. Check every route that shares the state.

If browser tools are unavailable, say so — do not claim the UI is finished.

---

## Related

- Baseline audit: [EXISTING_NEON_AUDIT.md](./EXISTING_NEON_AUDIT.md)
- Spec screens: `Neetrino_CostOps_CURSOR_SPEC.md` §18–19, §38
- Tokens/components: `src/shared` + ported `components/dashboard`
