import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getPerfil, alterarSenha } from '../services/alunoService'
import SidebarAluno from '../components/SidebarAluno'

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
      } catch (e) {
        console.error('Erro ao carregar perfil', e)
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
    } catch (e) {
      console.error('Erro ao alterar senha', e)
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão.' })
    } finally {
      setSalvando(false)
    }
  }

  const labelClass = "text-slate-400 text-xs uppercase tracking-wider font-light mb-1.5 block"
  const inputClass = "w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm font-light focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent placeholder-slate-600"

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />
      )}

      {/* Sidebar (componente único) */}
      <SidebarAluno 
        sidebarAberta={sidebarAberta}
        setSidebarAberta={setSidebarAberta}
        navigate={navigate}
        logout={logout}
      />

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