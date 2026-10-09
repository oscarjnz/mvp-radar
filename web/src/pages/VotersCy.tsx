import { Link } from 'react-router-dom'
import { useHistory } from '../lib/data'
import type { League } from '../lib/types'
import { AwardSwitch } from '../lib/award'
import { Callout, DataTable, ErrorBox, Loading, NameLink, Section } from '../components/ui'
import { CoefBars, VoteScatter } from '../components/histcharts'
import { LineChart } from '../components/charts'
import { L, Li, P } from '../components/Term'
import { NOTE_2020 } from '../data/histStory'

/** Qué premian los votantes del Cy Young. Todas las cifras y frases salen de history_cy.json. */
export default function VotersCy() {
  const { data, error } = useHistory('cy')
  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const s = data.summary
  const reg = s.regression
  const e = s.early
  const m = s.short
  const l = s.late
  const pts = data.seasons.flatMap((ss) => (['AL', 'NL'] as League[]).flatMap((lg) => ss[lg].top10.map((b, i) => ({ year: ss.year, lg, b, winner: i === 0 }))))
  const coefOf = (label: string) => reg.coefs.find((c: any) => c.label.startsWith(label))?.value ?? 0
  const war = coefOf('WAR')
  const era = coefOf('Efectividad')
  const wins = coefOf('Victorias')
  const po = coefOf('Equipo en playoffs')
  const h1 = reg.halves['2016-2019']
  const h2 = reg.halves['2021-2025']
  const byYear = (lg: League, f: (w: any) => number | null) => data.seasons.map((ss) => ({ x: ss.year, y: f(ss[lg].winner) as number })).filter((p) => p.y !== null)

  // Los ganadores con menos victorias, de la tabla de 20
  const winners = data.seasons.flatMap((ss) => (['AL', 'NL'] as League[]).map((lg) => ({ year: ss.year, lg, d: ss[lg], w: ss[lg].winner })))
  const fewWins = [...winners].sort((a, b) => (a.w.pit?.w ?? 0) - (b.w.pit?.w ?? 0)).slice(0, 6)
  const lowCount = winners.filter((x) => (x.w.pit?.w ?? 99) <= 11).length

  const poText = po < 0.03 ? 'apenas mueve el voto' : 'también suma'

  return (
    <div className="wrap">
      <AwardSwitch />
      <div className="eyebrow">Criterios de la votación</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Qué premian los votantes</h1>
      <P className="lede">El análisis cubre las {reg.n} participaciones de finalistas en las boletas del Cy Young de 2016 a 2025. Pesan más el WAR, la efectividad y las victorias, y jugar en playoffs {poText}.</P>
      <Callout title="Una nota sobre 2020">{NOTE_2020}</Callout>

      <div className="stat-tiles">
        <div className="tile"><div className="v">{Math.round(reg.r2 * 100)}%</div><L>del voto lo explican el WAR, la efectividad, las victorias y los playoffs</L></div>
        <div className="tile"><div className="v">{s.warLeaderWon}/20</div><L>veces ganó el líder de WAR entre los votados</L></div>
        <div className="tile"><div className="v">{s.eraLeaderWon}/20</div><L>veces ganó quien tuvo la mejor efectividad de la boleta</L></div>
        <div className="tile"><div className="v">{s.winsLeaderWon}/20</div><L>veces ganó quien tuvo más victorias de la boleta</L></div>
      </div>

      <Section title="Qué mueve el voto" eyebrow="Hallazgo principal">
        <div className="grid g2">
          <div className="card"><VoteScatter points={pts} title="WAR frente al voto recibido" award="Cy Young" /></div>
          <div className="card">
            <h3>Cuánto pesa cada factor</h3>
            <P className="small muted">Es una regresión lineal del porcentaje de puntos del voto contra cuatro variables. Cada barra es el efecto aproximado en puntos porcentuales, calculado por separado para cada época (2020 queda fuera de las dos comparaciones). Las victorias de 2020 se ajustan a 162 juegos.</P>
            <CoefBars coefs={reg.coefs} halves={reg.halves} />
            <ul className="clean" style={{ marginTop: 10 }}>
              <Li>Una desviación estándar más de WAR suma unos <b>{(war * 100).toFixed(0)} puntos</b> de voto.</Li>
              <Li>Una desviación estándar mejor en efectividad suma unos <b>{(era * 100).toFixed(0)} puntos</b>.</Li>
              <Li>Cada 5 victorias más suman unos <b>{(wins * 100).toFixed(0)} puntos</b>.</Li>
              <Li>Jugar en un equipo de playoffs suma unos <b>{(po * 100).toFixed(0)} puntos</b>, así que {poText}.</Li>
            </ul>
          </div>
        </div>
        <P className="small muted" style={{ marginTop: 8 }}>El modelo es descriptivo y solo incluye a lanzadores que recibieron votos. Las cuatro variables se miden contra los demás finalistas de su liga y año, salvo las victorias y los playoffs.</P>
      </Section>

      <Section title="Qué cambió entre épocas" eyebrow="Evolución">
        <div className="grid g2">
          <div className="card">
            <DataTable
              head={['Indicador', '2016-2019', '2020 *', '2021-2025']}
              rows={[
                ['WAR promedio del ganador', e.avgWar, m.avgWar, l.avgWar],
                ['Efectividad promedio del ganador', e.avgEra, m.avgEra, l.avgEra],
                ['Victorias promedio del ganador', e.avgWins, m.avgWins, l.avgWins],
                ['Entradas promedio del ganador', e.avgIp, m.avgIp, l.avgIp],
                ['Ponches promedio del ganador', e.avgK, m.avgK, l.avgK],
                ['Votaciones unánimes', e.unanimous, m.unanimous, l.unanimous],
                ['Voto promedio del ganador', `${e.avgShare}%`, `${m.avgShare}%`, `${l.avgShare}%`],
                ['Ganadores en equipo de playoffs', `${e.playoffsPct}%`, `${m.playoffsPct}%`, `${l.playoffsPct}%`],
                ['Brecha media de WAR con el líder', e.avgWarGap, m.avgWarGap, l.avgWarGap],
              ]}
            />
            <P className="small muted" style={{ marginTop: 8 }}>* La temporada de 2020, de 60 juegos, se muestra aparte porque sus totales no son comparables con los de una temporada de 162.</P>
          </div>
          <div className="card">
            <ul className="clean">
              <Li><b>Más consenso.</b> Hasta 2019, {e.unanimous === 0 ? 'ninguna votación fue unánime' : `${e.unanimous} de ${e.n} votaciones fueron unánimes`}. Entre 2021 y 2025 lo fueron {l.unanimous} de {l.n}.</Li>
              <Li><b>Menos victorias.</b> El ganador promedio pasó de {e.avgWins} a {l.avgWins} victorias, y el mínimo desde 2021 es de {l.minWins}.</Li>
              <Li><b>Menos entradas.</b> El ganador promedio pasó de {e.avgIp} a {l.avgIp} entradas.</Li>
              <Li><b>El WAR gana peso.</b> El efecto de una desviación estándar de WAR pasó de {(h1[1] * 100).toFixed(0)} a {(h2[1] * 100).toFixed(0)} puntos de voto.</Li>
              <Li><b>La efectividad pesa menos.</b> El efecto de una desviación estándar mejor en efectividad pasó de {(h1[2] * 100).toFixed(0)} a {(h2[2] * 100).toFixed(0)} puntos.</Li>
              <Li><b>Menos distancia con el líder de WAR.</b> La brecha media pasó de {e.avgWarGap} a {l.avgWarGap}, así que la votación se parece cada vez más al líder de WAR.</Li>
            </ul>
          </div>
        </div>
        <div className="grid g2" style={{ marginTop: 16 }}>
          <div className="card">
            <LineChart title="WAR del ganador por año" sub="Baseball Reference. La caída de 2020 refleja los 60 juegos."
              series={[
                { id: 'al', label: 'Americana', color: 'var(--s1)', points: byYear('AL', (w) => w.war) },
                { id: 'nl', label: 'Nacional', color: 'var(--s2)', points: byYear('NL', (w) => w.war) },
              ]} yFmt={(v) => v.toFixed(0)} xFmt={(v) => String(v)} height={220} />
          </div>
          <div className="card">
            <LineChart title="Victorias del ganador por año" sub="La caída de 2020 refleja los 60 juegos"
              series={[
                { id: 'al', label: 'Americana', color: 'var(--s1)', points: byYear('AL', (w) => (w.pit ? w.pit.w : null)) },
                { id: 'nl', label: 'Nacional', color: 'var(--s2)', points: byYear('NL', (w) => (w.pit ? w.pit.w : null)) },
              ]} yFmt={(v) => v.toFixed(0)} xFmt={(v) => String(v)} height={220} />
          </div>
        </div>
      </Section>

      <Section title="Ganadores con pocas victorias" eyebrow="El récord ya no decide">
        <div className="card">
          <P>En {lowCount} de las 20 votaciones ganó un lanzador con 11 victorias o menos, contando las dos de 2020. Estos son los {fewWins.length} con menos triunfos.</P>
          <DataTable
            head={['Año', 'Liga', 'Ganador', 'Récord', 'ERA', 'Ponches', 'bWAR', 'Equipo']}
            rows={fewWins.map((x) => [
              `${x.year}${x.year === 2020 ? ' *' : ''}`, x.lg, <NameLink key={x.w.name + x.year} id={x.w.mlbId} name={x.w.name} />,
              `${x.w.pit?.w}-${x.w.pit?.l}`, x.w.pit?.era, x.w.pit?.so, x.w.war, `${x.w.team} ${x.w.w}-${x.w.l}${x.w.playoffs ? ' ★' : ''}`,
            ])}
            left={[1, 2, 7]}
          />
          <P className="small muted" style={{ marginTop: 8 }}>Las victorias de un lanzador dependen también de su ofensiva y de su bullpen.</P>
        </div>
      </Section>

      <Section title="Las votaciones más ajustadas" eyebrow="Márgenes mínimos">
        <div className="card">
          <DataTable
            head={['Año', 'Liga', 'Ganador', 'Segundo', 'Diferencia en puntos', '1.er lugar (ganador)', '1.er lugar (segundo)', 'WAR ganador', 'WAR segundo']}
            rows={data.closest.slice(0, 6).map((c: any) => [c.year, c.lg, c.winner, c.second, c.ptsGap, c.firstWinner, c.firstSecond, c.warWinner, c.warSecond])}
            left={[1, 2, 3]}
          />
        </div>
      </Section>

      <P style={{ marginTop: 28 }}>Con esto en mente, <Link to="/carrera">revisa la carrera de 2026</Link> o <Link to="/revision-del-voto">consulta la revisión del voto</Link>.</P>
    </div>
  )
}
