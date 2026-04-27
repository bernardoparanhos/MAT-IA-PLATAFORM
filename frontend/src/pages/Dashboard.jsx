import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificacoesAluno } from '../context/NotificacoesAlunoContext'
import SidebarAluno from '../components/SidebarAluno'

function tempoRelativo(dataStr) {
  const dataUtc = dataStr.endsWith('Z') ? dataStr : dataStr + 'Z'
  const diff = Math.floor((new Date() - new Date(dataUtc)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'há 1 dia'
  return `há ${Math.floor(diff / 86400)} dias`
}

function Dashboard() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const { notificacoes, naoLidas, marcarLida } = useNotificacoesAluno()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [diagnosticoStatus, setDiagnosticoStatus] = useState(null)
  const [verificando, setVerificando] = useState(false)
  const [painelNotif, setPainelNotif] = useState(false)
  const painelRef = useRef(null)
  const [ultimoAcesso, setUltimoAcesso] = useState(null)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
  const jaChecou = sessionStorage.getItem('diagnostico_verificado')
  
  // Se já checou, não mostra spinner mas AINDA busca o status em background
  if (!jaChecou) {
    setVerificando(true)
  }
  
  async function verificarDiagnostico() {
    try {
      const res = await fetch(`${API}/auth/diagnostico/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.status === 'pendente') { 
        navigate('/nivelamento')
        return 
      }
      
      setDiagnosticoStatus(data.status)
      sessionStorage.setItem('diagnostico_verificado', 'true')

      // Busca último acesso às matérias
      const resAcesso = await fetch(`${API}/auth/materias/ultimo-acesso`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const dataAcesso = await resAcesso.json()
      if (dataAcesso.bloco) setUltimoAcesso(dataAcesso)

    } catch (e) {
      console.error('Erro ao verificar diagnóstico', e)
    } finally {
      setVerificando(false)
    }
  }
  
  verificarDiagnostico()
}, [API, token, navigate])

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

  if (verificando) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

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
          <div className="px-4 py-3 border-b border-white/10">
            <span className="text-white text-sm font-medium">Notificações</span>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8 font-light">
                Nenhuma notificação
              </p>
            ) : (
              notificacoes.slice(0, 5).map(n => (
                <button
                  key={n.id}
                  onClick={() => { marcarLida(n.id); setPainelNotif(false); navigate(`/notificacoes-aluno?id=${n.id}`) }}
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
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />
      )}

      <SidebarAluno 
        sidebarAberta={sidebarAberta}
        setSidebarAberta={setSidebarAberta}
        navigate={navigate}
        logout={logout}
      />

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

          {/* Saudação */}
          <div className="mb-8 lg:mb-10 flex items-start justify-between">
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">
                Olá, {usuario?.nome?.split(' ')[0]} 👋
              </h2>
              <p className="text-slate-400 text-sm mt-1 font-light">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="hidden lg:block">
              <SinoBotao />
            </div>
          </div>

          {/* Grid principal */}
          <div className="space-y-6">

            {/* Banner diagnóstico pulado */}
            {diagnosticoStatus === 'pulado' && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🎯</span>
                  <div>
                    <p className="text-white text-sm font-medium">Você ainda não fez seu diagnóstico</p>
                    <p className="text-slate-400 text-xs font-light mt-0.5">Leva menos de 5 minutos e personaliza toda a sua trilha</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/nivelamento')}
                  className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap flex-shrink-0">
                  Fazer agora
                </button>
              </div>
            )}

           {/* Ranking de Turmas */}
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">🏆 Ranking de Turmas</p>
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5 lg:p-6">
                <div className="space-y-3">
                  {[
                    { pos: 1, medal: '🥇' },
                    { pos: 2, medal: '🥈' },
                    { pos: 3, medal: '🥉' },
                  ].map(({ pos, medal }, idx) => (
                    <div key={pos} className={`flex items-center justify-between py-2 ${idx < 2 ? 'border-b border-white/5' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{medal}</span>
                        <span className="text-slate-500 text-sm font-light">— pts</span>
                      </div>
                      <span className="text-slate-600 text-xs">—</span>
                    </div>
                  ))}
                  <div className="pt-3 mt-1 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-orange-400 text-sm font-medium">—</span>
                        <span className="text-xs text-slate-500 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">você</span>
                      </div>
                      <span className="text-slate-500 text-sm">— pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Progresso + Continue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

              {/* Progresso Geral */}
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">🎯 Seu Progresso Geral</p>
                <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5 lg:p-6 h-full">
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-4xl font-semibold text-white">—</span>
                    <span className="text-slate-400 text-sm font-light mb-1">concluído</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                    <div className="bg-orange-500/30 h-2 rounded-full w-0" />
                  </div>
                  <p className="text-slate-500 text-xs font-light">
                    Seu progresso aparecerá conforme você avança nas matérias
                  </p>
                </div>
              </div>

             {/* Continue de onde parou */}
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">📚 Continue de Onde Parou</p>
                {ultimoAcesso ? (
                  <button
                    onClick={() => navigate(`/materias/${ultimoAcesso.bloco}`)}
                    className="w-full bg-[#1e2d3d] border border-white/5 hover:border-orange-500/20 rounded-2xl p-5 lg:p-6 h-full text-left transition-all group"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: {
                          inteiros: 'rgba(249,115,22,0.12)',
                          fracoes: 'rgba(139,92,246,0.12)',
                          raizes: 'rgba(20,184,166,0.12)',
                          potencias: 'rgba(59,130,246,0.12)',
                          geometria: 'rgba(236,72,153,0.12)',
                        }[ultimoAcesso.bloco] }}
                      >
                        { {
                          inteiros: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="10" x2="16" y2="10"/><line x1="10" y1="4" x2="10" y2="16"/><line x1="5" y1="6" x2="5" y2="8"/><line x1="15" y1="12" x2="15" y2="14"/></svg>,
                          fracoes: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"><circle cx="7.5" cy="6.5" r="2" fill="rgba(139,92,246,0.18)" stroke="#8b5cf6"/><circle cx="12.5" cy="13.5" r="2" fill="rgba(139,92,246,0.18)" stroke="#8b5cf6"/><line x1="4" y1="16" x2="16" y2="4"/></svg>,
                          raizes: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,12 5,12 8,16 13,4 16,4"/><line x1="16" y1="4" x2="18" y2="4"/></svg>,
                          potencias: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"><text x="3" y="15" fontSize="11" fontWeight="600" fill="#3b82f6" stroke="none" fontFamily="serif">x</text><text x="11" y="9" fontSize="8" fontWeight="600" fill="#3b82f6" stroke="none" fontFamily="serif">n</text></svg>,
                          geometria: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="10,3 18,17 2,17" fill="rgba(236,72,153,0.15)" stroke="#ec4899"/><line x1="10" y1="3" x2="10" y2="17" strokeDasharray="2 1.5" strokeWidth="1"/></svg>,
                        }[ultimoAcesso.bloco] }
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium capitalize">
                          {{
                            inteiros: 'Números Inteiros',
                            fracoes: 'Frações',
                            raizes: 'Raízes',
                            potencias: 'Potências',
                            geometria: 'Geometria',
                          }[ultimoAcesso.bloco] || ultimoAcesso.bloco}
                        </p>
                        <p className="text-slate-500 text-xs font-light mt-0.5">
                          {ultimoAcesso.feitas} de {ultimoAcesso.total} questões feitas
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-1.5 mb-3">
                     <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.round((ultimoAcesso.feitas / ultimoAcesso.total) * 100)}%`,
                          background: {
                            inteiros: '#f97316',
                            fracoes: '#8b5cf6',
                            raizes: '#14b8a6',
                            potencias: '#3b82f6',
                            geometria: '#ec4899',
                          }[ultimoAcesso.bloco]
                        }}
                      />
                    </div>
                    <p className="text-orange-400 text-xs font-light group-hover:text-orange-300 transition-colors">
                      Continuar
                    </p>
                  </button>
                ) : (
                  <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5 lg:p-6 h-full flex flex-col items-center justify-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-3">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-slate-500">
                        <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/>
                      </svg>
                    </div>
                    <p className="text-slate-400 text-sm font-light">Nenhuma matéria iniciada ainda</p>
                    <p className="text-slate-600 text-xs mt-1 font-light">Acesse Matérias para começar</p>
                  </div>
                )}
              </div>
            </div>

            {/* Acesso Rápido */}
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">⚡ Acesso Rápido</p>
              <div className="grid grid-cols-2 gap-4">

                {/* Tutor IA */}
                <button className="bg-[#1e2d3d] border border-white/5 hover:border-orange-500/30 rounded-2xl p-5 lg:p-6 text-left transition-all group hover:bg-orange-500/5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400">
                      <path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 16v-4m0-4h.01"/>
                    </svg>
                  </div>
                  <p className="text-white font-medium text-sm mb-1">Tutor IA</p>
                  <p className="text-slate-500 text-xs font-light">Tire dúvidas com inteligência artificial</p>
                  <p className="text-orange-400/60 text-xs mt-3 font-light group-hover:text-orange-400 transition-colors">Em breve</p>
                </button>

                {/* Jogos */}
                <button className="bg-[#1e2d3d] border border-white/5 hover:border-orange-500/30 rounded-2xl p-5 lg:p-6 text-left transition-all group hover:bg-orange-500/5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400">
                      <rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/>
                    </svg>
                  </div>
                  <p className="text-white font-medium text-sm mb-1">Jogos</p>
                  <p className="text-slate-500 text-xs font-light">Pratique matemática de forma divertida</p>
                  <p className="text-orange-400/60 text-xs mt-3 font-light group-hover:text-orange-400 transition-colors">Em breve</p>
                </button>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default Dashboard