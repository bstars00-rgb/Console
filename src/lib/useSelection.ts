import { useState } from 'react'

/** Row-selection state for grids with a checkbox column. */
export function useSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  return {
    selected,
    setSelected,
    toggle: (k: string) =>
      setSelected((s) => {
        const n = new Set(s)
        if (n.has(k)) n.delete(k)
        else n.add(k)
        return n
      }),
    toggleAll: (keys: string[], checked: boolean) => setSelected(checked ? new Set(keys) : new Set()),
    clear: () => setSelected(new Set()),
  }
}
