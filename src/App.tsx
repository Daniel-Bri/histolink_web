import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CambiarPassword from './pages/CambiarPassword'
import EnConstruccion from './pages/EnConstruccion'
import Pacientes from './pages/Pacientes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas */}
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/cambiar-password" element={
          <ProtectedRoute><CambiarPassword /></ProtectedRoute>
        } />

        {/* Módulos implementados */}
        <Route path="/pacientes" element={
          <ProtectedRoute><Pacientes /></ProtectedRoute>
        } />

        {/* Módulos en construcción */}
        <Route path="/historial" element={
          <ProtectedRoute><EnConstruccion titulo="Historial Clínico" /></ProtectedRoute>
        } />
        <Route path="/documentos" element={
          <ProtectedRoute><EnConstruccion titulo="Documentos" /></ProtectedRoute>
        } />
        <Route path="/agenda" element={
          <ProtectedRoute><EnConstruccion titulo="Agenda" /></ProtectedRoute>
        } />
        
        {/* Redirige la raíz al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}