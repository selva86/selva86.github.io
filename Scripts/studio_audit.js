/* Practice Studio audit: the contract the studio layer has to satisfy on any
 * exercise hub, written as assertions against the live page instead of prose.
 *
 * HOW TO RUN
 *   Open any exercise hub with ?studio=1, paste this whole file into the
 *   browser console, and read the summary. It returns
 *   { pass, fail, failures } and prints the full list.
 *
 * WHY IT EXISTS
 *   The studio is a presentation layer: it moves the nodes exercise-hub.js has
 *   already built and bound. That makes it cheap to apply to every hub and easy
 *   to break in ways that still look right. This file is the "still looks right"
 *   detector. Run it after any change to practice-studio.js / .css, and after
 *   any change to exercise-hub.js that touches card structure.
 *
 * WHAT IT DOES NOT COVER
 *   Behaviour. A page can pass every assertion here and still fail to run code,
 *   grade an answer, or mint a badge. Section 10 lists the manual pass that
 *   catches those; do it once per change on one hub.
 */
(function () {
  var out = [], pass = 0, fail = 0;
  function ck(group, name, ok, detail) {
    ok ? pass++ : fail++;
    out.push((ok ? 'PASS ' : 'FAIL ') + group + ' | ' + name +
             (detail != null && !ok ? '  :: ' + String(detail).slice(0, 90) : ''));
  }
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var cs = function (n, p) { return n ? getComputedStyle(n)[p] : null; };
  var px = function (n, p) { return n ? parseFloat(getComputedStyle(n)[p]) : 0; };
  var vis = function (n) { return !!(n && n.getBoundingClientRect().width > 0 && cs(n, 'visibility') !== 'hidden'); };
  var flat = function (n) { return ((n && n.innerText) || '').replace(/\s+/g, ' ').trim(); };

  var card = $('section.exercise.rs-current');
  var L = card && $('.rs-pane-problem', card);
  var R = card && $('.rs-pane-work', card);
  var ed = R && $('.webr-container[data-block-title="Your turn"] .webr-editor', R);

  /* -------- 1. shell -------- */
  ck('shell', 'studio mounted', document.body.classList.contains('rs-studio'));
  /* The studio is the default view of an exercise hub: no query string needed.
     ?studio=0 is the way back to the classic page. */
  ck('shell', 'the studio mounted without being asked for',
     !/[?&]studio=1/.test(location.search) || 'url carried studio=1, rerun on a plain hub URL');
  ck('shell', 'the boot guard was lifted', !document.documentElement.classList.contains('rs-booting'));
  ck('shell', 'the page still has one visible heading',
     $$('h1').filter(function (n) { return n.getBoundingClientRect().width > 0; }).length === 1);
  ck('shell', 'exit leads back to the classic page',
     /studio=0/.test(($('.rs-exit') || {}).getAttribute ? $('.rs-exit').getAttribute('href') : ''));
  ck('shell', 'site navbar still visible', vis($('.sitenav')));
  ck('shell', 'one studio bar under the navbar', vis($('.rs-bar')));
  ck('shell', 'classic page body hidden', cs($('.container > .row'), 'display') === 'none');
  ck('shell', 'page does not scroll behind the shell',
     Math.abs(document.documentElement.scrollHeight - window.innerHeight) < 4,
     document.documentElement.scrollHeight + ' vs ' + window.innerHeight);
  ck('shell', 'no uppercase label anywhere in the shell',
     $$('.rs-shell *').filter(function (n) {
       return cs(n, 'textTransform') === 'uppercase' && n.textContent.trim();
     }).length === 0);
  /* webr stamps an uppercase OUTPUT label on the output pane through ::before */
  ck('shell', 'no OUTPUT eyebrow on the console',
     cs($('pre.webr-output.rs-console'), 'content') !== '"OUTPUT"');
  /* the sitewide sign-in sheet is .rs-nudge and lands over the editor */
  ck('shell', 'the sign-in sheet stays out of the studio', !vis($('.rs-nudge')));

  /* -------- 2. studio bar -------- */
  ck('bar', 'hub name shown', /\S/.test(($('.rs-hub') || {}).textContent || ''));
  ck('bar', 'section name beside it', /·/.test(($('.rs-hub') || {}).textContent || ''));
  ck('bar', 'progress dots for the section', $$('.rs-prog i').length > 0);
  ck('bar', 'previous and next arrows', $$('.rs-arrow').length === 2);
  ck('bar', 'accept button or a live clock', !!($('.rs-accept') || $('.rs-clock')));
  ck('bar', 'exit link back to the classic page', !!$('.rs-exit'));
  ck('bar', 'bar does not overlap the panes',
     !L || $('.rs-bar').getBoundingClientRect().bottom <= L.getBoundingClientRect().top + 1);

  /* -------- 3. spine and hover list -------- */
  ck('spine', 'spine visible', vis($('.rs-spine')));
  ck('spine', 'one square per problem', $$('.rs-pip').length === $$('.rs-hold > section.exercise').length);
  ck('spine', 'squares, not circles', px($('.rs-pip'), 'borderTopLeftRadius') <= 6);
  ck('spine', 'solved count shown', /\d+\/\d+/.test(($('.rs-count') || {}).textContent || ''));
  ck('spine', 'section dividers between groups', $$('.rs-pipsec').length > 0);
  ck('spine', 'hover panel has a row per problem',
     $$('.rs-plist .rs-prow').length === $$('.rs-pip').length);
  ck('spine', 'no box drawn around the panel numbers', !$('.rs-prow .mk'));
  ck('spine', 'pin control present', !!$('.rs-pin'));
  /* The list used to print the whole rebuilt heading: a permalink #, the
     number twice, the difficulty pill and the caret, all run together. */
  ck('spine', 'list rows carry a clean name, not the whole heading',
     (function () {
       var t = $('.rs-plist');
       if (!t) return false;
       return !/#/.test(t.textContent) && !/Exercise\s+\d/.test(t.textContent);
     })());
  ck('spine', 'each list row separates number from name',
     (function () {
       var r = $('.rs-plist .rs-prow');
       return !!(r && $('.no', r) && $('.ti', r) && $('.ti', r).textContent.trim());
     })());
  ck('spine', 'list rows are reachable from the keyboard',
     (function () { var r = $('.rs-plist .rs-prow'); return !!r && r.tagName === 'BUTTON'; })());
  ck('spine', 'the panel shows progress through the hub', !!$('.rs-ptrack i'));

  /* Pinned, the panel stops being absolute; if the grid row is unbounded its
     full height becomes the row height and the stage grows past the shell,
     which leaves the problem pane with nothing to scroll. */
  ck('spine', 'pinning does not stretch the stage past the shell',
     (function () {
       var body = $('.rs-body');
       if (!body) return false;
       return /minmax\(0px, 1fr\)|minmax\(0, 1fr\)/.test(cs(body, 'gridTemplateRows')) ||
              $('.rs-stage').getBoundingClientRect().height <= body.getBoundingClientRect().height + 1;
     })());

  /* -------- 4. the two panes -------- */
  ck('panes', 'problem pane exists', !!L);
  ck('panes', 'work pane exists', !!R);
  ck('panes', 'problem pane is left of the work pane',
     !!(L && R) && L.getBoundingClientRect().left < R.getBoundingClientRect().left);
  ck('panes', 'panes scroll independently of the stage',
     cs($('.rs-stage'), 'overflow') === 'hidden' && cs(L, 'overflowY') !== 'visible');
  ck('panes', 'every card is split, not only the visible one',
     $$('.rs-pane-work').length === $$('.rs-hold > section.exercise').length);

  /* -------- 5. problem pane -------- */
  ck('problem', 'title present', !!(L && $('.rs-title', L)));
  ck('problem', 'title uses the display face', /Inter Tight/.test(cs(L && $('.rs-title', L), 'fontFamily') || ''));
  ck('problem', 'title at least 22px', px(L && $('.rs-title', L), 'fontSize') >= 22,
     px(L && $('.rs-title', L), 'fontSize'));
  ck('problem', 'meta line carries the XP value',
     !!(L && $('.rs-meta', L)) && /XP/.test((L && $('.rs-meta', L) || {}).textContent || ''));
  ck('problem', 'no leftover card header chrome',
     !(L && $('.xh-ex-head', L) && vis($('.xh-ex-head', L))));
  ck('problem', 'task text present', !!(L && $('.exercise-task', L)));
  ck('problem', 'expected result block present', !!(L && $('.exercise-expected pre', L)));
  ck('problem', 'expected result at least 13px',
     px(L && $('.exercise-expected pre', L), 'fontSize') >= 13,
     px(L && $('.exercise-expected pre', L), 'fontSize'));
  ck('problem', 'hints live in the problem pane', !!(L && $('.xh-hints', L)));
  ck('problem', 'solution lives in the problem pane', !!(L && $('.exercise-solution', L)));
  ck('problem', 'the answer editor is not in the problem pane',
     !(L && $('.webr-container[data-block-title="Your turn"]', L)));
  ck('problem', 'the expected result runs the full width of the pane',
     (function () {
       var p = L && $('.exercise-expected pre', L);
       if (!p || !L) return false;
       var pad = parseFloat(cs(L, 'paddingLeft')) + parseFloat(cs(L, 'paddingRight'));
       return p.getBoundingClientRect().width >= L.getBoundingClientRect().width - pad - 2;
     })());

  /* -------- 6. work pane: one editor, one console -------- */
  var eds = R ? $$('.webr-container', R).filter(vis) : [];
  ck('work', 'exactly one visible code block', eds.length === 1,
     eds.map(function (e) { return e.getAttribute('data-block-title'); }).join(','));
  ck('work', 'the visible block is the answer block',
     eds.length === 1 && eds[0].getAttribute('data-block-title') === 'Your turn');
  /* Setup is part of the code in the editor, not a block of its own. One Run
     does everything in order, so nothing has to be run first and there is no
     second block to hunt for. */
  ck('work', 'no separate setup block is left in the pane', !(R && $('.rs-setup-toggle', R)));
  ck('work', 'the setup blocks are parked outside every card',
     !$('.rs-hold .webr-container[data-block-title="Run this once before any exercise"]'));
  ck('work', 'the editor carries the setup above the answer',
     (function () {
       if (!$('.rs-park .webr-container')) return true;   // a hub with no setup
       var t = ed ? (ed.textContent || '') : '';
       var a = t.indexOf('# Setup, written for you');
       var b = t.indexOf('# Your answer.');
       return a > -1 && b > a;
     })());
  ck('work', 'square edges on the code block',
     px(R && $('.webr-container', R), 'borderTopLeftRadius') === 0,
     px(R && $('.webr-container', R), 'borderTopLeftRadius'));
  ck('work', 'console present', !!(R && $('pre.webr-output.rs-console', R)));
  ck('work', 'console sits below the editor',
     !!(R && ed && $('pre.webr-output.rs-console', R).getBoundingClientRect().top >= ed.getBoundingClientRect().bottom - 2));
  ck('work', 'the editor is height-bounded so the console stays on screen',
     !!(R && ed && ed.getBoundingClientRect().bottom < R.getBoundingClientRect().bottom));
  ck('work', 'the console fits inside the pane',
     !!(R && $('pre.webr-output.rs-console', R) &&
        $('pre.webr-output.rs-console', R).getBoundingClientRect().bottom <= R.getBoundingClientRect().bottom + 1));

  /* The output element must never leave its container: webr-init.js and
     exercise-hub.js both find it with container.querySelector('.webr-output'),
     so moving it breaks running and grading at once. */
  ck('work', 'the output pane is still inside the answer container',
     !!(R && $('.webr-container[data-block-title="Your turn"] .webr-output', R)));

  /* exercise-hub picks the block it grades by scanning the card for the first
     .webr-container not inside a <details>. With the setup parked outside the
     cards there is exactly one candidate, so it cannot pick the wrong one. */
  ck('work', 'the answer block is the only gradable block in the card',
     !!card && $$('.webr-container', card).filter(function (c) {
       return !c.closest('details');
     }).length === 1);

  /* -------- 6b. code surfaces share one gutter --------
     The editor, the bar that splits it from the console, and the console all
     begin on the same vertical line. Four different left edges is what made
     this look unfinished, with "Console" pressed against the border while the
     code beside it was inset. */
  (function () {
    if (!R) { ck('surface', 'work pane present for gutter checks', false); return; }
    var cont = $('.webr-container', R);
    if (!cont) { ck('surface', 'answer container present', false); return; }
    var base = cont.getBoundingClientRect().left;
    function gutter(sel) {
      var n = $(sel, R); return n ? Math.round(n.getBoundingClientRect().left - base) : null;
    }
    var chip = gutter('.webr-header-badge');
    var line = gutter('.webr-editor .cl');
    var btn  = gutter('.rs-actions .xh-check-btn');
    ck('surface', 'header mark, line numbers and buttons share one gutter',
       chip !== null && chip === line && line === btn, chip + ' / ' + line + ' / ' + btn);
    ck('surface', 'the console label is not pressed against the border',
       parseFloat(cs($('.rs-console-head', R), 'paddingLeft')) >= 10,
       cs($('.rs-console-head', R), 'paddingLeft'));
    ck('surface', 'the console text sits on the same gutter as the label',
       cs($('.rs-console-head', R), 'paddingLeft') === cs($('pre.webr-output.rs-console', R), 'paddingLeft'));
    ck('surface', 'the answer container carries no stray padding',
       parseFloat(cs(cont, 'paddingLeft')) === 0, cs(cont, 'paddingLeft'));
  })();

  /* The solution block is the same instrument without the controls. main.css
     pads any <details> child by 16px, which held its header off the block's
     own edges and is what looked amateurish. */
  (function () {
    var sol = L && $('.exercise-solution .webr-container', L);
    if (!sol) { ck('surface', 'solution block present to check', true); return; }
    var hd = $('.webr-header', sol);
    var sb = sol.getBoundingClientRect(), hb = hd && hd.getBoundingClientRect();
    ck('surface', 'the solution header touches both block edges',
       !!hb && Math.round(hb.left - sb.left) <= 2 && Math.round(sb.right - hb.right) <= 2,
       hb ? Math.round(hb.left - sb.left) + ' / ' + Math.round(sb.right - hb.right) : 'no header');
    ck('surface', 'the solution block has square edges',
       px(sol, 'borderTopLeftRadius') === 0, px(sol, 'borderTopLeftRadius'));
  })();

  /* One scrollbar, not two: the editor scrolls inside a pane that does not. */
  ck('surface', 'the work pane does not scroll alongside the editor',
     !R || R.scrollHeight <= R.clientHeight + 1,
     R ? R.scrollHeight + ' > ' + R.clientHeight : '');

  /* -------- 7. action row -------- */
  var row = R && $('.rs-actions', R);
  ck('actions', 'action row present', !!row);
  ck('actions', 'action row below the editor',
     !!(row && ed && row.getBoundingClientRect().top >= ed.getBoundingClientRect().bottom - 2));
  ck('actions', 'action row above the console',
     !!(row && R && row.getBoundingClientRect().top <= $('pre.webr-output.rs-console', R).getBoundingClientRect().top));
  ck('actions', 'Check in the row', !!(row && $('.xh-check-btn', row)));
  ck('actions', 'Run in the row', !!(row && $('[data-rs="run"]', row)));
  ck('actions', 'Hint in the row', !!(row && $('[data-rs="hint"]', row)));
  ck('actions', 'Solution in the row', !!(row && $('[data-rs="solution"]', row)));
  ck('actions', 'Reset in the row', !!(row && $('[data-rs="reset"]', row)));
  ck('actions', 'XP value shown in the row', !!(row && $('.rs-xp', row)));
  ck('actions', 'hint and solution controls are not duplicated in the problem pane',
     !(L && (vis($('.xh-hintbar', L)) || vis($('.exercise-solution > summary', L)))));

  /* -------- 8. status bar -------- */
  var st = $('.rs-status');
  ck('status', 'status bar present', vis(st));
  ck('status', 'challenge state cell', /Not started|running|Paused/i.test(flat(st)));
  ck('status', 'solved count cell', /of \d+ solved/.test(flat(st)));
  ck('status', 'XP cell', /XP/.test(flat(st)));
  /* The allowance is the one number a reader plans around, so it is spelled
     out in every state, including before they sign in and in the last few
     checks, where it used to drop the limit exactly when it mattered. */
  ck('status', 'the monthly allowance names its limit',
     /\d+ of \d+ checks left this month|\d+ free checks a month|Unlimited checks/.test(flat(st)),
     flat($('.rs-metercell')));
  /* Upgrade is offered to anyone on the allowance, not held back until it is
     nearly gone; and never to somebody who is already paying. */
  ck('status', 'anyone on the allowance is offered the upgrade',
     (function () {
       var c = $('.rs-metercell');
       if (!c) return false;
       var metered = /checks left this month/.test(c.innerText || '');
       return metered ? !!$('.rs-go', c) : !$('.rs-go', c);
     })(), flat($('.rs-metercell')));
  ck('status', 'allowance cell is never empty',
     !!(st && $('.rs-metercell', st) && ($('.rs-metercell', st).innerText || '').trim().length > 0));
  ck('status', 'allowance cell says something meaningful',
     /checks left|Unlimited|Sign in/.test(flat(st)));
  ck('status', 'R runtime cell', /R \d/.test(flat(st)));

  /* -------- 8b. the sign-in gate --------
     Checking an answer is what earns the XP and the badge, so an anonymous
     reader is asked for an account at that point rather than after. */
  ck('signin', 'the sign-in sheet exists', !!$('.rs-signincard'));
  ck('signin', 'its links carry a way back to this page',
     (function () {
       var a = $('.rs-signincard a');
       return !!a;   // href is filled in when the sheet opens
     })());

  /* -------- 9. the challenge gate -------- */
  var gate = R && $('.rs-gate', R);
  var accepted = document.body.classList.contains('rs-accepted');
  ck('gate', 'gate covers the work pane until the challenge is accepted',
     accepted ? !vis(gate) : vis(gate));
  ck('gate', 'gate explains itself and repeats the accept button',
     !!(gate && $('.rs-gate-btn', gate) && /clock/i.test(gate.innerText)));

  /* -------- 10. narrow screens --------
     Below 1040px the studio stops being a fixed overlay and becomes an
     ordinary scrolling page, because a fixed two-pane layout puts the editor
     somewhere a phone cannot reach. These run only at that width. */
  if (window.innerWidth <= 1040) {
    ck('narrow', 'the shell is in the page flow, not a fixed overlay',
       cs($('.rs-shell'), 'position') !== 'fixed');
    ck('narrow', 'the studio bar stays reachable while scrolling',
       cs($('.rs-bar'), 'position') === 'sticky');
    ck('narrow', 'the status bar stays reachable while scrolling',
       cs($('.rs-status'), 'position') === 'sticky');
    ck('narrow', 'the problem sits above the work pane, not beside it',
       !!(L && R) && R.getBoundingClientRect().top >= L.getBoundingClientRect().bottom - 1);
    ck('narrow', 'the editor is on the page and has real height',
       !!(ed && ed.getBoundingClientRect().height > 80),
       ed && Math.round(ed.getBoundingClientRect().height));
    ck('narrow', 'the console is on the page',
       !!(R && $('pre.webr-output.rs-console', R) &&
          $('pre.webr-output.rs-console', R).getBoundingClientRect().height > 40));
    ck('narrow', 'the spine is a strip, not a rail',
       cs($('.rs-spine'), 'flexDirection') === 'row');
    ck('narrow', 'the hover panel is out of the way on a touch screen',
       cs($('.rs-panel'), 'display') === 'none');
    ck('narrow', 'the page does not scroll sideways',
       document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
       document.documentElement.scrollWidth + ' vs ' + document.documentElement.clientWidth);
  }

  /* -------- 11. the manual pass this file cannot do -------- */
  var manual = [
    'Accept the challenge; the setup runs itself and the panes unlock.',
    'Type a wrong answer, press Check: the verdict reads mismatch.',
    'Paste the solution, press Check: the verdict reads correct and the spine square fills.',
    'Solve the last unsolved problem: the badge modal appears and its link opens a real badge page.',
    'Confirm the attempt request carries elapsed_ms and the status bar XP moves.'
  ];

  console.log(out.join('\n'));
  console.log('\n' + pass + ' passed, ' + fail + ' failed');
  console.log('\nStill to check by hand:\n  - ' + manual.join('\n  - '));
  return { pass: pass, fail: fail, failures: out.filter(function (l) { return l.indexOf('FAIL') === 0; }) };
})();
