import { Icon } from './Icon'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon"><Icon name="warning" size={24} /></span>
      <h2>Unable to load dashboard</h2>
      <p>{message}</p>
      <button className="button button--primary" onClick={onRetry} type="button">Try again</button>
    </div>
  )
}
