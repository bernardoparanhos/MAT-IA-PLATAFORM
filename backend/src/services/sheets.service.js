const { google } = require('googleapis')

const NOMES_BLOCOS = {
    inteiros: 'Números Inteiros',
    fracoes: 'Frações',
    raizes: 'Raízes e Radicais',
    potencias: 'Potenciação',
    geometria: 'Geometria Básica',
    equacao1: 'Equação 1º Grau',
    equacao2: 'Equação 2º Grau',
    modulo: 'Módulo/Absoluto',
    exponencial: 'Exponencial/Logaritmo',
    trigonometria: 'Trigonometria'
};

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID
const SPREADSHEET_FEEDBACKS_ID = process.env.GOOGLE_SPREADSHEET_FEEDBACKS_ID

async function garantirCabecalho(sheets) {
  await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Página1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Nome', 'RA', 'Turma', 'Nível Geral', 'Pontuação (0-20)',
          'Inteiros (acertos/3)', 'Frações (acertos/3)', 'Raízes (acertos/3)', 'Potências (acertos/9)', 'Geometria (acertos/2)',
          'Dicas Usadas', 'Questões Puladas', 'Data e Hora', 'Tempo de Resposta',
'Q1 (-2)(-2)(-2)', 'Q2 (-2)(-2)(-2)(-2)', 'Q3 -9+4',
'Q4 16/8', 'Q5 √49', 'Q6 ³√27',
'Q7 1/5+3/5', 'Q8 1/4+7/3', 'Q9 2³', 'Q10 3⁻³', 'Q11 ³√56',
'Q12 fração potências', 'Q13 fração m/n/p', 'Q14 (81/16)⁻¹',
'Q15 -6²', 'Q16 (27/8)⁻¹', 'Q17 expressão decimal',
'Q18 expressão fração', 'Q19 triângulo 6-8', 'Q20 triângulo 3-5'
       ]]
      }
    })
}

async function garantirCabecalhoFeedbacks(sheets) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_FEEDBACKS_ID,
      range: 'Página1!A1',
    })
    const temCabecalho = res.data.values && res.data.values[0]?.[0] === 'Nome'
      if (!temCabecalho) {
          await sheets.spreadsheets.values.update({
              spreadsheetId: SPREADSHEET_FEEDBACKS_ID,
              range: 'Página1!A1',
              valueInputOption: 'RAW',
              requestBody: {
                  values: [[
                      'Nome', 'RA', 'Turma', 'Nota (0-10)', 'Comentário', 'Data e Hora'
                  ]]
              }
          })
      }
  } catch (e) {
      console.error('Erro ao garantir cabeçalho feedbacks:', e)
  }
}

async function garantirCabecalhoQuestoes(sheets) {
    try {
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Questões Respondidas!A1',
        })
        const temCabecalho = res.data.values && res.data.values[0]?.[0] === 'Nome'
        if (!temCabecalho) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Questões Respondidas!A1',
                valueInputOption: 'RAW',
                requestBody: {
                    values: [[
                        'Nome', 'RA', 'Turma', 'Questão ID', 'Bloco', 'Resultado', 'Pontos', 'Tempo', 'Data/Hora'
                    ]]
                }
            })
        }
    } catch (e) {
        console.error('Erro ao garantir cabeçalho questões:', e)
    }
}

async function registrarDiagnostico(dados) {
  try {
    const sheets = google.sheets({ version: 'v4', auth })
    await garantirCabecalho(sheets)

    const nivelLabel = {
      basico: '🔴 Básico',
      intermediario: '🟡 Intermediário',
      avancado: '🟢 Avançado'
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Página1!A:AH',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          dados.nome,
          dados.ra,
          dados.turma,
          nivelLabel[dados.nivel] || dados.nivel,
          `${dados.pontuacao}/20`,
`${dados.blocos.inteiros?.acertos ?? 0}/3`,
`${dados.blocos.fracoes?.acertos ?? 0}/3`,
`${dados.blocos.raizes?.acertos ?? 0}/3`,
`${dados.blocos.potencias?.acertos ?? 0}/9`,
`${dados.blocos.geometria?.acertos ?? 0}/2`,
          dados.dicas_usadas,
          dados.questoes_puladas,
          dados.feito_em,
          dados.tempo_segundos ? `${Math.floor(dados.tempo_segundos/60)}min ${dados.tempo_segundos%60}s` : '-',
          dados.q1, dados.q2, dados.q3, dados.q4, dados.q5,
          dados.q6, dados.q7, dados.q8, dados.q9, dados.q10,
dados.q11, dados.q12, dados.q13, dados.q14, dados.q15, dados.q16, dados.q17, dados.q18, dados.q19, dados.q20,
        ]]
      }
    })
    console.log('✅ Dados enviados para o Google Sheets')
  } catch (e) {
    console.error('Erro ao enviar para o Sheets:', e)
  }
}

