import { ApiError, apiClient } from './apiClient'
import type {
  CatalogProduct,
  CatalogStockStatus,
  ProductCategory,
  ProductInput,
  ProductListFilters,
  ProductListResult,
} from '../types/products'
import { compareDecimalStrings } from '../utils/decimal'

const PRODUCT_PAGE_SIZE = 100

export type ProductServiceErrorCode =
  | 'DUPLICATE_SKU'
  | 'INVALID_CATEGORY'
  | 'PRODUCT_NOT_FOUND'
  | 'VALIDATION_ERROR'

export class ProductServiceError extends Error {
  constructor(
    public readonly code: ProductServiceErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ProductServiceError'
  }
}

export interface ProductDataService {
  listProducts: (filters: ProductListFilters) => Promise<ProductListResult>
  getProduct: (id: string) => Promise<CatalogProduct | null>
  listCategories: () => Promise<ProductCategory[]>
  createProduct: (input: ProductInput) => Promise<CatalogProduct>
  updateProduct: (id: string, input: ProductInput) => Promise<CatalogProduct>
}

function mapProductError(error: unknown): Error {
  if (!(error instanceof ApiError)) {
    return error instanceof Error ? error : new Error('The product request failed.')
  }

  if (error.code === 'CONFLICT') {
    return new ProductServiceError('DUPLICATE_SKU', 'A product with this SKU already exists.')
  }
  if (error.code === 'INVALID_REFERENCE') {
    return new ProductServiceError('INVALID_CATEGORY', 'Select an active product category and try again.')
  }
  if (error.code === 'PRODUCT_NOT_FOUND') {
    return new ProductServiceError('PRODUCT_NOT_FOUND', 'This product no longer exists.')
  }
  if (error.code === 'VALIDATION_ERROR') {
    return new ProductServiceError(
      'VALIDATION_ERROR',
      'Check the product details for invalid or incomplete values and try again.',
    )
  }

  return error
}

function productPayload(input: ProductInput) {
  return {
    name: input.name,
    sku: input.sku,
    categoryId: input.categoryId,
    unitOfMeasure: input.unitOfMeasure,
    reorderLevel: input.reorderLevel,
  }
}

export async function fetchActiveProducts(): Promise<CatalogProduct[]> {
  try {
    const firstPage = await apiClient.get<CatalogProduct[]>('/products', {
      page: 1,
      limit: PRODUCT_PAGE_SIZE,
      isActive: true,
    })
    const total = firstPage.meta?.pagination?.total ?? firstPage.data.length
    const pageCount = Math.ceil(total / PRODUCT_PAGE_SIZE)

    if (pageCount <= 1) return firstPage.data

    const remainingPages = await Promise.all(
      Array.from({ length: pageCount - 1 }, (_, index) => (
        apiClient.get<CatalogProduct[]>('/products', {
          page: index + 2,
          limit: PRODUCT_PAGE_SIZE,
          isActive: true,
        })
      )),
    )

    return [firstPage, ...remainingPages].flatMap((page) => page.data)
  } catch (error) {
    throw mapProductError(error)
  }
}

export function getCatalogStockStatus(product: CatalogProduct): CatalogStockStatus {
  if (compareDecimalStrings(product.totalStock, '0') <= 0) return 'out-of-stock'
  if (compareDecimalStrings(product.totalStock, product.reorderLevel) <= 0) return 'low-stock'
  return 'in-stock'
}

export const productService: ProductDataService = {
  async listProducts(filters) {
    const [products, categories] = await Promise.all([
      fetchActiveProducts(),
      this.listCategories(),
    ])
    const normalizedSearch = filters.search.trim().toLowerCase()
    const filteredProducts = products.filter((product) => {
      const matchesSearch = !normalizedSearch
        || product.name.toLowerCase().includes(normalizedSearch)
        || product.sku.toLowerCase().includes(normalizedSearch)
      const matchesCategory = !filters.categoryId || product.category?.id === filters.categoryId
      const matchesStatus = filters.stockStatus === 'all'
        || getCatalogStockStatus(product) === filters.stockStatus
      return matchesSearch && matchesCategory && matchesStatus
    })

    return {
      products: filteredProducts.sort((left, right) => left.name.localeCompare(right.name)),
      categories,
      total: products.length,
    }
  },

  async getProduct(id) {
    try {
      const response = await apiClient.get<CatalogProduct>(`/products/${id}`)
      return response.data
    } catch (error) {
      const mappedError = mapProductError(error)
      if (mappedError instanceof ProductServiceError && mappedError.code === 'PRODUCT_NOT_FOUND') {
        return null
      }
      throw mappedError
    }
  },

  async listCategories() {
    try {
      const response = await apiClient.get<ProductCategory[]>('/categories')
      return response.data
    } catch (error) {
      throw mapProductError(error)
    }
  },

  async createProduct(input) {
    try {
      const response = await apiClient.post<CatalogProduct>('/products', productPayload(input))
      return response.data
    } catch (error) {
      throw mapProductError(error)
    }
  },

  async updateProduct(id, input) {
    try {
      const response = await apiClient.patch<CatalogProduct>(`/products/${id}`, productPayload(input))
      return response.data
    } catch (error) {
      throw mapProductError(error)
    }
  },
}
