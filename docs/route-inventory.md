# Route Inventory — Ohmyhotel Vendor Console

> Status: **In progress**. Known routes from unauthenticated observation below;
> authenticated routes to be filled after login.

## Original site routes (observed)
| Original URL | Screen | Notes |
|---|---|---|
| `/login` | Login | Redirect target when unauthenticated |
| `/vendor/booking?showAffiliate=false` | Booking list | Requested entry point; requires auth |

## Original site routes (to confirm after login)
_Pending — will record every sidebar/tab URL and query-param pattern._

## Clone routes (HashRouter — GitHub Pages safe)
> Mirrors original paths under a hash so refresh never 404s on Pages.

| Clone route | Screen |
|---|---|
| `#/login` | Login |
| `#/vendor/booking` | Booking list |
| `#/vendor/booking/:id` | Booking detail |
| _…to be expanded to match the original after audit_ | |
