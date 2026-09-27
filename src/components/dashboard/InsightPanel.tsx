import type { DashboardInsight } from '../../types/inventory'
import { Icon } from '../ui/Icon'

interface InsightPanelProps {
  insight: DashboardInsight
}

export function InsightPanel({ insight }: InsightPanelProps) {
  return (
    <section className="panel insight-panel" aria-labelledby="insight-title">
      <div className="panel__header">
        <div>
          <span className="panel__eyebrow">Smart inventory</span>
          <h2 id="insight-title">StockSense insight</h2>
        </div>
        <span className="panel__meta">{insight.source === 'ai' ? 'AI generated' : 'Rule based'}</span>
      </div>
      <div className="insight-panel__body">
        <span className="insight-panel__icon" aria-hidden="true"><Icon name="activity" /></span>
        <div>
          <strong>{insight.headline}</strong>
          <ul>
            {insight.messages.map((message) => <li key={message}>{message}</li>)}
          </ul>
        </div>
      </div>
    </section>
  )
}
