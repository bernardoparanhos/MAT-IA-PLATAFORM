import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NotificacoesAlunoContext = createContext(null)

export function NotificacoesAlunoProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([])
  const token = localStorage.getItem('token')
  const API = import.meta.env.VITE_API_URL

  const buscar = useCallback(async () => {
    if (!token) return
    try {
      const res = await fetch(`${API}/auth/notificacoes/aluno`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setNotificacoes(data.notificacoes || [])
    } catch (e) {
      console.error('Erro ao buscar notificações do aluno', e)
    }
  }, [token, API])

  useEffect(() => {
    buscar()
    const intervalo = setInterval(buscar, 30000)
    return () => clearInterval(intervalo)
  }, [buscar])

  async function marcarLida(id) {
    await fetch(`${API}/auth/notificacoes/aluno/${id}/lida`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: 1 } : n))
  }

  async function apagarUma(id) {
    await fetch(`${API}/auth/notificacoes/aluno/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes(prev => prev.filter(n => n.id !== id))
  }

  async function apagarTodas() {
    await fetch(`${API}/auth/notificacoes/aluno`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
    })
    setNotificacoes([])
  }

  const naoLidas = notificacoes.filter(n => !n.lida).length

  return (
    <NotificacoesAlunoContext.Provider value={{ notificacoes, naoLidas, marcarLida, apagarUma, apagarTodas }}>
      {children}
    </NotificacoesAlunoContext.Provider>
  )
}

export function useNotificacoesAluno() {
  const ctx = useContext(NotificacoesAlunoContext)
  if (!ctx) throw new Error('useNotificacoesAluno deve ser usado dentro de NotificacoesAlunoProvider')
  return ctx
}