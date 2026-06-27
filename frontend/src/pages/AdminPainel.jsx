import { useState, useEffect } from 'react'

const API = import.meta.env.VITE_API_URL

function AdminPainel() {
  const [secret, setSecret] = useState('')
  const [totp, setTotp] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [solicitacoes, setSolicitacoes] = useState([])
  const [logs, setLogs] = useState([])
  const [carregando, setCarregando] = useState(false)
  const [processando, setProcessando] = useState(null)
  const [erro, setErro] = useState('')
  const [abaAtiva, setAbaAtiva] = useState('solicitacoes')
  const [consumo, setConsumo] = useState(null)
  const [carregandoConsumo, setCarregandoConsumo] = useState(false)
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7))
  const [filtroProfessor, setFiltroProfessor] = useState('')

  function adminHeaders() {
    const headers = { 'x-admin-secret': secret }
    if (sessionToken) headers['x-admin-session'] = sessionToken
    if (totp && !sessionToken) headers['x-totp-code'] = totp
    return headers
  }

  async function autenticar(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)
    try {
      const res = await fetch(`${API}/auth/admin/solicitacoes-professor`, {
        headers: adminHeaders()
      })
      if (!res.ok) { setErro('Chave ou código inválido.'); return }
      const newSessionToken = res.headers.get('x-admin-session-token')
      if (newSessionToken) setSessionToken(newSessionToken)
      const data = await res.json()
      setSolicitacoes(data.solicitacoes || [])
      const resLogs = await fetch(`${API}/auth/admin/logs`, {
        headers: {
          'x-admin-secret': secret,
          ...(newSessionToken ? { 'x-admin-session': newSessionToken } : { 'x-totp-code': totp })
        }
      })
      const dataLogs = await resLogs.json()
      setLogs(dataLogs.logs || [])
      setAutenticado(true)
    } catch {
      setErro('Erro ao conectar.')
    } finally {
      setCarregando(false)
    }
  }

  async function buscarConsumo() {
    setCarregandoConsumo(true)
    try {
      const params = new URLSearchParams()
      if (filtroMes) params.append('mes', filtroMes)
      if (filtroProfessor) params.append('professor_id', filtroProfessor)
      const res = await fetch(`${API}/auth/admin/uso-ia?${params}`, {
        headers: adminHeaders()
      })
      const data = await res.json()
      setConsumo(data)
    } catch (e) {
      console.error('Erro ao buscar consumo', e)
    } finally {
      setCarregandoConsumo(false)
    }
  }

  async function aprovar(id) {
    setProcessando(id)
    try {
      await fetch(`${API}/auth/admin/solicitacoes-professor/${id}/aprovar`, {
        method: 'PATCH',
        headers: adminHeaders()
      })
      setSolicitacoes(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'aprovado' } : s
      ))
    } catch (e) {
      console.error('Erro ao aprovar', e)
    } finally {
      setProcessando(null)
    }
  }

  async function rejeitar(id) {
    setProcessando(id)
    try {
      await fetch(`${API}/auth/admin/solicitacoes-professor/${id}/rejeitar`, {
        method: 'PATCH',
        headers: adminHeaders()
      })
      setSolicitacoes(prev => prev.map(s =>
        s.id === id ? { ...s, status: 'rejeitado' } : s
      ))
    } catch (e) {
      console.error('Erro ao rejeitar', e)
    } finally {
      setProcessando(null)
    }
  }

  const pendentes = solicitacoes.filter(s => s.status === 'pendente')
  const processadas = solicitacoes.filter(s => s.status !== 'pendente')

  const tipoLabel = (tipo) => {
    if (tipo === 'universitario') return 'Universitário'
    if (tipo === 'medio') return 'Ensino Médio'
    if (tipo === 'fundamental') return 'Fundamental'
    return tipo
  }

  if (!autenticado) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-sm mt-2 font-light">Painel Admin</p>
        </div>
        <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-6">
          {erro && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">{erro}</p>}
          <form onSubmit={autenticar} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Chave de acesso</label>
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                required
                placeholder="••••••••••••"
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Código de autenticação</label>
              <input
                type="text"
                value={totp}
                onChange={e => setTotp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="000000"
                maxLength={6}
                className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-3 border border-white/10 focus:border-orange-500 focus:outline-none font-light tracking-widest text-center text-lg"
              />
              <p className="text-slate-600 text-xs mt-1 text-center">Código do Google Authenticator</p>
            </div>
            <button
              type="submit"
              disabled={carregando}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
            >
              {carregando ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] p-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-orange-400">MAT<span className="text-white">-IA</span></h1>
            <p className="text-slate-400 text-sm font-light">Painel Admin</p>
          </div>
          <button
            onClick={async () => {
              try {
                await fetch(`${API}/auth/admin/logout`, {
                  method: 'POST',
                  headers: adminHeaders()
                })
              } catch (e) {
                console.error('Erro ao fazer logout admin', e)
              }
              setAutenticado(false)
              setSessionToken('')
            }}
            className="text-slate-500 hover:text-white text-sm transition-colors"
          >
            Sair
          </button>
        </div>

        {/* Abas */}
        <div className="flex gap-1 mb-6 bg-[#1e2d3d] border border-white/5 rounded-xl p-1">
          <button
            onClick={() => setAbaAtiva('solicitacoes')}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${abaAtiva === 'solicitacoes' ? 'bg-orange-500 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Solicitações
          </button>
          <button
            onClick={() => { setAbaAtiva('consumo'); if (!consumo) buscarConsumo() }}
            className={`flex-1 py-2 text-sm rounded-lg transition-colors ${abaAtiva === 'consumo' ? 'bg-orange-500 text-white font-medium' : 'text-slate-400 hover:text-white'}`}
          >
            Consumo IA
          </button>
        </div>

        {abaAtiva === 'solicitacoes' && (
          <div className="space-y-6">
            {pendentes.length > 0 && (
              <div>
                <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                  Pendentes
                  <span className="bg-yellow-500/10 text-yellow-400 text-xs px-2 py-0.5 rounded-full border border-yellow-500/20">{pendentes.length}</span>
                </h3>
                <div className="space-y-3">
                  {pendentes.map(s => (
                    <div key={s.id} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <p className="text-white font-medium">{s.nome}</p>
                          <p className="text-slate-400 text-sm font-light">{s.email}</p>
                          <p className="text-slate-500 text-xs font-light mt-1">{s.instituicao} · {tipoLabel(s.tipo_instituicao)}</p>
                        </div>
                        <p className="text-slate-600 text-xs flex-shrink-0">{new Date(s.criado_em).toLocaleDateString('pt-BR')}</p>
                      </div>
                      {s.mensagem && (
                        <p className="text-slate-400 text-sm font-light italic bg-white/5 rounded-xl px-4 py-3 mb-3">"{s.mensagem}"</p>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => rejeitar(s.id)}
                          disabled={processando === s.id}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm transition-colors disabled:opacity-50"
                        >
                          Rejeitar
                        </button>
                        <button
                          onClick={() => aprovar(s.id)}
                          disabled={processando === s.id}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {processando === s.id ? 'Processando...' : 'Aprovar e enviar credenciais'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {processadas.length > 0 && (
              <div>
                <h3 className="text-slate-400 font-medium mb-3 text-sm uppercase tracking-wider">Processadas</h3>
                <div className="space-y-2">
                  {processadas.map(s => (
                    <div key={s.id} className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4 flex items-center justify-between opacity-60">
                      <div>
                        <p className="text-slate-300 text-sm font-medium">{s.nome}</p>
                        <p className="text-slate-500 text-xs font-light">{s.email} · {s.instituicao}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.status === 'aprovado' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {s.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {solicitacoes.length === 0 && (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <p className="text-white font-medium mb-1">Nenhuma solicitação ainda</p>
              </div>
            )}

            {logs.length > 0 && (
              <div className="mt-8">
                <h3 className="text-slate-400 font-medium mb-3 text-sm uppercase tracking-wider">Log de auditoria</h3>
                <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
                  {logs.map(log => (
                    <div key={log.id} className="px-4 py-3 border-b border-white/5 last:border-0 flex items-center gap-4">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${log.sucesso ? 'bg-green-400' : 'bg-red-400'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-300 text-xs font-light">{log.acao} — {log.detalhes}</p>
                        <p className="text-slate-600 text-xs">IP: {log.ip}</p>
                      </div>
                      <p className="text-slate-600 text-xs flex-shrink-0">{new Date(log.criado_em).toLocaleString('pt-BR')}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {abaAtiva === 'consumo' && (
          <div className="space-y-6">
            {carregandoConsumo ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : consumo ? (
              <>
                {/* Filtros */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Mês</label>
                    <input
                      type="month"
                      value={filtroMes}
                      onChange={e => setFiltroMes(e.target.value)}
                      className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-2.5 border border-white/10 focus:border-orange-500 focus:outline-none font-light text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs uppercase tracking-wider text-slate-400 mb-2">Professor</label>
                    <select
                      value={filtroProfessor}
                      onChange={e => setFiltroProfessor(e.target.value)}
                      className="w-full bg-[#0f172a] text-white rounded-xl px-4 py-2.5 border border-white/10 focus:border-orange-500 focus:outline-none font-light text-sm"
                    >
                      <option value="">Todos</option>
                      {consumo?.porProfessor?.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={buscarConsumo}
                      className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      Filtrar
                    </button>
                  </div>
                </div>

                {/* Cards gerais */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Total de correções</p>
                    <p className="text-white text-2xl font-semibold">{consumo.geral?.total_chamadas || 0}</p>
                  </div>
                  <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Custo total estimado</p>
                    <p className="text-white text-2xl font-semibold">
                      ${parseFloat(consumo.geral?.custo_total || 0).toFixed(4)}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">
                      ≈ R$ {(parseFloat(consumo.geral?.custo_total || 0) * 5.5).toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Tokens entrada</p>
                    <p className="text-white text-xl font-semibold">{parseInt(consumo.geral?.total_tokens_input || 0).toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-4">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Tokens saída</p>
                    <p className="text-white text-xl font-semibold">{parseInt(consumo.geral?.total_tokens_output || 0).toLocaleString('pt-BR')}</p>
                  </div>
                </div>

                {consumo.porProfessor?.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-3">Por professor</h3>
                    <div className="space-y-3">
                      {consumo.porProfessor.map(p => {
                        const detalhes = (consumo.porProfessorTipo || []).filter(d => d.professor_id === p.id)
                        const tipoNome = (tipo) => ({
                          correcao_atividade: 'Correção de Atividade',
                          revisao_resolucao: 'Revisão de Resolução',
                          analise_turma: 'Análise de Turma',
                          analise_aluno: 'Análise Individual'
                        }[tipo] || tipo)

                        return (
                          <div key={p.id} className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                              <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-orange-400 text-xs font-medium">{p.nome?.charAt(0)}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-medium">{p.nome}</p>
                                <p className="text-slate-500 text-xs font-light">{p.email}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-orange-400 text-sm font-semibold">${parseFloat(p.custo_total || 0).toFixed(4)}</p>
                                <p className="text-slate-500 text-xs">total do período</p>
                              </div>
                            </div>
                            {detalhes.map((d, i) => (
                              <div key={d.tipo} className={`px-4 py-2.5 flex items-center justify-between ${i < detalhes.length - 1 ? 'border-b border-white/5' : ''} bg-black/10`}>
                                <div className="flex items-center gap-2">
                                  <div className="w-1 h-4 bg-orange-500/30 rounded-full" />
                                  <div>
                                    <p className="text-slate-300 text-xs font-light">{tipoNome(d.tipo)}</p>
                                    <p className="text-slate-600 text-xs">{d.total_chamadas} chamada{d.total_chamadas !== '1' ? 's' : ''} · {parseInt(d.tokens_total).toLocaleString('pt-BR')} tokens</p>
                                  </div>
                                </div>
                                <p className="text-slate-400 text-xs font-medium">${parseFloat(d.custo_total || 0).toFixed(4)}</p>
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Evolução mensal */}
                {consumo.mensal?.length > 0 && (
                  <div>
                    <h3 className="text-white font-medium mb-3">Evolução mensal</h3>
                    <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl overflow-hidden">
                      {consumo.mensal.map((m, i) => (
                        <div key={m.mes} className={`px-4 py-3 flex items-center justify-between ${i < consumo.mensal.length - 1 ? 'border-b border-white/5' : ''}`}>
                          <p className="text-slate-300 text-sm font-light">{m.mes}</p>
                          <div className="text-right">
                            <p className="text-white text-sm font-medium">${parseFloat(m.custo_total || 0).toFixed(4)}</p>
                            <p className="text-slate-500 text-xs">{m.total_chamadas} chamadas</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {consumo.porProfessor?.length === 0 && (
                  <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-white font-medium mb-1">Nenhum uso registrado ainda</p>
                    <p className="text-slate-400 text-sm font-light">Os dados aparecerão conforme professores usarem as atividades</p>
                  </div>
                )}

                <button
                  onClick={async () => {
                    try {
                      const params = new URLSearchParams()
                      params.append('mes', filtroMes)
                      if (filtroProfessor) params.append('professor_id', filtroProfessor)
                      const mes = filtroMes
                      const res = await fetch(`${API}/auth/admin/uso-ia/export?${params}`, {
                        headers: adminHeaders()
                      })
                      if (!res.ok) { console.error('Erro ao exportar'); return }
                      const blob = await res.blob()
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `mat-ia-uso-ia-${mes}.csv`
                      a.click()
                      URL.revokeObjectURL(url)
                    } catch (e) {
                      console.error('Erro ao exportar CSV', e)
                    }
                  }}
                  className="w-full py-2.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 rounded-xl text-sm transition-colors"
                >
                  Exportar CSV — {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                </button>
                <button
                  onClick={buscarConsumo}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-sm transition-colors"
                >
                  Atualizar dados
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPainel
