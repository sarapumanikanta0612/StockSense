import { useSearchParams } from 'react-router-dom'
import { OperationTable } from '../../components/operations/OperationTable'
import { ErrorState } from '../../components/ui/ErrorState'
import { Icon, type IconName } from '../../components/ui/Icon'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { useOperations } from '../../hooks/useOperations'
import type { OperationStatusFilter, OperationType } from '../../types/inventoryActivity'

const pageConfig: Record<OperationType, { title: string; description: string; icon: IconName }> = {
  RECEIPT: { title: 'Receipts', description: 'Track goods arriving into warehouse locations.', icon: 'receipts' },
  DELIVERY: { title: 'Deliveries', description: 'Monitor outgoing stock prepared for dispatch.', icon: 'deliveries' },
  TRANSFER: { title: 'Internal transfers', description: 'Follow stock moving between warehouses and locations.', icon: 'transfers' },
  ADJUSTMENT: { title: 'Inventory adjustments', description: 'Review recorded corrections from physical stock counts.', icon: 'adjustments' },
}

function parseStatus(value: string | null): OperationStatusFilter {
  return value === 'DRAFT' || value === 'DONE' || value === 'CANCELED' ? value : ''
}

export function OperationListPage({ type }: { type: OperationType }) {
  const config = pageConfig[type]
  const [params, setParams] = useSearchParams()
  const reference = params.get('reference') ?? ''
  const status = parseStatus(params.get('status'))
  const { data, isLoading, error, retry } = useOperations(type, { reference, status })
  const hasFilters = Boolean(reference || status)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const reset = () => setParams({}, { replace: true })

  return (
    <div className="page activity-page">
      <PageHeader eyebrow="Inventory operations" title={config.title} description={config.description} actions={<span className="updated-pill"><Icon name={config.icon} size={16} /> Demo records</span>} />
      <section className="panel activity-filter-panel" aria-label={`${config.title} filters`}>
        <div className="activity-filters">
          <label className="product-search" htmlFor={`${type}-reference-search`}>
            <Icon name="search" size={18} /><span className="sr-only">Search by reference</span>
            <input id={`${type}-reference-search`} type="search" value={reference} onChange={(event) => update('reference', event.target.value)} placeholder="Search client reference" />
          </label>
          <div className="product-filter-control"><label htmlFor={`${type}-status`}>Status</label><select id={`${type}-status`} value={status} onChange={(event) => update('status', event.target.value)}><option value="">All statuses</option><option value="DRAFT">Draft</option><option value="DONE">Completed</option><option value="CANCELED">Canceled</option></select></div>
          <button className="button button--ghost" disabled={!hasFilters} onClick={reset} type="button">Reset filters</button>
        </div>
      </section>
      {error ? <ErrorState title={`Unable to load ${config.title.toLowerCase()}`} message={error} onRetry={retry} /> : isLoading && !data ? <LoadingState variant="page" label={`Loading ${config.title.toLowerCase()}…`} /> : data ? (
        <section className="panel activity-results" aria-busy={isLoading}>
          <div className="panel__header"><div><span className="panel__eyebrow">Document register</span><h2>{hasFilters ? 'Matching operations' : `All ${config.title.toLowerCase()}`}</h2></div><span className="panel__meta" aria-live="polite">{data.operations.length} of {data.total}</span></div>
          {data.operations.length ? <OperationTable operations={data.operations} /> : <div className="activity-empty"><Icon name="filter" size={24} /><h3>No matching operations</h3><p>Try another reference or status.</p><button className="button button--secondary" onClick={reset} type="button">Clear filters</button></div>}
        </section>
      ) : null}
    </div>
  )
}
