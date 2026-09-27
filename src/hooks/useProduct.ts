import { useCallback, useEffect, useState } from 'react'
import { productService } from '../services/productService'
import type { CatalogProduct } from '../types/products'

export function useProduct(productId: string | undefined) {
  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setProduct(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      setProduct(await productService.getProduct(productId))
    } catch {
      setError('Product details could not be loaded. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void loadProduct()
  }, [loadProduct])

  return { product, isLoading, error, retry: loadProduct }
}
