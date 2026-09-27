import { useCallback, useEffect, useState } from 'react'
import { dashboardService } from '../services/dashboardService'
import type { DashboardSnapshot } from '../types/inventory'

export function useDashboard() {
  const [data, setData] = useState<DashboardSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setData(await dashboardService.getDashboardSnapshot())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Dashboard data could not be loaded.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  return { data, isLoading, error, retry: loadDashboard }
}
