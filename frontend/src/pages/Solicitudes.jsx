import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const estadoLabels = {
  SOLICITADA: 'Solicitada',
  EN_BUSQUEDA: 'En busqueda',
  LISTA: 'Lista',
  ENTREGADA: 'Entregada',
}

export default function Solicitudes() {
  const [solicitudes, setSolicitudes] = useState([])
  const [filtroEstado, setFiltroEstado] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const navigate = useNavigate()

  const cargarSolicitudes = async () => {
    const params = {}
    if (filtroEstado) params.estado = filtroEstado
    if (busqueda) params.search = busqueda
    const res = await api.get('/solicitudes/', { params })
    setSolicitudes(res.data.results || res.data)
  }

  useEffect(() => {
    cargarSolicitudes()
  }, [filtroEstado])

  const handleBuscar = (e) => {
    e.preventDefault()
    cargarSolicitudes()
  }

  return (
    <>
      <div className="hc-page-header">
        <div>
          <h1 className="hc-page-title">Solicitudes</h1>
          <p className="hc-page-subtitle">Gestiona las solicitudes de historias clinicas</p>
        </div>
        <button className="hc-btn hc-btn-success" onClick={() => navigate('/nueva-solicitud')}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          Nueva Solicitud
        </button>
      </div>

      <form onSubmit={handleBuscar} className="hc-filter-bar">
        <div className="hc-search-box">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input className="hc-form-input" placeholder="Buscar por paciente o documento..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <select className="hc-form-input hc-form-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} style={{ width: '200px', flex: 'none' }}>
          <option value="">Todos los estados</option>
          <option value="SOLICITADA">Solicitada</option>
          <option value="EN_BUSQUEDA">En busqueda</option>
          <option value="LISTA">Lista</option>
          <option value="ENTREGADA">Entregada</option>
        </select>
        <button type="submit" className="hc-btn hc-btn-primary">Buscar</button>
      </form>

      {solicitudes.length === 0 ? (
        <div className="hc-table-wrapper">
          <div className="hc-empty-state">
            <div className="hc-empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              </svg>
            </div>
            <p className="hc-empty-title">No hay solicitudes</p>
            <p className="hc-empty-text">Crea una nueva solicitud para comenzar el seguimiento de historias clinicas.</p>
          </div>
        </div>
      ) : (
        <div className="hc-table-wrapper">
          <table className="hc-table">
            <thead>
              <tr>
                <th>Codigo</th>
                <th>Paciente</th>
                <th>Documento</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Solicitado por</th>
                <th style={{ width: '80px' }}></th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(sol => (
                <tr key={sol.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/solicitud/${sol.id}`)}>
                  <td className="hc-table-cell-mono">SOL-{String(sol.id).padStart(4, '0')}</td>
                  <td className="hc-table-cell-primary">{sol.paciente_detalle?.apellidos} {sol.paciente_detalle?.nombres}</td>
                  <td>{sol.paciente_detalle?.numero_documento}</td>
                  <td>
                    <span className={`hc-badge hc-badge-${sol.estado.toLowerCase()}`}>
                      <span className="hc-badge-dot" />
                      {estadoLabels[sol.estado] || sol.estado}
                    </span>
                  </td>
                  <td>{new Date(sol.fecha_solicitud).toLocaleDateString('es-CO')}</td>
                  <td>{sol.solicitado_por_detalle?.nombre_completo}</td>
                  <td>
                    <button className="hc-btn hc-btn-ghost hc-btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/solicitud/${sol.id}`) }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
