import { Link, useLocation, useParams } from 'react-router-dom'
import { ProductStatusBadge } from '../../components/products/ProductStatusBadge'
import { ErrorState } from '../../components/ui/ErrorState'
import { Icon } from '../../components/ui/Icon'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { useProduct } from '../../hooks/useProduct'
import { getCatalogStockStatus } from '../../services/productService'
import { formatDecimalString } from '../../utils/decimal'

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })

interface ProductRouteState {
  notice?: string
}

export function ProductDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const { product, isLoading, error, retry } = useProduct(id)
  const routeState = location.state as ProductRouteState | null

  if (isLoading) {
    return <div className="page"><LoadingState label="Loading product details…" variant="page" /></div>
  }

  if (error) {
    return <div className="page"><ErrorState message={error} onRetry={retry} title="Unable to load product" /></div>
  }

  if (!product) {
    return (
      <div className="page product-not-found">
        <PageHeader eyebrow="Catalogue" title="Product not found" description="This product does not exist in the current demo catalogue." />
        <div className="panel product-empty-state">
          <span className="product-empty-state__icon"><Icon name="products" size={25} /></span>
          <h2>We could not find that product</h2>
          <p>It may have been removed from the demo session or the link may be incorrect.</p>
          <Link className="button button--secondary" to="/products"><Icon name="arrowLeft" size={17} /> Back to products</Link>
        </div>
      </div>
    )
  }

  const stockStatus = getCatalogStockStatus(product)

  return (
    <div className="page product-detail-page">
      <PageHeader
        eyebrow="Product details"
        title={product.name}
        description={`SKU ${product.sku}`}
        actions={(
          <div className="page-action-group">
            <Link className="button button--secondary" to="/products"><Icon name="arrowLeft" size={17} /> Back</Link>
            <Link className="button button--primary" to={`/products/${product.id}/edit`}><Icon name="edit" size={17} /> Edit product</Link>
          </div>
        )}
      />

      {routeState?.notice ? <div className="form-alert form-alert--success" role="status">{routeState.notice}</div> : null}

      <div className="product-detail-grid">
        <section className="panel product-profile" aria-labelledby="product-profile-title">
          <div className="product-profile__top">
            <span className="product-avatar product-avatar--large">{product.name.slice(0, 2).toUpperCase()}</span>
            <div>
              <div className="product-profile__badges">
                <ProductStatusBadge status={stockStatus} />
                <span className="status-badge status-badge--neutral">{product.isActive ? 'Active item' : 'Inactive item'}</span>
              </div>
              <h2 id="product-profile-title">{product.name}</h2>
              <span>{product.sku}</span>
            </div>
          </div>
          <p className="product-profile__description">
            {product.description || 'No product description has been added.'}
          </p>
          <dl className="product-detail-list">
            <div><dt>Category</dt><dd>{product.category?.name ?? 'Uncategorized'}</dd></div>
            <div><dt>Unit of measure</dt><dd>{product.unitOfMeasure}</dd></div>
            <div><dt>Created</dt><dd>{dateFormatter.format(new Date(product.createdAt))}</dd></div>
            <div><dt>Last updated</dt><dd>{dateFormatter.format(new Date(product.updatedAt))}</dd></div>
          </dl>
        </section>

        <section className="panel product-stock-summary" aria-labelledby="stock-summary-title">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">Availability</span>
              <h2 id="stock-summary-title">Stock summary</h2>
            </div>
          </div>
          <div className="stock-summary-metrics">
            <div><span>Current stock</span><strong>{formatDecimalString(product.totalStock)}</strong><small>{product.unitOfMeasure} across all locations</small></div>
            <div><span>Reorder level</span><strong>{formatDecimalString(product.reorderLevel)}</strong><small>{product.unitOfMeasure} minimum target</small></div>
            <div><span>Stock locations</span><strong>{product.stockByLocation.length}</strong><small>warehouse locations holding stock</small></div>
          </div>
        </section>

        <section className="panel product-locations" aria-labelledby="product-locations-title">
          <div className="panel__header">
            <div>
              <span className="panel__eyebrow">By warehouse</span>
              <h2 id="product-locations-title">Stock by location</h2>
            </div>
            <span className="panel__meta">Read-only inventory data</span>
          </div>
          {product.stockByLocation.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th scope="col">Warehouse</th><th scope="col">Location</th><th scope="col">Quantity</th></tr></thead>
                <tbody>
                  {product.stockByLocation.map((stock) => (
                    <tr key={stock.location.id}>
                      <td><strong>{stock.location.warehouse.name}</strong></td>
                      <td>{stock.location.name}</td>
                      <td><strong>{formatDecimalString(stock.quantity)}</strong> {product.unitOfMeasure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="location-empty-state">
              <Icon name="warehouse" size={24} />
              <div><strong>No stock locations</strong><span>This product currently has no on-hand quantity.</span></div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
