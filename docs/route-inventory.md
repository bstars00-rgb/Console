# Route Inventory — Ohmyhotel Vendor Console

> Product title: **"Ohmy Partners"**. Framework: Angular SPA, Kendo-style data grids,
> `ng-select` dropdowns. Authenticated area uses an **MDI tab workspace**: each sidebar
> menu opens a closable tab AND navigates to a `/vendor/*` route.

## Original routes (authenticated) — confirmed
| Sidebar label | Original URL | Tab label | Screen kind |
|---|---|---|---|
| Room Type | `/vendor/room-types` | Room Types | Filter + grid |
| Rate plan | `/vendor/rate-plans` | Rate Plans | Filter + grid (+New Plan/Copy) |
| Rate & Allotment | `/vendor/rate-allotment` | Rate & Allotment | Filter + **month calendar matrix** |
| Promotion | `/vendor/promotion` | Vendor Promotion | Filter + grid (+New/Copy/Bulk) |
| Bookings | `/vendor/booking` | Bookings | Filter + wide grid (21 cols) |
| Billings | `/vendor/billing` | Vendor Billings | Filter + **two linked grids** |
| Dashboard | `/vendor/dashboard` | Dashboard | KPIs + **charts** (Excel/Pdf) |
| FAQ Board | `/vendor/faq` | FAQ Board | Board list + post detail |
| Notice | `/vendor/notice` | Notice Board | Board list + post detail (modal) |
| Hotel Content | `/vendor/hotel-content` | Hotel Content | Filter + grid (hotel content status) |

Unauthenticated: `/login` (redirect target).

## Clone routes (HashRouter — GitHub Pages safe)
Mirrors the original `/vendor/*` paths under a hash so refresh never 404s on Pages.

| Clone route | Screen |
|---|---|
| `#/login` | Login |
| `#/vendor/room-types` | Room Types |
| `#/vendor/rate-plans` | Rate Plans |
| `#/vendor/rate-allotment` | Rate & Allotment |
| `#/vendor/promotion` | Promotion |
| `#/vendor/booking` | Bookings |
| `#/vendor/billing` | Billings |
| `#/vendor/dashboard` | Dashboard |
| `#/vendor/faq` | FAQ Board |
| `#/vendor/notice` | Notice |
| `#/vendor/hotel-content` | Hotel Content |

The clone reproduces the MDI tab workspace: opening a menu adds a tab; tabs are
closable; the active tab reflects the current route.
