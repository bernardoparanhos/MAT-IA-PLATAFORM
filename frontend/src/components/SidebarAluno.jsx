import { useLocation } from 'react-router-dom'
import { useNotificacoesAluno } from '../context/NotificacoesAlunoContext'

function SidebarAluno({ sidebarAberta, setSidebarAberta, navigate, logout }) {
  const location = useLocation()
  const { naoLidas } = useNotificacoesAluno()

  const isActive = (path) => location.pathname === path

  const NavItems = ({ onClick }) => (
    <>
      <nav className="p-4 space-y-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Menu</p>
        
        {/* Início */}
        <button 
          onClick={() => { navigate('/dashboard'); onClick?.() }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-colors ${
            isActive('/dashboard') 
              ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}>
          <span className={isActive('/dashboard') ? 'text-orange-400' : 'text-slate-500'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/>
            </svg>
          </span>
          <span>Início</span>
        </button>

        {/* Matérias - BLOQUEADO */}
        <div className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 cursor-not-allowed text-sm font-light opacity-50">
          <span className="text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/>
            </svg>
          </span>
          <span>Matérias</span>
        </div>

{/* DESABILITADOS - Em construção */}
{[
  { 
    label: 'Tutor IA', 
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 16v-4m0-4h.01"/></svg>
  },
  { 
    label: 'Jogos', 
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/></svg>
  },
  { 
    label: 'Fórum', 
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
  },
].map(item => (
  <div 
    key={item.label}
    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-600 cursor-not-allowed text-sm font-light opacity-50">
    <span className="text-slate-600">{item.icon}</span>
    <span>{item.label}</span>
  </div>
))}

        <div className="border-t border-white/10 my-4" />
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Minha Conta</p>

        {/* Minha Turma */}
        <button 
          onClick={() => { navigate('/minha-turma'); onClick?.() }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-colors ${
            isActive('/minha-turma')
              ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}>
          <span className={isActive('/minha-turma') ? 'text-orange-400' : 'text-slate-500'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/>
            </svg>
          </span>
          <span>Minha Turma</span>
        </button>

     {/* Notificações - ATIVO */}
       {/* Notificações - ATIVO */}
<button 
  onClick={() => { navigate('/notificacoes-aluno'); onClick?.() }}
  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-colors ${
    isActive('/notificacoes-aluno')
      ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
      : 'text-slate-400 hover:bg-white/5 hover:text-white'
  }`}>
  <span className={`relative ${isActive('/notificacoes-aluno') ? 'text-orange-400' : 'text-slate-500'}`}>
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
        
        {/* Perfil */}
        <button 
          onClick={() => { navigate('/perfil-aluno'); onClick?.() }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-colors ${
            isActive('/perfil-aluno')
              ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}>
          <span className={isActive('/perfil-aluno') ? 'text-orange-400' : 'text-slate-500'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </span>
          <span>Perfil</span>
        </button>
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        {/* Configurações */}
        <button 
          onClick={() => { navigate('/configuracoes-aluno'); onClick?.() }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-colors ${
            isActive('/configuracoes-aluno')
              ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-4 h-4 ${isActive('/configuracoes-aluno') ? 'text-orange-400' : 'text-slate-500'}`}>
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
          <span>Configurações</span>
        </button>

        {/* Sair */}
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-light">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9"/>
          </svg>
          <span>Sair</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-56 bg-[#1e2d3d] flex-col fixed h-full z-40">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-xs mt-1 font-light">Painel do Aluno</p>
        </div>
        <NavItems />
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1e2d3d] z-40 flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
            <p className="text-slate-400 text-xs mt-1 font-light">Painel do Aluno</p>
          </div>
          <button onClick={() => setSidebarAberta(false)} className="text-slate-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <NavItems onClick={() => setSidebarAberta(false)} />
      </aside>
    </>
  )
}

export default SidebarAluno