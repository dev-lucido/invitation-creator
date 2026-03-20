import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export type UserRole = 'admin' | 'user'

export interface AuthUser {
  username: string
  role: UserRole
  token: string
}

interface AuthContextType {
  user: AuthUser | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isAdmin: boolean
  isLoggedIn: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const SESSION_KEY = 'inviteforge_auth'

function loadSession(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(loadSession)

  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }))
      throw new Error(err.error || 'Login failed')
    }
    const data = await res.json()
    const authUser: AuthUser = { username: data.username, role: data.role, token: data.token }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(authUser))
    setUser(authUser)
  }, [])

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin: user?.role === 'admin',
      isLoggedIn: user !== null,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}