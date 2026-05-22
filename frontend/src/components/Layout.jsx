import { useState, useEffect } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  {
    section: 'Principal',
    links: [
      { path: '/', label: 'Solicitudes', icon: 'clipboard', permiso: 'solicitudes.ver' },
      { path: '/nueva-solicitud', label: 'Nueva Solicitud', icon: 'plus-circle', permiso: 'solicitudes.crear' },
      { path: '/pacientes', label: 'Pacientes', icon: 'users', permiso: 'pacientes.ver' },
    ]
  },
  {
    section: 'Informes',
    links: [
      { path: '/reportes', label: 'Reportes', icon: 'download', permiso: 'reportes.ver' },
      { path: '/bitacora', label: 'Bitacora', icon: 'shield', permiso: 'bitacora.ver' },
    ]
  },
  {
    section: 'Administracion',
    links: [
      { path: '/usuarios', label: 'Usuarios', icon: 'user-cog', permiso: 'usuarios.ver' },
      { path: '/roles', label: 'Roles y permisos', icon: 'shield', permiso: 'roles.ver' },
      { path: '/tipos-documento', label: 'Tipos Documento', icon: 'file-text', permiso: 'tipos_documento_solicitado.ver' },
      { path: '/parentescos', label: 'Parentescos', icon: 'users', permiso: 'parentescos.ver' },
      { path: '/tipos-doc-identidad', label: 'Tipos Doc. Identidad', icon: 'id-card', permiso: 'tipos_doc_identidad.ver' },
    ]
  }
]

const icons = {
  clipboard: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="M9 14l2 2 4-4"/></svg>,
  'plus-circle': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>,
  users: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  download: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  shield: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
  'user-cog': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><circle cx="19" cy="11" r="2"/><path d="M19 8v1"/><path d="M19 13v1"/><path d="M21.6 9.5l-.87.5"/><path d="M17.27 12l-.87.5"/><path d="M21.6 12.5l-.87-.5"/><path d="M17.27 10l-.87-.5"/></svg>,
  'file-text': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  'id-card': <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h4M5 17c.8-1.6 2.3-2.5 4-2.5s3.2.9 4 2.5"/></svg>,
}

const pageNames = {
  '/': 'Solicitudes',
  '/nueva-solicitud': 'Nueva Solicitud',
  '/pacientes': 'Pacientes',
  '/reportes': 'Reportes',
  '/bitacora': 'Bitacora',
  '/usuarios': 'Usuarios',
  '/roles': 'Roles y permisos',
  '/tipos-documento': 'Tipos de Documento',
  '/parentescos': 'Parentescos',
  '/tipos-doc-identidad': 'Tipos de Documento de Identidad',
}

export default function Layout({ children }) {
  const { user, logout, can } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  if (!user) return <Navigate to="/login" />

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
  }

  const currentPage = pageNames[location.pathname] || 'Detalle Solicitud'

  // Filtrar links por permisos: si ninguno del grupo es visible, se oculta la sección.
  const navVisible = navItems
    .map(section => ({
      ...section,
      links: section.links.filter(l => !l.permiso || can(l.permiso)),
    }))
    .filter(section => section.links.length > 0)

  // Rol primario para mostrar en el avatar.
  const rolPrincipal = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles.map(r => r.nombre).join(', ')
    : (user.is_superuser ? 'Superadmin' : (user.rol || 'Usuario'))

  return (
    <div className="hc-app">
      <div
        className={`hc-sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`hc-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="hc-sidebar-brand">
          <div className="hc-sidebar-logo">
            <img src="/logo-junical.png" alt="Clínica Junical" />
          </div>
          <div className="hc-sidebar-brand-text">
            <h1>Clínica Junical</h1>
            <span>Historias Clínicas</span>
          </div>
        </div>

        <nav className="hc-sidebar-nav">
          {navVisible.map(section => (
            <div key={section.section}>
              <div className="hc-nav-section-label">{section.section}</div>
              {section.links.map(link => (
                <button
                  key={link.path}
                  className={`hc-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                  onClick={() => { navigate(link.path); setSidebarOpen(false) }}
                >
                  {icons[link.icon]}
                  {link.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="hc-sidebar-footer">
          <div className="hc-sidebar-user">
            <div className="hc-user-avatar">{getInitials(user.nombre_completo)}</div>
            <div className="hc-user-info">
              <div className="hc-user-name">{user.nombre_completo}</div>
              <div className="hc-user-role">{rolPrincipal}</div>
            </div>
          </div>
          <button className="hc-btn-logout" onClick={logout}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      <main className="hc-main">
        <header className="hc-header">
          <div className="hc-breadcrumb">
            <span style={{ color: 'var(--hc-teal-700)', fontWeight: 600 }}>Clínica Junical</span>
            <span className="hc-breadcrumb-sep">/</span>
            <span>{currentPage}</span>
          </div>
          <div className="hc-header-time">
            {currentTime.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </header>
        <div className="hc-content">
          {children}
        </div>
      </main>

      <button className="hc-mobile-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
    </div>
  )
}
