import { useCallback, useEffect, useState } from 'react'
import { demoInventoryActivityService } from '../services/inventoryActivityService'
import type { OperationFilters, OperationListResult, OperationType } from '../types/inventoryActivity'

export function useOperations(type: OperationType, filters: OperationFilters) {
  const [data, setData] = useState<OperationListResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      setData(await demoInventoryActivityService.listOperations(type, filters))
    } catch {
      setError('Inventory operations could not be loaded. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [filters.reference, filters.status, type])

  useEffect(() => { void load() }, [load])
  return { data, isLoading, error, retry: load }
}
