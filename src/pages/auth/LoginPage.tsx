import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthPageFrame } from '../../components/auth/AuthPageFrame'
import { useAuth } from '../../hooks/useAuth'

function getDestination(state: unknown) {
  if (!state || typeof state !== 'object' || !('from' in state)) return '/dashboard'
  const from = (state as { from?: unknown }).from
  if (!from || typeof from !== 'object') return '/dashboard'

  const location = from as { pathname?: unknown; search?: unknown; hash?: unknown }
  if (typeof location.pathname !== 'string' || !location.pathname.startsWith('/')) return '/dashboard'

  return `${location.pathname}${typeof location.search === 'string' ? location.search : ''}${typeof location.hash === 'string' ? location.hash : ''}`
}

export function LoginPage() {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const emailId = useId()
  const passwordId = useId()
  const errorId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Sign in · StockSense'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await login({ email, password })
      navigate(getDestination(location.state), { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageFrame
      title="Welcome back"
      description="Sign in to manage inventory, operations, and stock visibility."
      footer={<p>New to StockSense? <Link to="/register">Create an account</Link></p>}
    >
      {errorMessage ? (
        <div className="form-alert form-alert--error" id={errorId} role="alert">{errorMessage}</div>
      ) : null}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor={emailId}>Email address</label>
          <input
            autoComplete="email"
            autoFocus
            id={emailId}
            inputMode="email"
            maxLength={320}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
            type="email"
            value={email}
          />
        </div>
        <div className="form-field">
          <label htmlFor={passwordId}>Password</label>
          <input
            aria-describedby={errorMessage ? errorId : undefined}
            autoComplete="current-password"
            id={passwordId}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </div>
        <button className="button button--primary auth-form__submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthPageFrame>
  )
}
