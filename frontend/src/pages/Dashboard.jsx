import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificacoesAluno } from '../context/NotificacoesAlunoContext'
import SidebarAluno from '../components/SidebarAluno'
import RankingCard from '../components/RankingCard'

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
  const [stats, setStats] = useState(null)
  const [modalFeedbackAberto, setModalFeedbackAberto] = useState(false)
  const [feedbackTipo, setFeedbackTipo] = useState('sugestao')
  const [feedbackMensagem, setFeedbackMensagem] = useState('')
  const [permitirContato, setPermitirContato] = useState(false)
  const [enviandoFeedback, setEnviandoFeedback] = useState(false)
  const [feedbackEnviado, setFeedbackEnviado] = useState(false)
  const [dropdownAberto, setDropdownAberto] = useState(false)
  const [nivelEnsino, setNivelEnsino] = useState(null)

  const API = import.meta.env.VITE_API_URL
  const handleEnviarFeedback = async (e) => {
    e.preventDefault()
    if (feedbackMensagem.trim().length < 10) return alert('A mensagem deve ter pelo menos 10 caracteres.')
    setEnviandoFeedback(true)
    try {
      const res = await fetch(`${API}/auth/feedback`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: feedbackTipo, mensagem: feedbackMensagem, permitirContato })
      })
      if (res.ok) {
        setFeedbackEnviado(true)
        setTimeout(() => {
          setModalFeedbackAberto(false); setFeedbackMensagem(''); setFeedbackTipo('sugestao'); setPermitirContato(false); setFeedbackEnviado(false)
        }, 2000)
      } else {
        const data = await res.json()
        alert(data.message || 'Erro ao enviar feedback')
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setEnviandoFeedback(false)
    }
  }

  useEffect(() => {
  const jaChecou = sessionStorage.getItem('diagnostico_verificado')
  
  // Se já checou, não mostra spinner mas AINDA busca o status em background
  if (!jaChecou) {
    setVerificando(true)
  }
  
  async function verificarDiagnostico() {
    try {
      const res = await fetch(`${API}/auth/diagnostico/status`, {
        credentials: 'include',
      })
      const data = await res.json()
      
      if (data.status === 'pendente') { 
        navigate('/nivelamento')
        return 
      }
      
      setDiagnosticoStatus(data.status)
      sessionStorage.setItem('diagnostico_verificado', 'true')

      // Busca último acesso às matérias
      const [resAcesso, resStats, resTurma] = await Promise.all([
        fetch(`${API}/auth/materias/ultimo-acesso`, { credentials: 'include' }),
        fetch(`${API}/auth/materias/stats`, { credentials: 'include' }),
        fetch(`${API}/auth/aluno/minha-turma`, { credentials: 'include' }),
      ])
      const dataAcesso = await resAcesso.json()
      const dataStats = await resStats.json()
      const dataTurma = await resTurma.json()
      if (dataAcesso.bloco) setUltimoAcesso(dataAcesso)
      setStats(dataStats)
      setNivelEnsino(dataTurma.turma?.tipo_teste || 'universitario')

    } catch (e) {
      console.error('Erro ao verificar diagnóstico', e)
    } finally {
      setVerificando(false)
    }
  }
  
  verificarDiagnostico()
}, [API, navigate])

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
              {nivelEnsino && (
                <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mt-1 ${
                  nivelEnsino === 'universitario' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                  nivelEnsino === 'medio' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                  'bg-green-500/10 text-green-400 border border-green-500/20'
                }`}>
                  {nivelEnsino === 'universitario' ? '🎓 Universitário' :
                   nivelEnsino === 'medio' ? '📚 Ensino Médio' : '🏫 Fundamental'}
                </span>
              )}
            </div>
            <div className="hidden lg:block">
              <SinoBotao />
            </div>
          </div>

          {/* Grid principal */}
          <div className="space-y-6">

            {/* Bloco de Feedback */}
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5 lg:p-6 mb-8">
              <div className="flex items-start lg:items-center justify-between flex-col lg:flex-row gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-orange-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-base">Nos ajude a melhorar!</h3>
                    <p className="text-slate-400 text-sm font-light mt-0.5">Sua opinião é importante. Envie sugestões ou relate problemas.</p>
                  </div>
                </div>
                <button
                    onClick={() => setModalFeedbackAberto(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap w-full lg:w-auto"
                >
                  Enviar Feedback
                </button>
              </div>
            </div>

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
              <RankingCard />
            </div>

            {/* Progresso + Continue */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

             {/* Progresso Geral */}
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">🎯 Seu Progresso Geral</p>
                <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5 lg:p-6 h-full">
                  {stats && stats.total > 0 ? (
                    <>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-3xl font-semibold text-white">
                          {Math.round((stats.feitas / stats.total) * 100)}%
                        </span>
                        <span className="text-slate-400 text-sm font-light mb-1">concluído</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                        <div
                          className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round((stats.feitas / stats.total) * 100)}%` }}
                        />
                      </div>
                      <p className="text-slate-500 text-xs font-light">
                        {stats.feitas} de {stats.total} questões feitas
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-4xl font-semibold text-white">0%</span>
                        <span className="text-slate-400 text-sm font-light mb-1">concluído</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 mb-3">
                        <div className="bg-orange-500/30 h-2 rounded-full w-0" />
                      </div>
                      <p className="text-slate-500 text-xs font-light">
                        Seu progresso aparecerá conforme você avança nas matérias
                      </p>
                    </>
                  )}
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
                          equacao1: 'rgba(245,158,11,0.12)',
                          equacao2: 'rgba(6,182,212,0.12)',
                          modulo: 'rgba(132,204,22,0.12)',
                          exponencial: 'rgba(225,29,72,0.12)',
                          trigonometria: 'rgba(168,85,247,0.12)',
                        }[ultimoAcesso.bloco] }}
                      >
                        { {
                          inteiros: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="10" x2="16" y2="10"/><line x1="10" y1="4" x2="10" y2="16"/><line x1="5" y1="6" x2="5" y2="8"/><line x1="15" y1="12" x2="15" y2="14"/></svg>,
                          fracoes: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"><circle cx="7.5" cy="6.5" r="2" fill="rgba(139,92,246,0.18)" stroke="#8b5cf6"/><circle cx="12.5" cy="13.5" r="2" fill="rgba(139,92,246,0.18)" stroke="#8b5cf6"/><line x1="4" y1="16" x2="16" y2="4"/></svg>,
                          raizes: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,12 5,12 8,16 13,4 16,4"/><line x1="16" y1="4" x2="18" y2="4"/></svg>,
                          potencias: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"><text x="3" y="15" fontSize="11" fontWeight="600" fill="#3b82f6" stroke="none" fontFamily="serif">x</text><text x="11" y="9" fontSize="8" fontWeight="600" fill="#3b82f6" stroke="none" fontFamily="serif">n</text></svg>,
                          geometria: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="10,3 18,17 2,17" fill="rgba(236,72,153,0.15)" stroke="#ec4899"/><line x1="10" y1="3" x2="10" y2="17" strokeDasharray="2 1.5" strokeWidth="1"/></svg>,
                          equacao1: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="10" x2="17" y2="10"/><text x="4" y="8" fontSize="7" fill="#f59e0b" stroke="none" fontFamily="serif">ax+b</text><text x="6" y="18" fontSize="7" fill="#f59e0b" stroke="none" fontFamily="serif">=0</text></svg>,
                          equacao2: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"><path d="M2,17 Q10,5 18,17" fill="none"/></svg>,
                          modulo: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="3" x2="7" y2="17"/><line x1="13" y1="3" x2="13" y2="17"/></svg>,
                          exponencial: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round"><text x="2" y="14" fontSize="9" fill="#e11d48" stroke="none" fontFamily="serif">aˣ</text><text x="10" y="14" fontSize="7" fill="#e11d48" stroke="none" fontFamily="serif">log</text></svg>,
                          trigonometria: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round"><path d="M2,14 Q6,4 10,14 Q14,4 18,14" fill="none"/></svg>,
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
                            equacao1: 'Equação 1º Grau',
                            equacao2: 'Equação 2º Grau',
                            modulo: 'Módulo',
                            exponencial: 'Exponencial e Logaritmo',
                            trigonometria: 'Trigonometria',
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
                            equacao1: '#f59e0b',
                            equacao2: '#06b6d4',
                            modulo: '#84cc16',
                            exponencial: '#e11d48',
                            trigonometria: '#a855f7',
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
                <button onClick={() => navigate('/jogos')} className="bg-[#1e2d3d] border border-white/5 hover:border-orange-500/30 rounded-2xl p-5 lg:p-6 text-left transition-all group hover:bg-orange-500/5">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4 group-hover:bg-orange-500/20 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400">
                      <rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/>
                    </svg>
                  </div>
                  <p className="text-white font-medium text-sm mb-1">Jogos</p>
                  <p className="text-slate-500 text-xs font-light">Pratique matemática de forma divertida</p>
                                    <p className="text-orange-400 text-xs mt-3 font-light group-hover:text-orange-300 transition-colors">Jogar agora</p>
                                </button>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* MODAL DE FEEDBACK */}
      {modalFeedbackAberto && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e2d3d] rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-xl font-medium text-white flex items-center gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>
                  Envie seu Feedback
                </h2>
                <button onClick={() => setModalFeedbackAberto(false)} className="text-slate-400 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <form onSubmit={handleEnviarFeedback} className="p-6 space-y-5">
                {feedbackEnviado ? (
                    <div className="py-8 text-center">
                      <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      </div>
                      <p className="text-green-400 font-medium text-lg">Feedback enviado com sucesso!</p>
                      <p className="text-slate-400 text-sm mt-1 font-light">Obrigado pela sua contribuição.</p>
                    </div>
                ) : (
                    <>
                      <div className="relative">
                        <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">Tipo de Feedback</label>

                        {/* Botão que simula o Select */}
                        <button
                            type="button"
                            onClick={() => setDropdownAberto(!dropdownAberto)}
                            className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 hover:border-white/20 focus:border-orange-500 focus:outline-none font-light flex items-center justify-between transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {feedbackTipo === 'sugestao' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-yellow-400"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
                            {feedbackTipo === 'problema' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-red-400"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                            {feedbackTipo === 'elogio' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-green-400"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>}
                            {feedbackTipo === 'outro' && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-blue-400"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>}
                            <span className="capitalize">{feedbackTipo}</span>
                          </div>

                          {/* Setinha afastada da borda (mr-2) que gira ao abrir */}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 text-slate-400 mr-2 transition-transform duration-200 ${dropdownAberto ? 'rotate-180' : ''}`}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                        </button>

                        {/* Caixa com as opções */}
                        {dropdownAberto && (
                            <div className="absolute z-10 w-full mt-2 bg-[#1e2d3d] border border-white/10 rounded-xl shadow-xl overflow-hidden py-1">
                              {[
                                { id: 'sugestao', label: 'Sugestão', color: 'text-yellow-400', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /> },
                                { id: 'problema', label: 'Problema', color: 'text-red-400', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
                                { id: 'elogio', label: 'Elogio', color: 'text-green-400', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /> },
                                { id: 'outro', label: 'Outro', color: 'text-blue-400', svg: <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /> }
                              ].map((op) => (
                                  <button
                                      key={op.id}
                                      type="button"
                                      onClick={() => { setFeedbackTipo(op.id); setDropdownAberto(false); }}
                                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors ${feedbackTipo === op.id ? 'bg-orange-500/10 text-white' : 'text-slate-400'}`}
                                  >
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-5 h-5 ${op.color}`}>
                                      {op.svg}
                                    </svg>
                                    <span className="capitalize font-light">{op.label}</span>
                                  </button>
                              ))}
                            </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider text-slate-400 font-medium mb-2">Mensagem</label>
                        <textarea value={feedbackMensagem} onChange={(e) => setFeedbackMensagem(e.target.value)} maxLength={500} rows={5} placeholder="Descreva sua sugestão, problema ou comentário..." className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light resize-none" required />
                        <p className={`text-xs mt-1 text-right ${feedbackMensagem.length < 10 ? 'text-orange-400' : 'text-slate-500'}`}>
  {feedbackMensagem.length}/500 caracteres
  {feedbackMensagem.length < 10 && ` — mínimo ${10 - feedbackMensagem.length} caractere${10 - feedbackMensagem.length !== 1 ? 's' : ''}`}
</p>
                      </div>

                      <div className="flex items-start gap-3">
                        <input type="checkbox" id="permitir-contato" checked={permitirContato} onChange={(e) => setPermitirContato(e.target.checked)} className="mt-1 w-4 h-4 rounded border-white/20 bg-[#0f172a] text-orange-500 focus:ring-orange-500 focus:ring-offset-0" />
                        <label htmlFor="permitir-contato" className="text-sm text-slate-400 font-light cursor-pointer leading-snug">
                          Permitir contato para mais informações (seu email será compartilhado)
                        </label>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModalFeedbackAberto(false)} className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors">Cancelar</button>
                        <button type="submit" disabled={enviandoFeedback || feedbackMensagem.trim().length < 10} className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:text-white/50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                          {enviandoFeedback ? 'Enviando...' : 'Enviar Feedback'}
                        </button>
                      </div>
                    </>
                )}
              </form>
            </div>
          </div>
      )}

    </div>
  )
}

export default Dashboard