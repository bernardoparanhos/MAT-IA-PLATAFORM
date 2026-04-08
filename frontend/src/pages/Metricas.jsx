import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificacoes } from '../context/NotificacoesContext'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const SHEETS_URL = 'https://docs.google.com/spreadsheets/d/1ZrihE1wgnx6EGFZRJ2MI85oIg5isONdPm0TEtvQ7cKA'

const CORES_NIVEL = {
  basico: '#ef4444',
  intermediario: '#f97316',
  avancado: '#22c55e'
}

const LABEL_NIVEL = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado'
}

const LABEL_BLOCO = {
  inteiros: 'Inteiros',
  fracoes: 'Frações',
  raizes: 'Raízes',
  potencias: 'Potências',
  geometria: 'Geometria'
}

const NavItems = ({ onClick, navigate, logout, naoLidas }) => (
  <>
    <nav className="p-4 space-y-1">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Menu</p>
      {[
        { label: 'Início', path: '/dashboard-professor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg> },
        { label: 'Matérias', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg> },
        { label: 'Tutor IA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 16v-4m0-4h.01"/></svg> },
        { label: 'Jogos', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/></svg> },
        { label: 'Fórum', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
      ].map(item => (
        <button key={item.label} onClick={() => { item.path && navigate(item.path); onClick?.() }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
          <span className="text-slate-500">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}

      <div className="border-t border-white/10 my-4" />
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Gestão</p>

      {/* Métricas — ativo */}
      <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-light">
        <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></span>
        <span>Métricas</span>
      </button>

      {[
        { label: 'Turmas', path: '/turmas-professor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> },
        { label: 'Notificações', path: '/notificacoes-professor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/></svg> },
        { label: 'Perfil', path: '/perfil-professor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg> },
      ].map(item => (
        <button key={item.label} onClick={() => { navigate(item.path); onClick?.() }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
          <span className="text-slate-500 relative">
            {item.icon}
            {item.label === 'Notificações' && naoLidas > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
            )}
          </span>
          <span>{item.label}</span>
          {item.label === 'Notificações' && naoLidas > 0 && (
            <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{naoLidas}</span>
          )}
        </button>
      ))}
    </nav>

    <div className="p-4 border-t border-white/10 space-y-1">
      <button onClick={() => { navigate('/configuracoes-professor'); onClick?.() }}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-500"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        <span>Configurações</span>
      </button>
      <button onClick={logout}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-light">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9"/></svg>
        <span>Sair</span>
      </button>
    </div>
  </>
)

function Metricas() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { naoLidas } = useNotificacoes()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [turmas, setTurmas] = useState([])
  const [turmaSelecionada, setTurmaSelecionada] = useState(null)
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [alunoModal, setAlunoModal] = useState(null)
  const [filtroNivel, setFiltroNivel] = useState('todos')
  const [apagando, setApagando] = useState(null)
  const [analiseTurma, setAnaliseTurma] = useState(null)
  const [analiseTurmaData, setAnaliseTurmaData] = useState(null)
  const [carregandoIA, setCarregandoIA] = useState(false)
  const [analiseAluno, setAnaliseAluno] = useState({})
  const [carregandoIAAluno, setCarregandoIAAluno] = useState(null)
  const [sucessoIAAluno, setSucessoIAAluno] = useState(null)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    buscarTurmas()
  }, [])

  useEffect(() => {
    if (turmaSelecionada) {
      setAnaliseTurma(null)
      setAnaliseTurmaData(null)
      setAnaliseAluno({})
      buscarDados(turmaSelecionada)
    }
  }, [turmaSelecionada])

  async function buscarTurmas() {
    try {
      const res = await fetch(`${API}/auth/turmas/minhas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      const t = data.turmas || []
      setTurmas(t)
      if (t.length > 0) setTurmaSelecionada(t[0].id)
    } catch (e) {
      console.error('Erro ao buscar turmas', e)
    }
  }

  async function buscarDados(turmaId) {
    setCarregando(true)
    try {
      const res = await fetch(`${API}/auth/turmas/${turmaId}/diagnosticos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setDados(data)
      if (data.analise_ia) {
        setAnaliseTurma(data.analise_ia)
        setAnaliseTurmaData(data.analise_ia_gerada_em)
      } else {
        setAnaliseTurma(null)
        setAnaliseTurmaData(null)
      }
      const analisesIndividuais = {}
      data.alunos?.forEach(a => {
        if (a.analise_ia) analisesIndividuais[a.id] = a.analise_ia
      })
      setAnaliseAluno(analisesIndividuais)
    } catch (e) {
      console.error('Erro ao buscar dados', e)
    } finally {
      setCarregando(false)
    }
  }

  async function analisarTurma() {
    setCarregandoIA(true)
    setAnaliseTurma(null)
    try {
      const res = await fetch(`${API}/auth/ia/analisar-turma`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ turmaId: turmaSelecionada })
      })
      const data = await res.json()
      setAnaliseTurma(data.analise || 'Não foi possível gerar análise.')
    } catch (e) {
      console.error('Erro ao analisar turma', e)
      setAnaliseTurma('Erro ao consultar IA. Tente novamente.')
    } finally {
      setCarregandoIA(false)
    }
  }

  async function analisarAluno(alunoId) {
    setCarregandoIAAluno(alunoId)
    try {
      const res = await fetch(`${API}/auth/ia/analisar-aluno`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ alunoId })
      })
      const data = await res.json()
      setAnaliseAluno(prev => ({ ...prev, [alunoId]: data.analise || 'Não foi possível gerar análise.' }))
      setSucessoIAAluno(alunoId)
      setTimeout(() => setSucessoIAAluno(null), 3000)
    } catch (e) {
      console.error('Erro ao analisar aluno', e)
      setSucessoIAAluno(`erro-${alunoId}`)
      setTimeout(() => setSucessoIAAluno(null), 3000)
    } finally {
      setCarregandoIAAluno(null)
    }
  }

  async function apagarDiagnostico(alunoId) {
    setApagando(alunoId)
    try {
      await fetch(`${API}/auth/diagnosticos/${alunoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      buscarDados(turmaSelecionada)
    } catch (e) {
      console.error('Erro ao apagar diagnóstico', e)
    } finally {
      setApagando(null)
    }
  }

  // ── Cálculos ──────────────────────────────────────────────────────────────
  const alunosFizeram = dados?.alunos?.filter(a => a.resultado) || []
  const alunosPendentes = dados?.alunos?.filter(a => !a.resultado) || []

  const distribuicaoNivel = ['basico', 'intermediario', 'avancado'].map(n => ({
    name: LABEL_NIVEL[n],
    value: alunosFizeram.filter(a => a.resultado?.nivel === n).length,
    cor: CORES_NIVEL[n]
  })).filter(n => n.value > 0)

  const mediasBlocos = ['inteiros', 'fracoes', 'raizes', 'potencias', 'geometria'].map(bloco => {
    const vals = alunosFizeram.map(a => {
      const b = a.resultado?.blocos?.[bloco]
      return b ? (b.acertos / b.total) * 100 : null
    }).filter(v => v !== null)
    return {
      bloco: LABEL_BLOCO[bloco],
      media: vals.length > 0 ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0
    }
  })

  const menorMedia = Math.min(...mediasBlocos.map(b => b.media))
  const blocosMaisFracos = mediasBlocos.filter(b => b.media === menorMedia)
  const blocoMaisFraco = blocosMaisFracos.length === 1 ? blocosMaisFracos[0] : null

  const mediaGeral = alunosFizeram.length > 0
    ? Math.round(alunosFizeram.reduce((s, a) => s + (a.resultado?.pontuacao || 0), 0) / alunosFizeram.length * 10) / 10
    : null

  const alunosFiltrados = (dados?.alunos || []).filter(a => {
    if (filtroNivel === 'todos') return true
    if (filtroNivel === 'pendente') return !a.resultado
    return a.resultado?.nivel === filtroNivel
  })

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
        <NavItems navigate={navigate} logout={logout} naoLidas={naoLidas} />
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1e2d3d] z-40 flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
            <p className="text-slate-400 text-xs mt-1 font-light">Painel do Professor</p>
          </div>
          <button onClick={() => setSidebarAberta(false)} className="text-slate-400 hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <NavItems onClick={() => setSidebarAberta(false)} navigate={navigate} logout={logout} naoLidas={naoLidas} />
      </aside>

      <div className="flex-1 flex flex-col lg:ml-56">

        {/* Header mobile */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">

          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Métricas</h2>
              <p className="text-slate-400 text-sm mt-1 font-light">Diagnóstico de Nivelamento</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Seletor de turma */}
              <div className="relative">
                <select
                  value={turmaSelecionada || ''}
                  onChange={e => setTurmaSelecionada(Number(e.target.value))}
                  className="bg-[#1e2d3d] border border-white/10 text-white rounded-xl px-4 py-2 text-sm font-light focus:outline-none focus:ring-2 focus:ring-orange-400 appearance-none pr-8"
                >
                  {turmas.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-slate-400"><path d="M6 9l6 6 6-6"/></svg>
                </div>
              </div>
              {/* Link Sheets */}
              <a href={SHEETS_URL} target="_blank" rel="noreferrer"
                className="flex items-center gap-2 bg-[#1e2d3d] border border-white/10 hover:border-green-500/40 text-slate-400 hover:text-green-400 rounded-xl px-4 py-2 text-sm font-light transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 17H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v10a2 2 0 01-2 2h-3"/><polyline points="17 21 12 16 7 21"/></svg>
                Google Sheets
              </a>
            </div>
          </div>

          {carregando ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !dados ? null : (
            <div className="space-y-6">

              {/* Cards visão geral */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total de alunos', valor: dados.alunos?.length || 0, cor: 'text-white' },
                  { label: 'Fizeram o teste', valor: alunosFizeram.length, cor: 'text-green-400' },
                  { label: 'Pendentes', valor: alunosPendentes.length, cor: 'text-orange-400' },
                  { label: 'Média geral', valor: mediaGeral !== null ? `${mediaGeral}/17` : '—', cor: 'text-blue-400' },
                ].map(card => (
                  <div key={card.label} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5">
                    <div className={`text-2xl lg:text-3xl font-semibold mb-1 ${card.cor}`}>{card.valor}</div>
                    <div className="text-slate-400 text-xs font-light">{card.label}</div>
                  </div>
                ))}
              </div>

              {/* Bloco IA — Análise da turma */}
              {alunosFizeram.length > 0 && (
                <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-widest">Análise com IA</p>
                      <p className="text-slate-400 text-xs font-light mt-1">Interpretação pedagógica gerada por IA</p>


                    </div>
                    <button
                      onClick={analisarTurma}
                      disabled={carregandoIA}
                      className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-light transition-colors">
                      {carregandoIA
                        ? <><div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" /> Analisando...</>
                        : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> {analiseTurma ? 'Atualizar análise' : 'Analisar turma com IA'}</>
                      }
                    </button>
                  </div>
                  {analiseTurma && (
                    <div className="bg-[#0f172a] border border-orange-500/20 rounded-xl p-4">
                      <p className="text-slate-300 text-sm font-light leading-relaxed">{analiseTurma}</p>
                      {analiseTurmaData && (
                        <p className="text-slate-600 text-xs mt-2 font-light">
                          Gerada em {new Date(analiseTurmaData).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {alunosFizeram.length === 0 ? (
                <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-10 text-center">
                  <p className="text-white font-medium mb-1">Nenhum diagnóstico realizado ainda</p>
                  <p className="text-slate-400 text-sm font-light">Os gráficos aparecerão quando os alunos completarem o teste.</p>
                </div>
              ) : (
                <>
                  {/* Gráficos */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Pizza — distribuição por nível */}
                    <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6">
                      <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Distribuição por Nível</p>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
<Pie data={distribuicaoNivel} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                            {distribuicaoNivel.map((entry, i) => (
                              <Cell key={i} fill={entry.cor} />
                            ))}
                          </Pie>
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Barras — média por bloco */}
                    <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-slate-500 text-xs uppercase tracking-widest">Média por Bloco (%)</p>
                        {blocoMaisFraco && (
                          <span className="text-xs text-red-400 font-light bg-red-500/10 px-2 py-0.5 rounded-lg">
                            ⚠ {blocoMaisFraco.bloco} mais fraco
                          </span>
                        )}
                        {!blocoMaisFraco && blocosMaisFracos.length > 1 && (
                          <span className="text-xs text-orange-400 font-light bg-orange-500/10 px-2 py-0.5 rounded-lg">
                            ⚠ {blocosMaisFracos.map(b => b.bloco).join(' e ')} empatados
                          </span>
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={mediasBlocos} layout="vertical" margin={{ left: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                          <YAxis type="category" dataKey="bloco" tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
                          <Tooltip formatter={v => `${v}%`} contentStyle={{ background: '#1e2d3d', border: '1px solid #ffffff20', borderRadius: 8 }} />
                          <Bar dataKey="media" fill="#f97316" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}

              {/* Tabela de alunos */}
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                  <p className="text-slate-500 text-xs uppercase tracking-widest">Alunos</p>
                  <div className="flex items-center gap-2">
                    {['todos', 'basico', 'intermediario', 'avancado', 'pendente'].map(f => (
                      <button key={f}
                        onClick={() => setFiltroNivel(f)}
                        className={`text-xs px-3 py-1 rounded-lg transition-colors font-light ${filtroNivel === f ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                        {f === 'todos' ? 'Todos' : f === 'pendente' ? 'Pendentes' : LABEL_NIVEL[f]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="text-left px-6 py-3 text-slate-500 text-xs font-light uppercase tracking-wider">Aluno</th>
                        <th className="text-left px-4 py-3 text-slate-500 text-xs font-light uppercase tracking-wider">RA</th>
                        <th className="text-left px-4 py-3 text-slate-500 text-xs font-light uppercase tracking-wider">Nível</th>
                        <th className="text-left px-4 py-3 text-slate-500 text-xs font-light uppercase tracking-wider">Pontuação</th>
                        <th className="text-left px-4 py-3 text-slate-500 text-xs font-light uppercase tracking-wider">Data</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {alunosFiltrados.map(aluno => (
                        <tr key={aluno.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="px-6 py-3">
                            <button onClick={() => aluno.resultado && setAlunoModal(aluno)}
                              className={`text-sm font-light text-left ${aluno.resultado ? 'text-white hover:text-orange-400 transition-colors' : 'text-slate-500'}`}>
                              {aluno.nome}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs font-mono">{aluno.ra}</td>
                          <td className="px-4 py-3">
                            {aluno.resultado ? (
                              <span className={`text-xs px-2 py-0.5 rounded-lg font-light ${
                                aluno.resultado.nivel === 'avancado' ? 'bg-green-500/10 text-green-400' :
                                aluno.resultado.nivel === 'intermediario' ? 'bg-orange-500/10 text-orange-400' :
                                'bg-red-500/10 text-red-400'
                              }`}>
                                {LABEL_NIVEL[aluno.resultado.nivel]}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-600 font-light">Pendente</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-300 text-sm font-light">
                            {aluno.resultado ? `${aluno.resultado.pontuacao}/17` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-500 text-xs font-light">
                            {aluno.feito_em ? new Date(aluno.feito_em).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {aluno.resultado && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => analisarAluno(aluno.id)}
                                  disabled={carregandoIAAluno === aluno.id}
                                  className="text-slate-600 hover:text-orange-400 transition-colors p-1 rounded-lg hover:bg-orange-400/10 disabled:opacity-50"
                                  title="Analisar com IA">
                                  {carregandoIAAluno === aluno.id
                                    ? <div className="w-3.5 h-3.5 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                                    : sucessoIAAluno === aluno.id
                                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-green-400"><path d="M20 6L9 17l-5-5"/></svg>
                                    : sucessoIAAluno === `erro-${aluno.id}`
                                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-red-400"><path d="M6 18L18 6M6 6l12 12"/></svg>
                                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                                  }
                                </button>
                                <button
                                  onClick={() => apagarDiagnostico(aluno.id)}
                                  disabled={apagando === aluno.id}
                                  className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10 disabled:opacity-50"
                                  title="Resetar diagnóstico">
                                  {apagando === aluno.id
                                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 animate-spin"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
                                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                                  }
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {alunosFiltrados.length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-8 font-light">Nenhum aluno neste filtro.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Modal aluno */}
      {alunoModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={() => setAlunoModal(null)}>
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-white font-semibold text-lg">{alunoModal.nome}</h3>
                <p className="text-slate-400 text-xs font-mono mt-0.5">{alunoModal.ra}</p>
              </div>
              <button onClick={() => setAlunoModal(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <span className={`px-3 py-1 rounded-xl text-sm font-light ${
                alunoModal.resultado.nivel === 'avancado' ? 'bg-green-500/10 text-green-400' :
                alunoModal.resultado.nivel === 'intermediario' ? 'bg-orange-500/10 text-orange-400' :
                'bg-red-500/10 text-red-400'
              }`}>
                {LABEL_NIVEL[alunoModal.resultado.nivel]}
              </span>
              <span className="text-white font-medium">{alunoModal.resultado.pontuacao}/17</span>
              <span className="text-slate-400 text-sm font-light">pontos</span>
            </div>

            {analiseAluno[alunoModal.id] && (
              <div className="bg-[#0f172a] border border-orange-500/20 rounded-xl p-4 mb-5">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Análise IA</p>
                <p className="text-slate-300 text-sm font-light leading-relaxed">{analiseAluno[alunoModal.id]}</p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Desempenho por bloco</p>
              {Object.entries(alunoModal.resultado.blocos).map(([bloco, dados]) => (
                <div key={bloco} className="flex items-center gap-3">
                  <span className="text-slate-400 text-sm font-light w-24">{LABEL_BLOCO[bloco]}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(dados.acertos / dados.total) * 100}%`,
                        background: dados.acertos / dados.total === 0 ? '#ef4444' : dados.acertos / dados.total < 1 ? '#f97316' : '#22c55e'
                      }}
                    />
                  </div>
                  <span className="text-slate-300 text-sm font-light w-12 text-right">{dados.acertos}/{dados.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Metricas