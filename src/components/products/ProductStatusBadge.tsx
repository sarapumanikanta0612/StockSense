import type { CatalogStockStatus } from '../../types/products'

const labels: Record<CatalogStockStatus, string> = {
  'in-stock': 'In stock',
  'low-stock': 'Low stock',
  'out-of-stock': 'Out of stock',
}

interface ProductStatusBadgeProps {
  status: CatalogStockStatus
}

export function ProductStatusBadge({ status }: ProductStatusBadgeProps) {
  return <span className={`status-badge status-badge--${status}`}>{labels[status]}</span>
}
