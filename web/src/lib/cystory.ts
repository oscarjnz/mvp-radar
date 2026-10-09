import type { Ballot, HistLeague, League } from './types'
import { leagueName } from './format'

/**
 * Textos del historial del Cy Young. Se generan de los datos de cada votación (Baseball Reference y MLB Stats API),
 * sin cifras escritas a mano, para que el portal pueda llenarse solo cuando sea dinámico.
 */

const join = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`)
const om = (n: number) => `${n}.º`
const fem = (n: number) => `${n}.ª`
const votos = (n: number) => `${n} ${n === 1 ? 'voto' : 'votos'} de primer lugar`
const num = (x: unknown) => (x === null || x === undefined || x === '' ? null : Number(x))

/** Qué pasó con el ganador: récord, ERA, entradas, ponches, equipo y voto. */
export function cyContext(d: HistLeague, lg: League): string {
  const w = d.winner
  const p = w.pit as Record<string, any>
  const ranks = d.winnerRanks
  const team = `${w.team} (${w.w}-${w.l}), ${w.playoffs ? 'que llegó a playoffs' : 'que no llegó a playoffs'}`
  const first = `${w.name} ganó el Cy Young de la ${leagueName(lg)} con ${p.w}-${p.l}, ${p.era} de efectividad, ${p.ip} entradas y ${p.so} ponches, para ${team}.`
  const vote = d.unanimous
    ? 'Todos los votantes lo colocaron en el primer lugar.'
    : `Recibió ${votos(w.first)} y el ${w.share}% de los puntos.`
  const bits: string[] = []
  if (ranks) {
    if (ranks.war === 1) bits.push('el bWAR más alto')
    else if (ranks.war) bits.push(`el ${om(ranks.war)} mejor bWAR (${w.war})`)
    if (ranks.era === 1) bits.push('la mejor efectividad')
    else if (ranks.era) bits.push(`la ${fem(ranks.era)} mejor efectividad`)
    if (ranks.wins === 1) bits.push('más victorias que cualquiera')
    else if (ranks.wins) bits.push(`el ${om(ranks.wins)} lugar en victorias`)
  }
  const rank = bits.length ? `Entre los votados tuvo ${join(bits)}.` : ''
  return [first, vote, rank].filter(Boolean).join(' ')
}

/** Párrafos de análisis: margen, quién tuvo más WAR y por qué pudo no ganar. */
export function cyAnalysis(d: HistLeague, year: number): string[] {
  const w = d.winner
  const wp = w.pit as Record<string, any>
  const out: string[] = []
  const second = d.top10[1]
  if (second) {
    const gap = +(w.pts - second.pts).toFixed(1)
    if (d.unanimous) {
      out.push(`Fue una votación unánime. ${second.name} quedó segundo con ${second.pts} puntos, ${gap} menos que el ganador.`)
    } else {
      out.push(`${second.name} quedó segundo con ${second.pts} puntos, ${gap} menos que ${w.name}, y recibió ${votos(second.first)} contra ${w.first}.`)
    }
  }
  if (d.warGap > 0) {
    const lead = d.top10.find((b) => b.name === d.warLeader.name)
    const lp = (lead?.pit ?? {}) as Record<string, any>
    const finish = lead ? `terminó ${om(lead.rank)} con ${lead.share}% del voto` : `terminó ${om(d.warLeader.rank)} en la votación`
    out.push(`${d.warLeader.name} tuvo ${d.warGap.toFixed(1)} más de bWAR que el ganador (${d.warLeader.war} contra ${w.war}) y ${finish}. Su récord fue ${lp.w ?? '-'}-${lp.l ?? '-'} con ${lp.era ?? '-'} de efectividad en ${lp.ip ?? '-'} entradas, mientras que ${w.name} tuvo ${wp.w}-${wp.l}, ${wp.era} y ${wp.ip}.`)
  } else {
    out.push(`${w.name} fue también el líder de bWAR entre los votados, con ${w.war}, así que el WAR respalda la decisión.`)
  }
  const lowWins = num(wp.w) !== null && (wp.w as number) <= 11 && year !== 2020
  if (lowWins) {
    out.push(`Con ${wp.w} victorias, es uno de los ganadores con menos triunfos de la década. Su efectividad de ${wp.era} y sus ${wp.so} ponches pesaron más que su récord.`)
  }
  return out
}

/** Frase de valoración, con bWAR como en el MVP. */
export function cyEvalSentence(d: HistLeague, fwarDiff: number | null): string {
  const w = d.winner
  if (d.warGap <= 0) return `${w.name} fue el líder de bWAR entre los votados, con ${w.war}.`
  const lead = d.warLeader
  let text = `${lead.name} tuvo ${lead.war} de bWAR, ${d.warGap.toFixed(1)} más que el ganador (${w.war}).`
  if (fwarDiff !== null) {
    text += fwarDiff > 0
      ? ` Por fWAR, la ventaja de ${lead.name} es de ${fwarDiff.toFixed(1)}.`
      : fwarDiff < 0
        ? ` Por fWAR, el ganador supera a ${lead.name} por ${Math.abs(fwarDiff).toFixed(1)}.`
        : ' Por fWAR, ambos quedan empatados.'
  }
  return text
}

export type CyBallot = Ballot
