/* Practice Studio: a presentation layer over an exercise hub.
 *
 * The central idea, and the reason this is small: it does not reimplement any
 * exercise machinery. exercise-hub.js binds the real section.exercise cards
 * on DOMContentLoaded; this script runs afterwards and MOVES those same nodes
 * into a studio layout. Moving a node in the DOM keeps its event listeners,
 * so running code, grading, hints, solutions and attempt posting are all the
 * same code path that runs on the classic hub page. Nothing is duplicated and
 * nothing can drift.
 *
 * What it adds on top:
 *   - one problem at a time, with a spine and a hover-open list
 *   - a challenge gate: the editor is locked until Accept, and from that
 *     moment a count-up clock runs and is reported with each attempt
 *   - a status bar carrying the monthly practice allowance
 *   - the hub badge moment, from the server's hub_badge on the last solve
 *
 * Activation: ?studio=1 on any hub page. Leaving is a link away, and the
 * classic page is only hidden by a body class, never removed.
 */
(function () {
  'use strict';

  var PARAM = 'studio';
  var STORE_PIN = 'rsc-studio-pin';
  var OPEN_DELAY = 140, CLOSE_DELAY = 260;
  var IDLE_MS = 5 * 60 * 1000;

  function qs(s, r) { return (r || document).querySelector(s); }
  function qsa(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function mmss(ms) {
    var s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }
  function hms(ms) {
    var s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
    return h ? (h + 'h ' + m + 'm') : ((m || 1) + 'm');
  }

  var S = {
    cards: [],        // { node, id, num, title, sectionIndex }
    sections: [],     // { title, cards: [] }
    cur: 0,
    accepted: false,
    t0: 0, tick: null, pausedAt: 0, pauses: 0,
    pinned: false,
    meter: null,
    idle: null
  };

  /* ---------------------------------------------------------------
     Read the page. Sections come from the h2 headings the hub contract
     already emits, so nothing new has to be authored to get grouping.
     --------------------------------------------------------------- */
  function readPage() {
    var content = qs('main#content') || qs('#content');
    if (!content) return false;
    var section = null;
    qsa(':scope > h2, :scope > section.exercise', content).forEach(function (n) {
      if (n.tagName === 'H2') {
        section = {
          // headings carry a permalink glyph and a "Section N." prefix that
          // are chrome, not title
          title: (n.textContent || '')
            .replace(/^[^A-Za-z0-9]+/, '')
            .replace(/^Section\s+\d+[.:]?\s*/i, '')
            .replace(/\s*\(\d+\s+problems?\)\s*$/i, '')
            .trim(),
          cards: []
        };
        S.sections.push(section);
        return;
      }
      var id = n.getAttribute('data-exercise-id') || '';
      var m = id.match(/-ex-(\d+)-(\d+)$/);
      var h3 = qs('.exercise-title', n);
      var card = {
        node: n,
        id: id,
        num: m ? (m[1] + '.' + m[2]) : String(S.cards.length + 1),
        title: (h3 ? h3.textContent : '').replace(/^Exercise\s+[\d.]+:\s*/, '').trim(),
        sectionIndex: Math.max(0, S.sections.length - 1)
      };
      S.cards.push(card);
      if (section) section.cards.push(card);
    });
    return S.cards.length > 0;
  }

  function isSolved(card) {
    // exercise-hub.js marks a solved card; read its state rather than keep our own.
    return card.node.classList.contains('xh-solved') ||
           !!qs('.xh-check-status.is-pass', card.node) ||
           card.node.getAttribute('data-solved') === '1';
  }
  function solvedCount() {
    var n = 0;
    S.cards.forEach(function (c) { if (isSolved(c)) n++; });
    return n;
  }

  /* ---------------------------------------------------------------
     Build the shell
     --------------------------------------------------------------- */
  var ui = {};

  function build() {
    var shell = el('div', 'rs-shell');

    // --- bar
    var bar = el('div', 'rs-bar');
    var left = el('div', '', '<span class="rs-hub"></span>');
    ui.hub = qs('.rs-hub', left);
    ui.prog = el('div', 'rs-prog');
    var right = el('div', 'rs-right');
    ui.slot = el('span', 'rs-slot');
    ui.accept = el('button', 'rs-accept',
      '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Accept challenge');
    ui.slot.appendChild(ui.accept);
    ui.prev = el('button', 'rs-arrow', '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>');
    ui.next = el('button', 'rs-arrow', '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>');
    ui.prev.title = 'Previous problem'; ui.next.title = 'Next problem';
    ui.exit = el('a', 'rs-exit', 'Exit studio');
    ui.exit.href = location.pathname;
    right.appendChild(ui.slot); right.appendChild(ui.prev); right.appendChild(ui.next); right.appendChild(ui.exit);
    bar.appendChild(left); bar.appendChild(ui.prog); bar.appendChild(right);
    ui.bar = bar;

    // --- body: spine, panel, stage
    var body = el('div', 'rs-body');
    var spine = el('div', 'rs-spine');
    ui.spinetop = el('div', 'rs-spinetop', '<svg viewBox="0 0 24 24"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>');
    ui.spinetop.setAttribute('tabindex', '0');
    ui.spinetop.title = 'All problems';
    ui.count = el('div', 'rs-count', '0/0');
    ui.pips = el('div', 'rs-pips');
    spine.appendChild(ui.spinetop); spine.appendChild(ui.count); spine.appendChild(ui.pips);
    ui.spine = spine;

    var panel = el('div', 'rs-panel');
    var phead = el('div', 'rs-phead', '<span class="n"></span>');
    ui.pcount = qs('.n', phead);
    ui.pin = el('button', 'rs-pin', '<svg viewBox="0 0 24 24"><line x1="12" y1="17" x2="12" y2="22"/><path d="M9 3h6l-1 8 3 3v2H7v-2l3-3z"/></svg>');
    ui.pin.title = 'Keep this open';
    phead.appendChild(ui.pin);
    ui.plist = el('div', 'rs-plist');
    panel.appendChild(phead); panel.appendChild(ui.plist);
    ui.panel = panel;

    ui.stage = el('div', 'rs-stage');
    ui.hold = el('div', 'rs-hold');
    ui.paused = el('div', 'rs-paused',
      '<div class="big"></div><h3>Paused</h3>' +
      '<p>The clock is stopped and the problem is put away, so paused time can never buy thinking time. Your code is exactly where you left it.</p>' +
      '<button class="rs-resume" type="button">Resume</button>');
    ui.pausedClock = qs('.big', ui.paused);
    ui.stage.appendChild(ui.hold);
    body.appendChild(spine); body.appendChild(panel); body.appendChild(ui.stage); body.appendChild(ui.paused);
    ui.body = body;

    // --- status
    var status = el('div', 'rs-status',
      '<span class="cell"><span class="rs-sdot is-idle"></span><span class="rs-state">Not started</span></span>' +
      '<span class="cell"><b class="rs-solved">0</b> of <span class="rs-total">0</span> solved</span>' +
      '<span class="cell rs-timecell" style="display:none"><b class="rs-elapsed">0:00</b> elapsed</span>' +
      '<span class="cell sep rs-metercell"></span>' +
      '<span class="cell">R 4.6.0 ready</span>');
    ui.status = status;
    ui.sdot = qs('.rs-sdot', status); ui.state = qs('.rs-state', status);
    ui.solved = qs('.rs-solved', status); ui.total = qs('.rs-total', status);
    ui.timecell = qs('.rs-timecell', status); ui.elapsed = qs('.rs-elapsed', status);
    ui.metercell = qs('.rs-metercell', status);

    shell.appendChild(bar); shell.appendChild(body); shell.appendChild(status);
    document.body.appendChild(shell);
    ui.shell = shell;

    // --- overlays
    ui.scrim = el('div', 'rs-scrim');
    ui.scrim.appendChild(el('div', 'rs-card',
      '<svg class="rs-hex" viewBox="0 0 200 200"></svg>' +
      '<h3></h3><p class="sub"></p>' +
      '<div class="rs-stats"><div><b class="t"></b><span>time taken</span></div>' +
      '<div><b class="x"></b><span>problems solved</span></div>' +
      '<div><b class="h"></b><span>hints used</span></div></div>' +
      '<div class="rs-cardrow"><a class="rs-btn p" target="_blank" rel="noopener">View badge</a>' +
      '<button class="rs-btn rs-close" type="button">Keep going</button></div>'));
    document.body.appendChild(ui.scrim);

    ui.up = el('div', 'rs-scrim');
    ui.up.appendChild(el('div', 'rs-card rs-upcard',
      '<h3>Unlimited graded practice</h3>' +
      '<p>Pro removes the monthly check allowance and opens every lesson in all seven tracks.</p>' +
      '<div class="rs-upprice"><b>$14</b><span>a month, or $129 a year</span></div>' +
      '<p class="rs-upnote">14-day full refund, no questions asked. Cancel anytime.</p>' +
      '<div class="rs-cardrow"><a class="rs-btn p" href="/pricing.html">See the plans</a>' +
      '<button class="rs-btn rs-close" type="button">Not now</button></div>'));
    document.body.appendChild(ui.up);

    fit();
  }

  /* The shell sits under the site navbar, whose height can change on resize. */
  function fit() {
    var nav = qs('.sitenav');
    var top = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
    ui.shell.style.top = top + 'px';
  }

  /* ---------------------------------------------------------------
     Move the real nodes in. Listeners survive a move, which is the
     whole trick.
     --------------------------------------------------------------- */
  function adopt() {
    var content = qs('main#content') || qs('#content');
    // the shared setup block ("Run this once before any exercise"). It is one
    // node for the whole hub, so it rides along to whichever card is showing.
    ui.setupNode = qs(':scope > .webr-container', content);
    S.cards.forEach(function (c) { ui.hold.appendChild(c.node); splitCard(c.node); });
  }

  /* Split one card into two panes: the problem on the left, the work on the
     right. Done by moving nodes, never by re-creating them, so every listener
     exercise-hub.js attached survives. Runs once per card.

     exercise-hub.js has already restructured the card into:
       h3.exercise-title
       .xh-ex-body
         .webr-container [Your turn]      <- the answer editor, hoisted
         .xh-ex-inner
           .xh-zone-problem   task + expected result
           .xh-zone-work      [Setup data] + check row + verdict
           .xh-zone-help      hints + solution
           .xh-ex-foot        its own next button */
  function splitCard(card) {
    var body = qs('.xh-ex-body', card);
    if (!body || body.getAttribute('data-rs-split')) return;
    var inner = qs('.xh-ex-inner', body);
    var editor = body.querySelector(':scope > .webr-container');
    var title = card.querySelector(':scope > .exercise-title');
    var problem = qs('.xh-zone-problem', card);
    var help = qs('.xh-zone-help', card);
    var work = qs('.xh-zone-work', card);

    var left = el('div', 'rs-pane rs-pane-problem');
    var right = el('div', 'rs-pane rs-pane-work');

    if (title) left.appendChild(title);
    if (problem) left.appendChild(problem);
    if (help) left.appendChild(help);

    if (work) {
      // the answer editor belongs above the Check button, under any setup code
      var checkRow = qs('.xh-check-row', work);
      if (editor && checkRow) work.insertBefore(editor, checkRow);
      else if (editor) work.appendChild(editor);
      right.appendChild(work);
    } else if (editor) {
      right.appendChild(editor);
    }

    // Anything left in the old wrapper (the card's own next button) follows the
    // problem side, then the wrapper goes. Leaving it behind would make it a
    // third grid item and push the two panes out of their columns.
    if (inner) {
      while (inner.firstChild) left.appendChild(inner.firstChild);
      inner.remove();
    }
    body.appendChild(left);
    body.appendChild(right);
    body.setAttribute('data-rs-split', '1');
  }

  /* ---------------------------------------------------------------
     Render
     --------------------------------------------------------------- */
  function renderPips() {
    ui.pips.innerHTML = '';
    S.sections.forEach(function (sec, si) {
      if (si) ui.pips.appendChild(el('span', 'rs-pipsec'));
      sec.cards.forEach(function (c) {
        var i = S.cards.indexOf(c);
        var p = el('span', 'rs-pip' + (isSolved(c) ? ' is-done' : '') + (i === S.cur ? ' is-cur' : ''), c.num);
        p.setAttribute('data-go', String(i));
        p.title = c.num + '  ' + c.title;
        ui.pips.appendChild(p);
      });
    });
    ui.count.textContent = solvedCount() + '/' + S.cards.length;
  }

  function renderList() {
    var h = '';
    S.sections.forEach(function (sec) {
      if (sec.title) h += '<div class="rs-psec">' + sec.title + '</div>';
      sec.cards.forEach(function (c) {
        var i = S.cards.indexOf(c);
        h += '<div class="rs-prow' + (isSolved(c) ? ' is-done' : '') + (i === S.cur ? ' is-cur' : '') + '" data-go="' + i + '">' +
             '<span class="no">' + c.num + '</span><span class="ti">' + c.title + '</span>' +
             '<span class="tick">&#10003;</span></div>';
      });
    });
    ui.plist.innerHTML = h;
    ui.pcount.textContent = solvedCount() + ' of ' + S.cards.length + ' solved';
  }

  function renderBar() {
    var c = S.cards[S.cur];
    var sec = S.sections[c.sectionIndex];
    ui.hub.innerHTML = (document.title.split('|')[0].split(':')[0].trim() || 'Practice') +
      (sec && sec.title ? ' <span>&middot; ' + sec.title + '</span>' : '');
    // dots across the current section only, so the bar stays calm on big hubs
    var h = '';
    if (sec) {
      sec.cards.forEach(function (cc, j) {
        var i = S.cards.indexOf(cc);
        if (j) h += '<s class="' + (isSolved(sec.cards[j - 1]) ? 'is-done' : '') + '"></s>';
        h += '<i class="' + (isSolved(cc) ? 'is-done' : '') + (i === S.cur ? ' is-cur' : '') + '" data-go="' + i + '"></i>';
      });
    }
    ui.prog.innerHTML = h;
    ui.prev.disabled = S.cur === 0;
    ui.next.disabled = S.cur === S.cards.length - 1;
  }

  function renderStatus() {
    ui.solved.textContent = solvedCount();
    ui.total.textContent = S.cards.length;
    var m = S.meter;
    // Pro members and signed-out visitors have no allowance to show; an empty
    // cell would still draw its divider, so take it out of the bar entirely.
    if (!m || !m.metered) { ui.metercell.innerHTML = ''; ui.metercell.style.display = 'none'; return; }
    ui.metercell.style.display = '';
    var left = Math.max(0, (m.limit || 25) - (m.used || 0));
    var bars = '';
    for (var i = 0; i < (m.limit || 25); i++) bars += '<i class="' + (i < left ? '' : 'off') + '"></i>';
    var cls = 'cell sep', txt;
    if (left === 0) {
      cls += ' is-out';
      txt = '<b>No checks left</b>&nbsp;this month&nbsp;&middot;<span class="rs-go">Upgrade, $14 a month</span>';
    } else if (left <= 5) {
      cls += ' is-warn';
      txt = '<b>' + left + '</b>&nbsp;checks left this month&nbsp;&middot;<span class="rs-go">Upgrade</span>';
    } else {
      txt = '<b>' + left + '</b>&nbsp;of ' + (m.limit || 25) + ' checks left this month';
    }
    ui.metercell.className = cls;
    ui.metercell.innerHTML = '<span class="rs-meter">' + bars + '</span><span>' + txt + '</span>';
  }

  function show(i) {
    if (i < 0 || i >= S.cards.length) return;
    S.cards.forEach(function (c) { c.node.classList.remove('rs-current'); });
    S.cur = i;
    var node = S.cards[i].node;
    node.classList.add('rs-current');
    splitCard(node);
    // the hub's shared setup code follows the visible card into its work pane
    var right = qs('.rs-pane-work', node);
    if (right && ui.setupNode && ui.setupNode.parentElement !== right) {
      right.insertBefore(ui.setupNode, right.firstChild);
    }
    qsa('.rs-pane', node).forEach(function (p) { p.scrollTop = 0; });
    renderBar(); renderPips(); renderList();
    if (!S.pinned) closePanel();
  }

  /* ---------------------------------------------------------------
     Challenge clock
     --------------------------------------------------------------- */
  function accept() {
    S.accepted = true; S.t0 = Date.now();
    ui.bar.classList.add('is-live');
    ui.slot.innerHTML = '<span class="rs-dot"></span><span class="rs-clock">0:00</span>' +
      '<button class="rs-pause" type="button">Pause</button>';
    ui.clock = qs('.rs-clock', ui.slot);
    qs('.rs-pause', ui.slot).addEventListener('click', function () {
      S.tick ? pause() : resume();
    });
    document.body.classList.add('rs-accepted');
    ui.sdot.classList.remove('is-idle');
    ui.state.textContent = 'Challenge running';
    ui.timecell.style.display = '';
    startTick(); idleReset();
  }
  function startTick() {
    S.tick = setInterval(function () {
      var t = mmss(Date.now() - S.t0);
      if (ui.clock) ui.clock.textContent = t;
      ui.elapsed.textContent = t;
    }, 1000);
  }
  function pause() {
    if (!S.tick) return;
    clearInterval(S.tick); S.tick = null; S.pausedAt = Date.now(); S.pauses++;
    document.body.classList.add('rs-is-paused');
    ui.pausedClock.textContent = mmss(S.pausedAt - S.t0);
    var b = qs('.rs-pause', ui.slot); if (b) b.textContent = 'Resume';
    var d = qs('.rs-dot', ui.slot); if (d) d.style.background = '#cbd3dc';
    ui.sdot.classList.add('is-idle'); ui.state.textContent = 'Paused';
  }
  function resume() {
    if (S.tick) return;
    S.t0 += (Date.now() - S.pausedAt);
    document.body.classList.remove('rs-is-paused');
    var b = qs('.rs-pause', ui.slot); if (b) b.textContent = 'Pause';
    var d = qs('.rs-dot', ui.slot); if (d) d.style.background = '';
    ui.sdot.classList.remove('is-idle'); ui.state.textContent = 'Challenge running';
    startTick(); idleReset();
  }
  function idleReset() {
    clearTimeout(S.idle);
    if (!S.accepted || !S.tick) return;
    S.idle = setTimeout(pause, IDLE_MS);
  }

  /* exercise-hub.js reads this when it posts an attempt. */
  window.rsStudio = {
    elapsedMs: function () { return S.accepted && S.t0 ? (S.tick ? Date.now() - S.t0 : S.pausedAt - S.t0) : 0; },
    pauses: function () { return S.pauses; }
  };

  /* ---------------------------------------------------------------
     Panel open / close
     --------------------------------------------------------------- */
  var openT = null, closeT = null;
  function openPanel() { clearTimeout(closeT); ui.panel.classList.add('is-open'); }
  function closePanel() { if (S.pinned) return; ui.panel.classList.remove('is-open'); }
  function hoverIn() { clearTimeout(closeT); if (S.pinned) return; openT = setTimeout(openPanel, OPEN_DELAY); }
  function hoverOut() { clearTimeout(openT); if (S.pinned) return; closeT = setTimeout(closePanel, CLOSE_DELAY); }
  function setPin(on) {
    S.pinned = on;
    document.body.classList.toggle('rs-pinned', on);
    ui.pin.classList.toggle('is-on', on);
    ui.pin.title = on ? 'Unpin' : 'Keep this open';
    if (on) ui.panel.classList.add('is-open');
    try { localStorage.setItem(STORE_PIN, on ? '1' : '0'); } catch (e) { /* private mode */ }
  }

  /* ---------------------------------------------------------------
     The badge moment, straight from the server's response
     --------------------------------------------------------------- */
  function hexSvg(n) {
    return '<defs><linearGradient id="rsg" x1="0" y1="0" x2=".6" y2="1">' +
      '<stop offset="0" stop-color="#2f9b6e"/><stop offset="1" stop-color="#0f3d2a"/></linearGradient></defs>' +
      '<polygon points="192,100 146,179.7 54,179.7 8,100 54,20.3 146,20.3" fill="url(#rsg)"/>' +
      '<polygon points="176,100 138,165.8 62,165.8 24,100 62,34.2 138,34.2" fill="none" stroke="#fff" stroke-opacity=".42" stroke-width="1.8"/>' +
      '<text x="100" y="126" text-anchor="middle" font-family="Inter Tight, Inter, sans-serif" font-size="' +
      (String(n).length > 2 ? 44 : 66) + '" font-weight="800" fill="#fff">' + n + '</text>';
  }

  function celebrate(badge) {
    var rec = badge.record || {};
    var card = qs('.rs-card', ui.scrim);
    qs('.rs-hex', card).innerHTML = hexSvg(rec.solved || S.cards.length);
    qs('h3', card).textContent = badge.title || 'Hub complete';
    qs('.sub', card).textContent = 'Every problem in this hub is solved. The badge is in your collection now, with a public link anyone can check.';
    qs('.t', card).textContent = rec.elapsed_ms ? hms(rec.elapsed_ms) : (S.accepted ? hms(Date.now() - S.t0) : 'not timed');
    qs('.x', card).textContent = String(rec.solved || S.cards.length);
    qs('.h', card).textContent = rec.hints ? String(rec.hints) : 'none';
    var link = qs('.rs-btn.p', card);
    link.href = badge.url || ('/badge/' + badge.public_id);
    ui.scrim.classList.add('is-open');
    if (S.tick) { clearInterval(S.tick); S.tick = null; }
  }

  /* ---------------------------------------------------------------
     Wire
     --------------------------------------------------------------- */
  function wire() {
    ui.accept.addEventListener('click', accept);
    ui.prev.addEventListener('click', function () { show(S.cur - 1); });
    ui.next.addEventListener('click', function () { show(S.cur + 1); });
    [ui.spine, ui.panel].forEach(function (n) {
      n.addEventListener('mouseenter', hoverIn);
      n.addEventListener('mouseleave', hoverOut);
    });
    ui.spinetop.addEventListener('click', function () {
      ui.panel.classList.contains('is-open') ? closePanel() : openPanel();
    });
    ui.spinetop.addEventListener('focus', openPanel);
    ui.pin.addEventListener('click', function (e) { e.stopPropagation(); setPin(!S.pinned); });
    [ui.pips, ui.plist, ui.prog].forEach(function (n) {
      n.addEventListener('click', function (ev) {
        var t = ev.target.closest('[data-go]');
        if (t) show(parseInt(t.getAttribute('data-go'), 10));
      });
    });
    qs('.rs-resume', ui.paused).addEventListener('click', resume);
    [ui.scrim, ui.up].forEach(function (s) {
      qs('.rs-close', s).addEventListener('click', function () { s.classList.remove('is-open'); });
      s.addEventListener('click', function (ev) { if (ev.target === s) s.classList.remove('is-open'); });
    });
    ui.status.addEventListener('click', function (ev) {
      if (ev.target.classList.contains('rs-go')) ui.up.classList.add('is-open');
    });
    window.addEventListener('resize', fit);
    ['keydown', 'mousedown', 'wheel'].forEach(function (e) {
      document.addEventListener(e, idleReset, { passive: true });
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { clearTimeout(openT); closePanel(); }
    });

    // the graded result, from the real attempt endpoint
    document.addEventListener('exercise-attempt-result', function (ev) {
      var r = (ev.detail && ev.detail.result) || {};
      if (r.meter) { S.meter = r.meter; }
      renderPips(); renderList(); renderBar(); renderStatus();
      if (r.hub_badge && r.hub_badge.newly_minted) setTimeout(function () { celebrate(r.hub_badge); }, 650);
    });
    // exercise-hub.js repaints cards on hydrate; keep our chrome in step
    document.addEventListener('exercise-progress-changed', function () {
      renderPips(); renderList(); renderBar(); renderStatus();
    });
  }

  function loadMeter() {
    var hub = location.pathname.replace(/^\//, '').replace(/\.html?$/i, '');
    var tok = null;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') > 0) {
          var v = JSON.parse(localStorage.getItem(k));
          if (v && typeof v.access_token === 'string') tok = v.access_token;
        }
      }
    } catch (e) { /* anon */ }
    if (!tok) return;
    fetch('/api/me/meter?hub=' + encodeURIComponent(hub), { headers: { Authorization: 'Bearer ' + tok } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (m) { if (m) { S.meter = m; renderStatus(); } })
      .catch(function () {});
  }

  /* ---------------------------------------------------------------
     Boot, after exercise-hub.js has bound the cards
     --------------------------------------------------------------- */
  /* exercise-hub.js restructures each card into .xh-ex-body / .xh-zone-* some
     time after DOMContentLoaded, and the two-pane split needs those zones to
     exist. Wait for the first card to be rebuilt rather than guess a delay. */
  function whenCardsReady(cb, tries) {
    tries = tries || 0;
    if (qs('.xh-ex-body', S.cards[0].node) || tries > 50) return cb();
    setTimeout(function () { whenCardsReady(cb, tries + 1); }, 100);
  }

  function start() {
    if (!readPage()) return;
    whenCardsReady(mount);
  }

  function mount() {
    document.body.classList.add('rs-studio');
    clearGuard();
    build();
    adopt();
    wire();
    try { if (localStorage.getItem(STORE_PIN) === '1') setPin(true); } catch (e) { /* fine */ }
    show(0);
    renderStatus();
    loadMeter();
    document.addEventListener('auth-hydrated', function () {
      setTimeout(function () { renderPips(); renderList(); renderBar(); loadMeter(); }, 60);
    });
  }

  /* The studio can only mount once exercise-hub.js has rebuilt the cards,
     which is after first paint. Without a guard the classic page shows for a
     beat and then swaps, which reads as a glitch. Hide the page body the
     moment this script parses and reveal it as the studio. The rule is
     injected rather than left to practice-studio.css, because that stylesheet
     loads non-render-blocking and would arrive too late to help. */
  function bootGuard() {
    var st = document.createElement('style');
    st.id = 'rs-boot-guard';
    st.textContent = 'html.rs-booting .container > .row,html.rs-booting .rsft,html.rs-booting footer{display:none!important}' +
                     'html.rs-booting{background:#fff}';
    (document.head || document.documentElement).appendChild(st);
    document.documentElement.classList.add('rs-booting');
    // never strand the page if anything below throws
    setTimeout(clearGuard, 8000);
  }
  function clearGuard() { document.documentElement.classList.remove('rs-booting'); }

  function boot() {
    var p = new URLSearchParams(location.search);
    if (p.get(PARAM) !== '1') return;
    if (!qs('section.exercise')) return;
    bootGuard();
    // exercise-hub.js binds on DOMContentLoaded; window load is safely after.
    if (document.readyState === 'complete') setTimeout(start, 0);
    else window.addEventListener('load', function () { setTimeout(start, 0); });
  }

  boot();
})();
