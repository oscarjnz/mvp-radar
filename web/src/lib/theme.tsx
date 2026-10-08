import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Mode = 'light' | 'dark'
interface Ctx { mode: Mode; toggle: () => void }
const ThemeCtx = createContext<Ctx>({ mode: 'dark', toggle: () => {} })

function initial(): Mode {
  try {
    const s = localStorage.getItem('mvp-radar-theme')
    if (s === 'light' || s === 'dark') return s
  } catch { /* sin almacenamiento */ }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(initial)
  useEffect(() => {
    document.documentElement.dataset.theme = mode
    try { localStorage.setItem('mvp-radar-theme', mode) } catch { /* ignorar */ }
  }, [mode])
  return <ThemeCtx.Provider value={{ mode, toggle: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')) }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
