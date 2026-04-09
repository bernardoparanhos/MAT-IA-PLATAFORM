import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificacoes } from '../context/NotificacoesContext'
import SidebarProfessor from '../components/SidebarProfessor'

function tempoRelativo(dataStr) {
  // SQLite salva em UTC sem o 'Z' — adicionamos para o JS interpretar corretamente
  const dataUtc = dataStr.endsWith('Z') ? dataStr : dataStr + 'Z'
  const diff = Math.floor((new Date() - new Date(dataUtc)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'há 1 dia'
  return `há ${Math.floor(diff / 86400)} dias`
}

function DashboardProfessor() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const [turmas, setTurmas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [painelNotif, setPainelNotif] = useState(false)
  const painelRef = useRef(null)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas } = useNotificacoes()


  useEffect(() => {
    buscarMinhasTurmas()
  }, [])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarAberta(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Fecha painel ao clicar fora
  useEffect(() => {
    function handleClick(e) {
      if (painelRef.current && !painelRef.current.contains(e.target)) {
        setPainelNotif(false)
      }
    }
    if (painelNotif) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [painelNotif])

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

  const totalAlunos = turmas.reduce((acc, t) => acc + (parseInt(t.total_alunos) || 0), 0)
  const temTurma = turmas.length > 0

  // ─── Botão sino ──────────────────────────────────────────────────────────────
  const SinoBotao = () => (
    <div className="relative" ref={painelRef}>
      <button
        onClick={() => setPainelNotif(v => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/>
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {/* Painel dropdown */}
      {painelNotif && (
        <div className="absolute right-0 top-10 w-80 bg-[#1e2d3d] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="text-white text-sm font-medium">Notificações</span>
            <div className="flex items-center gap-3">
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} className="text-orange-400 hover:text-orange-300 text-xs transition-colors">
                  Marcar lidas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8 font-light">
                Nenhuma notificação
              </p>
            ) : (
              notificacoes.map(n => (
                <button
                  key={n.id}
                  onClick={() => { marcarLida(n.id); setPainelNotif(false); navigate(`/notificacoes-professor?id=${n.id}`) }}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 transition-colors hover:bg-white/5 ${
                    !n.lida ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : ''
                  }`}
                >
                  <p className={`text-sm ${!n.lida ? 'text-white' : 'text-slate-400'} font-light leading-snug`}>
                    {n.mensagem}
                  </p>
                 <p className="text-slate-600 text-xs mt-1">{tempoRelativo(n.criado_em)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{fontFamily:'Outfit, sans-serif'}}>

     <SidebarProfessor sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} />

      {/* Conteúdo principal */}
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

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0 overflow-y-auto">

          {/* Header desktop */}
          <div className="mb-8 lg:mb-10 flex items-start justify-between">
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
                Olá, Prof. {usuario?.nome?.split(' ')[0]}
              </h2>
              <p className="text-slate-400 text-sm mt-1 font-light">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            {/* Sino desktop */}
            <div className="hidden lg:block">
              <SinoBotao />
            </div>
          </div>

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
                <button onClick={() => navigate('/turmas-professor')} className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-8 py-2.5 rounded-xl text-sm transition-colors">
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
                   <button
  onClick={() => navigate('/turmas-professor')}
  className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block"
>
  Ver detalhes →
</button>
                  </div>
               ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardProfessor