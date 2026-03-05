import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

function RedefinirSenha() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [tokenValido, setTokenValido] = useState(null)
  const [form, setForm] = useState({ novaSenha: '', confirmarSenha: '' })
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    if (!token) { setTokenValido(false); return }
    fetch(`${API}/auth/validar-token/${token}`)
      .then(r => r.json())
      .then(data => setTokenValido(data.valido))
      .catch(() => setTokenValido(false))
  }, [token])

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const res = await fetch(`${API}/auth/redefinir-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form })
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.message); return }
      setSucesso(true)
    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  const inputClass = "w-full bg-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-500 border border-white/10 transition-all"
  const labelClass = "text-slate-400 text-xs uppercase tracking-wider mb-1.5 block font-light"

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4" style={{fontFamily:'Outfit, sans-serif'}}>
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-orange-400 tracking-tight">
            MAT<span className="text-white">-IA</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-light">Redefinição de senha</p>
        </div>

        <div className="bg-[#1e2d3d] rounded-2xl p-8 border border-white/5 shadow-2xl">

          {tokenValido === null && (
            <p className="text-slate-400 text-sm text-center font-light">Verificando link...</p>
          )}

          {tokenValido === false && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-red-400">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Link inválido ou expirado</h3>
              <p className="text-slate-400 text-sm font-light mb-6">
                Este link não é mais válido. Solicite um novo.
              </p>
              <Link to="/esqueci-senha" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
                Solicitar novo link
              </Link>
            </div>
          )}

          {tokenValido === true && !sucesso && (
            <>
              <h2 className="text-white text-xl font-semibold mb-2">Nova senha</h2>
              <p className="text-slate-400 text-sm font-light mb-6">
                Escolha uma senha forte para sua conta.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelClass}>Nova senha</label>
                  <input type="password" placeholder="Mín. 8 caracteres, 1 maiúscula e 1 número"
                    value={form.novaSenha}
                    onChange={e => setForm({...form, novaSenha: e.target.value})}
                    required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Confirmar nova senha</label>
                  <input type="password" placeholder="••••••••"
                    value={form.confirmarSenha}
                    onChange={e => setForm({...form, confirmarSenha: e.target.value})}
                    required className={inputClass} />
                </div>

                {erro && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-light">{erro}</p>
                )}

                <button type="submit" disabled={carregando}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 text-sm transition-colors">
                  {carregando ? 'Salvando...' : 'Redefinir senha'}
                </button>
              </form>
            </>
          )}

          {sucesso && (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-green-400">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Senha redefinida!</h3>
              <p className="text-slate-400 text-sm font-light mb-6">
                Sua senha foi atualizada com sucesso.
              </p>
              <Link to="/login" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
                Ir para o login
              </Link>
            </div>
          )}

        </div>

        <p className="text-slate-600 text-xs text-center mt-6 font-light">
          UTFPR Campus Medianeira — 2026
        </p>
      </div>
    </div>
  )
}

export default RedefinirSenha