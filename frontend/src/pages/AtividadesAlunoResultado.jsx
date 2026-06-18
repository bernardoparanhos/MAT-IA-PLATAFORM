import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarAluno from '../components/SidebarAluno'
import Formula from '../components/Formula'

const API = import.meta.env.VITE_API_URL

function AtividadesAlunoResultado() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [lista, setLista] = useState(null)
  const [submissoes, setSubmissoes] = useState([])
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    buscarResultado()
  }, [id])

  async function buscarResultado() {
    try {
      const resTurma = await fetch(`${API}/auth/aluno/minha-turma`, { credentials: 'include' })
      const dataTurma = await resTurma.json()
      const turmaId = dataTurma.turma?.id
      if (!turmaId) { setCarregando(false); return }

      const resListas = await fetch(`${API}/exercicios/listas/turma/${turmaId}`, { credentials: 'include' })
      const dataListas = await resListas.json()
      const listaAtual = (dataListas.listas || []).find(l => String(l.id) === String(id))
      setLista(listaAtual || null)

      const resSubmissoes = await fetch(`${API}/exercicios/submissoes/minhas`, { credentials: 'include' })
      const dataSubmissoes = await resSubmissoes.json()
      const minhas = (dataSubmissoes.submissoes || []).filter(s => String(s.lista_id) === String(id))
      setSubmissoes(minhas)
    } catch (e) {
      console.error('Erro ao buscar resultado', e)
    } finally {
      setCarregando(false)
    }
  }

  const notaMedia = submissoes.length > 0
    ? (submissoes.reduce((acc, s) => acc + parseFloat(s.nota_final || 0), 0) / submissoes.length).toFixed(1)
    : null

  const todasCorrigidas = submissoes.length > 0 && submissoes.every(s => s.status === 'corrigido')

  const corNota = (nota) => {
    const n = parseFloat(nota)
    if (n >= 7) return 'text-green-400'
    if (n >= 5) return 'text-yellow-400'
    return 'text-red-400'
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
        navigate={navigate}
        logout={logout}
      />

      <div className="flex-1 flex flex-col lg:ml-56">
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-8 mt-14 lg:mt-0 max-w-3xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6">
            <button onClick={() => navigate('/atividades')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-light">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
              Voltar para Atividades
            </button>

            {/* Card resumo */}
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-1">{lista?.titulo || '...'}</h2>
                  {lista?.descricao && <p className="text-slate-400 text-sm font-light">{lista.descricao}</p>}
                </div>
                <span className="bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full flex-shrink-0 ml-3">
                  Concluída
                </span>
              </div>

              {todasCorrigidas && notaMedia !== null ? (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className={`text-4xl font-light ${corNota(notaMedia)}`}>{notaMedia}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Média geral</p>
                  </div>
                  <div className="flex-1 h-px bg-white/5" />
                  <div className="text-center">
                    <p className="text-white text-lg font-light">{submissoes.length}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-wider mt-1">Questões</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-yellow-400 text-sm">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  A IA ainda está corrigindo suas resoluções...
                </div>
              )}
            </div>
          </div>

          {/* Questões */}
          <div className="space-y-4">
            {submissoes.map((s, i) => (
              <div key={s.id} className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm font-light">Questão {i + 1}</span>
                    {s.status === 'processando' && (
                      <span className="text-[10px] uppercase tracking-wider bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-2 py-0.5 rounded-full">Corrigindo...</span>
                    )}
                  </div>
                  {s.status === 'corrigido' && (
                    <span className={`text-2xl font-light ${corNota(s.nota_final)}`}>
                      {parseFloat(s.nota_final).toFixed(1)}<span className="text-slate-500 text-sm">/10</span>
                    </span>
                  )}
                </div>

                {s.status === 'corrigido' && s.feedback_ia && (
                  <div className="px-5 py-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Feedback da IA</p>
                   {(() => {
                      const texto = s.feedback_ia.replace(/\\\(/g, '$').replace(/\\\)/g, '$').replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
                      const temLatex = texto.includes('$') || texto.includes('\\')
                      return temLatex
                        ? <p className="text-slate-300 text-sm font-light leading-relaxed [&_.katex]:text-slate-300 [&_.katex]:text-sm"><Formula tex={texto} /></p>
                        : <p className="text-slate-300 text-sm font-light leading-relaxed">{texto}</p>
                    })()}
                  </div>
                )}

                {s.enunciado && (
                  <div className="px-5 pb-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Questão</p>
                    <div className="text-slate-400 text-sm font-light leading-relaxed">
                      {s.enunciado.includes('<svg') || s.enunciado.startsWith('<div')
                        ? <span dangerouslySetInnerHTML={{ __html: s.enunciado }} />
                        : s.enunciado.includes('$') || s.enunciado.includes('\\')
                          ? <Formula tex={s.enunciado} />
                          : s.enunciado}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AtividadesAlunoResultado