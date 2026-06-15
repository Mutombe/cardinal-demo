import { useEffect } from 'react'
import { useUIStore } from '../stores/uiStore'

export function useThemeEffect() {
  // Cardinal Properties has a single, light, editorial identity (cream + maroon),
  // mirroring the public website. The ERP does not use dark mode — force light
  // so the brand surfaces always render correctly regardless of OS preference.
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [theme])
}
