const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

async function chamarOpenAI(messages, maxTokens = 1000, temperature = 0.7, tentativas = 3) {
    for (let i = 0; i < tentativas; i++) {
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
                    temperature,
                    messages
                }),
                signal: controller.signal
            })

            if (res.status === 429 || res.status === 502) {
                if (i < tentativas - 1) {
                    await new Promise(r => setTimeout(r, 2000 * (i + 1)))
                    continue
                }
            }

            if (!res.ok) {
                const err = await res.text()
                throw new Error(`OpenAI error ${res.status}: ${err}`)
            }

            const data = await res.json()
            return data.choices?.[0]?.message?.content || null
        } catch (e) {
            if (i < tentativas - 1) {
                await new Promise(r => setTimeout(r, 2000 * (i + 1)))
                continue
            }
            throw e
        } finally {
            clearTimeout(timeout)
        }
    }
}

async function corrigirResolucaoFoto({ enunciado, criterios, imagemUrl }) {
    const criteriosTruncados = (criterios || '').slice(0, 500)

    const prompt = `Você é um professor de matemática rigoroso, porém justo, corrigindo uma resolução manuscrita. Siga o processo em camadas.

QUESTÃO PROPOSTA:
${enunciado}

CRITÉRIOS DO PROFESSOR (gabarito de referência):
'''${criteriosTruncados}'''

SISTEMA DE VERIFICAÇÃO:
1. Resolva a questão por conta própria primeiro para ter o gabarito exato.
2. Leia a resolução da imagem. Seja tolerante com CALIGRAFIA feia ou desorganizada.
3. ATENÇÃO: Tolerância visual NÃO significa tolerância matemática. Se o aluno escrever uma operação matematicamente falsa (ex: 11x11=144), isso é um erro grave, não um pequeno erro de conta.

INSTRUÇÕES ANTI-ALUCINAÇÃO:
- Se a matemática estiver correta, a nota DEVE ser 10.0. NUNCA desconte pontos por falta de organização ou caligrafia.
- Só marque metodo_correto: false se a fórmula ou o caminho escolhido estiverem conceitualmente errados.
- Um erro de tabuada básica que corrompe o resultado final deve jogar a nota para a faixa de 0.0 a 4.5.

CRITÉRIOS DE NOTA (SISTEMA BINÁRIO RIGOROSO):
A avaliação deve focar no método correto e no resultado final. Na grande maioria dos casos, a nota será 10.0 ou 0.0.

- 10.0: O aluno demonstrou um método matematicamente válido (mesmo que diferente do gabarito) e chegou ao resultado correto. Ignore caligrafia feia, falta de organização estética ou passos intermediários fora de ordem.
- 0.0: O aluno usou fórmula errada, cometeu erro matemático que corrompe a lógica da questão (ex: afirmar que 11×11=144), não chegou ao resultado esperado, ou a resolução está em branco.
- 5.0 (CASO RARO — use com extrema parcimônia): APENAS se o aluno demonstrou raciocínio e método completamente corretos e cometeu um único erro de desatenção na última linha (ex: esqueceu um sinal negativo no resultado final, erro de adição simples no último passo). Não use para erros no meio do processo.

ATENÇÃO: Se os critérios do professor estiverem preenchidos e especificarem um método obrigatório, verifique também se o método usado pelo aluno corresponde ao exigido.

Responda SOMENTE com JSON válido neste formato exato. O campo "raciocinio_analitico" DEVE vir primeiro:
{
  "raciocinio_analitico": "Escreva aqui seu passo a passo resolvendo a questão, lendo a imagem e comparando os dois. Seja breve.",
  "questao_identificada": true,
  "nota": 0.0,
  "feedback": "Máximo 3 frases diretas ao aluno. Comece elogiando o que acertou, aponte o erro exato (se houver), e dê uma dica.",
  "erros": ["lista de erros matemáticos específicos, se houver"],
  "metodo_correto": true
}`

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
                model: 'gpt-4o',
                max_tokens: 1000,
                temperature: 0.0,
                messages: [
                    {
                        role: 'system',
                        content: prompt
                    },
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: enunciado },
                            { type: 'image_url', image_url: { url: imagemUrl, detail: 'high' } }
                        ]
                    }
                ],
                response_format: {
                    type: "json_schema",
                    json_schema: {
                        name: "avaliacao_matematica",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                raciocinio_analitico: { type: "string" },
                                questao_identificada: { type: "boolean" },
                                nota: { type: "number" },
                                feedback: { type: "string" },
                                erros: { type: "array", items: { type: "string" } },
                                metodo_correto: { type: "boolean" }
                            },
                            required: ["raciocinio_analitico", "questao_identificada", "nota", "feedback", "erros", "metodo_correto"],
                            additionalProperties: false
                        }
                    }
                }
            }),
            signal: controller.signal
        })

        if (!res.ok) {
            const err = await res.text()
            throw new Error(`OpenAI Vision error ${res.status}: ${err}`)
        }

        const data = await res.json()
        const raw = data.choices?.[0]?.message?.content || ''
        const usage = data.usage || null

        const parsed = JSON.parse(raw)

        // raciocinio_analitico força o raciocínio da IA antes da nota; não é salvo nem retornado (já capturado em raw)
        const { raciocinio_analitico, ...resultado } = parsed

        // Valida estrutura mínima
        const nota = parseFloat(resultado.nota)
        if (isNaN(nota) || nota < 0 || nota > 10) throw new Error('Nota inválida retornada pela IA')
        const feedback = (resultado.feedback || '').slice(0, 2000)

        return {
            questao_identificada: !!resultado.questao_identificada,
            nota,
            feedback,
            erros: Array.isArray(resultado.erros) ? resultado.erros : [],
            metodo_correto: !!resultado.metodo_correto,
            raw,
            usage
        }
    } finally {
        clearTimeout(timeout)
    }
}

