// cert-page.js — interaction + personalization for the real certification page.
//
// Provides window.mintCert and window.doVerify (referenced by inline onclick in
// the page fragment), plus signed-in personalization that decorates the
// credential ladder with real per-track progress and credentials.
//
// Dark-mode toggle and reveal-on-scroll are provided by www/sections-v3.js and
// are deliberately NOT duplicated here.
//
// Personalization is strictly additive and fail-safe: with no token, a bad
// token, a 401, or any network/parse error it does nothing, so the anonymous
// page renders exactly as authored. It never throws.

(function () {
  'use strict';

  var FREE_TRACKS = ['r-fundamentals', 'tidyverse-practitioner'];

  // ===== 1. mintCert (copied verbatim behavior from the mock) =====
  var minted = false;
  function mintCert() {
    var frame = document.getElementById('certframe');
    var btn = document.getElementById('mintBtn');
    if (!frame) return;
    if (btn) btn.classList.add('gone');
    frame.classList.add('minting');
    setTimeout(function () {
      frame.classList.remove('minting');
      minted = true;
      // make the recipient name editable so it really feels like "yours"
      var nm = document.getElementById('certName');
      if (!nm) return;
      nm.setAttribute('contenteditable', 'true');
      nm.setAttribute('spellcheck', 'false');
      nm.addEventListener('input', function () {
        // keep the verify card name in sync, as a small touch
        var t = nm.textContent.trim() || 'Your Name';
        var meta = document.getElementById('vmeta');
        if (meta) {
          meta.innerHTML = '<b>Certified Tidyverse Practitioner</b> · ' + t +
            '<br>issued 13 June 2026 · assessment 91% · not revoked';
        }
      });
    }, 520);
  }
  window.mintCert = mintCert;

  // let the caption hint trigger the mint + focus too
  function wireCaption() {
    var cap = document.querySelector('.certcap');
    if (!cap) return;
    cap.addEventListener('click', function () {
      var nm = document.getElementById('certName');
      if (!nm) return;
      if (nm.getAttribute('contenteditable') !== 'true' && !minted) { mintCert(); }
      setTimeout(function () { nm.focus(); }, 560);
    });
  }

  // ===== 2. doVerify =====
  // Valid RST-ID -> navigate to the real public verification page (/cert/<id>).
  // Invalid format -> show the mock's inline error state, no navigation.
  function doVerify() {
    var input = document.getElementById('vid');
    var card = document.getElementById('vcard');
    if (!input || !card) return;
    var v = input.value.trim().toUpperCase();
    var ok = /^RST-\d{4}-[A-Z0-9]{6}$/.test(v);
    if (ok) {
      window.location.href = '/cert/' + v;
      return;
    }
    // invalid-state DOM updates (copied from the mock's doVerify)
    var foot = card.querySelector('.vfoot');
    card.classList.add('invalid');
    var vtitle = document.getElementById('vtitle');
    var vmeta = document.getElementById('vmeta');
    if (vtitle) vtitle.textContent = 'Not a valid ID format';
    if (vmeta) vmeta.innerHTML = 'Expected <b>RST-YYYY-XXXXXX</b> (six letters or digits).';
    if (foot) foot.innerHTML = '<svg class="ic ic-sm"><use href="#i-search"/></svg> check the format and try again';
  }
  window.doVerify = doVerify;

  // ===== 3. Auth token read (same approach as www/auth-hydrate.js) =====
  function readAccessToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('sb-') !== 0 || key.lastIndexOf('-auth-token') !== key.length - 11) continue;
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.access_token === 'string') return parsed.access_token;
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
      }
    } catch (_) { /* invalid storage, treat as anon */ }
    return null;
  }

  // ===== 4. Personalization =====
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function clamp(n) {
    n = Number(n);
    if (!isFinite(n) || n < 0) return 0;
    if (n > 100) return 100;
    return Math.round(n);
  }

  function decorateTrack(t) {
    if (!t || !t.id) return;
    var card = document.querySelector('article.track[data-track="' + (window.CSS && CSS.escape ? CSS.escape(t.id) : t.id) + '"]');
    if (!card) return;
    var tright = card.querySelector('.tright');
    if (!tright) return;

    var pct = clamp(t.pct);
    var solved = Number(t.solved) || 0;
    var total = Number(t.total_exercises) || 0;

    // progress row (avoid duplicating if re-run)
    if (!tright.querySelector('.track-prog')) {
      var prog = document.createElement('div');
      prog.className = 'track-prog';
      prog.innerHTML =
        '<div class="bar"><div class="fill" style="width:' + pct + '%"></div></div>' +
        '<div class="lab">' + solved + '/' + total + ' solved · ' + pct + '%</div>';
      // place progress before the CTA so the CTA stays at the bottom
      var cta0 = tright.querySelector('.tcta');
      if (cta0) tright.insertBefore(prog, cta0); else tright.appendChild(prog);
    }

    // CTA update
    var cta = tright.querySelector('.tcta');
    if (cta) {
      if (t.minted && t.minted.verify_url) {
        cta.innerHTML = 'View credential <span class="a">→</span>';
        cta.setAttribute('href', t.minted.verify_url);
        cta.removeAttribute('data-track-claim');
      } else if (t.eligible) {
        cta.innerHTML = 'Claim certificate <span class="a">→</span>';
        cta.setAttribute('href', '#');
        cta.setAttribute('data-track-claim', t.id);
      }
      // else: leave the authored "Explore the track" CTA untouched
    }
  }

  function injectCertMine(count) {
    if (!(count >= 1)) return;
    var section = document.getElementById('tracks');
    if (!section || section.querySelector('.cert-mine')) return;
    var intro = section.querySelector('.blockintro');
    var note = document.createElement('div');
    note.className = 'cert-mine';
    note.innerHTML =
      '<svg class="ic ic-sm"><use href="#i-award"/></svg> You have earned ' + count +
      ' r-statistics.co credential' + (count === 1 ? '' : 's') + '.';
    if (intro && intro.parentNode) {
      intro.parentNode.insertBefore(note, intro.nextSibling);
    } else {
      section.appendChild(note);
    }
  }

  function fetchJson(url, token) {
    return fetch(url, {
      headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' },
      credentials: 'include'
    }).then(function (resp) {
      if (!resp.ok) return null;       // 401 and any non-2xx -> no-op
      return resp.json();
    }).catch(function () { return null; });
  }

  function personalize() {
    var token = readAccessToken();
    if (!token) return;                // anon page stays exactly as authored

    fetchJson('/api/me/tracks', token).then(function (data) {
      if (!data || !Array.isArray(data.tracks)) return;
      data.tracks.forEach(function (t) {
        try { decorateTrack(t); } catch (_) { /* never throw */ }
      });
    }).catch(function () {});

    fetchJson('/api/me/certificates', token).then(function (data) {
      if (!data || !Array.isArray(data.items)) return;
      var active = data.items.filter(function (c) {
        return c && (c.status == null || c.status === 'active');
      });
      try { injectCertMine(active.length); } catch (_) {}
    }).catch(function () {});
  }

  // ===== 5. boot =====
  function init() {
    wireCaption();
    try { personalize(); } catch (_) { /* never throw */ }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
