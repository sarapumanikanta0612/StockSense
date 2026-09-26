import type {
  ActivityLocation,
  ActivityProduct,
  ActivityUser,
  LedgerMovementView,
  OperationListItemView,
} from '../types/inventoryActivity'

const users: Record<string, ActivityUser> = {
  manager: { id: '1c8aee58-6994-4d59-a512-a10195f1d101', email: 'manager@stocksense.demo' },
  warehouse: { id: '1c8aee58-6994-4d59-a512-a10195f1d102', email: 'warehouse@stocksense.demo' },
}

const locations: Record<string, ActivityLocation> = {
  centralReceiving: { id: '4628fb0d-66d4-4328-9b0e-b8fa8608a101', name: 'Receiving Bay', warehouse: { id: 'fd4be1e5-51ae-43a5-bce0-39e72ba1a101', name: 'Central Warehouse' } },
  centralA12: { id: '4628fb0d-66d4-4328-9b0e-b8fa8608a102', name: 'Rack A-12', warehouse: { id: 'fd4be1e5-51ae-43a5-bce0-39e72ba1a101', name: 'Central Warehouse' } },
  centralB08: { id: '4628fb0d-66d4-4328-9b0e-b8fa8608a103', name: 'Bin B-08', warehouse: { id: 'fd4be1e5-51ae-43a5-bce0-39e72ba1a101', name: 'Central Warehouse' } },
  northReceiving: { id: '4628fb0d-66d4-4328-9b0e-b8fa8608a104', name: 'Receiving Bay', warehouse: { id: 'fd4be1e5-51ae-43a5-bce0-39e72ba1a102', name: 'North Hub' } },
  northE04: { id: '4628fb0d-66d4-4328-9b0e-b8fa8608a105', name: 'Electrical E-04', warehouse: { id: 'fd4be1e5-51ae-43a5-bce0-39e72ba1a102', name: 'North Hub' } },
  southP03: { id: '4628fb0d-66d4-4328-9b0e-b8fa8608a106', name: 'PPE P-03', warehouse: { id: 'fd4be1e5-51ae-43a5-bce0-39e72ba1a103', name: 'South Depot' } },
  southM02: { id: '4628fb0d-66d4-4328-9b0e-b8fa8608a107', name: 'Machine M-02', warehouse: { id: 'fd4be1e5-51ae-43a5-bce0-39e72ba1a103', name: 'South Depot' } },
}

const products: Record<string, ActivityProduct> = {
  steel: { id: 'f83b9d6a-1fb0-4197-8190-10ddc1d7a101', name: 'Steel Rod 12mm', sku: 'STL-RD-12MM', unitOfMeasure: 'pcs' },
  copper: { id: 'f83b9d6a-1fb0-4197-8190-10ddc1d7a102', name: 'Copper Wire 2.5mm', sku: 'CPR-WR-2.5', unitOfMeasure: 'rolls' },
  bearings: { id: 'f83b9d6a-1fb0-4197-8190-10ddc1d7a103', name: 'Industrial Bearings 6205-ZZ', sku: 'BRG-6205-ZZ', unitOfMeasure: 'pcs' },
  gloves: { id: 'f83b9d6a-1fb0-4197-8190-10ddc1d7a104', name: 'Safety Gloves - Large', sku: 'PPE-GLV-L', unitOfMeasure: 'pairs' },
  aluminum: { id: 'f83b9d6a-1fb0-4197-8190-10ddc1d7a105', name: 'Aluminum Sheets 3mm', sku: 'AL-SHT-3MM', unitOfMeasure: 'sheets' },
  breaker: { id: 'f83b9d6a-1fb0-4197-8190-10ddc1d7a106', name: 'Circuit Breaker 32A', sku: 'ELC-MCB-32A', unitOfMeasure: 'pcs' },
}

const user = (key: keyof typeof users) => users[key]!
const location = (key: keyof typeof locations) => locations[key]!
const product = (key: keyof typeof products) => products[key]!

