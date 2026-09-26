import { Link } from 'react-router-dom'
import { getCatalogStockStatus } from '../../services/productService'
import type { CatalogProduct } from '../../types/products'
import { formatDecimalString } from '../../utils/decimal'
import { Icon } from '../ui/Icon'
import { ProductStatusBadge } from './ProductStatusBadge'

function formatQuantity(value: string) {
  return formatDecimalString(value)
}

function ProductActions({ product }: { product: CatalogProduct }) {
  return (
    <div className="product-actions">
      <Link className="product-action-link" to={`/products/${product.id}`}>
        <Icon name="eye" size={15} />
        <span>View</span>
      </Link>
      <Link className="product-action-link" to={`/products/${product.id}/edit`}>
        <Icon name="edit" size={15} />
        <span>Edit</span>
      </Link>
    </div>
  )
}

interface ProductTableProps {
  products: CatalogProduct[]
}

export function ProductTable({ products }: ProductTableProps) {
  return (
    <>
      <div className="table-scroll product-table-wrap">
        <table className="data-table product-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Category</th>
              <th scope="col">Unit</th>
              <th scope="col">Current stock</th>
              <th scope="col">Status</th>
              <th scope="col"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const status = getCatalogStockStatus(product)
              return (
                <tr key={product.id}>
                  <td>
                    <Link className="product-name-link" to={`/products/${product.id}`}>{product.name}</Link>
                    <span>{product.sku}</span>
                  </td>
                  <td>{product.category?.name ?? 'Uncategorized'}</td>
                  <td>{product.unitOfMeasure}</td>
                  <td>
                    <strong>{formatQuantity(product.totalStock)}</strong>
                    <span>Reorder at {formatQuantity(product.reorderLevel)}</span>
                  </td>
                  <td><ProductStatusBadge status={status} /></td>
                  <td><ProductActions product={product} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="product-card-list">
        {products.map((product) => {
          const status = getCatalogStockStatus(product)
          return (
            <article className="product-card" key={product.id}>
              <div className="product-card__header">
                <div className="product-card__identity">
                  <span className="product-avatar">{product.name.slice(0, 2).toUpperCase()}</span>
                  <div>
                    <Link to={`/products/${product.id}`}>{product.name}</Link>
                    <span>{product.sku}</span>
                  </div>
                </div>
                <ProductStatusBadge status={status} />
              </div>
              <dl className="product-card__facts">
                <div><dt>Category</dt><dd>{product.category?.name ?? 'Uncategorized'}</dd></div>
                <div><dt>Unit</dt><dd>{product.unitOfMeasure}</dd></div>
                <div><dt>Current stock</dt><dd>{formatQuantity(product.totalStock)}</dd></div>
                <div><dt>Reorder level</dt><dd>{formatQuantity(product.reorderLevel)}</dd></div>
              </dl>
              <ProductActions product={product} />
            </article>
          )
        })}
      </div>
    </>
  )
}
