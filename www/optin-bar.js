/* optin-bar.js - the daily-lesson opt-in bar (design handoff 2026-10, option 1b,
 * "Peek at tomorrow's email").
 *
 * Loaded by signin-modal.js on tutorial pages only (not lessons, exercise hubs,
 * tools, roadmaps). Short edge TTL (see _headers): edit in place, no ?v sweep.
 *
 * What it does
 *  - Slides up from the bottom once the reader has scrolled 40% of the page.
 *  - Signed out: an email box. Submit records an intent on the server
 *    (/api/optin-bar/intent, keyed by the address) and sends the ordinary
 *    sign-in email (window.rsSignin.magicLink). Clicking that email signs the
 *    reader in; the post-sign-in screen claims the intent, subscribes them and
 *    sends lesson 1 at once. Nothing is subscribed until that click.
 *  - Signed in, not subscribed: one button (/api/me/optin-bar, mode direct).
 *    Readers who said no on the opt-in screen see it at most once a month.
 *  - Subscribed: never shown.
 *  - The x folds it into a small tab for 7 days; the tab reopens it.
 *  - While it is up, the sign-in nudge toast and the feedback pill step aside.
 *
 * Copy follows the real send: Monday to Saturday from the 13:00 UTC run (shown
 * in the reader's clock), about 15 minutes, and real lesson subjects only.
 */
