import type { IconName } from '../components/ui/Icon'

export interface NavigationItem {
  label: string
  path: string
  icon: IconName
  description: string
}

export const navigationItems: NavigationItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'dashboard',
    description: 'Inventory health and activity at a glance.',
  },
  {
    label: 'Products',
    path: '/products',
    icon: 'products',
    description: 'Browse and manage the product catalogue.',
  },
  {
    label: 'Receipts',
    path: '/receipts',
    icon: 'receipts',
    description: 'Review incoming stock receipts.',
  },
  {
    label: 'Deliveries',
    path: '/deliveries',
    icon: 'deliveries',
    description: 'Track outgoing delivery orders.',
  },
  {
    label: 'Transfers',
    path: '/transfers',
    icon: 'transfers',
    description: 'View stock moving between locations.',
  },
  {
    label: 'Adjustments',
    path: '/adjustments',
    icon: 'adjustments',
    description: 'Review inventory count adjustments.',
  },
  {
    label: 'Stock Ledger',
    path: '/ledger',
    icon: 'ledger',
    description: 'Explore the inventory movement history.',
  },
]
