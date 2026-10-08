export interface Quote {
  /** texto original (inglés o español) */
  text: string
  /** traducción propia al español cuando el original está en inglés */
  es?: string
  author: string
  outlet: string
  title: string
  date: string
  url: string
}

export interface Story {
  /** una o dos frases que resumen la votación */
  context: string
  /** párrafos de análisis (comparaciones, quién pudo ser mejor y por qué) */
  analysis?: string[]
  /** cierre breve */
  takeaway?: string
}

export const QUOTES: Record<string, Quote> = {
  petrielloPitchers: {
    text: 'pitchers still can and do win the award',
    es: 'los lanzadores todavía pueden ganar el premio, y lo hacen',
    author: 'Mike Petriello', outlet: 'MLB.com', title: "Here's why deGrom is NL's Most Valuable Player", date: '21 de septiembre de 2018',
    url: 'https://www.mlb.com/news/jacob-degrom-should-be-national-league-mvp-c295265432',
  },
  petrielloWar: {
    text: 'award balloting should not just be about "who has the most WAR."',
    es: 'la votación de los premios no debería tratarse solo de «quién tiene más WAR»',
    author: 'Mike Petriello', outlet: 'MLB.com', title: "Here's why deGrom is NL's Most Valuable Player", date: '21 de septiembre de 2018',
    url: 'https://www.mlb.com/news/jacob-degrom-should-be-national-league-mvp-c295265432',
  },
  ballotRule: {
    text: 'Keep in mind that all players are eligible for MVP, including pitchers and designated hitters',
    es: 'Tengan presente que todos los jugadores son elegibles para el MVP, incluidos lanzadores y bateadores designados',
    author: 'Instrucción de la boleta de la BBWAA, citada por Mike Petriello', outlet: 'MLB.com', title: "Here's why deGrom is NL's Most Valuable Player", date: '21 de septiembre de 2018',
    url: 'https://www.mlb.com/news/jacob-degrom-should-be-national-league-mvp-c295265432',
  },
  cassavellBest: {
    text: 'this whole discussion would be a lot easier if we just called it the "Best Overall Player" Award',
    es: 'toda esta discusión sería mucho más fácil si lo llamáramos el premio al «Mejor Jugador en General»',
    author: 'A.J. Cassavell', outlet: 'MLB.com', title: 'NL MVP debate: Soto, Harper or Tatis?', date: '18 de noviembre de 2021',
    url: 'https://www.mlb.com/news/2021-nl-mvp-award-roundtable-discussion',
  },
  cassavellDeserving: {
    text: 'Soto and Harper are both absolutely deserving candidates',
    es: 'Soto y Harper son, ambos, candidatos absolutamente merecedores',
    author: 'A.J. Cassavell', outlet: 'MLB.com', title: 'NL MVP debate: Soto, Harper or Tatis?', date: '18 de noviembre de 2021',
    url: 'https://www.mlb.com/news/2021-nl-mvp-award-roundtable-discussion',
  },
  stark: {
    text: "There's no wrong answer here.",
    es: 'No hay una respuesta equivocada aquí.',
    author: 'Jayson Stark', outlet: 'The Athletic', title: 'The Bryce Harper-Juan Soto NL MVP debate is one for the ages. Jayson Stark breaks down the case for each', date: '17 de noviembre de 2021',
    url: 'https://www.nytimes.com/athletic/2961886/2021/11/17/the-bryce-harper-juan-soto-nl-mvp-debate-is-one-for-the-ages-jayson-stark-breaks-down-the-case-for-each/',
  },
  mctaggart: {
    text: 'Trout and Bregman appeared first and second on all 30 ballots',
    es: 'Trout y Bregman aparecieron primero y segundo en las 30 boletas',
    author: 'Brian McTaggart', outlet: 'MLB.com', title: 'Alex Bregman AL MVP Award vote', date: '14 de noviembre de 2019',
    url: 'https://www.mlb.com/news/alex-bregman-al-mvp-award-vote',
  },
  mullen: {
    text: 'a pair of sluggers named Jose from the AL Central',
    es: 'un par de sluggers llamados José de la división Central de la Americana',
    author: 'Dan Mullen', outlet: 'ESPN', title: 'How Jose Abreu won American League MVP', date: '12 de noviembre de 2020',
    url: 'https://www.espn.com/mlb/story/_/id/30305339/how-jose-abreu-won-american-league-mvp',
  },
  rojas: {
    text: 'pueden ganar el MVP por votación unánime',
    author: 'Enrique Rojas', outlet: 'ESPN Deportes', title: 'Premio MVP: Ohtani y Judge deben ganar de manera unánime', date: '20 de noviembre de 2024',
    url: 'https://espndeportes.espn.com/beisbol/nota/_/id/14468611/mlb-ohtani-judge-deben-ganar-mvp-unanime',
  },
  doolittleJudge: {
    text: 'narrowly beat out Seattle Mariners catcher Cal Raleigh',
    es: 'superó por poco al receptor de los Marineros de Seattle, Cal Raleigh',
    author: 'Bradford Doolittle', outlet: 'ESPN', title: '2025 MLB Awards: Results, analysis on MVP, Cy Young, more', date: '13 de noviembre de 2025',
    url: 'https://www.espn.com/mlb/story/_/id/46833929/2025-mlb-awards-mvp-cy-young-rookie-manager-year-predictions-results-analysis-ohtani-judge-raleigh',
  },
  doolittleOhtani: {
    text: 'fourth in five years, all unanimously',
    es: 'cuarto en cinco años, todos por unanimidad',
    author: 'Bradford Doolittle', outlet: 'ESPN', title: '2025 MLB Awards: Results, analysis on MVP, Cy Young, more', date: '13 de noviembre de 2025',
    url: 'https://www.espn.com/mlb/story/_/id/46833929/2025-mlb-awards-mvp-cy-young-rookie-manager-year-predictions-results-analysis-ohtani-judge-raleigh',
  },
  simon: {
    text: 'no hubo tal incertidumbre',
    author: 'Andrew Simon', outlet: 'MLB.com (en español)', title: 'Ohtani hizo historia de CINCO maneras con su cuarto JMV', date: '13 de noviembre de 2025',
    url: 'https://www.mlb.com/es/news/shohei-ohtani-historia-de-mvp-en-2025',
  },
}

