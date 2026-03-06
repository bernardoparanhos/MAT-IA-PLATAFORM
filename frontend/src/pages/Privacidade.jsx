import { Link, useSearchParams, useNavigate } from 'react-router-dom'

function Privacidade() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const fromCadastro = searchParams.get('from') === 'cadastro'
  const voltarPara = fromCadastro ? '/cadastro' : '/login'
  const voltarLabel = fromCadastro ? 'Voltar ao cadastro' : 'Voltar ao login'
  const linkOutra = fromCadastro ? '/termos?from=cadastro' : '/termos'

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
            <h2 className="text-white text-xl font-semibold mb-1">Política de Privacidade</h2>
            <p className="text-slate-500 text-xs">Última atualização: março de 2026</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">1. Dados coletados</h3>
            <p>Coletamos apenas os dados estritamente necessários para o funcionamento da plataforma:</p>
            <ul className="mt-2 space-y-1 text-slate-400 list-disc list-inside">
              <li>Nome completo</li>
              <li>Email institucional</li>
              <li>RA (alunos) ou SIAPE (professores)</li>
              <li>Senha (armazenada de forma criptografada com bcrypt)</li>
              <li>Dados de uso da plataforma (progresso, respostas, acessos)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">2. Finalidade</h3>
            <p>Os dados são utilizados exclusivamente para:</p>
            <ul className="mt-2 space-y-1 text-slate-400 list-disc list-inside">
              <li>Autenticação e controle de acesso</li>
              <li>Personalização da experiência de aprendizado</li>
              <li>Acompanhamento de progresso pelo professor</li>
              <li>Comunicações relacionadas à plataforma (ex: recuperação de senha)</li>
            </ul>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">3. Compartilhamento</h3>
            <p>Seus dados <span className="text-white font-medium">não são compartilhados com terceiros</span> sob nenhuma circunstância. A plataforma não exibe publicidade e não realiza qualquer forma de monetização com dados dos usuários.</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">4. Armazenamento e segurança</h3>
            <p>Os dados são armazenados em banco de dados local com senhas criptografadas. Tokens de sessão possuem validade limitada. Tokens de recuperação de senha expiram em 1 hora e são invalidados após uso.</p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">5. Seus direitos (LGPD)</h3>
            <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
            <ul className="mt-2 space-y-1 text-slate-400 list-disc list-inside">
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar a exclusão da sua conta e dados</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
            <p className="mt-2">Para exercer esses direitos, entre em contato: <span className="text-white">beparanhosborges@gmail.com</span></p>
          </div>
          <div>
            <h3 className="text-orange-400 font-medium mb-2">6. Retenção de dados</h3>
            <p>Os dados são mantidos enquanto a conta estiver ativa. Após solicitação de exclusão, os dados são removidos em até 30 dias.</p>
          </div>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6 font-light">
          <Link to={linkOutra} className="hover:text-slate-400 transition-colors">Termos de Serviço</Link>
        </p>

      </div>
    </div>
  )
}

export default Privacidade