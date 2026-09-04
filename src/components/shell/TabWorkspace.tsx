import { X } from 'lucide-react'
import { VENDOR_MENU } from '../../app/menu'
import { useWorkspace } from './workspace'

/** MDI tab strip: one tab per open menu; active tab connects to the content. */
export function TabWorkspace() {
  const { openKeys, activeKey, openTab, closeTab } = useWorkspace()
  const tabs = openKeys
    .map((k) => VENDOR_MENU.find((m) => m.key === k))
    .filter((m): m is (typeof VENDOR_MENU)[number] => !!m)

  return (
    <div className="flex h-tabbar items-end gap-0.5 overflow-x-auto bg-canvas px-2 pt-1">
      {tabs.map((t) => {
        const active = t.key === activeKey
        return (
          <div
            key={t.key}
            className={`group flex h-[26px] shrink-0 cursor-pointer items-center gap-1.5 rounded-t border border-b-0 px-3 text-base ${
              active
                ? 'border-line bg-white font-medium text-ink'
                : 'border-transparent bg-line-soft/60 text-muted hover:bg-line-soft'
            }`}
            onClick={() => openTab(t.key)}
          >
            <span>{t.tabLabel}</span>
            <button
              aria-label={`Close ${t.tabLabel}`}
              onClick={(e) => {
                e.stopPropagation()
                closeTab(t.key)
              }}
              className="text-faint hover:text-danger"
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
