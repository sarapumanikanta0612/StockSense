import type { RefObject } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { findNavigationItem } from '../../config/navigation'
import { useAuth } from '../../hooks/useAuth'
import { USER_ROLE_LABELS } from '../../types/auth'
import { Icon } from '../ui/Icon'

interface HeaderProps {
  isNavigationOpen: boolean
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onOpenNavigation: () => void
}

function getUserInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function Header({ isNavigationOpen, menuButtonRef, onOpenNavigation }: HeaderProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const activeItem = findNavigationItem(pathname)

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="top-header">
      <div className="top-header__title-group">
        <button
          aria-controls="primary-navigation"
          aria-expanded={isNavigationOpen}
          aria-label="Open navigation"
          className="icon-button top-header__menu"
          onClick={onOpenNavigation}
          ref={menuButtonRef}
          type="button"
        >
          <Icon name="menu" />
        </button>
        <div>
          <span className="top-header__eyebrow">Inventory workspace</span>
          <strong>{activeItem?.label ?? 'StockSense'}</strong>
        </div>
      </div>

      <div className="top-header__actions">
        <label className="global-search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search products or SKUs</span>
          <input type="search" placeholder="Search product or SKU" />
        </label>
        <button className="icon-button notification-button" type="button" aria-label="Notifications">
          <Icon name="bell" />
          <span aria-hidden="true" />
        </button>
        {user ? (
          <div className="workspace-identity" aria-label={`Signed in as ${user.email}, ${USER_ROLE_LABELS[user.role]}`}>
            <span className="workspace-identity__avatar" aria-hidden="true">{getUserInitials(user.email)}</span>
            <span className="workspace-identity__copy">
              <strong title={user.email}>{user.email}</strong>
              <small>{USER_ROLE_LABELS[user.role]}</small>
            </span>
          </div>
        ) : null}
        <button className="button button--ghost workspace-identity__logout" onClick={handleLogout} type="button">
          Log out
        </button>
      </div>
    </header>
  )
}
