// dashboard.js v9 -- the SD1 v3 "branded" dashboard. Renders /dashboard.html
// from /api/me/* plus /courses.json + /api/nurture/catalog. Auth-gated
// (redirects to /signin if anon); ?demo=1 | ?demo=pro renders fixtures with no
// auth (the review lane). Loads after roadmap-data.js (RM) + roadmap-curriculum.js.
//
// Sections: hello (accent em + 90d cumulative-XP sparkline), summary(you)
// console, hero (set ring + today's set + week bars), the unified Continue
// rail (active lesson track / reading / open email lesson), stat tiles with
// trend lines, open windowed lessons, all seven tracks with the Courses-
// dropdown mark grammar, the mini-course catalog (Pro wall preserved),
// certificates + badges as artifacts, the honest weekly recap, saved posts,
// upsell/team card. The daily-series opt-in routing + retry card was ported
// from lesson-shelf.js (now unused by this page).
(function(){
  'use strict';
  var RM = window.RM || {}, RM2 = window.RM2 || {};
  function $(id){ return document.getElementById(id); }
  function esc(t){ return String(t == null ? '' : t).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
  function fmt(n){ return (n == null ? 0 : n).toLocaleString('en-US'); }
  function fmtDate(sec){ try{ return new Date(sec*1000).toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'}); }catch(e){ return ''; } }

  // ----- title resolution (curriculum links + sidebar.json) -----
  var inv = {};
  (function(){ [RM.STOP_LINKS, RM2.links].forEach(function(m){ if(!m) return; Object.keys(m).forEach(function(t){ var u = m[t]; if (u && u.charAt(0) === '/') inv[u.toLowerCase()] = t; }); }); })();
  var sbTitle = {};
  function slugHtml(s){ s = String(s).replace(/^\//,''); return /\.html$/.test(s) ? s : s + '.html'; }
  function humanize(s){ return String(s).replace(/\.html$/,'').replace(/[-_]/g,' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); }); }
  function titleFor(slug){ var h = slugHtml(slug); return inv['/' + h.toLowerCase()] || sbTitle[h] || humanize(slug); }
  function postHref(slug){ return '/' + slugHtml(slug); }

  // ----- tracks: all seven, with the dropdown mark grammar -----
  var LV = ['foundations','analyst','ds','ts','researcher','developer','mleng'];
  var SLUG = { foundations:'new-to-r', analyst:'data-analyst', ds:'data-scientist', ts:'forecaster', researcher:'researcher', developer:'r-developer', mleng:'ml-engineer' };
  var HUE = { foundations:'var(--found)', analyst:'var(--da)', ds:'var(--ml)', ts:'var(--ts)', researcher:'var(--st)', developer:'var(--dev)', mleng:'var(--mle)' };
  var MARK = { foundations:'m-prompt', analyst:'m-bars', ds:'m-tree', ts:'m-fc', researcher:'m-bell', developer:'m-code', mleng:'m-gauge' };
  function rolePage(k){ return '/roadmap/' + SLUG[k] + '.html'; }
  function mk(id, w, h){ return '<svg width="' + (w||22) + '" height="' + (h||19) + '"><use href="#' + id + '"/></svg>'; }

  // ----- auth plumbing (unchanged from v8) -----
  function readToken(){ try{ for (var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if (!k || k.indexOf('sb-') !== 0 || k.indexOf('-auth-token') < 0) continue; var raw = localStorage.getItem(k); if (!raw) continue; var p = JSON.parse(raw); if (p && typeof p.access_token === 'string') return p.access_token; if (Array.isArray(p) && typeof p[0] === 'string') return p[0]; } }catch(e){} return null; }
  function api(path){ var t = readToken(), h = { Accept:'application/json' }; if (t) h.Authorization = 'Bearer ' + t; return fetch(path, { credentials:'same-origin', headers:h }).then(function(r){ if (r.status === 401){ var e = new Error('401'); e.a401 = true; throw e; } if (!r.ok) throw new Error(path + ' ' + r.status); return r.json(); }); }
  function soft(path){ var t = readToken(); if (!t) return Promise.resolve(null); return fetch(path, { headers:{ Authorization:'Bearer ' + t } }).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; }); }
  function toSignin(){ location.replace('/signin.html?next=/dashboard.html'); }

  var courseFirst = /[?&]start(?:=|&|$)/.test(location.search);
  var isDemo = /[?&]demo=(1|pro)/.test(location.search);

  // ----- shared state; sections render as their data lands -----
  var S = { me:null, stats:null, tracks:null, certs:null, reading:null, saved:null,
            daily:null, shelf:null, meter:null, cat:null, courses:null };
  var certBy = {};

  // ----- data-ink helpers -----
  function dayKey(offsetDays){ var d = new Date(Date.now() - offsetDays * 86400e3); return d.toISOString().slice(0, 10); }
  function seriesMap(){ var m = {}; ((S.stats && S.stats.days) || []).forEach(function(r){ m[r.d] = r; }); return m; }
  function lastNDays(n){ var m = seriesMap(), out = []; for (var i = n - 1; i >= 0; i--){ var k = dayKey(i); var r = m[k] || { d:k, xp:0, solved:0 }; out.push(r); } return out; }
  function polyline(vals, w, h){
    var max = 1; vals.forEach(function(v){ if (v > max) max = v; });
    var pts = vals.map(function(v, i){ var x = vals.length > 1 ? (i / (vals.length - 1)) * w : 0; var y = h - 2 - (v / max) * (h - 4); return Math.round(x) + ',' + Math.round(y * 10) / 10; });
    return pts.join(' ');
  }
  function cumulative(rows, key){ var t = 0; return rows.map(function(r){ t += (r[key] || 0); return t; }); }
  function hoursLeft(closesAt){ return Math.max(1, Math.round((closesAt * 1000 - Date.now()) / 36e5)); }

  // ----- courses.json: lesson-track progress incl. localStorage resume -----
  function courseDone(cid){ try{ var s = JSON.parse(localStorage.getItem('rsc-course-v1:' + cid)); return (s && s.completed) || {}; }catch(e){ return {}; } }
  function trackProgress(key){
    var cs = ((S.courses && S.courses.courses) || []).filter(function(c){ return c.roadmap && c.roadmap.track === key; })
      .sort(function(a, b){ return (a.roadmap.section || 0) - (b.roadmap.section || 0); });
    var total = 0, done = 0, resume = null, first = null;
    cs.forEach(function(c){ var dn = courseDone(c.course_id);
      (c.lessons || []).slice().sort(function(a, b){ return (a.order || 0) - (b.order || 0); }).forEach(function(l){
        if (l.built === false) return; total++; if (!first) first = l.slug;
        if (dn[l.slug]) done++; else if (!resume) resume = l.slug; }); });
    return { total: total, done: done, resume: resume || first, first: first, started: done > 0 };
  }
  function activeLessonTrack(){
    var best = null;
    ['foundations','analyst','ds'].forEach(function(k){
      var p = trackProgress(k);
      if (!p.total || p.done >= p.total) return;
      if (p.started && (!best || p.done > best.p.done)) best = { key:k, p:p };
    });
    if (!best){ // nothing started: offer the first free track with content
      ['foundations','analyst','ds'].some(function(k){ var p = trackProgress(k); if (p.total && p.done < p.total){ best = { key:k, p:p, fresh:true }; return true; } return false; });
    }
    return best;
  }

  // ================= sections =================
  function renderHello(){
    var st = S.stats || {}, streak = st.current_streak_days || 0, fz = st.streak_freezes || 0;
    var act = activeLessonTrack();
    var hue = act ? HUE[act.key] : 'var(--accent)';
    var h1 = $('dh-h1');
    var u = (S.me && S.me.user) || {};
    var first = String(u.display_name || (u.email ? u.email.split('@')[0] : '') || '').split(' ')[0];
    var emTxt = streak > 0 ? (streak + (streak === 1 ? ' day' : ' days') + ' strong.') : 'Good to see you.';
    h1.innerHTML = (courseFirst ? 'Welcome' : 'Welcome back') + (first ? ', ' + esc(first) : '') + '. <em style="color:' + hue + '">' + esc(emTxt) + '</em>';
    var sub = $('dh-sub'); sub.classList.remove('dh-skel');
    var todo = S.daily && S.daily.tasks ? S.daily.tasks.filter(function(t){ return !t.done; }).length : null;
    sub.textContent = courseFirst ? 'You are all set. Pick a course below and start learning.'
      : streak > 0 ? ('Streak safe until midnight.' + (fz ? ' ' + fz + (fz === 1 ? ' freeze' : ' freezes') + ' banked.' : '') + (todo ? ' ' + todo + ' set item' + (todo === 1 ? '' : 's') + ' left.' : ''))
      : 'Pick up where you left off.';
    if (streak > 0){ var n = $('dh-streakn'); if (n) n.textContent = streak; var c = $('dh-streakchip'); if (c) c.hidden = false; }
    // 90-day cumulative XP sparkline: only worth drawing with some history
    var rows = lastNDays(90), cum = cumulative(rows, 'xp');
    var host = $('dh-spark90');
    if (cum[cum.length - 1] > 0){
      host.innerHTML = '<polyline points="' + polyline(cum, 210, 40) + '"/>' +
        '<circle cx="210" cy="' + (40 - 2 - 36).toFixed(0) + '" r="0"/>' +
        '<text x="210" y="40" text-anchor="end">your 90 days</text>';
      host.style.display = '';
    } else host.style.display = 'none';
  }

  function renderConsole(){
    var st = S.stats || {};
    var solved = (S.tracks && S.tracks.total_solved) || 0;
    var certs = (S.certs && S.certs.items ? S.certs.items.length : 0);
    var act = activeLessonTrack();
    var nextLine = act && act.p.resume ? (titleFor(act.p.resume) + ', ' + (RM.byKey && RM.byKey(act.key) ? RM.byKey(act.key).cert : '')) : 'pick a track on the roadmap';
    $('dh-console').innerHTML =
      '<span class="p">&gt;</span> <span class="f">summary</span>(<b>you</b>)\n' +
      '<span class="c">#&gt;</span>  streak: <b>' + (st.current_streak_days || 0) + ' days</b> (best ' + (st.longest_streak_days || 0) + ')   xp: <b>' + fmt(st.total_xp) + '</b>   solved: <b>' + fmt(solved) + '</b>   certificates: <b>' + certs + '</b>\n' +
      '<span class="c">#&gt;</span>  next: <b>' + esc(nextLine) + '</b>';
  }

  function renderHero(){
    var d = S.daily;
    var host = $('dh-hero');
    if (!d || !d.tasks || !d.tasks.length){ host.hidden = true; return; }
    host.hidden = false;
    var done = d.tasks.filter(function(t){ return t.done; }).length, total = d.tasks.length;
    var C = 333, off = Math.round(C * (1 - (total ? done / total : 0)));
    $('dh-ringfill').setAttribute('stroke-dashoffset', off);
    $('dh-ringmid').innerHTML = '<b>' + done + '/' + total + '</b><span>today’s set</span>';
    var fz = (S.stats && S.stats.streak_freezes) || 0;
    $('dh-frz').innerHTML = mk('i-snow', 13, 13) + (fz ? ('<span><b>' + fz + (fz === 1 ? ' freeze' : ' freezes') + '</b> banked</span>') : '<span>streak resets at midnight</span>');
    $('dh-set-sub').textContent = d.all_done ? (d.bonus_awarded ? ('Done for today. +' + d.bonus_xp + ' XP banked.') : 'Done for today.') : ('Finish all three for the +' + d.bonus_xp + ' XP bonus.');
    $('dh-tasks').innerHTML = d.tasks.map(function(t){
      var dif = String(t.difficulty || '').toLowerCase();
      var isReview = /review/.test(String(t.reason || '').toLowerCase()) || dif === 'review';
      return '<a class="task' + (t.done ? ' done' : '') + '" href="' + esc(t.href) + '">' +
        '<span class="ck">' + (t.done ? mk('i-check', 11, 11) : '') + '</span>' +
        '<b>' + esc((t.hub || '').replace(/-/g, ' ').replace(/\.html$/, '')) + '<i>' + esc((t.track ? t.track + ' · ' : '') + (t.reason || '')) + '</i></b>' +
        (t.difficulty ? '<span class="dif' + (isReview ? ' review' : '') + '">' + esc(t.difficulty) + '</span>' : '') + '</a>';
    }).join('');
    // week bars from the last 7 days of real activity
    var rows = lastNDays(7), max = 1;
    rows.forEach(function(r){ if (r.xp > max) max = r.xp; });
    var DAYS = ['S','M','T','W','T','F','S'];
    $('dh-week').innerHTML = rows.map(function(r, i){
      var today = i === rows.length - 1;
      var h = Math.max(3, Math.round((r.xp / max) * 52));
      return '<div class="wb' + (today ? ' today' : '') + '"><i style="height:' + h + 'px"></i><span>' + (today ? 'today' : DAYS[new Date(r.d + 'T00:00:00Z').getUTCDay()]) + '</span></div>';
    }).join('');
    var wk = rows.slice(0, 7);
    var xpW = wk.reduce(function(a, r){ return a + r.xp; }, 0);
    var solW = wk.reduce(function(a, r){ return a + r.solved; }, 0);
    var actW = wk.filter(function(r){ return r.xp > 0 || r.solved > 0; }).length;
    $('dh-wk-rows').innerHTML =
      '<div class="wr"><span>XP this week</span><b>' + fmt(xpW) + '</b></div>' +
      '<div class="wr"><span>Exercises solved</span><b>' + fmt(solW) + '</b></div>' +
      '<div class="wr"><span>Active days</span><b>' + actW + '/7</b></div>';
  }

  function renderContinue(){
    var cards = [];
    var act = activeLessonTrack();
    if (act){
      var L = RM.byKey ? RM.byKey(act.key) : null;
      var pct = act.p.total ? Math.round(100 * act.p.done / act.p.total) : 0;
      cards.push('<a class="cont" style="--cc:' + HUE[act.key] + '" href="' + postHref(act.p.resume) + '">' +
        '<div class="k">' + (act.fresh ? 'START YOUR TRACK' : 'YOUR ACTIVE TRACK') + '</div>' +
        '<b>' + esc(titleFor(act.p.resume)) + '</b>' +
        '<small>' + esc(L ? L.persona : act.key) + (L ? ' · ' + esc(L.cert) : '') + ' · lesson ' + (act.p.done + 1) + ' of ' + act.p.total + '</small>' +
        '<div class="pb"><i style="width:' + Math.max(2, pct) + '%"></i></div>' +
        '<span class="go">' + (act.fresh ? 'Start free' : 'Continue lesson') + ' &rarr;</span></a>');
    }
    var rd = S.reading && S.reading.items && S.reading.items[0];
    if (rd){
      var rpct = Math.max(2, Math.min(100, Math.round(rd.scroll_pct || 0)));
      cards.push('<a class="cont" style="--cc:var(--accent)" href="' + postHref(rd.slug) + '">' +
        '<div class="k">READING</div><b>' + esc(titleFor(rd.slug)) + '</b>' +
        '<small>Tutorial' + (rd.last_section ? ' · ' + esc(rd.last_section) : '') + ' · ' + rpct + '% read</small>' +
        '<div class="pb"><i style="width:' + rpct + '%"></i></div>' +
        '<span class="go">Resume reading &rarr;</span></a>');
    }
    var op = S.shelf && S.shelf.open && S.shelf.open[0];
    if (op && op.slug){
      cards.push('<a class="cont" style="--cc:var(--st)" href="/' + esc(op.slug) + '.html">' +
        '<div class="k">FROM YOUR EMAIL</div><span class="cd">closes in ' + hoursLeft(op.closes_at) + 'h</span>' +
        '<b>' + esc(op.subject) + '</b>' +
        '<small>' + esc((op.course || 'daily series').replace(/-/g, ' ')) + ' · day ' + op.seq + ' of your series</small>' +
        '<div class="pb"><i style="width:4%"></i></div>' +
        '<span class="go">Open the lesson &rarr;</span></a>');
    }
    var sec = $('dh-cont-sec');
    if (!cards.length){
      $('dh-cont').innerHTML = '<a class="cont" style="--cc:var(--accent);grid-column:1/-1" href="/roadmap/">' +
        '<div class="k">START LEARNING</div><b>Begin the roadmap</b>' +
        '<small>Pick a track and your first lesson is one click away.</small>' +
        '<span class="go">Browse the roadmap &rarr;</span></a>';
      sec.hidden = false; return;
    }
    $('dh-cont').innerHTML = cards.join('');
    $('dh-cont').style.gridTemplateColumns = cards.length === 3 ? '1.45fr 1fr 1fr' : (cards.length === 2 ? '1.45fr 1fr' : '1fr');
    sec.hidden = false;
  }

  function renderStats(){
    var st = S.stats || {}, streak = st.current_streak_days || 0;
    var solved = (S.tracks && S.tracks.total_solved) || 0;
    var certItems = (S.certs && S.certs.items) || [];
    var active = ((S.tracks && S.tracks.tracks) || []).filter(function(t){ return t.pct > 0 && t.pct < 100; }).length;
    var rows = lastNDays(30);
    var wk = lastNDays(7);
    var solW = wk.reduce(function(a, r){ return a + r.solved; }, 0);
    var xpW = wk.reduce(function(a, r){ return a + r.xp; }, 0);
    function tile(big, label, sub, spark, warm){
      return '<div class="stat' + (warm ? ' warm' : '') + '"><b>' + big + '</b><span>' + label + '</span>' +
        (sub ? '<span class="meterline">' + sub + '</span>' : '') +
        (spark ? '<svg height="18" viewBox="0 0 100 18" preserveAspectRatio="none"><polyline points="' + spark + '"/></svg>' : '') + '</div>';
    }
    var html =
      tile(fmt(solved), 'Exercises solved', solW ? ('+' + solW + ' this week') : '', polyline(cumulative(rows, 'solved'), 100, 18)) +
      tile(fmt(st.total_xp || 0), 'XP earned', xpW ? ('+' + fmt(xpW) + ' this week') : '', polyline(cumulative(rows, 'xp'), 100, 18)) +
      tile(streak + 'd', 'Current streak', 'best ' + (st.longest_streak_days || streak) + 'd' + ((st.streak_freezes || 0) ? ' · ' + st.streak_freezes + ' freezes' : ''), polyline(lastNDays(14).map(function(r){ return (r.xp > 0 || r.solved > 0) ? 1 : 0; }), 100, 18), true) +
      tile(String(certItems.length), 'Certificates', active ? (active + ' tracks in progress') : '', null);
    if (S.meter && typeof S.meter.used === 'number' && S.meter.limit > 0){
      html += tile(S.meter.used + '/' + S.meter.limit, 'Free practice this month', S.meter.resets ? ('resets ' + String(S.meter.resets).slice(0, 10)) : '', null);
    }
    var el = $('dh-stats');
    el.innerHTML = html;
    el.style.gridTemplateColumns = 'repeat(' + Math.min(5, el.children.length) + ',1fr)';
  }

  function renderOpen(){
    var sec = $('dh-open-sec');
    var open = (S.shelf && S.shelf.open) || [];
    if (!open.length){ sec.hidden = true; return; }
    sec.hidden = false;
    var pos = S.shelf.position;
    $('dh-open-link').textContent = pos != null ? ('Daily series · day ' + pos + ' of 87 →') : 'Your daily series →';
    $('dh-open').innerHTML = open.map(function(o){
      return '<a class="olc" href="/' + esc(o.slug) + '.html"><span class="cd">' + hoursLeft(o.closes_at) + 'h left</span>' +
        '<b>' + esc(o.subject) + '</b><small>' + esc((o.course || '').replace(/-/g, ' ')) + '</small></a>';
    }).join('');
  }

  function fmtPct(v){ v = +v || 0; return (Math.round(v * 100) / 100).toFixed(v % 1 ? 2 : 0).replace(/\.00$/, ''); }
  function renderStages(){
    var byId = {}; ((S.tracks && S.tracks.tracks) || []).forEach(function(t){ byId[t.id] = t; });
    $('dh-stages').innerHTML = LV.map(function(k){
      var L = RM.byKey ? RM.byKey(k) : null; if (!L) return '';
      var tid = L.track, entry = tid ? byId[tid] : null, earned = !!(tid && certBy[tid]);
      var pct = earned ? 100 : (entry ? entry.pct : 0);
      var p = trackProgress(k);
      var meta = p.total ? (p.total + ' lessons') : 'tutorials';
      var sub = earned ? (esc(L.cert) + ' earned')
        : (entry && entry.eligible) ? ('Ready to claim ' + esc(L.cert))
        : pct > 0 ? (fmtPct(pct) + '% to ' + esc(L.cert))
        : esc(L.cert) + ' awaits';
      var cls = earned ? ' class="earn"' : (entry && entry.eligible ? ' class="claim"' : '');
      return '<a class="stage" style="--cc:' + HUE[k] + '" href="' + rolePage(k) + '">' +
        '<span class="mk">' + mk(MARK[k]) + '</span>' +
        '<span class="nm"><b>' + esc(L.persona) + '</b><span>' + meta + '</span></span>' +
        '<span class="pb"><i style="width:' + Math.max(pct > 0 ? 2 : 0, pct) + '%"></i></span>' +
        '<small' + cls + '>' + sub + '</small></a>';
    }).join('');
  }

  function isPro(){ return document.body.classList.contains('pro') || (S.me && S.me.pro); }
  function renderCatalog(){
    var sec = $('dh-cat-sec');
    var courses = (S.cat && S.cat.courses) || [];
    if (!courses.length){ sec.hidden = true; return; }
    sec.hidden = false;
    var pro = isPro();
    var earned = {}; ((S.shelf && S.shelf.badges) || []).forEach(function(b){ earned[b.badge] = b; });
    $('dh-cat-sub').textContent = pro
      ? 'Short interactive courses, each awarding a badge. Every built lesson is included with your plan.'
      : 'Short interactive courses, each awarding a badge. Free with the daily emails as they unlock; Pro opens every built lesson today.';
    $('dh-cat').innerHTML = courses.map(function(c){
      var built = (c.parts || []).filter(function(p){ return p.status === 'built'; });
      var b = earned[c.id];
      var st, href = null;
      if (b){ st = '<span class="st g">' + mk('i-check', 11, 11) + 'Badge earned ' + fmtDate(b.earned_at) + '</span>'; href = '/badge/' + esc(b.public_id); }
      else if (pro && built.length){ st = '<span class="st g">' + built.length + ' of ' + (c.parts || []).length + ' lessons ready</span>'; href = '/' + esc(built[0].slug) + '.html'; }
      else if (pro){ st = '<span class="st m">In production</span>'; }
      else { st = '<span class="st p">' + mk('i-lock', 11, 11) + 'Included with Pro</span>'; href = '/pricing.html?from=minicourses'; }
      var inner = '<b>' + esc(c.title) + '</b><small>' + (c.parts || []).length + ' short lessons</small>' + st;
      return href ? ('<a class="mc" href="' + href + '" data-mc="' + esc(c.id) + '">' + inner + '</a>') : ('<div class="mc">' + inner + '</div>');
    }).join('');
  }

  function renderCred(){
    var items = (S.certs && S.certs.items) || [];
    var badges = (S.shelf && S.shelf.badges) || [];
    var titleById = {}; ((S.cat && S.cat.courses) || []).forEach(function(c){ titleById[c.id] = c.title; });
    var rows = items.map(function(c){
      var score = (c.score != null) ? (' · ' + c.score + '%') : '';
      var id = c.public_id ? (' · ' + esc(c.public_id)) : '';
      var share = c.verify_url ? ('<a class="sh" href="' + esc(c.verify_url) + '">Share</a>') : '';
      return '<div class="crow"><span class="seal">' + mk('i-star', 15, 15) + '</span>' +
        '<span><b>' + esc(c.track_name || c.track) + '</b><small>Earned ' + fmtDate(c.issued_at) + score + id + '</small></span>' + share + '</div>';
    }).concat(badges.map(function(b){
      return '<div class="crow badge"><span class="seal">' + mk('i-star', 13, 13) + '</span>' +
        '<span><b>' + esc(titleById[b.badge] || b.badge.replace(/-/g, ' ')) + '</b><small>Badge · ' + fmtDate(b.earned_at) + '</small></span>' +
        '<a class="sh" href="/badge/' + esc(b.public_id) + '">View</a></div>';
    }));
    $('dh-cred').innerHTML = rows.length ? rows.join('') : '<div class="empty">No certificates yet. Finish a track to earn your first.</div>';
  }

  function renderRecap(){
    var sec = $('dh-recap');
    var wk = lastNDays(8).slice(0, 7); // the 7 days before today
    var xp = wk.reduce(function(a, r){ return a + r.xp; }, 0);
    var sol = wk.reduce(function(a, r){ return a + r.solved; }, 0);
    var act = wk.filter(function(r){ return r.xp > 0 || r.solved > 0; }).length;
    if (!xp && !sol){ sec.hidden = true; return; }
    sec.hidden = false;
    $('dh-recap-nums').innerHTML =
      '<span><b>' + act + '/7</b>active days</span>' +
      '<span><b>' + fmt(xp) + '</b>XP</span>' +
      '<span><b>' + fmt(sol) + '</b>exercises</span>';
    $('dh-recap-p').textContent = act >= 5 ? 'A strong week. Showing up most days is the whole game.'
      : act >= 3 ? 'A steady week. A little most days beats a lot once.'
      : 'A quiet week. One exercise today restarts the rhythm.';
  }

  function renderSaved(){
    var items = (S.saved && S.saved.items) || [];
    $('dh-savedn').textContent = String(S.saved && S.saved.total != null ? S.saved.total : items.length);
    $('dh-saved').innerHTML = items.length ? items.map(function(it){
      return '<a class="srow" href="' + postHref(it.slug) + '">' + mk('i-mark', 14, 14) + '<b>' + esc(titleFor(it.slug)) + '</b><span class="go">Read &rarr;</span></a>';
    }).join('') : '<div class="empty">Nothing saved yet. Bookmark a tutorial to read later.</div>';
  }

  function renderUpsell(){
    var el = $('dh-upsell');
    if (S.me && S.me.team){
      var tManage = S.me.team.role === 'owner' || S.me.team.role === 'admin';
      el.innerHTML = '<div class="upsell"><span class="kick" style="color:var(--pro)">Your team</span>' +
        '<h3>' + (tManage ? 'Manage your team' : 'Team seat active') + '</h3>' +
        '<p>' + (tManage ? 'Invite people, manage seats, and see your team’s progress.' : 'You have All-Access Pro through your team.') + '</p>' +
        '<a href="/team.html">Open team &rarr;</a></div>';
      return;
    }
    if (S.me && S.me.pro){ el.innerHTML = ''; return; }
    el.innerHTML = '<div class="upsell"><span class="kick" style="color:var(--pro)">The Program</span>' +
      '<h3>Get certified</h3>' +
      '<p>Graded practice, every specialization section, all twelve mini courses open today, and the projects that become your portfolio.</p>' +
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
    host.innerHTML = '<div class="optincard" data-optin-card><h3>The daily lesson series</h3>' +
      '<p>A five-minute interactive R lesson in your inbox each morning, free. Every email opens that day’s lesson for three days.</p>' +
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
          if (card) card.innerHTML = '<h3>You&#39;re in</h3><p style="margin:0">The first lesson lands tomorrow morning. Watch for Akshay in your inbox.</p>';
          try{ if (typeof gtag === 'function') gtag('event', 'nurture_optin', { placement:'dashboard-card' }); }catch(err){}
        }).catch(function(){ yes.disabled = false; });
      return;
    }
    var dis = e.target.closest && e.target.closest('[data-optin-dismiss]');
    if (dis){ try{ localStorage.setItem(OPTIN_DISMISS_KEY, String(Date.now())); }catch(err){} var c = document.querySelector('[data-optin-card]'); if (c) c.remove(); return; }
    var card2 = e.target.closest && e.target.closest('[data-mc]');
    try{ if (typeof gtag === 'function' && card2 && (card2.getAttribute('href') || '').indexOf('/pricing') === 0) gtag('event', 'minicourse_locked_click', { course: card2.dataset.mc }); }catch(err){}
  });

  function renderAll(){
    certBy = {}; ((S.certs && S.certs.items) || []).forEach(function(c){ certBy[c.track] = c; });
    renderHello(); renderConsole(); renderHero(); renderContinue(); renderStats();
    renderOpen(); renderStages(); renderCatalog(); renderCred(); renderRecap();
    renderSaved(); renderUpsell();
  }

  // sidebar titles (non-blocking enrichment)
  fetch('/www/sidebar.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(sb){ if (!sb) return; sb.forEach(function(sec){ (sec.items || []).forEach(function(it){ if (it.href && it.text) sbTitle[String(it.href).replace(/^\//, '')] = it.text; }); }); renderSaved(); }).catch(function(){});
  fetch('/courses.json', { cache:'no-cache' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if (d){ S.courses = d; renderHello(); renderConsole(); renderContinue(); renderStages(); } }).catch(function(){});
  fetch('/api/nurture/catalog').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if (d){ S.cat = d; renderCatalog(); renderCred(); } }).catch(function(){});
  document.addEventListener('auth-hydrated', function(){ renderCatalog(); checkOptin(); });

  if (isDemo){
    var dn = Math.floor(Date.now() / 1000), dpro = /[?&]demo=pro/.test(location.search);
    var days = []; for (var i = 89; i >= 0; i--){ var wknd = (new Date(Date.now() - i * 86400e3).getUTCDay() % 6 === 0); var on = (i * 7 + 3) % 10 > 3 && !(i === 3); days.push({ d: dayKey(i), xp: on ? (wknd ? 10 : 25 + (i % 4) * 10) : 0, solved: on ? 1 + (i % 3) : 0 }); }
    S.me = { user:{ display_name:'Selva Prabhakaran', email:'selva@example.com' }, pro:dpro };
    S.stats = { total_xp:4820, current_streak_days:6, longest_streak_days:14, streak_freezes:2, days:days };
    S.tracks = { total_solved:64, tracks:[{ id:'r-fundamentals', pct:100, eligible:true }, { id:'tidyverse-practitioner', pct:100, eligible:true }, { id:'machine-learning', pct:46 }, { id:'statistics-for-ds', pct:22 }] };
    S.certs = { items:[{ public_id:'RST-2026-T5V102', track:'tidyverse-practitioner', track_name:'Tidyverse Practitioner', issued_at:dn - 1000000, score:88, verify_url:'#' }, { public_id:'RST-2026-RF4127', track:'r-fundamentals', track_name:'R Foundations', issued_at:dn - 3000000, score:94, verify_url:'#' }] };
    S.reading = { items:[{ slug:'Linear-Regression', scroll_pct:62, last_section:'Model diagnostics' }] };
    S.saved = { total:3, items:[{ slug:'Logistic-Regression' }, { slug:'Random-Forest' }, { slug:'ggplot2-Tutorial' }] };
    S.daily = { bonus_xp:25, all_done:false, tasks:[
      { hub:'dplyr-Exercises', href:'#', reason:'keeps your wrangling sharp', difficulty:'core', done:true, track:'Data Analyst' },
      { hub:'Cross-Validation-Exercises', href:'#', reason:'your active track', difficulty:'stretch', done:true, track:'Machine Learning' },
      { hub:'Inference-Exercises', href:'#', reason:'retries a question you missed Sunday', difficulty:'review', done:false, track:'Statistics' }] };
    S.shelf = { position:22, badges:[{ badge:'inference-from-zero', public_id:'B-DEMO1', earned_at:dn - 3300000 }],
      open:[{ seq:19, subject:'Autocorrelation in residuals: how to test and fix it', slug:'Regression-Health-Mini-2', course:'regression-health-check', closes_at:dn + 41 * 3600 },
            { seq:22, subject:'Linear regression assumptions: the 5 checks', slug:'Regression-Health-Mini-5', course:'regression-health-check', closes_at:dn + 66 * 3600 }] };
    S.meter = { used:18, limit:25, resets:'2026-09-01' };
    renderAll();
  } else {
    if (!readToken()){ toSignin(); return; }
    Promise.all([
      api('/api/me'), api('/api/me/stats'), api('/api/me/tracks'), api('/api/me/certificates'),
      api('/api/me/reading?kind=in_progress&limit=1'), api('/api/me/saved?limit=5')
    ]).then(function(r){
      if (!r[0] || !r[0].user) return toSignin();
      S.me = r[0]; S.stats = r[1]; S.tracks = r[2]; S.certs = r[3]; S.reading = r[4]; S.saved = r[5];
      renderAll();
      // the softer, individually-failable calls
      soft('/api/me/daily').then(function(d){ if (d){ S.daily = d; renderHello(); renderHero(); } });
      soft('/api/me/shelf').then(function(d){ if (d){ S.shelf = d; renderContinue(); renderOpen(); renderCatalog(); renderCred(); } });
      soft('/api/me/meter').then(function(d){ if (d){ S.meter = d; renderStats(); } });
      checkOptin();
    }).catch(function(e){
      if (e && e.a401) return toSignin();
      console.error('[dashboard]', e);
      var sub = $('dh-sub'); if (sub){ sub.classList.remove('dh-skel'); sub.textContent = 'Could not load your dashboard. Please refresh.'; }
    });
  }
})();
