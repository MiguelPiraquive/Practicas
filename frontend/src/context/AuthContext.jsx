import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchMe = useCallback(async () => {
    const res = await api.get('/auth/me/')
    setUser(res.data)
    return res.data
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchMe()
        .catch(() => {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchMe])

  const login = async (username, password) => {
    const res = await api.post('/auth/login/', { username, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    return await fetchMe()
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }

  // Set indexado de permisos para lookups O(1).
  const permisosSet = useMemo(() => {
    if (!user) return new Set()
    return new Set(Array.isArray(user.permisos) ? user.permisos : [])
  }, [user])

  // Helpers de permisos
  const can = useCallback((codigo) => {
    if (!user) return false
    if (user.is_superuser) return true
    if (!codigo) return true
    return permisosSet.has(codigo)
  }, [user, permisosSet])

  const canAny = useCallback((codigos) => {
    if (!Array.isArray(codigos) || codigos.length === 0) return true
    return codigos.some(c => can(c))
  }, [can])

  const canAll = useCallback((codigos) => {
    if (!Array.isArray(codigos) || codigos.length === 0) return true
    return codigos.every(c => can(c))
  }, [can])

  // Compat: `esAdmin` derivado del nuevo modelo. Mantiene el uso
  // existente `user.rol === 'admin'` para no romper código viejo.
  const esAdmin = !!user && (user.is_superuser || (Array.isArray(user.roles) && user.roles.some(r => r.nombre === 'Administrador')))

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, can, canAny, canAll, esAdmin, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
