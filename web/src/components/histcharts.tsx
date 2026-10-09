import { extent, scaleLinear } from 'd3'
import type { Ballot } from '../lib/types'
import { ChartHead, Legend, useTip, useWidth } from './chartkit'

const last = (n: string) => {
  const parts = n.split(' ')
  const tail = parts[parts.length - 1]
  return /^(Jr\.|Sr\.|II|III)$/.test(tail) && parts.length > 1 ? parts[parts.length - 2] : tail
}

/* WAR vs porcentaje de voto de todos los finalistas */
export function VoteScatter({ points, title, award = 'MVP' }: { points: { year: number; lg: string; b: Ballot; winner: boolean }[]; title?: string; award?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const h = Math.round(Math.min(420, w * 0.72))
  const m = { l: 44, r: 12, t: 12, b: 40 }
  const xd = extent(points, (p) => p.b.war) as [number, number]
  const x = scaleLinear().domain([Math.floor(xd[0]), Math.ceil(xd[1])]).range([m.l, w - m.r])
  const y = scaleLinear().domain([0, 100]).range([h - m.b, m.t])
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub="Cada punto es un finalista de 2016 a 2025 (top 10 de cada boleta)" /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{y.ticks(5).map((t) => <line key={t} x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} />)}</g>
        <g className="axis">
          {y.ticks(5).map((t) => <text key={t} x={m.l - 6} y={y(t) + 4} textAnchor="end">{t}%</text>)}
          {x.ticks(8).map((t) => <text key={t} x={x(t)} y={h - 22} textAnchor="middle">{t}</text>)}
          <text x={(m.l + w - m.r) / 2} y={h - 5} textAnchor="middle">WAR (Baseball Reference)</text>
          <text transform={`translate(11 ${h / 2}) rotate(-90)`} textAnchor="middle">Porcentaje de puntos posibles</text>
        </g>
        {points.filter((p) => !p.winner).map((p, i) => (
          <circle key={i} cx={x(p.b.war)} cy={y(p.b.share)} r={4.5} fill={p.b.playoffs ? 'var(--s1)' : 'var(--s2)'} opacity={0.75} stroke="var(--surface)" strokeWidth={1}
            onPointerMove={(e) => show(e, <div><b>{p.b.name}</b> · {p.year} {p.lg}<br />WAR <b>{p.b.war}</b> · voto <b>{p.b.share}%</b><br />{p.b.team} {p.b.w}-{p.b.l} {p.b.playoffs ? '· playoffs' : '· sin playoffs'}</div>)} onPointerLeave={hide} />
        ))}
        {points.filter((p) => p.winner).map((p, i) => (
          <g key={i} onPointerMove={(e) => show(e, <div><b>{p.b.name}</b> · {award} {p.year} {p.lg}<br />WAR <b>{p.b.war}</b> · voto <b>{p.b.share}%</b><br />{p.b.team} {p.b.w}-{p.b.l} {p.b.playoffs ? '· playoffs' : '· sin playoffs'}</div>)} onPointerLeave={hide}>
            <circle cx={x(p.b.war)} cy={y(p.b.share)} r={7} fill={p.b.playoffs ? 'var(--s1)' : 'var(--s2)'} stroke="var(--ink)" strokeWidth={2.5} />
          </g>
        ))}
      </svg>
      <Legend items={[{ label: 'Equipo en playoffs', color: 'var(--s1)' }, { label: 'Equipo fuera de playoffs', color: 'var(--s2)' }]} />
      <p className="small muted" style={{ margin: '6px 0 0' }}>Los círculos con borde grueso son los 20 {award}.</p>
      {node}
    </div>
  )
}

