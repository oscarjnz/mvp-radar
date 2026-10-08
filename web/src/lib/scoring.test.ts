import { describe, expect, it } from 'vitest'
import { PRESETS, components, rankPool, score } from './scoring'
import type { Candidate } from './types'

const base = (over: Partial<Candidate> & Record<string, any>): Candidate =>
  ({
    id: 1, slug: 'x', name: 'X', lg: 'AL', rank: 1, role: 'hitter', top5: true, team: 'AAA', teamId: 1, teamName: 'Team',
    teamRec: { w: 90, l: 72, pct: 0.556, divRank: 1, lgRank: 1, playoffs: true, divWinner: true, bestRecord: false },
    bio: { pos: 'RF' } as any,
    hit: { wrcPlus: 140, pa: 700, fwar: 6, savant: { pct: {}, raw: {} } } as any,
    war: { f: 6, b: 6, avg: 6 }, links: {} as any, narrative: {} as any, ...over,
  }) as Candidate

describe('scoring', () => {
  it('score ponderado esta entre 0 y 100', () => {
    const c = base({})
    const s = score(components(c, 6), PRESETS[0].w)
    expect(s).toBeGreaterThan(0)
    expect(s).toBeLessThanOrEqual(100)
  })
  it('con solo WAR gana el de mas WAR', () => {
    const a = base({ name: 'A', war: { f: 8, b: 8, avg: 8 } })
    const b = base({ name: 'B', war: { f: 5, b: 5, avg: 5 } })
    const r = rankPool([b, a], PRESETS.find((p) => p.id === 'war')!.w)
    expect(r[0].c.name).toBe('A')
  })
  it('un designado puntua menos en posicion que un jugador de campo', () => {
    const dh = base({ bio: { pos: 'DH' } as any })
    const rf = base({})
    expect(components(dh, 6).position).toBeLessThan(components(rf, 6).position)
  })
  it('pesos en cero no rompen', () => {
    const c = base({})
    expect(score(components(c, 6), { value: 0, production: 0, team: 0, availability: 0, position: 0 })).toBe(0)
  })
})
