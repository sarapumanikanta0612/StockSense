import type { ReactNode } from 'react'

interface AuthPageFrameProps {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthPageFrame({ title, description, children, footer }: AuthPageFrameProps) {
  return (
    <main className="auth-page">
      <section className="auth-card panel" aria-labelledby="auth-title">
        <div className="auth-card__brand" aria-label="StockSense">
          <span className="auth-card__mark" aria-hidden="true">SS</span>
          <span>StockSense</span>
        </div>
        <header className="auth-card__header">
          <span className="auth-card__eyebrow">Inventory workspace</span>
          <h1 id="auth-title">{title}</h1>
          <p>{description}</p>
        </header>
        {children}
        <div className="auth-card__footer">{footer}</div>
      </section>
    </main>
  )
}
