/* Ponto de ligação com o banco: o aluno informa CPF + e-mail e a função devolve
 * { ok: true, aluno: { nome, presencas } }  ou  { ok: false, motivo }.
 * O objeto "aluno" tem o formato que o gerarCertificado(aluno) do módulo do PDF espera.
 *
 * Roda no navegador, sem bibliotecas.
 * Depende da função SQL consultar_certificado (arquivo 01_consultar_certificado.sql).
 */

const SUPABASE_URL = 'https://wtksmkjydoioxmtxgbpx.supabase.co'; // raiz do projeto (URL)
const SUPABASE_KEY = 'sb_publishable_rU5D8t8_SDLsD_a1Ib4g6w_qr1BXzLR';            // chave pública

// Valida os dígitos verificadores do CPF (aceita com ou sem pontuação)
function cpfValido(cpf) {
  const d = String(cpf).replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(d[t])) return false;
  }
  return true;
}

async function buscarAluno(cpf, email) {
  const cpfLimpo = String(cpf).replace(/\D/g, '');
  const emailLimpo = String(email).trim().toLowerCase();

  if (!cpfValido(cpfLimpo)) return { ok: false, motivo: 'CPF_INVALIDO' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) return { ok: false, motivo: 'EMAIL_INVALIDO' };

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/consultar_certificado`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_cpf: cpfLimpo, p_email: emailLimpo }),
    });
    if (!resp.ok) return { ok: false, motivo: 'ERRO_DE_CONSULTA' };

    const linhas = await resp.json();   // a função devolve uma lista com uma linha
    const r = linhas && linhas[0];
    if (!r || r.ok !== true) return { ok: false, motivo: (r && r.motivo) || 'ERRO_DE_CONSULTA' };

    return { ok: true, aluno: { nome: r.nome, presencas: r.presencas } };
  } catch (erro) {
    return { ok: false, motivo: 'ERRO_DE_CONSULTA' };   // erro nunca libera
  }
}

// Textos sugeridos para a tela
const MENSAGENS = {
  CPF_INVALIDO: 'CPF inválido. Confira os números digitados.',
  EMAIL_INVALIDO: 'E-mail inválido. Confira o endereço digitado.',
  DADOS_NAO_CONFEREM: 'Não encontramos uma inscrição com esse CPF e e-mail.',
  SEM_CHECKIN: 'Sua inscrição foi encontrada, mas ainda não há presença registrada.',
  ERRO_DE_CONSULTA: 'Não foi possível consultar agora. Tente novamente em instantes.',
};

// Uso com o módulo do PDF:
//   const r = await buscarAluno(cpfDigitado, emailDigitado);
//   if (r.ok) await gerarCertificado(r.aluno);
//   else alert(MENSAGENS[r.motivo] || MENSAGENS.ERRO_DE_CONSULTA);

if (typeof module !== 'undefined') module.exports = { cpfValido, buscarAluno, MENSAGENS };
