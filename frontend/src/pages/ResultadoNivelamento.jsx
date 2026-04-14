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
  potencias: { label: 'Potências', total: 9 },
  geometria: { label: 'Geometria', total: 2 },
}

function ResultadoNivelamento() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [resultado, setResultado] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [feedbackJaEnviado, setFeedbackJaEnviado] = useState(false)
  
  // Estados do feedback
  const [notaSelecionada, setNotaSelecionada] = useState(null)
  const [comentario, setComentario] = useState('')
  const [enviandoFeedback, setEnviandoFeedback] = useState(false)
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
  async function buscar() {
    try {
      // Busca resultado
      const res = await fetch(`${API}/auth/diagnostico/resultado`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (res.ok) setResultado(data.resultado)

      // Verifica se já enviou feedback
      const resFeedback = await fetch(`${API}/auth/diagnostico/feedback-enviado`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const dataFeedback = await resFeedback.json()
      if (resFeedback.ok && dataFeedback.enviado) {
        setFeedbackJaEnviado(true)
      }
    } catch (e) {
      console.error('Erro ao buscar resultado', e)
    } finally {
      setCarregando(false)
    }
  }
  buscar()
}, [])

  async function handleEnviarFeedback() {
    if (notaSelecionada === null) {
      alert('Por favor, selecione uma nota de 0 a 10')
      return
    }

    setEnviandoFeedback(true)
    try {
      const res = await fetch(`${API}/auth/diagnostico/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nota: notaSelecionada,
          comentario: comentario.trim() || null
        })
      })

    if (res.ok) {
  // Marca como enviado e atualiza UI
  setFeedbackJaEnviado(true)
  setEnviandoFeedback(false)
} else {
  const data = await res.json()
  alert(data.message || 'Erro ao enviar feedback')
  setEnviandoFeedback(false)
}
    } catch (e) {
      console.error('Erro ao enviar feedback', e)
      alert('Erro ao enviar feedback. Tente novamente.')
      setEnviandoFeedback(false)
    }
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

        {/* Card de Resultado */}
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
                  <p className="text-slate-500 text-sm font-light mt-1">de 20 pontos</p>
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

        {/* Card de Feedback */}
        {/* Card de Feedback — só mostra se NÃO enviou ainda */}
{!feedbackJaEnviado ? (
  <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-8 mb-4">
    <div className="text-center mb-6">
      <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-orange-400">
          <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z"/>
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">Sua opinião importa</h3>
      <p className="text-slate-400 text-sm font-light">Avalie sua experiência com o diagnóstico</p>
    </div>

    {/* Botões de nota 0-10 */}
    <div className="mb-5">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 text-center">Nota de 0 a 10</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(nota => (
          <button
            key={nota}
            onClick={() => setNotaSelecionada(nota)}
            disabled={enviandoFeedback}
            className={`w-11 h-11 rounded-xl font-semibold text-sm transition-all
              ${notaSelecionada === nota
                ? 'bg-orange-500 text-white border-orange-500'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:border-orange-500/50 hover:text-orange-400'
              }`}>
            {nota}
          </button>
        ))}
      </div>
    </div>

    {/* Textarea opcional */}
    <div className="mb-5">
      <label className="text-slate-500 text-xs uppercase tracking-widest mb-2 block">
        Comentário (opcional)
      </label>
      <textarea
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
        disabled={enviandoFeedback}
        placeholder="Compartilhe sua experiência ou sugestões..."
        maxLength={500}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-slate-300 text-sm font-light placeholder-slate-600 focus:outline-none focus:border-orange-500/50 resize-none"
        rows="3"
      />
      <p className="text-slate-600 text-xs mt-1 text-right">{comentario.length}/500</p>
    </div>

    {/* Aviso */}
    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-5">
      <p className="text-slate-400 text-xs font-light leading-relaxed text-center">
        💡 Seu feedback nos ajuda a melhorar a plataforma para todos os alunos
      </p>
    </div>
  </div>
) : (
  /* Mensagem de agradecimento se já enviou */
  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 mb-4">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-green-400">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <div>
        <p className="text-green-400 font-semibold text-sm">Feedback enviado!</p>
        <p className="text-slate-400 text-xs font-light mt-0.5">Obrigado por avaliar o diagnóstico.</p>
      </div>
    </div>
  </div>
)}

{/* Botão de enviar feedback OU sair */}
{!feedbackJaEnviado ? (
  <button
    onClick={handleEnviarFeedback}
    disabled={notaSelecionada === null || enviandoFeedback}
    className={`w-full py-3 rounded-xl text-sm font-medium transition-colors
      ${notaSelecionada !== null && !enviandoFeedback
        ? 'bg-orange-500 hover:bg-orange-600 text-white'
        : 'bg-white/5 text-slate-500 cursor-not-allowed'
      }`}>
    {enviandoFeedback ? 'Enviando...' : 'Enviar feedback e concluir'}
  </button>
) : (
  <button
    onClick={() => {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      navigate('/login')
    }}
    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors">
    Voltar ao login
  </button>
)}

        <p className="text-slate-600 text-xs text-center mt-6 font-light">UTFPR Campus Medianeira — 2026</p>
      </div>
    </div>
  )
}

export default ResultadoNivelamento