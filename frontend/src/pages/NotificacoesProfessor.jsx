import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotificacoes } from '../context/NotificacoesContext'
import SidebarProfessor from '../components/SidebarProfessor'

function tempoRelativo(dataStr) {
  // SQLite salva em UTC sem o 'Z' — adicionamos para o JS interpretar corretamente
  const dataUtc = dataStr.endsWith('Z') ? dataStr : dataStr + 'Z'
  const diff = Math.floor((new Date() - new Date(dataUtc)) / 1000)
  if (diff < 60) return 'agora mesmo'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 172800) return 'há 1 dia'
  return `há ${Math.floor(diff / 86400)} dias`
}

function NotificacoesProfessor() {
  const navigate = useNavigate()
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas, apagarUma, apagarTodas } = useNotificacoes()
  const [apagados, setApagados] = useState({})
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [searchParams] = useSearchParams()
const idDestaque = searchParams.get('id')
const itemRefs = useRef({})

useEffect(() => {
  if (idDestaque && notificacoes.length > 0) {
    const el = itemRefs.current[idDestaque]
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)
    }
    setTimeout(() => {
      navigate('/notificacoes-professor', { replace: true })
    }, 2000)
  }
}, [idDestaque, notificacoes])

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

     <SidebarProfessor sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} />

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
            <div className="ml-auto flex items-center gap-4">
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas}
                  className="text-orange-400 hover:text-orange-300 text-sm transition-colors font-light">
                  Marcar todas como lidas
                </button>
              )}
              {notificacoes.length > 0 && (
                <button onClick={apagarTodas}
                  className="text-red-400/70 hover:text-red-400 text-sm transition-colors font-light">
                  Apagar tudo
                </button>
              )}
            </div>
          </div>

          {/* Lista */}
          {notificacoes.length === 0 ? (
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
                <button key={n.id} ref={el => itemRefs.current[n.id] = el} onClick={() => marcarLida(n.id)}
  className={`w-full text-left bg-[#1e2d3d] border rounded-2xl p-5 transition-all hover:border-white/10 ${
    !n.lida
      ? 'border-orange-500/30 border-l-4 border-l-orange-500'
      : 'border-white/5'
  } ${String(n.id) === idDestaque ? 'ring-2 ring-orange-400/50' : ''}`}>
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
                      <div className="flex flex-col items-end gap-2">
                      {!n.lida && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full" />
                      )}
                     <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          setApagados(prev => ({ ...prev, [n.id]: 'ok' }))
                          setTimeout(() => apagarUma(n.id), 300)
                        }}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-400/10">
                        {apagados[n.id] === 'ok'
                          ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-green-400"><path d="M20 6L9 17l-5-5"/></svg>
                          : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>
                        }
                      </button>
                    </div>
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