/* Coeficientes de la regresion */
export function CoefBars({ coefs, halves }: { coefs: { label: string; value: number }[]; halves: Record<string, number[]> }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const rows = coefs.slice(1)
  const tags = Object.keys(halves)
  const rowH = 62
  const m = { l: 6, r: 50, t: 4, b: 10 }
  const h = m.t + m.b + rows.length * rowH
  const maxv = Math.max(0.25, ...tags.flatMap((t) => halves[t].slice(1).map(Math.abs)))
  const x = scaleLinear().domain([-0.03, maxv]).range([m.l, w - m.r])
  const { show, hide, node } = useTip()
  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Qué pesa en el voto">
        <line x1={x(0)} x2={x(0)} y1={m.t} y2={h - m.b} stroke="var(--axis)" />
        {rows.map((r, i) => (
          <g key={r.label} transform={`translate(0 ${m.t + i * rowH})`}>
            <text x={m.l} y={14} style={{ fill: 'var(--ink)', fontWeight: 650 }}>{r.label}</text>
            {tags.map((t, ti) => {
              const v = halves[t][i + 1]
              return (
                <g key={t} onPointerMove={(e) => show(e, <div><b>{t}</b><br />{r.label} <b>{v > 0 ? '+' : ''}{(v * 100).toFixed(1)} pts de voto</b></div>)} onPointerLeave={hide}>
                  <rect x={Math.min(x(0), x(v))} y={22 + ti * 17} width={Math.abs(x(v) - x(0))} height={13} rx={3} fill={ti === 0 ? 'var(--s1)' : 'var(--s2)'} />
                  <text x={x(v) + 5} y={33 + ti * 17} style={{ fontSize: 10 }}>{(v * 100).toFixed(1)}</text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>
      <Legend items={tags.map((t, i) => ({ label: t, color: i === 0 ? 'var(--s1)' : 'var(--s2)' }))} />
      {node}
    </div>
  )
}

/* Boleta de un año y liga */
export function BallotBars({ ballots, title, hideRole = false }: { ballots: Ballot[]; title?: string; hideRole?: boolean }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const rowH = 30
  const m = { l: 140, r: 78, t: 4, b: 4 }
  const h = m.t + m.b + ballots.length * rowH
  const x = scaleLinear().domain([0, 100]).range([m.l, w - m.r])
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        {ballots.map((b, i) => {
          const yy = m.t + i * rowH
          return (
            <g key={b.name} onPointerMove={(e) => show(e, <div><b>{b.name}</b> ({b.team})<br />Puntos <b>{b.pts}</b> · votos de 1.er lugar <b>{b.first}</b><br />WAR <b>{b.war}</b> · {b.w}-{b.l} {b.playoffs ? '· playoffs' : '· sin playoffs'}</div>)} onPointerLeave={hide}>
              <text x={m.l - 8} y={yy + 19} textAnchor="end" style={{ fill: 'var(--ink)', fontWeight: i === 0 ? 800 : 500 }}>{b.rank}. {last(b.name)}{!hideRole && b.role !== 'hitter' ? ` (${b.role === 'pitcher' ? 'P' : 'P/DH'})` : ''}</text>
              <rect x={m.l} y={yy + 5} width={x(100) - m.l} height={rowH - 11} rx={4} fill="var(--grid)" />
              <rect x={m.l} y={yy + 5} width={Math.max(2, x(b.share) - m.l)} height={rowH - 11} rx={4} fill={i === 0 ? 'var(--s1)' : 'var(--axis)'} />
              <text x={w - m.r + 8} y={yy + 19} style={{ fill: 'var(--ink)', fontWeight: 700 }}>{b.share}% · {b.war}</text>
            </g>
          )
        })}
      </svg>
      <p className="small muted" style={{ margin: '4px 0 0' }}>La barra muestra el porcentaje de puntos posibles. A la derecha aparecen el voto y el WAR.</p>
      {node}
    </div>
  )
}

/* Brecha de WAR: ganador vs el que lo supero */
export function GapDumbbell({ rows, winnerLabel = 'Ganó el MVP' }: { rows: { label: string; winner: string; winnerWar: number; snub: string; snubWar: number; rank: number }[]; winnerLabel?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const rowH = 34
  const m = { l: 166, r: 24, t: 22, b: 8 }
  const h = m.t + m.b + rows.length * rowH
  const all = rows.flatMap((r) => [r.winnerWar, r.snubWar])
  const lo = Math.floor(Math.min(...all) - 0.5)
  const hi = Math.ceil(Math.max(...all) + 0.5)
  const x = scaleLinear().domain([lo, hi]).range([m.l + 12, w - m.r])
  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Brecha de WAR entre el ganador y el que quedó fuera">
        <g className="grid">{x.ticks(8).map((t) => <line key={t} x1={x(t)} x2={x(t)} y1={m.t - 6} y2={h - m.b} />)}</g>
        <g className="axis">{x.ticks(8).map((t) => <text key={t} x={x(t)} y={12} textAnchor="middle">{t}</text>)}</g>
        {rows.map((r, i) => {
          const yy = m.t + i * rowH + rowH / 2
          return (
            <g key={r.label} onPointerMove={(e) => show(e, <div><b>{r.label}</b><br />Ganó {r.winner} con WAR <b>{r.winnerWar}</b><br />{r.snub} (terminó {r.rank}.º) con WAR <b>{r.snubWar}</b></div>)} onPointerLeave={hide}>
              <text x={m.l - 10} y={yy + 4} textAnchor="end" style={{ fill: 'var(--ink)', fontWeight: 600 }}>{r.label}</text>
              <line x1={x(r.winnerWar)} x2={x(r.snubWar)} y1={yy} y2={yy} stroke="var(--s2)" strokeWidth={3} opacity={0.5} strokeLinecap="round" />
              <circle cx={x(r.winnerWar)} cy={yy} r={7} fill="var(--s1)" stroke="var(--surface)" strokeWidth={2} />
              <circle cx={x(r.snubWar)} cy={yy} r={7} fill="var(--s2)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )
        })}
      </svg>
      <Legend items={[{ label: winnerLabel, color: 'var(--s1)' }, { label: 'Tuvo más WAR y no ganó', color: 'var(--s2)' }]} />
      {node}
    </div>
  )
}
