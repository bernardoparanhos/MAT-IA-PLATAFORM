import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL

function TrocarSenhaTemp() {
  const navigate = useNavigate()
  const location = useLocation()
  const emailPre = location.state?.email || ''

  const [form, setForm] = useState({ email: emailPre, senhaAtual: '', novaSenha: '', confirmarSenha: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const res = await fetch(`${API}/auth/professor/trocar-senha-temp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.message || 'Erro ao trocar senha.'); return }
      setSucesso(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch {
      setErro('Erro ao conectar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  if (sucesso) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-green-400"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 className="text-white font-semibold text-xl mb-2">Senha atualizada!</h2>
        <p className="text-slate-400 text-sm font-light">Redirecionando para o login...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-sm mt-2 font-light">Troque sua senha temporária para continuar</p>
        </div>

        <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6">
          <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl px-4 py-3 mb-5">
            <p className="text-orange-400 text-xs font-light leading-relaxed">Por segurança, você precisa definir uma nova senha antes de acessar a plataforma.</p>
          </div>

          {erro && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{erro}</p>}

          <form onSubmit={enviar} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Senha temporária (recebida por email)</label>
              <input
                type="password"
                value={form.senhaAtual}
                onChange={e => setForm(f => ({ ...f, senhaAtual: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Nova senha</label>
              <input
                type="password"
                value={form.novaSenha}
                onChange={e => setForm(f => ({ ...f, novaSenha: e.target.value }))}
                required
                placeholder="Mín. 8 chars, 1 maiúscula, 1 número"
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Confirmar nova senha</label>
              <input
                type="password"
                value={form.confirmarSenha}
                onChange={e => setForm(f => ({ ...f, confirmarSenha: e.target.value }))}
                required
                placeholder="••••••••"
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
              />
            </div>
            <button
              type="submit"
              disabled={salvando}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {salvando ? 'Salvando...' : 'Definir nova senha'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TrocarSenhaTemp
