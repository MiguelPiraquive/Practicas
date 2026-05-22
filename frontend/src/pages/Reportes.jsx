import { useEffect, useState, useCallback } from 'react'
import api from '../services/api'

const ESTADOS = [
  { value: '', label: 'Todas las solicitudes' },
  { value: 'SOLICITADA', label: 'Solo Solicitadas' },
  { value: 'EN_BUSQUEDA', label: 'Solo En búsqueda' },
  { value: 'LISTA', label: 'Solo Listas' },
  { value: 'ENTREGADA', label: 'Solo Entregadas' },
]

export default function Reportes() {
  const [filtroEstado, setFiltroEstado] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [descargando, setDescargando] = useState(false)
  const [mensaje, setMensaje] = useState(null) // { tipo: 'ok'|'error', texto }
  const [stats, setStats] = useState(null)
  const [cargandoStats, setCargandoStats] = useState(false)

  const buildParams = useCallback(() => {
    const params = {}
    if (filtroEstado) params.estado = filtroEstado
    if (fechaDesde) params.fecha_desde = fechaDesde
    if (fechaHasta) params.fecha_hasta = fechaHasta
    return params
  }, [filtroEstado, fechaDesde, fechaHasta])

  const cargarStats = useCallback(async () => {
    setCargandoStats(true)
    try {
      const params = {}
      if (fechaDesde) params.fecha_desde = fechaDesde
      if (fechaHasta) params.fecha_hasta = fechaHasta
      const res = await api.get('/solicitudes/estadisticas/', { params })
      setStats(res.data)
    } catch (err) {
      console.error('Error cargando estadísticas', err)
      setStats(null)
    } finally {
      setCargandoStats(false)
    }
  }, [fechaDesde, fechaHasta])

  useEffect(() => {
    cargarStats()
  }, [cargarStats])

  const limpiarFiltros = () => {
    setFiltroEstado('')
    setFechaDesde('')
    setFechaHasta('')
    setMensaje(null)
  }

  const conteoExportar = stats
    ? (filtroEstado
        ? stats[filtroEstado.toLowerCase()] ?? 0
        : stats.total)
    : null

  const exportar = async () => {
    setMensaje(null)

    if (fechaDesde && fechaHasta && fechaDesde > fechaHasta) {
      setMensaje({ tipo: 'error', texto: 'La fecha "desde" no puede ser mayor que la fecha "hasta".' })
      return
    }

    setDescargando(true)
    try {
      const res = await api.get('/solicitudes/exportar/', {
        params: buildParams(),
        responseType: 'blob',
      })

      // Intentar leer nombre del Content-Disposition
      let filename = `solicitudes_${new Date().toISOString().slice(0, 10)}.xlsx`
      const cd = res.headers['content-disposition'] || res.headers['Content-Disposition']
      if (cd) {
        const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd)
        if (match) filename = decodeURIComponent(match[1])
      }

      const blob = new Blob([res.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setMensaje({
        tipo: 'ok',
        texto: `Reporte descargado correctamente${conteoExportar !== null ? ` (${conteoExportar} solicitudes)` : ''}.`,
      })
    } catch (err) {
      console.error('Error exportando', err)
      let texto = 'No se pudo generar el reporte. Intente nuevamente.'
      if (err.response?.data instanceof Blob) {
        try {
          const txt = await err.response.data.text()
          const json = JSON.parse(txt)
          if (json?.error || json?.detail) texto = json.error || json.detail
        } catch { /* ignore */ }
      } else if (err.response?.data?.error || err.response?.data?.detail) {
        texto = err.response.data.error || err.response.data.detail
      } else if (err.message) {
        texto = err.message
      }
      setMensaje({ tipo: 'error', texto })
    } finally {
      setDescargando(false)
    }
  }

  return (
    <>
      <div className="hc-page-header">
        <div>
          <h1 className="hc-page-title">Reportes</h1>
          <p className="hc-page-subtitle">Exporta información del sistema</p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Total', value: stats?.total, color: '#1f5c8b' },
          { label: 'Solicitadas', value: stats?.solicitada, color: '#6c757d' },
          { label: 'En búsqueda', value: stats?.en_busqueda, color: '#f59e0b' },
          { label: 'Listas', value: stats?.lista, color: '#3b82f6' },
          { label: 'Entregadas', value: stats?.entregada, color: '#16a34a' },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderLeft: `4px solid ${s.color}`,
              borderRadius: 8,
              padding: '14px 16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color, marginTop: 4 }}>
              {cargandoStats ? '…' : (s.value ?? 0)}
            </div>
          </div>
        ))}
      </div>

      <div className="hc-report-cards">
        <div className="hc-report-card">
          <div className="hc-report-card-icon excel">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h3>Solicitudes a Excel</h3>
          <p>Exporta el listado completo de solicitudes con sus estados, fechas y datos del paciente.</p>

          <div className="hc-form-group">
            <label className="hc-form-label">Filtrar por estado</label>
            <select
              className="hc-form-input hc-form-select"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              {ESTADOS.map((e) => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="hc-form-group">
              <label className="hc-form-label">Fecha desde</label>
              <input
                type="date"
                className="hc-form-input"
                value={fechaDesde}
                max={fechaHasta || undefined}
                onChange={(e) => setFechaDesde(e.target.value)}
              />
            </div>
            <div className="hc-form-group">
              <label className="hc-form-label">Fecha hasta</label>
              <input
                type="date"
                className="hc-form-input"
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={(e) => setFechaHasta(e.target.value)}
              />
            </div>
          </div>

          {conteoExportar !== null && (
            <div
              style={{
                background: '#f1f5f9',
                color: '#0f172a',
                padding: '10px 12px',
                borderRadius: 6,
                fontSize: 14,
                margin: '8px 0 12px',
              }}
            >
              Se exportarán <strong>{conteoExportar}</strong> solicitud(es) con los filtros actuales.
            </div>
          )}

          {mensaje && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: 6,
                fontSize: 14,
                marginBottom: 12,
                background: mensaje.tipo === 'ok' ? '#dcfce7' : '#fee2e2',
                color: mensaje.tipo === 'ok' ? '#166534' : '#991b1b',
                border: `1px solid ${mensaje.tipo === 'ok' ? '#86efac' : '#fca5a5'}`,
              }}
            >
              {mensaje.texto}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="hc-btn hc-btn-success"
              onClick={exportar}
              disabled={descargando || conteoExportar === 0}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              {descargando ? 'Descargando...' : 'Descargar Excel'}
            </button>
            <button
              type="button"
              className="hc-btn"
              onClick={limpiarFiltros}
              disabled={descargando}
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
