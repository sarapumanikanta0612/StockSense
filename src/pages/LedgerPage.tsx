import { useSearchParams } from 'react-router-dom'
import { LedgerTable } from '../components/ledger/LedgerTable'
import { ErrorState } from '../components/ui/ErrorState'
import { Icon } from '../components/ui/Icon'
import { LoadingState } from '../components/ui/LoadingState'
import { PageHeader } from '../components/ui/PageHeader'
import { useLedger } from '../hooks/useLedger'
import type { OperationTypeFilter } from '../types/inventoryActivity'

function parseType(value: string | null): OperationTypeFilter {
  return value === 'RECEIPT' || value === 'DELIVERY' || value === 'TRANSFER' || value === 'ADJUSTMENT' ? value : ''
}

export function LedgerPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search') ?? ''
  const type = parseType(params.get('type'))
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const filters = { search, type, from, to }
  const { data, isLoading, error, retry } = useLedger(filters)
  const hasFilters = Boolean(search || type || from || to)

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  const reset = () => setParams({}, { replace: true })

  return <div className="page ledger-page">
    <PageHeader eyebrow="Audit trail" title="Stock ledger" description="Review every immutable stock movement across warehouses and operations." actions={<span className="updated-pill"><Icon name="ledger" size={16} /> Read-only history</span>} />
    <section className="panel activity-filter-panel" aria-label="Ledger filters"><div className="ledger-filters">
      <label className="product-search" htmlFor="ledger-search"><Icon name="search" size={18} /><span className="sr-only">Search product, SKU, or reference</span><input id="ledger-search" type="search" value={search} onChange={(event) => update('search', event.target.value)} placeholder="Search product, SKU, or reference" /></label>
      <div className="product-filter-control"><label htmlFor="ledger-type">Operation</label><select id="ledger-type" value={type} onChange={(event) => update('type', event.target.value)}><option value="">All operations</option><option value="RECEIPT">Receipt</option><option value="DELIVERY">Delivery</option><option value="TRANSFER">Transfer</option><option value="ADJUSTMENT">Adjustment</option></select></div>
      <div className="product-filter-control"><label htmlFor="ledger-from">From</label><input id="ledger-from" type="date" value={from} onChange={(event) => update('from', event.target.value)} /></div>
      <div className="product-filter-control"><label htmlFor="ledger-to">To</label><input id="ledger-to" type="date" value={to} min={from || undefined} onChange={(event) => update('to', event.target.value)} /></div>
      <button className="button button--ghost" disabled={!hasFilters} onClick={reset} type="button">Reset</button>
    </div></section>
    {error ? <ErrorState title="Unable to load stock ledger" message={error} onRetry={retry} /> : isLoading && !data ? <LoadingState variant="page" label="Loading stock ledger…" /> : data ? <section className="panel activity-results" aria-busy={isLoading}>
      <div className="panel__header"><div><span className="panel__eyebrow">Movement history</span><h2>{hasFilters ? 'Matching movements' : 'All movements'}</h2></div><span className="panel__meta" aria-live="polite">{data.movements.length} of {data.total}</span></div>
      {data.movements.length ? <LedgerTable movements={data.movements} /> : <div className="activity-empty"><Icon name="filter" size={24} /><h3>No matching movements</h3><p>Change the search, operation, or date range.</p><button className="button button--secondary" onClick={reset} type="button">Clear filters</button></div>}
    </section> : null}
  </div>
}
