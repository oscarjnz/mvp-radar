import { Link } from 'react-router-dom'
import { Section } from '../components/ui'

const GLOSSARY: [string, string][] = [
  ['WAR', 'Wins Above Replacement: victorias que un jugador suma sobre un reemplazo de nivel mínimo. Hay varias versiones: fWAR (FanGraphs) y bWAR (Baseball Reference). Pueden diferir en defensa, posición y en cómo miden a los lanzadores.'],
  ['wRC+', 'Carreras creadas ponderadas ajustadas por parque y liga. 100 es el promedio de la liga; 150 es un bateador 50% mejor que el promedio.'],
  ['wOBA / xwOBA', 'wOBA pondera cada resultado por su valor real en carreras. xwOBA es el valor esperado según la velocidad de salida y el ángulo del contacto, sin la suerte de la defensa.'],
  ['WPA', 'Win Probability Added: cuánto cambió un jugador la probabilidad de ganar de su equipo, jugada a jugada. Premia al que rinde en momentos importantes.'],
  ['RE24', 'Carreras ganadas sobre lo esperado dado el estado de bases y outs en cada turno.'],
  ['Barrel', 'Contacto con la combinación ideal de velocidad y ángulo para extra bases. Barrel % es el porcentaje de contactos que lo son.'],
  ['Hard-Hit %', 'Porcentaje de batazos con 95 mph o más de velocidad de salida.'],
  ['Percentil Savant', 'Ranking de 0 a 100 frente al resto de la liga. El rojo es élite y el azul es bajo. Incluye métricas donde menos es mejor ya invertidas.'],
  ['OAA', 'Outs Above Average: defensa de Statcast, outs que un fildeador convierte sobre el promedio.'],
  ['Bat tracking', 'Medición de Statcast de la velocidad, la longitud y el ángulo de ataque del swing.'],
]

export default function Method() {
  return (
    <div className="wrap">
      <div className="eyebrow">Cómo está hecho</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Metodología</h1>
      <p className="lede">Todo el análisis sale de datos públicos. Los números se obtienen con scripts reproducibles y se publican tal cual en la página.</p>

      <Section title="Fuentes" eyebrow="De dónde sale cada dato">
        <div className="card">
          <ul className="clean">
            <li><b>MLB Stats API (statsapi.mlb.com).</b> Estadísticas de temporada, sabermetría (fWAR, wRC+, wOBA, componentes), standings, biografías, splits por mes y game logs. Su WAR coincide con el de FanGraphs.</li>
            <li><b>Baseball Savant.</b> Percentiles, expected stats, Statcast pitch a pitch (batazos, zonas, bat tracking, arsenal).</li>
            <li><b>Baseball Reference.</b> bWAR, WPA, RE24 y todas las votaciones de MVP 2016-2025 (Bill Deane, Award Voting).</li>
            <li><b>FanGraphs.</b> Verificación cruzada de WAR, wRC+ y valor por componentes.</li>
            <li><b>MLB.com.</b> Perfiles de jugadores y las encuestas de MVP de septiembre de 2026 para el contraste.</li>
          </ul>
          <p className="small muted" style={{ marginTop: 8 }}>Datos de la temporada 2026 al cierre de la temporada regular (27 de septiembre). Los premios oficiales de la BBWAA se anuncian en noviembre. Este sitio no está afiliado a MLB ni a ninguna de estas fuentes. Fotos y logos son de MLB y se enlazan con fines educativos.</p>
        </div>
      </Section>

      <Section title="Cómo se eligió el top 5" eyebrow="Criterio">
        <div className="card">
          <p>Se partió de todos los jugadores con 200 o más turnos y los lanzadores con 60 o más entradas. Se ordenaron por fWAR, bWAR, wRC+ (o ERA y FIP), WPA, RE24, record del equipo y disponibilidad, y se leyeron las encuestas de MLB.com como contraste. El orden final es un juicio, no una fórmula: la tabla y el laboratorio de la página de la carrera muestran cómo cambia con distintos pesos.</p>
          <p>Ohtani cuenta como dos vías: su WAR suma el de bateo y el de pitcheo.</p>
        </div>
      </Section>

      <Section title="Cómo funciona la votación" eyebrow="BBWAA">
        <div className="card">
          <p>La Asociación de Cronistas de Béisbol de América (BBWAA) elige el MVP de cada liga con 30 votantes, dos por cada ciudad. Cada uno nombra 10 jugadores: 14 puntos al primero, luego 9, 8, 7, 6, 5, 4, 3, 2 y 1. El máximo posible es 420 puntos (30 × 14), coherente con las boletas de la década. Los lanzadores y los designados son elegibles. Las instrucciones oficiales hablan de «valor real para su equipo», sin definir qué es valor; por eso cada votante pesa los criterios a su manera.</p>
        </div>
      </Section>

      <Section title="Glosario" eyebrow="Para leer los números">
        <div className="grid g2">
          {GLOSSARY.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p className="muted" style={{ margin: 0 }}>{d}</p></div>)}
        </div>
      </Section>

      <Section title="Límites" eyebrow="Para no sacar conclusiones de más">
        <div className="card">
          <ul className="clean">
            <li>El WAR no es una verdad única. Dos fuentes pueden diferir por más de una victoria para el mismo jugador (por ejemplo, Kevin McGonigle 2026).</li>
            <li>La regresión histórica es descriptiva. Solo incluye jugadores que recibieron votos, así que no puede medir lo que le pasa a un lanzador que no aparece en la boleta.</li>
            <li>Los veredictos «acertado», «discutible» y «cuestionable» usan solo la brecha de WAR respecto del mejor votado. No tienen en cuenta defensa, liderazgo, posteriores lesiones ni lo que ocurrió en octubre.</li>
            <li>El orden del top 5 de 2026 es una opinión informada por datos, no una predicción.</li>
          </ul>
          <p className="small muted" style={{ marginTop: 8 }}>Código y scripts de datos en el repositorio del proyecto. <Link to="/">Volver al inicio</Link>.</p>
        </div>
      </Section>
    </div>
  )
}
