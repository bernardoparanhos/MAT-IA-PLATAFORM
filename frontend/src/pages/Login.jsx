import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [aba, setAba] = useState('aluno')
  const [formAluno, setFormAluno] = useState({ ra: '', codigoTurma: '' })
  const [formProfessor, setFormProfessor] = useState({ email: '', senha: '' })
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [faqAberto, setFaqAberto] = useState(false)

  async function loginAluno(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const res = await fetch(`${API}/auth/login/aluno-turma`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formAluno)
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.message || 'Erro ao entrar.'); return }
      login(data.usuario)
      if (data.usuario.diagnostico_status === 'pendente') {
        navigate('/nivelamento')
      } else {
        navigate('/dashboard')
      }
    } catch {
      setErro('Erro ao conectar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function loginProfessor(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const res = await fetch(`${API}/auth/login/professor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ siape: formProfessor.email, senha: formProfessor.senha })
      })
      const data = await res.json()
      if (res.status === 403 && data.trocar_senha) {
        navigate('/trocar-senha', { state: { email: formProfessor.email } })
        return
      }
      if (!res.ok) { setErro(data.message || 'Erro ao entrar.'); return }
      login(data.usuario)
      navigate('/dashboard-professor')
    } catch {
      setErro('Erro ao conectar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-sm mt-2 font-light">Plataforma Educacional com IA</p>
        </div>

        <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
          {/* Abas */}
          <div className="flex border-b border-white/5">
            <button
              onClick={() => { setAba('aluno'); setErro('') }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${aba === 'aluno' ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/5' : 'text-slate-400 hover:text-white'}`}
            >
              Sou aluno
            </button>
            <button
              onClick={() => { setAba('professor'); setErro('') }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${aba === 'professor' ? 'text-orange-400 border-b-2 border-orange-500 bg-orange-500/5' : 'text-slate-400 hover:text-white'}`}
            >
              Sou professor
            </button>
          </div>

          <div className="p-6">
            {erro && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{erro}</p>}

            {aba === 'aluno' ? (
              <form onSubmit={loginAluno} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">RA / Matrícula</label>
                  <input
                    type="text"
                    value={formAluno.ra}
                    onChange={e => setFormAluno(f => ({ ...f, ra: e.target.value }))}
                    required
                    placeholder="Seu RA ou número de matrícula"
                    autoComplete="username"
                    className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Código da turma</label>
                  <input
                    type="text"
                    value={formAluno.codigoTurma}
                    onChange={e => setFormAluno(f => ({ ...f, codigoTurma: e.target.value.toUpperCase() }))}
                    required
                    placeholder="Código fornecido pelo professor"
                    autoComplete="off"
                    className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light tracking-widest"
                  />
                </div>
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {carregando ? 'Entrando...' : 'Entrar'}
                </button>
                <p className="text-center text-slate-500 text-sm font-light">
                  Primeiro acesso?{' '}
                  <button type="button" onClick={() => navigate('/solicitar-acesso')} className="text-orange-400 hover:text-orange-300 transition-colors">
                    Solicitar acesso
                  </button>
                </p>
              </form>
            ) : (
              <form onSubmit={loginProfessor} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Email ou SIAPE</label>
                  <input
                    type="text"
                    value={formProfessor.email}
                    onChange={e => setFormProfessor(f => ({ ...f, email: e.target.value }))}
                    required
                    placeholder="Email institucional ou SIAPE"
                    className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={formProfessor.senha}
                      onChange={e => setFormProfessor(f => ({ ...f, senha: e.target.value }))}
                      required
                      placeholder="••••••••"
                      className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 pr-12 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                    >
                      {mostrarSenha ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <button type="button" onClick={() => navigate('/esqueci-senha')} className="text-slate-500 hover:text-slate-400 text-xs transition-colors">
                    Esqueci minha senha
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={carregando}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
                >
                  {carregando ? 'Entrando...' : 'Entrar'}
                </button>
                <p className="text-center text-slate-500 text-sm font-light">
                  Quer usar a plataforma?{' '}
                  <button type="button" onClick={() => navigate('/solicitar-professor')} className="text-orange-400 hover:text-orange-300 transition-colors">
                    Solicitar acesso
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Botão FAQ */}
      <button
        onClick={() => setFaqAberto(true)}
        className="fixed bottom-6 right-6 w-10 h-10 bg-[#1e2d3d] border border-white/10 hover:border-orange-500/30 rounded-full flex items-center justify-center text-slate-400 hover:text-orange-400 transition-colors shadow-lg z-50"
        title="Ajuda"
      >
        <span className="text-white font-semibold text-base leading-none">?</span>
      </button>

      {/* Modal FAQ */}
      {faqAberto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setFaqAberto(false)}>
          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()} style={{ fontFamily: 'Outfit, sans-serif' }}>
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-white font-medium">Como funciona?</h2>
              <button onClick={() => setFaqAberto(false)} className="text-slate-400 hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5"><path d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-orange-400"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  <p className="text-white text-sm font-medium">Sou aluno</p>
                </div>
                <ol className="space-y-1.5 ml-8">
                  {['Peça o código da turma ao seu professor', 'Acesse "Solicitar acesso" e preencha seus dados', 'Aguarde a aprovação do professor', 'Faça login com seu RA e o código da turma'].map((item, i) => (
                    <li key={i} className="text-slate-400 text-xs font-light flex items-start gap-2">
                      <span className="text-orange-400 font-medium flex-shrink-0">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-white/5 pt-5">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-orange-400"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>
                  </div>
                  <p className="text-white text-sm font-medium">Sou professor</p>
                </div>
                <ol className="space-y-1.5 ml-8">
                  {['Clique em "Solicitar acesso" na aba Professor', 'Preencha seus dados institucionais', 'Aguarde a aprovação — você receberá um email', 'Acesse com email e senha temporária recebida'].map((item, i) => (
                    <li key={i} className="text-slate-400 text-xs font-light flex items-start gap-2">
                      <span className="text-orange-400 font-medium flex-shrink-0">{i + 1}.</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="border-t border-white/5 pt-4">
                <p className="text-slate-500 text-xs font-light text-center">Dúvidas? Entre em contato com seu professor ou instituição.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login
