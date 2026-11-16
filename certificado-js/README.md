# Certificado da VI Jornada Acadêmica

O aluno informa **CPF e e-mail** da inscrição; se tiver **pelo menos um check-in**, baixa o certificado em PDF.

## Estrutura

| Pasta | O que tem |
|---|---|
| `web/` | O que roda no navegador (páginas e scripts) |
| `sql/` | O que foi executado no Supabase, em ordem |
| `tests/` | Testes de lógica (rodam sem banco e sem navegador) |
| `tools/` | Ferramentas de apoio, fora do produto |

Arquivos de `web/`:

- `consulta-certificado.html`: página final (formulário, consulta e botão de download).
- `consulta_certificado.js`: `buscarAluno(cpf, email)`, `cpfValido`, `MENSAGENS`.
- `certificado.js`: `gerarCertificado(aluno)`, `criarPDF(nome)`, `aprovado(aluno)`.
- `certificado.html`: página de teste do módulo do PDF, com alunos fictícios.
- `certificado.png`: fundo do certificado (precisa ficar na mesma pasta das páginas).

## Como funciona

1. `buscarAluno(cpf, email)` valida o formato, normaliza e chama a função `consultar_certificado` no Supabase.
2. A função compara CPF e e-mail **dentro do banco** e devolve só `nome` e `presencas` (nunca CPF, e-mail ou id).
3. Com `ok: true`, a página libera o botão e chama `gerarCertificado({ nome, presencas })`.

Respostas de `buscarAluno`:

- Sucesso: `{ ok: true, aluno: { nome, presencas } }`
- Falha: `{ ok: false, motivo }`, com `CPF_INVALIDO`, `EMAIL_INVALIDO`, `DADOS_NAO_CONFEREM`, `SEM_CHECKIN` ou `ERRO_DE_CONSULTA`.

## Regra de elegibilidade

Um check-in na tabela `frequencia` basta. O mínimo fica em `PRESENCAS_MINIMAS` (`web/certificado.js`).
A decisão real é do banco; a checagem no navegador é uma segunda barreira.

## Configuração

1. Em `web/consulta_certificado.js`, preencha `SUPABASE_KEY` com a chave **publishable** (pública).
2. Execute `sql/01_consultar_certificado.sql` no SQL Editor do Supabase.

## Como rodar

Páginas: abra com a extensão **Live Server** do VS Code.

Testes (Node 20.6 ou mais novo), na raiz do projeto:

```
node tests/teste.js
node tests/teste_certificado.js
node --env-file=.env tools/diagnostico.mjs
```

O diagnóstico mostra o que a chave pública enxerga.
