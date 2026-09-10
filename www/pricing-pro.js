/* Pro-aware pricing page. Runs on /pricing.html after auth-hydrate fires
   'auth-hydrated' with /api/me. Members see "Your plan." with their plan,
   renewal date, billing link and only the upgrades that exist; everyone
   else sees the page exactly as before. Wording per state is the approved
   sheet in _mocks/pricing-pro-state.html. No markup coupling beyond the
   tier/lifetime/final blocks already on the page. */
(function () {
  'use strict';
  var TRACK = { ds: 'Data Scientist', ts: 'Forecaster', researcher: 'Researcher', developer: 'R Developer' };
  var css = '.tier.held{border:2px solid var(--green);background:var(--tint)}' +
    '.tier.incl{background:var(--bg)}.tier.incl .amt,.tier.incl .tn,.tier.incl .td{color:var(--mut)}.tier.incl li svg{background:#b9c4cf}' +
    '.tier .ribbon.you{background:var(--green-deep)}' +
    '.tier .cta.quiet{background:#fff;color:var(--green);border-color:var(--green)}.tier .cta.quiet:hover{background:var(--tint);color:var(--green)}' +
    '.tier .cta.flat,.tier .cta.flat:hover{background:transparent;border-color:var(--line);color:var(--mut);cursor:default}' +
    '.tier .ctanote{font-size:12.5px;color:var(--mut);text-align:center;margin-top:8px;line-height:1.4}.tier .ctanote b{color:var(--ink);font-weight:600}' +
    '.tier .chip.lock{background:var(--green-deep);border-color:var(--green-deep);color:#fff;cursor:default}' +
    '.pban{background:var(--tint);border-bottom:1px solid var(--green);color:var(--ink)}' +
    '.pban .in{max-width:1120px;margin:0 auto;padding:13px 24px;display:flex;flex-wrap:wrap;align-items:center;gap:6px 18px;font-size:14px}' +
    '.pban .lead{font-weight:600}.pban .sub{color:var(--body)}.pban .acts{margin-left:auto;display:flex;gap:16px;font-weight:600}' +
    '.pban .acts a,.pban .acts button{color:var(--green);background:none;border:0;padding:0;font:inherit;font-weight:600;cursor:pointer;border-bottom:1px solid transparent}' +
    '.pban .acts a:hover,.pban .acts button:hover{border-bottom-color:var(--green)}' +
    '.billnote{margin-top:16px;font-size:13.5px;color:var(--mut);text-align:center}' +
    '.lifetime .lcta.done{background:transparent;color:#6fe0a4;border:1px solid #6fe0a4;cursor:default}' +
    '.lifetime .lnote{display:block;font-size:12px;color:#a9c8b6;max-width:34ch;margin-top:8px}.lifetime .lnote a{color:#6fe0a4;font-weight:600}' +
    '.found{margin:26px 0 0;border:1px solid var(--line);background:#fff;padding:22px 26px;display:flex;flex-wrap:wrap;align-items:center;gap:10px 22px}' +
    '.found p{margin:0;font-size:14.5px;color:var(--ink);max-width:70ch}.found .fcta2{margin-left:auto;background:var(--green);color:#fff;font-weight:600;padding:10px 16px;font-size:14px}.found .fcta2.dark{background:var(--ink)}' +
    'body.rs-member .fbanner,body.rs-member .sitenav .snav-btn,body.rs-member .toggle-wrap,body.rs-member .nudge,body.rs-member .aband,body.rs-member .wbar,body.rs-member .final,body.rs-member .tier .picker,body.rs-member #regionalNote{display:none!important}';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function fmtDate(unix) {
    if (!unix || unix < 0) return '';
    try { return new Date(unix * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; }
  }
  function money(amount, currency) {
    // Paddle amounts are minor units as strings.
    var n = parseInt(amount, 10); if (!isFinite(n)) return '';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' }).format(n / 100); } catch (e) { return (n / 100).toFixed(2) + ' ' + (currency || ''); }
  }
  function tierByPlan(plan) {
    var a = $('.tiers a[data-plan="' + plan + '"], .tiers [data-plan="' + plan + '"]');
    return a ? a.closest('.tier') : null;
  }
  function freeTier() {
    return $$('.tiers .tier').filter(function (t) { var n = $('.tn', t); return n && /^free$/i.test(n.textContent.trim()); })[0] || null;
  }
  function setCta(tier, kind, text, note) {
    // kind: 'flat' | 'quiet' | 'primary' ; replaces the tier's CTA element and
    // returns the new element. The original (with its checkout handler) is
    // removed so no stale click path survives.
    var old = $('.cta', tier); if (!old) return null;
    var el = document.createElement(kind === 'flat' ? 'span' : 'a');
    el.className = 'cta' + (kind === 'quiet' ? ' quiet' : kind === 'flat' ? ' flat' : '');
    if (kind !== 'flat') el.href = '#';
    el.textContent = text;
    old.parentNode.replaceChild(el, old);
    var n = tier.querySelector('.ctanote'); if (n) n.remove();
    if (note) { n = document.createElement('div'); n.className = 'ctanote'; n.innerHTML = note; el.insertAdjacentElement('afterend', n); }
    return el;
  }
  function ribbon(tier, text) {
    var r = $('.ribbon', tier);
    if (!r) { r = document.createElement('span'); r.className = 'ribbon'; tier.insertBefore(r, tier.firstChild); }
    r.className = 'ribbon you'; r.textContent = text;
  }
  function stripRibbon(tier) { var r = $('.ribbon', tier); if (r) r.remove(); }
  function api(path, token, body) {
    var h = { 'Accept': 'application/json' };
    if (token) h['Authorization'] = 'Bearer ' + token;
    if (body) h['Content-Type'] = 'application/json';
    return fetch(path, { method: body ? 'POST' : 'GET', headers: h, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) { return r.json().then(function (j) { j.__status = r.status; return j; }); });
  }
  function manageBilling(el, token) {
    var was = el.textContent; el.textContent = 'Opening billing';
    api('/api/billing/portal', token).then(function (r) {
      if (r && r.url) { location.href = r.url; return; }
      el.textContent = was;
      alertNote(el, 'Billing is not linked to this account yet. Email <a href="mailto:support@r-statistics.co?subject=Billing">support@r-statistics.co</a> and we sort it out.');
    }).catch(function () { el.textContent = was; });
  }
  function alertNote(el, html) {
    var n = el.parentNode.querySelector('.ctanote');
    if (!n) { n = document.createElement('div'); n.className = 'ctanote'; el.insertAdjacentElement('afterend', n); }
    n.innerHTML = html;
  }

  function banner(lead, sub, acts) {
    var nav = $('nav.sitenav, .sitenav, nav') || document.body.firstElementChild;
    var b = document.createElement('div'); b.className = 'pban';
    b.innerHTML = '<div class="in"><span class="lead">' + esc(lead) + '</span><span class="sub">' + esc(sub) + '</span><span class="acts"></span></div>';
    var a = $('.acts', b);
    acts.forEach(function (x) { a.appendChild(x); });
    if (nav && nav.parentNode) nav.parentNode.insertBefore(b, nav.nextSibling); else document.body.insertBefore(b, document.body.firstChild);
  }
  function link(text, href) { var a = document.createElement('a'); a.href = href; a.textContent = text; return a; }
  function btn(text, fn) { var b = document.createElement('button'); b.type = 'button'; b.textContent = text; b.addEventListener('click', fn); return b; }

  function foundStrip(text, ctaText, ctaHref, dark, onClick) {
    var fin = $('.final'); if (!fin) return;
    var d = document.createElement('div'); d.className = 'found';
    d.innerHTML = '<p>' + esc(text) + '</p>';
    var a = document.createElement('a'); a.className = 'fcta2' + (dark ? ' dark' : ''); a.href = ctaHref; a.innerHTML = esc(ctaText) + ' &rarr;';
    if (onClick) a.addEventListener('click', onClick);
    d.appendChild(a);
    fin.parentNode.insertBefore(d, fin);
  }

  function apply(me, token) {
    var plan = me && me.plan; if (!me || !me.user) return;
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var free = freeTier(), single = tierByPlan('single'), aa = tierByPlan('allaccess'), teams = tierByPlan('teams');
    var life = $('.lifetime'), lifeCta = life && $('.lcta', life);
    var h1 = $('.hero h1'), dek = $('.hero .dek');
    var kind = (plan && plan.kind) || 'free';
    var renews = fmtDate(plan && plan.renews_at);
    var manage = 'Renews ' + renews + '. Update your card, download invoices, or cancel.';
    if (plan && plan.will_renew === false && renews) manage = 'Ends ' + renews + ' and will not renew. Update your card, download invoices, or resume.';

    /* ---- Free member: only the Free tier changes ---- */
    if (kind === 'free') {
      if (free) { ribbon(free, 'Your plan'); setCta(free, 'flat', 'You are on this plan'); }
      return;
    }

    document.body.classList.add('rs-member');
    if (h1) h1.innerHTML = 'Your <em>plan</em>.';
    var deks = {
      single: 'Everything in the ' + (TRACK[plan.track] || 'your') + ' track is open to you. The rest of the catalog is one upgrade away.',
      allaccess: 'Every track, every tool, every certificate is open to you. Nothing to buy here unless you want Lifetime.',
      lifetime: 'Every track, every tool, every certificate, and everything added later. Nothing to renew, ever.',
      team: 'Your seat covers every track, every tool, every certificate. Billing is handled by your team admin.'
    };
    if (dek) dek.textContent = deks[kind] || deks.allaccess;
    if (kind !== 'lifetime') {
      var bn = document.createElement('p'); bn.className = 'billnote';
      bn.textContent = 'Prices below are billed ' + (plan.term === 'month' ? 'monthly' : 'annually') + ', the same cycle as your plan.';
      var tw = $('.hero .toggle-wrap'); if (tw) tw.insertAdjacentElement('afterend', bn); else if (dek) dek.insertAdjacentElement('afterend', bn);
    }
    if (free) { stripRibbon(free); setCta(free, 'flat', 'Included in your plan'); free.classList.add('incl'); }

    var dash = link('Go to your dashboard', '/dashboard.html');
    var teamName = plan.team && plan.team.name;

    if (kind === 'single') {
      banner('You are on Single Track Pro, ' + (TRACK[plan.track] || 'one track') + '.', 'Renews ' + renews + '.', [
        btn('Manage billing', function (e) { manageBilling(e.target, token); }), dash]);
      if (single) {
        ribbon(single, 'Your plan'); single.classList.add('held');
        var mb = setCta(single, 'quiet', 'Manage billing', esc(manage));
        if (mb) mb.addEventListener('click', function (e) { e.preventDefault(); manageBilling(mb, token); });
        var pk = $('.picker', single);
        if (pk) { pk.style.display = ''; pk.classList.add('locked'); var ch = $('.chips', pk); if (ch) ch.innerHTML = '<span class="chip lock">' + esc(TRACK[plan.track] || 'Your track') + '</span>'; }
      }
      if (aa) {
        var up = setCta(aa, 'primary', 'Upgrade to All-Access', '<b>You only pay the difference</b> for the rest of your ' + (plan.term === 'month' ? 'month' : 'year') + '. Your renewal date stays ' + esc(renews) + '.');
        var armed = false;
        if (up) up.addEventListener('click', function (e) {
          e.preventDefault(); e.stopImmediatePropagation();
          if (up.getAttribute('aria-busy') === 'true') return;
          up.setAttribute('aria-busy', 'true');
          if (!armed) {
            up.textContent = 'Checking the amount';
            api('/api/billing/upgrade', token, { preview: true }).then(function (r) {
              up.removeAttribute('aria-busy');
              if (!r || !r.ok) { up.textContent = 'Upgrade to All-Access'; alertNote(up, 'Could not check the amount right now. Nothing was charged. Try again in a minute or email <a href="mailto:support@r-statistics.co">support@r-statistics.co</a>.'); return; }
              armed = true;
              up.textContent = 'Confirm upgrade';
              alertNote(up, '<b>' + esc(money(r.amount, r.currency) || 'The difference') + ' today</b>, charged to the card on file. Renews ' + esc(renews) + ' at the All-Access price. Click again to confirm.');
            }).catch(function () { up.removeAttribute('aria-busy'); up.textContent = 'Upgrade to All-Access'; });
            return;
          }
          up.textContent = 'Upgrading';
          api('/api/billing/upgrade', token, {}).then(function (r) {
            if (r && r.ok) { up.textContent = 'Done. You are on All-Access.'; alertNote(up, 'Every track is open now. Reloading.'); setTimeout(function () { location.reload(); }, 1500); return; }
            up.removeAttribute('aria-busy'); armed = false; up.textContent = 'Upgrade to All-Access';
            alertNote(up, 'The upgrade did not go through and nothing was charged. Your card may need updating under Manage billing, or email <a href="mailto:support@r-statistics.co">support@r-statistics.co</a>.');
          }).catch(function () { up.removeAttribute('aria-busy'); armed = false; up.textContent = 'Upgrade to All-Access'; });
        }, true);
      }
      foundStrip('Founding rates close at the first 200 members. Upgrading now keeps you on the founding price for All-Access.', 'Upgrade to All-Access', '#plans', false, function (e) { e.preventDefault(); var t = aa && $('.cta', aa); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.focus(); } });
    }

    if (kind === 'allaccess') {
      banner('You are on All-Access Pro.', 'Renews ' + renews + '.', [btn('Manage billing', function (e) { manageBilling(e.target, token); }), dash]);
      if (single) { setCta(single, 'flat', 'Included in All-Access'); single.classList.add('incl'); }
      if (aa) {
        ribbon(aa, 'Your plan'); aa.classList.add('held');
        var mb2 = setCta(aa, 'quiet', 'Manage billing', esc(manage));
        if (mb2) mb2.addEventListener('click', function (e) { e.preventDefault(); manageBilling(mb2, token); });
      }
    }

    if (kind === 'lifetime') {
      banner('You are a Lifetime member.', 'Nothing to renew, ever.', [dash]);
      if (single) { setCta(single, 'flat', 'Included in Lifetime'); single.classList.add('incl'); }
      if (aa) { stripRibbon(aa); setCta(aa, 'flat', 'Included in Lifetime'); aa.classList.add('incl'); }
    }

    if (kind === 'team') {
      banner('You have an All-Access seat from ' + (teamName || 'your team') + '.', 'Your team admin handles billing.', [dash]);
      if (single) { setCta(single, 'flat', 'Included in All-Access'); single.classList.add('incl'); }
      if (aa) { ribbon(aa, 'Your seat'); aa.classList.add('held'); setCta(aa, 'flat', 'Billed by your team', 'Your seat is active while ' + esc(teamName || 'your team') + ' keeps its plan.'); }
      if (teams) {
        ribbon(teams, 'Your team'); teams.classList.add('held');
        var isAdmin = plan.team && (plan.team.role === 'owner' || plan.team.role === 'admin');
        var tc = setCta(teams, 'quiet', isAdmin ? 'Manage seats' : 'Ask your team admin');
        if (tc) { if (isAdmin) tc.href = '/team.html'; else tc.addEventListener('click', function (e) { e.preventDefault(); }); }
        var sp = $('.tm-seatpick', teams); if (sp) sp.style.display = 'none';
        var tl = $('.tm-line, .bill', teams);
        var line = document.createElement('div'); line.className = 'ctanote';
        line.textContent = (teamName || 'Your team') + ' · ' + (plan.team.seats_used || 0) + ' of ' + (plan.team.seats || 0) + ' seats in use' + (renews ? ' · renews ' + renews : '');
        (tc || tl).insertAdjacentElement('afterend', line);
      }
    }

    /* ---- Lifetime panel ---- */
    if (life) {
      var lk = $('.lk', life), h3 = $('h3', life), p = $('p', life), amt = $('.lp b', life), sm = $('.lp span', life);
      if (kind === 'lifetime') {
        if (lk) lk.textContent = 'Your plan';
        if (h3) h3.textContent = 'Lifetime Pro. Nothing to renew.';
        if (p) p.textContent = 'You joined as one of the first 200 founding members. Every track, tool, and certificate, and everything added later, is yours for as long as the site is online. There is nothing to manage here.';
        if (amt) amt.style.display = 'none'; if (sm) sm.style.display = 'none';
        if (lifeCta) { var done = document.createElement('span'); done.className = 'lcta done'; done.textContent = 'This is your plan'; lifeCta.parentNode.replaceChild(done, lifeCta);
          var ln = document.createElement('span'); ln.className = 'lnote'; ln.innerHTML = 'Need an invoice or want to change your email? <a href="/account.html">Account</a>'; done.insertAdjacentElement('afterend', ln); }
      } else {
        var onSub = kind === 'single' || kind === 'allaccess';
        if (p) p.textContent = onSub
          ? 'Every All-Access feature, every future track and course, for as long as the site is online. Switching from ' + (plan.term === 'month' ? 'monthly' : 'annual') + '? The months you have not used yet are taken off the Lifetime price before you pay. Your ' + (plan.term === 'month' ? 'monthly' : 'annual') + ' plan ends the same day.'
          : 'Every All-Access feature, every future track and course, for as long as the site is online. A personal Lifetime plan stays with you even if your team seat ends.';
        if (lifeCta) {
          lifeCta.innerHTML = 'Go Lifetime &rarr;';
          if (onSub) {
            var ln2 = document.createElement('span'); ln2.className = 'lnote';
            ln2.textContent = 'Your unused ' + (plan.term === 'month' ? 'monthly' : 'annual') + ' months less from this price at checkout.';
            lifeCta.insertAdjacentElement('afterend', ln2);
            lifeCta.addEventListener('click', function (e) {
              e.preventDefault(); e.stopImmediatePropagation();
              if (lifeCta.getAttribute('aria-busy') === 'true') return;
              lifeCta.setAttribute('aria-busy', 'true'); lifeCta.textContent = 'Working out your credit';
              api('/api/billing/lifetime-credit', token, {}).then(function (r) {
                lifeCta.removeAttribute('aria-busy'); lifeCta.innerHTML = 'Go Lifetime &rarr;';
                var codeStr = r && r.code;
                if (codeStr) ln2.textContent = money(r.credit, r.currency) + ' off for your unused time. Applied at checkout.';
                else ln2.textContent = 'No unused time left to credit. Full price applies.';
                if (window.rsOpenCheckout) window.rsOpenCheckout('lifetime', codeStr || null);
                else location.href = '/pricing.html#plans';
              }).catch(function () { lifeCta.removeAttribute('aria-busy'); lifeCta.innerHTML = 'Go Lifetime &rarr;'; ln2.textContent = 'Could not work out the credit. Email support@r-statistics.co and we apply it by hand.'; });
            }, true);
          }
        }
      }
    }

    if (kind === 'allaccess' || kind === 'lifetime' || kind === 'team') {
      foundStrip('Looking for something you cannot find? Every Pro lesson is open to you. If a lesson still asks you to choose a plan, that is a bug on our side.', 'Report it', '/feedback.html', true);
    }
  }

  var done = false;
  document.addEventListener('auth-hydrated', function (e) {
    if (done) return; done = true;
    try { apply(e.detail && e.detail.me, e.detail && e.detail.token); } catch (err) { try { console.warn('[pricing-pro]', err); } catch (e2) {} }
  });
})();
