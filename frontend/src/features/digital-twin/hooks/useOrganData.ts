import { useState, useEffect, useCallback } from 'react'
import type { OrganId, OrganData } from '../types'

const API_BASE = 'http://localhost:8000'

function getToken(): string | null {
  return localStorage.getItem('healthtwin_token')
}

interface UseOrganDataResult {
  data: OrganData | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useOrganData(organ: OrganId | null, patientId?: string): UseOrganDataResult {
  const [data, setData] = useState<OrganData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!organ) return
    setLoading(true)
    setError(null)
    try {
      const token = getToken()
      const endpoint = patientId
        ? `/doctor/patients/${patientId}/digital-twin/organ/${organ}`
        : `/patients/me/digital-twin/organ/${organ}`

      const res = await fetch(`${API_BASE}${endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        throw new Error(errJson.detail || `Failed to load ${organ} data`)
      }
      const json: OrganData = await res.json()
      setData(json)
    } catch (err) {
      setError((err as Error).message || 'Failed to load organ data')
    } finally {
      setLoading(false)
    }
  }, [organ, patientId])

  useEffect(() => {
    if (organ) {
      fetchData()
    } else {
      setData(null)
      setError(null)
    }
  }, [organ, fetchData])

  return { data, loading, error, refetch: fetchData }
}
