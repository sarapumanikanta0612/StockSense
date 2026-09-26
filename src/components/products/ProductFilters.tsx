import type { ProductCategory, ProductStockFilter } from '../../types/products'
import { Icon } from '../ui/Icon'

interface ProductFiltersProps {
  categories: ProductCategory[]
  categoryId: string
  hasActiveFilters: boolean
  search: string
  stockStatus: ProductStockFilter
  onCategoryChange: (value: string) => void
  onReset: () => void
  onSearchChange: (value: string) => void
  onStockStatusChange: (value: ProductStockFilter) => void
}

export function ProductFilters({
  categories,
  categoryId,
  hasActiveFilters,
  search,
  stockStatus,
  onCategoryChange,
  onReset,
  onSearchChange,
  onStockStatusChange,
}: ProductFiltersProps) {
  return (
    <div className="product-filters" aria-label="Product search and filters">
      <div className="product-search">
        <label className="sr-only" htmlFor="product-search">Search products by name or SKU</label>
        <Icon name="search" size={18} />
        <input
          autoComplete="off"
          id="product-search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name or SKU"
          type="search"
          value={search}
        />
        {search ? (
          <button aria-label="Clear product search" onClick={() => onSearchChange('')} type="button">
            <Icon name="close" size={16} />
          </button>
        ) : null}
      </div>

      <div className="product-filter-control">
        <label htmlFor="product-category-filter">Category</label>
        <select
          id="product-category-filter"
          onChange={(event) => onCategoryChange(event.target.value)}
          value={categoryId}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div className="product-filter-control">
        <label htmlFor="product-stock-filter">Stock status</label>
        <select
          id="product-stock-filter"
          onChange={(event) => onStockStatusChange(event.target.value as ProductStockFilter)}
          value={stockStatus}
        >
          <option value="all">All statuses</option>
          <option value="in-stock">In stock</option>
          <option value="low-stock">Low stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
      </div>

      <button
        className="button button--ghost product-filters__reset"
        disabled={!hasActiveFilters}
        onClick={onReset}
        type="button"
      >
        Reset filters
      </button>
    </div>
  )
}
