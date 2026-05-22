import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const estadoLabels = { SOLICITADA: 'Solicitada', EN_BUSQUEDA: 'En búsqueda', LISTA: 'Lista', ENTREGADA: 'Entregada' }
const estados = ['SOLICITADA', 'EN_BUSQUEDA', 'LISTA', 'ENTREGADA']
// Los listados de parentescos y tipos de documento de identidad provienen
// del backend (catálogos administrables). Ver /parentescos y /tipos-doc-identidad.
const siguienteEstado = {
  SOLICITADA: { estado: 'EN_BUSQUEDA', label: 'Tomar busqueda', icon: 'search' },
  EN_BUSQUEDA: { estado: 'LISTA', label: 'Marcar como lista', icon: 'check' },
  LISTA: { estado: 'ENTREGADA', label: 'Registrar entrega', icon: 'send' },
}

function DataRow({ label, value }) {
  if (!value && value !== false && value !== 0) return null
  return (
    <div className="hc-data-row">
      <span className="hc-data-label">{label}</span>
      <span className="hc-data-value">{value}</span>
    </div>
  )
}

// Convierte una hora "HH:MM:SS" (formato 24h del backend) a formato 12h "h:mm:ss a. m./p. m."
function formatearHora12h(hora) {
  if (!hora) return null
  const partes = String(hora).split(':')
  if (partes.length < 2) return hora
  const h = parseInt(partes[0], 10)
  const m = partes[1]
  const s = partes[2] || '00'
  if (Number.isNaN(h)) return hora
  const sufijo = h >= 12 ? 'p. m.' : 'a. m.'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${m}:${s} ${sufijo}`
}

function MedioChip({ activo, label }) {
  if (!activo) return null
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f0fdfa', color: 'var(--hc-teal-700)', border: '1px solid var(--hc-teal-200)', borderRadius: '20px', padding: '3px 10px', fontSize: '0.8rem', fontWeight: 500, marginRight: '6px' }}>
      ✓ {label}
    </span>
  )
}

export default function DetalleSolicitud() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [solicitud, setSolicitud] = useState(null)
  const [complementario, setComplementario] = useState({
    tiene_autorizado: false,
    nombre_autorizado: '',
    parentesco_autorizado: '',
    tipo_doc_autorizado: 'CC',
    numero_doc_autorizado: '',
    medio_entrega_fisico: false,
    medio_entrega_correo: false,
    medio_entrega_whatsapp: false,
    observaciones: '',
  })
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [buscandoAutorizado, setBuscandoAutorizado] = useState(false)
  const [badgeAutorizado, setBadgeAutorizado] = useState(null)
  const [enviandoHC, setEnviandoHC] = useState(false)
  // Destinatarios separados según el medio (16/17/18)
  const [correoDest, setCorreoDest] = useState('')
  const [whatsappDest, setWhatsappDest] = useState('')
  // Carga manual del PDF generado por Hosvital
  const [subiendoHC, setSubiendoHC] = useState(false)
  const [eliminandoHC, setEliminandoHC] = useState(false)
  const [dragActivo, setDragActivo] = useState(false)
  const fileInputRef = useRef(null)
  // Catálogos administrables cargados desde el backend
  const [parentescosCat, setParentescosCat] = useState([])
  const [tiposDocIdentidadCat, setTiposDocIdentidadCat] = useState([])

  const cargar = async () => {
    const res = await api.get(`/solicitudes/${id}/`)
    setSolicitud(res.data)
    setComplementario({
      tiene_autorizado: res.data.tiene_autorizado || false,
      nombre_autorizado: res.data.nombre_autorizado || '',
      parentesco_autorizado: res.data.parentesco_autorizado || '',
      tipo_doc_autorizado: res.data.tipo_doc_autorizado || 'CC',
      numero_doc_autorizado: res.data.numero_doc_autorizado || '',
      medio_entrega_fisico: res.data.medio_entrega_fisico || false,
      medio_entrega_correo: res.data.medio_entrega_correo || false,
      medio_entrega_whatsapp: res.data.medio_entrega_whatsapp || false,
      observaciones: res.data.observaciones || '',
    })
  }

  useEffect(() => { cargar() }, [id])

  useEffect(() => {
    let cancelado = false
    Promise.all([
      api.get('/solicitudes/parentescos/', { params: { activo: 'true' } }).catch(() => ({ data: [] })),
      api.get('/solicitudes/tipos-doc-identidad/', { params: { activo: 'true' } }).catch(() => ({ data: [] })),
    ]).then(([pRes, tRes]) => {
      if (cancelado) return
      const pData = Array.isArray(pRes.data) ? pRes.data : (pRes.data?.results || [])
      const tData = Array.isArray(tRes.data) ? tRes.data : (tRes.data?.results || [])
      setParentescosCat(pData)
      setTiposDocIdentidadCat(tData)
    })
    return () => { cancelado = true }
  }, [])

  const actualizarComplementario = (campo, valor) => {
    setComplementario((prev) => ({ ...prev, [campo]: valor }))
  }

  const buscarAutorizado = async () => {
    const numero = complementario.numero_doc_autorizado.trim()
    if (!numero) { setError('Ingrese el número de documento del autorizado'); return }

    setBuscandoAutorizado(true)
    setBadgeAutorizado(null)
    try {
      const res = await api.get('/pacientes/consultar-cedula/', {
        params: { tipo: complementario.tipo_doc_autorizado, numero },
      })
      const { encontrado, paciente } = res.data
      if (encontrado && paciente) {
        const nombre = `${paciente.nombres || ''} ${paciente.apellidos || ''}`.trim()
        if (nombre) {
          actualizarComplementario('nombre_autorizado', nombre)
          setBadgeAutorizado({ bg: '#dcfce7', color: '#166534', texto: 'Nombre del autorizado encontrado y cargado.' })
        } else {
          setBadgeAutorizado({ bg: '#fefce8', color: '#854d0e', texto: 'Documento encontrado pero sin nombre. Complételo manualmente.' })
        }
      } else {
        setBadgeAutorizado({ bg: '#fef2f2', color: '#991b1b', texto: 'No se encontraron datos. Complete el nombre manualmente.' })
      }
    } catch {
      setBadgeAutorizado({ bg: '#fef2f2', color: '#991b1b', texto: 'Error al consultar. Complete el nombre manualmente.' })
    } finally {
      setBuscandoAutorizado(false)
    }
  }

  const guardarComplementario = async () => {
    setError('')
    setExito('')

    if (complementario.tiene_autorizado && !complementario.nombre_autorizado.trim()) {
      setError('Si marcó autorizado, debe ingresar su nombre')
      return
    }

    if (complementario.tiene_autorizado && !complementario.parentesco_autorizado) {
      setError('Si marcó autorizado, debe seleccionar parentesco')
      return
    }

    if (complementario.tiene_autorizado && !complementario.numero_doc_autorizado.trim()) {
      setError('Si marcó autorizado, debe ingresar documento del autorizado')
      return
    }

    const payload = {
      tiene_autorizado: complementario.tiene_autorizado,
      nombre_autorizado: complementario.tiene_autorizado ? complementario.nombre_autorizado.trim() : '',
      parentesco_autorizado: complementario.tiene_autorizado ? complementario.parentesco_autorizado : '',
      tipo_doc_autorizado: complementario.tiene_autorizado ? complementario.tipo_doc_autorizado : '',
      numero_doc_autorizado: complementario.tiene_autorizado ? complementario.numero_doc_autorizado.trim() : '',
      medio_entrega_fisico: complementario.medio_entrega_fisico,
      medio_entrega_correo: complementario.medio_entrega_correo,
      medio_entrega_whatsapp: complementario.medio_entrega_whatsapp,
      observaciones: complementario.observaciones.trim(),
    }

    try {
      const res = await api.patch(`/solicitudes/${id}/`, payload)
      setSolicitud(res.data)
      setExito('Campos complementarios (11-20) guardados correctamente')
    } catch {
      setError('Error al guardar los campos complementarios')
    }
  }

  const subirHC = async (archivo) => {
    setError(''); setExito('')
    if (!archivo) return
    if (archivo.type && archivo.type !== 'application/pdf' && !archivo.name.toLowerCase().endsWith('.pdf')) {
      setError('El archivo debe ser un PDF.')
      return
    }
    if (archivo.size > 25 * 1024 * 1024) {
      setError('El archivo supera el tamaño máximo de 25 MB.')
      return
    }
    const formData = new FormData()
    formData.append('archivo', archivo)
    setSubiendoHC(true)
    try {
      const res = await api.post(`/solicitudes/${id}/subir-hc/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setSolicitud(res.data)
      setExito('Historia clínica cargada correctamente.')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir el archivo.')
    } finally {
      setSubiendoHC(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const eliminarHC = async () => {
    setError(''); setExito('')
    if (!window.confirm('¿Eliminar el PDF cargado? Podrá subir uno nuevo después.')) return
    setEliminandoHC(true)
    try {
      const res = await api.delete(`/solicitudes/${id}/eliminar-hc/`)
      setSolicitud(res.data)
      setExito('Archivo eliminado. Puede cargar uno nuevo.')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar el archivo.')
    } finally {
      setEliminandoHC(false)
    }
  }

  const descargarHC = () => {
    if (solicitud?.archivo_hc_url) {
      window.open(solicitud.archivo_hc_url, '_blank')
    }
  }

  const enviarHC = async (canal, destinatario) => {
    setError(''); setExito('')
    const dest = (destinatario || '').trim()
    if (!dest) {
      setError(canal === 'CORREO'
        ? 'Indique el correo del destinatario'
        : 'Indique el número de WhatsApp del destinatario')
      return
    }
    setEnviandoHC(true)
    try {
      // Guardar primero los medios marcados (16/17/18) para que queden registrados
      try {
        await api.patch(`/solicitudes/${id}/`, {
          medio_entrega_fisico: complementario.medio_entrega_fisico,
          medio_entrega_correo: complementario.medio_entrega_correo,
          medio_entrega_whatsapp: complementario.medio_entrega_whatsapp,
        })
      } catch { /* no bloquear el envío si falla */ }

      const res = await api.post(`/solicitudes/${id}/enviar-hc/`, {
        canal,
        destinatario: dest,
      })
      setSolicitud(res.data)
      setExito(res.data.envio_mensaje || `Historia clínica enviada por ${canal.toLowerCase()}.`)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la historia clínica.')
    } finally {
      setEnviandoHC(false)
    }
  }

  const imprimirHC = () => {
    if (!solicitud?.archivo_hc_url) return
    const w = window.open(solicitud.archivo_hc_url, '_blank')
    if (w) {
      // El navegador mostrará el visor de PDF; el usuario pulsa imprimir desde allí.
      // Algunos navegadores permiten autoprint con focus + print:
      try { w.addEventListener('load', () => w.print()) } catch { /* ignore */ }
    }
  }

  const cambiarEstado = async () => {
    setError('')
    setExito('')
    const siguiente = siguienteEstado[solicitud.estado]
    if (!siguiente) return

    // Antes de cambiar a ENTREGADA, guardar los campos 11-20 automáticamente
    if (siguiente.estado === 'ENTREGADA') {
      if (complementario.tiene_autorizado && !complementario.nombre_autorizado.trim()) {
        setError('Si marcó autorizado, debe ingresar su nombre antes de entregar.')
        return
      }
      if (complementario.tiene_autorizado && !complementario.parentesco_autorizado) {
        setError('Si marcó autorizado, debe seleccionar parentesco antes de entregar.')
        return
      }
      if (complementario.tiene_autorizado && !complementario.numero_doc_autorizado.trim()) {
        setError('Si marcó autorizado, debe ingresar el documento del autorizado.')
        return
      }
      try {
        await api.patch(`/solicitudes/${id}/`, {
          tiene_autorizado: complementario.tiene_autorizado,
          nombre_autorizado: complementario.tiene_autorizado ? complementario.nombre_autorizado.trim() : '',
          parentesco_autorizado: complementario.tiene_autorizado ? complementario.parentesco_autorizado : '',
          tipo_doc_autorizado: complementario.tiene_autorizado ? complementario.tipo_doc_autorizado : '',
          numero_doc_autorizado: complementario.tiene_autorizado ? complementario.numero_doc_autorizado.trim() : '',
          medio_entrega_fisico: complementario.medio_entrega_fisico,
          medio_entrega_correo: complementario.medio_entrega_correo,
          medio_entrega_whatsapp: complementario.medio_entrega_whatsapp,
          observaciones: complementario.observaciones.trim(),
        })
      } catch {
        setError('Error guardando los campos complementarios antes de entregar.')
        return
      }
    }

    const data = { estado: siguiente.estado }
    if (siguiente.estado === 'ENTREGADA') {
      const receptor = complementario.tiene_autorizado && complementario.nombre_autorizado
        ? complementario.nombre_autorizado.trim()
        : `${solicitud.paciente_detalle?.nombres || ''} ${solicitud.paciente_detalle?.apellidos || ''}`.trim()
      data.entregado_a = receptor
    }
    try {
      await api.patch(`/solicitudes/${id}/cambiar-estado/`, data)
      if (siguiente.estado === 'ENTREGADA') {
        navigate('/')
      } else {
        const res2 = await api.get(`/solicitudes/${id}/`)
        setSolicitud(res2.data)
        setExito(`Estado cambiado a ${estadoLabels[siguiente.estado]}`)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar estado')
    }
  }

  if (!solicitud) {
    return (
      <div className="hc-loading" style={{ minHeight: '40vh' }}>
        <div className="hc-loading-spinner" />
        <span className="hc-loading-text">Cargando solicitud...</span>
      </div>
    )
  }

  const siguiente = siguienteEstado[solicitud.estado]
  const estadoIdx = estados.indexOf(solicitud.estado)
  const esEntregada = solicitud.estado === 'ENTREGADA'
  const locked = esEntregada ? { background: 'var(--hc-slate-50)', cursor: 'not-allowed' } : {}

  return (
    <>
      <button className="hc-back" onClick={() => navigate('/')}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Volver a solicitudes
      </button>

      <div className="hc-page-header">
        <div>
          <h1 className="hc-page-title">
            Solicitud <span style={{ color: 'var(--hc-teal-600)' }}>SOL-{String(solicitud.id).padStart(4, '0')}</span>
          </h1>
          <p className="hc-page-subtitle">Detalle y seguimiento de la solicitud</p>
        </div>
        <span className={`hc-badge hc-badge-${solicitud.estado.toLowerCase()}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
          <span className="hc-badge-dot" />
          {estadoLabels[solicitud.estado]}
        </span>
      </div>

      {error && <div className="login-alert" style={{ marginBottom: '1rem' }}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>{error}</div>}
      {exito && <div className="login-alert hc-alert-success" style={{ marginBottom: '1rem' }}><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>{exito}</div>}

      {/* Workflow progress */}
      <div className="hc-card" style={{ marginBottom: '1.25rem' }}>
        <div className="hc-card-body-compact">
          <div className="hc-workflow">
            {estados.map((est, i) => (
              <div key={est} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`hc-workflow-step ${i < estadoIdx ? 'completed' : ''} ${i === estadoIdx ? 'current' : ''}`}>
                  <span className="hc-workflow-step-dot" />
                  {estadoLabels[est]}
                </div>
                {i < estados.length - 1 && <div className={`hc-workflow-connector ${i < estadoIdx ? 'done' : ''}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="hc-detail-grid">
        {/* Paciente */}
        <div className="hc-card">
          <div className="hc-card-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Datos del Paciente
          </div>
          <div className="hc-card-body">
            <DataRow label="Nombre" value={`${solicitud.paciente_detalle?.apellidos} ${solicitud.paciente_detalle?.nombres}`} />
            <DataRow label="Documento" value={`${solicitud.paciente_detalle?.tipo_documento} ${solicitud.paciente_detalle?.numero_documento}`} />
            <DataRow label="Teléfono" value={solicitud.paciente_detalle?.telefono || 'N/A'} />
            <DataRow label="Fecha nacimiento" value={solicitud.paciente_detalle?.fecha_nacimiento || null} />
          </div>
        </div>

        {/* Cronología */}
        <div className="hc-card">
          <div className="hc-card-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Cronología
          </div>
          <div className="hc-card-body">
            <DataRow label="Fecha solicitud" value={new Date(solicitud.fecha_solicitud).toLocaleString('es-CO')} />
            <DataRow label="Hora envío" value={formatearHora12h(solicitud.hora_envio)} />
            <DataRow label="Registrado por" value={solicitud.solicitado_por_detalle?.nombre_completo} />
            {solicitud.responsable_busqueda_detalle && <DataRow label="Responsable búsqueda" value={solicitud.responsable_busqueda_detalle.nombre_completo} />}
            {solicitud.fecha_lista && <DataRow label="Fecha lista" value={new Date(solicitud.fecha_lista).toLocaleString('es-CO')} />}
            {solicitud.fecha_entrega && <DataRow label="Fecha entrega" value={new Date(solicitud.fecha_entrega).toLocaleString('es-CO')} />}
            {solicitud.funcionario_entrega_detalle && <DataRow label="Funcionario entrega" value={solicitud.funcionario_entrega_detalle.nombre_completo} />}
            {solicitud.entregado_a && <DataRow label="Entregado a" value={solicitud.entregado_a} />}
          </div>
        </div>
      </div>

      {/* Detalle de la solicitud */}
      <div className="hc-card" style={{ marginBottom: '1.25rem' }}>
        <div className="hc-card-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Detalle de la Solicitud
        </div>
        <div className="hc-card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
            {[
              { label: 'Documento solicitado', value: solicitud.documento_solicitado_display || solicitud.documento_solicitado, icon: (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>) },
              { label: 'Motivo de solicitud', value: solicitud.motivo_solicitud_display || solicitud.motivo_solicitud || solicitud.motivo, icon: (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>) },
            ].filter((f) => f.value).map((f) => (
              <div key={f.label} style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.10), rgba(23, 58, 107, 0.04))', border: '1px solid rgba(23, 58, 107, 0.10)', borderRadius: '12px', padding: '0.7rem 0.9rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.75)', boxShadow: 'inset 0 0 0 1px rgba(23, 58, 107, 0.10)', color: 'var(--hc-slate-600)', flexShrink: 0 }}>{f.icon}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--hc-slate-500)' }}>{f.label}</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--hc-slate-700)', wordBreak: 'break-word' }}>{f.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Medios de entrega */}
          {(solicitud.medio_entrega_fisico || solicitud.medio_entrega_correo || solicitud.medio_entrega_whatsapp) && (
            <div style={{ marginTop: '0.85rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--hc-slate-500)', marginBottom: '0.4rem' }}>Medio de entrega</div>
              <MedioChip activo={solicitud.medio_entrega_fisico} label="Físico" />
              <MedioChip activo={solicitud.medio_entrega_correo} label="Correo" />
              <MedioChip activo={solicitud.medio_entrega_whatsapp} label="WhatsApp" />
            </div>
          )}

          {solicitud.observaciones && (
            <div style={{ marginTop: '0.85rem', background: '#fff', border: '1px solid rgba(23, 58, 107, 0.10)', borderLeft: '3px solid var(--hc-teal-500)', borderRadius: '10px', padding: '0.7rem 0.9rem' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--hc-slate-500)', marginBottom: '0.25rem' }}>Observaciones</div>
              <p style={{ color: 'var(--hc-slate-700)', margin: 0, lineHeight: 1.55, fontSize: '0.9rem' }}>{solicitud.observaciones}</p>
            </div>
          )}
        </div>
      </div>

      {/* Autorizado (si aplica) */}
      {solicitud.tiene_autorizado && (
        <div className="hc-card" style={{ marginBottom: '1.25rem' }}>
          <div className="hc-card-header">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Tercero Autorizado
          </div>
          <div className="hc-card-body">
            <DataRow label="Nombre" value={solicitud.nombre_autorizado} />
            <DataRow label="Parentesco" value={solicitud.parentesco_autorizado} />
            <DataRow label="Documento" value={`${solicitud.tipo_doc_autorizado} ${solicitud.numero_doc_autorizado}`} />
          </div>
        </div>
      )}

      <div className="hc-card" style={{ marginBottom: '1.25rem' }}>
        <div className="hc-card-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          Campos complementarios (11 a 19)
          {esEntregada && <span style={{ marginLeft: '0.75rem', fontSize: '0.78rem', color: 'var(--hc-slate-400)', fontWeight: 400 }}>(Solo lectura — solicitud entregada)</span>}
        </div>
        <div className="hc-card-body">
          <div className="hc-form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="hc-form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--hc-brand-navy, #173A6B), var(--hc-teal-600))', color: '#fff', fontSize: '0.72rem', fontWeight: 700, boxShadow: '0 2px 5px rgba(14,37,73,0.25), inset 0 0 0 2px rgba(255,255,255,0.18)' }}>10</span>
              Tipo de solicitud
            </label>
            <select
              className="hc-form-input hc-form-select"
              value={complementario.tiene_autorizado ? 'SI' : 'NO'}
              onChange={(e) => actualizarComplementario('tiene_autorizado', e.target.value === 'SI')}
              disabled={esEntregada}
              style={esEntregada ? locked : {}}
            >
              <option value="NO">No — Reclama el paciente</option>
              <option value="SI">Sí — Reclama un tercero autorizado</option>
            </select>
          </div>

          {complementario.tiene_autorizado && (
            <div style={{ background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.08), rgba(23, 58, 107, 0.04))', border: '1px solid rgba(23, 58, 107, 0.12)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--hc-slate-500)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Datos del tercero autorizado</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="hc-form-group">
              <label className="hc-form-label">11. Documento (autorizado) - tipo</label>
              <select
                className="hc-form-input hc-form-select"
                value={complementario.tipo_doc_autorizado}
                onChange={(e) => actualizarComplementario('tipo_doc_autorizado', e.target.value)}
                disabled={esEntregada || !complementario.tiene_autorizado}
                style={esEntregada || !complementario.tiene_autorizado ? locked : {}}
              >
                {tiposDocIdentidadCat.map((td) => (
                  <option key={td.id} value={td.codigo}>{td.nombre} ({td.codigo})</option>
                ))}
                {/* Preservar el valor histórico si fue desactivado */}
                {complementario.tipo_doc_autorizado &&
                  !tiposDocIdentidadCat.some((td) => td.codigo === complementario.tipo_doc_autorizado) && (
                    <option value={complementario.tipo_doc_autorizado}>{complementario.tipo_doc_autorizado}</option>
                  )}
              </select>
            </div>
            <div className="hc-form-group">
              <label className="hc-form-label">12. Documento (autorizado) - No.</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  className="hc-form-input"
                  value={complementario.numero_doc_autorizado}
                  onChange={(e) => actualizarComplementario('numero_doc_autorizado', e.target.value)}
                  disabled={esEntregada || !complementario.tiene_autorizado}
                  placeholder="Número de identificación"
                  onKeyDown={(e) => e.key === 'Enter' && !esEntregada && complementario.tiene_autorizado && (e.preventDefault(), buscarAutorizado())}
                  style={esEntregada || !complementario.tiene_autorizado ? locked : {}}
                />
                {!esEntregada && (
                  <button
                    type="button"
                    className="hc-btn hc-btn-primary"
                    onClick={buscarAutorizado}
                    disabled={!complementario.tiene_autorizado || buscandoAutorizado}
                    style={{ minWidth: '130px', fontSize: '0.82rem' }}
                  >
                    {buscandoAutorizado ? (
                      <><div className="hc-loading-spinner" style={{ width: '14px', height: '14px', marginRight: '5px' }} />Buscando...</>
                    ) : (
                      <><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '5px' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>Autocompletar</>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="hc-form-group">
              <label className="hc-form-label">13. Nombre del autorizado</label>
              <input
                className="hc-form-input"
                value={complementario.nombre_autorizado}
                onChange={(e) => actualizarComplementario('nombre_autorizado', e.target.value)}
                disabled={esEntregada || !complementario.tiene_autorizado}
                placeholder="Nombres y apellidos"
                style={esEntregada || !complementario.tiene_autorizado ? locked : {}}
              />
            </div>
            <div className="hc-form-group">
              <label className="hc-form-label">14. Parentesco</label>
              <select
                className="hc-form-input hc-form-select"
                value={complementario.parentesco_autorizado}
                onChange={(e) => actualizarComplementario('parentesco_autorizado', e.target.value)}
                disabled={esEntregada || !complementario.tiene_autorizado}
                style={esEntregada || !complementario.tiene_autorizado ? locked : {}}
              >
                <option value="">-- Seleccione --</option>
                {parentescosCat.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
                {/* Preservar el valor histórico aunque ya no esté activo en el catálogo */}
                {complementario.parentesco_autorizado &&
                  !parentescosCat.some((p) => p.nombre === complementario.parentesco_autorizado) && (
                    <option value={complementario.parentesco_autorizado}>{complementario.parentesco_autorizado}</option>
                  )}
              </select>
            </div>
          </div>

          {badgeAutorizado && complementario.tiene_autorizado && !esEntregada && (
            <div style={{ background: badgeAutorizado.bg, color: badgeAutorizado.color, border: `1px solid ${badgeAutorizado.color}30`, borderRadius: '10px', padding: '0.6rem 1rem', fontSize: '0.85rem', fontWeight: 500, marginTop: '0.6rem' }}>
              {badgeAutorizado.texto}
            </div>
          )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem', marginTop: '0.25rem', marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(135, 206, 235, 0.08), rgba(23, 58, 107, 0.04))', border: '1px solid rgba(23, 58, 107, 0.10)', borderRadius: '12px', padding: '0.75rem 0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.7)', boxShadow: 'inset 0 0 0 1px rgba(23, 58, 107, 0.10)', color: 'var(--hc-slate-600)', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--hc-slate-500)' }}>
                  15 · Funcionario que entrega
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: solicitud.funcionario_entrega_detalle?.nombre_completo ? 600 : 500, color: solicitud.funcionario_entrega_detalle?.nombre_completo ? 'var(--hc-slate-700)' : 'var(--hc-slate-400)', fontStyle: solicitud.funcionario_entrega_detalle?.nombre_completo ? 'normal' : 'italic', fontVariantNumeric: 'tabular-nums' }}>
                  {solicitud.funcionario_entrega_detalle?.nombre_completo || 'Se completa al pasar a ENTREGADA'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '0.25rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--hc-slate-500)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.55rem' }}>Medio de entrega</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.65rem' }}>
              {[
                { key: 'medio_entrega_fisico', num: '16', label: 'Físico', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/></svg>) },
                { key: 'medio_entrega_correo', num: '17', label: 'Correo', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>) },
                { key: 'medio_entrega_whatsapp', num: '18', label: 'WhatsApp', icon: (<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>) },
              ].map((m) => {
                const activo = complementario[m.key]
                return (
                  <label
                    key={m.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.7rem',
                      borderRadius: '12px',
                      padding: '0.7rem 0.9rem',
                      cursor: esEntregada ? 'not-allowed' : 'pointer',
                      background: activo
                        ? 'linear-gradient(135deg, rgba(20,184,166,0.12), rgba(135, 206, 235, 0.10))'
                        : '#fff',
                      border: `1.5px solid ${activo ? 'var(--hc-teal-500)' : 'rgba(23, 58, 107, 0.12)'}`,
                      boxShadow: activo ? '0 4px 12px rgba(20,184,166,0.12)' : '0 1px 3px rgba(14,37,73,0.04)',
                      opacity: esEntregada ? 0.6 : 1,
                      transition: 'all 160ms ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => actualizarComplementario(m.key, e.target.checked)}
                      disabled={esEntregada}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                    />
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                      background: activo
                        ? 'linear-gradient(135deg, var(--hc-brand-navy, #173A6B), var(--hc-teal-600))'
                        : 'rgba(23, 58, 107, 0.06)',
                      color: activo ? '#fff' : 'var(--hc-slate-500)',
                      boxShadow: activo ? '0 2px 6px rgba(14,37,73,0.20), inset 0 0 0 2px rgba(255,255,255,0.18)' : 'none',
                    }}>
                      {m.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: activo ? 'var(--hc-teal-700)' : 'var(--hc-slate-400)' }}>{m.num}</div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--hc-slate-700)' }}>{m.label}</div>
                    </div>
                    <span style={{
                      width: '20px', height: '20px', borderRadius: '6px', flexShrink: 0,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      background: activo ? 'var(--hc-teal-600)' : '#fff',
                      border: activo ? '1.5px solid var(--hc-teal-600)' : '1.5px solid rgba(23, 58, 107, 0.20)',
                      color: '#fff',
                      transition: 'all 160ms ease',
                    }}>
                      {activo && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {esEntregada && solicitud.entregado_a && (
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.65rem', alignItems: 'center', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.20)', borderRadius: '12px', padding: '0.7rem 0.9rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.8)', color: '#16a34a', flexShrink: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#15803d' }}>Entregado a</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: '#14532d' }}>{solicitud.entregado_a}</div>
              </div>
            </div>
          )}

          <div className="hc-form-group" style={{ marginTop: '1rem' }}>
            <label className="hc-form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--hc-brand-navy, #173A6B), var(--hc-teal-600))', color: '#fff', fontSize: '0.72rem', fontWeight: 700, boxShadow: '0 2px 5px rgba(14,37,73,0.25), inset 0 0 0 2px rgba(255,255,255,0.18)' }}>19</span>
              Observación
            </label>
            <textarea
              className="hc-form-input hc-form-textarea"
              rows={3}
              value={complementario.observaciones}
              onChange={(e) => actualizarComplementario('observaciones', e.target.value)}
              placeholder="Notas o detalles adicionales"
              disabled={esEntregada}
              style={esEntregada ? locked : {}}
            />
          </div>

          {!esEntregada && (
            <div style={{ marginTop: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--hc-slate-500)', background: 'rgba(135, 206, 235, 0.10)', border: '1px solid rgba(23, 58, 107, 0.10)', borderRadius: '999px', padding: '0.35rem 0.8rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Los campos 11–19 se guardarán automáticamente al registrar la entrega.
            </div>
          )}
        </div>
      </div>

      {/* Hosvital + envío */}
      <div className="hc-card" style={{ marginBottom: '1.25rem' }}>
        <div className="hc-card-header">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          Historia clínica (Hosvital)
        </div>
        <div className="hc-card-body" style={{ display: 'grid', gap: '0.85rem' }}>
          {/* Estado actual */}
          <div style={{
            background: solicitud.archivo_hc_url
              ? 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(34,197,94,0.04))'
              : 'linear-gradient(135deg, rgba(135, 206, 235, 0.10), rgba(23, 58, 107, 0.04))',
            color: solicitud.archivo_hc_url ? '#166534' : 'var(--hc-slate-700)',
            border: `1px solid ${solicitud.archivo_hc_url ? 'rgba(34,197,94,0.25)' : 'rgba(23, 58, 107, 0.15)'}`,
            borderRadius: '12px', padding: '0.75rem 1rem', fontSize: '0.9rem',
            display: 'flex', alignItems: 'center', gap: '0.7rem',
          }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '10px', background: solicitud.archivo_hc_url ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.7)', boxShadow: 'inset 0 0 0 1px rgba(23, 58, 107, 0.08)' }}>
              {solicitud.archivo_hc_url ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              )}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--hc-slate-500)', fontWeight: 700 }}>Estado</div>
              <div style={{ fontWeight: 600 }}>{solicitud.hosvital_estado_display || solicitud.hosvital_estado || 'Pendiente de carga'}</div>
              {solicitud.hosvital_mensaje && (
                <div style={{ marginTop: '0.2rem', fontSize: '0.78rem', opacity: 0.85 }}>{solicitud.hosvital_mensaje}</div>
              )}
            </div>
          </div>

          {/* Paso 1: cargar el PDF generado externamente por Hosvital */}
          {!solicitud.archivo_hc_url && (
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--hc-slate-600)' }}>
                <strong>Paso 1.</strong> Genere la historia clínica desde Hosvital y cargue aquí el archivo PDF resultante.
              </p>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragActivo(true) }}
                onDragLeave={() => setDragActivo(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragActivo(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) subirHC(f)
                }}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '0.5rem', padding: '1.5rem 1rem',
                  border: `2px dashed ${dragActivo ? 'var(--hc-teal-500)' : 'rgba(23, 58, 107, 0.20)'}`,
                  borderRadius: '14px',
                  background: dragActivo
                    ? 'linear-gradient(135deg, rgba(20,184,166,0.10), rgba(135, 206, 235, 0.10))'
                    : 'linear-gradient(135deg, rgba(135, 206, 235, 0.05), rgba(23, 58, 107, 0.02))',
                  cursor: subiendoHC || esEntregada ? 'not-allowed' : 'pointer',
                  transition: 'all 160ms ease',
                  opacity: esEntregada ? 0.6 : 1,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  style={{ display: 'none' }}
                  disabled={subiendoHC || esEntregada}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) subirHC(f)
                  }}
                />
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--hc-brand-navy, #173A6B), var(--hc-teal-600))', color: '#fff', boxShadow: '0 6px 16px rgba(14,37,73,0.20), inset 0 0 0 2px rgba(255,255,255,0.18)' }}>
                  {subiendoHC ? (
                    <div className="hc-loading-spinner" style={{ width: '22px', height: '22px', borderTopColor: '#fff' }} />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  )}
                </span>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--hc-slate-700)' }}>
                  {subiendoHC ? 'Subiendo archivo...' : 'Arrastra el PDF aquí o haz clic para seleccionarlo'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--hc-slate-500)' }}>
                  Solo PDF · Máximo 25 MB
                </div>
              </label>
            </div>
          )}

          {/* Paso 2: vista previa, descarga y envío */}
          {solicitud.archivo_hc_url && (
            <>
              {/* Vista previa del PDF */}
              <div style={{ border: '1px solid var(--hc-slate-200)', borderRadius: '12px', overflow: 'hidden', background: '#f8fafc', boxShadow: '0 2px 8px rgba(14,37,73,0.04)' }}>
                <div style={{ padding: '0.55rem 0.95rem', fontSize: '0.82rem', color: 'var(--hc-slate-600)', borderBottom: '1px solid var(--hc-slate-200)', background: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  Vista previa del PDF — verifique antes de cambiar el estado.
                </div>
                <iframe
                  src={solicitud.archivo_hc_url}
                  title="Vista previa HC"
                  style={{ width: '100%', height: '520px', border: 'none', display: 'block' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button type="button" className="hc-btn hc-btn-secondary" onClick={descargarHC}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Descargar PDF
                </button>
                {!esEntregada && (
                  <button type="button" className="hc-btn hc-btn-secondary" onClick={eliminarHC} disabled={eliminandoHC} style={{ color: '#b91c1c', borderColor: 'rgba(185,28,28,0.30)' }}>
                    {eliminandoHC ? 'Eliminando...' : 'Reemplazar archivo'}
                  </button>
                )}
              </div>

              {!esEntregada && (
                <div style={{ borderTop: '1px solid var(--hc-slate-200)', paddingTop: '0.85rem', marginTop: '0.25rem', display: 'grid', gap: '0.75rem' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--hc-slate-600)' }}>
                    <strong>Paso 2.</strong> Entrega de la HC según el medio marcado en los campos 16, 17 y 18.
                  </p>

                  {!complementario.medio_entrega_fisico && !complementario.medio_entrega_correo && !complementario.medio_entrega_whatsapp && (
                    <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', padding: '0.6rem 0.85rem', fontSize: '0.85rem', color: '#854d0e' }}>
                      Marque al menos uno de los campos <strong>16. Físico</strong>, <strong>17. Correo</strong> o <strong>18. WhatsApp</strong> arriba para habilitar la entrega.
                    </div>
                  )}

                  {complementario.medio_entrega_fisico && (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', border: '1px solid var(--hc-slate-200)', borderRadius: '8px', padding: '0.6rem 0.85rem' }}>
                      <strong style={{ fontSize: '0.85rem', minWidth: '80px' }}>Físico:</strong>
                      <span style={{ fontSize: '0.82rem', color: 'var(--hc-slate-600)', flex: 1 }}>Imprima el PDF para entregarlo en ventanilla.</span>
                      <button type="button" className="hc-btn hc-btn-primary" onClick={imprimirHC}>
                        Imprimir
                      </button>
                    </div>
                  )}

                  {complementario.medio_entrega_correo && (
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', border: '1px solid var(--hc-slate-200)', borderRadius: '8px', padding: '0.6rem 0.85rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>Correo:</strong>
                      <input
                        className="hc-form-input"
                        type="email"
                        placeholder="paciente@correo.com"
                        value={correoDest}
                        onChange={(e) => setCorreoDest(e.target.value)}
                      />
                      <button type="button" className="hc-btn hc-btn-primary" onClick={() => enviarHC('CORREO', correoDest)} disabled={enviandoHC} style={{ minWidth: '110px' }}>
                        {enviandoHC ? 'Enviando...' : 'Enviar correo'}
                      </button>
                    </div>
                  )}

                  {complementario.medio_entrega_whatsapp && (
                    <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: '0.5rem', alignItems: 'center', background: '#f8fafc', border: '1px solid var(--hc-slate-200)', borderRadius: '8px', padding: '0.6rem 0.85rem' }}>
                      <strong style={{ fontSize: '0.85rem' }}>WhatsApp:</strong>
                      <input
                        className="hc-form-input"
                        placeholder="+57 300 123 4567"
                        value={whatsappDest}
                        onChange={(e) => setWhatsappDest(e.target.value)}
                      />
                      <button type="button" className="hc-btn hc-btn-primary" onClick={() => enviarHC('WHATSAPP', whatsappDest)} disabled={enviandoHC} style={{ minWidth: '110px' }}>
                        {enviandoHC ? 'Enviando...' : 'Enviar WhatsApp'}
                      </button>
                    </div>
                  )}

                  {solicitud.envio_estado === 'ENVIADO' && (
                    <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                      ✓ Último envío: {solicitud.envio_canal} a {solicitud.envio_destinatario}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Acción siguiente */}
      {siguiente && (
        <div className="hc-action-card">
          <div className="hc-action-card-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            Siguiente paso
          </div>

          {siguiente.estado === 'ENTREGADA' && (
            <div style={{ background: '#f0fdfa', border: '1px solid var(--hc-teal-200)', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.9rem', color: 'var(--hc-teal-700)', marginBottom: '0.5rem' }}>
              Se registrará entrega a: <strong>{solicitud.tiene_autorizado && solicitud.nombre_autorizado ? `${solicitud.nombre_autorizado} (autorizado)` : `${solicitud.paciente_detalle?.nombres || ''} ${solicitud.paciente_detalle?.apellidos || ''} (paciente)`}</strong>
              {(solicitud.medio_entrega_fisico || solicitud.medio_entrega_correo || solicitud.medio_entrega_whatsapp) && (
                <span style={{ display: 'block', marginTop: '0.3rem', fontSize: '0.82rem', color: 'var(--hc-slate-500)' }}>
                  Medio de entrega:
                  {solicitud.medio_entrega_fisico && <strong> Físico</strong>}
                  {solicitud.medio_entrega_correo && <strong> · Correo</strong>}
                  {solicitud.medio_entrega_whatsapp && <strong> · WhatsApp</strong>}
                </span>
              )}
            </div>
          )}

          <button className="hc-btn hc-btn-primary" onClick={cambiarEstado}>
            {siguiente.label}
          </button>
        </div>
      )}
    </>
  )
}


