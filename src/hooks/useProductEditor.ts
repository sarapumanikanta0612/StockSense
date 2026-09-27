import { useCallback, useEffect, useState } from 'react'
import { productService } from '../services/productService'
import type { CatalogProduct, ProductCategory, ProductInput } from '../types/products'

export function useProductEditor(productId?: string) {
  const [product, setProduct] = useState<CatalogProduct | null>(null)
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadEditor = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [availableCategories, existingProduct] = await Promise.all([
        productService.listCategories(),
        productId ? productService.getProduct(productId) : Promise.resolve(null),
      ])
      setCategories(availableCategories)
      setProduct(existingProduct)
    } catch {
      setError('Product form data could not be loaded. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    void loadEditor()
  }, [loadEditor])

  const saveProduct = useCallback(async (input: ProductInput) => {
    setIsSubmitting(true)
    try {
      return productId
        ? await productService.updateProduct(productId, input)
        : await productService.createProduct(input)
    } finally {
      setIsSubmitting(false)
    }
  }, [productId])

  return {
    product,
    categories,
    isLoading,
    isSubmitting,
    error,
    retry: loadEditor,
    saveProduct,
  }
}
