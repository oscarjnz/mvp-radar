import { Link } from 'react-router-dom'
import { Callout, QuoteCard, Section } from '../components/ui'
import { Li, P } from '../components/Term'
import { NOTE_2020, QUOTES } from '../data/histStory'

export default function Method() {
  return (
    <div className="wrap">
      <div className="eyebrow">Cómo está hecho</div>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>Metodología</h1>
      <P className="lede">Todo el análisis sale de datos públicos. Las cifras se obtienen con scripts reproducibles y se publican tal cual en la página.</P>

      <Section title="Fuentes de datos" eyebrow="Origen de cada dato">
        <div className="card">
          <ul className="clean">
            <Li><b>MLB Stats API.</b> Estadísticas de temporada, sabermetría (fWAR, wRC+, wOBA y sus componentes), posiciones, biografías, splits por mes y registros de juego. Su WAR coincide con el de FanGraphs.</Li>
            <Li><b>Baseball Savant.</b> Percentiles, estadísticas esperadas y Statcast pitch a pitch (batazos, zonas, bat tracking y arsenal).</Li>
            <Li><b>Baseball Reference.</b> bWAR, WPA, RE24 y todas las votaciones de MVP y de Cy Young de 2016 a 2025 (Bill Deane, Award Voting).</Li>
            <Li><b>FanGraphs.</b> Verificación cruzada de WAR, wRC+ y valor por componentes.</Li>
            <Li><b>MLB.com.</b> Perfiles de jugadores y encuestas de MVP y de Cy Young de septiembre de 2026 para contrastar el análisis.</Li>
          </ul>
          <P className="small muted" style={{ marginTop: 8 }}>Los datos de 2026 corresponden al cierre de la temporada regular, el 27 de septiembre. Los premios oficiales de la BBWAA se anunciarán en noviembre. Este sitio es independiente y no tiene relación con MLB ni con ninguna de estas fuentes. Las fotos y los logos pertenecen a MLB y se enlazan con fines educativos.</P>
        </div>
      </Section>

      <Section title="Cómo se eligió el top 5" eyebrow="Criterio">
        <div className="card">
          <P>Se partió de todos los jugadores con 200 o más turnos y de los lanzadores con 60 o más entradas. Se ordenaron según fWAR, bWAR, wRC+ (o ERA y FIP), WPA, RE24, récord del equipo y disponibilidad, y se tomaron las encuestas de MLB.com como contraste. El orden final es un juicio y no una fórmula. La tabla y el laboratorio de la página de la carrera permiten ver cómo cambia con distintos pesos.</P>
          <P>Ohtani figura como DH/P, así que su WAR suma el de bateo y el de pitcheo.</P>
        </div>
      </Section>

      <Section title="Cómo se armó el Cy Young" eyebrow="Segundo premio">
        <div className="card">
          <P>El Cy Young usa el mismo portal y los mismos datos, con un selector de premio en cada página. Se partió de los lanzadores con 60 o más entradas. Para comparar efectividad y FIP dentro de la liga solo se cuentan los calificados, que son los que lanzaron 162 entradas o más.</P>
          <P>El top 5 y la burbuja de cada liga se ordenaron con WAR de dos fuentes, prevención de carreras, volumen de entradas y ponches, y se tomó como contraste la última encuesta de MLB.com, hecha a dos semanas del cierre con 32 votantes y una escala de 5-4-3-2-1. Los textos de cada candidato se generan a partir de los datos de la liga, sin cifras escritas a mano, de modo que puedan actualizarse solos.</P>
          <P>La BBWAA elige el Cy Young de cada liga con 30 votantes. Cada uno nombra a cinco lanzadores y les asigna 7 puntos al primero y luego 4, 3, 2 y 1. El máximo posible es de 210 puntos (30 por 7), coherente con las boletas de la década. Los relevistas son elegibles.</P>
        </div>
      </Section>

      <Section title="Cómo funciona la votación del MVP" eyebrow="BBWAA">
        <div className="card">
          <P>La Asociación de Cronistas de Béisbol de América (BBWAA) elige el MVP de cada liga con 30 votantes, dos por cada ciudad. Cada uno nombra a 10 jugadores y les asigna 14 puntos al primero y luego 9, 8, 7, 6, 5, 4, 3, 2 y 1. El máximo posible es de 420 puntos (30 por 14), coherente con las boletas de la década. Los lanzadores y los bateadores designados son elegibles.</P>
          <P>La regla más antigua del voto pide valorar el aporte real del jugador a su equipo, pero no define qué cuenta como valor. Por eso cada votante pondera los criterios a su manera.</P>
          <QuoteCard q={QUOTES.bbwaaRule} />
        </div>
      </Section>

      <Section title="La temporada de 2020" eyebrow="Contexto">
        <Callout title="Una temporada de 60 juegos">{NOTE_2020}</Callout>
        <P className="small muted" style={{ marginTop: 10 }}>Por esa razón, en los análisis de épocas el año 2020 se muestra aparte y no se promedia con los demás.</P>
      </Section>

      <Section title="Citas y fuentes periodísticas" eyebrow="Voces del béisbol">
        <div className="card">
          <P>Las citas de periodistas incluidas en la web son breves, se reproducen tal como se publicaron y llevan el nombre del autor, el medio, el título del artículo, la fecha y un enlace. Cuando el original está en inglés, la traducción al español es propia. Cada cita se verificó contra el texto publicado.</P>
        </div>
      </Section>

      <Section title="Glosario" eyebrow="Para leer los números">
        <div className="card">
          <P>Cada estadística de esta web tiene su explicación, que incluye qué mide, cómo se lee, para qué sirve y cuánto vale. Haz clic en cualquier término subrayado con puntos (WAR, wRC+, xwOBA y otros) o consulta la lista completa en el <Link to="/glosario">glosario</Link>.</P>
        </div>
      </Section>

      <Section title="Límites del análisis" eyebrow="Para no sacar conclusiones de más">
        <div className="card">
          <ul className="clean">
            <Li>El WAR no es una verdad única. Dos fuentes pueden diferir por más de una victoria para el mismo jugador, como ocurre con Kevin McGonigle en 2026.</Li>
            <Li>La regresión histórica es descriptiva. Solo incluye a jugadores que recibieron votos, así que no puede medir qué le pasa a un lanzador que no aparece en la boleta.</Li>
            <Li>La encuesta de MLB.com del Cy Young se cerró con dos semanas de temporada por jugar, así que no incluye las últimas aperturas de los candidatos.</Li>
            <Li>Las valoraciones «acertado», «discutible» y «cuestionable» usan únicamente la brecha de bWAR respecto del mejor votado. No consideran defensa fuera del WAR, liderazgo, lesiones posteriores ni lo ocurrido en octubre.</Li>
            <Li>El orden del top 5 de 2026 es una opinión informada por datos y no una predicción.</Li>
          </ul>
          <P className="small muted" style={{ marginTop: 8 }}>El código y los scripts de datos están en el repositorio del proyecto. <Link to="/">Volver al inicio</Link>.</P>
        </div>
      </Section>
    </div>
  )
}
