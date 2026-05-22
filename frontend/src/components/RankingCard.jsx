import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Crown } from 'lucide-react';

export default function RankingCard() {
    const [ranking, setRanking] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const buscarRanking = async () => {
            try {
                const API = import.meta.env.VITE_API_URL;

                const res = await fetch(`${API}/auth/ranking`, {
                    credentials: 'include',
                });

                if (res.ok) {
                    const data = await res.json();
                    setRanking(data);
                }
            } catch (error) {
                console.error('Erro ao buscar ranking:', error);
            } finally {
                setLoading(false);
            }
        };

        buscarRanking();
    }, []);

    // Design elegante para as medalhas (sem emojis infantis)
    const renderPosicao = (posicao) => {
        switch (posicao) {
            case 1:
                return <Trophy className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />;
            case 2:
                return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.4)]" />;
            case 3:
                return <Award className="w-5 h-5 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.4)]" />;
            default:
                return <span className="text-slate-500 font-medium text-sm w-5 text-center">{posicao}º</span>;
        }
    };

    if (loading) {
        return (
            <div className="bg-[#1e2d3d] rounded-2xl p-6 border border-white/5 animate-pulse">
                <div className="h-6 bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-800 rounded-xl"></div>)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#1e2d3d] rounded-2xl p-6 border border-white/5 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <Crown className="w-5 h-5 text-orange-400" strokeWidth="1.5" />
                </div>
                <div>
                    <h2 className="text-lg font-medium text-white uppercase tracking-wider text-sm">
                        Ranking Global
                    </h2>
                    <p className="text-xs text-slate-400 font-light">Os melhores do MAT-IA</p>
                </div>
            </div>

            {ranking.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl">
                    <p className="text-slate-400 font-light text-sm">
                        Ninguém pontuou ainda.<br/>Seja o primeiro a resolver questões!
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {ranking.map((aluno, index) => {
                        const posicao = index + 1;
                        const isTop3 = posicao <= 3;
                        const ehVoce = aluno.nome.includes('(você)');

                        // Regra: Pega os dois primeiros nomes (Nome + Sobrenome)
                        const partesNome = aluno.nome.replace(' (você)', '').split(' ');
                        const CONECTORES = new Set(['de', 'da', 'do', 'dos', 'das', 'e'])
                        const sobrenome = partesNome.slice(1).find(p => !CONECTORES.has(p.toLowerCase()))
                        const nomeCurto = sobrenome ? `${partesNome[0]} ${sobrenome}` : partesNome[0]

                            const nomeExibicao = nomeCurto;

                        return (
                            <div
                                key={aluno.id} // Use o ID como key, é mais seguro que o RA
                                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                    ehVoce
                                        ? 'bg-orange-500/10 border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                                        : isTop3
                                            ? 'bg-[#0f172a]/50 border-orange-500/20 hover:border-orange-500/40'
                                            : 'bg-[#0f172a]/30 border-white/5 hover:border-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 flex items-center justify-center flex-shrink-0">
                                        {renderPosicao(posicao)}
                                    </div>

                                <div className="flex flex-col">
    <span className={`font-medium ${ehVoce ? 'text-orange-400' : isTop3 ? 'text-white' : 'text-slate-300'}`}>
        {nomeExibicao}
    </span>
    {ehVoce && (
        <span className="text-[10px] text-orange-400/50 font-light leading-none mt-0.5">você</span>
    )}
</div>
                                </div>

                                <div className="flex flex-col items-end">
                                    <span className="text-orange-400 font-medium">{aluno.pontos_totais} pts</span>
                                    <span className="text-[10px] text-slate-500">
                    {aluno.questoes_corretas} acertos
                </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}