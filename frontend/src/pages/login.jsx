import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const [perfil, setPerfil] = useState('')
  const [form, setForm] = useState({ ra: '', codigoTurma: '', siape: '', senha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    try {
      const url = perfil === 'aluno'
        ? `${import.meta.env.VITE_API_URL}/auth/login/aluno`
        : `${import.meta.env.VITE_API_URL}/auth/login/professor`

      const body = perfil === 'aluno'
        ? { ra: form.ra, codigoTurma: form.codigoTurma }
        : { siape: form.siape, senha: form.senha }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.errors && data.errors.length > 0) {
          setErro(data.errors[0].msg)
        } else {
          setErro(data.message || 'Erro ao fazer login.')
        }
        return
      }

      login(data.token, data.usuario)

    } catch {
      setErro('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setCarregando(false)
    }
  }

  // ─── Etapa 1: escolha de perfil ───────────────────────────────────────────
  if (!perfil) {
    return (
      <div className="min-h-screen bg-blue-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-orange-400 mb-2">
              MAT<span className="text-white">-IA</span>
            </h1>
            <p className="text-blue-200 text-sm">
              Suporte Inteligente ao Aprendizado de Matemática
            </p>
          </div>

          <div className="bg-blue-900 rounded-2xl p-8 shadow-xl border border-blue-800">
            <h2 className="text-white text-xl font-semibold mb-2">Entrar na plataforma</h2>
            <p className="text-blue-300 text-sm mb-6">Selecione seu perfil para continuar</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPerfil('aluno')}
                className="bg-blue-800 hover:bg-orange-500 text-white rounded-xl p-6 text-center transition-colors group"
              >
                <div className="flex justify-center mb-3">
  <svg viewBox="0 0 512 512" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
    <circle style={{fill:'#88C5CC'}} cx="256" cy="256" r="256"/>
    <path style={{fill:'#80B9BF'}} d="M456,225.936c0-0.644-2.54-1.788-4.884-2.252L268.388,200.16c-6.724-1.312-17.812-1.452-24.536-0.14l-182.94,23.184C58.62,223.656,56,224.228,56,224.956v2.048V228v1.056v0.992v1.136v0.576v0.344v1.132v0.296v0.272v1.476v0.296V236l104.38,257.468C189.928,505.384,222.184,512,256,512c114.376,0,211.2-75.02,244.036-178.524L456,225.936z"/>
    <path style={{fill:'#2D424D'}} d="M128,220v112l0,0c4.388,24,60.34,43.6,128,43.6S378.996,356,383.384,332H384V220H128z"/>
    <path style={{fill:'#253740'}} d="M372,220v112l0,0c-4.252,24-57.428,42.116-122.228,43.256c2.064,0.032,4.14,0.2,6.228,0.2c67.66,0,123.608-19.456,128-43.456l0,0V220H372z"/>
    <path style={{fill:'#1E2C33'}} d="M448,224v5.036L267.676,206.12c-6.724-1.308-16.464-1.308-23.184,0L68,228.42V228H56v3.184v0.576v1.772c0,0.772,2.364,1.556,4.432,2.26l149.352,44.876c6.484,2.224,17.316,2.7,23.968,1.068l217.452-47.008c2.276-0.564,4.792-1.212,4.792-1.88v-1.088v-0.696V228L448,224z"/>
    <path style={{fill:'#2D424D'}} d="M456,224.832c0-0.644-2.54-1.24-4.884-1.696l-182.728-23.252c-6.724-1.312-17.812-1.312-24.536,0l-182.94,23.252C58.62,223.584,56,224.228,56,224.952V228c0,0.772,2.364,0.856,4.432,1.564l149.352,44.876c6.484,2.224,17.316,2.704,23.968,1.072c0,0,222.244-46.84,222.244-47.504L456,224.832L456,224.832z"/>
    <path style={{fill:'#FFD464'}} d="M314,381.252c-3.436,0-6-2.784-6-6.228V264.272l-70.012-23.492c-3.264-1.088-4.792-4.616-3.704-7.884s4.744-5.036,7.996-3.936l74.104,24.916c2.548,0.852,7.616,3.44,7.616,6.12v116C324,379.436,317.436,381.252,314,381.252z"/>
    <path style={{fill:'#E16B5A'}} d="M332,388c0,0,0-10.756,0-12.976c0-8.6-7.4-15.58-16-15.58s-16,6.976-16,15.58c0,2.22,0,12.976,0,12.976H332z"/>
    <rect x="300" y="388" style={{fill:'#FFD464'}} width="32" height="36"/>
    <rect x="304" y="388" style={{fill:'#FFE399'}} width="4" height="36"/>
    <rect x="312" y="388" style={{fill:'#FFE399'}} width="4" height="36"/>
    <rect x="320" y="388" style={{fill:'#FFE399'}} width="4" height="36"/>
  </svg>
</div>
                <div className="font-semibold">Aluno</div>
                <div className="text-xs text-blue-300 group-hover:text-white mt-1">
                  RA + Código da Turma
                </div>
              </button>

              <button
                onClick={() => setPerfil('professor')}
                className="bg-blue-800 hover:bg-orange-500 text-white rounded-xl p-6 text-center transition-colors group"
              >
                <div className="flex justify-center mb-3">
  <svg viewBox="0 0 473.931 473.931" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
    <circle style={{fill:'#357180'}} cx="236.966" cy="236.966" r="236.966"/>
    <path style={{fill:'#AAAAAA'}} d="M119.871,161.824c8.142-22.11,35.487-22.69,35.487-22.69c-13.957-12.221-29.672-11.057-29.672-11.057c14.544-25.601,36.074-14.544,36.074-14.544c-0.576-5.238-17.452-25.605-17.452-25.605c16.875-0.58,33.163,16.875,33.163,16.875c-0.584-8.73,6.402-23.857,6.402-23.857c19.783,4.075,40.145,22.11,40.145,22.11l4.655-16.875l10.795,12.505l8.411-10.178c-1.171,5.822,3.656,20.913,3.656,20.913c12.389-33.201,58.02-26.731,58.02-26.731c-11.057,6.402-8.15,16.875-8.15,16.875c23.277-10.473,44.22,6.982,44.22,6.982c-19.783,0.58-26.185,8.146-26.185,8.146c37.825-1.164,43.644,24.437,43.644,24.437c-19.783-2.907-22.114,9.309-22.114,9.309c27.349,8.146,19.206,37.238,19.206,37.238c-7.562-11.637-20.954-10.477-20.954-10.477c12.221,19.203,1.171,29.092,1.171,29.092c-2.907-13.964-26.323-16.366-26.323-16.366c7.416,8.071,0.722,30.914,0.722,30.914c-4.078-6.402-16.875-12.221-16.875-12.221l-65.166,1.654v0.09c-0.153-0.03-0.292-0.052-0.445-0.079l-3.046,0.079l0.045-0.606c-49.47-8.415-61.724,9.912-61.724,9.912c-6.395-25.021,1.171-30.836,1.171-30.836c-19.783,1.167-36.658,18.035-36.658,18.035c2.324-19.199,9.309-40.145,9.309-40.145C134.999,160.667,119.871,161.824,119.871,161.824z"/>
    <path style={{fill:'#8E6E52'}} d="M322.641,385.689c0,20.516-15.15,37.156-33.829,37.156h-92.309c-18.679,0-33.829-16.636-33.829-37.156c0,0,7.745-80.489,14.099-100.623c6.335-20.112,15.143-37.148,33.829-37.148h11.424h19.921h23.438h12.161c18.679,0,28.89,12.381,33.822,37.148C316.298,309.844,322.641,385.689,322.641,385.689z"/>
    <path style={{fill:'#E9C29C'}} d="M309.997,170.77c0,37.665-30.518,68.182-68.171,68.182c-37.657,0-68.171-30.514-68.171-68.182c0-37.646,30.51-68.167,68.171-68.167C279.48,102.603,309.997,133.124,309.997,170.77z"/>
    <ellipse style={{fill:'#343433'}} cx="221.4" cy="165.461" rx="9.339" ry="9.863"/>
    <ellipse style={{fill:'#343433'}} cx="261.886" cy="165.461" rx="9.339" ry="9.863"/>
    <ellipse style={{fill:'#FFFFFF'}} cx="264.786" cy="161.719" rx="3.731" ry="3.948"/>
    <ellipse style={{fill:'#FFFFFF'}} cx="224.206" cy="161.719" rx="3.734" ry="3.948"/>
  </svg>
</div>
                <div className="font-semibold">Professor</div>
                <div className="text-xs text-blue-300 group-hover:text-white mt-1">
                  SIAPE + Senha
                </div>
              </button>
            </div>

            <p className="text-blue-300 text-sm text-center mt-6">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-orange-400 hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>

          <p className="text-blue-400 text-xs text-center mt-6">
            UTFPR Campus Medianeira — 2026
          </p>
        </div>
      </div>
    )
  }

  // ─── Etapa 2: formulário por perfil ──────────────────────────────────────
  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-orange-400 mb-2">
            MAT<span className="text-white">-IA</span>
          </h1>
          <p className="text-blue-200 text-sm">
            {perfil === 'aluno' ? 'Acesso do Aluno' : 'Acesso do Professor'}
          </p>
        </div>

        <div className="bg-blue-900 rounded-2xl p-8 shadow-xl border border-blue-800">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => { setPerfil(''); setErro('') }}
              className="text-blue-300 hover:text-white text-sm transition-colors"
            >
              ←
            </button>
            <h2 className="text-white text-xl font-semibold flex items-center gap-2">
  {perfil === 'aluno' ? (
    <svg viewBox="0 0 512 512" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
      <circle style={{fill:'#88C5CC'}} cx="256" cy="256" r="256"/>
      <path style={{fill:'#2D424D'}} d="M128,220v112l0,0c4.388,24,60.34,43.6,128,43.6S378.996,356,383.384,332H384V220H128z"/>
      <path style={{fill:'#2D424D'}} d="M456,224.832c0-0.644-2.54-1.24-4.884-1.696l-182.728-23.252c-6.724-1.312-17.812-1.312-24.536,0l-182.94,23.252C58.62,223.584,56,224.228,56,224.952V228c0,0.772,2.364,0.856,4.432,1.564l149.352,44.876c6.484,2.224,17.316,2.704,23.968,1.072c0,0,222.244-46.84,222.244-47.504L456,224.832z"/>
      <path style={{fill:'#FFD464'}} d="M314,381.252c-3.436,0-6-2.784-6-6.228V264.272l-70.012-23.492c-3.264-1.088-4.792-4.616-3.704-7.884s4.744-5.036,7.996-3.936l74.104,24.916c2.548,0.852,7.616,3.44,7.616,6.12v116C324,379.436,317.436,381.252,314,381.252z"/>
      <path style={{fill:'#E16B5A'}} d="M332,388c0,0,0-10.756,0-12.976c0-8.6-7.4-15.58-16-15.58s-16,6.976-16,15.58c0,2.22,0,12.976,0,12.976H332z"/>
      <rect x="300" y="388" style={{fill:'#FFD464'}} width="32" height="36"/>
    </svg>
  ) : (
    <svg viewBox="0 0 473.931 473.931" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
  <circle style={{fill:'#357180'}} cx="236.966" cy="236.966" r="236.966"/>
  <path style={{fill:'#AAAAAA'}} d="M119.871,161.824c8.142-22.11,35.487-22.69,35.487-22.69c-13.957-12.221-29.672-11.057-29.672-11.057c14.544-25.601,36.074-14.544,36.074-14.544c-0.576-5.238-17.452-25.605-17.452-25.605c16.875-0.58,33.163,16.875,33.163,16.875c-0.584-8.73,6.402-23.857,6.402-23.857c19.783,4.075,40.145,22.11,40.145,22.11l4.655-16.875l10.795,12.505l8.411-10.178c-1.171,5.822,3.656,20.913,3.656,20.913c12.389-33.201,58.02-26.731,58.02-26.731c-11.057,6.402-8.15,16.875-8.15,16.875c23.277-10.473,44.22,6.982,44.22,6.982c-19.783,0.58-26.185,8.146-26.185,8.146c37.825-1.164,43.644,24.437,43.644,24.437c-19.783-2.907-22.114,9.309-22.114,9.309c27.349,8.146,19.206,37.238,19.206,37.238c-7.562-11.637-20.954-10.477-20.954-10.477c12.221,19.203,1.171,29.092,1.171,29.092c-2.907-13.964-26.323-16.366-26.323-16.366c7.416,8.071,0.722,30.914,0.722,30.914c-4.078-6.402-16.875-12.221-16.875-12.221l-65.166,1.654v0.09c-0.153-0.03-0.292-0.052-0.445-0.079l-3.046,0.079l0.045-0.606c-49.47-8.415-61.724,9.912-61.724,9.912c-6.395-25.021,1.171-30.836,1.171-30.836c-19.783,1.167-36.658,18.035-36.658,18.035c2.324-19.199,9.309-40.145,9.309-40.145C134.999,160.667,119.871,161.824,119.871,161.824z"/>
  <path style={{fill:'#8E6E52'}} d="M322.641,385.689c0,20.516-15.15,37.156-33.829,37.156h-92.309c-18.679,0-33.829-16.636-33.829-37.156c0,0,7.745-80.489,14.099-100.623c6.335-20.112,15.143-37.148,33.829-37.148h11.424h19.921h23.438h12.161c18.679,0,28.89,12.381,33.822,37.148C316.298,309.844,322.641,385.689,322.641,385.689z"/>
  <path style={{fill:'#E9C29C'}} d="M309.997,170.77c0,37.665-30.518,68.182-68.171,68.182c-37.657,0-68.171-30.514-68.171-68.182c0-37.646,30.51-68.167,68.171-68.167C279.48,102.603,309.997,133.124,309.997,170.77z"/>
  <ellipse style={{fill:'#343433'}} cx="221.4" cy="165.461" rx="9.339" ry="9.863"/>
  <ellipse style={{fill:'#343433'}} cx="261.886" cy="165.461" rx="9.339" ry="9.863"/>
  <ellipse style={{fill:'#FFFFFF'}} cx="264.786" cy="161.719" rx="3.731" ry="3.948"/>
  <ellipse style={{fill:'#FFFFFF'}} cx="224.206" cy="161.719" rx="3.734" ry="3.948"/>
</svg>
  )}
  {perfil === 'aluno' ? 'Aluno' : 'Professor'}
