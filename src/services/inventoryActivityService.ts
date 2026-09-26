import { inventoryOperationDemoData, ledgerMovementDemoData } from '../data/inventoryActivityDemoData'
import type {
  LedgerFilters,
  LedgerListResult,
  OperationFilters,
  OperationListResult,
  OperationType,
} from '../types/inventoryActivity'

export interface InventoryActivityDataService {
  listOperations: (type: OperationType, filters: OperationFilters) => Promise<OperationListResult>
  listLedger: (filters: LedgerFilters) => Promise<LedgerListResult>
}

const clone = <Value>(value: Value): Value => structuredClone(value)

export const demoInventoryActivityService: InventoryActivityDataService = {
  async listOperations(type, filters) {
    const reference = filters.reference.trim().toLowerCase()
    const operations = inventoryOperationDemoData
      .filter((operation) => operation.type === type)
      .filter((operation) => !filters.status || operation.status === filters.status)
      .filter((operation) => !reference || operation.clientReference?.toLowerCase().includes(reference))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

    return { operations: clone(operations), total: inventoryOperationDemoData.filter((item) => item.type === type).length }
  },

  async listLedger(filters) {
    const search = filters.search.trim().toLowerCase()
    const from = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null
    const to = filters.to ? new Date(`${filters.to}T23:59:59.999`).getTime() : null
    const movements = ledgerMovementDemoData
      .filter((movement) => !filters.type || movement.type === filters.type)
      .filter((movement) => {
        if (!search) return true
        return movement.product.name.toLowerCase().includes(search)
          || movement.product.sku.toLowerCase().includes(search)
          || movement.document.clientReference?.toLowerCase().includes(search)
      })
      .filter((movement) => {
        const timestamp = new Date(movement.createdAt).getTime()
        return (from === null || timestamp >= from) && (to === null || timestamp <= to)
      })
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))

    return { movements: clone(movements), total: ledgerMovementDemoData.length }
  },
}
