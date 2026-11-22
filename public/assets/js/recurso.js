/* Botão "Copiar pedido".
   Lógica adaptada do copy-button do Cult UI (MIT, https://www.cult-ui.com/r/copy-button.json):
   Clipboard API com recurso legado via textarea, retorno visual por 2 s e respeito a prefers-reduced-motion
   (a animação fica no CSS). Versão sem React/motion para site estático. */
(function () {
  'use strict';

  function copiaLegada(valor) {
    var ta = document.createElement('textarea');
    ta.value = valor;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, valor.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function copiar(valor) {
    if (!valor) return Promise.resolve(false);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      // se o navegador deixar a promessa pendente (permissão sem resposta), cai no plano B em 1,2 s
      var limite = new Promise(function (resolve) { setTimeout(function () { resolve('tempo'); }, 1200); });
      return Promise.race([navigator.clipboard.writeText(valor).then(function () { return true; }), limite]).then(
        function (r) { return r === true ? true : copiaLegada(valor); },
        function () { return copiaLegada(valor); }
      );
    }
    return Promise.resolve(copiaLegada(valor));
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-copiar]'), function (botao) {
    var alvo = document.getElementById(botao.getAttribute('data-copiar'));
    var aviso = document.getElementById(botao.getAttribute('aria-describedby') || '') ||
      document.getElementById(botao.dataset.aviso);
    var rotulo = botao.querySelector('.rotulo-copiar');
    var original = rotulo ? rotulo.textContent : '';
    var timer;

    botao.addEventListener('click', function () {
      var texto = alvo ? alvo.textContent.replace(/\s+\n/g, '\n').trim() : '';
      copiar(texto).then(function (ok) {
        clearTimeout(timer);
        if (ok) {
          botao.classList.add('feito');
          if (rotulo) rotulo.textContent = 'Copiado';
          if (aviso) aviso.textContent = 'Pedido copiado. Cole no chat da IA e acrescente suas anotações no lugar de [cole aqui].';
        } else {
          if (aviso) aviso.textContent = 'Não foi possível copiar automaticamente. Selecione o texto do pedido e copie com Ctrl+C (ou toque e segure no celular).';
          if (alvo && window.getSelection) {
            var r = document.createRange();
            r.selectNodeContents(alvo);
            var s = window.getSelection();
            s.removeAllRanges();
            s.addRange(r);
          }
        }
        timer = setTimeout(function () {
          botao.classList.remove('feito');
          if (rotulo) rotulo.textContent = original;
        }, 2000);
      });
    });
  });
})();
