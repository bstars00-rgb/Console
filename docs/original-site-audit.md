# Original Site Audit — Ohmyhotel Vendor Console

> Source: https://ohmyhotel.biz (product name shown in `<title>`: **"Ohmy Partners"**)
> Read-only investigation. No data is created / modified / deleted on the original.
> Status: **In progress** — login page audited; authenticated area pending user login.

## Method
- In-app browser navigated to `https://ohmyhotel.biz/vendor/booking?showAffiliate=false`.
- Site redirects unauthenticated users to `https://ohmyhotel.biz/login`.
- Computed styles read via DevTools/JS for exact color/size/spacing values.

---

## 1. Login page (`/login`)

**Layout**
- Centered card on a light grey canvas (`#F5F5F5`-ish), card is white with subtle border/shadow.
- Language selector sits **above** the card, right-aligned.
- Card contents (top → bottom): logo, tagline heading, email field, password field,
  "Log in" submit button, "Stay signed in" checkbox, divider, "Forgot your password?",
  "Don't have an account? Create one".

**Branding**
- Logo: `OHMYHOTEL&CO` wordmark with an orange citrus + green-leaf mark (≈108×74px).
- Tagline: "YOUR CONTENT, YOUR WAY, AS SIMPLE AS THAT" (uppercase, muted grey).

**Language selector** — native `<select>`, options:
`Default (account setting)` (value AUTO), `English` (EN), `한국어` (KO), `中文` (ZH),
`日本語` (JA), `Tiếng Việt` (VI).

**Measured design tokens**
| Token | Value |
|---|---|
| Font family | Pretendard → system fallbacks (Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic) |
| Base font size | 12px |
| Body text color | `#333333` |
| Muted/link text | `#888888` |
| Primary (button bg) | `#EF7F29` |
| Button text | `#FFFFFF` |
| Input/button border | `0.8px solid #E0E0E0` |
| Input & button height | 30px |
| Border radius | 5px |
| Button font | 12px / weight 500 |
| Input padding | 0 10px |

**Behaviour to replicate (mock)**
- Email + password required; submit calls auth (we mock it).
- "Stay signed in" checkbox (persist session in localStorage vs sessionStorage).
- "Forgot your password?" → password-recovery UI (mock).
- "Create one" → registration (out of scope unless present in vendor flow; mock link).

---

## 2. Authenticated area — PENDING USER LOGIN

To be audited after login:
- [ ] Full sidebar menu + submenus
- [ ] Header (logo, hotel/property selector, language, account, notifications)
- [ ] Booking list (columns, filters, search, pagination, status badges)
- [ ] Booking detail (customer/room/amount/payment/voucher/actions)
- [ ] Hotel information (basic info, address, description, facilities, policies, check-in/out)
- [ ] Room types & room detail (amenities, images)
- [ ] Image management (ordering, representative image)
- [ ] Account / profile / users / settings / notifications
- [ ] Dashboard / reports / settlement (if present)
- [ ] Empty / loading / error states
- [ ] Modals, dropdowns, toasts, date pickers
- [ ] Responsive behaviour

_This section will be filled screen-by-screen once authenticated._
