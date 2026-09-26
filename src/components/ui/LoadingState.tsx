export function LoadingState() {
  return (
    <div className="dashboard-loading" role="status" aria-label="Loading dashboard">
      <div className="skeleton skeleton--heading" />
      <div className="skeleton-grid">
        {Array.from({ length: 5 }, (_, index) => <div className="skeleton skeleton--card" key={index} />)}
      </div>
      <div className="skeleton-grid skeleton-grid--panels">
        <div className="skeleton skeleton--panel" />
        <div className="skeleton skeleton--panel" />
      </div>
      <span className="sr-only">Loading inventory dashboard…</span>
    </div>
  )
}
