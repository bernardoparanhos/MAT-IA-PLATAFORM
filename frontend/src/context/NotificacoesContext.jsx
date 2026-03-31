import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NotificacoesContext = createContext(null)

export function NotificacoesProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([])
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  const buscar = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/auth/notificacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setNotificacoes(data.notificacoes || [])
    } catch (e) {
      console.error('Erro ao buscar notificações', e)
    }
  }, [token])

  useEffect(() => {
    buscar()
    const intervalo = setInterval(buscar, 30000)
    return () => clearInterval(intervalo)
  }, [buscar])

  async function marcarLida(id) {
    await fetch(`${API}/auth/notificacoes/lida/${id}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: 1 } : n))
  }

  async function marcarTodasLidas() {
    await fetch(`${API}/auth/notificacoes/lida-todas`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: 1 })))
  }

  async function apagarUma(id) {
    await fetch(`${API}/auth/notificacoes/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes(prev => prev.filter(n => n.id !== id))
  }

  async function apagarTodas() {
    await fetch(`${API}/auth/notificacoes`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes([])
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length

  return (
    <NotificacoesContext.Provider value={{ notificacoes, naoLidas, marcarLida, marcarTodasLidas, apagarUma, apagarTodas }}>
      {children}
    </NotificacoesContext.Provider>
  )
}

export function useNotificacoes() {
  const ctx = useContext(NotificacoesContext)
  if (!ctx) throw new Error('useNotificacoes deve ser usado dentro de NotificacoesProvider')
  return ctx
}