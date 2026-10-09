export type League = 'AL' | 'NL'
export type Role = 'hitter' | 'pitcher' | 'twoway'

export interface TeamRec {
  w: number
  l: number
  pct: number
  divRank: number
  lgRank: number
  playoffs: boolean
  divWinner: boolean
  bestRecord: boolean
}

export interface SavantBlock {
  pct: Record<string, number>
  raw: Record<string, number>
}

export interface HitBlock {
  id: number
  name: string
  g: string | number
  pa: number
  avg: string
  obp: string
  slg: string
  ops: string
  hr: number
  rbi: number
  r: number
  h: number
  sb: number
  bb: number
  so: number
  fwar: number
  wrcPlus: number
  woba: number
  bat: number
  fld: number
  bsr: number
  posAdj: number
  bwar: number | null
  owar: number | null
  dwar: number | null
  wpa: number | null
  re24: number | null
  savant: SavantBlock
}

export interface PitBlock {
  id: number
  name: string
  g: string | number
  gs: string | number
  ip: number
  era: string
  whip: string
  w: number
  l: number
  so: number
  bb: number
  hr: number
  fip: number
  fwar: number
  bwar: number | null
  ra9: number | null
  savant: SavantBlock
}

export interface Narrative {
  tagline: string
  pros: string[]
  cons: string[]
  verdict: string
  outlook: string
}

export interface Bio {
  number: string | null
  birth: string
  age: number
  city: string
  country: string
  height: string
  weight: number
  pos: string
  bats: string
  throws: string
  debut: string
  draft: number | null
  teamName: string
  awards: string[]
}

export interface Candidate {
  id: number
  slug: string
  name: string
  lg: League
  rank: number
  role: Role
  top5: boolean
  team: string
  teamId: number
  teamName: string
  teamRec: TeamRec
  bio: Bio
  hit?: HitBlock
  pit?: PitBlock
  war: { f: number; b: number; avg: number }
  links: { mlb: string; savant: string; bbref: string; fangraphs: string }
  narrative: Narrative
}

export interface CandidatesData {
  season: number
  asOf: string
  status: string
  award?: string
  poll?: { outlet: string; voters: number; scale: string; note: string; panel?: Record<League, { name: string; pos: number; points: number; first: number }[]> }
  leagues: Record<League, { top5: Candidate[]; bubble: Candidate[] }>
  teams: Record<string, { abbr: string; name: string; lg: League } & Partial<TeamRec>>
}

export interface PlayerDetail {
  id: number
  hitting?: any
  pitching?: any
}

export interface Ballot {
  rank: number
  name: string
  bbref: string
  team: string
  teamId: number | null
  w: number | null
  l: number | null
  playoffs: boolean | null
  divWinner: boolean | null
  pts: number
  first: number
  share: number
  war: number
  role: Role
  bat: Record<string, any> | null
  pit: Record<string, any> | null
  mlbId?: number | null
}

export interface HistLeague {
  winner: Ballot
  pos: string
  warLeader: { name: string; war: number; rank: number; role: Role; team: string }
  warLeaderWon: boolean
  verdict: 'acertado' | 'discutible' | 'cuestionable'
  warGap: number
  unanimous: boolean
  top10: Ballot[]
  voted: number
  winnerRanks?: { era: number | null; wins: number | null; so: number | null; ip: number | null; war: number | null }
}

export interface HistoryData {
  award?: string
  seasons: ({ year: number } & Record<League, HistLeague>)[]
  snubs: any[]
  nearMisses: any[]
  closest: any[]
  pitcherWarLeaders: any[]
  summary: any
}
