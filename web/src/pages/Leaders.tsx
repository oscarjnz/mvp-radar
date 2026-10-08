import { useEffect, useMemo, useState } from 'react'
import { useAsync } from '../lib/data'
import { headshot, teamLogo } from '../lib/format'
import { DEFS, fmtStat, ipToNum, rawNum, type Group, type StatDef } from '../lib/statdefs'
import { ErrorBox, Loading, Tabs } from '../components/ui'
import { LineChart } from '../components/charts'
import { P } from '../components/Term'

interface Row { id: number; name: string; team: string; teamId: number; lg: string; pos?: string; [k: string]: any }
interface LeadersData { season: number; asOf: string; hitting: Row[]; pitching: Row[] }
interface Season { season: number; team: string; vol: number; stat: Record<string, any> }

const API = 'https://statsapi.mlb.com/api/v1/people'
const cache = new Map<string, Promise<any>>()
const getJson = (url: string) => {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() }))
  return cache.get(url) as Promise<any>
}

/** Una fila por temporada. Si pasó por varios equipos queda la fila con más juegos (el total del año). */
async function loadSeasons(id: number, group: Group): Promise<Season[]> {
  const j = await getJson(`${API}/${id}/stats?stats=yearByYear&group=${group}&gameType=R&sportId=1`)
  const best = new Map<number, any>()
  for (const sp of j.stats?.[0]?.splits ?? []) {
    const y = Number(sp.season)
    if (!best.has(y) || (sp.stat.gamesPlayed ?? 0) > (best.get(y).stat.gamesPlayed ?? 0)) best.set(y, sp)
  }
  return [...best.entries()].sort((a, b) => a[0] - b[0]).map(([y, sp]) => {
    const st = { ...sp.stat }
    if (group === 'hitting') st.singles = (st.hits ?? 0) - (st.doubles ?? 0) - (st.triples ?? 0) - (st.homeRuns ?? 0)
    return { season: y, team: sp.team?.name ?? '', vol: group === 'hitting' ? st.plateAppearances ?? 0 : ipToNum(st.inningsPitched ?? 0), stat: st }
  })
}

async function loadSaber(id: number, group: Group, seasons: Season[]) {
  const out: Record<number, Record<string, any>> = {}
  await Promise.all(seasons.map(async (s) => {
    try {
      const j = await getJson(`${API}/${id}/stats?stats=sabermetrics&group=${group}&season=${s.season}&sportId=1`)
      out[s.season] = j.stats?.[0]?.splits?.[0]?.stat ?? {}
    } catch { out[s.season] = {} }
  }))
  return out
}

function useSeasons(id: number, group: Group, saber: boolean) {
  const [st, setSt] = useState<{ seasons: Season[]; saber: Record<number, Record<string, any>> } | null>(null)
  const [err, setErr] = useState(false)
  useEffect(() => {
    let alive = true
    setSt(null); setErr(false)
    loadSeasons(id, group)
      .then(async (seasons) => {
        const sab = saber ? await loadSaber(id, group, seasons) : {}
        if (alive) setSt({ seasons, saber: sab })
      })
      .catch(() => alive && setErr(true))
    return () => { alive = false }
  }, [id, group, saber])
  return { st, err }
}

