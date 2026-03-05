import { useState } from 'react'
import { Link } from 'react-router-dom'

function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const API = import.meta.env.VITE_API_URL

  async function handleSubmit(e) {
    e.preventDefault()
    setCarregando(true)
    try {
      await fetch(`${API}/auth/aluno/esqueci-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
    } finally {
      setCarregando(false)
      setEnviado(true) // sempre mostra sucesso — segurança
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
          <p className="text-slate-400 text-sm mt-2 font-light">Recuperação de senha</p>
        </div>

        <div className="bg-[#1e2d3d] rounded-2xl p-8 border border-white/5 shadow-2xl">
          {!enviado ? (
            <>
              <div className="flex items-center gap-3 mb-8">
                <Link to="/login" className="text-slate-500 hover:text-white transition-colors">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                    <path d="M19 12H5m7-7l-7 7 7 7"/>
                  </svg>
                </Link>
                <h2 className="text-white text-xl font-semibold">Esqueci minha senha</h2>
              </div>

              <p className="text-slate-400 text-sm font-light mb-6">
                Digite seu email institucional e enviaremos um link para redefinir sua senha.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={labelClass}>Email institucional</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="seu@alunos.utfpr.edu.br"
                    required
                    className={inputClass}
                  />
                </div>

                <button type="submit" disabled={carregando}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 text-sm transition-colors">
                  {carregando ? 'Enviando...' : 'Enviar instruções'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-green-400">
                  <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0l-8 5-8-5"/>
                </svg>
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">Verifique seu email</h3>
              <p className="text-slate-400 text-sm font-light mb-6">
                Se esse email estiver cadastrado, você receberá as instruções em breve.
              </p>
              <Link to="/login" className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
                Voltar para o login
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

export default EsqueciSenha