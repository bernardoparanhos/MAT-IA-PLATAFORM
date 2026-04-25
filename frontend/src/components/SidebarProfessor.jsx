import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotificacoes } from '../context/NotificacoesContext'

// ─── Ícones SVG ───────────────────────────────────────────────────────────────
const icons = {
  inicio: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>,
  materias: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>,
  tutorIA: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z"/><path d="M12 16v-4m0-4h.01"/></svg>,
  jogos: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m7-2h.01M15 12h.01"/></svg>,
  forum: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  metricas: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  turmas: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>,
  notificacoes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9m-4.27 13a2 2 0 01-3.46 0"/></svg>,
  perfil: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>,
  configuracoes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  sair: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4m7 14l5-5-5-5m5 5H9"/></svg>,
  fechar: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>,
}

// ─── Estrutura dos menus ──────────────────────────────────────────────────────
const MENU_ITEMS = [
  { label: 'Início', path: '/dashboard-professor', icon: icons.inicio },
  { label: 'Matérias', path: '/materias', icon: icons.materias },
  { label: 'Tutor IA', icon: icons.tutorIA },
  { label: 'Jogos', icon: icons.jogos },
  { label: 'Fórum', icon: icons.forum },
]

const GESTAO_ITEMS = [
  { label: 'Métricas', path: '/metricas', icon: icons.metricas },
  { label: 'Turmas', path: '/turmas-professor', icon: icons.turmas },
  { label: 'Notificações', path: '/notificacoes-professor', icon: icons.notificacoes, hasBadge: true },
  { label: 'Perfil', path: '/perfil-professor', icon: icons.perfil },
]

// ─── Item de navegação (único componente reutilizável) ───────────────────────
function NavItem({ item, ativo, naoLidas, onNavigate }) {
  const handleClick = () => {
    if (item.path) onNavigate(item.path)
  }

  const showBadge = item.hasBadge && naoLidas > 0
  const isDisabled = !item.path

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-light transition-colors ${
        ativo
          ? 'bg-orange-500/10 text-orange-400'
          : isDisabled
            ? 'text-slate-500 cursor-not-allowed opacity-60'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={`relative ${ativo ? 'text-orange-400' : 'text-slate-500'}`}>
        {item.icon}
        {showBadge && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full" />
        )}
      </span>
      <span>{item.label}</span>
      {showBadge && (
        <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          {naoLidas}
        </span>
      )}
    </button>
  )
}

// ─── Conteúdo do sidebar (menu + rodapé), reutilizado por desktop e mobile ───
function SidebarContent({ onClose }) {
  const { logout } = useAuth()
  const { naoLidas } = useNotificacoes()
  const navigate = useNavigate()
  const location = useLocation()

  const handleNavigate = (path) => {
    navigate(path)
    onClose?.()
  }

  const isAtivo = (path) => path && location.pathname === path

  return (
    <>
      <nav className="p-4 space-y-1">
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Menu</p>
        {MENU_ITEMS.map(item => (
          <NavItem
            key={item.label}
            item={item}
            ativo={isAtivo(item.path)}
            naoLidas={naoLidas}
            onNavigate={handleNavigate}
          />
        ))}

        <div className="border-t border-white/10 my-4" />
        <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 px-3">Gestão</p>
        {GESTAO_ITEMS.map(item => (
          <NavItem
            key={item.label}
            item={item}
            ativo={isAtivo(item.path)}
            naoLidas={naoLidas}
            onNavigate={handleNavigate}
          />
        ))}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-1">
        <NavItem
          item={{ label: 'Configurações', path: '/configuracoes-professor', icon: icons.configuracoes }}
          ativo={isAtivo('/configuracoes-professor')}
          naoLidas={naoLidas}
          onNavigate={handleNavigate}
        />
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-light"
        >
          {icons.sair}
          <span>Sair</span>
        </button>
      </div>
    </>
  )
}

// ─── Componente principal exportado ──────────────────────────────────────────
function SidebarProfessor({ sidebarAberta, setSidebarAberta }) {
  const fechar = () => setSidebarAberta(false)

  return (
    <>
      {/* Overlay mobile */}
      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={fechar} />
      )}

      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-56 bg-[#1e2d3d] flex-col fixed h-full z-40">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-xs mt-1 font-light">Painel do Professor</p>
        </div>
        <SidebarContent />
      </aside>

      {/* Sidebar mobile */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-[#1e2d3d] z-40 flex flex-col overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${sidebarAberta ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
            <p className="text-slate-400 text-xs mt-1 font-light">Painel do Professor</p>
          </div>
          <button onClick={fechar} className="text-slate-400 hover:text-white transition-colors">
            {icons.fechar}
          </button>
        </div>
        <SidebarContent onClose={fechar} />
      </aside>
    </>
  )
}

export default SidebarProfessor