import type { IconName } from './Icon'
import { Icon } from './Icon'

type StatTone = 'brand' | 'success' | 'warning' | 'danger' | 'info'

interface StatCardProps {
  label: string
  value: string
  detail: string
  icon: IconName
  tone: StatTone
}

export function StatCard({ label, value, detail, icon, tone }: StatCardProps) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__topline">
        <span className="stat-card__label">{label}</span>
        <span className="stat-card__icon"><Icon name={icon} size={20} /></span>
      </div>
      <strong className="stat-card__value">{value}</strong>
      <span className="stat-card__detail">{detail}</span>
    </article>
  )
}
