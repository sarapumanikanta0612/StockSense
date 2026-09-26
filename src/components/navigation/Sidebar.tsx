import { useEffect, useRef, type KeyboardEvent } from 'react'
import { NavLink } from 'react-router-dom'
import { navigationItems } from '../../config/navigation'
import { Icon } from '../ui/Icon'

interface SidebarProps {
  isMobile: boolean
  isOpen: boolean
  onClose: (restoreFocus?: boolean) => void
}

export function Sidebar({ isMobile, isOpen, onClose }: SidebarProps) {
  const sidebarRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (isMobile && isOpen) closeButtonRef.current?.focus()
  }, [isMobile, isOpen])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!isMobile || !isOpen) return

    if (event.key === 'Escape') {
      event.preventDefault()
      onClose(true)
      return
    }

    if (event.key !== 'Tab') return

    const focusableElements = Array.from(
      sidebarRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? [],
    )
    const firstElement = focusableElements[0]
    const lastElement = focusableElements.at(-1)

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement?.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement?.focus()
    }
  }

  return (
    <>
      <aside
        aria-hidden={isMobile && !isOpen}
        aria-label="Primary navigation"
        className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}
        id="primary-navigation"
        inert={isMobile && !isOpen ? true : undefined}
        onKeyDown={handleKeyDown}
        ref={sidebarRef}
      >
        <div className="sidebar__brand-row">
          <NavLink className="brand" to="/dashboard" onClick={() => onClose(false)} aria-label="StockSense dashboard">
            <span className="brand__mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="brand__name">StockSense</span>
          </NavLink>
          <button
            className="icon-button sidebar__close"
            type="button"
            onClick={() => onClose(true)}
            aria-label="Close navigation"
            ref={closeButtonRef}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="sidebar__section-label">Workspace</div>
        <nav className="sidebar__nav">
          {navigationItems.map((item) => (
            <NavLink
              className={({ isActive }) => `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
              key={item.path}
              onClick={() => onClose(false)}
              to={item.path}
            >
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              <Icon className="sidebar__link-chevron" name="chevronRight" size={16} />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__workspace-card">
          <span className="sidebar__workspace-icon"><Icon name="warehouse" size={18} /></span>
          <div>
            <strong>Demo workspace</strong>
            <span>3 warehouses connected</span>
          </div>
        </div>
      </aside>
      <button
        aria-label="Close navigation"
        className={`sidebar-overlay ${isOpen ? 'sidebar-overlay--visible' : ''}`}
        onClick={() => onClose(true)}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />
    </>
  )
}
