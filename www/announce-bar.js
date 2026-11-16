/* announce-bar.js - the sitewide announcement strip.
 *
 * Its job is the ~32% of landing traffic that arrives on a reference page
 * (the ggplot2 gallery, Install R, the cheat sheet), reads one answer and
 * leaves without ever learning a track exists. Those pages carry navbar
 * links only.
 *
 * Shape follows fanout.sh: a slim light-tinted strip with a bottom border,
 * a status chip, one short "X is live" sentence, and a "Start the course"
 * link. Theirs sits above the navbar at about 44px.
 *
 * Where this goes further than fanout: they show one global message, we
 * pick by page family. Somebody on Install R is offered R Foundations,
 * somebody on an ARIMA page is offered Forecaster, somebody on a ggplot2
 * page is offered Data Analyst. Pages that match nothing fall back to the
 * two general campaigns, alternating round-robin per page load.
 *
 * Loaded by signin-modal.js, which is on ~2,090 pages. Both files have a
 * short edge TTL (see _headers), so the copy and the routes below can be
 * edited in place and ship within ten minutes, with no sitewide ?v sweep.
 *
 * Deliberately NOT sticky, the one place this departs from fanout. Their
 * navbar is one layout they control; ours is sticky on some templates and
 * static on others, and a second sticky strip would fight the ones that
 * are. To match them, add `position:sticky;top:0` to .rs-announce and
 * re-check the tutorial, tool and exercise-hub templates.
 *
 * The chip is #dc2626, the red fanout uses on theirs. It reads LIVE on the
 * course arm, where it is the one loud thing in the strip. On the offer arm
 * it reads the percentage, because LIVE would be describing the wrong noun.
 *
 * TWO ARMS (2026-11-13). Half of readers get the course announcement above;
 * the other half are offered a discount code by email. The bucket is hashed
 * off the anon id, so a reader stays in one arm, and BOTH arms wait on the
 * same /api/bar-offer call even though only one needs it, or the arms would
 * differ by a round trip of drop-off before anybody clicked. The server owns
 * the percentage and whether this reader may be shown a discount at all; see
 * functions/api/bar-offer.ts.
 *
 * To change a message: edit CAMPAIGNS. To change who sees it: edit ROUTES.
 * Bump BAR_VERSION when the set changes materially, so readers who
 * dismissed the old bar see the new one.
 *
 * MEASUREMENT. bar_view fires once per session per path when the strip is
 * inserted, bar_click on the CTA. Both names must exist in the SIGNALS
 * allowlist in functions/api/signal.ts or that endpoint drops them without
 * a word. From 2026-11-11 to 2026-11-13 this file reported nothing at all:
 * it called window.rsSignal, which is a local function inside lesson-mode.js
 * and was never on window, and the name it sent was not allowlisted either.
 */
