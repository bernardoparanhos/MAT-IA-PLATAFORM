import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NotificacoesAlunoContext = createContext(null)

export function NotificacoesAlunoProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([])
  const API = import.meta.env.VITE_API_URL

  const buscar = useCallback(async () => {
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
    if (!usuario || usuario.perfil !== 'aluno') return
    try {
      const res = await fetch(`${API}/auth/notificacoes/aluno`, {
        credentials: 'include',
      })
      const data = await res.json()
      setNotificacoes(data.notificacoes || [])
    } catch (e) {
      console.error('Erro ao buscar notificações do aluno', e)
    }
  }, [API])


  useEffect(() => {
    buscar()
    const intervalo = setInterval(buscar, 30000)
    return () => clearInterval(intervalo)
  }, [buscar])

  async function marcarLida(id) {
    await fetch(`${API}/auth/notificacoes/aluno/${id}/lida`, {
      credentials: 'include',
      method: 'POST',
    })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: 1 } : n))
  }

  async function apagarUma(id) {
    await fetch(`${API}/auth/notificacoes/aluno/${id}`, {
      credentials: 'include',
      method: 'DELETE',
    })
    setNotificacoes(prev => prev.filter(n => n.id !== id))
  }

  async function apagarTodas() {
    await fetch(`${API}/auth/notificacoes/aluno`, {
      credentials: 'include',
      method: 'DELETE',
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
