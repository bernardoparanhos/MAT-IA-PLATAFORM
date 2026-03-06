import { Link, useSearchParams, useNavigate } from 'react-router-dom'

function Termos() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fromCadastro = searchParams.get('from') === 'cadastro'
  const voltarPara = fromCadastro ? '/cadastro' : '/login'
  const voltarLabel = fromCadastro ? 'Voltar ao cadastro' : 'Voltar ao login'
  const linkOutra = fromCadastro ? '/privacidade?from=cadastro' : '/privacidade'

  return (
    <div className="min-h-screen bg-[#0f172a] px-4 py-12" style={{fontFamily:'Outfit, sans-serif'}}>
      <div className="w-full max-w-2xl mx-auto">

        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold text-orange-400 tracking-tight">MAT<span className="text-white">-IA</span></h1>
          <p className="text-slate-400 text-sm mt-2 font-light">Suporte Inteligente ao Aprendizado de Matemática</p>
        </div>

        <button
          onClick={() => navigate(voltarPara)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
          <span className="text-sm font-light">{voltarLabel}</span>
        </button>

        <div className="bg-[#1e2d3d] rounded-2xl p-8 border border-white/5 shadow-2xl space-y-6 text-slate-300 text-sm font-light leading-relaxed">
          <div>
            <h2 className="text-white text-xl font-semibold mb-1">Termos de Serviço</h2>
            <p className="text-slate-500 text-xs">Última atualização: março de 2026</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">1. Sobre a plataforma</h3>
            <p>O MAT-IA é uma plataforma educacional desenvolvida como projeto acadêmico na UTFPR Campus Medianeira, voltada ao suporte inteligente no aprendizado de Matemática para alunos e professores da instituição.</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">2. Elegibilidade</h3>
            <p>O acesso é restrito a alunos e professores vinculados à UTFPR, identificados por email institucional (<span className="text-white">@alunos.utfpr.edu.br</span> ou <span className="text-white">@utfpr.edu.br</span>), RA ou SIAPE previamente autorizados.</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">3. Uso aceitável</h3>
            <p>O usuário compromete-se a utilizar a plataforma exclusivamente para fins educacionais, não compartilhar suas credenciais de acesso e não realizar qualquer ação que comprometa a segurança ou integridade do sistema.</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">4. Responsabilidades</h3>
            <p>O MAT-IA é disponibilizado como ferramenta de apoio ao estudo. Não nos responsabilizamos por eventuais indisponibilidades do serviço nem pelo uso inadequado da plataforma por parte dos usuários.</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">5. Alterações</h3>
            <p>Estes termos podem ser atualizados a qualquer momento. O uso continuado da plataforma após alterações implica aceitação das novas condições.</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">6. Contato</h3>
            <p>Dúvidas ou solicitações podem ser enviadas para <span className="text-white">beparanhosborges@gmail.com</span>.</p>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6 font-light">
          <Link to={linkOutra} className="hover:text-slate-400 transition-colors">Política de Privacidade</Link>
        </p>

      </div>
    </div>
  )
}

export default Termos