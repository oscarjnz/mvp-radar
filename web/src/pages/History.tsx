import { useSearchParams } from 'react-router-dom'
import { QUOTES, QUOTE_MAP, NOTE_2020, STORY } from '../data/histStory'
import { useCompare, useHistory } from '../lib/data'
import type { HistLeague, League } from '../lib/types'
import { leagueName, slash, teamLogo } from '../lib/format'
import { AwardSwitch, useAward } from '../lib/award'
import { cyAnalysis, cyContext, cyEvalSentence } from '../lib/cystory'
import { Callout, DataTable, ErrorBox, Face, Loading, NameLink, QuoteCard, Section, Tabs } from '../components/ui'
import { BallotBars } from '../components/histcharts'
import Versus from '../components/Versus'
import { P, Quote } from '../components/Term'

const EVAL_LABEL = { acertado: 'Acertado', discutible: 'Discutible', cuestionable: 'Cuestionable' } as const

function evalSentence(d: HistLeague, cmp: any) {
  const w = d.winner
  if (d.warGap <= 0) return `${w.name} fue el líder de bWAR entre los votados, con ${w.war}.`
  const lead = d.warLeader
  let text = `${lead.name} tuvo ${lead.war} de bWAR, ${d.warGap.toFixed(1)} más que el ganador (${w.war}).`
  const rival = cmp?.rivals?.find((r: any) => r.name === lead.name)
  if (rival && rival.fwar !== null && rival.fwar !== undefined && cmp.winner.fwar !== null && cmp.winner.fwar !== undefined) {
    const diff = +(rival.fwar - cmp.winner.fwar).toFixed(1)
    text += diff > 0
      ? ` Por fWAR, la ventaja de ${lead.name} es de ${diff.toFixed(1)}.`
      : diff < 0
        ? ` Por fWAR, el ganador supera a ${lead.name} por ${Math.abs(diff).toFixed(1)}.`
        : ' Por fWAR, ambos quedan empatados.'
  }
  return text
}

