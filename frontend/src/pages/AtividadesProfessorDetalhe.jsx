import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarProfessor from '../components/SidebarProfessor'
import Formula from '../components/Formula'
import DOMPurify from 'dompurify'

const API = import.meta.env.VITE_API_URL

const NOMES_BLOCOS = {
  inteiros: 'Números Inteiros', fracoes: 'Frações', raizes: 'Raízes',
  potencias: 'Potências', geometria: 'Geometria', equacao1: 'Equação 1º Grau',
  equacao2: 'Equação 2º Grau', modulo: 'Módulo', exponencial: 'Exponencial',
  trigonometria: 'Trigonometria'
}

const COR_DIFICULDADE = {
  basico:       { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  tag: 'bg-green-500/10 text-green-400 border-green-500/20',   label: 'Básico',       shortLabel: 'Bás' },
  intermediario:{ bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  tag: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Intermediário', shortLabel: 'Int' },
  avancado:     { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  tag: 'bg-red-500/10 text-red-400 border-red-500/20',          label: 'Avançado',     shortLabel: 'Avç' },
}

function AtividadesProfessorDetalhe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [sidebarAberta, setSidebarAberta] = useState(false)

  // Lista
  const [lista, setLista] = useState(null)
  const [questoesDaLista, setQuestoesDaLista] = useState([])

  // Banco de questões
  const [todasQuestoes, setTodasQuestoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  // Filtros
  const [filtroBloco, setFiltroBloco] = useState('')
  const [filtroDificuldade, setFiltroDificuldade] = useState('')
  const [filtroBusca, setFiltroBusca] = useState('')

  // Modal questão
  const [questaoAberta, setQuestaoAberta] = useState(null)
  const [indexAberto, setIndexAberto] = useState(0)

  // Critérios
  const [criterios, setCriterios] = useState({})

  const [salvando, setSalvando] = useState(false)

  const [imagensModelo, setImagensModelo] = useState({})
  const debounceTimers = useRef({})

  useEffect(() => {
    buscarDados()
  }, [id])

 async function buscarDados() {
    try {
      const [resLista, resQuestoes, resQuestoesDaLista] = await Promise.all([
        fetch(`${API}/exercicios/listas/minhas`, { credentials: 'include' }),
        fetch(`${API}/auth/materias/blocos`, { credentials: 'include' }),
        fetch(`${API}/exercicios/listas/${id}/questoes-professor`, { credentials: 'include' })
      ])
      const dataListas = await resLista.json()
      const listaAtual = (dataListas.listas || []).find(l => String(l.id) === String(id))
      setLista(listaAtual || { id, titulo: '...', turma: '...', data_entrega: null, descricao: '' })

      const dataQuestoesDaLista = await resQuestoesDaLista.json()
      const questoesCarregadas = (dataQuestoesDaLista.questoes || []).map(q => ({
        questaoId: q.questao_id,
        listaquestaoId: q.lista_questao_id,
        numero: q.numero,
        enunciado: q.enunciado,
        bloco: q.bloco,
        dificuldade: q.dificuldade
      }))
      setQuestoesDaLista(questoesCarregadas)

      // Busca questões de todos os blocos
      const blocos = ['inteiros','fracoes','raizes','potencias','geometria','equacao1','equacao2','modulo','exponencial','trigonometria']
      const todasPromises = blocos.map(b =>
        fetch(`${API}/auth/materias/${b}/questoes`, { credentials: 'include' })
          .then(r => r.json())
          .then(d => (d.questoes || []).map(q => ({ ...q, bloco: b })))
      )
      const resultados = await Promise.all(todasPromises)
      setTodasQuestoes(resultados.flat())
    } catch (e) {
      console.error('Erro ao buscar dados', e)
    } finally {
      setCarregando(false)
    }
  }

  const questoesFiltradas = todasQuestoes.filter(q => {
    if (filtroBloco && q.bloco !== filtroBloco) return false
    if (filtroDificuldade && q.dificuldade !== filtroDificuldade) return false
    if (filtroBusca && !q.enunciado.toLowerCase().includes(filtroBusca.toLowerCase())) return false
    return true
  })

  const jaAdicionada = (questaoId) => questoesDaLista.some(q => q.questaoId === questaoId)

  function abrirQuestao(q, index) {
    setQuestaoAberta(q)
    setIndexAberto(index)
  }

  function navegarQuestao(direcao) {
    const novoIndex = indexAberto + direcao
    if (novoIndex >= 0 && novoIndex < questoesFiltradas.length) {
      setQuestaoAberta(questoesFiltradas[novoIndex])
      setIndexAberto(novoIndex)
    }
  }

  async function adicionarQuestao(q) {
    if (jaAdicionada(q.id)) return
    if (questoesDaLista.length >= 12) return
    const numero = questoesDaLista.length + 1
    try {
      const res = await fetch(`${API}/exercicios/listas/${id}/questoes`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questaoId: q.id, numero, peso: 1.0, criterios_ia: null })
      })
      const data = await res.json()
      if (!res.ok) return
      setQuestoesDaLista(prev => [...prev, {
        questaoId: q.id,
        listaquestaoId: data.id,
        numero,
        enunciado: q.enunciado,
        bloco: q.bloco,
        dificuldade: q.dificuldade,
        latex: q.latex
      }])
    } catch (e) {
      console.error('Erro ao adicionar questão', e)
    }
  }

  async function removerQuestao(questaoId) {
    const questao = questoesDaLista.find(q => q.questaoId === questaoId)
    if (!questao?.listaquestaoId) return
    try {
      const res = await fetch(`${API}/exercicios/listas/${id}/questoes/${questao.listaquestaoId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!res.ok) return
      setQuestoesDaLista(prev =>
        prev.filter(q => q.questaoId !== questaoId).map((q, i) => ({ ...q, numero: i + 1 }))
      )
    } catch (e) {
      console.error('Erro ao remover questão', e)
    }
  }

  function handleCriterioChange(questaoId, listaquestaoId, valor) {
    setCriterios(prev => ({ ...prev, [questaoId]: valor }))
    clearTimeout(debounceTimers.current[questaoId])
    debounceTimers.current[questaoId] = setTimeout(async () => {
      try {
        await fetch(`${API}/exercicios/listas/${id}/questoes/${listaquestaoId}/criterio`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ criterios_ia: valor || null })
        })
      } catch (e) {
        console.error('Erro ao salvar critério', e)
      }
    }, 800)
  }


  async function uploadImagemModelo(questaoId, listaquestaoId, file) {
    if (!file) return
    setImagensModelo(prev => ({ ...prev, [questaoId]: { uploading: true } }))
    try {
      const formData = new FormData()
      formData.append('imagem', file)
      const res = await fetch(`${API}/exercicios/listas/${id}/questoes/${listaquestaoId}/imagem-modelo`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const data = await res.json()
      if (res.ok) {
        setImagensModelo(prev => ({ ...prev, [questaoId]: { uploading: false, publicId: data.publicId } }))
      } else {
        setImagensModelo(prev => ({ ...prev, [questaoId]: { uploading: false } }))
      }
    } catch (e) {
      console.error('Erro ao fazer upload da imagem modelo', e)
      setImagensModelo(prev => ({ ...prev, [questaoId]: { uploading: false } }))
    }
  }

  async function publicarLista() {
    if (questoesDaLista.length === 0) return
    setSalvando(true)
    try {
      const res = await fetch(`${API}/exercicios/listas/${id}/ativar`, {
        method: 'PATCH',
        credentials: 'include'
      })
      if (res.ok) navigate('/atividades-professor')
    } catch (e) {
      console.error('Erro ao publicar', e)
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

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

        <main className="flex-1 p-6 lg:p-8 mt-14 lg:mt-0">

         {/* Header */}
          <div className="mb-6">
            <button onClick={() => navigate('/atividades-professor')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
              Voltar para Atividades
            </button>
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5 flex flex-wrap gap-6 items-start">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-semibold text-white mb-1">{lista?.titulo || '...'}</h2>
                {lista?.descricao && <p className="text-slate-400 text-sm font-light mb-2">{lista.descricao}</p>}
              </div>
              <div className="flex gap-6 flex-shrink-0">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Turma</p>
                  <p className="text-white text-sm font-medium">{lista?.turma || '...'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Prazo</p>
                  <p className="text-white text-sm font-medium">{lista?.data_entrega ? new Date(lista.data_entrega).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '...'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Questões</p>
                  <p className="text-white text-sm font-medium">{questoesDaLista.length}/12</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-6">

            {/* ── Coluna esquerda: banco de questões ── */}
            <div className="flex-1 min-w-0">

              {/* Filtros */}
              <div className="flex flex-wrap gap-3 mb-5">
                <select
                  value={filtroBloco}
                  onChange={e => setFiltroBloco(e.target.value)}
                  className="bg-[#1e2d3d] text-white text-sm rounded-xl px-3 py-2 pr-8 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
                >
                  <option value="">Todos os blocos</option>
                  {Object.entries(NOMES_BLOCOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>

                <select
                  value={filtroDificuldade}
                  onChange={e => setFiltroDificuldade(e.target.value)}
className="bg-[#1e2d3d] text-white text-sm rounded-xl px-3 py-2 pr-8 border border-white/10 focus:border-orange-500 focus:outline-none font-light"                >
                  <option value="">Todas as dificuldades</option>
                  <option value="basico">Básico</option>
                  <option value="intermediario">Intermediário</option>
                  <option value="avancado">Avançado</option>
                </select>

                <input
                  type="text"
                  value={filtroBusca}
                  onChange={e => setFiltroBusca(e.target.value)}
                  placeholder="Buscar por palavra..."
                  className="bg-[#1e2d3d] text-white text-sm rounded-xl px-3 py-2 border border-white/10 focus:border-orange-500 focus:outline-none font-light flex-1 min-w-48"
                />

                <span className="text-slate-500 text-sm font-light self-center">{questoesFiltradas.length} questões</span>
              </div>

              {/* Grid de questões */}
              <div className="grid gap-[6px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
                {questoesFiltradas.map((q, index) => {
                  const cor = COR_DIFICULDADE[q.dificuldade] || COR_DIFICULDADE.intermediario
                  const adicionada = jaAdicionada(q.id)
                  return (
                    <div
                      key={q.id}
                      onClick={() => abrirQuestao(q, index)}
                      className="relative rounded-xl border cursor-pointer transition-all hover:scale-105 flex flex-col items-center justify-center gap-1 p-2"
                      style={{
                        height: '78px',
                        background: adicionada ? 'rgba(249,115,22,0.12)' : cor.bg,
                        borderColor: adicionada ? 'rgba(249,115,22,0.5)' : cor.border,
                      }}
                    >
                      {adicionada && (
                        <span className="absolute top-1 right-1 text-orange-400">
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </span>
                      )}
                      <span className="text-white text-sm font-light">{index + 1}</span>
                      <span className={`text-[9px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full border ${cor.tag}`}>
                        {cor.label}
                      </span>
                      <span className="text-slate-500 text-[9px] w-full text-center truncate leading-tight">{NOMES_BLOCOS[q.bloco] || q.bloco}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Coluna direita: lista montada ── */}
            <div className="w-80 flex-shrink-0">
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Lista montada</h3>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${questoesDaLista.length >= 12 ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {questoesDaLista.length}/12
                  </span>
                </div>

                {questoesDaLista.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                    <p className="text-slate-500 text-sm font-light">Clique nas questões para adicionar</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                    {questoesDaLista.map(q => {
                      const cor = COR_DIFICULDADE[q.dificuldade] || COR_DIFICULDADE.intermediario
                      return (
                        <div key={q.questaoId} className="rounded-xl border p-3" style={{ background: cor.bg, borderColor: cor.border }}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-slate-400 text-xs font-light">Q{q.numero}</span>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => { const found = todasQuestoes.find(tq => String(tq.id) === String(q.questaoId)); if (found) setQuestaoAberta(found) }}
                                className="text-slate-500 hover:text-blue-400 transition-colors"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              </button>
                              <button onClick={() => removerQuestao(q.questaoId)} className="text-slate-500 hover:text-red-400 transition-colors">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            </div>
                          </div>
                          <div className="text-slate-300 text-xs font-light leading-relaxed line-clamp-2 mb-2">
                            {(q.enunciado.includes('<svg') || q.enunciado.trimStart().startsWith('<div'))
                              ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(q.enunciado) }} />
                              : <Formula tex={q.enunciado} />}
                          </div>
                          <input
                            type="text"
                            value={criterios[q.questaoId] || ''}
                            onChange={e => handleCriterioChange(q.questaoId, q.listaquestaoId, e.target.value)}
                            placeholder="Critério para IA (opcional)"
                            className="w-full bg-black/20 text-white text-xs rounded-lg px-2 py-1.5 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
                          />
                          <div className="mt-1.5">
                            <label className="flex items-center gap-1.5 cursor-pointer group">
                              <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-colors ${
                                imagensModelo[q.questaoId]?.publicId
                                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                  : 'bg-black/20 border-white/10 text-slate-500 group-hover:border-orange-500/30 group-hover:text-slate-400'
                              }`}>
                                {imagensModelo[q.questaoId]?.uploading ? (
                                  <div className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                  </svg>
                                )}
                                <span>
                                  {imagensModelo[q.questaoId]?.publicId
                                    ? 'Modelo enviado ✓'
                                    : imagensModelo[q.questaoId]?.uploading
                                      ? 'Enviando...'
                                      : 'Resolução modelo (opcional)'}
                                </span>
                              </div>
                              <input
                                type="file"
                                accept="image/jpeg,image/png"
                                className="hidden"
                                onChange={e => {
                                  const file = e.target.files[0]
                                  if (file && q.listaquestaoId) uploadImagemModelo(q.questaoId, q.listaquestaoId, file)
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <button
                  onClick={publicarLista}
                  disabled={questoesDaLista.length === 0 || salvando}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
                >
                  {salvando ? 'Publicando...' : 'Publicar Lista'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal questão */}
      {questaoAberta && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setQuestaoAberta(null) }}
        >
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">

            {/* Header modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-light">Questão {questaoAberta.numero}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                <span className="text-xs font-light text-slate-400">{NOMES_BLOCOS[questaoAberta.bloco]}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600 flex-shrink-0" />
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${(COR_DIFICULDADE[questaoAberta.dificuldade] || COR_DIFICULDADE.intermediario).tag}`}>
                  {(COR_DIFICULDADE[questaoAberta.dificuldade] || COR_DIFICULDADE.intermediario).label}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => navegarQuestao(-1)}
                  disabled={indexAberto === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <span className="text-xs text-slate-600 font-light px-1">{indexAberto + 1}/{questoesFiltradas.length}</span>
                <button
                  onClick={() => navegarQuestao(1)}
                  disabled={indexAberto === questoesFiltradas.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button onClick={() => setQuestaoAberta(null)} className="text-slate-500 hover:text-white transition-colors p-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Enunciado */}
            <div className="px-5 py-5">
              <div className="text-slate-200 text-sm font-light leading-relaxed mb-5 [&_svg]:max-w-full [&_svg]:h-auto [&_div]:max-w-full">
                {questaoAberta.enunciado.includes('<svg')
                  ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(questaoAberta.enunciado) }} />
                  : questaoAberta.latex
                    ? <Formula tex={questaoAberta.enunciado} block={true} />
                    : <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(questaoAberta.enunciado) }} />}
              </div>

              {/* Alternativas */}
              {questaoAberta.alternativas && (
                <div className="space-y-2">
                  {Object.entries(questaoAberta.alternativas).map(([letra, texto]) => (
                    <div key={letra} className="flex items-start gap-3 px-4 py-3 rounded-xl border border-white/8 bg-white/3 text-sm font-light">
                      <span className="font-medium text-orange-400 flex-shrink-0">{letra}.</span>
                      <span className="text-slate-300">
                        {(questaoAberta.latex && !questaoAberta.enunciado.includes('<svg')) || texto.includes('$')
                          ? <Formula tex={texto} />
                          : texto}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer modal */}
            <div className="px-5 pb-5">
              <button
                onClick={() => { adicionarQuestao(questaoAberta); setQuestaoAberta(null) }}
                disabled={jaAdicionada(questaoAberta.id) || questoesDaLista.length >= 12}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
              >
                {jaAdicionada(questaoAberta.id) ? '✓ Já adicionada' : questoesDaLista.length >= 12 ? 'Lista completa (12/12)' : '+ Adicionar à Lista'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default AtividadesProfessorDetalhe