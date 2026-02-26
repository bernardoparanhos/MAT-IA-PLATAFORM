import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const [perfil, setPerfil] = useState('')
  const [form, setForm] = useState({ ra: '', codigoTurma: '', siape: '', senha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const url = perfil === 'aluno'
        ? 'http://localhost:3000/auth/login/aluno'
        : 'http://localhost:3000/auth/login/professor'

      const body = perfil === 'aluno'
        ? { ra: form.ra, codigoTurma: form.codigoTurma }
        : { siape: form.siape, senha: form.senha }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors && data.errors.length > 0) {
          setErro(data.errors[0].msg)
        } else {
          setErro(data.message || 'Erro ao fazer login.')
        }
        return
      }

      login(data.token, data.usuario)

    } catch {
      setErro('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setCarregando(false)
    }
  }

  // ─── Etapa 1: escolha de perfil ───────────────────────────────────────────
  if (!perfil) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-2">
              MAT<span className="text-blue-400">-IA</span>
            </h1>
            <p className="text-slate-400 text-sm">
              Suporte Inteligente ao Aprendizado de Matemática
            </p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-white text-xl font-semibold mb-2">Entrar na plataforma</h2>
            <p className="text-slate-400 text-sm mb-6">Selecione seu perfil para continuar</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPerfil('aluno')}
                className="bg-slate-700 hover:bg-blue-600 text-white rounded-xl p-6 text-center transition-colors group"
              >
                <div className="text-4xl mb-3">🎓</div>
                <div className="font-semibold">Aluno</div>
                <div className="text-xs text-slate-400 group-hover:text-blue-200 mt-1">
                  RA + Código da Turma
                </div>
              </button>

              <button
                onClick={() => setPerfil('professor')}
                className="bg-slate-700 hover:bg-blue-600 text-white rounded-xl p-6 text-center transition-colors group"
              >
                <div className="text-4xl mb-3">👨‍🏫</div>
                <div className="font-semibold">Professor</div>
                <div className="text-xs text-slate-400 group-hover:text-blue-200 mt-1">
                  SIAPE + Senha
                </div>
              </button>
            </div>

            <p className="text-slate-400 text-sm text-center mt-6">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-blue-400 hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>

          <p className="text-slate-600 text-xs text-center mt-6">
            UTFPR Campus Medianeira — 2026
          </p>
        </div>
      </div>
    )
  }

  // ─── Etapa 2: formulário por perfil ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            MAT<span className="text-blue-400">-IA</span>
          </h1>
          <p className="text-slate-400 text-sm">
            {perfil === 'aluno' ? 'Acesso do Aluno' : 'Acesso do Professor'}
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setPerfil(''); setErro('') }}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              ←
            </button>
            <h2 className="text-white text-xl font-semibold">
              {perfil === 'aluno' ? '🎓 Aluno' : '👨‍🏫 Professor'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {perfil === 'aluno' ? (
              <>
                <div>
                  <label className="text-slate-300 text-sm mb-1 block">RA</label>
                  <input
                    type="text"
                    name="ra"
                    value={form.ra}
                    onChange={handleChange}
                    placeholder="Seu RA"
                    required
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-1 block">Código da Turma</label>
                  <input
                    type="text"
                    name="codigoTurma"
                    value={form.codigoTurma}
                    onChange={handleChange}
                    placeholder="Código fornecido pelo professor"
                    required
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-slate-300 text-sm mb-1 block">SIAPE</label>
                  <input
                    type="text"
                    name="siape"
                    value={form.siape}
                    onChange={handleChange}
                    placeholder="Seu número SIAPE"
                    required
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 text-sm mb-1 block">Senha</label>
                  <input
                    type="password"
                    name="senha"
                    value={form.senha}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
                  />
                </div>
              </>
            )}

            {erro && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-2">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-slate-400 text-sm text-center mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-blue-400 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          UTFPR Campus Medianeira — 2026
        </p>
      </div>
    </div>
  )
}

export default Login