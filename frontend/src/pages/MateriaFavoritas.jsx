import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarAluno from '../components/SidebarAluno'

const BLOCOS_CONFIG = {
  inteiros:  { label: 'Números Inteiros', cor: '#f97316' },
  fracoes:   { label: 'Frações',          cor: '#8b5cf6' },
  raizes:    { label: 'Raízes',           cor: '#14b8a6' },
  potencias: { label: 'Potências',        cor: '#3b82f6' },
  geometria: { label: 'Geometria',        cor: '#ec4899' },
}

function MateriaFavoritas() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [porBloco, setPorBloco] = useState({})
  const [total, setTotal] = useState(0)
  const [carregando, setCarregando] = useState(true)
  const [modalQuestao, setModalQuestao] = useState(null)
  const [respostaModal, setRespostaModal] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [toast, setToast] = useState(null)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`${API}/auth/materias/favoritas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setPorBloco(data.porBloco || {})
      setTotal(data.total || 0)
    } catch (e) {
      console.error('Erro ao carregar favoritas', e)
    } finally {
      setCarregando(false)
    }
  }, [API, token])

  useEffect(() => { carregar() }, [carregar])

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') fecharModal() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  function fecharModal() {
    setModalQuestao(null)
    setRespostaModal(null)
    setFeedbackModal(null)
  }

  function mostrarToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  async function desfavoritar(questaoId) {
    try {
      await fetch(`${API}/auth/materias/favoritar/${questaoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      await carregar()
      if (modalQuestao?.id === questaoId) fecharModal()
      mostrarToast('Removido das favoritas')
    } catch (e) {
      console.error('Erro ao desfavoritar', e)
    }
  }

  async function responder() {
    if (!respostaModal || enviando || feedbackModal) return
    setEnviando(true)
    try {
      const res = await fetch(`${API}/auth/materias/responder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ questaoId: modalQuestao.id, respostaDada: respostaModal })
      })
      const data = await res.json()
      setFeedbackModal({ acertou: data.acertou, correta: data.correta })
      setTimeout(() => fecharModal(), 1500)
    } catch (e) {
      console.error('Erro ao responder', e)
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
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

        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">

          <button onClick={() => navigate('/materias')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-light mb-6 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
            Matérias
          </button>

         <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.25)', color: '#facc15' }}>★</div>
            <div>
              <h2 className="text-xl font-semibold text-white">Favoritas</h2>
              <p className="text-slate-500 text-xs font-light mt-0.5">{total} questão{total !== 1 ? 'ões' : ''} salva{total !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {total === 0 ? (
            <div className="bg-[#1e2d3d] border border-white/6 rounded-xl p-10 text-center">
              <p className="text-3xl mb-3">☆</p>
              <p className="text-slate-400 text-sm font-light">Nenhuma questão favoritada ainda</p>
              <p className="text-slate-600 text-xs mt-1 font-light">Clique na estrela dentro de qualquer bloco para salvar aqui</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(porBloco).map(([bloco, questoes]) => {
                const cfg = BLOCOS_CONFIG[bloco]
                if (!cfg || !questoes.length) return null
                return (
                  <div key={bloco}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full" style={{ background: cfg.cor }} />
                      <p className="text-xs text-slate-400 font-light uppercase tracking-wider">{cfg.label}</p>
                      <p className="text-xs text-slate-600 font-light">· {questoes.length}</p>
                    </div>
                    <div className="grid gap-[6px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}>
                      {questoes.map((q, idx) => (
                        <div
                          key={q.id}
                          className="relative rounded-[8px] border cursor-pointer transition-all hover:scale-105"
                          style={{ height: '48px', background: 'rgba(250,204,21,0.08)', borderColor: 'rgba(250,204,21,0.2)' }}
                          onClick={() => { setModalQuestao({ ...q, numero: idx + 1 }); setRespostaModal(null); setFeedbackModal(null) }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-[12px] font-light" style={{ color: '#facc15' }}>
                            {idx + 1}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); desfavoritar(q.id) }}
                            className="absolute bottom-0 right-0 p-2 leading-none text-yellow-400"
                            style={{ fontSize: '11px' }}
                          >★</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {modalQuestao && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal() }}
        >
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-light">Questão {modalQuestao.numero}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-xs font-light text-yellow-400">★ Favoritada</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => desfavoritar(modalQuestao.id)}
                  className="text-yellow-400/60 hover:text-yellow-400 text-xs font-light transition-colors"
                >
                  Remover
                </button>
                <button onClick={fecharModal} className="text-slate-500 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            <div className="px-5 py-5">
              <p className="text-slate-200 text-sm font-light leading-relaxed mb-5">{modalQuestao.enunciado}</p>
              <div className="space-y-2">
                {Object.entries(modalQuestao.alternativas).map(([letra, texto]) => {
                  let estilo = 'border-white/8 text-slate-300 hover:border-white/20 hover:bg-white/3'
                  if (feedbackModal) {
                    if (letra === feedbackModal.correta) estilo = 'border-green-500/40 bg-green-500/10 text-green-300'
                    else if (letra === respostaModal && !feedbackModal.acertou) estilo = 'border-red-500/40 bg-red-500/10 text-red-300'
                    else estilo = 'border-white/5 text-slate-600 opacity-50'
                  } else if (letra === respostaModal) {
                    estilo = 'text-white'
                  }
                  return (
                    <button
                      key={letra}
                      onClick={() => !feedbackModal && setRespostaModal(letra)}
                      disabled={!!feedbackModal}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-light transition-all ${estilo}`}
                      style={letra === respostaModal && !feedbackModal ? { borderColor: '#facc15', background: 'rgba(250,204,21,0.08)' } : {}}
                    >
                      <span className="font-medium mr-2" style={{ color: letra === respostaModal && !feedbackModal ? '#facc15' : undefined }}>{letra}.</span>
                      {texto}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="px-5 pb-5">
              {feedbackModal ? (
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${feedbackModal.acertou ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <span className="text-lg">{feedbackModal.acertou ? '✅' : '❌'}</span>
                  <p className={`text-sm font-light ${feedbackModal.acertou ? 'text-green-300' : 'text-red-300'}`}>
                    {feedbackModal.acertou ? 'Correto! Muito bem.' : `Incorreto. A resposta era ${feedbackModal.correta}.`}
                  </p>
                </div>
              ) : (
                <button
                  onClick={responder}
                  disabled={!respostaModal || enviando}
                  className="w-full py-3 rounded-xl text-sm font-light transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
                  style={{ background: respostaModal ? '#facc15' : '#334155', color: respostaModal ? '#0f172a' : undefined }}
                >
                  {enviando ? 'Enviando...' : 'Confirmar resposta'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[60] bg-[#1e2d3d] border border-white/10 text-slate-200 text-xs font-light px-4 py-2.5 rounded-xl shadow-lg transition-all">
          {toast}
        </div>
      )}
    </div>
  )
}

export default MateriaFavoritas