QUOTES.bbwaaRule = {
  text: 'Actual value of a player to his team, that is, strength of offense and defense.',
  es: 'El valor real de un jugador para su equipo, es decir, la fuerza de su ofensiva y su defensa',
  author: 'Primera regla de la boleta del MVP, escrita en 1931', outlet: 'BBWAA, Voting FAQ', title: 'Voting FAQ', date: 'consultado el 8 de octubre de 2026',
  url: 'https://bbwaa.com/voting-faq/',
}

export const QUOTE_MAP: Record<string, string[]> = {
  '2018-NL': ['petrielloPitchers'],
  '2019-AL': ['mctaggart'],
  '2020-AL': ['mullen'],
  '2021-NL': ['stark', 'cassavellDeserving'],
  '2024-AL': ['rojas'],
  '2024-NL': ['rojas'],
  '2025-AL': ['doolittleJudge'],
  '2025-NL': ['doolittleOhtani', 'simon'],
}

export const NOTE_2020 =
  'La temporada de 2020 fue la recortada por la pandemia. Cada equipo jugó solo 60 partidos de temporada regular y no 162, por eso los totales de jonrones, impulsadas y WAR de ese año son tan distintos a los de los demás. Una diferencia de 0.5 de WAR en 60 juegos equivale a casi 1.4 en una temporada completa.'

