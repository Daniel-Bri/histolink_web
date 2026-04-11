import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CambiarPassword from './pages/CambiarPassword'
import PersonalList from './pages/GestionPersonal/PersonalList'
import PersonalForm from './pages/GestionPersonal/PersonalForm'

export default function App() {
  return (
    <BrowserRouter>
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
        <Route path="/personal" element={
          <ProtectedRoute>
            <PersonalList />
          </ProtectedRoute>
        } />
        <Route path="/personal/nuevo" element={
          <ProtectedRoute>
            <PersonalForm />
          </ProtectedRoute>
        } />
        <Route path="/personal/:id/editar" element={
          <ProtectedRoute>
            <PersonalForm />
          </ProtectedRoute>
        } />

        {/* Redirige la raíz al dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}