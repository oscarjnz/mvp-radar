import { useEffect, useState } from 'react'
import type { CandidatesData, HistoryData, PlayerDetail } from './types'
import { AWARDS, useAward, type AwardId } from './award'

const cache = new Map<string, Promise<any>>()

function load<T>(path: string): Promise<T> {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(path).then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar ${path} (${r.status})`)
        return r.json()
      }),
    )
  }
  return cache.get(path) as Promise<T>
}

export function useAsync<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (!path) return
    let alive = true
    setData(null)
    setError(null)
    load<T>(path)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(String(e.message || e)))
    return () => {
      alive = false
    }
  }, [path])
  return { data, error }
}

/** Los datos de cada premio viven en archivos paralelos (candidates.json y candidates_cy.json, etc.). Sin argumento se usa el premio elegido. */
function useFile(base: string, award?: AwardId) {
  const current = useAward().award
  return `/data/${base}${AWARDS[award ?? current].suffix}.json`
}

export const useCandidates = (award?: AwardId) => useAsync<CandidatesData>(useFile('candidates', award))
export const useHistory = (award?: AwardId) => useAsync<HistoryData>(useFile('history', award))
export const usePlayer = (id: number | string | null) => useAsync<PlayerDetail>(id ? `/data/players/${id}.json` : null)

export interface Profile {
  id: number
  name: string
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
  teamName: string | null
  teamId: number | null
  active: boolean
  awards: Record<string, string[]>
  seasons: any[]
  cySeasons?: any[]
  links: { mlb: string; savant: string; bbref: string }
}

export const useCompare = (award?: AwardId) => useAsync<Record<string, any>>(useFile('compare', award))
export const useProfiles = () => useAsync<Record<string, Profile>>('/data/profiles.json')