export const STORY: Record<string, Story> = {
  '2016-AL': {
    context: 'Mike Trout ganó su segundo MVP con 10.4 de bWAR y .315/.441/.550, aunque los Angelinos terminaron 74-88 y quedaron fuera de playoffs.',
    analysis: [
      'Mookie Betts fue su rival más cercano. Bateó .318/.363/.534 con 31 jonrones y 113 impulsadas, sumó 14.5 carreras con la defensa y ayudó a Boston (93-69) a llegar a octubre. Su wRC+ de 136, sin embargo, quedó muy lejos del 170 de Trout, y tanto el bWAR (9.8 contra 10.4) como el fWAR (7.4 contra 8.7) favorecen al jardinero de Anaheim.',
      'El voto mostró que, con una ventaja de valor tan clara, los escritores aceptaron premiar a un jugador de un equipo perdedor. Trout recibió 19 votos de primer lugar contra 9 de Betts.',
    ],
  },
  '2016-NL': {
    context: 'Kris Bryant ganó con 29 de 30 votos de primer lugar, 7.3 de bWAR y 39 jonrones, en el equipo con mejor récord de las Grandes Ligas (103-58).',
    analysis: [
      'Daniel Murphy bateó .347/.390/.595, pero su defensa (-11.7 carreras) lo dejó en 4.7 de bWAR. Corey Seager sumó 5.3. Ningún votado superó a Bryant en WAR, así que la decisión se sostiene sin discusión.',
    ],
  },
  '2017-AL': {
    context: 'Altuve y Judge terminaron empatados en 8.1 de bWAR. Altuve ganó con 27 votos de primer lugar contra 2 para Judge.',
    analysis: [
      'Altuve bateó .346/.410/.547, robó 32 bases y llevó a Houston (101-61) al título de la Serie Mundial. Judge disparó 52 jonrones, récord para un novato en ese momento, con .284/.422/.627, pero Nueva York (91-71) cayó en la Serie de Campeonato.',
      'Por fWAR sí hubo una diferencia. Judge sumó 8.7 contra 7.7 de Altuve, y su wRC+ fue de 174 frente a 160. Es una de las votaciones en las que la fuente de WAR cambia la lectura.',
    ],
  },
  '2017-NL': {
    context: 'La elección más reñida de la década. Giancarlo Stanton superó a Joey Votto por solo 2 puntos, con 10 votos de primer lugar para cada uno.',
    analysis: [
      'Stanton sacó 59 jonrones del parque, el máximo de las Grandes Ligas, y remolcó 132 carreras con Miami (77-85). Votto bateó .320/.454/.578, tuvo 163 de wRC+ contra 158 y quedó a dos décimas de WAR (7.9 contra 8.1) con Cincinnati (68-94). Ninguno de los dos equipos llegó a playoffs, así que el desempate lo definieron el poder y las impulsadas.',
    ],
  },
  '2018-AL': {
    context: 'Mookie Betts ganó con 10.7 de bWAR, casi un punto más que Mike Trout (9.9), al frente de Boston (108-54), el mejor récord de las Grandes Ligas.',
    analysis: [
      'Trout bateó .312/.460/.628 con 39 jonrones y tuvo un wRC+ de 188, apenas por encima del 185 de Betts. La defensa y el corrido de Betts (+13.2 y +7.7 carreras) inclinaron la balanza, y los Angelinos terminaron 80-82.',
    ],
  },
  '2018-NL': {
    context: 'Christian Yelich ganó con 29 de 30 votos de primer lugar y 7.3 de bWAR. El restante fue para Jacob deGrom, que terminó quinto con 9.9.',
    analysis: [
      'Es el caso más claro de la década. Yelich bateó .326/.402/.598, conectó 36 jonrones, remolcó 110 carreras y llevó a Milwaukee (96-67) a los playoffs. Su temporada fue sobresaliente, pero no fue la de mayor valor de la Nacional.',
      'deGrom lanzó 217.0 entradas con 1.70 de efectividad y 269 ponches. Su FIP de 1.99 confirma que no dependió de la suerte. Su bWAR superó en 2.6 al de Yelich, y por fWAR la ventaja sigue ahí (9.0 contra 7.7). Max Scherzer (8.7 de bWAR, 300 ponches) y Aaron Nola (9.2) también lo superaron por bWAR, aunque no por fWAR (7.5 y 5.5).',
      'Los Mets terminaron 77-85 y sin playoffs, y deGrom recibió solo el 34% del voto, un día después de ganar el Cy Young. Yelich, en cambio, ofrecía la combinación que más ha premiado esta década, un bate de élite en un equipo clasificado. La regla permite que un lanzador gane, pero el historial reciente no.',
    ],
    takeaway: 'Por valor total, el mejor jugador de la Nacional en 2018 fue deGrom.',
  },
  '2019-AL': {
    context: 'Mike Trout ganó su tercer MVP con 17 votos de primer lugar contra 13 de Alex Bregman. Los dos aparecieron primero y segundo en las 30 boletas.',
    analysis: [
      'Trout bateó .291/.438/.645 con 45 jonrones y 177 de wRC+, pero jugó 134 juegos y Los Angelinos terminaron 72-90. Bregman, de unos Astros de 107 victorias, bateó .296/.423/.592 con 41 jonrones, 112 impulsadas y 156 juegos.',
      'El bWAR favorece a Bregman por una victoria completa (8.9 contra 7.9) y el fWAR también (8.3 contra 7.6). Según FanGraphs, el bate de ambos produjo casi lo mismo (59.3 carreras sobre el promedio para Bregman y 58.7 para Trout). La ventaja salió de la defensa (-0.7 contra -4.9), de la posición (tercera base contra jardín central) y de los juegos jugados.',
      'Marcus Semien (Atléticos, 97-65) sumó 8.4 de bWAR, aunque solo 6.5 de fWAR, y terminó tercero. Trout tuvo el mejor bate por turno y Bregman el mayor valor acumulado, y el voto se inclinó por el primero.',
    ],
    takeaway: 'Con un margen de apenas 20 puntos, es una decisión defendible y a la vez discutible.',
  },
  '2019-NL': {
    context: 'Cody Bellinger lideró a todos los votados con 8.7 de bWAR, bateó .305/.406/.629 con 47 jonrones y fue pieza de unos Dodgers de 106 victorias.',
    analysis: [
      'Christian Yelich tuvo un wRC+ mayor (174 contra 161), conectó 44 jonrones y robó 30 bases, pero su defensa (-8.3 carreras) y los 26 juegos que se perdió respecto a Bellinger lo dejaron en 7.1.',
    ],
  },
  '2020-AL': {
    context: 'José Abreu ganó con .317/.370/.617, 19 jonrones y 60 impulsadas (líder de la Americana) en los 60 juegos de la temporada, con los White Sox (35-25) en playoffs.',
    analysis: [
      'Su bWAR de 2.7 es el más bajo de los 20 premios de la década. En una temporada de 60 juegos, sin embargo, cada décima pesa más, y 0.5 de WAR equivalen a casi 1.4 en una campaña completa.',
      'Shane Bieber dominó con 1.63 de efectividad y 122 ponches en 77.1 entradas, ganó la Triple Corona de pitcheo y el Cy Young, y sumó 3.2 de bWAR (3.1 de fWAR contra 2.9 de Abreu). DJ LeMahieu bateó .364/.421/.590 con un wRC+ de 177, aunque en solo 50 juegos y con 3.0 de bWAR (2.3 de fWAR). José Ramírez, el otro José de la Central, quedó segundo en la votación con 2.5.',
    ],
  },
  '2020-NL': {
    context: 'Freddie Freeman ganó con 28 votos de primer lugar tras batear .341/.462/.640 con 13 jonrones y 186 de wRC+, el mejor entre los finalistas.',
    analysis: [
      'Mookie Betts sumó 3.7 de bWAR contra 3.3 de Freeman, gracias a su defensa (+4.5) y a su corrido (+2.3), y llevó a los Dodgers a un récord de 43-17. El fWAR, sin embargo, favorece a Freeman (3.0 contra 2.7). Manny Machado (3.0 de bWAR) completó el podio de valor.',
    ],
  },
  '2021-AL': {
    context: 'Shohei Ohtani fue el primer jugador de dos vías premiado y el primer unánime de la década, con 9.0 de bWAR.',
    analysis: [
      'Bateó .257/.372/.592 con 46 jonrones y 26 bases robadas, y como lanzador ganó 9 juegos con 3.18 de efectividad y 156 ponches en 130.1 entradas. Vladimir Guerrero Jr. bateó .311/.401/.601 con 48 jonrones y 166 de wRC+ para unos Azulejos de 91 victorias, pero sumó 6.5. Ningún votado se acercó al valor total de Ohtani, aun con los Angelinos en 77-85.',
    ],
  },
  '2021-NL': {
    context: 'Bryce Harper ganó con 17 votos de primer lugar, contra 6 de Juan Soto y 2 de Fernando Tatis Jr., y con 5.9 de bWAR. Entre los bateadores, es la victoria con más WAR en contra de la década.',
    analysis: [
      'Harper bateó .309/.429/.615 con 35 jonrones, lideró la Nacional en OPS (1.044) y slugging (.615) y tuvo un wRC+ de 170. Los Filis, sin embargo, terminaron 82-80 y sin playoffs. Su bWAR quedó por debajo del de Soto (7.3), Tatis (6.6) y del lanzador Zack Wheeler (7.7), una brecha de hasta 1.8.',
      'El fWAR cuenta una historia más cercana. Harper sumó 6.7, Soto 6.8 y Tatis 6.8, un empate técnico entre los tres bateadores, con Wheeler arriba con 7.2. La diferencia entre las dos fuentes viene de cómo valoran la defensa y la posición.',
      'Soto lideró la liga en OBP (.465) y en boletos (145), y jugó 151 juegos contra 141 de Harper, pero Washington (65-97) fue último. Tatis lideró la Nacional con 42 jonrones en 130 juegos, con San Diego fuera de playoffs. Wheeler encabezó la liga en entradas (213.1) y ponches (247) y terminó 19.º con 1% del voto.',
      'Entre los bateadores, el mejor bate fue el de Harper (170 de wRC+ contra 164 de Soto y 158 de Tatis). Por valor total, Soto y Wheeler pudieron haber ganado según el bWAR, y el fWAR deja la decisión casi en un empate.',
    ],
    takeaway: 'Dos fuentes de WAR dieron resultados distintos. El voto se quedó con el mejor bate.',
  },
  '2022-AL': {
    context: 'Aaron Judge conectó 62 jonrones, récord de la Liga Americana, con .311/.425/.686 y 206 de wRC+, y llevó a Nueva York a 99 victorias.',
    analysis: [
      'Su 10.8 de bWAR superó por 1.1 al de Ohtani (9.7), que bateó .273/.356/.519 con 34 jonrones y lanzó 166 entradas con 2.33 de efectividad. Yordan Álvarez bateó .306/.406/.613 con 185 de wRC+ para unos Astros de 106 victorias, y terminó tercero. Judge recibió 28 de 30 votos de primer lugar.',
    ],
  },
  '2022-NL': {
    context: 'Paul Goldschmidt ganó con 22 votos de primer lugar, .317/.404/.578, 35 jonrones, 115 impulsadas y 175 de wRC+, el mejor de los tres finalistas.',
    analysis: [
      'Su compañero Nolan Arenado, con mejor defensa (+11.9 carreras), tuvo algo más de WAR (7.9 contra 7.7 de bWAR y 7.2 contra 6.8 de fWAR). Sandy Alcantara, Cy Young por unanimidad, sumó 8.0 de bWAR con 2.28 de efectividad en 228.2 entradas, pero Miami (69-93) quedó fuera de playoffs y él terminó décimo.',
    ],
    takeaway: 'La brecha de 0.3 de WAR entra dentro del margen de error de la métrica.',
  },
  '2023-AL': {
    context: 'Segundo MVP unánime de Ohtani, con un equipo (73-89) que no llegó a playoffs.',
    analysis: [
      'Ohtani conectó 44 jonrones con .304/.412/.654, y como lanzador ganó 10 juegos con 3.14 de efectividad y 167 ponches. Su 9.9 de bWAR superó en 2.7 al de Corey Seager (7.2). Seager y Marcus Semien llevaron a Texas a 90 victorias y a playoffs, pero ninguno se acercó a su valor total.',
    ],
  },
  '2023-NL': {
    context: 'Ronald Acuña Jr. fue unánime tras batear .337/.416/.596 con 41 jonrones y 73 bases robadas, al frente de unos Bravos de 104 victorias, el mejor récord de la Nacional.',
    analysis: [
      'Mookie Betts tuvo 0.2 más de bWAR (8.6 contra 8.4), pero el fWAR favorece a Acuña por 1.5 (9.1 contra 7.6). Al cruzar las dos fuentes, el reclamo de Betts desaparece.',
    ],
  },
  '2024-AL': {
    context: 'Aaron Judge fue unánime tras batear .322/.458/.701 con 58 jonrones, 144 impulsadas y un wRC+ de 219. Nueva York ganó 94 juegos.',
    analysis: [
      'Bobby Witt Jr. (Reales, 86-76) sumó 9.6 de bWAR con defensa y corrido (+10.4 y +4.5 carreras) y fue segundo. Por fWAR la distancia fue de solo 0.7 (11.2 contra 10.5). Juan Soto, ya con los Yankees, tuvo 8.0 de bWAR y 180 de wRC+.',
    ],
  },
  '2024-NL': {
    context: 'Shohei Ohtani fue unánime como bateador designado, con 54 jonrones y 59 bases robadas (el primer 50-50 de la historia) y .310/.390/.646.',
    analysis: [
      'Sin lanzar ese año, su valor salió de una ofensiva descomunal (wRC+ de 179) y del corrido (+9.8 carreras), pese a restar 17.2 por la posición. Francisco Lindor, segundo, sumó 6.8 de bWAR.',
    ],
  },
  '2025-AL': {
    context: 'Aaron Judge superó a Cal Raleigh por 20 puntos (355 contra 335), con 17 votos de primer lugar contra 13.',
    analysis: [
      'Judge bateó .331/.457/.688 con 53 jonrones y 203 de wRC+. Raleigh, receptor de Seattle (90-72), disparó 60 jonrones, la mayor cantidad para un receptor, y remolcó 125 carreras (líder de la Americana). Su bWAR fue de 7.2 contra 9.7 de Judge, pero por fWAR la distancia se reduce a 0.9 (10.0 contra 9.1).',
      'Es una de las votaciones más cerradas de la década. Raleigh tuvo el poder y el impacto defensivo del puesto más exigente, mientras que Judge tuvo la mayor producción por turno de toda la liga.',
    ],
  },
  '2025-NL': {
    context: 'Shohei Ohtani fue unánime una vez más (30 de 30), tras batear .282/.392/.622 con 55 jonrones y 102 impulsadas, y además lanzó 47 entradas con 2.87 de efectividad.',
    analysis: [
      'Por bWAR (7.7) quedó detrás de Cristopher Sánchez (8.1) y Paul Skenes (8.0). Por fWAR (9.4) fue el mejor con diferencia, y superó por casi tres victorias a ambos (6.5 cada uno). Sánchez terminó 15.º con 4% del voto, con Filadelfia (96-66) en playoffs, y Skenes sexto con 20%, con Pittsburgh (71-91) fuera de ellos.',
    ],
    takeaway: 'La diferencia entre las dos fuentes de WAR explica por qué la decisión se ve discutible en un lado y clara en el otro.',
  },
}
