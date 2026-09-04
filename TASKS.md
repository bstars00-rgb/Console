# TASKS — Ohmyhotel Vendor Console Clone

## Pipeline
- [~] Original site audit — login page done; authenticated area blocked on user login
- [ ] Route inventory
- [ ] Design tokens — seeded from login page, refine after audit
- [ ] Shared components
- [ ] Authentication (login / language / stay-signed-in / forgot-password / logout)
- [ ] Booking list
- [ ] Booking detail
- [ ] Hotel information
- [ ] Room management
- [ ] Facilities and policies
- [ ] Image management
- [ ] Account / settings
- [ ] Responsive QA (1440 / 1280 / 1024 / 768 / 390)
- [ ] Visual comparison (pixel-diff loop)
- [ ] Functional testing (Vitest + Playwright)
- [ ] GitHub Pages deployment

## Legend
- [ ] todo · [~] in progress · [x] done

## Per-screen loop
Implement → lint+typecheck → functional test → visual compare vs original →
fix diffs → update TASKS + feature-matrix → next screen.

## Current blocker
Authenticated audit requires the user to log into the Browser pane. Until then:
scaffold + login page + design system foundations proceed.
