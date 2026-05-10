import { createContext, useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutoLogout } from '../hooks/useAutoLogout.jsx'
import { AutoLogoutModal } from '../hooks/AutoLogoutModal.jsx'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()

  const [usuario, setUsuario] = useState(() => {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  })

  function login(token, dadosUsuario) {
    localStorage.setItem('usuario', JSON.stringify(dadosUsuario))
    setUsuario(dadosUsuario)

    // Redireciona por perfil
    if (dadosUsuario.perfil === 'professor') {
      navigate('/dashboard-professor')
    } else {
      navigate('/dashboard')
    }
  }

  async function logout() {
    const API = import.meta.env.VITE_API_URL
    await fetch(`${API}/auth/logout`, { method: 'POST', credentials: 'include' })
    localStorage.removeItem('usuario')
    setUsuario(null)
    navigate('/login')
  }

  const { modalAberto, segundos, continuarSessao } = useAutoLogout(usuario ? logout : null)

  return (
    <AuthContext.Provider value={{ usuario, login, logout }}>
      {children}
      <AutoLogoutModal
        modalAberto={modalAberto}
        segundos={segundos}
        continuarSessao={continuarSessao}
      />
    </AuthContext.Provider>
  )
}

// Hook para usar em qualquer componente
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}