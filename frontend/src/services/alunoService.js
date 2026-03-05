const API = import.meta.env.VITE_API_URL

function getToken() {
  return localStorage.getItem('token')
}

export async function getPerfil() {
  const res = await fetch(`${API}/auth/aluno/perfil-completo`, {
    headers: { Authorization: `Bearer ${getToken()}` }
  })
  return res.json()
}

export async function alterarSenha(senhaAtual, novaSenha) {
  const res = await fetch(`${API}/auth/aluno/alterar-senha`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ senhaAtual, novaSenha })
  })
  return res.json()
}