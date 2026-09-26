import { useCallback, useEffect, useState } from 'react'
import { demoDashboardService } from '../services/dashboardService'
import type { DashboardSnapshot } from '../types/inventory'

export function useDashboard() {
  const [data, setData] = useState<DashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await demoDashboardService.getDashboardSnapshot()
      setData(snapshot)
    } catch {
      setError('Dashboard data could not be loaded. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return { data, isLoading, error, retry: loadDashboard }
}
