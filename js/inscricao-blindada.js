/* ==========================================================================
   js/inscricao-blindada.js — Blindagem do formulário de inscrição (index.html)
   --------------------------------------------------------------------------
   Complementa o script já existente no index.html (que aplica as máscaras de
   CPF, Telefone e Matrícula com IMask e envia a inscrição ao Supabase) SEM
   alterar aquela lógica. Este arquivo adiciona:

   1. Máscara de NOME COMPLETO  -> só letras (com acento), espaço, hífen e apóstrofo
   2. Máscara de E-MAIL         -> sem espaços, sempre em minúsculas
   3. Validação em tempo real (Bootstrap .is-valid / .is-invalid + mensagens)
      para Nome, E-mail, Telefone, CPF, Matrícula e Curso
   4. Campo "honeypot" invisível contra robôs de spam
   5. Bloqueio do envio enquanto houver campo inválido (rola até o 1º erro)

   Deve ser carregado DEPOIS do script inline do index.html.
   ========================================================================== */
(function () {
  'use strict';

  const form = document.getElementById('form-inscricao');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const campos = {
    nome: $('nome'),
    email: $('email'),
    telefone: $('telefone'),
    cpf: $('cpf'),
    matricula: $('matricula'),
    curso: $('curso')
  };

  const somenteDigitos = (v) => String(v).replace(/\D/g, '');

  // ------------------------------------------------------------------------
  // Regras de validação (cada uma devolve '' se OK ou a mensagem de erro)
  // ------------------------------------------------------------------------
  function cpfValido(valor) {
    const d = somenteDigitos(valor);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (const t of [9, 10]) {
      let soma = 0;
      for (let i = 0; i < t; i++) soma += Number(d[i]) * (t + 1 - i);
      if (((soma * 10) % 11) % 10 !== Number(d[t])) return false;
    }
    return true;
  }

  const REGRAS = {
    nome(v) {
      const limpo = v.trim().replace(/\s+/g, ' ');
      if (!limpo) return 'Informe seu nome completo.';
      const partes = limpo.split(' ').filter((p) => p.replace(/['-]/g, '').length > 0);
      if (partes.length < 2) return 'Digite nome e sobrenome.';
      if (limpo.length < 5) return 'Nome muito curto.';
      return '';
    },
    email(v) {
      if (!v) return 'Informe seu e-mail.';
      if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(v)) return 'E-mail inválido. Ex.: nome@email.com';
      if (/\.\./.test(v) || /^\./.test(v) || /\.@/.test(v)) return 'E-mail inválido. Confira os pontos.';
      return '';
    },
    telefone(v) {
      const d = somenteDigitos(v);
      if (!d) return 'Informe seu telefone com DDD.';
      if (d.length < 11) return 'Digite DDD + 9 dígitos do celular.';
      if (Number(d.slice(0, 2)) < 11) return 'DDD inválido.';
      return '';
    },
    cpf(v) {
      const d = somenteDigitos(v);
      if (!d) return 'Informe seu CPF.';
      if (d.length < 11) return 'CPF incompleto.';
      return cpfValido(d) ? '' : 'CPF inválido. Confira os números.';
    },
    matricula(v) {
      const d = somenteDigitos(v);
      if (!d) return 'Informe sua matrícula.';
      if (d.length < 5) return 'Matrícula muito curta.';
      return '';
    },
    curso(v) {
      return v ? '' : 'Selecione seu curso.';
    }
  };

  // ------------------------------------------------------------------------
  // Mensagens de erro (cria a div .invalid-feedback logo após cada campo)
  // ------------------------------------------------------------------------
  function feedbackDe(campo) {
    let fb = campo.parentElement.querySelector('.invalid-feedback[data-blindagem]');
    if (!fb) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      fb.dataset.blindagem = '';
      fb.id = campo.id + '-erro';
      campo.insertAdjacentElement('afterend', fb);
      campo.setAttribute('aria-describedby', fb.id);
    }
    return fb;
  }

  function validarCampo(nome, mostrarSeVazio) {
    const campo = campos[nome];
    if (!campo) return true;
    const erro = REGRAS[nome](campo.value);
    const vazio = campo.value.trim() === '';

    if (vazio && !mostrarSeVazio) {
      campo.classList.remove('is-valid', 'is-invalid');
      campo.removeAttribute('aria-invalid');
      return !erro;
    }

    campo.classList.toggle('is-invalid', !!erro);
    campo.classList.toggle('is-valid', !erro);
    campo.setAttribute('aria-invalid', erro ? 'true' : 'false');
    campo.setCustomValidity(erro);
    feedbackDe(campo).textContent = erro;
    return !erro;
  }

  // ------------------------------------------------------------------------
  // Máscara de NOME: bloqueia números e símbolos mantendo a posição do cursor
  // ------------------------------------------------------------------------
  function filtrarMantendoCursor(campo, filtro) {
    const original = campo.value;
    const pos = campo.selectionStart ?? original.length;
    const antes = filtro(original.slice(0, pos));
    const novo = filtro(original);
    if (novo !== original) {
      campo.value = novo;
      try { campo.setSelectionRange(antes.length, antes.length); } catch (_) { /* select não suporta */ }
    }
  }

  const filtroNome = (v) => v
    .replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, '') // só letras, acentos, espaço, apóstrofo e hífen
    .replace(/\s{2,}/g, ' ')               // sem espaços duplos
    .replace(/^\s+/, '')                   // sem espaço no início
    .slice(0, 100);

  campos.nome.setAttribute('maxlength', '100');
  campos.nome.setAttribute('autocomplete', 'name');
  campos.nome.setAttribute('autocapitalize', 'words');
  campos.nome.setAttribute('spellcheck', 'false');
  campos.nome.addEventListener('input', () => filtrarMantendoCursor(campos.nome, filtroNome));
  campos.nome.addEventListener('blur', () => {
    campos.nome.value = campos.nome.value.trim().replace(/\s+/g, ' ');
  });

  // ------------------------------------------------------------------------
  // Máscara de E-MAIL: sem espaços, sempre minúsculo
  // ------------------------------------------------------------------------
  const filtroEmail = (v) => v.replace(/\s+/g, '').toLowerCase().slice(0, 120);

  campos.email.setAttribute('maxlength', '120');
  campos.email.setAttribute('autocomplete', 'email');
  campos.email.setAttribute('autocapitalize', 'off');
  campos.email.setAttribute('spellcheck', 'false');
  campos.email.setAttribute('inputmode', 'email');
  campos.email.addEventListener('input', () => filtrarMantendoCursor(campos.email, filtroEmail));

  // Teclados numéricos no celular para os campos que já têm máscara IMask
  campos.telefone.setAttribute('inputmode', 'tel');
  campos.telefone.setAttribute('autocomplete', 'tel-national');
  campos.cpf.setAttribute('inputmode', 'numeric');
  campos.cpf.setAttribute('autocomplete', 'off');
  campos.matricula.setAttribute('inputmode', 'numeric');
  campos.matricula.setAttribute('autocomplete', 'off');

  // ------------------------------------------------------------------------
  // Validação ao vivo: erro aparece ao sair do campo; depois, a cada tecla
  // ------------------------------------------------------------------------
  Object.keys(campos).forEach((nome) => {
    const campo = campos[nome];
    if (!campo) return;
    campo.addEventListener('blur', () => { campo.dataset.tocado = '1'; validarCampo(nome, true); });
    campo.addEventListener('input', () => { if (campo.dataset.tocado) validarCampo(nome, true); });
    campo.addEventListener('change', () => { campo.dataset.tocado = '1'; validarCampo(nome, true); });
  });

  // ------------------------------------------------------------------------
  // Honeypot: campo invisível que pessoas não veem, mas robôs preenchem
  // ------------------------------------------------------------------------
  const honeypot = document.createElement('div');
  honeypot.setAttribute('aria-hidden', 'true');
  honeypot.style.cssText = 'position:absolute!important;left:-10000px!important;width:1px;height:1px;overflow:hidden;';
  honeypot.innerHTML = '<label for="site-empresa">Não preencha este campo</label>' +
    '<input type="text" id="site-empresa" name="site-empresa" tabindex="-1" autocomplete="off" />';
  form.appendChild(honeypot);
  const iniciadoEm = Date.now();

  // ------------------------------------------------------------------------
  // Barreira do envio: roda ANTES do envio original (fase de captura no
  // document) e só deixa passar quando todos os campos estão válidos.
  // ------------------------------------------------------------------------
  document.addEventListener('submit', (e) => {
    if (e.target !== form) return;

    const robo = $('site-empresa').value !== '' || (Date.now() - iniciadoEm) < 1500;
    if (robo) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }

    campos.nome.value = campos.nome.value.trim().replace(/\s+/g, ' ');
    campos.email.value = filtroEmail(campos.email.value);

    let primeiroInvalido = null;
    Object.keys(campos).forEach((nome) => {
      campos[nome].dataset.tocado = '1';
      if (!validarCampo(nome, true) && !primeiroInvalido) primeiroInvalido = campos[nome];
    });

    if (primeiroInvalido) {
      e.preventDefault();
      e.stopImmediatePropagation();
      primeiroInvalido.scrollIntoView({ behavior: 'smooth', block: 'center' });
      primeiroInvalido.focus({ preventScroll: true });
    }
  }, true);

  // Ao limpar o formulário (após inscrição confirmada), remove os estados visuais
  form.addEventListener('reset', () => {
    setTimeout(() => {
      Object.values(campos).forEach((campo) => {
        campo.classList.remove('is-valid', 'is-invalid');
        campo.removeAttribute('aria-invalid');
        campo.setCustomValidity('');
        delete campo.dataset.tocado;
      });
    }, 0);
  });
})();
