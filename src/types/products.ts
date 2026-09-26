export type CatalogStockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export type ProductStockFilter = 'all' | CatalogStockStatus

export interface ProductCategory {
  id: string
  name: string
}

export interface ProductWarehouse {
  id: string
  name: string
}

export interface ProductLocation {
  id: string
  name: string
  warehouse: ProductWarehouse
}

export interface ProductStockLocation {
  quantity: string
  location: ProductLocation
}

export interface CatalogProduct {
  id: string
  name: string
  sku: string
  category: ProductCategory | null
  unitOfMeasure: string
  description: string
  reorderLevel: string
  totalStock: string
  stockByLocation: ProductStockLocation[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductInput {
  name: string
  sku: string
  categoryId: string | null
  unitOfMeasure: string
  description: string
  reorderLevel: string
}

export interface ProductListFilters {
  search: string
  categoryId: string
  stockStatus: ProductStockFilter
}

export interface ProductListResult {
  products: CatalogProduct[]
  categories: ProductCategory[]
  total: number
}
