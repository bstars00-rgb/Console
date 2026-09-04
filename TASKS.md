# TASKS — Ohmyhotel Vendor Console Clone

## Pipeline
- [x] Original site audit (login + full authenticated shell + 10 screens)
- [x] Route inventory
- [x] Design tokens (measured from live site)
- [x] Shared components (DataGrid, FilterPanel, Pager, Select, Modal, Toast, Badge, …)
- [x] Authentication (login / language / stay-signed-in / forgot-password / logout / guard)
- [x] Booking list (11 filters, 21-col grid, selection, CSV, pagination)
- [x] Booking detail (customer/rooms/payment, status change, voucher)
- [x] Room Types / Rate Plans / Promotion
- [x] Rate & Allotment calendar
- [x] Billings (two linked grids)
- [x] Dashboard (KPIs + charts)
- [x] FAQ Board / Notice
- [x] Hotel Content list + editor (info/facilities/policies/rooms/images/validation/completeness)
- [x] localStorage persistence + demo reset
- [x] Responsive QA (1440/1280/1024/768/390 — no mobile h-overflow, e2e verified)
- [~] Visual comparison (layout + measured-token parity done; see known-differences.md)
- [x] Functional testing (Vitest 8 tests + Playwright 7 e2e — all passing)
- [x] Production build (tsc + vite, 0 errors)
- [x] GitHub Pages deployment config (workflow + relative base + HashRouter)
- [x] Push to GitHub + verify live Pages deploy
      → repo https://github.com/bstars00-rgb/Console
      → live https://bstars00-rgb.github.io/Console/ (Actions run succeeded, site verified)

## Verification snapshot
- `npm run lint` ✓ 0 warnings
- `npm run typecheck` ✓ 0 errors
- `npm run test` ✓ 8/8
- `npm run test:e2e` ✓ 7/7
- `npm run build` ✓
- Console errors in app: 0

## Status: COMPLETE
All pipeline items done. Live at https://bstars00-rgb.github.io/Console/ (auto-deploys on push to main).
