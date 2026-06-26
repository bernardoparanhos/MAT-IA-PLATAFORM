import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarProfessor from '../components/SidebarProfessor'

const API = import.meta.env.VITE_API_URL

function SolicitacoesProfessor() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [solicitacoes, setSolicitacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [processando, setProcessando] = useState(null)

  useEffect(() => {
    buscarSolicitacoes()
  }, [])

  async function buscarSolicitacoes() {
    try {
      const res = await fetch(`${API}/auth/professor/solicitacoes`, { credentials: 'include' })
      const data = await res.json()
      setSolicitacoes(data.solicitacoes || [])
    } catch (e) {
      console.error('Erro ao buscar solicitações', e)
    } finally {
      setCarregando(false)
    }
  }

  async function aprovar(id) {
    setProcessando(id)
    try {
      await fetch(`${API}/auth/professor/solicitacoes/${id}/aprovar`, {
        method: 'PATCH',
        credentials: 'include'
      })
      setSolicitacoes(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'aprovado' } : s
      ))
    } catch (e) {
      console.error('Erro ao aprovar', e)
    } finally {
      setProcessando(null)
    }
  }

  async function rejeitar(id) {
    setProcessando(id)
    try {
      await fetch(`${API}/auth/professor/solicitacoes/${id}/rejeitar`, {
        method: 'PATCH',
        credentials: 'include'
      })
      setSolicitacoes(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'rejeitado' } : s
      ))
    } catch (e) {
      console.error('Erro ao rejeitar', e)
    } finally {
      setProcessando(null)
    }
  }

  const pendentes = solicitacoes.filter(s => s.status === 'pendente')
  const processadas = solicitacoes.filter(s => s.status !== 'pendente')

  const statusLabel = (status) => {
    if (status === 'aprovado') return <span className="text-[10px] uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full">Aprovado</span>
    if (status === 'rejeitado') return <span className="text-[10px] uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">Rejeitado</span>
    return <span className="text-[10px] uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">Pendente</span>
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {sidebarAberta && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />}
      <SidebarProfessor sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} />

      <div className="flex-1 flex flex-col lg:ml-56">
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Solicitações</h2>
              <p className="text-slate-400 text-sm font-light">Gerencie os pedidos de acesso dos alunos</p>
            </div>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {pendentes.length > 0 && (
                <div>
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    Pendentes
                    <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/20">{pendentes.length}</span>
                  </h3>
                  <div className="space-y-2">
                    {pendentes.map(s => (
                      <div key={s.id} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-400 text-sm font-medium">{s.nome?.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{s.nome}</p>
                          <p className="text-slate-500 text-xs font-light">{s.ra} · {s.turma}</p>
                          <p className="text-slate-600 text-xs font-light">{new Date(s.criado_em).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => rejeitar(s.id)}
                            disabled={processando === s.id}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs transition-colors disabled:opacity-50"
                          >
                            Rejeitar
                          </button>
                          <button
                            onClick={() => aprovar(s.id)}
                            disabled={processando === s.id}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                          >
                            {processando === s.id ? '...' : 'Aprovar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {processadas.length > 0 && (
                <div>
                  <h3 className="text-slate-400 font-medium mb-3 text-sm uppercase tracking-wider">Processadas</h3>
                  <div className="space-y-2">
                    {processadas.map(s => (
                      <div key={s.id} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4 flex items-center gap-4 opacity-60">
                        <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-400 text-sm font-medium">{s.nome?.charAt(0)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-300 text-sm font-medium">{s.nome}</p>
                          <p className="text-slate-500 text-xs font-light">{s.ra} · {s.turma}</p>
                        </div>
                        {statusLabel(s.status)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {solicitacoes.length === 0 && (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                  <p className="text-white font-medium mb-1">Nenhuma solicitação ainda</p>
                  <p className="text-slate-400 text-sm font-light">Quando alunos solicitarem acesso, aparecerão aqui</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default SolicitacoesProfessor
