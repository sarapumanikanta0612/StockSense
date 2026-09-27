import { useEffect, useId, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthPageFrame } from '../../components/auth/AuthPageFrame'
import { useAuth } from '../../hooks/useAuth'

function validatePassword(password: string, confirmation: string) {
  if (password.length < 8) return 'Password must contain at least 8 characters.'
  if (new TextEncoder().encode(password).byteLength > 72) return 'Password must not exceed 72 UTF-8 bytes.'
  if (password !== confirmation) return 'Passwords do not match.'
  return null
}

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const emailId = useId()
  const passwordId = useId()
  const confirmationId = useId()
  const errorId = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    document.title = 'Create account · StockSense'
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationMessage = validatePassword(password, confirmation)
    if (validationMessage) {
      setErrorMessage(validationMessage)
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      await register({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageFrame
      title="Create your account"
      description="Join your warehouse workspace with a secure staff account."
      footer={<p>Already have an account? <Link to="/login">Sign in</Link></p>}
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
            aria-describedby={`${passwordId}-hint${errorMessage ? ` ${errorId}` : ''}`}
            autoComplete="new-password"
            id={passwordId}
            minLength={8}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
          <span className="form-field__hint" id={`${passwordId}-hint`}>Use at least 8 characters.</span>
        </div>
        <div className="form-field">
          <label htmlFor={confirmationId}>Confirm password</label>
          <input
            aria-describedby={errorMessage ? errorId : undefined}
            autoComplete="new-password"
            id={confirmationId}
            minLength={8}
            onChange={(event) => setConfirmation(event.target.value)}
            required
            type="password"
            value={confirmation}
          />
        </div>
        <button className="button button--primary auth-form__submit" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthPageFrame>
  )
}
