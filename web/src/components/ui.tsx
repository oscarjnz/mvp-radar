import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Candidate } from '../lib/types'
import { headshot, slash, teamLogo } from '../lib/format'
import { rankVar } from './chartkit'

export function Loading({ h = 160 }: { h?: number }) {
  return <div className="skeleton" style={{ minHeight: h }} aria-busy="true" aria-label="Cargando" />
}

export function ErrorBox({ msg }: { msg: string }) {
  return <div className="err" role="alert">No se pudieron cargar los datos: {msg}</div>
}

export function Section({ title, eyebrow, children, lede }: { title?: string; eyebrow?: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      {title ? <h2>{title}</h2> : null}
      {lede ? <p className="lede">{lede}</p> : null}
      {children}
    </section>
  )
}

export function StatLine({ c }: { c: Candidate }) {
  const items: ReactNode[] = []
  if (c.hit) {
    items.push(<span key="s"><b>{slash(c.hit.avg)}/{slash(c.hit.obp)}/{slash(c.hit.slg)}</b></span>)
    items.push(<span key="hr"><b>{c.hit.hr}</b> HR</span>)
    items.push(<span key="rbi"><b>{c.hit.rbi}</b> RBI</span>)
    items.push(<span key="sb"><b>{c.hit.sb}</b> SB</span>)
    items.push(<span key="wrc"><b>{c.hit.wrcPlus}</b> wRC+</span>)
  }
  if (c.pit) {
    items.push(<span key="era"><b>{c.pit.era}</b> ERA</span>)
    items.push(<span key="ip"><b>{c.pit.ip}</b> IP</span>)
    items.push(<span key="k"><b>{c.pit.so}</b> K</span>)
  }
  return <div className="statline">{items}</div>
}

export function TeamChip({ c }: { c: Candidate }) {
  const t = c.teamRec
  return (
    <span className={`chip ${t.playoffs ? 'good' : ''}`}>
      <img src={teamLogo(c.teamId)} alt="" width={16} height={16} /> {c.team} {t.w}-{t.l} {t.playoffs ? '· playoffs' : '· sin playoffs'}
    </span>
  )
}

export function PlayerCard({ c, showWar = true }: { c: Candidate; showWar?: boolean }) {
  const style = { ['--rank-color' as any]: c.top5 ? rankVar(c.rank) : 'var(--muted)' } as CSSProperties
  return (
    <Link to={`/jugador/${c.id}`} className="card pcard" style={style}>
      <img className="photo" src={headshot(c.id, 168)} alt={c.name} loading="lazy" width={84} height={84} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {c.top5 ? <span className="rank-badge">{c.rank}</span> : null}
          <h3 style={{ margin: 0, color: 'var(--ink)' }}>{c.name}</h3>
        </div>
        <div className="small muted" style={{ margin: '2px 0 6px' }}>{c.teamName} · {c.bio.pos === 'TWP' ? 'Dos vías' : c.bio.pos}</div>
        <TeamChip c={c} />
        <StatLine c={c} />
        {showWar ? <div className="statline"><span><b>{c.war.f}</b> fWAR</span><span><b>{c.war.b}</b> bWAR</span></div> : null}
      </div>
    </Link>
  )
}

export function Tabs<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { id: T; label: string }[] }) {
  return (
    <div className="tabs" role="group">
      {options.map((o) => (
        <button key={o.id} aria-pressed={value === o.id} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

export function DataTable({ head, rows, caption, left = [] }: { head: string[]; rows: ReactNode[][]; caption?: string; left?: number[] }) {
  return (
    <div className="tscroll">
      <table className="t">
        {caption ? <caption className="sr-only" style={{ position: 'absolute', left: -9999 }}>{caption}</caption> : null}
        <thead><tr>{head.map((h, i) => <th key={h + i} className={i === 0 || left.includes(i) ? 'l' : ''}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className={j === 0 || left.includes(j) ? 'l' : ''}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}
