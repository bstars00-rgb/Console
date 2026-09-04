/**
 * Single source of truth for the Vendor menu: sidebar label, workspace tab label,
 * and route path. Mirrors the original console's `/vendor/*` structure.
 */
export interface MenuEntry {
  key: string
  /** Label shown in the sidebar. */
  label: string
  /** Label shown on the workspace tab (matches the original's tab titles). */
  tabLabel: string
  /** Route path (under HashRouter). */
  path: string
}

export const VENDOR_MENU: MenuEntry[] = [
  { key: 'room-types', label: 'Room Type', tabLabel: 'Room Types', path: '/vendor/room-types' },
  { key: 'rate-plans', label: 'Rate plan', tabLabel: 'Rate Plans', path: '/vendor/rate-plans' },
  { key: 'rate-allotment', label: 'Rate & Allotment', tabLabel: 'Rate & Allotment', path: '/vendor/rate-allotment' },
  { key: 'promotion', label: 'Promotion', tabLabel: 'Vendor Promotion', path: '/vendor/promotion' },
  { key: 'booking', label: 'Bookings', tabLabel: 'Bookings', path: '/vendor/booking' },
  { key: 'billing', label: 'Billings', tabLabel: 'Vendor Billings', path: '/vendor/billing' },
  { key: 'dashboard', label: 'Dashboard', tabLabel: 'Dashboard', path: '/vendor/dashboard' },
  { key: 'faq', label: 'FAQ Board', tabLabel: 'FAQ Board', path: '/vendor/faq' },
  { key: 'notice', label: 'Notice', tabLabel: 'Notice Board', path: '/vendor/notice' },
  { key: 'hotel-content', label: 'Hotel Content', tabLabel: 'Hotel Content', path: '/vendor/hotel-content' },
]

export const DEFAULT_PATH = '/vendor/booking'

export function menuByPath(pathname: string): MenuEntry | undefined {
  // Match on the menu's base path (detail routes live under a menu path).
  return VENDOR_MENU.find((m) => pathname === m.path || pathname.startsWith(m.path + '/'))
}
