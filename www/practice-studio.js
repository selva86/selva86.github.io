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
  var STORE_TASTER = 'rsc-studio-taster';
  var LIMIT = 25;          // the free monthly allowance, shown wherever it applies
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
    xp: 0,
    cards: [],        // { node, id, num, title, sectionIndex }
    sections: [],     // { title, cards: [] }
    cur: 0,
    accepted: false,
    t0: 0, tick: null, pausedAt: 0, pauses: 0,
    pinned: false,
    meter: null,
    idle: null,
    vsec: 0,          // the section the two menus and the dot strip are showing
    hubIndex: null,   // every hub on the platform, from /www/hub-index.json
    hubDone: null     // slug -> problems this reader has passed there
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
        title: exerciseName(h3),
        difficulty: (n.getAttribute('data-difficulty') || '').toLowerCase(),
        sectionIndex: Math.max(0, S.sections.length - 1)
      };
      S.cards.push(card);
      if (section) section.cards.push(card);
    });
    /* A hub's last heading is often "What to do next", prose with no problems
       under it. Left in, it became a section you could pick from the menu and
       land on nothing: an empty exercise list and an empty strip. Dropping the
       empty ones here means every section anything counts is a section that
       has work in it. */
    S.sections = S.sections.filter(function (sc) { return sc.cards.length > 0; });
    S.sections.forEach(function (sc, si) {
      sc.cards.forEach(function (c) { c.sectionIndex = si; });
    });
    // a problem that appeared before any heading belongs to the first section
    S.cards.forEach(function (c) {
      if (!(c.sectionIndex >= 0 && c.sectionIndex < S.sections.length)) c.sectionIndex = 0;
    });
    return S.cards.length > 0;
  }

  /* The clean name of an exercise, whatever state the heading is in. */
  function exerciseName(h3) {
    if (!h3) return '';
    var named = qs('.xh-ex-name', h3);
    var t = (named ? named.textContent : h3.textContent) || '';
    return t.replace(/^\s*#\s*/, '')
            .replace(/^\s*Exercise\s+[\d.]+\s*:?\s*/i, '')
            .trim();
  }

  function isSolved(card) {
    // exercise-hub.js marks a solved card with is-solved, both on a fresh pass
    // and when it hydrates saved progress. Read its state rather than keep our
    // own, so the spine can never disagree with the card.
    return card.node.classList.contains('is-solved') ||
           !!qs('.xh-check-status.is-pass', card.node);
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
    // an h1, not a span: the studio hides the page's own heading, and a page
    // with no heading at all is a worse page, for a reader or a crawler
    var left = el('div', 'rs-barleft', '<h1 class="rs-hub"></h1>');
    ui.hub = qs('.rs-hub', left);
    /* The two menus and the dot strip live together in the middle of the
       bar: section, then problem, then the shape of that section. Fifty dots
       used to sit here instead, which was a picture of the hub rather than a
       way through it. */
    ui.nav2 = el('div', 'rs-nav2');
    ui.secmenu = makeMenu('rs-secmenu', 'Section');
    ui.exmenu = makeMenu('rs-exmenu', 'Problem');
    ui.secmenu.onpick = function (si) { setViewedSection(si); };
    ui.exmenu.onpick = function (i) { show(i); };
    ui.prog = el('div', 'rs-prog');
    ui.nav2.appendChild(ui.secmenu);
    ui.nav2.appendChild(ui.exmenu);
    ui.nav2.appendChild(ui.prog);
    var right = el('div', 'rs-right');
    ui.slot = el('span', 'rs-slot');
    ui.accept = el('button', 'rs-accept',
      '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Accept challenge');
    ui.slot.appendChild(ui.accept);
    ui.prev = el('button', 'rs-arrow', '<svg viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>');
    ui.next = el('button', 'rs-arrow', '<svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>');
    ui.prev.title = 'Previous problem'; ui.next.title = 'Next problem';
    ui.exit = el('a', 'rs-exit', 'Exit studio');
    ui.exit.href = location.pathname + '?' + PARAM + '=0';
    ui.exit.title = 'Read this hub as a plain page';
    right.appendChild(ui.slot); right.appendChild(ui.prev); right.appendChild(ui.next); right.appendChild(ui.exit);
    bar.appendChild(left); bar.appendChild(ui.nav2); bar.appendChild(right);
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
    var track = el('div', 'rs-ptrack', '<i></i>');
    ui.pbar = qs('i', track);
    ui.dest = el('div', 'rs-dest-wrap');
    panel.appendChild(phead); panel.appendChild(track); panel.appendChild(ui.plist);
    panel.appendChild(ui.dest);
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
      '<span class="cell"><b class="rs-xpearned">0</b> XP earned</span>' +
      '<span class="cell rs-timecell" style="display:none"><b class="rs-elapsed">0:00</b> elapsed</span>' +
      '<span class="cell sep rs-metercell"></span>' +
      '<span class="cell rs-nudgecell" style="display:none"></span>' +
      '<span class="cell">R 4.6.0 ready</span>');
    ui.status = status;
    ui.sdot = qs('.rs-sdot', status); ui.state = qs('.rs-state', status);
    ui.solved = qs('.rs-solved', status); ui.total = qs('.rs-total', status);
    ui.xpearned = qs('.rs-xpearned', status);
    ui.nudgecell = qs('.rs-nudgecell', status);
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

    ui.starScrim = el('div', 'rs-scrim rs-starscrim');
    ui.starScrim.appendChild(el('div', 'rs-card',
      '<div class="rs-starrow"></div><h3></h3><p class="sub"></p>' +
      '<div class="rs-cardrow"><button class="rs-btn p rs-starnext" type="button">Accept the challenge</button></div>'));
    document.body.appendChild(ui.starScrim);

    ui.signinScrim = el('div', 'rs-scrim');
    ui.signinScrim.appendChild(el('div', 'rs-card rs-signincard',
      '<h3></h3><p class="sub"></p>' +
      '<div class="rs-cardrow"><a class="rs-btn p">Create a free account</a>' +
      '<a class="rs-btn">I already have one</a></div>' +
      '<button class="rs-close rs-signinlater" type="button">Not now</button>'));
    document.body.appendChild(ui.signinScrim);
    ui.signin = qs('.rs-signincard', ui.signinScrim);

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
  var NARROW = 1040;

  /* On a wide screen the shell is a fixed overlay pinned under the site
     navbar. On a narrow one it is an ordinary block and the page scrolls, so
     the inline offset has to come off or it fights the stylesheet. */
  function fit() {
    if (window.innerWidth <= NARROW) { ui.shell.style.top = ''; return; }
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
    /* The hub's shared prelude ("Run this once before any exercise") loads the
       libraries every exercise needs. Its code is copied into the top of every
       answer editor, so the block itself has no job left on screen: park it. */
    ui.park = el('div', 'rs-park');
    ui.shell.appendChild(ui.park);
    ui.setupNode = qs(':scope > .webr-container', content);
    if (ui.setupNode) {
      S.preludeHtml = editorHtml(ui.setupNode);
      ui.park.appendChild(ui.setupNode);
    }
    S.cards.forEach(function (c) { ui.hold.appendChild(c.node); splitCard(c.node); });
  }

  var XPBY = { beginner: 10, intermediate: 25, advanced: 50 };

  /* ---------------------------------------------------------------
     Setup code lives in the editor

     A hub's setup arrives as its own code blocks: one shared prelude that
     loads the libraries, and often a per-exercise block that builds the data.
     Keeping them as separate blocks the reader has to run first is where this
     kept going wrong. Run them for the reader and the work happens behind a
     lock with no visible progress, on a cold start for well over a minute.
     Leave them to the reader and the first answer fails with "object not
     found", because the block that defines it is folded away somewhere else.

     So the setup is simply part of the code in the editor, above the answer.
     One Run does everything, in order, with the package installer reporting on
     the button the reader actually pressed. Nothing is hidden and nothing has
     to happen first.

     Grading is unaffected: the runner prints the value of the last expression,
     which is still the reader's answer. The lines are carried over as markup,
     not text, so they keep their syntax colouring.
     --------------------------------------------------------------- */

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function editorHtml(container) {
    var ed = container && qs('.webr-editor', container);
    return ed ? ed.innerHTML.replace(/\s+$/, '') : '';
  }

  function commentLine(text) {
    return '<span class="cl"><span class="c1">' + esc(text) + '</span></span>';
  }

  /* The combined source for one card: the shared prelude, this card's own
     setup, then the starter the exercise ships with. */
  function editorSource(card, answer, setups) {
    var before = [];
    if (S.preludeHtml) before.push(S.preludeHtml);
    setups.forEach(function (c) {
      var h = editorHtml(c);
      if (h) before.push(h);
    });
    var starter = editorHtml(answer);
    if (!before.length) return starter;
    return [
      commentLine('# Setup, written for you. Runs with your answer.'),
      before.join('\n' + commentLine('') + '\n'),
      commentLine(''),
      commentLine('# Your answer.'),
      starter
    ].join('\n');
  }

  /* The setup sits above the answer, so on a tall block the reader's own line
     can start out below the fold of the editor. Bring it into view. */
  function showAnswerArea(node) {
    var ed = qs('.rs-pane-work .webr-editor', node);
    if (!ed || !S.preludeHtml) return;
    var lines = qsa('.cl', ed);
    var marker = null;
    lines.forEach(function (n) {
      if (/# Your answer\./.test(n.textContent || '')) marker = n;
    });
    if (!marker) return;
    /* Measured from rendered rectangles, not offsetTop: these lines are inline
       and their offsetParent is not the element we are scrolling, so offsets
       lie. Anchoring to the marker's own top leaves the view on a line
       boundary, instead of slicing the top line in half. */
    var edTop = ed.getBoundingClientRect().top;
    var pitch = lines.length > 1
      ? (lines[1].getBoundingClientRect().top - lines[0].getBoundingClientRect().top)
      : (parseFloat(getComputedStyle(ed).lineHeight) || 20);
    var pad = parseFloat(getComputedStyle(ed).paddingTop) || 0;
    var delta = marker.getBoundingClientRect().top - edTop - pad - pitch * 2;
    ed.scrollTop = Math.max(0, ed.scrollTop + delta);
  }

  /* One button in the action row. Hint and Solution drive the real controls,
     which stay in the problem pane because that is where the reading happens;
     Run and Reset forward to the editor's own buttons. Nothing is
     re-implemented here, so grading and hint accounting are untouched. */
  function proxyBtn(kind, label, card, target) {
    var b = el('button', 'rs-btn');
    b.type = 'button';
    b.setAttribute('data-rs', kind);
    b.textContent = label;
    b.addEventListener('click', function () {
      if (kind === 'hint') {
        var open = qsa('.xh-hint-link', card).filter(function (h) { return !h.disabled; });
        if (!open[0]) return;
        open[0].click();
        scrollProblem(card, '.xh-hints');
        // hint 2 starts disabled and exercise-hub enables it only once hint 1 is
        // out, so the remaining count has to be read after the click, not before
        setTimeout(function () {
          b.disabled = !qsa('.xh-hint-link', card).some(function (h) { return !h.disabled; });
        }, 0);
        return;
      }
      if (kind === 'solution') {
        var d = qs('.exercise-solution', card);
        if (!d) return;
        // a toggle, because the studio hides the disclosure's own summary and
        // this would otherwise be the only way in and no way back out
        d.open = !d.open;
        // opening it is what costs the stars; closing it again changes nothing
        if (d.open) {
          try {
            // exercise-hub.js listens for the toggle and reads the id off
            // .xh-ex-body, so the studio does not need to resolve it here.
            // Left as a no-op on purpose rather than duplicating that lookup.
          } catch (e) { /* never block the reveal */ }
        }
        b.textContent = d.open ? 'Hide solution' : 'Solution';
        if (d.open) scrollProblem(card, '.exercise-solution');
        return;
      }
      if (target) target.click();
    });
    return b;
  }
  function scrollProblem(card, sel) {
    var pane = qs('.rs-pane-problem', card), t = qs(sel, card);
    if (pane && t) pane.scrollTop = Math.max(0, t.offsetTop - 90);
  }

  /* Rebuild one card as two panes.

       problem  our own title and meta line, the task, the expected result,
                and the hints and solution, which are read, not operated
       work     setup code folded away, one editor, one action row, one console

     Every element is MOVED, never re-created, so the listeners exercise-hub.js
     bound to the editor, the Check button, the hint links and the solution
     disclosure all survive. Runs once per card.

     exercise-hub.js leaves each card as:
       h3.exercise-title > button.xh-ex-head   (number, name, dots, timer)
       .xh-ex-body
         .webr-container [Your turn]
         .xh-ex-inner
           .xh-zone-problem  task + expected result
           .xh-zone-work     [Setup data] + check row + verdict
           .xh-zone-help     hints + solution
           .xh-ex-foot       its own next button */
  function splitCard(card) {
    var body = qs('.xh-ex-body', card);
    if (!body || body.getAttribute('data-rs-split')) return;
    var inner = qs('.xh-ex-inner', body);
    var head = card.querySelector(':scope > .exercise-title');
    var problem = qs('.xh-zone-problem', card);
    var help = qs('.xh-zone-help', card);
    var work = qs('.xh-zone-work', card);

    var answer = null, setups = [];
    qsa('.webr-container', card).forEach(function (c) {
      var t = c.getAttribute('data-block-title') || '';
      if (t === 'Your turn') answer = c;
      else if (/setup|run this once/i.test(t)) setups.push(c);
    });

    var left = el('div', 'rs-pane rs-pane-problem');
    var right = el('div', 'rs-pane rs-pane-work');

    // ---------- problem pane: our own heading, then the reading matter
    var idm = (card.getAttribute('data-exercise-id') || '').match(/-ex-(\d+)-(\d+)$/);
    var diff = (card.getAttribute('data-difficulty') || '').toLowerCase();
    var bits = [];
    if (idm) bits.push('Problem ' + idm[1] + '.' + idm[2]);
    if (diff) bits.push('<b>' + esc(diff) + '</b>');
    if (XPBY[diff]) bits.push('worth <b>' + XPBY[diff] + ' XP</b>');
    var nameNode = head && qs('.xh-ex-name', head);
    var titleText = (nameNode ? nameNode.textContent : (head ? head.textContent : ''))
      .replace(/^\s*Exercise\s+[\d.]+\s*:?\s*/i, '').trim();

    left.appendChild(el('h2', 'rs-title', esc(titleText)));
    left.appendChild(el('div', 'rs-meta', bits.join(' &nbsp;&middot;&nbsp; ')));
    // the original heading stays in the DOM but out of sight: exercise-hub.js
    // writes its dots and timer, and removing it would break that
    if (head) { head.classList.add('rs-offstage'); left.appendChild(head); }
    if (problem) left.appendChild(problem);
    if (help) left.appendChild(help);

    // ---------- work pane: setup fold, editor, actions, console
    /* With the setup parked, the answer block is the only .webr-container left
       in the card outside the solution, so exercise-hub can only resolve it as
       the block to grade. That used to depend on DOM order. */
    if (answer) right.appendChild(answer);
    /* The setup blocks have no job on screen any more: their code is already
       at the top of the editor. Park the nodes rather than delete them, so
       anything holding a reference to one still finds it. */
    if (answer) {
      var edNode = qs('.webr-editor', answer);
      if (edNode) edNode.innerHTML = editorSource(card, answer, setups);
    }
    setups.forEach(function (c) { if (ui.park) ui.park.appendChild(c); });

    var actions = el('div', 'rs-actions');
    var checkBtn = qs('.xh-check-btn', card);
    var checkStatus = qs('.xh-check-status', card);
    if (checkBtn) actions.appendChild(checkBtn);
    actions.appendChild(proxyBtn('run', 'Run', card, answer && qs('.webr-run-btn', answer)));
    actions.appendChild(proxyBtn('hint', 'Hint', card));
    actions.appendChild(proxyBtn('solution', 'Solution', card));
    actions.appendChild(proxyBtn('reset', 'Reset', card, answer && qs('.webr-reset-btn', answer)));
    if (checkStatus) actions.appendChild(checkStatus);
    if (XPBY[diff]) actions.appendChild(el('span', 'rs-xp', '+' + XPBY[diff] + ' XP'));

    /* ---------- the console.

       The output pane must NOT leave the answer container. Both runners find
       it the same way:
         webr-init.min.js   container.querySelector('.webr-output')
         exercise-hub.js    card.yourTurn.querySelector('.webr-output')
       Move it and Run throws on a null output, and grading reads nothing. So
       the action row and the console label move INTO the container, directly
       above the output, and the output itself is only restyled. The editor
       ends up on top, the controls under it, the console at the bottom. */
    var outPre = answer && qs('.webr-output', answer);
    if (outPre) {
      // the output sits inside .webr-code-block, not directly under the
      // container, so insert against its real parent
      outPre.classList.add('rs-console');
      var host = outPre.parentNode;
      host.insertBefore(actions, outPre);
      host.insertBefore(el('div', 'rs-console-head', 'Console'), outPre);
    } else if (answer) {
      answer.appendChild(actions);
    } else {
      right.appendChild(actions);
    }
    var verdict = qs('.xh-verdict', card);
    if (verdict) (answer || right).appendChild(verdict);

    // Until the challenge is accepted the work pane is covered and inert, so a
    // recorded time is always a real time. The cover repeats the Accept button
    // rather than pointing at the bar: the answer to "why can't I type" should
    // be under the cursor, not somewhere else on screen.
    var gate = el('div', 'rs-gate',
      '<p>Start the challenge to open the editor.</p>' +
      '<p class="sub">The clock counts up from zero. Pause it whenever you need to, and it stops on its own after five idle minutes.</p>');
    var gbtn = el('button', 'rs-gate-btn', 'Accept the challenge');
    gbtn.type = 'button';
    gbtn.addEventListener('click', function () { accept(); });
    gate.appendChild(gbtn);
    right.appendChild(gate);

    // ---------- leftovers, then place the panes
    if (work && !work.children.length && work.parentElement) work.remove();
    if (inner) {
      while (inner.firstChild) left.appendChild(inner.firstChild);
      inner.remove();
    }
    body.appendChild(left);
    body.appendChild(right);
    body.setAttribute('data-rs-split', '1');
  }

  /* ---------------- the rail ----------------

     Every hub on the platform, not this hub's problems. Those have the dot
     strip, the two menus and the arrows already; what a reader had no way to
     see was where this hub sits among the other hundred and forty two, or
     which of them they had touched.

     Collapsed and expanded are the same list at the same pitch: one square
     per hub against one row per hub, --rowh apart in both, so hovering the
     rail slides names in beside the squares rather than past them.

     The whole platform, and never a filtered slice of it: a rail that hid
     the categories a reader has not started would hide exactly the ones
     worth showing them. */

  function railCats() { return S.hubIndex || []; }

  // hub-index rows are [title, href, problems]; the slug is the page name
  function hubSlugOf(href) { return String(href || '').replace(/\.html$/, ''); }

  function thisHubSlug() {
    var p = location.pathname.split('/').pop() || '';
    return hubSlugOf(p);
  }

  /* done / total for one hub. The hub the reader is standing in is read live
     off the page, because a solve two seconds ago has to show here before
     any server round trip; everything else comes from /api/me/hubs. */
  function hubProgress(slug, total) {
    if (slug === S.hubSlug) return { done: solvedCount(), total: S.cards.length || total };
    /* /api/me/hubs returns a row per hub now, not a bare count, because the
       dashboard needs the rest of the sentence. Both shapes are read here so
       a cached older response cannot blank the rail. */
    var d = S.hubDone && S.hubDone[slug];
    if (typeof d === 'number') return { done: d, total: total };
    if (d && typeof d.done === 'number') return { done: d.done, total: d.total || total };
    return { done: 0, total: total };
  }

  function hubState(p) {
    if (p.total > 0 && p.done >= p.total) return 'is-done';
    return p.done > 0 ? 'is-part' : '';
  }

  function renderPips() {
    var h = '';
    railCats().forEach(function (cat) {
      /* A rule, not a number. The squares below it already count 1..n inside
         the category, so a category ordinal sitting in the same column read
         as one more hub with a wrong number. The name is on hover, and
         expanded it is written out. */
      h += '<span class="rs-pipsec" title="' + esc(cat.name) + '"></span>';
      cat.hubs.forEach(function (row, hi) {
        var slug = hubSlugOf(row[1]);
        var here = slug === S.hubSlug;
        var p = hubProgress(slug, row[2]);
        h += '<button type="button" class="rs-pip ' + hubState(p) +
             (here ? ' is-cur' : '') + '" data-hub="' + esc(row[1]) +
             '" aria-label="' + esc(row[0]) + ', ' + p.done + ' of ' + p.total + ' solved' +
             (here ? ', you are here' : '') + '" title="' + esc(row[0]) +
             '  ' + p.done + '/' + p.total + '">' + (hi + 1) + '</button>';
      });
    });
    ui.pips.innerHTML = h;
    ui.count.textContent = solvedCount() + '/' + S.cards.length;
  }

  /* The rail, expanded. The same rows, now with names, and every one of them
     a real link: a reader can middle-click a hub open in a tab, which a
     button could never give them. The hub they are in is not a link, because
     a link to where you already are is a dead control. */
  function renderList() {
    var h = '';
    railCats().forEach(function (cat) {
      if (!cat.name) return;
      var tot = 0, got = 0;
      cat.hubs.forEach(function (row) {
        var p = hubProgress(hubSlugOf(row[1]), row[2]);
        tot += p.total; got += p.done;
      });
      h += '<div class="rs-psec' + (tot > 0 && got >= tot ? ' is-done' : '') +
           '"><span class="t">' + esc(cat.name) + '</span>' +
           '<span class="c">' + cat.hubs.length + '</span></div>';
      cat.hubs.forEach(function (row, hi) {
        var slug = hubSlugOf(row[1]);
        var here = slug === S.hubSlug;
        var p = hubProgress(slug, row[2]);
        h += (here ? '<span class="rs-prow is-cur ' : '<a class="rs-prow ') +
             hubState(p) + (here ? '"' : '" href="/' + esc(row[1]) + '?studio=1"') + '>' +
             '<span class="mark" aria-hidden="true"></span>' +
             '<span class="no">' + (hi + 1) + '</span>' +
             '<span class="ti">' + esc(row[0]) + '</span>' +
             '<span class="hn">' + (p.done ? p.done + '/' + p.total : p.total) + '</span>' +
             (here ? '</span>' : '</a>');
      });
    });
    ui.plist.innerHTML = h || '<div class="rs-pempty">Loading the catalogue</div>';
    renderDest();
    var n = solvedCount();
    ui.pcount.innerHTML = '<b>' + n + '</b> of ' + S.cards.length + ' solved here';
    if (ui.pbar) ui.pbar.style.width = (S.cards.length ? (n / S.cards.length * 100) : 0) + '%';
  }

  /* Open the rail on the hub the reader is in. Both scrollers are moved by
     the same amount, because they share one pitch and mirroring the offset is
     what keeps a square beside its own name. */
  function railToHere() {
    var pip = qs('.rs-pip.is-cur', ui.pips);
    if (!pip) return;
    /* Both axes: the rail is a column on a desktop and a swipe strip on a
       phone, and the other axis has no overflow to move in either case. */
    var top = Math.max(0, pip.offsetTop - Math.round(ui.pips.clientHeight / 2));
    ui.pips.scrollTop = top;
    ui.plist.scrollTop = top;
    ui.pips.scrollLeft = Math.max(0, pip.offsetLeft - Math.round(ui.pips.clientWidth / 2));
  }

  /* The catalogue, once, from a 9 KB projection of the file /exercises/ is
     built from. Cached hard by the /www/ rule, so a reader moving between
     hubs pays for it on the first page only. */
  function loadHubIndex() {
    fetch('/www/hub-index.json?v=1', { credentials: 'omit' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.categories) return;
        S.hubIndex = d.categories;
        /* A hub can be published before the catalogue is rebuilt, and five of
           them are in that state today. Rather than leave a reader unable to
           find the page they are standing on, it is added at the end. The
           group disappears of its own accord the next time the catalogue is
           built, because the hub will be in a real category by then. */
        var found = false;
        S.hubIndex.forEach(function (c) {
          c.hubs.forEach(function (r) { if (hubSlugOf(r[1]) === S.hubSlug) found = true; });
        });
        if (!found && S.hubSlug) {
          S.hubIndex = S.hubIndex.concat([{ name: 'Also published', hubs: [
            [hubName(), S.hubSlug + '.html', S.cards.length]] }]);
        }
        renderPips(); renderList();
        railToHere();
      })
      .catch(function () { /* the rail stays empty; nothing else depends on it */ });
  }

  /* What the reader has solved everywhere else. Signed out this 401s and the
     rail simply shows problem counts instead of progress, which is the right
     thing to show somebody who has none yet. */
  function loadHubProgress() {
    fetch('/api/me/hubs', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.hubs) return;
        S.hubDone = d.hubs;
        renderPips(); renderList();
      })
      .catch(function () { /* counts only, which is still a usable rail */ });
  }


  /* What this hub leads to, pinned under the list.
   *
   * Two rows, and neither one borrows the other's meaning. Solving every
   * exercise here earns the hub badge, which is a real public credential at
   * /badge/<id>. It does not earn a certificate: a certificate needs 80 per
   * cent of a whole track, and a track is ten to twelve hubs. So the second
   * row names the track and states the distance rather than implying the hub
   * closes it. */
  function trackFacts() {
    if (S._track !== undefined) return S._track;
    S._track = null;
    try {
      var tag = document.getElementById('rs-track');
      if (tag) S._track = JSON.parse(tag.textContent);
    } catch (e) { /* a hub no track claims, or bad JSON: the row just hides */ }
    return S._track;
  }

  function renderDest() {
    if (!ui.dest) return;
    var total = S.cards.length, done = solvedCount();
    var t = trackFacts();
    var h = '';

    h += '<a class="rs-dest' + (done === total && total > 0 ? ' is-done' : '') +
         '" id="rs-dest-badge"' + (S.badgeUrl ? ' href="' + esc(S.badgeUrl) + '"' : '') + '>' +
         '<span class="k">Badge</span>' +
         '<span class="b">' + esc(hubName()) + '</span>' +
         '<span class="s">' + (done === total && total > 0
            ? 'earned, public link'
            : 'all ' + total + ' solved') + '</span>' +
         '<span class="n">' + done + ' / ' + total + '</span></a>';

    if (t && t.name) {
      var pct = t.trackTotal ? Math.round(t.hubShare / t.trackTotal * 100) : 0;
      h += '<a class="rs-dest" href="/certifications.html#tracks">' +
           '<span class="k">Certificate</span>' +
           '<span class="b">' + esc(t.name) + '</span>' +
           '<span class="s">this hub is ' + t.hubShare + ' of ' + t.trackTotal +
           ', 1 of ' + t.hubCount + ' that count</span>' +
           '<span class="n">' + pct + '%</span></a>';
    }
    ui.dest.innerHTML = h;
  }

  function hubName() {
    var t = document.title.split('|')[0].split(':')[0].trim();
    return t || 'This hub';
  }


  /* ---------------- stars ----------------
     Three for solving it alone, two after a hint, one after two, none after
     reading the solution. The server decides; this only draws it. */

  /* Every result says the number out loud, because the shapes do not carry
     it: three hollow stars and three filled stars are the same silhouette at
     this size. The zero case also says why it is zero. */
  var STAR_WORDS = {
    3: 'Three stars. Solved with no help at all.',
    2: 'Two stars. One hint used.',
    1: 'One star. Two hints used.',
    0: 'No stars. The solution was open before you solved it.',
  };
  var STAR_SHORT = { 3: 'Three stars', 2: 'Two stars', 1: 'One star', 0: 'No stars' };

  function starRow(stars, cls) {
    if (stars === null || stars === undefined) return '';
    var n = Math.max(0, Math.min(3, stars));
    var pips = '';
    for (var i = 0; i < 3; i++) {
      pips += '<span class="rs-star' + (i < n ? ' is-on' : '') +
              '" style="--i:' + i + '">' +
              '<svg viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M12 2.6l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.4 6.2 20.5l1.1-6.5L2.6 9.4l6.5-.9z"/>' +
              '</svg></span>';
    }
    // the written equivalent, never optional: the shapes alone are not the message
    return '<span class="rs-stars ' + (cls || '') + (n === 0 ? ' is-none' : '') +
           '" role="img" aria-label="' +
           esc(n + ' of 3 stars. ' + (STAR_WORDS[n] || '')) + '">' + pips +
           '<b class="rs-starn">' + n + ' of 3</b></span>';
  }

  /* The inline result, for one and two and zero stars. Lives in the work pane
     under the actions, where the reader already is, and costs no interruption.
     Frequent modals make every later modal less likely to be read, so the
     modal is saved for the outcomes that earn it. */
  function showInlineResult(stars, xp) {
    /* Scoped to the card on screen, not to the stage.
     *
     * Every exercise in the hub lives inside the stage at once, with the
     * others at display:none, so querying the stage found the FIRST card's
     * actions and the FIRST card's result row, whichever problem had just
     * been solved. The result was written into a hidden card and nobody saw
     * it: correct on problem 1, invisible on every problem after it. */
    var cur = S.cards[S.cur];
    var node = cur && cur.node;
    if (!node) return;
    var host = qs('.rs-actions', node) || qs('.rs-pane-work', node);
    if (!host) return;
    var row = qs('.rs-result', node);
    if (!row) {
      row = el('div', 'rs-result');
      host.parentNode.insertBefore(row, host);
      /* One listener, bound when the row is first built. The contents are
         rewritten on every solve, so binding to the button itself would be
         lost the next time round. */
      row.addEventListener('click', function (ev) {
        if (ev.target.closest && ev.target.closest('.rs-resnext')) show(S.cur + 1);
      });
    }
    var n = Math.max(0, Math.min(3, stars));
    var nxt = S.cards[S.cur + 1];
    /* Solving it is the end of the work, so the way onward belongs here and
       not only in the arrows up in the bar. Somebody who has just read the
       solution gets no ceremony, and used to get no exit either. */
    var onward = nxt
      ? '<button class="rs-resnext" type="button">Next problem' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/>' +
        '<polyline points="12 5 19 12 12 19"/></svg></button>'
      : '<span class="last">That was the last problem in this hub.</span>';
    row.innerHTML = starRow(n) +
      '<b>' + esc(STAR_WORDS[n] || 'Solved') + '</b>' +
      (n === 0 ? '<span class="why">Stars are settled on the first pass, so this ' +
                 'one keeps none however often you solve it again. The XP is yours.</span>' : '') +
      '<span class="end">' +
      (typeof xp === 'number' && xp > 0 ? '<span class="xp">+' + xp + ' XP</span>' : '') +
      onward + '</span>';
    row.classList.toggle('is-none', n === 0);
    row.classList.remove('is-in');
    void row.offsetWidth;          // restart the transition
    row.classList.add('is-in');
  }

  /* The ceremony, for a three-star solve. Same scrim language as the hub
     badge so the two read as one family, and it carries the accept for the
     next exercise rather than adding a second interruption after it. */
  function celebrateStars(stars, xp, nextTitle) {
    if (!ui.starScrim) return;
    var card = qs('.rs-card', ui.starScrim);
    qs('.rs-starrow', card).innerHTML = starRow(stars, 'is-big');
    qs('h3', card).textContent = STAR_SHORT[stars] || 'Solved';
    qs('.sub', card).textContent = (typeof xp === 'number' && xp > 0 ? '+' + xp + ' XP. ' : '') +
      (nextTitle ? 'Next: ' + nextTitle : 'That is the last one in this hub.');
    var go = qs('.rs-starnext', card);
    go.textContent = nextTitle ? 'Accept the challenge' : 'Keep going';
    ui.starScrim.classList.add('is-open');
    setTimeout(function () { try { go.focus(); } catch (e) {} }, 60);
  }

  /* Clearing a section. Ranks above a three-star solve and below the hub
     badge, so a single check never stacks two celebrations. */
  function celebrateSection(info, stars) {
    if (!ui.starScrim) return;
    var card = qs('.rs-card', ui.starScrim);
    var sec = S.sections[(info.section || 1) - 1];
    qs('.rs-starrow', card).innerHTML =
      '<span class="rs-secmark" aria-hidden="true"></span>' + starRow(stars, 'is-small');
    qs('h3', card).textContent = (sec && sec.title) ? sec.title + ' cleared' : 'Section cleared';
    qs('.sub', card).textContent = 'All ' + info.of + ' solved. +' + info.xp + ' XP.';
    var nxt = S.cards[S.cur + 1];
    var go = qs('.rs-starnext', card);
    go.textContent = nxt ? 'Next section' : 'Keep going';
    ui.starScrim.classList.add('is-open');
    setTimeout(function () { try { go.focus(); } catch (e) {} }, 60);
  }

  function closeStars(andAdvance) {
    if (!ui.starScrim) return;
    ui.starScrim.classList.remove('is-open');
    if (andAdvance) show(S.cur + 1);
  }


  /* Stars for a card, from the server's map. Null means unrated: either not
     solved, or banked from the anonymous era where nothing was tracked. */
  function starOf(card) {
    var m = S.starMap;
    if (!m || !card || !card.id) return null;
    var v = m[card.id];
    return (typeof v === 'number') ? v : null;
  }

  /* The name on the badge at the end of the path. The page title without its
     trailing description is what a reader recognises. */
  function hubBadgeName() {
    var t = document.title.split('|')[0].split(':')[0].trim();
    return (t || 'This hub') + ' badge';
  }

  /* Keep the two columns on the same line.
   *
   * The rail and the panel are separate scrollers, so matching their row
   * pitch in CSS was necessary and not sufficient: with equal pitches but
   * independent scrollTops, a bullet and its name still sat rows apart. They
   * now mirror each other, and because one step is one step in both, mirroring
   * the offset is enough to put every bullet beside its own row. */
  function syncRails(from) {
    if (!ui.pips || !ui.plist || S._syncing) return;
    S._syncing = true;
    if (from === 'list') ui.pips.scrollTop = ui.plist.scrollTop;
    else ui.plist.scrollTop = ui.pips.scrollTop;
    requestAnimationFrame(function () { S._syncing = false; });
  }


  /* ---------------- the two menus ----------------

     A native select cannot show what these rows have to show: whether a
     section is cleared, whether a problem is solved, how many stars it was
     solved with. So this is a listbox, built once and refilled, with the
     keyboard behaviour a listbox owes a reader: Enter and Space to open,
     arrows to walk, Escape to leave, Tab and an outside click to dismiss.

     One at a time. Opening the exercise menu closes the section menu, which
     is what a reader expects from two controls sitting side by side. */

  var openMenu = null;

  function makeMenu(cls, label) {
    var m = el('div', 'rs-menu ' + cls);
    m.innerHTML =
      '<button class="rs-mbtn" type="button" aria-haspopup="listbox" aria-expanded="false">' +
        '<span class="v"></span>' +
        '<svg class="cv" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</button>' +
      '<div class="rs-mpop" role="listbox" tabindex="-1" hidden></div>';
    m.btn = qs('.rs-mbtn', m);
    m.pop = qs('.rs-mpop', m);
    m.val = qs('.v', m.btn);
    m.btn.setAttribute('aria-label', label);
    m.label = label;

    m.btn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      menuToggle(m);
    });
    m.btn.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        menuOpen(m);
        menuStep(m, ev.key === 'ArrowUp' ? -1 : 1);
      }
    });
    m.pop.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        ev.preventDefault(); ev.stopPropagation(); menuClose(m, true);
      }
      else if (ev.key === 'ArrowDown') { ev.preventDefault(); menuStep(m, 1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); menuStep(m, -1); }
      else if (ev.key === 'Home') { ev.preventDefault(); menuStep(m, 0, 'first'); }
      else if (ev.key === 'End') { ev.preventDefault(); menuStep(m, 0, 'last'); }
    });
    m.pop.addEventListener('click', function (ev) {
      var row = ev.target.closest ? ev.target.closest('[data-v]') : null;
      if (!row) return;
      menuClose(m, true);
      m.onpick(parseInt(row.getAttribute('data-v'), 10));
    });
    return m;
  }

  function menuOpen(m) {
    if (openMenu && openMenu !== m) menuClose(openMenu, false);
    if (m.pop.hidden === false) return;
    m.pop.hidden = false;
    m.btn.setAttribute('aria-expanded', 'true');
    openMenu = m;
    // open where the reader is, not at the top of a twelve-row list
    var cur = qs('[aria-selected="true"]', m.pop);
    if (cur) m.pop.scrollTop = Math.max(0, cur.offsetTop - m.pop.clientHeight / 2 + 16);
  }
  function menuClose(m, refocus) {
    if (m.pop.hidden) return;
    m.pop.hidden = true;
    m.btn.setAttribute('aria-expanded', 'false');
    if (openMenu === m) openMenu = null;
    if (refocus) { try { m.btn.focus(); } catch (e) { /* fine */ } }
  }
  function menuToggle(m) { m.pop.hidden ? menuOpen(m) : menuClose(m, true); }

  function menuStep(m, delta, where) {
    var rows = qsa('[data-v]', m.pop);
    if (!rows.length) return;
    var at = rows.indexOf(document.activeElement);
    if (where === 'first') at = 0;
    else if (where === 'last') at = rows.length - 1;
    else if (at < 0) at = Math.max(0, rows.indexOf(qs('[aria-selected="true"]', m.pop)));
    else at = Math.max(0, Math.min(rows.length - 1, at + delta));
    try { rows[at].focus(); } catch (e) { /* fine */ }
  }

  /* Section menu: every section in this hub, each saying how far in the
     reader is. Picking one does not move them off the problem they are on;
     it repoints the exercise menu and the dot strip, which is how a reader
     looks ahead without losing their place. */
  function renderSecMenu() {
    if (!ui.secmenu) return;
    var h = '';
    S.sections.forEach(function (sc, si) {
      var done = 0;
      sc.cards.forEach(function (c) { if (isSolved(c)) done++; });
      var cleared = sc.cards.length > 0 && done === sc.cards.length;
      h += '<button type="button" role="option" class="rs-mrow' +
           (cleared ? ' is-done' : '') + (si === S.vsec ? ' is-cur' : '') +
           '" data-v="' + si + '" aria-selected="' + (si === S.vsec) + '">' +
           '<span class="mk" aria-hidden="true"></span>' +
           '<span class="no">' + (si + 1) + '</span>' +
           '<span class="ti">' + esc(sc.title || ('Section ' + (si + 1))) + '</span>' +
           '<span class="c">' + (cleared ? 'cleared' : done + '/' + sc.cards.length) +
           '</span></button>';
    });
    ui.secmenu.pop.innerHTML = h;
    var cur = S.sections[S.vsec];
    // the value says what it is, so the control needs no label beside it
    ui.secmenu.val.textContent = 'Section ' + (S.vsec + 1) +
      ((cur && cur.title) ? ': ' + cur.title : '');
  }

  /* Exercise menu: only the chosen section, which is the whole point of
     having two of these. Stars ride along so a reader can see at a glance
     which ones they took help on and might want back. */
  function renderExMenu() {
    if (!ui.exmenu) return;
    var sc = S.sections[S.vsec];
    var h = '';
    (sc ? sc.cards : []).forEach(function (c) {
      var i = S.cards.indexOf(c);
      var st = starOf(c);
      h += '<button type="button" role="option" class="rs-mrow' +
           (isSolved(c) ? ' is-done' : '') + (i === S.cur ? ' is-cur' : '') +
           '" data-v="' + i + '" aria-selected="' + (i === S.cur) + '">' +
           '<span class="mk" aria-hidden="true"></span>' +
           '<span class="no">' + esc(c.num) + '</span>' +
           '<span class="ti">' + esc(c.title) + '</span>' +
           (st === null ? '' : '<span class="st" title="' + st +
              ' of 3 stars">' + starPips(st) + '</span>') +
           '</button>';
    });
    ui.exmenu.pop.innerHTML = h;
    var cur = S.cards[S.cur];
    var here = cur && cur.sectionIndex === S.vsec;
    ui.exmenu.val.textContent = here
      ? (cur.num + '  ' + cur.title)
      : ((sc && sc.cards.length) ? ('Pick one of ' + sc.cards.length) : 'None');
    ui.exmenu.btn.classList.toggle('is-elsewhere', !here);
  }

  /* Three small solid-or-hollow marks. The menu row is too tight for the
     real star row, and this is a summary, not the award. */
  function starPips(n) {
    var h = '';
    for (var i = 0; i < 3; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>';
    return h;
  }

  function setViewedSection(si) {
    if (si < 0 || si >= S.sections.length) return;
    S.vsec = si;
    renderSecMenu(); renderExMenu(); renderPath();
  }

  function renderBar() {
    var c = S.cards[S.cur];
    /* The page's own h1 is hidden by the studio, so this one stands in for it
       and has to carry the same words. Splitting on the colon dropped half the
       heading ("dplyr Exercises in R" out of "dplyr Exercises in R: 50
       Real-World Practice Problems"), which threw away the part a search engine
       had to match. Keep the whole title; the bar ellipsises it if it is long. */
    var full = document.title.split('|')[0].trim() || 'Practice';
    ui.hub.title = full;
    // the section menu names the section now, so the h1 stops repeating it
    ui.hub.innerHTML = esc(full);
    renderSecMenu(); renderExMenu(); renderPath();
    ui.prev.disabled = S.cur === 0;
    ui.next.disabled = S.cur === S.cards.length - 1;
  }

  /* The dot strip: one section, and what finishing it earns.
   *
   * The whole hub used to be drawn here, fifty dots at five pixels apart on
   * the bigger hubs, which is a texture rather than a path. A section is six
   * to ten problems, so every dot is a real target and the strip ends on the
   * thing the reader is working towards: the section checkpoint, or on the
   * last section the hub badge itself. */
  function renderPath() {
    if (!ui.prog) return;
    var sc = S.sections[S.vsec];
    if (!sc) { ui.prog.innerHTML = ''; return; }
    var h = '';
    sc.cards.forEach(function (cc, j) {
      var i = S.cards.indexOf(cc);
      if (j) h += '<s class="' + (isSolved(sc.cards[j - 1]) ? 'is-done' : '') + '"></s>';
      var st = starOf(cc);
      h += '<i class="' + (isSolved(cc) ? 'is-done' : '') +
           (st === 3 ? ' is-gold' : '') +
           (i === S.cur ? ' is-cur' : '') + '" data-go="' + i +
           '" title="' + esc(cc.num + '  ' + cc.title +
             (st === null ? '' : '  (' + st + ' of 3 stars)')) + '"></i>';
    });
    var cleared = sc.cards.length > 0 && sc.cards.every(isSolved);
    var last = S.vsec === S.sections.length - 1;
    if (last) {
      var allDone = S.cards.length > 0 && S.cards.every(isSolved);
      h += '<s class="' + (allDone ? 'is-done' : '') + '"></s>' +
           '<b class="rs-pathbadge' + (allDone ? ' is-done' : '') +
           '" title="' + esc(hubBadgeName() + (allDone ? ', earned' : ', solve every problem')) +
           '"></b>';
    } else {
      h += '<s class="' + (cleared ? 'is-done' : '') + '"></s>' +
           '<b class="rs-ckpt' + (cleared ? ' is-done' : '') + '" title="' +
           esc((sc.title || ('Section ' + (S.vsec + 1))) +
               (cleared ? ' cleared' : ' complete, +25 XP')) + '"></b>';
    }
    ui.prog.innerHTML = h;
    // a section is small enough to draw at full size until it is not
    var n = sc.cards.length;
    ui.prog.style.setProperty('--step', (n > 14 ? 8 : n > 9 ? 12 : 18) + 'px');
  }

  /* The next rung, named. The server sends it on every graded solve as
     `nudge`; before today nothing read it, so a learner was told what they had
     earned and never what was next. Empty means there is nothing ahead worth
     naming, and the cell hides rather than saying so. */
  function setNudge(text) {
    S.nudge = text || '';
    if (!ui.nudgecell) return;
    ui.nudgecell.style.display = S.nudge ? '' : 'none';
    ui.nudgecell.textContent = S.nudge;
  }

  function renderStatus() {
    ui.solved.textContent = solvedCount();
    ui.total.textContent = S.cards.length;
    ui.xpearned.textContent = S.xp || 0;
    var m = S.meter;
    ui.metercell.style.display = '';
    // Signed out there is no allowance yet, and Pro has none to spend. The cell
    // still has to say something: a blank cell with a divider reads as broken.
    /* The monthly allowance is the one number a reader needs to plan around,
       so it is spelled out in every state, including before they sign in.
       It used to drop the limit exactly when it mattered most, in the last
       five checks, leaving "3 checks left" with nothing to measure against. */
    var limit = (m && m.limit) || LIMIT;
    if (!m) {
      ui.metercell.className = 'cell sep rs-metercell';
      ui.metercell.innerHTML =
        '<span><a class="rs-signin" href="/signin.html">Sign in</a> to check answers' +
        '&nbsp;&middot;&nbsp;' + LIMIT + ' free checks a month</span>';
      return;
    }
    if (!m.metered) {
      ui.metercell.className = 'cell sep rs-metercell';
      ui.metercell.innerHTML = '<span>Unlimited checks</span>';
      return;
    }
    var left = Math.max(0, limit - (m.used || 0));
    var bars = '';
    for (var i = 0; i < limit; i++) bars += '<i class="' + (i < left ? '' : 'off') + '"></i>';
    /* Upgrade is offered to anyone on the allowance, not held back until it
       is nearly gone. Somebody who has just seen the thing work is a better
       moment to ask than somebody who has run out. The escalation is carried
       by the count and the colour; only the last state quotes a price, where
       it stops being an invitation and starts being the way back in. */
    var cls = 'cell sep rs-metercell', txt;
    var count = '<b>' + left + '</b>&nbsp;of ' + limit + ' checks left this month';
    if (left === 0) {
      cls += ' is-out';
      txt = count + '&nbsp;&middot;<span class="rs-go">Upgrade, $14 a month</span>';
    } else {
      if (left <= 5) cls += ' is-warn';
      txt = count + '&nbsp;&middot;<span class="rs-go">Upgrade</span>';
    }
    ui.metercell.className = cls;
    ui.metercell.innerHTML = '<span class="rs-meter">' + bars + '</span><span>' + txt + '</span>';
  }

  function repaint() { renderPips(); renderList(); renderBar(); renderStatus(); }

  function show(i) {
    if (i < 0 || i >= S.cards.length) return;
    S.cards.forEach(function (c) { c.node.classList.remove('rs-current'); });
    S.cur = i;
    /* Moving snaps the menus back to where the reader now is. Repainting does
       not: a background repaint (the auth hydrate, a solve landing) used to
       yank someone who was reading ahead in section six back to section one
       mid-scroll. Browsing is a deliberate act and only a deliberate act
       should end it. */
    if (typeof S.cards[i].sectionIndex === 'number') S.vsec = S.cards[i].sectionIndex;
    var node = S.cards[i].node;
    node.classList.add('rs-current');
    splitCard(node);
    qsa('.rs-pane', node).forEach(function (p) { p.scrollTop = 0; });
    showAnswerArea(node);
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
  function openPanel() {
    // the panel opens where the rail already is, not at the top
    setTimeout(function () { syncRails('pips'); }, 0); clearTimeout(closeT); ui.panel.classList.add('is-open'); }
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
    var nextLine = S.nudge ? ' Next: ' + S.nudge + '.' : '';
    qs('.sub', card).textContent = 'Every problem in this hub is solved. The badge is in your collection now, with a public link anyone can check.' + nextLine + '';
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
  /* Checking an answer is the moment the work becomes worth keeping, so it is
     the moment to ask for an account. exercise-hub has its own anonymous gate,
     but it writes into the classic page: in the studio that lands inside the
     console, styled for a white background. This asks first, in the studio's
     own language, and never reaches that path.

     TASTER is how many exercises may be graded before an account is required.
     Owner decision 2026-09-19: none. Set it to 1 to put the old "first one on
     the house" behaviour back. Reading and running code stays open to
     everybody; it is grading that asks, because grading is what records XP,
     the streak and the hub badge against a person. */
  var TASTER = 0;

  /* auth-hydrate stamps the body with the reader's state, and that is the
     authoritative answer: a stale Supabase token can outlive a session, and
     trusting it would let a signed-out reader through. The token is only a
     fallback for the moment before hydration has run. */
  function signedIn() {
    var c = document.body.classList;
    if (c.contains('state-anon')) return false;
    if (c.contains('state-pro') || c.contains('state-free') ||
        c.contains('state-single') || c.contains('lifetime')) return true;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf('sb-') === 0 && k.indexOf('-auth-token') > 0) {
          var v = JSON.parse(localStorage.getItem(k));
          if (v && typeof v.access_token === 'string') return true;
        }
      }
    } catch (e) {}
    return false;
  }

  function tasterUsed(card) {
    try {
      var raw = localStorage.getItem(STORE_TASTER);
      if (!raw) return null;
      var t = JSON.parse(raw);
      return (t && t.id === card.id) ? 'same' : 'other';
    } catch (e) { return null; }
  }
  function tasterKeep(card) {
    try { localStorage.setItem(STORE_TASTER, JSON.stringify({ id: card.id, at: Date.now() })); } catch (e) {}
  }

  /* true when the click should be stopped and the sheet shown instead */
  function gateCheck(card) {
    if (signedIn()) return false;
    var used = tasterUsed(card);
    if (TASTER && used === null) { tasterKeep(card); return false; }
    if (TASTER && used === 'same') return false;   // retries on the same one
    openSignIn(used ? 'more' : 'first');
    return true;
  }

  function openSignIn(reason) {
    var next = encodeURIComponent(location.pathname + location.search);
    var href = '/signin.html?next=' + next;
    ui.signin.querySelector('h3').textContent = reason === 'more'
      ? 'Create a free account to keep going'
      : 'Sign in to check your answer';
    ui.signin.querySelector('.sub').textContent = reason === 'more'
      ? 'Your first graded exercise was on the house. An account keeps your XP, your streak and every problem you solve, on any device.'
      : 'Checking an answer records it against your account, which is what earns the XP and the badge for this hub.';
    qsa('a', ui.signin).forEach(function (a) { a.href = href; });
    ui.signinScrim.classList.add('is-open');
  }

  function wire() {
    ui.accept.addEventListener('click', accept);
    ui.prev.addEventListener('click', function () { show(S.cur - 1); });
    ui.next.addEventListener('click', function () { show(S.cur + 1); });
    [ui.spine, ui.panel].forEach(function (n) {
      n.addEventListener('mouseenter', hoverIn);
      n.addEventListener('mouseleave', hoverOut);
    });
    ui.pips.addEventListener('scroll', function () { syncRails('pips'); }, { passive: true });
    ui.plist.addEventListener('scroll', function () { syncRails('list'); }, { passive: true });
    ui.spinetop.addEventListener('click', function () {
      ui.panel.classList.contains('is-open') ? closePanel() : openPanel();
    });
    ui.spinetop.addEventListener('focus', openPanel);
    ui.pin.addEventListener('click', function (e) { e.stopPropagation(); setPin(!S.pinned); });
    ui.prog.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-go]');
      if (t) show(parseInt(t.getAttribute('data-go'), 10));
    });
    // a square in the collapsed rail is the same link as its expanded row
    ui.pips.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-hub]');
      if (!t || t.classList.contains('is-cur')) return;
      location.href = '/' + t.getAttribute('data-hub') + '?studio=1';
    });
    // a click anywhere else puts the open menu away
    document.addEventListener('click', function () {
      if (openMenu) menuClose(openMenu, false);
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
    /* Capture phase, so this runs before exercise-hub's own click handler. */
    ui.body.addEventListener('click', function (ev) {
      var btn = ev.target.closest && ev.target.closest('.xh-check-btn');
      if (!btn) return;
      var node = btn.closest('section.exercise');
      var card = null;
      S.cards.forEach(function (c) { if (c.node === node) card = c; });
      if (card && gateCheck(card)) { ev.preventDefault(); ev.stopPropagation(); }
    }, true);

    ui.starScrim.addEventListener('click', function (ev) {
      if (ev.target.classList.contains('rs-starnext')) { closeStars(true); return; }
      if (ev.target === ui.starScrim) closeStars(false);
    });
    document.addEventListener('keydown', function (ev) {
      if (!ui.starScrim.classList.contains('is-open')) return;
      if (ev.key === 'Escape') { ev.preventDefault(); closeStars(false); }
      else if (ev.key === 'Enter') { ev.preventDefault(); closeStars(true); }
    });

    ui.signinScrim.addEventListener('click', function (ev) {
      if (ev.target === ui.signinScrim || ev.target.classList.contains('rs-signinlater')) {
        ui.signinScrim.classList.remove('is-open');
      }
    });

    /* exercise-hub.js asks the server which problems are already solved when
       it hydrates; the same answer now carries the stars. Listening for it
       beats a second request for the same row. */
    document.addEventListener('exercise-progress-loaded', function (ev) {
      var d = (ev && ev.detail) || {};
      if (d.stars && typeof d.stars === 'object') { S.starMap = d.stars; repaint(); }
    });

    document.addEventListener('exercise-attempt-result', function (ev) {
      var r = (ev.detail && ev.detail.result) || {};
      if (r.meter) { S.meter = r.meter; }
      if (typeof r.xp_awarded_now === 'number') S.xp += r.xp_awarded_now;
      repaint();
      setNudge(r.nudge);
      /* Three stars earns the ceremony; anything else resolves inline. The
         hub badge outranks both: on the last exercise of a hub it would
         otherwise be two celebrations stacked on one solve. */
      if (typeof r.stars === 'number') {
        var earnedXp = typeof r.xp_awarded_now === 'number' ? r.xp_awarded_now : 0;
        var cur = S.cards[S.cur];
        if (cur && cur.id) { S.starMap = S.starMap || {}; S.starMap[cur.id] = r.stars; }
        var hubEnding = !!(r.hub_badge && r.hub_badge.newly_minted);
        /* One ceremony per check, in order of weight. The hub badge has its
           own card and wins; a cleared section comes next; a three-star solve
           after that; everything else resolves inline where the reader is. */
        if (hubEnding) {
          showInlineResult(r.stars, earnedXp);
        } else if (r.section_cleared) {
          celebrateSection(r.section_cleared, r.stars);
        } else if (r.stars === 3) {
          var nxt = S.cards[S.cur + 1];
          celebrateStars(3, earnedXp, nxt ? nxt.title : '');
        } else {
          showInlineResult(r.stars, earnedXp);
        }
      }
      if (r.hub_badge && r.hub_badge.newly_minted) setTimeout(function () { celebrate(r.hub_badge); }, 650);
    });
    // exercise-hub.js repaints cards on hydrate; keep our chrome in step
    document.addEventListener('exercise-progress-changed', repaint);

    /* Belt and braces. A card solved on an earlier visit passes its check with
       no event at all: nothing is posted, because nothing is newly earned.
       Watching the cards themselves keeps the spine and the counters true to
       the page whatever exercise-hub happens to announce. */
    var pending = null;
    var obs = new MutationObserver(function () {
      clearTimeout(pending);
      pending = setTimeout(repaint, 60);
    });
    S.cards.forEach(function (c) {
      obs.observe(c.node, { attributes: true, attributeFilter: ['class'] });
      var st = qs('.xh-check-status', c.node);
      if (st) obs.observe(st, { attributes: true, attributeFilter: ['class'] });
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
    S.hubSlug = thisHubSlug();
    document.body.classList.add('rs-studio');
    clearGuard();
    build();
    adopt();
    wire();
    try { if (localStorage.getItem(STORE_PIN) === '1') setPin(true); } catch (e) { /* fine */ }
    /* #<exercise-id> opens that problem.
     *
     * The dashboard's Resume links carry one, because "resume" that lands
     * you on problem 1 of 50 is not resuming. Unknown or absent, it opens at
     * the start exactly as before. */
    var want = -1;
    try {
      var frag = decodeURIComponent((location.hash || '').replace(/^#/, ''));
      if (frag) S.cards.forEach(function (c, i) { if (c.id === frag) want = i; });
    } catch (e) { /* a malformed hash is not worth failing a mount for */ }
    show(want >= 0 ? want : 0);
    renderStatus();
    loadMeter();
    loadHubIndex();
    document.addEventListener('auth-hydrated', function () {
      setTimeout(function () {
        renderPips(); renderList(); renderBar(); loadMeter(); loadHubProgress();
      }, 60);
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

  /* The studio is how an exercise hub looks now. ?studio=0 is the way back to
     the classic page, and is what Exit studio links to.

     Both exits clear the boot guard the inline head script put up. Leaving it
     on a page that is never going to mount would hide the page. */
  function boot() {
    var p = new URLSearchParams(location.search);
    if (p.get(PARAM) === '0') { clearGuard(); return; }
    if (!qs('section.exercise')) { clearGuard(); return; }
    bootGuard();
    // exercise-hub.js binds on DOMContentLoaded; window load is safely after.
    if (document.readyState === 'complete') setTimeout(start, 0);
    else window.addEventListener('load', function () { setTimeout(start, 0); });
  }

  boot();
})();
