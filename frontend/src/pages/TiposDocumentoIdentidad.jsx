import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const initialForm = { codigo: '', nombre: '', activo: true }
const ENDPOINT = '/solicitudes/tipos-doc-identidad/'

export default function TiposDocumentoIdentidad() {
  const { user: usuarioActual, can } = useAuth()
  const esAdmin = can('tipos_doc_identidad.crear') || can('tipos_doc_identidad.editar') || can('tipos_doc_identidad.eliminar')

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [mensaje, setMensaje] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(initialForm)
  const [erroresForm, setErroresForm] = useState({})
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const params = {}
      if (search) params.search = search
      if (!mostrarInactivos) params.activo = 'true'
      const res = await api.get(ENDPOINT, { params })
      const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
      setItems(data)
    } catch (err) {
      setError(err.response?.status === 403
        ? 'No tiene permisos para ver esta sección.'
        : 'No se pudo cargar la lista de tipos de documento de identidad.')
      setItems([])
    } finally { setLoading(false) }
  }, [search, mostrarInactivos])

  useEffect(() => { cargar() }, [cargar])

  const abrirCrear = () => { setEditando(null); setForm(initialForm); setErroresForm({}); setModalAbierto(true) }
  const abrirEditar = (it) => { setEditando(it); setForm({ codigo: it.codigo, nombre: it.nombre, activo: it.activo }); setErroresForm({}); setModalAbierto(true) }
  const cerrarModal = () => { setModalAbierto(false); setEditando(null); setErroresForm({}) }

  const guardar = async (e) => {
    e.preventDefault(); setErroresForm({}); setGuardando(true)
    try {
      const payload = { ...form, codigo: form.codigo.trim().toUpperCase() }
      if (editando) {
        await api.patch(`${ENDPOINT}${editando.id}/`, payload)
        setMensaje({ tipo: 'ok', texto: `Tipo "${payload.codigo}" actualizado.` })
      } else {
        await api.post(ENDPOINT, payload)
        setMensaje({ tipo: 'ok', texto: `Tipo "${payload.codigo}" creado.` })
      }
      cerrarModal(); cargar()
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') setErroresForm(data)
      else setErroresForm({ detail: 'No se pudo guardar.' })
    } finally { setGuardando(false) }
  }

  const desactivar = async (it) => {
    if (!confirm(`¿Desactivar el tipo "${it.codigo} — ${it.nombre}"?`)) return
    try {
      await api.delete(`${ENDPOINT}${it.id}/`)
      setMensaje({ tipo: 'ok', texto: `Tipo "${it.codigo}" desactivado.` }); cargar()
    } catch { setMensaje({ tipo: 'error', texto: 'No se pudo desactivar.' }) }
  }
  const activar = async (it) => {
    try {
      await api.patch(`${ENDPOINT}${it.id}/`, { activo: true })
      setMensaje({ tipo: 'ok', texto: `Tipo "${it.codigo}" activado.` }); cargar()
    } catch { setMensaje({ tipo: 'error', texto: 'No se pudo activar.' }) }
  }

  if (!esAdmin) {
    return (
      <>
        <div className="hc-page-header"><div><h1 className="hc-page-title">Tipos de Documento de Identidad</h1></div></div>
        <div className="hc-table-wrapper">
          <div className="hc-empty-state">
            <p className="hc-empty-title">Acceso restringido</p>
            <p className="hc-empty-text">Solo administradores pueden gestionar este catálogo.</p>
          </div>
        </div>
      </>
    )
  }

  const formatearFecha = (f) => f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  return (
    <>
      <div className="hc-page-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="hc-page-title">Tipos de Documento de Identidad</h1>
          <p className="hc-page-subtitle">Catálogo de documentos de identidad (CC, TI, CE, ...)</p>
        </div>
        <button className="hc-btn hc-btn-primary" onClick={abrirCrear}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuevo tipo
        </button>
      </div>

      {mensaje && (
        <div style={{
          padding: '10px 12px', borderRadius: 6, fontSize: 14, marginBottom: 12,
          background: mensaje.tipo === 'ok' ? '#dcfce7' : '#fee2e2',
          color: mensaje.tipo === 'ok' ? '#166534' : '#991b1b',
          border: `1px solid ${mensaje.tipo === 'ok' ? '#86efac' : '#fca5a5'}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span>{mensaje.texto}</span>
          <button onClick={() => setMensaje(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 18, color: 'inherit' }}>✕</button>
        </div>
      )}

      <div style={{
        background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8,
        padding: 16, marginBottom: 16, display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'end',
      }}>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()) }} style={{ display: 'contents' }}>
          <div className="hc-form-group" style={{ margin: 0 }}>
            <label className="hc-form-label">Buscar</label>
            <input type="search" className="hc-form-input" placeholder="Código o nombre..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
        </form>
        <div className="hc-form-group" style={{ margin: 0 }}>
          <label className="hc-form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={mostrarInactivos} onChange={(e) => setMostrarInactivos(e.target.checked)} />
            Mostrar inactivos
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="hc-btn hc-btn-primary" onClick={() => setSearch(searchInput.trim())}>Buscar</button>
          <button type="button" className="hc-btn" onClick={() => { setSearch(''); setSearchInput(''); setMostrarInactivos(false) }}>Limpiar</button>
        </div>
      </div>

      {error && <div style={{ padding: 12, background: '#fee2e2', color: '#991b1b', borderRadius: 6, marginBottom: 12 }}>{error}</div>}

      <div className="hc-table-wrapper">
        <table className="hc-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Estado</th>
              <th>Creado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td colSpan={5} style={{ textAlign: 'center', padding: 24 }}>Cargando...</td></tr>)}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5}><div className="hc-empty-state"><p className="hc-empty-title">Sin registros</p><p className="hc-empty-text">No hay tipos que coincidan con el filtro.</p></div></td></tr>
            )}
            {!loading && items.map((it) => (
              <tr key={it.id}>
                <td><strong>{it.codigo}</strong></td>
                <td>{it.nombre}</td>
                <td>
                  <span style={{
                    padding: '3px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    background: it.activo ? '#dcfce7' : '#fee2e2',
                    color: it.activo ? '#166534' : '#991b1b',
                  }}>{it.activo ? 'Activo' : 'Inactivo'}</span>
                </td>
                <td style={{ fontSize: 13, color: 'var(--hc-slate-500)' }}>{formatearFecha(it.fecha_creacion)}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="hc-btn hc-btn-sm" onClick={() => abrirEditar(it)}>Editar</button>
                  {it.activo
                    ? <button className="hc-btn hc-btn-sm" style={{ marginLeft: 6, color: '#991b1b' }} onClick={() => desactivar(it)}>Desactivar</button>
                    : <button className="hc-btn hc-btn-sm" style={{ marginLeft: 6, color: '#166534' }} onClick={() => activar(it)}>Activar</button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16 }} onClick={cerrarModal}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 480, boxShadow: '0 20px 50px rgba(0,0,0,0.25)' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={guardar}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>{editando ? 'Editar tipo' : 'Nuevo tipo'}</h2>
                <button type="button" onClick={cerrarModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 22 }}>✕</button>
              </div>
              <div style={{ padding: 20, display: 'grid', gap: 14 }}>
                {erroresForm.detail && <div style={{ padding: 10, background: '#fee2e2', color: '#991b1b', borderRadius: 6 }}>{erroresForm.detail}</div>}
                <div className="hc-form-group" style={{ margin: 0 }}>
                  <label className="hc-form-label">Código (sigla) *</label>
                  <input className="hc-form-input" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })} required maxLength={10} placeholder="Ej: CC, TI, CE" style={{ textTransform: 'uppercase' }} />
                  {erroresForm.codigo && <small style={{ color: '#991b1b' }}>{Array.isArray(erroresForm.codigo) ? erroresForm.codigo.join(' ') : erroresForm.codigo}</small>}
                </div>
                <div className="hc-form-group" style={{ margin: 0 }}>
                  <label className="hc-form-label">Nombre completo *</label>
                  <input className="hc-form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required maxLength={120} placeholder="Ej: Cédula de Ciudadanía" />
                  {erroresForm.nombre && <small style={{ color: '#991b1b' }}>{Array.isArray(erroresForm.nombre) ? erroresForm.nombre.join(' ') : erroresForm.nombre}</small>}
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                  <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} />
                  Activo
                </label>
              </div>
              <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="hc-btn" onClick={cerrarModal} disabled={guardando}>Cancelar</button>
                <button type="submit" className="hc-btn hc-btn-primary" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
