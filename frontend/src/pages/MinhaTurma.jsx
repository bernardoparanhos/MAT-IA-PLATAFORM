import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NavItems = ({ onClick, navigate, logout }) => (
  <>
    <nav className="p-4 space-y-1">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Menu</p>
      {[
        { label: 'Início', path: '/dashboard', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg> },
        { label: 'Matérias', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg> },
        { label: 'Tutor IA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 16v-4m0-4h.01"/></svg> },
        { label: 'Jogos', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/></svg> },
        { label: 'Fórum', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
      ].map(item => (
        <button key={item.label} onClick={() => { item.path && navigate(item.path); onClick?.() }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
          <span className="text-slate-500">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <div className="border-t border-white/10 my-4" />
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Minha Conta</p>

      {/* Minha Turma — ativo */}
      <button
        onClick={() => { navigate('/minha-turma'); onClick?.() }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-light"
      >
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
          </svg>
        </span>
        <span>Minha Turma</span>
      </button>

     <button
        onClick={() => { navigate('/notificacoes-aluno'); onClick?.() }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light"
      >
        <span className="text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/>
          </svg>
        </span>
        <span>Notificações</span>
      </button>

      <button onClick={() => { navigate('/perfil-aluno'); onClick?.() }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
        <span className="text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
        </span>
        <span>Perfil</span>
      </button>
    </nav>

    <div className="p-4 border-t border-white/10 space-y-1">
      <button onClick={() => { navigate('/configuracoes-aluno'); onClick?.() }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-500"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        <span>Configurações</span>
      </button>
      <button onClick={logout}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-light">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9"/></svg>
        <span>Sair</span>
      </button>
    </div>
  </>
)

function MinhaTurma() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    buscarTurma()
  }, [])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarAberta(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function buscarTurma() {
    try {
      const res = await fetch(`${API}/auth/aluno/minha-turma`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setDados(data)
    } catch {
      console.error('Erro ao buscar turma')
    } finally {
      setCarregando(false)
    }
  }

  function copiarCodigo() {
    if (dados?.turma?.codigo_acesso) {
      navigator.clipboard.writeText(dados.turma.codigo_acesso)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-56 bg-[#1e2d3d] flex-col fixed h-full z-40">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-xs mt-1 font-light">Painel do Aluno</p>
        </div>
        <NavItems navigate={navigate} logout={logout} />
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1e2d3d] z-40 flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
            <p className="text-slate-400 text-xs mt-1 font-light">Painel do Aluno</p>
          </div>
          <button onClick={() => setSidebarAberta(false)} className="text-slate-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <NavItems onClick={() => setSidebarAberta(false)} navigate={navigate} logout={logout} />
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col lg:ml-56">

        {/* Header mobile */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">

          {/* Header */}
          <div className="mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Minha Turma</h2>
            <p className="text-slate-400 text-sm mt-1 font-light">
              {dados?.turma ? dados.turma.nome : 'Carregando...'}
            </p>
          </div>

          {carregando ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : !dados?.turma ? (
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-orange-400">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Nenhuma turma vinculada</p>
              <p className="text-slate-400 text-sm font-light">Você ainda não está associado a nenhuma turma.</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Card info da turma */}
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-5">Informações da Turma</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Nome</p>
                    <p className="text-white font-medium">{dados.turma.nome}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Código de acesso</p>
                    <div className="flex items-center gap-2">
                      <p className="text-orange-400 font-mono font-medium">{dados.turma.codigo_acesso}</p>
                      <button onClick={copiarCodigo}
                        className="text-slate-500 hover:text-slate-300 transition-colors text-xs flex items-center gap-1">
                        {copiado ? (
                          <span className="text-green-400 text-xs">✓ copiado</span>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Professor</p>
                    <p className="text-white font-light">{dados.professor?.nome || '—'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{dados.professor?.email || ''}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Total de alunos</p>
                    <p className="text-white font-light">
                      {(dados.colegas?.length || 0) + 1} {(dados.colegas?.length || 0) + 1 === 1 ? 'aluno' : 'alunos'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card colegas */}
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-5">Colegas de Turma</p>

                {/* Você mesmo */}
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-orange-500/5 border border-orange-500/10 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-400 text-xs font-medium">
                        {usuario?.nome?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-orange-300 text-sm font-light">{usuario?.nome}</p>
                      <p className="text-slate-500 text-xs">{usuario?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">você</span>
                </div>

                {/* Colegas */}
                {dados.colegas.length === 0 ? (
                  <p className="text-slate-500 text-sm font-light text-center py-4">Você é o único aluno da turma por enquanto.</p>
                ) : (
                  <div className="space-y-1">
                    {dados.colegas.map(colega => (
                      <div key={colega.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-400 text-xs font-medium">
                              {colega.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-light">{colega.nome}</p>
                            <p className="text-slate-500 text-xs">{colega.email}</p>
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs font-mono">{colega.ra}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default MinhaTurma