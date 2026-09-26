import { Link, useSearchParams } from 'react-router-dom'
import { ProductEmptyState } from '../../components/products/ProductEmptyState'
import { ProductFilters } from '../../components/products/ProductFilters'
import { ProductTable } from '../../components/products/ProductTable'
import { ErrorState } from '../../components/ui/ErrorState'
import { Icon } from '../../components/ui/Icon'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { useProducts } from '../../hooks/useProducts'
import type { ProductStockFilter } from '../../types/products'

const stockFilters: ProductStockFilter[] = ['all', 'in-stock', 'low-stock', 'out-of-stock']

function parseStockFilter(value: string | null): ProductStockFilter {
  return stockFilters.includes(value as ProductStockFilter) ? value as ProductStockFilter : 'all'
}

export function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const search = searchParams.get('q') ?? ''
  const categoryId = searchParams.get('category') ?? ''
  const stockStatus = parseStockFilter(searchParams.get('stock'))
  const filters = { search, categoryId, stockStatus }
  const { data, isLoading, error, retry } = useProducts(filters)
  const hasActiveFilters = Boolean(search || categoryId || stockStatus !== 'all')

  const updateParameter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams)
    if (value && value !== 'all') nextParams.set(key, value)
    else nextParams.delete(key)
    setSearchParams(nextParams, { replace: true })
  }

  const resetFilters = () => setSearchParams({}, { replace: true })

  return (
    <div className="page products-page">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Search, review, and maintain the products used across every warehouse."
        actions={(
          <Link className="button button--primary" to="/products/new">
            <Icon name="plus" size={17} /> Add product
          </Link>
        )}
      />

      <section className="panel product-filter-panel" aria-label="Product filters">
        <ProductFilters
          categories={data?.categories ?? []}
          categoryId={categoryId}
          hasActiveFilters={hasActiveFilters}
          onCategoryChange={(value) => updateParameter('category', value)}
          onReset={resetFilters}
          onSearchChange={(value) => updateParameter('q', value)}
          onStockStatusChange={(value) => updateParameter('stock', value)}
          search={search}
          stockStatus={stockStatus}
        />
      </section>

      {error ? (
        <ErrorState
          message={error}
          onRetry={retry}
          title="Unable to load products"
        />
      ) : isLoading && !data ? (
        <LoadingState label="Loading product catalogue…" variant="page" />
      ) : data ? (
        <section className={`panel product-results ${isLoading ? 'product-results--loading' : ''}`} aria-busy={isLoading} aria-labelledby="product-results-title">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">Product catalogue</span>
              <h2 id="product-results-title">{hasActiveFilters ? 'Matching products' : 'All products'}</h2>
            </div>
            <span className="panel__meta" aria-live="polite">
              {isLoading ? 'Updating…' : `${data.products.length} of ${data.total} products`}
            </span>
          </div>
          {data.products.length ? (
            <ProductTable products={data.products} />
          ) : (
            <ProductEmptyState isFiltered={hasActiveFilters} onReset={resetFilters} />
          )}
        </section>
      ) : null}
    </div>
  )
}
