import { LowStockTable } from '../components/dashboard/LowStockTable'
import { MovementList } from '../components/dashboard/MovementList'
import { StockOverview } from '../components/dashboard/StockOverview'
import { ErrorState } from '../components/ui/ErrorState'
import { Icon } from '../components/ui/Icon'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/ui/StatCard'
import { useDashboard } from '../hooks/useDashboard'

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

export function DashboardPage() {
  const { data, isLoading, error, retry } = useDashboard()

  if (isLoading) return <LoadingState />
  if (error || !data) return <ErrorState message={error ?? 'Dashboard data is unavailable.'} onRetry={retry} />

  const { statistics } = data

  return (
    <div className="page dashboard-page">
      <PageHeader
        eyebrow="Overview"
        title="Inventory dashboard"
        description="Monitor stock health and warehouse activity from one clear workspace."
        actions={(
          <span className="updated-pill">
            <Icon name="clock" size={16} />
            Updated {dateTimeFormatter.format(new Date(data.lastUpdated))}
          </span>
        )}
      />

      <section className="stats-grid" aria-label="Inventory key performance indicators">
        <StatCard
          detail={`Across ${statistics.activeSkus} active SKUs`}
          icon="package"
          label="Products in stock"
          tone="brand"
          value={statistics.totalProductsInStock.toLocaleString()}
        />
        <StatCard
          detail="6.7% of tracked products"
          icon="warning"
          label="Low stock"
          tone="warning"
          value={statistics.lowStock.toString()}
        />
        <StatCard
          detail="Needs immediate attention"
          icon="outOfStock"
          label="Out of stock"
          tone="danger"
          value={statistics.outOfStock.toString()}
        />
        <StatCard
          detail={`${statistics.unitsExpected} units expected`}
          icon="arrowDown"
          label="Pending receipts"
          tone="success"
          value={statistics.pendingReceipts.toString()}
        />
        <StatCard
          detail={`${statistics.unitsReserved} units reserved`}
          icon="arrowUp"
          label="Pending deliveries"
          tone="info"
          value={statistics.pendingDeliveries.toString()}
        />
      </section>

      <div className="dashboard-grid">
        <LowStockTable products={data.lowStockProducts} />
        <StockOverview items={data.stockOverview} />
        <MovementList movements={data.recentMovements} />
      </div>
    </div>
  )
}
