import { useEffect, useState } from 'react'
import type { CandidatesData, HistoryData, PlayerDetail } from './types'

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

export const useCandidates = () => useAsync<CandidatesData>('/data/candidates.json')
export const useHistory = () => useAsync<HistoryData>('/data/history.json')
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
  links: { mlb: string; savant: string; bbref: string }
}

export const useCompare = () => useAsync<Record<string, any>>('/data/compare.json')
export const useProfiles = () => useAsync<Record<string, Profile>>('/data/profiles.json')
