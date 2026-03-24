import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ResultadoNivelamento() {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="w-full max-w-md text-center">

        <h1 className="text-2xl font-bold text-orange-400 mb-8">MAT<span className="text-white">-IA</span></h1>

        <div className="bg-[#1e2d3d] border border-white/5 rounded-2xl p-10">
          <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-orange-400">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>

          <h2 className="text-xl font-semibold text-white mb-3">
            Diagnóstico concluído, {usuario?.nome?.split(' ')[0]}!
          </h2>
          <p className="text-slate-400 text-sm font-light leading-relaxed mb-8">
            Suas respostas foram registradas com sucesso. Em breve sua trilha de estudos personalizada estará disponível aqui.
          </p>

          <button
    onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); navigate('/login') }}
    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors">
    Concluir e sair
  </button>
        </div>

        <p className="text-slate-600 text-xs mt-6 font-light">UTFPR Campus Medianeira — 2026</p>
      </div>
    </div>
  )
}

export default ResultadoNivelamento