</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {perfil === 'aluno' ? (
              <>
                <div>
                  <label className="text-blue-200 text-sm mb-1 block">RA</label>
                  <input
                    type="text"
                    name="ra"
                    value={form.ra}
                    onChange={handleChange}
                    placeholder="Seu RA"
                    required
                    className="w-full bg-blue-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder-blue-400 border border-blue-700"
                  />
                </div>
                <div>
                  <label className="text-blue-200 text-sm mb-1 block">Código da Turma</label>
                  <input
                    type="text"
                    name="codigoTurma"
                    value={form.codigoTurma}
                    onChange={handleChange}
                    placeholder="Ex: 20261BQ1"
                    required
                    className="w-full bg-blue-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder-blue-400 border border-blue-700"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-blue-200 text-sm mb-1 block">SIAPE</label>
                  <input
                    type="text"
                    name="siape"
                    value={form.siape}
                    onChange={handleChange}
                    placeholder="Seu número SIAPE"
                    required
                    className="w-full bg-blue-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder-blue-400 border border-blue-700"
                  />
                </div>
                <div>
                  <label className="text-blue-200 text-sm mb-1 block">Senha</label>
                  <input
                    type="password"
                    name="senha"
                    value={form.senha}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    className="w-full bg-blue-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder-blue-400 border border-blue-700"
                  />
                </div>
              </>
            )}

            {erro && (
              <p className="text-red-300 text-sm bg-red-500/20 rounded-lg px-4 py-2">{erro}</p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg py-3 text-sm transition-colors"
            >
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-blue-300 text-sm text-center mt-6">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-orange-400 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>

        <p className="text-blue-400 text-xs text-center mt-6">
          UTFPR Campus Medianeira — 2026
        </p>
      </div>
    </div>
  )
}

export default Login