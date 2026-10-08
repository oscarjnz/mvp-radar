import { Link } from 'react-router-dom'
import { useHistory } from '../lib/data'
import type { League } from '../lib/types'
import { DataTable, ErrorBox, Loading, Section } from '../components/ui'
import { CoefBars, VoteScatter } from '../components/histcharts'
import { LineChart } from '../components/charts'
import { P, Li, L } from '../components/Term'

export default function Voters() {
  const { data, error } = useHistory()
  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const s = data.summary
  const reg = s.regression
  const pts = data.seasons.flatMap((ss) => (['AL', 'NL'] as League[]).flatMap((lg) => ss[lg].top10.map((b, i) => ({ year: ss.year, lg, b, winner: i === 0 }))))
  const coefOf = (label: string) => reg.coefs.find((c: any) => c.label.startsWith(label))?.value ?? 0
  const e = s.early
  const l = s.late
  const byYear = (lg: League, f: (w: any) => number | null) => data.seasons.map((ss) => ({ x: ss.year, y: f(ss[lg].winner) as number })).filter((p) => p.y !== null)

  return (
    <div className="wrap">
      <div className="eyebrow">Qué se tomó más en cuenta</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Qué premian los votantes</h1>
      <P className="lede">Se analizaron las {reg.n} participaciones de finalistas en las boletas de 2016 a 2025. La conclusión corta: el WAR manda, llegar a playoffs ayuda y los jonrones se notan, pero ningún lanzador ha ganado.</P>

      <div className="stat-tiles">
        <div className="tile"><div className="v">{Math.round(reg.r2 * 100)}%</div><L>del voto lo explican WAR, playoffs y jonrones</L></div>
        <div className="tile"><div className="v">{s.playoffsPct}%</div><L>de los MVP jugaron en un equipo de playoffs</L></div>
        <div className="tile"><div className="v">{s.warLeaderWon}/20</div><L>veces ganó el líder de WAR entre los votados</L></div>
        <div className="tile"><div className="v">{s.withinHalfWar}/20</div><L>veces el ganador estuvo a 0.5 WAR o menos del líder</L></div>
      </div>

      <Section title="1. El WAR es lo que más pesa, sin ser todo" eyebrow="Hallazgo">
        <div className="grid g2">
          <div className="card"><VoteScatter points={pts} title="WAR frente al voto recibido" /></div>
          <div className="card">
            <h3>Qué mueve el voto</h3>
            <P className="small muted">Regresión lineal: porcentaje de puntos del voto contra cuatro variables. Cada barra es el efecto aproximado en puntos porcentuales de voto, por separado en cada mitad de la década.</P>
            <CoefBars coefs={reg.coefs} halves={reg.halves} />
            <ul className="clean" style={{ marginTop: 10 }}>
              <Li>Una desviación estándar más de WAR suma unos <b>{(coefOf('WAR') * 100).toFixed(0)} puntos</b> de voto.</Li>
              <Li>Estar en un equipo de playoffs suma unos <b>{(coefOf('Equipo en playoffs') * 100).toFixed(0)} puntos</b>.</Li>
              <Li>Cada 10 jonrones suman unos <b>{(coefOf('Jonrones') * 100).toFixed(0)} puntos</b>.</Li>
              <Li>Una vez que se sabe si fue a playoffs, el porcentaje de victorias del equipo ya no añade nada.</Li>
            </ul>
          </div>
        </div>
        <P className="small muted" style={{ marginTop: 8 }}>Limitación: solo se ven jugadores que recibieron votos, y el modelo es descriptivo, no predictivo. La relación entre WAR y puesto en la boleta es constante en la década (correlación de rangos de 0.52 a 0.76).</P>
      </Section>

      <Section title="2. Qué cambió entre 2016-2020 y 2021-2025" eyebrow="Evolución">
        <div className="grid g2">
          <div className="card">
            <DataTable
              head={['Indicador', '2016-2020', '2021-2025']}
              rows={[
                ['WAR promedio del ganador', e.avgWar, l.avgWar],
                ['Jonrones promedio del ganador', e.avgHr, l.avgHr],
                ['Votaciones unánimes', e.unanimous, l.unanimous],
                ['Ganadores de dos vías', e.twoWay, l.twoWay],
                ['Voto promedio del ganador', `${e.avgShare}%`, `${l.avgShare}%`],
                ['Ganadores en equipo de playoffs', `${e.playoffsPct}%`, `${l.playoffsPct}%`],
                ['Brecha media de WAR con el líder', e.avgWarGap, l.avgWarGap],
              ]}
            />
            <P className="small muted" style={{ marginTop: 8 }}>Los jonrones promedio incluyen a Ohtani 2021, 2023 y 2025 como bateador.</P>
          </div>
          <div className="card">
            <ul className="clean">
              <Li><b>Más consenso.</b> Antes de 2021 ninguna votación fue unánime; desde entonces, {l.unanimous} de 10. Los premios actuales son más claros porque los ganadores son más sobresalientes.</Li>
              <Li><b>Temporadas más grandes.</b> El WAR promedio del ganador pasó de {e.avgWar} a {l.avgWar} y los jonrones de {e.avgHr} a {l.avgHr}.</Li>
              <Li><b>Ohtani.</b> Cambió dos supuestos: un jugador de dos vías puede ganar, y un bateador designado también (2024).</Li>
              <Li><b>El equipo importa igual.</b> El {s.playoffsPct}% de playoffs es idéntico en las dos mitades. Los seis que ganaron sin playoffs fueron Trout (2016, 2019), Stanton (2017), Harper (2021) y Ohtani (2021, 2023).</Li>
              <Li><b>La brecha con el WAR bajó</b> de {e.avgWarGap} a {l.avgWarGap}: la votación se parece cada vez más al líder de WAR.</Li>
            </ul>
          </div>
        </div>
        <div className="grid g2" style={{ marginTop: 16 }}>
          <div className="card">
            <LineChart title="WAR del ganador por año" sub="Baseball Reference"
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

      <Section title="3. Los lanzadores casi nunca ganan" eyebrow="El gran punto ciego">
        <div className="card">
          <P>En {data.pitcherWarLeaders.length} de las 20 votaciones, el jugador con más WAR entre los votados fue un lanzador. <b>Ninguno ganó.</b> Quedaron entre los puestos 4 y 19.</P>
          <DataTable
            head={['Año', 'Liga', 'Lanzador con más WAR', 'WAR', 'Puesto en la votación', 'Ganó', 'WAR del ganador']}
            rows={data.pitcherWarLeaders.map((p: any) => [p.year, p.lg, p.name, p.war, `${p.voteRank}.º`, p.winner, p.winnerWar])}
            left={[1, 2, 5]}
          />
          <P className="small muted" style={{ marginTop: 8 }}>Por eso Schlittler y Misiorowski son candidatos fuertes al Cy Young, pero tienen que vencer a la historia para ser MVP. Ohtani es la excepción porque también batea.</P>
        </div>
      </Section>

      <Section title="4. Las elecciones más ajustadas" eyebrow="Casi">
        <div className="card">
          <DataTable
            head={['Año', 'Liga', 'Ganador', 'Segundo', 'Diferencia en puntos', '1.º lugar (G)', '1.º lugar (S)', 'WAR ganador', 'WAR segundo']}
            rows={data.closest.slice(0, 6).map((c: any) => [c.year, c.lg, c.winner, c.second, c.ptsGap, c.firstWinner, c.firstSecond, c.warWinner, c.warSecond])}
            left={[1, 2, 3]}
          />
        </div>
      </Section>

      <P style={{ marginTop: 28 }}>Con esto en mente: <Link to="/carrera">mira la carrera del 2026</Link> o <Link to="/injusticias">revisa a quién le quitaron el premio</Link>.</P>
    </div>
  )
}
