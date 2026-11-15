// Conta quantas linhas cada tabela mostra para a chave PÚBLICA, e sem baixar nenhum dado.
// Use:  node --env-file=.env diagnostico.mjs     (Node 20.6 ou mais novo)

const { SUPABASE_URL, SUPABASE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Defina SUPABASE_URL e SUPABASE_KEY no arquivo .env');
  process.exit(1);
}

// aceita a URL com ou sem /rest/v1 no final
const base = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const fontes = ['alunos', 'equipe_autorizada', 'eventos', 'frequencia',
                'inscricoes', 'vw_alunos_aptos_certificado'];

for (const nome of fontes) {
  try {
    const resp = await fetch(`${base}/rest/v1/${nome}?select=*`, {
      method: 'HEAD',
      headers: { apikey: SUPABASE_KEY, Prefer: 'count=exact' },
    });
    const faixa = resp.headers.get('content-range');
    const total = faixa ? faixa.split('/')[1] : '?';
    console.log(nome.padEnd(30), resp.ok ? `${total} linhas visíveis` : `ERRO HTTP ${resp.status}`);
  } catch (erro) {
    console.log(nome.padEnd(30), 'ERRO de rede:', erro.message);
  }
}
