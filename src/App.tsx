import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CambiarPassword from './pages/CambiarPassword'
import Pacientes from './pages/Pacientes'
import RegistroPaciente from './pages/Pacientes/RegistroPaciente'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Rutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/cambiar-password" element={
          <ProtectedRoute>
            <CambiarPassword />
          </ProtectedRoute>
        } />
        <Route path="/pacientes" element={
          <ProtectedRoute>
            <Pacientes />
          </ProtectedRoute>
        } />
        <Route path="/pacientes/registro" element={
          <ProtectedRoute>
            <RegistroPaciente />
          </ProtectedRoute>
        } />
        
        {/* Redirige la raíz al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}