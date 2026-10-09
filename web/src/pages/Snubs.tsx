import { Link } from 'react-router-dom'
import { useCompare, useHistory, useProfiles } from '../lib/data'
import { slash } from '../lib/format'
import { AwardSwitch, useAward } from '../lib/award'
import { Callout, DataTable, ErrorBox, Face, Loading, NameLink, Section } from '../components/ui'
import { GapDumbbell } from '../components/histcharts'
import Versus from '../components/Versus'
import { Li, P } from '../components/Term'
import { NOTE_2020 } from '../data/histStory'

/** Contexto de cada caso. Las cifras provienen de las votaciones de Baseball Reference y de la MLB Stats API. */
const WHY: Record<string, string> = {
  '2018-Jacob deGrom': 'Ganó el Cy Young de la Nacional y aun así no pasó del quinto lugar en el MVP. Su equipo terminó con más derrotas que victorias y fue el único, aparte del ganador, en recibir un voto de primer lugar.',
  '2018-Aaron Nola': 'Su bWAR de 9.2 contrasta con un fWAR de 5.5, una diferencia muy grande entre las dos fuentes. Los Filis terminaron 80-82 y sin playoffs.',
  '2018-Max Scherzer': 'Ponchó a 300 bateadores con 2.53 de efectividad para unos Nacionales (82-80) que no llegaron a playoffs. Por fWAR (7.5) no supera a Yelich (7.7).',
  '2019-Alex Bregman': 'Superó a Trout por una victoria completa de bWAR en un equipo de 107 triunfos, y perdió por 17 votos de primer lugar contra 13. Trout ganó aunque su equipo no llegó a playoffs.',
  '2019-Marcus Semien': 'Su bWAR de 8.4 es mucho mayor que su fWAR de 6.5. Fue tercero con 54% del voto para unos Atléticos de 97 victorias.',
  '2020-Shane Bieber': 'Ganó la Triple Corona de pitcheo y el Cy Young en la temporada de 60 juegos. En un año tan corto, 0.5 de WAR de ventaja sobre Abreu equivalen a casi 1.4 en una campaña completa.',
  '2021-Juan Soto': 'Lideró la liga en OBP (.465) y en boletos (145). Washington quedó fuera de playoffs, y Harper se llevó 17 votos de primer lugar contra 6 de Soto.',
  '2021-Zack Wheeler': 'Encabezó la Nacional en entradas (213.1) y ponches (247) y terminó 19.º. Es el ejemplo más claro de un lanzador con la mejor temporada de la liga que ni siquiera entra al debate.',
  '2021-Fernando Tatis Jr.': 'Lideró la Nacional en jonrones (42) en solo 130 juegos, y San Diego quedó fuera de playoffs.',
  '2021-Trea Turner': 'Lideró la liga en hits (195) y en promedio (.328). Jugó esa temporada para dos equipos, Washington y Los Ángeles.',
}

const first = (n: string) => n.split(' ').slice(-1)[0]

function cyText(x: any) {
  const p = x.pit ?? {}
  const wp = x.winnerPit ?? {}
  return `${x.name} (${x.team}) tuvo ${p.w}-${p.l} de récord, ${p.era} de efectividad, ${p.ip} entradas y ${p.so} ponches. Sumó ${x.war} de bWAR, ${x.warGap} más que ${first(x.winner)}, y terminó ${x.voteRank}.º con ${x.share}% del voto. El ganador tuvo ${wp.w}-${wp.l} con ${wp.era} de efectividad en ${wp.ip} entradas.`
}

