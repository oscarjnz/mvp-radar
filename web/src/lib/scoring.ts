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

export type Components = Record<Criterion, number>

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

/* ---------------------------------------------------------------------------
   Cy Young. Todos los candidatos son lanzadores, así que los criterios cambian:
   desaparecen la posición y el bateo, y aparecen la prevención de carreras, el volumen y el dominio.
--------------------------------------------------------------------------- */
export type CyCriterion = 'value' | 'prevention' | 'volume' | 'dominance' | 'record'
export type CyWeights = Record<CyCriterion, number>
export type CyComponents = Record<CyCriterion, number>

export const CY_CRITERIA: { key: CyCriterion; label: string; hint: string }[] = [
  { key: 'value', label: 'Valor total (WAR)', hint: 'Promedio de fWAR y bWAR, lo que el lanzador suma sobre un reemplazo.' },
  { key: 'prevention', label: 'Prevención de carreras', hint: 'Promedio de ERA y FIP. Una efectividad de 1.50 vale 100 y una de 4.50 vale 0.' },
  { key: 'volume', label: 'Volumen', hint: 'Entradas lanzadas. 210 entradas equivalen a 100.' },
  { key: 'dominance', label: 'Dominio', hint: 'Ponches menos bases por bolas, como porcentaje de bateadores (K-BB %). Un 28 % vale 100.' },
  { key: 'record', label: 'Victorias y equipo', hint: 'Victorias personales (20 equivalen a 100) y si el equipo llegó a octubre.' },
]

export const CY_PRESETS: { id: string; label: string; w: CyWeights; note: string }[] = [
  {
    id: 'typical',
    label: 'Votante típico (2016-2025)',
    w: { value: 40, prevention: 25, volume: 5, dominance: 5, record: 25 },
    note: 'Pesos inspirados en la regresión histórica de las boletas del Cy Young, con el WAR primero y después la efectividad y las victorias.',
  },
  { id: 'war', label: 'Solo WAR', w: { value: 100, prevention: 0, volume: 0, dominance: 0, record: 0 }, note: 'El criterio de un analista puro.' },
  { id: 'prev', label: 'Prevención pura', w: { value: 0, prevention: 100, volume: 0, dominance: 0, record: 0 }, note: 'Quien menos carreras permite, sin ajuste por entradas.' },
  { id: 'classic', label: 'Escuela clásica', w: { value: 5, prevention: 25, volume: 15, dominance: 0, record: 55 }, note: 'Victorias, entradas y efectividad, como se votaba hace décadas.' },
  { id: 'flat', label: 'Todo igual', w: { value: 20, prevention: 20, volume: 20, dominance: 20, record: 20 }, note: 'Cinco criterios con el mismo peso.' },
]

const scale = (x: number, lo: number, hi: number) => clamp(((x - lo) / (hi - lo)) * 100)

export function cyComponents(c: Candidate, maxWar: number): CyComponents {
  const p = c.pit!
  const era = parseFloat(p.era)
  const raw = p.savant?.raw ?? {}
  const kbb = raw.k_percent !== undefined && raw.bb_percent !== undefined ? raw.k_percent - raw.bb_percent : ((p.so - p.bb) / (p.ip * 4.2)) * 100
  return {
    value: clamp((c.war.avg / maxWar) * 100),
    prevention: (scale(4.5 - era, 0, 3) + scale(4.5 - p.fip, 0, 3)) / 2,
    volume: clamp((p.ip / 210) * 100),
    dominance: scale(kbb, 0, 28),
    record: 0.7 * clamp((p.w / 20) * 100) + 0.3 * (c.teamRec.playoffs ? 100 : 0),
  }
}

export function cyScore(comp: CyComponents, w: CyWeights): number {
  const total = Object.values(w).reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  return (Object.keys(w) as CyCriterion[]).reduce((acc, k) => acc + comp[k] * w[k], 0) / total
}

export function rankCyPool(pool: Candidate[], w: CyWeights) {
  const maxWar = Math.max(...pool.map((c) => c.war.avg))
  return pool
    .map((c) => {
      const comp = cyComponents(c, maxWar)
      return { c, comp, score: cyScore(comp, w) }
    })
    .sort((a, b) => b.score - a.score)
}
