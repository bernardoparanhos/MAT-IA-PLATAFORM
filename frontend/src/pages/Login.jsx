 import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ─── FAQ PANEL ────────────────────────────────────────────────────────────────
const faqs = [
  {
    pergunta: 'Como faço login?',
    resposta: 'Selecione seu perfil — Aluno ou Professor. Alunos entram com RA + Senha. Professores entram com SIAPE + Senha. Se for seu primeiro acesso, crie uma conta primeiro.',
  },
  {
    pergunta: 'Como me cadastro?',
    resposta: 'Clique em "Cadastre-se" na tela de login. Escolha seu perfil, preencha seus dados institucionais e selecione sua turma (alunos) ou informe seu SIAPE (professores).',
  },
  {
    pergunta: 'O que é RA / SIAPE?',
    resposta: 'RA (Registro Acadêmico) é o número de matrícula do aluno na UTFPR. Digite com a letra "a" minúscula na frente, sem zeros — ex: a0000000. Você encontra no Moodle ou comprovante de matrícula. SIAPE é o número funcional do professor servidor federal.',
  },
  {
    pergunta: 'Como entro em uma turma?',
    resposta: 'No cadastro do aluno, selecione sua turma no campo "Turma". As turmas disponíveis são criadas pelo professor. Caso sua turma não apareça, entre em contato com seu professor.',
  },
  {
    pergunta: 'Dicas rápidas',
    resposta: '• Use sempre seu email institucional (@alunos.utfpr.edu.br ou @utfpr.edu.br)\n• A senha precisa ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número\n• Se esqueceu a senha, use a opção "Esqueci minha senha" na tela de login',
  },
]

