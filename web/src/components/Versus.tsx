import { Link } from 'react-router-dom'
import { slash } from '../lib/format'
import { Face } from './ui'
import { Rich } from './Term'

interface Person {
  name: string
  mlbId?: number | null
  team: string
  teamId?: number | null
  w: number | null
  l: number | null
  playoffs: boolean | null
  rank: number
  share: number
  first: number
  war: number
  fwar?: number | null
  wrc?: number | null
  fip?: number | null
  role: string
  bat?: any
  pit?: any
  parts?: { bat: number; fld: number; bsr: number; pos: number } | null
}

interface Row {
  label: string
  get: (p: Person) => string | number | null | undefined
  /** 'max' o 'min' resalta el mejor valor numérico de la fila */
  best?: 'max' | 'min'
  num?: (p: Person) => number | null | undefined
}

const n = (x: any) => (x === null || x === undefined || x === '' ? null : Number(x))

function buildRows(people: Person[]): Row[] {
  const anyHit = people.some((p) => p.bat)
  const anyPit = people.some((p) => p.pit && p.role !== 'hitter')
  const rows: Row[] = [
    { label: 'Puesto en la votación', get: (p) => `${p.rank}.º` },
    { label: 'Porcentaje del voto', get: (p) => `${p.share}%`, best: 'max', num: (p) => p.share },
    { label: 'Votos de 1.er lugar', get: (p) => p.first, best: 'max', num: (p) => p.first },
    { label: 'bWAR', get: (p) => p.war?.toFixed(1), best: 'max', num: (p) => p.war },
    { label: 'fWAR', get: (p) => (p.fwar === null || p.fwar === undefined ? null : p.fwar.toFixed(1)), best: 'max', num: (p) => p.fwar },
  ]
  if (anyHit) {
    rows.push(
      { label: 'wRC+', get: (p) => p.wrc, best: 'max', num: (p) => p.wrc },
      { label: 'Línea ofensiva', get: (p) => (p.bat ? `${slash(p.bat.avg)}/${slash(p.bat.obp)}/${slash(p.bat.slg)}` : null) },
      { label: 'Jonrones', get: (p) => (p.bat ? p.bat.hr : null), best: 'max', num: (p) => n(p.bat?.hr) },
      { label: 'Impulsadas', get: (p) => (p.bat ? p.bat.rbi : null), best: 'max', num: (p) => n(p.bat?.rbi) },
      { label: 'Bases robadas', get: (p) => (p.bat ? p.bat.sb : null), best: 'max', num: (p) => n(p.bat?.sb) },
      { label: 'Juegos', get: (p) => (p.bat ? p.bat.g : null) },
      { label: 'Defensa (carreras)', get: (p) => p.parts?.fld, best: 'max', num: (p) => p.parts?.fld },
      { label: 'Corrido (carreras)', get: (p) => p.parts?.bsr, best: 'max', num: (p) => p.parts?.bsr },
    )
  }
  if (anyPit) {
    rows.push(
      { label: 'ERA', get: (p) => (p.pit ? p.pit.era : null), best: 'min', num: (p) => n(p.pit?.era) },
      { label: 'Entradas', get: (p) => (p.pit ? p.pit.ip : null), best: 'max', num: (p) => n(p.pit?.ip) },
      { label: 'Ponches', get: (p) => (p.pit ? p.pit.so : null), best: 'max', num: (p) => n(p.pit?.so) },
      { label: 'FIP', get: (p) => p.fip, best: 'min', num: (p) => p.fip },
      { label: 'WHIP', get: (p) => (p.pit ? p.pit.whip : null), best: 'min', num: (p) => n(p.pit?.whip) },
    )
  }
  rows.push(
    { label: 'Equipo', get: (p) => (p.w === null ? p.team : `${p.team} ${p.w}-${p.l}`) },
    { label: 'Llegó a playoffs', get: (p) => (p.playoffs === null ? null : p.playoffs ? 'Sí' : 'No') },
  )
  return rows
}

const COLORS = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)']

/** Comparación lado a lado: ganador contra rivales. El mejor valor de cada fila va resaltado. */
export default function Versus({ people, winnerName, title }: { people: Person[]; winnerName: string; title?: string }) {
  const rows = buildRows(people).filter((r) => people.some((p) => {
    const v = r.get(p)
    return v !== null && v !== undefined && v !== ''
  }))
  const tag = (p: Person) => {
    if (p.name === winnerName) return 'Ganador'
    const win = people.find((q) => q.name === winnerName)
    if (win && p.war > win.war) return 'Más WAR que el ganador'
    return `Votado ${p.rank}.º`
  }
  return (
    <div className="tscroll" role="region" aria-label={title || 'Comparación frente a frente'} tabIndex={0}>
      <table className="versus">
        <thead>
          <tr>
            <th />
            {people.map((p, i) => (
              <th key={p.name}>
                <div className="who">
                  <Face id={p.mlbId} name={p.name} width={84} color={COLORS[i % COLORS.length]} />
                  <span className="nm">{p.mlbId ? <Link to={`/jugador/${p.mlbId}`}>{p.name}</Link> : p.name}</span>
                  <span className="tag">{tag(p)}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const nums = people.map((p) => (r.num ? r.num(p) : null)).filter((x): x is number => x !== null && x !== undefined && !Number.isNaN(x))
            const target = r.best && nums.length > 1 ? (r.best === 'max' ? Math.max(...nums) : Math.min(...nums)) : null
            return (
              <tr key={r.label}>
                <th scope="row"><Rich>{r.label}</Rich></th>
                {people.map((p) => {
                  const v = r.get(p)
                  const num = r.num ? r.num(p) : null
                  const isBest = target !== null && num !== null && num !== undefined && num === target
                  return <td key={p.name} className={isBest ? 'best' : ''}>{v === null || v === undefined || v === '' ? '-' : v}</td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="small muted" style={{ marginTop: 8 }}>
        El valor más favorable de cada fila aparece resaltado. Los equipos y las estadísticas corresponden a la temporada de la votación.
      </div>
    </div>
  )
}