export const inventoryOperationDemoData: OperationListItemView[] = [
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010101', type: 'RECEIPT', status: 'DONE', clientReference: 'RCPT-2026-0184', reason: null,
    sourceLocation: null, destinationLocation: location('northReceiving'), createdBy: user('manager'), validatedBy: user('warehouse'),
    createdAt: '2026-09-26T04:12:00.000Z', updatedAt: '2026-09-26T04:42:00.000Z', validatedAt: '2026-09-26T04:42:00.000Z',
    items: [{ id: 'op-item-101', product: product('copper'), quantity: '120.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010102', type: 'RECEIPT', status: 'DRAFT', clientReference: 'RCPT-2026-0191', reason: null,
    sourceLocation: null, destinationLocation: location('centralReceiving'), createdBy: user('manager'), validatedBy: null,
    createdAt: '2026-09-26T06:30:00.000Z', updatedAt: '2026-09-26T06:30:00.000Z', validatedAt: null,
    items: [
      { id: 'op-item-102', product: product('steel'), quantity: '80.000' },
      { id: 'op-item-103', product: product('aluminum'), quantity: '25.000' },
    ],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010103', type: 'RECEIPT', status: 'CANCELED', clientReference: 'RCPT-2026-0172', reason: null,
    sourceLocation: null, destinationLocation: location('centralReceiving'), createdBy: user('warehouse'), validatedBy: null,
    createdAt: '2026-09-24T08:20:00.000Z', updatedAt: '2026-09-24T09:05:00.000Z', validatedAt: null,
    items: [{ id: 'op-item-104', product: product('bearings'), quantity: '40.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010201', type: 'DELIVERY', status: 'DONE', clientReference: 'DLV-2026-0112', reason: null,
    sourceLocation: location('southP03'), destinationLocation: null, createdBy: user('manager'), validatedBy: user('warehouse'),
    createdAt: '2026-09-26T02:15:00.000Z', updatedAt: '2026-09-26T02:48:00.000Z', validatedAt: '2026-09-26T02:48:00.000Z',
    items: [{ id: 'op-item-201', product: product('gloves'), quantity: '36.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010202', type: 'DELIVERY', status: 'DRAFT', clientReference: 'DLV-2026-0118', reason: null,
    sourceLocation: location('centralB08'), destinationLocation: null, createdBy: user('warehouse'), validatedBy: null,
    createdAt: '2026-09-26T07:10:00.000Z', updatedAt: '2026-09-26T07:10:00.000Z', validatedAt: null,
    items: [{ id: 'op-item-202', product: product('bearings'), quantity: '10.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010203', type: 'DELIVERY', status: 'CANCELED', clientReference: 'DLV-2026-0105', reason: null,
    sourceLocation: location('centralA12'), destinationLocation: null, createdBy: user('manager'), validatedBy: null,
    createdAt: '2026-09-23T10:30:00.000Z', updatedAt: '2026-09-23T11:00:00.000Z', validatedAt: null,
    items: [{ id: 'op-item-203', product: product('steel'), quantity: '20.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010301', type: 'TRANSFER', status: 'DONE', clientReference: 'TRF-2026-0067', reason: null,
    sourceLocation: location('centralB08'), destinationLocation: location('southM02'), createdBy: user('manager'), validatedBy: user('warehouse'),
    createdAt: '2026-09-25T09:55:00.000Z', updatedAt: '2026-09-25T10:35:00.000Z', validatedAt: '2026-09-25T10:35:00.000Z',
    items: [{ id: 'op-item-301', product: product('bearings'), quantity: '24.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010302', type: 'TRANSFER', status: 'DRAFT', clientReference: 'TRF-2026-0071', reason: null,
    sourceLocation: location('northE04'), destinationLocation: location('centralA12'), createdBy: user('warehouse'), validatedBy: null,
    createdAt: '2026-09-26T05:50:00.000Z', updatedAt: '2026-09-26T05:50:00.000Z', validatedAt: null,
    items: [{ id: 'op-item-302', product: product('breaker'), quantity: '30.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010303', type: 'TRANSFER', status: 'CANCELED', clientReference: null, reason: null,
    sourceLocation: location('centralA12'), destinationLocation: location('southM02'), createdBy: user('manager'), validatedBy: null,
    createdAt: '2026-09-22T07:30:00.000Z', updatedAt: '2026-09-22T08:10:00.000Z', validatedAt: null,
    items: [{ id: 'op-item-303', product: product('steel'), quantity: '15.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010401', type: 'ADJUSTMENT', status: 'DONE', clientReference: 'ADJ-2026-0031', reason: 'Physical count variance after weekly cycle count.',
    sourceLocation: location('centralA12'), destinationLocation: null, createdBy: user('warehouse'), validatedBy: user('manager'),
    createdAt: '2026-09-25T08:20:00.000Z', updatedAt: '2026-09-25T08:57:00.000Z', validatedAt: '2026-09-25T08:57:00.000Z',
    items: [{ id: 'op-item-401', product: product('steel'), quantity: '-4.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010402', type: 'ADJUSTMENT', status: 'DRAFT', clientReference: 'ADJ-2026-0034', reason: 'Damaged packaging found during aisle inspection.',
    sourceLocation: location('southP03'), destinationLocation: null, createdBy: user('warehouse'), validatedBy: null,
    createdAt: '2026-09-26T07:25:00.000Z', updatedAt: '2026-09-26T07:25:00.000Z', validatedAt: null,
    items: [{ id: 'op-item-402', product: product('gloves'), quantity: '-6.000' }],
  },
  {
    id: '2bb01e8f-5e4a-41db-a45e-c3173d010403', type: 'ADJUSTMENT', status: 'DONE', clientReference: 'ADJ-2026-0028', reason: 'Opening count correction.',
    sourceLocation: location('northE04'), destinationLocation: null, createdBy: user('manager'), validatedBy: user('manager'),
    createdAt: '2026-09-21T06:40:00.000Z', updatedAt: '2026-09-21T07:02:00.000Z', validatedAt: '2026-09-21T07:02:00.000Z',
    items: [{ id: 'op-item-403', product: product('breaker'), quantity: '8.000' }],
  },
]

export const ledgerMovementDemoData: LedgerMovementView[] = [
  { id: 'ledger-101', type: 'RECEIPT', quantity: '120.000', product: product('copper'), sourceLocation: null, destinationLocation: location('northReceiving'), document: { id: '2bb01e8f-5e4a-41db-a45e-c3173d010101', type: 'RECEIPT', clientReference: 'RCPT-2026-0184' }, performedBy: user('warehouse'), createdAt: '2026-09-26T04:42:00.000Z' },
  { id: 'ledger-102', type: 'DELIVERY', quantity: '-36.000', product: product('gloves'), sourceLocation: location('southP03'), destinationLocation: null, document: { id: '2bb01e8f-5e4a-41db-a45e-c3173d010201', type: 'DELIVERY', clientReference: 'DLV-2026-0112' }, performedBy: user('warehouse'), createdAt: '2026-09-26T02:48:00.000Z' },
  { id: 'ledger-103', type: 'TRANSFER', quantity: '24.000', product: product('bearings'), sourceLocation: location('centralB08'), destinationLocation: location('southM02'), document: { id: '2bb01e8f-5e4a-41db-a45e-c3173d010301', type: 'TRANSFER', clientReference: 'TRF-2026-0067' }, performedBy: user('warehouse'), createdAt: '2026-09-25T10:35:00.000Z' },
  { id: 'ledger-104', type: 'ADJUSTMENT', quantity: '-4.000', product: product('steel'), sourceLocation: location('centralA12'), destinationLocation: null, document: { id: '2bb01e8f-5e4a-41db-a45e-c3173d010401', type: 'ADJUSTMENT', clientReference: 'ADJ-2026-0031' }, performedBy: user('manager'), createdAt: '2026-09-25T08:57:00.000Z' },
  { id: 'ledger-105', type: 'DELIVERY', quantity: '-12.000', product: product('aluminum'), sourceLocation: location('centralA12'), destinationLocation: null, document: { id: 'ledger-doc-105', type: 'DELIVERY', clientReference: 'DLV-2026-0109' }, performedBy: user('warehouse'), createdAt: '2026-09-24T11:15:00.000Z' },
  { id: 'ledger-106', type: 'RECEIPT', quantity: '64.000', product: product('bearings'), sourceLocation: null, destinationLocation: location('centralReceiving'), document: { id: 'ledger-doc-106', type: 'RECEIPT', clientReference: 'RCPT-2026-0179' }, performedBy: user('manager'), createdAt: '2026-09-24T06:30:00.000Z' },
  { id: 'ledger-107', type: 'TRANSFER', quantity: '18.000', product: product('steel'), sourceLocation: location('centralA12'), destinationLocation: location('southM02'), document: { id: 'ledger-doc-107', type: 'TRANSFER', clientReference: 'TRF-2026-0062' }, performedBy: user('warehouse'), createdAt: '2026-09-23T09:20:00.000Z' },
  { id: 'ledger-108', type: 'ADJUSTMENT', quantity: '8.000', product: product('breaker'), sourceLocation: null, destinationLocation: location('northE04'), document: { id: '2bb01e8f-5e4a-41db-a45e-c3173d010403', type: 'ADJUSTMENT', clientReference: 'ADJ-2026-0028' }, performedBy: user('manager'), createdAt: '2026-09-21T07:02:00.000Z' },
]
