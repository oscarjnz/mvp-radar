/** Departamentos estadisticos. `k` es la clave de la MLB Stats API (igual en 2026 y en temporadas anteriores). */
export interface StatDef {
  k: string
  abbr: string
  name: string
  low?: boolean // gana el valor mas bajo
  rate?: boolean // exige calificacion (PA o IP minimos) al ordenar
  d?: number // decimales
  noZero?: boolean // .281 en lugar de 0.281
  saber?: boolean // viene de sabermetrics (se consulta por temporada)
}

const c = (k: string, abbr: string, name: string): StatDef => ({ k, abbr, name })
const r = (k: string, abbr: string, name: string, d: number, o: Partial<StatDef> = {}): StatDef => ({ k, abbr, name, rate: true, d, ...o })

export const HITTING: StatDef[] = [
  c('gamesPlayed', 'G', 'Juegos'), c('plateAppearances', 'PA', 'Apariciones al plato'), c('atBats', 'AB', 'Turnos al bate'),
  c('runs', 'R', 'Carreras anotadas'), c('hits', 'H', 'Hits'), c('singles', '1B', 'Sencillos'), c('doubles', '2B', 'Dobles'),
  c('triples', '3B', 'Triples'), c('homeRuns', 'HR', 'Jonrones'), c('rbi', 'RBI', 'Carreras impulsadas'),
  c('totalBases', 'TB', 'Bases alcanzadas'), c('baseOnBalls', 'BB', 'Bases por bolas'), c('intentionalWalks', 'IBB', 'Boletos intencionales'),
  c('strikeOuts', 'SO', 'Ponches'), c('hitByPitch', 'HBP', 'Golpeado por lanzamiento'), c('stolenBases', 'SB', 'Bases robadas'),
  c('caughtStealing', 'CS', 'Atrapado robando'), c('sacFlies', 'SF', 'Fly de sacrificio'), c('sacBunts', 'SH', 'Toque de sacrificio'),
  c('groundIntoDoublePlay', 'GIDP', 'Dobles plays inducidos'), c('leftOnBase', 'LOB', 'Corredores dejados en base'),
  r('avg', 'AVG', 'Promedio de bateo', 3, { noZero: true }), r('obp', 'OBP', 'Porcentaje de embasado', 3, { noZero: true }),
  r('slg', 'SLG', 'Slugging', 3, { noZero: true }), r('ops', 'OPS', 'OBP más SLG', 3, { noZero: true }),
  r('babip', 'BABIP', 'Promedio en bolas en juego', 3, { noZero: true }),
  r('woba', 'wOBA', 'wOBA', 3, { noZero: true, saber: true }), r('wrcPlus', 'wRC+', 'Carreras creadas ajustadas', 0, { saber: true }),
  { k: 'war', abbr: 'WAR', name: 'Victorias sobre reemplazo (fWAR)', d: 1, saber: true },
]

export const PITCHING: StatDef[] = [
  c('wins', 'W', 'Victorias'), c('losses', 'L', 'Derrotas'), c('gamesPlayed', 'G', 'Juegos'), c('gamesStarted', 'GS', 'Aperturas'),
  c('completeGames', 'CG', 'Juegos completos'), c('shutouts', 'SHO', 'Blanqueadas'), c('saves', 'SV', 'Salvamentos'), c('holds', 'HLD', 'Holds'),
  c('blownSaves', 'BS', 'Salvamentos malogrados'), c('gamesFinished', 'GF', 'Juegos terminados'),
  { k: 'inningsPitched', abbr: 'IP', name: 'Innings lanzados', d: 1 }, c('battersFaced', 'BF', 'Bateadores enfrentados'),
  c('hits', 'H', 'Hits permitidos'), c('runs', 'R', 'Carreras permitidas'), c('earnedRuns', 'ER', 'Carreras limpias'),
  c('homeRuns', 'HR', 'Jonrones permitidos'), c('baseOnBalls', 'BB', 'Bases por bolas'), c('strikeOuts', 'SO', 'Ponches'),
  c('hitBatsmen', 'HBP', 'Bateadores golpeados'), c('wildPitches', 'WP', 'Lanzamientos descontrolados'),
  r('era', 'ERA', 'Efectividad', 2, { low: true }), r('whip', 'WHIP', 'Boletos y hits por inning', 2, { low: true }),
  r('avg', 'BAA', 'Promedio de bateo en contra', 3, { low: true, noZero: true }),
  r('strikeoutsPer9Inn', 'K/9', 'Ponches por 9 innings', 1), r('walksPer9Inn', 'BB/9', 'Boletos por 9 innings', 1, { low: true }),
  r('hitsPer9Inn', 'H/9', 'Hits por 9 innings', 1, { low: true }), r('homeRunsPer9', 'HR/9', 'Jonrones por 9 innings', 2, { low: true }),
  r('strikeoutWalkRatio', 'K/BB', 'Ponches por boleto', 2), r('winPercentage', 'W%', 'Porcentaje de victorias', 3, { noZero: true }),
  r('groundOutsToAirouts', 'GO/AO', 'Rola por elevado', 2), r('strikePercentage', 'STR%', 'Porcentaje de strikes', 3, { noZero: true }),
  r('fip', 'FIP', 'Pitcheo independiente de la defensa', 2, { low: true, saber: true }),
  r('xfip', 'xFIP', 'FIP esperado', 2, { low: true, saber: true }),
  r('eraMinus', 'ERA-', 'Efectividad ajustada (100 es el promedio)', 0, { low: true, saber: true }),
  { k: 'war', abbr: 'WAR', name: 'Victorias sobre reemplazo (fWAR)', d: 1, saber: true },
]

export type Group = 'hitting' | 'pitching'
export const DEFS: Record<Group, StatDef[]> = { hitting: HITTING, pitching: PITCHING }

/** 180.1 (notacion de beisbol) -> 180.333 */
export const ipToNum = (v: any) => {
  const n = Number(v)
  if (Number.isNaN(n)) return 0
  const whole = Math.floor(n)
  return whole + Math.round((n - whole) * 10) / 3
}

export const rawNum = (def: StatDef, v: any): number | null => {
  if (v === null || v === undefined || v === '' || v === '-.--' || v === '.---') return null
  if (def.k === 'inningsPitched') return ipToNum(v)
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export const fmtStat = (def: StatDef, v: any): string => {
  if (v === null || v === undefined || v === '') return '-'
  if (def.k === 'inningsPitched') return Number(v).toFixed(1)
  const n = Number(v)
  if (!Number.isFinite(n)) return String(v)
  if (def.d === undefined) return String(Math.round(n))
  const s = n.toFixed(def.d)
  return def.noZero && s.startsWith('0.') ? s.slice(1) : s
}
