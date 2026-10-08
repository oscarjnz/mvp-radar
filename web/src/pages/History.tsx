import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useHistory } from '../lib/data'
import type { HistLeague, League } from '../lib/types'
import { headshot, leagueName, slash, teamLogo } from '../lib/format'
import { DataTable, ErrorBox, Loading, Section, Tabs } from '../components/ui'
import { BallotBars } from '../components/histcharts'
import { P, L } from '../components/Term'

export const NOTES: Record<string, string> = {
  '2016-AL': 'Ganó aunque su equipo no llegó a octubre: el WAR pesó más que la posición en la tabla. Mookie Betts fue segundo.',
  '2016-NL': 'Los Cubs fueron campeones de la Serie Mundial. Bryant fue el líder de WAR entre los votados y se llevó 29 de 30 primeros lugares.',
  '2017-AL': 'Altuve y Judge empataron en WAR (8.1). Ganó el jugador del equipo que terminó campeón de la Serie Mundial, frente a un novato con 52 jonrones.',
  '2017-NL': 'La elección más reñida de la década: Stanton superó a Joey Votto por apenas 2 puntos, con 10 votos de primer lugar cada uno.',
  '2018-AL': 'Betts lideró el WAR con 10.7 en el equipo de mejor récord del beisbol, que terminó campeón. Trout fue segundo con 9.9.',
  '2018-NL': 'Yelich ganó con 7.3 de WAR. Jacob deGrom, con 9.9 y una efectividad histórica, quedó quinto: es el caso más claro de la década de un lanzador dominante sin premio.',
  '2019-AL': 'Trout ganó por 17 votos de primer lugar contra 13 de Alex Bregman, que tuvo más WAR (8.9 contra 7.9) y un equipo de playoffs.',
  '2019-NL': 'Bellinger lideró a todos los votados en WAR. Yelich fue segundo pese a perderse el final de la temporada por una lesión.',
  '2020-AL': 'Temporada de 60 juegos. Abreu ganó con 2.7 de WAR, el más bajo de los 20 premios, con 60 impulsadas. Shane Bieber lo superó en WAR pero quedó cuarto.',
  '2020-NL': 'Otra temporada corta. Freeman ganó con 28 votos de primer lugar; Mookie Betts tuvo un WAR levemente mayor.',
  '2021-AL': 'Ohtani, bateando y lanzando, fue el primer jugador de dos vías premiado y el primer unánime de la década.',
  '2021-NL': 'Harper ganó con 5.9 de WAR mientras Juan Soto (7.3), Tatis (6.6) y Wheeler (7.7) tuvieron más. Entre los bateadores, es la victoria con más WAR en contra de la década (1.4 de brecha con Soto).',
  '2022-AL': 'Judge hizo 62 jonrones, récord de la Liga Americana. Ohtani sumó 9.7 de WAR, pero Judge se llevó 28 de 30 votos de primer lugar.',
  '2022-NL': 'Goldschmidt ganó con 22 primeros lugares. Arenado (7.9) y el Cy Young Sandy Alcantara (8.0) tuvieron más WAR.',
  '2023-AL': 'Segundo MVP unánime de Ohtani, con un equipo que no llegó a playoffs. Ya se vio que el voto premia al jugador más único.',
  '2023-NL': 'Acuña hizo 41 jonrones y 73 robos y fue unánime. Mookie Betts tuvo ligeramente más WAR (8.6).',
  '2024-AL': 'Judge, con 58 jonrones y 10.9 de WAR, fue unánime. Bobby Witt Jr. fue segundo con 9.6.',
  '2024-NL': 'Ohtani, ya sin lanzar, bateó 54 jonrones y robó 59 bases (50-50) y fue unánime como bateador designado.',
  '2025-AL': 'Una de las elecciones más cerradas de la década: 17 votos de primer lugar para Judge contra 13 para Cal Raleigh, que hizo 60 jonrones.',
  '2025-NL': 'Ohtani fue unánime, bateando y lanzando 47 entradas. Cristopher Sánchez (8.1) y Paul Skenes (8.0) tuvieron más WAR.',
}

const verdictLabel = { acertado: 'Acertado', discutible: 'Discutible', cuestionable: 'Cuestionable' }

