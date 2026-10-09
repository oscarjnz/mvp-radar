import { Link } from 'react-router-dom'
import { useCandidates, useHistory } from '../lib/data'
import { leagueName } from '../lib/format'
import { AWARDS, AwardSwitch, useAward } from '../lib/award'
import { Loading, PlayerCard, Section } from '../components/ui'
import { P, L } from '../components/Term'

export default function Home() {
  const { award } = useAward()
  const cy = award === 'cy'
  const prize = AWARDS[award].full
  const c = useCandidates()
  const h = useHistory()
  return (
    <div className="wrap">
      <header className="hero">
        <AwardSwitch />
        <div className="eyebrow">Laboratorio de béisbol · Temporada 2026</div>
        <h1>¿Quién debería ser <span>{prize}</span>?</h1>
        {cy ? (
          <P className="lede">Los lanzadores de 2026 en las dos ligas, qué premiaron los votantes del Cy Young en los últimos 10 años y a quién le quitaron el premio. Con datos de Baseball Reference, FanGraphs, Baseball Savant y MLB.com, y los gráficos al estilo Savant.</P>
        ) : (
          <P className="lede">Los candidatos de 2026 en las dos ligas, qué premiaron los votantes en los últimos 10 años y a quién le quitaron el premio. Con datos de Baseball Reference, FanGraphs, Baseball Savant y MLB.com, y los gráficos al estilo Savant.</P>
        )}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <Link className="btn" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }} to="/carrera">Ver la carrera al {prize}</Link>
          <Link className="btn" to="/historial">Los últimos 10 {prize}</Link>
          <Link className="btn" to="/revision-del-voto">Revisión del voto</Link>
          <Link className="btn" to="/lideres">Líderes por departamento</Link>
        </div>
        {h.data ? (
          cy ? (
            <div className="stat-tiles">
              <div className="tile"><div className="v">{h.data.summary.warLeaderWon}/20</div><L>veces ganó el líder de WAR entre los votados</L></div>
              <div className="tile"><div className="v">{h.data.summary.eraLeaderWon}/20</div><L>veces ganó quien tuvo la mejor efectividad de la boleta</L></div>
              <div className="tile"><div className="v">{h.data.summary.unanimous}</div><L>votaciones unánimes entre 2016 y 2025</L></div>
              <div className="tile"><div className="v">{h.data.summary.early.avgWins} → {h.data.summary.late.avgWins}</div><L>victorias promedio del ganador, de 2016-2019 a 2021-2025</L></div>
            </div>
          ) : (
            <div className="stat-tiles">
              <div className="tile"><div className="v">{h.data.summary.hitters + h.data.summary.twoWay}/20</div><L>MVP recientes fueron bateadores o DH/P</L></div>
              <div className="tile"><div className="v">0</div><L>lanzadores puros ganaron el premio en 10 años</L></div>
              <div className="tile"><div className="v">{h.data.summary.unanimous}</div><L>votaciones unánimes, todas desde 2021</L></div>
              <div className="tile"><div className="v">{h.data.summary.playoffsPct}%</div><L>de los MVP jugaron en equipos de playoffs</L></div>
            </div>
          )
        ) : null}
      </header>

      <Section title="Favoritos de la temporada" eyebrow={`Carrera al ${prize}`} lede={c.data ? c.data.status : undefined}>
        {!c.data ? <Loading h={200} /> : (
          <div className="grid g2">
            {(['AL', 'NL'] as const).map((lg) => (
              <div key={lg}>
                <h3 style={{ marginBottom: 10 }}>{leagueName(lg)}</h3>
                <div className="grid" style={{ gridAutoRows: '1fr' }}>
                  {c.data!.leagues[lg].top5.slice(0, 3).map((p) => <PlayerCard key={p.id} c={p} />)}
                </div>
                <P style={{ marginTop: 10 }}><Link to={`/carrera?liga=${lg}`}>Ver el top 5 completo →</Link></P>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Secciones del portal" eyebrow="Explora">
        <div className="grid g3">
          {cy ? (
            <>
              <Link to="/carrera" className="card" style={{ color: 'inherit' }}><h3>Carrera al Cy Young</h3><p className="muted">Top 5 por liga con percentiles de Savant, arsenal, mapas de ubicación y un laboratorio para armar tu propia boleta.</p></Link>
              <Link to="/historial" className="card" style={{ color: 'inherit' }}><h3>Últimos 10 Cy Young</h3><p className="muted">Los 20 ganadores de 2016 a 2025, su boleta completa y si el WAR respalda la decisión.</p></Link>
              <Link to="/que-premian" className="card" style={{ color: 'inherit' }}><h3>Qué premian los votantes</h3><p className="muted">Qué pesa más (WAR, efectividad, victorias, playoffs) y qué cambió en la década.</p></Link>
            </>
          ) : (
            <>
              <Link to="/carrera" className="card" style={{ color: 'inherit' }}><h3>Carrera al MVP</h3><p className="muted">Top 5 por liga con percentiles de Savant, spray charts, mapas de zona, bat tracking y un laboratorio para armar tu propia boleta.</p></Link>
              <Link to="/historial" className="card" style={{ color: 'inherit' }}><h3>Últimos 10 MVP</h3><p className="muted">Los 20 ganadores de 2016 a 2025, su boleta completa y si el WAR respalda la decisión.</p></Link>
              <Link to="/que-premian" className="card" style={{ color: 'inherit' }}><h3>Qué premian los votantes</h3><p className="muted">Qué pesa más (WAR, playoffs, jonrones), qué cambió en la década y por qué los lanzadores no ganan.</p></Link>
            </>
          )}
          <Link to="/revision-del-voto" className="card" style={{ color: 'inherit' }}><h3>Revisión del voto</h3><p className="muted">Los finalistas con más WAR que el ganador y las razones por las que el premio fue para otro.</p></Link>
          <Link to="/lideres" className="card" style={{ color: 'inherit' }}><h3>Líderes por departamento</h3><p className="muted">Todas las categorías de bateo y pitcheo de 2026, ordenables, con la evolución de cada jugador frente a sus temporadas anteriores.</p></Link>
          <Link to="/metodologia" className="card" style={{ color: 'inherit' }}><h3>Metodología</h3><p className="muted">De dónde salen los datos, cómo se eligió el top 5 y los límites del análisis.</p></Link>
          <Link to="/glosario" className="card" style={{ color: 'inherit' }}><h3>Glosario</h3><p className="muted">Cada estadística explicada en lenguaje de aficionado, con lo que mide, cómo se lee y cuánto vale.</p></Link>
        </div>
      </Section>
    </div>
  )
}
