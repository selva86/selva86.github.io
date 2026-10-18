/* offer-bar.js - the homepage timed offer bar.
 *
 * Asks /api/offer whether a window is open. The server owns the answer: the
 * deadline is computed from UTC, the discount code is minted per window and
 * expires with it, and anyone who already pays is told "not active" before a
 * code is ever generated. This file only draws what it is told.
 *
 * Deliberately not persuasive-by-default:
 *  - the countdown counts down to a real deadline and then the bar removes
 *    itself, because the code really does stop working at that second;
 *  - dismissing hides it for THIS window only, so it returns with the next
 *    one rather than being gone for a week or nagging on every reload;
 *  - nothing renders at all between windows. No "offer coming soon" teaser.
 *
 * Short edge TTL on /www (see _headers), so this can be edited in place.
 * The bottom opt-in bar never runs on the homepage, so the two cannot stack.
 */
(function () {
  'use strict';
  if (window.rsOfferBar) return;
  window.rsOfferBar = { version: 1 };

  var mount = document.getElementById('rs-offer');
  if (!mount) return;

  var K_DISMISS = 'rs-offer-dismissed';   // value: the window id we hid for
  var timer = null;

  function track(name, extra) {
    try {
      if (window.gtag) window.gtag('event', name, Object.assign({ page_path: location.pathname }, extra || {}));
    } catch (e) {}
  }

  // Two digits, so the clock does not jitter in width as it counts down.
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function parts(secs) {
    if (secs < 0) secs = 0;
    var h = Math.floor(secs / 3600);
    var m = Math.floor((secs % 3600) / 60);
    var s = secs % 60;
    return pad(h) + 'h : ' + pad(m) + 'm : ' + pad(s) + 's';
  }

  function dismissed(id) {
    try { return localStorage.getItem(K_DISMISS) === String(id); } catch (e) { return false; }
  }
  function remember(id) {
    try { localStorage.setItem(K_DISMISS, String(id)); } catch (e) {}
  }

  function teardown() {
    if (timer) { clearInterval(timer); timer = null; }
    mount.innerHTML = '';
    mount.hidden = true;
  }

  function render(d) {
    var endsAt = d.endsAt * 1000;
    var left = Math.round((endsAt - Date.now()) / 1000);
    if (left <= 0) { teardown(); return; }

    var href = '/pricing.html?code=' + encodeURIComponent(d.code) + '&src=offerbar';

    mount.hidden = false;
    mount.innerHTML =
      '<div class="ofb" role="region" aria-label="Limited time offer">' +
        '<span class="ofb-ic" aria-hidden="true">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>' +
        '</span>' +
        '<span class="ofb-tx"><b>' + d.percent + '% off every annual plan.</b> ' +
          'Ends in <span class="ofb-cd" aria-live="off">' + parts(left) + '</span></span>' +
        '<a class="ofb-go" href="' + href + '">Lock in the price</a>' +
        '<button type="button" class="ofb-x" aria-label="Hide this offer">' +
          '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round">' +
          '<path d="M6 6l12 12M18 6L6 18"></path></svg>' +
        '</button>' +
      '</div>';

    var cd = mount.querySelector('.ofb-cd');
    timer = setInterval(function () {
      var n = Math.round((endsAt - Date.now()) / 1000);
      if (n <= 0) { teardown(); track('offer_bar_expired'); return; }
      cd.textContent = parts(n);
    }, 1000);

    mount.querySelector('.ofb-x').addEventListener('click', function () {
      remember(d.endsAt);
      teardown();
      track('offer_bar_dismissed');
    });
    mount.querySelector('.ofb-go').addEventListener('click', function () {
      track('offer_bar_click', { code: d.code });
    });
    track('offer_bar_shown', { code: d.code });
  }

  fetch('/api/offer', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.active || !d.code || !d.endsAt) return;
      // Dismissal is keyed to this window's deadline, so the next window shows
      // again without the reader having to do anything.
      if (dismissed(d.endsAt)) return;
      render(d);
    })
    .catch(function () { /* the homepage is fine without it */ });
})();
