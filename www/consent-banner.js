// Cookie consent (EU/UK only) + Google Consent Mode v2 controller.
// Shared by the page template (template-built pages) and the legacy GA pages.
// The Consent Mode *default* (analytics_storage:'denied') is set INLINE in each
// page BEFORE its GA config; this file resolves region and either grants
// immediately (non-EU, no banner) or shows the banner (EU/UK, stays denied ->
// cookieless modeled measurement until the visitor accepts).
(function () {
  var KEY = 'rs-consent';
  function update(state) { if (window.gtag) gtag('consent', 'update', { analytics_storage: state }); }
  function persist(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }

  var choice = get();
  if (choice === 'granted') { update('granted'); return; }
  if (choice === 'denied') { return; } // stay denied -> modeled measurement

  // EU/EEA + UK: the only regions where a consent banner is required.
  var EU = {AT:1,BE:1,BG:1,HR:1,CY:1,CZ:1,DK:1,EE:1,FI:1,FR:1,DE:1,GR:1,HU:1,IE:1,IT:1,LV:1,LT:1,LU:1,MT:1,NL:1,PL:1,PT:1,RO:1,SK:1,SI:1,ES:1,SE:1,IS:1,LI:1,NO:1,GB:1};
  fetch('/cdn-cgi/trace').then(function (r) { return r.text(); }).then(function (t) {
    var m = /(?:^|\n)loc=([A-Z]{2})/.exec(t);
    var cc = m ? m[1] : '';
    if (!EU[cc]) { persist('granted'); update('granted'); } // non-EU: full GA, no banner
    else { showBanner(); }                                  // EU/UK: ask (stays denied until Accept)
  }).catch(function () { showBanner(); });                  // unknown region -> safe: show banner

  function showBanner() {
    if (document.getElementById('rs-cc')) return;
    var st = document.createElement('style');
    st.textContent = '#rs-cc{position:fixed;left:16px;right:16px;bottom:16px;z-index:99999;max-width:560px;margin:0 auto;background:#fff;color:#1a1a1a;border:1px solid #d9dee6;border-radius:12px;box-shadow:0 12px 44px -12px rgba(0,0,0,.32);padding:16px 18px;font-family:"IBM Plex Sans",system-ui,sans-serif;font-size:14px;line-height:1.5}#rs-cc p{margin:0 0 12px}#rs-cc a{color:#2056d2}#rs-cc .row{display:flex;gap:10px}#rs-cc button{font:inherit;font-weight:600;border-radius:8px;padding:9px 16px;cursor:pointer;border:1px solid transparent}#rs-cc .acc{background:#2056d2;color:#fff;flex:1}#rs-cc .rej{background:#fff;border-color:#d9dee6;color:#555}html.dark #rs-cc{background:#161a20;color:#e6e9ef;border-color:#2a2f37}html.dark #rs-cc .rej{background:#161a20;color:#c3cad9;border-color:#2a2f37}';
    document.head.appendChild(st);
    var d = document.createElement('div');
    d.id = 'rs-cc'; d.setAttribute('role', 'dialog'); d.setAttribute('aria-label', 'Cookie consent');
    d.innerHTML = '<p>We use privacy-friendly analytics to see what helps people learn R. Essential sign-in cookies are always on. See our <a href="/privacy.html">Privacy Policy</a>.</p><div class="row"><button class="acc" type="button">Accept analytics</button><button class="rej" type="button">Reject</button></div>';
    document.body.appendChild(d);
    d.querySelector('.acc').addEventListener('click', function () { persist('granted'); update('granted'); d.remove(); });
    d.querySelector('.rej').addEventListener('click', function () { persist('denied'); d.remove(); });
  }
})();