async function registrarFeedback(dados) {
  try {
    const sheets = google.sheets({ version: 'v4', auth })
    await garantirCabecalhoFeedbacks(sheets)

    const nivelLabel = {
      basico: '🔴 Básico',
      intermediario: '🟡 Intermediário',
      avancado: '🟢 Avançado'
    }

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_FEEDBACKS_ID,
      range: 'Página1!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
  dados.nome,
  dados.ra,
  dados.turma,
  dados.nota,
  dados.comentario || '-',
  dados.data
]]
      }
    })
    console.log('✅ Feedback enviado para o Google Sheets')
  } catch (e) {
    console.error('Erro ao enviar feedback para o Sheets:', e)
  }
}
async function registrarQuestaoRespondida(nome, ra, turma, questaoId, bloco, acertou) {
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const nomeDaAba = turma;

        // 1. TENTA CRIAR A ABA (Caso seja uma turma nova)
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: nomeDaAba } } }]
                }
            });
        } catch (e) { /* Aba já existe */ }

        // 2. GARANTE O CABEÇALHO (Se a aba estiver vazia, ele coloca os títulos)
        const checkHeader = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${nomeDaAba}!A1:F1`,
        });

        if (!checkHeader.data.values || checkHeader.data.values.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${nomeDaAba}!A1:F1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['Nome', 'RA', 'Turma', 'Matéria', 'Resultado', 'Data/Hora']]
                }
            });
        }

        // 3. LOGICA DE PULAR LINHA ENTRE ALUNOS DIFERENTES
        const colNome = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${nomeDaAba}!A:A`,
        });
        const valoresNomes = colNome.data.values || [];
        const ultimoNome = valoresNomes.length > 0 ? valoresNomes[valoresNomes.length - 1][0] : null;

        // Se mudou o aluno, pula uma linha para organizar visualmente
        if (ultimoNome && ultimoNome !== 'Nome' && ultimoNome !== nome) {
            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: `${nomeDaAba}!A:F`,
                valueInputOption: 'RAW',
                requestBody: { values: [[]] }
            });
        }

        // 4. INSERE OS DADOS ENXUTOS
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${nomeDaAba}!A:F`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    nome,
                    ra,
                    turma,
                    NOMES_BLOCOS[bloco] || bloco,
                    acertou ? '✅ CORRETO' : '❌ INCORRETO',
                    new Date().toLocaleString('pt-BR')
                ]]
            }
        });

    } catch (e) {
        console.error('❌ Erro no Sheets:', e.message);
    }
}

async function registrarPartidaJogo(dados) {
    try {
        const sheets = google.sheets({ version: 'v4', auth })
        const nomeDaAba = 'Jogos'

        // Cria aba se não existir
        try {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: [{ addSheet: { properties: { title: nomeDaAba } } }]
                }
            })
        } catch (e) { /* aba já existe */ }

        // Garante cabeçalho
        const checkHeader = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${nomeDaAba}!A1:J1`,
        })

        if (!checkHeader.data.values || checkHeader.data.values.length === 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `${nomeDaAba}!A1:J1`,
                valueInputOption: 'RAW',
                requestBody: {
                    values: [['Data', 'Fase', 'Operação', 'Pontuação', 'Acertos', 'Erros', 'Aproveitamento (%)', 'Tempo (s)', 'Concluiu', 'Operações Erradas']]
                }
            })
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${nomeDaAba}!A:J`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[
                    new Date().toLocaleDateString('pt-BR'),
                    dados.fase,
                    dados.operacao || '-',
                    dados.pontuacao,
                    dados.acertos,
                    dados.erros,
                    dados.aproveitamento,
                    dados.tempo_total < 60 ? `${dados.tempo_total}s` : `${Math.floor(dados.tempo_total / 60)}min ${dados.tempo_total % 60}s`,
                    dados.concluiu_fase ? 'Sim' : 'Não',
                    (dados.operacoes_erradas || []).join(' | ')
                ]]
            }
        })

        console.log('✅ Partida registrada no Sheets')
    } catch (e) {
        console.error('❌ Erro ao registrar partida:', e.message)
    }
}

module.exports = {
    registrarDiagnostico,
    registrarFeedback,
    registrarQuestaoRespondida,
    registrarPartidaJogo
}