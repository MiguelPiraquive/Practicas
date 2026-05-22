import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../services/api'

const PAGE_SIZE = 20

export default function Bitacora() {
  const [logs, setLogs] = useState([])
  const [count, setCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Filtros
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [modelo, setModelo] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Modal de detalle
  const [detalleSeleccionado, setDetalleSeleccionado] = useState(null)

  const totalPaginas = Math.max(1, Math.ceil(count / PAGE_SIZE))

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page }
      if (search) params.search = search
      if (modelo) params.modelo_afectado = modelo
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const res = await api.get('/bitacora/', { params })
      if (Array.isArray(res.data)) {
        setLogs(res.data)
        setCount(res.data.length)
      } else {
        setLogs(res.data.results || [])
        setCount(res.data.count || 0)
      }
    } catch (err) {
      console.error(err)
      setError('No se pudo cargar la bitácora.')
      setLogs([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, search, modelo, fechaDesde, fechaHasta])

  useEffect(() => { cargar() }, [cargar])

  // Reiniciar a página 1 cuando cambian los filtros (excepto página)
  useEffect(() => { setPage(1) }, [search, modelo, fechaDesde, fechaHasta])

  const onBuscar = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
  }

  const limpiarFiltros = () => {
    setSearch(''); setSearchInput('')
    setModelo(''); setFechaDesde(''); setFechaHasta('')
  }

  const modelos = useMemo(() => {
    const set = new Set(logs.map((l) => l.modelo_afectado).filter(Boolean))
    // mantener opciones comunes incluso si el filtro actual no las muestra
    ;['Solicitud', 'Paciente', 'Usuario'].forEach((m) => set.add(m))
    return Array.from(set).sort()
  }, [logs])

  const colorAccion = (accion = '') => {
    const a = accion.toLowerCase()
    if (a.includes('crear')) return { bg: '#dcfce7', fg: '#166534', bd: '#86efac' }
    if (a.includes('eliminar') || a.includes('desactivar')) return { bg: '#fee2e2', fg: '#991b1b', bd: '#fca5a5' }
    if (a.includes('editar') || a.includes('cambiar') || a.includes('actualizar')) return { bg: '#dbeafe', fg: '#1e40af', bd: '#93c5fd' }
    if (a.includes('error')) return { bg: '#fef3c7', fg: '#92400e', bd: '#fcd34d' }
    return { bg: '#e0f2fe', fg: '#075985', bd: '#bae6fd' }
  }

  const formatearFecha = (f) => {
    if (!f) return ''
    const d = new Date(f)
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' })
  }

  return (
    <>
      <div className="hc-page-header">
        <div>
          <h1 className="hc-page-title">Bitácora</h1>
          <p className="hc-page-subtitle">Registro de todas las acciones realizadas en el sistema</p>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 16,
          marginBottom: 16,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
          alignItems: 'end',
        }}
      >
        <form onSubmit={onBuscar} style={{ display: 'contents' }}>
          <div className="hc-form-group" style={{ margin: 0 }}>
            <label className="hc-form-label">Buscar</label>
            <input
              type="search"
              className="hc-form-input"
              placeholder="Acción o detalle..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </form>

        <div className="hc-form-group" style={{ margin: 0 }}>
          <label className="hc-form-label">Modelo</label>
          <select
            className="hc-form-input hc-form-select"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
          >
            <option value="">Todos</option>
            {modelos.map((m) => (<option key={m} value={m}>{m}</option>))}
          </select>
        </div>

        <div className="hc-form-group" style={{ margin: 0 }}>
          <label className="hc-form-label">Desde</label>
          <input
            type="date"
            className="hc-form-input"
            value={fechaDesde}
            max={fechaHasta || undefined}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>

        <div className="hc-form-group" style={{ margin: 0 }}>
          <label className="hc-form-label">Hasta</label>
          <input
            type="date"
            className="hc-form-input"
            value={fechaHasta}
            min={fechaDesde || undefined}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="hc-btn hc-btn-primary" onClick={onBuscar}>
            Buscar
          </button>
          <button type="button" className="hc-btn" onClick={limpiarFiltros}>
            Limpiar
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '10px 12px',
            borderRadius: 6,
            background: '#fee2e2',
            color: '#991b1b',
            border: '1px solid #fca5a5',
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="hc-table-wrapper">
          <div className="hc-empty-state">
            <p className="hc-empty-text">Cargando...</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="hc-table-wrapper">
          <div className="hc-empty-state">
            <div className="hc-empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <p className="hc-empty-title">Sin registros</p>
            <p className="hc-empty-text">No se encontraron eventos con los filtros actuales.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="hc-table-wrapper">
            <table className="hc-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Modelo</th>
                  <th>Registro</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const c = colorAccion(log.accion)
                  return (
                    <tr
                      key={log.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setDetalleSeleccionado(log)}
                    >
                      <td style={{ whiteSpace: 'nowrap' }}>{formatearFecha(log.fecha)}</td>
                      <td className="hc-table-cell-primary">
                        {log.usuario_detalle?.nombre_completo || 'Sistema'}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 600,
                            background: c.bg,
                            color: c.fg,
                            border: `1px solid ${c.bd}`,
                          }}
                        >
                          {log.accion}
                        </span>
                      </td>
                      <td>{log.modelo_afectado}</td>
                      <td className="hc-table-cell-mono">#{log.registro_id}</td>
                      <td
                        style={{
                          maxWidth: 320,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={log.detalle}
                      >
                        {log.detalle}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 14, color: '#6b7280' }}>
              {count} registro(s) — Página {page} de {totalPaginas}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="hc-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                className="hc-btn"
                disabled={page >= totalPaginas}
                onClick={() => setPage((p) => Math.min(totalPaginas, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal detalle */}
      {detalleSeleccionado && (
        <div
          onClick={() => setDetalleSeleccionado(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 8, maxWidth: 600, width: '100%',
              maxHeight: '80vh', overflow: 'auto', padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Detalle del evento</h3>
              <button
                className="hc-btn"
                onClick={() => setDetalleSeleccionado(null)}
                style={{ padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', margin: 0 }}>
              <dt style={{ fontWeight: 600 }}>Fecha:</dt>
              <dd style={{ margin: 0 }}>{formatearFecha(detalleSeleccionado.fecha)}</dd>
              <dt style={{ fontWeight: 600 }}>Usuario:</dt>
              <dd style={{ margin: 0 }}>{detalleSeleccionado.usuario_detalle?.nombre_completo || 'Sistema'}</dd>
              <dt style={{ fontWeight: 600 }}>Acción:</dt>
              <dd style={{ margin: 0 }}>{detalleSeleccionado.accion}</dd>
              <dt style={{ fontWeight: 600 }}>Modelo:</dt>
              <dd style={{ margin: 0 }}>{detalleSeleccionado.modelo_afectado}</dd>
              <dt style={{ fontWeight: 600 }}>Registro:</dt>
              <dd style={{ margin: 0 }}>#{detalleSeleccionado.registro_id}</dd>
              <dt style={{ fontWeight: 600, alignSelf: 'start' }}>Detalle:</dt>
              <dd style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{detalleSeleccionado.detalle || '—'}</dd>
            </dl>
          </div>
        </div>
      )}
    </>
  )
}
