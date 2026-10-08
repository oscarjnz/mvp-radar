import { Link } from 'react-router-dom'
import { useHistory } from '../lib/data'
import { headshot } from '../lib/format'
import { DataTable, ErrorBox, Loading, Section } from '../components/ui'
import { GapDumbbell } from '../components/histcharts'

const WHY: Record<string, string> = {
  '2018-Jacob deGrom': 'Ganó el Cy Young de la Nacional y aun así no pasó del quinto lugar en el MVP. Su equipo terminó con más derrotas que victorias.',
  '2021-Juan Soto': 'Lideró la liga en OBP (.465) y en bases por bolas (145). Washington no llegó a playoffs y Harper, de un equipo con mejor narrativa, se llevó 17 primeros lugares contra 6.',
  '2021-Zack Wheeler': 'Lideró la Nacional en entradas (213.1) y en ponches (247), pero terminó 19.º. Es el ejemplo más claro de que un lanzador con la mejor temporada de la liga ni siquiera entra al debate.',
  '2019-Alex Bregman': 'Tuvo más WAR que Trout (8.9 contra 7.9) en un equipo de playoffs, y perdió por 17 votos de primer lugar contra 13. Trout ganó aunque su equipo no llegó a playoffs.',
  '2021-Fernando Tatis Jr.': 'Lideró la Nacional en jonrones (42) en solo 130 juegos, pero solo jugó 130 juegos y San Diego no llegó a playoffs.',
  '2021-Trea Turner': 'Lideró la liga en hits (195) y promedio (.328). Jugó para dos equipos esa temporada (Washington y Los Ángeles).',
  '2020-Shane Bieber': 'Ganó la Triple Corona de pitcheo y el Cy Young de 2020, en una temporada corta donde Abreu ganó con solo 2.7 de WAR.',
}

export default function Snubs() {
  const { data, error } = useHistory()
  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const sn = data.snubs
  const rows = sn.map((x: any) => ({
    label: `${x.year} ${x.lg} · ${x.name.split(' ').slice(-1)[0]}`, winner: x.winner.split(' ').slice(-1)[0], winnerWar: x.winnerWar, snub: x.name, snubWar: x.war, rank: x.voteRank,
  }))

  return (
    <div className="wrap">
      <div className="eyebrow">Lo que pudo ser</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Debió ser MVP</h1>
      <p className="lede">Se buscaron todos los finalistas de 2016 a 2025 con al menos 0.5 de WAR más que el ganador. Son {sn.length} casos en 20 votaciones: {sn.filter((x: any) => x.role === 'pitcher').length} lanzadores y {sn.filter((x: any) => x.role !== 'pitcher').length} bateadores.</p>

      <Section title="La brecha en un vistazo" eyebrow="Gráfico">
        <div className="card"><GapDumbbell rows={rows} /></div>
        <p className="small muted" style={{ marginTop: 8 }}>WAR de Baseball Reference. Un WAR más alto no siempre es «mejor jugador», pero si el voto dice «valor», esta es la contradicción que hay que explicar.</p>
      </Section>

      <Section title="Los casos" eyebrow="Uno por uno">
        <div className="grid g2">
          {sn.map((x: any) => {
            const key = `${x.year}-${x.name}`
            const isP = x.role === 'pitcher'
            return (
              <div className="card" key={key}>
                <div className="pcard" style={{ gridTemplateColumns: '72px 1fr' }}>
                  <img className="photo" style={{ width: 72, height: 72, borderColor: 'var(--s2)' }} src={headshot(x.mlbId, 144)} alt={x.name} loading="lazy" />
                  <div>
                    <div className="eyebrow" style={{ marginBottom: 0 }}>{x.year} · {x.lg === 'AL' ? 'Americana' : 'Nacional'} · terminó {x.voteRank}.º</div>
                    <h3 style={{ margin: 0 }}>{x.name} <span className="muted small">({x.team})</span></h3>
                    <div className="statline">
                      <span><b>{x.war}</b> WAR</span><span>vs <b>{x.winnerWar}</b> de {x.winner}</span><span><b>+{x.warGap}</b></span>
                      <span>{x.w}-{x.l}{x.playoffs ? ' ★' : ''}</span>
                    </div>
                  </div>
                </div>
                <p style={{ marginTop: 10 }}>
                  {WHY[key] ||
                    (isP
                      ? `Lanzador que superó al ganador por ${x.warGap} de WAR y terminó ${x.voteRank}.º con ${x.share}% del voto. Es parte del patrón: el líder de WAR entre los votados que fue lanzador nunca ganó.`
                      : `Terminó ${x.voteRank}.º con ${x.share}% del voto, con ${x.warGap} más de WAR que ${x.winner}.`)}
                </p>
                {x.pit ? <p className="small muted">{x.pit.w}-{x.pit.l}, {x.pit.era} de efectividad, {x.pit.so} ponches en {x.pit.ip} entradas.</p> : x.bat ? <p className="small muted">{x.bat.avg}/{x.bat.obp}/{x.bat.slg}, {x.bat.hr} HR, {x.bat.rbi} RBI.</p> : null}
              </div>
            )
          })}
        </div>
      </Section>

      <Section title="Los casi" eyebrow="Entre 0.2 y 0.5 de WAR">
        <div className="card">
          <DataTable head={['Año', 'Liga', 'Jugador', 'Puesto', 'WAR', 'Ganador', 'WAR ganador', 'Brecha']}
            rows={data.nearMisses.map((x: any) => [x.year, x.lg, x.name, `${x.voteRank}.º`, x.war, x.winner, x.winnerWar, `+${x.warGap}`])} left={[1, 2, 5]} />
          <p className="small muted" style={{ marginTop: 8 }}>Brechas tan pequeñas caen dentro del margen de error del WAR. Se incluyen porque ayudan a leer casos como los de la Nacional en 2025.</p>
        </div>
      </Section>

      <Section title="Lo que enseña" eyebrow="Lecciones">
        <div className="card">
          <ul className="clean">
            <li><b>El pitcheo es el gran perdedor.</b> Los tres mayores huecos de WAR de la década (deGrom, Nola y Wheeler) son lanzadores.</li>
            <li><b>El nombre y el equipo pesan.</b> Trout 2019, Harper 2021 y Ohtani 2021 y 2023 ganaron frente a alguien con más WAR o con un equipo mejor.</li>
            <li><b>El WAR no resuelve el debate.</b> En 2026, McGonigle tiene 7.1 de bWAR y 5.4 de fWAR: la misma temporada, dos historias. <Link to="/carrera">Mira la carrera actual</Link>.</li>
          </ul>
        </div>
      </Section>
    </div>
  )
}
