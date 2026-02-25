import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import DashboardProfessor from './pages/DashboardProfessor'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Protegidas */}
      <Route path="/dashboard" element={
        <ProtectedRoute perfil="aluno">
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard-professor" element={
        <ProtectedRoute perfil="professor">
          <DashboardProfessor />
        </ProtectedRoute>
      } />

      {/* Redireciona raiz para login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Rota não encontrada */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App