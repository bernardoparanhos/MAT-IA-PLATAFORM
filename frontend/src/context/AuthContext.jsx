import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(() => {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  })

  function login(token, dadosUsuario) {
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(dadosUsuario))
    setUsuario(dadosUsuario)

    // Redireciona por perfil
    if (dadosUsuario.perfil === 'professor') {
      navigate('/dashboard-professor')
    } else {
      navigate('/dashboard')
    }
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    setUsuario(null)
    navigate('/login')
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar em qualquer componente
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}