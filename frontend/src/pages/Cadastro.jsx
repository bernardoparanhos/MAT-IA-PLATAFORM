import { Link } from 'react-router-dom'

function Cadastro() {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            MAT<span className="text-blue-400">-IA</span>
          </h1>
        </div>
        <div className="bg-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-white text-xl font-semibold mb-6">Criar conta</h2>
          <p className="text-slate-400 text-sm mb-6">Em construção...</p>
          <Link to="/login" className="text-blue-400 hover:underline text-sm">
            ← Voltar ao login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Cadastro