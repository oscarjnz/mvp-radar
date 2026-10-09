import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

/** Premio que se está viendo. Las páginas de carrera, historial, criterios y revisión del voto cambian de contenido con él. */
export type AwardId = 'mvp' | 'cy'

const KEY = 'mvpradar.award'

export const AWARDS: Record<AwardId, {
  id: AwardId
  short: string
  full: string
  /** Etiqueta para el menú */
  race: string
  /** Sufijo de los archivos de datos */
  suffix: string
  /** Nombre del ganador en el historial: "MVP" o "Cy Young" */
  winner: string
}> = {
  mvp: { id: 'mvp', short: 'MVP', full: 'MVP', race: 'Carrera al MVP', suffix: '', winner: 'MVP' },
  cy: { id: 'cy', short: 'Cy Young', full: 'Cy Young', race: 'Carrera al Cy Young', suffix: '_cy', winner: 'Cy Young' },
}

const parse = (v: string | null | undefined): AwardId | null => (v === 'cy' || v === 'mvp' ? v : null)

function readStored(): AwardId {
  try {
    return parse(window.localStorage.getItem(KEY)) ?? 'mvp'
  } catch {
    return 'mvp'
  }
}

interface Ctx {
  award: AwardId
  setAward: (a: AwardId) => void
}

const AwardContext = createContext<Ctx>({ award: 'mvp', setAward: () => {} })

export function AwardProvider({ children }: { children: ReactNode }) {
  const { search } = useLocation()
  const [award, setAwardState] = useState<AwardId>(() => {
    try {
      return parse(new URLSearchParams(window.location.search).get('premio')) ?? readStored()
    } catch {
      return 'mvp'
    }
  })

  const setAward = useCallback((a: AwardId) => {
    setAwardState(a)
    try {
      window.localStorage.setItem(KEY, a)
    } catch {
      /* el navegador puede bloquear el almacenamiento */
    }
  }, [])

  // Un enlace con ?premio=cy o ?premio=mvp cambia el premio y lo guarda
  useEffect(() => {
    const p = parse(new URLSearchParams(search).get('premio'))
    if (p) setAward(p)
  }, [search, setAward])

  const value = useMemo(() => ({ award, setAward }), [award, setAward])
  return <AwardContext.Provider value={value}>{children}</AwardContext.Provider>
}

export const useAward = () => useContext(AwardContext)

/** Selector Premio: MVP | Cy Young. */
export function AwardSwitch({ compact = false }: { compact?: boolean }) {
  const { award, setAward } = useAward()
  return (
    <div className={`awsw${compact ? ' compact' : ''}`} role="group" aria-label="Premio que se muestra">
      {!compact ? <span className="awsw-l">Premio</span> : null}
      <div className="tabs">
      {(['mvp', 'cy'] as AwardId[]).map((id) => (
        <button key={id} type="button" aria-pressed={award === id} onClick={() => setAward(id)}>{AWARDS[id].short}</button>
      ))}
      </div>
    </div>
  )
}
