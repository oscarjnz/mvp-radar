import { Link } from 'react-router-dom'
import { useHistory } from '../lib/data'
import type { League } from '../lib/types'
import { Callout, DataTable, ErrorBox, Loading, QuoteCard, Section } from '../components/ui'
import { CoefBars, VoteScatter } from '../components/histcharts'
import { LineChart } from '../components/charts'
import { L, Li, P } from '../components/Term'
import { NOTE_2020, QUOTES } from '../data/histStory'
import { AwardSwitch, useAward } from '../lib/award'
import VotersCy from './VotersCy'

export default function Voters() {
  const { award } = useAward()
  return award === 'cy' ? <VotersCy /> : <VotersMvp />
}

function VotersMvp() {
  const { data, error } = useHistory('mvp')
  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const s = data.summary
  const reg = s.regression
  const pts = data.seasons.flatMap((ss) => (['AL', 'NL'] as League[]).flatMap((lg) => ss[lg].top10.map((b, i) => ({ year: ss.year, lg, b, winner: i === 0 }))))
  const coefOf = (label: string) => reg.coefs.find((c: any) => c.label.startsWith(label))?.value ?? 0
  const e = s.early
  const m = s.short
  const l = s.late
  const byYear = (lg: League, f: (w: any) => number | null) => data.seasons.map((ss) => ({ x: ss.year, y: f(ss[lg].winner) as number })).filter((p) => p.y !== null)
  const ranks = data.pitcherWarLeaders.map((p: any) => `${p.voteRank}.º`).join(', ')

  return (
    <div className="wrap">
      <AwardSwitch />
      <div className="eyebrow">Criterios de la votación</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Qué premian los votantes</h1>
      <P className="lede">El análisis cubre las {reg.n} participaciones de finalistas en las boletas de 2016 a 2025. El WAR es el factor que más pesa, llegar a playoffs ayuda y los jonrones se notan, pero ningún lanzador ha ganado en ese periodo.</P>
      <Callout title="Una nota sobre 2020">{NOTE_2020}</Callout>

      <div className="stat-tiles">
        <div className="tile"><div className="v">{Math.round(reg.r2 * 100)}%</div><L>del voto lo explican el WAR, los playoffs y los jonrones</L></div>
        <div className="tile"><div className="v">{s.playoffsPct}%</div><L>de los MVP jugaron en un equipo de playoffs</L></div>
        <div className="tile"><div className="v">{s.warLeaderWon}/20</div><L>veces ganó el líder de WAR entre los votados</L></div>
        <div className="tile"><div className="v">{s.withinHalfWar}/20</div><L>veces el ganador quedó a 0.5 WAR o menos del líder</L></div>
      </div>

      <Section title="El WAR pesa más que cualquier otro factor" eyebrow="Hallazgo principal">
        <div className="grid g2">
          <div className="card"><VoteScatter points={pts} title="WAR frente al voto recibido" /></div>
          <div className="card">
            <h3>Qué mueve el voto</h3>
            <P className="small muted">Es una regresión lineal del porcentaje de puntos del voto contra cuatro variables. Cada barra es el efecto aproximado en puntos porcentuales, calculado por separado para cada época (2020 queda fuera de las dos comparaciones).</P>
            <CoefBars coefs={reg.coefs} halves={reg.halves} />
            <ul className="clean" style={{ marginTop: 10 }}>
              <Li>Una desviación estándar más de WAR suma unos <b>{(coefOf('WAR') * 100).toFixed(0)} puntos</b> de voto.</Li>
              <Li>Jugar en un equipo de playoffs suma unos <b>{(coefOf('Equipo en playoffs') * 100).toFixed(0)} puntos</b>.</Li>
              <Li>Cada 10 jonrones suman unos <b>{(coefOf('Jonrones') * 100).toFixed(0)} puntos</b>.</Li>
              <Li>El porcentaje de victorias del equipo ya no añade nada cuando se sabe si llegó a playoffs.</Li>
            </ul>
          </div>
        </div>
        <P className="small muted" style={{ marginTop: 8 }}>El modelo es descriptivo y solo incluye a jugadores que recibieron votos. La relación entre el WAR y el puesto en la boleta se mantiene estable durante la década, con una correlación de rangos de 0.52 a 0.76.</P>
      </Section>

      <Section title="Qué cambió entre épocas" eyebrow="Evolución">
        <div className="grid g2">
          <div className="card">
            <DataTable
              head={['Indicador', '2016-2019', '2020 *', '2021-2025']}
              rows={[
                ['WAR promedio del ganador', e.avgWar, m.avgWar, l.avgWar],
                ['Jonrones promedio del ganador', e.avgHr, m.avgHr, l.avgHr],
                ['Votaciones unánimes', e.unanimous, m.unanimous, l.unanimous],
                ['Ganadores DH/P', e.twoWay, m.twoWay, l.twoWay],
                ['Voto promedio del ganador', `${e.avgShare}%`, `${m.avgShare}%`, `${l.avgShare}%`],
                ['Ganadores en equipo de playoffs', `${e.playoffsPct}%`, `${m.playoffsPct}%`, `${l.playoffsPct}%`],
                ['Brecha media de WAR con el líder', e.avgWarGap, m.avgWarGap, l.avgWarGap],
              ]}
            />
            <P className="small muted" style={{ marginTop: 8 }}>* La temporada de 2020, de 60 juegos, se muestra aparte porque sus totales no son comparables con los de una temporada de 162. Los jonrones incluyen a Ohtani como bateador.</P>
          </div>
          <div className="card">
            <ul className="clean">
              <Li><b>Más consenso.</b> Hasta 2019, ninguna votación fue unánime. Entre 2021 y 2025 lo fueron {l.unanimous} de 10.</Li>
              <Li><b>Más poder.</b> Los jonrones del ganador pasaron de {e.avgHr} a {l.avgHr}, mientras que su WAR apenas cambió, de {e.avgWar} a {l.avgWar}.</Li>
              <Li><b>Un perfil elegible más amplio.</b> Ohtani demostró que un DH/P puede ganar, y también un bateador designado (2024).</Li>
              <Li><b>El equipo sigue contando.</b> El {e.playoffsPct}% de los ganadores de 2016 a 2019 jugó en playoffs, frente al {l.playoffsPct}% entre 2021 y 2025. Los seis que ganaron sin playoffs fueron Trout (2016 y 2019), Stanton (2017), Harper (2021) y Ohtani (2021 y 2023).</Li>
              <Li><b>Menos distancia con el líder de WAR.</b> La brecha media bajó de {e.avgWarGap} a {l.avgWarGap}, así que la votación se parece cada vez más al líder de WAR.</Li>
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
            <LineChart title="Jonrones del ganador por año" sub="Incluye a Ohtani como bateador"
              series={[
                { id: 'al', label: 'Americana', color: 'var(--s1)', points: byYear('AL', (w) => (w.bat ? w.bat.hr : null)) },
                { id: 'nl', label: 'Nacional', color: 'var(--s2)', points: byYear('NL', (w) => (w.bat ? w.bat.hr : null)) },
              ]} yFmt={(v) => v.toFixed(0)} xFmt={(v) => String(v)} height={220} />
          </div>
        </div>
      </Section>

      <Section title="Los lanzadores casi nunca ganan" eyebrow="El gran punto ciego">
        <div className="card">
          <P>En {data.pitcherWarLeaders.length} de las 20 votaciones, el jugador con más WAR entre los votados fue un lanzador. Ninguno ganó y quedaron en los puestos {ranks}.</P>
          <DataTable
            head={['Año', 'Liga', 'Lanzador con más WAR', 'WAR', 'Puesto', 'Ganador', 'WAR del ganador']}
            rows={data.pitcherWarLeaders.map((p: any) => [p.year, p.lg, p.name, p.war, `${p.voteRank}.º`, p.winner, p.winnerWar])}
            left={[1, 2, 5]}
          />
          <P className="small muted" style={{ marginTop: 8 }}>Schlittler y Misiorowski son candidatos fuertes al Cy Young en 2026, pero para ser MVP tienen que vencer a la historia. Ohtani es la excepción porque también batea.</P>
          <QuoteCard q={QUOTES.ballotRule} />
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

      <Section title="Voces del béisbol" eyebrow="Qué es un MVP">
        <div className="card">
          <P>Los periodistas que cubren las votaciones coinciden en que el WAR es una herramienta valiosa y a la vez insuficiente para definir el premio.</P>
          <QuoteCard q={QUOTES.petrielloWar} />
          <QuoteCard q={QUOTES.cassavellBest} />
        </div>
      </Section>

      <P style={{ marginTop: 28 }}>Con esto en mente, <Link to="/carrera">revisa la carrera de 2026</Link> o <Link to="/revision-del-voto">consulta la revisión del voto</Link>.</P>
    </div>
  )
}
