import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

// Tipos de documento por defecto si el catálogo del backend no está disponible.
const TIPOS_DOC_FALLBACK = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PA', label: 'Pasaporte' },
  { value: 'RC', label: 'Registro Civil' },
  { value: 'PPT', label: 'Permiso de Protección Temporal' },
]

const MOTIVOS = [
  { value: 'CONTINUIDAD', label: 'Continuidad de tratamiento' },
  { value: 'EPS', label: 'Trámite EPS' },
  { value: 'JUDICIAL', label: 'Trámite Judicial' },
  { value: 'PERSONAL', label: 'Solicitud Personal' },
  { value: 'REFERENCIA', label: 'Referencia y Contrarreferencia' },
  { value: 'TUTELA', label: 'Tutela / Acción Legal' },
  { value: 'LABORAL', label: 'Trámite Laboral' },
  { value: 'OTRO', label: 'Otro' },
]

const TIPOS_TRAMITE = [
  { value: 'VENTANILLA', label: 'Ventanilla' },
  { value: 'CORREO', label: 'Correo Electrónico' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'OFICIO', label: 'Oficio' },
  { value: 'JUDICIAL', label: 'Requerimiento Judicial' },
]

function CampoSecuencia({ numero, label, requerido, ayuda, children, compacto }) {
  const size = compacto ? '30px' : '38px'
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${size} 1fr`, gap: '0.7rem', alignItems: 'start' }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--hc-brand-navy, #173A6B), var(--hc-teal-600))',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: compacto ? '0.8rem' : '0.95rem',
          letterSpacing: '0.01em',
          boxShadow: '0 2px 6px rgba(14, 37, 73, 0.25), inset 0 0 0 2px rgba(255,255,255,0.18)',
          marginTop: '4px',
          flexShrink: 0,
        }}
      >
        {numero}
      </div>
      <div style={{ minWidth: 0 }}>
        <label
          className="hc-form-label"
          style={{
            display: 'block',
            marginBottom: '0.35rem',
            fontSize: compacto ? '0.78rem' : '0.85rem',
            fontWeight: 600,
            color: 'var(--hc-slate-700)',
            letterSpacing: '0.01em',
          }}
        >
          {label}
          {requerido && <span style={{ color: '#ef4444', marginLeft: '4px', fontWeight: 700 }}>*</span>}
        </label>
        {children}
        {ayuda && (
          <p style={{ marginTop: '0.35rem', fontSize: '0.76rem', color: 'var(--hc-slate-500)', lineHeight: 1.4 }}>
            {ayuda}
          </p>
        )}
      </div>
    </div>
  )
}

function obtenerFechaActual() {
  const ahora = new Date()
  ahora.setMinutes(ahora.getMinutes() - ahora.getTimezoneOffset())
  return ahora.toISOString().slice(0, 10)
}

function separarNombreCompleto(nombreCompleto) {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean)

  if (partes.length === 0) {
    return { nombres: '', apellidos: '' }
  }

  if (partes.length === 1) {
    return { nombres: partes[0], apellidos: '' }
  }

  if (partes.length === 2) {
    return { nombres: partes[0], apellidos: partes[1] }
  }

  if (partes.length === 3) {
    return { nombres: partes.slice(0, 2).join(' '), apellidos: partes[2] }
  }

  return {
    nombres: partes.slice(0, 2).join(' '),
    apellidos: partes.slice(2).join(' '),
  }
}

export default function NuevaSolicitud() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [fechaRegistro] = useState(obtenerFechaActual())

  const [tipoDoc, setTipoDoc] = useState('CC')
  const [numDoc, setNumDoc] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [estadoBusqueda, setEstadoBusqueda] = useState(null)
  const [pacienteId, setPacienteId] = useState(null)
  const [nombrePaciente, setNombrePaciente] = useState('')
  const [pacienteLocked, setPacienteLocked] = useState(false)

  const [horaRecibo, setHoraRecibo] = useState(new Date().toTimeString().slice(0, 5))

  // La hora de recibo se actualiza automáticamente cada 30s mientras la solicitud no se haya guardado
  useEffect(() => {
    const id = setInterval(() => {
      setHoraRecibo(new Date().toTimeString().slice(0, 5))
    }, 30000)
    return () => clearInterval(id)
  }, [])
  const [documentoSolicitado, setDocumentoSolicitado] = useState('')
  const [tiposDocSolicitado, setTiposDocSolicitado] = useState([])
  const [tiposDocIdentidad, setTiposDocIdentidad] = useState(TIPOS_DOC_FALLBACK)
  const [motivoSolicitud, setMotivoSolicitud] = useState('')
  const [motivosHistoricos, setMotivosHistoricos] = useState([])

  // Cargar catálogo de tipos de documento solicitado
  useEffect(() => {
    api.get('/solicitudes/tipos-documento/', { params: { activo: 'true' } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data.results || [])
        setTiposDocSolicitado(data)
      })
      .catch(() => setTiposDocSolicitado([]))
  }, [])

  // Cargar catálogo de tipos de documento de identidad (administrable)
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

  // Cargar motivos previamente usados (para autocompletado del campo 7)
  useEffect(() => {
    api.get('/solicitudes/motivos-historicos/')
      .then((res) => setMotivosHistoricos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMotivosHistoricos([]))
  }, [])
  // tiene_autorizado se selecciona en la pantalla de detalle (campos 11-20)

  const limpiarBusqueda = () => {
    setEstadoBusqueda(null)
    setPacienteId(null)
    setPacienteLocked(false)
    setNombrePaciente('')
    setError('')
  }

  const buscarPaciente = async () => {
    if (!numDoc.trim()) {
      setError('Ingrese el número de identificación antes de autocompletar')
      return
    }

    setBuscando(true)
    setEstadoBusqueda(null)
    setError('')
    setPacienteId(null)
    setPacienteLocked(false)
    setNombrePaciente('')

    try {
      const res = await api.get('/pacientes/consultar-cedula/', { params: { tipo: tipoDoc, numero: numDoc.trim() } })
      const { encontrado, fuente, paciente, info_publica } = res.data

      if (encontrado && fuente === 'local') {
        setPacienteId(paciente.id)
        setNombrePaciente(`${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim())
        setPacienteLocked(true)
        setEstadoBusqueda(info_publica ? 'encontrado_local_con_info' : 'encontrado_local')
      } else if (encontrado && fuente === 'entidades_publicas') {
        const nombre = `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim()
        setNombrePaciente(nombre)
        setPacienteLocked(false)
        setEstadoBusqueda(nombre ? 'encontrado_publico' : 'encontrado_sin_nombre')
      } else {
        setPacienteLocked(false)
        setEstadoBusqueda('no_encontrado')
      }
    } catch {
      setPacienteLocked(false)
      setEstadoBusqueda('no_encontrado')
    } finally {
      setBuscando(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!estadoBusqueda) {
      setError('Primero ingrese la identificación y pulse Autocompletar')
      return
    }

    if (!nombrePaciente.trim()) {
      setError('Complete el nombre del paciente')
      return
    }

    if (nombrePaciente.trim().split(/\s+/).length < 2) {
      setError('Ingrese nombres y apellidos del paciente')
      return
    }

    if (!documentoSolicitado) {
      setError('Seleccione el documento solicitado')
      return
    }

    if (!motivoSolicitud.trim()) {
      setError('Escriba el motivo de la solicitud')
      return
    }

    setEnviando(true)

    try {
      let idPaciente = pacienteId

      if (!idPaciente) {
        const { nombres, apellidos } = separarNombreCompleto(nombrePaciente)
        const resPac = await api.post('/pacientes/', {
          tipo_documento: tipoDoc,
          numero_documento: numDoc.trim(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
        })
        idPaciente = resPac.data.id
      }

      const resSolicitud = await api.post('/solicitudes/', {
        paciente: idPaciente,
        hora_recibo: horaRecibo || null,
        documento_solicitado: documentoSolicitado,
        motivo_solicitud: motivoSolicitud.trim(),
        tiene_autorizado: false,
      })
      navigate(`/solicitud/${resSolicitud.data.id}`)
    } catch (err) {
      const data = err.response?.data
      if (data && typeof data === 'object') {
        setError(Object.entries(data).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | '))
      } else { setError('Error al crear la solicitud. Verifique los datos.') }
    } finally { setEnviando(false) }
  }

  const badgeConfig = {
    encontrado_local: { bg: '#dcfce7', color: '#166534', texto: 'Paciente encontrado en la base local. El nombre quedó cargado automáticamente.' },
    encontrado_local_con_info: { bg: '#dcfce7', color: '#166534', texto: 'Paciente encontrado en la base local. También se consultaron entidades públicas.' },
    encontrado_publico: { bg: '#dbeafe', color: '#1e40af', texto: 'Datos encontrados en entidades públicas. Verifique el nombre antes de guardar.' },
    encontrado_sin_nombre: { bg: '#fefce8', color: '#854d0e', texto: 'Se consultaron entidades públicas pero no se pudo obtener el nombre. Complete el nombre manualmente.' },
    no_encontrado: { bg: '#fef2f2', color: '#991b1b', texto: 'No se encontraron datos en ninguna fuente. Complete el nombre manualmente.' },
  }

  const readonlyStyle = {
    background: 'var(--hc-slate-50)',
    color: 'var(--hc-slate-500)',
    cursor: 'not-allowed',
  }

  const inputLockedStyle = pacienteLocked ? readonlyStyle : {}

  return (
    <>
      <button className="hc-back" onClick={() => navigate('/')}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver a solicitudes
      </button>

      <div className="hc-page-header">
        <div>
          <h1 className="hc-page-title">Nueva Solicitud</h1>
          <p className="hc-page-subtitle">
            Complete la parte inicial. Al guardar, pasará al detalle para terminar los campos restantes.
          </p>
        </div>
      </div>

      {error && (
        <div className="login-alert" style={{ marginBottom: '1rem' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="hc-card" style={{ marginBottom: '1.25rem', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 10px 30px -10px rgba(14,37,73,0.08)' }}>
          <div className="hc-card-header" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, letterSpacing: '0.01em' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--hc-brand-navy, #173A6B), var(--hc-teal-600))',
              color: 'white',
              boxShadow: '0 2px 6px rgba(14,37,73,0.25)',
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
            </span>
            Secuencia de Registro de Ventanilla
          </div>
          <div className="hc-card-body" style={{ display: 'grid', gap: '1rem' }}>

            {/* Auditoría: fecha + hora en una sola fila, no editables, compactos */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1px 1fr',
              gap: '1rem',
              padding: '0.75rem 1.1rem',
              background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.10), rgba(23, 58, 107, 0.06))',
              border: '1px solid rgba(23, 58, 107, 0.12)',
              borderRadius: '12px',
              fontSize: '0.85rem',
              alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.7)', color: 'var(--hc-brand-navy, #173A6B)',
                  boxShadow: 'inset 0 0 0 1px rgba(23,58,107,0.10)',
                  flexShrink: 0,
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--hc-slate-500)', fontWeight: 600 }}>Fecha del registro</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--hc-slate-800, #1e293b)', fontVariantNumeric: 'tabular-nums' }}>{fechaRegistro}</strong>
                </div>
              </div>
              <div style={{ width: '1px', height: '38px', background: 'rgba(23,58,107,0.12)', justifySelf: 'center' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.7)', color: 'var(--hc-brand-navy, #173A6B)',
                  boxShadow: 'inset 0 0 0 1px rgba(23,58,107,0.10)',
                  flexShrink: 0,
                }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--hc-slate-500)', fontWeight: 600 }}>
                    Hora de recibo
                    <span style={{ marginLeft: '0.4rem', fontSize: '0.65rem', fontStyle: 'italic', color: 'var(--hc-slate-400)', textTransform: 'none', letterSpacing: 0 }}>(automático)</span>
                  </span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--hc-slate-800, #1e293b)', fontVariantNumeric: 'tabular-nums' }}>{horaRecibo}</strong>
                </div>
              </div>
            </div>

            {/* Tipo + Número documento en una sola fila */}
            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '0.85rem', alignItems: 'start' }}>
              <CampoSecuencia numero="1" label="Tipo de documento" requerido compacto>
                <select
                  className="hc-form-input hc-form-select"
                  value={tipoDoc}
                  onChange={(e) => {
                    setTipoDoc(e.target.value)
                    limpiarBusqueda()
                  }}
                >
                  {tiposDocIdentidad.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </CampoSecuencia>

              <CampoSecuencia numero="2" label="Número de documento" requerido compacto ayuda="Pulse Autocompletar para consultar entidades públicas o base local.">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    className="hc-form-input"
                    type="text"
                    placeholder="Ej: 1015425322"
                    value={numDoc}
                    onChange={(e) => {
                      setNumDoc(e.target.value)
                      limpiarBusqueda()
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscarPaciente())}
                    style={{ letterSpacing: '0.05em' }}
                  />
                  <button type="button" className="hc-btn hc-btn-primary" onClick={buscarPaciente} disabled={buscando} style={{ minWidth: '140px' }}>
                    {buscando ? (
                      <><div className="hc-loading-spinner" style={{ width: '14px', height: '14px', marginRight: '6px' }} />Consultando...</>
                    ) : (
                      <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Autocompletar</>
                    )}
                  </button>
                </div>
              </CampoSecuencia>
            </div>

            {estadoBusqueda && (
              <div style={{ background: badgeConfig[estadoBusqueda].bg, color: badgeConfig[estadoBusqueda].color, border: `1px solid ${badgeConfig[estadoBusqueda].color}30`, borderRadius: '8px', padding: '0.55rem 0.85rem', fontSize: '0.85rem', fontWeight: 500 }}>
                {badgeConfig[estadoBusqueda].texto}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.85rem', alignItems: 'start' }}>
              <CampoSecuencia numero="3" label="Nombre del paciente" requerido compacto>
                <input
                  className="hc-form-input"
                  type="text"
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  readOnly={pacienteLocked}
                  style={inputLockedStyle}
                  placeholder="Nombres y apellidos completos"
                />
              </CampoSecuencia>

              <CampoSecuencia numero="4" label="Documento solicitado" requerido compacto>
                <select className="hc-form-input hc-form-select" value={documentoSolicitado} onChange={(e) => setDocumentoSolicitado(e.target.value)} required>
                  <option value="">-- Seleccione --</option>
                  {tiposDocSolicitado.map((d) => <option key={d.id} value={d.nombre}>{d.nombre}</option>)}
                </select>
              </CampoSecuencia>
            </div>

            <CampoSecuencia numero="5" label="Motivo de la solicitud" ayuda="Escríbalo libre. La flecha (▼) muestra motivos ya usados antes." requerido compacto>
              <input
                className="hc-form-input"
                list="motivos-historicos-list"
                value={motivoSolicitud}
                onChange={(e) => setMotivoSolicitud(e.target.value)}
                placeholder="Ej: Trámite EPS, Tutela, Pensión, Continuidad de tratamiento..."
                maxLength={200}
                required
              />
              <datalist id="motivos-historicos-list">
                {motivosHistoricos.map((m) => <option key={m} value={m} />)}
              </datalist>
            </CampoSecuencia>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" className="hc-btn hc-btn-secondary" onClick={() => navigate('/')} disabled={enviando}>Cancelar</button>
              <button type="submit" className="hc-btn hc-btn-primary" disabled={enviando || !estadoBusqueda} style={{ minWidth: '160px' }}>
                {enviando ? (
                  <><div className="hc-loading-spinner" style={{ width: '16px', height: '16px', marginRight: '6px' }} />Guardando...</>
                ) : (
                  <><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Registrar Solicitud</>
                )}
              </button>
            </div>
          </div>
        </div>

      </form>
    </>
  )
}

