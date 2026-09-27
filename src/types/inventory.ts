export type StockStatus = 'healthy' | 'low' | 'out-of-stock'

export type MovementType = 'receipt' | 'delivery' | 'transfer' | 'adjustment'

export interface WarehouseLocation {
  warehouseName: string
  locationName: string
}

export interface Product {
  id: string
  name: string
  sku: string
  category: string
  unit: string
  quantity: number
  minimumStock: number
  status: StockStatus
  storage: WarehouseLocation
}

export interface StockMovement {
  id: string
  reference: string
  productName: string
  sku: string
  unit: string
  type: MovementType
  quantity: number
  occurredAt: string
  source?: WarehouseLocation
  destination?: WarehouseLocation
}

export interface DashboardStatistics {
  totalProductsInStock: number
  activeSkus: number
  lowStock: number
  outOfStock: number
  pendingReceipts: number
  pendingDeliveries: number
  scheduledTransfers: number
  pendingReceiptQuantity: number
  pendingDeliveryQuantity: number
}

export interface StockOverviewItem {
  status: StockStatus
  label: string
  count: number
  percentage: number
}

export interface DashboardInsight {
  source: 'ai' | 'rule-based'
  headline: string
  messages: string[]
}

export interface DashboardSnapshot {
  statistics: DashboardStatistics
  stockOverview: StockOverviewItem[]
  lowStockProducts: Product[]
  recentMovements: StockMovement[]
  insight: DashboardInsight
  lastUpdated: string
}
