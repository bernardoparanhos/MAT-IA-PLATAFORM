import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Formula from '../components/Formula'

// ─── TELA: BOAS-VINDAS ────────────────────────────────────────────────────────
function TelaBoasVindas({ onIniciar }) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-sm mt-1 font-light">Suporte Inteligente ao Aprendizado de Matemática</p>
        </div>

        {/* Card principal */}
        <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-8">
          <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-orange-400">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-white text-center mb-2">Diagnóstico MAT-IA</h2>
          <p className="text-slate-400 text-sm text-center font-light mb-6">
            Responda as questões abaixo. Seu professor receberá os resultados para acompanhar seu desempenho.
          </p>

          {/* Aviso honestidade */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
            <p className="text-slate-400 text-xs font-light leading-relaxed italic">
              "Responda por conta própria — sem calculadora ou consultas. Seus resultados ajudam o professor a entender melhor o nível da turma."
            </p>
          </div>

          {/* Botões */}
          <button
            onClick={onIniciar}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors mb-3">
            🎯 Fazer diagnóstico agora
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── TELA: ANALISANDO ─────────────────────────────────────────────────────────
function TelaAnalisando() {
  const frases = [
    'Calculando seu nível...',
    'Identificando pontos fortes...',
    'Mapeando áreas de melhoria...',
    'Preparando sua trilha...',
  ]
  const [fraseIdx, setFraseIdx] = useState(0)

  useEffect(() => {
    const intervalo = setInterval(() => {
      setFraseIdx(i => (i + 1) % frases.length)
    }, 900)
    return () => clearInterval(intervalo)
  }, [])

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="text-center">
        {/* Spinner */}
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-white/5" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin" />
          <div className="absolute inset-2 rounded-full bg-orange-500/10 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7 text-orange-400">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-white mb-2">Analisando seu perfil...</h2>
        <p className="text-orange-400 text-sm font-light transition-all duration-500">{frases[fraseIdx]}</p>

        {/* Barra de progresso animada */}
        <div className="w-64 mx-auto mt-8 bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full animate-pulse" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  )
}

