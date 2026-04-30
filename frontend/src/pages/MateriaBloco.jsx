import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarAluno from '../components/SidebarAluno'
import Formula from '../components/Formula'

const BLOCOS_CONFIG = {
  inteiros:  { label: 'Números Inteiros', cor: '#f97316', corBg: 'rgba(249,115,22,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="10" x2="16" y2="10"/><line x1="10" y1="4" x2="10" y2="16"/><line x1="5" y1="6" x2="5" y2="8"/><line x1="15" y1="12" x2="15" y2="14"/></svg> },
  fracoes:   { label: 'Frações', cor: '#8b5cf6', corBg: 'rgba(139,92,246,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round"><circle cx="7.5" cy="6.5" r="2" fill="rgba(139,92,246,0.18)" stroke="#8b5cf6"/><circle cx="12.5" cy="13.5" r="2" fill="rgba(139,92,246,0.18)" stroke="#8b5cf6"/><line x1="4" y1="16" x2="16" y2="4"/></svg> },
  raizes:    { label: 'Raízes', cor: '#14b8a6', corBg: 'rgba(20,184,166,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#14b8a6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,12 5,12 8,16 13,4 16,4"/><line x1="16" y1="4" x2="18" y2="4"/></svg> },
  potencias: { label: 'Potências', cor: '#3b82f6', corBg: 'rgba(59,130,246,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"><text x="3" y="15" fontSize="11" fontWeight="600" fill="#3b82f6" stroke="none" fontFamily="serif">x</text><text x="11" y="9" fontSize="8" fontWeight="600" fill="#3b82f6" stroke="none" fontFamily="serif">n</text></svg> },
  geometria: { label: 'Geometria', cor: '#ec4899', corBg: 'rgba(236,72,153,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="10,3 18,17 2,17" fill="rgba(236,72,153,0.15)" stroke="#ec4899"/><line x1="10" y1="3" x2="10" y2="17" strokeDasharray="2 1.5" strokeWidth="1"/></svg> },
  equacao1:  { label: 'Equação 1º Grau', cor: '#f59e0b', corBg: 'rgba(245,158,11,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round"><line x1="3" y1="10" x2="17" y2="10"/><text x="4" y="8" fontSize="7" fill="#f59e0b" stroke="none" fontFamily="serif">ax+b</text><text x="6" y="16" fontSize="7" fill="#f59e0b" stroke="none" fontFamily="serif">=0</text>
</svg> },
  equacao2:  { label: 'Equação 2º Grau', cor: '#06b6d4', corBg: 'rgba(6,182,212,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round"><path d="M2,17 Q10,5 18,17" fill="none"/>
</svg> },
  modulo:    { label: 'Módulo', cor: '#84cc16', corBg: 'rgba(132,204,22,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#84cc16" strokeWidth="2" strokeLinecap="round"><line x1="7" y1="3" x2="7" y2="17"/><line x1="13" y1="3" x2="13" y2="17"/></svg> },
  exponencial: { label: 'Exponencial e Logaritmo', cor: '#e11d48', corBg: 'rgba(225,29,72,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round"><text x="2" y="14" fontSize="9" fill="#e11d48" stroke="none" fontFamily="serif">aˣ</text><text x="10" y="14" fontSize="7" fill="#e11d48" stroke="none" fontFamily="serif">log</text></svg> },
  trigonometria: { label: 'Trigonometria', cor: '#a855f7', corBg: 'rgba(168,85,247,0.12)',
    icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#a855f7" strokeWidth="1.5" strokeLinecap="round"><path d="M2,14 Q6,4 10,14 Q14,4 18,14" fill="none"/></svg> },
}

function MateriaBloco() {
  const { bloco } = useParams()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [questoes, setQuestoes] = useState([])
  const [stats, setStats] = useState({ feitas: 0, acertos: 0, erros: 0, total: 0 })
  const [carregando, setCarregando] = useState(true)
  const [modalQuestao, setModalQuestao] = useState(null)
  const [respostaModal, setRespostaModal] = useState(null)
  const [feedbackModal, setFeedbackModal] = useState(null) // { acertou, correta }
  const [enviando, setEnviando] = useState(false)
  const [favoritas, setFavoritas] = useState(new Set())
  const [toast, setToast] = useState(null)

 const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL
  const cfg = BLOCOS_CONFIG[bloco]
  const { usuario } = useAuth()
  const isProfessor = usuario?.perfil === 'professor'
 const carregar = useCallback(async () => {
    try {
      const [resQuestoes, resFav] = await Promise.all([
        fetch(`${API}/auth/materias/${bloco}/questoes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/auth/materias/favoritas`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      if (!resQuestoes.ok) { navigate('/materias'); return }
      const data = await resQuestoes.json()
      const dataFav = await resFav.json()

      setQuestoes(data.questoes || [])
      setFavoritas(new Set((dataFav.favoritas || []).map(f => f.id)))

      const feitas  = (data.questoes || []).filter(q => q.status !== 'pendente').length
      const acertos = (data.questoes || []).filter(q => q.status === 'acerto').length
      setStats({ feitas, acertos, erros: feitas - acertos, total: (data.questoes || []).length })
    } catch (e) {
      console.error('Erro ao carregar questões', e)
    } finally {
      setCarregando(false)
    }
  }, [API, token, bloco, navigate])

  useEffect(() => { carregar() }, [carregar])

  // Fecha modal com ESC
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') fecharModal() }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  function mostrarToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  async function toggleFavorita(e, questaoId) {
    e.stopPropagation()
    const jáFav = favoritas.has(questaoId)
    try {
      if (jáFav) {
        await fetch(`${API}/auth/materias/favoritar/${questaoId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        })
        setFavoritas(prev => { const s = new Set(prev); s.delete(questaoId); return s })
        mostrarToast('Removido das favoritas')
      } else {
        await fetch(`${API}/auth/materias/favoritar`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ questaoId })
        })
        setFavoritas(prev => new Set([...prev, questaoId]))
        mostrarToast('★ Adicionado às favoritas')
      }
    } catch (e) {
      console.error('Erro ao favoritar', e)
    }
  }

  function fecharModal() {
    setModalQuestao(null)
    setRespostaModal(null)
    setFeedbackModal(null)
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

      // Atualiza o grid localmente (sem novo fetch)
      setQuestoes(prev => prev.map(q =>
        q.id === modalQuestao.id
          ? { ...q, status: data.acertou ? 'acerto' : 'erro' }
          : q
      ))
      setStats(prev => {
        const jaFeita = modalQuestao.status !== 'pendente'
        if (jaFeita) return prev // já contabilizada
        return {
          ...prev,
          feitas: prev.feitas + 1,
          acertos: prev.acertos + (data.acertou ? 1 : 0),
          erros: prev.erros + (data.acertou ? 0 : 1),
        }
      })

      // Fecha após 1.5s
      setTimeout(() => { fecharModal() }, 1500)
    } catch (e) {
      console.error('Erro ao responder questão', e)
    } finally {
      setEnviando(false)
    }
  }

  if (!cfg) return null

  const progresso = stats.total > 0 ? Math.round((stats.feitas / stats.total) * 100) : 0
  const taxa = stats.feitas > 0 ? Math.round((stats.acertos / stats.feitas) * 100) : 0

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

        {/* Header mobile */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">

          {/* Voltar */}
          <button onClick={() => navigate('/materias')} className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm font-light mb-6 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
            Matérias
          </button>

          {/* Header do bloco */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: cfg.corBg }}>
              {cfg.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{cfg.label}</h2>
              <p className="text-slate-500 text-xs font-light mt-0.5">{stats.total} questões disponíveis</p>
            </div>
          </div>

          {/* Stats do bloco */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { val: stats.feitas,  label: 'Feitas',  cor: '#f1f5f9' },
              { val: stats.acertos, label: 'Acertos', cor: '#4ade80' },
              { val: stats.erros,   label: 'Erros',   cor: '#f87171' },
              { val: `${taxa}%`,    label: 'Taxa',    cor: '#f97316' },
            ].map(s => (
              <div key={s.label} className="bg-[#1e2d3d] border border-white/6 rounded-xl p-3 text-center">
                <p className="text-lg font-light" style={{ color: s.cor }}>{s.val}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5 font-light">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Barra de progresso */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-[3px] rounded-full bg-white/6 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progresso}%`, background: cfg.cor }} />
            </div>
            <span className="text-xs text-slate-500 font-light">{stats.feitas}/{stats.total}</span>
          </div>

          {/* Grid de questões */}
          <p className="text-slate-500 text-xs uppercase tracking-wider font-light mb-3">Questões</p>

          {questoes.length === 0 ? (
            <div className="bg-[#1e2d3d] border border-white/6 rounded-xl p-8 text-center">
              <p className="text-slate-500 text-sm font-light">Nenhuma questão disponível ainda</p>
              <p className="text-slate-600 text-xs mt-1 font-light">Volte em breve — o banco está sendo preparado</p>
            </div>
          ) : (
            <div className="grid gap-[6px]" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}>
              {questoes.map(q => {
                const fav = favoritas.has(q.id)
                return (
                  <div
                    key={q.id}
                    className="relative rounded-[8px] border cursor-pointer transition-all hover:scale-105"
                    style={{
                      height: '48px',
                      ...(q.status === 'acerto'
                        ? { background: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.25)' }
                        : q.status === 'erro'
                        ? { background: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.2)' }
                        : { background: '#1e2d3d', borderColor: 'rgba(255,255,255,0.06)' })
                    }}
                    onClick={() => { setModalQuestao(q); setRespostaModal(null); setFeedbackModal(null) }}
                  >
                    {/* número centralizado */}
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[12px] font-light"
                      style={{
                        color: q.status === 'acerto' ? '#4ade80' : q.status === 'erro' ? '#f87171' : '#475569'
                      }}
                    >
                      {q.numero}
                    </span>
                    {/* estrela canto inferior direito */}
                    <button
                      onClick={(e) => toggleFavorita(e, q.id)}
                      className="absolute bottom-0 right-0 p-2 leading-none transition-opacity"
                      style={{ fontSize: '11px', opacity: fav ? 1 : 0.25, color: fav ? '#facc15' : '#94a3b8' }}
                    >
                      {fav ? '★' : '☆'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legenda */}
          <div className="flex gap-5 mt-4 flex-wrap">
            {[
              { cor: 'rgba(34,197,94,0.5)', label: 'Acertou' },
              { cor: 'rgba(239,68,68,0.4)', label: 'Errou' },
              { cor: '#1e2d3d',             label: 'Não feita', border: '1px solid rgba(255,255,255,0.1)' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-[3px]" style={{ background: l.cor, border: l.border }} />
                <span className="text-[10px] text-slate-500 font-light">{l.label}</span>
              </div>
            ))}
          </div>

        </main>
      </div>

      {/* ─── Modal da questão ──────────────────────────────────────────────────── */}
      {modalQuestao && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) fecharModal() }}
        >
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Header modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-light">Questão {modalQuestao.numero}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-xs font-light" style={{ color: cfg.cor }}>{cfg.label}</span>
                {favoritas.has(modalQuestao.id) && (
                  <span className="text-yellow-400 text-xs">★</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {/* Setas de navegação */}
                <button
                  onClick={() => {
                    const idx = questoes.findIndex(q => q.id === modalQuestao.id)
                    if (idx > 0) { setModalQuestao(questoes[idx - 1]); setRespostaModal(null); setFeedbackModal(null) }
                  }}
                  disabled={questoes.findIndex(q => q.id === modalQuestao.id) === 0}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M15 18l-6-6 6-6"/></svg>
                </button>
                <span className="text-xs text-slate-600 font-light px-1">
                  {questoes.findIndex(q => q.id === modalQuestao.id) + 1}/{questoes.length}
                </span>
                <button
                  onClick={() => {
                    const idx = questoes.findIndex(q => q.id === modalQuestao.id)
                    if (idx < questoes.length - 1) { setModalQuestao(questoes[idx + 1]); setRespostaModal(null); setFeedbackModal(null) }
                  }}
                  disabled={questoes.findIndex(q => q.id === modalQuestao.id) === questoes.length - 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 18l6-6-6-6"/></svg>
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button onClick={fecharModal} className="text-slate-500 hover:text-white transition-colors p-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
            </div>

            {/* Enunciado */}
            <div className="px-5 py-5">
              <div className="text-slate-200 text-sm font-light leading-relaxed mb-5">
                {modalQuestao.enunciado.includes('<svg')
                    ? <span dangerouslySetInnerHTML={{ __html: modalQuestao.enunciado }} />
                    : modalQuestao.latex
                        ? <Formula tex={modalQuestao.enunciado} block={true} />
                        : <span dangerouslySetInnerHTML={{ __html: modalQuestao.enunciado }} />}
              </div>

              {/* Alternativas */}
              <div className="space-y-2">
                {Object.entries(modalQuestao.alternativas).map(([letra, texto]) => {
                  let estilo = 'border-white/8 text-slate-300 hover:border-white/20 hover:bg-white/3'
                  if (feedbackModal) {
                    if (letra === feedbackModal.correta) estilo = 'border-green-500/40 bg-green-500/10 text-green-300'
                    else if (letra === respostaModal && !feedbackModal.acertou) estilo = 'border-red-500/40 bg-red-500/10 text-red-300'
                    else estilo = 'border-white/5 text-slate-600 opacity-50'
                  } else if (letra === respostaModal) {
                    estilo = `border-opacity-60 text-white`
                  }

                  return (
                    <button
                      key={letra}
                      onClick={() => !feedbackModal && setRespostaModal(letra)}
                      disabled={!!feedbackModal}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-light transition-all ${estilo}`}
                      style={letra === respostaModal && !feedbackModal ? { borderColor: cfg.cor, background: `${cfg.cor}15` } : {}}
                    >
                      <span className="font-medium mr-2" style={{ color: letra === respostaModal && !feedbackModal ? cfg.cor : undefined }}>{letra}.</span>
                      {texto.includes('$')
                          ? <Formula tex={texto} />
                          : texto}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer modal */}
            <div className="px-5 pb-5">
              {feedbackModal ? (
                <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${feedbackModal.acertou ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <span className="text-lg">{feedbackModal.acertou ? '✅' : '❌'}</span>
                  <p className={`text-sm font-light ${feedbackModal.acertou ? 'text-green-300' : 'text-red-300'}`}>
                    {feedbackModal.acertou ? 'Correto! Muito bem.' : `Incorreto. A resposta era ${feedbackModal.correta}.`}
                  </p>
                </div>
              ) : (
                isProfessor ? (
                  <div className="w-full py-3 rounded-xl text-sm font-light text-center text-slate-500 bg-white/5">
                    Modo visualização — respostas não são registradas
                  </div>
                ) : (
                  <button
                    onClick={responder}
                    disabled={!respostaModal || enviando}
                    className="w-full py-3 rounded-xl text-sm font-light transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white"
                    style={{ background: respostaModal ? cfg.cor : undefined, backgroundColor: !respostaModal ? '#334155' : undefined }}
                  >
                    {enviando ? 'Enviando...' : 'Confirmar resposta'}
                  </button>
                )
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

export default MateriaBloco