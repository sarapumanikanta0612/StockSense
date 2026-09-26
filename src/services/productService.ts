import { productDemoCategories, productDemoData } from '../data/productDemoData'
import type {
  CatalogProduct,
  CatalogStockStatus,
  ProductCategory,
  ProductInput,
  ProductListFilters,
  ProductListResult,
} from '../types/products'
import { compareDecimalStrings } from '../utils/decimal'

const STORE_KEY = 'stocksense.demo.products.v1'
const STORE_VERSION = 1

interface StoredProductData {
  version: number
  products: CatalogProduct[]
}

export type ProductServiceErrorCode = 'DUPLICATE_SKU' | 'INVALID_CATEGORY' | 'PRODUCT_NOT_FOUND'

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

let memoryProducts: CatalogProduct[] | null = null

function clone<T>(value: T): T {
  return structuredClone(value)
}

function isStoredProductData(value: unknown): value is StoredProductData {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<StoredProductData>
  return candidate.version === STORE_VERSION && Array.isArray(candidate.products)
}

function loadProducts() {
  if (memoryProducts) return clone(memoryProducts)

  try {
    const storedValue = typeof window !== 'undefined' ? window.sessionStorage.getItem(STORE_KEY) : null
    if (storedValue) {
      const parsed: unknown = JSON.parse(storedValue)
      if (isStoredProductData(parsed)) {
        memoryProducts = clone(parsed.products)
        return clone(memoryProducts)
      }
    }
  } catch {
    // Storage can be unavailable in restricted browser contexts; memory remains usable.
  }

  memoryProducts = clone(productDemoData)
  return clone(memoryProducts)
}

function saveProducts(products: CatalogProduct[]) {
  memoryProducts = clone(products)

  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(STORE_KEY, JSON.stringify({ version: STORE_VERSION, products }))
    }
  } catch {
    // Keep the in-memory demo session functional if browser storage is unavailable.
  }
}

function normalizeDecimal(value: string) {
  const [integerPart, fractionPart = ''] = value.split('.')
  return `${integerPart}.${fractionPart.padEnd(3, '0')}`
}

function resolveCategory(categoryId: string | null) {
  if (!categoryId) return null
  const category = productDemoCategories.find((item) => item.id === categoryId)
  if (!category) throw new ProductServiceError('INVALID_CATEGORY', 'Select a valid product category.')
  return category
}

function ensureUniqueSku(products: CatalogProduct[], sku: string, excludedId?: string) {
  const normalizedSku = sku.trim().toUpperCase()
  const isDuplicate = products.some(
    (product) => product.id !== excludedId && product.sku.toUpperCase() === normalizedSku,
  )
  if (isDuplicate) throw new ProductServiceError('DUPLICATE_SKU', 'A product with this SKU already exists.')
}

export function getCatalogStockStatus(product: CatalogProduct): CatalogStockStatus {
  if (compareDecimalStrings(product.totalStock, '0') <= 0) return 'out-of-stock'
  if (compareDecimalStrings(product.totalStock, product.reorderLevel) <= 0) return 'low-stock'
  return 'in-stock'
}

export const demoProductService: ProductDataService = {
  async listProducts(filters) {
    const products = loadProducts()
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
      products: clone(filteredProducts.sort((a, b) => a.name.localeCompare(b.name))),
      categories: clone(productDemoCategories),
      total: products.length,
    }
  },

  async getProduct(id) {
    const product = loadProducts().find((item) => item.id === id)
    return product ? clone(product) : null
  },

  async listCategories() {
    return clone(productDemoCategories)
  },

  async createProduct(input) {
    const products = loadProducts()
    ensureUniqueSku(products, input.sku)
    const now = new Date().toISOString()
    const product: CatalogProduct = {
      id: globalThis.crypto.randomUUID(),
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      category: clone(resolveCategory(input.categoryId)),
      unitOfMeasure: input.unitOfMeasure.trim(),
      description: input.description.trim(),
      reorderLevel: normalizeDecimal(input.reorderLevel),
      totalStock: '0.000',
      stockByLocation: [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
    saveProducts([...products, product])
    return clone(product)
  },

  async updateProduct(id, input) {
    const products = loadProducts()
    const currentProduct = products.find((product) => product.id === id)
    if (!currentProduct) throw new ProductServiceError('PRODUCT_NOT_FOUND', 'Product not found.')

    ensureUniqueSku(products, input.sku, id)
    const updatedProduct: CatalogProduct = {
      ...currentProduct,
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      category: clone(resolveCategory(input.categoryId)),
      unitOfMeasure: input.unitOfMeasure.trim(),
      description: input.description.trim(),
      reorderLevel: normalizeDecimal(input.reorderLevel),
      updatedAt: new Date().toISOString(),
    }
    saveProducts(products.map((product) => product.id === id ? updatedProduct : product))
    return clone(updatedProduct)
  },
}
