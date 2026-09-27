import type { AuthCredentials, AuthSession, AuthUser } from '../types/auth'
import { apiClient } from './apiClient'

interface AuthResponseUser extends AuthUser {
  isActive: boolean
  createdAt: string
}

interface AuthResponse {
  user: AuthResponseUser
  accessToken: string
}

interface CurrentUserResponse {
  user: AuthUser
}

function toAuthSession(response: AuthResponse): AuthSession {
  return {
    user: {
      id: response.user.id,
      email: response.user.email,
      role: response.user.role,
    },
    accessToken: response.accessToken,
  }
}

export async function login(credentials: AuthCredentials) {
  const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
  return toAuthSession(response.data)
}

export async function register(credentials: AuthCredentials) {
  const response = await apiClient.post<AuthResponse>('/auth/register', credentials)
  return toAuthSession(response.data)
}

export async function getCurrentUser() {
  const response = await apiClient.get<CurrentUserResponse>('/auth/me')
  return response.data.user
}
