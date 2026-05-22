import { useState, useEffect } from 'react'
import api from '../services/api'

const TIPOS_DOC_FALLBACK = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'RC', label: 'Registro Civil' },
  { value: 'PPT', label: 'Permiso de Protección Temporal' },
]

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const [tiposDocIdentidad, setTiposDocIdentidad] = useState(TIPOS_DOC_FALLBACK)
  const emptyForm = {
    tipo_documento: 'CC',
    numero_documento: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    telefono: '',
    telefono_pertenece_a: 'paciente',
    nombre_autorizado: '',
    email: '',
  }
  const [form, setForm] = useState(emptyForm)

  const cargar = async () => {
    const res = await api.get('/pacientes/')
    setPacientes(res.data.results || res.data)
  }

  useEffect(() => { cargar() }, [])

  useEffect(() => {
    api.get('/solicitudes/tipos-doc-identidad/', { params: { activo: 'true' } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
        if (data.length > 0) {
          setTiposDocIdentidad(data.map((t) => ({ value: t.codigo, label: t.nombre })))
        }
      })
      .catch(() => { /* mantener fallback */ })
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const data = { ...form }
      if (!data.fecha_nacimiento) delete data.fecha_nacimiento
      if (!data.telefono) {
        data.telefono_pertenece_a = ''
        data.nombre_autorizado = ''
      } else if (data.telefono_pertenece_a !== 'autorizado') {
        data.nombre_autorizado = ''
      }
      await api.post('/pacientes/', data)
      setShowModal(false)
      setForm(emptyForm)
      cargar()
    } catch (err) {
      const errData = err.response?.data
      if (errData?.numero_documento) {
        setError('Ya existe un paciente con ese numero de documento')
      } else {
        setError('Error al registrar paciente')
      }
    }
  }

  return (
    <>
      <div className="hc-page-header">
        <div>
          <h1 className="hc-page-title">Pacientes</h1>
          <p className="hc-page-subtitle">Registro de pacientes del sistema</p>
        </div>
        <button className="hc-btn hc-btn-success" onClick={() => setShowModal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Nuevo Paciente
        </button>
      </div>

      {pacientes.length === 0 ? (
        <div className="hc-table-wrapper">
          <div className="hc-empty-state">
            <div className="hc-empty-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <p className="hc-empty-title">No hay pacientes registrados</p>
            <p className="hc-empty-text">Registra un paciente para poder crear solicitudes de historial clinico.</p>
          </div>
        </div>
      ) : (
        <div className="hc-table-wrapper">
          <table className="hc-table">
            <thead>
              <tr>
                <th>Documento</th>
                <th>Tipo</th>
                <th>Nombres</th>
                <th>Apellidos</th>
                <th>Contacto</th>
                <th>Registro</th>
              </tr>
            </thead>
            <tbody>
              {pacientes.map(p => (
                <tr key={p.id}>
                  <td className="hc-table-cell-mono">{p.numero_documento}</td>
                  <td><span className="hc-badge hc-badge-entregada">{p.tipo_documento}</span></td>
                  <td className="hc-table-cell-primary">{p.nombres}</td>
                  <td className="hc-table-cell-primary">{p.apellidos}</td>
                  <td>
                    {p.telefono ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', fontSize: '0.875rem' }}>
                        <span>{p.telefono}{p.telefono_pertenece_a === 'autorizado' ? ' (autorizado)' : ''}</span>
                        {p.telefono_pertenece_a === 'autorizado' && p.nombre_autorizado && (
                          <span style={{ color: 'var(--hc-slate-500)', fontSize: '0.8rem' }}>{p.nombre_autorizado}</span>
                        )}
                        {p.email && <span style={{ color: 'var(--hc-slate-500)', fontSize: '0.8rem' }}>{p.email}</span>}
                      </div>
                    ) : p.email ? (
                      <span style={{ fontSize: '0.875rem' }}>{p.email}</span>
                    ) : (
                      <span style={{ color: 'var(--hc-slate-400)' }}>-</span>
                    )}
                  </td>
                  <td>{new Date(p.fecha_registro).toLocaleDateString('es-CO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Custom modal */}
      {showModal && (
        <div className="hc-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div className="hc-modal">
            <div className="hc-modal-header">
              <span className="hc-modal-title">Registrar Paciente</span>
              <button className="hc-modal-close" onClick={() => setShowModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className="hc-modal-body">
              {error && (
                <div className="login-alert" style={{ marginBottom: '1rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="hc-form-group">
                    <label className="hc-form-label">Tipo de documento</label>
                    <select className="hc-form-input hc-form-select" name="tipo_documento" value={form.tipo_documento} onChange={handleChange}>
                      {tiposDocIdentidad.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="hc-form-group">
                    <label className="hc-form-label">Numero de documento</label>
                    <input className="hc-form-input" name="numero_documento" value={form.numero_documento} onChange={handleChange} required placeholder="Ej: 1234567890" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="hc-form-group">
                    <label className="hc-form-label">Nombres</label>
                    <input className="hc-form-input" name="nombres" value={form.nombres} onChange={handleChange} required placeholder="Nombres" />
                  </div>
                  <div className="hc-form-group">
                    <label className="hc-form-label">Apellidos</label>
                    <input className="hc-form-input" name="apellidos" value={form.apellidos} onChange={handleChange} required placeholder="Apellidos" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="hc-form-group">
                    <label className="hc-form-label">Fecha de nacimiento <span style={{ color: 'var(--hc-slate-400)', fontWeight: 400 }}>(opcional)</span></label>
                    <input className="hc-form-input" type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
                  </div>
                  <div className="hc-form-group">
                    <label className="hc-form-label">Correo electrónico <span style={{ color: 'var(--hc-slate-400)', fontWeight: 400 }}>(opcional)</span></label>
                    <input className="hc-form-input" type="email" name="email" value={form.email} onChange={handleChange} placeholder="paciente@correo.com" />
                  </div>
                </div>

                <div style={{ padding: '0.75rem', background: 'var(--hc-slate-50, #f8fafc)', borderRadius: '6px', border: '1px solid var(--hc-slate-200, #e2e8f0)', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--hc-slate-700, #334155)', marginBottom: '0.5rem' }}>
                    Teléfono de contacto <span style={{ color: 'var(--hc-slate-400)', fontWeight: 400 }}>(opcional)</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="hc-form-group" style={{ marginBottom: 0 }}>
                      <label className="hc-form-label">Número</label>
                      <input className="hc-form-input" name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: 3001234567" />
                    </div>
                    <div className="hc-form-group" style={{ marginBottom: 0 }}>
                      <label className="hc-form-label">¿De quién es el teléfono?</label>
                      <select className="hc-form-input hc-form-select" name="telefono_pertenece_a" value={form.telefono_pertenece_a} onChange={handleChange} disabled={!form.telefono}>
                        <option value="paciente">Del paciente</option>
                        <option value="autorizado">De persona autorizada</option>
                      </select>
                    </div>
                  </div>
                  {form.telefono && form.telefono_pertenece_a === 'autorizado' && (
                    <div className="hc-form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                      <label className="hc-form-label">Nombre de la persona autorizada</label>
                      <input className="hc-form-input" name="nombre_autorizado" value={form.nombre_autorizado} onChange={handleChange} placeholder="Ej: María Pérez (madre)" />
                    </div>
                  )}
                  <p style={{ fontSize: '0.78rem', color: 'var(--hc-slate-500, #64748b)', margin: '0.5rem 0 0 0' }}>
                    Si el paciente no dispone de teléfono, deje el campo vacío y registre el correo electrónico.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="hc-btn hc-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="hc-btn hc-btn-primary">Registrar Paciente</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
