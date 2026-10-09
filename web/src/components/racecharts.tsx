import { max, scaleLinear } from 'd3'
import type { Candidate } from '../lib/types'
import { CRITERIA } from '../lib/scoring'
import { ChartHead, Legend, rankVar, useTip, useWidth } from './chartkit'

const short = (n: string) => {
  const parts = n.split(' ')
  const tail = parts[parts.length - 1]
  return /^(Jr\.|Sr\.|II|III)$/.test(tail) && parts.length > 1 ? parts[parts.length - 2] : tail
}

/* WAR por fuente (fWAR vs bWAR): muestra el desacuerdo entre sitios */
export function WarDumbbell({ cands, title }: { cands: Candidate[]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const rowH = 38
  const m = { l: 120, r: 24, t: 26, b: 26 }
  const h = m.t + m.b + cands.length * rowH
  const top = Math.ceil(max(cands, (c) => Math.max(c.war.f, c.war.b)) || 8) + 1
  const x = scaleLinear().domain([0, top]).range([m.l, w - m.r])
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub="El círculo lleno es el fWAR (FanGraphs) y el anillo es el bWAR (Baseball Reference)" /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{x.ticks(6).map((t) => <line key={t} x1={x(t)} x2={x(t)} y1={m.t - 8} y2={h - m.b} />)}</g>
        <g className="axis">{x.ticks(6).map((t) => <text key={t} x={x(t)} y={h - 8} textAnchor="middle">{t}</text>)}<text x={m.l} y={12}>Victorias sobre un reemplazo (WAR)</text></g>
        {cands.map((c, i) => {
          const yy = m.t + i * rowH + rowH / 2
          const col = rankVar(c.rank)
          return (
            <g key={c.id} onPointerMove={(e) => show(e, <div><b>{c.name}</b> ({c.team})<br />fWAR <b>{c.war.f}</b> · bWAR <b>{c.war.b}</b><br />Diferencia entre fuentes <b>{Math.abs(c.war.f - c.war.b).toFixed(1)}</b></div>)} onPointerLeave={hide}>
              <text x={m.l - 10} y={yy + 4} textAnchor="end" style={{ fill: 'var(--ink)', fontWeight: 650 }}>{short(c.name)}</text>
              <line x1={x(c.war.f)} x2={x(c.war.b)} y1={yy} y2={yy} stroke={col} strokeWidth={3} opacity={0.5} strokeLinecap="round" />
              <circle cx={x(c.war.f)} cy={yy} r={7} fill={col} stroke="var(--surface)" strokeWidth={2} />
              <circle cx={x(c.war.b)} cy={yy} r={7} fill="var(--surface)" stroke={col} strokeWidth={3} />
            </g>
          )
        })}
      </svg>
      {node}
    </div>
  )
}

