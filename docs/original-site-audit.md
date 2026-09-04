# Original Site Audit — Ohmyhotel Vendor Console ("Ohmy Partners")

> Source: https://ohmyhotel.biz · Read-only investigation (no data created/modified/deleted).
> Tech observed: **Angular** SPA, **Kendo-style** data grids, **ng-select** dropdowns,
> **Pretendard** font. Authenticated test account: "Tracy Test Hotel" (single hotel:
> *Hoa Binh Independence Hotel*, code 1001097). Most grids are empty for this account —
> the clone ships realistic mock data.

## App shell (all authenticated screens)

### Sidebar — 180px, bg `#E4E4E4`
- **Logo block** top: 180×44px, bg **`#333`**, white `OHMYHOTEL&CO` mark.
- **Menu search**: white input, 30px, radius 2px, left search icon, placeholder "Enter Menu name".
- **"Vendor"** group heading (bold, 12px).
- **Menu items** (10), 12px, ~24px row pitch, indent 38px:
  Room Type · Rate plan · Rate & Allotment · Promotion · Bookings · Billings ·
  Dashboard · FAQ Board · Notice · Hotel Content.
  - inactive text `#666`; **active text `#EF7F29`** (orange, no bg highlight).

### Header bar — right of sidebar, 44px, transparent over `#F5F5F5`
- Left: **Layout 1 / Layout 2** icon buttons (34×28) — saved layout presets.
- Right cluster (12px, `#666`): **Language** dropdown (English/한국어/中文/日本語/Tiếng Việt),
  **hotel/account** dropdown ("Tracy Test Hotel" → User Info, Corporation Profile),
  **Change password**, **Log out**.

### Tab workspace — 30px tall tab strip on `#F5F5F5`
- Each open menu = a tab (radio-selected active state) + a **Close (×)** button.
- Active tab connects to the white content area below; content is a white card.

### Content area — white, 20px padding
- Standard pattern: **filter form** → **action buttons** → **data grid** → **pager**.
- Pager: first/prev/next/last + page-size (`Select×20`) + "N - M of X items".

### Footer — white, ~46px
- "Customer Center : +82-2-733-0550 (Weekday 09:00 ~ 18:00 except holidays / UTC +09:00)"
- "© 2025 OHMYHOTEL GLOBAL PTE. LTD. All rights reserved." · Privacy Policy · Terms & Condition.

### Login-time modal
- "Notice Regarding Transfer of Personal Information Due to Asset Transfer" popup
  (PDF link, "Don't show again", Close) — appears over Bookings/Dashboard.

## Screens

### Bookings (`/vendor/booking`)
- Note strip: "Payment Period: In every 15 Days (30)".
- **Filter (4-col grid, label 80px + control)**: Booking-Date-type select + date range
  (YYYY-MM-DD ~ YYYY-MM-DD, calendar pickers); Hotel select; Hotel CNFM No.; Traveler Name;
  BKG Status; Contract Type; ELLIS Booking Code; V.Currency; Payment status; Balance ≠ 0
  checkbox; **Search / Reset** (top-right).
- Actions: **Billing Issue**, **Excel**.
- **Grid (21 cols)**: ☑ · ELLIS Booking Code · Hotel CNFM No. · Booking Status · Hotel Name ·
  1st Traveler Name · Check-in Date / Nts · Room Type / Count · Plan Name · Meal Type ·
  Free Breakfast · Booking Date · Booking Cancel Date · V.Payment Status · V.Currency ·
  V.Sum Amt · Billing No. · Dispute · Dispute Remark · Contract Type · Old Booking Code.
- Footer sums: "Selected Billing Sum Amount", "Total Billing Sum Amount".
- Empty state: "No records available."

### Room Types (`/vendor/room-types`)
- Filter: Hotel · Room Type · CMS/PMS Room Type Code · Open Sales(All/Yes) · Data status · Local Price.
- Grid: ☑ · Room Type SEQ · ELLIS Room Type Code · CMS/PMS Info · Data Status · Local Price ·
  Room Type Name(EN) · Open Sales.

