/* Section assessment player.
 *
 * Three screens: pledge -> questions -> result. No per-question feedback:
 * this is an assessment, not a lesson, so the reader learns what they missed
 * only after submitting.
 *
 * The server holds the answer key. This file never sees a correct answer
 * until a pass comes back in the submit response.
 *
 * Mounts on <div id="asmt" data-assessment-id="ts-1">.
 */
(function () {
  'use strict';

  var root = document.getElementById('asmt');
  if (!root) return;
  var ID = root.getAttribute('data-assessment-id');
  if (!ID) return;

  var RESUME_KEY = 'rsc-asmt-v1:' + ID;

  var state = {
    token: null, meta: null, questions: [], total: 0, passMark: 9,
    answers: {}, flags: {}, i: 0, startedAt: 0, signedIn: false, busy: false
  };

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
  function token() {
    try {
      if (window.RSCExerciseAPI && window.RSCExerciseAPI.token) return window.RSCExerciseAPI.token();
    } catch (e) {}
    return null;
  }
  function headers() {
    var h = { 'Content-Type': 'application/json' };
    var t = token();
    if (t) h.Authorization = 'Bearer ' + t;
    return h;
  }
  function saveResume() {
    try {
      localStorage.setItem(RESUME_KEY, JSON.stringify({
        token: state.token, answers: state.answers, flags: state.flags,
        i: state.i, startedAt: state.startedAt
      }));
    } catch (e) {}
  }
  function clearResume() { try { localStorage.removeItem(RESUME_KEY); } catch (e) {} }
  function elapsed() {
    var s = Math.max(0, Math.floor(Date.now() / 1000) - state.startedAt);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  var TICK = '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>';
  var CROSS = '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>';
  var FLAGSVG = '<svg viewBox="0 0 24 24"><path d="M4 21V4h13l-2 4 2 4H4"/></svg>';

  function bar(right) {
    var m = state.meta || {};
    return '<div class="asmt-bar"><div class="asmt-bar-t">' + esc(m.book_title || '') +
      ' <em>&nbsp;/&nbsp; Part ' + esc(m.section || '') + ' assessment</em></div>' +
      '<div class="asmt-bar-r">' + (right || esc(m.title || '')) + '</div></div>';
  }
  function segs() {
    var out = '';
    for (var k = 0; k < state.total; k++) {
      var cls = state.answers[state.questions[k].id] ? 'done' : (k === state.i ? 'now' : '');
      out += '<i class="' + cls + '"></i>';
    }
    return '<span class="asmt-seg">' + out + '</span>';
  }

  /* ---------- screen: pledge ---------- */
  function renderPledge() {
    var m = state.meta;
    var html =
      '<div class="asmt-stage">' + bar() +
      '<div class="asmt-in">' +
        '<p class="asmt-kick">Part ' + esc(m.section) + '</p>' +
        '<h2>' + esc(m.title) + '</h2>' +
        '<p class="asmt-lede">This assessment covers only what this part taught, across its ' +
          esc(m.chapters) + ' chapters.</p>' +
        '<div class="asmt-facts">' +
          '<div class="asmt-fact"><b>' + state.total + ' questions</b><span>drawn from a larger set</span></div>' +
          '<div class="asmt-fact"><b>About 15 minutes</b><span>no countdown</span></div>' +
          '<div class="asmt-fact"><b>' + state.passMark + ' correct to pass</b><span>75 percent</span></div>' +
          '<div class="asmt-fact"><b>Answers at the end</b><span>with what to reread</span></div>' +
        '</div>' +
        '<div class="asmt-pledge">' +
          '<h3>Your word</h3>' +
          '<p>We do not lock your browser, watch your screen, or time you out. The result means something because you decide it does.</p>' +
          vow(0, 'I will answer on my own, without asking another person or a chatbot.') +
          vow(1, 'I will keep the handbook, my notes, and R closed until I have submitted.') +
          vow(2, 'I understand this records what I know today, and that I can retake it in 24 hours.') +
          '<div class="asmt-sign"><label for="asmt-sig">Sign with your name</label>' +
            '<input id="asmt-sig" type="text" placeholder="Your full name" autocomplete="name"></div>' +
          '<p class="asmt-note"><b>What you get:</b> a score, the questions you missed with the chapter that covers each one, and your standing against everyone else who has taken this. ' +
            (m.free_certificate
              ? 'Passing also earns a certificate you can verify and share.'
              : 'Passing earns a certificate; certificates from Part 2 onward come with Pro.') +
          '</p>' +
          '<div class="asmt-actions">' +
            '<button class="asmt-btn asmt-btn-p" id="asmt-start" disabled>Start the assessment</button>' +
            '<span class="asmt-hint" id="asmt-hint">Tick all three and sign to begin</span>' +
          '</div>' +
        '</div>' +
      '</div></div>';
    root.innerHTML = html;

    var vows = [false, false, false];
    function sync() {
      var name = (document.getElementById('asmt-sig').value || '').trim();
      var ok = vows[0] && vows[1] && vows[2] && name.length >= 2;
      document.getElementById('asmt-start').disabled = !ok;
      document.getElementById('asmt-hint').textContent = ok ? '' : 'Tick all three and sign to begin';
    }
    root.querySelectorAll('.asmt-vow').forEach(function (v) {
      v.addEventListener('click', function (e) {
        e.preventDefault();
        var n = +v.getAttribute('data-n');
        vows[n] = !vows[n];
        v.classList.toggle('on', vows[n]);
        sync();
      });
    });
    document.getElementById('asmt-sig').addEventListener('input', sync);
    document.getElementById('asmt-start').addEventListener('click', function () {
      state.signedName = (document.getElementById('asmt-sig').value || '').trim();
      state.startedAt = Math.floor(Date.now() / 1000);
      state.i = 0;
      saveResume();
      renderQuestion();
    });
  }
  function vow(n, text) {
    return '<label class="asmt-vow" data-n="' + n + '"><span class="box">' + TICK + '</span>' +
      '<p>' + esc(text) + '</p></label>';
  }

  /* ---------- screen: question ---------- */
  function renderQuestion() {
    var q = state.questions[state.i];
    var chosen = state.answers[q.id] || [];
    var multi = q.pick > 1;
    var tag = q.kind === 'output' ? 'Read the output' : (multi ? 'Select ' + q.pick : 'Concept');
    var sub = multi ? q.pick + ' answers are correct' : 'Choose one answer';

    var opts = q.options.map(function (o, idx) {
      var sel = chosen.indexOf(o.key) !== -1;
      var mark = multi ? (sel ? '&#10003;' : '') : String.fromCharCode(65 + idx);
      return '<button type="button" class="asmt-opt' + (sel ? ' sel' : '') + '" data-key="' + esc(o.key) + '">' +
        '<span class="asmt-mk">' + mark + '</span><p>' + o.text + '</p></button>';
    }).join('');

    root.innerHTML =
      '<div class="asmt-stage">' +
      bar(segs() + '<span>' + elapsed() + '</span>') +
      '<div class="asmt-in">' +
        '<p class="asmt-qn"><span class="asmt-qtag">' + esc(tag) + '</span> ' + esc(sub) + '</p>' +
        '<p class="asmt-qtx">' + q.prompt + '</p>' +
        (q.code ? '<div class="asmt-code"><pre>' + esc(q.code) + '</pre></div>' : '') +
        '<div class="asmt-opts' + (multi ? ' asmt-multi' : '') + '">' + opts + '</div>' +
        '<div class="asmt-qfoot">' +
          '<button class="asmt-flag' + (state.flags[q.id] ? ' on' : '') + '" id="asmt-flag">' + FLAGSVG +
            (state.flags[q.id] ? ' Marked for review' : ' Mark for review') + '</button>' +
          '<div class="asmt-nav">' +
            (state.i > 0 ? '<button class="asmt-btn asmt-btn-g" id="asmt-back">Back</button>' : '') +
            '<button class="asmt-btn asmt-btn-p" id="asmt-next">' +
              (state.i === state.total - 1 ? 'Review and submit' : 'Next') + '</button>' +
          '</div>' +
        '</div>' +
      '</div></div>';

    root.querySelectorAll('.asmt-opt').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-key');
        var cur = state.answers[q.id] || [];
        if (multi) {
          var at = cur.indexOf(key);
          if (at !== -1) cur = cur.slice(0, at).concat(cur.slice(at + 1));
          else if (cur.length < q.pick) cur = cur.concat([key]);
          else cur = cur.slice(1).concat([key]);
        } else {
          cur = cur.length === 1 && cur[0] === key ? [] : [key];
        }
        state.answers[q.id] = cur;
        saveResume();
        renderQuestion();
      });
    });
    var fl = document.getElementById('asmt-flag');
    if (fl) fl.addEventListener('click', function () {
      state.flags[q.id] = !state.flags[q.id]; saveResume(); renderQuestion();
    });
    var bk = document.getElementById('asmt-back');
    if (bk) bk.addEventListener('click', function () { state.i--; saveResume(); renderQuestion(); });
    document.getElementById('asmt-next').addEventListener('click', function () {
      if (state.i === state.total - 1) submit();
      else { state.i++; saveResume(); renderQuestion(); }
    });
  }

  /* ---------- submit + result ---------- */
  function submit() {
    if (state.busy) return;
    var unanswered = state.questions.filter(function (q) {
      return !state.answers[q.id] || !state.answers[q.id].length;
    }).length;
    if (unanswered > 0 &&
        !window.confirm(unanswered + ' question' + (unanswered > 1 ? 's are' : ' is') +
          ' still unanswered. Submit anyway?')) return;

    state.busy = true;
    fetch('/api/assessment/' + encodeURIComponent(ID) + '/submit', {
      method: 'POST', headers: headers(),
      body: JSON.stringify({
        token: state.token, answers: state.answers,
        signed_name: state.signedName || '',
        duration_seconds: Math.floor(Date.now() / 1000) - state.startedAt
      })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        state.busy = false;
        if (!res.ok) return fail(res.j && res.j.message);
        clearResume();
        renderResult(res.j);
      })
      .catch(function () { state.busy = false; fail(); });
  }

  function renderResult(r) {
    var m = state.meta;
    var missed = (r.questions || []).filter(function (q) { return !q.correct; });
    var pct = r.standing && r.standing.percentile;

    var standingHtml = (pct === null || pct === undefined)
      ? '<p class="asmt-pct thin">Standing appears once 50 people have taken this assessment. So far ' +
          esc((r.standing && r.standing.sample) || 0) + ' have.</p>'
      : '<p class="asmt-pct">You scored higher than <b>' + esc(pct) + ' percent</b> of the ' +
          esc(r.standing.sample) + ' people who have taken this assessment.</p>';

    var revHtml = missed.length
      ? missed.map(function (q) {
          return '<div class="asmt-ritem"><span class="asmt-ricon n">' + CROSS + '</span>' +
            '<div class="asmt-rbody"><p>' + q.prompt + '</p>' +
            '<span><a href="/' + esc(q.chapter_slug) + '.html">' + esc(q.chapter_title) + '</a></span>' +
            '</div></div>';
        }).join('')
      : '<div class="asmt-ritem"><span class="asmt-ricon y">' + TICK + '</span>' +
        '<div class="asmt-rbody"><p>Every question correct.</p></div></div>';

    root.innerHTML =
      '<div class="asmt-stage">' + bar('Submitted just now') +
      '<div class="asmt-in">' +
        '<span class="asmt-verdict ' + (r.passed ? 'pass' : 'fail') + '">' +
          (r.passed ? TICK + ' Passed' : CROSS + ' Not passed yet') + '</span>' +
        '<div class="asmt-score"><b>' + esc(r.score) + ' / ' + esc(r.total) + '</b>' +
          '<span>' + Math.round((r.score / r.total) * 100) + ' percent, ' +
          state.passMark + ' needed to pass</span></div>' +
        standingHtml +
        '<div class="asmt-rev"><h3>' +
          (missed.length ? 'What to reread' : 'Nothing to reread') + '</h3>' +
          '<p>' + (missed.length
            ? 'Each links to the chapter that covers it.'
            : 'You can retake this any time to keep it fresh.') + '</p>' +
          revHtml +
        '</div>' +
        certBlock(r) +
      '</div></div>';
  }

  function certBlock(r) {
    var c = r.certificate || {};
    if (!r.passed) {
      return '<div class="asmt-certwrap"><p class="asmt-note">You can retake this in 24 hours. ' +
        'Reread the chapters above first; the next attempt draws a different set of questions.</p></div>';
    }
    if (c.needs_sign_in) {
      return '<div class="asmt-certwrap"><h3>Your certificate is waiting</h3>' +
        '<p class="asmt-note">Create a free account and this certificate is issued to your name. ' +
        'Your score is held against this browser until then.</p>' +
        '<div class="asmt-actions"><a class="asmt-btn asmt-btn-p" href="/signin.html?next=' +
        encodeURIComponent(location.pathname) + '">Create a free account</a></div></div>';
    }
    if (c.eligible && c.free) {
      return '<div class="asmt-certwrap"><h3>You earned a certificate</h3>' +
        '<p>Part 1 certificates are free for everyone.</p>' +
        '<div class="asmt-actions"><button class="asmt-btn asmt-btn-p" id="asmt-mint">Get my certificate</button></div></div>';
    }
    if (c.eligible) {
      return '<div class="asmt-certwrap"><h3>You passed. Your certificate is ready.</h3>' +
        '<div class="asmt-gate"><div class="asmt-certpreview"></div>' +
        '<div class="asmt-lock"><h3>Certificates come with Pro</h3>' +
        '<p>From Part 2 onward, certificates are part of Pro.</p>' +
        '<a class="asmt-btn asmt-btn-p" href="/pricing.html" style="width:100%;justify-content:center">See what Pro includes</a>' +
        '<p class="keep">Your score and your standing are saved either way. Upgrade whenever you like and this certificate is issued then.</p>' +
        '</div></div></div>';
    }
    return '';
  }

  function fail(msg) {
    root.innerHTML = '<div class="asmt-stage"><div class="asmt-in">' +
      '<h2>That did not go through</h2><p class="asmt-lede">' +
      esc(msg || 'Something went wrong submitting your answers. Your progress is saved, so you can try again.') +
      '</p><div class="asmt-actions"><button class="asmt-btn asmt-btn-p" onclick="location.reload()">Try again</button>' +
      '</div></div></div>';
  }

  /* ---------- boot ---------- */
  function boot() {
    root.innerHTML = '<div class="asmt-stage"><div class="asmt-in"><p class="asmt-lede">Loading the assessment...</p></div></div>';
    fetch('/api/assessment/' + encodeURIComponent(ID), { headers: headers() })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        if (!res.ok) return fail(res.j && res.j.message);
        state.token = res.j.token;
        state.meta = res.j.meta;
        state.questions = res.j.questions;
        state.total = res.j.total;
        state.passMark = res.j.pass_mark;
        state.signedIn = !!res.j.signed_in;
        renderPledge();
      })
      .catch(function () { fail(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