/* Valor vs equipo */
export function ValueScatter({ cands, title }: { cands: Candidate[]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const h = Math.round(Math.min(380, w * 0.68))
  const m = { l: 40, r: 70, t: 14, b: 38 }
  const x = scaleLinear().domain([0.4, 0.66]).range([m.l, w - m.r])
  const top = Math.ceil(max(cands, (c) => c.war.avg) || 8) + 1
  const y = scaleLinear().domain([2, top]).range([h - m.b, m.t])
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub="Relleno si el equipo llegó a playoffs, hueco si no clasificó" /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{y.ticks(5).map((t) => <line key={t} x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} />)}{x.ticks(6).map((t) => <line key={t} x1={x(t)} x2={x(t)} y1={m.t} y2={h - m.b} />)}</g>
        <g className="axis">
          {y.ticks(5).map((t) => <text key={t} x={m.l - 6} y={y(t) + 4} textAnchor="end">{t}</text>)}
          {x.ticks(6).map((t) => <text key={t} x={x(t)} y={h - 20} textAnchor="middle">{t.toFixed(3).replace(/^0/, '')}</text>)}
          <text x={(m.l + w - m.r) / 2} y={h - 4} textAnchor="middle">Porcentaje de victorias del equipo</text>
          <text transform={`translate(10 ${h / 2}) rotate(-90)`} textAnchor="middle">WAR promedio (f y b)</text>
        </g>
        {cands.map((c) => {
          const col = c.top5 ? rankVar(c.rank) : 'var(--muted)'
          const cx = x(c.teamRec.pct)
          const cy = y(c.war.avg)
          return (
            <g key={c.id} onPointerMove={(e) => show(e, <div><b>{c.name}</b> ({c.team})<br />WAR promedio <b>{c.war.avg}</b><br />Equipo {c.teamRec.w}-{c.teamRec.l} {c.teamRec.playoffs ? '· playoffs' : '· sin playoffs'}</div>)} onPointerLeave={hide}>
              <circle cx={cx} cy={cy} r={c.top5 ? 8 : 6} fill={c.teamRec.playoffs ? col : 'var(--surface)'} stroke={col} strokeWidth={2.5} />
              <text x={cx + 12} y={cy + 4} style={{ fill: 'var(--ink)', fontWeight: c.top5 ? 700 : 500, fontSize: 11 }}>{short(c.name)}</text>
            </g>
          )
        })}
      </svg>
      {node}
    </div>
  )
}