function genericText(x: any) {
  if (x.role === 'pitcher') {
    return `${x.name} (${x.team}, ${x.w}-${x.l}) terminó con ${x.pit?.era} de efectividad en ${x.pit?.ip} entradas y ${x.pit?.so} ponches. Sumó ${x.war} de bWAR, ${x.warGap} más que ${first(x.winner)}, y quedó ${x.voteRank}.º con ${x.share}% del voto.`
  }
  return `${x.name} (${x.team}, ${x.w}-${x.l}) bateó ${slash(x.bat?.avg)}/${slash(x.bat?.obp)}/${slash(x.bat?.slg)} con ${x.bat?.hr} jonrones y ${x.bat?.rbi} impulsadas. Sumó ${x.war} de bWAR, ${x.warGap} más que ${first(x.winner)}, y quedó ${x.voteRank}.º con ${x.share}% del voto.`
}

export default function Snubs() {
  const { award } = useAward()
  const cy = award === 'cy'
  const prize = cy ? 'Cy Young' : 'MVP'
  const { data, error } = useHistory()
  const compare = useCompare()
  const profiles = useProfiles()
  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const sn = data.snubs
  const ids: Record<string, number> = {}
  if (profiles.data) Object.values(profiles.data).forEach((p) => { ids[p.name] = p.id })
  const rows = sn.map((x: any) => ({
    label: `${x.year} ${x.lg} · ${first(x.name)}`, winner: first(x.winner), winnerWar: x.winnerWar, snub: x.name, snubWar: x.war, rank: x.voteRank,
  }))
  const pit = sn.filter((x: any) => x.role === 'pitcher').length
  // Lecturas de los casos del Cy Young, calculadas de los datos
  const top3 = [...sn].sort((a: any, b: any) => b.warGap - a.warGap).slice(0, 3)
  const moreWins = sn.filter((x: any) => (x.winnerPit?.w ?? 0) > (x.pit?.w ?? 0)).length
  const offPlayoffs = sn.filter((x: any) => x.playoffs === false).length

  return (
    <div className="wrap">
      <AwardSwitch />
      <div className="eyebrow">Auditoría de la votación</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Revisión del voto</h1>
      {cy ? (
        <P className="lede">Se revisaron todos los finalistas del Cy Young de 2016 a 2025 con al menos 0.5 de WAR más que el ganador. Son {sn.length} casos en 20 votaciones. Cada caso muestra al lanzador frente al ganador, con los números que sostienen el argumento.</P>
      ) : (
        <P className="lede">Se revisaron todos los finalistas de 2016 a 2025 con al menos 0.5 de WAR más que el ganador. Son {sn.length} casos en 20 votaciones, {pit} de lanzadores y {sn.length - pit} de bateadores. Cada caso muestra al jugador frente al ganador, con los números que sostienen el argumento.</P>
      )}

      <Section title="La brecha de WAR" eyebrow="Panorama">
        <div className="card"><GapDumbbell rows={rows} winnerLabel={`Ganó el ${prize}`} /></div>
        <P className="small muted" style={{ marginTop: 8 }}>WAR de Baseball Reference. Un WAR más alto no siempre significa un mejor jugador, pero si el premio se define por valor, esta es la contradicción que hay que explicar.</P>
      </Section>

      <Section title="Casos en detalle" eyebrow="Jugador frente al ganador">
        <div className="grid" style={{ gap: 18 }}>
          {sn.map((x: any) => {
            const key = `${x.year}-${x.lg}`
            const custom = cy ? undefined : WHY[`${x.year}-${x.name}`]
            const cmp = compare.data ? compare.data[key] : null
            const rival = cmp ? cmp.rivals.find((r: any) => r.name === x.name) : null
            const sid = x.mlbId ?? rival?.mlbId
            const wid = cmp?.winner?.mlbId
            return (
              <article className="card" key={`${key}-${x.name}`}>
                <div className="eyebrow" style={{ marginBottom: 8 }}>{x.year}{x.year === 2020 ? ' *' : ''} · {x.lg === 'AL' ? 'Liga Americana' : 'Liga Nacional'} · terminó {x.voteRank}.º</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center' }}>
                  <Face id={sid} name={x.name} width={88} color="var(--s2)" />
                  <div>
                    <h3 style={{ margin: 0 }}><NameLink id={sid} name={x.name} /> <span className="muted small">({x.team})</span></h3>
                    <div className="statline">
                      <span><b>{x.war}</b> bWAR</span>
                      <span>contra <b>{x.winnerWar}</b> de {first(x.winner)}</span>
                      <span><b>+{x.warGap}</b></span>
                    </div>
                    <div className="small muted">{x.w}-{x.l}{x.playoffs ? ' en playoffs' : ' sin playoffs'} · {x.share}% del voto</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <Face id={wid} name={x.winner} width={72} color="var(--s1)" />
                    <div className="small muted" style={{ marginTop: 4 }}>{prize}</div>
                  </div>
                </div>
                <P style={{ marginTop: 12 }}>{custom || (cy ? cyText(x) : genericText(x))}</P>
                {x.year === 2020 ? <P className="small muted">Temporada de 60 juegos. Consulta la nota sobre 2020 en el historial.</P> : null}
                <details className="tbl" style={{ marginTop: 6 }}>
                  <summary>Ver la comparación completa</summary>
                  {cmp ? <Versus people={[cmp.winner, ...cmp.rivals.filter((r: any) => r.name === x.name)]} winnerName={cmp.winner.name} title={`${x.name} frente a ${cmp.winner.name}`} /> : <Loading h={120} />}
                </details>
                <P className="small" style={{ marginTop: 8 }}><Link to={`/historial?anio=${x.year}&liga=${x.lg}`}>Ver la votación completa de {x.year}</Link></P>
              </article>
            )
          })}
        </div>
      </Section>

      <Section title="Diferencias mínimas" eyebrow="Entre 0.2 y 0.5 de WAR">
        <div className="card">
          <DataTable head={['Año', 'Liga', 'Jugador', 'Puesto', 'WAR', 'Ganador', 'WAR ganador', 'Brecha']}
            rows={data.nearMisses.map((x: any) => [x.year, x.lg, <NameLink key={x.name + x.year} id={ids[x.name]} name={x.name} />, `${x.voteRank}.º`, x.war, x.winner, x.winnerWar, `+${x.warGap}`])} left={[1, 2, 5]} />
          <P className="small muted" style={{ marginTop: 8 }}>Brechas tan pequeñas caen dentro del margen de error del WAR. Se incluyen porque ayudan a leer casos como los de la Nacional en 2025.</P>
        </div>
      </Section>

      <Callout title="Una nota sobre 2020">{NOTE_2020}</Callout>

      <Section title="Conclusiones" eyebrow="Lo que muestran los casos">
        <div className="card">
          {cy ? (
            <ul className="clean">
              <li><b>Las mayores brechas.</b> {top3.map((x: any) => `${x.name} en ${x.year} (${x.warGap} más de WAR que ${first(x.winner)})`).join(', ')}.</li>
              <li><b>El récord ayudó al ganador.</b> En {moreWins} de los {sn.length} casos, el ganador tuvo más victorias que el finalista con más WAR.</li>
              <li><b>Los playoffs no explican todo.</b> {offPlayoffs} de los {sn.length} finalistas con más WAR jugaron en equipos que no llegaron a octubre.</li>
            </ul>
          ) : (
          <ul className="clean">
            <li><b>El pitcheo es el gran perdedor.</b> Los tres mayores huecos de WAR de la década (deGrom, Nola y Wheeler) son de lanzadores.</li>
            <li><b>El nombre y el equipo pesan.</b> Trout en 2019, Harper en 2021 y Ohtani en 2021 y 2023 ganaron frente a rivales con más WAR o con un equipo mejor.</li>
            <li><b>El WAR no cierra el debate.</b> En 2026, McGonigle tiene 7.1 de bWAR y 5.4 de fWAR, la misma temporada con dos lecturas distintas. <Link to="/carrera">Consulta la carrera actual</Link>.</li>
          </ul>
          )}
        </div>
      </Section>
    </div>
  )
}
