import { useAuth } from '../context/AuthContext'

/**
 * Oculta a sus hijos si el usuario no tiene el permiso requerido.
 *
 * Props:
 *   codigo: string             un solo código (atajo).
 *   any:    string[]           visible si tiene CUALQUIERA.
 *   all:    string[]           visible si tiene TODOS.
 *   fallback?: ReactNode       qué renderizar si no tiene permiso (default: null).
 */
export default function Protected({ codigo, any, all, fallback = null, children }) {
  const { can, canAny, canAll } = useAuth()
  let visible = true
  if (codigo) visible = can(codigo)
  else if (any) visible = canAny(any)
  else if (all) visible = canAll(all)
  return visible ? children : fallback
}
