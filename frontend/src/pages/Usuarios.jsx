import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'ventanilla', label: 'Ventanilla' },
]

const initialForm = {
  username: '',
  nombre_completo: '',
  rol: 'ventanilla',
  is_active: true,
  password: '',
  roles: [],          // ids de la nueva tabla Rol (M2M)
}

export default function Usuarios() {
  const { user: usuarioActual, can } = useAuth()
  const esAdmin = can('usuarios.crear') || can('usuarios.editar') || can('usuarios.eliminar')

  const [usuarios, setUsuarios] = useState([])
  const [rolesDisponibles, setRolesDisponibles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filtroRol, setFiltroRol] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  // Modal CRUD
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null) // null = crear, objeto = editar
  const [form, setForm] = useState(initialForm)
  const [erroresForm, setErroresForm] = useState({})
  const [guardando, setGuardando] = useState(false)

  // Modal cambiar contraseña
  const [modalPassword, setModalPassword] = useState(null) // usuario seleccionado
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [errorPassword, setErrorPassword] = useState(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {}
      if (search) params.search = search
      if (filtroRol) params.rol = filtroRol
      if (!mostrarInactivos) params.is_active = 'true'
      const res = await api.get('/auth/usuarios/', { params })
      const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
      setUsuarios(data)
    } catch (err) {
      console.error(err)
      if (err.response?.status === 403) {
        setError('No tiene permisos para ver esta sección.')
      } else {
        setError('No se pudo cargar la lista de usuarios.')
      }
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }, [search, filtroRol, mostrarInactivos])

  useEffect(() => { cargar() }, [cargar])

  // Cargar el catálogo de roles (M2M) una sola vez para mostrarlo en el modal.
  useEffect(() => {
    api.get('/auth/roles/', { params: { activo: 'true' } })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setRolesDisponibles(data)
      })
      .catch(() => setRolesDisponibles([]))
  }, [])

  const onBuscar = (e) => {
    e?.preventDefault()
    setSearch(searchInput.trim())
  }

  const abrirCrear = () => {
    setEditando(null)
    setForm(initialForm)
    setErroresForm({})
    setModalAbierto(true)
  }

  const abrirEditar = (u) => {
    setEditando(u)
    setForm({
      username: u.username,
      nombre_completo: u.nombre_completo,
      rol: u.rol,
      is_active: u.is_active,
      password: '',
      roles: Array.isArray(u.roles_detalle) ? u.roles_detalle.map(r => r.id) : (u.roles || []),
    })
    setErroresForm({})
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setEditando(null)
    setErroresForm({})
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErroresForm({})
    setGuardando(true)
    try {
      const payload = { ...form }
      if (editando) {
        if (!payload.password) delete payload.password
        await api.patch(`/auth/usuarios/${editando.id}/`, payload)
        setMensaje({ tipo: 'ok', texto: `Usuario "${payload.username}" actualizado.` })
      } else {
        await api.post('/auth/usuarios/', payload)
        setMensaje({ tipo: 'ok', texto: `Usuario "${payload.username}" creado.` })
      }
      cerrarModal()
      cargar()
    } catch (err) {
      console.error(err)
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setErroresForm(data)
      } else {
        setErroresForm({ detail: 'No se pudo guardar el usuario.' })
      }
    } finally {
      setGuardando(false)
    }
  }

  const desactivar = async (u) => {
    if (u.id === usuarioActual?.id) {
      setMensaje({ tipo: 'error', texto: 'No puede desactivarse a sí mismo.' })
      return
    }
    if (!confirm(`¿Desactivar al usuario "${u.username}"?`)) return
    try {
      await api.delete(`/auth/usuarios/${u.id}/`)
      setMensaje({ tipo: 'ok', texto: `Usuario "${u.username}" desactivado.` })
      cargar()
    } catch (err) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'No se pudo desactivar el usuario.' })
    }
  }

  const activar = async (u) => {
    try {
      await api.post(`/auth/usuarios/${u.id}/activar/`)
      setMensaje({ tipo: 'ok', texto: `Usuario "${u.username}" activado.` })
      cargar()
    } catch (err) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'No se pudo activar el usuario.' })
    }
  }

  const abrirCambioPassword = (u) => {
    setModalPassword(u)
    setNuevaPassword('')
    setConfirmarPassword('')
    setErrorPassword(null)
  }

  const guardarPassword = async (e) => {
    e.preventDefault()
    setErrorPassword(null)
    if (nuevaPassword.length < 6) {
      setErrorPassword('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (nuevaPassword !== confirmarPassword) {
      setErrorPassword('Las contraseñas no coinciden.')
      return
    }
    try {
      await api.post(
        `/auth/usuarios/${modalPassword.id}/cambiar-password/`,
        { password_nueva: nuevaPassword }
      )
      setMensaje({ tipo: 'ok', texto: `Contraseña actualizada para "${modalPassword.username}".` })
      setModalPassword(null)
    } catch (err) {
      console.error(err)
      const detalle = err.response?.data?.password_nueva?.[0]
        || err.response?.data?.detail
        || 'No se pudo cambiar la contraseña.'
      setErrorPassword(Array.isArray(detalle) ? detalle.join(' ') : detalle)
    }
  }

  if (!esAdmin) {
    return (
      <>
        <div className="hc-page-header">
          <div>
            <h1 className="hc-page-title">Usuarios</h1>
          </div>
        </div>
        <div className="hc-table-wrapper">
          <div className="hc-empty-state">
            <p className="hc-empty-title">Acceso restringido</p>
            <p className="hc-empty-text">Solo administradores pueden gestionar usuarios.</p>
          </div>
        </div>
      </>
    )
  }

  const formatearFecha = (f) => {
    if (!f) return '—'
    return new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })
  }

  return (
    <>
      <div className="hc-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="hc-page-title">Usuarios</h1>
          <p className="hc-page-subtitle">Gestión de usuarios del sistema</p>
        </div>
        <button className="hc-btn hc-btn-primary" onClick={abrirCrear}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo usuario
        </button>
      </div>

      {mensaje && (
        <div
          style={{
            padding: '10px 12px', borderRadius: 6, fontSize: 14, marginBottom: 12,
            background: mensaje.tipo === 'ok' ? '#dcfce7' : '#fee2e2',
            color: mensaje.tipo === 'ok' ? '#166534' : '#991b1b',
            border: `1px solid ${mensaje.tipo === 'ok' ? '#86efac' : '#fca5a5'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span>{mensaje.texto}</span>
          <button
            onClick={() => setMensaje(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: 'inherit' }}
          >✕</button>
        </div>
      )}

      {/* Filtros */}
      <div
        style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
          padding: 16, marginBottom: 16, display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end',
        }}
      >
        <form onSubmit={onBuscar} style={{ display: 'contents' }}>
          <div className="hc-form-group" style={{ margin: 0 }}>
            <label className="hc-form-label">Buscar</label>
            <input
              type="search" className="hc-form-input"
              placeholder="Nombre o usuario..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>

        <div className="hc-form-group" style={{ margin: 0 }}>
          <label className="hc-form-label">Rol</label>
          <select
            className="hc-form-input hc-form-select"
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
          >
            <option value="">Todos</option>
            {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
          </select>
        </div>

        <div className="hc-form-group" style={{ margin: 0 }}>
          <label className="hc-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar inactivos
          </label>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="hc-btn hc-btn-primary" onClick={onBuscar}>Buscar</button>
          <button
            type="button" className="hc-btn"
            onClick={() => { setSearch(''); setSearchInput(''); setFiltroRol(''); setMostrarInactivos(false) }}
          >
            Limpiar
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '10px 12px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', marginBottom: 12 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="hc-table-wrapper"><div className="hc-empty-state"><p className="hc-empty-text">Cargando...</p></div></div>
      ) : usuarios.length === 0 ? (
        <div className="hc-table-wrapper">
          <div className="hc-empty-state">
            <p className="hc-empty-title">Sin usuarios</p>
            <p className="hc-empty-text">No se encontraron usuarios con los filtros actuales.</p>
          </div>
        </div>
      ) : (
        <div className="hc-table-wrapper">
          <table className="hc-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre completo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Último acceso</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="hc-table-cell-mono">{u.username}</td>
                  <td className="hc-table-cell-primary">
                    {u.nombre_completo}
                    {u.id === usuarioActual?.id && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: '#6b7280' }}>(tú)</span>
                    )}
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                        fontSize: 12, fontWeight: 600,
                        background: u.rol === 'admin' ? '#dbeafe' : '#f1f5f9',
                        color: u.rol === 'admin' ? '#1e40af' : '#475569',
                        border: `1px solid ${u.rol === 'admin' ? '#93c5fd' : '#cbd5e1'}`,
                      }}
                    >
                      {ROLES.find((r) => r.value === u.rol)?.label || u.rol}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-block', padding: '2px 10px', borderRadius: 12,
                        fontSize: 12, fontWeight: 600,
                        background: u.is_active ? '#dcfce7' : '#fee2e2',
                        color: u.is_active ? '#166534' : '#991b1b',
                        border: `1px solid ${u.is_active ? '#86efac' : '#fca5a5'}`,
                      }}
                    >
                      {u.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ whiteSpace: 'nowrap', color: '#6b7280', fontSize: 13 }}>
                    {formatearFecha(u.last_login)}
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      className="hc-btn"
                      style={{ padding: '4px 10px', marginRight: 4 }}
                      onClick={() => abrirEditar(u)}
                      title="Editar"
                    >Editar</button>
                    <button
                      className="hc-btn"
                      style={{ padding: '4px 10px', marginRight: 4 }}
                      onClick={() => abrirCambioPassword(u)}
                      title="Cambiar contraseña"
                    >Contraseña</button>
                    {u.is_active ? (
                      <button
                        className="hc-btn"
                        style={{ padding: '4px 10px', color: '#991b1b', borderColor: '#fca5a5' }}
                        onClick={() => desactivar(u)}
                        disabled={u.id === usuarioActual?.id}
                        title="Desactivar"
                      >Desactivar</button>
                    ) : (
                      <button
                        className="hc-btn hc-btn-success"
                        style={{ padding: '4px 10px' }}
                        onClick={() => activar(u)}
                      >Activar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear/editar */}
      {modalAbierto && (
        <div
          onClick={cerrarModal}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={guardar}
            style={{
              background: '#fff', borderRadius: 8, maxWidth: 520, width: '100%',
              maxHeight: '90vh', overflow: 'auto', padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{editando ? 'Editar usuario' : 'Nuevo usuario'}</h3>
              <button type="button" className="hc-btn" style={{ padding: '4px 10px' }} onClick={cerrarModal}>✕</button>
            </div>

            {erroresForm.detail && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', marginBottom: 12 }}>
                {erroresForm.detail}
              </div>
            )}

            <div className="hc-form-group">
              <label className="hc-form-label">Usuario (login) *</label>
              <input
                className="hc-form-input"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
                autoComplete="off"
              />
              {erroresForm.username && (
                <small style={{ color: '#991b1b' }}>{Array.isArray(erroresForm.username) ? erroresForm.username[0] : erroresForm.username}</small>
              )}
            </div>

            <div className="hc-form-group">
              <label className="hc-form-label">Nombre completo *</label>
              <input
                className="hc-form-input"
                value={form.nombre_completo}
                onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
                required
              />
              {erroresForm.nombre_completo && (
                <small style={{ color: '#991b1b' }}>{Array.isArray(erroresForm.nombre_completo) ? erroresForm.nombre_completo[0] : erroresForm.nombre_completo}</small>
              )}
            </div>

            <div className="hc-form-group">
              <label className="hc-form-label">Rol (legado) *</label>
              <select
                className="hc-form-input hc-form-select"
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              >
                {ROLES.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
              </select>
              <small style={{ color: '#6b7280' }}>Compatibilidad con la versión anterior. Use los roles de abajo para asignar permisos.</small>
            </div>

            <div className="hc-form-group">
              <label className="hc-form-label">Roles del sistema</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#f9fafb' }}>
                {rolesDisponibles.length === 0 ? (
                  <small style={{ color: '#6b7280' }}>No hay roles disponibles.</small>
                ) : rolesDisponibles.map(r => (
                  <label key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.roles.includes(r.id)}
                      onChange={(e) => {
                        setForm(f => ({
                          ...f,
                          roles: e.target.checked ? [...f.roles, r.id] : f.roles.filter(x => x !== r.id),
                        }))
                      }}
                    />
                    <span>
                      <strong>{r.nombre}</strong>
                      {r.es_sistema && <span style={{ marginLeft: 6, fontSize: 11, color: '#854d0e', background: 'rgba(234,179,8,0.18)', padding: '1px 6px', borderRadius: 10 }}>sistema</span>}
                      {r.descripcion && <span style={{ marginLeft: 6, fontSize: 12, color: '#6b7280' }}>{r.descripcion}</span>}
                    </span>
                  </label>
                ))}
              </div>
              {erroresForm.roles && (
                <small style={{ color: '#991b1b' }}>{Array.isArray(erroresForm.roles) ? erroresForm.roles[0] : erroresForm.roles}</small>
              )}
            </div>

            <div className="hc-form-group">
              <label className="hc-form-label">
                {editando ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
              </label>
              <input
                type="password"
                className="hc-form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!editando}
                autoComplete="new-password"
                placeholder={editando ? 'Dejar en blanco para no cambiar' : ''}
              />
              {erroresForm.password && (
                <small style={{ color: '#991b1b' }}>{Array.isArray(erroresForm.password) ? erroresForm.password[0] : erroresForm.password}</small>
              )}
            </div>

            <div className="hc-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                />
                Usuario activo
              </label>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="hc-btn" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
              <button type="submit" className="hc-btn hc-btn-primary" disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal cambiar contraseña */}
      {modalPassword && (
        <div
          onClick={() => setModalPassword(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={guardarPassword}
            style={{
              background: '#fff', borderRadius: 8, maxWidth: 420, width: '100%', padding: 24,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Cambiar contraseña</h3>
            <p style={{ color: '#6b7280', marginTop: 0 }}>
              Usuario: <strong>{modalPassword.username}</strong>
            </p>

            {errorPassword && (
              <div style={{ padding: '8px 12px', borderRadius: 6, background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5', marginBottom: 12 }}>
                {errorPassword}
              </div>
            )}

            <div className="hc-form-group">
              <label className="hc-form-label">Nueva contraseña *</label>
              <input
                type="password" className="hc-form-input"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                required minLength={6} autoComplete="new-password"
              />
            </div>

            <div className="hc-form-group">
              <label className="hc-form-label">Confirmar contraseña *</label>
              <input
                type="password" className="hc-form-input"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required minLength={6} autoComplete="new-password"
              />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="hc-btn" onClick={() => setModalPassword(null)}>Cancelar</button>
              <button type="submit" className="hc-btn hc-btn-primary">Cambiar</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
