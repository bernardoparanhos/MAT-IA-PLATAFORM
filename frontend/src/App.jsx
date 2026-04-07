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
import Termos from './pages/Termos'
import Privacidade from './pages/Privacidade'
import ConfiguracoesProfessor from './pages/ConfiguracoesProfessor'
import ConfiguracoesAluno from './pages/ConfiguracoesAluno'
import TurmasProfessor from './pages/TurmasProfessor'
import MinhaTurma from './pages/MinhaTurma'
import Nivelamento from './pages/Nivelamento'
import ResultadoNivelamento from './pages/ResultadoNivelamento'
import Metricas from './pages/Metricas'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/termos" element={<Termos />} />
      <Route path="/privacidade" element={<Privacidade />} />

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
      <Route path="/configuracoes-professor" element={
        <ProtectedRoute perfil="professor">
          <ConfiguracoesProfessor />
        </ProtectedRoute>
      } />
     <Route path="/turmas-professor" element={
        <ProtectedRoute perfil="professor">
          <TurmasProfessor />
        </ProtectedRoute>
      } />
      <Route path="/metricas" element={
        <ProtectedRoute perfil="professor">
          <Metricas />
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
      <Route path="/configuracoes-aluno" element={
        <ProtectedRoute perfil="aluno">
          <ConfiguracoesAluno />
        </ProtectedRoute>
      } />
      <Route path="/nivelamento" element={
  <ProtectedRoute perfil="aluno">
    <Nivelamento />
  </ProtectedRoute>
} />
<Route path="/nivelamento/resultado" element={
  <ProtectedRoute perfil="aluno">
    <ResultadoNivelamento />
  </ProtectedRoute>
} />
<Route path="/minha-turma" element={
  <ProtectedRoute perfil="aluno">
    <MinhaTurma />
  </ProtectedRoute>
} />
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App