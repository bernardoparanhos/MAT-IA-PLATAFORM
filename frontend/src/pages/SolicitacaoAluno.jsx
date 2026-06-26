import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL

function SolicitacaoAluno() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', ra: '', codigoTurma: '' })
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro('')
    setSalvando(true)
    try {
      const res = await fetch(`${API}/auth/solicitar-acesso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setErro(data.message || 'Erro ao enviar.'); return }
      setSucesso(true)
    } catch {
      setErro('Erro ao enviar. Tente novamente.')
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
        <h2 className="text-white font-semibold text-xl mb-2">Solicitação enviada!</h2>
        <p className="text-slate-400 text-sm font-light mb-6">Aguarde a aprovação do seu professor. Quando aprovado, você poderá acessar a plataforma com seu RA e o código da turma.</p>
        <button onClick={() => navigate('/login')} className="text-orange-400 hover:text-orange-300 text-sm transition-colors">
          Voltar para o login
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-sm mt-2 font-light">Solicitar acesso à plataforma</p>
        </div>

        <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6">
          <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl px-4 py-3 mb-5">
            <p className="text-blue-400 text-xs font-light leading-relaxed">Peça o código da turma ao seu professor antes de preencher o formulário.</p>
          </div>

          {erro && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{erro}</p>}

          <form onSubmit={enviar} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Nome completo</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                required
                placeholder="Seu nome completo"
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">RA / Matrícula</label>
              <input
                type="text"
                value={form.ra}
                onChange={e => setForm(f => ({ ...f, ra: e.target.value }))}
                required
                placeholder="Seu RA ou número de matrícula"
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Código da turma</label>
              <input
                type="text"
                value={form.codigoTurma}
                onChange={e => setForm(f => ({ ...f, codigoTurma: e.target.value.toUpperCase() }))}
                required
                placeholder="Código fornecido pelo professor"
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light tracking-widest"
              />
            </div>

            <button
              type="submit"
              disabled={salvando}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {salvando ? 'Enviando...' : 'Solicitar acesso'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-4 font-light">
            Já foi aprovado?{' '}
            <button onClick={() => navigate('/login')} className="text-orange-400 hover:text-orange-300 transition-colors">
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SolicitacaoAluno
