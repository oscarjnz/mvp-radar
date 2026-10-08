import { Link } from 'react-router-dom'
import { Section } from '../components/ui'
import { P, Li } from '../components/Term'

export default function Method() {
  return (
    <div className="wrap">
      <div className="eyebrow">Cómo está hecho</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Metodología</h1>
      <P className="lede">Todo el análisis sale de datos públicos. Los números se obtienen con scripts reproducibles y se publican tal cual en la página.</P>

      <Section title="Fuentes" eyebrow="De dónde sale cada dato">
        <div className="card">
          <ul className="clean">
            <Li><b>MLB Stats API (statsapi.mlb.com).</b> Estadísticas de temporada, sabermetría (fWAR, wRC+, wOBA, componentes), standings, biografías, splits por mes y game logs. Su WAR coincide con el de FanGraphs.</Li>
            <Li><b>Baseball Savant.</b> Percentiles, expected stats, Statcast pitch a pitch (batazos, zonas, bat tracking, arsenal).</Li>
            <Li><b>Baseball Reference.</b> bWAR, WPA, RE24 y todas las votaciones de MVP 2016-2025 (Bill Deane, Award Voting).</Li>
            <Li><b>FanGraphs.</b> Verificación cruzada de WAR, wRC+ y valor por componentes.</Li>
            <Li><b>MLB.com.</b> Perfiles de jugadores y las encuestas de MVP de septiembre de 2026 para el contraste.</Li>
          </ul>
          <P className="small muted" style={{ marginTop: 8 }}>Datos de la temporada 2026 al cierre de la temporada regular (27 de septiembre). Los premios oficiales de la BBWAA se anuncian en noviembre. Este sitio no está afiliado a MLB ni a ninguna de estas fuentes. Fotos y logos son de MLB y se enlazan con fines educativos.</P>
        </div>
      </Section>

      <Section title="Cómo se eligió el top 5" eyebrow="Criterio">
        <div className="card">
          <P>Se partió de todos los jugadores con 200 o más turnos y los lanzadores con 60 o más entradas. Se ordenaron por fWAR, bWAR, wRC+ (o ERA y FIP), WPA, RE24, record del equipo y disponibilidad, y se leyeron las encuestas de MLB.com como contraste. El orden final es un juicio, no una fórmula: la tabla y el laboratorio de la página de la carrera muestran cómo cambia con distintos pesos.</P>
          <P>Ohtani cuenta como dos vías: su WAR suma el de bateo y el de pitcheo.</P>
        </div>
      </Section>

      <Section title="Cómo funciona la votación" eyebrow="BBWAA">
        <div className="card">
          <P>La Asociación de Cronistas de Béisbol de América (BBWAA) elige el MVP de cada liga con 30 votantes, dos por cada ciudad. Cada uno nombra 10 jugadores: 14 puntos al primero, luego 9, 8, 7, 6, 5, 4, 3, 2 y 1. El máximo posible es 420 puntos (30 × 14), coherente con las boletas de la década. Los lanzadores y los designados son elegibles. Las instrucciones oficiales hablan de «valor real para su equipo», sin definir qué es valor; por eso cada votante pesa los criterios a su manera.</P>
        </div>
      </Section>

      <Section title="Glosario" eyebrow="Para leer los números">
        <div className="card">
          <P>Cada estadística de esta web tiene su explicación: qué mide, cómo se lee, para qué sirve y cuánto vale. Haz clic en cualquier término subrayado con puntos (WAR, wRC+, xwOBA...) o consulta la lista completa en el <Link to="/glosario">glosario</Link>.</P>
        </div>
      </Section>

      <Section title="Límites" eyebrow="Para no sacar conclusiones de más">
        <div className="card">
          <ul className="clean">
            <Li>El WAR no es una verdad única. Dos fuentes pueden diferir por más de una victoria para el mismo jugador (por ejemplo, Kevin McGonigle 2026).</Li>
            <Li>La regresión histórica es descriptiva. Solo incluye jugadores que recibieron votos, así que no puede medir lo que le pasa a un lanzador que no aparece en la boleta.</Li>
            <Li>Los veredictos «acertado», «discutible» y «cuestionable» usan solo la brecha de WAR respecto del mejor votado. No tienen en cuenta defensa, liderazgo, posteriores lesiones ni lo que ocurrió en octubre.</Li>
            <Li>El orden del top 5 de 2026 es una opinión informada por datos, no una predicción.</Li>
          </ul>
          <P className="small muted" style={{ marginTop: 8 }}>Código y scripts de datos en el repositorio del proyecto. <Link to="/">Volver al inicio</Link>.</P>
        </div>
      </Section>
    </div>
  )
}
