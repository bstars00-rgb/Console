# UI Specification — Ohmyhotel Vendor Console Clone

> Living document. Seeded from the login page; expanded from authenticated screens.

## Design tokens (measured)
### Color
| Role | Value |
|---|---|
| Primary | `#EF7F29` |
| Primary hover (est.) | `#E06E18` |
| Primary light (est.) | `#FDF0E6` |
| Ink (body text) | `#333333` |
| Muted text | `#888888` |
| Faint text (est.) | `#AAAAAA` |
| Surface | `#FFFFFF` |
| Canvas | `#F5F5F5` |
| Line/border | `#E0E0E0` |
| Line soft (est.) | `#EEEEEE` |
| Success (est.) | `#2E7D32` |
| Warning (est.) | `#F5A623` |
| Danger (est.) | `#D0021B` |
| Info (est.) | `#1976D2` |

_(est.) = provisional, to be confirmed against authenticated screens._

### Typography
- Family: **Pretendard** with `-apple-system, BlinkMacSystemFont, system-ui, Roboto,
  'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif`.
- Base size **12px**, line-height ~1.5.
- Button/label weight 500; body 400.

### Metrics
| Token | Value |
|---|---|
| Border radius | 5px |
| Form control height | 30px |
| Input padding | 0 10px |
| Header height (est.) | 48px |
| Sidebar width (est.) | 220px |

## Components (to build)
App shell · Header · Sidebar · Breadcrumb · Page title · Tabs · Search field ·
Filter controls · Data table · Status badge · Pagination · Dropdown · Date picker ·
Modal · Drawer · Toast · Loading skeleton · Empty state · Error state · Confirm dialog.

## Screens
### Login — SPEC LOCKED
Centered white card (~360px wide) on grey canvas; language `<select>` above card,
right-aligned. Logo, uppercase muted tagline, email, password, full-width orange
submit (30px, radius 5), "Stay signed in" checkbox, muted links below.

### Authenticated screens — PENDING
_Filled after login audit._
