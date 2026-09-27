import type { Product } from '../../types/inventory'
import { StatusBadge } from '../ui/StatusBadge'

interface LowStockTableProps {
  products: Product[]
}

export function LowStockTable({ products }: LowStockTableProps) {
  return (
    <section className="panel low-stock-panel" aria-labelledby="low-stock-title">
      <div className="panel__header">
        <div>
          <span className="panel__eyebrow">Requires attention</span>
          <h2 id="low-stock-title">Low-stock products</h2>
        </div>
        <span className="panel__meta">{products.length} shown</span>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Location</th>
              <th scope="col">On hand / minimum</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const stockRatio = product.minimumStock > 0
                ? Math.min((product.quantity / product.minimumStock) * 100, 100)
                : product.quantity > 0 ? 100 : 0

              return (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <span>{product.sku} · {product.category}</span>
                  </td>
                  <td>
                    <strong>{product.storage.warehouseName}</strong>
                    <span>{product.storage.locationName}</span>
                  </td>
                  <td>
                    <div className="stock-level">
                      <span><strong>{product.quantity}</strong> / {product.minimumStock} {product.unit}</span>
                      <span className="stock-level__track" aria-hidden="true">
                        <span
                          className={`stock-level__fill stock-level__fill--${product.status}`}
                          style={{ width: `${stockRatio}%` }}
                        />
                      </span>
                    </div>
                  </td>
                  <td><StatusBadge status={product.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