(function () {
  'use strict';
  if (window.rsOptinBar) return;
  window.rsOptinBar = { version: 1 };
  var d = document, html = d.documentElement;
  if (d.querySelector('script[src*="lesson-mode"],script[src*="exercise-hub"]')) return;
  if (d.body && d.body.classList.contains('lesson-mode')) return;

  var DAY = 864e5;
  var K_DISMISS = 'rs-ob-dismissed';   // until: bar folded into the tab
  var K_PENDING = 'rs-ob-pending';     // until: signed-out submit waiting for the email click
  var K_SUB = 'rs-ob-sub';             // until: known subscriber (re-checked monthly)
  var K_SEEN = 'rs-ob-seen';           // when: last shown to a signed-in reader who declined
  function getN(k) { try { return parseInt(localStorage.getItem(k) || '0', 10) || 0; } catch (e) { return 0; } }
  function setN(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }
  var now = Date.now();
  if (getN(K_SUB) > now || getN(K_PENDING) > now) return;
  // A signed-in reader who declined and saw the bar this month: no API call at all.
  if (getN(K_SEEN) > now - 30 * DAY) return;

  function track(name, extra) {
    try { if (window.gtag) window.gtag('event', name, Object.assign({ page_path: location.pathname }, extra || {})); } catch (e) {}
  }
  function token() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (/^sb-.*-auth-token$/.test(k)) {
          var v = JSON.parse(localStorage.getItem(k));
          if (v && typeof v.access_token === 'string') return v.access_token;
          if (Array.isArray(v) && typeof v[0] === 'string') return v[0];
        }
      }
    } catch (e) {}
    return null;
  }

  // ---- what the email card shows: real lessons only --------------------------
  // The series is statistics, regression and time series; there are no
  // visualization or ML lessons, so other pages preview the real first lesson.
  function topicOf() {
    // Home, then the section (a link on some pages, plain text on others).
    var a = d.querySelectorAll('.breadcrumb-nav > :not(.breadcrumb-sep):not(.bc-sep):not(.breadcrumb-current):not(.bc-current)');
    var t = a.length > 1 ? (a[1].textContent || '') : '';
    if (/time series|forecast/i.test(t) || /ARIMA|forecast|time-series/i.test(location.pathname)) return 'ts';
    return t ? t.trim().toLowerCase().slice(0, 40) : 'statistics';
  }
  var TOPIC = topicOf();
  var CARD = TOPIC === 'ts'
    ? { subject: 'ARIMA: what AR, I, and MA actually mean', line: 'In your first week · about 15 minutes' }
    : { subject: 'How statistical inference works, no formulas yet', line: 'Your first lesson · about 15 minutes' };

  // The lesson run is 13:00 UTC, Monday to Saturday; shown in the reader's clock.
  function sendTime() {
    try {
      var s = new Date(Date.UTC(2026, 0, 5, 13, 0, 0));
      var h12 = !/^h2[34]$/.test((Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle) || 'h12');
      var hh = s.getHours(), mm = ('0' + s.getMinutes()).slice(-2);
      return h12 ? ((hh % 12) || 12) + ':' + mm + (hh < 12 ? ' am' : ' pm') : ('0' + hh).slice(-2) + ':' + mm;
    } catch (e) { return ''; }
  }

  var CSS =
    '.ob{position:fixed;left:0;right:0;bottom:0;z-index:1090;transform:translateY(calc(100% + 200px));transition:transform .35s cubic-bezier(.2,.8,.2,1);font-family:"Source Sans 3","IBM Plex Sans",system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.3}' +
    '.ob *{box-sizing:border-box}' +
    '.ob.ob-up{transform:none}' +
    '.ob-band{position:relative;background-color:#0F3F2A;background-image:radial-gradient(rgba(143,224,180,.12) 1px,transparent 1.4px);background-size:14px 14px;color:#fff}' +
    '.ob-peek{position:absolute;left:20px;bottom:100%;width:340px;height:160px;overflow:hidden;pointer-events:none}' +
    '.ob-card{position:absolute;left:10px;bottom:-24px;width:310px;background:#fff;color:#151816;border-radius:16px 16px 0 0;padding:14px 16px 36px;box-shadow:0 -16px 36px -18px rgba(0,0,0,.5);transform:rotate(-1.5deg);transform-origin:left bottom;display:grid;grid-template-columns:36px minmax(0,1fr);gap:12px;align-items:start;text-align:left}' +
    '.ob-av{position:relative;width:36px;height:36px;border-radius:50%;background:#1F6B4A;color:#fff;display:grid;place-items:center;font-family:"Plus Jakarta Sans","Inter Tight",Inter,sans-serif;font-weight:800;font-size:15px}' +
    '.ob-av i{position:absolute;right:-1px;top:-1px;width:11px;height:11px;border-radius:50%;background:#2E9E6A;border:2px solid #fff}' +
    '.ob-ct{min-width:0;display:grid;gap:2px}' +
    '.ob-cfrom{display:flex;justify-content:space-between;gap:8px;font-size:12.5px}' +
    '.ob-cfrom b{font-weight:700;color:#151816}.ob-cfrom span{color:#868C89;white-space:nowrap}' +
    '.ob-csub{font-weight:700;font-size:15px;line-height:1.3;color:#151816}' +
    '.ob-cline{font-size:13px;color:#59605C;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.ob-row{position:relative;display:flex;align-items:center;gap:22px;padding:18px 24px 18px 352px;min-height:84px;max-width:1440px;margin:0 auto}' +
    '.ob-copy{flex:1;min-width:0;display:grid;line-height:1.3}' +
    '.ob-h{font-family:"Plus Jakarta Sans","Inter Tight",Inter,sans-serif;font-weight:800;font-size:18px;letter-spacing:-.01em;color:#fff;margin:0}' +
    '.ob-sub{font-size:14.5px;color:#BFE3CF;margin:0}' +
    '.ob-form{display:flex;flex:none;min-width:0;background:#fff;border-radius:13px;padding:4px;margin:0}' +
    '.ob-form input{width:230px;height:42px;border:0;border-radius:10px;padding:0 12px;margin:0;font:16px "Source Sans 3",system-ui,sans-serif;outline:none;color:#151816;background:#fff;box-shadow:none;min-width:0}' +
    '.ob-form input:focus-visible{box-shadow:inset 0 0 0 2px #8FE0B4}' +
    '.ob-btn{cursor:pointer;height:42px;border:0;border-radius:10px;padding:0 16px;margin:0;background:#1F6B4A;color:#fff;font:700 15px "Source Sans 3",system-ui,sans-serif;white-space:nowrap;box-shadow:none;transition:background .15s}' +
    '.ob-btn:hover{background:#17553A}.ob-btn:disabled{opacity:.7;cursor:wait}' +
    '.ob-btn:focus-visible,.ob-x:focus-visible,.ob-tab:focus-visible{outline:2px solid #8FE0B4;outline-offset:2px}' +
    '.ob-one{display:flex;flex:none;align-items:center}' +
    '.ob-one .ob-btn{height:46px;padding:0 20px;background:#fff;color:#0F3F2A;font-size:15.5px}' +
    '.ob-one .ob-btn:hover{background:#D3EBDD}' +
    '.ob-done{flex:none;font-weight:700;font-size:15.5px;color:#8FE0B4;margin:0}' +
    '.ob-err{position:absolute;right:72px;bottom:100%;margin:0 0 8px;max-width:calc(100% - 32px);background:#fff;color:#8A1C1C;font-size:14px;font-weight:600;padding:7px 12px;border-radius:9px;box-shadow:0 10px 24px -12px rgba(0,0,0,.45)}' +
    '.ob-x{cursor:pointer;width:34px;height:34px;flex:none;border:1px solid rgba(255,255,255,.2);border-radius:10px;background:transparent;color:#BFE3CF;font-size:18px;line-height:1;padding:0;margin:0;box-shadow:none}' +
    '.ob-x:hover{border-color:rgba(255,255,255,.45);color:#fff}' +
    '.ob-tab{position:fixed;left:50%;bottom:0;z-index:1090;transform:translate(-50%,160%);transition:transform .3s;display:flex;align-items:center;gap:8px;border:0;margin:0;cursor:pointer;background:#0F3F2A;color:#fff;border-radius:12px 12px 0 0;padding:9px 18px;font:700 14px "Source Sans 3",system-ui,sans-serif;box-shadow:0 -10px 24px -12px rgba(0,0,0,.4)}' +
    '.ob-tab.ob-up{transform:translate(-50%,0)}' +
    '.ob-tab svg{display:block}' +
    'html.ob-on .rs-nudge:not(.center){display:none!important}' +
    'html.ob-bar .rsfb{visibility:hidden}' +
    '@media (max-width:1180px){.ob-form input{width:180px}.ob-row{gap:18px}}' +
    '@media (max-width:860px){.ob-peek{display:none}.ob-row{padding:14px 16px;flex-wrap:wrap;gap:10px 14px}.ob-copy{order:1;flex:1 1 calc(100% - 60px)}.ob-x{order:2}.ob-form,.ob-one,.ob-done{order:3}.ob-err{right:16px}}' +
    '@media (max-width:520px){.ob-sub{display:none}.ob-h{font-size:16px}.ob-form,.ob-one{order:3;flex:1 1 100%}.ob-form input{flex:1 1 0;width:0}.ob-one .ob-btn{width:100%}.ob-done{order:3;flex:1 1 100%}}' +
    '@media (prefers-reduced-motion:reduce){.ob,.ob-tab{transition:none}}' +
    '@media print{.ob,.ob-tab{display:none!important}}';

  var bar, tab, row, shown = false, mode = '';

  function el(tag, cls, text) { var e = d.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function build(signedIn) {
    var st = el('style'); st.textContent = CSS; d.head.appendChild(st);
    bar = el('div', 'ob');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Daily statistics lesson by email');
    var band = el('div', 'ob-band');
    var t = sendTime();
    band.innerHTML =
      '<div class="ob-peek" aria-hidden="true"><div class="ob-card"><span class="ob-av">A<i></i></span>' +
      '<span class="ob-ct"><span class="ob-cfrom"><b>Akshay, r-statistics.co</b><span></span></span>' +
      '<span class="ob-csub"></span><span class="ob-cline"></span></span></div></div>' +
      '<div class="ob-row"><div class="ob-copy"><p class="ob-h">Get a free statistics lesson by email, six days a week</p>' +
      '<p class="ob-sub">About 15 minutes each, with R code you run in your browser. Unsubscribe anytime.</p></div>' +
      '<p class="ob-err" role="alert" hidden></p>' +
      '<button type="button" class="ob-x" aria-label="Dismiss">×</button></div>';
    band.querySelector('.ob-cfrom span').textContent = t;
    band.querySelector('.ob-csub').textContent = CARD.subject;
    band.querySelector('.ob-cline').textContent = CARD.line;
    row = band.querySelector('.ob-row');
    var x = row.querySelector('.ob-x');
    if (signedIn) {
      var one = el('div', 'ob-one');
      var b = el('button', 'ob-btn', 'Send me the daily lesson'); b.type = 'button';
      one.appendChild(b);
      row.insertBefore(one, x);
      b.addEventListener('click', subscribeDirect);
    } else {
      var f = el('form', 'ob-form');
      f.setAttribute('novalidate', '');
      f.innerHTML = '<input type="email" name="email" required placeholder="you@work.com" aria-label="Email address" autocomplete="email" inputmode="email"><button type="submit" class="ob-btn">Subscribe</button>';
      row.insertBefore(f, x);
      f.addEventListener('submit', subscribeEmail);
    }
    x.addEventListener('click', dismiss);
    bar.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.stopPropagation(); dismiss(); } });
    bar.appendChild(band);
    d.body.appendChild(bar);

    tab = el('button', 'ob-tab');
    tab.type = 'button';
    tab.setAttribute('aria-label', 'Show the free daily lesson sign-up');
    tab.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18v12H3zM3 7l9 6 9-6"/></svg>Free daily lesson<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6"/></svg>';
    tab.addEventListener('click', reopen);
    d.body.appendChild(tab);
  }

  function showBar() {
    html.classList.add('ob-on', 'ob-bar');
    tab.classList.remove('ob-up');
    requestAnimationFrame(function () { bar.classList.add('ob-up'); });
  }
  function showTab() {
    html.classList.add('ob-on');
    html.classList.remove('ob-bar');
    bar.classList.remove('ob-up');
    tab.classList.add('ob-up');
  }
  function dismiss() {
    setN(K_DISMISS, Date.now() + 7 * DAY);
    track('optin_bar_dismiss', { mode: mode });
    var hadFocus = bar.contains(d.activeElement);
    showTab();
    if (hadFocus) { try { tab.focus(); } catch (e) {} }
  }
  function reopen() {
    try { localStorage.removeItem(K_DISMISS); } catch (e) {}
    track('optin_bar_reopen', { mode: mode });
    showBar();
    var f = bar.querySelector('input,.ob-btn');
    if (f) setTimeout(function () { try { f.focus(); } catch (e) {} }, 360);
  }
  function finish(text) {
    var target = bar.querySelector('.ob-form,.ob-one');
    var p = el('p', 'ob-done'); p.setAttribute('role', 'status'); p.textContent = '✓ ' + text;
    if (target) target.parentNode.replaceChild(p, target);
    var er = bar.querySelector('.ob-err'); if (er) er.hidden = true;
    setTimeout(function () {
      bar.classList.remove('ob-up');
      html.classList.remove('ob-on', 'ob-bar');
      setTimeout(function () { try { bar.remove(); tab.remove(); } catch (e) {} }, 400);
    }, 2200);
  }
  function fail(text) {
    var er = bar.querySelector('.ob-err');
    if (er) { er.textContent = text; er.hidden = false; }
  }

  function subscribeEmail(e) {
    e.preventDefault();
    var f = e.currentTarget, input = f.querySelector('input'), btn = f.querySelector('.ob-btn');
    var email = (input.value || '').trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { fail('Enter a valid email address.'); input.focus(); return; }
    if (!window.rsSignin || !window.rsSignin.magicLink) { fail('Sign-up is not available right now. Please try again shortly.'); return; }
    btn.disabled = true; btn.textContent = 'Sending…';
    track('optin_bar_submit', { mode: 'email' });
    fetch('/api/optin-bar/intent', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, topic: TOPIC, page: location.pathname })
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) { throw new Error((j && j.message) || 'Could not save that. Please try again.'); });
      return window.rsSignin.magicLink(email, { next: location.pathname + location.search, trigger: 'optin-bar' });
    }).then(function () {
      setN(K_PENDING, Date.now() + 7 * DAY);
      track('optin_bar_sent');
      finish('Check your inbox and click the link to start.');
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = 'Subscribe';
      var m = (err && err.message) || '';
      track('optin_bar_error', { reason: m.slice(0, 60) });
      fail(/rate|too many|seconds/i.test(m) ? 'Too many sign-up emails just now. Please try again in a minute.' : (m || 'Could not send the email. Please try again.'));
    });
  }

  function subscribeDirect(e) {
    var btn = e.currentTarget, tok = token();
    if (!tok) { location.reload(); return; }
    btn.disabled = true; btn.textContent = 'One moment…';
    track('optin_bar_submit', { mode: 'one-click' });
    fetch('/api/me/optin-bar', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tok, 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'direct', topic: TOPIC, page: location.pathname })
    }).then(function (r) { if (!r.ok) throw new Error('status ' + r.status); return r.json(); })
      .then(function (j) {
        setN(K_SUB, Date.now() + 30 * DAY);
        track('optin_bar_subscribed', { sent_now: !!(j && j.sent_now) });
        finish(j && j.sent_now ? 'You’re in. Your first lesson is in your inbox.' : 'You’re in. Your first lesson arrives with the next send.');
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = 'Send me the daily lesson';
        fail('That did not go through. Please try again.');
      });
  }

  // ---- when to show ----------------------------------------------------------
  function scrolledPct() {
    var h = Math.max(d.documentElement.scrollHeight, d.body.scrollHeight) - window.innerHeight;
    return h > 0 ? (window.scrollY / h) * 100 : 0;   // a page too short to scroll never triggers it
  }
  function blocked() {
    // Consent banner, the sign-in modal or the nudge's centred modal come first.
    var cc = d.getElementById('rs-cc');
    if (cc && getComputedStyle(cc).display !== 'none' && cc.getBoundingClientRect().height > 0) return true;
    if (html.classList.contains('rs-sm-lock')) return true;
    if (d.querySelector('.rs-nudge.center.show')) return true;
    return false;
  }
  var fontsAsked = false;
  function askFonts() {
    if (fontsAsked) return; fontsAsked = true;
    if (d.querySelector('link[href*="Plus+Jakarta+Sans"]')) return;
    var l = el('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@800&family=Source+Sans+3:wght@400;700&display=swap';
    d.head.appendChild(l);
  }

  // Signed in: subscribers never see it; decliners at most once a month.
  function decide() {
    var tok = token();
    if (!tok) return Promise.resolve('email');
    return fetch('/api/me/email-optin', { headers: { Authorization: 'Bearer ' + tok } }).then(function (r) {
      if (r.status === 401) return 'email';
      if (!r.ok) return '';
      return r.json().then(function (s) {
        if (!s) return '';
        if (s.nurture) { setN(K_SUB, Date.now() + 30 * DAY); return ''; }
        if (s.decided) {
          if (Date.now() - getN(K_SEEN) < 30 * DAY) return '';
          setN(K_SEEN, Date.now());
        }
        return 'direct';
      });
    }).catch(function () { return ''; });
  }

  var deciding = false, stopped = false, retry = 0;
  function stop() { stopped = true; window.removeEventListener('scroll', onScroll); clearInterval(retry); }
  function onScroll() {
    if (shown || deciding || stopped) return;
    var pct = scrolledPct();
    if (pct >= 25) askFonts();
    if (pct < 40 || blocked()) return;
    deciding = true;
    decide().then(function (m) {
      if (!m) { stop(); return; }
      mode = m; shown = true;
      stop();
      build(m === 'direct');
      var folded = getN(K_DISMISS) > Date.now();
      if (folded) showTab(); else showBar();
      track('optin_bar_shown', { mode: m, folded: folded });
    }).then(null, function () {}).then(function () { deciding = false; });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  // A blocked moment (consent banner open) re-checks every few seconds.
  retry = setInterval(onScroll, 3000);
  onScroll();
})();
