import { dashboardDemoData } from '../data/dashboardDemoData'
import type { DashboardSnapshot } from '../types/inventory'

export interface DashboardDataService {
  getDashboardSnapshot: () => Promise<DashboardSnapshot>
}

/**
 * Frontend-only adapter used until Developer 3 publishes an API contract.
 * It performs no network requests and does not represent a backend endpoint.
 */
export const demoDashboardService: DashboardDataService = {
  getDashboardSnapshot: () => Promise.resolve(dashboardDemoData),
}
