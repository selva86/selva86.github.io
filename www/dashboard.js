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

  var S = { me:null, stats:null, tracks:null, certs:null, reading:null, saved:null, hubs:null,
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
  /* Desk. Two places rather than two rooms: the rail holds who you are and
     what you have done, the work column holds what to do now and what is in
     flight. Nothing is behind a tab.

     The rule the previous version broke was spending a border, a fill, a
     radius and a shadow on every block, which flattens the hierarchy until
     nothing looks more important than anything else. Here there is one dark
     object (the next action), one list, and one rail. */

  function fmtPct(v){ v = +v || 0; return String(Math.round(v * 10) / 10).replace(/\.0$/, ''); }

  function firstName(){
    var u = (S.me && S.me.user) || {};
    return String(u.display_name || (u.email ? u.email.split('@')[0] : '') || '').split(' ')[0];
  }

  function renderHello(){
    var st = S.stats || {}, streak = st.current_streak_days || 0, fz = st.streak_freezes || 0;
    var first = firstName();
    $('dh-h1').innerHTML = (courseFirst ? 'Welcome' : 'Welcome back') + (first ? ', ' + esc(first) : '') + '.';
    var sub = $('dh-sub'); sub.classList.remove('dh-skel');
    var todo = S.daily && S.daily.tasks ? S.daily.tasks.filter(function(t){ return !t.done; }).length : 0;
    if (courseFirst) sub.textContent = 'You are all set. Pick your first lesson below and start learning.';
    else sub.textContent =
      (fz ? (fz === 1 ? 'One freeze banked.' : fz + ' freezes banked.') : 'No freezes banked.') +
      (todo ? ' ' + (todo === 1 ? 'One set item left.' : todo + ' set items left.') : '');
    var chip = $('dh-streakchip');
    if (chip){ if (streak > 0){ $('dh-streakn').textContent = streak; chip.hidden = false; } else chip.hidden = true; }
  }

  // ---------------- the rail ----------------

  function renderWho(){
    var u = (S.me && S.me.user) || {};
    var name = u.display_name || (u.email ? u.email.split('@')[0] : '') || 'Your account';
    var n = $('dh-name'); n.classList.remove('dh-skel'); n.textContent = name;
    var pic = $('dh-pic');
    if (u.avatar_url){ pic.innerHTML = '<img alt="" src="' + esc(u.avatar_url) + '">'; }
    else pic.textContent = String(name).charAt(0).toUpperCase();
    var since = u.created_at || (S.me && S.me.created_at);
    $('dh-since').textContent = since ? ('Member since ' + fmtMonth(since)) : '';
  }

  function fmtMonth(sec){
    try{ return new Date(sec * 1000).toLocaleDateString('en-US', { year:'numeric', month:'long' }); }
    catch(e){ return ''; }
  }

  function renderStreak(){
    var st = S.stats || {}, streak = st.current_streak_days || 0;
    var sec = $('dh-streak-sec');
    sec.hidden = false;
    $('dh-streakbig').textContent = streak;
    $('dh-streakcap').innerHTML = streak > 0
      ? (streak === 1 ? 'day running<br>safe until midnight' : 'days running<br>safe until midnight')
      : 'days running<br>solve one to start';
    /* The last seven days, oldest first, today last and half lit until it
       counts. A streak number alone says nothing about the shape of the
       week. */
    var days = lastNDays(7);
    $('dh-days').innerHTML = days.map(function(d, i){
      var on = (d.solved || 0) > 0 || (d.xp || 0) > 0;
      var today = i === days.length - 1;
      return '<i class="' + (on ? 'on' : (today ? 'now' : '')) + '"></i>';
    }).join('');
  }

  function renderRecord(){
    var st = S.stats || {};
    var q = st.quality || null;
    var solved = st.solved != null ? st.solved : ((S.tracks && S.tracks.total_solved) || 0);
    $('dh-rec-sec').hidden = false;
    /* A brand new account has no record, and hiding the section leaves a rail
       that is a name and nothing else. Say what starts it instead. */
    if (!solved && !st.total_xp){
      $('dh-figs').innerHTML = '<p class="empty" style="grid-column:1/-1;padding:0">' +
        'Your record starts with the first problem you solve.</p>';
      $('dh-qbar').hidden = true; $('dh-qkey').hidden = true;
      return;
    }

    var figs = [
      { b: fmt(solved), s: 'solved' },
      q ? { b: fmt(q.unaided), s: 'unaided', gold: true } : null,
      { b: fmt(st.total_xp || 0), s: 'XP' },
      { b: fmt(st.longest_streak_days || 0), s: 'day best' },
    ].filter(Boolean);
    $('dh-figs').innerHTML = figs.map(function(f){
      return '<span class="fig' + (f.gold ? ' gold' : '') + '"><b>' + f.b + '</b><span>' + f.s + '</span></span>';
    }).join('');

    /* The split is the point. "312 solved" is the least interesting true
       sentence available once stars exist; how they were solved is the part
       worth being proud of. Rows banked before grading existed are unrated
       and are left out of the bar rather than counted as flawless. */
    var bar = $('dh-qbar'), key = $('dh-qkey');
    var rated = q ? (q.unaided + q.hinted + q.seen) : 0;
    if (!q || rated < 1){ bar.hidden = true; key.hidden = true; return; }
    bar.hidden = false; key.hidden = false;
    function w(n){ return (n / rated * 100) + '%'; }
    bar.innerHTML =
      '<i style="width:' + w(q.unaided) + ';background:var(--gold)"></i>' +
      '<i style="width:' + w(q.hinted) + ';background:#dcc48c"></i>' +
      '<i style="width:' + w(q.seen) + ';background:var(--line)"></i>';
    var bits = ['<b>' + fmt(q.unaided) + ' with no help</b>'];
    if (q.hinted) bits.push(fmt(q.hinted) + ' after a hint');
    if (q.seen) bits.push(fmt(q.seen) + ' after reading the solution');
    key.innerHTML = bits.join(', ') + '.';
  }

  /* The milestone ladder. Two stores feed this page: badges_earned, drawn by
     renderBadges below, and user_badges, drawn here. The next rung leads,
     because it is the only number on the page that goes down. */
  function renderMilestones(){
    var m = (S.shelf && S.shelf.milestones) || null;
    var sec = $('dh-miles-sec');
    if (!sec) return;
    if (!m || (!m.earned.length && !m.next)){ sec.hidden = true; return; }
    sec.hidden = false;
    $('dh-miles-h').textContent = 'Milestones, ' + m.earned.length + ' of ' + m.total;

    var nx = $('dh-miles-next');
    if (m.next){
      nx.hidden = false;
      nx.innerHTML = '<span class="gem is-next">' + m.next.art + '</span>' +
        '<span class="nx"><b>Next: ' + esc(m.next.name) + '</b>' +
        '<small>' + m.next.left + ' more ' + esc(m.next.unit) +
        ' · ' + m.next.have + ' of ' + m.next.need + '</small></span>';
    } else nx.hidden = true;

    var show = m.earned.slice(0, 9);
    $('dh-miles').innerHTML = show.map(function(b){
      return '<span class="gem" title="' + esc(b.name + ' · ' + b.blurb) + '">' + b.art + '</span>';
    }).join('');
    var rest = m.earned.length - show.length;
    var more = $('dh-miles-more');
    more.hidden = false;
    more.innerHTML = (rest > 0 ? rest + ' more earned. ' : '') +
      '<a href="/u/">See the wall &rarr;</a>';
  }

  function renderBadges(){
    var badges = (S.shelf && S.shelf.badges) || [];
    var sec = $('dh-badges-sec');
    if (!badges.length){ sec.hidden = true; return; }
    sec.hidden = false;
    var titleById = {}; ((S.cat && S.cat.courses) || []).forEach(function(c){ titleById[c.id] = c.title; });
    $('dh-badges-h').textContent = 'Badges, ' + badges.length + ' earned';
    $('dh-badges').innerHTML = badges.map(function(b){
      var t = titleById[b.badge] || String(b.badge).replace(/-/g, ' ');
      var initials = String(t).split(/\s+/).filter(function(w){ return /^[A-Za-z]/.test(w); })
        .map(function(w){ return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
      return '<a class="coin" title="' + esc(t) + ', earned ' + fmtDate(b.earned_at) +
             '" href="/badge/' + esc(b.public_id) + '"><span class="c">' + esc(initials) + '</span></a>';
    }).join('');
  }

  /* Credentials: the earned ones as rows, then the two closest still open.
     No ring. A 132px circle reading 0% was the largest thing on the old page
     and it told somebody with 27 solves that they had done nothing. */
  function renderCreds(){
    var items = (S.certs && S.certs.items) || [];
    var byId = {}; ((S.tracks && S.tracks.tracks) || []).forEach(function(t){ byId[t.id] = t; });

    var open = [];
    LV.forEach(function(k){
      var L = RM.byKey ? RM.byKey(k) : null;
      if (!L || !L.track || certBy[L.track]) return;
      var e = byId[L.track], pct = Math.max(0, (e && e.pct) || 0);
      /* Only credentials actually under way. Two rows reading 0% is the same
         "you have done nothing" the old ring told somebody with 27 solves,
         just smaller. */
      if (pct > 0) open.push({ name: L.cert || L.title || L.track, pct: pct });
    });
    open.sort(function(a, b){ return b.pct - a.pct; });
    open = open.slice(0, 2);

    if (!items.length && !open.length){ $('dh-cred-sec').hidden = true; return; }
    $('dh-cred-sec').hidden = false;

    $('dh-certs').innerHTML = items.map(function(c){
      var tname = c.track_name || c.track || '';
      var initials = String(tname).split(/\s+/).filter(function(w){ return /^[A-Za-z]/.test(w); })
        .map(function(w){ return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
      var vurl = c.verify_url || (c.public_id ? '/cert/' + c.public_id : null);
      return '<div class="cert"><span class="seal">' + esc(initials) + '</span>' +
        '<span class="n"><b>' + esc(tname) + '</b><small>' + fmtDate(c.issued_at) +
        (c.score != null ? ' · ' + c.score + '%' : '') + '</small></span>' +
        (vurl ? '<a class="share" href="' + esc(vurl) + '">Share &rarr;</a>' : '') + '</div>';
    }).join('');

    $('dh-credprog').innerHTML = open.map(function(o){
      var low = o.pct < 10;
      return '<div class="cprog' + (low ? ' low' : '') + '">' +
        '<span class="lb"><b>' + esc(o.name) + '</b><span>' + fmtPct(o.pct) + '%</span></span>' +
        '<span class="t"><i style="width:' + Math.max(1, Math.min(100, o.pct)) + '%"></i></span></div>';
    }).join('');
  }

  function renderRailFoot(){
    var total = (S.saved && S.saved.total) || 0;
    var foot = $('dh-railfoot');
    if (!total){ foot.hidden = true; return; }
    foot.hidden = false;
    foot.innerHTML = fmt(total) + (total === 1 ? ' saved post. ' : ' saved posts. ') +
      '<a href="/saved-posts.html">Open them &rarr;</a>';
  }

  // ---------------- the work ----------------

  /* Hubs the reader has touched, most recent first. /api/me/hubs returns the
     count, the section they stopped in and what the next unsolved problem is
     called, so the dashboard can finally answer the one question it never
     could: what were you doing, and where do you pick it up. */
  function openHubs(){
    var m = (S.hubs && S.hubs.hubs) || {};
    return Object.keys(m).map(function(slug){
      var h = m[slug]; h.slug = slug; return h;
    }).filter(function(h){ return h && h.total > 0; })
      .sort(function(a, b){ return (b.last_at || 0) - (a.last_at || 0); });
  }
  function hubHref(h){
    return '/' + h.slug + '.html?studio=1' + (h.next && h.next.id ? '#' + h.next.id : '');
  }
  function hubName(h){
    return String(h.slug).replace(/-Exercises-in-R$/, ' Exercises')
      .replace(/-Exercises$/, ' Exercises').replace(/-/g, ' ');
  }

  /* The next real action, in priority order: a section you are close to
     clearing, then a course lesson, then the roadmap. Always with what it
     pays, because clearing a section is worth 25 XP and nothing on the site
     said so. */
  function renderAct(){
    var band = $('dh-act');
    var hubs = openHubs().filter(function(h){ return h.next && h.done < h.total; });
    var h = hubs[0];
    var act = activeLessonTrack();
    var rd = S.reading && S.reading.items && S.reading.items[0];
    var pb = $('dh-act-pb'), then = $('dh-act-then');

    if (h){
      var n = h.next, left = Math.max(0, (n.section_total || 0) - (n.section_done || 0));
      $('dh-act-k').textContent = 'Pick up where you left off';
      $('dh-act-h').textContent = hubName(h) + ', section ' + n.section +
        (n.section_title ? ': ' + n.section_title : '');
      $('dh-act-p').textContent =
        n.section_done + ' of ' + n.section_total + ' solved in this section. ' +
        (left === 1 ? 'One more clears it' : left + ' more clears it') + ' and pays 25 XP' +
        (n.last_section ? ', and leaves only the badge.' : '.');
      pb.hidden = false;
      $('dh-act-bar').style.width = Math.max(3, Math.round(100 * h.done / h.total)) + '%';
      var b = $('dh-act-btn');
      b.href = hubHref(h);
      b.innerHTML = 'Solve ' + esc(n.num || 'the next one') + ' &rarr;';
      $('dh-act-aft').textContent = n.title || '';
      if (act && act.p.resume){
        then.hidden = false;
        then.innerHTML = 'Then: <b>' + esc(titleFor(act.p.resume)) + '</b>, course lesson ' +
          (act.p.done + 1) + ' of ' + act.p.total + '.';
      } else then.hidden = true;
      band.hidden = false;
      return;
    }

    if (act){
      var L = RM.byKey ? RM.byKey(act.key) : null;
      $('dh-act-k').textContent = act.fresh ? 'Start your course' : 'Next up in your course';
      $('dh-act-h').textContent = titleFor(act.p.resume);
      $('dh-act-p').textContent = 'Course lesson ' + (act.p.done + 1) + ' of ' + act.p.total +
        (L ? ' in ' + L.cert : '') + '. Every lesson runs real R in your browser.';
      pb.hidden = false;
      $('dh-act-bar').style.width = Math.max(3, act.p.total ? Math.round(100 * act.p.done / act.p.total) : 3) + '%';
      var b2 = $('dh-act-btn'); b2.href = postHref(act.p.resume);
      b2.innerHTML = (act.fresh ? 'Start the course free' : 'Continue the course') + ' &rarr;';
      $('dh-act-aft').textContent = '';
      if (act.p.next){ then.hidden = false; then.innerHTML = 'After this one: <b>' + esc(titleFor(act.p.next)) + '</b>.'; }
      else then.hidden = true;
      band.hidden = false;
      return;
    }

    if (rd){
      $('dh-act-k').textContent = 'Pick up your reading';
      $('dh-act-h').textContent = titleFor(rd.slug);
      $('dh-act-p').textContent = 'Tutorial, ' + Math.round(rd.scroll_pct || 0) + '% read' +
        (rd.last_section ? ', last at ' + rd.last_section : '') + '.';
      pb.hidden = false;
      $('dh-act-bar').style.width = Math.max(3, Math.min(100, Math.round(rd.scroll_pct || 0))) + '%';
      var b3 = $('dh-act-btn'); b3.href = postHref(rd.slug); b3.innerHTML = 'Resume reading &rarr;';
      $('dh-act-aft').textContent = ''; then.hidden = true;
      band.hidden = false;
      return;
    }

    $('dh-act-k').textContent = 'Start practising';
    $('dh-act-h').textContent = 'Pick a hub and solve one';
    $('dh-act-p').textContent = 'A hundred and forty seven hubs, every problem graded the moment you check it.';
    pb.hidden = true;
    var b4 = $('dh-act-btn'); b4.href = '/exercises/'; b4.innerHTML = 'Browse the exercises &rarr;';
    $('dh-act-aft').textContent = ''; then.hidden = true;
    band.hidden = false;
  }

  /* One list where there used to be four cards. Today's set, where you were,
     reading in progress and email lessons closing were four boxes asking the
     same question; they are one table now, most urgent first. */
  function renderFlight(){
    var sec = $('dh-flight-sec');
    var rows = [];

    ((S.shelf && S.shelf.open) || []).forEach(function(o){
      var h = hoursLeft(o.closes_at);
      rows.push({
        sort: h, kind: 'mail',
        title: o.subject || 'Email lesson',
        meta: 'email lesson, day ' + o.seq + (o.course ? ', ' + String(o.course).replace(/-/g, ' ') : ''),
        num: h + 'h', numCls: h <= 24 ? 'hot' : (h <= 48 ? 'warm' : ''),
        href: o.slug ? postHref(o.slug) : '/dashboard.html', action: 'Open',
      });
    });

    openHubs().forEach(function(h){
      var done = h.done >= h.total;
      rows.push({
        sort: 1000 + rows.length, kind: '',
        title: hubName(h),
        meta: done
          ? 'every problem solved'
          : (h.next
              ? 'section ' + h.next.section + (h.sections ? ' of ' + h.sections : '') +
                (h.next.num ? ', next is ' + h.next.num : '') +
                (h.next.title ? ' ' + h.next.title : '')
              : 'in progress'),
        num: h.done + ' / ' + h.total, numCls: '',
        stars: null,
        href: hubHref(h), action: done ? 'Revisit' : 'Resume',
      });
    });

    var act = activeLessonTrack();
    if (act && act.p.resume){
      var L = RM.byKey ? RM.byKey(act.key) : null;
      rows.push({
        sort: 2000, kind: 'lesson',
        title: (L && L.cert) || titleFor(act.p.resume),
        meta: 'course lesson ' + (act.p.done + 1) + ' of ' + act.p.total +
              ', next is ' + titleFor(act.p.resume),
        num: act.p.done + ' / ' + act.p.total, numCls: '',
        href: postHref(act.p.resume), action: 'Resume',
      });
    }

    var rd = S.reading && S.reading.items && S.reading.items[0];
    if (rd){
      rows.push({
        sort: 3000, kind: 'read',
        title: titleFor(rd.slug),
        meta: 'tutorial' + (rd.last_section ? ', ' + rd.last_section : '') +
              ', ' + Math.round(rd.scroll_pct || 0) + '% read',
        num: Math.round(rd.scroll_pct || 0) + '%', numCls: '',
        href: postHref(rd.slug), action: 'Resume',
      });
    }

    if (!rows.length){ sec.hidden = true; return; }
    sec.hidden = false;
    rows.sort(function(a, b){ return a.sort - b.sort; });
    var show = rows.slice(0, 6);

    $('dh-flight-aside').textContent = rows.length === 1
      ? 'one thing' : rows.length + ' things, most urgent first';
    $('dh-flight').innerHTML = show.map(function(r){
      return '<a class="row" href="' + esc(r.href) + '">' +
        '<span class="t"><b><i class="kind ' + r.kind + '"></i>' + esc(r.title) + '</b>' +
        '<small>' + esc(r.meta) + '</small></span>' +
        '<span class="n ' + (r.numCls || '') + '">' + esc(r.num) + '</span>' +
        '<span class="s"></span>' +
        '<span class="a">' + esc(r.action) + ' &rarr;</span></a>';
    }).join('');

    var hubs = openHubs();
    var finished = hubs.filter(function(h){ return h.done >= h.total; }).length;
    var foot = $('dh-flight-foot');
    var extra = rows.length - show.length;
    if (extra > 0 || hubs.length){
      foot.hidden = false;
      var bits = [];
      if (extra > 0) bits.push(extra + ' more here');
      if (hubs.length) bits.push(hubs.length + (hubs.length === 1 ? ' hub touched' : ' hubs touched') +
        (finished ? ', ' + finished + ' finished' : ''));
      foot.innerHTML = '<span>' + esc(bits.join('. ')) + (bits.length ? '.' : '') +
        '</span><a href="/exercises/">All exercises &rarr;</a>';
    } else foot.hidden = true;

    /* One sell, in the one place a reader is already looking at a deadline. */
    var open = (S.shelf && S.shelf.open) || [];
    var sell = $('dh-sell');
    if (open.length >= 2 && !isPro()){
      var soonest = open.reduce(function(a, b){ return hoursLeft(a.closes_at) <= hoursLeft(b.closes_at) ? a : b; });
      sell.hidden = false;
      sell.innerHTML = open.length + ' email lessons are open and the oldest closes in ' +
        hoursLeft(soonest.closes_at) + ' hours. Pro keeps every one of them open for good. ' +
        '<a href="/pricing.html">See the Program &rarr;</a>';
    } else sell.hidden = true;
  }

  /* A year of showing up. The one chart worth the room: a week tells you
     nothing about a habit. */
  function renderYear(){
    var wk = (S.stats && S.stats.weeks) || null;
    var sec = $('dh-year-sec');
    if (!wk || !wk.length){ sec.hidden = true; return; }
    var any = wk.some(function(n){ return n > 0; });
    if (!any){ sec.hidden = true; return; }
    sec.hidden = false;
    var max = Math.max.apply(null, wk);
    $('dh-year').innerHTML = wk.map(function(n){
      if (!n) return '<i></i>';
      var lv = n >= max * 0.75 ? 4 : n >= max * 0.45 ? 3 : n >= max * 0.2 ? 2 : 1;
      return '<i class="l' + lv + '" title="' + n + (n === 1 ? ' solve' : ' solves') + '"></i>';
    }).join('');
    var active = (S.stats && S.stats.active_days_year) || 0;
    $('dh-year-aside').textContent = active + (active === 1 ? ' active day' : ' active days');
    $('dh-year-note').textContent = 'The last fifty-two weeks. Your longest run so far is ' +
      ((S.stats && S.stats.longest_streak_days) || 0) + ' days.';
  }

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

  /* The room switch is gone with the rooms. Desk puts the record in a rail
     beside the work instead of behind a tab, so there is no second room to
     remember. The old block queried #dh-seg and bound a listener to it, which
     on a page without that element threw before anything rendered. */

  function renderAll(){
    certBy = {}; ((S.certs && S.certs.items) || []).forEach(function(c){ certBy[c.track] = c; });
    renderHello(); renderWho(); renderStreak(); renderRecord();
    renderMilestones(); renderBadges(); renderCreds(); renderRailFoot();
    renderAct(); renderFlight(); renderYear();
  }

  fetch('/www/sidebar.json').then(function(r){ return r.ok ? r.json() : null; }).then(function(sb){ if (!sb) return; sb.forEach(function(sec){ (sec.items || []).forEach(function(it){ if (it.href && it.text) sbTitle[String(it.href).replace(/^\//, '')] = it.text; }); }); if (S.me){ renderAct(); renderFlight(); } }).catch(function(){});
  fetch('/courses.json', { cache:'no-cache' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if (d){ S.courses = d; if (S.me){ renderAct(); renderFlight(); renderCreds(); } } }).catch(function(){});
  fetch('/api/nurture/catalog').then(function(r){ return r.ok ? r.json() : null; }).then(function(d){ if (d){ S.cat = d; if (S.me){ renderBadges(); renderMilestones(); } } }).catch(function(){});
  document.addEventListener('auth-hydrated', function(){ checkOptin(); });

  if (isDemo){
    var dn = Math.floor(Date.now() / 1000), dpro = /[?&]demo=pro/.test(location.search);
    var days = []; for (var i = 89; i >= 0; i--){ var on = (i * 7 + 3) % 10 > 3 && i !== 2; days.push({ d: dayKey(i), xp: on ? 20 + (i % 4) * 12 : 0, solved: on ? 1 + (i % 3) : 0 }); }
    S.me = { user:{ display_name:'Selva Prabhakaran', email:'selva@example.com' }, pro:dpro };
    S.stats = { total_xp:4820, current_streak_days:12, longest_streak_days:14, streak_freezes:2, days:days };
    S.tracks = { total_solved:64, tracks:[{ id:'r-fundamentals', pct:100 }, { id:'tidyverse-practitioner', pct:100 }, { id:'machine-learning', pct:46 }, { id:'statistics-for-ds', pct:22 }] };
    S.certs = { items:[{ public_id:'RST-2026-T5V102', track:'tidyverse-practitioner', track_name:'Tidyverse Practitioner', issued_at:dn - 1000000, score:88, verify_url:'#' }, { public_id:'RST-2026-RF4127', track:'r-fundamentals', track_name:'R Foundations', issued_at:dn - 3000000, score:94, verify_url:'#' }] };
    S.reading = { items:[{ slug:'Linear-Regression', scroll_pct:62, last_section:'Model diagnostics' }] };
    S.saved = { total:34, items:[{ slug:'Logistic-Regression' }, { slug:'Random-Forest' }, { slug:'GARCH-Models-in-R' }, { slug:'Quantile-Regression-in-R' }] };
    S.daily = { bonus_xp:25, all_done:false, tasks:[
      { hub:'dplyr-Exercises', href:'#', reason:'keeps your wrangling sharp', difficulty:'core', done:true, track:'Data Analyst' },
      { hub:'Cross-Validation-Exercises', href:'#', reason:'practice from your active course', difficulty:'stretch', done:true, track:'Machine Learning' },
      { hub:'Inference-Exercises', href:'#', reason:'retries a question you missed on Tuesday', difficulty:'review', done:false, track:'Statistics' }] };
    S.hubs = { hubs: {
      'dplyr-Exercises': { done:38, total:50, sections:6, last_at:dn - 3600,
        next:{ id:'dplyr-Exercises-ex-4-7', num:'4.7', title:'Left joins that keep every row',
               section:4, section_title:'Joins and combining tables', section_done:6, section_total:8, last_section:false } },
      'Data-Cleaning-Exercises-in-R': { done:12, total:28, sections:5, last_at:dn - 90000,
        next:{ id:'Data-Cleaning-Exercises-in-R-ex-2-3', num:'2.3', title:'Fix the dates before the join',
               section:2, section_title:'Dates and types', section_done:3, section_total:6, last_section:false } },
      'stringr-Exercises-in-R': { done:18, total:22, sections:4, last_at:dn - 400000,
        next:{ id:'stringr-Exercises-in-R-ex-3-2', num:'3.2', title:'Capture groups that hold up',
               section:3, section_title:'Patterns', section_done:4, section_total:6, last_section:false } },
      'ggplot2-Exercises-in-R': { done:50, total:50, sections:6, last_at:dn - 900000, next:null }
    } };
    S.stats.solved = 312;
    S.stats.quality = { unaided:214, hinted:71, seen:27, unrated:0 };
    S.stats.weeks = (function(){ var w = [], k = 3; for (var j = 0; j < 52; j++){ k = (k * 37 + 11) % 97; w.push(k % 11 === 0 ? 0 : k % 14); } return w; })();
    S.stats.active_days_year = 186;
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
      soft('/api/me/daily').then(function(d){ if (d){ S.daily = d; renderHello(); } });
      soft('/api/me/shelf').then(function(d){ if (d){ S.shelf = d; renderBadges(); renderMilestones(); renderFlight(); } });
      /* The hub rows are what the In flight list is mostly made of, so they
         arrive on their own request rather than holding up the first paint. */
      soft('/api/me/hubs').then(function(d){ if (d){ S.hubs = d; renderAct(); renderFlight(); } });
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
