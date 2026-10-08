import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ALIAS_RE, CATEGORIES, GLOSSARY, aliasToId } from '../lib/glossary'

const Ctx = createContext<{ open: (id: string) => void }>({ open: () => {} })

export function GlossaryProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null)
  const back = useRef<HTMLElement | null>(null)
  const open = useCallback((k: string) => {
    if (!GLOSSARY[k]) return
    if (!id) back.current = document.activeElement as HTMLElement | null
    setId(k)
  }, [id])
  const close = useCallback(() => {
    setId(null)
    setTimeout(() => back.current?.focus?.(), 0)
  }, [])
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {id ? <Modal id={id} onClose={close} onJump={setId} /> : null}
    </Ctx.Provider>
  )
}

export const useGlossary = () => useContext(Ctx)

/* ------------------------------------------------------------------ */
/* Termino interactivo: tarjeta al pasar el mouse, ventana al hacer clic */
/* ------------------------------------------------------------------ */
export function T({ k, children }: { k: string; children?: ReactNode }) {
  const { open } = useGlossary()
  const e = GLOSSARY[k]
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  if (!e) return <>{children}</>

  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos({ x: Math.min(Math.max(8, r.left), window.innerWidth - 300), y: r.bottom + 8 > window.innerHeight - 150 ? r.top - 130 : r.bottom + 8 })
  }
  const activate = (ev: { preventDefault: () => void; stopPropagation: () => void }) => {
    ev.preventDefault()
    ev.stopPropagation()
    setPos(null)
    open(k)
  }
  return (
    <>
      <span
        ref={ref} className="term" role="button" tabIndex={0} aria-haspopup="dialog" aria-label={`${e.label}: ${e.short} Abrir explicación completa.`}
        onPointerEnter={(ev) => ev.pointerType === 'mouse' && show()} onPointerLeave={() => setPos(null)} onFocus={show} onBlur={() => setPos(null)}
        onClick={activate} onKeyDown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && activate(ev)}
      >
        {children ?? e.label}
      </span>
      {pos ? createPortal(
        <div className="gloss-card" style={{ left: pos.x, top: pos.y }} role="tooltip">
          <b>{e.label}</b> <span className="muted">· {e.full}</span>
          <div>{e.short}</div>
          <div className="small muted" style={{ marginTop: 4 }}>Haz clic para ver la explicación completa</div>
        </div>, document.body) : null}
    </>
  )
}

function linkify(text: string, seen: Set<string>, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = new RegExp(ALIAS_RE.source, 'g')
  let last = 0
  let m: RegExpExecArray | null
  let n = 0
  while ((m = re.exec(text))) {
    const id = aliasToId(m[1])
    if (!id) continue
    if (m.index > last) out.push(text.slice(last, m.index))
    if (seen.has(id)) out.push(m[1])
    else {
      seen.add(id)
      out.push(<T key={`${keyBase}-${n++}`} k={id}>{m[1]}</T>)
    }
    last = m.index + m[1].length
  }
  out.push(text.slice(last))
  return out
}

/** Convierte texto plano en texto con los terminos del glosario como enlaces (el primero de cada uno). */
export function Rich({ children }: { children: string }) {
  return <>{linkify(children, new Set(), 'r')}</>
}

/** Igual que Rich pero acepta cualquier mezcla de texto y elementos; comparte el "ya enlazado" entre los textos. */
export function RT({ children }: { children?: ReactNode }) {
  const seen = new Set<string>()
  const walk = (node: ReactNode, key: string): ReactNode => {
    if (typeof node === 'string') return <span key={key} style={{ display: 'contents' }}>{linkify(node, seen, key)}</span>
    if (Array.isArray(node)) return node.map((c, i) => walk(c, `${key}.${i}`))
    return node
  }
  return <>{walk(children, 'k')}</>
}

type PProps = React.HTMLAttributes<HTMLParagraphElement>
export const P = ({ children, ...rest }: PProps) => <p {...rest}><RT>{children}</RT></p>
export const Li = ({ children, ...rest }: React.HTMLAttributes<HTMLLIElement>) => <li {...rest}><RT>{children}</RT></li>
export const L = ({ children }: { children?: ReactNode }) => <div className="l"><RT>{children}</RT></div>
export const K = ({ children }: { children?: ReactNode }) => <div className="k"><RT>{children}</RT></div>
export const Quote = ({ children, ...rest }: React.HTMLAttributes<HTMLQuoteElement>) => <blockquote {...rest}><RT>{children}</RT></blockquote>

/* ------------------------------------------------------------------ */
/* Ventana con la explicacion completa                                   */
/* ------------------------------------------------------------------ */
function Modal({ id, onClose, onJump }: { id: string; onClose: () => void; onJump: (k: string) => void }) {
  const e = GLOSSARY[id]
  const panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') onClose()
      if (ev.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]')
        if (!f.length) return
        const first = f[0]
        const lastEl = f[f.length - 1]
        if (ev.shiftKey && document.activeElement === first) { ev.preventDefault(); lastEl.focus() }
        else if (!ev.shiftKey && document.activeElement === lastEl) { ev.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; document.removeEventListener('keydown', onKey) }
  }, [onClose])
  useEffect(() => {
    panel.current?.querySelector<HTMLElement>('button.modal-close')?.focus()
    panel.current?.scrollTo({ top: 0 })
  }, [id])

  return createPortal(
    <div className="modal-back" onMouseDown={(ev) => ev.target === ev.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="gloss-title" ref={panel}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        <div className="eyebrow">{CATEGORIES[e.category]}</div>
        <h2 id="gloss-title" style={{ marginBottom: 2 }}>{e.label}</h2>
        <p className="muted" style={{ marginTop: 0 }}>{e.full}</p>
        <p className="lede" style={{ fontSize: '1.05rem' }}>{e.short}</p>

        <h3>Qué es</h3>
        <p>{e.what}</p>

        {e.scale ? (
          <>
            <h3>Cómo se lee</h3>
            <div className="scale">
              {e.scale.map(([a, b]) => (
                <div key={a}><b>{a}</b><span>{b}</span></div>
              ))}
            </div>
            {e.scaleNote ? <p className="small muted">{e.scaleNote}</p> : null}
          </>
        ) : null}

        <h3>Para qué sirve</h3>
        <p>{e.use}</p>
        <h3>Cuánto vale y sus límites</h3>
        <p>{e.worth}</p>
        {e.example ? <blockquote><b>Ejemplo de 2026:</b> {e.example}</blockquote> : null}

        {e.related?.length ? (
          <>
            <h3 style={{ marginTop: 18 }}>Relacionado</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {e.related.map((r) => GLOSSARY[r] ? <button key={r} className="btn" onClick={() => onJump(r)}>{GLOSSARY[r].label}</button> : null)}
            </div>
          </>
        ) : null}
        <p className="small" style={{ marginTop: 18 }}><Link to="/glosario" onClick={onClose}>Ver todo el glosario</Link></p>
      </div>
    </div>,
    document.body,
  )
}