// ─── TELA: QUESTÃO ────────────────────────────────────────────────────────────
function TelaQuestao({ questao, total, atual, onResponder, onPular }) {
  const [selecionada, setSelecionada] = useState(null)
  const [dicaAberta, setDicaAberta] = useState(null) // 0 ou 1
  const [dicasUsadas, setDicasUsadas] = useState([])
  const [confirmando, setConfirmando] = useState(false)

  // Reset ao trocar de questão
  useEffect(() => {
    setSelecionada(null)
    setDicaAberta(null)
    setDicasUsadas([])
    setConfirmando(false)
  }, [questao.id])

  function abrirDica(idx) {
    setDicaAberta(dicaAberta === idx ? null : idx)
    if (!dicasUsadas.includes(idx)) setDicasUsadas([...dicasUsadas, idx])
  }

  function handleSelecionar(letra) {
    if (confirmando) return
    setSelecionada(letra)
  }

  function handleConfirmar() {
    if (!selecionada) return
    setConfirmando(true)
    setTimeout(() => {
      const respostaOriginal = questao._mapa ? questao._mapa[selecionada] : selecionada
      onResponder(questao.id, respostaOriginal, dicasUsadas)
    }, 300)
  }

  const letras = Object.keys(questao.alternativas)
  const progresso = ((atual - 1) / total) * 100

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col" style={{ fontFamily: 'Outfit, sans-serif' }}>

      {/* Header */}
      <div className="border-b border-white/5 px-6 py-4">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
            <span className="text-slate-400 text-sm font-light">
              Questão <span className="text-white font-medium">{atual}</span> de {total}
            </span>
          </div>
          {/* Barra de progresso */}
          <div className="w-full bg-white/5 rounded-full h-1.5">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 flex items-start justify-center px-4 py-8 overflow-y-auto">
        <div className="w-full max-w-xl">

          {/* Bloco temático */}
          <div className="mb-2">
            <span className="text-xs text-orange-400/70 font-light uppercase tracking-widest">
              {questao.bloco === 'inteiros' && 'Números Inteiros'}
              {questao.bloco === 'fracoes' && 'Frações'}
              {questao.bloco === 'raizes' && 'Raízes'}
              {questao.bloco === 'geometria' && 'Geometria'}
            </span>
          </div>

          {/* Enunciado */}
          <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6 mb-4">
            <p className="text-white text-xl font-medium text-center tracking-wide">
  {questao.latex ? <Formula tex={questao.enunciado} block={true} /> : questao.enunciado}
</p>
          </div>

          {/* Alternativas */}
          <div className="space-y-3 mb-6">
            {letras.map(letra => (
              <button
                key={letra}
                onClick={() => handleSelecionar(letra)}
                disabled={confirmando}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all text-left
                  ${selecionada === letra
                    ? 'bg-orange-500/15 border-orange-500/50 text-white'
                    : 'bg-[#1e2d3d] border-white/5 text-slate-300 hover:border-white/20 hover:bg-white/5'
                  }`}>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium flex-shrink-0 transition-colors
                  ${selecionada === letra ? 'bg-orange-500 text-white' : 'bg-white/5 text-slate-400'}`}>
                  {letra}
                </span>
                <span className="text-sm font-light">
  {questao.latex ? <Formula tex={questao.alternativas[letra]} /> : questao.alternativas[letra]}
</span>
              </button>
            ))}
          </div>

          {/* Dicas */}
          <div className="space-y-2 mb-6">
            {questao.dicas.map((dica, idx) => (
              <div key={idx} className="bg-[#1e2d3d] border border-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => abrirDica(idx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left">
                  <div className="flex items-center gap-2">
                   <svg viewBox="0 0 1024 1024" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
  <path d="M550.4 713.6c0 19.7-20 35.7-44.7 35.7-24.7 0-44.7-16-44.7-35.7" fill="#f97316" />
  <path d="M653.9 520.8c0-76.8-64-139-142.9-139s-142.9 62.2-142.9 139c0 16.6 3.1 32.4 8.6 47.1L460 774.8h97l81.5-191.5c11.6-26 15.4-33.3 15.4-62.5z" fill="#f97316" />
  <path d="M612.9 766.4c0 14.8-12.1 26.8-27 26.8H425.5c-14.9 0-27-12-27-26.8s12.1-26.8 27-26.8h160.3c15 0 27.1 12 27.1 26.8zM612.9 820c0 14.8-12.1 26.8-27 26.8H425.5c-14.9 0-27-12-27-26.8s12.1-26.8 27-26.8h160.3c15 0 27.1 12 27.1 26.8z" fill="#94a3b8" />
  <path d="M511 363.9c-88.7 0-160.8 70.4-160.8 156.9 0 18 3.3 36 9.9 53.8l59.5 147.8c-21.9 2.9-38.9 21.5-38.9 44.1 0 10.1 3.5 19.3 9.2 26.8-5.7 7.5-9.2 16.7-9.2 26.8 0 24.6 20.1 44.7 44.9 44.7h17.6c0 29.6 28.1 53.6 62.5 53.6s62.5-24 62.5-53.6h17.6c24.8 0 44.9-20 44.9-44.7 0-10.1-3.5-19.3-9.2-26.8 5.7-7.5 9.2-16.7 9.2-26.8 0-20.3-13.8-37.4-32.6-42.7l56.7-133.1 1.4-3.1c11-24.7 15.6-34.9 15.6-66.8 0-86.5-72.1-156.9-160.8-156.9z m-5.3 518.7c-14.3 0-26.8-8.3-26.8-17.9h53.6c0 9.5-12.5 17.9-26.8 17.9z m80.2-53.6H425.5c-5.1 0-9.2-4-9.2-8.9s4.1-8.9 9.2-8.9h160.3c5.1 0 9.2 4 9.2 8.9s-4.1 8.9-9.1 8.9z m0-53.6H425.5c-5.1 0-9.2-4-9.2-8.9s4.1-8.9 9.2-8.9h160.3c5.1 0 9.2 4 9.2 8.9s-4.1 8.9-9.1 8.9z m-90.6-53.6l-18.5-119.9c8.6 3.8 20 7.1 34 7.1 13.1 0 23.7-2.9 31.6-6.4L524 721.8h-28.7zM623.6 573l-63.4 148.8h-18l21-136.3c0.6-3.9-1.4-7.7-5-9.4-3.5-1.7-7.8-0.9-10.5 2-0.5 0.5-12.4 13-36.9 13-25 0-39.1-12.9-39.6-13.4-2.8-2.7-6.9-3.3-10.3-1.5-3.4 1.8-5.3 5.5-4.7 9.3l21 136.3h-19.4l-64.4-160.1c-5-13.4-7.5-27.1-7.5-40.9 0-66.8 56.1-121.1 125.1-121.1s125.1 54.4 125.1 121.1c0 24.2-2.4 29.6-12.5 52.2zM371.9 373.3c7-7 6.9-18.3-0.1-25.3l-71.5-71c-7-7-18.3-6.9-25.3 0.1s-6.9 18.3 0.1 25.3l71.6 71.1c3.5 3.5 8 5.2 12.6 5.2 4.6-0.1 9.2-1.8 12.6-5.4zM747 277.1c-6.9-7-18.3-7-25.3-0.1l-71.6 71.1c-7 6.9-7 18.2-0.1 25.3 3.5 3.5 8.1 5.3 12.7 5.3s9.1-1.7 12.6-5.2l71.6-71.1c7-7 7.1-18.3 0.1-25.3zM511 328.7c9.9 0 17.9-8 17.9-17.9V185.7c0-9.9-8-17.9-17.9-17.9s-17.9 8-17.9 17.9v125.1c0 9.9 8 17.9 17.9 17.9z" fill="#cbd5e1" />
</svg>
                    <span className="text-slate-400 text-xs font-light">
                      Dica {idx + 1}
                      {dicasUsadas.includes(idx) && <span className="ml-2 text-orange-400/50">• usada</span>}
                    </span>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    className={`w-4 h-4 text-slate-500 transition-transform ${dicaAberta === idx ? 'rotate-180' : ''}`}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {dicaAberta === idx && (
                  <div className="px-4 pb-4 pt-0">
                    <p className="text-slate-300 text-sm font-light leading-relaxed italic border-t border-white/5 pt-3">
                      {dica}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              onClick={() => onPular(questao.id)}
              className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-sm font-light transition-colors">
              Não sei
            </button>
            <button
              onClick={handleConfirmar}
              disabled={!selecionada || confirmando}
              className={`flex-2 px-8 py-3 rounded-xl text-sm font-medium transition-all
                ${selecionada && !confirmando
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-white/5 text-slate-500 cursor-not-allowed'
                }`}>
              {confirmando ? 'Confirmando...' : 'Confirmar →'}
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

function embaralharQuestao(q) {
  const letras = ['A', 'B', 'C', 'D']
  const embaralhadas = [...letras]
  for (let i = embaralhadas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [embaralhadas[i], embaralhadas[j]] = [embaralhadas[j], embaralhadas[i]]
  }
  const alternativasVisuais = {}
  const mapa = {} // visual → original
  letras.forEach((letraVisual, i) => {
    alternativasVisuais[letraVisual] = q.alternativas[embaralhadas[i]]
    mapa[letraVisual] = embaralhadas[i]
  })
  return { ...q, alternativas: alternativasVisuais, _mapa: mapa }
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
function Nivelamento() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  const [tela, setTela] = useState('boasVindas') // boasVindas | questao | analisando
  const [questoes, setQuestoes] = useState([])
  const [questaoAtual, setQuestaoAtual] = useState(0)
  const [respostas, setRespostas] = useState({})   // { "1": "A", ... }
  const [dicasUsadas, setDicasUsadas] = useState([]) // [1, 3, ...]
  const [puladas, setPuladas] = useState([])          // [2, 5, ...]

  async function carregarQuestoes() {
    try {
      const res = await fetch(`${API}/auth/diagnostico/questoes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setQuestoes((data.questoes || []).map(embaralharQuestao))
    } catch (e) {
      console.error('Erro ao carregar questões', e)
    }
  }

  async function handlePular() {
    try {
      await fetch(`${API}/auth/diagnostico/pular`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      navigate('/dashboard')
    } catch (e) {
      console.error('Erro ao pular diagnóstico', e)
      navigate('/dashboard')
    }
  }

  const [iniciadoEm, setIniciadoEm] = useState(null)

function handleIniciar() {
    carregarQuestoes()
    setIniciadoEm(Date.now())
    setTela('questao')
  }

  function handleResponder(questaoId, resposta) {
    const novasRespostas = { ...respostas, [questaoId]: resposta }
    setRespostas(novasRespostas)

    const novasDicas = [...dicasUsadas]
    if (!novasDicas.includes(questaoId)) novasDicas.push(questaoId)
    setDicasUsadas(novasDicas)

    avancar(novasRespostas)
  }

  function handlePularQuestao(questaoId) {
    const novasPuladas = [...puladas, questaoId]
    setPuladas(novasPuladas)
    avancar(respostas, novasPuladas)
  }

  function avancar(respostasAtuais, puladasAtuais = puladas) {
    if (questaoAtual + 1 >= questoes.length) {
      finalizarTeste(respostasAtuais, puladasAtuais)
    } else {
      setQuestaoAtual(q => q + 1)
    }
  }

  async function finalizarTeste(respostasFinais, puladasFinais) {
    setTela('analisando')
    try {
      await fetch(`${API}/auth/diagnostico/responder`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        respostas: respostasFinais,
        usou_dicas: dicasUsadas,
        pulou: puladasFinais,
        iniciado_em: iniciadoEm
      })
      })
    } catch (e) {
      console.error('Erro ao enviar respostas', e)
    }

    // Aguarda animação (3.5s) depois redireciona para resultado
    setTimeout(() => {
      navigate('/nivelamento/resultado')
    }, 3500)
  }

  // ── Renderização por tela ──
  if (tela === 'boasVindas') {
    return <TelaBoasVindas onIniciar={handleIniciar} onPular={handlePular} />
  }

  if (tela === 'analisando') {
    return <TelaAnalisando />
  }

  if (tela === 'questao' && questoes.length > 0) {
    return (
      <TelaQuestao
        questao={questoes[questaoAtual]}
        total={questoes.length}
        atual={questaoAtual + 1}
        onResponder={handleResponder}
        onPularQuestao={handlePularQuestao}
        onPular={handlePularQuestao}
      />
    )
  }

  // Loading enquanto carrega questões
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm font-light">Carregando questões...</p>
      </div>
    </div>
  )
}

export default Nivelamento