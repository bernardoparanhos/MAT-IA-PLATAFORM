import { useState } from 'react'
import { useMusica } from '../context/MusicaContext'

export default function PlayerMusica() {
  const {
    tocando, togglePlay,
    faixaAtual, PLAYLIST, indiceAtual, setIndiceAtual,
    proxima, anterior,
    volume, setVolume,
    aleatorio, setAleatorio,
    repetir, setRepetir,
    progresso, duracao, formatarTempo,
    favoritas, toggleFavoritaMusica,
    audioRef,
  } = useMusica()

  const [expandido, setExpandido] = useState(false)
  const [arrastando, setArrastando] = useState(false)

  const pct = duracao > 0 ? (progresso / duracao) * 100 : 0

  return (
    <>
      {expandido && (
      <div
        className="fixed inset-0 z-40"
        onClick={() => setExpandido(false)}
      />
    )}
    <div
      className="fixed bottom-5 right-5 z-50 select-none"
      style={{ fontFamily: 'Outfit, sans-serif' }}
    >
      {expandido ? (
        <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl shadow-2xl w-72 p-4">

          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-orange-400">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
              <span className="text-white text-xs font-light">Música ambiente</span>
            </div>
            <button
              onClick={() => setExpandido(false)}
              className="text-slate-500 hover:text-white transition-colors text-xs"
            >✕</button>
          </div>

          {/* Faixa atual */}
          <div className="mb-3">
            <p className="text-white text-sm font-light truncate">{faixaAtual.nome}</p>
            <div className="flex justify-between text-slate-500 text-xs mt-0.5">
              <span>{formatarTempo(progresso)}</span>
              <span>{formatarTempo(duracao)}</span>
            </div>
            {/* Barra de progresso */}
            <input
              type="range"
              min="0"
              max={duracao || 0}
              step="1"
              value={progresso}
              onMouseDown={() => {
                setArrastando(true)
                const audio = document.querySelector('audio')
                if (audio) audio.pause()
              }}
              onMouseUp={e => {
                const audio = document.querySelector('audio')
                if (audio) {
                  audio.currentTime = parseFloat(e.target.value)
                  if (tocando) audio.play().catch(err => console.error('Erro ao retomar', err))
                }
                setArrastando(false)
              }}
              onChange={e => {
                const audio = document.querySelector('audio')
                if (audio && arrastando) audio.currentTime = parseFloat(e.target.value)
              }}
              className="w-full accent-orange-500 mt-1"
              style={{ height: '4px' }}
            />
          </div>

          {/* Controles */}
          <div className="flex items-center justify-center gap-4 mb-3">
            <button
              onClick={anterior}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
              </svg>
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-400 transition-colors flex items-center justify-center"
            >
              {tocando ? (
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>

            <button
              onClick={proxima}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M6 18l8.5-6L6 6v12zm2.5-6 8.5 6V6z" style={{display:'none'}}/>
                <path d="M16 6h2v12h-2zm-3.5 6L4 6v12z"/>
              </svg>
            </button>
          </div>

          {/* Aleatorio + Repetir + Volume */}
          <div className="flex items-center gap-2 mb-3">
          <button
              onClick={() => { setAleatorio(p => !p); setRepetir(false) }}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${aleatorio ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
              ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6"/></svg></button>
            <button
              onClick={() => { setRepetir(p => !p); setAleatorio(false) }}
              className={`text-xs px-2 py-1 rounded-lg transition-colors ${repetir ? 'bg-orange-500/20 text-orange-400' : 'text-slate-500 hover:text-slate-300'}`}
              ><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg></button>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-slate-500 text-xs">🔈</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => setVolume(parseFloat(e.target.value))}
                className="flex-1 accent-orange-500"
              />
            </div>
          </div>

          {/* Playlist */}
          <div className="border-t border-white/5 pt-2 max-h-36 overflow-y-auto space-y-0.5">
            {PLAYLIST.map((faixa, idx) => (
              <button
                key={faixa.id}
                onClick={() => setIndiceAtual(idx)}
                className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-light transition-colors ${
                  idx === indiceAtual
                    ? 'bg-orange-500/15 text-orange-400'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center justify-between w-full">
                <span>{idx === indiceAtual && tocando ? '▶ ' : ''}{faixa.nome}</span>
                <button
                  onClick={e => { e.stopPropagation(); toggleFavoritaMusica(faixa.id) }}
                  className={`ml-2 transition-colors ${favoritas.includes(faixa.id) ? 'text-red-400' : 'text-slate-600 hover:text-slate-400'}`}
                >
                  {favoritas.includes(faixa.id) ? '♥' : '♡'}
                </button>
              </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Colapsado */
        <button
          onClick={() => setExpandido(true)}
          className="w-12 h-12 rounded-full bg-[#1e2d3d] border border-white/10 shadow-2xl flex items-center justify-center hover:border-orange-500/40 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 ${tocando ? 'text-orange-400' : 'text-slate-500'}`}>
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          {tocando && (
            <>
              <span className="absolute inset-0 rounded-full border border-orange-500/60 animate-ping" />
              <span className="absolute inset-[-4px] rounded-full border border-orange-500/30 animate-ping" style={{ animationDelay: '0.3s' }} />
            </>
          )}
        </button>
      )}
    </div>
    </>
  )
}