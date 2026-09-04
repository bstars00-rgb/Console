# Known Differences — Clone vs Original

Intentional or unavoidable differences, with reason and scope. The clone reproduces the
original's structure, layout, and measured design tokens; the differences below are the
deliberate consequences of building a self-contained, data-safe prototype.

| # | Area | Difference | Reason | Scope |
|---|------|-----------|--------|-------|
| 1 | Data | Grids are populated (34 bookings, 3 hotels, 9 room types, billings, 9 notices) | The live *test* account has mostly empty grids; the clone ships realistic mock data so every screen is demonstrable | All grid screens |
| 2 | Images | Hotel/room photos are generated SVG placeholders | Original photos are CDN-hosted operational assets we don't copy; keeps the app self-contained & offline | Hotel Content, room cards, voucher |
| 3 | Auth | Login accepts any `@ohmyhotel.*` email / non-empty password | No real auth server is contacted (safety + prototype) | Login |
| 4 | Actions | Save / confirm / cancel / billing-issue / export / bulk are mocked client-side | No write access to real systems; state persists to localStorage instead | All screens |
| 5 | Hotel Content detail | The **"Hotel Master" popup** (dark title bar; Basic / Description / Photo tabs) reproduces the original modal from a captured screenshot. Basic fields, layout, managed read-only Country/Province/Region, Additional Region chips, and values match. Fields below the visible fold and the exact Description/Photo tab contents are a reasonable reconstruction pending a full capture. Country/Province/Region are read-only ("Managed by Ohmyhotel"), as in the original | Hotel Content |
| 6 | Fonts | Pretendard loaded from a public CDN | Same family as the original; sub-pixel rendering may differ per OS/browser | Global |
| 7 | Layout presets | "Layout 1 / Layout 2" are visual icon toggles only | Their exact behaviour wasn't exercised during the read-only audit | Header |
| 8 | Charts | Dashboard uses Recharts with computed mock KPIs | Original chart internals weren't inspected; the clone shows equivalent reservation/ADR/revenue visualisations | Dashboard |
| 9 | i18n | Full UI translation is limited to login + language plumbing; screens are English | Scope: demonstrate the language selector the original offers without translating every screen | Global |
| 10 | Support chat | Static launcher button (no live chat) | Third-party live widget not reproduced | Global |

## Visual comparison notes
The in-app browser renders the 1440×900 viewport scaled to an 800px capture, so pixel-diff
was performed at layout scale. Structural fidelity (sidebar 180px `#E4E4E4` + dark logo block,
44px header, 30px tab strip, white content, filter panel, 40px/weight-600 grid headers,
`#EF7F29` primary, 12px base / 14px grid) was matched against **measured computed styles**
from the live site rather than screenshot diffing alone, which is more precise for tokens.
