export type OperationType = 'RECEIPT' | 'DELIVERY' | 'TRANSFER' | 'ADJUSTMENT'
export type OperationStatus = 'DRAFT' | 'DONE' | 'CANCELED'
export type OperationStatusFilter = '' | OperationStatus
export type OperationTypeFilter = '' | OperationType

export interface ActivityUser {
  id: string
  email: string
}

export interface ActivityLocation {
  id: string
  name: string
  warehouse: { id: string; name: string }
}

export interface ActivityProduct {
  id: string
  name: string
  sku: string
  unitOfMeasure: string
}

export interface OperationItemView {
  id: string
  product: ActivityProduct
  quantity: string
}

export interface OperationListItemView {
  id: string
  type: OperationType
  status: OperationStatus
  clientReference: string | null
  reason: string | null
  sourceLocation: ActivityLocation | null
  destinationLocation: ActivityLocation | null
  createdBy: ActivityUser
  validatedBy: ActivityUser | null
  createdAt: string
  updatedAt: string
  validatedAt: string | null
  items: OperationItemView[]
}

export interface LedgerMovementView {
  id: string
  type: OperationType
  quantity: string
  product: ActivityProduct
  sourceLocation: ActivityLocation | null
  destinationLocation: ActivityLocation | null
  document: { id: string; type: OperationType; clientReference: string | null }
  performedBy: ActivityUser
  createdAt: string
}

export interface OperationFilters {
  reference: string
  status: OperationStatusFilter
}

export interface LedgerFilters {
  search: string
  type: OperationTypeFilter
  from: string
  to: string
}

export interface OperationListResult {
  operations: OperationListItemView[]
  total: number
}

export interface LedgerListResult {
  movements: LedgerMovementView[]
  total: number
}
