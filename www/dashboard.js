// dashboard.js v9 -- the B6 "two rooms" dashboard. Renders /dashboard.html
// from /api/me/* plus /courses.json + /api/nurture/catalog. Auth-gated
// (redirects to /signin if anon); ?demo=1 | ?demo=pro renders fixtures with no
// auth. Loads after roadmap-data.js (RM) + roadmap-curriculum.js (RM2).
//
// Rooms: Today (command hero = next course lesson, today's set + week bars,
// open email lessons with plain-text countdowns) and What you're building
// (credential hero with the guilloche ring, all seven tracks, mini courses
// with the Pro wall, certificate documents, badge coins, all-time numbers,
// last-week recap). One contextual conversion card per room. The daily-series
// opt-in routing lives here now (ported from lesson-shelf.js, which this page
// no longer loads).
(function(){
  'use strict';
  var RM = window.RM || {}, RM2 = window.RM2 || {};
  function $(id){ return document.getElementById(id); }
  function esc(t){ return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
  function fmt(n){ return (n == null ? 0 : n).toLocaleString('en-US'); }
  function fmtDate(sec){ try{ return new Date(sec*1000).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); }catch(e){ return ''; } }
  function ic(id, w, h){ return '<svg width="' + (w||14) + '" height="' + (h||14) + '"><use href="#' + id + '"/></svg>'; }

  // ----- title resolution (curriculum links + sidebar.json) -----
  var inv = {};
  (function(){ [RM.STOP_LINKS, RM2.links].forEach(function(m){ if(!m) return; Object.keys(m).forEach(function(t){ var u = m[t]; if (u && u.charAt(0) === '/') inv[u.toLowerCase()] = t; }); }); })();
  var sbTitle = {};
  function slugHtml(s){ s = String(s).replace(/^\//,''); return /\.html$/.test(s) ? s : s + '.html'; }
  function humanize(s){ return String(s).replace(/\.html$/,'').replace(/[-_]/g,' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); }); }
  function titleFor(slug){ var h = slugHtml(slug); return inv['/' + h.toLowerCase()] || sbTitle[h] || humanize(slug); }
  function postHref(slug){ return '/' + slugHtml(slug); }

  // ----- tracks -----
  var LV = ['foundations','analyst','ds','ts','researcher','developer','mleng'];
  var SLUG = { foundations:'new-to-r', analyst:'data-analyst', ds:'data-scientist', ts:'forecaster', researcher:'researcher', developer:'r-developer', mleng:'ml-engineer' };
  var HUE = { foundations:'var(--found)', analyst:'var(--da)', ds:'var(--ml)', ts:'var(--ts)', researcher:'var(--st)', developer:'var(--dev)', mleng:'var(--mle)' };
  var MONO = { foundations:'R', analyst:'DA', ds:'DS', ts:'F', researcher:'RS', developer:'RD', mleng:'ML' };
  function rolePage(k){ return '/roadmap/' + SLUG[k] + '.html'; }

  // ----- auth plumbing -----
  function readToken(){ try{ for (var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if (!k || k.indexOf('sb-') !== 0 || k.indexOf('-auth-token') < 0) continue; var raw = localStorage.getItem(k); if (!raw) continue; var p = JSON.parse(raw); if (p && typeof p.access_token === 'string') return p.access_token; if (Array.isArray(p) && typeof p[0] === 'string') return p[0]; } }catch(e){} return null; }
  function api(path){ var t = readToken(), h = { Accept:'application/json' }; if (t) h.Authorization = 'Bearer ' + t; return fetch(path, { credentials:'same-origin', headers:h }).then(function(r){ if (r.status === 401){ var e = new Error('401'); e.a401 = true; throw e; } if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); }); }
  function soft(path){ var t = readToken(); if (!t) return Promise.resolve(null); return fetch(path, { headers:{ Authorization:'Bearer ' + t } }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
  function toSignin(){ location.replace('/signin.html?next=/dashboard.html'); }

  var courseFirst = /[?&]start(?:=|&|$)/.test(location.search);
  var isDemo = /[?&]demo=(1|pro)/.test(location.search);

  var S = { me:null, stats:null, tracks:null, certs:null, reading:null, saved:null,
            daily:null, shelf:null, cat:null, courses:null };
  var certBy = {};

  // ----- data helpers -----
  function dayKey(offsetDays){ var d = new Date(Date.now() - offsetDays * 86400e3); return d.toISOString().slice(0, 10); }
  function lastNDays(n){ var m = {}; ((S.stats && S.stats.days) || []).forEach(function(r){ m[r.d] = r; }); var out = []; for (var i = n - 1; i >= 0; i--){ var k = dayKey(i); out.push(m[k] || { d:k, xp:0, solved:0 }); } return out; }
  function hoursLeft(closesAt){ return Math.max(1, Math.round((closesAt * 1000 - Date.now()) / 36e5)); }
  function isPro(){ return document.body.classList.contains('pro') || !!(S.me && S.me.pro); }

  function courseDone(cid){ try{ var s = JSON.parse(localStorage.getItem('rsc-course-v1:' + cid)); return (s && s.completed) || {}; }catch(e){ return {}; } }
  function trackProgress(key){
    var cs = ((S.courses && S.courses.courses) || []).filter(function(c){ return c.roadmap && c.roadmap.track === key; })
      .sort(function(a, b){ return (a.roadmap.section || 0) - (b.roadmap.section || 0); });
    var total = 0, done = 0, resume = null, first = null, nxt = null, seen = false;
    cs.forEach(function(c){ var dn = courseDone(c.course_id);
      (c.lessons || []).slice().sort(function(a, b){ return (a.order || 0) - (b.order || 0); }).forEach(function(l){
        if (l.built === false) return; total++; if (!first) first = l.slug;
        if (dn[l.slug]) done++;
        else if (!resume){ resume = l.slug; seen = true; }
        else if (seen && !nxt) nxt = l.slug; }); });
    return { total:total, done:done, resume:resume || first, next:nxt, first:first, started:done > 0 };
  }
  function activeLessonTrack(){
    var best = null;
    LV.forEach(function(k){
      var p = trackProgress(k);
      if (!p.total || p.done >= p.total) return;
      if (p.started && (!best || p.done > best.p.done)) best = { key:k, p:p };
    });
    if (!best){
      LV.some(function(k){ var p = trackProgress(k); if (p.total && p.done < p.total){ best = { key:k, p:p, fresh:true }; return true; } return false; });
    }
    return best;
  }
  function activeCredTrack(){
    // the furthest-along not-yet-earned track, for the credential hero
    var byId = {}; ((S.tracks && S.tracks.tracks) || []).forEach(function(t){ byId[t.id] = t; });
    var bestK = null, bestPct = -1, bestEntry = null;
    LV.forEach(function(k){ var L = RM.byKey ? RM.byKey(k) : null; if (!L || !L.track) return; if (certBy[L.track]) return;
      var e = byId[L.track], pct = e ? (e.pct || 0) : 0;
      if (pct > bestPct){ bestPct = pct; bestK = k; bestEntry = e; } });
    if (!bestK) return null;
    return { key:bestK, L:RM.byKey(bestK), pct:Math.max(0, bestPct), entry:bestEntry };
  }

  // ================= renders =================
  function renderHello(){
    var st = S.stats || {}, streak = st.current_streak_days || 0, fz = st.streak_freezes || 0;
    var u = (S.me && S.me.user) || {};
    var first = String(u.display_name || (u.email ? u.email.split('@')[0] : '') || '').split(' ')[0];
    var em = streak > 1 ? (streak + ' days in a row.') : (streak === 1 ? 'Day one of a new streak.' : '');
    $('dh-h1').innerHTML = (courseFirst ? 'Welcome' : 'Welcome back') + (first ? ', ' + esc(first) : '') + '.' + (em ? ' <em>' + esc(em) + '</em>' : '');
    var sub = $('dh-sub'); sub.classList.remove('dh-skel');
    var todo = S.daily && S.daily.tasks ? S.daily.tasks.filter(function(t){ return !t.done; }).length : 0;
    if (courseFirst) sub.textContent = 'You are all set. Pick your first lesson below and start learning.';
    else if (streak > 0) sub.textContent = 'Your streak is safe until midnight' +
      (fz ? ', and you have ' + fz + (fz === 1 ? ' freeze' : ' freezes') + ' if life gets in the way' : '') + '.' +
      (todo ? ' ' + (todo === 1 ? 'One set item remains.' : todo + ' set items remain.') : '');
    else sub.textContent = 'Pick up where you left off.';
    if (streak > 0){ $('dh-streakn').textContent = streak; $('dh-streakchip').hidden = false; }
    $('dh-seg').hidden = false;
  }

  function renderCmd(){
    var el = $('dh-cmd');
    var act = activeLessonTrack();
    var rd = S.reading && S.reading.items && S.reading.items[0];
    if (act){
      var L = RM.byKey ? RM.byKey(act.key) : null;
      var pct = act.p.total ? Math.round(100 * act.p.done / act.p.total) : 0;
      $('dh-cmd-k').textContent = act.fresh ? 'Start your course' : 'Next up in your course';
      $('dh-cmd-h').textContent = titleFor(act.p.resume);
      $('dh-cmd-p').textContent = 'Course lesson ' + (act.p.done + 1) + ' of ' + act.p.total +
        (L ? ' in ' + L.cert : '') + '. Every lesson runs real R in your browser.';
      $('dh-cmd-bar').style.width = Math.max(2, pct) + '%';
      var btn = $('dh-cmd-btn'); btn.href = postHref(act.p.resume);
      btn.textContent = act.fresh ? 'Start the course free' : 'Continue the course';
      var todo = S.daily && S.daily.tasks ? S.daily.tasks.filter(function(t){ return !t.done; }).length : 0;
      $('dh-cmd-alt').textContent = todo ? 'or finish the last set item first' : '';
      var then = $('dh-cmd-then');
      if (act.p.next){ then.hidden = false; then.innerHTML = 'After this one: <b>' + esc(titleFor(act.p.next)) + '</b>.'; }
      else then.hidden = true;
      el.hidden = false;
    } else if (rd){
      $('dh-cmd-k').textContent = 'Pick up your reading';
      $('dh-cmd-h').textContent = titleFor(rd.slug);
      $('dh-cmd-p').textContent = 'Tutorial, ' + Math.round(rd.scroll_pct || 0) + '% read' + (rd.last_section ? ', last at ' + rd.last_section : '') + '.';
      $('dh-cmd-bar').style.width = Math.max(2, Math.min(100, Math.round(rd.scroll_pct || 0))) + '%';
      var b2 = $('dh-cmd-btn'); b2.href = postHref(rd.slug); b2.textContent = 'Resume reading';
      $('dh-cmd-alt').textContent = ''; $('dh-cmd-then').hidden = true;
      el.hidden = false;
    } else {
      $('dh-cmd-k').textContent = 'Start learning';
      $('dh-cmd-h').textContent = 'Begin the roadmap';
      $('dh-cmd-p').textContent = 'Pick a track and your first lesson is one click away.';
      $('dh-cmd-bar').style.width = '2%';
      var b3 = $('dh-cmd-btn'); b3.href = '/roadmap/'; b3.textContent = 'Browse the roadmap';
      $('dh-cmd-alt').textContent = ''; $('dh-cmd-then').hidden = true;
      el.hidden = false;
    }
  }

  function renderDaily(){
    var d = S.daily, sec = $('dh-daily');
    if (!d || !d.tasks || !d.tasks.length){ sec.hidden = true; renderWeek(); return; }
    sec.hidden = false;
    var done = d.tasks.filter(function(t){ return t.done; }).length;
    $('dh-daily-aside').textContent = done + ' of ' + d.tasks.length + ' done';
    $('dh-daily-list').innerHTML = d.tasks.map(function(t){
      return '<a class="task' + (t.done ? ' done' : '') + '" href="' + esc(t.href) + '">' +
        '<span class="ck">' + (t.done ? ic('i-check', 11, 11) : '') + '</span>' +
        '<b>' + esc((t.hub || '').replace(/-/g, ' ').replace(/\.html$/, '')) +
        '<i>' + esc((t.track ? t.track + ', ' : '') + (t.reason || '')) + '</i></b>' +
        (t.difficulty ? '<span class="dif">' + esc(t.difficulty) + '</span>' : '') + '</a>';
    }).join('');
    $('dh-daily-bonus').innerHTML = d.all_done
      ? (d.bonus_awarded ? 'All three done. The <b>+' + d.bonus_xp + ' XP</b> bonus is banked.' : 'All three done for today.')
      : 'Finishing all three pays a <b>+' + d.bonus_xp + ' XP</b> bonus.';
    renderWeek();
  }
  function renderWeek(){
    var rows = lastNDays(7), max = 1;
    rows.forEach(function(r){ if (r.xp > max) max = r.xp; });
    var xpW = rows.reduce(function(a, r){ return a + r.xp; }, 0);
    var solW = rows.reduce(function(a, r){ return a + r.solved; }, 0);
    var actW = rows.filter(function(r){ return r.xp > 0 || r.solved > 0; }).length;
    $('dh-week-aside').textContent = fmt(xpW) + ' XP';
    var DAYS = ['S','M','T','W','T','F','S'];
    $('dh-week-bars').innerHTML = rows.map(function(r, i){
      var today = i === rows.length - 1;
      var h = Math.max(3, Math.round((r.xp / max) * 52));
      var lab = today ? 'now' : DAYS[new Date(r.d + 'T00:00:00Z').getUTCDay()];
      return '<div class="wb' + (today ? ' today' : '') + '"><i style="height:' + h + 'px"></i><span>' + lab + '</span></div>';
    }).join('');
    $('dh-week-rows').innerHTML =
      '<div class="wr"><span>Exercises</span><b>' + fmt(solW) + '</b></div>' +
      '<div class="wr"><span>Active days</span><b>' + actW + ' of 7</b></div>';
  }

  function renderOpen(){
    var sec = $('dh-open-sec');
    var open = ((S.shelf && S.shelf.open) || []).slice().sort(function(a, b){ return a.closes_at - b.closes_at; });
    if (!open.length){ sec.hidden = true; renderConvToday(); return; }
    sec.hidden = false;
    var oldest = hoursLeft(open[0].closes_at);
    var pos = S.shelf.position;
    $('dh-open-aside').textContent = open.length + ' open' + (pos != null ? ', day ' + pos + ' of 87' : '') +
      (open.length > 1 ? ', the oldest closes in ' + oldest + 'h' : '');
    var show = open.slice(0, 3);
    $('dh-open').innerHTML = show.map(function(o){
      var hl = hoursLeft(o.closes_at);
      return '<a class="mini" href="/' + esc(o.slug) + '.html">' +
        '<span class="ic">' + ic('i-mail') + '</span>' +
        '<span class="tx"><b>' + esc(o.subject) + '</b><small>email lesson, day ' + o.seq +
        (o.course ? ', ' + esc(String(o.course).replace(/-/g, ' ')) : '') + '</small></span>' +
        '<span class="cd' + (hl <= 24 ? ' hot' : '') + '">' + hl + 'h left</span></a>';
    }).join('');
    var more = $('dh-open-more');
    if (open.length > 3){
      more.hidden = false;
      more.innerHTML = '<span>' + (open.length - 3) + ' more, sorted by closing time.</span><a href="/account.html#lessons">View all ' + open.length + ' &rarr;</a>';
    } else more.hidden = true;
    renderConvToday();
  }

  function renderReading(){
    var rd = S.reading && S.reading.items && S.reading.items[0];
    var sec = $('dh-reading-sec');
    var act = activeLessonTrack();
    // when reading IS the hero (no course in progress), skip the rail card
    if (!rd || !act){ sec.hidden = true; return; }
    sec.hidden = false;
    var pct = Math.max(2, Math.min(100, Math.round(rd.scroll_pct || 0)));
    $('dh-reading-aside').textContent = pct + '% read';
    $('dh-reading').innerHTML = '<a class="mini" href="' + postHref(rd.slug) + '" style="border:0;padding-top:8px">' +
      '<span class="ic">' + ic('i-book') + '</span>' +
      '<span class="tx"><b>' + esc(titleFor(rd.slug)) + '</b><small>tutorial' + (rd.last_section ? ', ' + esc(rd.last_section) : '') + '</small></span>' +
      '<span class="cd">' + pct + '%</span></a>';
  }

  function renderSaved(){
    var items = (S.saved && S.saved.items) || [];
    var total = S.saved && S.saved.total != null ? S.saved.total : items.length;
    $('dh-saved-aside').textContent = String(total);
    $('dh-saved').innerHTML = items.length ? items.slice(0, 4).map(function(it){
      return '<a class="srow" href="' + postHref(it.slug) + '">' + ic('i-mark', 13, 13) + '<b>' + esc(titleFor(it.slug)) + '</b></a>';
    }).join('') : '<div class="empty">Nothing saved yet. Bookmark a tutorial to read later.</div>';
    var more = $('dh-saved-more');
    if (total > 4){ more.hidden = false; more.innerHTML = '<span>' + (total - 4) + ' more</span><a href="/saved-posts.html">View all &rarr;</a>'; }
    else more.hidden = true;
  }

  function renderConvToday(){
    var host = $('dh-conv-today');
    if (isPro()){ host.innerHTML = ''; return; }
    var open = ((S.shelf && S.shelf.open) || []).slice().sort(function(a, b){ return a.closes_at - b.closes_at; });
    if (open.length >= 2 && hoursLeft(open[0].closes_at) <= 48){
      var hl = hoursLeft(open[0].closes_at);
      host.innerHTML = '<div class="card conv rise" style="animation-delay:.09s">' +
        '<h3>Your oldest email lesson closes in ' + hl + ' hours</h3>' +
        '<p>' + open.length + ' lessons are open right now. Pro keeps every lesson open for good, so nothing you meant to read slips away.</p>' +
        '<a href="/pricing.html?from=dash-window">See the Program &rarr;</a></div>';
    } else host.innerHTML = '';
  }

  function renderCred(){
    var el = $('dh-cred');
    var a = activeCredTrack();
    if (!a){ el.hidden = true; return; }
    el.hidden = false;
    var pct = Math.round(a.pct);
    $('dh-cred-pct').textContent = pct + '%';
    $('dh-cred-ring').setAttribute('stroke-dashoffset', Math.round(339 * (1 - Math.min(100, Math.max(0, a.pct)) / 100)));
    $('dh-cred-h').textContent = a.L.cert;
    $('dh-cred-p').textContent = (a.entry && a.entry.eligible)
      ? 'You are eligible to claim this certificate. It is public, and anyone can verify it.'
      : 'Graded practice in the ' + a.L.persona + ' track counts toward it. The certificate is public, and anyone can verify it.';
    var p = trackProgress(a.key);
    var facts = [];
    if (p.total) facts.push('<span><b>' + p.done + '</b> of ' + p.total + ' lessons done</span>');
    facts.push('<span><b>' + fmt((S.tracks && S.tracks.total_solved) || 0) + '</b> exercises solved</span>');
    var earned = ((S.certs && S.certs.items) || []).length;
    if (earned) facts.push('<span><b>' + earned + '</b> earned before it</span>');
    $('dh-cred-fact').innerHTML = facts.join('');
  }

  function fmtPct(v){ v = +v || 0; return String(Math.round(v * 10) / 10).replace(/\.0$/, ''); }
  function renderStages(){
    var byId = {}; ((S.tracks && S.tracks.tracks) || []).forEach(function(t){ byId[t.id] = t; });
    var earnedN = 0, movingN = 0;
    var html = LV.map(function(k){
      var L = RM.byKey ? RM.byKey(k) : null; if (!L) return '';
      var tid = L.track, entry = tid ? byId[tid] : null, earned = !!(tid && certBy[tid]);
      var pct = earned ? 100 : (entry ? (entry.pct || 0) : 0);
      if (earned) earnedN++; else if (pct > 0) movingN++;
      var sub = earned ? (esc(L.cert) + ' earned')
        : (entry && entry.eligible) ? ('Ready to claim ' + esc(L.cert))
        : pct > 0 ? (fmtPct(pct) + '% to ' + esc(L.cert))
        : esc(L.cert) + ', not started';
      var cls = earned ? ' class="earn"' : (entry && entry.eligible ? ' class="claim"' : '');
      return '<a class="stage" style="--cc:' + HUE[k] + '" href="' + rolePage(k) + '">' +
        '<span class="mk">' + MONO[k] + '</span><b>' + esc(L.persona) + '</b>' +
        '<span class="pb"><i style="width:' + Math.max(pct > 0 ? 2 : 0, Math.min(100, pct)) + '%"></i></span>' +
        '<small' + cls + '>' + sub + '</small></a>';
    }).join('');
    $('dh-stages').innerHTML = html;
    $('dh-stages-aside').textContent = earnedN + ' earned' + (movingN ? ', ' + movingN + ' in motion' : '');
  }

  function renderCatalog(){
    var sec = $('dh-cat-sec');
    var courses = (S.cat && S.cat.courses) || [];
    if (!courses.length){ sec.hidden = true; return; }
    sec.hidden = false;
    var pro = isPro();
    var earned = {}; ((S.shelf && S.shelf.badges) || []).forEach(function(b){ earned[b.badge] = b; });
    $('dh-cat-aside').textContent = courses.length + ' courses' +
      (Object.keys(earned).length ? ', ' + Object.keys(earned).length + ' badges earned' : '');
    $('dh-cat').innerHTML = courses.map(function(c){
      var built = (c.parts || []).filter(function(p){ return p.status === 'built'; });
      var b = earned[c.id];
      var st, href = null, won = '';
      if (b){ st = '<span class="st g">Badge earned ' + fmtDate(b.earned_at) + '</span>'; href = '/badge/' + esc(b.public_id); won = ' won'; }
      else if (pro && built.length){ st = '<span class="st g">' + built.length + ' of ' + (c.parts || []).length + ' lessons ready</span>'; href = '/' + esc(built[0].slug) + '.html'; }
      else if (pro){ st = '<span class="st m">In production</span>'; }
      else { st = '<span class="st p">Part of Pro</span>'; href = '/pricing.html?from=minicourses'; }
      var inner = (b ? '<span class="tick">' + ic('i-check', 9, 9) + '</span>' : '') +
        '<b>' + esc(c.title) + '</b><small>' + (c.parts || []).length + ' email lessons</small>' + st;
      return href ? ('<a class="mc' + won + '" href="' + href + '" data-mc="' + esc(c.id) + '">' + inner + '</a>')
                  : ('<div class="mc">' + inner + '</div>');
    }).join('');
  }

  function renderCerts(){
    var items = (S.certs && S.certs.items) || [];
    var u = (S.me && S.me.user) || {};
    var name = u.display_name || '';
    $('dh-certs').innerHTML = items.length ? items.map(function(c){
      var tname = c.track_name || c.track || '';
      var initials = String(tname).split(/\s+/).filter(function(w){ return /^[A-Za-z]/.test(w); }).map(function(w){ return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
      var meta = ['<span>' + fmtDate(c.issued_at) + '</span>'];
      if (c.score != null) meta.push('<span>score <b>' + c.score + '%</b></span>');
      if (c.public_id) meta.push('<span>' + esc(c.public_id) + '</span>');
      var vurl = c.verify_url || (c.public_id ? '/cert/' + c.public_id : null);
      if (vurl) meta.push('<a class="share" href="' + esc(vurl) + '">Share &rarr;</a>');
      return '<div class="doc"><div class="top"><span class="lbl">Certificate</span><span class="seal">' + esc(initials) + '</span></div>' +
        '<h3>' + esc(tname) + '</h3>' +
        (name ? '<div class="to">Awarded to ' + esc(name) + '</div>' : '') +
        '<div class="meta">' + meta.join('') + '</div></div>';
    }).join('') : '<div class="empty">No certificates yet. Finish a track to earn your first.</div>';
  }

  function renderBadges(){
    var badges = (S.shelf && S.shelf.badges) || [];
    var sec = $('dh-badges-sec');
    if (!badges.length){ sec.hidden = true; return; }
    sec.hidden = false;
    var titleById = {}; ((S.cat && S.cat.courses) || []).forEach(function(c){ titleById[c.id] = c.title; });
    $('dh-badges-aside').textContent = badges.length + ' earned';
    $('dh-badges').innerHTML = badges.map(function(b){
      var t = titleById[b.badge] || String(b.badge).replace(/-/g, ' ');
      var initials = String(t).split(/\s+/).filter(function(w){ return /^[A-Za-z]/.test(w); }).map(function(w){ return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
      return '<a class="coin" href="/badge/' + esc(b.public_id) + '"><span class="c">' + esc(initials) + '</span><b>' + esc(t) + '</b><small>' + fmtDate(b.earned_at) + '</small></a>';
    }).join('');
  }

  function renderAllTime(){
    var st = S.stats || {};
    $('dh-alltime').innerHTML =
      '<div class="wr"><span>XP earned</span><b>' + fmt(st.total_xp || 0) + '</b></div>' +
      '<div class="wr"><span>Exercises solved</span><b>' + fmt((S.tracks && S.tracks.total_solved) || 0) + '</b></div>' +
      '<div class="wr"><span>Longest streak</span><b>' + fmt(st.longest_streak_days || 0) + ' days</b></div>' +
      '<div class="wr"><span>Streak freezes banked</span><b>' + fmt(st.streak_freezes || 0) + '</b></div>';
  }

  function renderRecap(){
    var sec = $('dh-recap');
    var wk = lastNDays(14).slice(0, 7);
    var xp = wk.reduce(function(a, r){ return a + r.xp; }, 0);
    var sol = wk.reduce(function(a, r){ return a + r.solved; }, 0);
    var act = wk.filter(function(r){ return r.xp > 0 || r.solved > 0; }).length;
    if (!xp && !sol){ sec.hidden = true; return; }
    sec.hidden = false;
    $('dh-recap-aside').textContent = act + ' of 7 days';
    $('dh-recap-p').textContent = act >= 5
      ? ('A strong week: ' + act + ' active days, ' + fmt(sol) + ' exercises, and ' + fmt(xp) + ' XP.')
      : act >= 3 ? ('A steady week: ' + act + ' active days and ' + fmt(sol) + ' exercises.')
      : ('A quiet week: ' + fmt(xp) + ' XP. One exercise today restarts the rhythm.');
  }

  function renderUpsell(){
    var el = $('dh-upsell');
    if (S.me && S.me.team){
      var tManage = S.me.team.role === 'owner' || S.me.team.role === 'admin';
      el.innerHTML = '<div class="card conv rise" style="animation-delay:.24s">' +
        '<h3>' + (tManage ? 'Manage your team' : 'Your team seat is active') + '</h3>' +
        '<p>' + (tManage ? 'Invite people, manage seats, and see how your team is progressing.' : 'You have All-Access Pro through your team.') + '</p>' +
        '<a href="/team.html">Open team &rarr;</a></div>';
      return;
    }
    if (isPro()){ el.innerHTML = ''; return; }
    var a = activeCredTrack();
    el.innerHTML = '<div class="card conv rise" style="animation-delay:.24s">' +
      '<h3>Get certified</h3>' +
      '<p>' + (a ? ('The graded practice that finishes ' + esc(a.L.cert) + ' is part of Pro, and everything you have done so far carries over.')
                 : 'Graded practice, every specialization section, and all twelve mini courses.') + '</p>' +
      '<a href="/pricing.html">See the Program &rarr;</a></div>';
  }

  // ----- daily-series opt-in (ported from lesson-shelf.js) -----
  var OPTIN_LIVE = true, OPTIN_DISMISS_KEY = 'rsc-optin-dismiss', OPTIN_ROUTE_KEY = 'rsc-optin-routed';
  var optin = null;
  function checkOptin(){
    if (!OPTIN_LIVE || isDemo || optin) return;
    var t = readToken(); if (!t) return;
    fetch('/api/me/email-optin', { headers:{ Authorization:'Bearer ' + t } })
      .then(function(r){ if (!r.ok) throw 0; return r.json(); })
      .then(function(s){
        optin = s;
        if (!s.decided){
          var routed = false;
          try{ routed = !!sessionStorage.getItem(OPTIN_ROUTE_KEY); }catch(e){}
          if (!routed){ try{ sessionStorage.setItem(OPTIN_ROUTE_KEY, '1'); }catch(e){} location.href = '/email-optin.html?next=%2Fdashboard.html'; return; }
        }
        renderOptin();
      }).catch(function(){});
  }
  function renderOptin(){
    var host = $('dh-optin'); if (!host) return;
    if (!optin || !optin.decided || optin.nurture){ host.innerHTML = ''; return; }
    try{ var at = parseInt(localStorage.getItem(OPTIN_DISMISS_KEY) || '0', 10) || 0; if (Date.now() - at < 14 * 86400e3){ host.innerHTML = ''; return; } }catch(e){}
    host.innerHTML = '<div class="card conv rise" data-optin-card><h3>The daily lesson series</h3>' +
      '<p>One short interactive stats lesson in your inbox each morning, free. Every email opens that day&#39;s lesson for three days.</p>' +
      '<button class="yes" data-optin-yes>Start getting the lessons</button>' +
      '<button class="no" data-optin-dismiss>Not now</button></div>';
  }
  document.addEventListener('click', function(e){
    var yes = e.target.closest && e.target.closest('[data-optin-yes]');
    if (yes){
      yes.disabled = true;
      fetch('/api/me/email-optin', { method:'POST', headers:{ Authorization:'Bearer ' + readToken(), 'Content-Type':'application/json' },
        body: JSON.stringify({ optin:true, surface:'dashboard-card', default_state:'off' }) })
        .then(function(r){ if (!r.ok) throw 0; return r.json(); })
        .then(function(){
          if (optin) optin.nurture = true;
          var card = document.querySelector('[data-optin-card]');
          if (card) card.innerHTML = '<h3>You&#39;re in</h3><p style="margin:0">The first lesson lands in your inbox right away. Watch for Akshay.</p>';
          try{ if (typeof gtag === 'function') gtag('event', 'nurture_optin', { placement:'dashboard-card' }); }catch(err){}
        }).catch(function(){ yes.disabled = false; });
      return;
    }
    var dis = e.target.closest && e.target.closest('[data-optin-dismiss]');
    if (dis){ try{ localStorage.setItem(OPTIN_DISMISS_KEY, String(Date.now())); }catch(err){} var c = document.querySelector('[data-optin-card]'); if (c) c.remove(); return; }
    var mc = e.target.closest && e.target.closest('[data-mc]');
    try{ if (typeof gtag === 'function' && mc && (mc.getAttribute('href') || '').indexOf('/pricing') === 0) gtag('event', 'minicourse_locked_click', { course: mc.dataset.mc }); }catch(err){}
  });

  // ----- room switch (remembers the last room) -----
  (function(){
    var seg = $('dh-seg');
    function setRoom(r){
      Array.prototype.forEach.call(seg.querySelectorAll('button'), function(x){ x.classList.toggle('on', x.dataset.room === r); });
      Array.prototype.forEach.call(document.querySelectorAll('.room'), function(x){ x.classList.remove('on'); });
      var el = $('room-' + r); if (el) el.classList.add('on');
      try{ localStorage.setItem('rsc-dash-room', r); }catch(e){}
    }
    seg.addEventListener('click', function(e){
      var b = e.target.closest('button'); if (!b) return; setRoom(b.dataset.room);
    });
    if (!courseFirst){
      try{ var saved = localStorage.getItem('rsc-dash-room'); if (saved === 'building') setRoom('building'); }catch(e){}
    }
  })();

  function renderAll(){
    certBy = {}; ((S.certs && S.certs.items) || []).forEach(function(c){ certBy[c.track] = c; });
    renderHello(); renderCmd(); renderDaily(); renderOpen(); renderReading(); renderSaved();
    renderCred(); renderStages(); renderCatalog(); renderCerts(); renderBadges();
    renderAllTime(); renderRecap(); renderUpsell();
  }

  fetch('/www/sidebar.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(sb){ if (!sb) return; sb.forEach(function(sec){ (sec.items || []).forEach(function(it){ if (it.href && it.text) sbTitle[String(it.href).replace(/^\//, '')] = it.text; }); }); if (S.me){ renderSaved(); renderCmd(); renderReading(); } }).catch(function(){});
  fetch('/courses.json', { cache:'no-cache' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if (d){ S.courses = d; if (S.me){ renderCmd(); renderReading(); renderCred(); } } }).catch(function(){});
  fetch('/api/nurture/catalog').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if (d){ S.cat = d; if (S.me){ renderCatalog(); renderBadges(); } } }).catch(function(){});
  document.addEventListener('auth-hydrated', function(){ if (S.me){ renderCatalog(); renderConvToday(); renderUpsell(); } checkOptin(); });

  if (isDemo){
    var dn = Math.floor(Date.now() / 1000), dpro = /[?&]demo=pro/.test(location.search);
    var days = []; for (var i = 89; i >= 0; i--){ var on = (i * 7 + 3) % 10 > 3 && i !== 2; days.push({ d: dayKey(i), xp: on ? 20 + (i % 4) * 12 : 0, solved: on ? 1 + (i % 3) : 0 }); }
    S.me = { user:{ display_name:'Selva Prabhakaran', email:'selva@example.com' }, pro:dpro };
    S.stats = { total_xp:4820, current_streak_days:12, longest_streak_days:14, streak_freezes:2, days:days };
    S.tracks = { total_solved:64, tracks:[{ id:'r-fundamentals', pct:100 }, { id:'tidyverse-practitioner', pct:100 }, { id:'machine-learning', pct:46 }, { id:'statistics-for-ds', pct:22 }] };
    S.certs = { items:[{ public_id:'RST-2026-T5V102', track:'tidyverse-practitioner', track_name:'Tidyverse Practitioner', issued_at:dn - 1000000, score:88, verify_url:'#' }, { public_id:'RST-2026-RF4127', track:'r-fundamentals', track_name:'R Foundations', issued_at:dn - 3000000, score:94, verify_url:'#' }] };
    S.reading = { items:[{ slug:'Linear-Regression', scroll_pct:62, last_section:'Model diagnostics' }] };
    S.saved = { total:34, items:[{ slug:'Logistic-Regression' }, { slug:'Random-Forest' }, { slug:'GARCH-Models-in-R-2' }, { slug:'Quantile-Regression-in-R-2' }] };
    S.daily = { bonus_xp:25, all_done:false, tasks:[
      { hub:'dplyr-Exercises', href:'#', reason:'keeps your wrangling sharp', difficulty:'core', done:true, track:'Data Analyst' },
      { hub:'Cross-Validation-Exercises', href:'#', reason:'practice from your active course', difficulty:'stretch', done:true, track:'Machine Learning' },
      { hub:'Inference-Exercises', href:'#', reason:'retries a question you missed on Tuesday', difficulty:'review', done:false, track:'Statistics' }] };
    S.shelf = { position:39, badges:[
        { badge:'inference-from-zero', public_id:'B-DEMO1', earned_at:dn - 3300000 },
        { badge:'regression-health-check', public_id:'B-DEMO2', earned_at:dn - 400000 },
        { badge:'which-test', public_id:'B-DEMO3', earned_at:dn - 90000 }],
      open:[{ seq:19, subject:'Autocorrelation in residuals: how to test and fix it', slug:'Regression-Health-Mini-2', course:'regression-health-check', closes_at:dn + 12 * 3600 },
            { seq:38, subject:'ANOVA post-hoc tests: Tukey vs Bonferroni', slug:'Which-Test-Mini-6', course:'which-test', closes_at:dn + 63 * 3600 },
            { seq:39, subject:'Kruskal-Wallis: the nonparametric ANOVA', slug:'Which-Test-Mini-7', course:'which-test', closes_at:dn + 39 * 3600 },
            { seq:37, subject:'Chi-square tests: which one to use and how', slug:'Which-Test-Mini-5', course:'which-test', closes_at:dn + 70 * 3600 }] };
    renderAll();
  } else {
    if (!readToken()){ toSignin(); }
    else Promise.all([
      api('/api/me'), api('/api/me/stats'), api('/api/me/tracks'), api('/api/me/certificates'),
      api('/api/me/reading?kind=in_progress&limit=1'), api('/api/me/saved?limit=5')
    ]).then(function(r){
      if (!r[0] || !r[0].user) return toSignin();
      S.me = r[0]; S.stats = r[1]; S.tracks = r[2]; S.certs = r[3]; S.reading = r[4]; S.saved = r[5];
      renderAll();
      soft('/api/me/daily').then(function(d){ if (d){ S.daily = d; renderHello(); renderCmd(); renderDaily(); } });
      soft('/api/me/shelf').then(function(d){ if (d){ S.shelf = d; renderOpen(); renderCatalog(); renderBadges(); } });
      checkOptin();
    }).catch(function(e){
      if (e && e.a401) return toSignin();
      var sub = $('dh-sub'); if (sub){ sub.classList.remove('dh-skel'); sub.textContent = 'Could not load your dashboard. Please refresh.'; }
      try{ console.error('[dashboard]', e); }catch(err){}
    });
  }

  var prog = $('prog');
  if (prog){ var os = function(){ var h = document.documentElement, m = h.scrollHeight - h.clientHeight; prog.style.width = (m > 0 ? (h.scrollTop / m * 100) : 0) + '%'; }; window.addEventListener('scroll', os, { passive:true }); os(); }
})();
