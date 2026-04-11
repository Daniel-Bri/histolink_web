import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CambiarPassword from './pages/CambiarPassword'
import EnConstruccion from './pages/EnConstruccion'
import Pacientes from './pages/Pacientes'
import ExpedientePaciente from './pages/ExpedientePaciente'
import EditarAntecedentes from './pages/EditarAntecedentes'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas con sidebar */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard"          element={<Dashboard />} />
          <Route path="/cambiar-password"   element={<CambiarPassword />} />
          <Route path="/pacientes"          element={<Pacientes />} />
          <Route path="/pacientes/:id/expediente"           element={<ExpedientePaciente />} />
          <Route path="/pacientes/:id/antecedentes/editar"  element={<EditarAntecedentes />} />
          <Route path="/historial"  element={<EnConstruccion titulo="Historial Clínico" />} />
          <Route path="/documentos" element={<EnConstruccion titulo="Documentos" />} />
          <Route path="/agenda"     element={<EnConstruccion titulo="Agenda" />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
