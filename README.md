# Ohmyhotel Vendor Console — Prototype

A high-fidelity front-end prototype of the **Ohmyhotel Vendor Console** ("Ohmy Partners"),
rebuilt from a read-only audit of the live console at `https://ohmyhotel.biz`. It reproduces
the shell (sidebar, header, MDI tab workspace, footer), all ten vendor menus, and their
filters, data grids, detail views, forms, and charts — driven entirely by **mock data**
persisted in **localStorage**. No real API, credentials, or operational data are used.

> Internal prototype of a service we own and operate. Built for design/engineering reference.

## Demo login
The login is mocked — **no real authentication server is contacted**.

| Field | Value |
|---|---|
| Email | any `…@ohmyhotel.com` / `…@ohmyhotel.biz` address (e.g. `demo@ohmyhotel.biz`) |
| Password | anything non-empty (e.g. `demo1234`) |

"Stay signed in" is honoured; "Reset demo data" (account menu) restores the seed dataset.

## Tech stack
Vite · React 18 · TypeScript · React Router (**HashRouter** for GitHub Pages) ·
Tailwind CSS · Lucide React · Recharts · React Hook Form · Zod · Vitest ·
Testing Library · Playwright · localStorage persistence.

## Implemented screens
- **Auth**: login (5 languages, stay-signed-in, forgot-password/create mock), route guard, logout.
- **Bookings**: 11-field filter, 21-column grid, detail modal (customer/rooms/payment),
  status change → toast, voucher, CSV export, selection, pagination.
- **Room Types / Rate Plans / Promotion**: filter + grid (New/Copy/Bulk actions).
- **Rate & Allotment**: month calendar matrix (rate + allotment per day, month navigation).
- **Billings**: filter + two linked grids (billing list → bookings in billing) + CSV.
- **Dashboard**: KPI tiles + Recharts (reservations & ADR, status pie, revenue by hotel, room-nights trend).
- **FAQ Board / Notice**: board list + post detail (pinned notices).
- **Hotel Content**: hotel grid + full content editor — multilingual basic info, facilities,
  policies, room types, **image management** (reorder, representative, add/remove),
  completeness meter, required-field validation, save/cancel/preview → localStorage.

## Local development
```bash
npm install
npm run dev        # http://localhost:5173
```

## Quality gates
```bash
npm run lint       # ESLint (0 warnings)
npm run typecheck  # tsc --noEmit
npm run test       # Vitest unit/component tests
npm run test:e2e   # Playwright e2e (builds + previews on :4173)
npm run build      # production build → dist/
```
First Playwright run needs browsers: `npx playwright install chromium`.

## Deployment (GitHub Pages)
The app uses a **relative base** (`vite.config.ts: base './'`) and **HashRouter**, so it works
on any Pages subpath and never 404s on refresh. A workflow at
[.github/workflows/deploy.yml](.github/workflows/deploy.yml) builds and deploys on push to `main`.

1. Create a GitHub repo and push (see commands below).
2. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`; the site publishes at `https://<user>.github.io/<repo>/`.

```bash
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## Project structure
```
src/
  app/menu.ts            Menu/route source of truth
  auth/                  Mock session + route guard
  components/shell/      AppShell, Sidebar, Header, TabWorkspace, Footer, workspace state
  components/ui/         DataGrid, FilterPanel, Pager, Select, Modal, Toast, Badge, …
  data/                  Types, seed mock data, localStorage store + hooks
  pages/auth/            Login
  pages/vendor/          The ten vendor screens + detail views
docs/                    Audit, route inventory, UI spec, feature matrix, known differences
e2e/                     Playwright specs
```

## Documentation
- [docs/original-site-audit.md](docs/original-site-audit.md) — what the live console looks like.
- [docs/route-inventory.md](docs/route-inventory.md) — routes (original ↔ clone).
- [docs/ui-specification.md](docs/ui-specification.md) — measured design tokens & components.
- [docs/feature-matrix.md](docs/feature-matrix.md) — per-feature status.
- [docs/known-differences.md](docs/known-differences.md) — intentional/unavoidable differences.

## Prototype boundaries / future real-API work
- All data is mock; grids that are empty on the live test account are populated here for demonstration.
- Hotel/room photos are generated SVG placeholders (the originals are CDN-hosted).
- Auth, save/confirm/cancel/export, billing issue, and bulk actions are mocked client-side;
  a production build would wire these to the Ohmyhotel vendor APIs.