export default function History() {
  const { data, error } = useHistory()
  const [year, setYear] = useState(2025)
  const [lg, setLg] = useState<League>('AL')
  if (error) return <div className="wrap"><ErrorBox msg={error} /></div>
  if (!data) return <div className="wrap"><Loading h={500} /></div>
  const s = data.summary
  const season = data.seasons.find((x) => x.year === year)!
  const d: HistLeague = season[lg]
  const w = d.winner

  const rows = data.seasons.flatMap((ss) => (['AL', 'NL'] as League[]).map((l) => {
    const x = ss[l]
    const b = x.winner
    return [
      ss.year, l, <button key={`${ss.year}${l}`} className="btn" style={{ padding: '2px 8px' }} onClick={() => { setYear(ss.year); setLg(l); window.scrollTo({ top: 260, behavior: 'smooth' }) }}>{b.name}</button>,
      x.pos, `${b.team} ${b.w}-${b.l}${b.playoffs ? ' ★' : ''}`, b.war, b.bat ? b.bat.hr : '-', b.bat ? slash(b.bat.ops) : (b.pit?.era ?? '-'),
      `${b.share}%`, <span key="v" className={`verdict ${x.verdict}`}>{verdictLabel[x.verdict]}</span>,
    ]
  }))

  return (
    <div className="wrap">
      <div className="eyebrow">Historia</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Los últimos 10 MVP: 2016 a 2025</h1>
      <P className="lede">Veinte premios entre las dos ligas. Para cada uno: quién ganó, con qué números, quién estuvo cerca y si el WAR respalda la decisión.</P>

      <div className="stat-tiles">
        <div className="tile"><div className="v">{s.hitters}</div><L>MVP fueron bateadores</L></div>
        <div className="tile"><div className="v">{s.twoWay}</div><L>de dos vías, todos Ohtani</L></div>
        <div className="tile"><div className="v">{s.pitchers}</div><L>lanzadores puros ganaron</L></div>
        <div className="tile"><div className="v">{s.unanimous}</div><L>votaciones unánimes, todas desde 2021</L></div>
      </div>

      <Section title="Elige un año" eyebrow="Explorador">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
          <Tabs value={lg} onChange={setLg} options={[{ id: 'AL', label: 'Americana' }, { id: 'NL', label: 'Nacional' }]} />
          <div className="tabs" role="group" aria-label="Año" style={{ flexWrap: 'wrap' }}>
            {data.seasons.map((x) => <button key={x.year} aria-pressed={x.year === year} onClick={() => setYear(x.year)}>{x.year}</button>)}
          </div>
        </div>
        <div className="grid g2">
          <div className="card">
            <div className="pcard" style={{ gridTemplateColumns: '96px 1fr' }}>
              <img className="photo" style={{ width: 96, borderColor: 'var(--s1)', borderRadius: 14, border: '3px solid var(--s1)' }} src={headshot(w.mlbId, 192)} alt={w.name} />
              <div>
                <div className="eyebrow" style={{ marginBottom: 2 }}>MVP {year} · {leagueName(lg)}</div>
                <h3 style={{ margin: 0 }}>{w.name}</h3>
                <div className="small muted">{d.pos} · <img src={teamLogo(w.teamId)} alt="" width={14} height={14} style={{ verticalAlign: 'text-bottom' }} /> {w.team} {w.w}-{w.l} {w.playoffs ? '· playoffs' : '· sin playoffs'}</div>
                <div className="statline">
                  <span><b>{w.war}</b> WAR</span>
                  {w.bat ? <><span><b>{slash(w.bat.avg)}/{slash(w.bat.obp)}/{slash(w.bat.slg)}</b></span><span><b>{w.bat.hr}</b> HR</span><span><b>{w.bat.rbi}</b> RBI</span></> : null}
                  {w.pit ? <span><b>{w.pit.era}</b> ERA</span> : null}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className={`verdict ${d.verdict}`}>{verdictLabel[d.verdict]}</span>
                  {d.unanimous ? <span className="chip good">Unánime</span> : <span className="chip">{w.first} primeros lugares</span>}
                </div>
              </div>
            </div>
            <P style={{ marginTop: 14 }}>{NOTES[`${year}-${lg}`]}</P>
            <P className="small muted">
              Veredicto por WAR: el mejor WAR entre los votados fue <b>{d.warLeader.name}</b> ({d.warLeader.war}), {d.warGap <= 0 ? 'el propio ganador' : `${d.warGap} por encima del ganador`}. Criterio: acertado si la brecha es de 0.3 o menos; discutible hasta 1.5; cuestionable si es mayor.
            </P>
          </div>
          <div className="card"><BallotBars ballots={d.top10} title={`Boleta ${year}: ${leagueName(lg)}`} /></div>
        </div>
      </Section>

      <Section title="Los 20 ganadores" eyebrow="Tabla">
        <div className="card">
          <DataTable head={['Año', 'Liga', 'MVP', 'Pos.', 'Equipo', 'WAR', 'HR', 'OPS / ERA', 'Voto', 'Veredicto']} rows={rows} caption="Los 20 ganadores del MVP" left={[1, 2, 3, 4, 9]} />
          <P className="small muted" style={{ marginTop: 8 }}>★ equipo en playoffs. WAR de Baseball Reference. Voto: porcentaje de los puntos posibles. Fuente de votaciones: Baseball Reference (Bill Deane, Award Voting).</P>
        </div>
      </Section>
      <P className="small muted" style={{ marginTop: 20 }}>¿Qué se premió más y cómo cambió? Está en <Link to="/que-premian">Qué premian los votantes</Link>. ¿A quién le quitaron el premio? <Link to="/injusticias">Debió ser MVP</Link>.</P>
    </div>
  )
}
