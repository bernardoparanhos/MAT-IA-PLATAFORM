import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarAluno from '../components/SidebarAluno'
import Formula from '../components/Formula'
import DOMPurify from 'dompurify'

const API = import.meta.env.VITE_API_URL

function AtividadesAluno() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [lista, setLista] = useState(null)
  const [questoes, setQuestoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [indexAtual, setIndexAtual] = useState(0)
  const [submissoes, setSubmissoes] = useState({}) // questaoId -> status
  const [imagemSelecionada, setImagemSelecionada] = useState(null)
  const [preview, setPreview] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [navegacaoPendente, setNavegacaoPendente] = useState(null)
  const [mostrarAvisoSaida, setMostrarAvisoSaida] = useState(false)
    const imagemSelecionadaRef = useRef(null)
      const inputRef = useRef()

  useEffect(() => {
    buscarDados()
  }, [id])

  // Avisa antes de fechar a aba/navegador com imagem selecionada e não enviada
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (imagemSelecionada) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [imagemSelecionada])

  // Intercepta navegação interna (sidebar, botão "Voltar") quando há imagem selecionada
  function tentarNavegar(path) {
    if (imagemSelecionadaRef.current) {
      setNavegacaoPendente(path)
      setMostrarAvisoSaida(true)
    } else {
      navigate(path)
    }
  }

  function continuarRespondendo() {
    setMostrarAvisoSaida(false)
    setNavegacaoPendente(null)
  }

  function sairMesmoAssim() {
    const path = navegacaoPendente
    setMostrarAvisoSaida(false)
    setNavegacaoPendente(null)
    imagemSelecionadaRef.current = null
    setImagemSelecionada(null)
    setPreview(null)
    if (path) navigate(path)
  }

  async function buscarDados() {
    try {
      // Busca turma do aluno
      const resTurma = await fetch(`${API}/auth/aluno/minha-turma`, { credentials: 'include' })
      const dataTurma = await resTurma.json()
      const turmaId = dataTurma.turma?.id
      if (!turmaId) { setCarregando(false); return }

      // Busca listas da turma pra encontrar a lista atual
      const resListas = await fetch(`${API}/exercicios/listas/turma/${turmaId}`, { credentials: 'include' })
      const dataListas = await resListas.json()
      const listaAtual = (dataListas.listas || []).find(l => String(l.id) === String(id))
      setLista(listaAtual || null)

      // Busca questões da lista
      const resQuestoes = await fetch(`${API}/exercicios/listas/${id}/questoes-aluno`, { credentials: 'include' })
      const dataQuestoes = await resQuestoes.json()
      setQuestoes(dataQuestoes.questoes || [])

      // Busca submissões já feitas
      const resSubmissoes = await fetch(`${API}/exercicios/submissoes/minhas`, { credentials: 'include' })
      const dataSubmissoes = await resSubmissoes.json()
      const mapSubmissoes = {}
      for (const s of dataSubmissoes.submissoes || []) {
        if (String(s.lista_id) === String(id)) {
          mapSubmissoes[s.questao_id] = s.status
        }
      }
      setSubmissoes(mapSubmissoes)
    } catch (e) {
      console.error('Erro ao buscar dados', e)
    } finally {
      setCarregando(false)
    }
  }

  function selecionarImagem(e) {
    const file = e.target.files[0]
    if (!file) return
    imagemSelecionadaRef.current = file
    setImagemSelecionada(file)
    setPreview(URL.createObjectURL(file))
    setErro('')
  }

  async function enviarResposta() {
    if (!imagemSelecionada) { setErro('Selecione uma foto da sua resolução.'); return }
    const questaoAtual = questoes[indexAtual]
    if (!questaoAtual) return

    setEnviando(true)
    setErro('')
    try {
      const formData = new FormData()
      formData.append('imagem', imagemSelecionada)
      formData.append('listaId', id)
      formData.append('listaquestaoId', questaoAtual.lista_questao_id)

      const res = await fetch(`${API}/exercicios/submissoes`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      })
      const data = await res.json()

      if (!res.ok) { setErro(data.message || 'Erro ao enviar.'); return }

      setSubmissoes(prev => ({ ...prev, [questaoAtual.questao_id]: 'processando' }))
      imagemSelecionadaRef.current = null
      setImagemSelecionada(null)
      setPreview(null)

      // Vai pra próxima automaticamente
      if (indexAtual < questoes.length - 1) {
        setTimeout(() => setIndexAtual(i => i + 1), 800)
      }
    } catch (e) {
      setErro('Erro ao enviar. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const questaoAtual = questoes[indexAtual]
  const jaEnviou = questaoAtual && submissoes[questaoAtual.questao_id]
  const todasRespondidas = questoes.length > 0 && questoes.every(q => submissoes[q.questao_id])

  const renderEnunciado = (enunciado, latex) => {
    if (!enunciado) return null
    if (enunciado.includes('<svg') || enunciado.startsWith('<div')) {
      return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(enunciado) }} />
    }
    return <Formula tex={enunciado} />
  }

  if (carregando) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>
      {sidebarAberta && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />}
      <SidebarAluno
        sidebarAberta={sidebarAberta}
        setSidebarAberta={setSidebarAberta}
        navigate={tentarNavegar}
        logout={logout}
      />

      <div className="flex-1 flex flex-col lg:ml-56">
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0 max-w-3xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
                        <button onClick={() => tentarNavegar('/atividades')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
              Voltar para Atividades
            </button>
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">{lista?.titulo || '...'}</h2>
                  {lista?.descricao && <p className="text-slate-400 text-sm font-light">{lista.descricao}</p>}
                </div>
                <span className="text-slate-500 text-xs font-light flex-shrink-0 ml-4">
                  Prazo: {lista?.data_entrega ? new Date(lista.data_entrega).toLocaleDateString('pt-BR') : '...'}
                </span>
              </div>
              {!todasRespondidas && (
                <div className="mt-3 flex items-start gap-2 bg-yellow-500/5 border border-yellow-500/15 rounded-xl px-4 py-3">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  <p className="text-yellow-400/80 text-xs font-light leading-relaxed">As fotos anexadas não são salvas se você sair da página. Ao voltar, será necessário anexar novamente.</p>
                </div>
              )}
            </div>
          </div>

          {/* Progresso */}
          {questoes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm font-light">Progresso</span>
                <span className="text-slate-400 text-sm font-light">{Object.keys(submissoes).length}/{questoes.length}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${questoes.length > 0 ? (Object.keys(submissoes).length / questoes.length) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Navegação de questões */}
          {questoes.length > 0 && (
            <div className="flex gap-2 mb-6 flex-wrap">
              {questoes.map((q, i) => (
                <button
                  key={q.questao_id}
                  onClick={() => { setIndexAtual(i); setImagemSelecionada(null); setPreview(null); setErro('') }}
                  className={`w-10 h-10 rounded-xl text-sm font-medium transition-all border ${
                    i === indexAtual
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : submissoes[q.questao_id]
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-orange-500/30'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Questão atual */}
          {todasRespondidas ? (
            <div className="text-center py-16 bg-[#1e2d3d] border border-white/5 rounded-2xl">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-green-400"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="text-white font-medium text-lg mb-2">Todas as questões enviadas!</p>
              <p className="text-slate-400 text-sm font-light mb-6">A IA já está corrigindo suas resoluções. Você será notificado quando terminar.</p>
              <button onClick={() => tentarNavegar('/atividades')} className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-medium transition-colors">
                Voltar para Atividades
              </button>
            </div>
          ) : questaoAtual ? (
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
              {/* Enunciado */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-orange-400 text-sm font-medium">Questão {indexAtual + 1}</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-500 text-sm font-light">{questaoAtual.bloco_nome || ''}</span>
                </div>
                <div className="text-white font-light leading-relaxed text-base">
                                    {renderEnunciado(questaoAtual.enunciado, questaoAtual.latex)}
                </div>
              </div>

              {/* Upload */}
              <div className="p-6">
                {jaEnviou ? (
                  <div className="text-center py-8 bg-green-500/5 border border-green-500/10 rounded-xl">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-green-400 mx-auto mb-2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <p className="text-green-400 font-medium mb-1">Resolução enviada</p>
                    <p className="text-slate-400 text-sm font-light">
                      {jaEnviou === 'processando' ? 'A IA está corrigindo...' : 'Corrigida pela IA'}
                    </p>
                    {indexAtual < questoes.length - 1 && (
                      <button
                        onClick={() => { setIndexAtual(i => i + 1); setImagemSelecionada(null); setPreview(null); setErro('') }}
                        className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
                      >
                        Próxima questão →
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    <p className="text-slate-400 text-sm font-light mb-4">Fotografe sua resolução e envie abaixo</p>

                    {preview ? (
                      <div className="mb-4 relative">
                        <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded-xl border border-white/10" />
                        <button
                                    onClick={() => { imagemSelecionadaRef.current = null; setImagemSelecionada(null); setPreview(null) }}
                          className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => inputRef.current?.click()}
                        className="w-full h-40 border-2 border-dashed border-white/10 hover:border-orange-500/30 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-orange-400 transition-colors mb-4"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                        <span className="text-sm font-light">Clique para selecionar a foto</span>
                        <span className="text-xs text-slate-600">JPG ou PNG, máx 5MB</span>
                      </button>
                    )}

                    <input ref={inputRef} type="file" accept="image/jpeg,image/png" className="hidden" onChange={selecionarImagem} />

                    {erro && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{erro}</p>}

                    <div className="flex gap-3">
                      {preview && (
                        <button
                          onClick={() => inputRef.current?.click()}
                          className="px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl text-sm transition-colors"
                        >
                          Trocar foto
                        </button>
                      )}
                      <button
                        onClick={enviarResposta}
                        disabled={!imagemSelecionada || enviando}
                        className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-medium text-sm transition-colors"
                      >
                        {enviando ? 'Enviando...' : 'Enviar resolução'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
              <p className="text-white font-medium mb-1">Nenhuma questão nesta lista</p>
            </div>
          )}
        </main>
      </div>

      {mostrarAvisoSaida && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-white font-semibold text-lg mb-2">Tem certeza que deseja sair?</h3>
            <p className="text-slate-400 text-sm font-light mb-6">Você selecionou uma foto mas ainda não enviou. Ao sair você perderá a imagem selecionada.</p>
            <div className="flex gap-3">
              <button
                onClick={continuarRespondendo}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-medium transition-colors"
              >
                Continuar respondendo
              </button>
              <button
                onClick={sairMesmoAssim}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium transition-colors"
              >
                Sair mesmo assim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AtividadesAluno