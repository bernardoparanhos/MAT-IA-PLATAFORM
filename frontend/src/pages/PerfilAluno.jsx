import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPerfil, alterarSenha } from '../services/alunoService'

function PerfilAluno() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(false)

  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })

  useEffect(() => {
    async function carregar() {
      try {
        const data = await getPerfil()
        setPerfil(data.aluno)
      } catch {
        setMensagem({ tipo: 'erro', texto: 'Erro ao carregar perfil.' })
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarAberta(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function handleAlterarSenha() {
    setMensagem({ tipo: '', texto: '' })
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      return setMensagem({ tipo: 'erro', texto: 'Preencha todos os campos.' })
    }
    if (novaSenha !== confirmarSenha) {
      return setMensagem({ tipo: 'erro', texto: 'A nova senha e a confirmação não coincidem.' })
    }
    setSalvando(true)
    try {
      const data = await alterarSenha(senhaAtual, novaSenha)
      if (data.message === 'Senha alterada com sucesso.') {
        setMensagem({ tipo: 'sucesso', texto: 'Senha alterada com sucesso!' })
        setSenhaAtual('')
        setNovaSenha('')
        setConfirmarSenha('')
      } else {
        setMensagem({ tipo: 'erro', texto: data.message || 'Erro ao alterar senha.' })
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão.' })
    } finally {
      setSalvando(false)
    }
  }

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
        <button key={item.label}
          onClick={() => { item.path && navigate(item.path); onClick?.() }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
          <span className="text-slate-500">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <div className="border-t border-white/10 my-4" />
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Minha Conta</p>

      <button onClick={() => { navigate('/minha-turma'); onClick?.() }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
        <span className="text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>
        </span>
        <span>Minha Turma</span>
      </button>
      <button onClick={() => { navigate('/notificacoes-aluno'); onClick?.() }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
        <span className="text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/>
          </svg>
        </span>
        <span>Notificações</span>
      </button>
      {/* Perfil — ativo */}
      <button onClick={() => { navigate('/perfil-aluno'); onClick?.() }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-light">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
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

  const labelClass = "text-slate-400 text-xs uppercase tracking-wider font-light mb-1.5 block"
  const inputClass = "w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm font-light focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-slate-600"

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

          <div className="mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Meu Perfil</h2>
            <p className="text-slate-400 text-sm mt-1 font-light">Suas informações e configurações de acesso</p>
          </div>

          {carregando ? (
            <p className="text-slate-400 text-sm font-light">Carregando...</p>
          ) : (
            <div className="max-w-2xl space-y-6">

              {/* Dados pessoais */}
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-6">Dados Pessoais</p>

                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-orange-400 text-xl font-semibold">
                      {perfil?.nome?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-medium text-lg">{perfil?.nome}</p>
                    <p className="text-slate-400 text-sm font-light">Aluno</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>Nome completo</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-light">
                      {perfil?.nome}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Email institucional</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-light truncate">
                      {perfil?.email}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>RA</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono tracking-widest">
                      {perfil?.ra || '—'}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Turma</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-light">
                      {perfil?.turma
                        ? <span className="text-orange-400">{perfil.turma.nome}</span>
                        : <span className="text-slate-500">Nenhuma turma</span>
                      }
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Membro desde</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-light">
                      {perfil?.criado_em
                        ? new Date(perfil.criado_em).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Alterar senha */}
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-6">Alterar Senha</p>

                {mensagem.texto && (
                  <div className={`mb-5 rounded-xl px-4 py-3 text-sm font-light border ${
                    mensagem.tipo === 'sucesso'
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                  }`}>
                    {mensagem.texto}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Senha atual</label>
                    <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)}
                      placeholder="••••••••" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Nova senha</label>
                    <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)}
                      placeholder="Mín. 8 chars, 1 maiúscula, 1 número" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Confirmar nova senha</label>
                    <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)}
                      placeholder="••••••••" className={inputClass} />
                  </div>
                  <button onClick={handleAlterarSenha} disabled={salvando}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors mt-2">
                    {salvando ? 'Salvando...' : 'Alterar senha'}
                  </button>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default PerfilAluno