import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import SidebarAluno from '../components/SidebarAluno'

function MinhaTurma() {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [sidebarAberta, setSidebarAberta] = useState(false)
  const [copiado, setCopiado] = useState(false)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    buscarTurma()
  }, [])

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) setSidebarAberta(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  async function buscarTurma() {
    try {
      const res = await fetch(`${API}/auth/aluno/minha-turma`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setDados(data)
    } catch (e) {
      console.error('Erro ao buscar turma', e)
    } finally {
      setCarregando(false)
    }
  }

  function copiarCodigo() {
    if (dados?.turma?.codigo_acesso) {
      navigator.clipboard.writeText(dados.turma.codigo_acesso)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {sidebarAberta && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setSidebarAberta(false)} />
      )}

      {/* Sidebar (componente único) */}
      <SidebarAluno 
        sidebarAberta={sidebarAberta}
        setSidebarAberta={setSidebarAberta}
        navigate={navigate}
        logout={logout}
      />

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col lg:ml-56">

        {/* Header mobile */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-[#0f172a] border-b border-white/5 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarAberta(true)} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>
          <h1 className="text-xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
        </header>

        <main className="flex-1 p-6 lg:p-10 mt-14 lg:mt-0">

          {/* Header */}
          <div className="mb-8 lg:mb-10">
            <h2 className="text-2xl lg:text-3xl font-semibold text-white tracking-tight">Minha Turma</h2>
            <p className="text-slate-400 text-sm mt-1 font-light">
              {dados?.turma ? dados.turma.nome : 'Carregando...'}
            </p>
          </div>

          {carregando ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-white/10 rounded w-1/3 mb-3" />
                  <div className="h-3 bg-white/5 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : !dados?.turma ? (
            <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-10 text-center">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-orange-400">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Nenhuma turma vinculada</p>
              <p className="text-slate-400 text-sm font-light">Você ainda não está associado a nenhuma turma.</p>
            </div>
          ) : (
            <div className="space-y-4">

              {/* Card info da turma */}
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-5">Informações da Turma</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Nome</p>
                    <p className="text-white font-medium">{dados.turma.nome}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Código de acesso</p>
                    <div className="flex items-center gap-2">
                      <p className="text-orange-400 font-mono font-medium">{dados.turma.codigo_acesso}</p>
                      <button onClick={copiarCodigo}
                        className="text-slate-500 hover:text-slate-300 transition-colors text-xs flex items-center gap-1">
                        {copiado ? (
                          <span className="text-green-400 text-xs">✓ copiado</span>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                            <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Professor</p>
                    <p className="text-white font-light">{dados.professor?.nome || '—'}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{dados.professor?.email || ''}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Total de alunos</p>
                    <p className="text-white font-light">
                      {(dados.colegas?.length || 0) + 1} {(dados.colegas?.length || 0) + 1 === 1 ? 'aluno' : 'alunos'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card colegas */}
              <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 lg:p-8">
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-5">Colegas de Turma</p>

                {/* Você mesmo */}
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-orange-500/5 border border-orange-500/10 mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-400 text-xs font-medium">
                        {usuario?.nome?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-orange-300 text-sm font-light">{usuario?.nome}</p>
                      <p className="text-slate-500 text-xs">{usuario?.email}</p>
                    </div>
                  </div>
                  <span className="text-xs text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded-full">você</span>
                </div>

                {/* Colegas */}
                {dados.colegas.length === 0 ? (
                  <p className="text-slate-500 text-sm font-light text-center py-4">Você é o único aluno da turma por enquanto.</p>
                ) : (
                  <div className="space-y-1">
                    {dados.colegas.map(colega => (
                      <div key={colega.id} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                            <span className="text-slate-400 text-xs font-medium">
                              {colega.nome.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-white text-sm font-light">{colega.nome}</p>
                            <p className="text-slate-500 text-xs">{colega.email}</p>
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs font-mono">{colega.ra}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default MinhaTurma