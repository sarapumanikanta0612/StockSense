import type { StockStatus } from '../../types/inventory'

const statusLabels: Record<StockStatus, string> = {
  healthy: 'Healthy',
  low: 'Low stock',
  'out-of-stock': 'Out of stock',
}

interface StatusBadgeProps {
  status: StockStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${status}`}>{statusLabels[status]}</span>
}
