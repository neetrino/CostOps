# ADR-006: Installable PWA without next-pwa

**Status.** Accepted  
**Date.** 2026-09-12

## Context

Operators open CostOps daily on a laptop and phone. TECH_CARD 2.11 originally marked PWA as not needed. An explicit task asked for a standard installable PWA.

The dashboard is session-gated. A service worker that caches HTML or `/api` would risk stale spend figures or leaking a previous session shell.

## Decision

Use the Next.js App Router Metadata Route (`src/app/manifest.ts`) plus a root `public/sw.js`. Register the worker only in production builds. The worker is network-first for navigations and never intercepts `/api/*`. `/offline` is a public fallback page.

No `next-pwa`, `@serwist/next`, or extra PWA runtime dependency.

## Alternatives

- **next-pwa / Serwist.** Richer precache, more App Router and auth-cache risk, extra dependency.
- **Manifest only.** Installable in some Chromes, weaker “standard PWA” (no fetch handler).

## Consequences

The request gate allowlists `/sw.js`, `/manifest.webmanifest`, and `/offline`. Bump `CACHE_NAME` in `public/sw.js` when worker behavior changes.

Chrome no longer shows a default install bar. CostOps captures `beforeinstallprompt` and renders an Install / Not now banner (iOS Safari gets a Share hint). Dismiss is stored in `costops.installBanner.dismissed`.