async function analisarTurma({ nomeTurma, totalAlunos, niveis, mediaGeral, mediasBlocos }) {
    const systemPrompt = `Você é um assistente pedagógico especializado em matemática para cursos de Engenharia.

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

    const userPrompt = `Analise os dados da turma "${nomeTurma}" e forneça um resumo pedagógico objetivo e útil para o professor.

DADOS DA TURMA:
- Total de alunos que fizeram o diagnóstico: ${totalAlunos}
- Distribuição por nível: Básico: ${niveis.basico} | Intermediário: ${niveis.intermediario} | Avançado: ${niveis.avancado}
- Média geral: ${mediaGeral}/20
- Desempenho por bloco: ${mediasBlocos.map(b => `${b.bloco}: ${b.media}%`).join(' | ')}`

    return chamarOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ], 300, 0.3)
}

async function analisarAluno({ nome, nivel, pontuacao, blocos, usou_dicas, pulou, tempo_segundos }) {
    const blocoTexto = Object.entries(blocos).map(([b, d]) => {
        const perc = Math.round((d.acertos / d.total) * 100)
        return `${b}: ${d.acertos}/${d.total} (${perc}%)`
    }).join(' | ')

    const systemPrompt = `Você é um assistente pedagógico especializado em matemática para cursos de Engenharia.

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

    const userPrompt = `Analise o desempenho individual do aluno e forneça um feedback objetivo e útil para o professor.

DADOS DO ALUNO: ${nome}
- Nível: ${nivel}
- Pontuação: ${pontuacao}/20
- Desempenho por bloco: ${blocoTexto}
- Dicas utilizadas: ${(usou_dicas || []).length} de 20 questões
- Questões puladas: ${(pulou || []).length} de 20 questões
- Tempo total de resposta: ${tempo_segundos ? `${Math.round(tempo_segundos / 60)} minutos (${tempo_segundos}s)` : 'não disponível'}`

    return chamarOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ], 200, 0.3)
}

module.exports = { corrigirResolucaoFoto, analisarTurma, analisarAluno }