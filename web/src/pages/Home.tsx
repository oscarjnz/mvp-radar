import { Link } from 'react-router-dom'
import { useCandidates, useHistory } from '../lib/data'
import { leagueName } from '../lib/format'
import { Loading, PlayerCard, Section } from '../components/ui'

export default function Home() {
  const c = useCandidates()
  const h = useHistory()
  return (
    <div className="wrap">
      <header className="hero">
        <div className="eyebrow">Laboratorio de béisbol · Temporada 2026</div>
        <h1>¿Quién debería ser <span>MVP</span>?</h1>
        <p className="lede">Los candidatos de 2026 en las dos ligas, qué premiaron los votantes en los últimos 10 años y a quién le quitaron el premio. Con datos de Baseball Reference, FanGraphs, Baseball Savant y MLB.com, y los gráficos al estilo Savant.</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
          <Link className="btn" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }} to="/carrera">Ver la carrera 2026</Link>
          <Link className="btn" to="/historial">Los últimos 10 MVP</Link>
          <Link className="btn" to="/injusticias">Debió ser MVP</Link>
        </div>
        {h.data ? (
          <div className="stat-tiles">
            <div className="tile"><div className="v">{h.data.summary.hitters + h.data.summary.twoWay}/20</div><div className="l">MVP recientes fueron bateadores o de dos vías</div></div>
            <div className="tile"><div className="v">0</div><div className="l">lanzadores puros ganaron el premio en 10 años</div></div>
            <div className="tile"><div className="v">{h.data.summary.unanimous}</div><div className="l">votaciones unánimes, todas desde 2021</div></div>
            <div className="tile"><div className="v">{h.data.summary.playoffsPct}%</div><div className="l">de los MVP jugaron en equipos de playoffs</div></div>
          </div>
        ) : null}
      </header>

      <Section title="Los favoritos hoy" eyebrow="Carrera MVP 2026" lede={c.data ? c.data.status : undefined}>
        {!c.data ? <Loading h={200} /> : (
          <div className="grid g2">
            {(['AL', 'NL'] as const).map((lg) => (
              <div key={lg}>
                <h3 style={{ marginBottom: 10 }}>{leagueName(lg)}</h3>
                <div className="grid">
                  {c.data!.leagues[lg].top5.slice(0, 3).map((p) => <PlayerCard key={p.id} c={p} />)}
                </div>
                <p style={{ marginTop: 10 }}><Link to={`/carrera?liga=${lg}`}>Ver el top 5 completo →</Link></p>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Qué encontrarás" eyebrow="Explora">
        <div className="grid g3">
          <Link to="/carrera" className="card" style={{ color: 'inherit' }}><h3>Carrera 2026</h3><p className="muted">Top 5 por liga con percentiles de Savant, spray charts, mapas de zona, bat tracking y un laboratorio para armar tu propia boleta.</p></Link>
          <Link to="/historial" className="card" style={{ color: 'inherit' }}><h3>Últimos 10 MVP</h3><p className="muted">Los 20 ganadores de 2016 a 2025, su boleta completa y si el WAR respalda la decisión.</p></Link>
          <Link to="/que-premian" className="card" style={{ color: 'inherit' }}><h3>Qué premian</h3><p className="muted">Qué pesa más (WAR, playoffs, jonrones), qué cambió en la década y por qué los lanzadores no ganan.</p></Link>
          <Link to="/injusticias" className="card" style={{ color: 'inherit' }}><h3>Debió ser MVP</h3><p className="muted">Los jugadores con más WAR que el ganador y por qué se quedaron sin el premio.</p></Link>
          <Link to="/metodologia" className="card" style={{ color: 'inherit' }}><h3>Metodología</h3><p className="muted">De dónde salen los datos, glosario de estadísticas y límites del análisis.</p></Link>
          <div className="card" style={{ opacity: 0.8 }}><h3>Próximamente: Cy Young</h3><p className="muted">El mismo tratamiento para el premio de los lanzadores.</p></div>
        </div>
      </Section>
    </div>
  )
}
