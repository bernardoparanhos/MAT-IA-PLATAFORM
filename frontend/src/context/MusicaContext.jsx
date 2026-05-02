import { createContext, useContext, useState, useRef, useEffect } from 'react'

const PLAYLIST = [
  { id: 1, nome: 'Ambient', arquivo: '/musicas/ambient.mp3' },
  { id: 2, nome: 'Calm', arquivo: '/musicas/calm.mp3' },
  { id: 3, nome: 'Focus', arquivo: '/musicas/focus.mp3' },
  { id: 4, nome: 'Jazz 01', arquivo: '/musicas/jazz01.mp3' },
  { id: 5, nome: 'Jazz 02', arquivo: '/musicas/jazz02.mp3' },
  { id: 6, nome: 'Jazz 03', arquivo: '/musicas/jazz03.mp3' },
  { id: 7, nome: 'Jazz 04', arquivo: '/musicas/jazz04.mp3' },
  { id: 8, nome: 'Jazz 05', arquivo: '/musicas/jazz05.mp3' },
  { id: 9, nome: 'Lofi 01', arquivo: '/musicas/lofi01.mp3' },
  { id: 10, nome: 'Lofi 02', arquivo: '/musicas/lofi02.mp3' },
  { id: 11, nome: 'Lofi 03', arquivo: '/musicas/lofi03.mp3' },
  { id: 12, nome: 'Lofi 04', arquivo: '/musicas/lofi04.mp3' },
  { id: 13, nome: 'Lofi 05', arquivo: '/musicas/lof05.mp3' },
  { id: 14, nome: 'Peaceful', arquivo: '/musicas/peaceful.mp3' },
  { id: 15, nome: 'Relax', arquivo: '/musicas/relax.mp3' },
]

const MusicaContext = createContext()

export function MusicaProvider({ children }) {
  const [tocando, setTocando] = useState(false)
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [volume, setVolume] = useState(0.5)
  const [aleatorio, setAleatorio] = useState(false)
  const [repetir, setRepetir] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const [duracao, setDuracao] = useState(0)
  const [favoritas, setFavoritas] = useState([])
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  useEffect(() => {
    async function carregarFavoritas() {
      try {
        const res = await fetch(`${API}/auth/musicas-favoritas`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setFavoritas(data.favoritas || [])
      } catch (e) {
        console.error('Erro ao carregar favoritas de música', e)
      }
    }
    if (token) carregarFavoritas()
  }, [token, API])

  async function toggleFavoritaMusica(id) {
    const novas = favoritas.includes(id)
      ? favoritas.filter(f => f !== id)
      : [...favoritas, id]
    setFavoritas(novas)
    try {
      await fetch(`${API}/auth/musicas-favoritas`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ favoritas: novas })
      })
    } catch (e) {
      console.error('Erro ao salvar favoritas de música', e)
    }
  }
  const audioRef = useRef(null)

  const faixaAtual = PLAYLIST[indiceAtual]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = faixaAtual.arquivo
    if (tocando) audio.play().catch(e => console.error('Erro ao tocar', e))
  }, [indiceAtual])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (tocando) {
      audio.play().catch(e => console.error('Erro ao tocar', e))
    } else {
      audio.pause()
    }
  }, [tocando])

  function togglePlay() {
    setTocando(prev => !prev)
  }

  function pararMusica() {
    setTocando(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  function proxima() {
    if (aleatorio) {
      let novo = Math.floor(Math.random() * PLAYLIST.length)
      while (novo === indiceAtual) novo = Math.floor(Math.random() * PLAYLIST.length)
      setIndiceAtual(novo)
    } else {
      setIndiceAtual(prev => (prev + 1) % PLAYLIST.length)
    }
  }

  function anterior() {
    setIndiceAtual(prev => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)
  }

  function handleTimeUpdate() {
    const audio = audioRef.current
    if (!audio) return
    setProgresso(audio.currentTime)
    setDuracao(audio.duration || 0)
  }

  function handleEnded() {
    if (repetir) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(e => console.error('Erro ao repetir', e))
    } else {
      proxima()
    }
  }

  function formatarTempo(seg) {
    if (!seg || isNaN(seg)) return '0:00'
    const m = Math.floor(seg / 60)
    const s = Math.floor(seg % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  return (
    <MusicaContext.Provider value={{
      tocando, togglePlay,
      faixaAtual, PLAYLIST, indiceAtual, setIndiceAtual,
      proxima, anterior,
      volume, setVolume,
      aleatorio, setAleatorio,
      repetir, setRepetir,
      progresso, duracao, formatarTempo,
      favoritas, toggleFavoritaMusica,
      pararMusica,
      audioRef,
    }}>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        src={faixaAtual.arquivo}
      />
      {children}
    </MusicaContext.Provider>
  )
}

export function useMusica() {
  return useContext(MusicaContext)
}