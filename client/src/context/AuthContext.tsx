import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Auth } from '../services/api'
import type { User } from '../services/api'

interface AuthCtx {
  user: User | null
  token: string | null
  login:    (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout:   () => void
  loading:  boolean
}

const Ctx = createContext<AuthCtx>(null!)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User|null>(null)
  const [token,   setToken]   = useState<string|null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('fl_token')
    const u = localStorage.getItem('fl_user')
    if (t && u) { setToken(t); setUser(JSON.parse(u)) }
    setLoading(false)
  }, [])

  const save = (token: string, user: User) => {
    localStorage.setItem('fl_token', token)
    localStorage.setItem('fl_user',  JSON.stringify(user))
    setToken(token); setUser(user)
  }

  const login = async (email: string, password: string) => {
    const res = await Auth.login(email, password)
    save(res.token, res.user)
  }

  const register = async (name: string, email: string, password: string) => {
    const res = await Auth.register(name, email, password)
    save(res.token, res.user)
  }

  const logout = () => {
    localStorage.removeItem('fl_token')
    localStorage.removeItem('fl_user')
    setToken(null); setUser(null)
  }

  return <Ctx.Provider value={{ user, token, login, register, logout, loading }}>{children}</Ctx.Provider>
}
