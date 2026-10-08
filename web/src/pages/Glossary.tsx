import { useMemo, useState } from 'react'
import { CATEGORIES, ENTRIES, type Category } from '../lib/glossary'
import { useGlossary } from '../components/Term'
import { Section } from '../components/ui'

export default function Glossary() {
  const { open } = useGlossary()
  const [q, setQ] = useState('')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return ENTRIES.filter((e) => !t || `${e.label} ${e.full} ${e.short}`.toLowerCase().includes(t))
  }, [q])
  const cats = Object.keys(CATEGORIES) as Category[]
  return (
    <div className="wrap">
      <div className="eyebrow">Para entender los números</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Glosario</h1>
      <p className="lede">Cada término de esta web se explica en lenguaje de aficionado, con lo que mide, cómo se lee, para qué sirve y cuánto se puede confiar en él. En cualquier página, los términos subrayados con puntos abren esta misma explicación al hacer clic.</p>
      <input className="gloss-search" type="search" placeholder="Buscar un término (WAR, OPS, xwOBA...)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar un término" />
      {cats.map((c) => {
        const items = list.filter((e) => e.category === c)
        if (!items.length) return null
        return (
          <Section key={c} title={CATEGORIES[c]}>
            <div className="grid g2">
              {items.map((e) => (
                <button key={e.id} className="card gloss-item" onClick={() => open(e.id)}>
                  <h3>{e.label}</h3>
                  <div className="small muted" style={{ marginBottom: 6 }}>{e.full}</div>
                  <div>{e.short}</div>
                </button>
              ))}
            </div>
          </Section>
        )
      })}
      {!list.length ? <p className="muted" style={{ marginTop: 20 }}>No hay términos que coincidan con la búsqueda.</p> : null}
    </div>
  )
}
