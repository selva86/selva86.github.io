// dashboard-page.js - the signed-in dashboard. Fetches the real /api/me/* data
// and renders it. Anonymous visitors are redirected to sign-in. Everything shown
// is real: no fabricated metrics, sessions, or recommendations.
//
// Dark mode + reveal come from the shared sections-v3.js. This file owns the
// dashboard's data + the contextual Pro conversion logic.
(function () {
  'use strict';

  var SIGNIN = '/signin.html?next=/dashboard.html';

  function readAccessToken() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (!key || key.indexOf('sb-') !== 0 || key.slice(-11) !== '-auth-token') continue;
        var raw = localStorage.getItem(key);
        if (!raw) continue;
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed.access_token === 'string') return parsed.access_token;
        if (Array.isArray(parsed) && typeof parsed[0] === 'string') return parsed[0];
      }
    } catch (_) { }
    return null;
  }

  var TOKEN = readAccessToken();
  if (!TOKEN) { location.replace(SIGNIN); return; }

  function fetchJson(url) {
    return fetch(url, { headers: { 'Authorization': 'Bearer ' + TOKEN, 'Accept': 'application/json' }, credentials: 'include' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function num(n) { n = Number(n); return isFinite(n) && n >= 0 ? n : 0; }
  function clampPct(n) { n = Math.round(Number(n) || 0); return n < 0 ? 0 : n > 100 ? 100 : n; }

  function prettifySlug(slug) {
    return String(slug || '').replace(/\.html$/i, '').replace(/[-_]+/g, ' ').trim()
      .replace(/\bin r\b/i, 'in R').replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }
  function fmtDate(ts) {
    if (!ts) return '';
    var d = new Date(ts < 2e10 ? ts * 1000 : ts); // accept seconds or ms
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function el(id) { return document.getElementById(id); }
  function set(id, html) { var e = el(id); if (e) e.innerHTML = html; }

  function animateCount(node, target) {
    target = num(target);
    if (!node) return;
    if (target === 0 || !('requestAnimationFrame' in window)) { node.textContent = target.toLocaleString(); return; }
    var dur = 700, t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min((t - t0) / dur, 1);
      var v = Math.round(target * (1 - Math.pow(1 - p, 3)));
      node.textContent = v.toLocaleString();
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ---- renderers ------------------------------------------------------------

  function renderGreeting(me, stats, isNew) {
    var name = me && me.user && me.user.display_name;
    var g = el('dashGreeting');
    if (g) g.innerHTML = 'Welcome back' + (name ? ', <em>' + esc(name) + '</em>' : '') + '.';
    var sub = el('dashSubline');
    if (!sub) return;
    sub.classList.remove('sk');
    sub.style.maxWidth = '';
    var streak = num(stats && stats.current_streak_days);
    if (isNew) {
      sub.innerHTML = "Let's get your first win on the board, one exercise is all it takes to start.";
    } else if (streak >= 1) {
      sub.innerHTML = "You're on a <span class=\"fire\">" + streak + "-day streak</span>"
        + ' <svg class="ic pulse" style="width:15px;height:15px;color:var(--fire,#f97316);vertical-align:-2px"><use href="#i-flame"/></svg>'
        + ', pick up where you left off.';
    } else {
      sub.innerHTML = 'Pick up where you left off, and start a new streak today.';
    }
  }

  function renderStats(stats, solvedCount, certCount) {
    var solved = num(solvedCount);
    var strip = el('statsStrip');
    if (!strip) return;
    strip.innerHTML =
      '<div class="s"><b id="stSolved">0</b><span>Exercises solved</span></div>' +
      '<div class="s"><b id="stXp">0</b><span>XP earned</span></div>' +
      '<div class="s streak"><b><span id="stStreak">0</span> <svg class="ic"><use href="#i-flame"/></svg></b><span>Current streak</span></div>' +
      '<div class="s"><b id="stCerts">0</b><span>Certificate' + (certCount === 1 ? '' : 's') + '</span></div>';
    animateCount(el('stSolved'), solved);
    animateCount(el('stXp'), num(stats && stats.total_xp));
    var stk = el('stStreak'); if (stk) stk.textContent = num(stats && stats.current_streak_days) + 'd';
    animateCount(el('stCerts'), certCount);
  }

  function renderResume(reading, tracks, isNew) {
    var slot = el('resumeSlot');
    if (!slot) return;
    var item = reading && Array.isArray(reading.items) && reading.items[0];
    if (item && item.slug) {
      var slug = String(item.slug).replace(/\.html$/i, '');
      var title = prettifySlug(slug);
      var where = item.last_section ? ('"' + esc(item.last_section) + '"')
        : (typeof item.scroll_pct === 'number' ? clampPct(item.scroll_pct) + '% read' : 'in progress');
      var pct = typeof item.scroll_pct === 'number' ? clampPct(item.scroll_pct) : 12;
      slot.innerHTML =
        '<div class="card resume">' +
          '<span class="ck">Resume where you left off</span>' +
          '<h2>' + esc(title) + '</h2>' +
          '<div class="clip">' + where + '</div>' +
          '<div class="pbar"><div class="pfill" id="resumeFill"></div></div>' +
          '<a class="btn" href="/' + esc(slug) + '.html">Continue reading <svg class="ic" style="width:16px;height:16px"><use href="#i-arrow-right"/></svg></a>' +
        '</div>';
      setTimeout(function () { var f = el('resumeFill'); if (f) f.style.width = pct + '%'; }, 80);
      return;
    }
    // no active reading -> a "start here" card (delightful, not empty)
    var lead = isNew
      ? { ck: 'Start here', h: 'Find the route that fits you', p: "Tell us where you're headed and we'll sequence the whole library into an order that holds together.", cta: 'Pick your route', href: '/roadmap/' }
      : { ck: 'Next up', h: 'Keep the momentum going', p: 'You have no lesson open right now. Jump back into a track or solve a few exercises.', cta: 'Browse tutorials', href: '/tutorials/' };
    slot.innerHTML =
      '<div class="card resume">' +
        '<span class="ck">' + lead.ck + '</span>' +
        '<h2>' + lead.h + '</h2>' +
        '<div class="clip">' + lead.p + '</div>' +
        '<a class="btn" href="' + lead.href + '">' + lead.cta + ' <svg class="ic" style="width:16px;height:16px"><use href="#i-arrow-right"/></svg></a>' +
      '</div>';
  }

  function renderTracks(tracks) {
    var box = el('tracksProg');
    if (!box) return;
    if (!tracks || !tracks.length) { box.innerHTML = '<div class="empty">Track data unavailable right now.</div>'; return; }

    // milestone: the track closest to its certificate that is not yet there
    var near = null;
    tracks.forEach(function (t) {
      var pct = clampPct(t.pct);
      if (!t.minted && pct < 100 && (!near || pct > clampPct(near.pct))) near = t;
    });
    var sub = el('tracksSub');
    if (sub && near) {
      var needed = Math.max(1, Math.ceil(num(near.total_exercises) * (num(near.threshold) || 0.8)) - num(near.solved));
      if (near.eligible) {
        sub.innerHTML = '<span class="milestone" style="margin-top:2px"><svg class="ic"><use href="#i-trophy"/></svg> You’ve cleared <b>' + esc(near.name) + '</b>, it’s ready to claim.</span>';
      } else {
        sub.innerHTML = '<span class="milestone" style="margin-top:2px"><svg class="ic"><use href="#i-target"/></svg> <b>' + needed + '</b>&nbsp;more exercise' + (needed === 1 ? '' : 's') + ' to earn your <b>' + esc(near.name) + '</b> certificate.</span>';
      }
    }

    var rows = tracks.map(function (t, i) {
      var pct = clampPct(t.pct);
      var minted = t.minted && t.minted.verify_url;
      var snum = minted || pct >= 100
        ? '<div class="snum" style="background:var(--green);border-color:var(--green)"><svg class="ic"><use href="#i-check"/></svg></div>'
        : '<div class="snum" style="background:var(--accent);border-color:var(--accent)">' + (i + 1) + '</div>';
      var sub2 = minted ? 'Certificate earned' :
        t.eligible ? 'Cleared the bar, ready to claim' :
        num(t.solved) + ' of ' + num(t.total_exercises) + ' exercises solved';
      var action = minted
        ? '<a href="' + esc(t.minted.verify_url) + '">View &rarr;</a>'
        : t.eligible
          ? '<a href="/certifications">Claim &rarr;</a>'
          : pct + '%';
      return '<div class="stagerow' + (t.eligible && !minted ? ' eligible' : '') + (minted || pct >= 100 ? ' done' : '') + '">' +
        snum +
        '<div class="sname">' + esc(t.name) + '<span>' + sub2 + '</span></div>' +
        '<div class="sbar"><div class="sfill" data-pct="' + pct + '"></div></div>' +
        '<div class="sp">' + action + '</div>' +
      '</div>';
    }).join('');
    box.innerHTML = rows;
    setTimeout(function () {
      box.querySelectorAll('.sfill').forEach(function (f) { f.style.width = (f.getAttribute('data-pct') || 0) + '%'; });
    }, 90);
  }

  function renderCerts(certs) {
    var active = (certs && Array.isArray(certs.items) ? certs.items : [])
      .filter(function (c) { return c && c.status !== 'revoked'; });  // earned = any non-revoked
    var cc = el('certsCount'); if (cc) cc.textContent = active.length;
    var pl = el('certsPlural'); if (pl) pl.textContent = active.length === 1 ? '' : 's';
    var list = el('certsList');
    if (!list) return active.length;
    if (!active.length) {
      list.innerHTML = '<div class="empty"><div class="ei"><svg class="ic"><use href="#i-trophy"/></svg></div>' +
        'No certificates yet. Clear a track and your first one lands here. <a href="/certifications">See how &rarr;</a></div>';
      return 0;
    }
    list.innerHTML = active.slice(0, 4).map(function (c) {
      var name = esc(c.track_name || prettifySlug(c.track));
      var when = fmtDate(c.issued_at);
      var act = c.verify_url ? '<a class="cact" href="' + esc(c.verify_url) + '">View</a>' : '';
      return '<div class="certrow"><div class="cseal"><svg class="ic"><use href="#i-trophy"/></svg></div>' +
        '<div class="cn"><b>' + name + '</b><span>' + (when ? 'Earned ' + when : 'Verified credential') + '</span></div>' + act + '</div>';
    }).join('');
    return active.length;
  }

  function renderSaved(saved) {
    var items = saved && Array.isArray(saved.items) ? saved.items : [];
    var total = saved && typeof saved.total === 'number' ? saved.total : items.length;
    var sc = el('savedCount'); if (sc) sc.textContent = total;
    var list = el('savedList');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div class="empty"><div class="ei"><svg class="ic"><use href="#i-bookmark"/></svg></div>' +
        'Nothing saved yet. Tap Save on any tutorial to keep it here. <a href="/tutorials/">Browse &rarr;</a></div>';
      return;
    }
    list.innerHTML = items.slice(0, 4).map(function (it) {
      var slug = String(it.slug || '').replace(/\.html$/i, '');
      var ago = it.saved_at ? 'Saved ' + fmtDate(it.saved_at) : 'Saved';
      return '<a href="/' + esc(slug) + '.html"><div class="ri"><svg class="ic"><use href="#i-bookmark"/></svg></div>' +
        '<div class="rt"><b>' + esc(prettifySlug(slug)) + '</b><span>' + ago + '</span></div>' +
        '<span class="par"><svg class="ic" style="width:16px;height:16px"><use href="#i-arrow-right"/></svg></span></a>';
    }).join('');
  }

  function renderPro(me, tracks) {
    var slot = el('proSlot');
    if (!slot) return;
    var isPro = me && me.pro;
    if (isPro) {
      slot.innerHTML =
        '<div class="promember"><svg class="ic"><use href="#i-spark"/></svg>' +
        '<div><b>You’re a Pro member</b><span>Thank you for backing an independent, ad-free R resource.</span></div></div>';
      return;
    }
    // free user: pick the strongest contextual lever
    var eligible = null, furthest = null;
    (tracks || []).forEach(function (t) {
      var pct = clampPct(t.pct);
      if (t.eligible && !(t.minted && t.minted.verify_url)) { if (!eligible || pct > clampPct(eligible.pct)) eligible = t; }
      if (pct > 0 && pct < 100 && (!furthest || pct > clampPct(furthest.pct))) furthest = t;
    });

    var head, lead;
    if (eligible) {
      head = 'You’ve earned ' + esc(eligible.name) + '. Claim it.';
      lead = 'You’ve already cleared the exercises. Pro unlocks the mastery quiz and turns your work into a verifiable certificate with your name on it.';
    } else if (furthest) {
      head = 'You’re ' + clampPct(furthest.pct) + '% through ' + esc(furthest.name) + '.';
      lead = 'Finish the track on Pro to take the mastery quiz and earn a verifiable certificate you can put on LinkedIn.';
    } else {
      head = 'Turn practice into proof.';
      lead = 'Every exercise is free to attempt. Pro is for when you want it to count toward something you can show.';
    }

    slot.innerHTML =
      '<div class="upgrade">' +
        '<span class="ck"><svg class="ic"><use href="#i-spark"/></svg> Go Pro</span>' +
        '<h3>' + head + '</h3>' +
        '<p>' + lead + '</p>' +
        '<ul class="u-list">' +
          '<li><svg class="ic"><use href="#i-check"/></svg> Graded mastery quizzes &amp; verifiable certificates</li>' +
          '<li><svg class="ic"><use href="#i-check"/></svg> Premium project-led courses</li>' +
          '<li><svg class="ic"><use href="#i-check"/></svg> Live office hours, priority support, ad-free</li>' +
        '</ul>' +
        '<a class="u-cta" href="/pricing.html">See Pro <svg class="ic" style="width:16px;height:16px"><use href="#i-arrow-right"/></svg></a>' +
        '<span class="u-note">free to start &middot; cancel anytime</span>' +
      '</div>';
  }

  // ---- boot -----------------------------------------------------------------

  Promise.all([
    fetchJson('/api/me'),
    fetchJson('/api/me/stats'),
    fetchJson('/api/me/tracks'),
    fetchJson('/api/me/certificates'),
    fetchJson('/api/me/reading?kind=in_progress&limit=1'),
    fetchJson('/api/me/saved?limit=4')
  ]).then(function (r) {
    var me = r[0], stats = r[1] || {}, tracksData = r[2], certs = r[3], reading = r[4], saved = r[5];
    if (!me || !me.user) { location.replace(SIGNIN); return; }
    var tracks = tracksData && Array.isArray(tracksData.tracks) ? tracksData.tracks : [];
    // /api/me/tracks returns pct as a 0..1 ratio; the renderers below expect 0..100.
    tracks.forEach(function (t) { if (t) t.pct = clampPct((Number(t.pct) || 0) * 100); });
    // Accurate total solved across ALL hubs (api adds total_solved); fall back to track sum.
    var totalSolved = (tracksData && typeof tracksData.total_solved === 'number')
      ? tracksData.total_solved
      : tracks.reduce(function (a, t) { return a + num(t.solved); }, 0);

    var certCount = renderCerts(certs);
    var hasReading = reading && Array.isArray(reading.items) && reading.items.length > 0;
    var isNew = num(stats.total_xp) === 0 && certCount === 0 && totalSolved === 0 && !hasReading;

    renderGreeting(me, stats, isNew);
    renderStats(stats, totalSolved, certCount);
    renderResume(reading, tracks, isNew);
    renderTracks(tracks);
    renderSaved(saved);
    renderPro(me, tracks);
  }).catch(function () { /* leave skeletons; never throw */ });
})();
