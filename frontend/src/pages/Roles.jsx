import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const formInicial = { nombre: '', descripcion: '', activo: true, permisos: [] }

// Iconos SVG simples por módulo
const ICONOS_MODULO = {
  pacientes:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 11h-6M19 8v6"/></svg>,
  solicitudes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>,
  catalogos:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  usuarios:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  roles:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  bitacora:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  reportes:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
}

export default function Roles() {
  const { can } = useAuth()
  const puedeCrear = can('roles.crear')
  const puedeEditar = can('roles.editar')
  const puedeEliminar = can('roles.eliminar')

  const [roles, setRoles] = useState([])
  const [grupos, setGrupos] = useState([])     // [{modulo,label,permisos:[...]}]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  // Modal
  const [abierto, setAbierto] = useState(false)
  const [editando, setEditando] = useState(null)  // null=crear, obj=editar
  const [form, setForm] = useState(formInicial)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [rRoles, rGrupos] = await Promise.all([
        api.get('/auth/roles/'),
        api.get('/auth/permisos/agrupados/'),
      ])
      const data = Array.isArray(rRoles.data) ? rRoles.data : (rRoles.data.results || [])
      setRoles(data)
      setGrupos(Array.isArray(rGrupos.data) ? rGrupos.data : [])
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar la lista de roles.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const idsDeCatalogo = useMemo(() => {
    const ids = []
    grupos.forEach(g => g.permisos.forEach(p => ids.push(p.id)))
    return ids
  }, [grupos])

  const abrirCrear = () => {
    setEditando(null)
    setForm(formInicial)
    setErrores({})
    setAbierto(true)
  }

  const abrirEditar = (rol) => {
    setEditando(rol)
    setForm({
      nombre: rol.nombre,
      descripcion: rol.descripcion || '',
      activo: rol.activo,
      permisos: (rol.permisos_detalle || []).map(p => p.id),
    })
    setErrores({})
    setAbierto(true)
  }

  const cerrar = () => { setAbierto(false); setEditando(null); setErrores({}) }

  const togglePermiso = (id) => {
    setForm(f => ({
      ...f,
      permisos: f.permisos.includes(id) ? f.permisos.filter(x => x !== id) : [...f.permisos, id],
    }))
  }

  const toggleGrupo = (grupo, todos) => {
    const idsGrupo = grupo.permisos.map(p => p.id)
    setForm(f => ({
      ...f,
      permisos: todos
        ? f.permisos.filter(id => !idsGrupo.includes(id))
        : Array.from(new Set([...f.permisos, ...idsGrupo])),
    }))
  }

  const guardar = async (e) => {
    e.preventDefault()
    setErrores({}); setGuardando(true)
    try {
      const payload = {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion,
        activo: form.activo,
        permisos: form.permisos,
      }
      if (editando) {
        // Para roles de sistema, el backend solo deja descripcion/activo.
        if (editando.es_sistema) {
          await api.patch(`/auth/roles/${editando.id}/`, {
            descripcion: payload.descripcion, activo: payload.activo,
          })
        } else {
          await api.patch(`/auth/roles/${editando.id}/`, payload)
        }
        setMensaje({ tipo: 'ok', texto: `Rol "${payload.nombre}" actualizado.` })
      } else {
        await api.post('/auth/roles/', payload)
        setMensaje({ tipo: 'ok', texto: `Rol "${payload.nombre}" creado.` })
      }
      cerrar()
      cargar()
    } catch (err) {
      console.error(err)
      const data = err.response?.data
      if (data && typeof data === 'object') setErrores(data)
      else setErrores({ detail: 'No se pudo guardar el rol.' })
    } finally { setGuardando(false) }
  }

  const eliminar = async (rol) => {
    if (rol.es_sistema) {
      setMensaje({ tipo: 'error', texto: 'No se puede eliminar un rol del sistema.' })
      return
    }
    if (!confirm(`¿Eliminar el rol "${rol.nombre}"? Si está asignado a usuarios, se desactivará.`)) return
    try {
      await api.delete(`/auth/roles/${rol.id}/`)
      setMensaje({ tipo: 'ok', texto: `Rol "${rol.nombre}" eliminado.` })
      cargar()
    } catch (err) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: err.response?.data?.detail || 'No se pudo eliminar el rol.' })
    }
  }

  return (
    <>
      <div className="hc-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="hc-page-title">Roles y permisos</h1>
          <p className="hc-page-subtitle">Gestione los roles del sistema y los permisos que conceden.</p>
        </div>
        {puedeCrear && (
          <button className="hc-btn hc-btn-primary" onClick={abrirCrear}>+ Nuevo rol</button>
        )}
      </div>

      {mensaje && (
        <div className={`hc-alert hc-alert-${mensaje.tipo}`} style={{ marginBottom: 12 }}>
          {mensaje.texto}
          <button className="hc-alert-close" onClick={() => setMensaje(null)}>×</button>
        </div>
      )}

      <div className="hc-table-wrapper">
        {loading ? (
          <div className="hc-empty-state"><p className="hc-empty-text">Cargando…</p></div>
        ) : error ? (
          <div className="hc-empty-state"><p className="hc-empty-text">{error}</p></div>
        ) : roles.length === 0 ? (
          <div className="hc-empty-state"><p className="hc-empty-text">Sin roles creados.</p></div>
        ) : (
          <table className="hc-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Permisos</th>
                <th>Estado</th>
                <th>Tipo</th>
                <th style={{ width: 200 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(r => (
                <tr key={r.id}>
                  <td><strong>{r.nombre}</strong></td>
                  <td>{r.descripcion || '—'}</td>
                  <td>
                    <span className="hc-badge hc-badge-info">
                      {r.cantidad_permisos} permisos
                    </span>
                  </td>
                  <td>
                    <span className={`hc-badge ${r.activo ? 'hc-badge-success' : 'hc-badge-muted'}`}>
                      {r.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    {r.es_sistema
                      ? <span className="hc-badge hc-badge-warn">Sistema</span>
                      : <span className="hc-badge hc-badge-muted">Personalizado</span>}
                  </td>
                  <td>
                    {puedeEditar && (
                      <button className="hc-btn hc-btn-sm" onClick={() => abrirEditar(r)}>
                        {r.es_sistema ? 'Ver' : 'Editar'}
                      </button>
                    )}
                    {puedeEliminar && !r.es_sistema && (
                      <button className="hc-btn hc-btn-sm hc-btn-danger" style={{ marginLeft: 6 }} onClick={() => eliminar(r)}>
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {abierto && (
        <div className="hc-modal-overlay" onClick={cerrar}>
          <div className="hc-modal" style={{ maxWidth: 920 }} onClick={e => e.stopPropagation()}>
            <form onSubmit={guardar}>
              <div className="hc-modal-header">
                <h2 className="hc-modal-title">
                  {editando ? (editando.es_sistema ? `Rol del sistema: ${editando.nombre}` : `Editar rol: ${editando.nombre}`) : 'Nuevo rol'}
                </h2>
                <button type="button" className="hc-modal-close" onClick={cerrar}>×</button>
              </div>
              <div className="hc-modal-body">
                {editando?.es_sistema && (
                  <div className="hc-alert hc-alert-info" style={{ marginBottom: 12 }}>
                    Este es un rol del sistema. Solo puede modificarse su descripción y estado; los permisos están fijos.
                  </div>
                )}

                <div className="hc-form-row">
                  <div className="hc-form-field">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      value={form.nombre}
                      onChange={e => setForm({ ...form, nombre: e.target.value })}
                      disabled={!!editando?.es_sistema}
                      required
                    />
                    {errores.nombre && <small className="hc-form-error">{String(errores.nombre)}</small>}
                  </div>
                  <div className="hc-form-field">
                    <label>Estado</label>
                    <select
                      value={form.activo ? 'true' : 'false'}
                      onChange={e => setForm({ ...form, activo: e.target.value === 'true' })}
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>
                </div>
                <div className="hc-form-field">
                  <label>Descripción</label>
                  <textarea
                    rows={2}
                    value={form.descripcion}
                    onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  />
                </div>

                <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                  Permisos <small style={{ fontWeight: 400, color: 'var(--hc-text-muted)' }}>
                    ({form.permisos.length} de {idsDeCatalogo.length} seleccionados)
                  </small>
                </h3>
                <div className="hc-permisos-grid">
                  {grupos.map(grupo => {
                    const idsGrupo = grupo.permisos.map(p => p.id)
                    const seleccionadosEnGrupo = idsGrupo.filter(id => form.permisos.includes(id))
                    const todos = seleccionadosEnGrupo.length === idsGrupo.length && idsGrupo.length > 0
                    const algunos = seleccionadosEnGrupo.length > 0 && !todos
                    const estado = todos ? 'full' : (algunos ? 'partial' : 'empty')
                    const porcentaje = idsGrupo.length > 0
                      ? Math.round((seleccionadosEnGrupo.length / idsGrupo.length) * 100)
                      : 0
                    return (
                      <div
                        key={grupo.modulo}
                        className={`hc-permisos-card is-${estado}`}
                        data-modulo={grupo.modulo}
                      >
                        <div className="hc-permisos-card-header">
                          <div className="hc-permisos-card-title">
                            <span className="hc-permisos-card-icon">
                              {ICONOS_MODULO[grupo.modulo] || ICONOS_MODULO.catalogos}
                            </span>
                            <label className="hc-checkbox">
                              <input
                                type="checkbox"
                                checked={todos}
                                ref={el => { if (el) el.indeterminate = algunos }}
                                onChange={() => toggleGrupo(grupo, todos)}
                                disabled={!!editando?.es_sistema}
                              />
                              <strong>{grupo.label}</strong>
                            </label>
                          </div>
                          <small>{seleccionadosEnGrupo.length}/{idsGrupo.length}</small>
                        </div>
                        <div className="hc-permisos-progress">
                          <div
                            className="hc-permisos-progress-fill"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        <ul className="hc-permisos-list">
                          {grupo.permisos.map(p => {
                            const seleccionado = form.permisos.includes(p.id)
                            return (
                              <li key={p.id} className={seleccionado ? 'is-checked' : ''}>
                                <label className="hc-checkbox">
                                  <input
                                    type="checkbox"
                                    checked={seleccionado}
                                    onChange={() => togglePermiso(p.id)}
                                    disabled={!!editando?.es_sistema}
                                  />
                                  <span title={p.codigo}>{p.nombre}</span>
                                </label>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
                {errores.detail && <small className="hc-form-error">{String(errores.detail)}</small>}
              </div>
              <div className="hc-modal-footer">
                <button type="button" className="hc-btn" onClick={cerrar}>Cancelar</button>
                <button type="submit" className="hc-btn hc-btn-primary" disabled={guardando}>
                  {guardando ? 'Guardando…' : (editando ? 'Guardar cambios' : 'Crear rol')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
