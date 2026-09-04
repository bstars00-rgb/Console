# Feature Matrix — Ohmyhotel Vendor Console Clone

Status: `Not inspected` · `Inspected` · `Implementing` · `Implemented` ·
`Visually verified` · `Functionally verified`.

| # | Area | Feature | Status |
|---|------|---------|--------|
| 1 | Auth | Login screen | Implemented |
| 2 | Auth | Language selection (5 langs) | Implemented |
| 3 | Auth | Stay signed in | Implemented |
| 4 | Auth | Forgot password UI | Implemented |
| 5 | Auth | Logout | Inspected |
| 6 | Auth | Auth-state mock + route guard | Implemented |
| 7 | Shell | Sidebar (logo, menu search, menu) | Inspected |
| 8 | Shell | Header (Layout1/2, lang, account, change pw, logout) | Inspected |
| 9 | Shell | MDI tab workspace (open/close/active) | Inspected |
| 10 | Shell | Footer | Inspected |
| 11 | Shell | Login-time notice modal | Inspected |
| 12 | Bookings | Filter form (11 fields) | Inspected |
| 13 | Bookings | Data grid (21 cols) + h-scroll | Inspected |
| 14 | Bookings | Search / Reset | Inspected |
| 15 | Bookings | Booking-date & stay-date filters | Inspected |
| 16 | Bookings | Status filter + badges | Inspected |
| 17 | Bookings | Booking detail | Inspected |
| 18 | Bookings | Status change (mock) → toast | Inspected |
| 19 | Bookings | Voucher UI | Inspected |
| 20 | Bookings | Excel export (mock) | Inspected |
| 21 | Bookings | Pagination / sort | Inspected |
| 22 | Room Types | Filter + grid | Inspected |
| 23 | Rate Plans | Filter + grid + New/Copy | Inspected |
| 24 | Rate & Allotment | Month calendar matrix | Inspected |
| 25 | Promotion | Filter + grid + New/Copy/Bulk | Inspected |
| 26 | Billings | Filter + two linked grids | Inspected |
| 27 | Dashboard | KPIs + charts (Recharts) | Inspected |
| 28 | FAQ Board | Board list + detail | Inspected |
| 29 | Notice | Board list + detail modal | Inspected |
| 30 | Hotel Content | Filter + grid (hotel status) | Inspected |
| 31 | Hotel Content | Hotel basic info / address / contact | Inspected |
| 32 | Hotel Content | Description / facilities / policies / check-in-out | Inspected |
| 33 | Hotel Content | Room types & amenities | Inspected |
| 34 | Hotel Content | Image management (reorder, representative) | Inspected |
| 35 | Hotel Content | Content completeness + save/cancel/preview + validation | Inspected |
| 36 | Common | Language change (header) | Inspected |
| 37 | Common | Account / profile / corporation | Inspected |
| 38 | Common | Change password | Inspected |
| 39 | Common | Persist to localStorage + reset demo | Implementing |
| 40 | Common | Responsive behaviour | Not inspected |

> Note: Hotel Content detail/editing forms (rows 31–35) were not click-openable on the
> test account (Kendo grid, cursor:default). The clone implements a realistic
> hotel-content editor (basic info, facilities, policies, rooms, images) consistent with
> the audited list columns and standard OTA extranet conventions; documented in
> docs/known-differences.md.
