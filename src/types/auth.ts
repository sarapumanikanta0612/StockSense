export type UserRole = 'INVENTORY_MANAGER' | 'WAREHOUSE_STAFF'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export interface AuthCredentials {
  email: string
  password: string
}

export interface AuthSession {
  user: AuthUser
  accessToken: string
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  INVENTORY_MANAGER: 'Inventory manager',
  WAREHOUSE_STAFF: 'Warehouse staff',
}
