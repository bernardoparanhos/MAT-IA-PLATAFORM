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
                  <input
                    type="password"
                    value={formProfessor.senha}
                    onChange={e => setFormProfessor(f => ({ ...f, senha: e.target.value }))}
                    required
                    placeholder="••••••••"
                    className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
                  />
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
    </div>
  )
}

export default Login
