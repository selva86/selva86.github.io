/* Cloudflare Turnstile for the public forms: the contact page, the feedback
 * page, and the sitewide feedback widget.
 *
 * WHY: on 2026-11-23 a bot posted nine times to /api/feedback and once to
 * /api/contact. It was forging the Origin header, which is one curl flag, so
 * the origin check could not see it. A Turnstile token is the one credential
 * on these forms that a script cannot simply assert, because Cloudflare mints
 * it only after a real browser has run the challenge.
 *
 * DORMANT UNTIL A SITEKEY IS PASTED BELOW. With SITEKEY empty this file
 * renders nothing, asks for nothing, and resolves every request with an empty
 * token, so the forms behave exactly as they did before. The server half
 * (functions/_lib/form-guard.ts) is dormant in the same way until
 * TURNSTILE_SECRET is set. Turning it on is two steps, in this order:
 *
 *   1. Cloudflare dashboard -> Turnstile -> Add widget
 *        domains: r-statistics.co, www.r-statistics.co, r-statistics-co.pages.dev
 *        mode: Managed
 *      Paste the SITE key into SITEKEY below. It is public; it belongs in git.
 *   2. wrangler pages secret put TURNSTILE_SECRET --project-name <project>
 *      Paste the SECRET key. It must never be committed.
 *
 * Step 1 alone shows the challenge without checking it. Step 2 alone rejects
 * nothing, because a missing token is tolerated until flag:form-strict-turnstile
 * is "on". Both, then the flag, is the full sequence.
 *
 * Served with a short cache TTL (see _headers), so edits here ship without a
 * sitewide ?v= sweep across 2,092 HTML files.
 */
(function () {
  'use strict';

  /* PASTE THE TURNSTILE SITE KEY HERE. Empty = everything below is inert. */
  var SITEKEY = '0x4AAAAAAGQF7ec14U3mCv27';

  var API = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__rscTurnstileReady';
  /* A Turnstile outage must never hold a real person's bug report hostage, so
     every path below gives up and returns an empty token. The server tolerates
     that by design while strict mode is off, and fails open if siteverify
     itself is unreachable. */
  var TIMEOUT = 8000;

  var ready = null;    // Promise, resolved once the Turnstile script has loaded
  var widgets = {};    // host id -> widget id, so one host renders once
  var consumed = {};   // host id -> true once its token has been handed out

  function loadApi() {
    if (ready) return ready;
    ready = new Promise(function (resolve, reject) {
      if (window.turnstile) { resolve(); return; }
      window.__rscTurnstileReady = function () { resolve(); };
      var s = document.createElement('script');
      s.src = API;
      s.async = true;
      s.defer = true;
      s.onerror = function () { reject(new Error('turnstile script blocked')); };
      document.head.appendChild(s);
      setTimeout(function () { reject(new Error('turnstile script slow')); }, TIMEOUT);
    });
    return ready;
  }

  /* Render once per host and remember the widget id. Rendering starts the
     challenge straight away, so by the time anyone asks for a token it is
     usually already parked on the widget. */
  function ensure(host) {
    var id = widgets[host.id];
    if (id !== undefined) return id;
    id = window.turnstile.render(host, {
      sitekey: SITEKEY,
      appearance: 'interaction-only',
      /* A token is good for about five minutes. Anyone writing a considered
         bug report will outlast one, and a stale token is worse than no token
         at all: the server refuses a present-but-invalid one in BOTH modes,
         while a missing one is tolerated until strict mode. So replace it
         quietly here rather than hand one over to be rejected. */
      'expired-callback': function () {
        try { window.turnstile.reset(id); } catch (e) { /* nothing to undo */ }
        consumed[host.id] = false;
      },
      'error-callback': function () { return true; },
    });
    if (host.id) { widgets[host.id] = id; consumed[host.id] = false; }
    return id;
  }

  /* Start the challenge early, without waiting for it.
   *
   * WHY: measured against production on 2026-11-24, a warm solve takes about
   * four seconds, and a cold one does not finish inside the 8s budget at all
   * when Cloudflare decides to draw a checkbox, because a checkbox needs a
   * person to click it and no timeout is long enough for that. Asking only at
   * submit time put every bit of that on the critical path. Asking when the
   * visitor first touches the form moves it into the time they spend typing:
   * the script downloads, the challenge runs, and if a checkbox does appear
   * they have the whole of their message to notice it.
   *
   * This is a hint, not a step. It returns nothing, waits for nothing and
   * swallows every failure, so a page that calls it is never worse off than
   * one that does not.
   */
  function prewarm(host) {
    if (!SITEKEY || !host || !host.id || widgets[host.id] !== undefined) return;
    loadApi().then(function () {
      try { ensure(host); } catch (e) { /* a warm-up can only ever help */ }
    }).catch(function () { /* blocked script, slow network: ask again at send */ });
  }

  /* Resolve with a usable token for `host`, or '' if Turnstile is off,
   * unreachable, or the visitor never completed the challenge. Never rejects:
   * the caller submits either way and the server decides.
   *
   * `appearance: interaction-only` keeps the widget invisible for the ordinary
   * visitor and only draws a checkbox when Cloudflare actually wants one, so
   * the common case sees no new UI at all.
   */
  function token(host) {
    if (!SITEKEY || !host) return Promise.resolve('');
    return loadApi().then(function () {
      return new Promise(function (resolve) {
        var done = false;
        function finish(t) {
          if (done) return;
          done = true;
          /* Spent the moment it is handed out. A Turnstile token is single
             use, so the next send has to ask for a new one rather than replay
             this one into a certain refusal. */
          if (t && host.id) consumed[host.id] = true;
          resolve(t || '');
        }
        setTimeout(function () { finish(''); }, TIMEOUT);
        try {
          var id = ensure(host);
          var parked = window.turnstile.getResponse(id);
          var expired = false;
          try { expired = !!window.turnstile.isExpired(id); } catch (e) { expired = false; }
          /* The whole payoff from prewarm: a solved, unspent, unexpired token
             goes straight back with no round trip at all. */
          if (parked && !consumed[host.id] && !expired) { finish(parked); return; }
          if (parked || consumed[host.id] || expired) {
            window.turnstile.reset(id);
            consumed[host.id] = false;
          }
          window.turnstile.execute(id, {
            appearance: 'interaction-only',
            callback: function (t) { finish(t); },
            'error-callback': function () { finish(''); return true; },
            'timeout-callback': function () { finish(''); },
          });
        } catch (e) {
          finish('');
        }
      });
    }).catch(function () { return ''; });
  }

  window.RSCFormGuard = {
    enabled: function () { return !!SITEKEY; },
    prewarm: prewarm,
    token: token,
  };
}());
