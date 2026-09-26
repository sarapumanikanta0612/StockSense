import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '../components/navigation/Header'
import { Sidebar } from '../components/navigation/Sidebar'
import { findNavigationItem } from '../config/navigation'
import { useMediaQuery } from '../hooks/useMediaQuery'

export function AppShell() {
  const [isNavigationOpen, setIsNavigationOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mainContentRef = useRef<HTMLElement>(null)
  const isMobile = useMediaQuery('(max-width: 900px)')
  const location = useLocation()

  const closeNavigation = useCallback((restoreFocus = true) => {
    setIsNavigationOpen(false)
    if (isMobile) {
      window.requestAnimationFrame(() => {
        if (restoreFocus) menuButtonRef.current?.focus()
        else mainContentRef.current?.focus()
      })
    }
  }, [isMobile])

  useEffect(() => {
    setIsNavigationOpen(false)
    const activeItem = findNavigationItem(location.pathname)
    document.title = `${activeItem?.label ?? 'StockSense'} · StockSense`
  }, [location.pathname])

  useEffect(() => {
    if (!isMobile) setIsNavigationOpen(false)
  }, [isMobile])

  useEffect(() => {
    document.body.style.overflow = isMobile && isNavigationOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobile, isNavigationOpen])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <Sidebar
        isMobile={isMobile}
        isOpen={isNavigationOpen}
        onClose={closeNavigation}
      />
      <div className="app-shell__workspace">
        <Header
          isNavigationOpen={isNavigationOpen}
          menuButtonRef={menuButtonRef}
          onOpenNavigation={() => setIsNavigationOpen(true)}
        />
        <main className="main-content" id="main-content" ref={mainContentRef} tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
