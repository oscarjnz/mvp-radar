import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Candidate } from '../lib/types'
import { headshot, slash, teamLogo } from '../lib/format'
import { rankVar } from './chartkit'
import { P, T, Rich } from './Term'

export function Loading({ h = 160 }: { h?: number }) {
  return <div className="skeleton" style={{ minHeight: h }} aria-busy="true" aria-label="Cargando" />
}

export function ErrorBox({ msg }: { msg: string }) {
  return <div className="err" role="alert">No se pudieron cargar los datos ({msg})</div>
}

export function Section({ title, eyebrow, children, lede }: { title?: string; eyebrow?: string; lede?: ReactNode; children: ReactNode }) {
  return (
    <section className="section">
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      {title ? <h2>{title}</h2> : null}
      {lede ? <P className="lede">{lede}</P> : null}
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
    items.push(<span key="wrc"><b>{c.hit.wrcPlus}</b> <T k="wrcplus">wRC+</T></span>)
  }
  if (c.pit) {
    items.push(<span key="era"><b>{c.pit.era}</b> <T k="era">ERA</T></span>)
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
      <img className="photo" src={headshot(c.id, 168)} alt={c.name} width={84} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {c.top5 ? <span className="rank-badge">{c.rank}</span> : null}
          <h3 style={{ margin: 0, color: 'var(--ink)' }}>{c.name}</h3>
        </div>
        <div className="small muted" style={{ margin: '2px 0 6px' }}>{c.teamName} · {c.bio.pos === 'TWP' ? 'DH/P' : c.bio.pos}</div>
        <TeamChip c={c} />
        <StatLine c={c} />
        {showWar ? <div className="statline"><span><b>{c.war.f}</b> <T k="fwar">fWAR</T></span><span><b>{c.war.b}</b> <T k="bwar">bWAR</T></span></div> : null}
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
        <thead><tr>{head.map((h, i) => <th key={h + i} className={i === 0 || left.includes(i) ? 'l' : ''}><Rich>{h}</Rich></th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((cell, j) => <td key={j} className={j === 0 || left.includes(j) ? 'l' : ''}>{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  )
}

/** Foto del jugador. Si hay id, es un enlace a su perfil. */
export function Face({ id, name, width = 96, color = 'var(--accent)' }: { id?: number | null; name: string; width?: number; color?: string }) {
  const img = (
    <img className="photo" src={headshot(id, width * 2)} alt={name} width={width} style={{ width, border: `3px solid ${color}`, borderRadius: 14, background: 'var(--surface-2)' }} />
  )
  if (!id) return img
  return (
    <Link to={`/jugador/${id}`} className="face" aria-label={`Ver el perfil de ${name}`} title={`Ver el perfil de ${name}`}>
      {img}
    </Link>
  )
}

/** Nombre del jugador como enlace a su perfil cuando se conoce el id. */
export function NameLink({ id, name }: { id?: number | null; name: string }) {
  return id ? <Link to={`/jugador/${id}`}>{name}</Link> : <>{name}</>
}

export interface QuoteData {
  text: string
  es?: string
  author: string
  outlet: string
  title: string
  date: string
  url: string
}

export function QuoteCard({ q }: { q: QuoteData }) {
  return (
    <figure className="quote">
      <blockquote>
        <p className="qtext" lang={q.es ? 'en' : 'es'}>{q.text.replace(/"([^"]+)"/g, '“$1”')}</p>
        {q.es ? <p className="qes"><span>Traducción propia</span> {q.es}</p> : null}
      </blockquote>
      <figcaption>
        <b>{q.author}</b><span className="qsep">{q.outlet}</span><a href={q.url} target="_blank" rel="noreferrer">{q.title}</a><span className="qsep">{q.date}</span>
      </figcaption>
    </figure>
  )
}

export function Callout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="callout" role="note">
      <b>{title}</b>
      <P>{children}</P>
    </aside>
  )
}
