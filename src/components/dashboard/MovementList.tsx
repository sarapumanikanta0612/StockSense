import type { MovementType, StockMovement, WarehouseLocation } from '../../types/inventory'
import type { IconName } from '../ui/Icon'
import { Icon } from '../ui/Icon'

const movementDetails: Record<MovementType, { label: string; icon: IconName }> = {
  receipt: { label: 'Receipt', icon: 'receipts' },
  delivery: { label: 'Delivery', icon: 'deliveries' },
  transfer: { label: 'Transfer', icon: 'transfers' },
  adjustment: { label: 'Adjustment', icon: 'adjustments' },
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function formatLocation(location?: WarehouseLocation) {
  return location ? `${location.warehouseName} · ${location.locationName}` : 'Location unavailable'
}

function getLocationLabel(movement: StockMovement) {
  if (movement.type === 'receipt') return `Received into ${formatLocation(movement.destination)}`
  if (movement.type === 'delivery') return `Dispatched from ${formatLocation(movement.source)}`
  if (movement.type === 'transfer') {
    return `${formatLocation(movement.source)} → ${formatLocation(movement.destination)}`
  }
  return `Adjusted at ${formatLocation(movement.destination ?? movement.source)}`
}

function getQuantityLabel(movement: StockMovement) {
  const absoluteQuantity = Math.abs(movement.quantity)
  const prefix = movement.type === 'receipt' || movement.quantity > 0 && movement.type === 'adjustment'
    ? '+'
    : movement.type === 'delivery' || movement.quantity < 0
      ? '−'
      : ''

  return `${prefix}${absoluteQuantity} ${movement.unit}`
}

interface MovementListProps {
  movements: StockMovement[]
}

export function MovementList({ movements }: MovementListProps) {
  return (
    <section className="panel movements-panel" aria-labelledby="movements-title">
      <div className="panel__header">
        <div>
          <span className="panel__eyebrow">Latest activity</span>
          <h2 id="movements-title">Recent stock movements</h2>
        </div>
        <span className="panel__meta">Last 24 hours</span>
      </div>

      <div className="movement-list">
        {movements.map((movement) => {
          const details = movementDetails[movement.type]

          return (
            <article className="movement-item" key={movement.id}>
              <span className={`movement-item__icon movement-item__icon--${movement.type}`}>
                <Icon name={details.icon} size={19} />
              </span>
              <div className="movement-item__main">
                <div className="movement-item__title-row">
                  <strong>{movement.productName}</strong>
                  <span className={`movement-item__quantity movement-item__quantity--${movement.type}`}>
                    {getQuantityLabel(movement)}
                  </span>
                </div>
                <span className="movement-item__location">{getLocationLabel(movement)}</span>
                <div className="movement-item__meta">
                  <span>{details.label}</span>
                  <span>{movement.reference}</span>
                  <time dateTime={movement.occurredAt}>{dateFormatter.format(new Date(movement.occurredAt))}</time>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
