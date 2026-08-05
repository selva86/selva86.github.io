/* dag-editor.js - an editable causal diagram wired to the number it changes.
 *
 * Serves the confounding, baseline-difference, selection-bias and non-comparable-control
 * objections in The Publishing Handbook. The reader edits a small causal diagram and the
 * estimated effect moves as backdoor paths open and close.
 *
 * WHAT IS EDITABLE. Each scenario fixes a node set (four or five nodes, which keeps the
 * picture readable) and a set of candidate arrows, all oriented consistently with one
 * topological order so no edit can create a cycle. Within that:
 *   - click any node to adjust or unadjust for it (a latent node refuses, and says why)
 *   - click any arrow, present or ghosted, to remove or add it
 * That is a real editor over a fixed node set. Adding brand new nodes was left out on
 * purpose: a free-form node editor makes a graph that is easy to build and hard to read,
 * and the teaching happens in the four canonical shapes, not in the drawing.
 *
 * WHERE THE NUMBER COMES FROM. Nothing here is simulated. The diagram is read as a linear
 * structural model: each node is the weighted sum of its parents plus independent noise,
 * with the noise variance set so every node has variance one. That determines the whole
 * covariance matrix exactly by path tracing, and the coefficient a researcher would report
 * is then the exact population least-squares solution
 *
 *     beta = Cov(W, W)^-1 Cov(W, Y),   W = (X, adjustment set)
 *
 * The true effect is the sum over directed paths from X to Y of the products of their
 * coefficients. So "bias" on screen is the exact difference between what the model
 * estimates and what the graph says is true, with no Monte Carlo error in it.
 *
 * WHICH PATHS ARE OPEN is decided by d-separation, applied path by path: a path is open
 * when every non-collider on it is unadjusted AND every collider on it is adjusted or has
 * an adjusted descendant. That is why adjusting for a collider makes things worse, and the
 * widget names the path it opened.
 *
 * The emitted R simulates from the same structural model and fits the same regressions, so
 * the reader can watch lm() land on the widget's number.
 *
 * cfg: {
 *   scenario: "confounding",     // confounding | baseline | selection | non-comparable
 *   scenarios: ["..."],          // OR a list -> segmented control (default: all four)
 *   n: 100000                    // sample size used by the emitted R
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f3f6f4', nodeFill: '#eef1f7'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b',
    soft: 'rgba(255,255,255,.05)', nodeFill: '#1d2c40'
  };
  function lumOf(c) {
    c = String(c).trim(); var r, g, b, m;
    if (c.charAt(0) === '#') {
      if (c.length === 4) { r = parseInt(c[1] + c[1], 16); g = parseInt(c[2] + c[2], 16); b = parseInt(c[3] + c[3], 16); }
      else { r = parseInt(c.substr(1, 2), 16); g = parseInt(c.substr(3, 2), 16); b = parseInt(c.substr(5, 2), 16); }
    } else if ((m = c.match(/rgba?\(([^)]+)\)/))) { var p = m[1].split(','); r = +p[0]; g = +p[1]; b = +p[2]; }
    else return 1;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function isDark(el) {
    try { var v = getComputedStyle(el).getPropertyValue('--lm-panel'); if (v && v.trim()) return lumOf(v) < 0.45; } catch (e) {}
    return !!(document.documentElement && document.documentElement.classList.contains('dark'));
  }
  function palette(el) { return isDark(el) ? DARK : LIGHT; }

  /* ---------------- scenarios ----------------
     `order` is a topological order. Every candidate edge runs forwards in it, so the graph
     can never become cyclic however the reader edits it. */
  var SCEN = {
    confounding: {
      label: 'Confounding',
      ask: 'A reviewer says the groups differed on something that also drives the outcome.',
      order: ['Z', 'X', 'M', 'Y'],
      nodes: {
        Z: { pos: [110, 38], name: 'baseline severity' },
        X: { pos: [58, 152], name: 'treatment' },
        M: { pos: [260, 152], name: 'adherence' },
        Y: { pos: [430, 100], name: 'outcome' }
      },
      X: 'X', Y: 'Y',
      edges: [
        { f: 'Z', t: 'X', b: 0.60, on: true },
        { f: 'Z', t: 'Y', b: 0.65, on: true },
        { f: 'X', t: 'Y', b: 0.30, on: true },
        { f: 'X', t: 'M', b: 0.55, on: false },
        { f: 'M', t: 'Y', b: 0.40, on: false }
      ],
      adjust: []
    },
    baseline: {
      label: 'Baseline difference',
      ask: 'A reviewer says the randomised arms were not balanced at baseline.',
      order: ['A', 'B', 'X', 'Y'],
      nodes: {
        A: { pos: [70, 38], name: 'age' },
        B: { pos: [252, 38], name: 'baseline score' },
        X: { pos: [70, 152], name: 'randomised arm' },
        Y: { pos: [430, 110], name: 'follow-up score' }
      },
      X: 'X', Y: 'Y',
      edges: [
        { f: 'B', t: 'X', b: 0.22, on: true },       // the chance imbalance itself
        { f: 'B', t: 'Y', b: 0.70, on: true },
        { f: 'X', t: 'Y', b: 0.30, on: true },
        { f: 'A', t: 'B', b: 0.50, on: false },
        { f: 'A', t: 'Y', b: 0.30, on: false }
      ],
      adjust: []
    },
    selection: {
      label: 'Selection bias',
      ask: 'A reviewer says the analysed sample is not the sample you recruited.',
      order: ['U', 'X', 'Y', 'S'],
      nodes: {
        U: { pos: [252, 30], name: 'motivation', latent: true },
        X: { pos: [64, 128], name: 'treatment' },
        Y: { pos: [440, 128], name: 'outcome' },
        S: { pos: [252, 186], name: 'stayed in the study' }
      },
      X: 'X', Y: 'Y',
      edges: [
        { f: 'X', t: 'Y', b: 0.30, on: true },
        { f: 'X', t: 'S', b: 0.50, on: true },
        { f: 'Y', t: 'S', b: 0.50, on: true },
        { f: 'U', t: 'X', b: 0.40, on: false },
        { f: 'U', t: 'Y', b: 0.40, on: false }
      ],
      adjust: ['S']                                   // analysing completers IS conditioning on S
    },
    'non-comparable': {
      label: 'Non-comparable controls',
      ask: 'A reviewer says the controls came from somewhere the cases did not.',
      order: ['U', 'P', 'X', 'Y'],
      nodes: {
        U: { pos: [252, 30], name: 'true case mix', latent: true },
        P: { pos: [252, 128], name: 'recorded case mix' },
        X: { pos: [64, 128], name: 'came from clinic A' },
        Y: { pos: [440, 128], name: 'outcome' }
      },
      X: 'X', Y: 'Y',
      edges: [
        { f: 'U', t: 'P', b: 0.80, on: true },
        { f: 'U', t: 'X', b: 0.60, on: true },
        { f: 'U', t: 'Y', b: 0.65, on: true },
        { f: 'X', t: 'Y', b: 0.30, on: true },
        { f: 'P', t: 'X', b: 0.35, on: false }
      ],
      adjust: []
    }
  };

  /* ---------------- linear structural model -> exact covariance ---------------- */
  function covariance(sc, on) {
    var order = sc.order, k = order.length, ix = {}, i, j, a, b2;
    for (i = 0; i < k; i++) ix[order[i]] = i;
    var B = [];                                        // B[i][j] = effect of parent j on i
    for (i = 0; i < k; i++) { B.push(new Array(k)); for (j = 0; j < k; j++) B[i][j] = 0; }
    sc.edges.forEach(function (e, q) { if (on[q]) B[ix[e.t]][ix[e.f]] = e.b; });
    var S = [];
    for (i = 0; i < k; i++) { S.push(new Array(k)); for (j = 0; j < k; j++) S[i][j] = 0; }
    var resid = new Array(k);
    for (i = 0; i < k; i++) {
      for (a = 0; a < i; a++) {                        // covariance with everything upstream
        var c = 0;
        for (j = 0; j < i; j++) c += B[i][j] * S[j][a];
        S[i][a] = c; S[a][i] = c;
      }
      var vp = 0;
      for (j = 0; j < i; j++) for (b2 = 0; b2 < i; b2++) vp += B[i][j] * B[i][b2] * S[j][b2];
      resid[i] = Math.max(0.1, 1 - vp);                // unit variance wherever that is possible
      S[i][i] = vp + resid[i];
    }
    return { S: S, ix: ix, B: B, resid: resid };
  }

  function solve(A, rhs) {                             // small dense Gaussian elimination
    var p = A.length, M = [], i, j, k2;
    for (i = 0; i < p; i++) M.push(A[i].slice().concat([rhs[i]]));
    for (i = 0; i < p; i++) {
      var piv = i;
      for (k2 = i + 1; k2 < p; k2++) if (Math.abs(M[k2][i]) > Math.abs(M[piv][i])) piv = k2;
      var t = M[i]; M[i] = M[piv]; M[piv] = t;
      var d = M[i][i] || 1e-300;
      for (j = i; j <= p; j++) M[i][j] /= d;
      for (k2 = 0; k2 < p; k2++) {
        if (k2 === i) continue;
        var f = M[k2][i]; if (!f) continue;
        for (j = i; j <= p; j++) M[k2][j] -= f * M[i][j];
      }
    }
    var out = []; for (i = 0; i < p; i++) out.push(M[i][p]);
    return out;
  }

  /* The coefficient on X from the population regression of Y on X plus the adjustment set. */
  function estimate(sc, cov, adj) {
    var W = [sc.X].concat(adj), p = W.length, i, j;
    var A = [], r = [];
    for (i = 0; i < p; i++) {
      A.push([]);
      for (j = 0; j < p; j++) A[i].push(cov.S[cov.ix[W[i]]][cov.ix[W[j]]]);
      r.push(cov.S[cov.ix[W[i]]][cov.ix[sc.Y]]);
    }
    return solve(A, r)[0];
  }

  /* ---------------- graph reading: paths, colliders, descendants ---------------- */
  function graph(sc, on) {
    var out = { adjOut: {}, adjIn: {}, nbr: {}, has: {} };
    Object.keys(sc.nodes).forEach(function (v) { out.adjOut[v] = []; out.adjIn[v] = []; out.nbr[v] = []; });
    sc.edges.forEach(function (e, q) {
      if (!on[q]) return;
      out.has[e.f + '>' + e.t] = e.b;
      out.adjOut[e.f].push(e.t); out.adjIn[e.t].push(e.f);
      out.nbr[e.f].push(e.t); out.nbr[e.t].push(e.f);
    });
    out.desc = {};
    Object.keys(sc.nodes).forEach(function (v) {
      var seen = {}, stack = out.adjOut[v].slice();
      while (stack.length) { var w = stack.pop(); if (seen[w]) continue; seen[w] = 1; out.adjOut[w].forEach(function (z) { stack.push(z); }); }
      out.desc[v] = Object.keys(seen);
    });
    return out;
  }
  function allPaths(G, from, to) {
    var res = [];
    (function walk(v, path, used) {
      if (v === to) { res.push(path.slice()); return; }
      G.nbr[v].forEach(function (w) {
        if (used[w]) return;
        used[w] = 1; path.push(w); walk(w, path, used); path.pop(); used[w] = 0;
      });
    })(from, [from], (function () { var s = {}; s[from] = 1; return s; })());
    return res;
  }
  function classify(sc, G, path, adjSet) {
    var i, blockedBy = null, opener = null, causal = true, forward = [];
    for (i = 0; i < path.length - 1; i++) {
      var fwd = (path[i] + '>' + path[i + 1]) in G.has;
      forward.push(fwd);
      if (!fwd) causal = false;
    }
    for (i = 1; i < path.length - 1; i++) {
      var prev = path[i - 1], v = path[i], next = path[i + 1];
      var inA = (prev + '>' + v) in G.has, inB = (next + '>' + v) in G.has;
      if (inA && inB) {                                 // collider
        var openIt = adjSet[v];
        if (!openIt) for (var d = 0; d < G.desc[v].length; d++) if (adjSet[G.desc[v][d]]) { openIt = true; break; }
        if (!openIt) { blockedBy = blockedBy || { kind: 'collider', node: v }; }
        else opener = opener || v;
      } else if (adjSet[v]) {
        blockedBy = blockedBy || { kind: 'adjusted', node: v };
      }
    }
    var backdoor = (path[1] + '>' + path[0]) in G.has;
    return { path: path, forward: forward, causal: causal, backdoor: backdoor,
             open: !blockedBy, blockedBy: blockedBy, opener: opener };
  }
  function totalEffect(sc, G) {
    var t = 0;
    allPaths(G, sc.X, sc.Y).forEach(function (p) {
      var prod = 1, ok = true, i;
      for (i = 0; i < p.length - 1; i++) {
        var b = G.has[p[i] + '>' + p[i + 1]];
        if (b === undefined) { ok = false; break; }
        prod *= b;
      }
      if (ok) t += prod;
    });
    return t;
  }

  /* ---------------- mount ---------------- */
  function mount(el, cfg) {
    cfg = cfg || {};
    var list = (cfg.scenarios && cfg.scenarios.length ? cfg.scenarios : (cfg.scenario ? [cfg.scenario] : Object.keys(SCEN)))
                 .filter(function (s) { return SCEN[s]; });
    if (!list.length) list = ['confounding'];
    var nSim = Math.max(2000, +cfg.n || 100000);
    var key = list[0], sc, on, adjSet;

    function reset() {
      sc = SCEN[key];
      on = sc.edges.map(function (e) { return !!e.on; });
      adjSet = {};
      sc.adjust.forEach(function (v) { adjSet[v] = true; });
    }
    reset();

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      (list.length > 1 ? '<div class="dg-seg" style="margin-bottom:11px"></div>' : '') +
      '<div class="dg-ask" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-bottom:4px"></div>' +
      '<div class="dg-hint" style="font:11.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + ';margin-bottom:9px">' +
        'Click a node to adjust for it. Click an arrow to remove it, or a ghosted arrow to add it.</div>' +
      '<div class="dg-plot"></div>' +
      '<div class="dg-num" style="margin-top:8px"></div>' +
      '<div class="dg-paths" style="margin-top:11px"></div>' +
      '<div class="dg-msg" style="font:12.5px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 12px;min-height:20px"></div>' +
      '<button type="button" class="dg-reset" style="font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line +
        ';background:none;color:' + P.mut + ';border-radius:8px;padding:6px 12px;cursor:pointer;margin-bottom:14px">Reset the diagram</button>' +
      '<div class="dg-r"></div>';

    var segBox = el.querySelector('.dg-seg'), plot = el.querySelector('.dg-plot'),
        numBox = el.querySelector('.dg-num'), pathBox = el.querySelector('.dg-paths'),
        msg = el.querySelector('.dg-msg'), ask = el.querySelector('.dg-ask'),
        rbox = el.querySelector('.dg-r'), resetBtn = el.querySelector('.dg-reset');

    if (segBox) {
      segBox.innerHTML = u.seg(list.map(function (s) { return { v: s, label: SCEN[s].label }; }), key);
      u.wireSeg(segBox, function (v) { key = v; reset(); render(''); });
    }
    resetBtn.addEventListener('click', function () { reset(); render('Back to the diagram as the reviewer described it.'); });

    plot.addEventListener('click', function (ev) {
      var g = ev.target.closest ? ev.target.closest('[data-hit]') : null;
      if (!g || !plot.contains(g)) return;
      act(g.getAttribute('data-hit'));
    });
    plot.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      var g = ev.target.closest ? ev.target.closest('[data-hit]') : null;
      if (!g || !plot.contains(g)) return;
      ev.preventDefault(); act(g.getAttribute('data-hit'));
    });
    function act(hit) {
      var bits = hit.split(':');
      if (bits[0] === 'n') {
        var v = bits[1];
        if (v === sc.X || v === sc.Y) { render('The exposure and the outcome are what you are relating. You do not adjust for either.'); return; }
        if (sc.nodes[v].latent) { render(sc.nodes[v].name + ' is unmeasured. That is the whole difficulty: you cannot adjust for a column you do not have.'); return; }
        adjSet[v] = !adjSet[v];
        render(adjSet[v] ? 'Adjusting for ' + sc.nodes[v].name + '.' : 'No longer adjusting for ' + sc.nodes[v].name + '.');
      } else {
        var q = +bits[1];
        on[q] = !on[q];
        var e = sc.edges[q];
        render((on[q] ? 'Added ' : 'Removed ') + e.f + ' to ' + e.t + '.');
      }
    }

    function render(note) {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      ask.style.color = P.body; msg.style.color = P.body;
      var cov = covariance(sc, on), G = graph(sc, on);
      var adj = Object.keys(adjSet).filter(function (v) { return adjSet[v] && !sc.nodes[v].latent; });
      var est = estimate(sc, cov, adj), truth = totalEffect(sc, G);
      var crude = estimate(sc, cov, []);
      var paths = allPaths(G, sc.X, sc.Y).map(function (p) { return classify(sc, G, p, adjSet); });

      ask.textContent = sc.ask;
      plot.innerHTML = drawDag(sc, on, adjSet, P);
      numBox.innerHTML = numbers(est, truth, adj, sc, P);
      pathBox.innerHTML = pathList(paths, P);
      msg.innerHTML = (note ? '<b>' + u.esc(note) + '</b> ' : '') + explain(paths, est, truth, crude, adj, sc, P);
      rbox.innerHTML = u.runnable(rcode(sc, on, adj, cov, truth, nSim), { label: 'Simulate this exact diagram in R' });
    }

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(''); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render('');
  }

  /* ---------------- drawing ---------------- */
  var R = 25;
  function drawDag(sc, on, adjSet, P) {
    var W = 520, H = 232, g = '';
    function pos(v) { return sc.nodes[v].pos; }
    sc.edges.forEach(function (e, q) {
      var a = pos(e.f), b = pos(e.t), dx = b[0] - a[0], dy = b[1] - a[1];
      var L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L;
      var x1 = a[0] + ux * (R + 2), y1 = a[1] + uy * (R + 2), x2 = b[0] - ux * (R + 7), y2 = b[1] - uy * (R + 7);
      var live = on[q], col = live ? P.mut : P.faint, ang = Math.atan2(uy, ux);
      g += '<g data-hit="e:' + q + '" tabindex="0" role="button" style="cursor:pointer" ' +
           'aria-label="' + (live ? 'remove' : 'add') + ' the arrow from ' + u.esc(sc.nodes[e.f].name) + ' to ' + u.esc(sc.nodes[e.t].name) + '">' +
           '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="transparent" stroke-width="16"/>' +
           '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) +
             '" stroke="' + col + '" stroke-width="' + (live ? 2 : 1.4) + '"' + (live ? '' : ' stroke-dasharray="4 4" stroke-opacity="0.55"') + '/>' +
           '<path d="M' + x2.toFixed(1) + ',' + y2.toFixed(1) +
             ' L' + (x2 - 9 * Math.cos(ang - 0.38)).toFixed(1) + ',' + (y2 - 9 * Math.sin(ang - 0.38)).toFixed(1) +
             ' L' + (x2 - 9 * Math.cos(ang + 0.38)).toFixed(1) + ',' + (y2 - 9 * Math.sin(ang + 0.38)).toFixed(1) + 'Z" fill="' + col + '"' +
             (live ? '' : ' fill-opacity="0.55"') + '/>';
      if (live && e.b) {
        var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        g += '<text x="' + mx.toFixed(1) + '" y="' + (my - 5).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' + P.faint +
             '" stroke="' + P.panel + '" stroke-width="2.8" paint-order="stroke">' + e.b.toFixed(2) + '</text>';
      }
      g += '</g>';
    });
    Object.keys(sc.nodes).forEach(function (v) {
      var p = sc.nodes[v].pos, node = sc.nodes[v];
      var isX = v === sc.X, isY = v === sc.Y, adj = !!adjSet[v] && !node.latent;
      var fill = isX ? P.acc : (isY ? P.c0 : P.nodeFill);
      var txt = (isX || isY) ? '#fff' : P.ink;
      g += '<g data-hit="n:' + v + '" tabindex="0" role="button" style="cursor:pointer" ' +
           'aria-label="' + (adj ? 'stop adjusting for ' : 'adjust for ') + u.esc(node.name) + '">';
      if (adj) g += '<rect x="' + (p[0] - R - 6) + '" y="' + (p[1] - R - 6) + '" width="' + (2 * R + 12) + '" height="' + (2 * R + 12) +
                    '" rx="7" fill="none" stroke="' + P.acc + '" stroke-width="2.4"/>';
      g += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + R + '" fill="' + fill + '" stroke="' + (node.latent ? P.faint : P.line) + '"' +
           (node.latent ? ' stroke-dasharray="3 3" stroke-width="1.6"' : '') + '/>' +
           '<text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="14" font-weight="700" fill="' + txt + '">' + u.esc(v) + '</text>' +
           '<text x="' + p[0] + '" y="' + (p[1] + R + 14) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.faint +
             '" stroke="' + P.panel + '" stroke-width="2.6" paint-order="stroke">' + u.esc(node.name) + (node.latent ? ' (unmeasured)' : '') + '</text>' +
           '</g>';
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" ' +
      'role="group" aria-label="editable causal diagram">' + g + '</svg>';
  }

  function numbers(est, truth, adj, sc, P) {
    var bias = est - truth, off = Math.abs(bias) > 0.02;
    var W = 520, x0 = 162, span = 288;
    var lo = Math.min(-0.15, est - 0.12, truth - 0.12), hi = Math.max(0.95, est + 0.15, truth + 0.15);
    function bx(v) { return x0 + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * span; }
    var g = '';
    // a bar can run left of zero when the estimate is negative, so the value label goes on
    // the far side of the bar end rather than on top of the bar
    function valLabel(v, y, col) {
      var neg = v < 0;
      return '<text x="' + (neg ? bx(v) - 8 : bx(v) + 8).toFixed(1) + '" y="' + y + '" text-anchor="' + (neg ? 'end' : 'start') +
        '" font-family="IBM Plex Mono,monospace" font-size="11.5" font-weight="700" fill="' + col + '">' + v.toFixed(3) + '</text>';
    }
    g += '<text x="0" y="14" font-family="IBM Plex Sans,sans-serif" font-size="11.5" fill="' + P.body + '">True effect of X on Y</text>' +
         '<line x1="' + bx(0).toFixed(1) + '" y1="6" x2="' + bx(truth).toFixed(1) + '" y2="6" stroke="' + P.acc + '" stroke-width="9" stroke-linecap="butt"/>' +
         valLabel(truth, 10, P.acc);
    g += '<text x="0" y="40" font-family="IBM Plex Sans,sans-serif" font-size="11.5" fill="' + P.body + '">What the model reports</text>' +
         '<line x1="' + bx(0).toFixed(1) + '" y1="32" x2="' + bx(est).toFixed(1) + '" y2="32" stroke="' + (off ? P.bad : P.acc) + '" stroke-width="9"/>' +
         valLabel(est, 36, off ? P.bad : P.acc);
    g += '<text x="0" y="58" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.faint + '">' +
         u.esc('lm(' + sc.Y + ' ~ ' + [sc.X].concat(adj).join(' + ') + ')') + '</text>' +
         '<text x="' + W + '" y="58" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10.5" fill="' + (off ? P.bad : P.faint) + '">' +
         'bias ' + (bias >= 0 ? '+' : '') + bias.toFixed(3) + '</text>';
    return '<svg viewBox="0 0 ' + W + ' 64" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="true effect against the reported coefficient">' + g + '</svg>';
  }

  function pathList(paths, P) {
    var rows = paths.slice().sort(function (a, b) { return (b.causal ? 1 : 0) - (a.causal ? 1 : 0); }).map(function (p) {
      var s = pathString(p);
      var open = p.open, kind = p.causal ? 'causal' : (p.backdoor ? 'backdoor' : 'non-causal');
      var colour = p.causal ? (open ? P.acc : P.c1) : (open ? P.bad : P.mut);
      var state = p.causal ? (open ? 'carrying the effect' : 'blocked, so this part of the effect is removed from the estimate')
                           : (open ? 'OPEN, so it leaks into the estimate' : 'blocked');
      if (!p.causal && open && p.opener) state = 'OPEN because you adjusted for ' + p.opener + ', a collider';
      if (!p.causal && !open && p.blockedBy && p.blockedBy.kind === 'collider') state = 'blocked by the collider at ' + p.blockedBy.node;
      if (!p.causal && !open && p.blockedBy && p.blockedBy.kind === 'adjusted') state = 'blocked by adjusting for ' + p.blockedBy.node;
      return '<li style="margin:0 0 4px"><code style="font-family:IBM Plex Mono,monospace;font-size:12px;color:' + colour + '">' + s +
        '</code> <span style="color:' + P.faint + ';font-size:11.5px">' + kind + ', ' + state + '</span></li>';
    });
    if (!rows.length) return '<div style="font:12px IBM Plex Sans,sans-serif;color:' + P.faint + '">No path connects X and Y at all.</div>';
    return '<div style="font:600 11px IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:4px">Every route between X and Y</div>' +
      '<ul style="list-style:none;margin:0;padding:0;font-family:IBM Plex Sans,sans-serif">' + rows.join('') + '</ul>';
  }
  function pathString(p) {
    var s = p.path[0];
    for (var i = 0; i < p.path.length - 1; i++) {
      s += (p.dirs && p.dirs[i] ? '' : '');
      s += p.forward[i] ? ' &rarr; ' : ' &larr; ';
      s += p.path[i + 1];
    }
    return s;
  }

  function explain(paths, est, truth, crude, adj, sc, P) {
    var openBack = paths.filter(function (p) { return !p.causal && p.open; });
    var blockedCausal = paths.filter(function (p) { return p.causal && !p.open; });
    var bias = est - truth;
    if (!openBack.length && !blockedCausal.length) {
      return 'Every non-causal route is blocked and every causal route is intact, so the coefficient on ' + sc.X +
        ' is the effect you meant to estimate: <b style="color:' + P.acc + '">' + est.toFixed(3) + '</b> against a true ' + truth.toFixed(3) + '.';
    }
    var bits = [];
    if (openBack.length) {
      bits.push(openBack.length === 1 ? 'One non-causal route is still open (' + pathString(openBack[0]) + '), and it is carrying ' +
                (bias >= 0 ? '+' : '') + bias.toFixed(3) + ' into the coefficient'
              : openBack.length + ' non-causal routes are open, and together they move the coefficient by ' + (bias >= 0 ? '+' : '') + bias.toFixed(3));
    }
    if (blockedCausal.length) {
      bits.push('a causal route is blocked by the adjustment, so the number on screen is a direct effect, not the total effect the question asked about');
    }
    var tail = '';
    var latent = Object.keys(sc.nodes).filter(function (v) { return sc.nodes[v].latent; });
    if (openBack.length && latent.length && openBack.some(function (p) { return p.path.indexOf(latent[0]) >= 0; })) {
      tail = ' The open route runs through ' + latent[0] + ', which you did not measure, so nothing in this dataset closes it.';
      if (adj.length && Math.abs(est - truth) < Math.abs(crude - truth) - 1e-6) {
        tail += ' Adjusting for ' + adj.join(' and ') + ' pulled the bias from ' + (crude - truth).toFixed(3) + ' down to ' + bias.toFixed(3) +
          ', which is the honest description of a proxy: partial control, not identification. The diagram still shows the path open, and it is.';
      } else {
        tail += ' That is a limitation to state, not a model to re-run.';
      }
    }
    return bits.join(', and ') + '.' + tail;
  }

  /* ---------------- runnable R ----------------
     Simulates the graph exactly as drawn: each node is its parents plus noise scaled so
     every variable has variance one. lm() then lands on the widget's population number. */
  function rcode(sc, on, adj, cov, truth, n) {
    var lines = ['# The diagram as it stands, simulated. Every variable has variance 1.',
                 'set.seed(3)', 'n <- ' + n, ''];
    sc.order.forEach(function (v) {
      var terms = [];
      sc.edges.forEach(function (e, q) { if (on[q] && e.t === v && e.b) terms.push(e.b.toFixed(2) + ' * ' + e.f); });
      var sd = Math.sqrt(cov.resid[cov.ix[v]]).toFixed(4);
      var rhs = terms.length ? terms.join(' + ') + ' + rnorm(n, sd = ' + sd + ')' : 'rnorm(n)';
      lines.push(v + ' <- ' + rhs + (sc.nodes[v].latent ? '        # unmeasured in real life' : ''));
    });
    lines.push('');
    lines.push('true_effect <- ' + truth.toFixed(4) + '   # the sum over directed paths from ' + sc.X + ' to ' + sc.Y);
    lines.push('');
    lines.push('round(c(');
    lines.push('  crude    = unname(coef(lm(' + sc.Y + ' ~ ' + sc.X + '))["' + sc.X + '"]),');
    if (adj.length) {
      lines.push('  adjusted = unname(coef(lm(' + sc.Y + ' ~ ' + [sc.X].concat(adj).join(' + ') + '))["' + sc.X + '"]),');
    }
    lines.push('  truth    = true_effect), 3)');
    return lines.join('\n');
  }

  window.LessonWidgets.register('dag-editor', mount);
})();
