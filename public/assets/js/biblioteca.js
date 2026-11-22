/* Biblioteca: busca + filtro por função sobre os cartões já presentes no HTML.
   Sem JavaScript, todos os cartões continuam visíveis (melhoria progressiva). Nenhum dado sai do navegador. */
(function () {
  'use strict';
  var lista = document.getElementById('lista-materiais');
  if (!lista) return;

  var cartoes = Array.prototype.slice.call(lista.querySelectorAll('[data-recurso]'));
  var campo = document.getElementById('busca');
  var grupo = document.getElementById('filtros');
  var contagem = document.getElementById('contagem');
  var vazio = document.getElementById('vazio');
  var limpar = document.getElementById('limpar');

  function normalizar(t) {
    return (t || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
  }

  // índice de busca de cada cartão: título, resumo, função, etiquetas e id
  cartoes.forEach(function (c) {
    c._texto = normalizar([c.dataset.recurso, c.dataset.funcao, c.dataset.etiquetas, c.textContent].join(' '));
  });

  // chips gerados a partir dos dados reais dos cartões (não lista funções sem material)
  var funcoes = {};
  cartoes.forEach(function (c) { funcoes[c.dataset.funcao] = (funcoes[c.dataset.funcao] || 0) + 1; });

  function chip(rotulo, valor, n) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.funcao = valor;
    b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<span></span><span class="n" aria-hidden="true"></span>';
    b.firstChild.textContent = rotulo;
    b.lastChild.textContent = n;
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = ' (' + n + (n === 1 ? ' material)' : ' materiais)');
    b.appendChild(sr);
    return b;
  }
  grupo.appendChild(chip('Todas', '', cartoes.length));
  Object.keys(funcoes).sort().forEach(function (f) { grupo.appendChild(chip(f, f, funcoes[f])); });
  grupo.hidden = false;

  var estado = { q: '', funcao: '' };
  var params = new URLSearchParams(location.search);
  estado.q = params.get('q') || '';
  estado.funcao = funcoes[params.get('funcao')] ? params.get('funcao') : '';
  campo.value = estado.q;

  function aplicar(atualizarUrl) {
    var termos = normalizar(estado.q).split(/\s+/).filter(Boolean);
    var visiveis = 0;
    cartoes.forEach(function (c) {
      var ok = (!estado.funcao || c.dataset.funcao === estado.funcao) &&
        termos.every(function (t) { return c._texto.indexOf(t) !== -1; });
      c.hidden = !ok;
      if (ok) visiveis++;
    });
    Array.prototype.forEach.call(grupo.querySelectorAll('.chip'), function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.funcao === estado.funcao));
    });
    vazio.hidden = visiveis !== 0;
    contagem.textContent = visiveis === 1 ? '1 material encontrado' : visiveis + ' materiais encontrados';

    if (atualizarUrl && window.history && history.replaceState) {
      var p = new URLSearchParams(location.search);
      estado.q ? p.set('q', estado.q) : p.delete('q');
      estado.funcao ? p.set('funcao', estado.funcao) : p.delete('funcao');
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }
  }

  campo.addEventListener('input', function () { estado.q = campo.value; aplicar(true); });
  grupo.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (!b) return;
    estado.funcao = b.dataset.funcao;
    aplicar(true);
  });
  limpar.addEventListener('click', function () {
    estado.q = ''; estado.funcao = ''; campo.value = '';
    aplicar(true);
    campo.focus();
  });

  aplicar(false);
})();
