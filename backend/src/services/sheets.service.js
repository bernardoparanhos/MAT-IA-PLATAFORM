const { google } = require('googleapis')

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

async function garantirCabecalho(sheets) {
  await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Página1!A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          'Nome', 'RA', 'Turma', 'Nível Geral', 'Pontuação (0-17)',
          'Inteiros (acertos/3)', 'Frações (acertos/3)', 'Raízes (acertos/3)', 'Potências (acertos/4)', 'Geometria (acertos/2)',
          'Dicas Usadas', 'Questões Puladas', 'Data e Hora', 'Tempo de Resposta',
'Q1 (-2)(-2)(-2)', 'Q2 (-2)(-2)(-2)(-2)', 'Q3 -9+4',
'Q4 16/8', 'Q5 √49', 'Q6 ³√27',
'Q7 1/5+3/5', 'Q8 1/4+7/3', 'Q9 2³', 'Q10 3⁻³', 'Q11 ³√56',
'Q12 fração potências', 'Q13 -6²', 'Q14 (27/8)⁻¹',
'Q15 expressão mista', 'Q16 triângulo 6-8', 'Q17 triângulo 3-5'
       ]]
      }
    })
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
      range: 'Página1!A:AE',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[
          dados.nome,
          dados.ra,
          dados.turma,
          nivelLabel[dados.nivel] || dados.nivel,
          `${dados.pontuacao}/16`,
`${dados.blocos.inteiros?.acertos ?? 0}/3`,
`${dados.blocos.fracoes?.acertos ?? 0}/3`,
`${dados.blocos.raizes?.acertos ?? 0}/3`,
`${dados.blocos.potencias?.acertos ?? 0}/4`,
`${dados.blocos.geometria?.acertos ?? 0}/2`,
          dados.dicas_usadas,
          dados.questoes_puladas,
          dados.feito_em,
          dados.tempo_segundos ? `${Math.floor(dados.tempo_segundos/60)}min ${dados.tempo_segundos%60}s` : '-',
          dados.q1, dados.q2, dados.q3, dados.q4, dados.q5,
          dados.q6, dados.q7, dados.q8, dados.q9, dados.q10,
dados.q11, dados.q12, dados.q13, dados.q14, dados.q15, dados.q16, dados.q17,
        ]]
      }
    })
    console.log('✅ Dados enviados para o Google Sheets')
  } catch (e) {
    console.error('Erro ao enviar para o Sheets:', e)
  }
}

module.exports = { registrarDiagnostico }