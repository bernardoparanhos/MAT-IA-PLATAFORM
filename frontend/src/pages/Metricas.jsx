import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import SidebarProfessor from '../components/SidebarProfessor'

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


function Metricas() {
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
  const [analiseAberta, setAnaliseAberta] = useState(false)
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
        setAnaliseAberta(false)
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
      setAnaliseAberta(true)
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
    <div className="min-h-screen bg-[#0f172a] flex overflow-x-hidden" style={{ fontFamily: 'Outfit, sans-serif' }}>

     <SidebarProfessor sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} />

      <div className="flex-1 flex flex-col lg:ml-56 min-w-0">

        {/* Header mobile */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 mt-14 lg:mt-0 overflow-x-hidden">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-4 mb-6 lg:mb-8">
  <div>
    <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Métricas</h2>
    <p className="text-slate-400 text-sm mt-1 font-light">Diagnóstico de Nivelamento</p>
  </div>
  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
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
                title="Abrir planilha de resultados no Google Sheets"
                className="flex items-center gap-2 bg-[#1e2d3d] border border-white/10 hover:border-green-500/40 text-slate-400 hover:text-green-400 rounded-xl px-4 py-2 text-sm font-light transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
                </svg>
                Google Sheets
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3 opacity-60">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
  {[
    { label: 'Total de alunos', valor: dados.alunos?.length || 0, cor: 'text-white' },
    { label: 'Fizeram o teste', valor: alunosFizeram.length, cor: 'text-green-400' },
    { label: 'Pendentes', valor: alunosPendentes.length, cor: 'text-orange-400' },
    { label: 'Média geral', valor: mediaGeral !== null ? `${mediaGeral}/17` : '—', cor: 'text-blue-400' },
  ].map(card => (
    <div key={card.label} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4 lg:p-5">
      <div className={`text-xl sm:text-2xl lg:text-3xl font-semibold mb-1 ${card.cor}`}>{card.valor}</div>
      <div className="text-slate-400 text-[11px] sm:text-xs font-light">{card.label}</div>
    </div>
  ))}
</div>

              {/* Bloco IA — Análise da turma */}
              {alunosFizeram.length > 0 && (
                <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4 lg:p-6">
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
    <div className="flex-1 min-w-0">
      <p className="text-slate-500 text-xs uppercase tracking-widest">Análise com IA</p>
      <p className="text-slate-400 text-xs font-light mt-1">Interpretação pedagógica gerada por IA</p>
      {analiseTurma && alunosPendentes.length > 0 && (
        <p className="text-orange-400 text-xs font-light mt-1">
          ⚠ {alunosPendentes.length} aluno{alunosPendentes.length > 1 ? 's ainda não fizeram' : ' ainda não fez'} o teste — atualize após a conclusão.
        </p>
      )}
    </div>
    <div className="flex items-center gap-2 shrink-0">
                      {analiseTurma && (
                        <button
                          onClick={() => setAnaliseAberta(v => !v)}
                          className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-4 h-4 transition-transform ${analiseAberta ? 'rotate-180' : ''}`}>
                            <path d="M6 9l6 6 6-6"/>
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={analisarTurma}
                        disabled={carregandoIA}
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl px-4 py-2 text-sm font-light transition-colors">
                        {carregandoIA
                          ? <><div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" /> Analisando...</>
                          : <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> {analiseTurma ? 'Atualizar' : 'Analisar turma com IA'}</>
                        }
                      </button>
                    </div>
                  </div>
                  {analiseTurma && analiseAberta && (
                    <div className="bg-[#0f172a] border border-orange-500/20 rounded-xl p-4 mt-4">
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
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">

  {/* Pizza — distribuição por nível */}
  <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4 lg:p-6 overflow-hidden">
    <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Distribuição por Nível</p>
    <ResponsiveContainer width="100%" height={240}>
      <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
        <Pie data={distribuicaoNivel} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius="70%">
          {distribuicaoNivel.map((entry, i) => (
            <Cell key={i} fill={entry.cor} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} iconSize={10} />
        <Tooltip contentStyle={{ background: '#1e2d3d', border: '1px solid #ffffff20', borderRadius: 8, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  </div>

  {/* Barras — média por bloco */}
  <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4 lg:p-6 overflow-hidden">
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
      <p className="text-slate-500 text-xs uppercase tracking-widest">Média por Bloco (%)</p>
      {blocoMaisFraco && (
        <span className="text-xs text-red-400 font-light bg-red-500/10 px-2 py-0.5 rounded-lg self-start sm:self-auto">
          ⚠ {blocoMaisFraco.bloco} mais fraco
        </span>
      )}
      {!blocoMaisFraco && blocosMaisFracos.length > 1 && (
        <span className="text-xs text-orange-400 font-light bg-orange-500/10 px-2 py-0.5 rounded-lg self-start sm:self-auto">
          ⚠ {blocosMaisFracos.map(b => b.bloco).join(' e ')} empatados
        </span>
      )}
    </div>
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={mediasBlocos} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} />
        <YAxis type="category" dataKey="bloco" tick={{ fill: '#94a3b8', fontSize: 11 }} width={68} />
        <Tooltip formatter={v => `${v}%`} contentStyle={{ background: '#1e2d3d', border: '1px solid #ffffff20', borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="media" fill="#f97316" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
</div>
                </>
              )}

              {/* Tabela de alunos */}
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 lg:px-6 py-4 border-b border-white/5">
  <p className="text-slate-500 text-xs uppercase tracking-widest">Alunos</p>
  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
    {['todos', 'basico', 'intermediario', 'avancado', 'pendente'].map(f => (
      <button key={f}
        onClick={() => setFiltroNivel(f)}
        className={`text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-lg transition-colors font-light whitespace-nowrap ${filtroNivel === f ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
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
  <div
    className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4 py-6 overflow-y-auto"
    onClick={() => setAlunoModal(null)}
    role="dialog"
    aria-modal="true"
  >
    <div
      className="bg-[#1e2d3d] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col my-auto"
      onClick={e => e.stopPropagation()}
    >
      {/* Header fixo */}
      <div className="flex items-start justify-between gap-3 p-5 lg:p-6 border-b border-white/5">
        <div className="min-w-0 flex-1">
          <h3 className="text-white font-semibold text-lg truncate">{alunoModal.nome}</h3>
          <p className="text-slate-400 text-xs font-mono mt-0.5">{alunoModal.ra}</p>
          {alunoModal.feito_em && (
            <p className="text-slate-500 text-xs font-light mt-1">
              Realizado em {new Date(alunoModal.feito_em).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
        <button
          onClick={() => setAlunoModal(null)}
          className="text-slate-400 hover:text-white transition-colors shrink-0 p-1 -m-1 rounded-lg hover:bg-white/5"
          aria-label="Fechar modal"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Corpo com scroll */}
      <div className="overflow-y-auto p-5 lg:p-6">
        <div className="flex items-center gap-3 flex-wrap mb-5">
          <span className={`px-3 py-1 rounded-xl text-sm font-light ${
            alunoModal.resultado.nivel === 'avancado' ? 'bg-green-500/10 text-green-400' :
            alunoModal.resultado.nivel === 'intermediario' ? 'bg-orange-500/10 text-orange-400' :
            'bg-red-500/10 text-red-400'
          }`}>
            {LABEL_NIVEL[alunoModal.resultado.nivel]}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-white font-medium">{alunoModal.resultado.pontuacao}/17</span>
            <span className="text-slate-400 text-sm font-light">pontos</span>
          </div>
        </div>

        {analiseAluno[alunoModal.id] ? (
          <div className="bg-[#0f172a] border border-orange-500/20 rounded-xl p-4 mb-5">
            <p className="text-slate-500 text-xs uppercase tracking-widest mb-2">Análise IA</p>
            <p className="text-slate-300 text-sm font-light leading-relaxed whitespace-pre-wrap">{analiseAluno[alunoModal.id]}</p>
          </div>
        ) : (
          <button
            onClick={() => analisarAluno(alunoModal.id)}
            disabled={carregandoIAAluno === alunoModal.id}
            className="w-full flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 disabled:opacity-50 text-orange-400 rounded-xl px-4 py-2.5 text-sm font-light transition-colors mb-5 border border-orange-500/20"
          >
            {carregandoIAAluno === alunoModal.id ? (
              <><div className="w-3.5 h-3.5 border border-orange-400 border-t-transparent rounded-full animate-spin" /> Analisando...</>
            ) : (
              <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Analisar com IA</>
            )}
          </button>
        )}

        <div className="space-y-2.5">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Desempenho por bloco</p>
          {alunoModal.resultado.blocos && Object.entries(alunoModal.resultado.blocos).map(([bloco, dados]) => {
            const pct = dados.total > 0 ? dados.acertos / dados.total : 0
            return (
              <div key={bloco} className="flex items-center gap-3">
                <span className="text-slate-400 text-sm font-light w-20 sm:w-24 shrink-0">{LABEL_BLOCO[bloco] || bloco}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2 min-w-0">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${pct * 100}%`,
                      background: pct === 0 ? '#ef4444' : pct < 1 ? '#f97316' : '#22c55e'
                    }}
                  />
                </div>
                <span className="text-slate-300 text-sm font-light w-10 sm:w-12 text-right shrink-0 tabular-nums">{dados.acertos}/{dados.total}</span>
              </div>
            )
          })}
          {!alunoModal.resultado.blocos && (
            <p className="text-slate-500 text-xs font-light italic">Dados por bloco indisponíveis.</p>
          )}
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  )
}

export default Metricas