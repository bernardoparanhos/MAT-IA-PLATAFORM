import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, perfil }) {
  const token = localStorage.getItem('token')
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  // Não autenticado
  if (!token || !usuario) {
    return <Navigate to="/login" replace />
  }

  // Perfil errado — ex: aluno tentando acessar dashboard do professor
  if (perfil && usuario.perfil !== perfil) {
    const destino = usuario.perfil === 'professor' ? '/dashboard-professor' : '/dashboard'
    return <Navigate to={destino} replace />
  }

  return children
}

export default ProtectedRoute