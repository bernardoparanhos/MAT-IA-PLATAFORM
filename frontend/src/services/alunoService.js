const API = import.meta.env.VITE_API_URL

export async function getPerfil() {
  const res = await fetch(`${API}/auth/aluno/perfil-completo`, {
    credentials: 'include',
  })
  return res.json()
}

export async function alterarSenha(senhaAtual, novaSenha) {
  const res = await fetch(`${API}/auth/aluno/alterar-senha`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaAtual, novaSenha })
  })
  return res.json()
}