(function () {
  'use strict';
  if (window.__rsAnnounce) return;
  window.__rsAnnounce = 1;

  var BAR_VERSION = '2026-11-e';
  var CHIP = 'LIVE';   // the badge reads the same whatever the campaign
  var DISMISS_DAYS = 14;

  // No counts in the copy: a number dates the message and invites a reader
  // to audit it. "is live" is the claim that matters.
  var CAMPAIGNS = {
    foundations: {
      text: 'R Foundations is live',
      cta: 'Start the course',
      href: '/roadmap/v2/new-to-r.html'
    },
    forecaster: {
      text: 'Forecaster is live',
      cta: 'Start the course',
      href: '/roadmap/v2/forecaster.html'
    },
    analyst: {
      text: 'Data Analyst is live',
      cta: 'Start the course',
      href: '/roadmap/v2/data-analyst.html'
    },
    scientist: {
      text: 'Data Scientist is live',
      cta: 'Start the course',
      href: '/roadmap/v2/data-scientist.html'
    }
  };

  // First match wins. Patterns are deliberately narrow: a wrong offer is
  // worse than the fallback. Foundations is tested first so a beginner is
  // never routed to Data Scientist; Forecaster before Data Scientist so
  // "time series regression" lands on the right track.
  var ROUTES = [
    { key: 'foundations', re: /(install-r|rstudio|r-syntax|is-r-worth|free-r-courses|learn-r|r-data-types|r-vectors|r-factors|r-lists|r-matrices|r-control-flow|getting-started)/i },
    { key: 'forecaster', re: /(time-series|arima|forecast|garch|kalman|exponential-smoothing|stationarit|acf-and-pacf|cointegration|seasonal|holt-winters)/i },
    { key: 'scientist', re: /(regression|machine-learning|random-forest|gradient-boost|xgboost|classification|clustering|neural-net|causal-inference|conformal|cross-validat)/i },
    { key: 'analyst', re: /(ggplot|visuali|dplyr|tidyverse|wrangl|pipe-operator|cheat-sheet|data-frame|tidyr|stringr|lubridate)/i }
  ];

  // Pages with no family match alternate between these two.
  var FALLBACK = ['forecaster', 'foundations'];

  // Pages where a second bar would crowd the chrome or interrupt a task.
  var HIDE_PATH = /^\/(?:dashboard|account|checkout|signin|verify)(?:[./]|$)/i;

  var d = document;

  /* The anon id every other first-party beacon on the site uses, so a bar row
     and a pricing row belong to the same visitor. */
  function anonId() {
    try {
      var a = localStorage.getItem('rsc-aid');
      if (!a) {
        a = Math.random().toString(36).slice(2, 12);
        localStorage.setItem('rsc-aid', a);
      }
      return a;
    } catch (e) { return ''; }
  }

  /* A local copy of lesson-mode.js's beacon, not a shared global: that file is
     content-hashed into 416 pages, so exporting its helper would mean a full
     rebuild and a sitewide sweep to fix a measurement bug. Same endpoint, same
     anon id key, same payload shape, so the rows are comparable.

     meta is forced to a string because /api/signal's clean() returns null for
     anything else, which is how the old call's {campaign: key} would have
     been stored as NULL even if it had ever fired. */
  function signal(sig, meta, once) {
    try {
      if (once) {
        var k = 'rs-sig:' + sig + ':' + location.pathname;
        if (sessionStorage.getItem(k)) return;
        sessionStorage.setItem(k, '1');
      }
      fetch('/api/signal', {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          s: sig, p: location.pathname, m: String(meta || ''), a: anonId()
        })
      }).catch(function () {});
    } catch (e) { /* measurement must never break the bar */ }
  }

  /* Which arm this reader is in, stable for the life of their anon id. Hashed
     rather than random: a coin flip per page load would put one person in both
     arms and the comparison would mean nothing. No storage at all (private
     window, blocked cookies) falls to the course arm, which is the one that
     needs no server call and makes no promise. */
  function bucket() {
    var a = anonId();
    if (!a) return 'course';
    var h = 0;
    for (var i = 0; i < a.length; i++) h = ((h << 5) - h + a.charCodeAt(i)) | 0;
    return (Math.abs(h) % 2) === 0 ? 'code' : 'course';
  }

  /* Belt and braces over the server's own refusal. /api/bar-offer says no to
     anybody with an active plan, and that is the check that counts. This one
     catches the session cache: a reader who bought ten minutes ago would
     otherwise be shown money off the plan they just paid for. */
  function paying() {
    try {
      return d.body.classList.contains('pro') || d.body.classList.contains('lifetime');
    } catch (e) { return false; }
  }

  var OFFER_TTL = 10 * 60 * 1000;

  /* Cached per session so a reader browsing ten pages costs one invocation
     rather than ten. Ten minutes, not the whole session, so a purchase or the
     flag going off reaches them without a new tab. The timeout falls back to
     "no offer", which renders the course arm: a slow API must not cost the
     strip entirely. */
  function offerState(cb) {
    try {
      var raw = sessionStorage.getItem('rs-bar-offer');
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.t && (Date.now() - o.t) < OFFER_TTL) { cb(o.v); return; }
      }
    } catch (e) { /* fall through to the fetch */ }

    var settled = false;
    function finish(v) {
      if (settled) return;
      settled = true;
      cb(v);
    }
    var timer = setTimeout(function () { finish(null); }, 2500);
    fetch('/api/bar-offer', {
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (v) {
        clearTimeout(timer);
        try { sessionStorage.setItem('rs-bar-offer', JSON.stringify({ t: Date.now(), v: v })); } catch (e) {}
        finish(v);
      })
      .catch(function () { clearTimeout(timer); finish(null); });
  }

  function dismissed() {
    try {
      var v = localStorage.getItem('rs-announce:' + BAR_VERSION);
      return !!v && Date.now() < Number(v);
    } catch (e) { return false; }
  }

  function remember() {
    try {
      localStorage.setItem('rs-announce:' + BAR_VERSION,
        String(Date.now() + DISMISS_DAYS * 864e5));
    } catch (e) { /* private window, blocked storage: show it again */ }
  }

  // Round-robin across page loads, so the fallback two alternate.
  function nextFallback() {
    var k = 'rs-announce-turn';
    try {
      var n = Number(localStorage.getItem(k) || 0) % FALLBACK.length;
      localStorage.setItem(k, String((n + 1) % FALLBACK.length));
      return FALLBACK[n];
    } catch (e) {
      return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
    }
  }

  function chooseKey(path) {
    for (var i = 0; i < ROUTES.length; i++) {
      if (ROUTES[i].re.test(path)) return ROUTES[i].key;
    }
    return nextFallback();
  }

  function styles() {
    if (d.getElementById('rs-announce-css')) return;
    var s = d.createElement('style');
    s.id = 'rs-announce-css';
    s.textContent = [
      '.rs-announce{background:#eef7f2;border-bottom:1px solid rgba(31,122,85,.18);color:#0f1a2b;font:500 13.5px/1.35 Inter,system-ui,sans-serif;position:relative;z-index:60}',
      '.rs-announce-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 46px 8px 18px;min-height:44px;box-sizing:border-box;text-align:center;flex-wrap:wrap}',
      '.rs-announce-chip{flex:none;background:#dc2626;color:#fff;font-weight:700;font-size:10.5px;letter-spacing:.09em;border-radius:4px;padding:3px 7px}',
      '.rs-announce-txt{color:#0f3d2a}',
      '.rs-announce a.rs-announce-cta{display:inline-flex;align-items:center;gap:4px;color:#1f7a55;font-weight:600;text-decoration:none;white-space:nowrap}',
      '.rs-announce-cta span{text-decoration:underline;text-underline-offset:3px;text-decoration-thickness:1px}',
      '.rs-announce-arrow{display:inline-flex;transition:transform .18s ease}',
      '.rs-announce-cta:hover .rs-announce-arrow{transform:translateX(2px)}',
      '@media(prefers-reduced-motion:reduce){.rs-announce-arrow{transition:none}}',
      '.rs-announce a.rs-announce-cta:hover{color:#155c40}',
      '.rs-announce-x{position:absolute;right:10px;top:50%;transform:translateY(-50%);appearance:none;background:none;border:0;color:#6d8a7c;font-size:17px;line-height:1;cursor:pointer;padding:6px 8px;border-radius:4px}',
      '.rs-announce-x:hover{color:#0f3d2a;background:rgba(31,122,85,.10)}',
      '.rs-announce-x:focus-visible,.rs-announce a:focus-visible{outline:2px solid #1f7a55;outline-offset:2px}',
      '.rs-announce button.rs-announce-cta{appearance:none;background:none;border:0;padding:0;font:inherit;cursor:pointer;color:#1f7a55;font-weight:600}',
      '.rs-announce button.rs-announce-cta:hover{color:#155c40}',
      '.rs-announce-form{display:inline-flex;align-items:center;gap:6px}',
      '.rs-announce-email{font:inherit;padding:4px 8px;border:1px solid #BFD9CB;border-radius:4px;background:#fff;color:#0f1a2b;min-width:190px;max-width:46vw}',
      '.rs-announce-email:focus-visible{outline:2px solid #1f7a55;outline-offset:1px}',
      '.rs-announce-send{appearance:none;font:inherit;font-weight:600;cursor:pointer;border:1px solid #1f7a55;background:#1f7a55;color:#fff;padding:4px 10px;border-radius:4px;white-space:nowrap}',
      '.rs-announce-send:hover{background:#155c40;border-color:#155c40}',
      '.rs-announce-send[disabled]{opacity:.6;cursor:default}',
      '.rs-announce-note{color:#6d8a7c;font-size:12.5px}',
      '@media(max-width:640px){.rs-announce-in{padding:7px 40px 7px 14px;gap:8px;font-size:13px;min-height:40px}.rs-announce-chip{display:none}.rs-announce-email{min-width:0;flex:1 1 120px}.rs-announce-note{display:none}}'
    ].join('');
    d.head.appendChild(s);
  }

  function build(key, c, variant) {
    var bar = d.createElement('div');
    bar.className = 'rs-announce';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Site announcement');
    bar.setAttribute('data-campaign', key);
    bar.setAttribute('data-variant', variant || 'course');

    var inner = d.createElement('div');
    inner.className = 'rs-announce-in';

    var chip = d.createElement('span');
    chip.className = 'rs-announce-chip';
    chip.textContent = CHIP;

    var txt = d.createElement('span');
    txt.className = 'rs-announce-txt';
    txt.textContent = c.text;

    var a = d.createElement('a');
    a.className = 'rs-announce-cta';
    a.href = c.href;
    var ctaWords = d.createElement('span');
    ctaWords.textContent = c.cta;
    a.appendChild(ctaWords);
    // The site's own arrow, inline rather than an icon font. fanout loads
    // Phosphor for theirs; one glyph is not worth a font request.
    var arrow = d.createElement('span');
    arrow.className = 'rs-announce-arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="none"'
      + ' stroke="currentColor" stroke-width="1.75" stroke-linecap="round"'
      + ' stroke-linejoin="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>';
    a.appendChild(arrow);
    a.setAttribute('data-announce', key);
    /* Not deduped: every click is a real navigation and worth counting. The
       denominator (bar_view) is deduped per path, so the ratio reads as
       clicks per page that showed the bar. */
    a.addEventListener('click', function () {
      signal('bar_click', key + '|' + (variant || 'course'));
    });

    var x = d.createElement('button');
    x.type = 'button';
    x.className = 'rs-announce-x';
    x.setAttribute('aria-label', 'Dismiss this announcement');
    x.innerHTML = '&times;';
    x.addEventListener('click', function () { remember(); bar.remove(); });

    inner.appendChild(chip);
    inner.appendChild(txt);
    inner.appendChild(a);
    inner.appendChild(x);
    bar.appendChild(inner);
    return bar;
  }

  /* The offer arm. One line, inline, no modal: the same rule price-alert.js
     follows, because a modal over a reference page interrupts the thing the
     reader actually came for. Three states in one slot: the button, the one
     field, and the confirmation with the way onward. */
  function buildOffer(key, offer) {
    var pct = offer.percent;
    var bar = d.createElement('div');
    bar.className = 'rs-announce';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Site announcement');
    bar.setAttribute('data-campaign', key);
    bar.setAttribute('data-variant', 'code');

    var inner = d.createElement('div');
    inner.className = 'rs-announce-in';

    /* The chip names the occasion when there is one, and falls back to the
       plain percent badge when there is not. Both the name and the percent
       come from KV (offer:bar-config), so running BLACK FRIDAY at 31% and
       then CYBER MONDAY at 23% is two writes and no deploy. Nothing seasonal
       is hardcoded here, because a hardcoded name is one somebody has to
       remember to take down. */
    var chip = d.createElement('span');
    chip.className = 'rs-announce-chip';
    chip.textContent = offer.label || (pct + '% OFF');

    /* The percent is the server's, never this file's. The strip and the code
       Paddle actually mints have to agree, and the only way to guarantee that
       is for exactly one of them to be the source of it. */
    var txt = d.createElement('span');
    txt.className = 'rs-announce-txt';
    txt.textContent = 'Get ' + pct + '% OFF your plans.';

    var slot = d.createElement('span');
    slot.className = 'rs-announce-slot';

    var btn = d.createElement('button');
    btn.type = 'button';
    btn.className = 'rs-announce-cta';
    btn.textContent = 'Get your code';

    /* The confirmation doubles as the way onward, which is what the owner
       asked for: the code is in their inbox, and the next thing they need is
       the page where a plan and a track are chosen. */
    function done() {
      txt.textContent = 'Sent. Check your email for the code.';
      slot.textContent = '';
      var go = d.createElement('a');
      go.className = 'rs-announce-cta';
      go.href = '/pricing.html';
      var w = d.createElement('span');
      w.textContent = 'Choose your track';
      go.appendChild(w);
      slot.appendChild(go);
    }

    function fail(msg) {
      var n = d.createElement('span');
      n.className = 'rs-announce-note';
      n.textContent = msg;
      slot.appendChild(n);
    }

    function openForm() {
      signal('bar_code_open', key);
      slot.textContent = '';
      var form = d.createElement('form');
      form.className = 'rs-announce-form';

      var input = d.createElement('input');
      input.type = 'email';
      input.required = true;
      input.className = 'rs-announce-email';
      input.placeholder = 'you@example.com';
      input.setAttribute('aria-label', 'Your email address');

      var send = d.createElement('button');
      send.type = 'submit';
      send.className = 'rs-announce-send';
      send.textContent = 'Send it';

      /* Said once, plainly, where the field is. The address is used for this
         one mail and nothing else, and that has to be visible at the point of
         typing rather than buried in a policy. */
      var note = d.createElement('span');
      note.className = 'rs-announce-note';
      note.textContent = 'Only used to send the code.';

      form.appendChild(input);
      form.appendChild(send);
      form.appendChild(note);
      slot.appendChild(form);
      try { input.focus(); } catch (e) {}

      form.addEventListener('submit', function (ev) {
        ev.preventDefault();
        var email = (input.value || '').trim();
        if (!email || email.indexOf('@') < 0) { try { input.focus(); } catch (e) {} return; }
        send.disabled = true;
        send.textContent = 'Sending';
        fetch('/api/bar-offer', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, a: anonId(), campaign: key })
        })
          .then(function (r) { return r.json().catch(function () { return null; }); })
          .then(function (res) {
            if (res && res.sent) { signal('bar_code_sent', key); done(); return; }
            /* Never silently succeed. A reader told "check your email" who
               gets nothing has no way to tell a bounce from a bug, and will
               wait rather than ask. */
            slot.textContent = '';
            fail('That did not go through. Try again in a moment.');
          })
          .catch(function () {
            slot.textContent = '';
            fail('That did not go through. Try again in a moment.');
          });
      });
    }

    btn.addEventListener('click', openForm);
    slot.appendChild(btn);

    var x = d.createElement('button');
    x.type = 'button';
    x.className = 'rs-announce-x';
    x.setAttribute('aria-label', 'Dismiss this announcement');
    x.innerHTML = '&times;';
    x.addEventListener('click', function () { remember(); bar.remove(); });

    inner.appendChild(chip);
    inner.appendChild(txt);
    inner.appendChild(slot);
    inner.appendChild(x);
    bar.appendChild(inner);
    return bar;
  }

  function init() {
    if (!d.body) return;
    var path = location.pathname;
    if (HIDE_PATH.test(path)) return;
    if (d.body.classList.contains('lesson-mode')) return;
    if (dismissed()) return;
    if (d.querySelector('.rs-announce')) return;

    var key = chooseKey(path);
    // Never advertise the page the reader is already on.
    if (path === CAMPAIGNS[key].href) {
      key = FALLBACK[0] === key ? FALLBACK[1] : FALLBACK[0];
      if (path === CAMPAIGNS[key].href) return;
    }
    /* Both arms wait on this, including the course arm that does not need it.
       See the header: arms that render at different times have different
       drop-off, and the experiment would measure the round trip rather than
       the copy. */
    offerState(function (offer) {
      // A second init (two loaders racing) must not insert a second strip.
      if (d.querySelector('.rs-announce')) return;

      var variant = bucket();
      var eligible = !!(offer && offer.enabled && offer.percent) && !paying();
      if (variant === 'code' && !eligible) variant = 'course';

      styles();
      var bar = variant === 'code'
        ? buildOffer(key, offer)
        : build(key, CAMPAIGNS[key], variant);
      d.body.insertBefore(bar, d.body.firstChild);

      /* After the insert, so an impression is only ever recorded for a strip a
         reader could actually see. Deduped per session per path so a reload
         does not inflate the denominator. The arm recorded is the one SHOWN,
         not the bucket drawn: a reader in the code bucket who already pays is
         counted where they were actually counted, in the course arm. */
      signal('bar_view', key + '|' + variant, true);
    });
  }

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
