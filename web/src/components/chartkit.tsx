import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { interpolateRgb } from 'd3'
import { useTheme } from '../lib/theme'

/** Ancho real del contenedor (para que el texto de los SVG no se encoja en moviles). */
export function useWidth<T extends HTMLElement>(min = 280): [React.RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [w, setW] = useState(640)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(Math.max(min, Math.floor(el.clientWidth))))
    ro.observe(el)
    setW(Math.max(min, Math.floor(el.clientWidth)))
    return () => ro.disconnect()
  }, [min])
  return [ref, w]
}

export interface TipState { x: number; y: number; content: ReactNode }

export function useTip() {
  const [tip, setTip] = useState<TipState | null>(null)
  const show = useCallback((e: { clientX: number; clientY: number }, content: ReactNode) => setTip({ x: e.clientX, y: e.clientY, content }), [])
  const hide = useCallback(() => setTip(null), [])
  const node = tip ? <TipBox tip={tip} /> : null
  return { show, hide, node }
}

function TipBox({ tip }: { tip: TipState }) {
  const left = Math.min(tip.x + 14, window.innerWidth - 270)
  const top = tip.y + 16 > window.innerHeight - 120 ? tip.y - 90 : tip.y + 16
  return (
    <div className="tooltip" style={{ left, top }} role="status">
      {tip.content}
    </div>
  )
}

/** Escala divergente estilo Savant: azul (bajo) -> gris -> rojo (elite). */
export function usePctColor() {
  const { mode } = useTheme()
  const blue = mode === 'dark' ? '#3987e5' : '#2a78d6'
  const mid = mode === 'dark' ? '#4a4a47' : '#d2d1ca'
  const red = mode === 'dark' ? '#e66767' : '#e34948'
  const lo = interpolateRgb(blue, mid)
  const hi = interpolateRgb(mid, red)
  return (p: number) => (p <= 50 ? lo(p / 50) : hi((p - 50) / 50))
}

export const rankVar = (rank: number) => `var(--s${Math.min(5, Math.max(1, rank))})`

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="legend">
      {items.map((i) => (
        <span key={i.label}>
          <i style={{ background: i.color }} />
          {i.label}
        </span>
      ))}
    </div>
  )
}

export function ChartHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="charthead">
      <h3>{title}</h3>
      {sub ? <span className="muted small">{sub}</span> : null}
    </div>
  )
}
