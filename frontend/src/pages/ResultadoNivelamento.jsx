import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NIVEL_CONFIG = {
  basico: { emoji: '🔴', label: 'Básico', cor: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', msg: 'Bom começo! Os fundamentos são a base de tudo.' },
  intermediario: { emoji: '🟡', label: 'Intermediário', cor: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', msg: 'Você já tem uma base sólida. Vamos avançar!' },
  avancado: { emoji: '🟢', label: 'Avançado', cor: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', msg: 'Excelente domínio! Continue assim.' },
}

const BLOCO_CONFIG = {
  inteiros: { label: 'Inteiros', total: 3 },
  fracoes: { label: 'Frações', total: 3 },
  raizes: { label: 'Raízes', total: 3 },
  potencias: { label: 'Potências', total: 4 },
  geometria: { label: 'Geometria', total: 2 },
}

function ResultadoNivelamento() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(true)

  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    async function buscar() {
      try {
        const res = await fetch(`${API}/auth/diagnostico/resultado`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        if (res.ok) setResultado(data.resultado)
      } catch (e) {
        console.error('Erro ao buscar resultado', e)
      } finally {
        setCarregando(false)
      }
    }
    buscar()
  }, [])

  function sair() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    navigate('/login')
  }

  if (carregando) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const nivel = resultado ? NIVEL_CONFIG[resultado.nivel] : null

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4 py-10" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-full max-w-lg">

        <h1 className="text-2xl font-bold text-orange-400 text-center mb-8">MAT<span className="text-white">-IA</span></h1>

        <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-8 mb-4">

          {/* Ícone + título */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-orange-400">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">
              Diagnóstico concluído, {usuario?.nome?.split(' ')[0]}!
            </h2>
            <p className="text-slate-400 text-sm font-light mt-1">Veja abaixo seu resultado</p>
          </div>

          {resultado && nivel && (
            <>
              {/* Nível + Pontuação lado a lado */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className={`${nivel.bg} border ${nivel.border} rounded-xl p-4 text-center`}>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Nível</p>
                  <p className={`text-xl font-bold ${nivel.cor}`}>{nivel.emoji} {nivel.label}</p>
                  <p className="text-slate-500 text-xs font-light mt-1">{nivel.msg}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Pontuação</p>
                  <p className="text-4xl font-bold text-white leading-none">{resultado.pontuacao}</p>
                  <p className="text-slate-500 text-sm font-light mt-1">de 17 pontos</p>
                </div>
              </div>

              {/* Blocos em grid 2x3 */}
              <div>
                <p className="text-slate-500 text-xs uppercase tracking-widest mb-3">Desempenho por área</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(BLOCO_CONFIG).map(([bloco, config]) => {
                    const dados = resultado.blocos?.[bloco]
                    const acertos = dados?.acertos ?? 0
                    const total = config.total
                    const pct = total > 0 ? Math.round((acertos / total) * 100) : 0
                    const corBarra = pct === 0 ? 'bg-red-500' : pct < 100 ? 'bg-yellow-500' : 'bg-green-500'
                    const corTexto = pct === 0 ? 'text-red-400' : pct < 100 ? 'text-yellow-400' : 'text-green-400'
                    return (
                      <div key={bloco} className="bg-white/5 border border-white/5 rounded-xl p-4">
                        <p className="text-slate-300 text-sm font-medium mb-1">{config.label}</p>
                        <p className={`text-2xl font-bold ${corTexto} mb-2`}>{acertos}<span className="text-slate-600 text-sm font-light">/{total}</span></p>
                        <div className="w-full bg-white/10 rounded-full h-1.5">
                          <div className={`${corBarra} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <p className="text-slate-400 text-xs font-light text-center leading-relaxed">
              📚 Em breve sua trilha de estudos personalizada estará disponível com base neste resultado.
            </p>
          </div>
        </div>

        <button onClick={sair} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors">
          Concluir e sair
        </button>

        <p className="text-slate-600 text-xs text-center mt-6 font-light">UTFPR Campus Medianeira — 2026</p>
      </div>
    </div>
  )
}

export default ResultadoNivelamento