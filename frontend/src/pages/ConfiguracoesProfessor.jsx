import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SidebarProfessor from '../components/SidebarProfessor'

function Toggle({ ativo, onChange }) {
  return (
    <button
      onClick={() => onChange(!ativo)}
      className={`relative w-11 h-6 rounded-full transition-colors ${ativo ? 'bg-orange-500' : 'bg-white/10'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${ativo ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  )
}

function ConfiguracoesProfessor() {
  const navigate = useNavigate()
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [notif, setNotif] = useState({
    novosAlunos: true,
    atualizacoes: true,
  })

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarAberta(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

      <SidebarProfessor sidebarAberta={sidebarAberta} setSidebarAberta={setSidebarAberta} />

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col lg:ml-56">
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">
          <div className="mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Configurações</h2>
            <p className="text-slate-400 text-sm mt-1 font-light">Preferências da sua conta</p>
          </div>

          <div className="max-w-2xl space-y-6">

            {/* Notificações */}
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-6">Notificações</p>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-light">Novos alunos na turma</p>
                    <p className="text-slate-500 text-xs mt-0.5">Receber notificação quando um aluno entrar na turma</p>
                  </div>
                  <Toggle ativo={notif.novosAlunos} onChange={v => setNotif(n => ({ ...n, novosAlunos: v }))} />
                </div>
                <div className="border-t border-white/5" />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-light">Atualizações da plataforma</p>
                    <p className="text-slate-500 text-xs mt-0.5">Novidades e melhorias do MAT-IA</p>
                  </div>
                  <Toggle ativo={notif.atualizacoes} onChange={v => setNotif(n => ({ ...n, atualizacoes: v }))} />
                </div>
              </div>
            </div>

            {/* Aparência */}
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <p className="text-slate-500 text-xs uppercase tracking-widest">Aparência</p>
                <span className="text-xs bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">Em breve</span>
              </div>
              <div className="flex items-center justify-between opacity-40 cursor-not-allowed">
                <div>
                  <p className="text-white text-sm font-light">Tema escuro</p>
                  <p className="text-slate-500 text-xs mt-0.5">Alternar entre tema claro e escuro</p>
                </div>
                <div className="relative w-11 h-6 rounded-full bg-orange-500">
                  <span className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white translate-x-5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Segurança */}
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Segurança</p>
              <p className="text-slate-400 text-sm font-light mb-4">A troca de senha está disponível na página de Perfil.</p>
              <button onClick={() => navigate('/perfil-professor')}
                className="flex items-center gap-2 text-orange-400 hover:text-orange-300 text-sm font-light transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                Ir para o Perfil
              </button>
            </div>

            {/* Sobre */}
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
              <p className="text-slate-500 text-xs uppercase tracking-widest mb-6">Sobre</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-light">Plataforma</span>
                  <span className="text-white font-medium">MAT-IA</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-light">Versão</span>
                  <span className="text-white">1.0.0-beta</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-light">Instituição</span>
                  <span className="text-white">UTFPR — Campus Medianeira</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-light">Desenvolvedor</span>
                  <span className="text-white">Bernardo Paranhos Borges</span>
                </div>
                <div className="border-t border-white/5" />
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-light">Ano</span>
                  <span className="text-white">2026</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex gap-4">
                  <button onClick={() => navigate('/termos?from=configuracoes-professor')} className="text-slate-500 hover:text-slate-300 text-xs font-light transition-colors">Termos de Serviço</button>
                  <button onClick={() => navigate('/privacidade?from=configuracoes-professor')} className="text-slate-500 hover:text-slate-300 text-xs font-light transition-colors">Política de Privacidade</button>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default ConfiguracoesProfessor