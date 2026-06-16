import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarAluno from '../components/SidebarAluno'

const API = import.meta.env.VITE_API_URL

function Atividades() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [listas, setListas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [turmaId, setTurmaId] = useState(null)

  useEffect(() => {
    buscarTurmaEListas()
  }, [])

  async function buscarTurmaEListas() {
    try {
      const resTurma = await fetch(`${API}/auth/aluno/minha-turma`, { credentials: 'include' })
      const dataTurma = await resTurma.json()
      const id = dataTurma.turma?.id
      if (!id) { setCarregando(false); return }
      setTurmaId(id)

      const resListas = await fetch(`${API}/exercicios/listas/turma/${id}`, { credentials: 'include' })
      const dataListas = await resListas.json()
      setListas(dataListas.listas || [])
    } catch (e) {
      console.error('Erro ao buscar listas', e)
    } finally {
      setCarregando(false)
    }
  }

  const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const prazoExpirado = (data) => new Date() > new Date(data)

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {sidebarAberta && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />}
      <SidebarAluno
        sidebarAberta={sidebarAberta}
        setSidebarAberta={setSidebarAberta}
        navigate={navigate}
        logout={logout}
      />

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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/></svg>
            </div>
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Atividades</h2>
              <p className="text-slate-400 text-sm font-light">Listas de exercícios da sua turma</p>
            </div>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !turmaId ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <p className="text-white font-medium mb-1">Você não está em nenhuma turma</p>
              <p className="text-slate-400 text-sm font-light">Peça ao seu professor o código de acesso da turma</p>
            </div>
          ) : listas.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-orange-400"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/></svg>
              </div>
              <p className="text-white font-medium mb-1">Nenhuma atividade disponível</p>
              <p className="text-slate-400 text-sm font-light">Seu professor ainda não publicou nenhuma lista</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {listas.map(lista => (
                <div
                  key={lista.id}
                  onClick={() => {
                    if (parseInt(lista.questoes_enviadas) >= parseInt(lista.total_questoes) && parseInt(lista.total_questoes) > 0) return
                    navigate(`/atividades/${lista.id}`)
                  }}
                  className={`border rounded-2xl p-5 text-left transition-all group w-full ${
                    parseInt(lista.questoes_enviadas) >= parseInt(lista.total_questoes) && parseInt(lista.total_questoes) > 0
                      ? 'bg-green-500/5 border-green-500/15 cursor-not-allowed'
                      : 'bg-[#1e2d3d] border-white/5 hover:border-orange-500/20 cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-white font-medium text-base group-hover:text-orange-400 transition-colors flex-1">{lista.titulo}</h3>
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full border ml-3 flex-shrink-0 ${
                      parseInt(lista.questoes_enviadas) >= parseInt(lista.total_questoes) && parseInt(lista.total_questoes) > 0
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : prazoExpirado(lista.data_entrega)
                          ? 'bg-red-500/10 text-red-400 border-red-500/20'
                          : 'bg-orange-500/10 text-orange-400 border-orange-500/20'
                    }`}>
                      {parseInt(lista.questoes_enviadas) >= parseInt(lista.total_questoes) && parseInt(lista.total_questoes) > 0
                        ? 'Concluída'
                        : prazoExpirado(lista.data_entrega) ? 'Encerrada' : 'Disponível'}
                    </span>
                  </div>
                  {lista.descricao && <p className="text-slate-400 text-sm font-light mb-3 line-clamp-2">{lista.descricao}</p>}
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-light">
                      <span>{lista.questoes_enviadas || 0}/{lista.total_questoes} questões</span>
                      <span>•</span>
                      <span>Prazo: {formatarData(lista.data_entrega)}</span>
                    </div>
                    {parseInt(lista.questoes_enviadas) >= parseInt(lista.total_questoes) && parseInt(lista.total_questoes) > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/atividades/${lista.id}/resultado`) }}
                        className="text-xs px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 rounded-lg transition-colors font-medium"
                      >
                        Ver resultado
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Atividades