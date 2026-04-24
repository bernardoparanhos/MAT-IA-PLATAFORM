import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarAluno from '../components/SidebarAluno'

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
}

function Materias() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [blocos, setBlocos] = useState([])
  const [stats, setStats] = useState({ total: 0, acertos: 0, erros: 0 })
  const [totalFavoritas, setTotalFavoritas] = useState(0)
  const [carregando, setCarregando] = useState(true)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    async function carregar() {
      try {
        const [resBlocos, resStats, resFav] = await Promise.all([
          fetch(`${API}/auth/materias/blocos`,    { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/auth/materias/stats`,     { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/auth/materias/favoritas`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
        const dataBlocos = await resBlocos.json()
        const dataStats  = await resStats.json()
        const dataFav    = await resFav.json()
        setBlocos(dataBlocos.blocos || [])
        setStats(dataStats)
        setTotalFavoritas(dataFav.total || 0)
      } catch (e) {
        console.error('Erro ao carregar matérias', e)
      } finally {
        setCarregando(false)
      }
    }
    carregar()
  }, [API, token])

  const taxa = stats.total > 0 ? Math.round((stats.acertos / stats.total) * 100) : 0

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
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">

          <div className="mb-8">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Matérias</h2>
            <p className="text-slate-400 text-sm mt-1 font-light">Pratique por bloco temático</p>
          </div>

          {/* Cards dos blocos */}
          <div className="space-y-3 mb-6">
            {blocos.map(b => {
              const cfg = BLOCOS_CONFIG[b.bloco]
              if (!cfg) return null
              const progresso = b.total > 0 ? Math.round((b.feitas / b.total) * 100) : 0
              return (
                <button
                  key={b.bloco}
                  onClick={() => navigate(`/materias/${b.bloco}`)}
                  className="w-full bg-[#1e2d3d] border border-white/7 rounded-xl p-4 flex items-center gap-4 hover:border-white/15 transition-all text-left relative overflow-hidden"
                >
                  {/* accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: cfg.cor }} />

                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.corBg }}>
                    {cfg.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100 font-light mb-1">{cfg.label}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-[3px] rounded-full bg-white/6 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progresso}%`, background: cfg.cor }} />
                      </div>
                      <span className="text-xs text-slate-500 font-light min-w-[40px] text-right">
                        {b.feitas}/{b.total || '—'}
                      </span>
                    </div>
                  </div>

                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-600 flex-shrink-0">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              )
            })}
          </div>

          {/* Card Favoritas */}
          <button
            onClick={() => navigate('/materias/favoritas')}
            className="w-full bg-[#1e2d3d] border border-white/7 rounded-xl p-4 flex items-center gap-4 hover:border-yellow-500/30 transition-all text-left relative overflow-hidden"
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: '#facc15' }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.25)', color: '#facc15' }}>
              ★
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-100 font-light">Favoritas</p>
              <p className="text-xs text-slate-500 font-light mt-0.5">
                {totalFavoritas === 0 ? 'Nenhuma questão favoritada ainda' : `${totalFavoritas} questão${totalFavoritas > 1 ? 'ões' : ''} salva${totalFavoritas > 1 ? 's' : ''}`}
              </p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-600 flex-shrink-0">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {/* Stats globais */}
          <div className="border-t border-white/5 pt-5">
            <p className="text-slate-500 text-xs uppercase tracking-wider font-light mb-3">Seu desempenho geral</p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: stats.total,   label: 'Feitas',  cor: '#f1f5f9' },
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
          </div>

        </main>
      </div>
    </div>
  )
}

export default Materias