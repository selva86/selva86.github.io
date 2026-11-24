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

  var ready = null;   // Promise, resolved once the Turnstile script has loaded
  var widgets = {};   // host element -> widget id, so one host renders once

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

  /* Resolve with a fresh token for `host`, or '' if Turnstile is off,
   * unreachable, or the visitor fails the challenge. Never rejects: the caller
   * submits either way and the server decides.
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
        function finish(t) { if (!done) { done = true; resolve(t || ''); } }
        setTimeout(function () { finish(''); }, TIMEOUT);
        var id = widgets[host.id];
        try {
          if (id === undefined) {
            id = window.turnstile.render(host, {
              sitekey: SITEKEY,
              appearance: 'interaction-only',
              'error-callback': function () { finish(''); return true; },
              'timeout-callback': function () { finish(''); },
              callback: function (t) { finish(t); },
            });
            if (host.id) widgets[host.id] = id;
          } else {
            /* A second send in the same visit needs a new token: a Turnstile
               token is single-use and the server will refuse a replay. */
            window.turnstile.reset(id);
          }
          var existing = window.turnstile.getResponse(id);
          if (existing) { finish(existing); return; }
          window.turnstile.execute(id, {
            appearance: 'interaction-only',
            callback: function (t) { finish(t); },
            'error-callback': function () { finish(''); return true; },
          });
        } catch (e) {
          finish('');
        }
      });
    }).catch(function () { return ''; });
  }

  window.RSCFormGuard = {
    enabled: function () { return !!SITEKEY; },
    token: token,
  };
}());
