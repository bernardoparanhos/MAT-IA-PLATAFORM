import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function Cadastro() {
  const navigate = useNavigate()
  const [perfil, setPerfil] = useState('')
  const [form, setForm] = useState({ nome: '', email: '', senha: '', ra: '', codigoTurma: '' })
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
    const body = { ...form, perfil }
    const res = await fetch('http://localhost:3000/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()

    if (!res.ok) {
      // Mostra mensagem específica de validação
      if (data.errors && data.errors.length > 0) {
        setErro(data.errors[0].msg)
      } else {
        setErro(data.message || 'Erro ao criar conta.')
      }
      return
    }

    navigate('/login')

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
            <p className="text-slate-400 text-sm">Crie sua conta</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-8 shadow-xl">
            <h2 className="text-white text-xl font-semibold mb-2">Você é...</h2>
            <p className="text-slate-400 text-sm mb-6">Selecione seu perfil para continuar</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPerfil('aluno')}
                className="bg-slate-700 hover:bg-blue-600 text-white rounded-xl p-6 text-center transition-colors group"
              >
                <div className="text-4xl mb-3">🎓</div>
                <div className="font-semibold">Aluno</div>
                <div className="text-xs text-slate-400 group-hover:text-blue-200 mt-1">
                  Tenho um código de turma
                </div>
              </button>

              <button
                onClick={() => setPerfil('professor')}
                className="bg-slate-700 hover:bg-blue-600 text-white rounded-xl p-6 text-center transition-colors group"
              >
                <div className="text-4xl mb-3">👨‍🏫</div>
                <div className="font-semibold">Professor</div>
                <div className="text-xs text-slate-400 group-hover:text-blue-200 mt-1">
                  Quero criar turmas
                </div>
              </button>
            </div>

            <p className="text-slate-400 text-sm text-center mt-6">
              Já tem conta?{' '}
              <Link to="/login" className="text-blue-400 hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ─── Etapa 2: formulário ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            MAT<span className="text-blue-400">-IA</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Cadastro de {perfil === 'professor' ? 'Professor' : 'Aluno'}
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => setPerfil('')}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              ←
            </button>
            <h2 className="text-white text-xl font-semibold">
              {perfil === 'professor' ? '👨‍🏫 Professor' : '🎓 Aluno'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-1 block">Nome completo</label>
              <input
                type="text"
                name="nome"
                value={form.nome}
                onChange={handleChange}
                placeholder="Seu nome"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>

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
                placeholder="Mín. 8 caracteres, 1 maiúscula e 1 número"
                required
                className="w-full bg-slate-700 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-500"
              />
            </div>

            {/* Campos exclusivos do aluno */}
            {perfil === 'aluno' && (
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
            )}

            {erro && (
              <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-2">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
            >
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-slate-400 text-sm text-center mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-blue-400 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Cadastro