/* Componentes del WAR de bateadores (carreras) */
export function WarParts({ cands, title }: { cands: Candidate[]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const hitters = cands.filter((c) => c.hit)
  const parts: { k: 'bat' | 'fld' | 'bsr' | 'posAdj'; label: string }[] = [
    { k: 'bat', label: 'Bateo' }, { k: 'fld', label: 'Defensa' }, { k: 'bsr', label: 'Corrido' }, { k: 'posAdj', label: 'Posición' },
  ]
  const bandH = 22
  const groupH = hitters.length * bandH + 16
  const m = { l: 74, r: 30, t: 12, b: 24 }
  const h = m.t + m.b + parts.length * groupH
  const vals = hitters.flatMap((c) => parts.map((p) => (c.hit as any)[p.k] as number))
  const lim = Math.ceil(Math.max(...vals.map(Math.abs)) / 10) * 10 || 10
  const x = scaleLinear().domain([-lim * 0.45, lim]).range([m.l, w - m.r])
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub="Carreras sobre el promedio · 10 carreras ≈ 1 victoria" /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{x.ticks(6).map((t) => <line key={t} x1={x(t)} x2={x(t)} y1={m.t} y2={h - m.b} />)}</g>
        <line x1={x(0)} x2={x(0)} y1={m.t} y2={h - m.b} stroke="var(--axis)" />
        <g className="axis">{x.ticks(6).map((t) => <text key={t} x={x(t)} y={h - 8} textAnchor="middle">{t}</text>)}</g>
        {parts.map((p, gi) => (
          <g key={p.k} transform={`translate(0 ${m.t + gi * groupH})`}>
            <text x={4} y={groupH / 2} style={{ fill: 'var(--ink)', fontWeight: 700 }}>{p.label}</text>
            {hitters.map((c, i) => {
              const v = (c.hit as any)[p.k] as number
              return (
                <g key={c.id} onPointerMove={(e) => show(e, <div><b>{c.name}</b><br />{p.label} <b>{v > 0 ? '+' : ''}{v}</b> carreras</div>)} onPointerLeave={hide}>
                  <rect x={Math.min(x(0), x(v))} y={i * bandH + 4} width={Math.abs(x(v) - x(0))} height={bandH - 6} rx={3} fill={rankVar(c.rank)} />
                  <text x={v >= 0 ? x(v) + 4 : x(v) - 4} y={i * bandH + 16} textAnchor={v >= 0 ? 'start' : 'end'} style={{ fontSize: 10 }}>{v}</text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>
      <Legend items={hitters.map((c) => ({ label: short(c.name), color: rankVar(c.rank) }))} />
      {node}
    </div>
  )
}

/* Laboratorio: contribuciones apiladas por criterio. Sirve para el MVP y para el Cy Young. */
const PALETTE = ['var(--s1)', 'var(--s2)', 'var(--s3)', 'var(--s4)', 'var(--s5)']

export function LabBars({ rows, weights, criteria = CRITERIA }: {
  rows: { c: Candidate; comp: Record<string, number>; score: number }[]
  weights: Record<string, number>
  criteria?: { key: string; label: string }[]
}) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const rowH = 34
  const m = { l: 112, r: 46, t: 6, b: 6 }
  const h = m.t + m.b + rows.length * rowH
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  const x = scaleLinear().domain([0, 100]).range([m.l, w - m.r])
  const color = (key: string) => PALETTE[criteria.findIndex((c) => c.key === key) % PALETTE.length]
  return (
    <div className="chart" ref={ref}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label="Ranking según tus pesos">
        {rows.map((r, i) => {
          let acc = 0
          const yy = m.t + i * rowH
          return (
            <g key={r.c.id} onPointerMove={(e) => show(e, <div><b>{r.c.name}</b> · puntaje <b>{r.score.toFixed(1)}</b>{criteria.map((cr) => <div key={cr.key}>{cr.label} <b>{r.comp[cr.key].toFixed(0)}</b>/100</div>)}</div>)} onPointerLeave={hide}>
              <text x={m.l - 8} y={yy + 21} textAnchor="end" style={{ fill: 'var(--ink)', fontWeight: 650 }}>{i + 1}. {short(r.c.name)}</text>
              {criteria.map((cr) => {
                const part = (r.comp[cr.key] * weights[cr.key]) / total
                const x0 = x(acc)
                acc += part
                return part > 0 ? <rect key={cr.key} x={x0} y={yy + 6} width={Math.max(0, x(acc) - x0 - 2)} height={rowH - 12} rx={3} fill={color(cr.key)} /> : null
              })}
              <text x={x(acc) + 6} y={yy + 21} style={{ fill: 'var(--ink)', fontWeight: 800 }}>{r.score.toFixed(0)}</text>
            </g>
          )
        })}
      </svg>
      <Legend items={criteria.map((c) => ({ label: c.label, color: color(c.key) }))} />
      {node}
    </div>
  )
}

/* Cy Young: efectividad frente a FIP. Debajo de la diagonal, el lanzador rindió mejor que su FIP. */
export function EraFip({ cands, title }: { cands: Candidate[]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const h = Math.round(Math.min(380, w * 0.72))
  const m = { l: 42, r: 66, t: 14, b: 38 }
  const pts = cands.filter((c) => c.pit)
  const lo = Math.floor(Math.min(...pts.map((c) => Math.min(parseFloat(c.pit!.era), c.pit!.fip))) * 2 - 0.5) / 2
  const hi = Math.ceil(Math.max(...pts.map((c) => Math.max(parseFloat(c.pit!.era), c.pit!.fip))) * 2 + 0.5) / 2
  const x = scaleLinear().domain([lo, hi]).range([m.l, w - m.r])
  const y = scaleLinear().domain([lo, hi]).range([h - m.b, m.t])
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub="Debajo de la línea, la efectividad fue mejor que el FIP. Encima, peor" /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{y.ticks(5).map((t) => <line key={t} x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} />)}{x.ticks(5).map((t) => <line key={t} x1={x(t)} x2={x(t)} y1={m.t} y2={h - m.b} />)}</g>
        <line x1={x(lo)} y1={y(lo)} x2={x(hi)} y2={y(hi)} stroke="var(--axis)" strokeDasharray="4 4" />
        <g className="axis">
          {y.ticks(5).map((t) => <text key={t} x={m.l - 6} y={y(t) + 4} textAnchor="end">{t.toFixed(1)}</text>)}
          {x.ticks(5).map((t) => <text key={t} x={x(t)} y={h - 20} textAnchor="middle">{t.toFixed(1)}</text>)}
          <text x={(m.l + w - m.r) / 2} y={h - 4} textAnchor="middle">FIP</text>
          <text transform={`translate(10 ${h / 2}) rotate(-90)`} textAnchor="middle">Efectividad (ERA)</text>
        </g>
        {pts.map((c) => {
          const col = c.top5 ? rankVar(c.rank) : 'var(--muted)'
          const era = parseFloat(c.pit!.era)
          const cx = x(c.pit!.fip)
          const cy = y(era)
          return (
            <g key={c.id} onPointerMove={(e) => show(e, <div><b>{c.name}</b> ({c.team})<br />ERA <b>{c.pit!.era}</b> · FIP <b>{c.pit!.fip}</b><br />{era < c.pit!.fip ? `ERA ${(c.pit!.fip - era).toFixed(2)} mejor que su FIP` : `ERA ${(era - c.pit!.fip).toFixed(2)} peor que su FIP`}</div>)} onPointerLeave={hide}>
              <circle cx={cx} cy={cy} r={c.top5 ? 8 : 6} fill={col} stroke="var(--surface)" strokeWidth={2} opacity={c.top5 ? 1 : 0.7} />
              <text x={cx + 12} y={cy + 4} style={{ fill: 'var(--ink)', fontWeight: c.top5 ? 700 : 500, fontSize: 11 }}>{short(c.name)}</text>
            </g>
          )
        })}
      </svg>
      {node}
    </div>
  )
}

/* Cy Young: perfil de dominio con porcentajes de Savant (ponches, bases por bolas, swings fallados, persecución) */
export function PitchProfile({ cands, title }: { cands: Candidate[]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const pitchers = cands.filter((c) => c.pit && c.pit.savant?.raw?.k_percent !== undefined)
  const parts: { k: string; l1: string; l2: string }[] = [
    { k: 'k_percent', l1: 'Ponches', l2: '%' },
    { k: 'bb_percent', l1: 'Bases por', l2: 'bolas %' },
    { k: 'whiff_percent', l1: 'Swings', l2: 'fallados %' },
    { k: 'oz_swing_percent', l1: 'Persecución', l2: 'fuera de zona' },
  ]
  const bandH = 22
  const groupH = pitchers.length * bandH + 16
  const m = { l: 92, r: 40, t: 12, b: 8 }
  const h = m.t + m.b + parts.length * groupH
  const lim = Math.ceil(Math.max(...pitchers.flatMap((c) => parts.map((p) => c.pit!.savant.raw[p.k] ?? 0))) / 5) * 5 || 10
  const x = scaleLinear().domain([0, lim]).range([m.l, w - m.r])
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub="Porcentajes de Baseball Savant. Menos bases por bolas es mejor" /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{x.ticks(5).map((t) => <line key={t} x1={x(t)} x2={x(t)} y1={m.t} y2={h - m.b} />)}</g>
        {parts.map((p, gi) => (
          <g key={p.k} transform={`translate(0 ${m.t + gi * groupH})`}>
            <text x={4} y={groupH / 2 - 4} style={{ fill: 'var(--ink)', fontWeight: 700, fontSize: 11 }}>{p.l1}</text>
            <text x={4} y={groupH / 2 + 9} style={{ fill: 'var(--ink)', fontWeight: 700, fontSize: 11 }}>{p.l2}</text>
            {pitchers.map((c, i) => {
              const v = c.pit!.savant.raw[p.k] as number
              return (
                <g key={c.id} onPointerMove={(e) => show(e, <div><b>{c.name}</b><br />{p.l1} {p.l2} <b>{v}</b></div>)} onPointerLeave={hide}>
                  <rect x={x(0)} y={i * bandH + 4} width={Math.max(2, x(v) - x(0))} height={bandH - 6} rx={3} fill={rankVar(c.rank)} />
                  <text x={x(v) + 4} y={i * bandH + 16} style={{ fontSize: 10 }}>{v}</text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>
      <Legend items={pitchers.map((c) => ({ label: short(c.name), color: rankVar(c.rank) }))} />
      {node}
    </div>
  )
}
