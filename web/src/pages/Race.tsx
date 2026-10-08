import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useCandidates } from '../lib/data'
import type { Candidate, League } from '../lib/types'
import { leagueName, slash } from '../lib/format'
import { CRITERIA, PRESETS, rankPool, type Weights } from '../lib/scoring'
import { DataTable, ErrorBox, Face, Loading, NameLink, PlayerCard, Section, Tabs } from '../components/ui'
import { ValueScatter, WarDumbbell, WarParts, LabBars } from '../components/racecharts'
import { P, Rich } from '../components/Term'

const PANEL: Record<League, string[]> = {
  AL: ['Yordan Alvarez', 'Junior Caminero', 'Bobby Witt Jr.', 'Cam Schlittler', 'Ben Rice'],
  NL: ['Pete Crow-Armstrong', 'Shohei Ohtani', 'Jacob Misiorowski', 'Elly De La Cruz', 'Kyle Schwarber'],
}

export default function Race() {
  const { data, error } = useCandidates()
  const [sp, setSp] = useSearchParams()
  const lg = (sp.get('liga') === 'NL' ? 'NL' : 'AL') as League
  const [weights, setWeights] = useState<Weights>(PRESETS[0].w)
  const [preset, setPreset] = useState<string>('typical')

  const pool = useMemo<Candidate[]>(() => (data ? [...data.leagues[lg].top5, ...data.leagues[lg].bubble] : []), [data, lg])
  const ranking = useMemo(() => rankPool(pool, weights), [pool, weights])

  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const top = data.leagues[lg].top5
  const bubble = data.leagues[lg].bubble

  const rowsFor = (arr: Candidate[]) => arr.map((c) => [
    <Link key="n" to={`/jugador/${c.id}`}>{c.name}</Link>, c.team, `${c.teamRec.w}-${c.teamRec.l}${c.teamRec.playoffs ? ' ★' : ''}`,
    c.war.f, c.war.b, c.hit ? c.hit.wrcPlus : '-', c.pit ? c.pit.era : '-', c.hit ? c.hit.hr : '-', c.hit ? c.hit.sb : '-',
    c.hit?.wpa ?? '-', c.hit?.re24 ?? '-',
  ])

  return (
    <div className="wrap">
      <div className="eyebrow">Carrera 2026</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Top 5 al MVP de la {leagueName(lg)}</h1>
      <P className="lede">Temporada regular cerrada el 27 de septiembre. Orden basado en WAR de dos fuentes, producción, impacto en juegos, equipo y disponibilidad. La foto y el nombre de cada jugador llevan a su perfil completo.</P>
      <Tabs value={lg} onChange={(v) => setSp({ liga: v })} options={[{ id: 'AL', label: 'Liga Americana' }, { id: 'NL', label: 'Liga Nacional' }]} />

      <div className="grid" style={{ marginTop: 20 }}>
        {top.map((c) => (
          <div key={c.id}>
            <PlayerCard c={c} />
            <P className="small muted" style={{ margin: '6px 4px 0' }}>{c.narrative.tagline} <b>{c.narrative.outlook}</b></P>
          </div>
        ))}
      </div>

      <Section title="Cómo se comparan" eyebrow="Comparación" lede="Tres gráficos para comparar a los candidatos. El primero muestra que las dos grandes fuentes de WAR no siempre cuentan la misma historia.">
        <div className="grid g2">
          <div className="card"><WarDumbbell cands={top} title="WAR por fuente" /></div>
          <div className="card"><ValueScatter cands={pool} title="Valor frente a equipo" /></div>
        </div>
        <div className="card" style={{ marginTop: 16 }}><WarParts cands={top} title="De dónde sale el valor de los bateadores" /></div>
      </Section>

      <Section title="Tabla completa" eyebrow="Estadísticas">
        <div className="card">
          <DataTable
            head={['Jugador', 'Eq.', 'Récord', 'fWAR', 'bWAR', 'wRC+', 'ERA', 'HR', 'SB', 'WPA', 'RE24']}
            rows={[...rowsFor(top), ...rowsFor(bubble)]}
            caption="Candidatos y burbuja"
            left={[1]}
          />
          <P className="small muted" style={{ marginTop: 8 }}>★ equipo en playoffs. WPA y RE24 de Baseball Reference (solo bateadores). fWAR de FanGraphs (vía MLB Stats API) y bWAR de Baseball Reference. Ohtani suma bateo y pitcheo.</P>
        </div>
      </Section>

      <Section title="Laboratorio de boletas" eyebrow="Simulador" lede="Los votantes no usan la misma receta. Mueve los pesos y observa cómo cambia el orden. Los puntajes van de 0 a 100 dentro de este grupo de candidatos.">
        <div className="card">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }} role="group" aria-label="Presets de pesos">
            {PRESETS.map((p) => (
              <button key={p.id} className="btn" aria-pressed={preset === p.id} onClick={() => { setWeights(p.w); setPreset(p.id) }} title={p.note}>{p.label}</button>
            ))}
          </div>
          {CRITERIA.map((cr) => (
            <div className="slider-row" key={cr.key}>
              <label htmlFor={`w-${cr.key}`} title={cr.hint}><Rich>{cr.label}</Rich></label>
              <input id={`w-${cr.key}`} type="range" min={0} max={100} value={weights[cr.key]} onChange={(e) => { setWeights({ ...weights, [cr.key]: Number(e.target.value) }); setPreset('') }} />
              <span className="num">{weights[cr.key]}</span>
            </div>
          ))}
          <P className="small muted">{PRESETS.find((p) => p.id === preset)?.note || 'Pesos personalizados.'}</P>
          <LabBars rows={ranking.slice(0, 8)} weights={weights} />
        </div>
      </Section>

      <Section title="Comparado con la encuesta de MLB.com" eyebrow="Contraste">
        <div className="card">
          <P>El panel de MLB.com, en su encuesta de septiembre, ordenó así a los candidatos de la {leagueName(lg)}, <b>{PANEL[lg].join(' · ')}</b>. El análisis de esta página difiere sobre todo en cómo trata a los lanzadores y a quien suma mucho WAR en un equipo sin playoffs.</P>
        </div>
      </Section>

      <Section title="Otros candidatos considerados" eyebrow="Fuera del top 5">
        <div className="grid g2">
          {bubble.map((c) => (
            <div className="card" key={c.id}>
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 14, alignItems: 'center' }}>
                <Face id={c.id} name={c.name} width={72} color="var(--muted)" />
                <div>
                  <h3 style={{ margin: 0 }}><NameLink id={c.id} name={c.name} /> <span className="muted small">({c.team})</span></h3>
                  <div className="statline"><span><b>{c.war.f}</b> fWAR</span><span><b>{c.war.b}</b> bWAR</span>{c.hit ? <><span><b>{c.hit.wrcPlus}</b> wRC+</span><span><b>{c.hit.hr}</b> HR</span><span><b>{slash(c.hit.ops)}</b> OPS</span></> : null}{c.pit ? <><span><b>{c.pit.era}</b> ERA</span><span><b>{c.pit.so}</b> K</span></> : null}</div>
                </div>
              </div>
              <P style={{ marginTop: 10 }}>{c.narrative.verdict}</P>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
