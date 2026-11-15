// Confere o módulo do PDF (web/certificado.js) e se ele convive com web/consulta_certificado.js.
// Roda sem navegador: o navegador é simulado. Uso:  node tests/teste_certificado.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const assert = require('node:assert/strict');

const ler = (arquivo) => fs.readFileSync(path.join(__dirname, '..', 'web', arquivo), 'utf8');

const alertas = [];
const ctx = vm.createContext({
  alert: (mensagem) => alertas.push(mensagem),
  window: {},
  Image: function () {},
  fetch: async () => ({ ok: true, json: async () => [] }),
});
const rodar = (codigo) => vm.runInContext(codigo, ctx);

// os dois arquivos carregam juntos, sem nomes repetidos
rodar(ler('certificado.js'));
rodar(ler('consulta_certificado.js').replace(/if \(typeof module[\s\S]*$/, ''));

// regra: um check-in basta
assert.equal(rodar('PRESENCAS_MINIMAS'), 1);
assert.equal(rodar('aprovado({ nome: "A", presencas: 1 })'), true);
assert.equal(rodar('aprovado({ nome: "A", presencas: 3 })'), true);
assert.equal(rodar('aprovado({ nome: "A", presencas: 0 })'), false);
assert.equal(rodar('aprovado({ nome: "A" })'), false);                  // sem o campo: não libera
assert.equal(rodar('aprovado({ nome: "A", presencas: "x" })'), false);

(async () => {
  await rodar('gerarCertificado({ nome: "Sem Presenca", presencas: 0 })');
  assert.equal(alertas.length, 1, 'deveria mostrar um aviso');
  assert.ok(alertas[0].includes('Sem Presenca'));
  console.log('todos os testes do certificado passaram');
})();