function Evolution({ row, group, def, onDef, onClose }: { row: Row; group: Group; def: StatDef; onDef: (k: string) => void; onClose: () => void }) {
  const { st, err } = useSeasons(row.id, group, !!def.saber)
  const defs = DEFS[group]
  const pts = useMemo(() => {
    if (!st) return []
    return st.seasons
      .map((s) => ({ s, v: rawNum(def, def.saber ? st.saber[s.season]?.[def.k] : s.stat[def.k]) }))
      .filter((p) => p.v !== null && p.s.vol > 0) as { s: Season; v: number }[]
  }, [st, def])
  const cur = pts.find((p) => p.s.season === 2026)
  const prev = pts.filter((p) => p.s.season < 2026)
  const last = prev[prev.length - 1]
  const better = (a: number, b: number) => (def.low ? a < b : a > b)
  const bestPrev = prev.length ? prev.reduce((m, p) => (better(p.v, m.v) ? p : m)) : null
  const avgPrev = prev.length ? prev.reduce((t, p) => t + p.v, 0) / prev.length : null
  const f = (v: number | null | undefined) => (v === null || v === undefined ? '-' : fmtStat(def, v))
  const diff = (a: number, b: number) => {
    const d = a - b
    const txt = d.toFixed(def.d ?? 0).replace(/^(-?)0\./, def.noZero ? '$1.' : '$10.')
    return <span className={`chip ${d === 0 ? '' : better(a, b) ? 'good' : 'bad'}`}>{d > 0 ? '+' : ''}{txt}</span>
  }
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        <img className="photo" src={headshot(row.id, 168)} alt={row.name} width={64} style={{ width: 64, borderRadius: 12 }} />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="eyebrow">Evolución en un departamento</div>
          <h3 style={{ margin: 0 }}>{row.name} <span className="muted small">({row.team})</span></h3>
        </div>
        <label className="small muted">Departamento{' '}
          <select value={def.k} onChange={(e) => onDef(e.target.value)} className="sel">
            {defs.map((d) => <option key={d.k} value={d.k}>{d.abbr} · {d.name}</option>)}
          </select>
        </label>
        <button className="btn" onClick={onClose}>Cerrar</button>
      </div>
      {err ? <p className="small muted" style={{ marginTop: 12 }}>No se pudo consultar el historial en este momento. Intenta de nuevo en unos segundos.</p> : !st ? <Loading h={220} /> : (
        <>
          <div className="statline" style={{ marginTop: 12 }}>
            <span><b>{f(cur?.v)}</b> en 2026</span>
            {last && cur ? <span>frente a {last.s.season} {diff(cur.v, last.v)}</span> : null}
            {avgPrev !== null && cur ? <span>frente al promedio previo ({f(avgPrev)}) {diff(cur.v, avgPrev)}</span> : null}
            {bestPrev ? <span>mejor temporada anterior <b>{f(bestPrev.v)}</b> ({bestPrev.s.season})</span> : <span>Sin temporadas anteriores en las mayores</span>}
          </div>
          {pts.length > 1 ? (
            <LineChart height={220} title={`${def.name} (${def.abbr}) por temporada`} sub="Ligas mayores, temporada regular"
              series={[{ id: def.k, label: def.abbr, color: 'var(--accent)', points: pts.map((p) => ({ x: p.s.season, y: p.v })) }]}
              yFmt={(v) => fmtStat(def, v)} />
          ) : <p className="small muted">Se necesitan al menos dos temporadas para dibujar la evolución.</p>}
          <div className="tscroll">
            <table className="t">
              <thead><tr><th className="l">Temporada</th><th className="l">Equipo</th><th>{group === 'hitting' ? 'PA' : 'IP'}</th><th>{def.abbr}</th></tr></thead>
              <tbody>
                {[...pts].reverse().map((p) => (
                  <tr key={p.s.season}><td className="l">{p.s.season}</td><td className="l">{p.s.team}</td><td>{group === 'hitting' ? p.s.vol : Number(p.s.stat.inningsPitched).toFixed(1)}</td><td><b>{f(p.v)}</b></td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <P className="small muted" style={{ marginTop: 8 }}>Datos de la MLB Stats API. Si un jugador pasó por varios equipos en un año, se muestra el total de ese año.</P>
        </>
      )}
    </div>
  )
}

export default function Leaders() {
  const { data, error } = useAsync<LeadersData>('/data/leaders.json')
  const [group, setGroup] = useState<Group>('pitching')
  const [key, setKey] = useState('strikeOuts')
  const [asc, setAsc] = useState(false)
  const [lg, setLg] = useState<'ALL' | 'AL' | 'NL'>('ALL')
  const [q, setQ] = useState('')
  const [qual, setQual] = useState(true)
  const [limit, setLimit] = useState(25)
  const [sel, setSel] = useState<Row | null>(null)
  const [selKey, setSelKey] = useState('strikeOuts')

  const defs = DEFS[group]
  const def = defs.find((d) => d.k === key) ?? defs[0]
  const pickGroup = (g: Group) => {
    const k = g === 'hitting' ? 'homeRuns' : 'strikeOuts'
    setGroup(g); setKey(k); setSelKey(k); setAsc(false); setSel(null); setLimit(25)
  }
  const sortBy = (d: StatDef) => {
    if (d.k === key) setAsc(!asc)
    else { setKey(d.k); setAsc(!!d.low) }
    setSelKey(d.k); setLimit(25)
  }
  const rows = useMemo(() => {
    if (!data) return []
    const needle = q.trim().toLowerCase()
    const qualifies = (r: Row) => (group === 'hitting' ? (r.plateAppearances ?? 0) >= 502 : ipToNum(r.inningsPitched ?? 0) >= 162)
    const val = (r: Row) => rawNum(def, r[def.k])
    return data[group]
      .filter((r) => (lg === 'ALL' || r.lg === lg) && (!needle || r.name.toLowerCase().includes(needle)) && val(r) !== null && (!(def.rate && qual) || qualifies(r)))
      .sort((a, b) => ((val(a) as number) - (val(b) as number)) * (asc ? 1 : -1))
  }, [data, group, def, asc, lg, q, qual])

  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const selDef = defs.find((d) => d.k === selKey) ?? def
  const need = group === 'hitting' ? '502 apariciones al plato' : '162 innings'
  const open = (r: Row) => { setSel(r); setSelKey(key) }

  return (
    <div className="wrap">
      <div className="eyebrow">Temporada {data.season} · datos al {data.asOf.split('-').reverse().join('/')}</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Líderes por departamento</h1>
      <P className="lede">Todas las categorías de bateo y pitcheo de la temporada regular. Toca el encabezado de una columna para ordenar y toca un jugador para ver cómo ha subido o bajado en ese departamento frente a sus años anteriores.</P>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '16px 0' }}>
        <Tabs value={group} onChange={pickGroup} options={[{ id: 'hitting', label: 'Bateo' }, { id: 'pitching', label: 'Pitcheo' }]} />
        <Tabs value={lg} onChange={(v) => setLg(v)} options={[{ id: 'ALL', label: 'Ambas ligas' }, { id: 'AL', label: 'Americana' }, { id: 'NL', label: 'Nacional' }]} />
        <label className="small muted">Ordenar por{' '}
          <select className="sel" value={key} onChange={(e) => { const d = defs.find((x) => x.k === e.target.value)!; setKey(d.k); setSelKey(d.k); setAsc(!!d.low); setLimit(25) }}>
            {defs.map((d) => <option key={d.k} value={d.k}>{d.abbr} · {d.name}</option>)}
          </select>
        </label>
        <input className="sel" type="search" placeholder="Buscar jugador" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar jugador" />
        {def.rate ? <label className="small muted"><input type="checkbox" checked={qual} onChange={(e) => setQual(e.target.checked)} /> Solo calificados ({need})</label> : null}
      </div>

      {sel ? <Evolution row={sel} group={group} def={selDef} onDef={setSelKey} onClose={() => setSel(null)} /> : null}

      <div className="card" style={{ padding: 0 }}>
        <div className="tscroll lead">
          <table className="t">
            <thead>
              <tr>
                <th className="l">#</th><th className="l">Jugador</th>
                {defs.map((d) => (
                  <th key={d.k} className={d.k === key ? 'on' : ''} aria-sort={d.k === key ? (asc ? 'ascending' : 'descending') : 'none'}>
                    <button className="th-btn" onClick={() => sortBy(d)} title={`${d.name}. Clic para ordenar`}>{d.abbr}{d.k === key ? (asc ? ' ▲' : ' ▼') : ''}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, limit).map((r, i) => (
                <tr key={r.id} className={sel?.id === r.id ? 'sel-row' : ''} onClick={() => open(r)} style={{ cursor: 'pointer' }}>
                  <td className="l muted">{i + 1}</td>
                  <td className="l">
                    <button className="lwho" onClick={() => open(r)}>
                      <img src={headshot(r.id, 60)} alt="" width={28} height={28} loading="lazy" />
                      <span><b>{r.name}</b><br /><span className="small muted"><img src={teamLogo(r.teamId)} alt="" width={12} height={12} /> {r.team}{r.pos ? ` · ${r.pos}` : ''}</span></span>
                    </button>
                  </td>
                  {defs.map((d) => <td key={d.k} className={d.k === key ? 'on' : ''}>{fmtStat(d, r[d.k])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
        <span className="small muted">Mostrando {Math.min(limit, rows.length)} de {rows.length} jugadores</span>
        {limit < rows.length ? <button className="btn" onClick={() => setLimit(limit + 25)}>Ver 25 más</button> : null}
        {limit > 25 ? <button className="btn" onClick={() => setLimit(25)}>Ver menos</button> : null}
      </div>
    </div>
  )
}
