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
