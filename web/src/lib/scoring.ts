import type { Candidate } from './types'

export type Criterion = 'value' | 'production' | 'team' | 'availability' | 'position'
export type Weights = Record<Criterion, number>

export const CRITERIA: { key: Criterion; label: string; hint: string }[] = [
  { key: 'value', label: 'Valor total (WAR)', hint: 'Promedio de fWAR y bWAR, lo que el jugador suma sobre un reemplazo.' },
  { key: 'production', label: 'Producción', hint: 'wRC+ para bateadores y prevención de carreras (ERA contra la liga) para lanzadores.' },
  { key: 'team', label: 'Equipo y playoffs', hint: 'Porcentaje de victorias del equipo y si llegó a octubre.' },
  { key: 'availability', label: 'Disponibilidad', hint: 'Turnos (700 equivalen a 100) o entradas (200 equivalen a 100). Estar en el campo cuenta.' },
  { key: 'position', label: 'Sesgo de posición', hint: 'Los votantes han castigado al designado y no han premiado a lanzadores puros.' },
]

export const PRESETS: { id: string; label: string; w: Weights; note: string }[] = [
  {
    id: 'typical',
    label: 'Votante típico (2016-2025)',
    w: { value: 45, production: 15, team: 25, availability: 5, position: 10 },
    note: 'Pesos inspirados en la regresión histórica, con el WAR primero y después los playoffs y el poder.',
  },
  { id: 'war', label: 'Solo WAR', w: { value: 100, production: 0, team: 0, availability: 0, position: 0 }, note: 'El criterio de un analista puro.' },
  { id: 'bat', label: 'Producción pura', w: { value: 0, production: 100, team: 0, availability: 0, position: 0 }, note: 'Quien mejor batea o evita carreras, sin ajuste.' },
  { id: 'team', label: 'Equipo ganador', w: { value: 15, production: 10, team: 65, availability: 5, position: 5 }, note: 'El estilo "valor es ganar" de la vieja escuela.' },
  { id: 'flat', label: 'Todo igual', w: { value: 20, production: 20, team: 20, availability: 20, position: 20 }, note: 'Cinco criterios con el mismo peso.' },
]

const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n))

export interface Components extends Record<Criterion, number> {}

const lgEra = 4.0

function prodScore(c: Candidate): number {
  const hit = c.hit ? clamp(((c.hit.wrcPlus - 90) / 100) * 100) : null
  const pit = c.pit ? clamp((((lgEra / Math.max(0.5, parseFloat(c.pit.era))) * 100 - 90) / 120) * 100) : null
  if (hit !== null && pit !== null) {
    const wh = c.hit!.fwar
    const wp = c.pit!.fwar
    return (hit * wh + pit * wp) / (wh + wp)
  }
  return (hit ?? pit) as number
}

function availScore(c: Candidate): number {
  const h = c.hit ? clamp((c.hit.pa / 700) * 100) : null
  const p = c.pit ? clamp((c.pit.ip / 200) * 100) : null
  if (h !== null && p !== null) return clamp(0.6 * h + 0.4 * p + 20)
  return (h ?? p) as number
}

function teamScore(c: Candidate): number {
  const t = c.teamRec
  return clamp(((t.pct - 0.4) / 0.25) * 70 + (t.playoffs ? 30 : 0))
}

function positionScore(c: Candidate): number {
  if (c.role === 'twoway') return 100
  if (c.role === 'pitcher') return 40
  if (c.bio.pos === 'DH') return 55
  return 100
}

export function components(c: Candidate, maxWar: number): Components {
  return {
    value: clamp((c.war.avg / maxWar) * 100),
    production: prodScore(c),
    team: teamScore(c),
    availability: availScore(c),
    position: positionScore(c),
  }
}

export function score(comp: Components, w: Weights): number {
  const total = Object.values(w).reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  return (Object.keys(w) as Criterion[]).reduce((acc, k) => acc + comp[k] * w[k], 0) / total
}

export function rankPool(pool: Candidate[], w: Weights) {
  const maxWar = Math.max(...pool.map((c) => c.war.avg))
  return pool
    .map((c) => {
      const comp = components(c, maxWar)
      return { c, comp, score: score(comp, w) }
    })
    .sort((a, b) => b.score - a.score)
}
