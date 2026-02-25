import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const [form, setForm] = useState({ email: '', senha: '' })
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
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.message || 'Erro ao fazer login.')
        return
      }

      login(data.token, data.usuario)

    } catch {
      setErro('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            MAT<span className="text-blue-400">-IA</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Suporte Inteligente ao Aprendizado de Matemática
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-6">Entrar na plataforma</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-1 block">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
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