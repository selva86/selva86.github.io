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
 * Both chips are #dc2626, the red fanout uses on theirs. The chip is the
 * one loud thing in the strip, so it stays one colour whatever it says.
 *
 * To change a message: edit CAMPAIGNS. To change who sees it: edit ROUTES.
 * Bump BAR_VERSION when the set changes materially, so readers who
 * dismissed the old bar see the new one.
 */
(function () {
  'use strict';
  if (window.__rsAnnounce) return;
  window.__rsAnnounce = 1;

  var BAR_VERSION = '2026-11-c';
  var DISMISS_DAYS = 14;

  // No counts in the copy: a number dates the message and invites a reader
  // to audit it. "is live" is the claim that matters.
  var CAMPAIGNS = {
    foundations: {
      chip: 'FREE',
      text: 'R Foundations is free',
      cta: 'Start the course',
      href: '/roadmap/new-to-r.html'
    },
    forecaster: {
      chip: 'LIVE',
      text: 'Forecaster is live',
      cta: 'Start the course',
      href: '/roadmap/forecaster.html'
    },
    analyst: {
      chip: 'LIVE',
      text: 'Data Analyst is live',
      cta: 'Start the course',
      href: '/roadmap/data-analyst.html'
    },
    scientist: {
      chip: 'LIVE',
      text: 'Data Scientist is live',
      cta: 'Start the course',
      href: '/roadmap/data-scientist.html'
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
      '@media(max-width:640px){.rs-announce-in{padding:7px 40px 7px 14px;gap:8px;font-size:13px;min-height:40px}.rs-announce-chip{display:none}}'
    ].join('');
    d.head.appendChild(s);
  }

  function build(key, c) {
    var bar = d.createElement('div');
    bar.className = 'rs-announce';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Site announcement');
    bar.setAttribute('data-campaign', key);

    var inner = d.createElement('div');
    inner.className = 'rs-announce-in';

    var chip = d.createElement('span');
    chip.className = 'rs-announce-chip';
    chip.textContent = c.chip;

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
    a.addEventListener('click', function () {
      try {
        if (window.rsSignal) window.rsSignal('announce_click', { campaign: key });
      } catch (e) { /* the click still navigates */ }
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
    styles();
    d.body.insertBefore(build(key, CAMPAIGNS[key]), d.body.firstChild);
  }

  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