### Rate Plans (`/vendor/rate-plans`)
- Filter: Hotel · Room Type · Plan SEQ · CMS/PMS · CMS/PMS Plan Code · Plan Name ·
  Contract Type · Open Sales · Room Charge · Data status.
- Actions: Search · Reset · **New Plan** · **Copy**.
- Grid: ☑ · Room Type SEQ · ELLIS Room Type Code · CMS Room Type Code · Room Type Name(EN) ·
  Plan SEQ · ELLIS Room Plan Code · CMS Plan Code · Data Status · Room Charge ·
  Plan Name(EN/KO/JA/VI/ZH) · Open Sales.

### Rate & Allotment (`/vendor/rate-allotment`)
- Filter: Hotel · Contract Type · Room Type · On Sale Only · Has Price Only · Has Allotment Only.
- Actions: Search · Reset · Hide All · Allotment Only · Release All · **Last month / Next Month**.
- **Month calendar matrix**: weekday/day columns (Tue1 Wed2 …), rows per room-type/plan showing
  rate + allotment per day ("Rate Allotment Detail").

### Promotion (`/vendor/promotion`)
- Filter: Hotel · Room Type · Promotion Type · Promotion SEQ · Plan SEQ · Open Sales · Contract Type.
- Actions: Search · Reset · **New** · **Copy** · **Bulk Update**.
- Grid: ☑ · Room Type SEQ · ELLIS/CMS Room Type Code · Room Type Name(EN) · Plan SEQ ·
  ELLIS/CMS Plan Code · Plan Name(EN) · Promotion SEQ · ELLIS/CMS Promotion Code ·
  Promotion Type · Promotion Name(EN) · BKG From~To Date · CI From~To Date · Applied Value · Open Sales.

### Billings (`/vendor/billing`)
- Filter: Billing Issued Date (range) · Paid Date (range) · Payment Status · Billing No. · Currency · Balance.
- Actions: Search · Reset · **Delete** · **Remove Booking** · **Excel**.
- **Grid 1 (Billing list)**: ☑ · Billing No. · Hotel Name · Issued Date · Payment Status ·
  Paid Date · Vendor Currency · Vendor Sum Amount · Paid Amount · Balance.
- **Grid 2 (bookings in billing)**: Booking Item Code · Booking Status · V. BKG Code · V. CNFM No. ·
  Hotel Name · Traveler · C/I · C/O · Nts · V. Cur · V. Sum Amt · Paid Amt · Balance · Dispute · Dispute Remark.

### Dashboard (`/vendor/dashboard`)
- Filter: Hotel · Booking-Date-type · period (Current Month / date range) · year · currency.
- **KPI tiles** + **charts** (6 canvases: "Reservations & ADR", "Total reservations", …).
- Actions: Search · **Excel** · **Pdf**. "Last updated on 2026-09-04 14:30:00".

### FAQ Board (`/vendor/faq`)
- Filter: type select + keyword. Grid: Post SEQ · FAQ Type · Post Title · Last Update Date ·
  View Counts · Attached File. (e.g. 200343 · Booking · "Test FAQ" · 665 views.)

### Notice (`/vendor/notice`)
- Filter: type + keyword. Grid: Post SEQ · Pin to top · Post Title · First Insert Time ·
  View Counts · Attached File. 9 notices (pinned rows first). Row → notice detail modal.

### Hotel Content (`/vendor/hotel-content`)
- Filter: Hotel select · Search · Reset.
- Grid: Code · Grade · Hotel Name(EN/KO/JA/VI/ZH) · Status · Hotel Type · Phone No. · Country ·
  Region Name · Region Code · Areas · First Insert User/Time · Last Update User/Time.
- Real row: 1001097 · Hoa Binh Independence Hotel · Approved · Hotel · Palau · Airai · …

## Measured tokens → see ui-specification.md
