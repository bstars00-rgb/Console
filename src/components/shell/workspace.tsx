/**
 * MDI tab-workspace state: which menu tabs are open, synced with the router.
 * Navigating to a /vendor/* route opens its tab; closing a tab navigates to a
 * neighbour. Open tabs persist to localStorage so a refresh restores them.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { VENDOR_MENU, menuByPath, DEFAULT_PATH, type MenuEntry } from '../../app/menu'
import { readJSON, writeJSON } from '../../lib/storage'

interface WorkspaceCtx {
  openKeys: string[]
  activeKey: string | null
  openTab: (key: string) => void
  closeTab: (key: string) => void
}

const Ctx = createContext<WorkspaceCtx | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useWorkspace(): WorkspaceCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useWorkspace outside provider')
  return c
}

const OPEN_KEY = 'openTabs'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const active = menuByPath(location.pathname)
  const [openKeys, setOpenKeys] = useState<string[]>(() => {
    // Dedupe defensively — stored state from older sessions may contain repeats,
    // and duplicate tab keys would break React's list rendering.
    const stored = [...new Set(readJSON<string[]>(OPEN_KEY, []))].filter((k) => VENDOR_MENU.some((m) => m.key === k))
    return stored.length ? stored : active ? [active.key] : ['booking']
  })

  useEffect(() => writeJSON(OPEN_KEY, openKeys), [openKeys])

  // Ensure the current route has an open tab. Functional + idempotent so a
  // double render (StrictMode) or rapid navigation can't append a duplicate key.
  useEffect(() => {
    if (!active) return
    setOpenKeys((keys) => (keys.includes(active.key) ? keys : [...keys, active.key]))
  }, [active])

  const openTab = useCallback(
    (key: string) => {
      const entry = VENDOR_MENU.find((m) => m.key === key)
      if (!entry) return
      setOpenKeys((keys) => (keys.includes(key) ? keys : [...keys, key]))
      navigate(entry.path)
    },
    [navigate],
  )

  const closeTab = useCallback(
    (key: string) => {
      setOpenKeys((keys) => {
        const idx = keys.indexOf(key)
        const next = keys.filter((k) => k !== key)
        // If closing the active tab, navigate to a neighbour (or default).
        if (active?.key === key) {
          const fallback = next[idx] ?? next[idx - 1] ?? next[next.length - 1]
          const entry: MenuEntry | undefined = VENDOR_MENU.find((m) => m.key === fallback)
          navigate(entry ? entry.path : DEFAULT_PATH)
        }
        return next
      })
    },
    [active, navigate],
  )

  const value = useMemo(
    () => ({ openKeys, activeKey: active?.key ?? null, openTab, closeTab }),
    [openKeys, active, openTab, closeTab],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
