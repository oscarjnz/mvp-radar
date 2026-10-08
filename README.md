# MVP Radar

Análisis de la carrera al MVP 2026 de las Grandes Ligas, de los últimos 10 premios (2016 a 2025) y de los casos en que el ganador no fue quien tuvo más WAR. Primer proyecto de un laboratorio de béisbol que va a seguir creciendo.

La web está en español y usa gráficos al estilo de Baseball Savant: barras de percentiles, spray charts, velocidad de salida contra ángulo, mapas de zona, bat tracking, arsenal de lanzadores y un laboratorio para armar tu propia boleta.

## Qué contiene

- **Carrera 2026**: top 5 por liga con perfil individual, comparación de fWAR contra bWAR, valor frente a equipo y descomposición del WAR.
- **Historial**: los 20 ganadores de 2016 a 2025 con su boleta completa y un veredicto basado en la brecha de WAR.
- **Qué premian**: regresión de qué mueve el voto y cómo cambió entre 2016-2020 y 2021-2025.
- **Debió ser MVP**: finalistas con al menos 0.5 de WAR más que el ganador.
- **Metodología**: fuentes, glosario y límites.

## Stack

- Web: Vite + React + TypeScript + D3 (SVG propio), React Router. Sin backend: los datos son JSON estáticos en `web/public/data`.
- Datos: scripts de Python (stdlib + numpy) en `scripts/`.

## Fuentes de datos

MLB Stats API, Baseball Savant, Baseball Reference, FanGraphs y MLB.com. Este proyecto es independiente y no está afiliado a MLB. Las fotos y logos se enlazan desde los servidores de MLB con fines educativos.

## Cómo correrlo

```bash
cd web
npm install
npm run dev      # servidor de desarrollo
npm test         # pruebas de la puntuación del laboratorio
npm run build    # compila a web/dist
```

### Regenerar los datos

Desde `scripts/` (Python 3.12 y numpy):

```bash
python fetch_sources.py      # MLB Stats API y CSV de Savant
python fetch_profiles.py     # biografías, splits por mes y game logs
python fetch_statcast.py     # pitch a pitch de los candidatos
python build_pool.py         # cruza fuentes y arma el pool de candidatos
python build_history.py      # historial y análisis de votaciones
python build_players.py      # candidates.json y detalle por jugador
```

Baseball Reference y FanGraphs bloquean las peticiones directas. Las páginas de votaciones y de WAR de Baseball Reference se descargaron con Firecrawl (formato `rawHtml`) y se procesan con `ingest_bbref_awards.py` e `ingest_bbref_2026.py`.

## Despliegue

Vercel, con el directorio raíz `web`. `vercel.json` reescribe las rutas al `index.html` para la SPA.
