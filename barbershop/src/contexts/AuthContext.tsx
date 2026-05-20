import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import api from '../services/api'

// ─────────────────────────────────────────────────────────────
//  Tipos
// ─────────────────────────────────────────────────────────────

interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  tenantId: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  logged: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

// ─────────────────────────────────────────────────────────────
//  Constantes de storage
// ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'barber_token'
const USER_KEY = 'barber_user'

// ─────────────────────────────────────────────────────────────
//  Context
// ─────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ─────────────────────────────────────────────────────────────
//  Provider
// ─────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  )

  // Enquanto restaura sessão do storage, exibe loading
  const [loading, setLoading] = useState(true)

  // ── Restaura sessão na montagem ───────────────────────────
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
      }
    }

    setLoading(false)
  }, [])

  // ── Login ─────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<{
      success: boolean
      data: { accessToken: string; user: AuthUser }
      error?: string
    }>('/auth/login', { email, password })

    if (!response.data.success) {
      throw new Error(response.data.error ?? 'Credenciais inválidas')
    }

    const { accessToken, user: authUser } = response.data.data

    localStorage.setItem(TOKEN_KEY, accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(authUser))

    setToken(accessToken)
    setUser(authUser)
  }, [])

  // ── Logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        logged: !!token && !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────
//  Hook
// ─────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}