import { Icon } from './Icon'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
  retryLabel?: string
  title?: string
}

export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try again',
  title = 'Unable to load dashboard',
}: ErrorStateProps) {
  return (
    <div className="error-state panel" role="alert">
      <span className="error-state__icon"><Icon name="warning" size={24} /></span>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry ? (
        <button className="button button--primary" onClick={onRetry} type="button">{retryLabel}</button>
      ) : null}
    </div>
  )
}
