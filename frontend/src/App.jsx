import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import RequirePermiso from './components/RequirePermiso'
import Login from './pages/Login'
import Solicitudes from './pages/Solicitudes'
import NuevaSolicitud from './pages/NuevaSolicitud'
import DetalleSolicitud from './pages/DetalleSolicitud'
import Pacientes from './pages/Pacientes'
import Reportes from './pages/Reportes'
import Bitacora from './pages/Bitacora'
import Usuarios from './pages/Usuarios'
import Roles from './pages/Roles'
import TiposDocumento from './pages/TiposDocumento'
import Parentescos from './pages/Parentescos'
import TiposDocumentoIdentidad from './pages/TiposDocumentoIdentidad'

// Atajo: protege la ruta con permiso y mete dentro del Layout.
const Guarded = ({ codigo, children }) => (
  <RequirePermiso codigo={codigo}><Layout>{children}</Layout></RequirePermiso>
)

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="hc-loading">
        <div className="hc-loading-spinner" />
        <span className="hc-loading-text">Cargando sistema...</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/" element={<Guarded codigo="solicitudes.ver"><Solicitudes /></Guarded>} />
      <Route path="/nueva-solicitud" element={<Guarded codigo="solicitudes.crear"><NuevaSolicitud /></Guarded>} />
      <Route path="/solicitud/:id" element={<Guarded codigo="solicitudes.ver"><DetalleSolicitud /></Guarded>} />
      <Route path="/pacientes" element={<Guarded codigo="pacientes.ver"><Pacientes /></Guarded>} />
      <Route path="/reportes" element={<Guarded codigo="reportes.ver"><Reportes /></Guarded>} />
      <Route path="/bitacora" element={<Guarded codigo="bitacora.ver"><Bitacora /></Guarded>} />
      <Route path="/usuarios" element={<Guarded codigo="usuarios.ver"><Usuarios /></Guarded>} />
      <Route path="/roles" element={<Guarded codigo="roles.ver"><Roles /></Guarded>} />
      <Route path="/tipos-documento" element={<Guarded codigo="tipos_documento_solicitado.ver"><TiposDocumento /></Guarded>} />
      <Route path="/parentescos" element={<Guarded codigo="parentescos.ver"><Parentescos /></Guarded>} />
      <Route path="/tipos-doc-identidad" element={<Guarded codigo="tipos_doc_identidad.ver"><TiposDocumentoIdentidad /></Guarded>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
