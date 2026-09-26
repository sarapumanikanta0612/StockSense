import { useCallback, useEffect, useRef, useState } from 'react'
import { demoProductService } from '../services/productService'
import type { ProductListFilters, ProductListResult } from '../types/products'

export function useProducts(filters: ProductListFilters) {
  const [data, setData] = useState<ProductListResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)

  const loadProducts = useCallback(async () => {
    const currentRequest = ++requestId.current
    setIsLoading(true)
    setError(null)

    try {
      const result = await demoProductService.listProducts(filters)
      if (currentRequest === requestId.current) setData(result)
    } catch {
      if (currentRequest === requestId.current) {
        setError('Products could not be loaded. Please try again.')
      }
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false)
    }
  }, [filters.categoryId, filters.search, filters.stockStatus])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  return { data, isLoading, error, retry: loadProducts }
}
