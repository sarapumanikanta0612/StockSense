import { apiClient } from './apiClient'
import { fetchActiveProducts, getCatalogStockStatus } from './productService'
import type {
  DashboardInsight,
  DashboardSnapshot,
  MovementType,
  Product,
  StockMovement,
  StockOverviewItem,
  WarehouseLocation,
} from '../types/inventory'
import type { CatalogProduct } from '../types/products'

const PAGE_SIZE = 100

interface BackendOperationItem {
  quantity: string
}

interface BackendOperation {
  items: BackendOperationItem[]
}

interface BackendLocation {
  name: string
  warehouse: { name: string }
}

interface BackendMovement {
  id: string
  type: 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT'
  quantity: string
  product: { name: string; sku: string; unitOfMeasure: string }
  sourceLocation: BackendLocation | null
  destinationLocation: BackendLocation | null
  document: { clientReference: string | null; id: string }
  createdAt: string
}

interface InsightResponse {
  source: DashboardInsight['source']
  headline: string
  messages: string[]
}

interface AiInsightEnvelope {
  insight: InsightResponse
}

export interface DashboardDataService {
  getDashboardSnapshot: () => Promise<DashboardSnapshot>
}

function toLocation(location: BackendLocation | null): WarehouseLocation | undefined {
  return location
    ? { warehouseName: location.warehouse.name, locationName: location.name }
    : undefined
}

function toMovement(movement: BackendMovement): StockMovement {
  return {
    id: movement.id,
    reference: movement.document.clientReference ?? movement.document.id.slice(0, 8).toUpperCase(),
    productName: movement.product.name,
    sku: movement.product.sku,
    unit: movement.product.unitOfMeasure,
    type: movement.type.toLowerCase() as MovementType,
    quantity: Number(movement.quantity),
    occurredAt: movement.createdAt,
    source: toLocation(movement.sourceLocation),
    destination: toLocation(movement.destinationLocation),
  }
}

function toDashboardProduct(product: CatalogProduct): Product {
  const storage = product.stockByLocation[0]?.location
  const status = getCatalogStockStatus(product)
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category?.name ?? 'Uncategorized',
    unit: product.unitOfMeasure,
    quantity: Number(product.totalStock),
    minimumStock: Number(product.reorderLevel),
    status: status === 'low-stock' ? 'low' : status === 'in-stock' ? 'healthy' : status,
    storage: storage
      ? { warehouseName: storage.warehouse.name, locationName: storage.name }
      : { warehouseName: 'No warehouse', locationName: 'No stock location' },
  }
}

function percentage(count: number, total: number) {
  return total === 0 ? 0 : Math.round((count / total) * 100)
}

async function fetchAllDrafts(path: '/receipts' | '/deliveries' | '/transfers') {
  const first = await apiClient.get<BackendOperation[]>(path, {
    page: 1,
    limit: PAGE_SIZE,
    status: 'DRAFT',
  })
  const total = first.meta?.pagination?.total ?? first.data.length
  const pages = Math.ceil(total / PAGE_SIZE)
  if (pages <= 1) return { operations: first.data, total }

  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) => apiClient.get<BackendOperation[]>(path, {
      page: index + 2,
      limit: PAGE_SIZE,
      status: 'DRAFT',
    })),
  )
  return { operations: [first, ...remaining].flatMap((response) => response.data), total }
}

function sumDraftQuantity(operations: BackendOperation[]) {
  return operations.reduce(
    (sum, operation) => sum + operation.items.reduce(
      (itemSum, item) => itemSum + Math.abs(Number(item.quantity)),
      0,
    ),
    0,
  )
}

export const dashboardService: DashboardDataService = {
  async getDashboardSnapshot() {
    const [products, ledger, receipts, deliveries, transfers, aiInsight] = await Promise.all([
      fetchActiveProducts(),
      apiClient.get<BackendMovement[]>('/ledger', { page: 1, limit: 6 }),
      fetchAllDrafts('/receipts'),
      fetchAllDrafts('/deliveries'),
      fetchAllDrafts('/transfers'),
      apiClient.get<AiInsightEnvelope>('/analytics/ai-insight', { windowDays: 30, limit: 5 }),
    ])

    const dashboardProducts = products.map(toDashboardProduct)
    const healthy = dashboardProducts.filter((product) => product.status === 'healthy').length
    const low = dashboardProducts.filter((product) => product.status === 'low').length
    const outOfStock = dashboardProducts.filter((product) => product.status === 'out-of-stock').length
    const stockOverview: StockOverviewItem[] = [
      { status: 'healthy', label: 'Healthy', count: healthy, percentage: percentage(healthy, products.length) },
      { status: 'low', label: 'Low stock', count: low, percentage: percentage(low, products.length) },
      {
        status: 'out-of-stock',
        label: 'Out of stock',
        count: outOfStock,
        percentage: percentage(outOfStock, products.length),
      },
    ]

    return {
      statistics: {
        totalProductsInStock: dashboardProducts.filter((product) => product.quantity > 0).length,
        activeSkus: products.length,
        lowStock: low,
        outOfStock,
        pendingReceipts: receipts.total,
        pendingDeliveries: deliveries.total,
        scheduledTransfers: transfers.total,
        pendingReceiptQuantity: sumDraftQuantity(receipts.operations),
        pendingDeliveryQuantity: sumDraftQuantity(deliveries.operations),
      },
      stockOverview,
      lowStockProducts: dashboardProducts
        .filter((product) => product.status !== 'healthy')
        .sort((left, right) => left.quantity - right.quantity)
        .slice(0, 6),
      recentMovements: ledger.data.map(toMovement),
      insight: aiInsight.data.insight,
      lastUpdated: new Date().toISOString(),
    }
  },
}
