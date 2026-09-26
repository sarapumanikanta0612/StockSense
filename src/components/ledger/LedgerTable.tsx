import type { ActivityLocation, LedgerMovementView, OperationType } from '../../types/inventoryActivity'
import { formatDecimalString } from '../../utils/decimal'

const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

function formatLocation(location: ActivityLocation | null) {
  return location ? `${location.warehouse.name} · ${location.name}` : '—'
}

function routeLabel(movement: LedgerMovementView) {
  if (movement.type === 'RECEIPT') return `Into ${formatLocation(movement.destinationLocation)}`
  if (movement.type === 'DELIVERY') return `From ${formatLocation(movement.sourceLocation)}`
  if (movement.type === 'ADJUSTMENT') return formatLocation(movement.sourceLocation ?? movement.destinationLocation)
  return `${formatLocation(movement.sourceLocation)} → ${formatLocation(movement.destinationLocation)}`
}

function quantityLabel(movement: LedgerMovementView) {
  const negative = movement.quantity.startsWith('-')
  const absolute = negative ? movement.quantity.slice(1) : movement.quantity
  const prefix = negative ? '−' : movement.type === 'RECEIPT' || movement.type === 'ADJUSTMENT' ? '+' : ''
  return `${prefix}${formatDecimalString(absolute)} ${movement.product.unitOfMeasure}`
}

function TypeBadge({ type }: { type: OperationType }) {
  return <span className={`activity-type activity-type--${type.toLowerCase()}`}>{type.toLowerCase()}</span>
}

export function LedgerTable({ movements }: { movements: LedgerMovementView[] }) {
  return (
    <>
      <div className="table-scroll activity-table-wrap"><table className="data-table ledger-table"><thead><tr><th scope="col">Date / time</th><th scope="col">Operation</th><th scope="col">Product</th><th scope="col">Source / destination</th><th scope="col">Quantity</th><th scope="col">Operator</th></tr></thead><tbody>
        {movements.map((movement) => <tr key={movement.id}>
          <td><time dateTime={movement.createdAt}>{dateFormatter.format(new Date(movement.createdAt))}</time></td>
          <td><TypeBadge type={movement.type} /><span>{movement.document.clientReference ?? 'No reference'}</span></td>
          <td><strong>{movement.product.name}</strong><span>{movement.product.sku}</span></td>
          <td><strong>{routeLabel(movement)}</strong></td>
          <td><strong className={`ledger-quantity ${movement.quantity.startsWith('-') ? 'ledger-quantity--negative' : 'ledger-quantity--positive'}`}>{quantityLabel(movement)}</strong></td>
          <td>{movement.performedBy.email}</td>
        </tr>)}
      </tbody></table></div>
      <div className="activity-card-list">{movements.map((movement) => <article className="activity-card ledger-card" key={movement.id}>
        <div className="activity-card__header"><div><TypeBadge type={movement.type} /><strong>{movement.document.clientReference ?? 'No reference'}</strong></div><strong className={`ledger-quantity ${movement.quantity.startsWith('-') ? 'ledger-quantity--negative' : 'ledger-quantity--positive'}`}>{quantityLabel(movement)}</strong></div>
        <div className="activity-card__products"><strong>{movement.product.name}</strong><span>{movement.product.sku}</span></div>
        <div className="activity-card__route">{routeLabel(movement)}</div>
        <div className="activity-card__footer"><time dateTime={movement.createdAt}>{dateFormatter.format(new Date(movement.createdAt))}</time><span>{movement.performedBy.email}</span></div>
      </article>)}</div>
    </>
  )
}
