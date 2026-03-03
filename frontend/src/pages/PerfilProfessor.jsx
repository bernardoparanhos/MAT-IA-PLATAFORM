import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPerfil, alterarSenha, desassociarTurma } from '../services/professorService'

function PerfilProfessor() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(false)

  // Formulário de senha
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState({ tipo: '', texto: '' })

  // Modal desassociar
  const [modalDesassociar, setModalDesassociar] = useState(false)
  const [senhaDesassociar, setSenhaDesassociar] = useState('')
  const [desassociando, setDesassociando] = useState(false)
  const [erroDesassociar, setErroDesassociar] = useState('')

  useEffect(() => {
    async function carregar() {
      try {
        const data = await getPerfil()
        setPerfil(data.professor)
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

  async function handleDesassociar() {
    setErroDesassociar('')
    if (!senhaDesassociar) {
      return setErroDesassociar('Digite sua senha para confirmar.')
    }
    setDesassociando(true)
    try {
      const data = await desassociarTurma(senhaDesassociar)
      if (data.message === 'Turma desassociada com sucesso.') {
        setModalDesassociar(false)
        setSenhaDesassociar('')
        navigate('/dashboard-professor')
      } else {
        setErroDesassociar(data.message || 'Erro ao desassociar.')
      }
    } catch {
      setErroDesassociar('Erro de conexão.')
    } finally {
      setDesassociando(false)
    }
  }

  function fecharModal() {
    setModalDesassociar(false)
    setSenhaDesassociar('')
    setErroDesassociar('')
  }

  const NavItems = ({ onClick }) => (
    <>
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Menu</p>
        {[
          { label: 'Início', path: '/dashboard-professor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg> },
          { label: 'Matérias', path: '/materias', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg> },
          { label: 'Tutor IA', path: '/tutor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 16v-4m0-4h.01"/></svg> },
          { label: 'Jogos', path: '/jogos', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/></svg> },
          { label: 'Fórum', path: '/forum', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => { navigate(item.path); onClick?.() }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
            <span className="text-slate-500">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        <div className="border-t border-white/10 my-4" />
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Gestão</p>
        {[
          { label: 'Turmas', path: '/turmas', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> },
          { label: 'Métricas', path: '/metricas', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          { label: 'Notificações', path: '/notificacoes', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/></svg> },
        ].map(item => (
          <button key={item.label} onClick={() => { navigate(item.path); onClick?.() }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
            <span className="text-slate-500">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <button
          onClick={() => { navigate('/perfil-professor'); onClick?.() }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-light"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
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
          <p className="text-slate-400 text-xs mt-1 font-light">Painel do Professor</p>
        </div>
        <NavItems />
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1e2d3d] z-40 flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
            <p className="text-slate-400 text-xs mt-1 font-light">Painel do Professor</p>
          </div>
          <button onClick={() => setSidebarAberta(false)} className="text-slate-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <NavItems onClick={() => setSidebarAberta(false)} />
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

              {/* Card — Dados pessoais */}
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
                    <p className="text-slate-400 text-sm font-light">Professor</p>
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
                    <label className={labelClass}>SIAPE</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono tracking-widest">
                      {perfil?.siape || '—'}
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Turma associada</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-light">
                      {perfil?.turma
                        ? <span className="text-orange-400">{perfil.turma.nome}</span>
                        : <span className="text-slate-500">Nenhuma turma</span>
                      }
                    </div>
                    {/* Botão discreto — só aparece se tiver turma */}
                    {perfil?.turma && (
                      <button
                        onClick={() => setModalDesassociar(true)}
                        className="mt-2 text-slate-500 hover:text-slate-300 text-xs font-light transition-colors flex items-center gap-1"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                          <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                        Trocar turma
                      </button>
                    )}
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

              {/* Card — Alterar senha */}
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
                    <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} placeholder="••••••••" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Nova senha</label>
                    <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Mín. 8 chars, 1 maiúscula, 1 número" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Confirmar nova senha</label>
                    <input type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="••••••••" className={inputClass} />
                  </div>
                  <button
                    onClick={handleAlterarSenha}
                    disabled={salvando}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors mt-2"
                  >
                    {salvando ? 'Salvando...' : 'Alterar senha'}
                  </button>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Modal — Desassociar turma */}
      {modalDesassociar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl">

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-yellow-400">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <path d="M12 9v4m0 4h.01"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white text-lg font-semibold">Trocar turma</h3>
                <p className="text-slate-400 text-xs font-light">Esta ação requer confirmação</p>
              </div>
            </div>

            <p className="text-slate-300 text-sm font-light mb-6 leading-relaxed">
              Você está prestes a se desassociar da turma{' '}
              <span className="text-orange-400 font-medium">{perfil?.turma?.nome}</span>.
              Os alunos não serão afetados e você poderá associar uma nova turma em seguida.
            </p>

            {erroDesassociar && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-sm font-light">
                {erroDesassociar}
              </div>
            )}

            <div className="mb-6">
              <label className={labelClass}>Confirme sua senha</label>
              <input
                type="password"
                value={senhaDesassociar}
                onChange={e => setSenhaDesassociar(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
                onKeyDown={e => e.key === 'Enter' && handleDesassociar()}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={fecharModal}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesassociar}
                disabled={desassociando}
                className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
              >
                {desassociando ? 'Confirmando...' : 'Confirmar desassociação'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PerfilProfessor