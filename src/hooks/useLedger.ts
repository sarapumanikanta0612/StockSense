import { useCallback, useEffect, useState } from 'react'
import { demoInventoryActivityService } from '../services/inventoryActivityService'
import type { LedgerFilters, LedgerListResult } from '../types/inventoryActivity'

export function useLedger(filters: LedgerFilters) {
  const [data, setData] = useState<LedgerListResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await demoInventoryActivityService.listLedger(filters))
    } catch {
      setError('Stock movements could not be loaded. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [filters.from, filters.search, filters.to, filters.type])

  useEffect(() => { void load() }, [load])
  return { data, isLoading, error, retry: load }
}
