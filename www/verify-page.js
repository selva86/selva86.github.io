// verify-page.js - standalone credential lookup.
// Valid RST-YYYY-XXXXXX -> navigate to the real public verification page
// (/cert/<id>). Invalid format -> inline error, no navigation. Never throws.
(function () {
  'use strict';

  function doVerify() {
    var input = document.getElementById('vid');
    var card = document.getElementById('vcard');
    if (!input) return;
    var v = input.value.trim().toUpperCase();
    var ok = /^RST-\d{4}-[A-Z0-9]{6}$/.test(v);
    if (ok) {
      window.location.href = '/cert/' + v;
      return;
    }
    if (!card) return;
    card.removeAttribute('hidden');
    card.classList.add('invalid');
    var vt = document.getElementById('vtitle');
    var vm = document.getElementById('vmeta');
    var vok = document.getElementById('vok');
    var foot = card.querySelector('.vfoot');
    if (vok) vok.innerHTML = '<svg class="ic"><use href="#i-search"/></svg>';
    if (vt) vt.textContent = 'Not a valid ID format';
    if (vm) vm.innerHTML = 'Expected <b>RST-YYYY-XXXXXX</b>: RST, a year, then six letters or digits.';
    if (foot) foot.innerHTML = '<svg class="ic ic-sm"><use href="#i-search"/></svg> check the format and try again';
  }
  window.doVerify = doVerify;

  // Enter key submits from the input
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target && e.target.id === 'vid') {
      e.preventDefault();
      doVerify();
    }
  });
})();