export default function History() {
  const { award } = useAward()
  const cy = award === 'cy'
  const prize = cy ? 'Cy Young' : 'MVP'
  const { data, error } = useHistory()
  const compare = useCompare()
  const [sp, setSp] = useSearchParams()
  const year = Number(sp.get('anio')) || 2025
  const lg = (sp.get('liga') === 'NL' ? 'NL' : 'AL') as League
  const set = (y: number, l: League) => setSp({ anio: String(y), liga: l })
  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const s = data.summary
  const season = data.seasons.find((x) => x.year === year) ?? data.seasons[data.seasons.length - 1]
  const d: HistLeague = season[lg]
  const w = d.winner
  const key = `${season.year}-${lg}`
  const story = cy ? null : STORY[key]
  const cmp = compare.data ? compare.data[key] : null
  const quotes = cy ? [] : (QUOTE_MAP[key] || []).map((q) => QUOTES[q])
  const people = cmp ? [cmp.winner, ...cmp.rivals] : []

  const rows = data.seasons.flatMap((ss) => (['AL', 'NL'] as League[]).map((l) => {
    const x = ss[l]
    const b = x.winner
    const btn = <button key={`${ss.year}${l}`} className="btn" style={{ padding: '2px 8px' }} onClick={() => { set(ss.year, l); window.scrollTo({ top: 420, behavior: 'smooth' }) }}>{b.name}</button>
    const verdict = <span key="v" className={`verdict ${x.verdict}`}>{EVAL_LABEL[x.verdict]}</span>
    const yr = `${ss.year}${ss.year === 2020 ? ' *' : ''}`
    const lgn = l === 'AL' ? 'Americana' : 'Nacional'
    if (cy) {
      const p = b.pit as Record<string, any>
      return [yr, lgn, btn, `${b.team} ${b.w}-${b.l}${b.playoffs ? ' ★' : ''}`, `${p.w}-${p.l}`, p.era, p.ip, p.so, b.war, `${b.share}%`, verdict]
    }
    return [
      yr, lgn, btn, x.pos, `${b.team} ${b.w}-${b.l}${b.playoffs ? ' ★' : ''}`, b.war, b.bat ? b.bat.hr : '-', b.bat ? slash(b.bat.ops) : (b.pit?.era ?? '-'),
      `${b.share}%`, verdict,
    ]
  }))

  const fwarDiff = (() => {
    if (d.warGap <= 0 || !cmp) return null
    const rival = cmp.rivals?.find((r: any) => r.name === d.warLeader.name)
    if (!rival || rival.fwar === null || rival.fwar === undefined || cmp.winner.fwar === null || cmp.winner.fwar === undefined) return null
    return +(rival.fwar - cmp.winner.fwar).toFixed(1)
  })()
  const unanimousYears = data.seasons.flatMap((ss) => (['AL', 'NL'] as League[]).filter((l) => ss[l].unanimous).map(() => ss.year))
  const firstUnanimous = unanimousYears.length ? Math.min(...unanimousYears) : null

  return (
    <div className="wrap">
      <AwardSwitch />
      <div className="eyebrow">Historial</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Los últimos 10 {prize}, de 2016 a 2025</h1>
      <P className="lede">Veinte premios entre las dos ligas. Cada votación incluye al ganador, a los rivales que tuvieron más valor o quedaron más cerca, y una lectura de si el WAR respalda la decisión.</P>
      <Callout title="Una nota sobre 2020">{NOTE_2020}</Callout>

      {cy ? (
        <div className="stat-tiles">
          <div className="tile"><div className="v">{s.warLeaderWon}/20</div><div className="l">veces ganó el líder de bWAR entre los votados</div></div>
          <div className="tile"><div className="v">{s.eraLeaderWon}/20</div><div className="l">veces ganó quien tuvo la mejor efectividad de la boleta</div></div>
          <div className="tile"><div className="v">{s.unanimous}</div><div className="l">votaciones unánimes{firstUnanimous ? `, todas desde ${firstUnanimous}` : ''}</div></div>
          <div className="tile"><div className="v">{s.early.avgWins} → {s.late.avgWins}</div><div className="l">victorias promedio del ganador, de 2016-2019 a 2021-2025</div></div>
        </div>
      ) : (
        <div className="stat-tiles">
          <div className="tile"><div className="v">{s.hitters}</div><div className="l">MVP fueron bateadores</div></div>
          <div className="tile"><div className="v">{s.twoWay}</div><div className="l">fueron DH/P, todos de Ohtani</div></div>
          <div className="tile"><div className="v">{s.pitchers}</div><div className="l">lanzadores puros ganaron</div></div>
          <div className="tile"><div className="v">{s.unanimous}</div><div className="l">votaciones unánimes, todas desde 2021</div></div>
        </div>
      )}

      <Section title="Votación por votación" eyebrow="Explorador">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <Tabs value={lg} onChange={(l) => set(season.year, l)} options={[{ id: 'AL', label: 'Americana' }, { id: 'NL', label: 'Nacional' }]} />
          <div className="tabs" role="group" aria-label="Año" style={{ flexWrap: 'wrap' }}>
            {data.seasons.map((x) => <button key={x.year} aria-pressed={x.year === season.year} onClick={() => set(x.year, lg)}>{x.year}{x.year === 2020 ? ' *' : ''}</button>)}
          </div>
        </div>

        {season.year === 2020 ? <Callout title="Temporada de 60 juegos">{NOTE_2020}</Callout> : null}

        <div className="card" style={{ marginTop: 12 }}>
          <div className="pcard" style={{ gridTemplateColumns: '104px 1fr' }}>
            <Face id={w.mlbId} name={w.name} width={104} color="var(--s1)" />
            <div>
              <div className="eyebrow" style={{ marginBottom: 2 }}>{prize} {season.year} · {leagueName(lg)}</div>
              <h3 style={{ margin: 0 }}><NameLink id={w.mlbId} name={w.name} /></h3>
              <div className="small muted">{d.pos} · <img src={teamLogo(w.teamId)} alt="" width={14} height={14} style={{ verticalAlign: 'text-bottom' }} /> {w.team} {w.w}-{w.l} {w.playoffs ? 'en playoffs' : 'sin playoffs'}</div>
              <div className="statline">
                <span><b>{w.war}</b> bWAR</span>
                {w.bat ? <><span><b>{slash(w.bat.avg)}/{slash(w.bat.obp)}/{slash(w.bat.slg)}</b></span><span><b>{w.bat.hr}</b> HR</span><span><b>{w.bat.rbi}</b> RBI</span></> : null}
                {w.pit ? (cy
                  ? <><span><b>{w.pit.w}-{w.pit.l}</b></span><span><b>{w.pit.era}</b> ERA</span><span><b>{w.pit.ip}</b> IP</span><span><b>{w.pit.so}</b> K</span></>
                  : <span><b>{w.pit.era}</b> ERA</span>) : null}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {d.unanimous ? <span className="chip good">Unánime</span> : <span className="chip">{w.first} votos de primer lugar</span>}
                {season.year === 2020 ? <span className="chip">Temporada de 60 juegos</span> : null}
              </div>
            </div>
          </div>
          {cy ? <P style={{ marginTop: 14, fontSize: '1.02rem' }}>{cyContext(d, lg)}</P> : story ? <P style={{ marginTop: 14, fontSize: '1.02rem' }}>{story.context}</P> : null}

          <div className="eval">
            <div className="line">
              <span className={`verdict ${d.verdict}`}>{EVAL_LABEL[d.verdict]}</span>
              <P style={{ margin: 0 }}>{cy ? cyEvalSentence(d, fwarDiff) : evalSentence(d, cmp)}</P>
            </div>
            <div className="eval-legend" aria-label="Cómo se clasifica cada decisión">
              <div><span className="verdict acertado">Acertado</span><br />La diferencia de bWAR con el líder es de 0.3 o menos.</div>
              <div><span className="verdict discutible">Discutible</span><br />La diferencia está entre 0.4 y 1.5.</div>
              <div><span className="verdict cuestionable">Cuestionable</span><br />La diferencia supera 1.5.</div>
            </div>
            <div className="small muted">La clasificación usa el bWAR de Baseball Reference entre los jugadores votados. El fWAR de FanGraphs se muestra como contraste y puede cambiar la lectura.</div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <div className="charthead">
            <h3>Frente a frente</h3>
            <span className="muted small">{cmp && cmp.betterCount > 0 ? 'Jugadores votados con más bWAR que el ganador' : 'El ganador y sus rivales más cercanos en la votación'}</span>
          </div>
          {compare.error ? <ErrorBox msg={compare.error} /> : !cmp ? <Loading h={260} /> : <Versus people={people} winnerName={w.name} title={`Comparación de la votación ${key}`} />}
        </div>

        {cy ? (
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Análisis</h3>
            {cyAnalysis(d, season.year).map((t, i) => <P key={i}>{t}</P>)}
          </div>
        ) : story?.analysis ? (
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Análisis</h3>
            {story.analysis.map((t, i) => <P key={i}>{t}</P>)}
            {story.takeaway ? <Quote>{story.takeaway}</Quote> : null}
          </div>
        ) : null}

        {quotes.length ? (
          <div className="card" style={{ marginTop: 16 }}>
            <h3>Lo que se dijo</h3>
            {quotes.map((q) => <QuoteCard key={q.text} q={q} />)}
          </div>
        ) : null}

        <div className="card" style={{ marginTop: 16 }}><BallotBars ballots={d.top10} title={`Boleta ${season.year} en la ${leagueName(lg)}`} hideRole={cy} /></div>
      </Section>

      <Section title="Los 20 premios" eyebrow="Resumen">
        <div className="card">
          <DataTable
            head={cy
              ? ['Año', 'Liga', 'Cy Young', 'Equipo', 'G-P', 'ERA', 'IP', 'K', 'WAR', 'Voto', 'Valoración']
              : ['Año', 'Liga', 'MVP', 'Pos.', 'Equipo', 'WAR', 'HR', 'OPS / ERA', 'Voto', 'Valoración']}
            rows={rows}
            caption={`Los 20 ganadores del ${prize}`}
            left={cy ? [1, 2, 3, 10] : [1, 2, 3, 4, 9]}
          />
          <P className="small muted" style={{ marginTop: 8 }}>★ indica un equipo en playoffs. WAR de Baseball Reference. El voto es el porcentaje de los puntos posibles. * indica la temporada recortada de 2020, de 60 juegos. Fuente de las votaciones, Baseball Reference (Bill Deane, Award Voting).</P>
        </div>
      </Section>
    </div>
  )
}
