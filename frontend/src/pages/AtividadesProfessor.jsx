import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarProfessor from '../components/SidebarProfessor'

const API = import.meta.env.VITE_API_URL

function AtividadesProfessor() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [listas, setListas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [modalAberto, setModalAberto] = useState(false)
  const [turmas, setTurmas] = useState([])
  const [form, setForm] = useState({ turmaId: '', titulo: '', descricao: '', data_entrega: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [deletando, setDeletando] = useState(null) // id da lista a deletar

  useEffect(() => {
    buscarListas()
    buscarTurmas()
  }, [])

  async function buscarListas() {
    try {
      const res = await fetch(`${API}/exercicios/listas/minhas`, { credentials: 'include' })
      const data = await res.json()
      setListas(data.listas || [])
    } catch (e) {
      console.error('Erro ao buscar listas', e)
    } finally {
      setCarregando(false)
    }
  }

  async function buscarTurmas() {
    try {
      const res = await fetch(`${API}/auth/turmas/minhas`, { credentials: 'include' })
      const data = await res.json()
      setTurmas(data.turmas || [])
    } catch (e) {
      console.error('Erro ao buscar turmas', e)
    }
  }

  async function deletarLista(id) {
    try {
      const res = await fetch(`${API}/exercicios/listas/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) return
      setListas(prev => prev.filter(l => l.id !== id))
      setDeletando(null)
    } catch (e) {
      console.error('Erro ao deletar lista', e)
    }
  }

  async function criarLista(e) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const res = await fetch(`${API}/exercicios/listas`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turmaId: parseInt(form.turmaId),
          titulo: form.titulo,
          descricao: form.descricao || undefined,
          data_entrega: new Date(form.data_entrega).toISOString()
        })
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.message || 'Erro ao criar lista.'); return }
      setModalAberto(false)
      setForm({ turmaId: '', titulo: '', descricao: '', data_entrega: '' })
            navigate(`/atividades-professor/${data.id}/montar`)
    } catch (e) {
      setErro('Erro ao criar lista.')
    } finally {
      setSalvando(false)
    }
  }

  const formatarData = (data) => new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const prazoExpirado = (data) => new Date() > new Date(data)

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
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/></svg>
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Atividades</h2>
                <p className="text-slate-400 text-sm font-light">Gerencie listas de exercícios avaliados por IA</p>
              </div>
            </div>
            <button
              onClick={() => setModalAberto(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M12 5v14m-7-7h14"/></svg>
              Nova Lista
            </button>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : listas.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-orange-400"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/></svg>
              </div>
              <p className="text-white font-medium mb-1">Nenhuma lista criada ainda</p>
              <p className="text-slate-400 text-sm font-light">Crie sua primeira lista de exercícios para sua turma</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {listas.map(lista => (
                <div
                  key={lista.id}
                  className="bg-[#1e2d3d] border border-white/5 hover:border-orange-500/20 rounded-2xl p-5 text-left transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-medium text-base mb-1 group-hover:text-orange-400 transition-colors">{lista.titulo}</h3>
                      <p className="text-slate-500 text-xs font-light">{lista.turma}</p>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full border ml-3 ${
                      prazoExpirado(lista.data_entrega)
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : 'bg-green-500/10 text-green-400 border-green-500/20'
                    }`}>
                      {prazoExpirado(lista.data_entrega) ? 'Encerrada' : 'Ativa'}
                    </span>
                  </div>
                  {lista.descricao && <p className="text-slate-400 text-sm font-light mb-3 line-clamp-2">{lista.descricao}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500 font-light">
                      <span>{lista.total_questoes} {lista.total_questoes == 1 ? 'questão' : 'questões'}</span>
                      <span>•</span>
                      <span>Prazo: {formatarData(lista.data_entrega)}</span>
                    </div>
                    <div className="flex gap-2">
                      {parseInt(lista.total_questoes) === 0 ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/atividades-professor/${lista.id}/montar`)}
                            className="text-xs px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-lg transition-colors font-medium"
                          >
                            Montar Lista
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletando(lista.id) }}
                            className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                          </button>
                        </div>
                      ) : (
                        <>
                         <button
                            onClick={(e) => { e.stopPropagation(); setDeletando(lista.id) }}
                            className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                          </button>
                          <button
                            onClick={() => navigate(`/atividades-professor/${lista.id}/montar`)}
                            className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 border border-white/10 rounded-lg transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => navigate(`/atividades-professor/${lista.id}/submissoes`)}
                            className="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                          >
                            Ver Submissões
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal confirmar exclusão */}
      {deletando && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2d3d] rounded-2xl w-full max-w-sm border border-white/10 shadow-2xl p-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-red-400"><path d="M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </div>
            <h3 className="text-white font-medium text-center mb-2">Excluir lista?</h3>
            <p className="text-slate-400 text-sm font-light text-center mb-6">Esta ação não pode ser desfeita. A lista e todas as questões associadas serão removidas.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeletando(null)} className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={() => deletarLista(deletando)} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors text-sm">Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar lista */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2d3d] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-medium text-white">Nova Lista de Exercícios</h2>
              <button onClick={() => setModalAberto(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={criarLista} className="p-6 space-y-4">
              {erro && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{erro}</p>}

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Turma</label>
                <select
                  value={form.turmaId}
                  onChange={e => setForm(f => ({ ...f, turmaId: e.target.value }))}
                  required
className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 pr-8 border border-white/10 focus:border-orange-500 focus:outline-none font-light"                >
                  <option value="">Selecione uma turma</option>
                  {turmas.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Título</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                  required
                  placeholder="Ex: Lista 1 — Equações do 1º grau"
                  className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Descrição (opcional)</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                  rows={3}
                  placeholder="Instruções adicionais para os alunos..."
                  className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light resize-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Prazo de entrega</label>
                <input
                  type="datetime-local"
                  value={form.data_entrega}
                  onChange={e => setForm(f => ({ ...f, data_entrega: e.target.value }))}
                  required
                  className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalAberto(false)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={salvando} className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors">
                  {salvando ? 'Criando...' : 'Criar Lista'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AtividadesProfessor