const API = import.meta.env.VITE_API_URL

export async function getPerfil() {
  const res = await fetch(`${API}/professor/perfil`, {
    credentials: 'include',
  })
  return res.json()
}

export async function alterarSenha(senhaAtual, novaSenha) {
  const res = await fetch(`${API}/professor/senha`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senhaAtual, novaSenha })
  })
  return res.json()
}

export async function desassociarTurma(senha, turmaId) {
  const res = await fetch(`${API}/professor/desassociar`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha, turmaId })
  })
  return res.json()
}
