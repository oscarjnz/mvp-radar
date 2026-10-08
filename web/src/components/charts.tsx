import { useMemo, useState } from 'react'
import { bisector, extent, line as d3line, scaleLinear } from 'd3'
import { ChartHead, Legend, useTip, usePctColor, useWidth } from './chartkit'

/* ------------------------------------------------------------------ */
/* Linea generica con crosshair                                         */
/* ------------------------------------------------------------------ */
export interface LinePoint { x: number; y: number; tag?: string }
export interface LineSeries { id: string; label: string; color: string; points: LinePoint[] }

export function LineChart({
  series, height = 240, yFmt = (v: number) => String(v), xFmt = (v: number) => String(v), yDomain, refs = [], title, sub, xLabel, tipExtra,
}: {
  series: LineSeries[]; height?: number; yFmt?: (v: number) => string; xFmt?: (v: number) => string; yDomain?: [number, number]
  refs?: { y: number; label: string }[]; title?: string; sub?: string; xLabel?: string; tipExtra?: (x: number) => string | null
}) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const m = { l: 44, r: 12, t: 10, b: 28 }
  const all = series.flatMap((s) => s.points)
  const xs = extent(all, (p) => p.x) as [number, number]
  const ys = yDomain || (extent(all, (p) => p.y) as [number, number])
  const x = scaleLinear().domain(xs).range([m.l, w - m.r])
  const pad = (ys[1] - ys[0]) * 0.08 || 1
  const y = scaleLinear().domain(yDomain ? ys : [ys[0] - pad, ys[1] + pad]).range([height - m.b, m.t]).nice()
  const gen = d3line<LinePoint>().x((p) => x(p.x)).y((p) => y(p.y))
  const xt = x.ticks(Math.min(8, Math.floor(w / 80)))
  const [hover, setHover] = useState<number | null>(null)
  const bis = useMemo(() => bisector((p: LinePoint) => p.x).center, [])

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    const xv = x.invert(((e.clientX - r.left) / r.width) * w)
    const base = series[0].points
    const i = bis(base, xv)
    const px = base[Math.max(0, Math.min(base.length - 1, i))].x
    setHover(px)
    show(e, (
      <div>
        <b>{xLabel ? `${xLabel} ${xFmt(px)}` : xFmt(px)}</b>
        {series.map((s) => {
          const pt = s.points.find((p) => p.x === px)
          return pt ? <div key={s.id}><span style={{ color: s.color }}>●</span> {s.label} <b>{yFmt(pt.y)}</b></div> : null
        })}
        {tipExtra ? <div className="muted">{tipExtra(px)}</div> : null}
      </div>
    ))
  }

  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub={sub} /> : null}
      <svg viewBox={`0 0 ${w} ${height}`} width={w} height={height} role="img" aria-label={title} onPointerMove={onMove} onPointerLeave={() => { setHover(null); hide() }}>
        <g className="grid">
          {y.ticks(5).map((t) => <line key={t} x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} />)}
        </g>
        <g className="axis">
          {y.ticks(5).map((t) => <text key={t} x={m.l - 6} y={y(t) + 4} textAnchor="end">{yFmt(t)}</text>)}
          {xt.map((t) => <text key={t} x={x(t)} y={height - 8} textAnchor="middle">{xFmt(t)}</text>)}
        </g>
        {refs.map((r) => (
          <g key={r.label}>
            <line x1={m.l} x2={w - m.r} y1={y(r.y)} y2={y(r.y)} stroke="var(--muted)" strokeDasharray="4 4" />
            <text x={w - m.r} y={y(r.y) - 4} textAnchor="end">{r.label}</text>
          </g>
        ))}
        {series.map((s) => <path key={s.id} d={gen(s.points) || ''} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
        {hover !== null ? (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={height - m.b} stroke="var(--muted)" />
            {series.map((s) => { const pt = s.points.find((p) => p.x === hover); return pt ? <circle key={s.id} cx={x(pt.x)} cy={y(pt.y)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} /> : null })}
          </g>
        ) : null}
      </svg>
      {series.length > 1 ? <Legend items={series.map((s) => ({ label: s.label, color: s.color }))} /> : null}
      {node}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Spray chart                                                          */
/* ------------------------------------------------------------------ */
const RES = ['Out', 'Sencillo', 'Doble', 'Triple', 'Jonrón']
const resColor = ['var(--muted)', 'var(--s1)', 'var(--s3)', 'var(--s4)', 'var(--s2)']

export function SprayChart({ bbe, title }: { bbe: any[]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const [only, setOnly] = useState<number | null>(null)
  const h = Math.round(w * 0.78)
  const sx = scaleLinear().domain([-150, 150]).range([0, w])
  const sy = scaleLinear().domain([-12, 190]).range([h, 0])
  const pts = bbe.filter((b) => b[0] !== null && b[1] !== null && (only === null || b[4] === only))
  const R = (r: number) => sx(r) - sx(0)
  const arc = (r: number) => `M ${sx(-r * 0.7071)} ${sy(r * 0.7071)} A ${R(r)} ${R(r)} 0 0 1 ${sx(r * 0.7071)} ${sy(r * 0.7071)}`
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub={`${bbe.length} balls in play · cada punto es un batazo`} /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <path d={`M ${sx(0)} ${sy(0)} L ${sx(-116.7)} ${sy(116.7)} A ${R(165)} ${R(165)} 0 0 1 ${sx(116.7)} ${sy(116.7)} Z`} fill="var(--surface-2)" />
        <path d={`M ${sx(0)} ${sy(0)} L ${sx(-116.7)} ${sy(116.7)}`} stroke="var(--axis)" />
        <path d={`M ${sx(0)} ${sy(0)} L ${sx(116.7)} ${sy(116.7)}`} stroke="var(--axis)" />
        <path d={arc(165)} fill="none" stroke="var(--axis)" strokeWidth={2} />
        <path d={arc(55)} fill="none" stroke="var(--axis)" strokeDasharray="3 4" />
        <path d={`M ${sx(0)} ${sy(0)} L ${sx(25.5)} ${sy(25.5)} L ${sx(0)} ${sy(51)} L ${sx(-25.5)} ${sy(25.5)} Z`} fill="none" stroke="var(--axis)" />
        {pts.map((b, i) => (
          <circle
            key={i} cx={sx(b[0])} cy={sy(b[1])} r={b[4] >= 1 ? 4 : 3} fill={resColor[b[4]]} stroke="var(--surface)" strokeWidth={1.2} opacity={b[4] === 0 ? 0.4 : 1}
            onPointerMove={(e) => show(e, <div><b>{RES[b[4]]}</b><br />Velocidad de salida <b>{b[2]} mph</b><br />Ángulo <b>{b[3]}°</b><br />xwOBA del contacto <b>{b[5]}</b></div>)}
            onPointerLeave={hide}
          />
        ))}
      </svg>
      <div className="legend" role="group" aria-label="Filtrar por resultado">
        {RES.map((r, i) => (
          <button key={r} className="btn" aria-pressed={only === i} onClick={() => setOnly(only === i ? null : i)} style={{ padding: '3px 9px' }}>
            <i style={{ background: resColor[i], display: 'inline-block', width: 9, height: 9, borderRadius: '50%', marginRight: 6 }} />
            {r}
          </button>
        ))}
      </div>
      {node}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Velocidad de salida vs angulo                                        */
/* ------------------------------------------------------------------ */
export function EvLaScatter({ bbe, title }: { bbe: any[]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const h = Math.round(Math.min(380, w * 0.7))
  const m = { l: 40, r: 10, t: 10, b: 32 }
  const x = scaleLinear().domain([-70, 90]).range([m.l, w - m.r])
  const y = scaleLinear().domain([40, 122]).range([h - m.b, m.t])
  const barrel = [[26, 98], [8, 116], [8, 122], [50, 122], [50, 116], [30, 98]].map(([la, ev]) => `${x(la)},${y(ev)}`).join(' ')
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub="La zona sombreada marca los barrels" /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{y.ticks(6).map((t) => <line key={t} x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} />)}</g>
        <polygon points={barrel} fill="var(--s2)" opacity={0.18} stroke="var(--s2)" strokeDasharray="4 3" />
        <line x1={x(0)} x2={x(0)} y1={m.t} y2={h - m.b} stroke="var(--axis)" />
        <g className="axis">
          {y.ticks(6).map((t) => <text key={t} x={m.l - 6} y={y(t) + 4} textAnchor="end">{t}</text>)}
          {x.ticks(8).map((t) => <text key={t} x={x(t)} y={h - 14} textAnchor="middle">{t}°</text>)}
          <text x={w / 2} y={h - 1} textAnchor="middle">Ángulo de lanzamiento</text>
          <text transform={`translate(10 ${h / 2}) rotate(-90)`} textAnchor="middle">Velocidad de salida (mph)</text>
        </g>
        {bbe.map((b, i) => (
          <circle
            key={i} cx={x(b[3])} cy={y(b[2])} r={3} fill={resColor[b[4]]} opacity={b[4] === 0 ? 0.4 : 0.95} stroke="var(--surface)" strokeWidth={0.8}
            onPointerMove={(e) => show(e, <div><b>{RES[b[4]]}</b><br />{b[2]} mph a {b[3]}°<br />xwOBA <b>{b[5]}</b></div>)} onPointerLeave={hide}
          />
        ))}
      </svg>
      <Legend items={RES.map((r, i) => ({ label: r, color: resColor[i] }))} />
      {node}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mapa de zona de strike                                               */
/* ------------------------------------------------------------------ */
export function ZoneHeat({ zones, metric = 'xwoba', title, good = 'high' }: { zones: Record<string, any>; metric?: 'xwoba' | 'woba'; title?: string; good?: 'high' | 'low' }) {
  const color = usePctColor()
  const { show, hide, node } = useTip()
  const order = ['1', '2', '3', '4', '5', '6', '7', '8', '9']
  const val = (z: any) => (z ? z[metric] : null)
  const toPct = (v: number | null) => {
    if (v === null || v === undefined) return 50
    const p = Math.max(0, Math.min(100, ((v - 0.15) / (0.5 - 0.15)) * 100))
    return good === 'high' ? p : 100 - p
  }
  return (
    <div>
      {title ? <ChartHead title={title} sub="Vista del catcher · promedio de liga cerca de .320" /> : null}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, maxWidth: 320, margin: '0 auto' }} role="table" aria-label={title}>
        {order.map((k) => {
          const z = zones[k]
          const v = val(z)
          const c = z && z.n >= 25 ? color(toPct(v)) : 'var(--surface-2)'
          return (
            <div
              role="cell" key={k}
              onPointerMove={(e) => z && show(e, <div><b>Zona {k}</b><br />{z.n} lanzamientos<br />Swing <b>{z.swing}%</b> · Whiff <b>{z.whiff ?? '-'}%</b><br />wOBA <b>{z.woba ?? '-'}</b> · xwOBA <b>{z.xwoba ?? '-'}</b></div>)}
              onPointerLeave={hide}
              style={{ aspectRatio: '1 / 1.1', background: c, borderRadius: 6, display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: '1.05rem', textShadow: '0 1px 2px rgba(0,0,0,0.35)' }}
            >
              {v !== null && v !== undefined && z.n >= 25 ? String(v).replace(/^0/, '') : '·'}
            </div>
          )
        })}
      </div>
      <div className="small muted" style={{ textAlign: 'center', marginTop: 8 }}>El rojo indica más daño del bateador y el azul, menos. Las celdas con menos de 25 lanzamientos quedan vacías.</div>
      {node}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Barras mensuales                                                     */
/* ------------------------------------------------------------------ */
const MONTHS = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function MonthBars({ rows, valueKey, fmt, title, sub, color = 'var(--s1)', refValue, refLabel, lowerIsBetter }: {
  rows: any[]; valueKey: string; fmt: (v: number) => string; title: string; sub?: string; color?: string; refValue?: number; refLabel?: string; lowerIsBetter?: boolean
}) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const h = 210
  const m = { l: 36, r: 10, t: 16, b: 28 }
  const data = rows.map((r) => ({ m: MONTHS[Number(String(r.m).slice(-2).replace(/\D/g, '')) || 0] || r.m, v: parseFloat(r[valueKey]), r }))
  const max = Math.max(...data.map((d) => d.v), refValue || 0) * 1.12
  const y = scaleLinear().domain([0, max]).range([h - m.b, m.t])
  const bw = Math.min(54, (w - m.l - m.r) / data.length - 8)
  const x = (i: number) => m.l + ((w - m.l - m.r) / data.length) * (i + 0.5)
  return (
    <div className="chart" ref={ref}>
      <ChartHead title={title} sub={sub} />
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{y.ticks(4).map((t) => <line key={t} x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} />)}</g>
        <g className="axis">{y.ticks(4).map((t) => <text key={t} x={m.l - 5} y={y(t) + 4} textAnchor="end">{fmt(t)}</text>)}</g>
        {data.map((d, i) => (
          <g key={i} onPointerMove={(e) => show(e, <div><b>{d.m}</b><br />{Object.entries(d.r).filter(([k]) => k !== 'm').map(([k, v]) => <div key={k}>{k} <b>{String(v)}</b></div>)}</div>)} onPointerLeave={hide}>
            <rect x={x(i) - bw / 2} y={y(d.v)} width={bw} height={h - m.b - y(d.v)} rx={4} fill={color} />
            <text x={x(i)} y={y(d.v) - 4} textAnchor="middle" style={{ fontWeight: 700, fill: 'var(--ink)' }}>{fmt(d.v)}</text>
            <text x={x(i)} y={h - 10} textAnchor="middle">{d.m}</text>
          </g>
        ))}
        {refValue ? <g><line x1={m.l} x2={w - m.r} y1={y(refValue)} y2={y(refValue)} stroke="var(--muted)" strokeDasharray="4 4" /><text x={w - m.r} y={y(refValue) - 4} textAnchor="end">{refLabel}</text></g> : null}
      </svg>
      {node}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Movimiento de lanzamientos                                           */
/* ------------------------------------------------------------------ */
export function MovementPlot({ movement, arsenal, title }: { movement: any[]; arsenal: any[]; title?: string }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const { show, hide, node } = useTip()
  const h = Math.round(Math.min(380, w * 0.85))
  const m = { l: 36, r: 10, t: 10, b: 30 }
  const x = scaleLinear().domain([-26, 26]).range([m.l, w - m.r])
  const y = scaleLinear().domain([-26, 26]).range([h - m.b, m.t])
  const colorOf = (code: string) => `var(--s${Math.min(5, arsenal.findIndex((a) => a.code === code) + 1)})`
  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub="Pulgadas · vista del catcher · sin gravedad" /> : null}
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} role="img" aria-label={title}>
        <g className="grid">{[-20, -10, 10, 20].map((t) => <g key={t}><line x1={x(t)} x2={x(t)} y1={m.t} y2={h - m.b} /><line x1={m.l} x2={w - m.r} y1={y(t)} y2={y(t)} /></g>)}</g>
        <line x1={x(0)} x2={x(0)} y1={m.t} y2={h - m.b} stroke="var(--axis)" />
        <line x1={m.l} x2={w - m.r} y1={y(0)} y2={y(0)} stroke="var(--axis)" />
        <g className="axis">
          {[-20, -10, 0, 10, 20].map((t) => <text key={t} x={x(t)} y={h - 14} textAnchor="middle">{t}</text>)}
          {[-20, -10, 10, 20].map((t) => <text key={t} x={m.l - 6} y={y(t) + 4} textAnchor="end">{t}</text>)}
          <text x={w / 2} y={h - 1} textAnchor="middle">Movimiento horizontal (in)</text>
          <text transform={`translate(9 ${h / 2}) rotate(-90)`} textAnchor="middle">Movimiento vertical inducido (in)</text>
        </g>
        {movement.map((p, i) => (
          <circle key={i} cx={x(p[1])} cy={y(p[2])} r={3} fill={colorOf(p[0])} opacity={0.8} stroke="var(--surface)" strokeWidth={0.7}
            onPointerMove={(e) => show(e, <div><b>{arsenal.find((a) => a.code === p[0])?.name}</b><br />H {p[1]} in · V {p[2]} in</div>)} onPointerLeave={hide} />
        ))}
      </svg>
      <Legend items={arsenal.slice(0, 5).map((a, i) => ({ label: a.name, color: `var(--s${i + 1})` }))} />
      {node}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Ubicación de los lanzamientos, zonas Statcast 1 a 9 y 11 a 14          */
/* ------------------------------------------------------------------ */
const HW = 17 / 24 // mitad del home plate en pies (17 pulgadas de ancho)
const ZONE_NAME: Record<string, string> = {
  '1': 'arriba a la izquierda', '2': 'arriba al centro', '3': 'arriba a la derecha',
  '4': 'centro a la izquierda', '5': 'centro de la zona', '6': 'centro a la derecha',
  '7': 'abajo a la izquierda', '8': 'abajo al centro', '9': 'abajo a la derecha',
  '11': 'fuera, arriba a la izquierda', '12': 'fuera, arriba a la derecha', '13': 'fuera, abajo a la izquierda', '14': 'fuera, abajo a la derecha',
}
const OUTCOME = ['Bola', 'Strike cantado', 'Swing y fallo', 'Foul', 'En juego', 'Golpeó al bateador']
const ZONE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '11', '12', '13', '14']
const GAP = 1.5

interface ZAgg { n: number; sw: number; wh: number; cs: number; pa: number; wn: number; vn: number; byCode: { code: string; n: number; v: number | null }[] }

export function StrikeZoneView({ location, arsenal, zoneMap, szTop = 3.5, szBot = 1.5, title }: {
  location: any[]; arsenal: any[]; zoneMap?: Record<string, Record<string, any>>; szTop?: number; szBot?: number; title?: string
}) {
  const [ref, w0] = useWidth<HTMLDivElement>()
  const [mode, setMode] = useState<'dots' | 'freq'>('freq')
  const codes: string[] = useMemo(() => arsenal.map((a) => a.code), [arsenal])
  const [off, setOff] = useState<string[]>([])
  const [hz, setHz] = useState<string | null>(null)
  const { show, hide, node } = useTip()
  const color = usePctColor()

  const W = Math.min(280, Math.max(220, w0))
  const X0 = -1.25, X1 = 1.25, Z0 = szBot - 0.6, Z1 = szTop + 0.6
  const H = Math.round((W * (Z1 - Z0)) / (X1 - X0))
  const PAD = 52 // espacio para home plate
  const x = scaleLinear().domain([X0, X1]).range([0, W])
  const y = scaleLinear().domain([Z0, Z1]).range([H, 0])
  const mid = (szTop + szBot) / 2
  const cw = (2 * HW) / 3
  const ch = (szTop - szBot) / 3
  const colorOf = (code: string) => `var(--s${Math.min(5, codes.indexOf(code) + 1)})`
  const nameOf = (code: string) => arsenal.find((a) => a.code === code)?.name ?? code
  const on = (code: string) => !off.includes(code)

  /* geometría de las 13 zonas */
  const shapes = useMemo(() => {
    const s: Record<string, { x: number; y: number; w: number; h: number; lx: number; ly: number }> = {}
    for (let i = 0; i < 9; i++) {
      const col = i % 3, row = Math.floor(i / 3)
      const xa = x(-HW + col * cw), xb = x(-HW + (col + 1) * cw)
      const ya = y(szTop - row * ch), yb = y(szTop - (row + 1) * ch)
      s[String(i + 1)] = { x: xa + GAP, y: ya + GAP, w: xb - xa - 2 * GAP, h: yb - ya - 2 * GAP, lx: (xa + xb) / 2, ly: (ya + yb) / 2 }
    }
    const q = (k: string, xa: number, xb: number, za: number, zb: number, lx: number, lz: number) => {
      s[k] = { x: x(xa) + GAP, y: y(zb) + GAP, w: x(xb) - x(xa) - 2 * GAP, h: y(za) - y(zb) - 2 * GAP, lx: x(lx), ly: y(lz) }
    }
    const cxl = (X0 - HW) / 2, cxr = (HW + X1) / 2
    const czt = (szTop + Z1) / 2, czb = (szBot + Z0) / 2
    q('11', X0, 0, mid, Z1, cxl, czt)
    q('12', 0, X1, mid, Z1, cxr, czt)
    q('13', X0, 0, Z0, mid, cxl, czb)
    q('14', 0, X1, Z0, mid, cxr, czb)
    return s
  }, [W, H, szTop, szBot]) // eslint-disable-line react-hooks/exhaustive-deps

  /* agregados por zona con todos los lanzamientos de los tipos activos */
  const agg = useMemo(() => {
    const out: Record<string, ZAgg> = {}
    ZONE_KEYS.forEach((k) => {
      const a: ZAgg = { n: 0, sw: 0, wh: 0, cs: 0, pa: 0, wn: 0, vn: 0, byCode: [] }
      codes.filter(on).forEach((c) => {
        const z = zoneMap?.[k]?.[c]
        if (!z) return
        a.n += z.n; a.sw += z.sw; a.wh += z.wh; a.cs += z.cs; a.pa += z.pa
        a.wn += (z.woba ?? 0) * z.pa
        a.vn += (z.v ?? 0) * z.n
        a.byCode.push({ code: c, n: z.n, v: z.v })
      })
      out[k] = a
    })
    return out
  }, [zoneMap, codes, off]) // eslint-disable-line react-hooks/exhaustive-deps
  const total = ZONE_KEYS.reduce((s, k) => s + agg[k].n, 0)
  const inZone = ZONE_KEYS.slice(0, 9).reduce((s, k) => s + agg[k].n, 0)
  const swAll = ZONE_KEYS.reduce((s, k) => s + agg[k].sw, 0)
  const whAll = ZONE_KEYS.reduce((s, k) => s + agg[k].wh, 0)
  const maxN = Math.max(1, ...ZONE_KEYS.map((k) => agg[k].n))
  const pct = (v: number, d = total) => (d ? `${(100 * v / d).toFixed(v / d >= 0.095 ? 0 : 1)}%` : '-')

  const zoneTip = (e: React.PointerEvent, k: string) => {
    const a = agg[k]
    if (!a || !a.n) { show(e, <div><b>Zona {k}</b><br />Sin lanzamientos registrados</div>); return }
    const sorted = [...a.byCode].sort((p, q2) => q2.n - p.n)
    show(e, (
      <div>
        <b>Zona {k}</b> <span className="muted">{ZONE_NAME[k]}</span>
        <div><b>{a.n}</b> lanzamientos, <b>{pct(a.n)}</b> del total</div>
        <div style={{ marginTop: 4 }}>
          {sorted.map((s) => (
            <div key={s.code}><span style={{ color: colorOf(s.code) }}>●</span> {nameOf(s.code)} <b>{pct(s.n, a.n)}</b>{s.v ? <span className="muted"> a {s.v} mph</span> : null}</div>
          ))}
        </div>
        <div style={{ marginTop: 4 }}>
          Swing <b>{pct(a.sw, a.n)}</b> · Whiff <b>{a.sw ? pct(a.wh, a.sw) : '-'}</b>
          <br />Strike cantado <b>{pct(a.cs, a.n)}</b>
          {a.pa ? <><br />wOBA <b>{(a.wn / a.pa).toFixed(3).replace(/^0/, '')}</b> <span className="muted">en {a.pa} turnos</span></> : null}
        </div>
      </div>
    ))
  }

  const toggle = (c: string) => setOff((o) => {
    const next = o.includes(c) ? o.filter((z) => z !== c) : [...o, c]
    return next.length >= codes.length ? [] : next
  })

  const pts = location.filter((p) => on(p[0]) && p[1] > X0 && p[1] < X1 && p[2] > Z0 && p[2] < Z1)
  const plateW = (x(HW) - x(-HW)) * 0.45
  const plateY = H + 8

  return (
    <div className="chart" ref={ref}>
      {title ? <ChartHead title={title} sub={`Vista del catcher · ${total ? total.toLocaleString('en-US') : location.length} lanzamientos`} /> : null}
      <div className="zonebar">
        <div className="tabs" role="group" aria-label="Tipo de vista">
          <button aria-pressed={mode === 'freq'} onClick={() => setMode('freq')}>Bloques</button>
          <button aria-pressed={mode === 'dots'} onClick={() => setMode('dots')}>Lanzamientos</button>
        </div>
        <div className="zonechips" role="group" aria-label="Filtrar por tipo de lanzamiento">
          {arsenal.slice(0, 5).map((a) => (
            <button key={a.code} className="chip" aria-pressed={on(a.code)} onClick={() => toggle(a.code)} title={`Mostrar u ocultar ${a.name}`}>
              <i style={{ background: colorOf(a.code) }} />{a.name}
            </button>
          ))}
        </div>
      </div>
      <div className="zonewrap">
        <svg viewBox={`0 0 ${W} ${H + PAD}`} width={W} height={H + PAD} role="img" aria-label={title} style={{ width: W, maxWidth: '100%', height: 'auto', flex: '0 0 auto' }}>
          {/* zonas 11 a 14 */}
          {['11', '12', '13', '14'].map((k) => {
            const s = shapes[k], a = agg[k]
            const fill = mode === 'freq' && a.n ? color(12 + 83 * (a.n / maxN)) : 'var(--surface-2)'
            return (
              <g key={k} onPointerMove={(e) => { setHz(k); zoneTip(e, k) }} onPointerLeave={() => { setHz(null); hide() }}>
                <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={8} fill={fill} />
                {mode === 'freq'
                  ? <text x={s.lx} y={s.ly + 5} textAnchor="middle" className="zlabel">{pct(a.n)}</text>
                  : <text x={s.lx} y={s.ly + 4} textAnchor="middle" opacity={0.55}>{k}</text>}
              </g>
            )
          })}
          {/* marco de la zona de strike */}
          <rect x={x(-HW) - 4} y={y(szTop) - 4} width={x(HW) - x(-HW) + 8} height={y(szBot) - y(szTop) + 8} rx={8} fill="var(--surface)" />
          {/* zonas 1 a 9 */}
          {ZONE_KEYS.slice(0, 9).map((k) => {
            const s = shapes[k], a = agg[k]
            const fill = mode === 'freq' && a.n ? color(12 + 83 * (a.n / maxN)) : 'var(--surface)'
            return (
              <g key={k} onPointerMove={(e) => { setHz(k); zoneTip(e, k) }} onPointerLeave={() => { setHz(null); hide() }}>
                <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={5} fill={fill} stroke={mode === 'dots' ? 'var(--axis)' : 'none'} />
                {mode === 'freq'
                  ? <text x={s.lx} y={s.ly + 5} textAnchor="middle" className="zlabel">{pct(a.n)}</text>
                  : <text x={s.x + 6} y={s.y + 13} fontSize={10} opacity={0.55}>{k}</text>}
              </g>
            )
          })}
          {mode === 'dots' ? <rect x={x(-HW)} y={y(szTop)} width={x(HW) - x(-HW)} height={y(szBot) - y(szTop)} fill="none" stroke="var(--ink)" strokeWidth={1.6} pointerEvents="none" /> : null}
          {hz ? <rect x={shapes[hz].x} y={shapes[hz].y} width={shapes[hz].w} height={shapes[hz].h} rx={hz.length === 1 ? 5 : 8} fill="none" stroke="var(--ink)" strokeWidth={2} pointerEvents="none" /> : null}
          {/* lanzamientos */}
          {mode === 'dots' ? pts.map((p, i) => (
            <circle key={i} className="pdot" cx={x(p[1])} cy={y(p[2])} r={3.3} fill={colorOf(p[0])} fillOpacity={0.8} stroke="var(--surface)" strokeWidth={0.6}
              onPointerMove={(e) => show(e, (
                <div>
                  <b>{nameOf(p[0])}</b>{p[3] ? <> a <b>{p[3]}</b> mph</> : null}
                  <br />{OUTCOME[p[4]] ?? 'Sin dato'}
                  <br /><span className="muted">Lateral {p[1]} ft · Altura {p[2]} ft{p[5] ? ` · bateador ${p[5] === 'L' ? 'zurdo' : 'derecho'}` : ''}</span>
                </div>
              ))}
              onPointerLeave={hide} />
          )) : null}
          {/* home plate */}
          <polygon points={[[0, 0], [plateW, 0], [plateW, plateW * 0.3], [plateW / 2, plateW * 0.5], [0, plateW * 0.3]].map(([a, b]) => `${x(0) - plateW / 2 + a},${plateY + b}`).join(' ')} fill="var(--surface)" stroke="var(--ink)" strokeWidth={1.4} />
        </svg>
        <div className="zoneside">
          <table className="ptable">
            <thead><tr><th>Lanzamiento</th><th>En zona</th><th>Velo</th><th>Whiff</th></tr></thead>
            <tbody>
              {arsenal.slice(0, 5).map((a) => {
                const tot = ZONE_KEYS.reduce((s, k) => s + (zoneMap?.[k]?.[a.code]?.n ?? 0), 0)
                const inn = ZONE_KEYS.slice(0, 9).reduce((s, k) => s + (zoneMap?.[k]?.[a.code]?.n ?? 0), 0)
                return (
                  <tr key={a.code} style={{ opacity: on(a.code) ? 1 : 0.4 }}>
                    <td><i style={{ background: colorOf(a.code) }} />{a.name}</td>
                    <td>{tot ? pct(inn, tot) : '-'}</td>
                    <td>{a.velo ? `${a.velo}` : '-'}</td>
                    <td>{a.whiff != null ? `${a.whiff}%` : '-'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <div className="statline" style={{ marginTop: 10 }}>
            <span><b>{pct(inZone)}</b> en la zona (1 a 9)</span>
            <span><b>{pct(total - inZone)}</b> fuera (11 a 14)</span>
            <span><b>{swAll ? pct(whAll, swAll) : '-'}</b> de whiff en swings</span>
          </div>
          <div className="small muted" style={{ marginTop: 8 }}>
            {mode === 'freq'
              ? 'Cada bloque muestra el porcentaje de lanzamientos que cayó en esa zona. El rojo marca donde más tira y el azul donde menos. Pasa el cursor por un bloque para ver el desglose.'
              : `Se muestra una muestra de ${pts.length} lanzamientos. Pasa el cursor por un punto o por una zona para ver el detalle.`}
            {' '}La zona de strike usa el promedio de los bateadores enfrentados ({szBot.toFixed(1)} a {szTop.toFixed(1)} pies).
          </div>
        </div>
      </div>
      {node}
    </div>
  )
}
