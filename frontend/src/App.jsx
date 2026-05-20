import { Routes, Route, Navigate } from 'react-router-dom'

function Manutencao() {
  return (
      <div style={{ fontFamily: 'Outfit, sans-serif' }} className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-1">
              <span className="text-orange-400">MAT</span>
              <span className="text-white">-IA</span>
            </h1>
            <p className="text-slate-500 text-sm font-light">Suporte Inteligente ao Aprendizado de Matemática</p>
          </div>

          <div className="bg-[#1e2d3d] border border-white/10 rounded-2xl p-8 mb-6">
            <div className="w-14 h-14 bg-orange-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5" className="w-7 h-7">
                <path d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"/>
              </svg>
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">Em manutenção</h2>
            <p className="text-slate-400 text-sm font-light leading-relaxed">
              A plataforma está passando por uma atualização importante. Em breve voltará com melhorias significativas.
            </p>
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl px-5 py-4">
            <p className="text-orange-400 text-xs font-light leading-relaxed">
              Se você é professor ou aluno e precisa de acesso urgente, entre em contato com o responsável pelo projeto.
            </p>
          </div>

          <p className="text-slate-600 text-xs mt-8 font-light">UTFPR Campus Medianeira — 2026</p>
        </div>
      </div>
  )
}

function App() {
  return (
      <Routes>
        <Route path="*" element={<Manutencao />} />
      </Routes>
  )
}

export default App