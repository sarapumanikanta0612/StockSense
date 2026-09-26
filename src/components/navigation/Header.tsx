import type { RefObject } from 'react'
import { useLocation } from 'react-router-dom'
import { navigationItems } from '../../config/navigation'
import { Icon } from '../ui/Icon'

interface HeaderProps {
  isNavigationOpen: boolean
  menuButtonRef: RefObject<HTMLButtonElement | null>
  onOpenNavigation: () => void
}

export function Header({ isNavigationOpen, menuButtonRef, onOpenNavigation }: HeaderProps) {
  const { pathname } = useLocation()
  const activeItem = navigationItems.find((item) => item.path === pathname)

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
        <div className="workspace-identity" aria-label="Current workspace: Operations demo">
          <span className="workspace-identity__avatar">OP</span>
          <span className="workspace-identity__copy">
            <strong>Operations</strong>
            <small>Demo workspace</small>
          </span>
        </div>
      </div>
    </header>
  )
}
