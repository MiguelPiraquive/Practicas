import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Guarda de ruta: si no hay sesión redirige a /login,
 * si no tiene el permiso requerido redirige a `redirectTo` (por defecto "/").
 */
export default function RequirePermiso({ codigo, any, all, redirectTo = '/', children }) {
  const { user, loading, can, canAny, canAll } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  let ok = true
  if (codigo) ok = can(codigo)
  else if (any) ok = canAny(any)
  else if (all) ok = canAll(all)

  if (!ok) return <Navigate to={redirectTo} replace />
  return children
}
