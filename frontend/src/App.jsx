import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import PlayerMusica from './components/PlayerMusica'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import Dashboard from './pages/Dashboard'
import DashboardProfessor from './pages/DashboardProfessor'
import PerfilProfessor from './pages/PerfilProfessor'
import NotificacoesProfessor from './pages/NotificacoesProfessor'
import NotificacoesAluno from './pages/NotificacoesAluno'
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
import Materias from './pages/Materias'
import MateriaBloco from './pages/MateriaBloco'
import MateriaFavoritas from './pages/MateriaFavoritas'
import Jogos from './pages/Jogos'
import AtividadesProfessor from './pages/AtividadesProfessor'
import AtividadesProfessorDetalhe from './pages/AtividadesProfessorDetalhe'
import AtividadesProfessorSubmissoes from './pages/AtividadesProfessorSubmissoes'
import Atividades from './pages/Atividades'
import AtividadesAluno from './pages/AtividadesAluno'
import AtividadesAlunoResultado from './pages/AtividadesAlunoResultado'
import SolicitacaoProfessor from './pages/SolicitacaoProfessor'
import SolicitacaoAluno from './pages/SolicitacaoAluno'
import SolicitacoesProfessor from './pages/SolicitacoesProfessor'
import AdminPainel from './pages/AdminPainel'
import TrocarSenhaTemp from './pages/TrocarSenhaTemp'


const EM_MANUTENCAO = false // Mudar para true para ativar a tela de manutenção

function App() {
  const location = useLocation()
  const mostrarPlayer = location.pathname.startsWith('/materias')

  if (EM_MANUTENCAO) return (
    <div style={{ fontFamily: 'Outfit, sans-serif', background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
      <h1 style={{ color: '#f97316', fontSize: '2rem', fontWeight: 'bold' }}>MAT<span style={{ color: 'white' }}>-IA</span></h1>
      <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: '300' }}>Plataforma em manutenção. Voltamos em breve.</p>
    </div>
  )

  return (
      <>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/solicitar-professor" element={<SolicitacaoProfessor />} />
          <Route path="/solicitar-acesso" element={<SolicitacaoAluno />} />
          <Route path="/admin" element={<AdminPainel />} />
          <Route path="/trocar-senha" element={<TrocarSenhaTemp />} />

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
          <Route path="/atividades-professor" element={
            <ProtectedRoute perfil="professor">
              <AtividadesProfessor />
            </ProtectedRoute>
          } />
          <Route path="/atividades-professor/:id/submissoes" element={
            <ProtectedRoute perfil="professor">
              <AtividadesProfessorSubmissoes />
            </ProtectedRoute>
          } />
          <Route path="/atividades-professor/:id/montar" element={
            <ProtectedRoute perfil="professor">
              <AtividadesProfessorDetalhe />
            </ProtectedRoute>
          } />
          <Route path="/atividades-professor/:id" element={
            <ProtectedRoute perfil="professor">
              <AtividadesProfessorDetalhe />
            </ProtectedRoute>
          } />
          <Route path="/metricas" element={
            <ProtectedRoute perfil="professor">
              <Metricas />
            </ProtectedRoute>
          } />
          <Route path="/solicitacoes-professor" element={
            <ProtectedRoute perfil="professor">
              <SolicitacoesProfessor />
            </ProtectedRoute>
          } />
          <Route path="/diagnostico/preview" element={
            <ProtectedRoute perfil="professor">
              <Nivelamento modo="preview" />
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
          <Route path="/notificacoes-aluno" element={
            <ProtectedRoute perfil="aluno">
              <NotificacoesAluno />
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
          <Route path="/materias" element={
            <ProtectedRoute perfil={['aluno', 'professor']}>
              <Materias />
            </ProtectedRoute>
          } />
          <Route path="/materias/:bloco" element={
            <ProtectedRoute perfil={['aluno', 'professor']}>
              <MateriaBloco />
            </ProtectedRoute>
          } />
          <Route path="/materias/favoritas" element={
            <ProtectedRoute perfil={['aluno', 'professor']}>
              <MateriaFavoritas />
            </ProtectedRoute>
          } />

          <Route path="/atividades" element={
            <ProtectedRoute perfil="aluno">
              <Atividades />
            </ProtectedRoute>
          } />

          <Route path="/atividades/:id/resultado" element={
            <ProtectedRoute perfil="aluno">
              <AtividadesAlunoResultado />
            </ProtectedRoute>
          } />

          <Route path="/atividades/:id" element={
            <ProtectedRoute perfil="aluno">
              <AtividadesAluno />
            </ProtectedRoute>
          } />

          <Route path="/jogos" element={
            <ProtectedRoute perfil="aluno">
              <Jogos />
            </ProtectedRoute>
          } />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        {mostrarPlayer && <PlayerMusica />}
      </>
  )
}

export default App