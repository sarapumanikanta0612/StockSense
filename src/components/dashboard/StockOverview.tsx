import type { CSSProperties } from 'react'
import type { StockOverviewItem } from '../../types/inventory'

interface StockOverviewProps {
  items: StockOverviewItem[]
}

export function StockOverview({ items }: StockOverviewProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0)
  const healthyPercentage = items.find((item) => item.status === 'healthy')?.percentage ?? 0
  const lowPercentage = items.find((item) => item.status === 'low')?.percentage ?? 0
  const healthyEnd = healthyPercentage
  const lowEnd = healthyPercentage + lowPercentage
  const chartBackground = `conic-gradient(#16865c 0 ${healthyEnd}%, #e4a11b ${healthyEnd}% ${lowEnd}%, #d84a4a ${lowEnd}% 100%)`

  return (
    <section className="panel stock-overview" aria-labelledby="stock-overview-title">
      <div className="panel__header">
        <div>
          <span className="panel__eyebrow">Across all warehouses</span>
          <h2 id="stock-overview-title">Stock overview</h2>
        </div>
        <span className="panel__meta">{total} active SKUs</span>
      </div>

      <div className="stock-overview__content">
        <div
          aria-label={`${healthyPercentage}% of products have healthy stock`}
          className="stock-chart"
          role="img"
          style={{ '--stock-chart-background': chartBackground } as CSSProperties}
        >
          <div className="stock-chart__center">
            <strong>{healthyPercentage}%</strong>
            <span>Healthy</span>
          </div>
        </div>

        <div className="stock-legend">
          {items.map((item) => (
            <div className="stock-legend__item" key={item.status}>
              <span className={`stock-legend__dot stock-legend__dot--${item.status}`} />
              <div>
                <span>{item.label}</span>
                <small>{item.percentage}% of SKUs</small>
              </div>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
