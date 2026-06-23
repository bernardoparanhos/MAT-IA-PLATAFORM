import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SidebarProfessor from '../components/SidebarProfessor'
import Formula from '../components/Formula'
import DOMPurify from 'dompurify'

const API = import.meta.env.VITE_API_URL

function AtividadesProfessorSubmissoes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [lista, setLista] = useState(null)
  const [submissoes, setSubmissoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [submissaoAberta, setSubmissaoAberta] = useState(null)
  const [imagemUrl, setImagemUrl] = useState(null)
  const [carregandoImagem, setCarregandoImagem] = useState(false)
  const [notaEditando, setNotaEditando] = useState('')
  const [salvandoNota, setSalvandoNota] = useState(false)
  const [imagemExpandida, setImagemExpandida] = useState(null)
  const [editandoFeedback, setEditandoFeedback] = useState(false)
  const [feedbackEditando, setFeedbackEditando] = useState('')
  const [salvandoFeedback, setSalvandoFeedback] = useState(false)
  const [imagemModeloUrl, setImagemModeloUrl] = useState(null)
  const [carregandoModelo, setCarregandoModelo] = useState(false)

  useEffect(() => {
    buscarDados()
  }, [id])

  async function buscarDados() {
    try {
      const [resLista, resSubmissoes] = await Promise.all([
        fetch(`${API}/exercicios/listas/minhas`, { credentials: 'include' }),
        fetch(`${API}/exercicios/submissoes/lista/${id}`, { credentials: 'include' })
      ])
      const dataListas = await resLista.json()
      const listaAtual = (dataListas.listas || []).find(l => String(l.id) === String(id))
      setLista(listaAtual || null)

      const dataSubmissoes = await resSubmissoes.json()
      setSubmissoes(dataSubmissoes.submissoes || [])
    } catch (e) {
      console.error('Erro ao buscar dados', e)
    } finally {
      setCarregando(false)
    }
  }

  async function abrirSubmissao(s) {
    setSubmissaoAberta(s)
    setNotaEditando(String(s.nota_final ?? s.nota_ia ?? ''))
    setImagemUrl(null)
    setCarregandoImagem(true)
    try {
      const res = await fetch(`${API}/exercicios/submissoes/${s.id}/imagem`, { credentials: 'include' })
      const data = await res.json()
      setImagemUrl(data.url)
    } catch (e) {
      console.error('Erro ao buscar imagem', e)
    } finally {
      setCarregandoImagem(false)
    }
  }

  async function verImagemModelo() {
    if (!submissaoAberta?.imagem_modelo_cloudinary_id) return
    setCarregandoModelo(true)
    try {
      const res = await fetch(`${API}/exercicios/submissoes/${submissaoAberta.id}/imagem-modelo`, { credentials: 'include' })
      const data = await res.json()
      setImagemModeloUrl(data.url)
      setImagemExpandida(data.url)
    } catch (e) {
      console.error('Erro ao buscar imagem modelo', e)
    } finally {
      setCarregandoModelo(false)
    }
  }

  async function salvarNota() {
    const nota = parseFloat(notaEditando)
    if (isNaN(nota) || nota < 0 || nota > 10) return
    setSalvandoNota(true)
    try {
      await fetch(`${API}/exercicios/submissoes/${submissaoAberta.id}/nota`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nota })
      })
      setSubmissoes(prev => prev.map(s =>
        s.id === submissaoAberta.id ? { ...s, nota_final: nota } : s
      ))
      setSubmissaoAberta(prev => ({ ...prev, nota_final: nota }))
    } catch (e) {
      console.error('Erro ao salvar nota', e)
    } finally {
      setSalvandoNota(false)
    }
  }

  async function recorrigir() {
    try {
      await fetch(`${API}/exercicios/submissoes/${submissaoAberta.id}/recorrigir`, {
        method: 'POST',
        credentials: 'include'
      })
      setSubmissoes(prev => prev.map(s =>
        s.id === submissaoAberta.id ? { ...s, status: 'processando' } : s
      ))
      setSubmissaoAberta(prev => ({ ...prev, status: 'processando' }))
    } catch (e) {
      console.error('Erro ao recorrigir', e)
    }
  }

  async function salvarFeedback() {
  if (!feedbackEditando.trim()) return
  setSalvandoFeedback(true)
  try {
    await fetch(`${API}/exercicios/submissoes/${submissaoAberta.id}/feedback`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: feedbackEditando })
    })
    setSubmissoes(prev => prev.map(s =>
      s.id === submissaoAberta.id ? { ...s, feedback_professor: feedbackEditando, feedback_editado: true } : s
    ))
    setSubmissaoAberta(prev => ({ ...prev, feedback_professor: feedbackEditando, feedback_editado: true }))
    setEditandoFeedback(false)
  } catch (e) {
    console.error('Erro ao salvar feedback', e)
  } finally {
    setSalvandoFeedback(false)
  }
}

  const statusLabel = (s) => {
    if (s.status === 'processando') return { label: 'Processando', cor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' }
    if (s.status === 'corrigido') return { label: 'Corrigido', cor: 'bg-green-500/10 text-green-400 border-green-500/20' }
    if (s.status === 'erro') return { label: 'Erro', cor: 'bg-red-500/10 text-red-400 border-red-500/20' }
    return { label: s.status, cor: 'bg-white/5 text-slate-400 border-white/10' }
  }

  // Agrupa submissões por aluno
  const porAluno = submissoes.reduce((acc, s) => {
    const key = s.ra || s.nome
    if (!acc[key]) acc[key] = { nome: s.nome, ra: s.ra, submissoes: [] }
    acc[key].submissoes.push(s)
    return acc
  }, {})

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
                {lista?.descricao && <p className="text-slate-400 text-sm font-light">{lista.descricao}</p>}
              </div>
              <div className="flex gap-6 flex-shrink-0">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Turma</p>
                  <p className="text-white text-sm font-medium">{lista?.turma || '...'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Prazo</p>
                  <p className="text-white text-sm font-medium">{lista?.data_entrega ? new Date(lista.data_entrega).toLocaleDateString('pt-BR') : '...'}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Submissões</p>
                  <p className="text-white text-sm font-medium">{submissoes.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Conteúdo */}
          {submissoes.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-orange-400"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6m-6 4h4"/></svg>
              </div>
              <p className="text-white font-medium mb-1">Nenhuma submissão ainda</p>
              <p className="text-slate-400 text-sm font-light">Os alunos ainda não enviaram respostas para esta lista</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(porAluno).map(aluno => (
                <div key={aluno.ra} className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <span className="text-orange-400 text-xs font-medium">{aluno.nome?.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{aluno.nome}</p>
                      <p className="text-slate-500 text-xs font-light">{aluno.ra}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      {(() => {
                        const corrigidas = aluno.submissoes.filter(s => s.status === 'corrigido' && s.nota_final !== null && s.nota_final !== undefined)
                        if (corrigidas.length === 0) return <span className="text-xs text-slate-500 font-light">{aluno.submissoes.length} resposta{aluno.submissoes.length !== 1 ? 's' : ''}</span>
                        const media = (corrigidas.reduce((acc, s) => acc + parseFloat(s.nota_final), 0) / corrigidas.length).toFixed(1)
                        const cor = parseFloat(media) >= 7 ? 'text-green-400' : parseFloat(media) >= 5 ? 'text-yellow-400' : 'text-red-400'
                        return (
                          <>
                            <span className="text-xs text-slate-500 font-light">{aluno.submissoes.length} resposta{aluno.submissoes.length !== 1 ? 's' : ''}</span>
                            <span className={`text-sm font-medium ${cor}`}>{media}<span className="text-slate-500 text-xs">/10</span></span>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {aluno.submissoes.map(s => {
                      const st = statusLabel(s)
                      return (
                        <button
                          key={s.id}
                          onClick={() => abrirSubmissao(s)}
                          className="w-full px-5 py-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                        >
                          <div className="flex-1 min-w-0">
<div className="text-slate-300 text-sm font-light line-clamp-2">
                              {s.enunciado?.includes('<svg') || s.enunciado?.startsWith('<div')
                                ? <span dangerouslySetInnerHTML={{ __html: s.enunciado }} />
: <Formula tex={s.enunciado?.replace(/\\\(/g, '$').replace(/\\\)/g, '$') || ''} />}                            </div>                            <p className="text-slate-500 text-xs mt-0.5">Tentativa {s.tentativa} · {new Date(s.enviado_em).toLocaleDateString('pt-BR')}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            {s.nota_final !== null && s.nota_final !== undefined && (
                              <span className="text-white font-medium text-sm">{parseFloat(s.nota_final).toFixed(1)}<span className="text-slate-500 text-xs">/10</span></span>
                            )}
                            <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full border ${st.cor}`}>{st.label}</span>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-500"><path d="M9 18l6-6-6-6"/></svg>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal submissão */}
      {submissaoAberta && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1e2d3d] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#1e2d3d] z-10">
              <div>
                <p className="text-white font-medium">{submissaoAberta.nome}</p>
                <p className="text-slate-500 text-xs font-light">{submissaoAberta.ra} · Tentativa {submissaoAberta.tentativa}</p>
              </div>
              <button onClick={() => setSubmissaoAberta(null)} className="text-slate-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Enunciado */}
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Questão</p>
<div className="text-slate-300 text-sm font-light leading-relaxed">
                  {submissaoAberta.enunciado?.includes('<svg') || submissaoAberta.enunciado?.startsWith('<div')
                    ? <span dangerouslySetInnerHTML={{ __html: submissaoAberta.enunciado }} />
                    : <Formula tex={submissaoAberta.enunciado?.replace(/\\\(/g, '$').replace(/\\\)/g, '$') || ''} />}
                </div>              </div>

             {/* Imagem */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Resolução do aluno</p>
                  {submissaoAberta.imagem_modelo_cloudinary_id && (
                    <button
                      onClick={verImagemModelo}
                      disabled={carregandoModelo}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {carregandoModelo ? (
                        <div className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                      Ver modelo do professor
                    </button>
                  )}
                </div>
                {carregandoImagem ? (
                  <div className="flex items-center justify-center h-48 bg-black/20 rounded-xl">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : imagemUrl ? (
<div className="relative group cursor-zoom-in" onClick={() => setImagemExpandida(imagemUrl)}>                    <img src={imagemUrl} alt="Resolução" className="w-full rounded-xl border border-white/10 object-contain max-h-80" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 rounded-xl transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                        Clique para expandir
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-48 bg-black/20 rounded-xl">
                    <p className="text-slate-500 text-sm">Imagem não disponível</p>
                  </div>
                )}
              </div>

              {/* Feedback IA */}
              {submissaoAberta.feedback_ia && (
                <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-slate-500 text-xs uppercase tracking-wider">Análise da IA</p>
                      {submissaoAberta.feedback_editado && (
                        <span className="text-[10px] uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">Editado pelo professor</span>
                      )}
                    </div>
                    {!editandoFeedback && (
                      <button
                        onClick={() => { setEditandoFeedback(true); setFeedbackEditando(submissaoAberta.feedback_professor || submissaoAberta.feedback_ia) }}
                        className="text-slate-500 hover:text-orange-400 transition-colors"
                        title="Editar feedback"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                    )}
                  </div>
                  {editandoFeedback ? (
                    <div className="space-y-2">
                      <textarea
                        value={feedbackEditando}
                        onChange={e => setFeedbackEditando(e.target.value)}
                        rows={4}
                        className="w-full bg-[#0f172a] text-white text-sm rounded-xl px-3 py-2.5 border border-white/10 focus:border-orange-500 focus:outline-none font-light resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={salvarFeedback}
                          disabled={salvandoFeedback}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                        >
                          {salvandoFeedback ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={() => setEditandoFeedback(false)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-lg text-xs transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      const textoFinal = submissaoAberta.feedback_professor || submissaoAberta.feedback_ia
                      const texto = textoFinal.replace(/\\\(/g, '$').replace(/\\\)/g, '$')
                      const temLatex = texto.includes('$') || texto.includes('\\')
                      return temLatex
                        ? <p className="text-slate-300 text-sm font-light leading-relaxed [&_.katex]:text-slate-300 [&_.katex]:text-sm"><Formula tex={texto} /></p>
                        : <p className="text-slate-300 text-sm font-light leading-relaxed">{texto}</p>
                    })()
                  )}
                </div>
              )}

              {/* Nota */}
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Nota final <span className="text-orange-400/60 normal-case tracking-normal font-light">— editável</span></p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={notaEditando}
                    onChange={e => setNotaEditando(e.target.value)}
                    className="w-24 bg-[#0f172a] text-white rounded-xl px-4 py-2.5 border border-white/10 focus:border-orange-500 focus:outline-none font-light text-center text-lg"
                  />
                  <span className="text-slate-500">/10</span>
                  <button
                    onClick={salvarNota}
                    disabled={salvandoNota}
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
                  >
                    {salvandoNota ? 'Salvando...' : 'Salvar nota'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    {imagemExpandida && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={() => setImagemExpandida(null)}>
          <img src={imagemExpandida} alt="Resolução expandida" className="max-w-full max-h-full object-contain rounded-xl" />
          <button onClick={() => setImagemExpandida(null)} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default AtividadesProfessorSubmissoes