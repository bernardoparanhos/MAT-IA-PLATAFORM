import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

function DashboardProfessor() {
  const { usuario, logout } = useAuth()
  const [turmas, setTurmas] = useState([])
  const [turmasDisponiveis, setTurmasDisponiveis] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [associando, setAssociando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [sidebarAberta, setSidebarAberta] = useState(false)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    buscarMinhasTurmas()
  }, [])

  // Fecha sidebar ao redimensionar para desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarAberta(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function buscarMinhasTurmas() {
    try {
      const res = await fetch(`${API}/auth/turmas/minhas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTurmas(data.turmas || [])
    } catch {
      console.error('Erro ao buscar turmas')
    } finally {
      setCarregando(false)
    }
  }

  async function abrirModal() {
    try {
      const res = await fetch(`${API}/auth/turmas/disponiveis`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setTurmasDisponiveis(data.turmas || [])
      setModalAberto(true)
    } catch {
      console.error('Erro ao buscar turmas disponíveis')
    }
  }

  async function associarTurma(turmaId) {
    setAssociando(true)
    try {
      const res = await fetch(`${API}/auth/turmas/associar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ turmaId })
      })
      const data = await res.json()
      if (res.ok) {
        setMensagem('Turma associada com sucesso!')
        setModalAberto(false)
        buscarMinhasTurmas()
        setTimeout(() => setMensagem(''), 3000)
      } else {
        setMensagem(data.message || 'Erro ao associar turma.')
      }
    } catch {
      setMensagem('Erro de conexão.')
    } finally {
      setAssociando(false)
    }
  }

  const totalAlunos = turmas.reduce((acc, t) => acc + (t.total_alunos || 0), 0)
  const temTurma = turmas.length > 0

  const NavItems = ({ onClick }) => (
    <>
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Menu</p>
        {[
          { label: 'Início', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg> },
          { label: 'Matérias', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg> },
          { label: 'Tutor IA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 16v-4m0-4h.01"/></svg> },
          { label: 'Jogos', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/></svg> },
          { label: 'Fórum', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
        ].map(item => (
          <button key={item.label} onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
            <span className="text-slate-500">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="border-t border-white/10 my-4" />
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Gestão</p>

        {[
          { label: 'Turmas', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> },
          { label: 'Métricas', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { label: 'Notificações', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/></svg> },
        ].map(item => (
          <button key={item.label} onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
            <span className="text-slate-500">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-500"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
          <span>Perfil</span>
        </button>
        <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-500"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          <span>Configurações</span>
        </button>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-light">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9"/></svg>
          <span>Sair</span>
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{fontFamily:'Outfit, sans-serif'}}>

      {/* ─── Overlay mobile ──────────────────────────────────── */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarAberta(false)}
        />
      )}

      {/* ─── Sidebar desktop ─────────────────────────────────── */}
      <aside className="hidden lg:flex w-56 bg-[#1e2d3d] flex-col fixed h-full z-40">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-xs mt-1 font-light">Painel do Professor</p>
        </div>
        <NavItems />
      </aside>

      {/* ─── Sidebar mobile (overlay) ────────────────────────── */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-[#1e2d3d] z-40 flex flex-col
        transform transition-transform duration-300 ease-in-out lg:hidden
        ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
            <p className="text-slate-400 text-xs mt-1 font-light">Painel do Professor</p>
          </div>
          <button onClick={() => setSidebarAberta(false)} className="text-slate-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <NavItems onClick={() => setSidebarAberta(false)} />
      </aside>

      {/* ─── Conteúdo principal ──────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:ml-56">

        {/* Header mobile */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0 overflow-y-auto">

          {/* Header */}
          <div className="mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
              Olá, Prof. {usuario?.nome?.split(' ')[0]}
            </h2>
            <p className="text-slate-400 text-sm mt-1 font-light">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {mensagem && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm font-light">
              {mensagem}
            </div>
          )}

          {/* Visão Geral */}
          <div className="mb-8 lg:mb-10">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Visão Geral</p>
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              {[
                { label: 'Turmas', valor: turmas.length },
                { label: 'Alunos', valor: totalAlunos },
                { label: 'Média Geral', valor: '—' },
              ].map(card => (
                <div key={card.label} className="bg-[#1e2d3d] rounded-2xl p-4 lg:p-6 border border-white/5">
                  <div className="text-2xl lg:text-4xl font-semibold text-white mb-1">{card.valor}</div>
                  <div className="text-slate-400 text-xs lg:text-sm font-light">{card.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Minhas Turmas */}
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Minhas Turmas</p>

            {carregando ? (
              <p className="text-slate-400 text-sm font-light">Carregando...</p>
            ) : !temTurma ? (
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-8 lg:p-10 text-center">
                <p className="text-white font-medium text-lg mb-2">Nenhuma turma associada</p>
                <p className="text-slate-400 text-sm font-light mb-8">
                  Associe sua turma para começar a acompanhar seus alunos
                </p>
                <button onClick={abrirModal} className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8 py-2.5 rounded-xl text-sm transition-colors">
                  Associar minha turma
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {turmas.map(turma => (
                  <div key={turma.id} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5 lg:p-6 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{turma.nome}</p>
                      <p className="text-slate-400 text-sm font-light mt-0.5">
                        Código <span className="text-orange-400 font-mono">{turma.codigo_acesso}</span>
                        <span className="mx-2 text-slate-600">·</span>
                        {turma.total_alunos} {turma.total_alunos === 1 ? 'aluno' : 'alunos'}
                      </p>
                    </div>
                    <button className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
                      Ver detalhes →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ─── Modal associar turma ────────────────────────────── */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-white text-xl font-semibold mb-1">Selecione sua turma</h3>
            <p className="text-slate-400 text-sm font-light mb-6">
              Escolha a turma que você leciona este semestre
            </p>

            {turmasDisponiveis.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4 font-light">
                Nenhuma turma disponível no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {turmasDisponiveis.map(turma => (
                  <button
                    key={turma.id}
                    onClick={() => associarTurma(turma.id)}
                    disabled={associando}
                    className="w-full bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 rounded-xl p-4 text-left transition-all group disabled:opacity-50"
                  >
                    <p className="text-white font-medium group-hover:text-orange-300 transition-colors">{turma.nome}</p>
                    <p className="text-slate-500 font-mono text-sm mt-0.5">{turma.codigo_acesso}</p>
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => setModalAberto(false)} className="w-full mt-6 text-slate-500 hover:text-slate-300 text-sm transition-colors font-light">
              Cancelar
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default DashboardProfessor