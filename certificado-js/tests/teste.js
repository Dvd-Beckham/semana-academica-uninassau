const assert = require('node:assert/strict');
const { cpfValido, buscarAluno } = require('../web/consulta_certificado.js');

// CPFs de teste com dígitos verificadores corretos (gerados pelo algoritmo, não são de pessoas reais)
assert.equal(cpfValido('529.982.247-25'), true);
assert.equal(cpfValido('52998224725'), true);
assert.equal(cpfValido('529.982.247-24'), false);   // dígito errado
assert.equal(cpfValido('111.111.111-11'), false);   // repetidos
assert.equal(cpfValido('123'), false);
assert.equal(cpfValido(''), false);

(async () => {
  const chamadas = [];
  const respostas = {
    ok:   [{ ok: true,  nome: 'Maria da Silva', presencas: 2, motivo: null }],
    sem:  [{ ok: false, nome: null, presencas: 0, motivo: 'SEM_CHECKIN' }],
    nao:  [{ ok: false, nome: null, presencas: 0, motivo: 'DADOS_NAO_CONFEREM' }],
  };
  let modo = 'ok';
  global.fetch = async (url, opt) => {
    chamadas.push({ url, opt });
    if (modo === 'cai') throw new Error('rede');
    if (modo === '500') return { ok: false, json: async () => ({}) };
    if (modo === 'lixo') return { ok: true, json: async () => [] };
    return { ok: true, json: async () => respostas[modo] };
  };

  let r = await buscarAluno('529.982.247-25', '  Maria@Teste.COM ');
  assert.deepEqual(r, { ok: true, aluno: { nome: 'Maria da Silva', presencas: 2 } });
  const corpo = JSON.parse(chamadas[0].opt.body);
  assert.deepEqual(corpo, { p_cpf: '52998224725', p_email: 'maria@teste.com' });   // normalizado
  assert.deepEqual(Object.keys(chamadas[0].opt.headers).sort(), ['Content-Type', 'apikey']);
  assert.ok(chamadas[0].url.endsWith('/rest/v1/rpc/consultar_certificado'));
  assert.ok(!chamadas[0].url.includes('/rest/v1/rest/v1'));

  modo = 'sem';  r = await buscarAluno('52998224725', 'a@b.com'); assert.deepEqual(r, { ok: false, motivo: 'SEM_CHECKIN' });
  modo = 'nao';  r = await buscarAluno('52998224725', 'a@b.com'); assert.deepEqual(r, { ok: false, motivo: 'DADOS_NAO_CONFEREM' });
  modo = 'cai';  r = await buscarAluno('52998224725', 'a@b.com'); assert.deepEqual(r, { ok: false, motivo: 'ERRO_DE_CONSULTA' });
  modo = '500';  r = await buscarAluno('52998224725', 'a@b.com'); assert.deepEqual(r, { ok: false, motivo: 'ERRO_DE_CONSULTA' });
  modo = 'lixo'; r = await buscarAluno('52998224725', 'a@b.com'); assert.deepEqual(r, { ok: false, motivo: 'ERRO_DE_CONSULTA' });

  const antes = chamadas.length;
  r = await buscarAluno('111.111.111-11', 'a@b.com'); assert.equal(r.motivo, 'CPF_INVALIDO');
  r = await buscarAluno('52998224725', 'sem-arroba');  assert.equal(r.motivo, 'EMAIL_INVALIDO');
  assert.equal(chamadas.length, antes, 'dados inválidos não devem chegar ao banco');
  console.log('todos os testes passaram');
})();
