import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotificacoes } from '../context/NotificacoesContext'
import SidebarProfessor from '../components/SidebarProfessor'

function tempoRelativo(dataStr) {
  const dataUtc = dataStr.endsWith('Z') ? dataStr : dataStr + 'Z'
  const diff = Math.floor((new Date() - new Date(dataUtc)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'há 1 dia'
  return `há ${Math.floor(diff / 86400)} dias`
}

function TurmasProfessor() {
  const navigate = useNavigate()
  const [turmas, setTurmas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [painelNotif, setPainelNotif] = useState(false)
  const painelRef = useRef(null)
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL
  const { notificacoes, naoLidas, marcarTodasLidas } = useNotificacoes()

  useEffect(() => {
    buscarTurmas()
  }, [])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarAberta(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    function handleClick(e) {
      if (painelRef.current && !painelRef.current.contains(e.target)) setPainelNotif(false)
    }
    if (painelNotif) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [painelNotif])

  async function buscarTurmas() {
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

  const SinoBotao = () => (
    <div className="relative" ref={painelRef}>
      <button onClick={() => setPainelNotif(v => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/>
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>
      {painelNotif && (
        <div className="absolute right-0 top-10 w-80 bg-[#1e2d3d] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white text-sm font-medium">Notificações</span>
            {naoLidas > 0 && (
              <button onClick={marcarTodasLidas} className="text-orange-400 hover:text-orange-300 text-xs transition-colors">
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8 font-light">Nenhuma notificação</p>
            ) : (
              notificacoes.map(n => (
                <button key={n.id}
                  onClick={() => { setPainelNotif(false); navigate(`/notificacoes-professor?id=${n.id}`) }}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${!n.lida ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : ''}`}>
                  <p className={`text-sm ${!n.lida ? 'text-white' : 'text-slate-400'} font-light leading-snug`}>{n.mensagem}</p>
                  <p className="text-slate-600 text-xs mt-1">{tempoRelativo(n.criado_em)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )

  const totalAlunos = turmas.reduce((acc, t) => acc + (parseInt(t.total_alunos) || 0), 0)

  const [alunosPorTurma, setAlunosPorTurma] = useState({})
  const [carregandoAlunos, setCarregandoAlunos] = useState({})
  const [turmasDisponiveis, setTurmasDisponiveis] = useState([])
  const [modalAberto, setModalAberto] = useState(false)
  const [associando, setAssociando] = useState(false)
  const [mensagem, setMensagem] = useState('')

  useEffect(() => {
    if (turmas.length > 0) {
      turmas.forEach(t => buscarAlunos(t.id))
    }
  }, [turmas])

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ turmaId })
      })
      const data = await res.json()
      if (res.ok) {
        setMensagem('Turma associada com sucesso!')
        setModalAberto(false)
        buscarTurmas()
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

  async function buscarAlunos(turmaId) {
    setCarregandoAlunos(prev => ({ ...prev, [turmaId]: true }))
    try {
      const res = await fetch(`${API}/auth/turmas/${turmaId}/alunos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAlunosPorTurma(prev => ({ ...prev, [turmaId]: data.alunos || [] }))
    } catch {
      console.error('Erro ao buscar alunos da turma', turmaId)
    } finally {
      setCarregandoAlunos(prev => ({ ...prev, [turmaId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

      <SidebarProfessor sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} />

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col lg:ml-56">

        {/* Header mobile */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white transition-colors p-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
            </button>
            <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          </div>
          <SinoBotao />
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">

          {/* Header */}
          <div className="mb-8 lg:mb-10 flex items-start justify-between">
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Minhas Turmas</h2>
              <p className="text-slate-400 text-sm mt-1 font-light">
                {turmas.length} {turmas.length === 1 ? 'turma' : 'turmas'} · {totalAlunos} {totalAlunos === 1 ? 'aluno' : 'alunos'} no total
              </p>
            </div>
            <div className="hidden lg:block">
              <SinoBotao />
            </div>
          </div>

          {mensagem && (
            <div className="mb-6 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl px-4 py-3 text-sm font-light">
              {mensagem}
            </div>
          )}

          {/* Cards de turmas */}
          {carregando ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : turmas.length === 0 ? (
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-orange-400">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Nenhuma turma associada</p>
              <p className="text-slate-400 text-sm font-light mb-6">Associe uma turma para começar a acompanhar seus alunos</p>
              <button onClick={abrirModal}
                className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-6 py-2.5 rounded-xl text-sm transition-colors">
                Associar turma
              </button>
            </div>
          ) : (
          <div className="space-y-4">
              {turmas.map(turma => (
                <div key={turma.id}
                  className="bg-[#1e2d3d] border border-white/5 hover:border-orange-500/20 rounded-2xl p-6 transition-all group cursor-pointer"
                  onClick={() => navigate('/turmas-professor')}>
                  
                  {/* Cabeçalho da turma */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-orange-500/15 rounded-xl flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-orange-400">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
                      </svg>
                    </div>
                    <h3 className="text-white font-medium text-lg group-hover:text-orange-300 transition-colors">{turma.nome}</h3>
                  </div>

                  <div className="flex items-center gap-4 ml-11 mb-1">
                    <span className="text-slate-400 text-sm font-light">
                      Código <span className="text-orange-400 font-mono">{turma.codigo_acesso}</span>
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 text-sm font-light">
                      {turma.total_alunos} {turma.total_alunos === 1 ? 'aluno' : 'alunos'}
                    </span>
                  </div>

                  {/* Lista de alunos */}
                  <div className="mt-5 pt-5 border-t border-white/5">
                    {carregandoAlunos[turma.id] ? (
                      <p className="text-slate-500 text-xs font-light">Carregando alunos...</p>
                    ) : (alunosPorTurma[turma.id] || []).length === 0 ? (
                      <p className="text-slate-500 text-xs font-light">Nenhum aluno cadastrado ainda.</p>
                    ) : (
                      <div>
                        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Alunos</p>
                        <div className="space-y-2">
                          {(alunosPorTurma[turma.id] || []).map(aluno => (
                            <div key={aluno.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                                  <span className="text-orange-400 text-xs font-medium">
                                    {aluno.nome.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-white text-sm font-light">{aluno.nome}</p>
                                  <p className="text-slate-500 text-xs">{aluno.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-slate-400 text-xs font-mono">{aluno.ra}</p>
                                <p className="text-slate-600 text-xs mt-0.5">
                                  Entrou {new Date(aluno.entrou_em.endsWith('Z') ? aluno.entrou_em : aluno.entrou_em + 'Z').toLocaleDateString('pt-BR')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              ))}
                     <button
                  onClick={abrirModal}
                  className="w-full bg-white/5 hover:bg-orange-500/10 border border-white/10 hover:border-orange-500/30 rounded-2xl p-5 text-left transition-all flex items-center gap-3 mt-4">
                  <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-orange-400">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                  </div>
                  <span className="text-slate-400 text-sm font-light">Associar nova turma</span>
                </button>
            </div>
          )}
        </main>
      </div>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl p-6 lg:p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-white text-xl font-semibold mb-1">Associar turma</h3>
            <p className="text-slate-400 text-sm font-light mb-6">Escolha a turma que deseja associar</p>
            {turmasDisponiveis.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4 font-light">Nenhuma turma disponível no momento.</p>
            ) : (
              <div className="space-y-3">
                {turmasDisponiveis.map(turma => (
                  <button key={turma.id} onClick={() => associarTurma(turma.id)} disabled={associando}
                    className="w-full bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 rounded-xl p-4 text-left transition-all group disabled:opacity-50">
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

export default TurmasProfessor