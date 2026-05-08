// frontend/src/components/HUDAluno.jsx

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Star, TrendingUp } from 'lucide-react';

export default function HUDAluno() {
    const [progresso, setProgresso] = useState(null);

    const buscarProgresso = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const API = import.meta.env.VITE_API_URL;
            const res = await fetch(`${API}/auth/meu-progresso`, {
                credentials: 'include',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setProgresso(data);
            }
        } catch (error) {
            console.error('Erro ao buscar progresso no HUD:', error);
        }
    }, []);

    useEffect(() => {
        buscarProgresso();
        window.atualizarHUD = buscarProgresso;
        return () => { delete window.atualizarHUD; };
    }, [buscarProgresso]);

    if (!progresso || progresso.pontos_totais === 0) return null;

    return (
        <div className={`
    /* O segredo: fixed absoluto com z-index de topo */
    fixed z-[999] pointer-events-auto
    
    /* Mobile: Travado abaixo do header */
    top-[75px] right-4 p-2 flex-col items-end gap-1.5 rounded-xl scale-[0.85]
    transform-gpu origin-top-right
    
    /* Desktop: Volta ao normal */
    lg:top-8 lg:right-10 lg:p-2.5 lg:flex-row lg:items-center lg:gap-6 lg:rounded-full lg:scale-100
    
    /* Estilo visual */
    flex bg-[#1e2d3d]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]
    `}>

            {/* Pontos */}
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 lg:w-7 lg:h-7 bg-orange-500/20 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                    <Star className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-orange-400 fill-orange-400/20" />
                </div>
                <span className="text-white text-sm lg:text-base font-medium tracking-wide">
          {progresso.pontos_totais} <span className="text-slate-400 text-[10px] lg:text-xs font-light">pts</span>
        </span>
            </div>

            {/* Linha divisória (Só aparece no Desktop) */}
            <div className="hidden lg:block w-px h-5 bg-white/10"></div>

            {/* Ranking e Acertos (Embaixo no mobile, Lado a lado no desktop) */}
            <div className="flex flex-col lg:flex-row items-end lg:items-center gap-1.5 lg:gap-6">

                {/* Ranking */}
                <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-yellow-400 opacity-80" />
                    <span className="text-slate-300 font-light text-[11px] lg:text-sm">
            {progresso.posicao}º <span className="hidden lg:inline text-slate-500 text-xs text-[10px]">lugar</span>
          </span>
                </div>

                {/* Acertos */}
                <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400 opacity-80" />
                    <span className="text-slate-300 font-light text-[11px] lg:text-sm">
            <span className="text-green-400 font-medium">{progresso.questoes_corretas}</span>
            <span className="text-slate-500 text-[10px] lg:text-xs">/{progresso.questoes_respondidas}</span>
          </span>
                </div>

            </div>
        </div>
    );
}