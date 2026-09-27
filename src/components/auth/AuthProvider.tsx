import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  API_UNAUTHORIZED_EVENT,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '../../services/apiClient'
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from '../../services/authService'
import type { AuthCredentials, AuthUser } from '../../types/auth'

export interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: AuthCredentials) => Promise<void>
  register: (credentials: AuthCredentials) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    clearAccessToken()
    setUser(null)
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => logout()
    window.addEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(API_UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [logout])

  useEffect(() => {
    let isActive = true

    async function bootstrapSession() {
      if (!getAccessToken()) {
        if (isActive) setIsLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser()
        if (isActive) setUser(currentUser)
      } catch {
        if (isActive) setUser(null)
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void bootstrapSession()
    return () => {
      isActive = false
    }
  }, [])

  const login = useCallback(async (credentials: AuthCredentials) => {
    const session = await loginRequest(credentials)
    setAccessToken(session.accessToken)
    setUser(session.user)
  }, [])

  const register = useCallback(async (credentials: AuthCredentials) => {
    const session = await registerRequest(credentials)
    setAccessToken(session.accessToken)
    setUser(session.user)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  }), [isLoading, login, logout, register, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
