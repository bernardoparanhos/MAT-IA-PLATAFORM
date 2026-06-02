const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

async function chamarOpenAI(messages, maxTokens = 1000) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
        const res = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                max_tokens: maxTokens,
                messages
            }),
            signal: controller.signal
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`OpenAI error ${res.status}: ${err}`)
        }

        const data = await res.json()
        return data.choices?.[0]?.message?.content || null
    } finally {
        clearTimeout(timeout)
    }
}

async function corrigirResolucaoFoto({ enunciado, criterios, imagemUrl }) {
    const criteriosTruncados = (criterios || '').slice(0, 500)

    const prompt = `Você é um professor de matemática corrigindo uma resolução manuscrita.

QUESTÃO PROPOSTA:
${enunciado}

CRITÉRIOS DO PROFESSOR:
'''${criteriosTruncados}'''

TAREFA:
1. Verifique se a resolução na imagem corresponde à questão acima.
   Se não corresponder, retorne nota 0 com questao_identificada: false.

2. Se corresponder, avalie:
   - Raciocínio e método (vale mais que resultado)
   - Erros de cálculo vs erros conceituais
   - Clareza e organização

Responda SOMENTE com JSON válido neste formato exato:
{
  "questao_identificada": true,
  "nota": 0.0,
  "feedback": "2-4 frases diretas ao aluno",
  "erros": ["erro específico 1"],
  "metodo_correto": true
}

Critérios de nota:
- Método correto + resultado correto: 8.0 a 10.0
- Método correto + erro de conta: 5.0 a 7.5
- Método incorreto + resultado correto: 2.0 a 4.0
- Método incorreto + resultado incorreto: 0.0 a 3.0
- Resolução em branco ou ilegível: 0.0`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
        const res = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: prompt },
                            { type: 'image_url', image_url: { url: imagemUrl, detail: 'high' } }
                        ]
                    }
                ]
            }),
            signal: controller.signal
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`OpenAI Vision error ${res.status}: ${err}`)
        }

        const data = await res.json()
        const raw = data.choices?.[0]?.message?.content || ''

        // Remove possíveis backticks de markdown
        const clean = raw.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)

        // Valida estrutura mínima
        const nota = parseFloat(parsed.nota)
        if (isNaN(nota) || nota < 0 || nota > 10) throw new Error('Nota inválida retornada pela IA')
        const feedback = (parsed.feedback || '').slice(0, 2000)

        return {
            questao_identificada: !!parsed.questao_identificada,
            nota,
            feedback,
            erros: Array.isArray(parsed.erros) ? parsed.erros : [],
            metodo_correto: !!parsed.metodo_correto,
            raw
        }
    } finally {
        clearTimeout(timeout)
    }
}

async function analisarTurma({ nomeTurma, totalAlunos, niveis, mediaGeral, mediasBlocos }) {
    const contexto = `Você é um assistente pedagógico especializado em matemática para cursos de Engenharia.
Analise os dados da turma "${nomeTurma}" e forneça um resumo pedagógico objetivo e útil para o professor.

DADOS DA TURMA:
- Total de alunos que fizeram o diagnóstico: ${totalAlunos}
- Distribuição por nível: Básico: ${niveis.basico} | Intermediário: ${niveis.intermediario} | Avançado: ${niveis.avancado}
- Média geral: ${mediaGeral}/20
- Desempenho por bloco: ${mediasBlocos.map(b => `${b.bloco}: ${b.media}%`).join(' | ')}

INSTRUÇÕES:
- Escreva em português, tom profissional mas acessível
- Máximo 4 frases
- Destaque o ponto mais forte e o mais fraco da turma
- Termine com UMA recomendação pedagógica concreta para o professor
- Sempre cite os valores percentuais ao justificar pontos fortes e fracos
- Compare explicitamente o melhor e o pior bloco com seus valores
- Evite termos vagos como "bom" ou "regular" sem justificar com números
- NÃO invente dados além dos fornecidos
- NÃO use bullet points, escreva em parágrafo corrido`

    return chamarOpenAI([{ role: 'user', content: contexto }], 300)
}

async function analisarAluno({ nome, nivel, pontuacao, blocos, usou_dicas, pulou, tempo_segundos }) {
    const blocoTexto = Object.entries(blocos).map(([b, d]) => {
        const perc = Math.round((d.acertos / d.total) * 100)
        return `${b}: ${d.acertos}/${d.total} (${perc}%)`
    }).join(' | ')

    const contexto = `Você é um assistente pedagógico especializado em matemática para cursos de Engenharia.
Analise o desempenho individual do aluno e forneça um feedback objetivo e útil para o professor.

DADOS DO ALUNO: ${nome}
- Nível: ${nivel}
- Pontuação: ${pontuacao}/20
- Desempenho por bloco: ${blocoTexto}
- Dicas utilizadas: ${(usou_dicas || []).length} de 20 questões
- Questões puladas: ${(pulou || []).length} de 20 questões
- Tempo total de resposta: ${tempo_segundos ? `${Math.round(tempo_segundos / 60)} minutos (${tempo_segundos}s)` : 'não disponível'}

INSTRUÇÕES:
- Escreva em português, tom profissional mas acessível
- Máximo 3 frases
- Identifique explicitamente o bloco com melhor desempenho e o com pior desempenho, comparando os valores percentuais entre si
- Termine com UMA sugestão de reforço específica
- Cite os valores numéricos (acertos/total e %) ao analisar cada bloco
- Destaque comportamento: se usou muitas dicas ou pulou questões, interprete o que isso pode indicar
- Se o tempo for muito curto (menos de 3 min) ou muito longo (mais de 20 min), mencione como possível sinal
- Evite termos vagos sem justificar com os dados fornecidos
- NÃO invente dados além dos fornecidos
- NÃO use bullet points, escreva em parágrafo corrido`

    return chamarOpenAI([{ role: 'user', content: contexto }], 200)
}

module.exports = { corrigirResolucaoFoto, analisarTurma, analisarAluno }