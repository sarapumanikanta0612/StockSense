import type { ActivityLocation, OperationListItemView, OperationStatus, OperationType } from '../../types/inventoryActivity'

const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const statusLabels: Record<OperationStatus, string> = { DRAFT: 'Draft', DONE: 'Completed', CANCELED: 'Canceled' }

function formatLocation(location: ActivityLocation | null) {
  return location ? `${location.warehouse.name} · ${location.name}` : '—'
}

function getRoute(operation: OperationListItemView) {
  if (operation.type === 'RECEIPT') return `To ${formatLocation(operation.destinationLocation)}`
  if (operation.type === 'DELIVERY') return `From ${formatLocation(operation.sourceLocation)}`
  if (operation.type === 'ADJUSTMENT') return formatLocation(operation.sourceLocation)
  return `${formatLocation(operation.sourceLocation)} → ${formatLocation(operation.destinationLocation)}`
}

function getItemSummary(operation: OperationListItemView) {
  const names = operation.items.slice(0, 2).map((item) => item.product.name).join(', ')
  const remaining = operation.items.length - 2
  return remaining > 0 ? `${names} +${remaining} more` : names
}

function StatusBadge({ status }: { status: OperationStatus }) {
  return <span className={`status-badge status-badge--${status.toLowerCase()}`}>{statusLabels[status]}</span>
}

function TypeBadge({ type }: { type: OperationType }) {
  return <span className={`activity-type activity-type--${type.toLowerCase()}`}>{type.toLowerCase()}</span>
}

interface OperationTableProps {
  operations: OperationListItemView[]
}

export function OperationTable({ operations }: OperationTableProps) {
  return (
    <>
      <div className="table-scroll activity-table-wrap">
        <table className="data-table activity-table">
          <thead><tr><th scope="col">Reference</th><th scope="col">Route / location</th><th scope="col">Products</th><th scope="col">Status</th><th scope="col">Created</th><th scope="col">Validated</th></tr></thead>
          <tbody>
            {operations.map((operation) => (
              <tr key={operation.id}>
                <td><strong>{operation.clientReference ?? 'No client reference'}</strong><span><TypeBadge type={operation.type} /></span></td>
                <td><strong>{getRoute(operation)}</strong>{operation.reason ? <span>{operation.reason}</span> : null}</td>
                <td><strong>{getItemSummary(operation)}</strong><span>{operation.items.length} {operation.items.length === 1 ? 'line' : 'lines'}</span></td>
                <td><StatusBadge status={operation.status} /></td>
                <td><time dateTime={operation.createdAt}>{dateFormatter.format(new Date(operation.createdAt))}</time><span>{operation.createdBy.email}</span></td>
                <td>{operation.validatedAt ? <><time dateTime={operation.validatedAt}>{dateFormatter.format(new Date(operation.validatedAt))}</time><span>{operation.validatedBy?.email}</span></> : <span>Not validated</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="activity-card-list">
        {operations.map((operation) => (
          <article className="activity-card" key={operation.id}>
            <div className="activity-card__header"><div><TypeBadge type={operation.type} /><strong>{operation.clientReference ?? 'No client reference'}</strong></div><StatusBadge status={operation.status} /></div>
            <div className="activity-card__route">{getRoute(operation)}</div>
            <div className="activity-card__products"><strong>{getItemSummary(operation)}</strong><span>{operation.items.length} {operation.items.length === 1 ? 'product line' : 'product lines'}</span></div>
            {operation.reason ? <p>{operation.reason}</p> : null}
            <div className="activity-card__footer"><span>Created {dateFormatter.format(new Date(operation.createdAt))}</span><span>{operation.createdBy.email}</span></div>
          </article>
        ))}
      </div>
    </>
  )
}
