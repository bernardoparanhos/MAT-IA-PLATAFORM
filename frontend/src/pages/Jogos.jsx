import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarAluno from '../components/SidebarAluno'

const JOGOS = [
  {
    id: 'math-shooter',
    nome: 'Math Shooter',
    descricao: 'Dirija pela cidade e acerte as operações matemáticas antes que o tempo acabe. Enfrente fases de adição, subtração, divisão e multiplicação.',
    url: 'https://maluwengrat.github.io/math-shooter/',
    status: 'disponivel',
    tags: ['Adição', 'Subtração', 'Multiplicação', 'Divisão'],
    cor: '#f97316',
    corFundo: 'rgba(249,115,22,0.08)',
    corBorda: 'rgba(249,115,22,0.25)',
    capa: '/capajogo1.png',
  },
  {
    id: 'em-breve-1',
    nome: 'Tabuada Veloz',
    descricao: 'Responda operações de multiplicação contra o relógio. Quanto mais rápido, mais pontos.',
    url: null,
    status: 'em_breve',
    tags: ['Multiplicação', 'Velocidade'],
    cor: '#8b5cf6',
    corFundo: 'rgba(139,92,246,0.08)',
    corBorda: 'rgba(139,92,246,0.15)',
  },
  {
    id: 'em-breve-2',
    nome: 'Calculadora Mental',
    descricao: 'Treine seu raciocínio com sequências de operações sem usar calculadora.',
    url: null,
    status: 'em_breve',
    tags: ['Raciocínio', 'Mental'],
    cor: '#14b8a6',
    corFundo: 'rgba(20,184,166,0.08)',
    corBorda: 'rgba(20,184,166,0.15)',
  }
]

function Jogos() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)

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
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-400">
                  <rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/>
                </svg>
              </div>
              <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Jogos</h2>
            </div>
            <p className="text-slate-400 text-sm font-light">Pratique matemática de forma divertida e interativa.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {JOGOS.map(jogo => (
              <div
                key={jogo.id}
                className="rounded-2xl border flex flex-col overflow-hidden"
                style={{ borderColor: jogo.corBorda, background: jogo.corFundo }}
              >
                {jogo.capa && (
                  <div className="relative w-full h-48 overflow-hidden">
                    <img
                      src={jogo.capa}
                      alt={jogo.nome}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full bg-green-500/90 text-white">
                      Disponível
                    </span>
                  </div>
                )}
                <div className="p-6 flex flex-col gap-4 flex-1">
               {!jogo.capa && (
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: jogo.corFundo, border: `1px solid ${jogo.corBorda}` }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6" style={{ color: jogo.cor }}>
                        <rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/>
                      </svg>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-1 rounded-full bg-white/5 text-slate-500 border border-white/10">
                      Em breve
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-white font-medium text-lg mb-1">{jogo.nome}</h3>
                  <p className="text-slate-400 text-sm font-light leading-relaxed">{jogo.descricao}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {jogo.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-light"
                      style={{ background: `${jogo.cor}20`, color: jogo.cor }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-auto pt-2">
                  {jogo.status === 'disponivel' ? (
                    
                      <a href={jogo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-white transition-opacity hover:opacity-90"
                      style={{ background: jogo.cor }}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Jogar agora
                    </a>
                  ) : (
                    <button
                      disabled
                      className="w-full py-3 rounded-xl font-medium text-sm text-slate-600 bg-white/5 cursor-not-allowed border border-white/5"
                    >
                      Em breve
                    </button>
                  )}
                </div>
             </div>
              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  )
}

export default Jogos