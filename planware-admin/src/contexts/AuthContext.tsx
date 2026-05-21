import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { AuthUser } from '@/types'
import { authApi } from '@/services/api'
import { notyf } from '@/services/notyf'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('planware_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadUser)
  const [isLoading, setIsLoading] = useState(false)

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      const { accessToken, user: userData } = data.data

      if (userData.role !== 'SUPERADMIN') {
        notyf.error('Acesso restrito a superadmins')
        return false
      }

      localStorage.setItem('planware_token', accessToken)
      localStorage.setItem('planware_user', JSON.stringify(userData))
      setUser(userData)
      return true
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error ?? 'Credenciais inválidas'
      notyf.error(msg)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('planware_token')
    localStorage.removeItem('planware_user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}