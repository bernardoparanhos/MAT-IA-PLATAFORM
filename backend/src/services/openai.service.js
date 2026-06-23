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

async function corrigirResolucaoFoto({ enunciado, criterios, imagemUrl, imagemModeloUrl }) {
    const criteriosTruncados = (criterios || '').slice(0, 500)

    const prompt = `Você é um professor de matemática rigoroso, corrigindo uma resolução manuscrita. Aplique os critérios abaixo em ordem de prioridade, sem exceções.

QUESTÃO PROPOSTA:
${enunciado}

CRITÉRIOS DO PROFESSOR (gabarito de referência):
'''${criteriosTruncados}'''

${imagemModeloUrl ? `─── RESOLUÇÃO MODELO DO PROFESSOR ───
O professor forneceu uma resolução de referência (segunda imagem enviada). Esta resolução tem PRIORIDADE MÁXIMA sobre qualquer outro critério.
Use-a como gabarito absoluto de método, organização e encadeamento de passos.
Avalie o aluno comparando:
1. Se o método usado é compatível com o da resolução modelo
2. Se o nível de organização é equivalente ao modelo
3. Se o encadeamento de passos segue a mesma lógica do modelo
4. Se o resultado final coincide com o do modelo
Qualquer desvio significativo do método do modelo deve ser penalizado, mesmo que o resultado esteja correto.` : ''}

SISTEMA DE VERIFICAÇÃO:
1. Resolva a questão por conta própria para ter o gabarito exato.
2. Leia a resolução da imagem com atenção.
3. Aplique os critérios abaixo em ordem — erros eliminatórios primeiro, depois qualidade.

─── ERROS ELIMINATÓRIOS (nota = 0.0 imediato, sem exceção) ───
- Erro de tabuada básica (ex: 3×4=13, 7×8=54, 11×11=144)
- Erro de sinal (ex: resultado negativo quando deveria ser positivo, troca de + por −)
- Fórmula ou método conceitualmente errado
- Resultado final incorreto
- Resolução em branco ou ilegível

─── PENALIDADE DE ORGANIZAÇÃO (obrigatória se não houver erro eliminatório) ───
Organização é um requisito, não um bônus. Se a resolução estiver desorganizada, confusa ou sem estrutura visual clara, desconte no mínimo 30% da nota base (ex: nota base 10.0 → máximo 7.0). Seja objetivo: passos espalhados, sem sequência ou sem separação clara caracterizam desorganização.

─── CRITÉRIOS DE QUALIDADE (avaliar após confirmar ausência de erros eliminatórios) ───
a) Desenvolvimento e conclusão: deve haver início, passo a passo explícito e conclusão clara.
b) Encadeamento lógico: cada etapa deve decorrer coerentemente da anterior.
c) Fundamentação teórica: o aluno deve indicar o método ou técnica usada, não apenas o resultado.
d) Clareza e objetividade: a resolução deve ser compreensível, sem ambiguidade.
e) Domínio de conteúdo (APENAS para questões dissertativas/abertas): avalie se o aluno demonstra conhecimento teórico da área. Para questões de cálculo direto, ignore este critério.

─── TABELA DE NOTAS ───
- 10.0: Sem erros eliminatórios + organizado + todos os critérios de qualidade atendidos.
- 7.0: Correto matematicamente e com boa qualidade, mas com penalidade de organização (-30%).
- 5.0 (RARO): Método e raciocínio 100% corretos, resolução organizada, porém com único erro de desatenção na última linha (ex: esqueceu sinal no resultado final, erro de adição simples no passo final). Não use para erros no meio do processo.
- 0.0: Qualquer erro eliminatório presente, ou resolução em branco.

ATENÇÃO: Se os critérios do professor especificarem um método obrigatório, verifique se o método do aluno corresponde ao exigido.

Responda SOMENTE com JSON válido neste formato exato. O campo "raciocinio_analitico" DEVE vir primeiro:
{
  "raciocinio_analitico": "Passo a passo: resolva a questão, leia a imagem, verifique erros eliminatórios, avalie organização e cada critério de qualidade, então calcule a nota justificando.",
  "questao_identificada": true,
  "nota": 0.0,
  "feedback": "Máximo 3 frases diretas ao aluno. Aponte o que acertou, o erro exato (se houver) e uma dica concreta de melhoria.",
  "erros": ["lista de erros específicos encontrados, se houver"],
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
                            { type: 'text', text: 'Resolução do aluno:' },
                            { type: 'image_url', image_url: { url: imagemUrl, detail: 'high' } },
                            ...(imagemModeloUrl ? [
                                { type: 'text', text: 'Resolução modelo do professor (gabarito de referência):' },
                                { type: 'image_url', image_url: { url: imagemModeloUrl, detail: 'high' } }
                            ] : [])
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