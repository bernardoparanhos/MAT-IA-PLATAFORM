import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import DashboardProfessor from './pages/DashboardProfessor'
import PerfilProfessor from './pages/PerfilProfessor'
import NotificacoesProfessor from './pages/NotificacoesProfessor'
import PerfilAluno from './pages/PerfilAluno'
import EsqueciSenha from './pages/EsqueciSenha'
import RedefinirSenha from './pages/RedefinirSenha'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

      {/* Protegidas — Professor */}
      <Route path="/dashboard-professor" element={
        <ProtectedRoute perfil="professor">
          <DashboardProfessor />
        </ProtectedRoute>
      } />
      <Route path="/perfil-professor" element={
        <ProtectedRoute perfil="professor">
          <PerfilProfessor />
        </ProtectedRoute>
      } />
      <Route path="/notificacoes-professor" element={
        <ProtectedRoute perfil="professor">
          <NotificacoesProfessor />
        </ProtectedRoute>
      } />

      {/* Protegidas — Aluno */}
      <Route path="/dashboard" element={
        <ProtectedRoute perfil="aluno">
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/perfil-aluno" element={
        <ProtectedRoute perfil="aluno">
          <PerfilAluno />
        </ProtectedRoute>
      } />

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App