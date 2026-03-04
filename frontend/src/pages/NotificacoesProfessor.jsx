import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function tempoRelativo(dataStr) {
  const diff = Math.floor((new Date() - new Date(dataStr)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

function NotificacoesProfessor() {
  const navigate = useNavigate()
  const [notificacoes, setNotificacoes] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(false)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL
  const naoLidas = notificacoes.filter(n => !n.lida).length

  useEffect(() => { buscar() }, [])

  async function buscar() {
    try {
      const res = await fetch(`${API}/auth/notificacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setNotificacoes(data.notificacoes || [])
    } catch {}
    finally { setCarregando(false) }
  }

  async function marcarLida(id) {
    await fetch(`${API}/auth/notificacoes/lida/${id}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: 1 } : n))
  }

  async function marcarTodasLidas() {
    await fetch(`${API}/auth/notificacoes/lida-todas`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: 1 })))
  }

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
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Menu</p>
          {[
            { label: 'Início', path: '/dashboard-professor', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg> },
            { label: 'Matérias', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg> },
            { label: 'Tutor IA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 16v-4m0-4h.01"/></svg> },
            { label: 'Jogos', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/></svg> },
            { label: 'Fórum', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
          ].map(item => (
            <button key={item.label} onClick={() => item.path && navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
              <span className="text-slate-500">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          <div className="border-t border-white/10 my-4" />
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Gestão</p>

          {[
            { label: 'Turmas', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> },
            { label: 'Métricas', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
          ].map(item => (
            <button key={item.label}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
              <span className="text-slate-500">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

          {/* Notificações ativo */}
          <button
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-orange-500/10 text-orange-400 text-sm font-light"
          >
            <span className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/>
              </svg>
              {naoLidas > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
              )}
            </span>
            <span>Notificações</span>
            {naoLidas > 0 && (
              <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {naoLidas}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-1">
          <button onClick={() => navigate('/perfil-professor')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-500"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            <span>Perfil</span>
          </button>
        </div>
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
        <div className="p-4">
          <button onClick={() => navigate('/dashboard-professor')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-white transition-colors text-sm font-light">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>
            <span>Início</span>
          </button>
        </div>
      </aside>

      {/* Conteúdo */}
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
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/dashboard-professor')} className="text-slate-500 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
            </button>
            <div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Notificações</h2>
              <p className="text-slate-400 text-sm mt-0.5 font-light">
                {naoLidas > 0 ? `${naoLidas} não lida${naoLidas > 1 ? 's' : ''}` : 'Tudo em dia'}
              </p>
            </div>
            {naoLidas > 0 && (
              <button onClick={marcarTodasLidas}
                className="ml-auto text-orange-400 hover:text-orange-300 text-sm transition-colors font-light">
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* Lista */}
          {carregando ? (
            <p className="text-slate-400 text-sm font-light">Carregando...</p>
          ) : notificacoes.length === 0 ? (
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-10 text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-slate-500">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/>
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Nenhuma notificação</p>
              <p className="text-slate-400 text-sm font-light">Quando alunos se cadastrarem na sua turma, você verá aqui.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notificacoes.map(n => (
                <button key={n.id} onClick={() => marcarLida(n.id)}
                  className={`w-full text-left bg-[#1e2d3d] border rounded-2xl p-5 transition-all hover:border-white/10 ${
                    !n.lida
                      ? 'border-orange-500/30 border-l-4 border-l-orange-500'
                      : 'border-white/5'
                  }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${!n.lida ? 'bg-orange-500/20' : 'bg-white/5'}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-4 h-4 ${!n.lida ? 'text-orange-400' : 'text-slate-500'}`}>
                          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        </svg>
                      </div>
                      <div>
                        <p className={`text-sm font-light leading-snug ${!n.lida ? 'text-white' : 'text-slate-400'}`}>
                          {n.mensagem}
                        </p>
                        <p className="text-slate-600 text-xs mt-1">{tempoRelativo(n.criado_em)}</p>
                      </div>
                    </div>
                    {!n.lida && (
                      <span className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default NotificacoesProfessor