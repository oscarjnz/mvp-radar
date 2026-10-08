import { usePctColor } from './chartkit'

export interface PctRow {
  label: string
  /** valor ya formateado, por ejemplo ".442" o "94.4 mph" */
  value: string
  pct: number
  hint?: string
}

/** Barras de percentil al estilo de Baseball Savant (azul = bajo, rojo = elite). */
export default function PercentileBars({ rows, title }: { rows: PctRow[]; title?: string }) {
  const color = usePctColor()
  return (
    <div role="table" aria-label={title || 'Percentiles de Baseball Savant'}>
      {rows.map((r) => {
        const c = color(r.pct)
        return (
          <div role="row" key={r.label} title={r.hint} style={{ display: 'grid', gridTemplateColumns: 'minmax(96px, 1.1fr) 3fr 56px', alignItems: 'center', gap: 10, padding: '5px 0' }}>
            <div role="cell" style={{ fontSize: '0.85rem', color: 'var(--ink-2)' }}>{r.label}</div>
            <div role="cell" style={{ position: 'relative', height: 22 }}>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 9, height: 4, borderRadius: 2, background: 'var(--grid)' }} />
              <div style={{ position: 'absolute', left: 0, width: `${r.pct}%`, top: 9, height: 4, borderRadius: 2, background: c }} />
              <div
                style={{
                  position: 'absolute', left: `calc(${r.pct}% - 11px)`, top: 0, width: 22, height: 22, borderRadius: '50%', background: c,
                  display: 'grid', placeItems: 'center', color: '#fff', fontSize: 11, fontWeight: 800, boxShadow: '0 0 0 2px var(--surface)',
                }}
                aria-label={`percentil ${Math.round(r.pct)}`}
              >
                {Math.round(r.pct)}
              </div>
            </div>
            <div role="cell" className="num" style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.85rem' }}>{r.value}</div>
          </div>
        )
      })}
      <div className="small muted" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        <span>Peor</span>
        <span>Percentil entre jugadores de MLB (2026)</span>
        <span>Mejor</span>
      </div>
    </div>
  )
}
