import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPerfil, alterarSenha, desassociarTurma } from '../services/professorService'
import SidebarProfessor from '../components/SidebarProfessor'

function PerfilProfessor() {
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
  const [turmaParaDesassociar, setTurmaParaDesassociar] = useState(null)
  const [senhaDesassociar, setSenhaDesassociar] = useState('')
  const [desassociando, setDesassociando] = useState(false)
  const [erroDesassociar, setErroDesassociar] = useState('')

  const [turmas, setTurmas] = useState([])
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    async function carregar() {
      try {
        const data = await getPerfil()
        setPerfil(data.professor)
        const res = await fetch(`${API}/auth/turmas/minhas`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const d = await res.json()
        setTurmas(d.turmas || [])
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
      const data = await desassociarTurma(senhaDesassociar, turmaParaDesassociar?.id)
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

  const labelClass = "text-slate-400 text-xs uppercase tracking-wider font-light mb-1.5 block"
  const inputClass = "w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm font-light focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-slate-600"

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

      <SidebarProfessor sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} />

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
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Turmas associadas</label>
                    {turmas.length === 0 ? (
                      <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-slate-500 text-sm font-light">
                        Nenhuma turma
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {turmas.map(t => (
                          <div key={t.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">
                            <span className="text-orange-400 text-sm font-light">{t.nome}</span>
                            <button
                              onClick={() => { setTurmaParaDesassociar(t); setModalDesassociar(true) }}
                              className="text-slate-600 hover:text-red-400 transition-colors ml-1"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                                <path d="M6 18L18 6M6 6l12 12"/>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
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
              <span className="text-orange-400 font-medium">{turmaParaDesassociar?.nome}</span>.
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