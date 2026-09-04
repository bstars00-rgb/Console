# UI Specification — Ohmyhotel Vendor Console Clone

> Living document. Values are **measured** from the live site via computed styles.

## Design tokens (measured)
### Color
| Role | Value | Source |
|---|---|---|
| Primary | `#EF7F29` | Buttons, active menu, logo |
| Primary hover (est.) | `#E06E18` | — |
| Ink (body text) | `#333333` | body/tabs/labels |
| Muted text | `#666666` | header links, menu items |
| Faint / placeholder (est.) | `#AAAAAA` | — |
| Surface (content) | `#FFFFFF` | main card, footer |
| Canvas (behind tabs/header) | `#F5F5F5` | workspace section |
| Sidebar | `#E4E4E4` | nav |
| Sidebar logo block | `#333333` | top-left brand block |
| Line/border | `#E0E0E0` | inputs (0.8px) |
| Grid hairline | `rgba(0,0,0,0.08)` | grid cell borders |
| Success/Warn/Danger/Info | `#2E7D32` / `#F5A623` / `#D0021B` / `#1976D2` | status badges (designed) |

### Typography
- Family **Pretendard** → `-apple-system, BlinkMacSystemFont, system-ui, Roboto,
  'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', sans-serif`.
- Base **12px**; grid data **14px**; line-height ~1.5.
- Weights: body 400, labels/buttons 500, grid headers **600**, group heading 700.

### Metrics (measured)
| Token | Value |
|---|---|
| Border radius | 5px (inputs 5px; menu search 2px) |
| Form control height | **30px** |
| Text input | 30px, border `0.8px #E0E0E0`, radius 5px, pad `0 10px` |
| Filter label width | 80px (left of control) |
| Sidebar width | **180px** |
| Sidebar logo block | 180×44 |
| Header height | **44px** |
| Tab strip height | 30px |
| Grid header row | **40px**, weight 600, centered |
| Grid data font | 14px |
| Content padding | 20px |
| Footer height | ~46px |
| Primary button | 30px, radius 5px, `#EF7F29`, white, weight 500, ~68px wide |
| Secondary button | 30px, white bg, `#333`, border `#E0E0E0` |

## Layout skeleton
```
┌──────────┬───────────────────────────────────────────────┐
│ #333 logo│ [Layout1][Layout2]        Lang ▾  Hotel ▾ ... Log out │ 44px header
│ (180px)  ├───────────────────────────────────────────────┤
│          │  [Tab][Tab][Tab×]  …                            │ 30px tabs (#F5F5F5)
│ search   ├───────────────────────────────────────────────┤
│ Vendor   │  ┌─ white content card (pad 20) ─────────────┐ │
│ • Room…  │  │ filter form (4-col: label80 + control)    │ │
│ • …      │  │ [actions right]                            │ │
│ (#E4E4E4)│  │ data grid (Kendo-style, h-scroll)          │ │
│          │  │ pager                                       │ │
│          │  └────────────────────────────────────────────┘ │
│          ├───────────────────────────────────────────────┤
│          │  footer (customer center · © · privacy · terms)│ 46px
└──────────┴───────────────────────────────────────────────┘
```

## Components (build order)
1. **Shell**: `AppShell`, `Sidebar`, `Header`, `TabWorkspace`, `Footer`.
2. **Primitives**: `Button`, `Select`(ng-select-like), `TextInput`, `DateInput`,
   `Checkbox`, `Badge`(status), `Modal`, `Toast`, `EmptyState`, `Skeleton`.
3. **Composites**: `FilterForm`, `DataGrid` (sortable, checkbox col, h-scroll,
   sticky header), `Pager`, `BoardList`.

## Screen specs → docs/original-site-audit.md (per-screen fields & columns)

## Login — SPEC LOCKED (built)
Centered ~360px white card on `#F5F5F5`; language `<select>` above; logo + uppercase
muted tagline; email, password, orange 30px submit; "Stay signed in"; muted links.
