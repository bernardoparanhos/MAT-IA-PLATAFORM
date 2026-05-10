import { useEffect, useRef, useState, useCallback } from 'react'

const TIMEOUT_MS = 30 * 60 * 1000   // 30 minutos
const WARNING_MS = 28 * 60 * 1000   // avisa 2 min antes
const COUNTDOWN_SEC = 120            // segundos do countdown
const EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']

export function useAutoLogout(logout) {
  const [modalAberto, setModalAberto] = useState(false)
  const [segundos, setSegundos] = useState(COUNTDOWN_SEC)

  const warningTimerRef = useRef(null)
  const logoutTimerRef  = useRef(null)
  const countdownRef    = useRef(null)

  const clearAllTimers = useCallback(() => {
    clearTimeout(warningTimerRef.current)
    clearTimeout(logoutTimerRef.current)
    clearInterval(countdownRef.current)
  }, [])

  // Apenas agenda os timeouts, sem chamar setState — seguro dentro de useEffect
  const startTimers = useCallback(() => {
    clearAllTimers()

    warningTimerRef.current = setTimeout(() => {
      setModalAberto(true)
      setSegundos(COUNTDOWN_SEC)

      countdownRef.current = setInterval(() => {
        setSegundos(s => {
          if (s <= 1) {
            clearInterval(countdownRef.current)
            return 0
          }
          return s - 1
        })
      }, 1000)
    }, WARNING_MS)

    logoutTimerRef.current = setTimeout(() => {
      clearAllTimers()
      setModalAberto(false)
      logout()
    }, TIMEOUT_MS)
  }, [logout, clearAllTimers])

  // Chamado pelos event listeners: reseta estado + reinicia timers
  const resetTimers = useCallback(() => {
    setModalAberto(false)
    setSegundos(COUNTDOWN_SEC)
    startTimers()
  }, [startTimers])

  const continuarSessao = useCallback(() => {
    resetTimers()
  }, [resetTimers])

  useEffect(() => {
    if (!logout) return

    startTimers()

    EVENTS.forEach(e => window.addEventListener(e, resetTimers, { passive: true }))

    return () => {
      clearAllTimers()
      EVENTS.forEach(e => window.removeEventListener(e, resetTimers))
    }
  }, [logout, startTimers, resetTimers, clearAllTimers])

  return { modalAberto, segundos, continuarSessao }
}