function FAQPanel({ aberto, onFechar }) {
  const [abertaIdx, setAbertaIdx] = useState(null)

  return (
    <>
      {/* Overlay */}
      {aberto && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onFechar}
        />
      )}

      {/* Painel */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#1e2d3d] border-l border-white/10 z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${aberto ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ fontFamily: 'Outfit, sans-serif' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-orange-400">
                <path d="M12 17V16.9929M12 14.8571C12 11.6429 15 12.3571 15 9.85714C15 8.27919 13.6568 7 12 7C10.6567 7 9.51961 7.84083 9.13733 9"/>
              </svg>
            </div>
            <div>
              <p className="text-white text-sm font-medium">Ajuda</p>
              <p className="text-slate-500 text-xs font-light">Acesso à sua conta</p>
            </div>
          </div>
          <button onClick={onFechar} className="text-slate-400 hover:text-white transition-colors p-1">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
              <path d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Perguntas */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden">
              <button
                onClick={() => setAbertaIdx(abertaIdx === idx ? null : idx)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-3">
                <span className="text-slate-200 text-sm font-light">{faq.pergunta}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                  className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${abertaIdx === idx ? 'rotate-180' : ''}`}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {abertaIdx === idx && (
                <div className="px-4 pb-4 border-t border-white/5 pt-3">
                  <p className="text-slate-400 text-xs font-light leading-relaxed whitespace-pre-line">
                    {faq.resposta}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-slate-600 text-xs font-light text-center">
            UTFPR Campus Medianeira — MAT-IA 2026
          </p>
        </div>
      </div>
    </>
  )
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function Login() {
  const { login } = useAuth()
  const [perfil, setPerfil] = useState('')
  const [form, setForm] = useState({ ra: '', siape: '', senha: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [faqAberto, setFaqAberto] = useState(false)

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
        ? { ra: form.ra, senha: form.senha }
        : { siape: form.siape, senha: form.senha }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setErro(data.errors?.[0]?.msg || data.message || 'Erro ao fazer login.')
        return
      }

      login(data.token, data.usuario)

    } catch {
      setErro('Erro de conexão. Verifique se o servidor está rodando.')
    } finally {
      setCarregando(false)
    }
  }

  const inputClass = "w-full bg-white/5 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-400 placeholder-slate-500 border border-white/10 transition-all"
  const labelClass = "text-slate-400 text-xs uppercase tracking-wider mb-1.5 block font-light"

  if (!perfil) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4" style={{fontFamily:'Outfit, sans-serif'}}>
        <FAQPanel aberto={faqAberto} onFechar={() => setFaqAberto(false)} />

        {/* Botão FAQ fixo */}
        <button
          onClick={() => setFaqAberto(true)}
          className="fixed bottom-6 right-6 z-30 w-11 h-11 bg-[#1e2d3d] border border-white/10 hover:border-orange-500/40 rounded-full flex items-center justify-center text-slate-400 hover:text-orange-400 transition-all shadow-lg">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M12 17V16.9929M12 14.8571C12 11.6429 15 12.3571 15 9.85714C15 8.27919 13.6568 7 12 7C10.6567 7 9.51961 7.84083 9.13733 9"/>
          </svg>
        </button>

        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-5xl font-bold text-orange-400 tracking-tight">
              MAT<span className="text-white">-IA</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-light">
              Suporte Inteligente ao Aprendizado de Matemática
            </p>
          </div>

          <div className="bg-[#1e2d3d] rounded-2xl p-8 border border-white/5 shadow-2xl">
            <h2 className="text-white text-xl font-semibold mb-1">Entrar na plataforma</h2>
            <p className="text-slate-400 text-sm mb-8 font-light">Selecione seu perfil para continuar</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPerfil('aluno')}
                className="bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-white rounded-xl p-6 text-center transition-all group"
              >
                <div className="flex justify-center mb-4">
                  <svg viewBox="0 0 32 32" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                    <line style={{fill:'none',stroke:'#ffffff',strokeWidth:2,strokeMiterlimit:10}} x1="3" y1="13" x2="3" y2="24"/>
                    <circle cx="3" cy="24" r="2" style={{fill:'#ffffff'}}/>
                    <polygon style={{fill:'none',stroke:'#ffffff',strokeWidth:2,strokeMiterlimit:10}} points="16,8.833 3.5,13 16,17.167 28.5,13"/>
                    <path style={{fill:'none',stroke:'#ffffff',strokeWidth:2,strokeMiterlimit:10}} d="M7,14.451V20c0,1.657,4.029,3,9,3s9-1.343,9-3v-5.549"/>
                  </svg>
                </div>
                <div className="font-medium text-white">Aluno</div>
                <div className="text-xs text-slate-400 group-hover:text-orange-200 mt-1 font-light transition-colors">
                  RA + Senha
                </div>
              </button>

              <button
                onClick={() => setPerfil('professor')}
                className="bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/40 text-white rounded-xl p-6 text-center transition-all group"
              >
                <div className="flex justify-center mb-4">
                  <svg viewBox="0 0 494.004 494.004" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
                    <path style={{fill:'#ffffff'}} d="M291.266,85.984c23.74,0,42.984-19.252,42.984-42.992C334.25,19.243,315.006,0,291.266,0c-23.738,0-43,19.243-43,42.992C248.266,66.732,267.527,85.984,291.266,85.984z"/>
                    <path style={{fill:'#ffffff'}} d="M335.481,93.288h-23.516l-20.707,33.887l-20.621-33.887h-24.48c0,0-56.627-0.741-60.728,48.108l0.002,0.008v6.382l-22.121-15.117l-2.584-1.8c-4.726-3.668-8.234-5.134-12.886-5.34L104.377,11.422l-7.459,2.842l42.811,112.395c-2.222,0.878-4.29,2.162-6.082,3.971c-7.442,7.391-7.27,19.545,0.259,27.073c0.034,0.035,12.283,8.33,12.283,8.33l17.107,11.431l32.526,21.664c2.18,1.345,5.353,2.204,8.418,2.205l0.003,0.01c10.319,0,18.744-8.45,18.744-18.804c0-0.061,0-0.129,0-0.164v-33.284h12.249l-0.035,80.107h112.618l-0.035-79.618h11.75v101.272h0.018c-0.018,0.285-0.018,0.621-0.018,0.836c0,10.449,8.39,18.839,18.761,18.839c10.354,0,18.778-8.425,18.778-18.839c0-0.215-0.035-0.551-0.035-0.836h0.035V141.379C397.089,141.379,399.362,94.468,335.481,93.288z"/>
                    <path style={{fill:'#ffffff'}} d="M234.932,242.514l-0.086,226.215c0,13.921,11.335,25.257,25.254,25.257c13.868,0,25.083-11.164,25.29-24.963l0.188-0.189V262.723h11.336v205.904c0,13.988,11.389,25.377,25.396,25.377c13.953,0,25.358-11.389,25.358-25.377L347.564,242.6L234.932,242.514z"/>
                    <rect x="280.387" y="232.298" style={{fill:'#ffffff'}} width="21.742" height="7.555"/>
                  </svg>
                </div>
                <div className="font-medium text-white">Professor</div>
                <div className="text-xs text-slate-400 group-hover:text-orange-200 mt-1 font-light transition-colors">
                  SIAPE + Senha
                </div>
              </button>
            </div>

            <p className="text-slate-400 text-sm text-center mt-8 font-light">
              Não tem conta?{' '}
              <Link to="/cadastro" className="text-orange-400 hover:text-orange-300 transition-colors">
                Cadastre-se
              </Link>
            </p>
          </div>

          <p className="text-slate-600 text-xs text-center mt-6 font-light">
            UTFPR Campus Medianeira — 2026
          </p>
          <p className="text-slate-600 text-xs text-center mt-2 font-light">
            <Link to="/termos" className="hover:text-slate-400 transition-colors">Termos de Serviço</Link>
            {' · '}
            <Link to="/privacidade" className="hover:text-slate-400 transition-colors">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4" style={{fontFamily:'Outfit, sans-serif'}}>
      <FAQPanel aberto={faqAberto} onFechar={() => setFaqAberto(false)} />

      {/* Botão FAQ fixo */}
      <button
        onClick={() => setFaqAberto(true)}
        className="fixed bottom-6 right-6 z-30 w-11 h-11 bg-[#1e2d3d] border border-white/10 hover:border-orange-500/40 rounded-full flex items-center justify-center text-slate-400 hover:text-orange-400 transition-all shadow-lg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
          <path d="M12 17V16.9929M12 14.8571C12 11.6429 15 12.3571 15 9.85714C15 8.27919 13.6568 7 12 7C10.6567 7 9.51961 7.84083 9.13733 9"/>
        </svg>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-orange-400 tracking-tight">
            MAT<span className="text-white">-IA</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-light">
            {perfil === 'aluno' ? 'Acesso do Aluno' : 'Acesso do Professor'}
          </p>
        </div>

        <div className="bg-[#1e2d3d] rounded-2xl p-8 border border-white/5 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => { setPerfil(''); setErro('') }}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                <path d="M19 12H5m7-7l-7 7 7 7"/>
              </svg>
            </button>
            <h2 className="text-white text-xl font-semibold">
              {perfil === 'aluno' ? 'Aluno' : 'Professor'}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {perfil === 'aluno' ? (
              <>
                <div>
                  <label className={labelClass}>RA</label>
                  <input type="text" name="ra" value={form.ra} onChange={handleChange}
                    placeholder="ex: a000000" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Senha</label>
                  <input type="password" name="senha" value={form.senha} onChange={handleChange}
                    placeholder="••••••••" required className={inputClass} />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className={labelClass}>SIAPE</label>
                  <input type="text" name="siape" value={form.siape} onChange={handleChange}
                    placeholder="Seu número SIAPE" required className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Senha</label>
                  <input type="password" name="senha" value={form.senha} onChange={handleChange}
                    placeholder="••••••••" required className={inputClass} />
                </div>
              </>
            )}

            {erro && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 font-light">{erro}</p>
            )}

            <button type="submit" disabled={carregando}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium rounded-xl py-3 text-sm transition-colors mt-2">
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>

            <div className="text-center mt-1">
              <Link to="/esqueci-senha"
                className="text-slate-500 hover:text-slate-300 text-xs transition-colors font-light">
                Esqueci minha senha
              </Link>
            </div>
          </form>

          <p className="text-slate-400 text-sm text-center mt-6 font-light">
            Não tem conta?{' '}
            <Link to="/cadastro" className="text-orange-400 hover:text-orange-300 transition-colors">
              Cadastre-se
            </Link>
          </p>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6 font-light">
          UTFPR Campus Medianeira — 2026
        </p>
        <p className="text-slate-600 text-xs text-center mt-2 font-light">
          <Link to="/termos" className="hover:text-slate-400 transition-colors">Termos de Serviço</Link>
          {' · '}
          <Link to="/privacidade" className="hover:text-slate-400 transition-colors">Política de Privacidade</Link>
        </p>
      </div>
    </div>
  )
}

export default Login