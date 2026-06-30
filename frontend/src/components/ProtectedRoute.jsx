import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, perfil }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  // Não autenticado
  if (!usuario) {
    return <Navigate to="/login" replace />
  }

  // Perfil errado — ex: aluno tentando acessar dashboard do professor
  const perfisPermitidos = Array.isArray(perfil) ? perfil : [perfil]
  if (perfil && !perfisPermitidos.includes(usuario.perfil)) {
    const destino = usuario.perfil === 'professor' ? '/dashboard-professor' : '/dashboard'
    return <Navigate to={destino} replace />
  }

  return children
}

export default ProtectedRoute