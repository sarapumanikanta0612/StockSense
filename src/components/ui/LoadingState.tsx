interface LoadingStateProps {
  label?: string
  variant?: 'dashboard' | 'page'
}

export function LoadingState({
  label = 'Loading inventory dashboard…',
  variant = 'dashboard',
}: LoadingStateProps) {
  if (variant === 'page') {
    return (
      <div className="panel page-loading" role="status" aria-label={label}>
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--line-short" />
        <div className="skeleton skeleton--content" />
        <span className="sr-only">{label}</span>
      </div>
    )
  }

  return (
    <div className="dashboard-loading" role="status" aria-label={label}>
      <div className="skeleton skeleton--heading" />
      <div className="skeleton-grid">
        {Array.from({ length: 5 }, (_, index) => <div className="skeleton skeleton--card" key={index} />)}
      </div>
      <div className="skeleton-grid skeleton-grid--panels">
        <div className="skeleton skeleton--panel" />
        <div className="skeleton skeleton--panel" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  )
}
