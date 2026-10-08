export const fx = (n: number | null | undefined, d = 1) => (n === null || n === undefined || Number.isNaN(n) ? '-' : n.toFixed(d))

/** .316 en lugar de 0.316 */
export const slash = (s: string | number | null | undefined) => {
  if (s === null || s === undefined) return '-'
  const t = String(s)
  return t.startsWith('0.') ? t.slice(1) : t
}

export const headshot = (id: number | null | undefined, w = 213) =>
  id ? `https://img.mlbstatic.com/mlb-photos/image/upload/d_people:generic:headshot:67:current.png/w_${w},q_auto:best/v1/people/${id}/headshot/67/current` : ''

export const teamLogo = (teamId: number | null | undefined) => (teamId ? `https://www.mlbstatic.com/team-logos/${teamId}.svg` : '')

export const leagueName = (lg: string) => (lg === 'AL' ? 'Liga Americana' : 'Liga Nacional')

export const roleName = (r: string) => (r === 'pitcher' ? 'Lanzador' : r === 'twoway' ? 'Dos vías' : 'Bateador')

export const signed = (n: number | null | undefined, d = 1) => {
  if (n === null || n === undefined) return '-'
  const s = n.toFixed(d)
  return n > 0 ? `+${s}` : s
}

export const ordinal = (n: number) => `${n}.º`
