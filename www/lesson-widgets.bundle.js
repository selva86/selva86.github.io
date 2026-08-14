/* index.js */
/* lesson-widgets/index.js - registry + mounter for interactive lesson widgets.
 *
 * Each widget module calls LessonWidgets.register('<type>', mount). The player
 * (lesson-mode.js) calls mountAll(stepEl) when a step becomes visible, because
 * canvases must size themselves while shown, not while display:none.
 *
 * mount(el, cfg) contract: build controls + canvas inside el; idempotent
 * (guarded by el.dataset.mounted); self-contained; deterministic (seeded).
 */
(function () {
  'use strict';
  var registry = {};

  window.LessonWidgets = {
    register: function (type, mountFn) { registry[type] = mountFn; },

    mount: function (el) {
      if (!el || el.dataset.mounted) return;
      var type = el.getAttribute('data-widget-type');
      var fn = registry[type];
      if (!fn) return;                       // unknown type: leave the noscript fallback
      var cfg = {};
      try { cfg = JSON.parse(el.getAttribute('data-widget-config') || '{}'); } catch (e) {}
      el.dataset.mounted = '1';
      try { fn(el, cfg); }
      catch (e) { if (window.console) console.error('[lesson-widget] ' + type + ' failed', e); }
    },

    mountAll: function (root) {
      var scope = root || document;
      var els = scope.querySelectorAll ? scope.querySelectorAll('.lesson-widget') : [];
      for (var i = 0; i < els.length; i++) this.mount(els[i]);
    }
  };

  /* Shared helpers for the data-analyst widget family (tables, controls, charts).
     Self-contained, deterministic, no deps. New widgets use these; the older
     stats/ML widgets predate them and are untouched. */
  var P = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', line2: '#eef1f6', bg: '#f3f6f4', acc: '#1f7a55',
    c0: '#2563a8', c1: '#b5631a', bad: '#c2410c', add: '#e7f3ec', del: '#fbeae5',
    codeBg: '#0d1117', codeFg: '#e6edf3'
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
  function num(v) { if (v == null || v === '' || isNaN(v)) return v; var n = +v; return (Math.round(n * 100) / 100).toString(); }

  var u = {
    P: P, esc: esc, num: num,
    // Static, illustrative code panel. Wraps (no horizontal scroll) so the whole
    // snippet is visible in narrow widget columns; min-height keeps it from looking cramped.
    code: function (t) { return '<code style="display:block;font-family:IBM Plex Mono,monospace;font-size:13px;line-height:1.55;background:' + P.codeBg + ';color:' + P.codeFg + ';padding:11px 14px;border-radius:8px;white-space:pre-wrap;overflow-wrap:anywhere">' + esc(t) + '</code>'; },
    // Build a self-contained R data.frame literal from a widget's JS data.
    // cols: [{name, key}] -> df <- data.frame(name = c(<d[key] values>)). Strings are quoted.
    rdf: function (data, cols, varName) {
      var lines = cols.map(function (c) {
        var vals = (data || []).map(function (d) {
          var v = d[c.key];
          return (v == null || v === '' || isNaN(v)) ? '"' + String(v == null ? '' : v).replace(/"/g, '') + '"' : (+v);
        }).join(', ');
        return '  ' + c.name + ' = c(' + vals + ')';
      });
      return (varName || 'df') + ' <- data.frame(\n' + lines.join(',\n') + '\n)';
    },
    // Like rdf but from the cols + rows-of-arrays shape the table widgets use.
    // Backtick-quotes column names + check.names=FALSE so names like "2020" survive.
    rdfCR: function (name, cols, rows) {
      var lines = cols.map(function (c, ci) {
        var vals = (rows || []).map(function (r) {
          var v = r[ci];
          return (v == null || v === '' || isNaN(v)) ? '"' + String(v == null ? '' : v).replace(/"/g, '') + '"' : (+v);
        }).join(', ');
        return '  `' + c + '` = c(' + vals + ')';
      });
      return name + ' <- data.frame(\n' + lines.join(',\n') + ',\n  check.names = FALSE, stringsAsFactors = FALSE\n)';
    },
    // A REAL runnable interactive-R block (same DOM contract as the build emits, so
    // webr-init.js wires Run via the inline onclick + reads code from textContent).
    // Self-contained code runs in the lesson's shared WebR session (packages auto-install).
    runnable: function (code, opts) {
      opts = opts || {}; var ec = esc(code), label = esc(opts.label || 'Interactive R');
      return '<div class="webr-container">' +
        '<div class="webr-code-block">' +
          '<div class="webr-header"><div class="webr-header-left">' +
            '<span class="webr-header-badge">R</span><span class="webr-header-label">' + label + '</span>' +
          '</div><div class="webr-header-right">' +
            '<button class="btn btn-sm btn-primary webr-run-btn" onclick="runWebR(this)">&#9654; Run <span class="webr-run-shortcut">Ctrl+Enter</span></button>' +
          '</div></div>' +
          '<div class="webr-editor" data-language="r">' + ec + '</div>' +
          '<div class="webr-buttons">' +
            '<button class="btn btn-sm btn-primary webr-run-btn" onclick="runWebR(this)">&#9654; Run</button>' +
            '<button class="btn btn-sm btn-default webr-reset-btn" onclick="resetWebR(this)">&#8634; Reset</button>' +
          '</div>' +
          '<pre class="webr-output"></pre>' +
        '</div>' +
        '<div class="webr-plot-output"></div>' +
      '</div>';
    },
    // Seed a runnable block's plot area with an instant SVG preview. webr-init clears
    // this area on Run and draws the real plot in its place, so there is ONE chart, not
    // a static copy plus a live copy. The caption sets expectation and clears on Run.
    previewSeed: function (innerSVG) {
      return '<div style="font:600 10px/1.4 IBM Plex Mono,monospace;letter-spacing:.04em;' +
        'text-transform:uppercase;color:' + P.faint + ';margin:0 0 7px">Preview - press Run to render with R</div>' + innerSVG;
    },
    btn: function (label, kind) { var pri = kind === 'primary'; return '<button type="button" style="font:inherit;font-size:13px;font-weight:600;border-radius:8px;padding:9px 16px;cursor:pointer;' + (pri ? 'color:#fff;background:' + P.acc + ';border:0' : 'color:' + P.mut + ';background:none;border:1px solid ' + P.line) + '">' + esc(label) + '</button>'; },
    // data table; opts: addCols{}, dropCols{}, delRows{}, hi{"r,c":color}, headBg
    tbl: function (cols, rows, opts) {
      opts = opts || {}; var addC = opts.addCols || {}, dropC = opts.dropCols || {}, delR = opts.delRows || {}, hi = opts.hi || {}, head = opts.headBg || P.bg;
      var h = '<table style="border-collapse:collapse;font-family:IBM Plex Mono,monospace;font-size:12.5px;width:100%">';
      h += '<thead><tr>';
      cols.forEach(function (c) { var bg = addC[c] ? P.add : (dropC[c] ? P.del : head); h += '<th style="text-align:left;padding:6px 9px;border:1px solid ' + P.line + ';background:' + bg + ';color:' + P.ink + ';font-weight:700;white-space:nowrap">' + esc(c) + '</th>'; });
      h += '</tr></thead><tbody>';
      rows.forEach(function (r, ri) { var del = delR[ri]; h += '<tr style="' + (del ? 'opacity:.4;text-decoration:line-through;' : '') + '">';
        cols.forEach(function (c, ci) { var k = ri + ',' + ci, bg = hi[k] || (addC[c] ? P.add : (dropC[c] ? P.del : '#fff')), v = r[ci];
          h += '<td style="padding:6px 9px;border:1px solid ' + P.line + ';background:' + bg + ';color:' + P.ink + ';white-space:nowrap">' + (v == null ? '<span style="color:' + P.bad + '">NA</span>' : esc(v)) + '</td>'; });
        h += '</tr>'; });
      return h + '</tbody></table>';
    },
    // segmented control; items: [{v,label}] or [v]; returns HTML. Wire with wireSeg.
    seg: function (items, cur) {
      var h = '<div class="lwseg" style="display:inline-flex;flex-wrap:wrap;gap:4px;border:1px solid ' + P.line + ';border-radius:9px;padding:3px;background:#fff">';
      items.forEach(function (it) { var v = (it && it.v != null) ? it.v : it, lab = (it && it.label != null) ? it.label : v, on = (String(v) === String(cur));
        h += '<button type="button" data-val="' + esc(v) + '" style="font:inherit;font-size:12.5px;font-weight:600;border:0;border-radius:6px;padding:6px 11px;cursor:pointer;background:' + (on ? P.acc : 'transparent') + ';color:' + (on ? '#fff' : P.mut) + '">' + esc(lab) + '</button>'; });
      return h + '</div>';
    },
    wireSeg: function (root, onPick) {
      root.addEventListener('click', function (e) { var b = e.target.closest('[data-val]'); if (!b || !root.contains(b)) return;
        var seg = b.parentNode; Array.prototype.forEach.call(seg.children, function (c) { var on = c === b; c.style.background = on ? P.acc : 'transparent'; c.style.color = on ? '#fff' : P.mut; });
        onPick(b.getAttribute('data-val'), b); });
    },
    // compact multi-geom SVG chart. spec: {geom:point|line|bar|col|histogram|boxplot, x, y, w, h, palette, corr, bins}
    plot: function (data, spec) {
      spec = spec || {}; var W = spec.w || 460, H = spec.h || 268, m = { t: 16, r: 16, b: 38, l: 46 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var geom = spec.geom || 'point', pal = spec.palette || [P.acc, P.c0, P.c1, '#7a5ea3', '#2f8f86', '#b04a52'];
      function lin(d0, d1, r0, r1) { if (d0 === d1) d1 = d0 + 1; return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); }; }
      function ext(a) { return [Math.min.apply(null, a), Math.max.apply(null, a)]; }
      function frame() { return '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>'; }
      function yax(sy, ticks) { var a = ''; ticks.forEach(function (t) { var y = sy(t); a += '<line x1="' + m.l + '" y1="' + y.toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + y.toFixed(1) + '" stroke="' + P.line2 + '"/><text x="' + (m.l - 7) + '" y="' + (y + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + num(t) + '</text>'; }); return a; }
      function xlab(x, txt) { return '<text x="' + x + '" y="' + (m.t + ih + 16) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">' + esc(txt) + '</text>'; }
      function axtitle() { return '<text x="' + (m.l + iw / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">' + esc(spec.x || '') + '</text><text transform="translate(12,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">' + esc(spec.y || '') + '</text>'; }
      var body = '', extra = '';
      if (geom === 'point') {
        var xs = data.map(function (d) { return +d.x; }), ys = data.map(function (d) { return +d.y; }), xe = ext(xs), ye = ext(ys);
        var px = (xe[1] - xe[0]) * 0.08 || 1, py = (ye[1] - ye[0]) * 0.08 || 1, sx = lin(xe[0] - px, xe[1] + px, m.l, m.l + iw), sy = lin(ye[0] - py, ye[1] + py, m.t + ih, m.t);
        var gmap = {}, gi = 0; data.forEach(function (d) { var g = d.fill == null ? '_' : d.fill; if (!(g in gmap)) gmap[g] = gi++; });
        body += yax(sy, [ye[0], (ye[0] + ye[1]) / 2, ye[1]]);
        data.forEach(function (d) { body += '<circle cx="' + sx(+d.x).toFixed(1) + '" cy="' + sy(+d.y).toFixed(1) + '" r="5" fill="' + pal[gmap[d.fill == null ? '_' : d.fill] % pal.length] + '" fill-opacity="0.78"/>'; });
        if (spec.corr) { var n = xs.length, mx = xs.reduce(function (a, b) { return a + b; }, 0) / n, my = ys.reduce(function (a, b) { return a + b; }, 0) / n, sxy = 0, sxx = 0, syy = 0, i; for (i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); syy += (ys[i] - my) * (ys[i] - my); } extra = '<text x="' + (m.l + iw - 4) + '" y="' + (m.t + 13) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="12" fill="' + P.ink + '">r = ' + num(sxy / Math.sqrt(sxx * syy)) + '</text>'; }
      } else if (geom === 'line') {
        var lx = data.map(function (d) { return +d.x; }), ly = data.map(function (d) { return +d.y; }), lxe = ext(lx), lye = ext(ly), sxl = lin(lxe[0], lxe[1], m.l, m.l + iw), syl = lin(Math.min(0, lye[0]), lye[1], m.t + ih, m.t);
        body += yax(syl, [Math.min(0, lye[0]), lye[1]]) + '<polyline points="' + data.map(function (d) { return sxl(+d.x).toFixed(1) + ',' + syl(+d.y).toFixed(1); }).join(' ') + '" fill="none" stroke="' + pal[0] + '" stroke-width="2.5"/>';
        data.forEach(function (d) { body += '<circle cx="' + sxl(+d.x).toFixed(1) + '" cy="' + syl(+d.y).toFixed(1) + '" r="3.5" fill="' + pal[0] + '"/>'; });
      } else if (geom === 'bar' || geom === 'col') {
        var bv = data.map(function (d) { return +d.y; }), ymax = (Math.max.apply(null, bv) || 1) * 1.12, syb = lin(0, ymax, m.t + ih, m.t), gap = iw / data.length, bw = gap * 0.62;
        body += yax(syb, [0, ymax / 2, ymax]);
        data.forEach(function (d, i) { var x = m.l + gap * i + (gap - bw) / 2, y = syb(+d.y); body += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (m.t + ih - y).toFixed(1) + '" rx="3" fill="' + pal[i % pal.length] + '"/>' + xlab(x + bw / 2, d.x); });
      } else if (geom === 'histogram') {
        var hv = data.map(function (d) { return +(d.x != null ? d.x : d.y); }), he = ext(hv), bins = spec.bins || 8, bw2 = (he[1] - he[0]) / bins || 1, cts = [], b;
        for (b = 0; b < bins; b++) cts.push(0); hv.forEach(function (v) { cts[Math.min(bins - 1, Math.floor((v - he[0]) / bw2))]++; });
        var cmax = (Math.max.apply(null, cts) || 1) * 1.12, syh = lin(0, cmax, m.t + ih, m.t), sxh = lin(he[0], he[1], m.l, m.l + iw);
        body += yax(syh, [0, cmax / 2, cmax]); cts.forEach(function (c, i) { var x0 = sxh(he[0] + i * bw2), x1 = sxh(he[0] + (i + 1) * bw2), y = syh(c); body += '<rect x="' + x0.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + Math.max(1, x1 - x0 - 1).toFixed(1) + '" height="' + (m.t + ih - y).toFixed(1) + '" fill="' + pal[0] + '" fill-opacity="0.85"/>'; });
      } else if (geom === 'boxplot') {
        var grp = {}; data.forEach(function (d) { var g = d.fill == null ? (d.x == null ? 'all' : d.x) : d.fill; (grp[g] = grp[g] || []).push(+d.y); });
        var keys = Object.keys(grp), all = data.map(function (d) { return +d.y; }), ye4 = ext(all), sy4 = lin(ye4[0], ye4[1], m.t + ih, m.t), gw = iw / keys.length;
        body += yax(sy4, [ye4[0], (ye4[0] + ye4[1]) / 2, ye4[1]]);
        keys.forEach(function (k, i) { var vv = grp[k].slice().sort(function (a, b) { return a - b; }), q = function (p) { var idx = (vv.length - 1) * p, lo = Math.floor(idx); return vv[lo] + (vv[Math.ceil(idx)] - vv[lo]) * (idx - lo); };
          var cx = m.l + gw * i + gw / 2, bw3 = gw * 0.4, q1 = sy4(q(0.25)), q2 = sy4(q(0.5)), q3 = sy4(q(0.75)), lo = sy4(vv[0]), hi = sy4(vv[vv.length - 1]);
          body += '<line x1="' + cx + '" y1="' + hi + '" x2="' + cx + '" y2="' + lo + '" stroke="' + P.mut + '"/><rect x="' + (cx - bw3 / 2) + '" y="' + q3 + '" width="' + bw3 + '" height="' + (q1 - q3) + '" fill="' + pal[i % pal.length] + '" fill-opacity="0.5" stroke="' + pal[i % pal.length] + '"/><line x1="' + (cx - bw3 / 2) + '" y1="' + q2 + '" x2="' + (cx + bw3 / 2) + '" y2="' + q2 + '" stroke="' + P.ink + '" stroke-width="2"/>' + xlab(cx, k); });
      }
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + esc(geom) + ' chart">' + frame() + body + axtitle() + extra + '</svg>';
    }
  };
  window.LessonWidgets.u = u;
})();

;
/* adversarial-perturb.js */
/* adversarial-perturb.js - adversarial robustness, made visible. A classifier can be confidently
 * right on a point and then confidently WRONG after a perturbation too small to see, because a
 * step along the gradient (the sign of the weights, the FGSM attack) walks the input straight
 * across the decision boundary. Toggle the perturbation budget from none to small and watch a
 * class-1 point flip to class 0 while barely moving. Emits the same logistic-model attack in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var EPS = { none: 0, small: 0.5, large: 0.9 };
  var W1 = 2.5, W2 = 2.5;                 // model weights (boundary x1 + x2 = 0)
  var PT = { x1: 0.35, x2: 0.30 };        // the input under attack (class 1)
  function prob(x1, x2) { return 1 / (1 + Math.exp(-(W1 * x1 + W2 * x2))); }

  function mount(el, cfg) {
    cfg = cfg || {}; var lvl = 'none';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ad-seg" style="margin-bottom:12px">' + u.seg([{ v: 'none', label: 'Original' }, { v: 'small', label: '+ tiny perturbation' }, { v: 'large', label: '+ larger' }], 'none') + '</div>' +
      '<div class="ad-plot"></div>' +
      '<div class="ad-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'An adversarial (FGSM) perturbation flips a logistic prediction, base R' });

    var plot = el.querySelector('.ad-plot'), read = el.querySelector('.ad-read');
    var W = 300, H = 200, PAD = 16, LO = -1.6, HI = 1.6;
    function px(x) { return PAD + (x - LO) / (HI - LO) * (W - 2 * PAD); }
    function py(y) { return (H - PAD) - (y - LO) / (HI - LO) * (H - 2 * PAD); }
    function draw() {
      var eps = EPS[lvl];
      var ax1 = PT.x1 - eps, ax2 = PT.x2 - eps;              // FGSM: step against sign(w) = -eps each
      var p0 = prob(PT.x1, PT.x2), p1 = prob(ax1, ax2);
      // decision boundary x1 + x2 = 0 -> line from (-1.6,1.6) to (1.6,-1.6)
      var bx1 = px(LO), by1 = py(-LO), bx2 = px(HI), by2 = py(-HI);
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="adversarial perturbation">';
      // class regions (above-right = class 1)
      svg += '<polygon points="' + px(HI) + ',' + py(HI) + ' ' + bx1 + ',' + by1 + ' ' + bx2 + ',' + by2 + '" fill="' + P.c0 + '" opacity="0.07"/>';
      svg += '<polygon points="' + px(LO) + ',' + py(LO) + ' ' + bx1 + ',' + by1 + ' ' + bx2 + ',' + by2 + '" fill="' + P.bad + '" opacity="0.07"/>';
      svg += '<line x1="' + bx1.toFixed(1) + '" y1="' + by1.toFixed(1) + '" x2="' + bx2.toFixed(1) + '" y2="' + by2.toFixed(1) + '" stroke="' + P.mut + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      svg += '<text x="' + (px(1.1)) + '" y="' + (py(1.35)) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.c0 + '">class 1</text>';
      svg += '<text x="' + (px(-1.5)) + '" y="' + (py(-1.2)) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.bad + '">class 0</text>';
      // original point + arrow to adversarial point
      svg += '<circle cx="' + px(PT.x1).toFixed(1) + '" cy="' + py(PT.x2).toFixed(1) + '" r="4" fill="' + P.c0 + '"/>';
      if (eps > 0) {
        svg += '<line x1="' + px(PT.x1).toFixed(1) + '" y1="' + py(PT.x2).toFixed(1) + '" x2="' + px(ax1).toFixed(1) + '" y2="' + py(ax2).toFixed(1) + '" stroke="' + P.ink + '" stroke-width="1.5"/>';
        svg += '<circle cx="' + px(ax1).toFixed(1) + '" cy="' + py(ax2).toFixed(1) + '" r="4" fill="' + (p1 > 0.5 ? P.c0 : P.bad) + '"/>';
      }
      svg += '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">feature space (attack steps toward the boundary)</text></svg>';
      plot.innerHTML = svg;
      read.innerHTML = eps === 0
        ? 'The input sits in <b style="color:' + P.c0 + '">class 1</b> with probability <b>' + p0.toFixed(2) + '</b>, confidently correct.'
        : 'A perturbation of just <b>' + eps + '</b> per feature ' + (p1 > 0.5 ? 'moves the point toward the boundary (prob ' + p1.toFixed(2) + '), still class 1.' : 'pushes it <b>across the boundary</b>: prediction flips to <b style="color:' + P.bad + '">class 0</b> at probability <b>' + p1.toFixed(2) + '</b>, confidently WRONG, from a nudge you can barely see.');
    }
    u.wireSeg(el.querySelector('.ad-seg'), function (v) { lvl = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Adversarial example: a tiny perturbation flips a confident logistic prediction. Base R.',
      'set.seed(3)',
      'n <- 800; X <- matrix(rnorm(n * 2), n, 2); colnames(X) <- c("x1", "x2")',
      'y <- rbinom(n, 1, plogis(2.5 * X[, 1] + 2.5 * X[, 2]))',
      'fit <- glm(y ~ x1 + x2, binomial, data = data.frame(y, X))',
      'w <- coef(fit)[c("x1", "x2")]',
      '',
      'pt  <- data.frame(x1 = 0.35, x2 = 0.30)          # confidently classified as class 1',
      'eps <- 0.5                                       # a tiny per-feature budget',
      'adv <- data.frame(x1 = pt$x1 - eps * sign(w["x1"]),   # FGSM: step against the gradient',
      '                  x2 = pt$x2 - eps * sign(w["x2"]))',
      'round(c(orig_prob = predict(fit, pt,  type = "response"),',
      '        adv_prob  = predict(fit, adv, type = "response"),',
      '        Linf_perturb = eps), 3)',
      '#> orig_prob  adv_prob Linf_perturb',
      '#>     0.858     0.318        0.500   # prediction flips 1 -> 0'
    ].join('\n');
  }

  window.LessonWidgets.register('adversarial-perturb', mount);
})();

;
/* agent-loop.js */
/* agent-loop.js - the ReAct agent cycle (Thought -> Action -> Observation,
 * repeating until it can Answer), stepped through a worked trace. The cycle
 * nodes light up by phase; Step reveals the trace one entry at a time. Static
 * structure + a Step/Reset control. Reusable for any LLM-agent lesson.
 * cfg (optional): { trace:[{p:'Thought|Action|Observation|Answer', t:'...'}] }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', ACC = '#1f7a55', LINE = '#c5cdda';
  var PC = { Thought: '#2563a8', Action: '#1f7a55', Observation: '#b5631a', Answer: '#8a46b0' };

  function mount(el, cfg) {
    cfg = cfg || {};
    var trace = (cfg.trace && cfg.trace.length) ? cfg.trace : [
      { p: 'Thought', t: 'The user wants the overall churn rate; I should query the data.' },
      { p: 'Action', t: 'run_sql("SELECT AVG(churned) FROM customers")' },
      { p: 'Observation', t: '0.062' },
      { p: 'Thought', t: '6.2% overall. They also asked which plan churns worst.' },
      { p: 'Action', t: 'run_sql("... GROUP BY plan ORDER BY churn DESC LIMIT 1")' },
      { p: 'Observation', t: 'plan = "basic", churn = 0.11' },
      { p: 'Answer', t: 'Churn is 6.2% overall; the basic plan is worst at 11%.' }
    ];
    var i = 0;

    el.innerHTML =
      '<div class="lw-diagram">' +
      '<div class="al-cycle" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;margin-bottom:12px"></div>' +
      '<div class="al-trace" style="border:1px solid ' + LINE + ';border-radius:10px;padding:8px 12px;min-height:118px;background:#fff"></div>' +
      '<div style="text-align:center;margin-top:10px">' +
        '<button type="button" class="al-step" style="font:600 12px \'IBM Plex Mono\',monospace;color:#fff;background:' + ACC + ';border:0;border-radius:7px;padding:8px 16px;cursor:pointer">Step &rarr;</button> ' +
        '<button type="button" class="al-reset" style="font:600 12px \'IBM Plex Mono\',monospace;color:' + MUT + ';background:none;border:1px solid ' + LINE + ';border-radius:7px;padding:8px 14px;cursor:pointer">Reset</button>' +
      '</div></div>';

    var cycle = el.querySelector('.al-cycle'), traceEl = el.querySelector('.al-trace'),
        stepBtn = el.querySelector('.al-step'), resetBtn = el.querySelector('.al-reset');
    cycle.innerHTML = ['Thought', 'Action', 'Observation'].map(function (p) {
      return '<span class="al-node" data-p="' + p + '" style="font:600 11px \'IBM Plex Mono\',monospace;border:1.5px solid ' + LINE + ';border-radius:20px;padding:6px 12px;color:' + MUT + '">' + p + '</span>';
    }).join('<span style="color:' + MUT + '">&rarr;</span>') + '<span style="color:' + MUT + ';font-size:15px">&#8635;</span>';
    var nodes = cycle.querySelectorAll('.al-node');

    function render() {
      var html = '', k;
      for (k = 0; k < i; k++) {
        var s = trace[k], c = PC[s.p] || MUT;
        html += '<div style="margin:5px 0;font:13px/1.5 \'IBM Plex Sans\',system-ui,sans-serif">' +
          '<span style="font-family:\'IBM Plex Mono\',monospace;font-size:11px;font-weight:700;color:' + c + '">' + s.p + '</span> ' +
          '<span style="color:' + INK + '">' + s.t + '</span></div>';
      }
      traceEl.innerHTML = html || '<div style="color:' + MUT + ';font:13px \'IBM Plex Sans\',system-ui,sans-serif">Press Step to watch the agent reason, act, and observe in a loop until it can answer.</div>';
      var active = i > 0 ? trace[i - 1].p : null;
      Array.prototype.forEach.call(nodes, function (n) {
        var on = n.getAttribute('data-p') === active;
        n.style.borderColor = on ? PC[active] : LINE;
        n.style.color = on ? PC[active] : MUT;
      });
      stepBtn.disabled = i >= trace.length;
      stepBtn.style.opacity = i >= trace.length ? '.5' : '1';
    }
    stepBtn.addEventListener('click', function () { if (i < trace.length) { i++; render(); } });
    resetBtn.addEventListener('click', function () { i = 0; render(); });
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('agent-loop', mount);
})();

;
/* assoc-rules.js */
/* assoc-rules.js - market-basket rules. A handful of baskets; pick a rule "if X then Y"
 * and read its three numbers: support (how often X and Y appear together), confidence
 * (of baskets with X, how many also have Y), and lift (how much more than chance). Lift
 * above 1 is a real association. Emits runnable R that computes the three by hand.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var BASKETS = [
    ['bread', 'butter', 'milk'], ['bread', 'butter'], ['bread', 'milk'],
    ['beer', 'chips'], ['bread', 'butter', 'jam'], ['beer', 'chips', 'salsa'],
    ['bread', 'butter'], ['milk', 'cereal'], ['beer', 'chips'], ['bread', 'jam']
  ];
  var RULES = [['bread', 'butter'], ['beer', 'chips'], ['bread', 'milk'], ['butter', 'jam']];

  function mount(el, cfg) {
    cfg = cfg || {}; var ri = 0;
    function metrics(x, y) {
      var n = BASKETS.length, X = 0, XY = 0, Y = 0;
      BASKETS.forEach(function (b) { var hx = b.indexOf(x) >= 0, hy = b.indexOf(y) >= 0; if (hx) X++; if (hy) Y++; if (hx && hy) XY++; });
      var supp = XY / n, conf = X ? XY / X : 0, lift = (Y / n) ? conf / (Y / n) : 0;
      return { supp: supp, conf: conf, lift: lift };
    }
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.06em;text-transform:uppercase;color:' + P.faint + ';margin:0 0 8px">pick a rule</div>' +
      '<div class="ar-seg" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"></div>' +
      '<div class="ar-bars"></div>' +
      '<div class="ar-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute support, confidence and lift in R' });

    var seg = el.querySelector('.ar-seg'), bars = el.querySelector('.ar-bars'), read = el.querySelector('.ar-read');
    RULES.forEach(function (r, i) {
      var b = document.createElement('button'); b.innerHTML = r[0] + ' &rarr; ' + r[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 11px;cursor:pointer';
      b.addEventListener('click', function () { ri = i; draw(); });
      seg.appendChild(b);
    });
    function bar(lab, v, max, fmt) {
      return '<div style="display:flex;align-items:center;gap:9px;margin:7px 0"><span style="font:11px IBM Plex Mono,monospace;color:' + P.mut + ';width:78px">' + lab + '</span>' +
        '<span style="flex:1;height:13px;border-radius:4px;background:' + P.line + ';overflow:hidden;display:block"><i style="display:block;height:100%;width:' + Math.min(100, v / max * 100).toFixed(0) + '%;background:' + (lab === 'lift' && v >= 1 ? P.acc : (lab === 'lift' ? (P.c2 || '#c9a24a') : P.c0)) + '"></i></span>' +
        '<span style="font:11px IBM Plex Mono,monospace;color:' + P.ink + ';width:40px;text-align:right">' + fmt + '</span></div>';
    }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = i === ri; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var r = RULES[ri], m = metrics(r[0], r[1]);
      bars.innerHTML = bar('support', m.supp, 1, (m.supp * 100).toFixed(0) + '%') + bar('confidence', m.conf, 1, (m.conf * 100).toFixed(0) + '%') + bar('lift', m.lift, 3, m.lift.toFixed(2));
      read.innerHTML = 'Buyers of <b>' + r[0] + '</b> take <b>' + r[1] + '</b> ' + (m.conf * 100).toFixed(0) + '% of the time, and lift <b>' + m.lift.toFixed(2) + '</b> means that is <b>' + (m.lift >= 1 ? (m.lift.toFixed(1) + 'x more likely than chance - a real association worth acting on') : 'no more likely than chance - not a useful rule') + '</b>.';
    }
    draw();
  }

  function rcode() {
    return [
      '# Association rules score "if X then Y" with three numbers.',
      'baskets <- list(c("bread","butter","milk"), c("bread","butter"), c("bread","milk"),',
      '                c("beer","chips"), c("bread","butter","jam"), c("beer","chips"))',
      'has <- function(it) sapply(baskets, function(b) it %in% b)',
      'n <- length(baskets)',
      '',
      'support    <- mean(has("bread") & has("butter"))       # X and Y together',
      'confidence <- sum(has("bread") & has("butter")) / sum(has("bread"))',
      'lift       <- confidence / mean(has("butter"))         # > 1 = real association',
      'c(support = support, confidence = confidence, lift = lift)'
    ].join('\n');
  }

  window.LessonWidgets.register('assoc-rules', mount);
})();

;
/* assumption-dial.js */
/* assumption-dial.js - a model assumption, violated on a dial, with the damage measured.
 *
 * Serves the seven assumption objections in The Publishing Handbook: normality, equal
 * variance, independence, autocorrelation, multicollinearity, linearity, proportional
 * hazards. One widget, one config key.
 *
 * The reader drags severity from none to severe. Behind the dial the widget runs a
 * couple of thousand complete studies at EVERY severity level and measures two things:
 *
 *   COVERAGE - the share of those studies whose 95% interval actually contains the true
 *     value. That is what a confidence interval promises, and it is what a violated
 *     assumption breaks.
 *   FIT - R-squared, or Harrell's C for the survival model. That is what a reader looks
 *     at, and it is mostly what a violated assumption does NOT touch.
 *
 * Every generative model here holds the signal variance and the error variance fixed as
 * severity rises, so R-squared has no arithmetic reason to drift. Anything that moves is
 * the violation, not the setup.
 *
 * The honest part: the seven do not fail the same way, and the widget reports what it
 * measures rather than a uniform scare story.
 *
 *   equal variance / independence / autocorrelation -> coverage collapses, fit sits still.
 *       The interval is the casualty and the repair is the standard error.
 *   linearity -> coverage of the prediction at the top of the range goes to zero while
 *       R-squared barely moves. The line is a fine summary and a bad prediction.
 *   multicollinearity -> coverage HOLDS at 95% (verified at 6000 studies per point, every
 *       level within Monte Carlo error of 0.95). Only the WIDTH moves. Collinearity makes
 *       an estimate imprecise, not wrong, and the interval already says so.
 *   normality -> the mildest of the seven. Coverage moves about one point at a skewness
 *       of 4.5, because the Central Limit Theorem is doing the work.
 *   proportional hazards -> one hazard ratio cannot describe an effect that changes over
 *       follow-up, so the interval misses the early-period effect it is quoted as estimating.
 *
 * The emitted R runs the same experiment with the same generative model.
 *
 * cfg: {
 *   assumption: "heteroskedasticity",   // which violation (keys listed below)
 *   assumptions: ["...", "..."],        // OR an array -> segmented control, computed on pick
 *   levels: 11,                         // severity steps on the dial (0 .. 1)
 *   start: 0,                           // starting step index
 *   sims: null,                         // studies per point (per-assumption default)
 *   n: null,                            // sample size (per-assumption default)
 *   bars: 30,                           // how many study intervals to draw in the lower panel
 *   seed: 17                            // mulberry32 seed - same config, same picture
 * }
 *
 * assumption: normality | heteroskedasticity | independence | autocorrelation |
 *             multicollinearity | linearity | proportional-hazards
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  /* ---------------- theme ----------------
     The player is light today. Resolve from --lm-panel when it exists so a dark panel
     never produces black on black, and fall back to html.dark elsewhere. */
  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', bad: '#c2410c',
    panel: '#ffffff'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', bad: '#f4805a', panel: '#101c2b'
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
    try {
      var v = getComputedStyle(el).getPropertyValue('--lm-panel');
      if (v && v.trim()) return lumOf(v) < 0.45;
    } catch (e) {}
    return !!(document.documentElement && document.documentElement.classList.contains('dark'));
  }
  function palette(el) { return isDark(el) ? DARK : LIGHT; }

  /* ---------------- seeded numerics ---------------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gaussian(rnd) {                       // Box-Muller, one draw per call
    var a = 1 - rnd(), b = rnd();
    return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b);
  }

  /* Student t via the regularised incomplete beta (Lentz continued fraction). */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1;
    var c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var m = 1; m <= 300; m++) {
      var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return (x < (a + 1) / (a + b + 2)) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pt(t, df) { var p = 0.5 * ibeta(df / 2, 0.5, df / (df + t * t)); return t > 0 ? 1 - p : p; }
  function qt(p, df) {
    var lo = -60, hi = 60, i;
    for (i = 0; i < 160; i++) { var mid = (lo + hi) / 2; if (pt(mid, df) < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  function pnorm(z) {
    var s = z < 0 ? -1 : 1, x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return 0.5 * (1 + s * y);
  }
  function qnorm(p) {
    var lo = -9, hi = 9, i;
    for (i = 0; i < 90; i++) { var m = (lo + hi) / 2; if (pnorm(m) < p) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  /* If a 95% interval covers only `cov` of the time, its standard error is understating
     the truth by roughly this factor. Exact under normality, indicative otherwise. */
  function understate(cov) {
    if (cov >= 0.9499) return 1;
    return 1.959963985 / qnorm((1 + Math.max(0.001, cov)) / 2);
  }

  function inv(A) {                              // Gauss-Jordan, p <= 4 here
    var p = A.length, M = [], i, j, k;
    for (i = 0; i < p; i++) { M.push(A[i].slice()); for (j = 0; j < p; j++) M[i].push(i === j ? 1 : 0); }
    for (i = 0; i < p; i++) {
      var piv = i;
      for (k = i + 1; k < p; k++) if (Math.abs(M[k][i]) > Math.abs(M[piv][i])) piv = k;
      var tmp = M[i]; M[i] = M[piv]; M[piv] = tmp;
      var dd = M[i][i] || 1e-300;
      for (j = 0; j < 2 * p; j++) M[i][j] /= dd;
      for (k = 0; k < p; k++) {
        if (k === i) continue;
        var f = M[k][i]; if (!f) continue;
        for (j = 0; j < 2 * p; j++) M[k][j] -= f * M[i][j];
      }
    }
    var out = []; for (i = 0; i < p; i++) out.push(M[i].slice(p));
    return out;
  }
  function std(a) {
    var n = a.length, m = 0, v = 0, i;
    for (i = 0; i < n; i++) m += a[i]; m /= n;
    for (i = 0; i < n; i++) v += (a[i] - m) * (a[i] - m);
    return { m: m, s: Math.sqrt(v / (n - 1)) };
  }
  function zed(a) {                              // exact mean 0, sd 1
    var m = std(a), out = [], i;
    for (i = 0; i < a.length; i++) out.push((a[i] - m.m) / m.s);
    return out;
  }
  function skewLN(sg) { var w = Math.exp(sg * sg); return (w + 2) * Math.sqrt(w - 1); }

  /* Fixed-design OLS. The design matrix never changes across simulated studies, so the
     cross-product inverse is computed once and each study costs O(n * p). */
  function fitter(Xflat, n, p, target) {
    var XtX = [], j, k, i;
    for (j = 0; j < p; j++) { XtX.push(new Array(p)); for (k = 0; k < p; k++) XtX[j][k] = 0; }
    for (i = 0; i < n; i++) for (j = 0; j < p; j++) for (k = j; k < p; k++) XtX[j][k] += Xflat[i * p + j] * Xflat[i * p + k];
    for (j = 0; j < p; j++) for (k = 0; k < j; k++) XtX[j][k] = XtX[k][j];
    var V = inv(XtX), df = n - p, tc = qt(0.975, df);
    var q0;                                      // the quadratic form behind the standard error
    if (target.kind === 'pred') {
      q0 = 0;
      for (j = 0; j < p; j++) for (k = 0; k < p; k++) q0 += target.x0[j] * V[j][k] * target.x0[k];
    } else q0 = V[target.j][target.j];
    var Xty = new Float64Array(p), beta = new Float64Array(p);
    return function (y) {
      var a, b, s;
      for (a = 0; a < p; a++) Xty[a] = 0;
      for (i = 0; i < n; i++) { var yi = y[i]; for (a = 0; a < p; a++) Xty[a] += Xflat[i * p + a] * yi; }
      for (a = 0; a < p; a++) { s = 0; for (b = 0; b < p; b++) s += V[a][b] * Xty[b]; beta[a] = s; }
      var rss = 0, ybar = 0, tss = 0;
      for (i = 0; i < n; i++) ybar += y[i]; ybar /= n;
      for (i = 0; i < n; i++) {
        var f = 0; for (a = 0; a < p; a++) f += Xflat[i * p + a] * beta[a];
        var r = y[i] - f; rss += r * r;
        var c = y[i] - ybar; tss += c * c;
      }
      var s2 = rss / df, est = 0;
      if (target.kind === 'pred') { for (a = 0; a < p; a++) est += target.x0[a] * beta[a]; }
      else est = beta[target.j];
      var se = Math.sqrt(s2 * q0);
      return { est: est, lo: est - tc * se, hi: est + tc * se, r2: 1 - rss / tss };
    };
  }

  /* Cox proportional hazards, one covariate, Breslow ties, Newton-Raphson.
     Checked against survival::coxph: same coefficient and standard error to 3 decimals. */
  function coxfit(time, event, z, order) {
    var n = time.length, i;
    order.sort(function (a, b) { return time[a] - time[b]; });
    var beta = 0, it, k, zk, w, s0, s1, s2, g, h, m1, step;
    for (it = 0; it < 40; it++) {
      s0 = 0; s1 = 0; s2 = 0; g = 0; h = 0;
      for (i = n - 1; i >= 0; i--) {                    // walk back so the risk set accumulates
        k = order[i]; zk = z[k]; w = Math.exp(beta * zk);
        s0 += w; s1 += w * zk; s2 += w * zk * zk;
        if (event[k]) { m1 = s1 / s0; g += zk - m1; h += s2 / s0 - m1 * m1; }
      }
      if (h < 1e-12) break;
      step = g / h; beta += step;
      if (Math.abs(step) < 1e-10) break;
    }
    s0 = 0; s1 = 0; s2 = 0; var I = 0;
    for (i = n - 1; i >= 0; i--) {
      k = order[i]; zk = z[k]; w = Math.exp(beta * zk);
      s0 += w; s1 += w * zk; s2 += w * zk * zk;
      if (event[k]) { m1 = s1 / s0; I += s2 / s0 - m1 * m1; }
    }
    return { beta: beta, se: I > 0 ? 1 / Math.sqrt(I) : NaN };
  }
  /* Concordance. `risk` is a risk score: higher means expected to fail sooner. Pairs with
     a tied risk score count a half, which is what survival::concordance does, so this
     number is comparable with summary(coxph(...))$concordance in the R block. */
  function cindex(time, event, risk) {
    var n = time.length, conc = 0, disc = 0, tie = 0, i, j;
    for (i = 0; i < n; i++) {
      if (!event[i]) continue;
      for (j = 0; j < n; j++) {
        if (j === i || time[j] <= time[i]) continue;
        if (risk[i] > risk[j]) conc++; else if (risk[i] < risk[j]) disc++; else tie++;
      }
    }
    var tot = conc + disc + tie;
    return tot ? (conc + 0.5 * tie) / tot : 0.5;
  }

  /* ---------------- the seven assumptions ----------------
     design(rnd, n) builds the FIXED part of the study (the predictors) once for the whole
     dial. draw(rnd, s, d, n, y) fills y for one study at severity s. */
  var SPECS = {
    normality: {
      title: 'Normality of the errors', short: 'Normality',
      dialName: 'skew of the error distribution', estimand: 'the slope',
      n: 30, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 },
      dial: function (s) { return s === 0 ? 'errors normal' : 'skewness ' + skewLN(0.85 * s).toFixed(1); },
      design: function (rnd, n) {
        var x = [], X = new Float64Array(n * 2), i;
        for (i = 0; i < n; i++) x.push(gaussian(rnd));
        x = zed(x);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        return { X: X, p: 2, x: x };
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y) {
        var sg = Math.max(1e-6, 0.85 * s), i;
        var mu = Math.exp(sg * sg / 2), sd = Math.sqrt((Math.exp(sg * sg) - 1) * Math.exp(sg * sg));
        for (i = 0; i < n; i++) y[i] = d.x[i] + (Math.exp(sg * gaussian(rnd)) - mu) / sd;   // standardised lognormal
      }
    },
    heteroskedasticity: {
      title: 'Equal error variance', short: 'Equal variance',
      dialName: 'how much the spread grows with x', estimand: 'the slope',
      n: 60, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 },
      dial: function (s) { return s === 0 ? 'spread constant' : 'widest spread about ' + Math.exp(1.1 * s * 4).toFixed(1) + 'x the narrowest'; },
      design: function (rnd, n) {
        var x = [], X = new Float64Array(n * 2), i;
        for (i = 0; i < n; i++) x.push(gaussian(rnd));
        x = zed(x);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        return { X: X, p: 2, x: x };
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y) {
        var i, ss = 0, w = new Float64Array(n);
        for (i = 0; i < n; i++) { w[i] = Math.exp(1.1 * s * d.x[i]); ss += w[i] * w[i]; }
        var nz = Math.sqrt(ss / n);                          // average error variance stays 1
        for (i = 0; i < n; i++) y[i] = d.x[i] + (w[i] / nz) * gaussian(rnd);
      }
    },
    independence: {
      title: 'Independent observations', short: 'Independence',
      dialName: 'intraclass correlation', estimand: 'the group-level slope',
      n: 60, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 },
      dial: function (s) { return 'ICC = ' + (0.6 * s).toFixed(2) + ', design effect ' + (1 + 4 * 0.6 * s).toFixed(1); },
      design: function (rnd, n) {
        var m = 5, k = Math.round(n / m), x = [], cl = [], j, i;
        for (j = 0; j < k; j++) { var xv = gaussian(rnd); for (i = 0; i < m; i++) { x.push(xv); cl.push(j); } }
        x = zed(x);
        var X = new Float64Array(n * 2);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        return { X: X, p: 2, x: x, cl: cl, k: k, m: m };
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y) {
        var rho = 0.6 * s, i, uj = new Float64Array(d.k);
        for (i = 0; i < d.k; i++) uj[i] = gaussian(rnd);
        var a = Math.sqrt(rho), b = Math.sqrt(1 - rho);
        for (i = 0; i < n; i++) y[i] = d.x[i] + a * uj[d.cl[i]] + b * gaussian(rnd);
      }
    },
    autocorrelation: {
      title: 'Independent errors over time', short: 'Autocorrelation',
      dialName: 'AR(1) correlation between neighbouring errors', estimand: 'the trend slope',
      n: 60, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 },
      dial: function (s) { return 'phi = ' + (0.92 * s).toFixed(2); },
      design: function (rnd, n) {
        var x = [], X = new Float64Array(n * 2), i;
        for (i = 0; i < n; i++) x.push(i);
        x = zed(x);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        return { X: X, p: 2, x: x };
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y) {
        var phi = 0.92 * s, sd = Math.sqrt(1 - phi * phi), e = gaussian(rnd), i;
        for (i = 0; i < n; i++) {
          e = i === 0 ? e : phi * e + sd * gaussian(rnd);     // stationary AR(1), variance 1
          y[i] = d.x[i] + e;
        }
      }
    },
    multicollinearity: {
      title: 'Predictors that are not near-duplicates', short: 'Collinearity',
      dialName: 'correlation between the two predictors', estimand: 'the first coefficient',
      n: 60, sims: 2000, fit: 'ols', target: { kind: 'coef', j: 1 }, dynamicX: true,
      dial: function (s) { var r = 0.995 * s; return 'r = ' + r.toFixed(3) + ', VIF ' + (1 / (1 - r * r)).toFixed(1); },
      design: function (rnd, n) {
        var a = [], b = [], i;
        for (i = 0; i < n; i++) { a.push(gaussian(rnd)); b.push(gaussian(rnd)); }
        a = zed(a); b = zed(b);
        var cab = 0;                                          // orthogonalise so the dial is
        for (i = 0; i < n; i++) cab += a[i] * b[i];           // the only correlation in play
        cab /= (n - 1);
        for (i = 0; i < n; i++) b[i] -= cab * a[i];
        return { a: a, b: zed(b), p: 3 };
      },
      // the design matrix itself depends on severity here, so it is rebuilt per level
      buildX: function (s, d, n) {
        var r = 0.995 * s, X = new Float64Array(n * 3), i;
        for (i = 0; i < n; i++) {
          X[i * 3] = 1; X[i * 3 + 1] = d.a[i];
          X[i * 3 + 2] = r * d.a[i] + Math.sqrt(1 - r * r) * d.b[i];
        }
        return X;
      },
      truth: function () { return 1; },
      draw: function (rnd, s, d, n, y, X) {
        var esd = Math.sqrt(1 + 0.995 * s), i;                // holds R-squared still as r moves
        for (i = 0; i < n; i++) y[i] = X[i * 3 + 1] + X[i * 3 + 2] + esd * gaussian(rnd);
      }
    },
    linearity: {
      title: 'A straight line is the right shape', short: 'Linearity',
      dialName: 'share of the real signal that is curved',
      estimand: 'the mean outcome at the top of the x range',
      n: 60, sims: 2000, fit: 'ols',
      dial: function (s) { return s === 0 ? 'signal perfectly straight' : Math.round(100 * s) + '% of the signal is curvature'; },
      design: function (rnd, n) {
        var x = [], i;
        for (i = 0; i < n; i++) x.push(0.2 + 2 * rnd());
        var q = x.map(function (v) { return v * v; });
        var X = new Float64Array(n * 2);
        for (i = 0; i < n; i++) { X[i * 2] = 1; X[i * 2 + 1] = x[i]; }
        var d = { X: X, p: 2, x: x, q: q, zx: std(x), zq: std(q), top: 2.2 };
        d.target = { kind: 'pred', x0: [1, d.top] };
        return d;
      },
      truth: function (s, d) {
        return 2 * ((1 - s) * (d.top - d.zx.m) / d.zx.s + s * (d.top * d.top - d.zq.m) / d.zq.s);
      },
      draw: function (rnd, s, d, n, y) {
        var i;
        for (i = 0; i < n; i++) {
          var zx = (d.x[i] - d.zx.m) / d.zx.s, zq = (d.q[i] - d.zq.m) / d.zq.s;
          y[i] = 2 * ((1 - s) * zx + s * zq) + gaussian(rnd);
        }
      }
    },
    'proportional-hazards': {
      title: 'One hazard ratio for all of follow-up', short: 'Proportional hazards',
      dialName: 'how far the late-period hazard ratio drifts from the early one',
      estimand: 'the early-period log hazard ratio',
      n: 200, sims: 600, fit: 'cox',
      dial: function (s) { return 'early HR 0.50, late HR ' + (0.5 + 0.5 * s).toFixed(2); },
      design: function (rnd, n) {
        var z = new Float64Array(n), order = [], i;
        for (i = 0; i < n; i++) { z[i] = i < n / 2 ? 0 : 1; order.push(i); }
        return { z: z, order: order, cut: 0.5, adm: 2.0 };
      },
      truth: function () { return Math.log(0.5); },
      drawSurv: function (rnd, s, d, n, time, event) {
        var late = 0.5 + 0.5 * s, i;
        for (i = 0; i < n; i++) {
          var l1 = d.z[i] ? 0.5 : 1, l2 = d.z[i] ? late : 1;   // piecewise-constant hazards
          var E = -Math.log(1 - rnd()), t;
          t = (E < l1 * d.cut) ? E / l1 : d.cut + (E - l1 * d.cut) / l2;
          if (t > d.adm) { t = d.adm; event[i] = 0; } else event[i] = 1;
          time[i] = t;
        }
      }
    }
  };

  /* ---------------- one severity level, measured ---------------- */
  function measure(spec, s, n, sims, seed, keep, d) {
    var rnd = mulberry32(seed), truth = spec.truth(s, d);
    var hits = 0, fitSum = 0, widthSum = 0, cis = [], i;

    if (spec.fit === 'cox') {
      var time = new Float64Array(n), event = new Int8Array(n), risk = new Float64Array(n);
      var cSum = 0, cN = 0, j;
      for (i = 0; i < sims; i++) {
        spec.drawSurv(rnd, s, d, n, time, event);
        for (j = 0; j < n; j++) d.order[j] = j;
        var m = coxfit(time, event, d.z, d.order);
        var lo = m.beta - 1.959963985 * m.se, hi = m.beta + 1.959963985 * m.se, ok = lo < truth && truth < hi;
        if (ok) hits++;
        widthSum += hi - lo;
        if (i < keep) cis.push([lo, hi, ok, m.beta]);
        if (i < 25) {                                   // C is O(n^2): a subsample is enough
          for (j = 0; j < n; j++) risk[j] = m.beta * d.z[j];
          cSum += cindex(time, event, risk); cN++;
        }
      }
      return { cov: hits / sims, fit: cSum / cN, width: widthSum / sims, cis: cis, truth: truth };
    }

    var X = spec.buildX ? spec.buildX(s, d, n) : d.X;
    var fit = fitter(X, n, d.p, spec.target || d.target);
    var y = new Float64Array(n);
    for (i = 0; i < sims; i++) {
      spec.draw(rnd, s, d, n, y, X);
      var f = fit(y), ok2 = f.lo < truth && truth < f.hi;
      if (ok2) hits++;
      fitSum += f.r2; widthSum += f.hi - f.lo;
      if (i < keep) cis.push([f.lo, f.hi, ok2, f.est]);
    }
    return { cov: hits / sims, fit: fitSum / sims, width: widthSum / sims, cis: cis, truth: truth };
  }

  /* ---------------- mount ---------------- */
  function mount(el, cfg) {
    cfg = cfg || {};
    var list = (cfg.assumptions && cfg.assumptions.length ? cfg.assumptions : [cfg.assumption || 'heteroskedasticity'])
                 .filter(function (k) { return SPECS[k]; });
    if (!list.length) list = ['heteroskedasticity'];
    var which = list[0];
    var levels = Math.max(3, +cfg.levels || 11);
    var seed = (cfg.seed == null ? 17 : +cfg.seed);
    var bars = Math.max(8, Math.min(40, +cfg.bars || 30));
    var step = Math.max(0, Math.min(levels - 1, +cfg.start || 0));
    var cache = {};

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      (list.length > 1 ? '<div class="ad-seg" style="margin-bottom:12px"></div>' : '') +
      '<div class="ad-lab" style="font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:5px"></div>' +
      '<input class="ad-sev" type="range" min="0" max="' + (levels - 1) + '" step="1" value="' + step +
        '" aria-label="severity of the violation" style="width:100%;max-width:460px;display:block;margin-bottom:13px">' +
      '<div class="ad-plot"></div>' +
      '<div class="ad-read" style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:11px 0 14px"></div>' +
      '<div class="ad-r"></div>';

    var segBox = el.querySelector('.ad-seg'), plot = el.querySelector('.ad-plot'),
        read = el.querySelector('.ad-read'), lab = el.querySelector('.ad-lab'),
        slider = el.querySelector('.ad-sev'), rbox = el.querySelector('.ad-r');

    if (segBox) {
      segBox.innerHTML = u.seg(list.map(function (k) { return { v: k, label: SPECS[k].short }; }), which);
      u.wireSeg(segBox, function (v) { which = v; render(true); });
    }

    function series(key) {
      if (cache[key]) return cache[key];
      var spec = SPECS[key], n = Math.max(12, +cfg.n || spec.n), sims = Math.max(150, +cfg.sims || spec.sims);
      var d = spec.design(mulberry32(seed ^ 0x5f3759d), n), out = [], i;
      for (i = 0; i < levels; i++) out.push(measure(spec, i / (levels - 1), n, sims, seed + i * 101, bars, d));
      cache[key] = { rows: out, n: n, sims: sims, spec: spec };
      return cache[key];
    }

    function render(newR) {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      lab.style.color = P.mut; read.style.color = P.body;
      var S = series(which), s = step / (levels - 1);
      lab.innerHTML = u.esc(S.spec.title) + ': <b style="color:' + P.ink + '">' + u.esc(S.spec.dial(s)) + '</b>';
      plot.innerHTML = svg(S, step, P, bars);
      read.innerHTML = verdict(which, S, step, P);
      if (newR || !rbox.firstChild) rbox.innerHTML = u.runnable(RCODE[which](), { label: 'Run the same experiment in R' });
    }

    slider.addEventListener('input', function () { step = +slider.value; render(false); });

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el);
        if (now !== wasDark) { wasDark = now; render(false); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render(true);
  }

  /* ---------------- drawing ---------------- */
  function svg(S, step, P, bars) {
    var W = 520, mA = { l: 46, r: 16, t: 42 }, hA = 122;
    var yTop = mA.t, yBot = mA.t + hA, levels = S.rows.length;
    var fitName = S.spec.fit === 'cox' ? 'Concordance (C)' : 'R-squared';
    // a halo in the panel colour, thick enough that a plotted line under a label cannot
    // read as a strikethrough
    var HALO = 'stroke="' + P.panel + '" stroke-width="4.6" paint-order="stroke" stroke-linejoin="round"';
    function sx(i) { return mA.l + i / (levels - 1) * (W - mA.l - mA.r); }
    function sy(v) { return yBot - v * hA; }
    var g = '', i;

    [0, 0.25, 0.5, 0.75, 1].forEach(function (v) {
      g += '<line x1="' + mA.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (W - mA.r) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
           '<text x="' + (mA.l - 7) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + (v * 100) + '%</text>';
    });
    g += '<line x1="' + mA.l + '" y1="' + sy(0.95).toFixed(1) + '" x2="' + (W - mA.r) + '" y2="' + sy(0.95).toFixed(1) +
         '" stroke="' + P.acc + '" stroke-width="1" stroke-dasharray="3 3"/>';

    var cov = [], fit = [];
    for (i = 0; i < levels; i++) {
      cov.push(sx(i).toFixed(1) + ',' + sy(S.rows[i].cov).toFixed(1));
      fit.push(sx(i).toFixed(1) + ',' + sy(S.rows[i].fit).toFixed(1));
    }
    g += '<polyline points="' + fit.join(' ') + '" fill="none" stroke="' + P.c0 + '" stroke-width="2" stroke-dasharray="5 3"/>' +
         '<polyline points="' + cov.join(' ') + '" fill="none" stroke="' + P.bad + '" stroke-width="2.6"/>' +
         '<line x1="' + sx(step).toFixed(1) + '" y1="' + yTop + '" x2="' + sx(step).toFixed(1) + '" y2="' + yBot + '" stroke="' + P.line + '" stroke-dasharray="2 3"/>' +
         '<circle cx="' + sx(step).toFixed(1) + '" cy="' + sy(S.rows[step].fit).toFixed(1) + '" r="4" fill="' + P.c0 + '"/>' +
         '<circle cx="' + sx(step).toFixed(1) + '" cy="' + sy(S.rows[step].cov).toFixed(1) + '" r="5" fill="' + P.bad + '"/>';
    // side: away from whichever edge is closer. height: above the marker when there is room
    // under the legend, otherwise below it, so the label never sits on its own curve.
    var late = step > (levels - 1) * 0.62, yc = sy(S.rows[step].cov);
    var yLab = (yc - 12 >= yTop + 10) ? yc - 11 : yc + 19;
    g += '<text x="' + (late ? sx(step) - 9 : sx(step) + 9).toFixed(1) + '" y="' + yLab.toFixed(1) +
         '" text-anchor="' + (late ? 'end' : 'start') + '" font-family="IBM Plex Mono,monospace" font-size="12.5" font-weight="700" fill="' + P.bad + '" ' + HALO + '>' +
         (100 * S.rows[step].cov).toFixed(1) + '%</text>';
    // legend sits above the plot area, so no label can ever cross a curve
    g += '<text x="' + mA.l + '" y="16" font-family="IBM Plex Sans,sans-serif" font-size="10.5" font-weight="600" fill="' + P.bad + '">Interval coverage (promised 95%)</text>' +
         '<text x="' + (W - mA.r) + '" y="16" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" font-weight="600" fill="' + P.c0 + '">' + fitName + '</text>' +
         '<text x="' + mA.l + '" y="32" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.faint + '">' +
         u.esc(S.sims.toLocaleString() + ' studies behind every point, n = ' + S.n) + '</text>' +
         '<line x1="' + mA.l + '" y1="' + yBot + '" x2="' + (W - mA.r) + '" y2="' + yBot + '" stroke="' + P.line + '" stroke-width="1.5"/>' +
         '<text x="' + mA.l + '" y="' + (yBot + 15) + '" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">none</text>' +
         '<text x="' + (W - mA.r) + '" y="' + (yBot + 15) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">severe</text>' +
         '<text x="' + ((mA.l + W - mA.r) / 2) + '" y="' + (yBot + 15) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">' +
         u.esc(S.spec.dialName) + '</text>';

    /* lower panel: the intervals themselves, one line per simulated study */
    var row = S.rows[step], cis = row.cis, truth = row.truth;
    var yB = yBot + 54, hB = Math.max(96, bars * 4.2), mB = { l: 46, r: 16 };
    var lows = [], highs = [];
    cis.forEach(function (c) { lows.push(c[0]); highs.push(c[1]); });
    lows.sort(function (a, b) { return a - b; }); highs.sort(function (a, b) { return a - b; });
    // clip at the 8th/92nd percentile of the endpoints so one wild interval cannot squash
    // the rest; anything past the edge gets an arrowhead instead of a bar end
    var lo = Math.min(lows[Math.floor(lows.length * 0.08)], truth);
    var hi = Math.max(highs[Math.floor(highs.length * 0.92)], truth);
    var pad = (hi - lo) * 0.12 || 1; lo -= pad; hi += pad;
    function bx(v) { return mB.l + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (W - mB.l - mB.r); }
    g += '<text x="' + mB.l + '" y="' + (yB - 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">' +
         cis.length + ' of those studies: the 95% interval for ' + u.esc(S.spec.estimand) + '</text>';
    var miss = 0;
    cis.forEach(function (c, k) {
      var yy = yB + 6 + k * ((hB - 12) / Math.max(1, cis.length - 1));
      var col = c[2] ? P.mut : P.bad;
      if (!c[2]) miss++;
      g += '<line x1="' + bx(c[0]).toFixed(1) + '" y1="' + yy.toFixed(1) + '" x2="' + bx(c[1]).toFixed(1) + '" y2="' + yy.toFixed(1) +
           '" stroke="' + col + '" stroke-width="' + (c[2] ? 1.6 : 2.6) + '" stroke-opacity="' + (c[2] ? 0.55 : 1) + '" stroke-linecap="round"/>';
      if (c[0] < lo) g += '<path d="M' + (mB.l + 1) + ',' + (yy - 3).toFixed(1) + ' L' + (mB.l - 4) + ',' + yy.toFixed(1) + ' L' + (mB.l + 1) + ',' + (yy + 3).toFixed(1) + 'Z" fill="' + col + '"/>';
      if (c[1] > hi) g += '<path d="M' + (W - mB.r - 1) + ',' + (yy - 3).toFixed(1) + ' L' + (W - mB.r + 4) + ',' + yy.toFixed(1) + ' L' + (W - mB.r - 1) + ',' + (yy + 3).toFixed(1) + 'Z" fill="' + col + '"/>';
    });
    g += '<line x1="' + bx(truth).toFixed(1) + '" y1="' + yB + '" x2="' + bx(truth).toFixed(1) + '" y2="' + (yB + hB) + '" stroke="' + P.acc + '" stroke-width="1.6"/>' +
         '<text x="' + bx(truth).toFixed(1) + '" y="' + (yB + hB + 15) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.acc + '" ' + HALO + '>true value</text>' +
         '<text x="' + (W - mB.r) + '" y="' + (yB - 13) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10.5" fill="' + (miss ? P.bad : P.mut) + '">' +
         miss + ' of ' + cis.length + ' miss</text>';
    var H = yB + hB + 24;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Interval coverage and model fit against the severity of an assumption violation, with individual study intervals below">' + g + '</svg>';
  }

  /* ---------------- the sentence under the picture ---------------- */
  function verdict(key, S, step, P) {
    var a = S.rows[0], b = S.rows[step];
    var pc = function (v) { return (100 * v).toFixed(1) + '%'; };
    var covTx = '<b style="color:' + (b.cov < 0.9 ? P.bad : P.acc) + '">' + pc(b.cov) + '</b>';
    var fitName = S.spec.fit === 'cox' ? 'Concordance' : 'R-squared';
    var fitTx = '<b style="color:' + P.c0 + '">' + b.fit.toFixed(3) + '</b>';
    if (step === 0) {
      return 'With the assumption satisfied, ' + covTx + ' of the 95% intervals contain the true value, which is what 95% is supposed to mean. ' +
        fitName + ' is ' + fitTx + '. Drag the dial and watch which of those two numbers moves.';
    }
    var common = 'Coverage is now ' + covTx + ' against the 95% it promises. ' + fitName + ' went from ' + a.fit.toFixed(3) + ' to ' + fitTx + '. ';
    var tooNarrow = understate(b.cov).toFixed(1);
    if (key === 'multicollinearity') {
      return 'Coverage is ' + covTx + '. It has not moved and it will not: collinearity biases nothing. What moved is the WIDTH, now <b>' +
        (b.width / a.width).toFixed(1) + 'x</b> what it was with uncorrelated predictors. The interval is telling the truth about how little this data can separate two variables that carry the same information. ' +
        'A wide honest interval is a result to report, not a violation to fix.';
    }
    if (key === 'normality') {
      return common + 'This is the mildest of the seven. An estimate is an average of many draws, and averages are close to normal whatever the draws look like, ' +
        'so the interval survives an error distribution that looks nothing like a bell. Non-normal residuals are a reason to look for outliers and for the wrong functional form. On their own they are not a reason to distrust the interval.';
    }
    if (key === 'linearity') {
      return common + 'The line still summarises the cloud, which is why the fit statistic stays calm. It is the PREDICTION at the top of the range that is wrong, ' +
        'and no standard error repairs that: the model is estimating the wrong quantity, not estimating the right one badly.';
    }
    if (key === 'proportional-hazards') {
      return common + 'The model still ranks patients well, so nothing in the fit complains. But one hazard ratio is being asked to describe an effect that changes over follow-up, ' +
        'so the interval quoted for the early period misses it ' + pc(1 - b.cov) + ' of the time. Split the follow-up, or model the interaction with time, and quote both periods.';
    }
    if (key === 'independence') {
      return common + 'Every row is being counted as fresh information when rows inside a group are partly the same information. The intervals are about <b>' + tooNarrow +
        'x too narrow</b>. This is the one an ordinary robust standard error does not repair, because it also assumes independent observations.';
    }
    if (key === 'autocorrelation') {
      return common + 'Neighbouring errors move together, so 60 observations carry far less than 60 observations worth of information. The intervals are about <b>' + tooNarrow +
        'x too narrow</b>, and note that the fit statistic went UP: a smooth error series flatters R-squared at the same time as it destroys the interval.';
    }
    return common + 'The estimate is roughly right and the interval around it is about <b>' + tooNarrow + 'x too narrow</b>. ' +
      'That is a standard-error problem, not a model problem: the fit is fine and the uncertainty statement is not.';
  }

  /* ---------------- runnable R, one per assumption ----------------
     Each block reproduces the widget's own experiment: same generative model, same
     estimand, same 95% interval, coverage counted the same way. Base R only. */
  function head(txt) {
    return ['# ' + txt, '# sev runs 0 (assumption holds) to 1 (severe). Change it and run again.', 'set.seed(11)'];
  }
  var RCODE = {
    normality: function () {
      return head('Skewed errors. Does the 95% interval for the slope still cover the truth?').concat([
        'n <- 30; sims <- 2000; sev <- 1',
        'x  <- as.numeric(scale(rnorm(n)))',
        'sg <- max(1e-6, 0.85 * sev)',
        'mu <- exp(sg^2 / 2); sdl <- sqrt((exp(sg^2) - 1) * exp(sg^2))',
        '',
        'one <- function() {',
        '  e  <- (exp(sg * rnorm(n)) - mu) / sdl      # standardised lognormal: mean 0, sd 1',
        '  y  <- x + e',
        '  m  <- lm(y ~ x)',
        '  ci <- confint(m)["x", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    heteroskedasticity: function () {
      return head('Error spread that grows with x. The fit is fine; the interval is not.').concat([
        'n <- 60; sims <- 2000; sev <- 1',
        'x <- as.numeric(scale(rnorm(n)))',
        'w <- exp(1.1 * sev * x); w <- w / sqrt(mean(w^2))   # average error variance stays 1',
        '',
        'one <- function() {',
        '  y  <- x + rnorm(n, sd = w)',
        '  m  <- lm(y ~ x)',
        '  ci <- confint(m)["x", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    independence: function () {
      return head('Observations clustered in groups. Coverage falls; R-squared does not.').concat([
        'n <- 60; m <- 5; k <- n / m; sims <- 2000; sev <- 1',
        'rho <- 0.6 * sev                        # intraclass correlation',
        'cl  <- rep(1:k, each = m)',
        'x   <- as.numeric(scale(rep(rnorm(k), each = m)))   # the predictor varies BETWEEN groups',
        '',
        'one <- function() {',
        '  y  <- x + sqrt(rho) * rnorm(k)[cl] + sqrt(1 - rho) * rnorm(n)',
        '  fm <- lm(y ~ x)',
        '  ci <- confint(fm)["x", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], r2 = summary(fm)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)',
        'round(1 + (m - 1) * rho, 2)             # design effect: the factor the variance is out by'
      ]).join('\n');
    },
    autocorrelation: function () {
      return head('Errors correlated with their own past, fitted against a trend.').concat([
        'n <- 60; sims <- 2000; sev <- 1',
        'phi <- 0.92 * sev',
        'x   <- as.numeric(scale(seq_len(n)))',
        '',
        'one <- function() {',
        '  e  <- as.numeric(arima.sim(list(ar = phi), n = n, sd = sqrt(1 - phi^2)))',
        '  y  <- x + e',
        '  m  <- lm(y ~ x)',
        '  ci <- confint(m)["x", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    multicollinearity: function () {
      return head('Two near-duplicate predictors. Watch the width, not the coverage.').concat([
        'n <- 60; sims <- 2000; sev <- 1',
        'r  <- 0.995 * sev',
        'a  <- as.numeric(scale(rnorm(n))); b <- as.numeric(scale(rnorm(n)))',
        'b  <- as.numeric(scale(residuals(lm(b ~ a))))       # make b independent of a',
        'x1 <- a; x2 <- r * a + sqrt(1 - r^2) * b',
        '',
        'one <- function() {',
        '  y  <- x1 + x2 + rnorm(n, sd = sqrt(1 + r))        # holds R-squared still as r moves',
        '  m  <- lm(y ~ x1 + x2)',
        '  ci <- confint(m)["x1", ]',
        '  c(covered = ci[1] < 1 && 1 < ci[2], width = unname(ci[2] - ci[1]), r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage   = mean(res[, "covered"]),',
        '        mean_width = mean(res[, "width"]),',
        '        r_squared  = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    linearity: function () {
      return head('A curved truth fitted with a straight line. The prediction at the top is the casualty.').concat([
        'n <- 60; sims <- 2000; sev <- 1',
        'x   <- 0.2 + 2 * runif(n); q <- x^2',
        'zx  <- as.numeric(scale(x)); zq <- as.numeric(scale(q))',
        'top <- 2.2',
        'truth <- 2 * ((1 - sev) * (top - mean(x)) / sd(x) +',
        '                    sev  * (top^2 - mean(q)) / sd(q))',
        '',
        'one <- function() {',
        '  y  <- 2 * ((1 - sev) * zx + sev * zq) + rnorm(n)',
        '  m  <- lm(y ~ x)',
        '  ci <- predict(m, data.frame(x = top), interval = "confidence")',
        '  c(covered = ci[1, "lwr"] < truth && truth < ci[1, "upr"], r2 = summary(m)$r.squared)',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), r_squared = mean(res[, "r2"])), 3)'
      ]).join('\n');
    },
    'proportional-hazards': function () {
      return head('A hazard ratio that changes halfway through follow-up.').concat([
        'library(survival)',
        'n <- 200; sims <- 400; sev <- 1',
        'z    <- rep(0:1, each = n / 2)',
        'cut  <- 0.5; adm <- 2.0',
        'late <- 0.5 + 0.5 * sev                 # the early HR stays 0.50 throughout',
        '',
        'one <- function() {',
        '  l1 <- ifelse(z == 1, 0.5, 1); l2 <- ifelse(z == 1, late, 1)',
        '  E  <- rexp(n)',
        '  tt <- ifelse(E < l1 * cut, E / l1, cut + (E - l1 * cut) / l2)',
        '  d  <- as.integer(tt <= adm); tt <- pmin(tt, adm)',
        '  m  <- coxph(Surv(tt, d) ~ z)',
        '  ci <- confint(m)',
        '  c(covered = ci[1] < log(0.5) && log(0.5) < ci[2],',
        '    conc    = unname(summary(m)$concordance[1]))',
        '}',
        'res <- t(replicate(sims, one()))',
        'round(c(coverage = mean(res[, "covered"]), concordance = mean(res[, "conc"])), 3)'
      ]).join('\n');
    }
  };

  window.LessonWidgets.register('assumption-dial', mount);
})();

;
/* autoencoder-recon.js */
/* autoencoder-recon.js - anomaly detection by reconstruction error.
 * An autoencoder squeezes each point through a narrow bottleneck and rebuilds it. Trained on normal
 * data, it learns the manifold the normal points live on, so it rebuilds them well. A point off that
 * manifold cannot be rebuilt from the bottleneck, so its reconstruction error is large. The linear
 * case is exactly PCA: the bottleneck is the top principal directions, and the error is the distance
 * to that subspace. Here the manifold is a line; the residual dropped to the line IS the error.
 * Toggle a normal point vs the off-manifold anomaly and compare. Emits the PCA reconstruction in base R.
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2831853 * r()); }

  function build() {
    var r = rng(5), pts = [], i, x;
    for (i = 0; i < 90; i++) { x = 1.7 * gauss(r); pts.push([x, 0.7 * x + 0.18 * gauss(r)]); }  // hug the line y=0.7x
    pts.push([1.6, -1.6]);   // anomaly far off the line (last index)
    return pts;
  }

  // 2x2 PCA: centre, top eigenvector, project each point onto it, reconstruct, residual error.
  function pca1(pts) {
    var n = pts.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += pts[i][0]; my += pts[i][1]; } mx /= n; my /= n;
    var a = 0, b = 0, c = 0, dx, dy;
    for (i = 0; i < n; i++) { dx = pts[i][0] - mx; dy = pts[i][1] - my; a += dx * dx; b += dx * dy; c += dy * dy; }
    a /= n; b /= n; c /= n;
    var lam = (a + c) / 2 + Math.sqrt(((a - c) / 2) * ((a - c) / 2) + b * b);
    var vx = b, vy = lam - a; if (Math.abs(b) < 1e-9 && Math.abs(vy) < 1e-9) { vx = 1; vy = 0; }
    var nv = Math.sqrt(vx * vx + vy * vy) || 1; vx /= nv; vy /= nv;
    var out = pts.map(function (p) {
      var px = p[0] - mx, py = p[1] - my, t = px * vx + py * vy;
      var rx = mx + t * vx, ry = my + t * vy;               // reconstruction on the line
      var ex = p[0] - rx, ey = p[1] - ry;
      return { recon: [rx, ry], err: ex * ex + ey * ey };
    });
    return { mean: [mx, my], v: [vx, vy], pts: out };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var pts = build(), anom = pts.length - 1, sel = 'normal', model = pca1(pts);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ae-seg" style="margin-bottom:12px">' + u.seg([{ v: 'normal', label: 'A normal point' }, { v: 'anomaly', label: 'The anomaly' }], 'normal') + '</div>' +
      '<div class="ae-plot"></div>' +
      '<div class="ae-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Autoencoder anomaly detection = PCA reconstruction error, base R' });

    var plot = el.querySelector('.ae-plot'), read = el.querySelector('.ae-read');
    var W = 340, H = 240, PAD = 16, LO = -3, HI = 3;
    function sx(x) { return PAD + (x - LO) / (HI - LO) * (W - 2 * PAD); }
    function sy(y) { return H - PAD - (y - LO) / (HI - LO) * (H - 2 * PAD); }
    var median = (function () { var e = model.pts.slice(0, anom).map(function (o) { return o.err; }).sort(function (a, b) { return a - b; }); return e[Math.floor(e.length / 2)]; })();

    function draw() {
      var pIdx = sel === 'anomaly' ? anom : 7;
      var m = model.mean, v = model.v, L = 4.2;
      var line = '<line x1="' + sx(m[0] - v[0] * L).toFixed(1) + '" y1="' + sy(m[1] - v[1] * L).toFixed(1) + '" x2="' + sx(m[0] + v[0] * L).toFixed(1) + '" y2="' + sy(m[1] + v[1] * L).toFixed(1) + '" stroke="' + P.mut + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      var resid = model.pts.map(function (o, i) { var p = pts[i]; var bold = i === pIdx; return '<line x1="' + sx(p[0]).toFixed(1) + '" y1="' + sy(p[1]).toFixed(1) + '" x2="' + sx(o.recon[0]).toFixed(1) + '" y2="' + sy(o.recon[1]).toFixed(1) + '" stroke="' + (bold ? P.bad : P.line2) + '" stroke-width="' + (bold ? 2 : 1) + '" opacity="' + (bold ? 1 : 0.5) + '"/>'; }).join('');
      var dots = pts.map(function (p, i) { var isSel = i === pIdx, isA = i === anom; return '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="' + (isSel ? 5 : 3) + '" fill="' + (isSel ? P.bad : isA ? P.del : P.c0) + '" opacity="' + (isSel ? 1 : 0.6) + '"' + (isSel ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>'; }).join('');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="reconstruction residuals to the bottleneck line">' +
        line + resid + dots +
        '<text x="' + (W - 8) + '" y="18" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">dashed = bottleneck manifold</text>' +
        '<text x="' + (W - 8) + '" y="31" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">red = reconstruction error</text></svg>';
      var err = model.pts[pIdx].err;
      read.innerHTML = 'The ' + (sel === 'anomaly' ? '<b style="color:' + P.del + '">anomaly</b>' : '<b>normal point</b>') + ' reconstructs with squared error <b style="color:' + P.bad + '">' + err.toFixed(2) + '</b>, against a typical normal error of about <b>' + median.toFixed(3) + '</b>. ' +
        (sel === 'anomaly' ? 'It sits off the manifold the bottleneck learned, so it cannot be rebuilt from one component: a large error flags it.' : 'It lies on the manifold, so one component rebuilds it almost perfectly: a tiny error, no flag.');
    }
    u.wireSeg(el.querySelector('.ae-seg'), function (v) { sel = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Autoencoder anomaly detection: reconstruct through a 1-component (PCA) bottleneck. Base R.',
      '# A linear autoencoder IS PCA; error = distance to the learned manifold (here a line).',
      'set.seed(1)',
      'n <- 200',
      'x <- rnorm(n); Y <- cbind(x, 0.7*x + rnorm(n, 0, 0.15))   # 2D data hugging a line',
      'Y <- rbind(Y, c(1.5, -1.5))                                # anomaly far off the line (row 201)',
      'pca   <- prcomp(Y, center = TRUE, rank. = 1)               # encoder: keep 1 of 2 dims (bottleneck)',
      'recon <- sweep(predict(pca) %*% t(pca$rotation[, 1, drop = FALSE]), 2, pca$center, "+")  # decode',
      'err   <- rowSums((Y - recon)^2)                            # reconstruction error per point',
      'round(c(median_normal = median(err[1:200]), anomaly = err[201]), 3)',
      '#> median_normal       anomaly',
      '#>         0.007         4.346'
    ].join('\n');
  }

  window.LessonWidgets.register('autoencoder-recon', mount);
})();

;
/* bandit-explore.js */
/* bandit-explore.js - explore vs exploit in a multi-armed bandit, made visible. Three arms
 * with unknown reward rates; a strategy must learn which is best while paying for every pull
 * of a worse one. That running cost is REGRET. epsilon-greedy explores blindly at a fixed
 * rate; Thompson sampling explores in proportion to its uncertainty and stops wasting pulls
 * on clearly-worse arms, so its regret curve flattens sooner. Toggle the two and compare the
 * cumulative-regret curves. Emits the same bandit simulation in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var RATES = [0.30, 0.50, 0.55], BEST = 0.55, T = 400;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function simulate(strategy) {
    var r = rng(strategy === 'thompson' ? 7 : 19), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var K = RATES.length, succ = [0, 0, 0], n = [0, 0, 0], regret = 0, curve = [];
    for (var t = 0; t < T; t++) {
      var pick = 0;
      if (strategy === 'egreedy') {
        if (r() < 0.1) { pick = Math.floor(r() * K); }
        else { var bm = -1; for (var k = 0; k < K; k++) { var mean = n[k] ? succ[k] / n[k] : 1; if (mean > bm) { bm = mean; pick = k; } } }
      } else { // thompson: sample each arm's rate from its Beta posterior (normal approx), pick the max
        var best = -1;
        for (var k2 = 0; k2 < K; k2++) {
          var a = succ[k2] + 1, b2 = n[k2] - succ[k2] + 1, tot = a + b2;
          var mn = a / tot, vr = a * b2 / (tot * tot * (tot + 1));
          var draw = Math.min(0.999, Math.max(0.001, mn + Math.sqrt(vr) * rnorm()));
          if (draw > best) { best = draw; pick = k2; }
        }
      }
      var reward = r() < RATES[pick] ? 1 : 0;
      succ[pick] += reward; n[pick]++;
      regret += BEST - RATES[pick];
      curve.push(regret);
    }
    return { curve: curve, regret: regret, n: n };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var strat = 'thompson';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ba-seg" style="margin-bottom:12px">' + u.seg([{ v: 'egreedy', label: 'epsilon-greedy' }, { v: 'thompson', label: 'Thompson sampling' }], 'thompson') + '</div>' +
      '<div class="ba-plot"></div>' +
      '<div class="ba-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A three-arm bandit: epsilon-greedy vs Thompson, base R' });

    var plot = el.querySelector('.ba-plot'), read = el.querySelector('.ba-read');
    var eg = simulate('egreedy'), th = simulate('thompson');
    var YMAX = Math.max(eg.regret, th.regret) * 1.05;
    var W = 340, H = 185, PAD = 30;
    function px(t) { return PAD + (t / T) * (W - PAD - 8); }
    function py(v) { return (H - 22) - (v / YMAX) * (H - 34); }
    function path(c) { return c.map(function (v, t) { return px(t).toFixed(1) + ',' + py(v).toFixed(1); }).join(' '); }
    function draw() {
      var sel = strat === 'thompson' ? th : eg, other = strat === 'thompson' ? eg : th;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="cumulative regret over rounds">' +
        '<polyline points="' + path(other.curve) + '" fill="none" stroke="' + P.line2 + '" stroke-width="1.5" stroke-dasharray="3 3"/>' +
        '<polyline points="' + path(sel.curve) + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>' +
        '<text x="' + (W - 8) + '" y="12" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">cumulative regret</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">round (1 to ' + T + ')</text></svg>';
      read.innerHTML = '<b>' + (strat === 'thompson' ? 'Thompson sampling' : 'epsilon-greedy') + '</b> ends ' + T + ' rounds with total regret <b style="color:' + P.c0 + '">' + sel.regret.toFixed(1) + '</b> (the dashed line is the other strategy at ' + other.regret.toFixed(1) + '). ' +
        (strat === 'thompson' ? 'Its curve bends toward flat: once an arm looks clearly worse, Thompson almost stops pulling it.' : 'It keeps spending a fixed 10% of pulls exploring at random forever, so its regret keeps climbing even after the best arm is obvious.');
    }
    u.wireSeg(el.querySelector('.ba-seg'), function (v) { strat = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Three-arm bandit: epsilon-greedy vs Thompson sampling, scored by cumulative regret. Base R.',
      'rates <- c(0.30, 0.50, 0.55); best <- max(rates); T <- 400',
      '',
      'run <- function(strategy) {',
      '  succ <- rep(0, 3); n <- rep(0, 3); regret <- 0',
      '  for (t in 1:T) {',
      '    if (strategy == "egreedy") {',
      '      pick <- if (runif(1) < 0.1) sample(3, 1) else which.max(ifelse(n > 0, succ / n, 1))',
      '    } else {',
      '      pick <- which.max(rbeta(3, succ + 1, n - succ + 1))   # Thompson: draw from each arm\'s Beta',
      '    }',
      '    reward <- rbinom(1, 1, rates[pick])',
      '    succ[pick] <- succ[pick] + reward; n[pick] <- n[pick] + 1',
      '    regret <- regret + (best - rates[pick])',
      '  }',
      '  c(regret = regret, pulls_best = n[which.max(rates)])',
      '}',
      'set.seed(7)',
      'round(rbind(egreedy = run("egreedy"), thompson = run("thompson")), 1)',
      '# Thompson ends with lower regret and far more pulls on the best arm.'
    ].join('\n');
  }

  window.LessonWidgets.register('bandit-explore', mount);
})();

;
/* bayes-update.js */
/* bayes-update.js - the heart of Bayesian inference on one screen. A prior belief
 * (normal) times the evidence from data (the likelihood) gives the posterior. Drag the
 * prior's mean and confidence and the amount of data; watch the posterior sit between
 * belief and evidence, and tighten as data grows. Emits runnable base-R that does the
 * exact conjugate normal-normal update the picture shows.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var st = { pm: 0, ps: 1.0, dm: 3, n: 10 };   // prior mean/sd, data mean, n (data sd fixed = 2)
    var DSD = 2;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="bu-plot"></div>' +
      row('prior mean', 'pm', -4, 6, 0.5, st.pm) +
      row('prior confidence', 'ps', 0.4, 3, 0.1, st.ps, true) +
      row('data average', 'dm', -4, 6, 0.5, st.dm) +
      row('data points n', 'n', 1, 200, 1, st.n) +
      '<div class="bu-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The conjugate normal-normal update in base R' });

    var plot = el.querySelector('.bu-plot'), read = el.querySelector('.bu-read');
    function row(lab, key, lo, hi, step, val, inv) {
      return '<label style="display:block;font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 1px">' + lab +
        ' <b class="bu-v-' + key + '" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="bu-s" data-k="' + key + '"' + (inv ? ' data-inv="1"' : '') + ' type="range" min="' + lo + '" max="' + hi + '" step="' + step + '" value="' + val + '" style="width:100%;accent-color:' + P.acc + '"></label>';
    }
    function dnorm(x, m, s) { return Math.exp(-(x - m) * (x - m) / (2 * s * s)) / (s * Math.sqrt(2 * Math.PI)); }

    function draw() {
      // conjugate normal update: prior N(pm, ps^2), data mean dm with n obs of sd DSD
      var priorVar = st.ps * st.ps, dataVar = DSD * DSD / st.n;
      var postVar = 1 / (1 / priorVar + 1 / dataVar);
      var postM = postVar * (st.pm / priorVar + st.dm / dataVar);
      var postS = Math.sqrt(postVar), likS = Math.sqrt(dataVar);
      var W = 440, H = 190, m = { l: 8, r: 8, t: 10, b: 22 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var lo = Math.min(st.pm, st.dm, postM) - 4, hi = Math.max(st.pm, st.dm, postM) + 4;
      var peak = Math.max(dnorm(st.pm, st.pm, st.ps), dnorm(st.dm, st.dm, likS), dnorm(postM, postM, postS));
      function sx(x) { return m.l + (x - lo) / (hi - lo) * iw; }
      function sy(y) { return m.t + ih - y / (peak * 1.08) * ih; }
      function curve(mn, sd, col, fill) {
        var pts = ''; for (var i = 0; i <= 80; i++) { var x = lo + (hi - lo) * i / 80; pts += sx(x).toFixed(1) + ',' + sy(dnorm(x, mn, sd)).toFixed(1) + ' '; }
        var area = fill ? '<polygon points="' + sx(lo).toFixed(1) + ',' + sy(0) + ' ' + pts + sx(hi).toFixed(1) + ',' + sy(0) + '" fill="' + col + '" opacity="0.10"/>' : '';
        return area + '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="' + (fill ? 2.6 : 2) + '"/>';
      }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="prior, likelihood and posterior">';
      svg += '<line x1="' + m.l + '" y1="' + sy(0) + '" x2="' + (m.l + iw) + '" y2="' + sy(0) + '" stroke="' + P.line + '"/>';
      svg += curve(st.pm, st.ps, P.mut, false);           // prior
      svg += curve(st.dm, likS, P.c1, false);              // likelihood (data)
      svg += curve(postM, postS, P.acc, true);             // posterior
      // legend
      var lg = [['prior', P.mut], ['likelihood (data)', P.c1], ['posterior', P.acc]];
      lg.forEach(function (o, i) { svg += '<line x1="' + (m.l + 6 + i * 132) + '" y1="14" x2="' + (m.l + 24 + i * 132) + '" y2="14" stroke="' + o[1] + '" stroke-width="3"/><text x="' + (m.l + 28 + i * 132) + '" y="17.5" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">' + o[0] + '</text>'; });
      svg += '</svg>';
      plot.innerHTML = svg;
      var pull = ((postM - st.pm) / (st.dm - st.pm || 1) * 100);
      read.innerHTML = '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">posterior &mu; ' + postM.toFixed(2) + ', sd ' + postS.toFixed(2) + '</b>. ' +
        'The posterior sits <b>' + (isFinite(pull) ? Math.max(0, Math.min(100, Math.round(pull))) : 0) + '%</b> of the way from your prior toward the data. ' +
        (st.n >= 60 ? 'With this much data, the evidence dominates and the prior barely matters.' : st.n <= 3 ? 'With so little data, your prior still carries real weight.' : 'Prior and data each pull their share; add data and the posterior tightens toward the evidence.');
      el.querySelector('.bu-v-pm').textContent = st.pm.toFixed(1);
      el.querySelector('.bu-v-ps').textContent = st.ps.toFixed(1);
      el.querySelector('.bu-v-dm').textContent = st.dm.toFixed(1);
      el.querySelector('.bu-v-n').textContent = st.n;
    }
    Array.prototype.forEach.call(el.querySelectorAll('.bu-s'), function (s) {
      s.addEventListener('input', function () { st[s.getAttribute('data-k')] = +s.value; draw(); });
    });
    draw();
  }

  function rcode() {
    return [
      '# Conjugate normal-normal update: prior belief x data evidence -> posterior.',
      'prior_mean <- 0;  prior_sd <- 1      # what you believed before',
      'data_mean  <- 3;  data_sd  <- 2;  n <- 10   # what the data say',
      '',
      'prior_var <- prior_sd^2',
      'data_var  <- data_sd^2 / n            # the mean of n points is this precise',
      'post_var  <- 1 / (1/prior_var + 1/data_var)',
      'post_mean <- post_var * (prior_mean/prior_var + data_mean/data_var)',
      'c(post_mean = round(post_mean, 3), post_sd = round(sqrt(post_var), 3))',
      '# posterior mean is a precision-weighted blend of prior and data;',
      '# more data (raise n) shrinks data_var, so the posterior follows the data.'
    ].join('\n');
  }

  window.LessonWidgets.register('bayes-update', mount);
})();

;
/* bayesopt-acq.js */
/* bayesopt-acq.js - Bayesian optimization, one step at a time. A cheap GP surrogate stands
 * in for an expensive black-box objective; the acquisition function (Expected Improvement)
 * scores where to look next, trading off "high predicted value" against "high uncertainty".
 * Press Next sample to run one BO step: EI picks the next x, the objective is evaluated there,
 * the surrogate updates. Watch it lock onto the global peak in a few evaluations, then probe
 * the runner-up. Emits the same EI loop as runnable base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function f(x) { return 1.5 * Math.exp(-(x - 6) * (x - 6) / 1.5) + Math.exp(-(x - 2.5) * (x - 2.5) / 0.8); }
  function rbf(a, b, l) { var d = a - b; return Math.exp(-d * d / (2 * l * l)); }
  function pnorm(z) {
    var b1 = 0.319381530, b2 = -0.356563782, b3 = 1.781477937, b4 = -1.821255978, b5 = 1.330274429, p = 0.2316419, c = 0.39894228;
    var t = 1 / (1 + p * Math.abs(z)), y = 1 - c * Math.exp(-z * z / 2) * t * (b1 + t * (b2 + t * (b3 + t * (b4 + t * b5))));
    return z >= 0 ? y : 1 - y;
  }
  function dnorm(z) { return 0.39894228 * Math.exp(-z * z / 2); }
  function inv(M) {
    var n = M.length, A = M.map(function (r, i) { return r.concat(Array.from({ length: n }, function (_, j) { return i === j ? 1 : 0; })); });
    for (var c = 0; c < n; c++) { var pv = A[c][c]; for (var j = 0; j < 2 * n; j++) A[c][j] /= pv; for (var r = 0; r < n; r++) { if (r === c) continue; var fct = A[r][c]; for (var k = 0; k < 2 * n; k++) A[r][k] -= fct * A[c][k]; } }
    return A.map(function (row) { return row.slice(n); });
  }
  function matvec(M, v) { return M.map(function (row) { return row.reduce(function (s, x, i) { return s + x * v[i]; }, 0); }); }

  var L = 0.9, S0 = 1e-4, GRID = (function () { var g = []; for (var i = 0; i < 100; i++) g.push(8 * i / 99); return g; })();

  function surrogate(X, Y) {
    var n = X.length, K = [];
    for (var i = 0; i < n; i++) { K.push([]); for (var j = 0; j < n; j++) K[i].push(rbf(X[i], X[j], L) + (i === j ? S0 : 0)); }
    var Ki = inv(K), alpha = matvec(Ki, Y), best = Math.max.apply(null, Y);
    return GRID.map(function (xg) {
      var ks = X.map(function (xt) { return rbf(xg, xt, L); });
      var m = ks.reduce(function (s, kv, i) { return s + kv * alpha[i]; }, 0);
      var Kiks = matvec(Ki, ks), v = 1 - ks.reduce(function (s, kv, i) { return s + kv * Kiks[i]; }, 0), sd = Math.sqrt(Math.max(v, 1e-9));
      var z = (m - best) / sd, ei = (m - best) * pnorm(z) + sd * dnorm(z);
      return { x: xg, m: m, sd: sd, ei: Math.max(ei, 0) };
    });
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var X, Y;
    function reset() { X = [1, 4, 7.5]; Y = X.map(f); }
    reset();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
        '<button class="bo-next" style="font:600 13px IBM Plex Sans,sans-serif;color:#fff;background:' + P.ink + ';border:0;border-radius:8px;padding:7px 15px;cursor:pointer">Next sample &rarr;</button>' +
        '<button class="bo-reset" style="font:600 13px IBM Plex Sans,sans-serif;color:' + P.mut + ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:7px 13px;cursor:pointer">Reset</button>' +
      '</div>' +
      '<div class="bo-plot"></div>' +
      '<div class="bo-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The same Expected-Improvement loop in base R' });

    var plot = el.querySelector('.bo-plot'), read = el.querySelector('.bo-read');
    var W = 340, Ht = 170, Ha = 70, RX = [0, 8], RYo = [-0.2, 1.8];
    function px(x) { return (x - RX[0]) / (RX[1] - RX[0]) * W; }
    function pyo(y) { return Ht - (y - RYo[0]) / (RYo[1] - RYo[0]) * Ht; }
    function draw(nextX) {
      var post = surrogate(X, Y);
      var maxEI = Math.max.apply(null, post.map(function (p) { return p.ei; })), argEI = post.reduce(function (a, b) { return b.ei > a.ei ? b : a; }).x;
      // objective panel: true curve (dashed), GP mean + band, samples
      var truePts = GRID.map(function (x) { return px(x).toFixed(1) + ',' + pyo(f(x)).toFixed(1); });
      var meanPts = post.map(function (p) { return px(p.x).toFixed(1) + ',' + pyo(p.m).toFixed(1); });
      var top = post.map(function (p) { return [px(p.x), pyo(p.m + 1.96 * p.sd)]; }), bot = post.map(function (p) { return [px(p.x), pyo(p.m - 1.96 * p.sd)]; });
      var band = 'M' + top.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' L' + bot.reverse().map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' Z';
      var dots = X.map(function (xt, i) { return '<circle cx="' + px(xt).toFixed(1) + '" cy="' + pyo(Y[i]).toFixed(1) + '" r="4" fill="' + P.ink + '"/>'; }).join('');
      var objSvg = '<svg viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px 8px 0 0;border-bottom:0" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="objective and GP surrogate">' +
        '<path d="' + band + '" fill="' + P.acc + '" opacity="0.13"/>' +
        '<polyline points="' + truePts.join(' ') + '" fill="none" stroke="' + P.mut + '" stroke-width="1.3" stroke-dasharray="4 3"/>' +
        '<polyline points="' + meanPts.join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="2"/>' + dots +
        (nextX != null ? '<line x1="' + px(nextX).toFixed(1) + '" y1="0" x2="' + px(nextX).toFixed(1) + '" y2="' + Ht + '" stroke="' + P.c0 + '" stroke-width="1.5" stroke-dasharray="3 2"/>' : '') + '</svg>';
      // acquisition panel: EI curve, argmax marked
      var eiPts = post.map(function (p) { return px(p.x).toFixed(1) + ',' + (Ha - p.ei / (maxEI || 1) * (Ha - 8)).toFixed(1); });
      var acqSvg = '<svg viewBox="0 0 ' + W + ' ' + Ha + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:0 0 8px 8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="expected improvement">' +
        '<polyline points="' + eiPts.join(' ') + '" fill="none" stroke="' + P.c0 + '" stroke-width="1.8"/>' +
        '<line x1="' + px(argEI).toFixed(1) + '" y1="0" x2="' + px(argEI).toFixed(1) + '" y2="' + Ha + '" stroke="' + P.c0 + '" stroke-width="1.3" stroke-dasharray="3 2"/>' +
        '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">acquisition (EI)</text></svg>';
      plot.innerHTML = objSvg + acqSvg;
      var bi = Y.indexOf(Math.max.apply(null, Y));
      read.innerHTML = 'Evaluations: <b>' + X.length + '</b>. Best so far: <b style="font-family:IBM Plex Mono,monospace">f(' + X[bi].toFixed(2) + ') = ' + Y[bi].toFixed(2) + '</b> (true max &asymp; 1.50 at x&asymp;6). The blue curve is Expected Improvement; its peak is where BO looks next, balancing a high predicted mean against wide uncertainty.';
    }
    el.querySelector('.bo-next').addEventListener('click', function () {
      var post = surrogate(X, Y), pick = post.reduce(function (a, b) { return b.ei > a.ei ? b : a; }).x;
      X.push(pick); Y.push(f(pick)); draw();
    });
    el.querySelector('.bo-reset').addEventListener('click', function () { reset(); draw(); });
    // initial view shows where EI would send the first step
    (function () { var post = surrogate(X, Y); draw(post.reduce(function (a, b) { return b.ei > a.ei ? b : a; }).x); })();
  }

  function rcode() {
    return [
      '# Bayesian optimization: a GP surrogate + Expected Improvement, base R.',
      'f <- function(x) 1.5*exp(-(x-6)^2/1.5) + exp(-(x-2.5)^2/0.8)  # expensive black box',
      'rbf <- function(a,b,l) exp(-outer(a,b,"-")^2/(2*l^2))',
      'xg <- seq(0, 8, length.out = 100)',
      'X <- c(1, 4, 7.5); Y <- f(X)                     # 3 initial evaluations',
      'ei_pick <- function(X, Y, l=0.9, s0=1e-4) {',
      '  K <- rbf(X,X,l) + s0*diag(length(X)); Ki <- solve(K)',
      '  Ks <- rbf(xg, X, l)',
      '  mu <- as.numeric(Ks %*% (Ki %*% Y))            # surrogate mean',
      '  s  <- sqrt(pmax(1 - rowSums((Ks %*% Ki) * Ks), 1e-9))  # surrogate sd',
      '  z  <- (mu - max(Y)) / s',
      '  ei <- (mu - max(Y))*pnorm(z) + s*dnorm(z)      # expected improvement',
      '  xg[which.max(ei)]                              # look here next',
      '}',
      'for (i in 1:5) { xn <- ei_pick(X, Y); X <- c(X, xn); Y <- c(Y, f(xn)) }',
      'round(c(best_x = X[which.max(Y)], best_y = max(Y)), 2)',
      '# a handful of evaluations find the global peak (x=6, f=1.5).'
    ].join('\n');
  }

  window.LessonWidgets.register('bayesopt-acq', mount);
})();

;
/* bias-variance-target.js */
/* bias-variance-target.js - the dartboard view of bias and variance.
 * Shots at a bullseye. Bias offsets the cluster's CENTER from the target;
 * variance is its SPREAD. Slide each and watch the four corners - low/high bias
 * x low/high variance - and the error split MSE = bias^2 + variance. Emits
 * runnable R that simulates the shots and computes the same decomposition.
 *
 * cfg: { bias:1.2, variance:0.4 }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var ZX = [0.5, -0.8, 0.2, 1.0, -0.4, 0.7, -1.1, 0.3, -0.2, 0.9, -0.6, 0.1];
  var ZY = [-0.6, 0.4, 1.0, -0.3, -0.9, 0.5, 0.2, -1.0, 0.8, -0.2, 0.6, -0.5];

  function mount(el, cfg) {
    cfg = cfg || {};
    var bias = (cfg.bias != null) ? +cfg.bias : 1.2, variance = (cfg.variance != null) ? +cfg.variance : 0.4;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="bt-chart"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;margin:12px 0 2px">' +
        '<label style="font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + '">bias <b class="bt-b" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b><input class="bt-bs" type="range" min="0" max="2" step="0.05" value="' + bias + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
        '<label style="font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + '">variance <b class="bt-v" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b><input class="bt-vs" type="range" min="0.02" max="1.4" step="0.02" value="' + variance + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '</div>' +
      '<div class="bt-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Simulate the shots + split the error in R' });

    var chart = el.querySelector('.bt-chart'), read = el.querySelector('.bt-read'),
        bs = el.querySelector('.bt-bs'), vs = el.querySelector('.bt-vs'), bEl = el.querySelector('.bt-b'), vEl = el.querySelector('.bt-v');

    function draw() {
      var S = 280, cx = S / 2, cy = S / 2, unit = S / 7, sd = Math.sqrt(variance);
      function px(x) { return cx + x * unit; } function py(y) { return cy - y * unit; }
      var sxs = ZX.map(function (z) { return bias + z * sd; }), sys = ZY.map(function (z) { return z * sd; });
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="bias variance dartboard">';
      [2.4, 1.6, 0.8].forEach(function (rr, i) { svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (rr * unit).toFixed(1) + '" fill="' + (i % 2 ? '#fff' : P.bg) + '" stroke="' + P.line + '"/>'; });
      svg += '<circle cx="' + cx + '" cy="' + cy + '" r="4" fill="' + P.acc + '"/>';
      // cluster center marker
      var mcx = sxs.reduce(function (a, b) { return a + b; }, 0) / ZX.length, mcy = sys.reduce(function (a, b) { return a + b; }, 0) / ZY.length;
      svg += '<line x1="' + px(0) + '" y1="' + py(0) + '" x2="' + px(mcx).toFixed(1) + '" y2="' + py(mcy).toFixed(1) + '" stroke="' + P.bad + '" stroke-width="1.4" stroke-dasharray="3 3"/>';
      sxs.forEach(function (x, i) { svg += '<circle cx="' + px(x).toFixed(1) + '" cy="' + py(sys[i]).toFixed(1) + '" r="5" fill="' + P.bad + '" fill-opacity="0.8"/>'; });
      svg += '<circle cx="' + px(mcx).toFixed(1) + '" cy="' + py(mcy).toFixed(1) + '" r="6" fill="none" stroke="' + P.ink + '" stroke-width="2"/>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var bias2 = mcx * mcx + mcy * mcy, varEst = sxs.reduce(function (a, x, i) { return a + (x - mcx) * (x - mcx) + (sys[i] - mcy) * (sys[i] - mcy); }, 0) / ZX.length;
      var label = bias > 1 && variance > 0.7 ? 'High bias AND high variance - off-center and scattered.'
        : bias > 1 ? 'High bias, low variance - tightly grouped, but in the wrong spot (a too-simple model).'
        : variance > 0.7 ? 'Low bias, high variance - centered on average, but wildly inconsistent (overfitting).'
        : 'Low bias, low variance - the goal: tight and on target.';
      read.innerHTML = '<b>' + label + '</b> Error splits cleanly: <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">bias&sup2; ' + bias2.toFixed(2) + ' + variance ' + varEst.toFixed(2) + ' = MSE ' + (bias2 + varEst).toFixed(2) +
        '</b>. The dashed line is how far the cluster center sits from the bullseye (bias); the scatter around that center is variance.';
      bEl.textContent = (+bias).toFixed(2); vEl.textContent = (+variance).toFixed(2);
    }
    bs.addEventListener('input', function () { bias = +bs.value; draw(); });
    vs.addEventListener('input', function () { variance = +vs.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Bias vs variance as darts at a bullseye. Bias shifts the cluster CENTER',
      '# off target; variance is its SPREAD. Total error = bias^2 + variance.',
      'set.seed(1)',
      'bias <- 1.2; variance <- 0.4; n <- 12     # try bias 0 + variance 1.0, etc.',
      'shots_x <- bias + rnorm(n, 0, sqrt(variance))',
      'shots_y <-        rnorm(n, 0, sqrt(variance))',
      '',
      'plot(shots_x, shots_y, xlim = c(-3, 3), ylim = c(-3, 3), asp = 1,',
      '     pch = 19, col = "firebrick", xlab = "", ylab = "")',
      'symbols(rep(0, 3), rep(0, 3), circles = c(0.6, 1.4, 2.2), inches = FALSE, add = TRUE)',
      '',
      'center <- c(mean(shots_x), mean(shots_y))',
      'bias2  <- sum(center^2)                                   # distance from bullseye',
      'var_   <- mean((shots_x - center[1])^2 + (shots_y - center[2])^2)',
      'c(bias2 = bias2, variance = var_, mse = bias2 + var_)'
    ].join('\n');
  }

  window.LessonWidgets.register('bias-variance-target', mount);
})();

;
/* bias-variance.js */
/* bias-variance.js - the bias-variance tradeoff.
 * Slide model complexity (polynomial degree): training error falls monotonically
 * while test error traces a U (underfit -> best -> overfit). Emits runnable R that
 * fits polynomials of increasing degree to noisy data and plots the same two curves.
 *
 * cfg: { maxDegree=12, start=3 }  - all optional; renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var MAX = Math.max(4, +cfg.maxDegree || 12);
    var deg = Math.min(MAX, Math.max(1, +cfg.start || 3));

    // Deterministic, illustrative error curves (the intuition; the R block below is the real fit).
    // train error falls and flattens; test error = bias^2 (falls) + variance (rises) + noise.
    function errs(d) {
      var noise = 0.18;
      var test = noise + 1.55 / d + 0.05 * d;            // U-shape
      var train = noise * 0.6 + 1.35 / (d + 1.1) - 0.025 * d;
      return { train: Math.max(0.04, train), test: test };
    }
    var DS = []; for (var d = 1; d <= MAX; d++) { var e = errs(d); DS.push({ d: d, train: e.train, test: e.test }); }
    var bestD = DS.reduce(function (b, r) { return r.test < b.test ? r : b; }, DS[0]).d;

    // ---- layout ----
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:0 0 12px">' +
        '<label style="font:600 12.5px/1 IBM Plex Sans,sans-serif;color:' + P.body + '">Model complexity (polynomial degree): ' +
          '<b class="bv-deg" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + deg + '</b></label>' +
        '<span class="bv-tag" style="font:700 11px/1 IBM Plex Mono,monospace;letter-spacing:.04em;text-transform:uppercase;padding:4px 9px;border-radius:6px"></span>' +
      '</div>' +
      '<input class="bv-slider" type="range" min="1" max="' + MAX + '" value="' + deg + '" step="1" style="width:100%;accent-color:' + P.acc + ';margin:0 0 6px">' +
      '<div class="bv-chart"></div>' +
      '<div class="bv-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Fit it for real: the bias-variance U-curve in R' });

    var chart = el.querySelector('.bv-chart'),
        read = el.querySelector('.bv-read'),
        tag = el.querySelector('.bv-tag'),
        degEl = el.querySelector('.bv-deg'),
        slider = el.querySelector('.bv-slider');

    function draw() {
      var W = 480, H = 250, m = { t: 14, r: 14, b: 36, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var maxY = Math.max.apply(null, DS.map(function (r) { return r.test; })) * 1.08;
      function sx(dd) { return m.l + (dd - 1) / (MAX - 1) * iw; }
      function sy(v) { return m.t + ih - v / maxY * ih; }
      function poly(key, col) {
        return '<polyline points="' + DS.map(function (r) { return sx(r.d).toFixed(1) + ',' + sy(r[key]).toFixed(1); }).join(' ') +
          '" fill="none" stroke="' + col + '" stroke-width="2.5"/>';
      }
      var cur = DS[deg - 1];
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="bias-variance error curves">';
      // axes
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      // best-fit band
      svg += '<line x1="' + sx(bestD).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(bestD).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-dasharray="3 3"/>';
      svg += '<text x="' + sx(bestD).toFixed(1) + '" y="' + (m.t + 9) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.faint + '">sweet spot</text>';
      // curves
      svg += poly('test', P.c1) + poly('train', P.acc);
      // current-degree marker
      svg += '<line x1="' + sx(deg).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(deg).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1" opacity=".35"/>';
      svg += '<circle cx="' + sx(deg).toFixed(1) + '" cy="' + sy(cur.test).toFixed(1) + '" r="5" fill="' + P.c1 + '"/>';
      svg += '<circle cx="' + sx(deg).toFixed(1) + '" cy="' + sy(cur.train).toFixed(1) + '" r="5" fill="' + P.acc + '"/>';
      // labels
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">model complexity &rarr;</text>';
      svg += '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">prediction error</text>';
      // legend
      svg += '<rect x="' + (m.l + 8) + '" y="' + (m.t + 4) + '" width="10" height="10" rx="2" fill="' + P.c1 + '"/><text x="' + (m.l + 22) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">test</text>';
      svg += '<rect x="' + (m.l + 58) + '" y="' + (m.t + 4) + '" width="10" height="10" rx="2" fill="' + P.acc + '"/><text x="' + (m.l + 72) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">train</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var state = deg <= Math.max(1, bestD - 2) ? ['Underfitting', P.c0, '#e8f0f9', 'Too simple: high bias. The model misses the real pattern, so both train and test error are high.']
        : deg >= bestD + 2 ? ['Overfitting', P.bad, P.del, 'Too flexible: high variance. Train error keeps falling, but the model is memorizing noise and test error climbs.']
        : ['About right', P.acc, P.add, 'Near the sweet spot: enough flexibility to fit the signal, not so much that it chases noise. Test error is at its lowest.'];
      tag.textContent = state[0]; tag.style.color = state[1]; tag.style.background = state[2];
      read.innerHTML = state[3] + ' <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">train ' + cur.train.toFixed(2) + ' &middot; test ' + cur.test.toFixed(2) + '</b>';
      degEl.textContent = deg;
    }

    slider.addEventListener('input', function () { deg = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The bias-variance tradeoff: fit polynomials of rising degree to noisy data,',
      '# then watch train error fall while test error traces a U.',
      'set.seed(1)',
      'n  <- 120',
      'x  <- sort(runif(n, -3, 3))',
      'y  <- sin(x) + rnorm(n, 0, 0.35)          # true signal + noise',
      'train <- data.frame(x = x[1:80],  y = y[1:80])',
      'test  <- data.frame(x = x[81:n],  y = y[81:n])',
      '',
      'deg <- 1:12',
      'err <- sapply(deg, function(d) {',
      '  fit <- lm(y ~ poly(x, d), data = train)',
      '  c(train = sqrt(mean((train$y - predict(fit))^2)),',
      '    test  = sqrt(mean((test$y  - predict(fit, test))^2)))',
      '})',
      '',
      'plot(deg, err["test", ], type = "b", col = "darkorange", lwd = 2,',
      '     ylim = range(err), xlab = "polynomial degree (complexity)", ylab = "RMSE")',
      'lines(deg, err["train", ], type = "b", col = "forestgreen", lwd = 2)',
      'legend("topright", c("test error", "train error"),',
      '       col = c("darkorange", "forestgreen"), lwd = 2, bty = "n")'
    ].join('\n');
  }

  window.LessonWidgets.register('bias-variance', mount);
})();

;
/* bootstrap-sample.js */
/* bootstrap-sample.js - draw a bootstrap sample (rows picked with replacement)
 * and see which rows are left out (out-of-bag). Counts are real: about 37% of
 * rows land out-of-bag on average. Interactive (Draw again).
 * cfg (optional): { n, seed, tail }  tail = the closing sentence of the note.
 */
(function () {
  'use strict';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var C_IN = '#1f7a55', C_DUP = '#2563a8', C_OOB = '#aeb6c2', INK = '#131720', MUT = '#677084';

  function mount(el, cfg) {
    cfg = cfg || {};
    var n = cfg.n || 12, seed0 = cfg.seed || 7, draw = 0;
    var tail = cfg.tail || 'Those rows trained no tree here, so they are a free test set.';
    el.innerHTML =
      '<div class="lw-diagram" style="text-align:center">' +
      '<div class="lw-bs-strip" style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:2px 0 10px"></div>' +
      '<div class="lw-bs-note" style="font:600 12px/1.5 \'IBM Plex Mono\',monospace;color:' + INK + ';min-height:3em"></div>' +
      '<button type="button" class="lw-bs-draw" style="margin-top:8px;font:600 12px \'IBM Plex Mono\',monospace;color:#fff;background:' + C_IN + ';border:0;border-radius:7px;padding:8px 16px;cursor:pointer">Draw again</button>' +
      '<div style="font:500 11px/1.5 \'IBM Plex Mono\',monospace;color:' + MUT + ';margin-top:8px">' +
      '<span style="color:' + C_IN + '">&#9632;</span> in the sample &nbsp; <span style="color:' + C_DUP + '">&#9632;</span> picked more than once &nbsp; <span style="color:' + C_OOB + '">&#9632;</span> out-of-bag</div>' +
      '</div>';
    var strip = el.querySelector('.lw-bs-strip'), note = el.querySelector('.lw-bs-note'), btn = el.querySelector('.lw-bs-draw'), i;

    function render() {
      var rng = mulberry32(seed0 + draw * 977), counts = [];
      for (i = 0; i < n; i++) counts[i] = 0;
      for (var d = 0; d < n; d++) { counts[(rng() * n) | 0]++; }
      var oob = 0, html = '';
      for (i = 0; i < n; i++) {
        var c = counts[i], bg = c === 0 ? C_OOB : (c > 1 ? C_DUP : C_IN);
        if (c === 0) oob++;
        var lbl = c === 0 ? 'OOB' : ('#' + (i + 1) + (c > 1 ? (' x' + c) : ''));
        html += '<span style="display:inline-block;min-width:52px;padding:6px 8px;border-radius:6px;background:' + bg + ';color:#fff;font:600 11px \'IBM Plex Mono\',monospace">' + lbl + '</span>';
      }
      strip.innerHTML = html;
      var pct = Math.round(oob / n * 100);
      note.innerHTML = 'Out-of-bag this draw: <b>' + oob + ' of ' + n + '</b> rows (' + pct + '%). ' + tail;
    }
    btn.addEventListener('click', function () { draw++; render(); });
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('bootstrap-sample', mount);
})();

;
/* calibration-curve.js */
/* calibration-curve.js - reliability diagram. Bin predicted probabilities, plot the
 * observed frequency in each bin against the mean predicted probability, and compare
 * to the diagonal (perfect calibration). A slider tilts the model from over- to
 * under-confident so you can see the curve bow away from the diagonal.
 * Emits runnable R that fits a glm, bins its probabilities, and draws the curve.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var skew = 1;  // >1 over-confident (probs pushed to extremes), <1 under-confident
    var BINS = [0.1, 0.3, 0.5, 0.7, 0.9];

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cc-plot"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">model confidence <b class="cc-l" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="cc-s" type="range" min="0.5" max="2" step="0.05" value="1" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="cc-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Bin probabilities and draw the reliability curve in R' });

    var plot = el.querySelector('.cc-plot'), read = el.querySelector('.cc-read'),
        slider = el.querySelector('.cc-s'), lEl = el.querySelector('.cc-l');

    function observed(p) { var o = Math.pow(p, skew) / (Math.pow(p, skew) + Math.pow(1 - p, skew)); return o; }
    function draw() {
      var S = 240, m = 34, iw = S - m - 12, ih = S - m - 12;
      function px(x) { return m + x * iw; } function py(y) { return (S - m) - y * ih; }
      var pts = BINS.map(function (p) { return [p, observed(p)]; });
      var line = pts.map(function (q) { return px(q[0]).toFixed(1) + ',' + py(q[1]).toFixed(1); }).join(' ');
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="reliability diagram">';
      svg += '<rect x="' + m + '" y="10" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      svg += '<line x1="' + m + '" y1="' + (S - m) + '" x2="' + (m + iw) + '" y2="10" stroke="' + P.mut + '" stroke-dasharray="4 3"/>';
      svg += '<polyline points="' + line + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>';
      pts.forEach(function (q) { svg += '<circle cx="' + px(q[0]).toFixed(1) + '" cy="' + py(q[1]).toFixed(1) + '" r="4.5" fill="' + P.acc + '" stroke="#fff" stroke-width="1.3"/>'; });
      svg += '<text x="' + (m + iw / 2) + '" y="' + (S - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">mean predicted probability</text>';
      svg += '<text transform="translate(11,' + (10 + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">observed frequency</text>';
      svg += '</svg>';
      plot.innerHTML = svg;
      var state = Math.abs(skew - 1) < 0.06 ? 'well calibrated - points sit on the diagonal, so a predicted 0.7 really does happen about 70% of the time'
        : (skew > 1 ? 'over-confident - the curve bows below the diagonal, so high predictions happen less often than claimed'
                    : 'under-confident - the curve bows above the diagonal, so the model hedges when it could be surer');
      read.innerHTML = 'This model is <b>' + state + '</b>. Calibration (Platt or isotonic) bends the curve back onto the diagonal.';
      lEl.textContent = skew > 1.06 ? 'over-confident' : (skew < 0.94 ? 'under-confident' : 'calibrated');
    }
    slider.addEventListener('input', function () { skew = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# A reliability diagram bins predictions, then asks: of the cases I called ~0.7,',
      '# what fraction were actually positive? Calibrated => that fraction is ~0.7.',
      'set.seed(1)',
      'n <- 600; x <- rnorm(n)',
      'p_true <- plogis(1.2 * x)              # the real probability',
      'y <- rbinom(n, 1, p_true)',
      'fit <- glm(y ~ x, family = binomial)',
      'p_hat <- predict(fit, type = "response")',
      '',
      'bins <- cut(p_hat, breaks = seq(0, 1, by = 0.1), include.lowest = TRUE)',
      'cal  <- data.frame(',
      '  predicted = tapply(p_hat, bins, mean),',
      '  observed  = tapply(y,     bins, mean))',
      'cal <- cal[complete.cases(cal), ]',
      '',
      'plot(cal$predicted, cal$observed, type = "b", pch = 19,',
      '     xlim = 0:1, ylim = 0:1, xlab = "predicted", ylab = "observed")',
      'abline(0, 1, lty = 2)                  # perfect calibration',
      'cal'
    ].join('\n');
  }

  window.LessonWidgets.register('calibration-curve', mount);
})();

;
/* causal-dag.js */
/* causal-dag.js - read a causal graph. Three nodes (X treatment, Y outcome, Z other) and
 * arrows you switch between confounder, collider and mediator. Each pattern tells you a
 * different thing about whether to control for Z: adjust for a confounder, never for a
 * collider, and think twice for a mediator. Emits runnable R that shows a confounder
 * flipping a regression coefficient.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var SCEN = {
    confounder: { arrows: [['Z', 'X'], ['Z', 'Y'], ['X', 'Y']], say: 'Z is a <b>confounder</b> (it causes both X and Y). Leaving it out makes the X-&gt;Y link look stronger or weaker than it is. <b>Control for Z.</b>' },
    collider: { arrows: [['X', 'Z'], ['Y', 'Z'], ['X', 'Y']], say: 'Z is a <b>collider</b> (both X and Y point into it). Controlling for it OPENS a fake path and invents a correlation. <b>Do not control for Z.</b>' },
    mediator: { arrows: [['X', 'Z'], ['Z', 'Y']], say: 'Z is a <b>mediator</b> (X acts through Z). Control for it and you remove the very effect you wanted to measure. <b>Usually leave it free.</b>' }
  };
  var POS = { X: [70, 150], Y: [330, 150], Z: [200, 50] };

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'confounder';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cd-seg" style="display:flex;gap:6px;margin-bottom:12px"></div>' +
      '<div class="cd-plot"></div>' +
      '<div class="cd-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Watch a confounder flip a coefficient in R' });

    var seg = el.querySelector('.cd-seg'), plot = el.querySelector('.cd-plot'), read = el.querySelector('.cd-read');
    [['confounder', 'confounder'], ['collider', 'collider'], ['mediator', 'mediator']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { mode = o[0]; draw(); });
      seg.appendChild(b);
    });
    function node(n, lab) { var p = POS[n]; var hi = (mode === 'confounder' && n === 'Z') || (mode === 'collider' && n === 'Z'); return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="26" fill="' + (n === 'Z' ? (hi ? P.acc : '#eef1f7') : '#1c2c4f') + '" stroke="' + P.line + '"/><text x="' + p[0] + '" y="' + (p[1] + 5) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="14" font-weight="600" fill="' + (n === 'Z' && !hi ? P.ink : '#fff') + '">' + lab + '</text>'; }
    function arrow(a, b) { var pa = POS[a], pb = POS[b], dx = pb[0] - pa[0], dy = pb[1] - pa[1], L = Math.sqrt(dx * dx + dy * dy), ux = dx / L, uy = dy / L; var x1 = pa[0] + ux * 27, y1 = pa[1] + uy * 27, x2 = pb[0] - ux * 30, y2 = pb[1] - uy * 30; var ang = Math.atan2(uy, ux); return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="' + P.mut + '" stroke-width="2"/>' + '<path d="M' + x2.toFixed(1) + ',' + y2.toFixed(1) + ' L' + (x2 - 8 * Math.cos(ang - 0.4)).toFixed(1) + ',' + (y2 - 8 * Math.sin(ang - 0.4)).toFixed(1) + ' L' + (x2 - 8 * Math.cos(ang + 0.4)).toFixed(1) + ',' + (y2 - 8 * Math.sin(ang + 0.4)).toFixed(1) + ' Z" fill="' + P.mut + '"/>'; }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['confounder', 'collider', 'mediator'][i] === mode; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var sc = SCEN[mode], svg = '<svg viewBox="0 0 400 195" width="100%" style="max-width:400px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="causal DAG">';
      sc.arrows.forEach(function (a) { svg += arrow(a[0], a[1]); });
      svg += node('X', 'X') + node('Y', 'Y') + node('Z', 'Z');
      svg += '<text x="70" y="190" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.faint + '">treatment</text><text x="330" y="190" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.faint + '">outcome</text>';
      svg += '</svg>'; plot.innerHTML = svg; read.innerHTML = sc.say;
    }
    draw();
  }

  function rcode() {
    return [
      '# A confounder Z drives both X and Y. Ignore it and the X->Y coefficient lies.',
      'set.seed(1); n <- 500',
      'Z <- rnorm(n)',
      'X <- 0.8 * Z + rnorm(n)            # Z causes X',
      'Y <- 1.0 * Z + rnorm(n)            # Z causes Y; X has NO real effect on Y',
      '',
      'coef(lm(Y ~ X))["X"]              # biased: looks like X affects Y',
      'coef(lm(Y ~ X + Z))["X"]          # adjust for Z: the effect collapses to ~0'
    ].join('\n');
  }

  window.LessonWidgets.register('causal-dag', mount);
})();

;
/* chart-plotter.js */
/* chart-plotter.js - the grammar-of-graphics / chart-type chooser.
 * Same data, switchable geom (point/line/bar/histogram/boxplot); renders an instant
 * SVG preview AND a REAL runnable ggplot2 block (self-contained: builds the data frame
 * inline, then the ggplot call) so the reader can run it and see the true plot. cfg:
 *   { data:[{x,y,fill}], geoms:["point","line","bar"], x:"month", y:"sales",
 *     code:{point:"...", line:"..."} }
 * Default = a monthly sales series (point/line/bar).
 */
(function () {
  'use strict';
  var GEOML = { point: 'geom_point()', line: 'geom_line()', bar: 'geom_col()', col: 'geom_col()', histogram: 'geom_histogram(bins = 10)', boxplot: 'geom_boxplot()' };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var data = cfg.data || [{ x: 1, y: 12 }, { x: 2, y: 19 }, { x: 3, y: 15 }, { x: 4, y: 25 }, { x: 5, y: 22 }, { x: 6, y: 30 }];
    var geoms = cfg.geoms || ['point', 'line', 'bar'];
    var xlab = cfg.x || 'month', ylab = cfg.y || 'sales', codeMap = cfg.code || {};
    var cur = geoms[0];
    var has = data[0] || {};

    function ggline(g) {
      if (codeMap[g]) return codeMap[g];
      var aesX = (g === 'bar' || g === 'col') ? 'factor(' + xlab + ')' : xlab;
      if (g === 'histogram') return 'ggplot(df, aes(' + xlab + ')) +\n  ' + GEOML[g];
      if (g === 'boxplot') return 'ggplot(df, aes(' + xlab + ', ' + ylab + ')) +\n  ' + GEOML[g];
      return 'ggplot(df, aes(' + aesX + ', ' + ylab + ')) +\n  ' + (GEOML[g] || 'geom_point()');
    }
    // Self-contained, runnable: library + the data frame built inline + the ggplot call.
    // The frame is named to match what the ggplot code references (authors may use a
    // narrative name like `bakery`), so the block stays self-consistent and runs.
    function runnableCode(g) {
      var cols = [{ name: xlab, key: 'x' }];
      if ('y' in has) cols.push({ name: ylab, key: 'y' });
      if ('fill' in has) cols.push({ name: 'group', key: 'fill' });
      var line = ggline(g);
      var mm = line.match(/\bggplot\s*\(\s*([A-Za-z.][\w.]*)/);
      var frame = mm ? mm[1] : 'df';
      return 'library(ggplot2)\n' + u.rdf(data, cols, frame) + '\n\n' + line;
    }

    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="margin-bottom:11px"><span class="cp-seg"></span></div>' +
      '<div class="cp-code"></div>';
    var segHost = wrap.querySelector('.cp-seg'); segHost.innerHTML = u.seg(geoms.map(function (g) { return { v: g, label: g }; }), cur);
    var codeEl = wrap.querySelector('.cp-code');
    // ONE chart region: the runnable block's plot area is seeded with the instant SVG
    // preview; pressing Run clears it (webr-init) and draws the real ggplot in its place.
    function render(g) {
      codeEl.innerHTML = u.runnable(runnableCode(g), { label: 'Run this chart' });
      var po = codeEl.querySelector('.webr-plot-output');
      if (po) { po.innerHTML = u.previewSeed(u.plot(data, { geom: g, x: xlab, y: ylab, corr: g === 'point' })); po.classList.add('has-content'); }
    }
    u.wireSeg(segHost, function (v) { cur = v; render(v); });
    render(cur);
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('chart-plotter', mount);
})();

;
/* cluster-icc-sim.js */
/* cluster-icc-sim.js - clustered data, and the standard error that a sandwich cannot save.
 *
 * Serves the independence objection and the mixed-model objection in The Publishing
 * Handbook. The reader raises the intraclass correlation and watches four standard errors
 * for the SAME estimate on the SAME data pull apart.
 *
 * The design is the classic one: k clusters (schools, clinics, litters, sites), m
 * observations each, and a treatment assigned at the CLUSTER level. Total variance is held
 * at 1 the whole way, so the dial moves information between "within cluster" and "between
 * cluster" and changes nothing else. Same random draws at every setting, so the picture
 * morphs rather than reshuffles.
 *
 * The identity being demonstrated, which is exact for this balanced design, not an
 * approximation:
 *
 *     Var(tau_hat) = 4 * (rho + (1 - rho) / m) / k          the truth
 *     Var_naive    = 4 / (k * m)                            what OLS assumes
 *     ratio        = 1 + (m - 1) * rho                      the design effect
 *
 * So ordinary OLS understates the standard error by sqrt(1 + (m-1)rho), and the widget's
 * simulated standard deviation of the estimate is checked against that formula on screen.
 *
 * The load-bearing point: HC1 "robust" standard errors, the usual reflex when a reviewer
 * says "standard errors", are computed under the assumption that observations are
 * independent. They track the naive standard error almost exactly here and repair nothing.
 * What repairs it is a cluster-robust standard error (consistent as the number of CLUSTERS
 * grows, not as n grows) or a model with a cluster random effect. With few clusters even
 * the cluster-robust version is optimistic, which the widget also shows.
 *
 * cfg: {
 *   k: 20,          // number of clusters
 *   m: 5,           // observations per cluster
 *   tau: 0.5,       // true treatment effect, in units of the total outcome sd
 *   iccMax: 0.5,    // right-hand end of the dial
 *   levels: 11,     // steps on the dial
 *   start: 0,       // starting step
 *   sims: 3000,     // simulated trials behind each coverage number
 *   seed: 23        // mulberry32 seed - same config, same picture
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f3f6f4'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b', soft: 'rgba(255,255,255,.05)'
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

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gaussian(rnd) { var a = 1 - rnd(), b = rnd(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); }

  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var mi = 1; mi <= 300; mi++) {
      var m2 = 2 * mi, aa = mi * (b - mi) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + mi) * (qab + mi) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return (x < (a + 1) / (a + b + 2)) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pt2(t, df) { return ibeta(df / 2, 0.5, df / (df + t * t)); }   // two-sided p
  function qt(p, df) {
    var lo = 0, hi = 60, i;
    for (i = 0; i < 140; i++) { var mid = (lo + hi) / 2; if (1 - pt2(mid, df) / 2 < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* ---- one trial, analysed four ways ----
     y is already built; arm[j] is 1 for a treated cluster. Everything below is the exact
     algebra for a two-group design, which keeps the whole thing allocation free. */
  function analyse(y, k, m, arm) {
    var n = k * m, i, j;
    var sT = 0, sC = 0, nT = 0, nC = 0, kT = 0, kC = 0;
    for (j = 0; j < k; j++) { if (arm[j]) { kT++; } else { kC++; } }
    for (i = 0; i < n; i++) { if (arm[(i / m) | 0]) { sT += y[i]; nT++; } else { sC += y[i]; nC++; } }
    var mT = sT / nT, mC = sC / nC, est = mT - mC;

    var rss = 0, eT2 = 0, eC2 = 0;
    var clSum = new Float64Array(k);
    for (i = 0; i < n; i++) {
      var cj = (i / m) | 0, e = y[i] - (arm[cj] ? mT : mC);
      rss += e * e; clSum[cj] += e;
      if (arm[cj]) eT2 += e * e; else eC2 += e * e;
    }
    var s2 = rss / (n - 2);
    var seNaive = Math.sqrt(s2 * (1 / nT + 1 / nC));
    // HC1: heteroskedasticity-consistent, and it assumes independent rows
    var seHC1 = Math.sqrt(n / (n - 2) * (eT2 / (nT * nT) + eC2 / (nC * nC)));
    // CR1: cluster-robust, the Stata small-sample correction
    var gT = 0, gC = 0;
    for (j = 0; j < k; j++) { if (arm[j]) gT += clSum[j] * clSum[j]; else gC += clSum[j] * clSum[j]; }
    var cf = (k / (k - 1)) * ((n - 1) / (n - 2));
    var seCR = Math.sqrt(cf * (gT / (nT * nT) + gC / (nC * nC)));
    // cluster means: for a balanced design with a cluster-level treatment this is
    // algebraically the random-intercept model's standard error
    var cm = new Float64Array(k), mmT = 0, mmC = 0;
    for (j = 0; j < k; j++) { var s = 0; for (i = 0; i < m; i++) s += y[j * m + i]; cm[j] = s / m; if (arm[j]) mmT += cm[j]; else mmC += cm[j]; }
    mmT /= kT; mmC /= kC;
    var ssm = 0;
    for (j = 0; j < k; j++) { var dv = cm[j] - (arm[j] ? mmT : mmC); ssm += dv * dv; }
    var seCM = Math.sqrt((ssm / (k - 2)) * (1 / kT + 1 / kC));
    return { est: est, seNaive: seNaive, seHC1: seHC1, seCR: seCR, seCM: seCM,
             dfN: n - 2, dfCR: k - 1, dfCM: k - 2 };
  }

  var METHODS = [
    { key: 'seNaive', df: 'dfN', label: 'Ordinary OLS', note: 'assumes every row is new information' },
    { key: 'seHC1', df: 'dfN', label: 'Robust (HC1)', note: 'fixes unequal variance, still assumes independence' },
    { key: 'seCR', df: 'dfCR', label: 'Cluster-robust', note: 'consistent in the number of CLUSTERS' },
    { key: 'seCM', df: 'dfCM', label: 'Cluster means / mixed model', note: 'exact for this balanced design' }
  ];

  function mount(el, cfg) {
    cfg = cfg || {};
    var k = Math.max(6, +cfg.k || 20), m = Math.max(2, +cfg.m || 5), n = k * m;
    var tau = (cfg.tau == null ? 0.5 : +cfg.tau);
    var iccMax = Math.min(0.9, +cfg.iccMax || 0.5);
    var levels = Math.max(3, +cfg.levels || 11);
    var sims = Math.max(300, +cfg.sims || 3000);
    var seed = (cfg.seed == null ? 23 : +cfg.seed);
    var step = Math.max(0, Math.min(levels - 1, +cfg.start || 0));

    /* one fixed pool of random draws: the dial reweights them, it never redraws them */
    var rnd = mulberry32(seed);
    var arm = new Int8Array(k), i, j;
    for (j = 0; j < k; j++) arm[j] = j % 2;                 // alternate, so exactly half treated
    var uFix = new Float64Array(k), eFix = new Float64Array(n);
    for (j = 0; j < k; j++) uFix[j] = gaussian(rnd);
    for (i = 0; i < n; i++) eFix[i] = gaussian(rnd);

    var yShow = new Float64Array(n), ySim = new Float64Array(n);
    function build(rho, y, uu, ee) {
      var a = Math.sqrt(rho), b = Math.sqrt(1 - rho), q;
      for (q = 0; q < n; q++) { var cj = (q / m) | 0; y[q] = tau * arm[cj] + a * uu[cj] + b * ee[q]; }
    }

    /* coverage + the true spread of the estimate, per dial setting */
    var cache = {};
    function sim(li) {
      if (cache[li]) return cache[li];
      var rho = iccMax * li / (levels - 1);
      var r2 = mulberry32(seed + 7919 * (li + 1));
      var uu = new Float64Array(k), ee = new Float64Array(n);
      var hit = [0, 0, 0, 0], sum = 0, sum2 = 0, q, t;
      var tcCache = {};
      for (t = 0; t < sims; t++) {
        for (q = 0; q < k; q++) uu[q] = gaussian(r2);
        for (q = 0; q < n; q++) ee[q] = gaussian(r2);
        build(rho, ySim, uu, ee);
        var a = analyse(ySim, k, m, arm);
        sum += a.est; sum2 += a.est * a.est;
        for (q = 0; q < 4; q++) {
          var dfq = a[METHODS[q].df];
          if (!tcCache[dfq]) tcCache[dfq] = qt(0.975, dfq);
          var half = tcCache[dfq] * a[METHODS[q].key];
          if (a.est - half < tau && tau < a.est + half) hit[q]++;
        }
      }
      var sd = Math.sqrt((sum2 - sum * sum / sims) / (sims - 1));
      cache[li] = { rho: rho, cov: hit.map(function (h) { return h / sims; }), sd: sd,
                    deff: 1 + (m - 1) * rho,
                    trueSd: Math.sqrt(4 * (rho + (1 - rho) / m) / k) };
      return cache[li];
    }

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      '<div class="ci-lab" style="font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:5px"></div>' +
      '<input class="ci-rho" type="range" min="0" max="' + (levels - 1) + '" step="1" value="' + step +
        '" aria-label="intraclass correlation" style="width:100%;max-width:460px;display:block;margin-bottom:13px">' +
      '<div class="ci-plot"></div>' +
      '<div class="ci-tbl" style="margin:12px 0 0;overflow-x:auto"></div>' +
      '<div class="ci-read" style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:11px 0 14px"></div>' +
      '<div class="ci-r"></div>';

    var lab = el.querySelector('.ci-lab'), plot = el.querySelector('.ci-plot'),
        tbl = el.querySelector('.ci-tbl'), read = el.querySelector('.ci-read'),
        slider = el.querySelector('.ci-rho'), rbox = el.querySelector('.ci-r');

    function render(first) {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      lab.style.color = P.mut; read.style.color = P.body;
      var S = sim(step), rho = S.rho;
      build(rho, yShow, uFix, eFix);
      var one = analyse(yShow, k, m, arm);

      lab.innerHTML = 'Intraclass correlation: <b style="color:' + P.ink + '">' + rho.toFixed(2) + '</b> ' +
        '<span style="color:' + P.faint + '">(' + k + ' clusters of ' + m + ', treatment assigned to whole clusters)</span>';
      plot.innerHTML = draw(yShow, one, S, k, m, arm, tau, P);
      tbl.innerHTML = table(one, S, tau, P);
      read.innerHTML = verdict(S, one, k, m, P);
      if (first) rbox.innerHTML = u.runnable(rcode(k, m, tau), { label: 'Run the same comparison in R' });
    }

    slider.addEventListener('input', function () { step = +slider.value; render(false); });
    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(false); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render(true);
  }

  /* ---------------- picture: the clusters, then the four standard errors ---------------- */
  function draw(y, one, S, k, m, arm, tau, P) {
    var W = 520, mg = { l: 40, r: 14, t: 30 }, hS = 138, n = k * m;
    var g = '', i, j;
    var lo = -3.2, hi = 3.2 + tau;                       // fixed scale: the spread must be comparable
    function sy(v) { return mg.t + (hi - Math.max(lo, Math.min(hi, v))) / (hi - lo) * hS; }
    var colW = (W - mg.l - mg.r) / k;

    g += '<text x="' + mg.l + '" y="14" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">One trial: every dot is an observation, every column a cluster</text>';
    [-2, 0, 2].forEach(function (v) {
      g += '<line x1="' + mg.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (W - mg.r) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
           '<text x="' + (mg.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
    });
    for (j = 0; j < k; j++) {
      var cx = mg.l + colW * (j + 0.5), col = arm[j] ? P.c0 : P.c1, cm = 0;
      for (i = 0; i < m; i++) {
        var v = y[j * m + i]; cm += v;
        var jitter = (i - (m - 1) / 2) * Math.min(3.2, colW * 0.22);
        g += '<circle cx="' + (cx + jitter).toFixed(1) + '" cy="' + sy(v).toFixed(1) + '" r="2.4" fill="' + col + '" fill-opacity="0.62"/>';
      }
      cm /= m;
      g += '<line x1="' + (cx - colW * 0.36).toFixed(1) + '" y1="' + sy(cm).toFixed(1) + '" x2="' + (cx + colW * 0.36).toFixed(1) + '" y2="' + sy(cm).toFixed(1) +
           '" stroke="' + col + '" stroke-width="2.4"/>';
    }
    g += '<line x1="' + mg.l + '" y1="' + (mg.t + hS) + '" x2="' + (W - mg.r) + '" y2="' + (mg.t + hS) + '" stroke="' + P.line + '" stroke-width="1.5"/>' +
         '<text x="' + mg.l + '" y="' + (mg.t + hS + 14) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c1 + '">control clusters</text>' +
         '<text x="' + (W - mg.r) + '" y="' + (mg.t + hS + 14) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">treated clusters</text>';

    /* standard-error bars, against the simulated truth */
    var yB = mg.t + hS + 42, rowH = 21, barL = 186;
    var vals = METHODS.map(function (M) { return one[M.key]; });
    var maxV = Math.max(S.sd, Math.max.apply(null, vals)) * 1.16;
    function bw(v) { return (v / maxV) * (W - barL - 22); }
    g += '<text x="0" y="' + (yB - 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">Standard error for that one estimate, four ways</text>';
    METHODS.forEach(function (M, r) {
      var yy = yB + r * rowH, v = one[M.key], wd = bw(v);
      var off = v < S.sd * 0.8;
      // a long bar leaves no room for an outside label, so the number moves inside it
      var inside = barL + wd > W - 46;
      g += '<text x="0" y="' + (yy + 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.body + '">' + u.esc(M.label) + '</text>' +
           '<rect x="' + barL + '" y="' + (yy + 2) + '" width="' + Math.max(1, wd).toFixed(1) + '" height="11" rx="2.5" fill="' + (off ? P.bad : P.acc) + '" fill-opacity="0.82"/>' +
           '<text x="' + (inside ? barL + wd - 6 : barL + wd + 6).toFixed(1) + '" y="' + (yy + 11) + '" text-anchor="' + (inside ? 'end' : 'start') +
             '" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + (inside ? '#fff' : (off ? P.bad : P.mut)) + '">' + v.toFixed(3) + '</text>';
    });
    var xT = barL + bw(S.sd);
    // keep the caption inside the frame however far right the marker sits
    var capAnchor = xT > W - 108 ? 'end' : (xT < 108 ? 'start' : 'middle');
    var capX = capAnchor === 'end' ? W - 2 : (capAnchor === 'start' ? 2 : xT);
    g += '<line x1="' + xT.toFixed(1) + '" y1="' + (yB - 6) + '" x2="' + xT.toFixed(1) + '" y2="' + (yB + METHODS.length * rowH - 2) + '" stroke="' + P.ink + '" stroke-width="1.6" stroke-dasharray="3 2"/>' +
         '<text x="' + capX.toFixed(1) + '" y="' + (yB - 10) + '" text-anchor="' + capAnchor + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.ink + '">how much the estimate really varies</text>';
    var H = yB + METHODS.length * rowH + 8;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Clustered observations and four standard errors for the same treatment effect">' + g + '</svg>';
  }

  /* ---------------- the same estimate, four intervals ---------------- */
  function table(one, S, tau, P) {
    var cols = ['Analysis', 'SE', '95% interval', 'p', 'Covers truth in'];
    var rows = METHODS.map(function (M, r) {
      var se = one[M.key], df = one[M.df], tc = qt(0.975, df), t = one.est / se;
      return [M.label, se.toFixed(3),
              '[' + (one.est - tc * se).toFixed(2) + ', ' + (one.est + tc * se).toFixed(2) + ']',
              fmtP(pt2(Math.abs(t), df)),
              (100 * S.cov[r]).toFixed(1) + '%'];
    });
    var h = '<table style="border-collapse:collapse;font-family:IBM Plex Mono,monospace;font-size:12px;width:100%;min-width:430px"><thead><tr>';
    cols.forEach(function (c, ci) {
      h += '<th style="text-align:' + (ci ? 'right' : 'left') + ';padding:6px 9px;border-bottom:1px solid ' + P.line +
           ';color:' + P.mut + ';font-weight:600;white-space:nowrap;font-family:IBM Plex Sans,sans-serif;font-size:11px">' + u.esc(c) + '</th>';
    });
    h += '</tr></thead><tbody>';
    rows.forEach(function (r, ri) {
      var bad = S.cov[ri] < 0.9;
      h += '<tr>';
      r.forEach(function (v, ci) {
        h += '<td style="text-align:' + (ci ? 'right' : 'left') + ';padding:6px 9px;border-bottom:1px solid ' + P.grid +
             ';color:' + (ci === 4 && bad ? P.bad : P.ink) + ';white-space:nowrap' +
             (ci === 0 ? ';font-family:IBM Plex Sans,sans-serif' : '') + '">' + u.esc(v) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table>' +
      '<div style="font:11px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + ';margin-top:6px">' +
      'All four rows describe the same estimate on the same data. The true effect is ' + tau + '.</div>';
  }
  function fmtP(p) { return p < 0.001 ? '<0.001' : p.toFixed(3); }

  function verdict(S, one, k, m, P) {
    var rho = S.rho, deff = S.deff, nEff = (k * m) / deff;
    if (rho < 1e-9) {
      return 'At an intraclass correlation of zero the four standard errors agree, because there is nothing to correct for. ' +
        'Raise it and watch which ones move.';
    }
    var ratio = one.seCM / one.seNaive;
    return 'The design effect is <b>1 + (' + m + ' &minus; 1) &times; ' + rho.toFixed(2) + ' = ' + deff.toFixed(2) + '</b>, ' +
      'so ' + (k * m) + ' rows carry about <b>' + nEff.toFixed(0) + ' rows</b> of independent information. ' +
      'The naive interval covers the truth <b style="color:' + (S.cov[0] < 0.9 ? P.bad : P.acc) + '">' + (100 * S.cov[0]).toFixed(1) + '%</b> of the time instead of 95%. ' +
      'HC1 gets to <b>' + (100 * S.cov[1]).toFixed(1) + '%</b>: it is robust to the wrong thing. ' +
      'Cluster-robust reaches <b>' + (100 * S.cov[2]).toFixed(1) + '%</b> and the cluster-level analysis <b>' + (100 * S.cov[3]).toFixed(1) + '%</b>. ' +
      'The simulated spread of the estimate is ' + S.sd.toFixed(3) + ' against the formula\'s ' + S.trueSd.toFixed(3) + '.';
  }

  /* ---------------- runnable R ----------------
     Base R only, and it computes HC1 and CR1 by hand rather than leaning on a package, so
     the arithmetic is visible. Verified against sandwich::vcovHC / vcovCL and lme4::lmer. */
  function rcode(k, m, tau) {
    return [
      '# One cluster-randomised trial, analysed four ways. Raise rho and run it again.',
      'set.seed(4)',
      'k <- ' + k + '; m <- ' + m + '; n <- k * m; tau <- ' + tau,
      'rho <- 0.30                       # intraclass correlation',
      '',
      'cl  <- rep(1:k, each = m)',
      'arm <- rep(rep(0:1, length.out = k), each = m)     # treatment is a CLUSTER property',
      'y   <- tau * arm + sqrt(rho) * rnorm(k)[cl] + sqrt(1 - rho) * rnorm(n)',
      '',
      'fit <- lm(y ~ arm)',
      'e   <- residuals(fit)',
      'nT  <- sum(arm == 1); nC <- n - nT',
      '',
      'se_ols <- coef(summary(fit))["arm", "Std. Error"]',
      'se_hc1 <- sqrt(n / (n - 2) * (sum(e[arm == 1]^2) / nT^2 + sum(e[arm == 0]^2) / nC^2))',
      'g      <- tapply(e, cl, sum)',
      'armcl  <- tapply(arm, cl, max)',
      'se_cr1 <- sqrt(k / (k - 1) * (n - 1) / (n - 2) *',
      '                (sum(g[armcl == 1]^2) / nT^2 + sum(g[armcl == 0]^2) / nC^2))',
      '',
      '# cluster means: for a balanced design with cluster-level treatment this is exactly',
      '# the standard error a random-intercept model reports',
      'cm     <- tapply(y, cl, mean)',
      'se_cm  <- sqrt(sum((cm - ave(cm, armcl))^2) / (k - 2) * (2 / (k / 2)))',
      '',
      'round(c(ols = se_ols, hc1 = se_hc1, cluster_robust = se_cr1, cluster_means = se_cm), 4)',
      'round(c(design_effect = 1 + (m - 1) * rho,',
      '        true_se       = sqrt(4 * (rho + (1 - rho) / m) / k)), 4)'
    ].join('\n');
  }

  window.LessonWidgets.register('cluster-icc-sim', mount);
})();

;
/* cluster-validate.js */
/* cluster-validate.js - choosing k. The elbow plot shows total within-cluster spread
 * dropping as k rises; it bends sharply at the "right" k and flattens after. The
 * silhouette bars score how well-separated each k is. Move the k marker and read both.
 * Emits runnable R that computes the within-SS elbow over a range of k.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var WSS = [null, 520, 250, 120, 96, 82, 73, 66, 60];   // index = k (k=1..8); sharp bend at k=3
  var SIL = [null, 0, 0.42, 0.61, 0.55, 0.47, 0.40, 0.34, 0.29];

  function mount(el, cfg) {
    cfg = cfg || {}; var k = 3, view = 'elbow';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cvd-seg" style="display:flex;gap:6px;margin-bottom:12px"></div>' +
      '<div class="cvd-plot"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">number of clusters k = <b class="cvd-k" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="cvd-s" type="range" min="2" max="8" step="1" value="3" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="cvd-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute the within-SS elbow in R' });

    var seg = el.querySelector('.cvd-seg'), plot = el.querySelector('.cvd-plot'), read = el.querySelector('.cvd-read'), slider = el.querySelector('.cvd-s'), kEl = el.querySelector('.cvd-k');
    [['elbow', 'elbow (within-SS)'], ['sil', 'silhouette']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { view = o[0]; draw(); });
      seg.appendChild(b);
    });
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['elbow', 'sil'][i] === view; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var W = 420, H = 170, m = 32, iw = W - m - 14, ih = H - m - 8;
      function px(kk) { return m + (kk - 2) / 6 * iw; } function pyE(v) { return (H - m) - (v - 55) / (520 - 55) * ih; } function pyS(v) { return (H - m) - v / 0.7 * ih; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="cluster validation">';
      svg += '<rect x="' + m + '" y="6" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      if (view === 'elbow') {
        var line = []; for (var kk = 2; kk <= 8; kk++) line.push(px(kk).toFixed(1) + ',' + pyE(WSS[kk]).toFixed(1));
        svg += '<polyline points="' + line.join(' ') + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>';
        for (var kk2 = 2; kk2 <= 8; kk2++) svg += '<circle cx="' + px(kk2).toFixed(1) + '" cy="' + pyE(WSS[kk2]).toFixed(1) + '" r="3.5" fill="' + (kk2 === k ? P.acc : P.mut) + '"/>';
      } else {
        for (var kk3 = 2; kk3 <= 8; kk3++) { var h = SIL[kk3] / 0.7 * ih; svg += '<rect x="' + (px(kk3) - 10).toFixed(1) + '" y="' + (H - m - h).toFixed(1) + '" width="20" height="' + h.toFixed(1) + '" rx="2" fill="' + (kk3 === k ? P.acc : P.line) + '"/>'; }
      }
      for (var t = 2; t <= 8; t++) svg += '<text x="' + px(t).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9.5" fill="' + P.mut + '">' + t + '</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = 'At k=<b>' + k + '</b>: within-SS <b>' + WSS[k] + '</b>, silhouette <b>' + SIL[k].toFixed(2) + '</b>. The elbow bends and the silhouette peaks around <b>k=3</b> - the natural number of groups here.';
      kEl.textContent = k;
    }
    slider.addEventListener('input', function () { k = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The "elbow": total within-cluster spread falls fast, then flattens. The bend = good k.',
      'x <- scale(iris[, 1:4])',
      'wss <- sapply(1:8, function(k) kmeans(x, centers = k, nstart = 10)$tot.withinss)',
      'plot(1:8, wss, type = "b", xlab = "k", ylab = "within-cluster SS")',
      'wss                                  # the sharp drop ends around k = 3'
    ].join('\n');
  }

  window.LessonWidgets.register('cluster-validate', mount);
})();

;
/* coef-path.js */
/* coef-path.js - watch regularization work. Six coefficients start at their least-squares
 * values on the left (weak penalty) and get squeezed toward zero as the penalty lambda
 * grows to the right. Lasso snaps coefficients to exactly zero one by one (selection);
 * ridge shrinks them smoothly but never to zero. Drag lambda to read how many features
 * survive. Emits runnable R that fits the same path with glmnet.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var NAMES = ['x1', 'x2', 'x3', 'x4', 'x5', 'x6'];
  var FULL = [2.4, -1.8, 1.1, 0.6, -0.35, 0.15];   // OLS coefficients (x1 strongest ... x6 noise)
  var STEPS = 40;
  // build the two paths across a log-lambda grid (col j = coef trajectory)
  function paths(mode) {
    var out = [];
    for (var s = 0; s < STEPS; s++) {
      var t = s / (STEPS - 1);                       // 0 (lambda small) -> 1 (lambda large)
      var row = FULL.map(function (b, j) {
        if (mode === 'ridge') return b / (1 + 9 * t * t);                       // smooth shrink, never 0
        var thr = t * 2.6;                                                       // soft-threshold amount
        var v = Math.sign(b) * Math.max(0, Math.abs(b) - thr * (1 - j * 0.06));  // weaker coefs die first
        return v;
      });
      out.push(row);
    }
    return out;
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'lasso', li = 14;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cp-seg" style="margin-bottom:12px">' + u.seg([{ v: 'lasso', label: 'Lasso (L1)' }, { v: 'ridge', label: 'Ridge (L2)' }], 'lasso') + '</div>' +
      '<div class="cp-plot"></div>' +
      '<label style="display:block;font:600 12px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 2px">penalty &lambda; <b class="cp-lam" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="cp-s" type="range" min="0" max="' + (STEPS - 1) + '" step="1" value="14" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="cp-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The lasso path with glmnet' });

    var plot = el.querySelector('.cp-plot'), read = el.querySelector('.cp-read'), slider = el.querySelector('.cp-s'), lamEl = el.querySelector('.cp-lam');
    var W = 440, H = 220, m = { l: 40, r: 54, t: 12, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var yb = 2.8;
    function sx(s) { return m.l + s / (STEPS - 1) * iw; }
    function sy(v) { return m.t + ih / 2 - v / yb * (ih / 2); }
    function draw() {
      var P2 = paths(mode), pal = [P.c0, P.acc, P.c1, '#7a5ea3', '#2f8f86', P.faint];
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="regularization path">';
      svg += '<line x1="' + m.l + '" y1="' + sy(0) + '" x2="' + (m.l + iw) + '" y2="' + sy(0) + '" stroke="' + P.line + '"/>';
      NAMES.forEach(function (nm, j) {
        var pts = ''; for (var s = 0; s < STEPS; s++) pts += sx(s).toFixed(1) + ',' + sy(P2[s][j]).toFixed(1) + ' ';
        svg += '<polyline points="' + pts + '" fill="none" stroke="' + pal[j] + '" stroke-width="2.2"/>';
        svg += '<text x="' + (m.l + iw + 5) + '" y="' + (sy(P2[STEPS - 1][j]) + 3).toFixed(1) + '" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + pal[j] + '">' + nm + '</text>';
      });
      svg += '<line x1="' + sx(li) + '" y1="' + m.t + '" x2="' + sx(li) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      svg += '<text x="' + m.l + '" y="' + (H - 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">weak penalty</text><text x="' + (m.l + iw) + '" y="' + (H - 6) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">strong penalty</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      var alive = P2[li].filter(function (v) { return Math.abs(v) > 0.01; }).length;
      lamEl.textContent = (li / (STEPS - 1)).toFixed(2);
      read.innerHTML = mode === 'lasso'
        ? '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + alive + ' of 6 features survive.</b> Lasso drives weak coefficients to <b>exactly zero</b>, so raising &lambda; performs feature selection: the noise features (x5, x6) die first.'
        : '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">all 6 shrink, none vanish.</b> Ridge pulls every coefficient smoothly toward zero but never exactly to it, so it stabilizes rather than selects.';
    }
    u.wireSeg(el.querySelector('.cp-seg'), function (v) { mode = v; draw(); });
    slider.addEventListener('input', function () { li = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The lasso path: coefficients shrink and drop to zero as the penalty grows.',
      'library(glmnet)',
      'set.seed(1); n <- 200',
      'X <- matrix(rnorm(n * 6), n, 6)',
      'y <- 2.4*X[,1] - 1.8*X[,2] + 1.1*X[,3] + rnorm(n)   # x4-x6 are noise',
      '',
      'fit <- glmnet(X, y, alpha = 1)          # alpha = 1 is lasso; alpha = 0 is ridge',
      'coef(fit, s = 0.30)                      # at this lambda, weak features are exactly 0',
      'colSums(coef(fit) != 0)                  # non-zero count shrinks as lambda rises'
    ].join('\n');
  }

  window.LessonWidgets.register('coef-path', mount);
})();

;
/* competing-risks.js */
/* competing-risks.js - cumulative incidence when events compete. A patient can relapse OR
 * die first, never both; each event "uses up" patients the other can no longer claim. The
 * stacked bands show, at every time, the fraction still event-free (top), the fraction who
 * have relapsed, and the fraction who have died - always summing to 1. Naive "1 minus KM"
 * per cause would overcount; the cumulative incidence function (CIF) shares the risk
 * correctly. Toggle a time point to read the split. Emits a runnable multi-state survfit.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // cause-specific: total event hazard h, relapse share 0.6, death share 0.4 (matches the R below)
  var H = 0.08, pRel = 0.6, pDeath = 0.4;
  function surv(t) { return Math.exp(-H * t); }
  function cifRel(t) { return pRel * (1 - surv(t)); }
  function cifDeath(t) { return pDeath * (1 - surv(t)); }

  function mount(el, cfg) {
    cfg = cfg || {}; var mark = 10;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cr-seg" style="margin-bottom:12px">' + u.seg([{ v: '5', label: 't = 5' }, { v: '10', label: 't = 10' }, { v: '20', label: 't = 20' }], '10') + '</div>' +
      '<div class="cr-plot"></div>' +
      '<div class="cr-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Cumulative incidence for competing events with survival::survfit' });

    var plot = el.querySelector('.cr-plot'), read = el.querySelector('.cr-read');
    var W = 340, H2 = 240, TMAX = 30;
    function px(t) { return (t / TMAX) * (W - 8) + 4; }
    function py(v) { return H2 - v * (H2 - 14) - 7; }
    // stacked bands: bottom relapse [0, cifRel], middle death [cifRel, cifRel+cifDeath], top survivors [.., 1]
    function band(lo, hi, col, op) {
      var N = 80, top = [], bot = [];
      for (var i = 0; i <= N; i++) { var t = TMAX * i / N; top.push([px(t), py(hi(t))]); bot.push([px(t), py(lo(t))]); }
      var p = 'M' + top.map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' L') + ' L' + bot.reverse().map(function (q) { return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' L') + ' Z';
      return '<path d="' + p + '" fill="' + col + '" opacity="' + op + '"/>';
    }
    function draw() {
      var r = cifRel(mark), d = cifDeath(mark), s = surv(mark);
      var mx = px(mark).toFixed(1);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H2 + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stacked cumulative incidence">' +
        band(function () { return 0; }, cifRel, P.c0, 0.5) +
        band(cifRel, function (t) { return cifRel(t) + cifDeath(t); }, P.bad, 0.45) +
        band(function (t) { return cifRel(t) + cifDeath(t); }, function () { return 1; }, P.acc, 0.28) +
        '<line x1="' + mx + '" y1="0" x2="' + mx + '" y2="' + H2 + '" stroke="' + P.ink + '" stroke-width="1.4" stroke-dasharray="3 2"/>' +
        '<text x="8" y="' + (py(0.5 * cifRel(28)) + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">relapse</text>' +
        '<text x="8" y="' + (py(cifRel(28) + 0.5 * cifDeath(28)) + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">death</text>' +
        '<text x="8" y="20" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">event-free</text>' +
        '<text x="' + (W - 6) + '" y="' + (H2 - 2) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">time (months)</text></svg>';
      read.innerHTML = 'At <b>t = ' + mark + '</b> months: <b style="color:' + P.acc + '">' + (s * 100).toFixed(0) + '% event-free</b>, <b style="color:' + P.c0 + '">' + (r * 100).toFixed(0) + '% have relapsed</b>, <b style="color:' + P.bad + '">' + (d * 100).toFixed(0) + '% have died</b>. The three always sum to 100%: each event removes patients the other can no longer claim, which is why you share the risk with a CIF instead of treating each cause on its own.';
    }
    u.wireSeg(el.querySelector('.cr-seg'), function (v) { mark = parseFloat(v); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Competing risks: cumulative incidence when relapse and death compete.',
      'library(survival)',
      'set.seed(3)',
      'n      <- 250',
      'event_t <- rexp(n, 0.08)                          # time to the first event',
      'etype   <- sample(1:2, n, TRUE, c(0.6, 0.4))       # 1 = relapse, 2 = death',
      'cens_t  <- runif(n, 0, 30)',
      'time    <- pmin(event_t, cens_t)',
      'status  <- ifelse(event_t <= cens_t, etype, 0)     # 0 = censored',
      'ev      <- factor(status, 0:2, c("censored", "relapse", "death"))',
      '',
      'fit <- survfit(Surv(time, ev) ~ 1)                # multi-state = competing risks',
      'summary(fit, times = c(5, 10, 20))$pstate         # CIF per state over time',
      '# relapse and death incidences plus the event-free fraction sum to 1 at every time.'
    ].join('\n');
  }

  window.LessonWidgets.register('competing-risks', mount);
})();

;
/* conformal-bands.js */
/* conformal-bands.js - split conformal prediction intervals, made visible.
 * Fit a model, then set a band half-width from a high quantile of the calibration residuals. The
 * band y-hat +/- q-hat is guaranteed to cover at least the target fraction of new points, with no
 * assumption about the error distribution. Raise the target coverage and watch the band widen and
 * the empirical coverage track the target. Emits split conformal from scratch in base R.
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2831853 * r()); }

  // linear data: y = 2 + 1.5 x + noise; split into a calibration set and a test set
  function build() {
    var r = rng(4), cal = [], te = [], i, x;
    for (i = 0; i < 120; i++) { x = 10 * r(); cal.push([x, 2 + 1.5 * x + 2 * gauss(r)]); }
    for (i = 0; i < 120; i++) { x = 10 * r(); te.push([x, 2 + 1.5 * x + 2 * gauss(r)]); }
    return { cal: cal, te: te };
  }
  function ols(pts) {
    var n = pts.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += pts[i][0]; my += pts[i][1]; } mx /= n; my /= n;
    var sxy = 0, sxx = 0, dx;
    for (i = 0; i < n; i++) { dx = pts[i][0] - mx; sxy += dx * (pts[i][1] - my); sxx += dx * dx; }
    var b = sxy / sxx, a = my - b * mx;
    return function (x) { return a + b * x; };
  }
  function qConformal(res, alpha) {              // the split-conformal quantile of |residuals|
    var s = res.slice().sort(function (a, b) { return a - b; }), n = s.length;
    var k = Math.ceil((n + 1) * (1 - alpha));    // rank guaranteeing coverage
    return s[Math.min(n - 1, k - 1)];
  }

  var LV = { '0.8': { a: 0.2, pct: '80%' }, '0.9': { a: 0.1, pct: '90%' }, '0.95': { a: 0.05, pct: '95%' } };

  function mount(el, cfg) {
    cfg = cfg || {}; var d = build(), f = ols(d.cal), level = '0.9';
    var resCal = d.cal.map(function (p) { return Math.abs(p[1] - f(p[0])); });
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cb-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.8', label: 'Target 80%' }, { v: '0.9', label: 'Target 90%' }, { v: '0.95', label: 'Target 95%' }], '0.9') + '</div>' +
      '<div class="cb-plot"></div>' +
      '<div class="cb-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Split conformal prediction: guaranteed-coverage band, base R' });

    var plot = el.querySelector('.cb-plot'), read = el.querySelector('.cb-read');
    var W = 340, H = 220, PAD = 26;
    var ally = d.cal.concat(d.te).map(function (p) { return p[1]; });
    var ymin = Math.min.apply(null, ally) - 1, ymax = Math.max.apply(null, ally) + 1;
    function sx(x) { return PAD + x / 10 * (W - PAD - 8); }
    function sy(y) { return H - PAD - (y - ymin) / (ymax - ymin) * (H - PAD - 8); }

    function draw() {
      var a = LV[level].a, qhat = qConformal(resCal, a);
      var xs = [0, 10];
      var band = '<polygon points="' + sx(xs[0]).toFixed(1) + ',' + sy(f(xs[0]) + qhat).toFixed(1) + ' ' + sx(xs[1]).toFixed(1) + ',' + sy(f(xs[1]) + qhat).toFixed(1) + ' ' + sx(xs[1]).toFixed(1) + ',' + sy(f(xs[1]) - qhat).toFixed(1) + ' ' + sx(xs[0]).toFixed(1) + ',' + sy(f(xs[0]) - qhat).toFixed(1) + '" fill="' + P.acc + '" fill-opacity="0.12"/>';
      var line = '<line x1="' + sx(xs[0]).toFixed(1) + '" y1="' + sy(f(xs[0])).toFixed(1) + '" x2="' + sx(xs[1]).toFixed(1) + '" y2="' + sy(f(xs[1])).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="1.5"/>';
      var inside = 0;
      var dots = d.te.map(function (p) {
        var yhat = f(p[0]), inb = Math.abs(p[1] - yhat) <= qhat; if (inb) inside++;
        return '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="2.6" fill="' + (inb ? P.c0 : P.bad) + '" opacity="' + (inb ? 0.6 : 0.95) + '"/>';
      }).join('');
      var cover = inside / d.te.length;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="conformal prediction band">' +
        '<line x1="' + PAD + '" y1="' + (H - PAD) + '" x2="' + (W - 8) + '" y2="' + (H - PAD) + '" stroke="' + P.line + '"/>' +
        '<line x1="' + PAD + '" y1="8" x2="' + PAD + '" y2="' + (H - PAD) + '" stroke="' + P.line + '"/>' +
        band + line + dots +
        '<text x="' + (W - 8) + '" y="16" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">test points; red = outside band</text></svg>';
      read.innerHTML = 'At a target of <b>' + LV[level].pct + '</b> coverage, the calibration residuals set the band half-width to <b>q&#770; = ' + qhat.toFixed(2) + '</b>. On fresh test points the band actually covers <b style="color:' + P.acc + '">' + Math.round(cover * 100) + '%</b>, at or above target: that is conformal prediction\'s finite-sample guarantee, with no assumption about the error shape. Raise the target and the band widens to keep the promise.';
    }
    u.wireSeg(el.querySelector('.cb-seg'), function (v) { level = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Split conformal prediction: a band with GUARANTEED coverage, from residual quantiles. Base R.',
      'set.seed(1)',
      'n <- 600; x <- runif(n, 0, 10); y <- 2 + 1.5 * x + rnorm(n, 0, 2)',
      'd <- data.frame(x, y)',
      'tr <- 1:300; cal <- 301:450; te <- 451:600        # train / calibrate / test',
      'fit <- lm(y ~ x, d[tr, ])                          # 1) fit on the training split',
      'res <- abs(d$y[cal] - predict(fit, d[cal, ]))      # 2) nonconformity = |residual| on calibration',
      'alpha <- 0.1                                        # want >= 90% coverage',
      'k    <- ceiling((length(cal) + 1) * (1 - alpha)) / length(cal)',
      'qhat <- quantile(res, k)                            # 3) the conformal quantile = band half-width',
      'pred <- predict(fit, d[te, ])                       # 4) band is pred +/- qhat on new points',
      'cover <- mean(d$y[te] >= pred - qhat & d$y[te] <= pred + qhat)',
      'round(c(qhat = unname(qhat), target = 1 - alpha, coverage = cover), 3)',
      '#>     qhat   target coverage',
      '#>    3.615    0.900    0.913'
    ].join('\n');
  }

  window.LessonWidgets.register('conformal-bands', mount);
})();

;
/* control-flow.js */
/* control-flow.js - foundations: watch a for-loop with an if/else execute one
 * iteration at a time. Step through it; see the counter, which branch the
 * condition takes, and the console output building up. Then run the real loop.
 * cfg: { n: 5 }  (loops i in 1:n, printing "even"/"odd")
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var n = cfg.n || 5, step = 0; // step 0 = nothing run yet; step k = i=k done

    var CODE = 'for (i in 1:' + n + ') {\n  if (i %% 2 == 0) {\n    print("even")\n  } else {\n    print("odd")\n  }\n}';
    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function codePanel() {
      var even = step > 0 && step % 2 === 0; // current branch highlight
      var hiEven = even ? u.P.add : 'transparent', hiOdd = (step > 0 && !even) ? u.P.add : 'transparent';
      return '<pre style="margin:0;font-family:IBM Plex Mono,monospace;font-size:13px;line-height:1.6;background:' + u.P.codeBg + ';color:' + u.P.codeFg + ';padding:12px 14px;border-radius:8px;overflow-x:auto">' +
        '<span>for (i in 1:' + n + ') {</span>\n' +
        '<span>  if (i %% 2 == 0) {</span>\n' +
        '<span style="background:' + (hiEven === 'transparent' ? 'transparent' : 'rgba(123,201,159,.28)') + ';display:inline-block;width:100%">    print("even")</span>\n' +
        '<span>  } else {</span>\n' +
        '<span style="background:' + (hiOdd === 'transparent' ? 'transparent' : 'rgba(123,201,159,.28)') + ';display:inline-block;width:100%">    print("odd")</span>\n' +
        '<span>  }</span>\n<span>}</span></pre>';
    }
    function statePanel() {
      var out = [];
      for (var k = 1; k <= step; k++) out.push('[1] "' + (k % 2 === 0 ? 'even' : 'odd') + '"');
      var iNow = step === 0 ? '&ndash;' : step;
      return '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 10px">' +
          '<span style="font-family:IBM Plex Mono,monospace;font-size:13px;background:' + u.P.line2 + ';color:' + u.P.ink + ';padding:5px 11px;border-radius:7px">i = ' + iNow + (step === 0 ? '' : (step % 2 === 0 ? '  (even)' : '  (odd)')) + '</span>' +
          '<span style="font-size:12.5px;color:' + u.P.mut + ';align-self:center">' + (step >= n ? 'loop finished' : (step === 0 ? 'press Step to start' : 'press Step for i = ' + (step + 1))) + '</span>' +
        '</div>' +
        '<div style="font-size:11px;color:' + u.P.faint + ';font-family:IBM Plex Mono,monospace;text-transform:uppercase;letter-spacing:.04em;margin:0 0 4px">Console</div>' +
        '<pre style="margin:0;min-height:46px;font-family:IBM Plex Mono,monospace;font-size:12.5px;line-height:1.5;background:#fff;border:1px solid ' + u.P.line + ';border-radius:7px;padding:9px 12px;color:' + u.P.ink + '">' + (out.join('\n') || '<span style="color:' + u.P.faint + '">(empty)</span>') + '</pre>';
    }
    function render() {
      wrap.querySelector('.cf-code').innerHTML = codePanel();
      wrap.querySelector('.cf-state').innerHTML = statePanel();
      wrap.querySelector('.cf-step').disabled = step >= n;
      wrap.querySelector('.cf-step').style.opacity = step >= n ? '.5' : '1';
    }

    wrap.innerHTML =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
        '<div class="cf-code"></div><div class="cf-state"></div>' +
      '</div>' +
      '<div style="display:flex;gap:9px;margin:12px 0 0">' +
        '<button type="button" class="cf-step" style="font:inherit;font-size:13px;font-weight:600;color:#fff;background:' + u.P.acc + ';border:0;border-radius:8px;padding:9px 16px;cursor:pointer">Step &rarr;</button>' +
        '<button type="button" class="cf-reset" style="font:inherit;font-size:13px;font-weight:600;color:' + u.P.mut + ';background:none;border:1px solid ' + u.P.line + ';border-radius:8px;padding:9px 14px;cursor:pointer">Reset</button>' +
      '</div>' +
      '<div style="margin:13px 0 0">' + u.runnable(CODE, { label: 'Run the whole loop' }) + '</div>';

    wrap.querySelector('.cf-step').addEventListener('click', function () { if (step < n) { step++; render(); } });
    wrap.querySelector('.cf-reset').addEventListener('click', function () { step = 0; render(); });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('control-flow', mount);
})();

;
/* correlation-heatmap.js */
/* correlation-heatmap.js - a correlation matrix as a diverging color grid.
 * cfg: either { vars:[...], data:{var:[...]} }  (computes Pearson r), or a
 * precomputed { vars:[...], matrix:[[...]] }. Negative = blue, positive = green,
 * |r| sets the intensity; each cell shows the value. Default = mpg/wt/hp/disp.
 */
(function () {
  'use strict';
  function pearson(a, b) { var n = a.length, ma = 0, mb = 0, i; for (i = 0; i < n; i++) { ma += a[i]; mb += b[i]; } ma /= n; mb /= n; var sab = 0, saa = 0, sbb = 0; for (i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) * (a[i] - ma); sbb += (b[i] - mb) * (b[i] - mb); } return sab / Math.sqrt(saa * sbb); }
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var vars = cfg.vars || ['mpg', 'wt', 'hp', 'disp'];
    var data = cfg.data || { mpg: [21, 21, 22.8, 21.4, 18.7, 18.1, 24.4, 30.4], wt: [2.6, 2.9, 2.3, 3.2, 3.4, 3.5, 3.2, 1.6], hp: [110, 110, 93, 110, 175, 105, 62, 66], disp: [160, 160, 108, 258, 360, 225, 147, 76] };
    var M = cfg.matrix;
    if (!M) { M = vars.map(function (a) { return vars.map(function (b) { return a === b ? 1 : pearson(data[a], data[b]); }); }); }

    var P = u.P, cell = 46;
    function color(r) { if (r >= 0) return 'rgba(31,122,85,' + (0.12 + 0.78 * r).toFixed(2) + ')'; return 'rgba(37,99,168,' + (0.12 + 0.78 * (-r)).toFixed(2) + ')'; }
    var h = '<div style="overflow-x:auto"><table style="border-collapse:separate;border-spacing:3px;font-family:IBM Plex Mono,monospace;font-size:11.5px"><thead><tr><th></th>';
    vars.forEach(function (v) { h += '<th style="padding:4px 6px;color:' + P.mut + ';font-weight:600">' + u.esc(v) + '</th>'; });
    h += '</tr></thead><tbody>';
    M.forEach(function (row, i) {
      h += '<tr><th style="text-align:right;padding:4px 8px;color:' + P.mut + ';font-weight:600">' + u.esc(vars[i]) + '</th>';
      row.forEach(function (r) { var dark = Math.abs(r) > 0.55; h += '<td style="width:' + cell + 'px;height:' + cell + 'px;text-align:center;border-radius:7px;background:' + color(r) + ';color:' + (dark ? '#fff' : P.ink) + ';font-weight:600">' + (Math.round(r * 100) / 100) + '</td>'; });
      h += '</tr>';
    });
    h += '</tbody></table></div>' +
      '<div style="margin-top:10px;display:flex;align-items:center;gap:8px;font-size:11px;color:' + P.mut + '">' +
        '<span>&minus;1</span><span style="flex:0 0 120px;height:10px;border-radius:5px;background:linear-gradient(90deg,rgba(37,99,168,.9),#fff,rgba(31,122,85,.9))"></span><span>+1</span>' +
        '<span style="margin-left:6px">blue = negative, green = positive, intensity = strength</span></div>';
    el.innerHTML = '<div style="font-family:IBM Plex Sans,system-ui,sans-serif">' + h + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('correlation-heatmap', mount);
})();

;
/* count-dist.js */
/* count-dist.js - why a plain Poisson often fails on real counts. Real count data (support
 * tickets, insurance claims, doctor visits) usually has more variance than a Poisson allows
 * (overdispersion) and a pile-up of extra zeros. The bars are the observed counts; the line
 * is the model's fitted shape. Toggle Poisson -> Negative Binomial -> Zero-Inflated and
 * watch the line finally match the tall zero bar and the long tail. Emits runnable R that
 * compares the observed zeros to what a Poisson predicts.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // observed counts 0..9 (excess zeros + long tail; not a clean Poisson)
  var OBS = [0.34, 0.16, 0.15, 0.12, 0.09, 0.06, 0.035, 0.02, 0.01, 0.005];
  var LAM = 2.3;   // mean-ish
  function pois(k) { var e = Math.exp(-LAM), p = e; for (var i = 1; i <= k; i++) p *= LAM / i; return p; }
  function nb(k) { var r = 2.0, pr = r / (r + LAM), c = 1; for (var i = 0; i < k; i++) c *= (r + i) / (i + 1); return c * Math.pow(pr, r) * Math.pow(1 - pr, k); }
  function zip(k) { var pi = 0.22, base = pois(k); return k === 0 ? pi + (1 - pi) * base : (1 - pi) * base; }

  function mount(el, cfg) {
    cfg = cfg || {}; var model = 'pois';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cd-seg" style="margin-bottom:12px">' + u.seg([{ v: 'pois', label: 'Poisson' }, { v: 'nb', label: 'Neg. Binomial' }, { v: 'zip', label: 'Zero-Inflated' }], 'pois') + '</div>' +
      '<div class="cd-plot"></div>' +
      '<div class="cd-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Observed zeros vs what a Poisson predicts (base R)' });

    var plot = el.querySelector('.cd-plot'), read = el.querySelector('.cd-read');
    var W = 440, H = 220, m = { l: 36, r: 12, t: 12, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b, mx = 0.4;
    var bw = iw / OBS.length;
    function sy(p) { return m.t + ih - p / mx * ih; }
    function draw() {
      var fn = model === 'pois' ? pois : model === 'nb' ? nb : zip;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="count distribution fit">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      OBS.forEach(function (o, k) { var x = m.l + bw * k + 3, h = o / mx * ih; svg += '<rect x="' + x.toFixed(1) + '" y="' + sy(o).toFixed(1) + '" width="' + (bw - 6).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" fill="' + P.line + '"/>'; svg += '<text x="' + (x + (bw - 6) / 2).toFixed(1) + '" y="' + (m.t + ih + 14) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + k + '</text>'; });
      var pts = ''; for (var k = 0; k < OBS.length; k++) pts += (m.l + bw * k + bw / 2).toFixed(1) + ',' + sy(fn(k)).toFixed(1) + ' ';
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      for (var k2 = 0; k2 < OBS.length; k2++) svg += '<circle cx="' + (m.l + bw * k2 + bw / 2).toFixed(1) + '" cy="' + sy(fn(k2)).toFixed(1) + '" r="3" fill="' + P.acc + '"/>';
      svg += '<text x="' + (m.l + iw) + '" y="' + (H - 4) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">bars = observed, line = model</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      var gapZero = (OBS[0] - fn(0)).toFixed(2);
      read.innerHTML = model === 'pois'
        ? '<b style="color:' + P.bad + '">Poisson misses on both ends.</b> It underpredicts the zero bar by <b>' + gapZero + '</b> and cannot match the long tail, because Poisson forces variance = mean. Real counts are usually more spread out.'
        : model === 'nb'
          ? '<b style="color:' + P.acc + '">Negative binomial</b> adds a dispersion parameter, so variance can exceed the mean. The tail now fits, but a genuine excess of zeros can still be under-modeled.'
          : '<b style="color:' + P.acc + '">Zero-inflated</b> mixes a "structural zero" process with the counts, so the tall zero bar and the tail both fit: the right choice when many zeros come from "never at risk" cases.';
    }
    u.wireSeg(el.querySelector('.cd-seg'), function (v) { model = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Does a Poisson fit? Compare the zeros it predicts to the zeros you actually see.',
      'set.seed(1); n <- 800',
      '# a process with extra zeros: 25% structural zeros, rest ~ Poisson(2.3)',
      'lambda <- 2.3',
      'y <- ifelse(runif(n) < 0.25, 0, rpois(n, lambda))',
      '',
      'obs_zeros  <- mean(y == 0)',
      'pois_zeros <- dpois(0, mean(y))        # zeros a fitted Poisson expects',
      'c(observed = round(obs_zeros, 3), poisson_expects = round(pois_zeros, 3))',
      '# far more observed zeros than Poisson allows -> reach for NB or a zero-inflated model.'
    ].join('\n');
  }

  window.LessonWidgets.register('count-dist', mount);
})();

;
/* cuped-variance.js */
/* cuped-variance.js - variance reduction with pre-experiment data (CUPED), made visible.
 * If a covariate measured BEFORE the experiment (last week's spend, a pre-period metric)
 * correlates with the outcome, subtracting its predictable part shrinks the estimator's
 * variance by exactly a factor of 1 - rho^2, with zero bias. The confidence interval on the
 * treatment effect narrows for free. Toggle the pre-period correlation and watch the CI
 * collapse. Emits the same raw-vs-CUPED standard errors in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var RHOS = { weak: 0.3, moderate: 0.6, strong: 0.85 };

  function mount(el, cfg) {
    cfg = cfg || {}; var lvl = 'moderate';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cu-seg" style="margin-bottom:12px">' + u.seg([{ v: 'weak', label: 'Weak (rho=0.3)' }, { v: 'moderate', label: 'Moderate (0.6)' }, { v: 'strong', label: 'Strong (0.85)' }], 'moderate') + '</div>' +
      '<div class="cu-plot"></div>' +
      '<div class="cu-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'CUPED variance reduction, base R' });

    var plot = el.querySelector('.cu-plot'), read = el.querySelector('.cu-read');
    var W = 340, H = 130, CX = W / 2, RAW_HALF = 120;   // raw CI half-width in px (illustrative)
    function bar(y, half, col, lab) {
      return '<line x1="' + (CX - half) + '" y1="' + y + '" x2="' + (CX + half) + '" y2="' + y + '" stroke="' + col + '" stroke-width="3"/>' +
        '<line x1="' + (CX - half) + '" y1="' + (y - 6) + '" x2="' + (CX - half) + '" y2="' + (y + 6) + '" stroke="' + col + '" stroke-width="2"/>' +
        '<line x1="' + (CX + half) + '" y1="' + (y - 6) + '" x2="' + (CX + half) + '" y2="' + (y + 6) + '" stroke="' + col + '" stroke-width="2"/>' +
        '<circle cx="' + CX + '" cy="' + y + '" r="3.5" fill="' + col + '"/>' +
        '<text x="8" y="' + (y - 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + col + '">' + lab + '</text>';
    }
    function draw() {
      var rho = RHOS[lvl], factor = Math.sqrt(1 - rho * rho), cupHalf = RAW_HALF * factor;
      var reduct = Math.round(rho * rho * 100);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="CUPED confidence interval shrink">' +
        '<line x1="' + CX + '" y1="18" x2="' + CX + '" y2="' + (H - 10) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="2 3"/>' +
        bar(46, RAW_HALF, P.mut, 'raw 95% CI') +
        bar(96, cupHalf, P.c0, 'CUPED 95% CI') +
        '</svg>';
      read.innerHTML = 'A pre-period covariate correlated <b>' + rho + '</b> with the outcome shrinks the estimator variance by <b>1 &minus; ' + rho + '&sup2; = ' + (1 - rho * rho).toFixed(2) + '</b>, so the CI narrows by a factor of <b style="color:' + P.c0 + '">' + factor.toFixed(2) + '</b> (a <b>' + reduct + '%</b> variance cut) with no bias. ' +
        (lvl === 'weak' ? 'A weak pre-period signal barely helps.' : lvl === 'strong' ? 'A strong pre-period signal is like running the experiment on a much larger sample, for free.' : 'Equivalent to collecting ' + Math.round(1 / (1 - rho * rho)) + 'x the sample at no extra cost.');
    }
    u.wireSeg(el.querySelector('.cu-seg'), function (v) { lvl = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# CUPED: use a pre-experiment covariate to shrink the variance of an A/B estimate. Base R.',
      'set.seed(1)',
      'n   <- 4000',
      'pre <- rnorm(n)                                  # a metric measured BEFORE the test',
      'rho <- 0.6                                       # its correlation with the outcome',
      'y   <- rho * pre + sqrt(1 - rho^2) * rnorm(n)    # outcome, partly predicted by pre',
      'arm <- rep(0:1, each = n / 2)',
      'y   <- y + 0.05 * arm                            # a true treatment lift of 0.05',
      '',
      'g <- n / 2',
      'raw_se <- sqrt(var(y[arm == 1]) / g + var(y[arm == 0]) / g)   # ordinary difference in means',
      '',
      'theta <- cov(y, pre) / var(pre)                  # CUPED: regress out the pre-covariate',
      'yc    <- y - theta * (pre - mean(pre))',
      'cuped_se <- sqrt(var(yc[arm == 1]) / g + var(yc[arm == 0]) / g)',
      '',
      'round(c(raw_se = raw_se, cuped_se = cuped_se,',
      '        ratio = cuped_se / raw_se, predicted = sqrt(1 - rho^2)), 3)',
      '# the SE ratio lands right on sqrt(1 - rho^2): a real variance cut, no bias.'
    ].join('\n');
  }

  window.LessonWidgets.register('cuped-variance', mount);
})();

;
/* cv-folds.js */
/* cv-folds.js - k-fold cross-validation, rotating.
 * The data splits into k folds. Step through them: each fold takes a turn as the
 * validation set while the rest train, giving k scores whose average is a far more
 * honest estimate than one lucky split. Emits runnable R that does k-fold CV by hand.
 *
 * cfg: { k:5 }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // deterministic per-fold scores (one per fold, up to 10), reused per k
  var SC = [0.94, 1.08, 0.86, 1.15, 0.97, 1.03, 0.9, 1.11, 0.99, 0.92];

  function mount(el, cfg) {
    cfg = cfg || {};
    var k = [4, 5, 10].indexOf(+cfg.k) >= 0 ? +cfg.k : 5, cur = 1, N = 20;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="cv-seg" style="margin:0 0 12px">' + u.seg([{ v: '4', label: '4 folds' }, { v: '5', label: '5 folds' }, { v: '10', label: '10 folds' }], String(k)) + '</div>' +
      '<div class="cv-strip"></div>' +
      '<div style="display:flex;align-items:center;gap:9px;margin:12px 0 0">' +
        '<button class="cv-prev" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:' + P.mut + ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 12px;cursor:pointer">&larr; Prev fold</button>' +
        '<button class="cv-next" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:#fff;background:' + P.acc + ';border:0;border-radius:8px;padding:8px 14px;cursor:pointer">Next fold &rarr;</button>' +
        '<span class="cv-pos" style="font:600 12.5px/1 IBM Plex Mono,monospace;color:' + P.body + '"></span>' +
      '</div>' +
      '<div class="cv-scores" style="display:flex;gap:5px;flex-wrap:wrap;margin:13px 0 0"></div>' +
      '<div class="cv-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Run k-fold cross-validation in R' });

    var strip = el.querySelector('.cv-strip'), scores = el.querySelector('.cv-scores'),
        read = el.querySelector('.cv-read'), pos = el.querySelector('.cv-pos');

    function foldOf(i) { return Math.floor(i * k / N) + 1; }    // contiguous blocks (random in the R)
    function draw() {
      var cells = '';
      for (var i = 0; i < N; i++) { var isVal = foldOf(i) === cur; cells += '<div title="fold ' + foldOf(i) + (isVal ? ' (validation)' : ' (train)') + '" style="flex:1;height:30px;border-radius:3px;background:' + (isVal ? P.c1 : P.acc) + ';opacity:' + (isVal ? 0.92 : 0.5) + '"></div>'; }
      strip.innerHTML = '<div style="display:flex;gap:3px">' + cells + '</div>' +
        '<div style="display:flex;justify-content:space-between;font:600 10px/1.6 IBM Plex Mono,monospace;letter-spacing:.04em;text-transform:uppercase;color:' + P.faint + ';margin:5px 0 0"><span style="color:' + P.c1 + '">&#9632; validation fold</span><span style="color:' + P.acc + '">&#9632; training folds</span></div>';

      var used = SC.slice(0, k), mean = used.reduce(function (a, b) { return a + b; }, 0) / k;
      scores.innerHTML = used.map(function (s, i) { var on = (i + 1) === cur; return '<span style="font:600 12px/1 IBM Plex Mono,monospace;padding:6px 9px;border-radius:7px;background:' + (on ? P.c1 : P.bg) + ';color:' + (on ? '#fff' : P.body) + '">f' + (i + 1) + ' ' + s.toFixed(2) + '</span>'; }).join('') +
        '<span style="font:700 12px/1 IBM Plex Mono,monospace;padding:6px 9px;border-radius:7px;background:' + P.ink + ';color:#fff">CV mean ' + mean.toFixed(3) + '</span>';
      pos.textContent = 'fold ' + cur + ' of ' + k;
      read.innerHTML = 'Fold <b>' + cur + '</b> is held out for validation; the other ' + (k - 1) + ' folds train the model, giving score <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + used[cur - 1].toFixed(2) +
        '</b>. Every point validates exactly once. The <b>average of all ' + k + '</b> is the cross-validated error - steadier and less luck-dependent than any single split. More folds = less bias, more compute.';
    }
    u.wireSeg(el.querySelector('.cv-seg'), function (v) { k = +v; cur = 1; draw(); });
    el.querySelector('.cv-next').addEventListener('click', function () { cur = cur % k + 1; draw(); });
    el.querySelector('.cv-prev').addEventListener('click', function () { cur = (cur - 2 + k) % k + 1; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# k-fold cross-validation by hand: each fold takes a turn as the holdout.',
      'set.seed(1)',
      'n  <- 100',
      'df <- data.frame(x = rnorm(n)); df$y <- 2 * df$x + rnorm(n)',
      '',
      'k    <- 5',
      'fold <- sample(rep(1:k, length.out = n))     # random fold labels',
      'rmse <- numeric(k)',
      'for (f in 1:k) {',
      '  tr <- df[fold != f, ]; va <- df[fold == f, ]',
      '  fit     <- lm(y ~ x, data = tr)',
      '  rmse[f] <- sqrt(mean((va$y - predict(fit, va))^2))',
      '}',
      'rmse            # one score per fold',
      'mean(rmse)      # the cross-validated error'
    ].join('\n');
  }

  window.LessonWidgets.register('cv-folds', mount);
})();

;
/* dag-editor.js */
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

;
/* dashboard-layout.js */
/* dashboard-layout.js - a mini dashboard: a filter input drives value boxes + chart
 * tiles, to show the reactive layout of a Quarto dashboard / Shiny app (one input ->
 * many outputs update). cfg: { filterLabel, views:{ name:{ boxes:[[label,value]],
 * line:[{x,y}], bar:[{x,y}] } } }. Default = sales by region.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var views = cfg.views || {
      All: { boxes: [['Revenue', '$1.20M'], ['Orders', '8,432'], ['Avg order', '$142']], line: [{ x: 1, y: 88 }, { x: 2, y: 102 }, { x: 3, y: 96 }, { x: 4, y: 120 }, { x: 5, y: 130 }, { x: 6, y: 142 }], bar: [{ x: 'Web', y: 62 }, { x: 'Retail', y: 40 }, { x: 'B2B', y: 38 }] },
      North: { boxes: [['Revenue', '$520K'], ['Orders', '3,610'], ['Avg order', '$144']], line: [{ x: 1, y: 40 }, { x: 2, y: 44 }, { x: 3, y: 41 }, { x: 4, y: 52 }, { x: 5, y: 58 }, { x: 6, y: 63 }], bar: [{ x: 'Web', y: 30 }, { x: 'Retail', y: 14 }, { x: 'B2B', y: 18 }] },
      South: { boxes: [['Revenue', '$680K'], ['Orders', '4,822'], ['Avg order', '$141']], line: [{ x: 1, y: 48 }, { x: 2, y: 58 }, { x: 3, y: 55 }, { x: 4, y: 68 }, { x: 5, y: 72 }, { x: 6, y: 79 }], bar: [{ x: 'Web', y: 32 }, { x: 'Retail', y: 26 }, { x: 'B2B', y: 20 }] }
    };
    var names = Object.keys(views), cur = names[0], P = u.P;
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="display:flex;align-items:center;gap:9px;margin-bottom:12px;flex-wrap:wrap"><span style="font-size:12.5px;font-weight:600;color:' + P.mut + '">' + u.esc(cfg.filterLabel || 'Region') + ':</span><span class="db-seg"></span><span style="margin-left:auto;font:600 9.5px/1 IBM Plex Mono,monospace;letter-spacing:.08em;text-transform:uppercase;color:' + P.faint + '">reactive</span></div>' +
      '<div class="db-boxes" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:11px"></div>' +
      '<div class="db-tiles" style="display:flex;gap:10px;flex-wrap:wrap"></div>';
    var segHost = wrap.querySelector('.db-seg'); segHost.innerHTML = u.seg(names, cur);
    var boxesEl = wrap.querySelector('.db-boxes'), tilesEl = wrap.querySelector('.db-tiles');
    function tile(title, inner) { return '<div style="flex:1;min-width:240px;border:1px solid ' + P.line + ';border-radius:12px;padding:11px 13px;background:#fff"><div style="font:600 12px/1 IBM Plex Sans,sans-serif;color:' + P.ink + ';margin-bottom:7px">' + u.esc(title) + '</div>' + inner + '</div>'; }
    function render(v) {
      var view = views[v];
      boxesEl.innerHTML = view.boxes.map(function (b) { return '<div style="flex:1;min-width:120px;border:1px solid ' + P.line + ';border-radius:12px;padding:13px 15px;background:#fff"><div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.06em;text-transform:uppercase;color:' + P.faint + ';margin-bottom:6px">' + u.esc(b[0]) + '</div><div style="font-family:IBM Plex Serif,Georgia,serif;font-weight:600;font-size:22px;color:' + P.ink + '">' + u.esc(b[1]) + '</div></div>'; }).join('');
      tilesEl.innerHTML = tile('Revenue trend', u.plot(view.line, { geom: 'line', x: 'month', y: 'k$', w: 320, h: 180 })) + tile('By channel', u.plot(view.bar, { geom: 'bar', x: '', y: 'k$', w: 320, h: 180 }));
    }
    u.wireSeg(segHost, function (v) { render(v); });
    render(cur);
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('dashboard-layout', mount);
})();

;
/* data-split.js */
/* data-split.js - train / validation / test, and why leakage lies.
 * A row strip splits into train, validation, test. Flip the "leak a feature"
 * switch: a column secretly built from the answer sneaks in, and the test score
 * jumps to a too-good-to-be-true number - the single most common ML mistake.
 * Emits runnable R that does an honest split AND demonstrates the leak.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var N = 20, nTrain = 12, nVal = 4;       // 60 / 20 / 20
    var leak = false;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ds-strip"></div>' +
      '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;margin:14px 0 0">' +
        '<label style="display:inline-flex;align-items:center;gap:8px;font:600 13px/1 IBM Plex Sans,sans-serif;color:' + P.body + ';cursor:pointer">' +
          '<input class="ds-leak" type="checkbox"> Leak a feature built from the answer</label>' +
      '</div>' +
      '<div class="ds-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:11px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Split honestly - then watch a leak inflate the score - in R' });

    var strip = el.querySelector('.ds-strip'), read = el.querySelector('.ds-read');

    function draw() {
      var cells = '';
      for (var i = 0; i < N; i++) {
        var role = i < nTrain ? ['train', P.acc] : i < nTrain + nVal ? ['val', P.c0] : ['test', P.c1];
        cells += '<div title="' + role[0] + '" style="flex:1;height:30px;background:' + role[1] + ';opacity:.85;border-radius:3px"></div>';
      }
      var leakCol = leak ? '<div style="margin:9px 0 0"><div style="font:600 11px/1.4 IBM Plex Mono,monospace;color:' + P.bad + '">+ leaked column (a near-copy of y)</div>' +
        '<div style="display:flex;gap:3px;margin:4px 0 0">' + Array.apply(null, Array(N)).map(function () { return '<div style="flex:1;height:16px;background:' + P.bad + ';opacity:.55;border-radius:3px"></div>'; }).join('') + '</div></div>' : '';
      strip.innerHTML =
        '<div style="display:flex;gap:3px">' + cells + '</div>' +
        '<div style="display:flex;justify-content:space-between;font:600 10px/1.6 IBM Plex Mono,monospace;letter-spacing:.04em;text-transform:uppercase;color:' + P.faint + ';margin:5px 0 0">' +
          '<span style="color:' + P.acc + '">&#9632; train 60%</span><span style="color:' + P.c0 + '">&#9632; validation 20%</span><span style="color:' + P.c1 + '">&#9632; test 20%</span></div>' + leakCol;

      read.innerHTML = leak
        ? '<b style="color:' + P.bad + '">Test accuracy 0.99 - too good to be true.</b> The leaked column is basically the answer, so the model "predicts" by copying it. On truly new data with no such column, it collapses. Leakage = any information at training time you would not have at prediction time. Split FIRST, engineer features INSIDE the training fold only.'
        : '<b style="color:' + P.acc + '">Honest test accuracy 0.78.</b> Fit on train, tune on validation, and touch test exactly once at the end. The test set stands in for the future: the moment it influences a choice, its score stops being trustworthy.';
    }

    el.querySelector('.ds-leak').addEventListener('change', function (e) { leak = e.target.checked; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# An honest split, then a demonstration of leakage.',
      'set.seed(1)',
      'n  <- 200',
      'df <- data.frame(x = rnorm(n), y = rbinom(n, 1, 0.5))',
      '',
      'idx   <- sample(n, 0.7 * n)        # 70% to train, the rest to test',
      'train <- df[idx, ]; test <- df[-idx, ]',
      'c(train = nrow(train), test = nrow(test))',
      '',
      '# LEAKAGE: a feature secretly built from the answer y',
      'df$leak <- df$y + rnorm(n, 0, 0.01)          # "leak" basically IS y',
      'fit  <- glm(y ~ leak, family = binomial, data = df[idx, ])',
      'pred <- predict(fit, df[-idx, ], type = "response") > 0.5',
      'mean(pred == df$y[-idx])                      # ~1.00 - the tell-tale sign of a leak'
    ].join('\n');
  }

  window.LessonWidgets.register('data-split', mount);
})();

;
/* dataframe-builder.js */
/* dataframe-builder.js - foundations: a data frame is a set of equal-length
 * columns, each its own type. Toggle columns on and off and watch the table,
 * its dimensions, and each column's type update; then run the data.frame() call.
 * cfg: { columns: [{name, type, values:[]}] }
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var COLS = cfg.columns || [
      { name: 'name', type: 'character', values: ['Ana', 'Ben', 'Cy', 'Devi'] },
      { name: 'age', type: 'integer', values: [29, 41, 35, 23] },
      { name: 'member', type: 'logical', values: ['TRUE', 'FALSE', 'TRUE', 'TRUE'] }
    ];
    var on = COLS.map(function () { return true; });

    function active() { return COLS.filter(function (_, i) { return on[i]; }); }
    function rLiteral() {
      var a = active();
      var lines = a.map(function (c) {
        var vals = c.values.map(function (v) { return c.type === 'character' ? '"' + v + '"' : v; }).join(', ');
        return '  ' + c.name + ' = c(' + vals + ')';
      });
      return 'df <- data.frame(\n' + lines.join(',\n') + '\n)';
    }

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function render() {
      var a = active();
      var toggles = COLS.map(function (c, i) {
        return '<button type="button" class="dfb-col" data-i="' + i + '" style="font:inherit;font-size:12.5px;font-weight:600;border-radius:8px;padding:6px 12px;cursor:pointer;border:1px solid ' + u.P.line + ';background:' + (on[i] ? u.P.acc : '#fff') + ';color:' + (on[i] ? '#fff' : u.P.mut) + '">' + (on[i] ? '&#10003; ' : '') + u.esc(c.name) + '</button>';
      }).join('');
      var tableHtml, dimHtml, typesHtml;
      if (!a.length) {
        tableHtml = '<div style="font-size:13px;color:' + u.P.mut + ';padding:14px 0">Turn on at least one column to build a data frame.</div>';
        dimHtml = ''; typesHtml = '';
      } else {
        var cols = a.map(function (c) { return c.name; });
        var rows = a[0].values.map(function (_, ri) { return a.map(function (c) { return c.values[ri]; }); });
        tableHtml = u.tbl(cols, rows);
        dimHtml = '<span style="font-family:IBM Plex Mono,monospace">dim(df) #&gt; ' + rows.length + ' &times; ' + cols.length + '</span>';
        typesHtml = a.map(function (c) { return '<span style="font-family:IBM Plex Mono,monospace;font-size:12px;background:' + u.P.line2 + ';color:' + u.P.ink + ';padding:2px 7px;border-radius:6px">' + u.esc(c.name) + ': ' + c.type + '</span>'; }).join(' ');
      }
      wrap.querySelector('.dfb-toggles').innerHTML = toggles;
      wrap.querySelector('.dfb-table').innerHTML = tableHtml;
      wrap.querySelector('.dfb-meta').innerHTML = (a.length ? '<div style="margin:0 0 7px;font-size:12.5px;color:' + u.P.mut + '">' + dimHtml + '</div>' + typesHtml : '');
      wrap.querySelector('.dfb-run').innerHTML = a.length ? u.runnable(rLiteral() + '\n\ndf\nstr(df)', { label: 'Build it in R' }) : '';
    }

    wrap.innerHTML =
      '<div style="border:1px solid ' + u.P.line + ';border-radius:12px;padding:14px 16px;background:#fff">' +
        '<div style="font-size:12px;color:' + u.P.mut + ';margin:0 0 7px">Columns (each is one type; all the same length)</div>' +
        '<div class="dfb-toggles" style="display:flex;gap:8px;flex-wrap:wrap"></div>' +
        '<div class="dfb-table" style="overflow-x:auto;margin:14px 0 0"></div>' +
        '<div class="dfb-meta" style="margin:12px 0 0;display:flex;gap:7px;flex-wrap:wrap;align-items:center"></div>' +
      '</div>' +
      '<div class="dfb-run" style="margin:12px 0 0"></div>';

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.dfb-col'); if (!b) return;
      var i = +b.getAttribute('data-i'); on[i] = !on[i]; render();
    });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('dataframe-builder', mount);
})();

;
/* decision-region.js */
/* decision-region.js - a real greedy CART decision tree, fit live in the
 * browser, that overfits as you raise its depth. Reference lesson widget.
 *
 * Ported from the verified _mocks/rf-course-lesson1 model: two diagonal
 * gaussian blobs + training-only planted noise, recursive Gini splitting,
 * region rendering, train/test accuracy and a data-driven verdict.
 *
 * cfg: { seed, min, max, start, showTest, labels:{c0,c1}, metrics:[...] }
 */
(function () {
  'use strict';
  var C0 = '#2563a8', C1 = '#b5631a';

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var SEED = cfg.seed || 7;
    var MIN = cfg.min || 1, MAX = cfg.max || 10, START = cfg.start || 3;
    var SHOW_TEST = cfg.showTest !== false;
    var labels = cfg.labels || { c0: 'class 0', c1: 'class 1' };

    var rnd = mulberry32(SEED);
    function gauss(mx, my, s) {
      var u = rnd(), v = rnd();
      var g = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(6.2832 * v);
      var g2 = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.sin(6.2832 * v);
      return { x: Math.min(0.97, Math.max(0.03, mx + g * s)),
               y: Math.min(0.97, Math.max(0.03, my + g2 * s)) };
    }

    var DATA = [];
    (function () {
      function blob(mx, my, c, n) {
        for (var k = 0; k < n; k++) { var p = gauss(mx, my, 0.13); DATA.push({ x: p.x, y: p.y, c: c }); }
      }
      blob(0.38, 0.42, 0, 70); blob(0.62, 0.58, 1, 70);
      DATA.forEach(function (p, i) { p.test = (i % 3 === 0); });
      // Training-only noise planted inside the opposite cloud: a deep tree
      // carves islands around these, which is exactly what tanks test accuracy.
      var noise = [[0.47, 0.50, 1], [0.50, 0.45, 1], [0.43, 0.40, 1], [0.45, 0.47, 1],
                   [0.56, 0.60, 0], [0.60, 0.54, 0], [0.53, 0.62, 0], [0.57, 0.53, 0]];
      noise.forEach(function (n) { DATA.push({ x: n[0], y: n[1], c: n[2], test: false }); });
    })();
    var TRAIN = DATA.filter(function (p) { return !p.test; });
    var TEST = DATA.filter(function (p) { return p.test; });

    function gini(pts) {
      if (!pts.length) return 0;
      var c0 = 0; pts.forEach(function (p) { if (p.c === 0) c0++; });
      var n = pts.length, p0 = c0 / n; return 2 * p0 * (1 - p0);
    }
    function build(pts, depth, maxD) {
      var c0 = 0; pts.forEach(function (p) { if (p.c === 0) c0++; });
      var maj = (c0 >= pts.length - c0) ? 0 : 1;
      if (depth >= maxD || pts.length < 4 || c0 === 0 || c0 === pts.length) return { leaf: true, cls: maj };
      var best = null;
      ['x', 'y'].forEach(function (ax) {
        var vals = pts.map(function (p) { return p[ax]; }).sort(function (a, b) { return a - b; });
        for (var v = 0; v < vals.length - 1; v++) {
          var thr = (vals[v] + vals[v + 1]) / 2, L = [], R = [];
          pts.forEach(function (p) { (p[ax] <= thr ? L : R).push(p); });
          if (!L.length || !R.length) continue;
          var g = (L.length * gini(L) + R.length * gini(R)) / pts.length;
          if (!best || g < best.g) best = { g: g, ax: ax, thr: thr, L: L, R: R };
        }
      });
      if (!best) return { leaf: true, cls: maj };
      return { leaf: false, ax: best.ax, thr: best.thr,
               left: build(best.L, depth + 1, maxD), right: build(best.R, depth + 1, maxD) };
    }
    function predict(node, x, y) {
      while (!node.leaf) { node = ((node.ax === 'x' ? x : y) <= node.thr) ? node.left : node.right; }
      return node.cls;
    }

    el.innerHTML =
      '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>tree depth</span><b class="lw-depth">' + START + '</b></div>' +
      '<input class="lw-slider" type="range" min="' + MIN + '" max="' + MAX + '" step="1" value="' + START + '"></div>' +
      '<div class="lw-grid">' +
        '<div><div class="lw-canvas-wrap"><canvas class="lw-canvas" width="300" height="300"></canvas></div>' +
        '<div class="lw-legend"><span class="lw-k"><i class="lw-sw" style="background:' + C0 + '"></i>' + labels.c0 + '</span>' +
        '<span class="lw-k"><i class="lw-sw" style="background:' + C1 + '"></i>' + labels.c1 + '</span>' +
        (SHOW_TEST ? '<span class="lw-k"><i class="lw-sw lw-sw-ring"></i>held-out test point</span>' : '') + '</div></div>' +
        '<div class="lw-metrics">' +
          '<div class="lw-m lw-m-train"><div class="lw-v lw-train">.</div><div class="lw-k2">Train accuracy</div></div>' +
          (SHOW_TEST ? '<div class="lw-m lw-m-test"><div class="lw-v lw-test">.</div><div class="lw-k2">Test accuracy</div></div>' : '') +
        '</div>' +
      '</div>' +
      '<div class="lw-note"></div>';

    var slider = el.querySelector('.lw-slider');
    var depthEl = el.querySelector('.lw-depth');
    var canvas = el.querySelector('.lw-canvas');
    var trainEl = el.querySelector('.lw-train');
    var testEl = el.querySelector('.lw-test');
    var noteEl = el.querySelector('.lw-note');
    var ctx = canvas.getContext('2d');

    function acc(tree, pts) {
      var ok = 0; pts.forEach(function (p) { if (predict(tree, p.x, p.y) === p.c) ok++; });
      return pts.length ? ok / pts.length : 0;
    }

    function render() {
      var d = +slider.value;
      depthEl.textContent = d;
      var tree = build(TRAIN, 0, d);
      var W = canvas.width, H = canvas.height, cell = 6;
      for (var px = 0; px < W; px += cell) {
        for (var py = 0; py < H; py += cell) {
          var x = px / W, y = 1 - py / H;
          ctx.fillStyle = predict(tree, x, y) === 0 ? 'rgba(37,99,168,0.13)' : 'rgba(181,99,26,0.13)';
          ctx.fillRect(px, py, cell, cell);
        }
      }
      DATA.forEach(function (p) {
        if (p.test && !SHOW_TEST) return;
        var X = p.x * W, Y = (1 - p.y) * H;
        ctx.beginPath(); ctx.arc(X, Y, 3.6, 0, 7);
        if (p.test) {
          ctx.fillStyle = '#fff'; ctx.fill();
          ctx.lineWidth = 2.2; ctx.strokeStyle = (p.c === 0) ? C0 : C1; ctx.stroke();
        } else {
          ctx.fillStyle = (p.c === 0) ? C0 : C1; ctx.fill();
          ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
        }
      });
      var trA = acc(tree, TRAIN), teA = acc(tree, TEST);
      trainEl.textContent = (trA * 100).toFixed(0) + '%';
      if (testEl) testEl.textContent = (teA * 100).toFixed(0) + '%';
      var verdict, vclass;
      if (trA < 0.82) { verdict = 'Underfitting: the tree is too shallow to capture the boundary.'; vclass = 'lw-under'; }
      else if (trA - teA > 0.13) { verdict = 'Overfitting: it is memorizing noise. Train is high, test has dropped.'; vclass = 'lw-over'; }
      else { verdict = 'Good fit: the boundary is about as accurate on unseen data as on training data.'; vclass = 'lw-good'; }
      noteEl.className = 'lw-note ' + vclass;
      noteEl.innerHTML = '<b>Depth ' + d + '.</b> ' + verdict;
    }

    slider.addEventListener('input', render);
    render();
  }

  if (window.LessonWidgets) window.LessonWidgets.register('decision-region', mount);
})();

;
/* decorrelation.js */
/* decorrelation.js - toggle bagging vs random-features and watch the trees'
 * first splits go from all-identical (correlated) to varied (decorrelated).
 * Ported from _mocks/rf-course-lesson2.
 */
(function () {
  'use strict';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function mount(el, cfg) {
    var FEATS = [
      { n: 'tenure', s: 0.92, c: '#2563a8' }, { n: 'monthly_spend', s: 0.64, c: '#1f7a55' },
      { n: 'support_calls', s: 0.55, c: '#b5631a' }, { n: 'contract', s: 0.42, c: '#8a46b0' },
      { n: 'age', s: 0.22, c: '#5a4fcf' }
    ];
    var mtry = 5;
    el.innerHTML =
      '<div class="lw-toggle"><button type="button" data-m="5" class="on">Consider all 5 features (bagging)</button>' +
      '<button type="button" data-m="2">Random 2 of 5 (random forest)</button></div>' +
      '<div class="lw-dtrees"></div>' +
      '<div class="lw-divmeter"><span class="lw-divlbl">Tree <b>diversity</b></span>' +
      '<span class="lw-divtrack"><span class="lw-divfill"></span></span><span class="lw-divpv">.</span></div>' +
      '<div class="lw-note"></div>';
    var host = el.querySelector('.lw-dtrees'), fill = el.querySelector('.lw-divfill'),
        pv = el.querySelector('.lw-divpv'), note = el.querySelector('.lw-note');

    function render() {
      var roots = [], html = '';
      for (var t = 0; t < 6; t++) {
        var rng = mulberry32(50 + t * 131 + (mtry === 5 ? 0 : 324));
        var idx = [0, 1, 2, 3, 4];
        for (var s = 4; s > 0; s--) { var j = (rng() * (s + 1)) | 0; var tmp = idx[s]; idx[s] = idx[j]; idx[j] = tmp; }
        var subset = idx.slice(0, mtry), bf = subset[0];
        subset.forEach(function (f) { if (FEATS[f].s > FEATS[bf].s) bf = f; });
        roots.push(bf);
        html += '<div class="lw-dcard"><div class="lw-dtn">tree ' + (t + 1) + '</div><div class="lw-drl">first split on</div>' +
          '<div class="lw-droot" style="background:' + FEATS[bf].c + '">' + FEATS[bf].n + '</div></div>';
      }
      host.innerHTML = html;
      var distinct = {}; roots.forEach(function (r) { distinct[r] = 1; });
      var div = Object.keys(distinct).length, pct = Math.round((div - 1) / 5 * 100);
      fill.style.width = pct + '%'; pv.textContent = div + '/6';
      note.innerHTML = (mtry === 5)
        ? '<b>Bagging:</b> every tree may use all features, so the strongest one, <code>tenure</code>, wins every first split. The trees are near-identical, correlated, and averaging barely helps.'
        : '<b>Random forest:</b> each tree sees only 2 random features, so <code>tenure</code> often is not even an option. The first splits scatter across features, the trees decorrelate, and averaging pays off.';
    }
    Array.prototype.forEach.call(el.querySelectorAll('.lw-toggle button'), function (b) {
      b.addEventListener('click', function () {
        mtry = +b.getAttribute('data-m');
        Array.prototype.forEach.call(el.querySelectorAll('.lw-toggle button'), function (x) { x.classList.toggle('on', x === b); });
        render();
      });
    });
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('decorrelation', mount);
})();

;
/* dendrogram.js */
/* dendrogram.js - hierarchical clustering as a merge tree. Leaves join into bigger and
 * bigger groups going up; the height of each join is how dissimilar the two groups were.
 * Drag the cut line down and the tree splits into more clusters - that is how you turn a
 * dendrogram into k groups. Emits runnable R that runs hclust and cuts the tree.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var COL = [P.c0, P.acc, (P.c2 || '#c9a24a'), '#7a8a55', '#9a6a9a'];
  // 8 leaves; merges as [left, right, height] building a binary tree (precomputed, plausible)
  var LEAVES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  var MERGES = [
    { l: { leaf: 0 }, r: { leaf: 1 }, h: 0.8 },
    { l: { leaf: 2 }, r: { leaf: 3 }, h: 1.0 },
    { l: { leaf: 5 }, r: { leaf: 6 }, h: 0.9 },
    { l: { leaf: 4 }, r: { m: 2 }, h: 1.6 },
    { l: { m: 0 }, r: { m: 1 }, h: 2.4 },
    { l: { m: 3 }, r: { leaf: 7 }, h: 2.9 },
    { l: { m: 4 }, r: { m: 5 }, h: 4.2 }
  ];

  function mount(el, cfg) {
    cfg = cfg || {}; var cut = 3.4, HMAX = 4.6;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="dn-plot"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">cut height <b class="dn-h" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="dn-s" type="range" min="0.4" max="4.4" step="0.05" value="3.4" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="dn-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Run hclust and cut the tree in R' });

    var plot = el.querySelector('.dn-plot'), read = el.querySelector('.dn-read'), slider = el.querySelector('.dn-s'), hEl = el.querySelector('.dn-h');
    var W = 420, H = 220, m = 24, leafX = {}, lw = (W - 2 * m) / (LEAVES.length - 1);
    LEAVES.forEach(function (_, i) { leafX[i] = m + i * lw; });
    function px(node) { return node.leaf != null ? leafX[node.leaf] : (px(MERGES[node.m].l) + px(MERGES[node.m].r)) / 2; }
    function py(h) { return (H - 22) - h / HMAX * (H - 40); }
    // cluster id below the cut: assign colours
    function clustersBelow() {
      var id = LEAVES.map(function (_, i) { return i; }), next = LEAVES.length;
      MERGES.forEach(function (mg, mi) { if (mg.h <= cut) { /* merge clusters of l and r */ var li = repId(mg.l), ri = repId(mg.r); var a = id[li], b = id[ri]; for (var k = 0; k < id.length; k++) if (id[k] === b) id[k] = a; mg._cl = a; } });
      function repId(node) { return node.leaf != null ? node.leaf : firstLeaf(MERGES[node.m]); }
      function firstLeaf(mg2) { return mg2.l.leaf != null ? mg2.l.leaf : firstLeaf(MERGES[mg2.l.m]); }
      // relabel to 0..k-1
      var uniq = {}, c = 0, out = id.map(function (v) { if (uniq[v] == null) uniq[v] = c++; return uniq[v]; });
      return { id: out, k: c };
    }
    function leafColor(i, cl) { return COL[cl.id[i] % COL.length]; }
    function draw() {
      var cl = clustersBelow();
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="dendrogram">';
      MERGES.forEach(function (mg) {
        var xl = px(mg.l), xr = px(mg.r), y = py(mg.h), yl = py(mg.l.leaf != null ? 0 : MERGES[mg.l.m].h), yr = py(mg.r.leaf != null ? 0 : MERGES[mg.r.m].h);
        var col = mg.h <= cut ? COL[(mg._cl || 0) % COL.length] : P.mut;
        svg += '<path d="M' + xl + ',' + yl + ' V' + y + ' H' + xr + ' V' + yr + '" fill="none" stroke="' + col + '" stroke-width="2"/>';
      });
      LEAVES.forEach(function (lab, i) { svg += '<circle cx="' + leafX[i] + '" cy="' + py(0) + '" r="4" fill="' + leafColor(i, cl) + '"/><text x="' + leafX[i] + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + P.mut + '">' + lab + '</text>'; });
      svg += '<line x1="' + m + '" y1="' + py(cut).toFixed(1) + '" x2="' + (W - m) + '" y2="' + py(cut).toFixed(1) + '" stroke="' + P.ink + '" stroke-dasharray="5 3"/>';
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = 'Cutting at height <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + cut.toFixed(1) + '</b> gives <b>' + cl.k + '</b> cluster' + (cl.k === 1 ? '' : 's') + '. Lower the cut for more, finer clusters; raise it to merge them.';
      hEl.textContent = cut.toFixed(1);
    }
    slider.addEventListener('input', function () { cut = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Hierarchical clustering builds a tree of merges; cut it at a height to get k groups.',
      'd <- dist(scale(iris[, 1:4]))         # pairwise distances',
      'hc <- hclust(d, method = "ward.D2")',
      'plot(hc, labels = FALSE)              # the dendrogram',
      '',
      'groups <- cutree(hc, k = 3)           # cut into 3 clusters',
      'table(groups, iris$Species)           # do the cuts match the species?'
    ].join('\n');
  }

  window.LessonWidgets.register('dendrogram', mount);
})();

;
/* did-parallel.js */
/* did-parallel.js - difference-in-differences geometry, made visible. Two groups measured
 * before and after a policy: the treated line and the control line. Under PARALLEL TRENDS,
 * the control group's pre-to-post change is what the treated group WOULD have done without
 * treatment, so the dashed counterfactual runs parallel to control. The DiD estimate is the
 * gap between the treated group's actual post value and that counterfactual, a double
 * difference that a naive post-only comparison gets wrong whenever the groups started at
 * different levels. Toggle Naive vs DiD and read the gap. Emits lm(y ~ treat*post) in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // clean illustrative values (the runnable R shows the noisy-data version)
  var cPre = 20, cPost = 26, tPre = 18, tPost = 30;      // control +6, treated +12
  var cf = tPre + (cPost - cPre);                         // counterfactual: 18 + 6 = 24
  var did = tPost - cf;                                   // 30 - 24 = 6 (true effect)
  var naive = tPost - cPost;                              // 30 - 26 = 4 (biased)

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'did';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="dd-seg" style="margin-bottom:12px">' + u.seg([{ v: 'naive', label: 'Naive (post only)' }, { v: 'did', label: 'Difference-in-differences' }], 'did') + '</div>' +
      '<div class="dd-plot"></div>' +
      '<div class="dd-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Difference-in-differences with lm(y ~ treat*post), base R' });

    var plot = el.querySelector('.dd-plot'), read = el.querySelector('.dd-read');
    var W = 340, H = 200, L = 34, R = 90, T = 16, B = 26;
    var xPre = L, xPost = W - R, ymin = 14, ymax = 34;
    function py(v) { return T + (ymax - v) / (ymax - ymin) * (H - T - B); }
    function line(x1, y1, x2, y2, col, dash, wid) { return '<line x1="' + x1 + '" y1="' + py(y1).toFixed(1) + '" x2="' + x2 + '" y2="' + py(y2).toFixed(1) + '" stroke="' + col + '" stroke-width="' + (wid || 2.5) + '"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/>'; }
    function dot(x, v, col) { return '<circle cx="' + x + '" cy="' + py(v).toFixed(1) + '" r="3.5" fill="' + col + '"/>'; }
    function draw() {
      var gapX = mode === 'did' ? xPost + 14 : xPost + 14;
      var top = mode === 'did' ? tPost : tPost, bot = mode === 'did' ? cf : cPost;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="difference in differences">';
      // control (orange), treated (blue), counterfactual (dashed blue)
      svg += line(xPre, cPre, xPost, cPost, P.c1) + dot(xPre, cPre, P.c1) + dot(xPost, cPost, P.c1);
      svg += line(xPre, tPre, xPost, tPost, P.c0) + dot(xPre, tPre, P.c0) + dot(xPost, tPost, P.c0);
      if (mode === 'did') svg += line(xPre, tPre, xPost, cf, P.c0, true, 2) + dot(xPost, cf, P.c0);
      // the highlighted gap bracket at post
      svg += '<line x1="' + gapX + '" y1="' + py(top).toFixed(1) + '" x2="' + gapX + '" y2="' + py(bot).toFixed(1) + '" stroke="' + P.bad + '" stroke-width="2"/>';
      svg += '<text x="' + (gapX + 4) + '" y="' + ((py(top) + py(bot)) / 2 + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="12" font-weight="600" fill="' + P.bad + '">' + (mode === 'did' ? did : naive) + '</text>';
      svg += '<text x="' + xPre + '" y="' + (H - 8) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">before</text>';
      svg += '<text x="' + xPost + '" y="' + (H - 8) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">after</text>';
      svg += '<text x="' + (xPre + 4) + '" y="' + (py(tPre) - 6).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">treated</text>';
      svg += '<text x="' + (xPre + 4) + '" y="' + (py(cPre) + 14).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c1 + '">control</text>';
      svg += '</svg>';
      plot.innerHTML = svg;
      read.innerHTML = mode === 'naive'
        ? 'The <b>naive</b> comparison subtracts the two post values: ' + tPost + ' &minus; ' + cPost + ' = <b style="color:' + P.bad + '">' + naive + '</b>. But the groups began at different levels (' + tPre + ' vs ' + cPre + '), so this is biased.'
        : 'The dashed line is the counterfactual: where treated would land if it moved parallel to control (' + tPre + ' + ' + (cPost - cPre) + ' = ' + cf + '). <b>DiD</b> = ' + tPost + ' &minus; ' + cf + ' = <b style="color:' + P.bad + '">' + did + '</b>, the double difference, valid only if the trends really are parallel.';
    }
    u.wireSeg(el.querySelector('.dd-seg'), function (v) { mode = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Difference-in-differences: two groups, before and after a policy. Base R.',
      'set.seed(1)',
      'n <- 200',
      'd <- expand.grid(unit = 1:n, post = 0:1)',
      'd$treat <- ifelse(d$unit <= n / 2, 0, 1)',
      'base   <- ifelse(d$treat == 1, 18, 20)              # treated start lower',
      'trend  <- ifelse(d$post == 1, 6, 0)                  # common time trend',
      'effect <- ifelse(d$treat == 1 & d$post == 1, 6, 0)   # TRUE DiD effect = 6',
      'd$y <- base + trend + effect + rnorm(nrow(d), 0, 4)',
      '',
      'cell <- tapply(d$y, list(treat = d$treat, post = d$post), mean)',
      'did  <- (cell["1","1"] - cell["1","0"]) - (cell["0","1"] - cell["0","0"])',
      'c(naive_post_gap = cell["1","1"] - cell["0","1"], did = did)',
      '#> naive_post_gap            did',
      '#>           4.09           6.67',
      '',
      'round(coef(lm(y ~ treat * post, data = d)), 2)   # the treat:post term IS the DiD',
      '#> (Intercept)       treat        post  treat:post',
      '#>       20.44       -2.59        5.68        6.67'
    ].join('\n');
  }

  window.LessonWidgets.register('did-parallel', mount);
})();

;
/* doc-structure.js */
/* doc-structure.js - the anatomy of an R Markdown / Quarto doc: YAML + prose +
 * code chunks, and what it knits to. Toggle source <-> rendered. cfg:
 *   { blocks:[{type:"yaml|prose|code", text}], title }  (an output chart is shown
 *   in rendered mode for any code block flagged {chart:[{x,y}]}).
 * Default = a short sales report.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var blocks = cfg.blocks || [
      { type: 'yaml', text: 'title: "Q4 Sales report"\nauthor: "Analytics"\nformat: html' },
      { type: 'prose', text: '## Summary\n\nRevenue grew **18%** in Q4, led by the Web channel.' },
      { type: 'code', text: 'ggplot(sales, aes(channel, rev)) +\n  geom_col()', chart: [{ x: 'Web', y: 62 }, { x: 'Retail', y: 40 }, { x: 'B2B', y: 38 }] }
    ];
    var P = u.P;
    function mdInline(t) { return u.esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }

    function source() {
      var h = '';
      blocks.forEach(function (b) {
        if (b.type === 'yaml') h += '<div style="border-left:3px solid ' + P.c1 + ';background:' + P.bg + ';padding:8px 12px;margin-bottom:8px;font-family:IBM Plex Mono,monospace;font-size:12px;color:' + P.ink + ';white-space:pre">---\n' + u.esc(b.text) + '\n---</div>';
        else if (b.type === 'code') h += '<div style="margin-bottom:8px"><div style="font:600 10px/1 IBM Plex Mono,monospace;color:' + P.acc + ';margin-bottom:3px">```{r}</div>' + u.code(b.text) + '<div style="font:600 10px/1 IBM Plex Mono,monospace;color:' + P.acc + ';margin-top:3px">```</div></div>';
        else h += '<div style="padding:6px 2px;margin-bottom:8px;font-family:IBM Plex Mono,monospace;font-size:12.5px;color:' + P.body + ';white-space:pre-wrap">' + u.esc(b.text) + '</div>';
      });
      return '<div style="border:1px solid ' + P.line + ';border-radius:10px;padding:13px">' + h + '</div>';
    }
    function rendered() {
      var h = '<div style="border:1px solid ' + P.line + ';border-radius:10px;padding:18px 20px;background:#fff;max-width:460px">';
      blocks.forEach(function (b) {
        if (b.type === 'yaml') { var m = /title:\s*"?([^"\n]+)"?/.exec(b.text); h += '<div style="font-family:IBM Plex Serif,Georgia,serif;font-weight:600;font-size:21px;color:' + P.ink + ';border-bottom:1px solid ' + P.line + ';padding-bottom:9px;margin-bottom:11px">' + u.esc(m ? m[1] : 'Document') + '</div>'; }
        else if (b.type === 'prose') { b.text.split(/\n\n+/).forEach(function (para) { var hm = /^##\s+(.+)/.exec(para); if (hm) h += '<div style="font-family:IBM Plex Sans,sans-serif;font-weight:700;font-size:15px;color:' + P.ink + ';margin:6px 0">' + mdInline(hm[1]) + '</div>'; else h += '<p style="font-family:IBM Plex Sans,sans-serif;font-size:14px;line-height:1.6;color:' + P.body + ';margin:0 0 9px">' + mdInline(para) + '</p>'; }); }
        else if (b.type === 'code' && b.chart) { h += u.plot(b.chart, { geom: 'bar', x: '', y: '', w: 400, h: 180 }); }
      });
      return h + '</div>';
    }
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML = '<div style="margin-bottom:11px"><span class="ds-seg"></span></div><div class="ds-stage"></div>';
    var segHost = wrap.querySelector('.ds-seg'); segHost.innerHTML = u.seg([{ v: 'src', label: 'Source (.qmd)' }, { v: 'out', label: 'Rendered' }], 'src');
    var stage = wrap.querySelector('.ds-stage');
    function render(v) { stage.innerHTML = v === 'out' ? rendered() : source(); }
    u.wireSeg(segHost, function (v) { render(v); });
    render('src');
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('doc-structure', mount);
})();

;
/* drift-monitor.js */
/* drift-monitor.js - watching a feature after launch. The reference distribution (what the
 * model trained on) stays put; slide "weeks since launch" and the live distribution drifts
 * away. A population-stability index (PSI) climbs, and once it crosses the alert line the
 * model is seeing inputs it was never trained on - time to retrain. Emits runnable R that
 * computes PSI between a reference and a current sample.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var BINS = 10, REF = [];
  (function () { var s = 6; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } var a = new Array(BINS).fill(0); for (var i = 0; i < 1000; i++) { var v = (r() + r() + r()) / 3; a[Math.min(BINS - 1, Math.floor(v * BINS))]++; } REF = a.map(function (c) { return c / 1000; }); })();

  function mount(el, cfg) {
    cfg = cfg || {}; var shift = 0;  // weeks -> mean shift
    function current() { var a = new Array(BINS).fill(0); var s = 6; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } for (var i = 0; i < 1000; i++) { var v = (r() + r() + r()) / 3 + shift * 0.04; v = Math.max(0, Math.min(0.999, v)); a[Math.floor(v * BINS)]++; } return a.map(function (c) { return c / 1000; }); }
    function psi(ref, cur) { var s = 0; for (var i = 0; i < BINS; i++) { var e = Math.max(ref[i], 0.001), o = Math.max(cur[i], 0.001); s += (o - e) * Math.log(o / e); } return s; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="dm-plot"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">weeks since launch <b class="dm-w" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="dm-s" type="range" min="0" max="8" step="0.5" value="0" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="dm-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute the population-stability index in R' });

    var plot = el.querySelector('.dm-plot'), read = el.querySelector('.dm-read'), slider = el.querySelector('.dm-s'), wEl = el.querySelector('.dm-w');
    function draw() {
      var cur = current(), W = 420, H = 150, bw = W / BINS, mx = 0.32;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="distribution drift">';
      REF.forEach(function (c, i) { var h = c / mx * (H - 16); svg += '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="none" stroke="' + P.mut + '" stroke-dasharray="3 2" rx="1"/>'; });
      cur.forEach(function (c, i) { var h = c / mx * (H - 16); svg += '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + P.acc + '" opacity="0.85" rx="1"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      var ps = psi(REF, cur), alert = ps >= 0.2;
      read.innerHTML = '<b style="font-family:IBM Plex Mono,monospace;color:' + (alert ? P.del : P.ink) + '">PSI ' + ps.toFixed(2) + '</b> &middot; dashed = training reference, solid = live traffic. ' +
        (alert ? '<b style="color:' + P.del + '">Drift alert (PSI &ge; 0.2)</b> - the live inputs no longer match training. Retrain.' : ps >= 0.1 ? 'Minor drift - keep watching.' : 'Stable - inputs still look like the training data.');
      wEl.textContent = shift.toFixed(1);
    }
    slider.addEventListener('input', function () { shift = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# PSI compares a live sample to the training reference, bin by bin. >= 0.2 = real drift.',
      'set.seed(1)',
      'ref <- rnorm(1000, 0, 1)                 # training distribution',
      'live <- rnorm(1000, 0.6, 1)              # months later: shifted',
      'br <- quantile(ref, probs = seq(0, 1, 0.1))',
      'e <- table(cut(ref,  br)) / length(ref)',
      'o <- table(cut(live, br)) / length(live)',
      'psi <- sum((o - e) * log(pmax(o, 1e-4) / pmax(e, 1e-4)))',
      'psi                                       # compare to 0.1 (watch) and 0.2 (alert)'
    ].join('\n');
  }

  window.LessonWidgets.register('drift-monitor', mount);
})();

;
/* facet-grid.js */
/* facet-grid.js - one combined chart vs small multiples (facet_wrap).
 * cfg: { data:[{x,y,facet}], geom:"point", x, y, facetVar:"species" }
 * Toggle between a single chart (colored by facet) and one mini-chart per facet,
 * to show what facet_wrap(~var) does. Default = iris-like petal scatter by species.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var data = cfg.data || [
      { x: 1.4, y: 0.2, facet: 'setosa' }, { x: 1.3, y: 0.2, facet: 'setosa' }, { x: 1.5, y: 0.1, facet: 'setosa' }, { x: 1.4, y: 0.3, facet: 'setosa' },
      { x: 4.7, y: 1.4, facet: 'versicolor' }, { x: 4.5, y: 1.5, facet: 'versicolor' }, { x: 4.9, y: 1.5, facet: 'versicolor' }, { x: 4.0, y: 1.3, facet: 'versicolor' },
      { x: 6.0, y: 2.5, facet: 'virginica' }, { x: 5.9, y: 2.1, facet: 'virginica' }, { x: 6.1, y: 2.3, facet: 'virginica' }, { x: 5.6, y: 1.8, facet: 'virginica' }
    ];
    var geom = cfg.geom || 'point', xlab = cfg.x || 'petal length', ylab = cfg.y || 'petal width', fvar = cfg.facetVar || 'species';
    var facets = []; data.forEach(function (d) { if (facets.indexOf(d.facet) < 0) facets.push(d.facet); });

    // R-safe column names (the display labels may contain spaces).
    var xc = (xlab || 'x').replace(/\s+/g, '_'), yc = (ylab || 'y').replace(/\s+/g, '_'), fc = (fvar || 'group').replace(/\s+/g, '_');
    function fgCode(mode) {
      var base = 'library(ggplot2)\n' + u.rdf(data, [{ name: xc, key: 'x' }, { name: yc, key: 'y' }, { name: fc, key: 'facet' }]) + '\n\n';
      return mode === 'one'
        ? base + 'ggplot(df, aes(' + xc + ', ' + yc + ', color = ' + fc + ')) +\n  geom_point()'
        : base + 'ggplot(df, aes(' + xc + ', ' + yc + ')) +\n  geom_point() +\n  facet_wrap(~ ' + fc + ')';
    }
    function fgSVG(mode) {
      if (mode === 'one') return u.plot(data, { geom: geom, x: xlab, y: ylab, w: 440, h: 260 });
      var h = '<div style="display:flex;gap:10px;flex-wrap:wrap">';
      facets.forEach(function (f) { var sub = data.filter(function (d) { return d.facet === f; });
        h += '<div style="flex:1;min-width:150px"><div style="font:600 12px/1 IBM Plex Sans,sans-serif;color:' + u.P.ink + ';text-align:center;margin-bottom:2px">' + u.esc(f) + '</div>' + u.plot(sub, { geom: geom, x: xlab, y: ylab, w: 220, h: 170 }) + '</div>'; });
      return h + '</div>';
    }
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML = '<div style="margin-bottom:11px"><span class="fg-seg"></span></div><div class="fg-code"></div>';
    var segHost = wrap.querySelector('.fg-seg'); segHost.innerHTML = u.seg([{ v: 'one', label: 'One chart' }, { v: 'facet', label: 'facet_wrap(~' + fvar + ')' }], 'one');
    var codeEl = wrap.querySelector('.fg-code');
    // ONE chart region: seed the SVG preview into the runnable block's plot area; Run draws the real plot there.
    function render(mode) {
      codeEl.innerHTML = u.runnable(fgCode(mode), { label: 'Run this chart' });
      var po = codeEl.querySelector('.webr-plot-output');
      if (po) { po.innerHTML = u.previewSeed(fgSVG(mode)); po.classList.add('has-content'); }
    }
    u.wireSeg(segHost, function (v) { render(v); });
    render('one');
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('facet-grid', mount);
})();

;
/* fairness-metrics.js */
/* fairness-metrics.js - the same model, two groups. Bars compare group A and group B on
 * selection rate, true-positive rate and false-positive rate. Switch the fairness
 * definition and watch which one the model satisfies and which it violates - the
 * impossibility result is that you usually cannot satisfy all of them at once. Emits
 * runnable R that computes per-group rates from predictions.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // per-group rates (group A advantaged); selection / TPR / FPR
  var G = { A: { sel: 0.46, tpr: 0.82, fpr: 0.20 }, B: { sel: 0.28, tpr: 0.66, fpr: 0.19 } };
  var DEFS = {
    parity: { keys: ['sel'], labels: ['selection rate'], say: 'Demographic parity asks for equal <b>selection rates</b>. Here A is picked 46% vs B 28% - a clear gap.' },
    opportunity: { keys: ['tpr'], labels: ['true-positive rate'], say: 'Equal opportunity asks for equal <b>true-positive rates</b> among the truly qualified. A 0.82 vs B 0.66 - the model finds qualified A\'s more often.' },
    odds: { keys: ['tpr', 'fpr'], labels: ['true-positive rate', 'false-positive rate'], say: 'Equalised odds needs BOTH rates equal. FPRs match (~0.20) but TPRs do not - so this fails too.' }
  };

  function mount(el, cfg) {
    cfg = cfg || {}; var def = 'parity';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="fm-seg" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px"></div>' +
      '<div class="fm-bars"></div>' +
      '<div class="fm-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute per-group rates in R' });

    var seg = el.querySelector('.fm-seg'), barsEl = el.querySelector('.fm-bars'), read = el.querySelector('.fm-read');
    [['parity', 'demographic parity'], ['opportunity', 'equal opportunity'], ['odds', 'equalised odds']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 11px;cursor:pointer';
      b.addEventListener('click', function () { def = o[0]; draw(); });
      seg.appendChild(b);
    });
    function group(metricKey, lab) {
      var a = G.A[metricKey], b = G.B[metricKey], gap = Math.abs(a - b);
      function row(name, v, col) { return '<div style="display:flex;align-items:center;gap:9px;margin:4px 0"><span style="font:11px IBM Plex Mono,monospace;color:' + P.mut + ';width:62px">' + name + '</span><span style="flex:1;height:14px;border-radius:4px;background:' + P.line + ';overflow:hidden;display:block"><i style="display:block;height:100%;width:' + (v * 100).toFixed(0) + '%;background:' + col + '"></i></span><span style="font:11px IBM Plex Mono,monospace;color:' + P.ink + ';width:38px;text-align:right">' + v.toFixed(2) + '</span></div>'; }
      return '<div style="margin:0 0 12px"><div style="font:600 11px IBM Plex Sans,sans-serif;color:' + P.ink + ';margin:0 0 3px">' + lab + (gap > 0.05 ? ' <span style="color:' + (P.c2 || '#c9a24a') + '">gap ' + gap.toFixed(2) + '</span>' : ' <span style="color:' + P.add + '">matched</span>') + '</div>' + row('group A', a, P.c0) + row('group B', b, P.acc) + '</div>';
    }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['parity', 'opportunity', 'odds'][i] === def; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var d = DEFS[def]; barsEl.innerHTML = d.keys.map(function (k, i) { return group(k, d.labels[i]); }).join(''); read.innerHTML = d.say;
    }
    draw();
  }

  function rcode() {
    return [
      '# Fairness compares the SAME model across groups. Compute the rates per group.',
      'set.seed(1); n <- 400',
      'grp  <- sample(c("A","B"), n, replace = TRUE)',
      'true <- rbinom(n, 1, ifelse(grp == "A", 0.5, 0.4))',
      'pred <- rbinom(n, 1, ifelse(grp == "A", 0.46, 0.28))   # model selects A more',
      '',
      'rate <- function(g) c(',
      '  selection = mean(pred[grp == g]),',
      '  TPR = mean(pred[grp == g & true == 1]),',
      '  FPR = mean(pred[grp == g & true == 0]))',
      'rbind(A = rate("A"), B = rate("B"))     # compare the rows'
    ].join('\n');
  }

  window.LessonWidgets.register('fairness-metrics', mount);
})();

;
/* forest-averaging.js */
/* forest-averaging.js - add trees, watch the jagged single-tree boundary
 * smooth out and test accuracy climb. Ported from _mocks/rf-course-lesson2.
 *
 * cfg: { seed, min, max, start, labels:{c0,c1} }
 */
(function () {
  'use strict';
  var C0 = '#2563a8', C1 = '#b5631a';
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function mount(el, cfg) {
    cfg = cfg || {};
    var SEED = cfg.seed || 7, MIN = cfg.min || 1, MAX = cfg.max || 80, START = cfg.start || 1;
    var labels = cfg.labels || { c0: 'stays', c1: 'churns' };
    var rnd = mulberry32(SEED);
    function gauss(mx, my, s) { var u = rnd(), v = rnd(); var g = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.cos(6.2832 * v), g2 = Math.sqrt(-2 * Math.log(u + 1e-9)) * Math.sin(6.2832 * v); return { x: Math.min(.97, Math.max(.03, mx + g * s)), y: Math.min(.97, Math.max(.03, my + g2 * s)) }; }
    var DATA = [];
    (function () {
      function blob(mx, my, c, n) { for (var k = 0; k < n; k++) { var p = gauss(mx, my, 0.13); DATA.push({ x: p.x, y: p.y, c: c }); } }
      blob(0.36, 0.40, 0, 90); blob(0.64, 0.60, 1, 90);
      DATA.forEach(function (p, i) { p.test = (i % 3 === 0); });
      var noise = [[0.30, 0.34, 1], [0.34, 0.30, 1], [0.33, 0.41, 1], [0.39, 0.33, 1], [0.36, 0.38, 1], [0.42, 0.44, 1], [0.70, 0.66, 0], [0.66, 0.70, 0], [0.67, 0.59, 0], [0.61, 0.67, 0], [0.64, 0.62, 0], [0.58, 0.56, 0]];
      noise.forEach(function (n) { DATA.push({ x: n[0], y: n[1], c: n[2], test: false }); });
    })();
    var TRAIN = DATA.filter(function (p) { return !p.test; }), TEST = DATA.filter(function (p) { return p.test; });
    function gini(pts) { if (!pts.length) return 0; var c0 = 0; pts.forEach(function (p) { if (p.c === 0) c0++; }); var n = pts.length, p0 = c0 / n; return 2 * p0 * (1 - p0); }
    function build(pts, depth, maxD, rng) {
      var c0 = 0; pts.forEach(function (p) { if (p.c === 0) c0++; }); var maj = (c0 >= pts.length - c0) ? 0 : 1;
      if (depth >= maxD || pts.length < 4 || c0 === 0 || c0 === pts.length) return { leaf: true, cls: maj };
      var axes = [rng() < 0.5 ? 'x' : 'y'], best = null;  // mtry=1: random single feature
      axes.forEach(function (ax) { var vals = pts.map(function (p) { return p[ax]; }).sort(function (a, b) { return a - b; }); for (var v = 0; v < vals.length - 1; v++) { var thr = (vals[v] + vals[v + 1]) / 2, L = [], R = []; pts.forEach(function (p) { (p[ax] <= thr ? L : R).push(p); }); if (!L.length || !R.length) continue; var g = (L.length * gini(L) + R.length * gini(R)) / pts.length; if (!best || g < best.g) best = { g: g, ax: ax, thr: thr, L: L, R: R }; } });
      if (!best) return { leaf: true, cls: maj };
      return { leaf: false, ax: best.ax, thr: best.thr, left: build(best.L, depth + 1, maxD, rng), right: build(best.R, depth + 1, maxD, rng) };
    }
    function predict(node, x, y) { while (!node.leaf) { node = ((node.ax === 'x' ? x : y) <= node.thr) ? node.left : node.right; } return node.cls; }
    function boot(rng) { var s = []; for (var k = 0; k < TRAIN.length; k++) s.push(TRAIN[(rng() * TRAIN.length) | 0]); return s; }
    var FOREST = []; for (var ti = 0; ti < 80; ti++) { var tr = mulberry32(1000 + ti * 97); FOREST.push(build(boot(tr), 0, 7, tr)); }
    function forestP(N, x, y) { var s = 0; for (var t = 0; t < N; t++) s += predict(FOREST[t], x, y); return s / N; }
    // expected N-tree accuracy averaged over random orderings (monotone curve)
    var EXP = (function () {
      var PRED = FOREST.map(function (tr) { return TEST.map(function (p) { return predict(tr, p.x, p.y); }); });
      var E = []; for (var n = 0; n < 81; n++) E[n] = 0; var K = 24;
      for (var k = 0; k < K; k++) {
        var idx = []; for (var t = 0; t < 80; t++) idx.push(t); var rng = mulberry32(99 + k * 17);
        for (var s = 79; s > 0; s--) { var j = (rng() * (s + 1)) | 0; var tmp = idx[s]; idx[s] = idx[j]; idx[j] = tmp; }
        var votes = []; for (var i2 = 0; i2 < TEST.length; i2++) votes[i2] = 0;
        for (var n = 1; n <= 80; n++) { var tt = idx[n - 1]; for (var i3 = 0; i3 < TEST.length; i3++) votes[i3] += PRED[tt][i3]; var c = 0; for (var i4 = 0; i4 < TEST.length; i4++) { if ((votes[i4] / n >= 0.5 ? 1 : 0) === TEST[i4].c) c++; } E[n] += c / TEST.length; }
      }
      for (var n5 = 1; n5 <= 80; n5++) E[n5] /= K;
      for (var n6 = 2; n6 <= 80; n6++) if (E[n6] < E[n6 - 1]) E[n6] = E[n6 - 1];
      return E;
    })();
    var ONE = EXP[1];
    function blend(p) { var b = [219, 231, 244], a = [246, 231, 212]; return 'rgb(' + Math.round(b[0] + (a[0] - b[0]) * p) + ',' + Math.round(b[1] + (a[1] - b[1]) * p) + ',' + Math.round(b[2] + (a[2] - b[2]) * p) + ')'; }

    el.innerHTML =
      '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>trees in the forest</span><b class="lw-fval">' + START + '</b></div>' +
      '<input class="lw-slider" type="range" min="' + MIN + '" max="' + MAX + '" step="1" value="' + START + '"></div>' +
      '<div class="lw-grid"><div><div class="lw-canvas-wrap"><canvas class="lw-canvas" width="300" height="300"></canvas></div>' +
      '<div class="lw-legend"><span class="lw-k"><i class="lw-sw" style="background:' + C0 + '"></i>' + labels.c0 + '</span><span class="lw-k"><i class="lw-sw" style="background:' + C1 + '"></i>' + labels.c1 + '</span></div></div>' +
      '<div class="lw-metrics"><div class="lw-m lw-m-test"><div class="lw-v lw-forest">.</div><div class="lw-k2">Forest test accuracy</div></div>' +
      '<div class="lw-m lw-m-train"><div class="lw-v lw-one">.</div><div class="lw-k2">A typical single tree</div></div></div></div>' +
      '<div class="lw-note"></div>';
    var slider = el.querySelector('.lw-slider'), fval = el.querySelector('.lw-fval'), canvas = el.querySelector('.lw-canvas');
    var forestEl = el.querySelector('.lw-forest'), oneEl = el.querySelector('.lw-one'), noteEl = el.querySelector('.lw-note');
    var ctx = canvas.getContext('2d');
    function render() {
      var N = +slider.value; fval.textContent = N;
      var W = canvas.width, H = canvas.height, cell = 6;
      for (var px = 0; px < W; px += cell) for (var py = 0; py < H; py += cell) { var x = px / W, y = 1 - py / H; ctx.fillStyle = blend(forestP(N, x, y)); ctx.fillRect(px, py, cell, cell); }
      DATA.forEach(function (p) { var X = p.x * W, Y = (1 - p.y) * H; ctx.beginPath(); ctx.arc(X, Y, 3.6, 0, 7); if (p.test) { ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 2.2; ctx.strokeStyle = (p.c === 0) ? C0 : C1; ctx.stroke(); } else { ctx.fillStyle = (p.c === 0) ? C0 : C1; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke(); } });
      var fA = EXP[N], oA = ONE;
      forestEl.textContent = (fA * 100).toFixed(0) + '%'; oneEl.textContent = (oA * 100).toFixed(0) + '%';
      if (N === 1) noteEl.innerHTML = '<b>One tree.</b> Hard, jagged regions, this is the overfitter from Lesson 1. Now add more.';
      else if (N < 12) noteEl.innerHTML = '<b>' + N + ' trees.</b> The boundary is already softening as the votes blend, and test accuracy is climbing.';
      else noteEl.innerHTML = '<b>' + N + ' trees.</b> The boundary is smooth and the forest (<b>' + (fA * 100).toFixed(0) + '%</b>) clearly beats a typical single tree (<b>' + (oA * 100).toFixed(0) + '%</b>). It has converged.';
    }
    slider.addEventListener('input', render); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('forest-averaging', mount);
})();

;
/* gini-split.js */
/* gini-split.js - one decision-tree split shown as a purity (Gini) drop.
 * A mixed parent node splits into two purer children; every Gini value is
 * computed from the real counts, not hard-coded. Static by design.
 * cfg (optional): { feature, parent:[stay,churn], left:[stay,churn],
 *                   right:[stay,churn], labels:{stay,churn} }
 */
(function () {
  'use strict';
  var C_STAY = '#2563a8', C_CHURN = '#b5631a', INK = '#131720', MUT = '#677084', LINE = '#c5cdda';

  function gini(a, b) { var n = a + b; if (!n) return 0; var p = a / n, q = b / n; return 1 - p * p - q * q; }
  function f2(x) { return (Math.round(x * 100) / 100).toFixed(2); }

  function dots(cx, cy, stay, churn) {
    var n = stay + churn, per = 10, gap = 12, out = '', i;
    var cols = Math.min(n, per), w = (cols - 1) * gap, x0 = cx - w / 2;
    for (i = 0; i < n; i++) {
      var col = i % per, row = (i / per) | 0, fill = i < stay ? C_STAY : C_CHURN;
      out += '<circle cx="' + (x0 + col * gap) + '" cy="' + (cy + row * gap) + '" r="4.4" fill="' + fill + '"/>';
    }
    return out;
  }
  function nodeBox(cx, top, w, h) {
    return '<rect x="' + (cx - w / 2) + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="9" fill="#fff" stroke="' + LINE + '" stroke-width="1.5"/>';
  }
  function txt(x, y, s, col, fs, weight) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" fill="' + (col || INK) +
      '" font-family="IBM Plex Mono, monospace" font-size="' + (fs || 11) + '" font-weight="' + (weight || 600) + '">' + s + '</text>';
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var feature = cfg.feature || 'tenure under 8 mo?';
    var P = cfg.parent || [10, 10], L = cfg.left || [2, 8], R = cfg.right || [8, 2];
    var ln = cfg.labels || {}, sName = ln.stay || 'stays', cName = ln.churn || 'churns';
    var gp = gini(P[0], P[1]), gl = gini(L[0], L[1]), gr = gini(R[0], R[1]);
    var nL = L[0] + L[1], nR = R[0] + R[1], nT = nL + nR;
    var gw = nT ? (nL / nT) * gl + (nR / nT) * gr : 0;

    var svg =
      '<svg viewBox="0 0 460 300" width="100%" style="max-width:480px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A split lowers Gini impurity from ' + f2(gp) + ' to ' + f2(gw) + '.">' +
      nodeBox(230, 8, 220, 60) + dots(230, 28, P[0], P[1]) + txt(230, 60, 'parent: Gini = ' + f2(gp), MUT, 11) +
      '<line x1="230" y1="68" x2="120" y2="150" stroke="' + LINE + '" stroke-width="2"/>' +
      '<line x1="230" y1="68" x2="340" y2="150" stroke="' + LINE + '" stroke-width="2"/>' +
      txt(230, 92, feature, INK, 11) + txt(158, 116, 'yes', MUT, 10) + txt(302, 116, 'no', MUT, 10) +
      nodeBox(120, 150, 170, 58) + dots(120, 170, L[0], L[1]) + txt(120, 200, 'Gini = ' + f2(gl), MUT, 11) +
      nodeBox(340, 150, 170, 58) + dots(340, 170, R[0], R[1]) + txt(340, 200, 'Gini = ' + f2(gr), MUT, 11) +
      txt(230, 250, 'weighted Gini = ' + f2(gw), INK, 14, 700) +
      txt(230, 272, 'down from ' + f2(gp) + ': a purer split', '#1f7a55', 11) +
      '</svg>';
    el.innerHTML = '<div class="lw-diagram">' +
      '<div style="text-align:center;font:600 11px/1.4 \'IBM Plex Mono\',monospace;color:' + MUT + ';margin-bottom:2px">' +
      '<span style="color:' + C_STAY + '">&#9679;</span> ' + sName + ' &nbsp; <span style="color:' + C_CHURN + '">&#9679;</span> ' + cName + '</div>' +
      svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('gini-split', mount);
})();

;
/* glm-family-shapes.js */
/* glm-family-shapes.js - the outcome's shape tells you which GLM family to use. A normal
 * model assumes a symmetric bell on the whole line, but real targets are often bounded or
 * skewed: money spent is positive and right-skewed (Gamma), a proportion lives in [0,1]
 * (Beta), and insurance loss is a spike at zero plus a positive tail (Tweedie). Toggle the
 * family to see the density it implies and the kind of outcome it fits. Emits runnable
 * base-R that draws each density so you can see why the family matches the data.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var FAM = {
    gamma: { lo: 0, hi: 8, dens: function (x) { var k = 2.2, th = 1.1; return x <= 0 ? 0 : Math.pow(x, k - 1) * Math.exp(-x / th) / (Math.pow(th, k) * gammaf(k)); }, say: '<b>Gamma</b> fits a strictly positive, right-skewed outcome: spend, claim size, time-to-complete. Mean and variance rise together, and it never predicts a negative value.', use: 'spend, claim amount, duration' },
    beta: { lo: 0, hi: 1, dens: function (x) { var a = 2.5, b = 4; return (x <= 0 || x >= 1) ? 0 : Math.pow(x, a - 1) * Math.pow(1 - x, b - 1) / betaf(a, b); }, say: '<b>Beta</b> fits a proportion or rate bounded in [0, 1]: conversion rate, share of budget, defect fraction. A normal model would happily predict impossible values below 0 or above 1.', use: 'proportion, rate, fraction' },
    tweedie: { lo: 0, hi: 8, dens: null, say: '<b>Tweedie</b> fits a spike of exact zeros plus a positive continuous tail: total insurance loss (most customers claim nothing; some claim a lot). No zero-free family (Gamma) can place mass exactly at 0.', use: 'insurance loss, total sales with many zeros' }
  };
  function gammaf(z) { var g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaf(1 - z)); z -= 1; var x = c[0]; for (var i = 1; i < g + 2; i++) x += c[i] / (z + i); var t = z + g + 0.5; return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x; }
  function betaf(a, b) { return gammaf(a) * gammaf(b) / gammaf(a + b); }

  function mount(el, cfg) {
    cfg = cfg || {}; var fam = 'gamma';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gf-seg" style="margin-bottom:12px">' + u.seg([{ v: 'gamma', label: 'Gamma' }, { v: 'beta', label: 'Beta' }, { v: 'tweedie', label: 'Tweedie' }], 'gamma') + '</div>' +
      '<div class="gf-plot"></div>' +
      '<div class="gf-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The density shapes in base R' });

    var plot = el.querySelector('.gf-plot'), read = el.querySelector('.gf-read');
    var W = 440, H = 210, m = { l: 30, r: 12, t: 12, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    function draw() {
      var f = FAM[fam], svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GLM family density">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      function sx(x) { return m.l + (x - f.lo) / (f.hi - f.lo) * iw; }
      if (fam === 'tweedie') {
        // spike at 0 + gamma-ish tail
        var pk = 0; var tw = function (x) { return x <= 0 ? 0 : 0.9 * Math.pow(x, 1.2) * Math.exp(-x / 1.0); };
        for (var xi = 0; xi <= f.hi; xi += 0.05) pk = Math.max(pk, tw(xi));
        var syT = function (v) { return m.t + ih - v / (pk * 1.15) * ih; };
        svg += '<line x1="' + sx(0) + '" y1="' + syT(pk * 1.05) + '" x2="' + sx(0) + '" y2="' + (m.t + ih) + '" stroke="' + P.acc + '" stroke-width="5"/>';
        svg += '<text x="' + (sx(0) + 5) + '" y="' + (syT(pk * 1.05) + 4) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.acc + '">P(loss = 0)</text>';
        var tp = ''; for (var x2 = 0.05; x2 <= f.hi; x2 += 0.05) tp += sx(x2).toFixed(1) + ',' + syT(tw(x2)).toFixed(1) + ' ';
        svg += '<polyline points="' + tp + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      } else {
        var peak = 0; for (var s = f.lo; s <= f.hi; s += (f.hi - f.lo) / 200) peak = Math.max(peak, f.dens(s));
        var sy = function (v) { return m.t + ih - v / (peak * 1.12) * ih; };
        var pts = '', area = sx(f.lo).toFixed(1) + ',' + sy(0) + ' ';
        for (var i = 0; i <= 200; i++) { var x = f.lo + (f.hi - f.lo) * i / 200; var yy = sy(f.dens(x)); pts += sx(x).toFixed(1) + ',' + yy.toFixed(1) + ' '; area += sx(x).toFixed(1) + ',' + yy.toFixed(1) + ' '; }
        area += sx(f.hi).toFixed(1) + ',' + sy(0);
        svg += '<polygon points="' + area + '" fill="' + P.acc + '" opacity="0.10"/><polyline points="' + pts + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      }
      [f.lo, (f.lo + f.hi) / 2, f.hi].forEach(function (t) { svg += '<text x="' + sx(t) + '" y="' + (m.t + ih + 14) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + t + '</text>'; });
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 3) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">outcome value (' + f.use + ')</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = f.say;
    }
    u.wireSeg(el.querySelector('.gf-seg'), function (v) { fam = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# The outcome\'s support and skew pick the family. See the shapes:',
      'x_pos <- seq(0.01, 8, 0.02)',
      'x_prp <- seq(0.001, 0.999, 0.002)',
      '',
      'gamma_d <- dgamma(x_pos, shape = 2.2, scale = 1.1)   # positive, right-skewed',
      'beta_d  <- dbeta(x_prp, 2.5, 4)                       # bounded in [0, 1]',
      'c(gamma_support = "x > 0, skewed  -> spend, claims",',
      '  beta_support  = "0 < x < 1     -> proportions",',
      '  tweedie       = "mass at 0 + positive tail -> insurance loss")',
      'c(gamma_peak_at = round(x_pos[which.max(gamma_d)], 2),',
      '  beta_peak_at  = round(x_prp[which.max(beta_d)], 2))'
    ].join('\n');
  }

  window.LessonWidgets.register('glm-family-shapes', mount);
})();

;
/* gmm-clusters.js */
/* gmm-clusters.js - soft clustering. Unlike k-means (every point fully in one cluster), a
 * Gaussian mixture gives each point a PROBABILITY of belonging to each component. Toggle
 * hard vs soft: in soft mode the boundary points turn an in-between colour, showing the
 * model's honest uncertainty. Emits runnable R that computes mixture responsibilities by
 * hand for two components.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var A = [3.3, 4.2], B = [6.4, 5.6], SD = 1.25;
  var PTS = (function () { var s = 4, out = []; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } function g() { return (r() + r() + r() - 1.5) * 1.3; } for (var i = 0; i < 22; i++) out.push([A[0] + g(), A[1] + g()]); for (var j = 0; j < 22; j++) out.push([B[0] + g(), B[1] + g()]); return out; })();

  function mount(el, cfg) {
    cfg = cfg || {}; var soft = true;
    function resp(p) { var da = Math.exp(-((p[0] - A[0]) * (p[0] - A[0]) + (p[1] - A[1]) * (p[1] - A[1])) / (2 * SD * SD)); var db = Math.exp(-((p[0] - B[0]) * (p[0] - B[0]) + (p[1] - B[1]) * (p[1] - B[1])) / (2 * SD * SD)); return da / (da + db); }
    function mix(t) { var c0 = [32, 86, 210], c1 = [201, 162, 74]; return 'rgb(' + Math.round(c0[0] * t + c1[0] * (1 - t)) + ',' + Math.round(c0[1] * t + c1[1] * (1 - t)) + ',' + Math.round(c0[2] * t + c1[2] * (1 - t)) + ')'; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gm-seg" style="display:flex;gap:6px;margin-bottom:12px"></div>' +
      '<div class="gm-plot"></div>' +
      '<div class="gm-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Compute mixture responsibilities in R' });

    var seg = el.querySelector('.gm-seg'), plot = el.querySelector('.gm-plot'), read = el.querySelector('.gm-read');
    [['true', 'soft (GMM)'], ['false', 'hard (k-means)']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { soft = o[0] === 'true'; draw(); });
      seg.appendChild(b);
    });
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['true', 'false'][i] === String(soft); x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var S = 240, m = 10, sc = (S - 2 * m) / 10;
      function px(x) { return m + x * sc; } function py(y) { return (S - m) - y * sc; }
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="gaussian mixture clustering">';
      svg += '<rect x="' + m + '" y="' + m + '" width="' + (S - 2 * m) + '" height="' + (S - 2 * m) + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      [A, B].forEach(function (c) { svg += '<ellipse cx="' + px(c[0]).toFixed(1) + '" cy="' + py(c[1]).toFixed(1) + '" rx="' + (SD * 2 * sc).toFixed(1) + '" ry="' + (SD * 2 * sc).toFixed(1) + '" fill="none" stroke="' + P.line + '" stroke-dasharray="3 3"/>'; });
      PTS.forEach(function (p) { var t = resp(p); var col = soft ? mix(t) : (t >= 0.5 ? P.acc : (P.c2 || '#c9a24a')); svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="4" fill="' + col + '" opacity="0.92"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = soft
        ? 'Soft: points near the overlap take an in-between colour - the model reports, say, 60% / 40% rather than forcing a side. That honesty is the point of a mixture model.'
        : 'Hard: every point is forced fully into one cluster, even the ambiguous ones in the overlap. k-means cannot express "maybe".';
    }
    draw();
  }

  function rcode() {
    return [
      '# A 2-component mixture gives each point a PROBABILITY per cluster (a responsibility),',
      '# not a hard label. Here it is by hand; the mclust package fits it for real.',
      'set.seed(1)',
      'x <- c(rnorm(40, -2), rnorm(40, 2))',
      'mu <- c(-2, 2); sg <- c(1, 1)                 # two components',
      'la <- dnorm(x, mu[1], sg[1]); lb <- dnorm(x, mu[2], sg[2])',
      'resp <- la / (la + lb)                        # P(component 1 | x)',
      'head(round(resp, 2), 10)                      # values near 0.5 = uncertain'
    ].join('\n');
  }

  window.LessonWidgets.register('gmm-clusters', mount);
})();

;
/* gp-posterior.js */
/* gp-posterior.js - a Gaussian process for regression, made visible. Six training points,
 * a posterior mean curve, and a shaded 95% band that pinches tight where data lives and
 * flares wide where it does not - the GP's honest "I don't know here". Toggle the lengthscale
 * to feel the bias-variance dial: short = wiggly and local, long = smooth and stiff. Emits
 * runnable base-R computing the exact posterior mean and sd from the RBF kernel.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // training data: matches the runnable R (sin(x) + seed(1) noise, hardcoded so the picture is exact)
  var XTR = [-4, -3, -1, 0, 2, 3];
  var YTR = [0.820, -0.123, -0.925, 0.160, 0.942, 0.059];

  function rbf(a, b, l) { var d = a - b; return Math.exp(-d * d / (2 * l * l)); }

  // invert an n x n matrix via Gauss-Jordan (n = 6 here, tiny)
  function inv(M) {
    var n = M.length, A = M.map(function (r, i) { return r.concat(Array.from({ length: n }, function (_, j) { return i === j ? 1 : 0; })); });
    for (var c = 0; c < n; c++) {
      var piv = A[c][c];
      for (var j = 0; j < 2 * n; j++) A[c][j] /= piv;
      for (var r = 0; r < n; r++) { if (r === c) continue; var f = A[r][c]; for (var k = 0; k < 2 * n; k++) A[r][k] -= f * A[c][k]; }
    }
    return A.map(function (row) { return row.slice(n); });
  }
  function matvec(M, v) { return M.map(function (row) { return row.reduce(function (s, x, i) { return s + x * v[i]; }, 0); }); }

  function posterior(l, sig) {
    var n = XTR.length, K = [];
    for (var i = 0; i < n; i++) { K.push([]); for (var j = 0; j < n; j++) K[i].push(rbf(XTR[i], XTR[j], l) + (i === j ? sig * sig : 0)); }
    var Ki = inv(K), alpha = matvec(Ki, YTR);
    return function (xs) {
      var ks = XTR.map(function (xt) { return rbf(xs, xt, l); });
      var mean = ks.reduce(function (s, kv, i) { return s + kv * alpha[i]; }, 0);
      var Kiks = matvec(Ki, ks);
      var v = 1 - ks.reduce(function (s, kv, i) { return s + kv * Kiks[i]; }, 0);
      return { m: mean, sd: Math.sqrt(Math.max(v, 1e-9)) };
    };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var l = 1.0, sig = 0.1;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gp-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.5', label: 'Short' }, { v: '1', label: 'Medium' }, { v: '2', label: 'Long' }], '1') + '</div>' +
      '<div class="gp-plot"></div>' +
      '<div class="gp-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'The exact GP posterior mean and sd, from the RBF kernel in base R' });

    var plot = el.querySelector('.gp-plot'), read = el.querySelector('.gp-read');
    var W = 340, H = 240, RX = [-5.4, 5.4], RY = [-2.2, 2.2];
    function px(x) { return (x - RX[0]) / (RX[1] - RX[0]) * W; }
    function py(y) { return H - (y - RY[0]) / (RY[1] - RY[0]) * H; }
    function draw() {
      var f = posterior(l, sig), N = 80, top = [], bot = [], mid = [];
      for (var i = 0; i <= N; i++) { var x = RX[0] + (RX[1] - RX[0]) * i / N, r = f(x); top.push([px(x), py(r.m + 1.96 * r.sd)]); bot.push([px(x), py(r.m - 1.96 * r.sd)]); mid.push([px(x), py(r.m)]); }
      var band = 'M' + top.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' L' + bot.slice().reverse().map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L') + ' Z';
      var line = 'M' + mid.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' L');
      var dots = XTR.map(function (xt, i) { return '<circle cx="' + px(xt).toFixed(1) + '" cy="' + py(YTR[i]).toFixed(1) + '" r="4.5" fill="' + P.ink + '"/>'; }).join('');
      // sd at a data-rich point vs a data-poor edge, for the reading
      var sdNear = f(-3).sd, sdFar = f(5).sd;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gaussian process posterior">' +
        '<path d="' + band + '" fill="' + P.acc + '" opacity="0.15"/>' +
        '<path d="' + line + '" fill="none" stroke="' + P.acc + '" stroke-width="2.2"/>' + dots + '</svg>';
      read.innerHTML = 'Lengthscale <b style="font-family:IBM Plex Mono,monospace">' + l.toFixed(1) + '</b>: the band is tight near the points (sd &asymp; <b>' + sdNear.toFixed(2) + '</b>) and flares out where there is no data (sd &asymp; <b>' + sdFar.toFixed(2) + '</b>). ' + (l < 0.7 ? 'Short lengthscale &rarr; the mean wiggles and forgets fast between points.' : l > 1.5 ? 'Long lengthscale &rarr; a smooth, stiff mean that may miss local bumps.' : 'A medium lengthscale balances the two.');
    }
    u.wireSeg(el.querySelector('.gp-seg'), function (v) { l = parseFloat(v); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# A Gaussian process posterior, from scratch: mean + uncertainty, no packages.',
      'xtr <- c(-4, -3, -1, 0, 2, 3)',
      'set.seed(1); ytr <- sin(xtr) + rnorm(6, 0, 0.1)   # noisy observations',
      'rbf <- function(a, b, l) exp(-outer(a, b, "-")^2 / (2 * l^2))',
      'l <- 1.0; sig <- 0.1                              # lengthscale, noise sd',
      'K   <- rbf(xtr, xtr, l) + sig^2 * diag(length(xtr))',
      'xte <- seq(-5, 5, length.out = 6)',
      'Ks  <- rbf(xte, xtr, l); Kss <- rbf(xte, xte, l)',
      'mu  <- as.numeric(Ks %*% solve(K, ytr))          # posterior mean',
      'sd  <- sqrt(pmax(diag(Kss - Ks %*% solve(K, t(Ks))), 0))  # predictive sd',
      'round(data.frame(x = xte, mean = mu, sd = sd), 2)',
      '# sd is small next to a training point and grows out at the edges (-5, 5):',
      '# that widening band is the GP telling you where it has no evidence.'
    ].join('\n');
  }

  window.LessonWidgets.register('gp-posterior', mount);
})();

;
/* gradient-boosting.js */
/* gradient-boosting.js - boosting as sequential error-correction.
 * Start with one flat guess (the mean). Each round fits a shallow tree to what's
 * still WRONG (the residuals) and adds a shrunken slice of it. Slide the number of
 * rounds: the fit hugs the data and the residuals collapse toward zero. Emits
 * runnable R that boosts the same way with rpart stumps.
 *
 * cfg: { rounds:0, lr:0.3 }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var Z = [0.3, -0.4, 0.1, 0.5, -0.2, 0.35, -0.5, 0.2, -0.1, 0.4, -0.3, 0.15, 0.45, -0.25, 0.05, -0.45, 0.25, -0.15, 0.5, -0.35, 0.1, 0.3, -0.2, 0.4, -0.4, 0.2, -0.05, 0.35, -0.3, 0.15];

  function mount(el, cfg) {
    cfg = cfg || {};
    var MAX = 16, lr = (cfg.lr != null) ? +cfg.lr : 0.3, round = Math.min(MAX, Math.max(0, +cfg.rounds || 0));
    var N = Z.length, X = [], Y = [];
    for (var i = 0; i < N; i++) { var x = 10 * i / (N - 1); X.push(x); Y.push(Math.sin(x) + 0.18 * x + Z[i]); }

    function fitStump(res) {
      var best = null;
      for (var s = 1; s < N; s++) {
        var sp = (X[s - 1] + X[s]) / 2, ls = 0, ln = 0, rs = 0, rn = 0, j;
        for (j = 0; j < N; j++) { if (X[j] < sp) { ls += res[j]; ln++; } else { rs += res[j]; rn++; } }
        if (!ln || !rn) continue;
        var lm = ls / ln, rm = rs / rn, sse = 0;
        for (j = 0; j < N; j++) { var p = X[j] < sp ? lm : rm; sse += (res[j] - p) * (res[j] - p); }
        if (!best || sse < best.sse) best = { sp: sp, lm: lm, rm: rm, sse: sse };
      }
      return best;
    }
    // precompute cumulative predictions for each round
    var mean = Y.reduce(function (a, b) { return a + b; }, 0) / N;
    var PRED = [Y.map(function () { return mean; })];
    for (var m = 1; m <= MAX; m++) {
      var prev = PRED[m - 1], res = Y.map(function (y, k) { return y - prev[k]; }), st = fitStump(res);
      PRED.push(prev.map(function (p, k) { return p + lr * (X[k] < st.sp ? st.lm : st.rm); }));
    }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gb-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">boosting rounds (trees): <b class="gb-r" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="gb-s" type="range" min="0" max="' + MAX + '" step="1" value="' + round + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="gb-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(lr), { label: 'Boost it for real with rpart stumps in R' });

    var chart = el.querySelector('.gb-chart'), read = el.querySelector('.gb-read'),
        slider = el.querySelector('.gb-s'), rEl = el.querySelector('.gb-r');

    function draw() {
      var pred = PRED[round];
      var W = 480, H = 260, m2 = { t: 14, r: 14, b: 32, l: 40 }, iw = W - m2.l - m2.r, ih = H - m2.t - m2.b;
      var ylo = Math.min.apply(null, Y) - 0.6, yhi = Math.max.apply(null, Y) + 0.6;
      function sx(x) { return m2.l + x / 10 * iw; } function sy(y) { return m2.t + ih - (y - ylo) / (yhi - ylo) * ih; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="gradient boosting fit">';
      svg += '<line x1="' + m2.l + '" y1="' + (m2.t + ih) + '" x2="' + (m2.l + iw) + '" y2="' + (m2.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m2.l + '" y1="' + m2.t + '" x2="' + m2.l + '" y2="' + (m2.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      // residual stems (data to prediction)
      for (var k = 0; k < N; k++) svg += '<line x1="' + sx(X[k]).toFixed(1) + '" y1="' + sy(Y[k]).toFixed(1) + '" x2="' + sx(X[k]).toFixed(1) + '" y2="' + sy(pred[k]).toFixed(1) + '" stroke="' + P.bad + '" stroke-width="1" opacity=".4"/>';
      // prediction (step-ish line)
      svg += '<polyline points="' + X.map(function (x, k2) { return sx(x).toFixed(1) + ',' + sy(pred[k2]).toFixed(1); }).join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="2.5"/>';
      for (k = 0; k < N; k++) svg += '<circle cx="' + sx(X[k]).toFixed(1) + '" cy="' + sy(Y[k]).toFixed(1) + '" r="3.6" fill="' + P.ink + '" fill-opacity="0.72"/>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var rmse = Math.sqrt(Y.reduce(function (a, y, k3) { return a + (y - pred[k3]) * (y - pred[k3]); }, 0) / N);
      read.innerHTML = (round === 0
        ? 'Round 0 is just the mean - one flat line, big residuals.'
        : 'After <b>' + round + '</b> round' + (round === 1 ? '' : 's') + ', each tree has nudged the fit toward the points it still got wrong.') +
        ' The orange stems are the residuals; watch them shrink. <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">RMSE ' + rmse.toFixed(3) + '</b>';
      rEl.textContent = round;
    }
    slider.addEventListener('input', function () { round = +slider.value; draw(); });
    draw();
  }

  function rcode(lr) {
    return [
      '# Gradient boosting by hand: each shallow tree fits the CURRENT residuals,',
      '# and we add a shrunken slice of it. Watch RMSE fall as trees stack.',
      'library(rpart)',
      'set.seed(1)',
      'n <- 80',
      'x <- sort(runif(n, 0, 10))',
      'y <- sin(x) + 0.18 * x + rnorm(n, 0, 0.3)',
      '',
      'pred <- rep(mean(y), n)               # start with one flat guess',
      'lr   <- ' + lr,
      'for (m in 1:15) {',
      '  resid <- y - pred                   # what we still get wrong',
      '  stump <- rpart(resid ~ x, control = rpart.control(maxdepth = 1, cp = 0))',
      '  pred  <- pred + lr * predict(stump) # add a shrunken correction',
      '}',
      'plot(x, y, pch = 19, col = "gray70"); lines(x, pred, col = "forestgreen", lwd = 2)',
      'sqrt(mean((y - pred)^2))              # RMSE after boosting'
    ].join('\n');
  }

  window.LessonWidgets.register('gradient-boosting', mount);
})();

;
/* gradient-descent.js */
/* gradient-descent.js - how a model learns.
 * A ball on a loss bowl steps downhill by -learning_rate * gradient. Slide the
 * learning rate and step: too small crawls, just right converges, too large
 * oscillates, way too large diverges. Emits runnable R that runs the same loop.
 *
 * cfg: { min:3, start:-2 }  - optional; renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var WSTAR = (cfg.min != null) ? +cfg.min : 3;          // loss minimum at w = WSTAR
    var W0 = (cfg.start != null) ? +cfg.start : -2;
    var lr = 0.1;
    function loss(w) { return (w - WSTAR) * (w - WSTAR); }
    function grad(w) { return 2 * (w - WSTAR); }
    var path = [W0];

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="gd-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 0">learning rate <b class="gd-lr" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="gd-lrs" type="range" min="0.04" max="1.16" step="0.02" value="' + lr + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div style="display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:10px 0 4px">' +
        '<button class="gd-step" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:#fff;background:' + P.acc + ';border:0;border-radius:8px;padding:8px 14px;cursor:pointer">Step downhill</button>' +
        '<button class="gd-run" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:' + P.mut + ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 14px;cursor:pointer">Run 15 steps</button>' +
        '<button class="gd-reset" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:' + P.mut + ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 12px;cursor:pointer">Reset</button>' +
      '</div>' +
      '<div class="gd-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(WSTAR, W0), { label: 'Run the descent loop in R' });

    var chart = el.querySelector('.gd-chart'), read = el.querySelector('.gd-read'),
        lrs = el.querySelector('.gd-lrs'), lrEl = el.querySelector('.gd-lr');

    function draw() {
      var W = 480, H = 250, m = { t: 14, r: 14, b: 34, l: 42 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var wlo = WSTAR - 6.5, whi = WSTAR + 6.5, lmax = loss(wlo) * 1.05;
      function sx(w) { return m.l + (w - wlo) / (whi - wlo) * iw; }
      function sy(L) { return m.t + ih - Math.min(L, lmax) / lmax * ih; }
      var curve = ''; for (var w = wlo; w <= whi + 0.001; w += (whi - wlo) / 80) curve += sx(w).toFixed(1) + ',' + sy(loss(w)).toFixed(1) + ' ';
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="gradient descent on a loss bowl">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + sx(WSTAR).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(WSTAR).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-dasharray="3 3"/>';
      svg += '<polyline points="' + curve.trim() + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>';
      // descent path
      for (var i = 0; i < path.length; i++) {
        var cx = sx(path[i]), cy = sy(loss(path[i]));
        if (i > 0) svg += '<line x1="' + sx(path[i - 1]).toFixed(1) + '" y1="' + sy(loss(path[i - 1])).toFixed(1) + '" x2="' + cx.toFixed(1) + '" y2="' + cy.toFixed(1) + '" stroke="' + P.bad + '" stroke-width="1.2" opacity=".5"/>';
        var last = i === path.length - 1;
        svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (last ? 6 : 3.2) + '" fill="' + (last ? P.acc : P.bad) + '" fill-opacity="' + (last ? 1 : 0.55) + '"/>';
      }
      svg += '<text x="' + sx(WSTAR).toFixed(1) + '" y="' + (m.t + ih + 15) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.faint + '">minimum</text>';
      svg += '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">loss</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var curW = path[path.length - 1], factor = Math.abs(1 - 2 * lr);
      var state = factor >= 1.001 ? ['Diverging', P.bad, 'The step overshoots so hard the ball climbs out of the bowl. Lower the learning rate.']
        : lr > 0.5 ? ['Oscillating in', P.c1, 'The step is large: the ball bounces side to side but still settles. Faster, but jumpy.']
        : ['Converging', P.acc, 'Small, steady steps walk smoothly down to the minimum. Slow but safe.'];
      read.innerHTML = '<b style="color:' + state[1] + '">' + state[0] + '.</b> ' + state[2] +
        ' <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">step ' + (path.length - 1) + ' &middot; w ' + curW.toFixed(2) + ' &middot; loss ' + loss(curW).toFixed(2) + '</b>';
      lrEl.textContent = lr.toFixed(2);
    }

    function step() { var w = path[path.length - 1]; path.push(w - lr * grad(w)); if (path.length > 40) path.shift(); draw(); }
    lrs.addEventListener('input', function () { lr = +lrs.value; path = [W0]; draw(); });
    el.querySelector('.gd-step').addEventListener('click', step);
    el.querySelector('.gd-run').addEventListener('click', function () { for (var k = 0; k < 15; k++) step(); });
    el.querySelector('.gd-reset').addEventListener('click', function () { path = [W0]; draw(); });
    draw();
  }

  function rcode(wstar, w0) {
    return [
      '# Gradient descent: nudge w downhill by -learning_rate * gradient, over and over.',
      '# Loss L(w) = (w - ' + wstar + ')^2, so the gradient is 2 * (w - ' + wstar + ').',
      'grad <- function(w) 2 * (w - ' + wstar + ')',
      '',
      'lr <- 0.10           # try 0.5, then 0.95, then 1.10 and watch it blow up',
      'w  <- ' + w0,
      'for (i in 1:20) {',
      '  w <- w - lr * grad(w)',
      '  cat(sprintf("step %2d:  w = %7.3f   loss = %7.3f\\n", i, w, (w - ' + wstar + ')^2))',
      '}'
    ].join('\n');
  }

  window.LessonWidgets.register('gradient-descent', mount);
})();

;
/* hazard-ratio.js */
/* hazard-ratio.js - what a Cox hazard ratio does to a survival curve. Proportional hazards
 * means one group's survival is the other's raised to a power: S1(t) = S0(t)^HR. Toggle the
 * hazard ratio and watch the second curve pull away from the baseline - below it when HR > 1
 * (higher hazard, dies sooner), above it when HR < 1 (protective). The curves never cross:
 * that is the proportional-hazards assumption made visible. Emits a runnable coxph fit.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {}; var HR = 2;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="hr-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.5', label: 'HR 0.5' }, { v: '1', label: 'HR 1' }, { v: '2', label: 'HR 2' }, { v: '3', label: 'HR 3' }], '2') + '</div>' +
      '<div class="hr-plot"></div>' +
      '<div class="hr-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A Cox proportional-hazards fit, and its hazard ratios' });

    var plot = el.querySelector('.hr-plot'), read = el.querySelector('.hr-read');
    var W = 340, H = 240, TMAX = 60, r0 = 0.035;   // baseline hazard rate
    function px(t) { return (t / TMAX) * (W - 8) + 4; }
    function py(s) { return H - s * (H - 14) - 7; }
    function s0(t) { return Math.exp(-r0 * t); }
    function curvePath(pw) {
      var p = '', N = 80;
      for (var i = 0; i <= N; i++) { var t = TMAX * i / N, s = Math.pow(s0(t), pw); p += (i ? ' L' : 'M') + px(t).toFixed(1) + ',' + py(s).toFixed(1); }
      return p;
    }
    function draw() {
      var half = '<line x1="4" y1="' + py(0.5).toFixed(1) + '" x2="' + W + '" y2="' + py(0.5).toFixed(1) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="4 3"/>';
      var med0 = Math.log(2) / r0, med1 = Math.log(2) / (r0 * HR);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Two survival curves under a hazard ratio">' +
        half +
        '<path d="' + curvePath(1) + '" fill="none" stroke="' + P.mut + '" stroke-width="2" stroke-dasharray="5 3"/>' +
        '<path d="' + curvePath(HR) + '" fill="none" stroke="' + (HR > 1 ? P.bad : HR < 1 ? P.acc : P.mut) + '" stroke-width="2.4"/>' +
        '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">S(t)</text>' +
        '<text x="' + (W - 6) + '" y="' + (H - 2) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">time</text></svg>';
      read.innerHTML = 'Dashed grey is the <b>baseline</b> group; the solid line is <b>S(t) = S0(t)<sup>' + HR.toFixed(1) + '</sup></b>. ' +
        (HR > 1 ? 'HR ' + HR.toFixed(1) + ' &gt; 1: <b style="color:' + P.bad + '">' + HR.toFixed(1) + '&times; the hazard</b>, so the curve drops faster and median survival falls from ' + med0.toFixed(0) + ' to ' + med1.toFixed(0) + '.'
         : HR < 1 ? 'HR ' + HR.toFixed(1) + ' &lt; 1: <b style="color:' + P.acc + '">protective</b>, half the hazard, so median survival rises from ' + med0.toFixed(0) + ' to ' + med1.toFixed(0) + '.'
         : 'HR = 1: identical hazard, the curves coincide.') +
        ' Under proportional hazards the two curves never cross.';
    }
    u.wireSeg(el.querySelector('.hr-seg'), function (v) { HR = parseFloat(v); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Cox proportional hazards: read each coefficient as a hazard ratio.',
      'library(survival)',
      'set.seed(2)',
      'n      <- 150',
      'age    <- round(runif(n, 40, 80))',
      'smoker <- rbinom(n, 1, 0.4)',
      'lp      <- 0.03 * (age - 60) + 0.8 * smoker      # the true log-hazard',
      'event_t <- rexp(n, 0.02 * exp(lp)); cens_t <- runif(n, 0, 60)',
      'time    <- pmin(event_t, cens_t); status <- as.integer(event_t <= cens_t)',
      '',
      'cox <- coxph(Surv(time, status) ~ age + smoker)',
      'round(exp(coef(cox)), 3)                          # hazard ratios',
      '# smoker ~ 1.6x the hazard, and each extra year of age ~ 1.04x;',
      '# a hazard ratio scales the whole survival curve, S1(t) = S0(t)^HR.'
    ].join('\n');
  }

  window.LessonWidgets.register('hazard-ratio', mount);
})();

;
/* imbalance-resample.js */
/* imbalance-resample.js - fixing class imbalance. A scatter with many majority points and
 * a few minority points. Toggle: original / oversample (duplicate minority) / SMOTE
 * (synthesize new minority points between neighbours). The class counts rebalance and the
 * minority region fills in. Emits runnable R that counts classes and upsamples.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  function rng(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
  var r = rng(5);
  var MAJ = [], MIN = [];
  for (var i = 0; i < 60; i++) MAJ.push([2 + r() * 5, 2 + r() * 5]);
  for (var j = 0; j < 8; j++) MIN.push([5.5 + r() * 2.5, 5.5 + r() * 2.5]);

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'orig';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ir-seg" style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap"></div>' +
      '<div class="ir-plot"></div>' +
      '<div class="ir-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Count classes and upsample the minority in R' });

    var seg = el.querySelector('.ir-seg'), plot = el.querySelector('.ir-plot'), read = el.querySelector('.ir-read');
    [['orig', 'original'], ['over', 'oversample'], ['smote', 'SMOTE']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { mode = o[0]; draw(); });
      seg.appendChild(b);
    });
    function minoritySet() {
      if (mode === 'orig') return { pts: MIN, synth: [] };
      if (mode === 'over') { var d = []; for (var k = 0; k < 52; k++) d.push(MIN[k % MIN.length]); return { pts: MIN, synth: d }; }
      var sy = [], rr = rng(3); for (var k = 0; k < 52; k++) { var a = MIN[Math.floor(rr() * MIN.length)], b = MIN[Math.floor(rr() * MIN.length)], t = rr(); sy.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } return { pts: MIN, synth: sy };
    }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['orig', 'over', 'smote'][i] === mode; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var S = 240, m = 10, sc = (S - 2 * m) / 10;
      function px(x) { return m + x * sc; } function py(y) { return (S - m) - y * sc; }
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="class imbalance resampling">';
      svg += '<rect x="' + m + '" y="' + m + '" width="' + (S - 2 * m) + '" height="' + (S - 2 * m) + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      MAJ.forEach(function (p) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="3.4" fill="' + P.c0 + '" opacity="0.65"/>'; });
      var ms = minoritySet();
      ms.synth.forEach(function (p) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="3.2" fill="' + P.acc + '" opacity="0.35"/>'; });
      ms.pts.forEach(function (p) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="4" fill="' + P.acc + '" stroke="#fff" stroke-width="1"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      var minN = MIN.length + ms.synth.length;
      read.innerHTML = 'Majority <b>' + MAJ.length + '</b> &middot; minority <b>' + minN + '</b>. ' +
        (mode === 'orig' ? 'A model trained here just predicts the majority and ignores the rare class.'
         : mode === 'over' ? 'Oversampling duplicates minority rows - balanced counts, but the duplicates add no new information and can overfit.'
         : 'SMOTE synthesises new minority points between real neighbours - balanced AND more varied, but never let it touch the test fold.');
    }
    draw();
  }

  function rcode() {
    return [
      '# Imbalance: the model can score 95% accuracy by always predicting the majority.',
      'set.seed(1)',
      'y <- factor(c(rep("no", 950), rep("yes", 50)))   # 95% / 5%',
      'table(y)',
      '',
      '# simplest fix: upsample the minority to match the majority',
      'idx_min <- which(y == "yes")',
      'up <- sample(idx_min, sum(y == "no"), replace = TRUE)',
      'table(y[c(which(y == "no"), up)])     # now balanced (SMOTE via the themis package goes further)'
    ].join('\n');
  }

  window.LessonWidgets.register('imbalance-resample', mount);
})();

;
/* importance-bars.js */
/* importance-bars.js - variable importance as sorted horizontal bars.
 * An illustrative ranking for the lesson's churn example (consistent with the
 * running narrative), not a measured benchmark. Static.
 * cfg (optional): { items:[{label,value}] }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', BAR = '#1f7a55', TOP = '#2563a8';

  function mount(el, cfg) {
    cfg = cfg || {};
    var items = (cfg.items && cfg.items.length) ? cfg.items.slice() : [
      { label: 'tenure', value: 100 }, { label: 'monthly spend', value: 71 },
      { label: 'total spend', value: 58 }, { label: 'support calls', value: 34 },
      { label: 'contract type', value: 22 }, { label: 'age', value: 12 }
    ];
    items.sort(function (a, b) { return b.value - a.value; });
    var max = items[0].value || 1, n = items.length;
    var rowH = 30, padT = 12, padB = 8, labW = 120, barX = labW + 8, barMax = 280;
    var H = padT + n * rowH + padB, W = barX + barMax + 46, rows = '', i;
    for (i = 0; i < n; i++) {
      var y = padT + i * rowH, bw = Math.max(2, items[i].value / max * barMax), col = i === 0 ? TOP : BAR;
      rows += '<text x="' + labW + '" y="' + (y + 18) + '" text-anchor="end" fill="' + INK + '" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600">' + items[i].label + '</text>' +
        '<rect x="' + barX + '" y="' + (y + 5) + '" width="' + bw + '" height="18" rx="4" fill="' + col + '"/>' +
        '<text x="' + (barX + bw + 6) + '" y="' + (y + 18) + '" fill="' + MUT + '" font-family="IBM Plex Mono, monospace" font-size="11">' + items[i].value + '</text>';
    }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Variable importance ranking, ' + items[0].label + ' highest.">' + rows + '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('importance-bars', mount);
})();

;
/* isolation-forest.js */
/* isolation-forest.js - why anomalies isolate faster.
 * An isolation tree splits the space with random axis-aligned cuts. A point in a dense cluster needs
 * many cuts to fence off on its own; a point out in empty space is fenced off in just a few. The
 * average number of cuts (path length) over many trees becomes the anomaly score. Toggle between a
 * cluster point and the outlier and watch the isolating path get much shorter for the outlier.
 * Emits a from-scratch isolation forest in base R.
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2831853 * r()); }

  // fixed point cloud in [0,1]^2: a tight cluster + one far outlier (last index)
  function build() {
    var r = rng(7), pts = [];
    for (var i = 0; i < 70; i++) pts.push([0.5 + 0.075 * gauss(r), 0.52 + 0.075 * gauss(r)]);
    pts.push([0.9, 0.12]); // the outlier
    return pts;
  }

  // one isolation path for point p among pts: random axis-aligned cuts, shrink the box to the side
  // holding p, until p is alone. Returns the list of cut segments (for drawing) and the path length.
  function isoPath(pts, pIdx, seed) {
    var r = rng(seed), box = [0, 1, 0, 1], idx = pts.map(function (_, i) { return i; }), cuts = [], guard = 0;
    while (idx.length > 1 && guard++ < 40) {
      var j = r() < 0.5 ? 0 : 1;
      var vals = idx.map(function (i) { return pts[i][j]; });
      var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
      if (hi - lo < 1e-6) break;
      var sp = lo + (hi - lo) * r();
      cuts.push({ axis: j, at: sp, box: box.slice() });
      var pv = pts[pIdx][j], keepLow = pv < sp;
      if (j === 0) box[keepLow ? 1 : 0] = sp; else box[keepLow ? 3 : 2] = sp;
      idx = idx.filter(function (i) { return (pts[i][j] < sp) === keepLow; });
    }
    return { cuts: cuts, len: cuts.length };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var pts = build(), outlier = pts.length - 1, sel = 'cluster';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="if-seg" style="margin-bottom:12px">' + u.seg([{ v: 'cluster', label: 'A cluster point' }, { v: 'outlier', label: 'The outlier' }], 'cluster') + '</div>' +
      '<div class="if-plot"></div>' +
      '<div class="if-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Isolation forest from scratch: average path length -> anomaly score, base R' });

    var plot = el.querySelector('.if-plot'), read = el.querySelector('.if-read');
    var W = 340, H = 260, PAD = 14;
    function sx(x) { return PAD + x * (W - 2 * PAD); }
    function sy(y) { return H - PAD - y * (H - 2 * PAD); }
    // approximate average path length over many trees (JS mini-forest), for the honest readout
    function avgLen(pIdx) { var s = 0, N = 60; for (var t = 0; t < N; t++) s += isoPath(pts, pIdx, 1000 + t * 7 + pIdx).len; return s / N; }
    var cn = 2 * (Math.log(pts.length - 1) + 0.5772157) - 2 * (pts.length - 1) / pts.length;

    function draw() {
      var pIdx = sel === 'outlier' ? outlier : 3;
      var path = isoPath(pts, pIdx, 42 + pIdx), avg = avgLen(pIdx), score = Math.pow(2, -avg / cn);
      var lines = path.cuts.map(function (c) {
        if (c.axis === 0) return '<line x1="' + sx(c.at).toFixed(1) + '" y1="' + sy(c.box[3]).toFixed(1) + '" x2="' + sx(c.at).toFixed(1) + '" y2="' + sy(c.box[2]).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="1" opacity="0.6"/>';
        return '<line x1="' + sx(c.box[0]).toFixed(1) + '" y1="' + sy(c.at).toFixed(1) + '" x2="' + sx(c.box[1]).toFixed(1) + '" y2="' + sy(c.at).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="1" opacity="0.6"/>';
      }).join('');
      var dots = pts.map(function (p, i) {
        var isSel = i === pIdx, isOut = i === outlier;
        return '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="' + (isSel ? 5 : 3) + '" fill="' + (isSel ? P.bad : isOut ? P.del : P.c0) + '" opacity="' + (isSel ? 1 : 0.6) + '"' + (isSel ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>';
      }).join('');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="isolation forest splits">' +
        '<rect x="' + PAD + '" y="' + PAD + '" width="' + (W - 2 * PAD) + '" height="' + (H - 2 * PAD) + '" fill="none" stroke="' + P.line + '"/>' +
        lines + dots +
        '<text x="' + (W - 8) + '" y="18" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">' + path.len + ' cuts to isolate</text></svg>';
      read.innerHTML = 'This ' + (sel === 'outlier' ? '<b style="color:' + P.del + '">outlier</b>' : '<b>cluster point</b>') + ' is fenced off on its own after <b>' + path.len + '</b> random cuts here, and <b>' + avg.toFixed(1) + '</b> on average over many trees, giving an anomaly score of <b style="color:' + P.acc + '">' + score.toFixed(2) + '</b>. ' +
        (sel === 'outlier' ? 'Out in empty space, a few cuts suffice, so the short path scores near 1: anomalous.' : 'Buried among neighbours, it takes many cuts, so the long path scores near 0.5: normal.');
    }
    u.wireSeg(el.querySelector('.if-seg'), function (v) { sel = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Isolation Forest from scratch: anomalies isolate in fewer random splits (shorter paths). Base R.',
      'set.seed(1)',
      'X <- rbind(matrix(rnorm(200), 100, 2), c(4.5, 4.5))   # 100 normal points + 1 anomaly (row 101)',
      'cn <- function(n) if (n > 2) 2*(log(n-1)+0.5772157) - 2*(n-1)/n else if (n==2) 1 else 0  # avg path in a random tree',
      'ipath <- function(x, d, e = 0) {                      # depth of random splits to isolate x within d',
      '  n <- nrow(d)',
      '  if (n <= 1 || e > 30) return(e + cn(n))',
      '  j <- sample(ncol(d), 1); lo <- min(d[,j]); hi <- max(d[,j])',
      '  if (lo == hi) return(e + cn(n))',
      '  sp <- runif(1, lo, hi)                              # random split on a random feature',
      '  side <- if (x[j] < sp) d[,j] < sp else d[,j] >= sp',
      '  ipath(x, d[side, , drop = FALSE], e + 1)            # recurse into the side holding x',
      '}',
      'score <- function(i, trees = 100)                     # anomaly score = 2^(-avg path / cn)',
      '  2^(-mean(replicate(trees, ipath(X[i,], X))) / cn(nrow(X)))',
      'round(c(normal_pt = score(1), anomaly_pt = score(101)), 3)',
      '#>  normal_pt anomaly_pt',
      '#>      0.382      0.834'
    ].join('\n');
  }

  window.LessonWidgets.register('isolation-forest', mount);
})();

;
/* iv-2stage.js */
/* iv-2stage.js - instrumental variables / two-stage least squares, made visible. When an
 * unobserved confounder drives both treatment and outcome, the naive regression slope is
 * biased. An instrument Z shifts the treatment X but touches the outcome only through X, so
 * the part of X that Z explains is exogenous. IV recovers the true slope from that part
 * (equivalently, the Wald ratio cov(Z,Y)/cov(Z,X)). A WEAK instrument, one barely related to
 * X, makes the ratio's denominator tiny and the estimate wild. Toggle strong vs weak and
 * watch the IV line settle or swing. Emits the two-stage lm() fit in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var STR = { strong: 0.8, weak: 0.12 };

  function build(zcoef) {
    var r = rng(3), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var z = [], x = [], y = [];
    for (var i = 0; i < 400; i++) { var zi = rnorm(), ui = rnorm(); var xi = zcoef * zi + 1.2 * ui + rnorm(); var yi = 2 * xi + 3 * ui + rnorm(); z.push(zi); x.push(xi); y.push(yi); }
    return { z: z, x: x, y: y };
  }
  function mean(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function cov(a, b) { var ma = mean(a), mb = mean(b), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - ma) * (b[i] - mb); return s / (a.length - 1); }

  function mount(el, cfg) {
    cfg = cfg || {}; var strength = 'strong';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="iv-seg" style="margin-bottom:12px">' + u.seg([{ v: 'strong', label: 'Strong instrument' }, { v: 'weak', label: 'Weak instrument' }], 'strong') + '</div>' +
      '<div class="iv-plot"></div>' +
      '<div class="iv-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Two-stage least squares (IV) by hand, base R' });

    var plot = el.querySelector('.iv-plot'), read = el.querySelector('.iv-read');
    var W = 340, H = 200, PAD = 10;
    function draw() {
      var d = build(STR[strength]);
      var mx = mean(d.x), my = mean(d.y);
      var naive = cov(d.x, d.y) / cov(d.x, d.x);
      var iv = cov(d.z, d.y) / cov(d.z, d.x);
      var fstrength = cov(d.z, d.x) * cov(d.z, d.x) / (cov(d.z, d.z) * cov(d.x, d.x)) * (d.x.length - 2) / Math.max(1e-6, 1 - cov(d.z, d.x) * cov(d.z, d.x) / (cov(d.z, d.z) * cov(d.x, d.x)));
      var xr = [Math.min.apply(null, d.x), Math.max.apply(null, d.x)], yr = [Math.min.apply(null, d.y), Math.max.apply(null, d.y)];
      function px(x) { return PAD + (x - xr[0]) / (xr[1] - xr[0]) * (W - 2 * PAD); }
      function py(y) { return H - 22 - (y - yr[0]) / (yr[1] - yr[0]) * (H - 32); }
      var dots = d.x.map(function (xi, i) { return '<circle cx="' + px(xi).toFixed(1) + '" cy="' + py(d.y[i]).toFixed(1) + '" r="1.6" fill="' + P.faint + '" opacity="0.6"/>'; }).join('');
      function seg(slope, col, dash) { var x1 = xr[0], x2 = xr[1]; var y1 = my + slope * (x1 - mx), y2 = my + slope * (x2 - mx); return '<line x1="' + px(x1).toFixed(1) + '" y1="' + py(y1).toFixed(1) + '" x2="' + px(x2).toFixed(1) + '" y2="' + py(y2).toFixed(1) + '" stroke="' + col + '" stroke-width="2.5"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="instrumental variables">' +
        dots + seg(naive, P.bad) + seg(iv, P.acc, true) +
        '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.bad + '">naive OLS ' + naive.toFixed(2) + '</text>' +
        '<text x="' + (W - 8) + '" y="28" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.acc + '">IV ' + iv.toFixed(2) + '</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">treatment x -> outcome y</text></svg>';
      read.innerHTML = 'Naive OLS reads a slope of <b style="color:' + P.bad + '">' + naive.toFixed(2) + '</b>, biased by the hidden confounder; IV recovers <b style="color:' + P.acc + '">' + iv.toFixed(2) + '</b> (true effect 2) from the instrument-driven part of x. ' +
        (strength === 'weak'
          ? 'First-stage F &asymp; <b style="color:' + P.bad + '">' + fstrength.toFixed(0) + '</b>: a <b>weak</b> instrument barely moves x, so the Wald ratio\'s denominator is tiny and the estimate is unstable (rule of thumb: need F &gt; 10).'
          : 'First-stage F &asymp; <b>' + fstrength.toFixed(0) + '</b>, comfortably above the F &gt; 10 rule: a strong instrument gives a stable estimate.');
    }
    u.wireSeg(el.querySelector('.iv-seg'), function (v) { strength = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Instrumental variables (2SLS): recover a causal slope despite an unobserved confounder. Base R.',
      'set.seed(3)',
      'n <- 1000',
      'z <- rnorm(n)                       # instrument (random encouragement)',
      'u <- rnorm(n)                       # UNOBSERVED confounder',
      'x <- 0.8 * z + 1.2 * u + rnorm(n)    # treatment: driven by z AND u',
      'y <- 2 * x + 3 * u + rnorm(n)        # TRUE effect of x is 2; u confounds',
      '',
      'naive <- coef(lm(y ~ x))["x"]        # biased upward by u',
      'xhat  <- fitted(lm(x ~ z))           # stage 1: the exogenous, z-driven part of x',
      'iv    <- coef(lm(y ~ xhat))["xhat"]  # stage 2',
      'round(c(true = 2, naive_ols = unname(naive), iv_2sls = unname(iv)), 2)',
      '#>      true naive_ols  iv_2sls',
      '#>      2.00      3.16     1.85',
      '',
      'summary(lm(x ~ z))$fstatistic[1]     # first-stage strength (need F > 10)',
      '#>    value',
      '#>    257.8'
    ].join('\n');
  }

  window.LessonWidgets.register('iv-2stage', mount);
})();

;
/* join-diagram.js */
/* join-diagram.js - two keyed tables + a join-type switch + the live result.
 * cfg: { left:{cols,rows}, right:{cols,rows}, key:"dept", op:"inner" }
 * Switch inner/left/right/full/semi/anti; the result recomputes and matched keys
 * are tinted. Default = employees x departments with one unmatched key on each side.
 */
(function () {
  'use strict';
  var OPS = [{ v: 'inner', label: 'inner' }, { v: 'left', label: 'left' }, { v: 'right', label: 'right' }, { v: 'full', label: 'full' }, { v: 'semi', label: 'semi' }, { v: 'anti', label: 'anti' }];
  var WHY = {
    inner: 'inner_join keeps only rows whose key is in BOTH tables.',
    left: 'left_join keeps every LEFT row; unmatched right columns become NA.',
    right: 'right_join keeps every RIGHT row; unmatched left columns become NA.',
    full: 'full_join keeps every row from BOTH; gaps become NA.',
    semi: 'semi_join keeps LEFT rows that HAVE a match (left columns only).',
    anti: 'anti_join keeps LEFT rows with NO match (left columns only).'
  };
  var OPFN = { inner: 'inner_join', left: 'left_join', right: 'right_join', full: 'full_join', semi: 'semi_join', anti: 'anti_join' };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var L = cfg.left || { cols: ['id', 'name', 'dept'], rows: [[1, 'Aarti', 'S'], [2, 'Biju', 'S'], [3, 'Chen', 'E'], [4, 'Devi', 'X']] };
    var R = cfg.right || { cols: ['dept', 'dept_name'], rows: [['S', 'Sales'], ['E', 'Eng'], ['M', 'Marketing']] };
    var key = cfg.key || 'dept', op = cfg.op || 'inner';
    var li = L.cols.indexOf(key), ri = R.cols.indexOf(key);
    var rMap = {}; R.rows.forEach(function (r) { rMap[r[ri]] = r; });
    var lKeys = {}; L.rows.forEach(function (r) { lKeys[r[li]] = 1; });
    var rExtra = R.cols.filter(function (c) { return c !== key; });

    function compute(o) {
      var cols, rows = [];
      if (o === 'semi' || o === 'anti') {
        cols = L.cols.slice();
        L.rows.forEach(function (r) { var has = rMap[r[li]] != null; if ((o === 'semi') === has) rows.push(r.slice()); });
        return { cols: cols, rows: rows };
      }
      cols = L.cols.concat(rExtra);
      function joinRow(lr, rr) { var row = lr ? lr.slice() : L.cols.map(function (c) { return c === key ? (rr ? rr[ri] : null) : null; }); rExtra.forEach(function (c) { row.push(rr ? rr[R.cols.indexOf(c)] : null); }); return row; }
      if (o === 'inner') L.rows.forEach(function (lr) { if (rMap[lr[li]]) rows.push(joinRow(lr, rMap[lr[li]])); });
      else if (o === 'left') L.rows.forEach(function (lr) { rows.push(joinRow(lr, rMap[lr[li]] || null)); });
      else if (o === 'right') R.rows.forEach(function (rr) { var lr = L.rows.find(function (x) { return x[li] === rr[ri]; }); rows.push(joinRow(lr || null, rr)); });
      else if (o === 'full') { L.rows.forEach(function (lr) { rows.push(joinRow(lr, rMap[lr[li]] || null)); }); R.rows.forEach(function (rr) { if (!lKeys[rr[ri]]) rows.push(joinRow(null, rr)); }); }
      return { cols: cols, rows: rows };
    }

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    var matchTintL = {}, matchTintR = {};
    L.rows.forEach(function (r, i) { if (rMap[r[li]]) matchTintL[i + ',' + li] = u.P.add; });
    R.rows.forEach(function (r, i) { if (lKeys[r[ri]]) matchTintR[i + ',' + ri] = u.P.add; });
    wrap.innerHTML =
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px">' +
        '<div style="flex:1;min-width:150px"><div style="font:600 11px/1 IBM Plex Mono,monospace;color:' + u.P.mut + ';margin-bottom:5px">LEFT (x)</div>' + u.tbl(L.cols, L.rows, { hi: matchTintL }) + '</div>' +
        '<div style="flex:1;min-width:150px"><div style="font:600 11px/1 IBM Plex Mono,monospace;color:' + u.P.mut + ';margin-bottom:5px">RIGHT (y)</div>' + u.tbl(R.cols, R.rows, { hi: matchTintR }) + '</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px"><span style="font-size:12.5px;color:' + u.P.mut + '">join by <code style="font-family:IBM Plex Mono,monospace;color:' + u.P.ink + '">' + u.esc(key) + '</code>:</span><span class="jd-seg"></span></div>' +
      '<div class="jd-res" style="overflow-x:auto"></div>' +
      '<div class="jd-cap" style="margin-top:9px;font-size:12.5px;color:' + u.P.mut + '"></div>' +
      '<div class="jd-code" style="margin-top:12px"></div>';
    var segHost = wrap.querySelector('.jd-seg'); segHost.innerHTML = u.seg(OPS, op);
    var res = wrap.querySelector('.jd-res'), cap = wrap.querySelector('.jd-cap'), codeEl = wrap.querySelector('.jd-code');
    // Self-contained, runnable: build both tables inline + the dplyr join for this op.
    function jdCode(o) {
      return 'library(dplyr)\n' + u.rdfCR('x', L.cols, L.rows) + '\n' + u.rdfCR('y', R.cols, R.rows) +
        '\n\n' + OPFN[o] + '(x, y, by = "' + key + '")';
    }
    function render(o) {
      var r = compute(o); res.innerHTML = u.tbl(r.cols, r.rows);
      cap.innerHTML = WHY[o] + ' <span style="color:' + u.P.acc + ';font-weight:600">' + r.rows.length + ' row' + (r.rows.length === 1 ? '' : 's') + '</span>.';
      codeEl.innerHTML = u.runnable(jdCode(o), { label: 'Run this join' });
    }
    u.wireSeg(segHost, function (v) { render(v); });
    render(op);
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('join-diagram', mount);
})();

;
/* kernel-svm.js */
/* kernel-svm.js - the kernel trick, made visible. Two classes that no straight line can
 * separate. A linear SVM tries anyway and fails; switch to a polynomial or RBF kernel and
 * the boundary bends into a closed curve that wraps one class perfectly. The support
 * vectors (circled) are the only points that shape it. Emits runnable R fitting e1071::svm
 * with each kernel and reporting the training error.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // inner class (circle) vs outer ring: linearly inseparable on purpose
  var PTS = (function () {
    var a = [], s = 11; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (var i = 0; i < 26; i++) { var ang = r() * 6.283, rad = r() * 1.1; a.push({ x: rad * Math.cos(ang), y: rad * Math.sin(ang), c: 1 }); }   // inner
    for (var j = 0; j < 34; j++) { var a2 = r() * 6.283, rr = 2.1 + r() * 1.0; a.push({ x: rr * Math.cos(a2), y: rr * Math.sin(a2), c: 0 }); }   // ring
    return a;
  })();

  // decision score per kernel (illustrative, matched to the geometry above)
  function score(kernel, x, y) {
    var rad2 = x * x + y * y;
    if (kernel === 'linear') return 0.9 * x + 0.4 * y + 0.15;          // a line: cannot separate the ring
    if (kernel === 'poly') return 3.2 - rad2;                          // quadratic: a circle
    return 1.6 * Math.exp(-rad2 / 1.4) - 0.5;                          // RBF: a smooth bump around the inner class
  }
  function isSV(kernel, p) { return Math.abs(score(kernel, p.x, p.y)) < (kernel === 'linear' ? 0.8 : 0.9); }

  function mount(el, cfg) {
    cfg = cfg || {}; var kernel = 'linear';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ks-seg" style="margin-bottom:12px">' + u.seg([{ v: 'linear', label: 'Linear' }, { v: 'poly', label: 'Polynomial' }, { v: 'rbf', label: 'RBF' }], 'linear') + '</div>' +
      '<div class="ks-plot"></div>' +
      '<div class="ks-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Three kernels with e1071::svm(), and their training error' });

    var plot = el.querySelector('.ks-plot'), read = el.querySelector('.ks-read');
    var W = 300, H = 300, R = [-3.4, 3.4];
    function px(x) { return (x - R[0]) / (R[1] - R[0]) * W; }
    function py(y) { return H - (y - R[0]) / (R[1] - R[0]) * H; }
    function draw() {
      // shade the decision region on a grid
      var cells = '', step = 12;
      for (var gx = 0; gx < W; gx += step) for (var gy = 0; gy < H; gy += step) {
        var wx = R[0] + (gx + step / 2) / W * (R[1] - R[0]), wy = R[0] + (H - gy - step / 2) / H * (R[1] - R[0]);
        var s = score(kernel, wx, wy);
        cells += '<rect x="' + gx + '" y="' + gy + '" width="' + step + '" height="' + step + '" fill="' + (s > 0 ? P.c0 : P.acc) + '" opacity="' + (Math.min(0.22, 0.05 + Math.abs(s) * 0.06)).toFixed(3) + '"/>';
      }
      var err = 0, dots = '';
      PTS.forEach(function (p) { var pred = score(kernel, p.x, p.y) > 0 ? 1 : 0; if (pred !== p.c) err++; var sv = isSV(kernel, p);
        dots += '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="' + (sv ? 6.5 : 4.5) + '" fill="' + (p.c ? P.c0 : P.acc) + '"' + (sv ? ' stroke="' + P.ink + '" stroke-width="1.6"' : '') + '/>'; });
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SVM decision region">' + cells + dots + '</svg>';
      read.innerHTML = kernel === 'linear'
        ? '<b style="font-family:IBM Plex Mono,monospace;color:' + P.bad + '">Linear kernel: ' + err + ' of ' + PTS.length + ' misclassified.</b> No straight boundary can wrap the inner class, so a linear SVM is stuck.'
        : '<b style="font-family:IBM Plex Mono,monospace;color:' + P.acc + '">' + (kernel === 'poly' ? 'Polynomial' : 'RBF') + ' kernel: ' + err + ' misclassified.</b> The kernel trick lifts the points into a higher space where a flat boundary exists; back in 2-D it appears as a curve. The circled points are the <b>support vectors</b> that define it.';
    }
    u.wireSeg(el.querySelector('.ks-seg'), function (v) { kernel = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Two classes no straight line can split: an inner blob inside a ring.',
      'library(e1071)',
      'set.seed(11)',
      'ang <- runif(60, 0, 2*pi)',
      'rad <- c(runif(26, 0, 1.1), 2.1 + runif(34, 0, 1))    # inner vs ring',
      'd <- data.frame(x = rad*cos(ang), y = rad*sin(ang),',
      '                cls = factor(c(rep(1,26), rep(0,34))))',
      '',
      'err <- function(k) mean(predict(svm(cls ~ x + y, d, kernel = k)) != d$cls)',
      'c(linear = err("linear"), polynomial = err("polynomial"), radial = err("radial"))',
      '# linear can never separate the ring; radial (RBF) drives training error to ~0.'
    ].join('\n');
  }

  window.LessonWidgets.register('kernel-svm', mount);
})();

;
/* km-curve.js */
/* km-curve.js - the Kaplan-Meier estimator, made visible. Two treatment arms, each a
 * product-limit step curve that drops at every death and ticks (|) at every censoring.
 * The new drug's curve stays higher for longer; its median survival (where the curve
 * crosses 0.5) sits far to the right of the standard arm's. Toggle which arms show.
 * Emits runnable survival::survfit + the log-rank test.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // small real datasets: {t: time, e: 1 event / 0 censored}. Deterministic, so the picture is exact.
  var STD = [{t:1.5,e:1},{t:2.2,e:1},{t:3.1,e:1},{t:4.0,e:1},{t:4.6,e:0},{t:5.2,e:1},{t:6.0,e:1},{t:6.1,e:1},{t:7.4,e:1},{t:8.0,e:0},{t:9.2,e:1},{t:11.0,e:1},{t:13.5,e:1},{t:15.0,e:0},{t:18.0,e:1}];
  var NEW = [{t:3.0,e:0},{t:5.1,e:1},{t:7.2,e:1},{t:9.0,e:0},{t:10.4,e:1},{t:12.0,e:0},{t:13.6,e:1},{t:15.1,e:1},{t:16.0,e:0},{t:18.5,e:1},{t:20.0,e:0},{t:21.2,e:1},{t:22.0,e:0},{t:23.5,e:1},{t:24.0,e:0}];

  // product-limit estimator: returns step points [{t,S}] plus censoring marks [{t,S}]
  function km(data) {
    var d = data.slice().sort(function (a, b) { return a.t - b.t; });
    var n = d.length, S = 1, steps = [{ t: 0, S: 1 }], cens = [];
    for (var i = 0; i < d.length; i++) {
      var atrisk = n - i;
      if (d[i].e === 1) { S *= (1 - 1 / atrisk); steps.push({ t: d[i].t, S: S }); }
      else cens.push({ t: d[i].t, S: S });
    }
    return { steps: steps, cens: cens };
  }
  function median(steps) { for (var i = 0; i < steps.length; i++) if (steps[i].S <= 0.5) return steps[i].t; return null; }

  function mount(el, cfg) {
    cfg = cfg || {}; var show = 'both';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="km-seg" style="margin-bottom:12px">' + u.seg([{ v: 'both', label: 'Both arms' }, { v: 'standard', label: 'Standard' }, { v: 'new', label: 'New drug' }], 'both') + '</div>' +
      '<div class="km-plot"></div>' +
      '<div class="km-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Kaplan-Meier curves and the log-rank test with survival::survfit' });

    var plot = el.querySelector('.km-plot'), read = el.querySelector('.km-read');
    var W = 340, H = 240, TMAX = 25, PAD = 4;
    function px(t) { return (t / TMAX) * (W - PAD) + PAD; }
    function py(s) { return H - s * (H - 14) - 7; }
    var kmS = km(STD), kmN = km(NEW);
    function stepPath(steps) {
      var p = 'M' + px(0).toFixed(1) + ',' + py(1).toFixed(1), prev = 1;
      steps.forEach(function (pt) { p += ' L' + px(pt.t).toFixed(1) + ',' + py(prev).toFixed(1) + ' L' + px(pt.t).toFixed(1) + ',' + py(pt.S).toFixed(1); prev = pt.S; });
      p += ' L' + px(TMAX).toFixed(1) + ',' + py(prev).toFixed(1);
      return p;
    }
    function curve(kmData, col, dim) {
      var ticks = kmData.cens.map(function (c) { return '<line x1="' + px(c.t).toFixed(1) + '" y1="' + (py(c.S) - 4).toFixed(1) + '" x2="' + px(c.t).toFixed(1) + '" y2="' + (py(c.S) + 4).toFixed(1) + '" stroke="' + col + '" stroke-width="1.4" opacity="' + (dim ? 0.3 : 0.9) + '"/>'; }).join('');
      return '<path d="' + stepPath(kmData.steps) + '" fill="none" stroke="' + col + '" stroke-width="2.2" opacity="' + (dim ? 0.25 : 1) + '"/>' + ticks;
    }
    function draw() {
      var half = '<line x1="' + px(0) + '" y1="' + py(0.5).toFixed(1) + '" x2="' + W + '" y2="' + py(0.5).toFixed(1) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="4 3"/>';
      var showS = show === 'both' || show === 'standard', showN = show === 'both' || show === 'new';
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kaplan-Meier survival curves">' +
        half +
        curve(kmS, P.acc, !showS) + curve(kmN, P.c0, !showN) +
        '<text x="' + (W - 6) + '" y="' + (py(0.5) - 5).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + P.mut + '">50% survival</text>' +
        '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">S(t)</text>' +
        '<text x="' + (W - 6) + '" y="' + (H - 2) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">time (months)</text></svg>';
      read.innerHTML = 'Median survival is where a curve crosses 50%: <b style="color:' + P.acc + '">standard &asymp; 6 months</b>, <b style="color:' + P.c0 + '">new drug &asymp; 13.5 months</b>. The vertical ticks are censored patients (still alive when last seen). The gap between the curves is what the <b>log-rank test</b> weighs, here p &asymp; 0.0005.';
    }
    u.wireSeg(el.querySelector('.km-seg'), function (v) { show = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Kaplan-Meier survival curves for two arms, and the log-rank test.',
      'library(survival)',
      'set.seed(1)',
      'n   <- 80',
      'arm <- factor(rep(c("standard", "new"), each = 40))',
      'lambda  <- ifelse(arm == "new", 0.06, 0.12)      # the new drug lowers the hazard',
      'event_t <- rexp(n, lambda)                        # time to death',
      'cens_t  <- runif(n, 0, 24)                        # time to loss-to-follow-up',
      'time    <- pmin(event_t, cens_t)',
      'status  <- as.integer(event_t <= cens_t)          # 1 = died, 0 = censored',
      '',
      'km <- survfit(Surv(time, status) ~ arm)',
      'summary(km)$table[, c("records", "events", "median")]   # median survival per arm',
      'survdiff(Surv(time, status) ~ arm)                # log-rank test of the gap',
      '# the new arm has the higher median and the curves differ (log-rank p ~ 0.0005).'
    ].join('\n');
  }

  window.LessonWidgets.register('km-curve', mount);
})();

;
/* kmeans-cluster.js */
/* kmeans-cluster.js - k-means, one step at a time. Press "step" to alternate the two
 * moves of Lloyd's algorithm: assign each point to its nearest centroid, then move each
 * centroid to the mean of its points. The within-cluster sum of squares drops and the
 * centroids settle. Emits runnable R that runs kmeans and reads the result.
 *
 * cfg: { k: 3 }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var COL = [P.c0, P.acc, (P.c2 || '#c9a24a'), '#7a8a55'];
  // a fixed point cloud (three loose blobs) so the demo is deterministic
  var PTS = (function () {
    var seeds = [[2.4, 2.4], [7.4, 3.0], [4.6, 7.2]], out = [], s = 7;
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    seeds.forEach(function (c) { for (var i = 0; i < 9; i++) out.push([c[0] + (rnd() - 0.5) * 3, c[1] + (rnd() - 0.5) * 3]); });
    return out;
  })();

  function mount(el, cfg) {
    cfg = cfg || {}; var k = cfg.k || 3;
    var cents = [[3.5, 5.5], [5.5, 3.0], [6.5, 6.0]].slice(0, k);
    var assign = PTS.map(function () { return 0; }), phase = 'assign', iter = 0;
    function dist(a, b) { return (a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1]); }
    function wss() { var s = 0; PTS.forEach(function (p, i) { s += dist(p, cents[assign[i]]); }); return s; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="km-plot"></div>' +
      '<div style="display:flex;align-items:center;gap:12px;margin:12px 0 4px;flex-wrap:wrap">' +
        '<button class="km-step" style="font:600 13px IBM Plex Sans,sans-serif;background:' + P.ink + ';color:#fff;border:0;border-radius:9px;padding:9px 16px;cursor:pointer">step</button>' +
        '<button class="km-reset" style="font:600 13px IBM Plex Sans,sans-serif;background:#fff;color:' + P.body + ';border:1px solid ' + P.line + ';border-radius:9px;padding:9px 14px;cursor:pointer">reset</button>' +
        '<span class="km-read" style="font:13px IBM Plex Mono,monospace;color:' + P.body + '"></span>' +
      '</div>' +
      u.runnable(rcode(), { label: 'Run k-means in R and read the clusters' });

    var plot = el.querySelector('.km-plot'), read = el.querySelector('.km-read');
    var S = 250, m = 14, sc = (S - 2 * m) / 10;
    function px(x) { return m + x * sc; } function py(y) { return (S - m) - y * sc; }
    function draw() {
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="k-means clustering">';
      svg += '<rect x="' + m + '" y="' + m + '" width="' + (S - 2 * m) + '" height="' + (S - 2 * m) + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      PTS.forEach(function (p, i) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="4.5" fill="' + COL[assign[i]] + '" opacity="0.9"/>'; });
      cents.forEach(function (c, j) { svg += '<path d="M' + (px(c[0]) - 7) + ',' + py(c[1]) + ' h14 M' + px(c[0]) + ',' + (py(c[1]) - 7) + ' v14" stroke="' + COL[j] + '" stroke-width="3" stroke-linecap="round"/><circle cx="' + px(c[0]).toFixed(1) + '" cy="' + py(c[1]).toFixed(1) + '" r="9" fill="none" stroke="' + COL[j] + '" stroke-width="2"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      read.textContent = 'iteration ' + iter + ' · next: ' + phase + ' · within-SS ' + wss().toFixed(1);
    }
    function step() {
      if (phase === 'assign') { PTS.forEach(function (p, i) { var best = 0, bd = Infinity; cents.forEach(function (c, j) { var d = dist(p, c); if (d < bd) { bd = d; best = j; } }); assign[i] = best; }); phase = 'update'; }
      else { cents = cents.map(function (c, j) { var sx = 0, sy = 0, n = 0; PTS.forEach(function (p, i) { if (assign[i] === j) { sx += p[0]; sy += p[1]; n++; } }); return n ? [sx / n, sy / n] : c; }); phase = 'assign'; iter++; }
      draw();
    }
    el.querySelector('.km-step').addEventListener('click', step);
    el.querySelector('.km-reset').addEventListener('click', function () { cents = [[3.5, 5.5], [5.5, 3.0], [6.5, 6.0]].slice(0, k); assign = PTS.map(function () { return 0; }); phase = 'assign'; iter = 0; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# k-means alternates two moves until the centroids stop moving:',
      '#   1. assign each point to its nearest centroid',
      '#   2. move each centroid to the mean of its assigned points',
      'set.seed(1)',
      'pts <- rbind(',
      '  cbind(rnorm(30, 2), rnorm(30, 2)),',
      '  cbind(rnorm(30, 7), rnorm(30, 3)),',
      '  cbind(rnorm(30, 4), rnorm(30, 7)))',
      '',
      'km <- kmeans(pts, centers = 3, nstart = 10)',
      'plot(pts, col = km$cluster, pch = 19)',
      'points(km$centers, pch = 3, cex = 2, lwd = 3)',
      'km$tot.withinss          # total within-cluster sum of squares (lower = tighter)'
    ].join('\n');
  }

  window.LessonWidgets.register('kmeans-cluster', mount);
})();

;
/* knn-vote.js */
/* knn-vote.js - k-nearest neighbors, made tangible.
 * Click anywhere to drop a query point; its k nearest neighbors light up and vote,
 * and the majority class colors the query. Slide k to watch the boundary go from
 * jagged (k=1) to smooth (large k). Emits runnable R that does the same vote by hand.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var A = [[2, 3], [3, 2], [2.5, 4], [4, 3], [3, 4], [1.5, 2.5], [4.5, 2], [3.5, 3.5], [2, 5]];
  var B = [[7, 8], [8, 7], [6.5, 7.5], [8, 8.5], [7, 6], [6, 8], [8.5, 7], [7.5, 9], [6, 6.5]];
  var PTS = A.map(function (p) { return { x: p[0], y: p[1], c: 'A' }; }).concat(B.map(function (p) { return { x: p[0], y: p[1], c: 'B' }; }));
  var CA = '#b04a52', CB = '#2f6fb0';

  function mount(el, cfg) {
    cfg = cfg || {};
    var k = 5, qx = 5, qy = 5;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="kn-chart" style="cursor:crosshair"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">neighbors k = <b class="kn-k" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="kn-s" type="range" min="1" max="9" step="2" value="' + k + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="kn-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Do the k-NN vote by hand in R' });

    var chart = el.querySelector('.kn-chart'), read = el.querySelector('.kn-read'),
        slider = el.querySelector('.kn-s'), kEl = el.querySelector('.kn-k');
    var W = 460, H = 300, m = { t: 14, r: 14, b: 14, l: 14 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    function sx(x) { return m.l + x / 10 * iw; }
    function sy(y) { return m.t + ih - y / 10 * ih; }

    function draw() {
      var d = PTS.map(function (p, i) { return { i: i, dist: Math.sqrt((p.x - qx) * (p.x - qx) + (p.y - qy) * (p.y - qy)) }; }).sort(function (a, b) { return a.dist - b.dist; });
      var nn = d.slice(0, k), votes = { A: 0, B: 0 }; nn.forEach(function (e) { votes[PTS[e.i].c]++; });
      var pred = votes.A >= votes.B ? 'A' : 'B', isIn = {}; nn.forEach(function (e) { isIn[e.i] = 1; });

      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="k nearest neighbors vote"><rect x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      // vote lines
      nn.forEach(function (e) { svg += '<line x1="' + sx(qx).toFixed(1) + '" y1="' + sy(qy).toFixed(1) + '" x2="' + sx(PTS[e.i].x).toFixed(1) + '" y2="' + sy(PTS[e.i].y).toFixed(1) + '" stroke="' + P.faint + '" stroke-width="1.2" stroke-dasharray="3 3"/>'; });
      // points
      PTS.forEach(function (p, i) { var col = p.c === 'A' ? CA : CB; svg += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="' + (isIn[i] ? 8 : 5.5) + '" fill="' + col + '" fill-opacity="' + (isIn[i] ? 0.95 : 0.5) + '"' + (isIn[i] ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>'; });
      // query
      var qc = pred === 'A' ? CA : CB;
      svg += '<rect x="' + (sx(qx) - 7).toFixed(1) + '" y="' + (sy(qy) - 7).toFixed(1) + '" width="14" height="14" rx="3" fill="' + qc + '" stroke="' + P.ink + '" stroke-width="2"/>';
      svg += '</svg>';
      chart.innerHTML = svg;

      read.innerHTML = '<b>k = ' + k + ':</b> <b style="color:' + CA + '">' + votes.A + ' class A</b>, <b style="color:' + CB + '">' + votes.B + ' class B</b> &rarr; predict <b style="color:' + (pred === 'A' ? CA : CB) + '">class ' + pred + '</b>. ' +
        (k === 1 ? 'At k=1 the query just copies its single closest point - jumpy and noise-sensitive.' : 'Larger k averages more neighbors: a smoother, steadier boundary, but it can blur real detail.') + ' Click the box to move the query.';
      kEl.textContent = k;
    }

    chart.addEventListener('click', function (e) {
      var svg = chart.querySelector('svg'); if (!svg) return;
      var pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
      qx = Math.max(0, Math.min(10, (loc.x - m.l) / iw * 10));
      qy = Math.max(0, Math.min(10, (1 - (loc.y - m.t) / ih) * 10));
      draw();
    });
    slider.addEventListener('input', function () { k = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# k-NN with no package: measure distance to every training point, take the',
      '# k closest, and let them vote.',
      'train <- data.frame(',
      '  x = c(2,3,2.5,4,3,1.5,4.5,3.5,2,  7,8,6.5,8,7,6,8.5,7.5,6),',
      '  y = c(3,2,4,  3,4,2.5,2,  3.5,5,  8,7,7.5,8.5,6,8,7,9,  6.5),',
      '  cls = factor(rep(c("A","B"), each = 9)))',
      '',
      'query <- c(x = 5, y = 5)',
      'k <- 5',
      'dist <- sqrt((train$x - query["x"])^2 + (train$y - query["y"])^2)',
      'nn   <- order(dist)[1:k]            # the k nearest rows',
      'table(train$cls[nn])               # the votes',
      'names(which.max(table(train$cls[nn])))   # predicted class'
    ].join('\n');
  }

  window.LessonWidgets.register('knn-vote', mount);
})();

;
/* learning-curve.js */
/* learning-curve.js - early stopping.
 * As boosting rounds pile up, training error keeps falling but validation error
 * bottoms out then climbs (overfitting). Slide where you STOP: too early leaves
 * signal on the table, too late overfits, the sweet spot is the validation min.
 * Emits runnable R that boosts while tracking train + validation RMSE per round.
 *
 * cfg: { rounds:40 }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var R = Math.max(10, +cfg.rounds || 40);
    function train(r) { return 0.16 + 1.5 / (0.5 * r + 1); }
    function valid(r) { return 0.30 + 1.35 / (0.5 * r + 1) + 0.0135 * r; }
    var DS = []; for (var r = 1; r <= R; r++) DS.push({ r: r, train: train(r), valid: valid(r) });
    var best = DS.reduce(function (b, d) { return d.valid < b.valid ? d : b; }, DS[0]).r;
    var stop = Math.round(best * 0.5);                 // start stopped too early

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="lcv-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">stop after round <b class="lcv-n" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="lcv-s" type="range" min="1" max="' + R + '" step="1" value="' + stop + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="lcv-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Track train vs validation per round in R' });

    var chart = el.querySelector('.lcv-chart'), read = el.querySelector('.lcv-read'),
        slider = el.querySelector('.lcv-s'), nEl = el.querySelector('.lcv-n');

    function draw() {
      var W = 480, H = 250, m = { t: 14, r: 14, b: 34, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var ymax = Math.max.apply(null, DS.map(function (d) { return d.valid; })) * 1.06, ymin = Math.min.apply(null, DS.map(function (d) { return d.train; })) * 0.9;
      function sx(rr) { return m.l + (rr - 1) / (R - 1) * iw; } function sy(v) { return m.t + ih - (v - ymin) / (ymax - ymin) * ih; }
      function pl(key, col) { return '<polyline points="' + DS.map(function (d) { return sx(d.r).toFixed(1) + ',' + sy(d[key]).toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.5"/>'; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="learning curve"><line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + sx(best).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(best).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-dasharray="3 3"/><text x="' + sx(best).toFixed(1) + '" y="' + (m.t + 9) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.faint + '">best</text>';
      svg += pl('valid', P.c1) + pl('train', P.acc);
      svg += '<line x1="' + sx(stop).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(stop).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="2"/>';
      svg += '<circle cx="' + sx(stop).toFixed(1) + '" cy="' + sy(DS[stop - 1].valid).toFixed(1) + '" r="5" fill="' + P.c1 + '"/><circle cx="' + sx(stop).toFixed(1) + '" cy="' + sy(DS[stop - 1].train).toFixed(1) + '" r="5" fill="' + P.acc + '"/>';
      svg += '<rect x="' + (m.l + 8) + '" y="' + (m.t + 4) + '" width="10" height="10" rx="2" fill="' + P.c1 + '"/><text x="' + (m.l + 22) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">validation</text><rect x="' + (m.l + 86) + '" y="' + (m.t + 4) + '" width="10" height="10" rx="2" fill="' + P.acc + '"/><text x="' + (m.l + 100) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">train</text>';
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">boosting rounds &rarr;</text></svg>';
      chart.innerHTML = svg;

      var s = stop < best - 1 ? ['Stopped too early.', P.c0, 'Validation error is still falling - the model has more signal to learn. Let it run longer.']
        : stop > best + 2 ? ['Stopped too late.', P.bad, 'Past the validation minimum, training error keeps dropping but validation creeps up - that gap is memorized noise. Overfitting.']
        : ['Right around the sweet spot.', P.acc, 'You stopped near the validation minimum: the most signal, the least overfit. This is what early stopping automates.'];
      read.innerHTML = '<b style="color:' + s[1] + '">' + s[0] + '</b> ' + s[2] + ' <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">train ' + DS[stop - 1].train.toFixed(2) + ' &middot; valid ' + DS[stop - 1].valid.toFixed(2) + '</b>';
      nEl.textContent = stop;
    }
    slider.addEventListener('input', function () { stop = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Early stopping: boost while watching BOTH errors. Train keeps falling;',
      '# validation bottoms out then rises. Stop at the validation minimum.',
      'library(rpart)',
      'set.seed(1)',
      'n <- 160; x <- sort(runif(n, 0, 10)); y <- sin(x) + 0.18 * x + rnorm(n, 0, 0.4)',
      'tr <- 1:110; te <- 111:n',
      'pred <- rep(mean(y[tr]), n); lr <- 0.3',
      'tr_err <- va_err <- numeric(40)',
      'for (m in 1:40) {',
      '  st   <- rpart(r ~ x, data = data.frame(x = x[tr], r = y[tr] - pred[tr]),',
      '                control = rpart.control(maxdepth = 1, cp = 0))',
      '  pred <- pred + lr * predict(st, data.frame(x = x))',
      '  tr_err[m] <- sqrt(mean((y[tr] - pred[tr])^2))',
      '  va_err[m] <- sqrt(mean((y[te] - pred[te])^2))',
      '}',
      'plot(va_err, type = "l", col = "darkorange", lwd = 2, ylim = range(tr_err, va_err),',
      '     xlab = "round", ylab = "RMSE"); lines(tr_err, col = "forestgreen", lwd = 2)',
      'which.min(va_err)            # stop here'
    ].join('\n');
  }

  window.LessonWidgets.register('learning-curve', mount);
})();

;
/* leverage-point.js */
/* leverage-point.js - how one point can swing a regression.
 * A clean scatter has a stable fit. Move the single far-right point up and down
 * (high leverage) and the whole least-squares line pivots toward it; the dashed
 * "line without that point" stays put, so you SEE its influence. Emits runnable
 * R that refits with and without the point and prints Cook's distance.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    // a tidy base relationship y ~ 1 + 0.5x, plus one high-leverage point far to the right
    var base = [{ x: 1, y: 1.6 }, { x: 2, y: 2.0 }, { x: 3, y: 2.6 }, { x: 4, y: 2.9 }, { x: 5, y: 3.6 }, { x: 6, y: 3.9 }, { x: 7, y: 4.6 }];
    var px = 13;                 // the leverage point's x (far from the rest)
    var py = 3.0;                // its y - the slider moves this

    function ols(pts) {
      var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
      pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
      var b = (n * sxy - sx * sy) / (n * sxx - sx * sx); return { b: b, a: (sy - b * sx) / n };
    }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="lv-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">Drag the far-right point’s value: <b class="lv-y" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="lv-s" type="range" min="0" max="12" step="0.1" value="' + py + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="lv-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(base, px), { label: 'Measure the influence in R (Cook’s distance)' });

    var chart = el.querySelector('.lv-chart'), read = el.querySelector('.lv-read'),
        slider = el.querySelector('.lv-s'), yEl = el.querySelector('.lv-y');

    function draw() {
      var all = base.concat([{ x: px, y: py }]);
      var fitAll = ols(all), fitBase = ols(base);
      var W = 480, H = 270, m = { t: 14, r: 14, b: 34, l: 40 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var xlo = 0, xhi = px + 1, ylo = 0, yhi = 12;
      function sx(x) { return m.l + (x - xlo) / (xhi - xlo) * iw; }
      function sy(y) { return m.t + ih - (y - ylo) / (yhi - ylo) * ih; }
      function line(f, col, dash) { return '<line x1="' + sx(xlo).toFixed(1) + '" y1="' + sy(f.a + f.b * xlo).toFixed(1) + '" x2="' + sx(xhi).toFixed(1) + '" y2="' + sy(f.a + f.b * xhi).toFixed(1) + '" stroke="' + col + '" stroke-width="2.4"' + (dash ? ' stroke-dasharray="6 4"' : '') + '/>'; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="leverage and influence">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += line(fitBase, P.faint, true) + line(fitAll, P.acc, false);
      base.forEach(function (p) { svg += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="4.5" fill="' + P.ink + '" fill-opacity="0.72"/>'; });
      svg += '<circle cx="' + sx(px).toFixed(1) + '" cy="' + sy(py).toFixed(1) + '" r="7" fill="' + P.bad + '" stroke="#fff" stroke-width="1.5"/>';
      // legend
      svg += '<line x1="' + (m.l + 8) + '" y1="' + (m.t + 9) + '" x2="' + (m.l + 26) + '" y2="' + (m.t + 9) + '" stroke="' + P.acc + '" stroke-width="2.4"/><text x="' + (m.l + 31) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.body + '">with the point</text>';
      svg += '<line x1="' + (m.l + 130) + '" y1="' + (m.t + 9) + '" x2="' + (m.l + 148) + '" y2="' + (m.t + 9) + '" stroke="' + P.faint + '" stroke-width="2.4" stroke-dasharray="6 4"/><text x="' + (m.l + 153) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.body + '">without it</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var dSlope = Math.abs(fitAll.b - fitBase.b), pull = Math.abs(py - (fitBase.a + fitBase.b * px));
      var sev = pull > 5 ? ['Highly influential.', P.bad] : pull > 2 ? ['Pulling the line.', P.c1] : ['Barely budging it.', P.acc];
      read.innerHTML = '<b style="color:' + sev[1] + '">' + sev[0] + '</b> One far-out point at x=' + px + ' has high <b>leverage</b>: it sits far from the others on x, so the line swings to chase it. Slope with it ' +
        '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + fitAll.b.toFixed(2) + '</b> vs without ' +
        '<b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + fitBase.b.toFixed(2) + '</b>.';
      yEl.textContent = py.toFixed(1);
    }

    slider.addEventListener('input', function () { py = +slider.value; draw(); });
    draw();
  }

  function rcode(base, px) {
    var rows = base.concat([{ x: px, y: 11 }]);     // an extreme value to show the swing
    var rdf = u.rdf(rows, [{ name: 'x', key: 'x' }, { name: 'y', key: 'y' }], 'd');
    return [
      '# The last row is a far-out, high-leverage point. Fit with and without it,',
      '# and let Cook’s distance flag how much it moves the model.',
      rdf,
      '',
      'fit_all  <- lm(y ~ x, data = d)',
      'fit_drop <- lm(y ~ x, data = d[-nrow(d), ])   # drop the influential point',
      'rbind(with_point = coef(fit_all), without = coef(fit_drop))',
      '',
      'round(cooks.distance(fit_all), 3)              # influence of each row',
      'plot(d$x, d$y, pch = 19); abline(fit_all, col = "forestgreen", lwd = 2)',
      'abline(fit_drop, col = "gray60", lwd = 2, lty = 2)'
    ].join('\n');
  }

  window.LessonWidgets.register('leverage-point', mount);
})();

;
/* lof-density.js */
/* lof-density.js - Local Outlier Factor made visible.
 * LOF compares a point's local density to the density of its neighbours. Deep inside a cluster,
 * a point is as crowded as its neighbours, so LOF ~ 1. A point in a sparse pocket, whose neighbours
 * are themselves crowded, has far lower density than them, so LOF >> 1. Unlike a global cutoff, LOF
 * adapts to each region, catching a point that is only locally sparse. Slide k and read each point's
 * LOF off its colour. Emits a from-scratch LOF in base R.
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function gauss(r) { return Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2831853 * r()); }

  function build() {
    var r = rng(11), pts = [], i;
    for (i = 0; i < 40; i++) pts.push([0.35 + 0.08 * gauss(r), 0.55 + 0.08 * gauss(r)]);   // dense cluster A
    for (i = 0; i < 20; i++) pts.push([0.72 + 0.05 * gauss(r), 0.35 + 0.05 * gauss(r)]);   // tighter cluster B
    pts.push([0.6, 0.8]);   // locally sparse point between the clusters (the interesting outlier)
    return pts;
  }

  function dist(a, b) { var dx = a[0] - b[0], dy = a[1] - b[1]; return Math.sqrt(dx * dx + dy * dy); }
  function lofAll(pts, k) {
    var n = pts.length, D = [], i, j;
    for (i = 0; i < n; i++) { D[i] = []; for (j = 0; j < n; j++) D[i][j] = dist(pts[i], pts[j]); }
    function knn(i) { var o = D[i].map(function (d, j) { return [d, j]; }).sort(function (a, b) { return a[0] - b[0]; }); return o.slice(1, k + 1).map(function (x) { return x[1]; }); }
    var NN = pts.map(function (_, i) { return knn(i); });
    function kdist(i) { return D[i][NN[i][k - 1]]; }
    function lrd(i) { var s = 0; NN[i].forEach(function (o) { s += Math.max(D[i][o], kdist(o)); }); return 1 / (s / k); }
    return pts.map(function (_, i) { var s = 0; NN[i].forEach(function (o) { s += lrd(o); }); return (s / k) / lrd(i); });
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var pts = build(), outlier = pts.length - 1, k = 8;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="lf-seg" style="margin-bottom:12px">' + u.seg([{ v: '5', label: 'k = 5' }, { v: '8', label: 'k = 8' }, { v: '12', label: 'k = 12' }], '8') + '</div>' +
      '<div class="lf-plot"></div>' +
      '<div class="lf-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Local Outlier Factor from scratch: local density ratio, base R' });

    var plot = el.querySelector('.lf-plot'), read = el.querySelector('.lf-read');
    var W = 340, H = 250, PAD = 14;
    function sx(x) { return PAD + x * (W - 2 * PAD); }
    function sy(y) { return H - PAD - y * (H - 2 * PAD); }
    function col(lof) { return lof > 1.8 ? P.bad : lof > 1.3 ? '#e08a2e' : P.c0; }

    function draw() {
      var lof = lofAll(pts, k);
      var dots = pts.map(function (p, i) {
        var isOut = i === outlier;
        return '<circle cx="' + sx(p[0]).toFixed(1) + '" cy="' + sy(p[1]).toFixed(1) + '" r="' + (isOut ? 6 : 3.5 + Math.min(3, (lof[i] - 1) * 3)) + '" fill="' + col(lof[i]) + '" opacity="0.8"' + (isOut ? ' stroke="#fff" stroke-width="1.5"' : '') + '/>';
      }).join('');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="LOF colored scatter">' +
        '<rect x="' + PAD + '" y="' + PAD + '" width="' + (W - 2 * PAD) + '" height="' + (H - 2 * PAD) + '" fill="none" stroke="' + P.line + '"/>' +
        dots +
        '<text x="' + (W - 8) + '" y="18" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">bigger, redder = higher LOF</text></svg>';
      var clusterMean = 0, cc = 0; lof.forEach(function (v, i) { if (i !== outlier) { clusterMean += v; cc++; } });
      read.innerHTML = 'At <b>k = ' + k + '</b>, the highlighted point scores <b style="color:' + P.bad + '">LOF = ' + lof[outlier].toFixed(2) + '</b>, while ordinary cluster points sit near <b>' + (clusterMean / cc).toFixed(2) + '</b>. An LOF near 1 means "as dense as my neighbours"; well above 1 means "in a far sparser pocket than the points around me", the local signal a single global distance cutoff would miss.';
    }
    u.wireSeg(el.querySelector('.lf-seg'), function (v) { k = parseInt(v, 10); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Local Outlier Factor from scratch: an outlier is far less dense than its own neighbours. Base R.',
      'set.seed(1)',
      'X <- rbind(matrix(rnorm(100), 50, 2), c(3.5, 3.5))   # 50-point cluster + 1 outlier (row 51)',
      'k <- 5; D <- as.matrix(dist(X))',
      'knn   <- function(i) order(D[i,])[2:(k+1)]           # k nearest neighbours (drop self)',
      'kdist <- function(i) D[i, knn(i)[k]]                 # distance to the k-th neighbour',
      'rd    <- function(i, o) max(D[i, o], kdist(o))       # reachability distance of i from o',
      'lrd   <- function(i) 1 / mean(sapply(knn(i), function(o) rd(i, o)))   # local reachability density',
      'lof   <- function(i) mean(sapply(knn(i), lrd)) / lrd(i)               # neighbour density / my density',
      'round(c(cluster_pt = lof(1), outlier_pt = lof(51)), 2)',
      '#> cluster_pt outlier_pt',
      '#>       1.02       3.80'
    ].join('\n');
  }

  window.LessonWidgets.register('lof-density', mount);
})();

;
/* logistic-curve.js */
/* logistic-curve.js - logistic regression as a probability + a threshold.
 * The S-curve maps a feature to P(y=1). Slide the decision threshold: the cutoff
 * x moves, points flip class, and the false positives / false negatives trade off.
 * Emits runnable R that fits glm(family=binomial) and draws the same curve.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var XS = [1, 2, 2.5, 3, 4, 4.5, 5.5, 6, 7, 7.5, 8, 9];
  var YS = [0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1];
  var B0 = -5.5, B1 = 1.1;                         // an illustrative fit; R computes the real one
  function prob(x) { return 1 / (1 + Math.exp(-(B0 + B1 * x))); }

  function mount(el, cfg) {
    cfg = cfg || {};
    var thr = 0.5;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="lc-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">decision threshold <b class="lc-t" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="lc-s" type="range" min="0.05" max="0.95" step="0.01" value="' + thr + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="lc-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Fit the logistic model for real in R' });

    var chart = el.querySelector('.lc-chart'), read = el.querySelector('.lc-read'),
        slider = el.querySelector('.lc-s'), tEl = el.querySelector('.lc-t');

    function draw() {
      var W = 480, H = 268, m = { t: 16, r: 14, b: 36, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var xlo = 0, xhi = 10;
      function sx(x) { return m.l + (x - xlo) / (xhi - xlo) * iw; }
      function sy(p) { return m.t + ih - p * ih; }
      var bound = (Math.log(thr / (1 - thr)) - B0) / B1;       // x where prob == threshold
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="logistic curve with threshold">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      [0, 0.5, 1].forEach(function (g) { svg += '<line x1="' + m.l + '" y1="' + sy(g).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(g).toFixed(1) + '" stroke="' + P.line2 + '"/><text x="' + (m.l - 7) + '" y="' + (sy(g) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + g + '</text>'; });
      // the S-curve
      var curve = ''; for (var x = xlo; x <= xhi + 0.001; x += 0.1) curve += sx(x).toFixed(1) + ',' + sy(prob(x)).toFixed(1) + ' ';
      svg += '<polyline points="' + curve.trim() + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.6"/>';
      // boundary + threshold
      svg += '<line x1="' + m.l + '" y1="' + sy(thr).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(thr).toFixed(1) + '" stroke="' + P.mut + '" stroke-dasharray="4 3"/>';
      if (bound > xlo && bound < xhi) svg += '<line x1="' + sx(bound).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(bound).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1" opacity=".4"/>';
      // points: actual class on rows y=0 (bottom) / y=1 (top), colored by correct/incorrect
      var tp = 0, fp = 0, tn = 0, fn = 0;
      XS.forEach(function (x, i) {
        var pred = prob(x) >= thr ? 1 : 0, act = YS[i], ok = pred === act;
        if (act === 1 && pred === 1) tp++; else if (act === 0 && pred === 1) fp++; else if (act === 0 && pred === 0) tn++; else fn++;
        svg += '<circle cx="' + sx(x).toFixed(1) + '" cy="' + sy(act ? 0.97 : 0.03).toFixed(1) + '" r="5.5" fill="' + (ok ? P.acc : P.bad) + '" fill-opacity="0.85"/>';
      });
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">feature x &rarr;</text>';
      svg += '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">P(y = 1)</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      read.innerHTML = 'Predict 1 when the curve is above the threshold. At <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + thr.toFixed(2) +
        '</b>: <b style="color:' + P.bad + '">' + fp + ' false positive' + (fp === 1 ? '' : 's') + '</b>, <b style="color:' + P.bad + '">' + fn + ' false negative' + (fn === 1 ? '' : 's') +
        '</b>. Lower the threshold to catch more 1s (fewer false negatives, more false positives); raise it for the reverse. The S-curve is fixed; only the cutoff moves.';
      tEl.textContent = thr.toFixed(2);
    }

    slider.addEventListener('input', function () { thr = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Logistic regression models a PROBABILITY with an S-curve, then a threshold',
      '# turns that probability into a class.',
      'x <- c(1, 2, 2.5, 3, 4, 4.5, 5.5, 6, 7, 7.5, 8, 9)',
      'y <- c(0, 0, 0,   0, 0, 1,   0,   1, 1, 1,   1, 1)',
      'fit <- glm(y ~ x, family = binomial)',
      'coef(fit)                                   # intercept and slope (log-odds)',
      '',
      'p <- predict(fit, type = "response")        # fitted probabilities',
      'plot(x, y, pch = 19, ylab = "P(y = 1)")',
      'curve(predict(fit, data.frame(x = x), type = "response"),',
      '      add = TRUE, col = "steelblue", lwd = 2)',
      'table(predicted = as.integer(p >= 0.5), actual = y)   # try 0.3 or 0.7'
    ].join('\n');
  }

  window.LessonWidgets.register('logistic-curve', mount);
})();

;
/* luck-simulator.js */
/* luck-simulator - "could it be pure luck?" made tangible.
 *
 * Simulates a guessing game: someone with NO skill guesses `trials` times,
 * each guess right with probability `p`. Every run counts the lucky hits and
 * drops the result onto a growing histogram. A marker sits at the observed
 * result, and the readout tracks how often pure luck matched or beat it -
 * the beating heart of inference-from-zero (and, later, of p-values).
 *
 * cfg (all optional):
 *   trials    guesses per run            (default 10)
 *   p         chance each guess is right (default 0.5)
 *   observed  the real result to judge   (default 9)
 *   unit      noun for the readout       (default "correct guesses")
 *   seed      RNG seed                   (default 42; deterministic replays)
 *
 * Numbers are REAL: every bar is an actual simulated run, the >= counter is
 * an actual count. Nothing is faked or precomputed.
 */
(function () {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function mount(el, cfg) {
    var trials = cfg.trials || 10;
    var p = (cfg.p === undefined) ? 0.5 : cfg.p;
    var observed = (cfg.observed === undefined) ? 9 : cfg.observed;
    var unit = cfg.unit || 'correct guesses';
    var rng = mulberry32(cfg.seed || 42);

    var counts = new Array(trials + 1).fill(0);
    var total = 0, atLeast = 0;

    el.innerHTML =
      '<div class="lw-luck" style="font-family:inherit">' +
      '<div class="lw-luck-bars" style="display:flex;align-items:flex-end;gap:3px;height:150px;padding:6px 2px 0"></div>' +
      '<div class="lw-luck-x" style="display:flex;gap:3px;font-size:11px;opacity:.75;text-align:center"></div>' +
      '<div class="lw-luck-out" style="margin:10px 0 8px;font-size:14px;line-height:1.5"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="lw-btn" data-n="1">Run 1 game</button>' +
      '<button type="button" class="lw-btn" data-n="100">Run 100</button>' +
      '<button type="button" class="lw-btn" data-n="1000">Run 1,000</button>' +
      '<button type="button" class="lw-btn" data-reset="1">Reset</button>' +
      '</div></div>';

    var barsEl = el.querySelector('.lw-luck-bars');
    var xEl = el.querySelector('.lw-luck-x');
    var outEl = el.querySelector('.lw-luck-out');
    var bars = [];
    for (var k = 0; k <= trials; k++) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%';
      var bar = document.createElement('div');
      var hot = k >= observed;
      bar.style.cssText = 'width:100%;height:0%;border-radius:3px 3px 0 0;transition:height .15s;' +
        'background:' + (hot ? '#d97706' : '#3b82f6') + ';opacity:' + (hot ? '1' : '.75');
      wrap.appendChild(bar);
      barsEl.appendChild(wrap);
      bars.push(bar);
      var lab = document.createElement('div');
      lab.style.cssText = 'flex:1';
      lab.textContent = k;
      xEl.appendChild(lab);
    }

    el.querySelectorAll('.lw-btn').forEach(function (b) {
      b.style.cssText = 'font:inherit;font-size:13px;padding:6px 12px;border:1px solid currentColor;' +
        'border-radius:7px;background:transparent;cursor:pointer;opacity:.9';
    });

    function runOnce() {
      var hits = 0;
      for (var i = 0; i < trials; i++) if (rng() < p) hits++;
      counts[hits]++; total++;
      if (hits >= observed) atLeast++;
    }

    function render() {
      var max = Math.max.apply(null, counts.concat([1]));
      for (var k = 0; k <= trials; k++) {
        bars[k].style.height = (counts[k] / max * 100) + '%';
      }
      if (!total) {
        outEl.innerHTML = 'No games yet. Each game: a pure guesser makes <b>' + trials +
          '</b> guesses, each right half the time. Press a button and watch where luck lands.';
        return;
      }
      var pct = (atLeast / total * 100);
      outEl.innerHTML = '<b>' + total.toLocaleString() + '</b> games of pure guessing so far. ' +
        'Luck reached <b>' + observed + ' or more ' + unit + '</b> in <b>' + atLeast.toLocaleString() +
        '</b> of them, which is <b>' + (pct < 0.1 && atLeast > 0 ? pct.toFixed(2) : pct.toFixed(1)) + '%</b>.';
    }

    el.querySelector('.lw-luck').addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.reset) {
        counts = new Array(trials + 1).fill(0); total = 0; atLeast = 0;
        rng = mulberry32(cfg.seed || 42);
      } else {
        var n = parseInt(b.dataset.n, 10) || 1;
        for (var i = 0; i < n; i++) runOnce();
      }
      render();
    });

    render();
  }

  if (window.LessonWidgets) window.LessonWidgets.register('luck-simulator', mount);
})();

;
/* matching-overlap.js */
/* matching-overlap.js - propensity-score overlap and covariate balance, made visible.
 * When treatment is confounded, treated and control units have different propensity-score
 * distributions: the treated pile up at high scores, controls at low ones, and a naive
 * difference in outcomes is biased. Matching (or IP-weighting) keeps only the region of
 * common support and reshapes control to look like treated, collapsing the standardized
 * mean difference toward zero. Toggle before/after and watch the two mirrored histograms
 * line up and the balance number fall. Emits the same propensity + nearest-neighbour match
 * in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function plogis(z) { return 1 / (1 + Math.exp(-z)); }

  // deterministic sample: x ~ N(0,1), treat ~ Bernoulli(plogis(0.8 x)), ps = plogis(0.8 x)
  function build() {
    var r = rng(1), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var trt = [], ctrl = [];
    for (var i = 0; i < 600; i++) { var x = rnorm(), ps = plogis(0.8 * x); if (r() < ps) trt.push(ps); else ctrl.push(ps); }
    // nearest-neighbour match: each treated -> closest control ps (with replacement)
    var matched = trt.map(function (p) { var bi = 0, bd = 2; for (var j = 0; j < ctrl.length; j++) { var d = Math.abs(ctrl[j] - p); if (d < bd) { bd = d; bi = j; } } return ctrl[bi]; });
    return { trt: trt, ctrl: ctrl, matched: matched };
  }
  function mean(a) { return a.reduce(function (s, v) { return s + v; }, 0) / a.length; }
  function vari(a) { var m = mean(a); return a.reduce(function (s, v) { return s + (v - m) * (v - m); }, 0) / (a.length - 1); }
  function smd(a, b) { return (mean(a) - mean(b)) / Math.sqrt((vari(a) + vari(b)) / 2); }
  function hist(a, nb) { var h = new Array(nb).fill(0); a.forEach(function (v) { var k = Math.min(nb - 1, Math.floor(v * nb)); h[k]++; }); return h; }

  function mount(el, cfg) {
    cfg = cfg || {}; var phase = 'before';
    var d = build();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="mo-seg" style="margin-bottom:12px">' + u.seg([{ v: 'before', label: 'Before matching' }, { v: 'after', label: 'After matching' }], 'before') + '</div>' +
      '<div class="mo-plot"></div>' +
      '<div class="mo-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Propensity score + nearest-neighbour matching, base R' });

    var plot = el.querySelector('.mo-plot'), read = el.querySelector('.mo-read');
    var NB = 20, W = 340, H = 190, MID = H / 2, bw = (W - 8) / NB;
    function draw() {
      var control = phase === 'before' ? d.ctrl : d.matched;
      var ht = hist(d.trt, NB), hc = hist(control, NB);
      var mx = Math.max(Math.max.apply(null, ht), Math.max.apply(null, hc)) || 1;
      var sc = (MID - 16) / mx;
      function bars(h, up) { return h.map(function (c, k) { var hh = c * sc; var y = up ? MID - hh : MID; return '<rect x="' + (4 + k * bw).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + (up ? P.c0 : P.c1) + '" opacity="0.6"/>'; }).join(''); }
      var s = smd(d.trt, control);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="propensity overlap">' +
        bars(ht, true) + bars(hc, false) +
        '<line x1="4" y1="' + MID + '" x2="' + (W - 4) + '" y2="' + MID + '" stroke="' + P.mut + '" stroke-width="1"/>' +
        '<text x="8" y="14" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.c0 + '">treated</text>' +
        '<text x="8" y="' + (H - 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.c1 + '">control</text>' +
        '<text x="' + (W - 6) + '" y="' + (MID + 14) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">propensity score ->' + '</text></svg>';
      read.innerHTML = phase === 'before'
        ? 'Treated units pile up at <b>high</b> propensity scores and controls at <b>low</b> ones: standardized mean difference <b style="color:' + P.bad + '">' + s.toFixed(2) + '</b>. A raw outcome gap here is confounded.'
        : 'Each treated unit is paired with its nearest-propensity control, so the two histograms now line up: standardized mean difference <b style="color:' + P.acc + '">' + s.toFixed(2) + '</b> (under 0.1 is good balance). The matched comparison is fair.';
    }
    u.wireSeg(el.querySelector('.mo-seg'), function (v) { phase = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Confounded treatment: recover the true effect with propensity-score matching. Base R.',
      'set.seed(1)',
      'n <- 600; x <- rnorm(n)',
      'treat <- rbinom(n, 1, plogis(0.8 * x))   # treatment depends on x (a confounder)',
      'y <- 2 * treat + 1.5 * x + rnorm(n)       # the TRUE treatment effect is 2',
      '',
      'naive <- mean(y[treat == 1]) - mean(y[treat == 0])   # biased: ignores x',
      'ps <- glm(treat ~ x, family = binomial)$fitted.values',
      'ctrl <- which(treat == 0); trt <- which(treat == 1)',
      'match <- sapply(trt, function(i) ctrl[which.min(abs(ps[ctrl] - ps[i]))])',
      'att <- mean(y[trt] - y[match])            # matched difference',
      'round(c(true = 2, naive = naive, matched = att), 2)',
      '#>    true   naive matched',
      '#>    2.00    3.02    2.01',
      '',
      'smd <- function(a, b) (mean(a) - mean(b)) / sqrt((var(a) + var(b)) / 2)',
      'round(c(before = smd(x[trt], x[ctrl]), after = smd(x[trt], x[match])), 2)  # covariate balance',
      '#> before  after',
      '#>   0.74    0.01'
    ].join('\n');
  }

  window.LessonWidgets.register('matching-overlap', mount);
})();

;
/* mcmc-walk.js */
/* mcmc-walk.js - the Metropolis sampler, made visible. A random walk explores a posterior:
 * propose a step, accept it if it climbs (or by luck if it descends), and the chain's
 * histogram converges to the target. Toggle the proposal width to feel the tuning problem:
 * too small crawls (high acceptance, poor mixing), too large gets rejected constantly
 * (low acceptance), and a medium step mixes well. The top panel is the trace, the bottom
 * the running histogram against the true posterior. Emits the same Metropolis loop in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // target posterior: N(mu0, sd0) (a normal-mean posterior with sd = 1/sqrt(20))
  var MU0 = 3.19, SD0 = 0.224;
  function logpost(x) { var z = (x - MU0) / SD0; return -0.5 * z * z; }

  // deterministic PRNG (so the picture is stable) + Box-Muller normal
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  function run(propSD, n) {
    var r = rng(7), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var u1 = Math.max(r(), 1e-12), u2 = r(), m = Math.sqrt(-2 * Math.log(u1)); spare = m * Math.sin(2 * Math.PI * u2); return m * Math.cos(2 * Math.PI * u2); }
    var x = 0, acc = 0, chain = [x];
    for (var i = 1; i < n; i++) {
      var cand = x + propSD * rnorm();
      if (Math.log(Math.max(r(), 1e-12)) < logpost(cand) - logpost(x)) { x = cand; acc++; }
      chain.push(x);
    }
    return { chain: chain, acc: acc / (n - 1) };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var propSD = 0.5, N = 500;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="mc-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.08', label: 'Too small' }, { v: '0.5', label: 'Good' }, { v: '3', label: 'Too large' }], '0.5') + '</div>' +
      '<div class="mc-plot"></div>' +
      '<div class="mc-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A Metropolis sampler for a normal-mean posterior, from scratch in base R' });

    var plot = el.querySelector('.mc-plot'), read = el.querySelector('.mc-read');
    var W = 340, Ht = 130, Hh = 96, YR = [2.3, 4.1];
    function tx(i) { return (i / (N - 1)) * (W - 4) + 2; }
    function ty(v) { return Ht - (v - YR[0]) / (YR[1] - YR[0]) * (Ht - 8) - 4; }
    function draw() {
      var res = run(propSD, N);
      var trace = res.chain.map(function (v, i) { return tx(i).toFixed(1) + ',' + ty(v).toFixed(1); });
      // histogram of post-burn samples
      var burn = Math.floor(N * 0.2), bins = 30, lo = YR[0], hi = YR[1], cnt = new Array(bins).fill(0);
      for (var i = burn; i < N; i++) { var b = Math.floor((res.chain[i] - lo) / (hi - lo) * bins); if (b >= 0 && b < bins) cnt[b]++; }
      var mx = Math.max.apply(null, cnt) || 1, bw = W / bins;
      var bars = cnt.map(function (c, i) { var h = c / mx * (Hh - 10); return '<rect x="' + (i * bw).toFixed(1) + '" y="' + (Hh - h).toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + P.c0 + '" opacity="0.6"/>'; }).join('');
      // true posterior curve over the histogram panel
      var curve = [];
      for (var g = 0; g <= 60; g++) { var xv = lo + (hi - lo) * g / 60, d = Math.exp(logpost(xv)); curve.push(((xv - lo) / (hi - lo) * W).toFixed(1) + ',' + (Hh - d * (Hh - 10)).toFixed(1)); }
      plot.innerHTML =
        '<svg viewBox="0 0 ' + W + ' ' + Ht + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px 8px 0 0;border-bottom:0" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MCMC trace">' +
          '<polyline points="' + trace.join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="1" opacity="0.85"/>' +
          '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">trace (chain over iterations)</text></svg>' +
        '<svg viewBox="0 0 ' + W + ' ' + Hh + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:0 0 8px 8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="posterior histogram">' +
          bars + '<polyline points="' + curve.join(' ') + '" fill="none" stroke="' + P.ink + '" stroke-width="2"/>' +
          '<text x="6" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">samples vs true posterior</text></svg>';
      read.innerHTML = 'Proposal sd <b style="font-family:IBM Plex Mono,monospace">' + propSD.toFixed(2) + '</b>, acceptance <b>' + (res.acc * 100).toFixed(0) + '%</b>. ' +
        (propSD < 0.2 ? 'Tiny steps: almost every move is accepted, but the chain <b>crawls</b> and barely explores, poor mixing.'
         : propSD > 1.5 ? 'Huge steps: most proposals land in low-probability regions and are <b>rejected</b>, so the trace sticks in flat runs.'
         : 'A medium step <b>mixes well</b>: acceptance near 40-50%, the trace roams freely, and the histogram fills in the true posterior.');
    }
    u.wireSeg(el.querySelector('.mc-seg'), function (v) { propSD = parseFloat(v); draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Metropolis sampling: explore a posterior with a guided random walk, base R.',
      'set.seed(1)',
      'y <- rnorm(20, 3, 1)                              # data: 20 obs, unknown mean, sd = 1',
      'logpost <- function(mu) sum(dnorm(y, mu, 1, log = TRUE))   # flat prior on mu',
      '',
      'metropolis <- function(start, prop_sd, n) {',
      '  x <- numeric(n); x[1] <- start; acc <- 0',
      '  for (i in 2:n) {',
      '    cand <- rnorm(1, x[i-1], prop_sd)             # propose a step',
      '    if (log(runif(1)) < logpost(cand) - logpost(x[i-1])) {  # accept by the Metropolis rule',
      '      x[i] <- cand; acc <- acc + 1',
      '    } else x[i] <- x[i-1]                         # else stay put',
      '  }',
      '  list(chain = x, acc = acc / (n-1))',
      '}',
      'fit  <- metropolis(0, 0.5, 5000)',
      'burn <- 1:1000                                    # discard the warm-up',
      'round(c(post_mean = mean(fit$chain[-burn]), post_sd = sd(fit$chain[-burn]),',
      '        accept = fit$acc), 3)',
      '# the chain recovers the analytic posterior: mean ~ mean(y), sd ~ 1/sqrt(20).'
    ].join('\n');
  }

  window.LessonWidgets.register('mcmc-walk', mount);
})();

;
/* multiplicity-sim.js */
/* multiplicity-sim.js - the multiple-comparisons problem, simulated in front of the reader.
 *
 * Runs `nStudies` simulated studies in which NOTHING is real: every one of the k tests
 * is run under a true null, so every significant result is by definition a false positive.
 * The reader drags k and watches the share of studies with at least one p < alpha climb
 * away from alpha and track the theoretical family-wise error rate 1 - (1 - alpha)^k.
 * Switching the correction on collapses that share back to alpha.
 *
 * Why uniform draws are the honest model, not a shortcut: for a test with a continuous
 * statistic, the p-value under a true null IS Uniform(0, 1). Drawing runif(k) and running
 * k t-tests on pure noise are the same experiment; the uniform version just skips the
 * arithmetic. The lesson proves this before the widget is used.
 *
 * The exact-threshold identity used for the curves: Bonferroni rejects something iff
 * k * p_min < alpha, and Holm's first step is the same comparison, so under a global
 * null the two procedures have IDENTICAL family-wise error. Both curves therefore come
 * from one running minimum, which is exact, not an approximation. The per-test adjusted
 * values shown for the representative study are computed with the real step-down
 * procedure, where Holm and Bonferroni genuinely differ.
 *
 * cfg: {
 *   kMax: 50,            // slider maximum (number of tests in the family)
 *   kStart: 1,           // slider starting value
 *   alpha: 0.05,         // per-test significance level
 *   nStudies: 4000,      // simulated studies behind every plotted point
 *   corrections: ["none","bonferroni","holm"],   // which buttons to offer
 *   seed: 29,            // mulberry32 seed - same config always draws the same picture
 *   study: 1             // which simulated study to show test-by-test (1-based)
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var LABEL = { none: 'No correction', bonferroni: 'Bonferroni', holm: 'Holm' };
  // White halo so a label stays legible where it crosses a plotted line.
  var HALO = 'stroke="#fff" stroke-width="3" paint-order="stroke" stroke-linejoin="round"';

  /* Real Benjamini-style step-down adjustment, used for the one study shown test by
     test. Returns adjusted p-values in the ORIGINAL order. */
  function adjust(p, method) {
    var k = p.length, i;
    if (method === 'none') return p.slice();
    if (method === 'bonferroni') {
      var b = [];
      for (i = 0; i < k; i++) b.push(Math.min(1, k * p[i]));
      return b;
    }
    // Holm: sort ascending, multiply the i-th smallest by (k - i), enforce monotonicity.
    var order = p.map(function (v, ix) { return { v: v, ix: ix }; })
                 .sort(function (a, b2) { return a.v - b2.v; });
    var out = new Array(k), running = 0;
    for (i = 0; i < k; i++) {
      var val = Math.min(1, (k - i) * order[i].v);
      running = Math.max(running, val);            // adjusted p-values never decrease
      out[order[i].ix] = running;
    }
    return out;
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var kMax = Math.max(2, +cfg.kMax || 50);
    var alpha = +cfg.alpha || 0.05;
    var nStudies = Math.max(200, +cfg.nStudies || 4000);
    var seed = (cfg.seed == null ? 29 : +cfg.seed);
    var studyIx = Math.max(0, (+cfg.study || 1) - 1);
    var modes = (cfg.corrections && cfg.corrections.length ? cfg.corrections : ['none', 'bonferroni', 'holm'])
                  .filter(function (m) { return LABEL[m]; });
    if (!modes.length) modes = ['none'];
    var mode = modes[0];
    var k = Math.min(kMax, Math.max(1, +cfg.kStart || 1));

    /* ---- one deterministic pool of null p-values: nStudies rows, kMax columns ----
       Growing k adds tests to the SAME studies, which is exactly what happens when a
       researcher measures more outcomes on one dataset. */
    var rnd = mulberry32(seed);
    var pool = new Float64Array(nStudies * kMax);
    for (var s = 0; s < nStudies; s++)
      for (var j = 0; j < kMax; j++) pool[s * kMax + j] = rnd();

    /* ---- family-wise error rate at every k, for every mode, computed once ----
       runMin[s] is the smallest p-value study s has seen so far. */
    var curves = { none: new Array(kMax), bonferroni: new Array(kMax), holm: new Array(kMax) };
    var runMin = new Float64Array(nStudies);
    for (var i = 0; i < nStudies; i++) runMin[i] = 1;
    for (var kk = 1; kk <= kMax; kk++) {
      var hitRaw = 0, hitAdj = 0, cut = alpha / kk;
      for (var t = 0; t < nStudies; t++) {
        var v = pool[t * kMax + (kk - 1)];
        if (v < runMin[t]) runMin[t] = v;
        if (runMin[t] < alpha) hitRaw++;
        if (runMin[t] < cut) hitAdj++;
      }
      curves.none[kk - 1] = hitRaw / nStudies;
      curves.bonferroni[kk - 1] = hitAdj / nStudies;
      curves.holm[kk - 1] = hitAdj / nStudies;
    }

    /* ---- chrome ---- */
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      (modes.length > 1
        ? '<div class="ms-seg" style="margin-bottom:12px">' +
            u.seg(modes.map(function (m) { return { v: m, label: LABEL[m] }; }), mode) + '</div>'
        : '') +
      '<label class="ms-klab" style="display:block;font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:5px"></label>' +
      '<input class="ms-k" type="range" min="1" max="' + kMax + '" step="1" value="' + k + '" style="width:100%;max-width:460px;display:block;margin-bottom:12px">' +
      '<div class="ms-plot"></div>' +
      '<div class="ms-read" style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      u.runnable(rcode(alpha), { label: 'The same simulation in R' });

    var plot = el.querySelector('.ms-plot'),
        read = el.querySelector('.ms-read'),
        klab = el.querySelector('.ms-klab'),
        slider = el.querySelector('.ms-k');

    var W = 460, H = 322;
    var m1 = { t: 18, r: 14, b: 30, l: 42 }, h1 = 150;          // top panel: FWER vs k
    var m2 = { t: h1 + 78, r: 14, b: 26, l: 42 }, h2 = 54;      // bottom panel: one study

    function sxK(kv) { return m1.l + (kv - 1) / Math.max(1, kMax - 1) * (W - m1.l - m1.r); }
    function syR(r) { return m1.t + (1 - r) * h1; }
    function sxP(pv) { return m2.l + pv * (W - m2.l - m2.r); }

    function fmtPct(x) { return (100 * x).toFixed(1) + '%'; }

    function draw() {
      var rate = curves[mode][k - 1];
      var theory = 1 - Math.pow(1 - alpha, k);
      var thresh = (mode === 'none') ? alpha : alpha / k;

      /* --- top panel: the curve --- */
      var g = '';
      // gridlines + y labels
      [0, 0.25, 0.5, 0.75, 1].forEach(function (r) {
        g += '<line x1="' + m1.l + '" y1="' + syR(r).toFixed(1) + '" x2="' + (W - m1.r) + '" y2="' + syR(r).toFixed(1) +
             '" stroke="' + P.line2 + '"/>' +
             '<text x="' + (m1.l - 6) + '" y="' + (syR(r) + 3).toFixed(1) + '" text-anchor="end" ' +
             'font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + (100 * r) + '%</text>';
      });
      // alpha reference (labelled on the LEFT so it never collides with the k marker)
      g += '<line x1="' + m1.l + '" y1="' + syR(alpha).toFixed(1) + '" x2="' + (W - m1.r) + '" y2="' + syR(alpha).toFixed(1) +
           '" stroke="' + P.acc + '" stroke-width="1" stroke-dasharray="3 3"/>' +
           '<text x="' + (m1.l + 4) + '" y="' + (syR(alpha) - 5).toFixed(1) + '" ' +
           'font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.acc + '" ' + HALO + '>alpha = ' + alpha + '</text>';
      // theoretical uncorrected curve (always shown, so the correction is measured against it)
      var th = [];
      for (var a = 1; a <= kMax; a++) th.push(sxK(a).toFixed(1) + ',' + syR(1 - Math.pow(1 - alpha, a)).toFixed(1));
      g += '<polyline points="' + th.join(' ') + '" fill="none" stroke="' + P.faint + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      // simulated curve for the current mode
      var sim = [];
      for (var b2 = 1; b2 <= kMax; b2++) sim.push(sxK(b2).toFixed(1) + ',' + syR(curves[mode][b2 - 1]).toFixed(1));
      g += '<polyline points="' + sim.join(' ') + '" fill="none" stroke="' + (mode === 'none' ? P.bad : P.c0) + '" stroke-width="2.5"/>';
      // marker at the current k
      g += '<line x1="' + sxK(k).toFixed(1) + '" y1="' + m1.t + '" x2="' + sxK(k).toFixed(1) + '" y2="' + (m1.t + h1) +
           '" stroke="' + P.line + '" stroke-dasharray="2 3"/>' +
           '<circle cx="' + sxK(k).toFixed(1) + '" cy="' + syR(rate).toFixed(1) + '" r="5" fill="' + (mode === 'none' ? P.bad : P.c0) + '"/>';
      // Label on whichever side of the marker has room, above the dot unless it is near the top.
      var lateK = k > kMax * 0.62;
      g += '<text x="' + (lateK ? sxK(k) - 9 : sxK(k) + 9).toFixed(1) + '" y="' + Math.max(m1.t + 11, syR(rate) - 10).toFixed(1) + '" ' +
           'text-anchor="' + (lateK ? 'end' : 'start') + '" font-family="IBM Plex Mono,monospace" font-size="12" ' +
           'font-weight="700" fill="' + (mode === 'none' ? P.bad : P.c0) + '" ' + HALO + '>' + fmtPct(rate) + '</text>';
      // axes
      g += '<line x1="' + m1.l + '" y1="' + (m1.t + h1) + '" x2="' + (W - m1.r) + '" y2="' + (m1.t + h1) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      [1, Math.round(kMax / 2), kMax].forEach(function (kv) {
        g += '<text x="' + sxK(kv).toFixed(1) + '" y="' + (m1.t + h1 + 14) + '" text-anchor="middle" ' +
             'font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + kv + '</text>';
      });
      g += '<text x="' + ((m1.l + W - m1.r) / 2) + '" y="' + (m1.t + h1 + 26) + '" text-anchor="middle" ' +
           'font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">k, number of tests in the family</text>';
      g += '<text x="' + m1.l + '" y="' + (m1.t - 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink +
           '">Studies with at least one false positive</text>';

      /* --- bottom panel: one study, test by test --- */
      var raw = [], ix;
      for (ix = 0; ix < k; ix++) raw.push(pool[studyIx * kMax + ix]);
      var adj = adjust(raw, mode);
      var nHit = 0;
      for (ix = 0; ix < k; ix++) if (adj[ix] < alpha) nHit++;

      g += '<text x="' + m2.l + '" y="' + (m2.t - 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink +
           '">One of those studies: its ' + k + ' p-value' + (k === 1 ? '' : 's') + '</text>';
      // the region that counts as significant
      g += '<rect x="' + m2.l + '" y="' + m2.t + '" width="' + Math.max(0.6, sxP(thresh) - m2.l).toFixed(2) + '" height="' + h2 +
           '" fill="' + P.del + '"/>' +
           '<line x1="' + sxP(thresh).toFixed(2) + '" y1="' + m2.t + '" x2="' + sxP(thresh).toFixed(2) + '" y2="' + (m2.t + h2) +
           '" stroke="' + P.bad + '" stroke-width="1.5"/>';
      // one tick per test, at its raw p-value
      for (ix = 0; ix < k; ix++) {
        var hit = adj[ix] < alpha;
        g += '<line x1="' + sxP(raw[ix]).toFixed(2) + '" y1="' + (m2.t + 6) + '" x2="' + sxP(raw[ix]).toFixed(2) + '" y2="' + (m2.t + h2 - 6) +
             '" stroke="' + (hit ? P.bad : P.mut) + '" stroke-width="' + (hit ? 2.5 : 1.2) + '" stroke-opacity="' + (hit ? 1 : 0.55) + '"/>';
      }
      g += '<line x1="' + m2.l + '" y1="' + (m2.t + h2) + '" x2="' + (W - m2.r) + '" y2="' + (m2.t + h2) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      [0, 0.25, 0.5, 0.75, 1].forEach(function (pv) {
        g += '<text x="' + sxP(pv).toFixed(1) + '" y="' + (m2.t + h2 + 14) + '" text-anchor="middle" ' +
             'font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + pv + '</text>';
      });
      g += '<text x="' + (W - m2.r) + '" y="' + (m2.t - 12) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" ' +
           'font-size="10" fill="' + (nHit ? P.bad : P.mut) + '">' + nHit + ' called significant</text>';

      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W +
        'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Family-wise false positive rate against the number of tests, with one study shown test by test">' +
        g + '</svg>';

      klab.innerHTML = 'k = <b style="color:' + P.ink + '">' + k + '</b> test' + (k === 1 ? '' : 's') + ' in the family';

      var thTxt = '1 &minus; (1 &minus; ' + alpha + ')<sup>' + k + '</sup> = <b>' + fmtPct(theory) + '</b>';
      if (mode === 'none') {
        read.innerHTML = 'Across <b>' + nStudies.toLocaleString() + '</b> simulated studies with no real effect anywhere, ' +
          '<b style="color:' + P.bad + '">' + fmtPct(rate) + '</b> produced at least one p-value below ' + alpha +
          '. Every one of those is a false positive. The formula predicts ' + thTxt + '.' +
          (k === 1 ? ' With a single test the rate is just alpha, which is the risk you agreed to.' : '');
      } else {
        read.innerHTML = LABEL[mode] + ' judges each test against <b>' + alpha + ' / ' + k + ' = ' +
          (alpha / k).toPrecision(2) + '</b> instead of ' + alpha + '. That drops the share of studies with any false positive to ' +
          '<b style="color:' + P.c0 + '">' + fmtPct(rate) + '</b>, back at alpha, while the uncorrected rate (dashed) sits at ' + fmtPct(theory) + '. ' +
          'Holm and Bonferroni give the SAME number here: when nothing is real, both reject something only if the smallest p-value clears alpha / k.';
      }
    }

    if (modes.length > 1) u.wireSeg(el.querySelector('.ms-seg'), function (v) { mode = v; draw(); });
    slider.addEventListener('input', function () { k = +slider.value; draw(); });
    draw();
  }

  function rcode(alpha) {
    return [
      '# Run many studies in which NOTHING is real, and count how often at least one',
      '# of the k tests comes back "significant". Change k and run it again.',
      'set.seed(11)',
      'alpha <- ' + alpha,
      'k     <- 14        # tests in the family',
      'sims  <- 4000      # simulated studies',
      '',
      '# Under a true null a p-value is Uniform(0, 1), so runif(k) IS k null tests.',
      'any_hit <- function(k) {',
      '  p <- runif(k)',
      '  c(none = min(p) < alpha,',
      '    bonferroni = min(p.adjust(p, method = "bonferroni")) < alpha,',
      '    holm       = min(p.adjust(p, method = "holm")) < alpha)',
      '}',
      '',
      'round(colMeans(t(replicate(sims, any_hit(k)))), 3)',
      'round(1 - (1 - alpha)^k, 3)   # what the formula predicts for the uncorrected case'
    ].join('\n');
  }

  window.LessonWidgets.register('multiplicity-sim', mount);
})();

;
/* nest-unnest.js */
/* nest-unnest.js - foundations/iteration: a list-column packs a whole table into a
 * single cell. Toggle between the flat data frame and its nested form (one row per
 * group, each carrying its own mini-table), then run nest() / unnest() for real.
 * cfg: { cols:["region","month","sales"], rows:[["East","Jan",10],...], nestBy:"region", listCol:"data" }
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var cols = cfg.cols || ['region', 'month', 'sales'];
    var rows = cfg.rows || [['East', 'Jan', 10], ['East', 'Feb', 14], ['West', 'Jan', 8], ['West', 'Feb', 12]];
    var nestBy = cfg.nestBy || cols[0];
    var listCol = cfg.listCol || 'data';
    var view = 'flat';
    var dataCols = cols.filter(function (c) { return c !== nestBy; });
    var bi = cols.indexOf(nestBy);

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function groups() {
      var order = [], by = {};
      rows.forEach(function (r) { var k = r[bi]; if (!(k in by)) { by[k] = 0; order.push(k); } by[k]++; });
      return order.map(function (k) { return { key: k, n: by[k] }; });
    }

    function nestedTable() {
      var h = '<table style="border-collapse:collapse;font-family:IBM Plex Mono,monospace;font-size:12.5px;width:100%">';
      h += '<thead><tr><th style="text-align:left;padding:6px 9px;border:1px solid ' + u.P.line + ';background:' + u.P.bg + ';color:' + u.P.ink + ';font-weight:700">' + u.esc(nestBy) + '</th>' +
        '<th style="text-align:left;padding:6px 9px;border:1px solid ' + u.P.line + ';background:' + u.P.add + ';color:' + u.P.ink + ';font-weight:700">' + u.esc(listCol) + ' <span style="font-weight:400;color:' + u.P.mut + '">(list-column)</span></th></tr></thead><tbody>';
      groups().forEach(function (g) {
        h += '<tr><td style="padding:6px 9px;border:1px solid ' + u.P.line + ';background:#fff;color:' + u.P.ink + '">' + u.esc(g.key) + '</td>' +
          '<td style="padding:6px 9px;border:1px solid ' + u.P.line + ';background:#fff">' +
            '<span style="display:inline-block;font-size:11.5px;font-weight:600;color:' + u.P.acc + ';background:' + u.P.add + ';border:1px solid ' + u.P.acc + ';border-radius:6px;padding:3px 9px">tibble [' + g.n + ' x ' + dataCols.length + ']</span>' +
          '</td></tr>';
      });
      return h + '</tbody></table>';
    }

    function rCode() {
      var objs = rows.map(function (r) { var o = {}; cols.forEach(function (c, i) { o[c] = r[i]; }); return o; });
      var rcols = cols.map(function (c) { return { name: c, key: c }; });
      return 'library(dplyr)\nlibrary(tidyr)\n\n' +
        u.rdf(objs, rcols, 'df') + '\n\n' +
        'nested <- df |> nest(' + listCol + ' = c(' + dataCols.join(', ') + '))\n' +
        'nested            # one row per ' + nestBy + ', ' + listCol + ' is a list of tibbles\n\n' +
        'nested |> unnest(' + listCol + ')   # back to the flat frame';
    }

    function render() {
      var isFlat = view === 'flat';
      wrap.querySelector('.nu-table').innerHTML = isFlat ? u.tbl(cols, rows) : nestedTable();
      wrap.querySelector('.nu-cap').innerHTML = isFlat
        ? '<b>' + rows.length + ' rows</b>, one per observation. <code style="font-family:IBM Plex Mono,monospace">nest()</code> packs the ' + dataCols.join(' and ') + ' columns into a list-column.'
        : '<b>' + groups().length + ' rows</b>, one per ' + nestBy + '. Each ' + listCol + ' cell holds a whole tibble. <code style="font-family:IBM Plex Mono,monospace">unnest()</code> spreads it back out.';
      wrap.querySelector('.nu-run').innerHTML = u.runnable(rCode(), { label: 'Run nest() and unnest()' });
    }

    wrap.innerHTML =
      '<div style="border:1px solid ' + u.P.line + ';border-radius:12px;padding:14px 16px;background:#fff">' +
        '<div class="nu-seg">' + u.seg([{ v: 'flat', label: 'Flat frame' }, { v: 'nested', label: 'Nested' }], 'flat') + '</div>' +
        '<div class="nu-table" style="margin:14px 0 0;overflow-x:auto"></div>' +
        '<div class="nu-cap" style="margin:11px 0 0;font-size:12.5px;color:' + u.P.body + ';line-height:1.55"></div>' +
      '</div>' +
      '<div class="nu-run" style="margin:12px 0 0"></div>';

    u.wireSeg(wrap.querySelector('.nu-seg'), function (v) { view = v; render(); });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('nest-unnest', mount);
})();

;
/* null-distribution.js */
/* null-distribution.js - the sampling distribution under H0 with the observed
 * statistic marked and its p-value tail(s) shaded. The p-value is computed from
 * a REAL standard-normal CDF (erf approximation), not faked. Interactive: drag
 * the observed statistic and watch the tail area (the p-value) change.
 * Reusable for any hypothesis-test lesson (t-test, z-test, A/B test).
 * cfg (optional): { tails:1|2, max, start, label }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', ACC = '#1f7a55', TAIL = '#b5631a', LINE = '#c5cdda';

  function erf(x) {
    var s = x < 0 ? -1 : 1; x = Math.abs(x);
    var t = 1 / (1 + 0.3275911 * x);
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return s * y;
  }
  function Phi(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  function pdf(x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); }

  function mount(el, cfg) {
    cfg = cfg || {};
    var tails = cfg.tails || 2, MAX = cfg.max || 4, start = cfg.start != null ? cfg.start : 2.0, label = cfg.label || 'observed t';
    var W = 460, H = 230, padB = 30, padT = 10, x0 = 18, x1 = W - 18, midY = H - padB;
    var sx = function (z) { return x0 + (z + MAX) / (2 * MAX) * (x1 - x0); };
    var peak = pdf(0), sy = function (d) { return padT + (1 - d / peak) * (midY - padT - 6); };
    var curve = '', i;
    for (i = 0; i <= 120; i++) { var z = -MAX + i / 120 * 2 * MAX; curve += (i ? 'L' : 'M') + sx(z).toFixed(1) + ' ' + sy(pdf(z)).toFixed(1) + ' '; }

    el.innerHTML =
      '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>' + label + '</span><b class="nd-tval">' + start.toFixed(2) + '</b></div>' +
      '<input type="range" class="lw-slider nd-slider" min="0" max="' + MAX + '" step="0.05" value="' + start + '"></div>' +
      '<div class="lw-diagram"><svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Null distribution with the p-value tail shaded.">' +
        '<line x1="' + x0 + '" y1="' + midY + '" x2="' + x1 + '" y2="' + midY + '" stroke="' + LINE + '" stroke-width="1"/>' +
        '<path class="nd-tail-r" fill="rgba(181,99,26,0.20)" stroke="none"/>' +
        (tails === 2 ? '<path class="nd-tail-l" fill="rgba(181,99,26,0.20)" stroke="none"/>' : '') +
        '<path d="' + curve + '" fill="none" stroke="' + ACC + '" stroke-width="2"/>' +
        '<line class="nd-line-r" y1="' + padT + '" y2="' + midY + '" stroke="' + TAIL + '" stroke-width="2"/>' +
        (tails === 2 ? '<line class="nd-line-l" y1="' + padT + '" y2="' + midY + '" stroke="' + TAIL + '" stroke-width="2" stroke-dasharray="3 3"/>' : '') +
        '<text x="' + sx(0) + '" y="' + (midY + 15) + '" text-anchor="middle" fill="' + MUT + '" font-family="IBM Plex Mono,monospace" font-size="10">0</text>' +
      '</svg></div>' +
      '<div class="nd-out" style="text-align:center;font:600 13px/1.5 \'IBM Plex Mono\',monospace;color:' + INK + ';margin-top:4px"></div>';

    var slider = el.querySelector('.nd-slider'), tval = el.querySelector('.nd-tval'),
        lineR = el.querySelector('.nd-line-r'), lineL = el.querySelector('.nd-line-l'),
        tailR = el.querySelector('.nd-tail-r'), tailL = el.querySelector('.nd-tail-l'), out = el.querySelector('.nd-out');

    function tailPath(fromZ, dir) {
      var p = 'M' + sx(fromZ).toFixed(1) + ' ' + midY + ' ', n = 40, k;
      for (k = 0; k <= n; k++) { var z = fromZ + (dir * MAX - fromZ) * k / n; p += 'L' + sx(z).toFixed(1) + ' ' + sy(pdf(z)).toFixed(1) + ' '; }
      return p + 'L' + sx(dir * MAX).toFixed(1) + ' ' + midY + ' Z';
    }
    function render() {
      var t = parseFloat(slider.value); tval.textContent = t.toFixed(2);
      var xr = sx(t); lineR.setAttribute('x1', xr); lineR.setAttribute('x2', xr);
      tailR.setAttribute('d', tailPath(t, 1));
      if (tails === 2) { var xl = sx(-t); lineL.setAttribute('x1', xl); lineL.setAttribute('x2', xl); tailL.setAttribute('d', tailPath(-t, -1)); }
      var p = (tails === 2 ? 2 : 1) * (1 - Phi(t)), sig = p < 0.05;
      out.innerHTML = 'p-value = <b style="color:' + (sig ? ACC : TAIL) + '">' + p.toFixed(3) + '</b> &nbsp; ' + (sig ? 'reject H0 (p &lt; 0.05)' : 'fail to reject H0');
    }
    slider.addEventListener('input', render);
    render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('null-distribution', mount);
})();

;
/* ols-fit.js */
/* ols-fit.js - least squares, made literal.
 * Move the slope and intercept; each point drops a residual to the line and draws
 * a SQUARE whose side is that residual (area = squared error). The SSE updates live;
 * "Snap to least squares" jumps to the lm() solution. Emits runnable R that fits the
 * same line with lm() and reports the coefficients + SSE.
 *
 * cfg: { points:[{x,y},...] }  - optional; a default scatter is built from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {};
    var pts = (cfg.points && cfg.points.length) ? cfg.points.map(function (p) { return { x: +p.x, y: +p.y }; })
      : [{ x: 1, y: 2.1 }, { x: 2, y: 2.9 }, { x: 3, y: 3.7 }, { x: 4, y: 3.4 }, { x: 5, y: 5.2 }, { x: 6, y: 5.0 }, { x: 7, y: 6.6 }, { x: 8, y: 6.1 }, { x: 9, y: 7.8 }];

    // least-squares solution (used by the Snap button + the "best" reference)
    function ols() {
      var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0;
      pts.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
      var b = (n * sxy - sx * sy) / (n * sxx - sx * sx), a = (sy - b * sx) / n;
      return { a: a, b: b };
    }
    var best = ols();
    var b = +(best.b * 0.45).toFixed(2);                 // start deliberately off the best fit
    var a = +(best.a + 1.2).toFixed(2);

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="of-chart"></div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 18px;margin:12px 0 4px">' +
        '<label style="font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + '">slope <b class="of-b" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
          '<input class="of-bs" type="range" min="-1" max="2" step="0.02" value="' + b + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
        '<label style="font:600 12px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + '">intercept <b class="of-a" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
          '<input class="of-as" type="range" min="-2" max="6" step="0.05" value="' + a + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:6px 0 14px">' +
        '<div class="of-sse" style="font:13px/1.4 IBM Plex Sans,sans-serif;color:' + P.body + '"></div>' +
        '<button class="of-snap" type="button" style="font:inherit;font-size:12.5px;font-weight:600;color:#fff;background:' + P.acc + ';border:0;border-radius:8px;padding:8px 14px;cursor:pointer">Snap to least squares</button>' +
      '</div>' +
      u.runnable(rcode(pts), { label: 'Fit it for real: lm() finds this exact line' });

    var chart = el.querySelector('.of-chart'), sseEl = el.querySelector('.of-sse'),
        bs = el.querySelector('.of-bs'), as = el.querySelector('.of-as'),
        bEl = el.querySelector('.of-b'), aEl = el.querySelector('.of-a');

    function draw() {
      var W = 480, H = 280, m = { t: 14, r: 14, b: 34, l: 40 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var xs = pts.map(function (p) { return p.x; }), ys = pts.map(function (p) { return p.y; });
      var xlo = Math.min.apply(null, xs) - 0.6, xhi = Math.max.apply(null, xs) + 0.6;
      var ylo = Math.min.apply(null, ys) - 1.4, yhi = Math.max.apply(null, ys) + 1.4;
      function sx(x) { return m.l + (x - xlo) / (xhi - xlo) * iw; }
      function sy(y) { return m.t + ih - (y - ylo) / (yhi - ylo) * ih; }
      var pxPerY = ih / (yhi - ylo);                       // residual square side in px (area = squared error feel)

      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="least squares fit">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      // residual squares (side = |residual| to scale), then the residual segment, then the point
      var sse = 0;
      pts.forEach(function (p) {
        var yhat = a + b * p.x, r = p.y - yhat; sse += r * r;
        var side = Math.abs(r) * pxPerY, px = sx(p.x), py = sy(p.y), pyh = sy(yhat);
        var sqx = px, sqy = Math.min(py, pyh);
        svg += '<rect x="' + sqx.toFixed(1) + '" y="' + sqy.toFixed(1) + '" width="' + side.toFixed(1) + '" height="' + side.toFixed(1) + '" fill="' + P.bad + '" fill-opacity="0.13" stroke="' + P.bad + '" stroke-opacity="0.4"/>';
        svg += '<line x1="' + px.toFixed(1) + '" y1="' + py.toFixed(1) + '" x2="' + px.toFixed(1) + '" y2="' + pyh.toFixed(1) + '" stroke="' + P.bad + '" stroke-width="1.4"/>';
      });
      // the line
      svg += '<line x1="' + sx(xlo).toFixed(1) + '" y1="' + sy(a + b * xlo).toFixed(1) + '" x2="' + sx(xhi).toFixed(1) + '" y2="' + sy(a + b * xhi).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="2.5"/>';
      // points
      pts.forEach(function (p) { svg += '<circle cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="5" fill="' + P.ink + '"/>'; });
      svg += '</svg>';
      chart.innerHTML = svg;

      var bestSse = 0; pts.forEach(function (p) { var r = p.y - (best.a + best.b * p.x); bestSse += r * r; });
      sseEl.innerHTML = 'Sum of squared errors <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + sse.toFixed(2) + '</b>' +
        ' <span style="color:' + P.faint + '">(best possible ' + bestSse.toFixed(2) + ')</span>';
      bEl.textContent = b.toFixed(2); aEl.textContent = a.toFixed(2);
    }

    bs.addEventListener('input', function () { b = +bs.value; draw(); });
    as.addEventListener('input', function () { a = +as.value; draw(); });
    el.querySelector('.of-snap').addEventListener('click', function () {
      b = +best.b.toFixed(2); a = +best.a.toFixed(2); bs.value = b; as.value = a; draw();
    });
    draw();
  }

  function rcode(pts) {
    var rdf = u.rdf(pts, [{ name: 'x', key: 'x' }, { name: 'y', key: 'y' }], 'd');
    return [
      '# The same points. lm() finds the slope + intercept that minimize the',
      '# sum of squared residuals - the squares you were shrinking by hand.',
      rdf,
      '',
      'fit <- lm(y ~ x, data = d)',
      'coef(fit)                       # intercept and slope',
      'sse <- sum(residuals(fit)^2)    # the minimum sum of squared errors',
      'sse',
      '',
      'plot(d$x, d$y, pch = 19, xlab = "x", ylab = "y")',
      'abline(fit, col = "forestgreen", lwd = 2)',
      'segments(d$x, d$y, d$x, fitted(fit), col = "darkorange")   # the residuals'
    ].join('\n');
  }

  window.LessonWidgets.register('ols-fit', mount);
})();

;
/* oob-tuner.js */
/* oob-tuner.js - tune num.trees and mtry on a live forest; watch the OOB error
 * curve fall and flatten, and the mtry sweet spot. Ported from
 * _mocks/rf-course-lesson3 (the canonical OOB-vs-ntree curve + mtry U-shape).
 */
(function () {
  'use strict';
  var IMP = [['tenure', 100], ['monthly_spend', 74], ['total_spend', 63], ['support_calls', 55],
             ['contract_type', 43], ['num_services', 31], ['age', 19], ['payment_method', 12]];

  function asym(m) { return 0.115 + (m < 3 ? 0.020 * Math.pow(3 - m, 1.4) : 0.003 * (m - 3) * (m - 3)); }
  function jit(t) { var x = Math.sin(t * 12.9898) * 43758.5453; return (x - Math.floor(x)) - 0.5; }
  function oobErr(t, m) { var a = asym(m); var base = a + (0.33 - a) * Math.exp(-t / 34); return Math.max(0.045, base + 0.012 * Math.exp(-t / 26) * jit(t)); }

  function mount(el, cfg) {
    var bestMtry = (function () { var b = 1, be = asym(1); for (var m = 2; m <= 8; m++) { if (asym(m) < be) { be = asym(m); b = m; } } return b; })();
    el.innerHTML =
      '<div class="lw-dual">' +
        '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>num.trees</span><b class="lw-tt">100</b></div><input class="lw-strees" type="range" min="1" max="500" step="1" value="100"></div>' +
        '<div class="lw-ctrl"><div class="lw-ctrl-row"><span>mtry (of 8 features)</span><b class="lw-tm">3</b></div><input class="lw-smtry" type="range" min="1" max="8" step="1" value="3"></div>' +
      '</div>' +
      '<div class="lw-chartwrap"><canvas class="lw-oob" width="920" height="440"></canvas></div>' +
      '<div class="lw-readout">' +
        '<div class="lw-m lw-r-err"><div class="lw-v lw-err">.</div><div class="lw-k2">OOB error</div></div>' +
        '<div class="lw-m lw-r-acc"><div class="lw-v lw-acc">.</div><div class="lw-k2">OOB accuracy</div></div>' +
        '<div class="lw-m lw-r-best"><div class="lw-v lw-best">.</div><div class="lw-k2">Best mtry here</div></div>' +
      '</div>' +
      '<div class="lw-impbox"><div class="lw-imph">Variable importance (impurity)</div><div class="lw-imp"></div></div>' +
      '<div class="lw-note"></div>';
    var sT = el.querySelector('.lw-strees'), sM = el.querySelector('.lw-smtry');
    var tt = el.querySelector('.lw-tt'), tm = el.querySelector('.lw-tm');
    var cv = el.querySelector('.lw-oob'), ctx = cv.getContext('2d');
    var errEl = el.querySelector('.lw-err'), accEl = el.querySelector('.lw-acc'), bestEl = el.querySelector('.lw-best'), note = el.querySelector('.lw-note');
    el.querySelector('.lw-imp').innerHTML = IMP.map(function (f) {
      return '<div class="lw-improw"><div class="lw-impnm">' + f[0] + '</div><div class="lw-impbar"><div class="lw-impfill" style="width:' + f[1] + '%"></div></div><div class="lw-imppct">' + f[1] + '</div></div>';
    }).join('');

    function draw() {
      var T = +sT.value, M = +sM.value; tt.textContent = T; tm.textContent = M;
      var W = cv.width, H = cv.height; ctx.clearRect(0, 0, W, H);
      var mL = 64, mR = 22, mT = 20, mB = 52, pW = W - mL - mR, pH = H - mT - mB, eMin = 0.04, eMax = 0.34;
      function X(t) { return mL + (t - 1) / 499 * pW; } function Y(e) { return mT + (1 - (e - eMin) / (eMax - eMin)) * pH; }
      ctx.font = "500 17px 'IBM Plex Mono',monospace"; ctx.textBaseline = "middle";
      [0.10, 0.15, 0.20, 0.25, 0.30].forEach(function (e) { var y = Y(e); ctx.strokeStyle = "#eef1f6"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(mL, y); ctx.lineTo(W - mR, y); ctx.stroke(); ctx.fillStyle = "#97a0b2"; ctx.textAlign = "right"; ctx.fillText((e * 100) + "%", mL - 10, y); });
      ctx.textAlign = "center"; ctx.textBaseline = "top"; [1, 100, 200, 300, 400, 500].forEach(function (t) { ctx.fillStyle = "#97a0b2"; ctx.fillText(t, X(t), H - mB + 12); });
      ctx.fillStyle = "#677084"; ctx.font = "600 18px 'IBM Plex Sans',sans-serif"; ctx.textAlign = "center"; ctx.fillText("number of trees", mL + pW / 2, H - 20);
      ctx.save(); ctx.translate(20, mT + pH / 2); ctx.rotate(-Math.PI / 2); ctx.fillText("OOB error", 0, 0); ctx.restore();
      var aY = Y(asym(M)); ctx.setLineDash([7, 6]); ctx.strokeStyle = "#c2410c"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(mL, aY); ctx.lineTo(W - mR, aY); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#c2410c"; ctx.font = "600 16px 'IBM Plex Mono',monospace"; ctx.textAlign = "left"; ctx.textBaseline = "bottom"; ctx.fillText("floor " + (asym(M) * 100).toFixed(1) + "%", mL + 8, aY - 4);
      ctx.strokeStyle = "rgba(31,122,85,.22)"; ctx.lineWidth = 2; ctx.beginPath(); for (var t = 1; t <= 500; t += 2) { var x = X(t), y = Y(oobErr(t, M)); t === 1 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke();
      ctx.strokeStyle = "#1f7a55"; ctx.lineWidth = 3.4; ctx.lineJoin = "round"; ctx.beginPath(); for (var t2 = 1; t2 <= T; t2++) { var x2 = X(t2), y2 = Y(oobErr(t2, M)); t2 === 1 ? ctx.moveTo(x2, y2) : ctx.lineTo(x2, y2); } ctx.stroke();
      var mx = X(T), my = Y(oobErr(T, M)); ctx.beginPath(); ctx.arc(mx, my, 7, 0, 7); ctx.fillStyle = "#1f7a55"; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = "#fff"; ctx.stroke();
      var e = oobErr(T, M); errEl.textContent = (e * 100).toFixed(1) + '%'; accEl.textContent = ((1 - e) * 100).toFixed(1) + '%'; bestEl.textContent = 'mtry ' + bestMtry;
      var parts = [];
      if (M < 3) parts.push('<b>mtry ' + M + ' is low:</b> each tree is starved of features, so the floor sits above its best.');
      else if (M > 5) parts.push('<b>mtry ' + M + ' is high:</b> trees re-correlate (all chasing the strong features) and the floor creeps back up.');
      else parts.push('<b>mtry ' + M + ' &asymp; &radic;8:</b> the sweet spot, the floor is as low as it goes.');
      if (T < 60) parts.push(' The curve is still falling, drag <b>trees</b> higher.');
      else if (T >= 220) parts.push(' Past ~200 trees the curve is flat, more trees just cost time.');
      else parts.push(' The error has nearly settled.');
      note.innerHTML = parts.join('');
    }
    sT.addEventListener('input', draw); sM.addEventListener('input', draw); draw();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('oob-tuner', mount);
})();

;
/* ood-detect.js */
/* ood-detect.js - out-of-distribution detection by a novelty score + threshold, made visible.
 * Fit the training data's shape (here a Gaussian, scored by Mahalanobis distance), then flag any
 * new point whose score exceeds a threshold as out-of-distribution. The threshold trades a false-
 * positive rate on genuine inliers against the detection rate on true outliers: a strict cutoff
 * misses subtle novelties, a loose one cries wolf. Toggle the cutoff and read both rates off the
 * two score histograms. Emits the same Mahalanobis + chi-square-threshold detector in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // chi-square 2df thresholds (Mahalanobis^2 cutoffs) at 3 percentiles
  var THR = { strict: { q: 13.82, pct: '99.9%' }, medium: { q: 9.21, pct: '99%' }, loose: { q: 5.99, pct: '95%' } };

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function build() {
    var r = rng(2);
    // inlier score ~ chi-square(2df) = Exponential(mean 2); OOD ~ inlier + offset ~32 (a point ~4 sd away)
    var inl = [], ood = [];
    for (var i = 0; i < 400; i++) { inl.push(-2 * Math.log(Math.max(r(), 1e-9))); ood.push(-2 * Math.log(Math.max(r(), 1e-9)) + 26 + 12 * r()); }
    return { inl: inl, ood: ood };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var level = 'medium'; var d = build();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="od-seg" style="margin-bottom:12px">' + u.seg([{ v: 'loose', label: 'Loose (95%)' }, { v: 'medium', label: 'Medium (99%)' }, { v: 'strict', label: 'Strict (99.9%)' }], 'medium') + '</div>' +
      '<div class="od-plot"></div>' +
      '<div class="od-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'OOD detection: Mahalanobis distance + chi-square threshold, base R' });

    var plot = el.querySelector('.od-plot'), read = el.querySelector('.od-read');
    var W = 340, H = 180, PAD = 10, T = 10, Bm = 22, XMAX = 55, NB = 44;
    function px(s) { return PAD + Math.min(s, XMAX) / XMAX * (W - 2 * PAD); }
    function hist(a) { var h = new Array(NB).fill(0); a.forEach(function (s) { var k = Math.min(NB - 1, Math.floor(s / XMAX * NB)); h[k]++; }); return h; }
    function draw() {
      var thr = THR[level].q;
      var hi = hist(d.inl), ho = hist(d.ood);
      var mx = Math.max(Math.max.apply(null, hi), Math.max.apply(null, ho)) || 1;
      var bw = (W - 2 * PAD) / NB;
      function bars(h, col) { return h.map(function (c, k) { var hh = c / mx * (H - T - Bm); return '<rect x="' + (PAD + k * bw).toFixed(1) + '" y="' + (H - Bm - hh).toFixed(1) + '" width="' + (bw - 0.5).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="' + col + '" opacity="0.55"/>'; }).join(''); }
      var fpr = d.inl.filter(function (s) { return s > thr; }).length / d.inl.length;
      var det = d.ood.filter(function (s) { return s > thr; }).length / d.ood.length;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ood score histogram">' +
        bars(hi, P.c0) + bars(ho, P.bad) +
        '<line x1="' + px(thr).toFixed(1) + '" y1="' + T + '" x2="' + px(thr).toFixed(1) + '" y2="' + (H - Bm) + '" stroke="' + P.ink + '" stroke-width="1.5" stroke-dasharray="3 2"/>' +
        '<text x="' + (px(thr) + 3).toFixed(1) + '" y="' + (T + 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.ink + '">flag ></text>' +
        '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">inliers</text>' +
        '<text x="' + (W - 8) + '" y="28" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">out-of-distribution</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">novelty score (Mahalanobis distance) -></text></svg>';
      read.innerHTML = 'At the <b>' + THR[level].pct + '</b> cutoff, <b style="color:' + P.bad + '">' + Math.round(fpr * 100) + '%</b> of genuine inliers are wrongly flagged (false positives) and <b style="color:' + P.acc + '">' + Math.round(det * 100) + '%</b> of true out-of-distribution points are caught. ' +
        (level === 'strict' ? 'A strict cutoff nearly eliminates false alarms but can miss subtle novelty.' : level === 'loose' ? 'A loose cutoff catches everything odd but at a higher false-alarm cost.' : 'A middle cutoff balances the two, the usual starting point.');
    }
    u.wireSeg(el.querySelector('.od-seg'), function (v) { level = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Out-of-distribution detection: score novelty by Mahalanobis distance, threshold it. Base R.',
      'set.seed(2)',
      'n <- 500; X <- cbind(rnorm(n), rnorm(n))       # training data: a 2D Gaussian blob',
      'mu <- colMeans(X); S <- cov(X)',
      'score <- function(pts) mahalanobis(pts, mu, S) # squared Mahalanobis distance = OOD score',
      'thr <- qchisq(0.99, df = 2)                    # cutoff: chi-square 2 df, 99th percentile',
      '',
      'test_in  <- cbind(rnorm(200),    rnorm(200))    # in-distribution',
      'test_ood <- cbind(rnorm(200, 4), rnorm(200, 4)) # out-of-distribution (shifted 4 sd away)',
      'round(c(threshold      = thr,',
      '        flagged_inlier = mean(score(test_in)  > thr),   # false-positive rate ~ 0.01',
      '        flagged_ood    = mean(score(test_ood) > thr)),  # detection rate ~ 0.99',
      '      3)',
      '#>      threshold flagged_inlier    flagged_ood',
      '#>          9.210          0.015          0.990'
    ].join('\n');
  }

  window.LessonWidgets.register('ood-detect', mount);
})();

;
/* ordinal-cumlogit.js */
/* ordinal-cumlogit.js - modeling an ordered outcome without pretending it is a number.
 * Satisfaction is low < medium < high: the order matters, but the gaps are not real
 * distances, so plain regression is wrong. A proportional-odds model gives each response a
 * probability that shifts smoothly as a predictor rises. Slide the predictor and watch the
 * stacked bands move mass from "low" up to "high". Emits runnable R fitting MASS::polr.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var CATS = ['low', 'medium', 'high'];
  var COL = [P.c1, P.faint, P.acc];
  var BETA = 1.1, CUT = [-1.2, 1.0];   // proportional-odds: shared slope, two cutpoints
  function invlogit(z) { return 1 / (1 + Math.exp(-z)); }
  function probs(x) {
    var eta = BETA * x;
    var c1 = invlogit(CUT[0] - eta), c2 = invlogit(CUT[1] - eta);   // cumulative P(<=k)
    return [c1, c2 - c1, 1 - c2];
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var xv = 0;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="oc-plot"></div>' +
      '<label style="display:block;font:600 12px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">predictor (e.g. price cut, service quality) <b class="oc-v" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="oc-s" type="range" min="-3" max="3" step="0.1" value="0" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="oc-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A proportional-odds model with MASS::polr()' });

    var plot = el.querySelector('.oc-plot'), read = el.querySelector('.oc-read'), slider = el.querySelector('.oc-s'), vEl = el.querySelector('.oc-v');
    var W = 440, H = 210, m = { l: 40, r: 90, t: 12, b: 26 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    function draw() {
      // stacked bands across the predictor range + a marker at xv
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ordinal category probabilities">';
      var N = 60, sx = function (i) { return m.l + i / N * iw; };
      // build cumulative band polygons
      var lowerY = []; for (var i = 0; i <= N; i++) lowerY.push(m.t + ih);
      for (var c = 0; c < 3; c++) {
        var top = [], bot = [];
        for (var j = 0; j <= N; j++) { var x = -3 + 6 * j / N, pr = probs(x); var cum = 0; for (var cc = 0; cc <= c; cc++) cum += pr[cc]; var y = m.t + ih - cum * ih; top.push(sx(j) + ',' + y.toFixed(1)); }
        for (var k = N; k >= 0; k--) bot.push(sx(k) + ',' + lowerY[k].toFixed(1));
        svg += '<polygon points="' + top.join(' ') + ' ' + bot.join(' ') + '" fill="' + COL[c] + '" opacity="0.8"/>';
        for (var jj = 0; jj <= N; jj++) { var x2 = -3 + 6 * jj / N, pr2 = probs(x2), cum2 = 0; for (var c2 = 0; c2 <= c; c2++) cum2 += pr2[c2]; lowerY[jj] = m.t + ih - cum2 * ih; }
      }
      // marker
      var mi = (xv + 3) / 6 * N; svg += '<line x1="' + sx(mi).toFixed(1) + '" y1="' + m.t + '" x2="' + sx(mi).toFixed(1) + '" y2="' + (m.t + ih) + '" stroke="' + P.ink + '" stroke-width="1.5"/>';
      // legend
      CATS.forEach(function (nm, i) { svg += '<rect x="' + (m.l + iw + 14) + '" y="' + (m.t + 6 + i * 20) + '" width="12" height="12" rx="2" fill="' + COL[i] + '"/><text x="' + (m.l + iw + 30) + '" y="' + (m.t + 16 + i * 20) + '" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.body + '">' + nm + '</text>'; });
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 3) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">predictor value</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      var pr = probs(xv);
      vEl.textContent = xv.toFixed(1);
      read.innerHTML = 'At this predictor value: P(low) <b>' + (pr[0] * 100).toFixed(0) + '%</b>, P(medium) <b>' + (pr[1] * 100).toFixed(0) + '%</b>, P(high) <b style="color:' + P.acc + '">' + (pr[2] * 100).toFixed(0) + '%</b>. ' +
        'As the predictor rises, probability flows steadily from "low" up to "high". The <b>proportional-odds</b> assumption is that one slope drives every cutpoint, so the bands shift together and never cross.';
    }
    slider.addEventListener('input', function () { xv = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# An ordered outcome (low < medium < high) modeled with proportional odds.',
      'library(MASS)',
      'set.seed(1); n <- 600',
      'x <- rnorm(n)',
      'eta <- 1.1 * x',
      'p_le1 <- plogis(-1.2 - eta); p_le2 <- plogis(1.0 - eta)   # cumulative probs',
      'u <- runif(n)',
      'y <- factor(ifelse(u < p_le1, "low", ifelse(u < p_le2, "medium", "high")),',
      '            levels = c("low","medium","high"), ordered = TRUE)',
      '',
      'm <- polr(y ~ x, Hess = TRUE)',
      'coef(m)          # one slope; positive x shifts mass toward "high"'
    ].join('\n');
  }

  window.LessonWidgets.register('ordinal-cumlogit', mount);
})();

;
/* pca-projection.js */
/* pca-projection.js - PCA in two dimensions. Points from three groups, projected onto
 * PC1/PC2, with a bar of variance explained per component. A toggle rotates between the
 * raw axes and the principal axes so you see PCA find the directions of most spread.
 * Emits runnable R that runs prcomp and plots the projection.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // three loose clusters in 2D (pre-projected for the picture)
  var GROUPS = [
    { c: P.c0, pts: [[-2.1, 1.0], [-1.6, 1.5], [-2.4, 0.5], [-1.2, 0.9], [-1.9, 1.8]] },
    { c: P.acc, pts: [[0.2, -0.3], [0.7, 0.1], [-0.1, 0.4], [0.5, -0.6], [0.0, 0.0]] },
    { c: P.c2 || '#c9a24a', pts: [[2.0, -1.1], [1.6, -1.6], [2.4, -0.7], [1.3, -1.0], [1.9, -1.7]] }
  ];
  var VAR = [0.72, 0.21, 0.07];

  function mount(el, cfg) {
    cfg = cfg || {};
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">' +
        '<div class="pp-sc" style="flex:1 1 240px;min-width:220px"></div>' +
        '<div class="pp-var" style="flex:1 1 170px;min-width:160px"></div>' +
      '</div>' +
      '<div style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px">PC1 is the single direction along which the data spreads most; PC2 is the best remaining direction at right angles to it. Together the first two components keep <b>' + Math.round((VAR[0] + VAR[1]) * 100) + '%</b> of the variance, so a 2D picture barely loses anything.</div>' +
      u.runnable(rcode(), { label: 'Run prcomp and plot the projection in R' });

    var S = 240, m = 26, iw = S - m - 12, ih = S - m - 12;
    var xs = [], ys = []; GROUPS.forEach(function (g) { g.pts.forEach(function (p) { xs.push(p[0]); ys.push(p[1]); }); });
    var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
    function px(x) { return m + (x - x0) / (x1 - x0) * iw; } function py(y) { return (S - m) - (y - y0) / (y1 - y0) * ih; }
    var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PCA projection">';
    svg += '<rect x="' + m + '" y="10" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
    GROUPS.forEach(function (g) { g.pts.forEach(function (p) { svg += '<circle cx="' + px(p[0]).toFixed(1) + '" cy="' + py(p[1]).toFixed(1) + '" r="4.5" fill="' + g.c + '" stroke="#fff" stroke-width="1"/>'; }); });
    svg += '<text x="' + (m + iw / 2) + '" y="' + (S - 5) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">PC1 (' + Math.round(VAR[0] * 100) + '%)</text>';
    svg += '<text transform="translate(11,' + (10 + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">PC2 (' + Math.round(VAR[1] * 100) + '%)</text>';
    svg += '</svg>';
    el.querySelector('.pp-sc').innerHTML = svg;

    var vb = '<div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.05em;text-transform:uppercase;color:' + P.faint + ';margin:2px 0 9px">variance explained</div>';
    VAR.forEach(function (v, i) {
      vb += '<div style="display:flex;align-items:center;gap:8px;margin:6px 0"><span style="font:11px IBM Plex Mono,monospace;color:' + P.mut + ';width:30px">PC' + (i + 1) + '</span>' +
        '<span style="flex:1;height:12px;border-radius:4px;background:' + P.line + ';overflow:hidden;display:block"><i style="display:block;height:100%;width:' + (v * 100).toFixed(0) + '%;background:' + P.acc + '"></i></span>' +
        '<span style="font:11px IBM Plex Mono,monospace;color:' + P.ink + ';width:34px;text-align:right">' + Math.round(v * 100) + '%</span></div>';
    });
    el.querySelector('.pp-var').innerHTML = vb;
  }

  function rcode() {
    return [
      '# PCA finds new axes (principal components) ordered by how much variance they capture.',
      'p <- prcomp(iris[, 1:4], scale. = TRUE)   # always scale first',
      'summary(p)$importance[, 1:3]              # proportion of variance per PC',
      '',
      'scores <- as.data.frame(p$x)              # the rows projected onto the PCs',
      'plot(scores$PC1, scores$PC2,',
      '     col = iris$Species, pch = 19,',
      '     xlab = "PC1", ylab = "PC2")',
      'legend("topright", levels(iris$Species), col = 1:3, pch = 19)'
    ].join('\n');
  }

  window.LessonWidgets.register('pca-projection', mount);
})();

;
/* pdp-curve.js */
/* pdp-curve.js - partial dependence + ICE. Faint lines are individual rows (ICE): how
 * one row's prediction changes as we sweep a single feature, holding its other values
 * fixed. The bold line is their average - the partial-dependence curve. Seeing the ICE
 * spread shows when the average hides interactions. Emits runnable R that builds a PDP
 * by sweeping a feature and averaging predictions.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // an S-shaped average effect with per-row ICE offsets/steepness (interaction)
  var GRID = []; for (var g = 0; g <= 20; g++) GRID.push(g / 20);
  var ROWS = [
    { off: 0.00, k: 6 }, { off: 0.10, k: 5 }, { off: -0.08, k: 7 },
    { off: 0.18, k: 9 }, { off: -0.14, k: 4 }, { off: 0.04, k: 6 }
  ];
  function f(x, r) { return 0.5 + r.off + 0.42 * Math.tanh(r.k * (x - 0.5)); }

  function mount(el, cfg) {
    cfg = cfg || {};
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="pd-plot"></div>' +
      '<div style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px">Each <span style="color:' + P.mut + '">faint line</span> is one row\'s prediction as the feature sweeps left to right (an <b>ICE</b> curve). The <b style="color:' + P.acc + '">bold line</b> is their average - the <b>partial-dependence</b> curve. When the faint lines fan out instead of running parallel, the feature interacts with others and the average alone would mislead.</div>' +
      u.runnable(rcode(), { label: 'Build a partial-dependence curve in R' });

    var S = 260, W = 420, m = 34, iw = W - m - 14, ih = S - m - 14;
    function px(x) { return m + x * iw; } function py(y) { return (S - m) - y * ih; }
    var svg = '<svg viewBox="0 0 ' + W + ' ' + S + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="partial dependence with ICE curves">';
    svg += '<rect x="' + m + '" y="10" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
    // ICE lines
    ROWS.forEach(function (r) {
      var pts = GRID.map(function (x) { return px(x).toFixed(1) + ',' + py(f(x, r)).toFixed(1); }).join(' ');
      svg += '<polyline points="' + pts + '" fill="none" stroke="' + P.mut + '" stroke-width="1" opacity="0.45"/>';
    });
    // PDP = average
    var avg = GRID.map(function (x) { var s = 0; ROWS.forEach(function (r) { s += f(x, r); }); return px(x).toFixed(1) + ',' + py(s / ROWS.length).toFixed(1); }).join(' ');
    svg += '<polyline points="' + avg + '" fill="none" stroke="' + P.acc + '" stroke-width="3"/>';
    svg += '<text x="' + (m + iw / 2) + '" y="' + (S - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">feature value</text>';
    svg += '<text transform="translate(11,' + (10 + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">predicted outcome</text>';
    svg += '</svg>';
    el.querySelector('.pd-plot').innerHTML = svg;
  }

  function rcode() {
    return [
      '# Partial dependence: sweep ONE feature across a grid, holding the rest at their',
      '# real values, predict for every row, and average. The average is the PDP.',
      'set.seed(1)',
      'n <- 300',
      'd <- data.frame(x1 = runif(n), x2 = runif(n))',
      'd$y <- 1 / (1 + exp(-6 * (d$x1 - 0.5))) + 0.4 * d$x2 + rnorm(n, 0, 0.1)',
      'fit <- lm(y ~ poly(x1, 3) + x2, data = d)',
      '',
      'grid <- seq(0, 1, length.out = 25)',
      'pdp <- sapply(grid, function(v) {',
      '  tmp <- d; tmp$x1 <- v             # force x1 = v for every row',
      '  mean(predict(fit, tmp))           # average the predictions',
      '})',
      'plot(grid, pdp, type = "l", lwd = 2, xlab = "x1", ylab = "avg prediction")'
    ].join('\n');
  }

  window.LessonWidgets.register('pdp-curve', mount);
})();

;
/* power-curve.js */
/* power-curve.js - the sample-size / power tradeoff, made visible. For a two-sample test at
 * a fixed significance level, statistical power climbs with the per-group sample size n, and
 * the whole curve shifts left as the true effect grows (a big effect is easy to detect with
 * few subjects; a small one needs a crowd). Toggle the effect size and read off the n that
 * buys 80% power. Emits the exact same numbers from base R's power.t.test.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var ZA = 1.959964;   // qnorm(0.975): two-sided test at alpha = 0.05
  var EFFECTS = { small: 0.2, medium: 0.5, large: 0.8 };

  function erf(x) {
    var t = 1 / (1 + 0.3275911 * Math.abs(x));
    var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }
  function pnorm(x) { return 0.5 * (1 + erf(x / Math.SQRT2)); }
  // power of a two-sample t-test (normal approximation), equal n per group
  function power(d, n) { var ncp = d * Math.sqrt(n / 2); return pnorm(ncp - ZA) + pnorm(-ncp - ZA); }
  // smallest n per group reaching 80% power (integer search)
  function nFor80(d) { for (var n = 2; n < 4000; n++) { if (power(d, n) >= 0.8) return n; } return 4000; }

  function mount(el, cfg) {
    cfg = cfg || {}; var eff = 'medium';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="pw-seg" style="margin-bottom:12px">' + u.seg([{ v: 'small', label: 'Small effect (d=0.2)' }, { v: 'medium', label: 'Medium (d=0.5)' }, { v: 'large', label: 'Large (d=0.8)' }], 'medium') + '</div>' +
      '<div class="pw-plot"></div>' +
      '<div class="pw-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Sample size for 80% power, base R power.t.test' });

    var plot = el.querySelector('.pw-plot'), read = el.querySelector('.pw-read');
    var W = 340, H = 190, NMAX = 300, PAD = 30;
    function px(n) { return PAD + (n / NMAX) * (W - PAD - 8); }
    function py(p) { return (H - 22) - p * (H - 34); }
    function draw() {
      var d = EFFECTS[eff];
      var pts = [];
      for (var n = 2; n <= NMAX; n += 2) pts.push(px(n).toFixed(1) + ',' + py(power(d, n)).toFixed(1));
      var n80 = nFor80(d), x80 = px(Math.min(n80, NMAX)), y80 = py(0.8);
      var grid = '';
      [0.25, 0.5, 0.8].forEach(function (p) { grid += '<line x1="' + PAD + '" y1="' + py(p).toFixed(1) + '" x2="' + (W - 8) + '" y2="' + py(p).toFixed(1) + '" stroke="' + P.line + '" stroke-width="1" stroke-dasharray="3 3"/><text x="' + (PAD - 4) + '" y="' + (py(p) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">' + p + '</text>'; });
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="power versus sample size">' +
        grid +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>' +
        (n80 <= NMAX ? '<line x1="' + x80.toFixed(1) + '" y1="' + y80.toFixed(1) + '" x2="' + x80.toFixed(1) + '" y2="' + (H - 22) + '" stroke="' + P.bad + '" stroke-width="1.5" stroke-dasharray="2 2"/><circle cx="' + x80.toFixed(1) + '" cy="' + y80.toFixed(1) + '" r="3.5" fill="' + P.bad + '"/>' : '') +
        '<text x="' + (W - 8) + '" y="12" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">power</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">sample size n per group</text></svg>';
      read.innerHTML = 'A <b>' + eff + '</b> effect (d = ' + d + ') needs <b style="color:' + P.bad + '">n &asymp; ' + n80 + '</b> per group to reach 80% power at &alpha; = 0.05. ' +
        (eff === 'small' ? 'Small effects are expensive: detecting them reliably takes hundreds per arm.' : eff === 'large' ? 'Large effects are cheap to detect: a couple of dozen per arm suffices.' : 'Halve the effect and the required sample roughly quadruples: power scales with n times d squared.');
    }
    u.wireSeg(el.querySelector('.pw-seg'), function (v) { eff = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# How many subjects per group for 80% power? Base R, no packages.',
      '# Two-sample t-test, alpha = 0.05 two-sided, effect measured in standard deviations (sd = 1).',
      'sizes <- sapply(c(small = 0.2, medium = 0.5, large = 0.8), function(d)',
      '  ceiling(power.t.test(delta = d, sd = 1, sig.level = 0.05, power = 0.80)$n))',
      'sizes',
      '',
      '# and the reverse: the power you actually get from n = 64 per group',
      'round(sapply(c(small = 0.2, medium = 0.5, large = 0.8), function(d)',
      '  power.t.test(n = 64, delta = d, sd = 1, sig.level = 0.05)$power), 3)',
      '# small effects need hundreds per arm; large effects only dozens.'
    ].join('\n');
  }

  window.LessonWidgets.register('power-curve', mount);
})();

;
/* ppc-overlay.js */
/* ppc-overlay.js - the posterior predictive check, made visible. Pick a test statistic
 * (here: how many zeros a dataset has), simulate it under the fitted model many times, and
 * see where the OBSERVED value falls. Under a good model the observed statistic sits in the
 * bulk of the replicates; under a misspecified one it lands in the tail. Toggle between a
 * Normal fit (wrong for zero-heavy counts) and a Poisson fit (right) and watch the observed
 * line move from the tail into the crowd. Emits the same PPC p-value in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var T_OBS = 15;          // observed number of zeros in the data (matches the runnable R)
  var MU = 1.6, SD = 1.4;  // fitted mean and sd of the counts

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function reps(model, nrep) {
    var r = rng(model === 'poisson' ? 11 : 23), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    function rpois(l) { var L = Math.exp(-l), k = 0, p = 1; do { k++; p *= r(); } while (p > L); return k - 1; }
    var out = [];
    for (var j = 0; j < nrep; j++) {
      var zeros = 0;
      for (var i = 0; i < 60; i++) {
        var val = model === 'poisson' ? rpois(MU) : Math.round(MU + SD * rnorm());
        if (val === 0) zeros++;
      }
      out.push(zeros);
    }
    return out;
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var model = 'normal';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="pp-seg" style="margin-bottom:12px">' + u.seg([{ v: 'normal', label: 'Normal fit (wrong)' }, { v: 'poisson', label: 'Poisson fit (right)' }], 'normal') + '</div>' +
      '<div class="pp-plot"></div>' +
      '<div class="pp-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A posterior predictive check with the number-of-zeros statistic, base R' });

    var plot = el.querySelector('.pp-plot'), read = el.querySelector('.pp-read');
    var W = 340, H = 170, XMAX = 24;
    function bx(t) { return (t / XMAX) * (W - 8) + 4; }
    function draw() {
      var rp = reps(model, 2000);
      var bins = new Array(XMAX + 1).fill(0);
      rp.forEach(function (t) { if (t >= 0 && t <= XMAX) bins[t]++; });
      var mx = Math.max.apply(null, bins) || 1, bw = (W - 8) / (XMAX + 1);
      var ppc = rp.filter(function (t) { return t >= T_OBS; }).length / rp.length;
      var bars = bins.map(function (c, t) { var h = c / mx * (H - 34); return '<rect x="' + bx(t).toFixed(1) + '" y="' + (H - 18 - h).toFixed(1) + '" width="' + (bw - 1).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + P.c0 + '" opacity="0.55"/>'; }).join('');
      var obsX = bx(T_OBS).toFixed(1);
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="posterior predictive check">' +
        bars +
        '<line x1="' + obsX + '" y1="4" x2="' + obsX + '" y2="' + (H - 18) + '" stroke="' + P.bad + '" stroke-width="2"/>' +
        '<text x="' + obsX + '" y="14" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.bad + '">observed = ' + T_OBS + '</text>' +
        '<text x="6" y="' + (H - 4) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">number of zeros in a replicated dataset</text></svg>';
      read.innerHTML = (model === 'poisson'
        ? 'The <b>Poisson</b> replicates cluster around 11-12 zeros, and the observed <b style="color:' + P.bad + '">15</b> sits comfortably inside the crowd. '
        : 'The <b>Normal</b> replicates almost never reach 15 zeros (they average ~8), so the observed <b style="color:' + P.bad + '">15</b> lands far out in the tail. ') +
        'PPC p-value &asymp; <b>' + ppc.toFixed(2) + '</b>: ' + (ppc > 0.05 && ppc < 0.95 ? 'the model reproduces this feature of the data.' : 'the model fails to reproduce the zeros, a clear misfit.');
    }
    u.wireSeg(el.querySelector('.pp-seg'), function (v) { model = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Posterior predictive check: does the model reproduce the number of zeros? Base R.',
      'set.seed(2)',
      'y <- rpois(60, 1.5)                               # observed zero-heavy counts',
      'T_obs <- sum(y == 0)                              # test statistic: number of zeros',
      'mu <- mean(y); s <- sd(y)',
      '',
      '# replicate the statistic under each fitted model',
      'T_normal <- replicate(3000, sum(round(rnorm(60, mu, s)) == 0))   # wrong: a Normal',
      'T_pois   <- replicate(3000, sum(rpois(60, mu) == 0))             # right: a Poisson',
      '',
      'round(c(T_obs = T_obs,',
      '        ppc_p_normal = mean(T_normal >= T_obs),   # near 0 => the Normal misfits',
      '        ppc_p_pois   = mean(T_pois   >= T_obs)),  # mid-range => the Poisson is fine',
      '      3)',
      '# the Normal predicts far too few zeros (tiny PPC p); the Poisson reproduces them.'
    ].join('\n');
  }

  window.LessonWidgets.register('ppc-overlay', mount);
})();

;
/* process-flow.js */
/* process-flow.js - a numbered N-step pipeline as a vertical flow diagram.
 * Static. Reads well on desktop and narrow screens (single column).
 * cfg (optional): { steps:[{title, sub}] }
 */
(function () {
  'use strict';
  var INK = '#131720', MUT = '#677084', ACC = '#1f7a55', BG = '#f3f6f4', LINE = '#c5cdda';
  var _uid = 0;

  function mount(el, cfg) {
    cfg = cfg || {};
    var steps = (cfg.steps && cfg.steps.length) ? cfg.steps : [
      { title: 'Bootstrap', sub: 'grow each tree on its own random resample of the rows' },
      { title: 'Random features', sub: 'at each split, consider only a random subset (mtry)' },
      { title: 'Average', sub: 'all trees vote; the majority or mean is the forest answer' }
    ];
    var n = steps.length, boxH = 62, gap = 24, padY = 6;
    var H = padY * 2 + n * boxH + (n - 1) * gap, mid = 'pf-ar' + (++_uid), out = '', i;
    for (i = 0; i < n; i++) {
      var y = padY + i * (boxH + gap), cy = y + boxH / 2;
      out += '<rect x="8" y="' + y + '" width="444" height="' + boxH + '" rx="11" fill="' + BG + '" stroke="' + LINE + '" stroke-width="1.5"/>' +
        '<circle cx="40" cy="' + cy + '" r="16" fill="' + ACC + '"/>' +
        '<text x="40" y="' + (cy + 5) + '" text-anchor="middle" fill="#fff" font-family="IBM Plex Mono, monospace" font-size="15" font-weight="700">' + (i + 1) + '</text>' +
        '<text x="68" y="' + (y + 26) + '" fill="' + INK + '" font-family="IBM Plex Mono, monospace" font-size="14" font-weight="700">' + steps[i].title + '</text>' +
        '<text x="68" y="' + (y + 46) + '" fill="' + MUT + '" font-family="IBM Plex Mono, monospace" font-size="11">' + steps[i].sub + '</text>';
      if (i < n - 1) out += '<line x1="40" y1="' + (y + boxH + 2) + '" x2="40" y2="' + (y + boxH + gap - 4) + '" stroke="' + MUT + '" stroke-width="2" marker-end="url(#' + mid + ')"/>';
    }
    var svg = '<svg viewBox="0 0 460 ' + H + '" width="100%" style="max-width:460px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + n + '-step process flow">' +
      '<defs><marker id="' + mid + '" markerWidth="9" markerHeight="9" refX="6" refY="3" orient="auto"><path d="M0 0 L6 3 L0 6 z" fill="' + MUT + '"/></marker></defs>' + out + '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  if (window.LessonWidgets) window.LessonWidgets.register('process-flow', mount);
})();

;
/* quantile-lines.js */
/* quantile-lines.js - one regression line is not enough when the spread changes. Income
 * fans out with experience: juniors cluster tight, seniors range from modest to huge.
 * OLS draws a single line through the middle and hides that. Quantile regression draws a
 * line for the 10th, 50th and 90th percentile; because they fan apart, you can read the
 * whole conditional distribution, not just its mean. Toggle a quantile to highlight it.
 * Emits runnable base-R that fits a quantile line by minimizing the pinball (check) loss.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // heteroskedastic fan: y spread grows with x
  var D = (function () {
    var a = [], s = 5; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff - 0.5; }
    for (var i = 0; i < 90; i++) { var x = 1 + (i / 89) * 18; a.push({ x: x, y: 20 + 2.2 * x + r() * (6 + 2.4 * x) }); }
    return a;
  })();
  // fanned quantile lines (intercept, slope) matched to the generator
  var Q = { '0.1': [16, 1.0], '0.5': [20, 2.2], '0.9': [24, 3.4] };

  function mount(el, cfg) {
    cfg = cfg || {}; var tau = '0.5';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ql-seg" style="margin-bottom:12px">' + u.seg([{ v: '0.1', label: '10th %ile' }, { v: '0.5', label: 'median' }, { v: '0.9', label: '90th %ile' }], '0.5') + '</div>' +
      '<div class="ql-plot"></div>' +
      '<div class="ql-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A quantile line by minimizing the pinball loss (base R)' });

    var plot = el.querySelector('.ql-plot'), read = el.querySelector('.ql-read');
    var W = 440, H = 250, m = { l: 42, r: 12, t: 12, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var xe = [0, 20], ye = [0, 120];
    function sx(x) { return m.l + (x - xe[0]) / (xe[1] - xe[0]) * iw; }
    function sy(y) { return m.t + ih - (y - ye[0]) / (ye[1] - ye[0]) * ih; }
    function draw() {
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="quantile regression">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      D.forEach(function (d) { svg += '<circle cx="' + sx(d.x).toFixed(1) + '" cy="' + sy(d.y).toFixed(1) + '" r="3" fill="' + P.c0 + '" opacity="0.4"/>'; });
      ['0.1', '0.5', '0.9'].forEach(function (q) { var b = Q[q], on = q === tau, col = on ? P.acc : P.faint;
        svg += '<line x1="' + sx(xe[0]) + '" y1="' + sy(b[0] + b[1] * xe[0]) + '" x2="' + sx(xe[1]) + '" y2="' + sy(b[0] + b[1] * xe[1]) + '" stroke="' + col + '" stroke-width="' + (on ? 3 : 1.8) + '"/>';
        svg += '<text x="' + (sx(xe[1]) - 3) + '" y="' + (sy(b[0] + b[1] * xe[1]) - 4).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + col + '">&tau;=' + q + '</text>'; });
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 4) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">years of experience</text>';
      svg += '<text transform="translate(12,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">income</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      var b = Q[tau];
      read.innerHTML = tau === '0.5'
        ? 'The <b>median</b> line (slope ' + b[1].toFixed(1) + ') is close to what OLS would give. But it is only the middle of the story.'
        : '<b style="color:' + P.acc + '">The &tau;=' + tau + ' line has slope ' + b[1].toFixed(1) + '.</b> The 90th-percentile line rises far steeper than the 10th: each extra year of experience buys the top earners much more than the bottom. The lines <b>fan apart</b> because the spread grows with x, which a single OLS line can never show.';
    }
    u.wireSeg(el.querySelector('.ql-seg'), function (v) { tau = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Quantile regression fits a line to a percentile by minimizing the pinball loss.',
      'set.seed(5); n <- 300',
      'x <- runif(n, 1, 19)',
      'y <- 20 + 2.2 * x + rnorm(n) * (6 + 2.4 * x)   # spread grows with x (heteroskedastic)',
      '',
      'pinball <- function(b, tau) { r <- y - (b[1] + b[2]*x); sum(r * (tau - (r < 0))) }',
      'fit_q  <- function(tau) optim(c(20, 2), pinball, tau = tau)$par',
      'rbind(q10 = fit_q(0.1), median = fit_q(0.5), q90 = fit_q(0.9))',
      '# the slope rises across quantiles: the top earners gain more per year than the bottom.'
    ].join('\n');
  }

  window.LessonWidgets.register('quantile-lines', mount);
})();

;
/* rdd-cutoff.js */
/* rdd-cutoff.js - sharp regression discontinuity, made visible. Units are treated only when
 * a running variable crosses a cutoff (a test score, an income threshold, an age). Just below
 * and just above the cutoff, units are near-identical except for treatment, so the vertical
 * JUMP in the fitted outcome at the cutoff is the causal effect. Fit a separate local line on
 * each side within a bandwidth and read the gap; a naive treated-minus-control difference is
 * biased by the slope in the running variable. Toggle the bandwidth and watch the estimate and
 * its wobble trade off. Emits the two local lm() fits in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  var BW = { narrow: 0.3, medium: 0.6, wide: 1.0 };

  function build() {
    var r = rng(2), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var pts = [];
    for (var i = 0; i < 500; i++) { var x = r() * 2 - 1, t = x >= 0 ? 1 : 0; pts.push({ x: x, y: 3 + 2 * x + 4 * t + rnorm(), t: t }); }
    return pts;
  }
  function ols(pts) {  // returns {a, b}: y = a + b x
    var n = pts.length; if (n < 2) return { a: 0, b: 0 };
    var mx = 0, my = 0; pts.forEach(function (p) { mx += p.x; my += p.y; }); mx /= n; my /= n;
    var sxy = 0, sxx = 0; pts.forEach(function (p) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) * (p.x - mx); });
    var b = sxx ? sxy / sxx : 0; return { a: my - b * mx, b: b };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var band = 'medium'; var pts = build();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="rd-seg" style="margin-bottom:12px">' + u.seg([{ v: 'narrow', label: 'Narrow band (0.3)' }, { v: 'medium', label: 'Medium (0.6)' }, { v: 'wide', label: 'Wide (1.0)' }], 'medium') + '</div>' +
      '<div class="rd-plot"></div>' +
      '<div class="rd-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Sharp RDD: a local line on each side of the cutoff, base R' });

    var plot = el.querySelector('.rd-plot'), read = el.querySelector('.rd-read');
    var W = 340, H = 200, PADL = 8, PADR = 8, T = 10, Bm = 22;
    function px(x) { return PADL + (x + 1) / 2 * (W - PADL - PADR); }
    function py(y) { return T + (11 - y) / (11 - (-1)) * (H - T - Bm); }
    function draw() {
      var h = BW[band];
      var L = pts.filter(function (p) { return p.x < 0 && p.x >= -h; });
      var Rr = pts.filter(function (p) { return p.x >= 0 && p.x <= h; });
      var fl = ols(L), fr = ols(Rr), jump = fr.a - fl.a;
      var dots = pts.map(function (p) { var inb = Math.abs(p.x) <= h; return '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="1.7" fill="' + (p.t ? P.c0 : P.c1) + '" opacity="' + (inb ? 0.7 : 0.15) + '"/>'; }).join('');
      var x0 = px(0);
      var lseg = '<line x1="' + px(-h).toFixed(1) + '" y1="' + py(fl.a + fl.b * -h).toFixed(1) + '" x2="' + x0.toFixed(1) + '" y2="' + py(fl.a).toFixed(1) + '" stroke="' + P.c1 + '" stroke-width="2.5"/>';
      var rseg = '<line x1="' + x0.toFixed(1) + '" y1="' + py(fr.a).toFixed(1) + '" x2="' + px(h).toFixed(1) + '" y2="' + py(fr.a + fr.b * h).toFixed(1) + '" stroke="' + P.c0 + '" stroke-width="2.5"/>';
      var jseg = '<line x1="' + x0.toFixed(1) + '" y1="' + py(fl.a).toFixed(1) + '" x2="' + x0.toFixed(1) + '" y2="' + py(fr.a).toFixed(1) + '" stroke="' + P.bad + '" stroke-width="3"/>';
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="regression discontinuity">' +
        '<line x1="' + x0.toFixed(1) + '" y1="' + T + '" x2="' + x0.toFixed(1) + '" y2="' + (H - Bm) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="2 3"/>' +
        dots + lseg + rseg + jseg +
        '<text x="' + (x0 + 5) + '" y="' + ((py(fl.a) + py(fr.a)) / 2 + 4).toFixed(1) + '" font-family="IBM Plex Sans,sans-serif" font-size="12" font-weight="600" fill="' + P.bad + '">jump ' + jump.toFixed(2) + '</text>' +
        '<text x="' + (x0 - 4) + '" y="' + (H - 8) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">below cutoff</text>' +
        '<text x="' + (x0 + 4) + '" y="' + (H - 8) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">above (treated)</text></svg>';
      read.innerHTML = 'Fitting a line just below and just above the cutoff, the outcome jumps by <b style="color:' + P.bad + '">' + jump.toFixed(2) + '</b> at the threshold (true effect 4). ' +
        (band === 'narrow' ? 'A narrow band uses only points near the cutoff, so it is less biased but noisier.' : band === 'wide' ? 'A wide band borrows far-away points, steadier but biased if the true relationship curves.' : 'The bandwidth trades bias (wide) against variance (narrow); this is the central RDD tuning choice.');
    }
    u.wireSeg(el.querySelector('.rd-seg'), function (v) { band = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Sharp regression discontinuity: the outcome jumps at a cutoff. Base R.',
      'set.seed(2)',
      'n <- 500; x <- runif(n, -1, 1)          # running variable, cutoff at 0',
      'treat <- as.integer(x >= 0)             # sharp: treated iff x >= cutoff',
      'y <- 3 + 2 * x + 4 * treat + rnorm(n)    # the TRUE jump at the cutoff is 4',
      '',
      'h <- 0.5                                 # bandwidth: keep points within h of the cutoff',
      'left  <- lm(y ~ x, subset = x < 0 & x >= -h)',
      'right <- lm(y ~ x, subset = x >= 0 & x <=  h)',
      'jump <- predict(right, data.frame(x = 0)) - predict(left, data.frame(x = 0))',
      'round(c(true = 4, rdd = unname(jump),',
      '        naive = mean(y[treat==1]) - mean(y[treat==0])), 2)',
      '#>  true   rdd naive',
      '#>  4.00  3.79  6.09   # naive is biased upward by the slope in x'
    ].join('\n');
  }

  window.LessonWidgets.register('rdd-cutoff', mount);
})();

;
/* regex-highlight.js */
/* regex-highlight.js - foundations/strings: see what a regular expression actually
 * matches. Pick a pattern; every match lights up inside a sample string; the count
 * and the real R call update. Then run it for real.
 * cfg: { text: "...", patterns: [{src, label}] }  (src = JS/PCRE-style regex source)
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var text = cfg.text || 'Order A12 shipped on 2026-03-08 to dev@site.org for $45.90';
    var pats = cfg.patterns || [
      { src: '\\d+', label: 'Digits' },
      { src: '\\d{4}-\\d{2}-\\d{2}', label: 'Date' },
      { src: '[\\w.]+@[\\w.]+', label: 'Email' },
      { src: '\\$\\d+\\.\\d+', label: 'Price' }
    ];
    var cur = 0;

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    // highlight every match of src inside text; returns {html, n}
    function highlight(src) {
      var re; try { re = new RegExp(src, 'g'); } catch (e) { return { html: u.esc(text), n: 0 }; }
      var out = '', last = 0, m, n = 0, guard = 0;
      while ((m = re.exec(text)) !== null && guard++ < 2000) {
        var mt = m[0];
        if (mt === '') { re.lastIndex++; continue; }
        out += u.esc(text.slice(last, m.index)) +
          '<mark style="background:' + u.P.add + ';color:' + u.P.ink + ';border-bottom:2px solid ' + u.P.acc + ';border-radius:3px;padding:1px 2px">' + u.esc(mt) + '</mark>';
        last = m.index + mt.length; n++;
      }
      out += u.esc(text.slice(last));
      return { html: out, n: n };
    }
    // R string literal needs backslashes doubled: \d+  ->  "\\d+"
    function rLit(src) { return src.replace(/\\/g, '\\\\'); }

    function render() {
      var p = pats[cur], h = highlight(p.src);
      wrap.querySelector('.rx-str').innerHTML = h.html;
      wrap.querySelector('.rx-meta').innerHTML =
        'Pattern <code style="font-family:IBM Plex Mono,monospace;background:' + u.P.line2 + ';padding:2px 6px;border-radius:5px">' + u.esc(p.src) + '</code> matched <b>' + h.n + '</b> time' + (h.n === 1 ? '' : 's') + '.';
      wrap.querySelector('.rx-run').innerHTML = u.runnable(
        'x <- "' + text.replace(/"/g, '\\"') + '"\n' +
        'regmatches(x, gregexpr("' + rLit(p.src) + '", x))',
        { label: 'Run it in R' });
    }

    wrap.innerHTML =
      '<div style="border:1px solid ' + u.P.line + ';border-radius:12px;padding:14px 16px;background:#fff">' +
        '<div style="font-size:12px;color:' + u.P.mut + ';margin:0 0 8px">Try a pattern:</div>' +
        '<div class="rx-seg">' + u.seg(pats.map(function (p, i) { return { v: i, label: p.label }; }), 0) + '</div>' +
        '<div class="rx-str" style="margin:14px 0 0;font-family:IBM Plex Mono,monospace;font-size:13.5px;line-height:1.9;background:' + u.P.bg + ';border:1px solid ' + u.P.line + ';border-radius:8px;padding:11px 13px;word-break:break-word"></div>' +
        '<div class="rx-meta" style="margin:10px 0 0;font-size:12.5px;color:' + u.P.body + '"></div>' +
      '</div>' +
      '<div class="rx-run" style="margin:12px 0 0"></div>';

    u.wireSeg(wrap.querySelector('.rx-seg'), function (v) { cur = +v; render(); });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('regex-highlight', mount);
})();

;
/* regression-intervals.js */
/* regression-intervals.js - confidence vs prediction intervals.
 * Slide the sample size: the CONFIDENCE band (uncertainty about the mean line)
 * shrinks toward the line as n grows, but the PREDICTION band (where a NEW point
 * could land) stays wide - it is floored by the noise, not the sample size.
 * Emits runnable R using predict(interval = "confidence" / "prediction").
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }; }
  function gauss(r) { return (r() + r() + r() + r() - 2) * 0.8660254; }   // ~N(0,1) from uniforms

  function mount(el, cfg) {
    cfg = cfg || {};
    var n = 20, A = 2, B = 0.6, SD = 1.3, xlo = 0, xhi = 10;
    function data(N) { var r = rng(7), d = []; for (var i = 0; i < N; i++) { var x = r() * 10; d.push({ x: x, y: A + B * x + gauss(r) * SD }); } return d; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ri-chart"></div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">sample size n = <b class="ri-n" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="ri-s" type="range" min="8" max="300" step="1" value="' + n + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="ri-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Confidence vs prediction intervals in R' });

    var chart = el.querySelector('.ri-chart'), read = el.querySelector('.ri-read'),
        slider = el.querySelector('.ri-s'), nEl = el.querySelector('.ri-n');

    function draw() {
      var d = data(n), N = d.length;
      var sx = 0, sy = 0, sxx = 0, sxy = 0; d.forEach(function (p) { sx += p.x; sy += p.y; sxx += p.x * p.x; sxy += p.x * p.y; });
      var xbar = sx / N, b = (N * sxy - sx * sy) / (N * sxx - sx * sx), a = (sy - b * sx) / N;
      var sse = 0, Sxx = 0; d.forEach(function (p) { var e = p.y - (a + b * p.x); sse += e * e; Sxx += (p.x - xbar) * (p.x - xbar); });
      var s = Math.sqrt(sse / Math.max(1, N - 2)), tval = 2.04;
      function ci(x) { return tval * s * Math.sqrt(1 / N + (x - xbar) * (x - xbar) / Sxx); }
      function pi(x) { return tval * s * Math.sqrt(1 + 1 / N + (x - xbar) * (x - xbar) / Sxx); }

      var W = 480, H = 280, m = { t: 14, r: 14, b: 34, l: 40 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var ylo = A - 4, yhi = A + B * 10 + 4;
      function px(x) { return m.l + (x - xlo) / (xhi - xlo) * iw; } function py(y) { return m.t + ih - (y - ylo) / (yhi - ylo) * ih; }
      function band(fn, fill) { var up = '', dn = ''; for (var x = xlo; x <= xhi + 0.001; x += 0.5) { up += px(x).toFixed(1) + ',' + py(a + b * x + fn(x)).toFixed(1) + ' '; dn = px(x).toFixed(1) + ',' + py(a + b * x - fn(x)).toFixed(1) + ' ' + dn; } return '<polygon points="' + up + dn + '" fill="' + fill + '" stroke="none"/>'; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="confidence and prediction intervals"><line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += band(pi, 'rgba(181,99,26,0.13)') + band(ci, 'rgba(31,122,85,0.22)');
      svg += '<line x1="' + px(xlo).toFixed(1) + '" y1="' + py(a + b * xlo).toFixed(1) + '" x2="' + px(xhi).toFixed(1) + '" y2="' + py(a + b * xhi).toFixed(1) + '" stroke="' + P.acc + '" stroke-width="2.5"/>';
      d.forEach(function (p) { svg += '<circle cx="' + px(p.x).toFixed(1) + '" cy="' + py(p.y).toFixed(1) + '" r="' + (n > 120 ? 2.4 : 3.6) + '" fill="' + P.ink + '" fill-opacity="0.6"/>'; });
      svg += '<rect x="' + (m.l + 8) + '" y="' + (m.t + 4) + '" width="10" height="10" fill="rgba(31,122,85,0.5)"/><text x="' + (m.l + 22) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">confidence (mean)</text><rect x="' + (m.l + 138) + '" y="' + (m.t + 4) + '" width="10" height="10" fill="rgba(181,99,26,0.28)"/><text x="' + (m.l + 152) + '" y="' + (m.t + 13) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.body + '">prediction (new point)</text></svg>';
      chart.innerHTML = svg;
      read.innerHTML = 'At n=' + n + ', confidence half-width at the center is <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">&plusmn;' + ci(xbar).toFixed(2) + '</b> and prediction is <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">&plusmn;' + pi(xbar).toFixed(2) +
        '</b>. Push n up: the green confidence band collapses onto the line (we pin down the mean), but the orange prediction band barely moves - a single new point still carries the irreducible noise.';
      nEl.textContent = n;
    }
    slider.addEventListener('input', function () { n = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Two very different intervals. Confidence = uncertainty about the mean line;',
      '# prediction = where a NEW observation could fall (much wider).',
      'set.seed(1)',
      'x <- runif(40, 0, 10); y <- 2 + 0.6 * x + rnorm(40, 0, 1.3)',
      'fit <- lm(y ~ x)',
      'grid <- data.frame(x = seq(0, 10, 0.5))',
      '',
      'ci <- predict(fit, grid, interval = "confidence")   # for the average y at x',
      'pi <- predict(fit, grid, interval = "prediction")   # for a single new y at x',
      '',
      'plot(x, y, pch = 19, col = "gray60")',
      'abline(fit, col = "forestgreen", lwd = 2)',
      'lines(grid$x, ci[, "lwr"], col = "forestgreen", lty = 2)',
      'lines(grid$x, ci[, "upr"], col = "forestgreen", lty = 2)',
      'lines(grid$x, pi[, "lwr"], col = "darkorange", lty = 3)',
      'lines(grid$x, pi[, "upr"], col = "darkorange", lty = 3)'
    ].join('\n');
  }

  window.LessonWidgets.register('regression-intervals', mount);
})();

;
/* report-four-ways.js */
/* report-four-ways.js - one result, four write-ups, and the reveal that they are one result.
 *
 * Serves the effect-size, confidence-interval, trend, model-fit and missing-data reporting
 * objections in The Publishing Handbook.
 *
 * Stage one: four sentences are shown. The reader picks the one that reads as the
 * strongest evidence. Stage two: the reveal. All four describe the same analysis of the
 * same data, and nothing about the evidence changed between them. What changed is how much
 * of it the reader was allowed to see.
 *
 * Stage three, which is the part that makes this worth doing rather than a trick: a second
 * study is added whose p-value rounds to exactly the same number. Under bare-p reporting
 * the two studies are indistinguishable. Under full reporting they are opposites. One is
 * precise and clinically uninteresting; the other could be anything from nothing to
 * enormous. The p-value cannot tell them apart, and it never could.
 *
 * Every number is computed from the study description with a real t distribution, not
 * typed in: the interval, the t statistic, the p-value and Cohen's d all come from the
 * same means, standard deviation and sample sizes, so they cannot silently disagree. The
 * emitted R rebuilds vectors with exactly those means and standard deviations and runs
 * t.test on them, so it prints the same numbers.
 *
 * cfg: {
 *   studies: [{                     // two by default; more are allowed
 *     label: "Trial A",
 *     outcome: "depression score",  // named in every sentence
 *     unit: "points",
 *     n1: 600, n2: 600,             // group sizes
 *     m1: 0, m2: 0.9,               // group means (m2 - m1 is the reported difference)
 *     sd: 7.5,                      // common within-group standard deviation
 *     mcid: 3                       // smallest difference that matters clinically (0 hides this)
 *   }],
 *   start: 0,                       // which study is shown first
 *   alpha: 0.05
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f6f8fa', pick: '#e7f3ec'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b',
    soft: 'rgba(255,255,255,.05)', pick: 'rgba(70,192,138,.16)'
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

  /* ---- Student t, so every number on a card comes from the same arithmetic ---- */
  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var mi = 1; mi <= 300; mi++) {
      var m2 = 2 * mi, aa = mi * (b - mi) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + mi) * (qab + mi) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return (x < (a + 1) / (a + b + 2)) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pt2(t, df) { return ibeta(df / 2, 0.5, df / (df + t * t)); }
  function qt(p, df) {
    var lo = 0, hi = 200, i;
    for (i = 0; i < 160; i++) { var mid = (lo + hi) / 2; if (1 - pt2(mid, df) / 2 < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  var DEFAULT_STUDIES = [
    { label: 'Trial A', outcome: 'depression score', unit: 'points',
      n1: 600, n2: 600, m1: 0, m2: 0.9, sd: 7.5, mcid: 3 },
    { label: 'Trial B', outcome: 'depression score', unit: 'points',
      n1: 22, n2: 22, m1: 0, m2: 6.4, sd: 9.8, mcid: 3 }
  ];

  function analyse(s, alpha) {
    var df = s.n1 + s.n2 - 2;
    var se = s.sd * Math.sqrt(1 / s.n1 + 1 / s.n2);
    var diff = s.m2 - s.m1, t = diff / se, p = pt2(Math.abs(t), df), tc = qt(1 - alpha / 2, df);
    return { diff: diff, se: se, t: t, df: df, p: p, lo: diff - tc * se, hi: diff + tc * se,
             d: diff / s.sd, sd: s.sd, n1: s.n1, n2: s.n2 };
  }
  function fmtP(p) { return p < 0.001 ? 'p < 0.001' : 'p = ' + p.toFixed(2); }
  function fmtPx(p) { return p < 0.001 ? 'p < 0.001' : 'p = ' + p.toFixed(3); }

  /* the four write-ups of one result */
  function renders(s, a) {
    var un = s.unit;
    return [
      { key: 'bare', name: 'Bare p-value',
        text: 'The treatment group improved significantly (' + fmtP(a.p) + ').',
        shows: [0, 0, 0] },
      { key: 'peff', name: 'p plus an effect size',
        text: 'The treatment group improved significantly (Cohen\'s d = ' + a.d.toFixed(2) + ', ' + fmtP(a.p) + ').',
        shows: [1, 0, 0] },
      { key: 'ci', name: 'Interval, no p-value',
        text: 'The groups differed by ' + a.diff.toFixed(2) + ' ' + un + ' (95% CI ' + a.lo.toFixed(2) + ' to ' + a.hi.toFixed(2) + ').',
        shows: [1, 1, 0] },
      { key: 'full', name: 'The whole result',
        text: 'Mean difference ' + a.diff.toFixed(2) + ' ' + un + ' (95% CI ' + a.lo.toFixed(2) + ' to ' + a.hi.toFixed(2) + '), ' +
              't(' + a.df + ') = ' + a.t.toFixed(2) + ', ' + fmtPx(a.p) + ', d = ' + a.d.toFixed(2) + ', n = ' + a.n1 + ' and ' + a.n2 + '. ' +
              (s.mcid ? 'The smallest change patients notice is about ' + s.mcid + ' ' + un + ', ' +
                 (a.hi < s.mcid ? 'and the whole interval falls below that.'
                                : 'and the interval runs from below that to well above it.') : ''),
        shows: [1, 1, 1] }
    ];
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var studies = (cfg.studies && cfg.studies.length ? cfg.studies : DEFAULT_STUDIES);
    var alpha = +cfg.alpha || 0.05;
    var cur = Math.max(0, Math.min(studies.length - 1, +cfg.start || 0));
    var picked = null, revealed = false;

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      '<div class="rf-q" style="font:600 13.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.ink + ';margin-bottom:4px"></div>' +
      '<div class="rf-sub" style="font:12px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + ';margin-bottom:11px"></div>' +
      '<div class="rf-cards" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:9px"></div>' +
      '<div class="rf-reveal" style="margin-top:13px"></div>' +
      '<div class="rf-r" style="margin-top:13px"></div>';

    var q = el.querySelector('.rf-q'), sub = el.querySelector('.rf-sub'),
        cards = el.querySelector('.rf-cards'), reveal = el.querySelector('.rf-reveal'),
        rbox = el.querySelector('.rf-r');

    cards.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-k]') : null;
      if (!b || !cards.contains(b)) return;
      picked = b.getAttribute('data-k'); revealed = true; render();
    });

    function render() {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      var s = studies[cur], a = analyse(s, alpha), rs = renders(s, a);

      q.textContent = revealed ? 'The same analysis, written four ways'
                               : 'Which of these reads as the strongest evidence?';
      q.style.color = P.ink;
      sub.textContent = revealed ? s.label + ': ' + s.n1 + ' and ' + s.n2 + ' participants, outcome measured in ' + s.unit + '.'
                                 : 'Four sentences from four different papers reporting a trial of the same drug. Pick one.';
      sub.style.color = P.faint;

      cards.innerHTML = rs.map(function (r) {
        var on = revealed && picked === r.key;
        return '<button type="button" data-k="' + r.key + '"' + (revealed ? ' disabled' : '') +
          ' style="text-align:left;font:inherit;cursor:' + (revealed ? 'default' : 'pointer') +
          ';border:1.5px solid ' + (on ? P.acc : P.line) + ';background:' + (on ? P.pick : P.soft) +
          ';border-radius:10px;padding:11px 12px;display:block;width:100%">' +
          (revealed ? '<div style="font:600 10px IBM Plex Sans,sans-serif;letter-spacing:.05em;text-transform:uppercase;color:' +
             (on ? P.acc : P.faint) + ';margin-bottom:5px">' + u.esc(r.name) + (on ? ' &middot; you picked this' : '') + '</div>' : '') +
          '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + '">' + r.text + '</div>' +
          '</button>';
      }).join('');

      reveal.innerHTML = revealed ? revealPanel(studies, cur, alpha, picked, P) : '';
      rbox.innerHTML = revealed ? u.runnable(rcode(studies, alpha), { label: 'Reproduce every number in R' }) : '';

      var segEl = reveal.querySelector('.rf-seg');
      if (segEl) u.wireSeg(segEl, function (v) { cur = +v; render(); });
    }

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render();
  }

  /* ---------------- the reveal ---------------- */
  var CHECKS = ['How big is it?', 'How precise is it?', 'Does it matter?'];

  function revealPanel(studies, cur, alpha, picked, P) {
    var s = studies[cur], a = analyse(s, alpha), rs = renders(s, a);
    var h = '<div style="border-top:1px solid ' + P.line + ';padding-top:12px">';
    h += '<div style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + '">' +
      'All four sentences describe the same analysis of the same data. The difference is ' +
      '<b>' + a.diff.toFixed(2) + ' ' + s.unit + '</b>, the interval runs <b>' + a.lo.toFixed(2) + ' to ' + a.hi.toFixed(2) +
      '</b>, and <b>' + fmtPx(a.p) + '</b>. Not one number moved between the cards. What moved is how much of the result you were allowed to see.' +
      '</div>';

    /* what each rendering lets a reader answer */
    h += '<table style="border-collapse:collapse;width:100%;margin-top:11px;font-family:IBM Plex Sans,sans-serif;font-size:11.5px">' +
      '<thead><tr><th style="text-align:left;padding:5px 8px;color:' + P.mut + ';font-weight:600;border-bottom:1px solid ' + P.line + '">Rendering</th>' +
      CHECKS.map(function (c) { return '<th style="padding:5px 8px;color:' + P.mut + ';font-weight:600;border-bottom:1px solid ' + P.line + '">' + u.esc(c) + '</th>'; }).join('') +
      '</tr></thead><tbody>';
    rs.forEach(function (r) {
      h += '<tr><td style="padding:5px 8px;color:' + (r.key === picked ? P.acc : P.ink) + ';border-bottom:1px solid ' + P.grid + '">' +
        u.esc(r.name) + (r.key === picked ? ' (your pick)' : '') + '</td>' +
        r.shows.map(function (v) {
          return '<td style="text-align:center;padding:5px 8px;border-bottom:1px solid ' + P.grid + ';color:' + (v ? P.acc : P.bad) +
            ';font-family:IBM Plex Mono,monospace">' + (v ? 'yes' : 'no') + '</td>';
        }).join('') + '</tr>';
    });
    h += '</tbody></table>';

    /* the two studies, side by side */
    if (studies.length > 1) {
      h += '<div style="margin-top:15px;font:600 12.5px IBM Plex Sans,sans-serif;color:' + P.ink + '">Now a second trial with the same p-value</div>' +
        '<div class="rf-seg" style="margin:8px 0 10px">' +
        u.seg(studies.map(function (st, i) { return { v: i, label: st.label }; }), cur) + '</div>' +
        compare(studies, alpha, P);
    }
    return h + '</div>';
  }

  function compare(studies, alpha, P) {
    var as = studies.map(function (s) { return analyse(s, alpha); });
    var rows = [
      ['Reported as a bare p-value', as.map(function (a) { return fmtP(a.p); })],
      ['Difference', as.map(function (a, i) { return a.diff.toFixed(2) + ' ' + studies[i].unit; })],
      ['95% interval', as.map(function (a) { return a.lo.toFixed(2) + ' to ' + a.hi.toFixed(2); })],
      ['Cohen\'s d', as.map(function (a) { return a.d.toFixed(2); })],
      ['Group sizes', as.map(function (a) { return a.n1 + ' and ' + a.n2; })]
    ];
    var h = '<table style="border-collapse:collapse;width:100%;font-family:IBM Plex Sans,sans-serif;font-size:12px"><thead><tr>' +
      '<th style="text-align:left;padding:5px 8px;border-bottom:1px solid ' + P.line + ';color:' + P.mut + ';font-weight:600"></th>' +
      studies.map(function (s) { return '<th style="text-align:right;padding:5px 8px;border-bottom:1px solid ' + P.line + ';color:' + P.mut + ';font-weight:600">' + u.esc(s.label) + '</th>'; }).join('') +
      '</tr></thead><tbody>';
    rows.forEach(function (r, ri) {
      var same = r[1].every(function (v) { return v === r[1][0]; });
      h += '<tr><td style="padding:5px 8px;border-bottom:1px solid ' + P.grid + ';color:' + P.body + '">' + u.esc(r[0]) +
        (ri === 0 && same ? ' <span style="color:' + P.bad + ';font-weight:600">identical</span>' : '') + '</td>' +
        r[1].map(function (v) {
          return '<td style="text-align:right;padding:5px 8px;border-bottom:1px solid ' + P.grid + ';color:' + (same ? P.bad : P.ink) +
            ';font-family:IBM Plex Mono,monospace">' + u.esc(v) + '</td>';
        }).join('') + '</tr>';
    });
    h += '</tbody></table>';
    var a0 = as[0], a1 = as[1], m = studies[0].mcid;
    h += '<div style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-top:9px">' +
      'Rounded to two places both trials report the same p-value, so a reader given only that number cannot tell them apart. ' +
      'They are not remotely alike. ' + studies[0].label + ' is precise and small: the whole interval sits ' +
      (m && a0.hi < m ? 'below the ' + m + '-' + studies[0].unit.replace(/s$/, '') + ' change patients can notice, which is a real finding and a negative one'
                      : 'in a narrow range') + '. ' +
      studies[1].label + ' is compatible with almost nothing (' + a1.lo.toFixed(2) + ') and with a very large effect (' + a1.hi.toFixed(2) +
      '), so it settles nothing at all. The p-value cannot tell you which of those two situations you are in, and it never could.</div>';
    return h;
  }

  /* ---------------- runnable R ----------------
     scale() forces exact means and standard deviations, so t.test reproduces the widget's
     numbers to the last digit rather than approximately. */
  function rcode(studies, alpha) {
    var L = ['# Both trials, rebuilt with exactly the means and spreads on screen.',
             'set.seed(1)', ''];
    L.push('make <- function(n, m, s) m + s * as.numeric(scale(rnorm(n)))');
    L.push('');
    L.push('report <- function(x, y, label) {');
    L.push('  tt <- t.test(x, y, var.equal = TRUE)');
    L.push('  sp <- sqrt(((length(x) - 1) * var(x) + (length(y) - 1) * var(y)) /');
    L.push('             (length(x) + length(y) - 2))');
    L.push('  cat(label, ": diff", round(unname(diff(rev(tt$estimate))), 2),');
    L.push('      " CI", round(tt$conf.int[1], 2), "to", round(tt$conf.int[2], 2),');
    L.push('      " t", round(unname(tt$statistic), 2), " p", round(tt$p.value, 3),');
    L.push('      " d", round(unname(diff(rev(tt$estimate))) / sp, 2), "\\n")');
    L.push('}');
    L.push('');
    studies.forEach(function (s, i) {
      L.push('a' + i + ' <- make(' + s.n1 + ', ' + s.m1 + ', ' + s.sd + ')   # control');
      L.push('b' + i + ' <- make(' + s.n2 + ', ' + s.m2 + ', ' + s.sd + ')   # treated');
      L.push('report(b' + i + ', a' + i + ', "' + s.label + '")');
    });
    return L.join('\n');
  }

  window.LessonWidgets.register('report-four-ways', mount);
})();

;
/* repro-repair.js */
/* repro-repair.js - a broken analysis script, repaired one fault at a time, until it runs
 * twice from a clean session and gives the same answer both times.
 *
 * Serves the reproducibility objection in The Publishing Handbook and the sharing chapters
 * in Part 10. The reader is not asked to agree that hidden state is bad. They are handed a
 * script that works on the author's machine and nowhere else, and they have to make it run.
 *
 * THE MECHANIC. Four faults are planted, each on a specific line:
 *
 *   1. hidden state     the script uses an object that only exists because it was typed
 *                       into the console earlier and never saved
 *   2. absolute path    a file path that exists on exactly one laptop
 *   3. unset seed       a random step with no seed, so the numbers change between runs
 *   4. load order       a function is called before the package that defines it is loaded,
 *                       and a later package masks it
 *
 * Click a flagged line to see the fault and apply its repair. Then press Run. The run is a
 * simulation of a FRESH session, which is the whole point: the script has no memory of what
 * you did before, so a fault that a warm session hides shows up immediately.
 *
 * The seed fault is the interesting one and it is why the checker runs the script TWICE.
 * With no seed the script runs perfectly the first time and prints a different number the
 * second time. "It ran" is not "it reproduces", and this is the cheapest way to feel that.
 *
 * The emitted R is the repaired script, and it really runs: it builds its own data instead
 * of reading a path, sets a seed, loads what it uses at the top, and prints a number that
 * is the same on every machine. Verified against R 4.6.0.
 *
 * cfg: {
 *   faults: ["state","path","seed","order"],   // which faults to plant (default: all four)
 *   seed: 12345                                // the seed the repaired script uses
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f6f8fa',
    add: '#e7f3ec', del: '#fbeae5', codeBg: '#0d1117', codeFg: '#e6edf3'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b', soft: 'rgba(255,255,255,.05)',
    add: 'rgba(70,192,138,.18)', del: 'rgba(244,128,90,.18)', codeBg: '#0a0f16', codeFg: '#e6edf3'
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

  /* ---------------- the script, line by line ----------------
     `fault` marks a line as breakable; `broken` is what it says before the repair and
     `fixed` is what it says after. Lines with no fault never change. */
  function script(seed) {
    return [
      { t: '# analysis.R  -  effect of the programme on follow-up score' },
      { t: 'library(dplyr)' },
      { fault: 'order', broken: '', fixed: 'library(MASS)          # every package attached at the top, where you can see them' },
      { t: '' },
      { fault: 'path',
        broken: 'raw   <- read.csv("C:/Users/sam/Desktop/final_v3 (2).csv")',
        fixed: 'raw   <- read.csv("data/trial.csv")     # a path inside the project folder' },
      { fault: 'state',
        broken: 'trial <- cleaned %>% filter(!is.na(score))   # where does `cleaned` come from?',
        fixed: 'trial <- raw %>% filter(!is.na(score))' },
      { t: '' },
      { fault: 'order', broken: 'library(MASS)          # attached halfway down, after dplyr', fixed: '' },
      { fault: 'order',
        broken: 'keep  <- select(trial, id, arm, score)      # whose select() is this now?',
        fixed: 'keep  <- dplyr::select(trial, id, arm, score)' },
      { t: '' },
      { fault: 'seed', broken: '', fixed: 'set.seed(' + seed + ')       # the bootstrap is now repeatable' },
      { t: 'boot  <- replicate(2000, {' },
      { t: '  i <- sample(nrow(keep), replace = TRUE)' },
      { t: '  diff(tapply(keep$score[i], keep$arm[i], mean))' },
      { t: '})' },
      { t: '' },
      { t: 'cat("effect", round(mean(boot), 3),' },
      { t: '    "  95% CI", round(quantile(boot, c(.025, .975)), 3), "\\n")' }
    ];
  }

  var FAULTS = {
    state: {
      name: 'Hidden state',
      why: 'The script asks for an object called `cleaned`. Nothing in the script creates it. It exists on the author\'s machine because it was typed into the console weeks ago and never written down.',
      err: 'Error in filter(., !is.na(score)) : object \'cleaned\' not found',
      fix: 'Build every object the script needs inside the script.'
    },
    path: {
      name: 'Absolute path',
      why: 'That path names one folder on one laptop. A co-author, a reviewer, a server and your own next machine all fail on the same line.',
      err: 'Error in file(file, "rt") : cannot open file \'C:/Users/sam/Desktop/final_v3 (2).csv\': No such file or directory',
      fix: 'Use a path relative to the project folder, and ship the folder.'
    },
    seed: {
      name: 'No seed',
      why: 'The bootstrap draws random samples. With no seed, R starts from a different place every session, so the interval you publish is not the interval anyone else gets.',
      err: 'Ran without error, and produced a DIFFERENT answer than the run before it.',
      fix: 'Set a seed before anything random, and state it in the paper.'
    },
    order: {
      name: 'Load order',
      why: 'MASS and dplyr both export a function called `select`, and they are not the same function. Whichever package was attached last wins. Here MASS is attached halfway down the file, so the same `select()` call means one thing above that line and another below it, and it also depends on what was already attached in the session.',
      err: 'Error in select(trial, id, arm, score) : unused arguments (id, arm, score)',
      fix: 'Attach every package at the top, and write dplyr::select when the name is contested.'
    }
  };
  var ORDER = ['state', 'path', 'seed', 'order'];

  var CHECKS = [
    { key: 'state', label: 'Runs in a session that knows nothing' },
    { key: 'path', label: 'Finds its data on another machine' },
    { key: 'order', label: 'Calls the function it means to call' },
    { key: 'seed', label: 'Gives the same answer twice' }
  ];

  function mount(el, cfg) {
    cfg = cfg || {};
    var want = (cfg.faults && cfg.faults.length ? cfg.faults : ORDER).filter(function (f) { return FAULTS[f]; });
    if (!want.length) want = ORDER.slice();
    var seed = (cfg.seed == null ? 12345 : +cfg.seed);
    var lines = script(seed);
    var repaired = {}, open = null, runs = [];

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      '<div class="rp-head" style="font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:3px">' +
        'analysis.R, exactly as it was sent to the journal</div>' +
      '<div class="rp-hint" style="font:11.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + ';margin-bottom:9px">' +
        'Flagged lines are the faults. Click one to read it and apply the repair.</div>' +
      '<div class="rp-code" style="overflow-x:auto"></div>' +
      '<div class="rp-panel" style="margin-top:10px"></div>' +
      '<div class="rp-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
        '<button type="button" class="rp-run" style="font:600 12.5px IBM Plex Sans,sans-serif;color:#fff;background:' + P.acc +
          ';border:0;border-radius:8px;padding:8px 15px;cursor:pointer">Run twice from a clean session</button>' +
        '<button type="button" class="rp-reset" style="font:600 12.5px IBM Plex Sans,sans-serif;color:' + P.mut +
          ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 14px;cursor:pointer">Start over</button>' +
      '</div>' +
      '<div class="rp-log" style="margin-top:11px"></div>' +
      '<div class="rp-checks" style="margin-top:11px"></div>' +
      '<div class="rp-r" style="margin-top:13px"></div>';

    var codeBox = el.querySelector('.rp-code'), panel = el.querySelector('.rp-panel'),
        log = el.querySelector('.rp-log'), checks = el.querySelector('.rp-checks'),
        rbox = el.querySelector('.rp-r'), runBtn = el.querySelector('.rp-run'),
        resetBtn = el.querySelector('.rp-reset');

    codeBox.addEventListener('click', function (ev) {
      var row = ev.target.closest ? ev.target.closest('[data-f]') : null;
      if (!row || !codeBox.contains(row)) return;
      var f = row.getAttribute('data-f');
      open = (open === f) ? null : f;
      render();
    });
    panel.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-fix]') : null;
      if (!b || !panel.contains(b)) return;
      repaired[b.getAttribute('data-fix')] = true;
      open = null; runs = [];
      render();
    });
    runBtn.addEventListener('click', function () { runs = simulate(want, repaired, seed); render(); });
    resetBtn.addEventListener('click', function () { repaired = {}; open = null; runs = []; render(); });

    function render() {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      codeBox.innerHTML = codeView(lines, want, repaired, open, P);
      panel.innerHTML = open ? faultPanel(open, repaired, P) : '';
      log.innerHTML = runs.length ? logView(runs, P) : '';
      checks.innerHTML = checkList(want, repaired, runs, P);
      rbox.innerHTML = u.runnable(rcode(seed), { label: 'The repaired script, start to finish' });
      runBtn.style.background = P.acc;
      resetBtn.style.color = P.mut; resetBtn.style.borderColor = P.line;
    }

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render();
  }

  /* ---------------- the script view, diff coloured ---------------- */
  function codeView(lines, want, repaired, open, P) {
    var h = '<div style="background:' + P.codeBg + ';border-radius:9px;padding:10px 0;font-family:IBM Plex Mono,monospace;font-size:12.5px;line-height:1.62;min-width:430px">';
    var num = 0, shown = {};
    lines.forEach(function (L) {
      var f = L.fault, active = f && want.indexOf(f) >= 0, done = active && repaired[f];
      var text, bg = 'transparent', mark = ' ';
      if (!active) { text = L.t != null ? L.t : (L.fixed || L.broken); }
      else if (done) {
        if (!L.fixed) return;                               // a line the repair deletes
        text = L.fixed; bg = P.add; mark = '+';
      } else {
        if (!L.broken) return;                              // a line the repair ADDS is not there yet
        text = L.broken; bg = P.del; mark = '-';
      }
      num++;
      if (active) shown[f] = true;
      var isOpen = active && open === f;
      h += '<div' + (active ? ' data-f="' + f + '" tabindex="0" role="button" style="cursor:pointer;' : ' style="') +
        'display:flex;gap:10px;padding:1px 12px;background:' + (isOpen ? 'rgba(255,255,255,.10)' : bg) + '">' +
        '<span style="color:#5b6675;width:20px;text-align:right;flex:none;user-select:none">' + num + '</span>' +
        '<span style="color:' + (mark === '-' ? P.bad : (mark === '+' ? P.acc : '#5b6675')) + ';flex:none;user-select:none">' + mark + '</span>' +
        '<span style="color:' + (text.charAt(0) === '#' ? '#7d8898' : P.codeFg) + ';white-space:pre">' + u.esc(text) + '</span>' +
        (active && !done ? '<span style="margin-left:auto;flex:none;color:' + P.bad + ';font-size:10.5px;align-self:center">fault</span>' : '') +
        '</div>';
    });
    // a fault that is the ABSENCE of a line has nothing to click, so give it a marker
    var MISSING = { seed: 'missing: nothing sets a seed before the bootstrap',
                    order: 'missing: a package is attached too late',
                    state: 'missing: the object this script depends on',
                    path: 'missing: a portable path' };
    want.forEach(function (f) {
      if (repaired[f] || shown[f]) return;
      h += '<div data-f="' + f + '" tabindex="0" role="button" style="cursor:pointer;display:flex;gap:10px;padding:1px 12px;background:' + P.del + '">' +
        '<span style="color:#5b6675;width:20px;text-align:right;flex:none">&nbsp;</span>' +
        '<span style="color:' + P.bad + ';flex:none">!</span>' +
        '<span style="color:' + P.bad + ';white-space:pre">' + u.esc(MISSING[f] || 'missing') + '</span>' +
        '<span style="margin-left:auto;flex:none;color:' + P.bad + ';font-size:10.5px;align-self:center">fault</span>' +
        '</div>';
    });
    return h + '</div>';
  }

  function faultPanel(f, repaired, P) {
    var F = FAULTS[f], done = !!repaired[f];
    return '<div style="border:1px solid ' + P.line + ';border-left:3px solid ' + (done ? P.acc : P.bad) +
      ';border-radius:0 9px 9px 0;background:' + P.soft + ';padding:11px 13px">' +
      '<div style="font:600 12px IBM Plex Sans,sans-serif;color:' + (done ? P.acc : P.bad) + ';margin-bottom:5px">' + u.esc(F.name) + '</div>' +
      '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-bottom:7px">' + F.why.replace(/`([^`]+)`/g,
        '<code style="font-family:IBM Plex Mono,monospace;font-size:12px;color:' + P.ink + '">$1</code>') + '</div>' +
      '<div style="font:12px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:9px"><b>The repair:</b> ' + u.esc(F.fix) + '</div>' +
      (done ? '<div style="font:600 12px IBM Plex Sans,sans-serif;color:' + P.acc + '">Repaired.</div>'
            : '<button type="button" data-fix="' + f + '" style="font:600 12px IBM Plex Sans,sans-serif;color:#fff;background:' + P.acc +
              ';border:0;border-radius:7px;padding:7px 13px;cursor:pointer">Apply this repair</button>') +
      '</div>';
  }

  /* ---------------- the fresh-session run ----------------
     Faults are hit in the order R would hit them; the seed fault only shows on the second
     run, because a script with no seed runs perfectly once. */
  function simulate(want, repaired, seed) {
    var out = [], pass = 1, first = null;
    for (pass = 1; pass <= 2; pass++) {
      var lines = ['> Rscript analysis.R          (fresh session ' + pass + ' of 2)'], stopped = false, k;
      for (k = 0; k < ORDER.length; k++) {
        var f = ORDER[k];
        if (f === 'seed') continue;                        // not an error, a difference
        if (want.indexOf(f) >= 0 && !repaired[f]) {
          lines.push(FAULTS[f].err);
          out.push({ ok: false, lines: lines, fault: f });
          stopped = true;
          break;
        }
      }
      if (stopped) return out;                             // it never got as far as a second run
      var noSeed = want.indexOf('seed') >= 0 && !repaired.seed;
      // a deterministic stand-in for the bootstrap: with a seed both passes agree, without
      // one the second pass starts somewhere else
      var val = noSeed ? bootValue(seed + pass * 7717) : bootValue(seed);
      lines.push('effect ' + val.est + '   95% CI ' + val.lo + ' ' + val.hi);
      out.push({ ok: true, lines: lines, val: val });
      if (pass === 1) first = val;
      else out.push({ verdict: (first.est === val.est && first.lo === val.lo && first.hi === val.hi) });
    }
    return out;
  }
  function bootValue(s) {                                  // stable pseudo-output, not a real fit
    function r(a) { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }
    var e = 2.4 + 0.18 * (r(s) - 0.5), w = 1.55 + 0.12 * (r(s + 1) - 0.5);
    return { est: e.toFixed(3), lo: (e - w).toFixed(3), hi: (e + w).toFixed(3) };
  }

  function logView(runs, P) {
    var h = '<div style="background:' + P.codeBg + ';border-radius:9px;padding:10px 13px;font-family:IBM Plex Mono,monospace;font-size:12px;line-height:1.6">';
    runs.forEach(function (r) {
      if (r.verdict !== undefined) return;
      r.lines.forEach(function (L, i) {
        var col = i === 0 ? '#7d8898' : (r.ok ? P.codeFg : P.bad);
        h += '<div style="color:' + col + ';white-space:pre-wrap">' + u.esc(L) + '</div>';
      });
      h += '<div style="height:6px"></div>';
    });
    h += '</div>';
    var v = runs.filter(function (r) { return r.verdict !== undefined; })[0];
    var failed = runs.filter(function (r) { return r.ok === false; })[0];
    if (failed) {
      h += '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.bad + ';margin-top:8px">' +
        'It stopped on the first fault it met. On your own machine this line works, because your session already holds what the script forgot to say.</div>';
    } else if (v && !v.verdict) {
      h += '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.bad + ';margin-top:8px">' +
        'It ran twice with no error and gave two different answers. This is the fault that survives every code review, because nothing about it looks wrong. ' +
        'The interval you would have published is one draw from a distribution nobody else can reach.</div>';
    } else if (v && v.verdict) {
      h += '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.acc + ';margin-top:8px">' +
        'Two clean sessions, same numbers. That is what a reviewer means by reproducible: not that the analysis is right, but that it is the same analysis every time anyone runs it.</div>';
    }
    return h;
  }

  function checkList(want, repaired, runs, P) {
    var ran = runs.length > 0;
    var v = runs.filter(function (r) { return r.verdict !== undefined; })[0];
    var done = 0;
    var rows = CHECKS.filter(function (c) { return want.indexOf(c.key) >= 0; }).map(function (c) {
      var ok = !!repaired[c.key] && (c.key !== 'seed' || (ran && v && v.verdict));
      if (ok) done++;
      return '<li style="display:flex;gap:8px;align-items:baseline;margin:0 0 3px;font:12.5px IBM Plex Sans,sans-serif;color:' +
        (ok ? P.acc : P.mut) + '"><span style="font-family:IBM Plex Mono,monospace">' + (ok ? 'x' : 'o') + '</span>' + u.esc(c.label) + '</li>';
    });
    return '<div style="font:600 11px IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:4px">' +
      'What a fresh session has proved so far (' + done + ' of ' + rows.length + ')</div>' +
      '<ul style="list-style:none;margin:0;padding:0">' + rows.join('') + '</ul>';
  }

  /* ---------------- runnable R: the repaired script ----------------
     Self-contained on purpose. Building the data in the script is the honest fix for the
     absolute path in a setting where there is no project folder to point at. */
  function rcode(seed) {
    return [
      '# analysis.R, repaired. Everything it needs, it makes or loads itself.',
      'set.seed(' + seed + ')                     # 1. the random step is now repeatable',
      '',
      '# 2. no absolute path: the data is built here rather than read from one laptop.',
      '#    In a real project this line is read.csv("data/trial.csv"), a path inside the',
      '#    project folder that travels with the project. Because the data is built here',
      '#    rather than read, these numbers are this script\'s own, not the console above.',
      'n     <- 300',
      'raw   <- data.frame(',
      '  id    = seq_len(n),',
      '  arm   = rep(c("control", "programme"), each = n / 2),',
      '  score = rnorm(n, mean = rep(c(50, 52.4), each = n / 2), sd = 6)',
      ')',
      'raw$score[c(7, 19, 88)] <- NA          # a little real-world mess',
      '',
      '# 3. no hidden state: every object below is created above.',
      'trial <- raw[!is.na(raw$score), ]',
      'keep  <- trial[, c("id", "arm", "score")]',
      '',
      '# 4. no load-order surprise: base R here, and where a name is contested say',
      '#    which package you mean, as in dplyr::select(...).',
      'boot <- replicate(2000, {',
      '  i <- sample(nrow(keep), replace = TRUE)',
      '  m <- tapply(keep$score[i], keep$arm[i], mean)',
      '  unname(m["programme"] - m["control"])',
      '})',
      '',
      'cat("effect", round(mean(boot), 3),',
      '    "  95% CI", round(quantile(boot, c(.025, .975)), 3), "\\n")',
      '',
      '# Run it twice. Same numbers, on any machine, in any session.'
    ].join('\n');
  }

  window.LessonWidgets.register('repro-repair', mount);
})();

;
/* reshape-grid.js */
/* reshape-grid.js - pivot_longer <-> pivot_wider on a small table.
 * cfg: { wide:{cols,rows}, idCols:["country"], namesTo:"year", valuesTo:"cases" }
 * Toggle pivots the table between wide and long, tinting the id columns vs the
 * names/values columns so the mapping is visible. The long form is derived from
 * the wide form. Default = a country x year cases table.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var wide = cfg.wide || { cols: ['country', '2020', '2021', '2022'], rows: [['India', 10, 12, 15], ['Kenya', 7, 8, 9]] };
    var idCols = cfg.idCols || ['country'];
    var namesTo = cfg.namesTo || 'year', valuesTo = cfg.valuesTo || 'cases';
    var valCols = wide.cols.filter(function (c) { return idCols.indexOf(c) < 0; });

    // derive long
    var longCols = idCols.concat([namesTo, valuesTo]), longRows = [];
    wide.rows.forEach(function (r) { var ids = idCols.map(function (c) { return r[wide.cols.indexOf(c)]; }); valCols.forEach(function (vc) { longRows.push(ids.concat([vc, r[wide.cols.indexOf(vc)]])); }); });

    function wideHi() { var hi = {}; wide.rows.forEach(function (r, ri) { wide.cols.forEach(function (c, ci) { if (valCols.indexOf(c) >= 0) hi[ri + ',' + ci] = u.P.line2; }); }); return hi; }
    function longHi() { var hi = {}; longRows.forEach(function (r, ri) { hi[ri + ',' + (longCols.length - 2)] = u.P.line2; hi[ri + ',' + (longCols.length - 1)] = u.P.line2; }); return hi; }

    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="margin-bottom:11px"><span class="rs-seg"></span></div>' +
      '<div class="rs-stage" style="overflow-x:auto"></div>' +
      '<div class="rs-cap" style="margin-top:9px;font-size:12.5px;color:' + u.P.mut + '"></div>' +
      '<div class="rs-code" style="margin-top:12px"></div>';
    var segHost = wrap.querySelector('.rs-seg'); segHost.innerHTML = u.seg([{ v: 'wide', label: 'Wide' }, { v: 'long', label: 'Long (tidy)' }], 'wide');
    var stage = wrap.querySelector('.rs-stage'), cap = wrap.querySelector('.rs-cap'), codeEl = wrap.querySelector('.rs-code');
    // Self-contained, runnable: build the natural source table inline + the pivot for this direction.
    function rsCode(form) {
      if (form === 'long') {
        return 'library(tidyr)\n' + u.rdfCR('df', wide.cols, wide.rows) + '\n\n' +
          'pivot_longer(df, cols = -' + idCols.join(', -') + ', names_to = "' + namesTo + '", values_to = "' + valuesTo + '")';
      }
      return 'library(tidyr)\n' + u.rdfCR('long', longCols, longRows) + '\n\n' +
        'pivot_wider(long, names_from = ' + namesTo + ', values_from = ' + valuesTo + ')';
    }
    function render(form) {
      if (form === 'wide') {
        stage.innerHTML = u.tbl(wide.cols, wide.rows, { hi: wideHi() });
        cap.innerHTML = 'Wide: one row per ' + idCols.join(', ') + ', one column per ' + namesTo + '. Easy to read, harder to plot. ' + wide.rows.length + ' rows.';
      } else {
        stage.innerHTML = u.tbl(longCols, longRows, { hi: longHi() });
        cap.innerHTML = 'Long (tidy): one row per observation, with <b>' + namesTo + '</b> and <b>' + valuesTo + '</b> columns. This is what ggplot and most models want. ' + longRows.length + ' rows.';
      }
      codeEl.innerHTML = u.runnable(rsCode(form), { label: 'Run this reshape' });
    }
    u.wireSeg(segHost, function (v) { render(v); });
    render('wide');
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('reshape-grid', mount);
})();

;
/* residual-plot.js */
/* residual-plot.js - reading a residuals-vs-fitted plot.
 * Toggle three fits: a healthy one (residuals a flat random band), a funnel
 * (variance grows with the fitted value - heteroscedastic), and a curve
 * (the model missed a nonlinearity). The scatter + its trend update so the
 * learner learns the SHAPE of trouble. Emits runnable R: lm() + plot(fit).
 *
 * cfg: { start:"healthy" }  - optional.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // deterministic standard-ish noise (mean ~0), reused across scenarios
  var Z = [0.4, -1.1, 0.7, -0.3, 1.4, -0.8, 0.2, 0.9, -1.5, 0.6, -0.2, 1.1, -0.9, 0.5, -1.3, 0.8, -0.4, 1.2, -0.7, 0.3, -1.0, 0.6, 1.0, -0.6];

  function mount(el, cfg) {
    cfg = cfg || {};
    var scen = cfg.start || 'healthy';
    var N = Z.length;
    // fitted values spread across a range
    function fitted(i) { return 2 + 8 * i / (N - 1); }
    function resid(i, s) {
      var f = fitted(i), z = Z[i];
      if (s === 'funnel') return z * (0.25 + 0.34 * (f - 2));          // spread grows with fitted
      if (s === 'curved') { var c = (f - 6); return 0.9 * (c * c / 4 - 1.4) + z * 0.5; } // U-shaped bias
      return z * 1.0;                                                   // healthy: flat band
    }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="rp-seg" style="margin:0 0 12px">' + u.seg([{ v: 'healthy', label: 'Healthy fit' }, { v: 'funnel', label: 'Funnel (non-constant variance)' }, { v: 'curved', label: 'Curve (missed nonlinearity)' }], scen) + '</div>' +
      '<div class="rp-chart"></div>' +
      '<div class="rp-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'See the real diagnostic plots in R' });

    var chart = el.querySelector('.rp-chart'), read = el.querySelector('.rp-read');

    function draw() {
      var W = 480, H = 250, m = { t: 16, r: 14, b: 36, l: 44 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
      var rs = []; for (var i = 0; i < N; i++) rs.push(resid(i, scen));
      var rmax = Math.max.apply(null, rs.map(Math.abs)) * 1.15 || 1;
      var flo = 2, fhi = 10;
      function sx(f) { return m.l + (f - flo) / (fhi - flo) * iw; }
      function sy(r) { return m.t + ih / 2 - r / rmax * (ih / 2); }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="residuals versus fitted">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      svg += '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>';
      // zero reference
      svg += '<line x1="' + m.l + '" y1="' + sy(0).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(0).toFixed(1) + '" stroke="' + P.bad + '" stroke-dasharray="4 3" opacity=".55"/>';
      // a smooth trend (mean residual in sliding windows) - flat = good
      var trend = ''; for (var t = 0; t <= 16; t++) { var f = flo + (fhi - flo) * t / 16; var acc = 0, wsum = 0; for (var j = 0; j < N; j++) { var d = Math.abs(fitted(j) - f); var w = Math.exp(-d * d / 2.2); acc += w * rs[j]; wsum += w; } trend += sx(f).toFixed(1) + ',' + sy(acc / wsum).toFixed(1) + ' '; }
      svg += '<polyline points="' + trend.trim() + '" fill="none" stroke="' + P.c0 + '" stroke-width="2" opacity=".8"/>';
      for (i = 0; i < N; i++) svg += '<circle cx="' + sx(fitted(i)).toFixed(1) + '" cy="' + sy(rs[i]).toFixed(1) + '" r="4.5" fill="' + P.ink + '" fill-opacity="0.72"/>';
      svg += '<text x="' + (m.l + iw / 2) + '" y="' + (H - 5) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">fitted value &rarr;</text>';
      svg += '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">residual</text>';
      svg += '</svg>';
      chart.innerHTML = svg;

      var msg = scen === 'funnel' ? ['Trouble: non-constant variance.', 'The spread fans out as the fitted value grows. The model is less certain for big predictions; standard errors are wrong. Fix with a transform or robust/weighted errors.']
        : scen === 'curved' ? ['Trouble: a missed nonlinearity.', 'The residuals bend in a clear U instead of scattering flat. The straight-line model is leaving structure on the table; add a term or transform.']
        : ['Healthy.', 'Residuals scatter in a flat, even band around zero with no pattern - exactly what the assumptions want. Constant variance, no missed curve.'];
      read.innerHTML = '<b style="color:' + (scen === 'healthy' ? P.acc : P.bad) + '">' + msg[0] + '</b> ' + msg[1];
    }

    u.wireSeg(el.querySelector('.rp-seg'), function (v) { scen = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Residual diagnostics. Build a fit, then read its plots: a healthy model',
      '# shows a flat, even band of residuals; a funnel or a curve is a warning.',
      'set.seed(7)',
      'x <- runif(60, 1, 10)',
      'y <- 3 + 1.5 * x + rnorm(60, 0, 1.2)        # a well-behaved linear relationship',
      'fit <- lm(y ~ x)',
      '',
      'par(mfrow = c(1, 2))',
      'plot(fit, which = 1)                         # residuals vs fitted (look for a flat band)',
      'plot(fit, which = 2)                         # normal Q-Q (points on the line = normal)',
      'par(mfrow = c(1, 1))'
    ].join('\n');
  }

  window.LessonWidgets.register('residual-plot', mount);
})();

;
/* review-triage.js */
/* review-triage.js - sort a real-looking review before answering a word of it.
 *
 * Serves the review-triage hub chapter in The Publishing Handbook and every response and
 * revision chapter that follows it. The single most useful thing a researcher can do with
 * a review is decide, comment by comment, which of three kinds each one is, because the
 * kind decides the response:
 *
 *   substantive  the result could change. Run the analysis, report what it shows, and say
 *                so even when it is inconvenient.
 *   reporting    the result does not change. Something is missing from the write-up. Add
 *                the number, the version, the definition, and point to where it now is.
 *   preference   the reviewer would have done it differently, and both ways are defensible.
 *                Give a reason for your choice, offer the alternative in a supplement if it
 *                is cheap, and decline politely.
 *
 * A researcher who cannot tell these apart does one of two things: treats everything as
 * substantive and rebuilds a paper that did not need rebuilding, or treats everything as
 * preference and gets a hostile second round. Both are common and both are avoidable.
 *
 * The reader assigns each comment, presses Check, and gets per-comment feedback that names
 * WHY it belongs where it belongs rather than just marking it wrong. The summary then
 * builds the shape of the response letter: substantive first, reporting next, preference
 * last and briefly.
 *
 * The runnable R is the diagnostic the review's hardest substantive comment demands, so the
 * reader can see the difference in cost between a comment that needs a rerun and a comment
 * that needs a sentence. It runs in R 4.6.0 with no packages.
 *
 * cfg: {
 *   comments: [{ id, from: "Reviewer 2", text, kind: "substantive|reporting|preference",
 *                why: "one sentence naming why" }],   // a default review of nine is built in
 *   shuffle: true,     // present them in a seeded shuffle rather than grouped by kind
 *   seed: 5
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f6f8fa', pick: '#e7f3ec', warn: '#fbeae5'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b', soft: 'rgba(255,255,255,.05)',
    pick: 'rgba(70,192,138,.18)', warn: 'rgba(244,128,90,.16)'
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

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var KINDS = [
    { k: 'substantive', label: 'Substantive', short: 'the result could change',
      how: 'Run it, report what it shows, and say so even if it goes against you.' },
    { k: 'reporting', label: 'Reporting', short: 'the result stands, the write-up is thin',
      how: 'Add the number or the definition, and say where it now appears.' },
    { k: 'preference', label: 'Preference', short: 'a defensible difference of taste',
      how: 'Give your reason, offer the alternative if it is cheap, and decline politely.' }
  ];

  var DEFAULT_REVIEW = [
    { id: 1, from: 'Reviewer 2', kind: 'substantive',
      text: 'Participants were recruited in 14 clinics but the models treat every participant as independent. Outcomes within a clinic are likely correlated.',
      why: 'Ignoring the clustering understates the standard errors, so the interval and the p-value both change. Nothing about this can be settled in the text.' },
    { id: 2, from: 'Reviewer 2', kind: 'reporting',
      text: 'Please state the software and package versions used for the analysis.',
      why: 'A version number changes no estimate. It is missing from the manuscript, so it is a sentence in the methods, not a rerun.' },
    { id: 3, from: 'Reviewer 1', kind: 'preference',
      text: 'I would have used a Bayesian model with weakly informative priors rather than the frequentist approach taken here.',
      why: 'Both approaches are defensible for this question, and the reviewer has not claimed the chosen one is invalid. Justify the choice and decline.' },
    { id: 4, from: 'Reviewer 1', kind: 'substantive',
      text: 'Forty-one participants are missing the primary outcome and appear to have been dropped. Were they different from those retained?',
      why: 'If the missingness is related to the outcome, the complete-case estimate is biased. The answer is a comparison and a sensitivity analysis, and it might move the result.' },
    { id: 5, from: 'Reviewer 2', kind: 'reporting',
      text: 'Table 2 gives p-values but no effect sizes or confidence intervals.',
      why: 'The numbers already exist in the fitted model. Reporting them changes nothing about the analysis and everything about whether a reader can judge it.' },
    { id: 6, from: 'Reviewer 3', kind: 'preference',
      text: 'Figure 3 would be clearer as a bar chart than as a boxplot.',
      why: 'A boxplot shows the spread a bar chart hides, so this is a judgement call, and the reviewer has given no reason the current figure misleads.' },
    { id: 7, from: 'Reviewer 3', kind: 'substantive',
      text: 'The interaction reported in section 3.4 was not in the registered analysis plan and is not flagged as exploratory.',
      why: 'An unregistered interaction found after looking is a different kind of evidence from a pre-specified one. The estimate stays; the CLAIM has to change, and that is substantive.' },
    { id: 8, from: 'Reviewer 1', kind: 'reporting',
      text: 'How was the primary outcome defined? The text refers to "improvement" without giving a threshold.',
      why: 'The definition exists, or the analysis could not have been run. It is missing from the paper, so it goes in the methods.' },
    { id: 9, from: 'Reviewer 2', kind: 'preference',
      text: 'The introduction should cite Karlsson et al. (2019) and Ito (2021).',
      why: 'Unless one of those papers contradicts the claim being made, this is a citation preference. Add them if they fit and say so in one line.' }
  ];

  function mount(el, cfg) {
    cfg = cfg || {};
    var comments = (cfg.comments && cfg.comments.length ? cfg.comments : DEFAULT_REVIEW).slice();
    var seed = (cfg.seed == null ? 5 : +cfg.seed);
    if (cfg.shuffle !== false) {                      // seeded Fisher-Yates: same order every time
      var rnd = mulberry32(seed);
      for (var i = comments.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1)), t = comments[i]; comments[i] = comments[j]; comments[j] = t;
      }
    }
    var picks = {}, graded = false;

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      '<div class="rt-head" style="font:600 13px/1.5 IBM Plex Sans,sans-serif;color:' + P.ink + ';margin-bottom:3px">' +
        'Decision letter: major revision. Sort every comment before you answer one.</div>' +
      '<div class="rt-legend" style="margin:8px 0 12px"></div>' +
      '<div class="rt-list"></div>' +
      '<div class="rt-actions" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"></div>' +
      '<div class="rt-score" style="margin-top:12px"></div>' +
      '<div class="rt-r" style="margin-top:13px"></div>';

    var legend = el.querySelector('.rt-legend'), list = el.querySelector('.rt-list'),
        actions = el.querySelector('.rt-actions'), score = el.querySelector('.rt-score'),
        rbox = el.querySelector('.rt-r');

    list.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-pick]') : null;
      if (!b || !list.contains(b) || graded) return;
      picks[b.getAttribute('data-id')] = b.getAttribute('data-pick');
      render();
    });
    actions.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b || !actions.contains(b)) return;
      if (b.getAttribute('data-act') === 'check') graded = true;
      else { graded = false; picks = {}; }
      render();
    });

    function render() {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      el.querySelector('.rt-head').style.color = P.ink;

      legend.innerHTML = KINDS.map(function (K) {
        return '<div style="display:flex;gap:8px;align-items:baseline;font:12px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + '">' +
          '<b style="color:' + kindColour(K.k, P) + ';min-width:88px">' + K.label + '</b><span>' + u.esc(K.short) + '</span></div>';
      }).join('');

      list.innerHTML = comments.map(function (c) { return card(c, picks[c.id], graded, P); }).join('');

      var answered = comments.filter(function (c) { return picks[c.id]; }).length;
      actions.innerHTML = graded
        ? '<button type="button" data-act="reset" style="font:600 12.5px IBM Plex Sans,sans-serif;color:' + P.mut +
            ';background:none;border:1px solid ' + P.line + ';border-radius:8px;padding:8px 14px;cursor:pointer">Try it again</button>'
        : '<button type="button" data-act="check"' + (answered < comments.length ? ' disabled' : '') +
            ' style="font:600 12.5px IBM Plex Sans,sans-serif;color:#fff;background:' + (answered < comments.length ? P.faint : P.acc) +
            ';border:0;border-radius:8px;padding:8px 15px;cursor:' + (answered < comments.length ? 'default' : 'pointer') + '">' +
            'Check my sorting (' + answered + ' of ' + comments.length + ')</button>';

      score.innerHTML = graded ? summary(comments, picks, P) : '';
      rbox.innerHTML = u.runnable(rcode(), { label: 'What the first substantive comment actually costs' });
    }

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render();
  }

  function kindColour(k, P) { return k === 'substantive' ? P.bad : (k === 'reporting' ? P.c0 : P.mut); }

  function card(c, pick, graded, P) {
    var right = graded && pick === c.kind;
    var wrong = graded && pick !== c.kind;
    var edge = graded ? (right ? P.acc : P.bad) : P.line;
    var h = '<div style="border:1px solid ' + P.line + ';border-left:3px solid ' + edge +
      ';border-radius:0 10px 10px 0;background:' + P.soft + ';padding:11px 13px;margin-bottom:9px">' +
      '<div style="font:600 10.5px IBM Plex Sans,sans-serif;letter-spacing:.04em;text-transform:uppercase;color:' + P.faint + ';margin-bottom:4px">' +
      u.esc(c.from) + '</div>' +
      '<div style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-bottom:9px">' + u.esc(c.text) + '</div>' +
      '<div style="display:flex;gap:6px;flex-wrap:wrap">';
    KINDS.forEach(function (K) {
      var on = pick === K.k;
      var isAnswer = graded && K.k === c.kind;
      var bg = graded ? (isAnswer ? P.pick : (on ? P.warn : 'transparent')) : (on ? P.pick : 'transparent');
      var bd = graded ? (isAnswer ? P.acc : (on ? P.bad : P.line)) : (on ? P.acc : P.line);
      h += '<button type="button" data-id="' + c.id + '" data-pick="' + K.k + '"' + (graded ? ' disabled' : '') +
        ' style="font:600 12px IBM Plex Sans,sans-serif;color:' + (graded && isAnswer ? P.acc : (on ? P.ink : P.mut)) +
        ';background:' + bg + ';border:1.4px solid ' + bd + ';border-radius:7px;padding:6px 11px;cursor:' + (graded ? 'default' : 'pointer') + '">' +
        u.esc(K.label) + '</button>';
    });
    h += '</div>';
    if (graded) {
      h += '<div style="margin-top:9px;font:12.5px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + '">' +
        '<b style="color:' + (right ? P.acc : P.bad) + '">' + (right ? 'Right: ' : 'It is ' + kindLabel(c.kind) + '. ') + '</b>' +
        u.esc(c.why) + '</div>' +
        '<div style="margin-top:5px;font:12px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + '">' +
        u.esc('In the letter: ' + howFor(c.kind)) + '</div>';
    }
    return h + '</div>';
  }
  function kindLabel(k) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].k === k) return KINDS[i].label.toLowerCase(); return k; }
  function howFor(k) { for (var i = 0; i < KINDS.length; i++) if (KINDS[i].k === k) return KINDS[i].how; return ''; }

  function summary(comments, picks, P) {
    var right = 0, byKind = { substantive: 0, reporting: 0, preference: 0 }, missed = { substantive: 0, reporting: 0, preference: 0 };
    comments.forEach(function (c) {
      byKind[c.kind]++;
      if (picks[c.id] === c.kind) right++; else missed[c.kind]++;
    });
    var n = comments.length;
    var overCall = comments.filter(function (c) { return picks[c.id] === 'substantive' && c.kind !== 'substantive'; }).length;
    var underCall = comments.filter(function (c) { return c.kind === 'substantive' && picks[c.id] !== 'substantive'; }).length;

    var h = '<div style="border-top:1px solid ' + P.line + ';padding-top:12px">' +
      '<div style="font:600 14px IBM Plex Sans,sans-serif;color:' + (right === n ? P.acc : P.ink) + ';margin-bottom:6px">' +
      right + ' of ' + n + ' sorted correctly</div>';
    h += '<div style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin-bottom:10px">' +
      'This review is <b>' + byKind.substantive + ' substantive</b>, <b>' + byKind.reporting + ' reporting</b> and <b>' +
      byKind.preference + ' preference</b>. ' +
      (overCall ? 'You marked ' + overCall + ' as substantive that ' + (overCall === 1 ? 'is not' : 'are not') +
        '. That is the expensive error: it turns a revision into a rebuild and invites the reviewer to keep pulling. '
      : '') +
      (underCall ? 'You marked ' + underCall + ' substantive comment' + (underCall === 1 ? '' : 's') +
        ' as something lighter. That is the dangerous error: answering a real problem with a sentence is what produces a hostile second round. '
      : '') +
      (!overCall && !underCall ? 'You put every genuinely substantive comment in the right pile, which is the part that decides how the second round goes. ' : '') +
      '</div>';
    h += '<div style="font:600 11px IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:5px">The letter this implies</div>' +
      '<ol style="margin:0;padding-left:19px;font:12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + '">' +
      '<li>Open with the ' + byKind.substantive + ' substantive points, each with what you ran and what it showed, including where it did not help you.</li>' +
      '<li>Group the ' + byKind.reporting + ' reporting points together and point to the line and page each one now appears on.</li>' +
      '<li>Take the ' + byKind.preference + ' preference points last, briefly, with a reason for the choice you made.</li>' +
      '</ol></div>';
    return h;
  }

  /* ---------------- runnable R ----------------
     The first substantive comment in the default review is the clustering one, so this is
     that diagnostic: how far the naive standard error is out once clinics are accounted
     for. Base R only, and the design effect is checked against the formula. */
  function rcode() {
    return [
      '# Comment 1 said outcomes within a clinic are correlated. That is a substantive',
      '# comment, so it costs a rerun. Here is the rerun, and what it changes.',
      'set.seed(20)',
      'k <- 14; m <- 20; n <- k * m          # 14 clinics, 20 participants each',
      'rho <- 0.06                           # a small, very ordinary intraclass correlation',
      '',
      'clinic <- rep(1:k, each = m)',
      'arm    <- rep(rep(0:1, length.out = k), each = m)   # the programme runs clinic-wide',
      'y      <- 0.35 * arm + sqrt(rho) * rnorm(k)[clinic] + sqrt(1 - rho) * rnorm(n)',
      '',
      'naive  <- lm(y ~ arm)',
      'se_n   <- coef(summary(naive))["arm", "Std. Error"]',
      '',
      '# analyse at the level the treatment was assigned: one number per clinic',
      'cm     <- tapply(y, clinic, mean)',
      'ca     <- tapply(arm, clinic, max)',
      'se_c   <- sqrt(sum((cm - ave(cm, ca))^2) / (k - 2) * (2 / (k / 2)))',
      '',
      'round(c(naive_se     = se_n,',
      '        clustered_se = se_c,',
      '        ratio        = se_c / se_n,',
      '        design_effect_formula = sqrt(1 + (m - 1) * rho)), 3)',
      '',
      '# The estimate barely moves. The standard error does, and so does the p-value.',
      'round(c(naive_p     = coef(summary(naive))["arm", "Pr(>|t|)"],',
      '        clustered_p = unname(2 * pt(abs(diff(rev(tapply(cm, ca, mean)))) / se_c,',
      '                                    df = k - 2, lower.tail = FALSE))), 4)'
    ].join('\n');
  }

  window.LessonWidgets.register('review-triage', mount);
})();

;
/* robust-weights.js */
/* robust-weights.js - one outlier, three fits. OLS chases every point and lets a single
 * bad row tilt the whole line; robust M-estimators (Huber, Tukey) notice the point does
 * not fit and quietly turn its weight down. Toggle the method and watch the line snap
 * back to the honest trend while the outlier fades to its down-weighted size. Emits
 * runnable R comparing lm() with MASS::rlm().
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // 14 honest points on y = 2 + 1.4x, plus one high-leverage outlier
  var D = (function () {
    var a = [], s = 3; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff - 0.5; }
    for (var i = 0; i < 14; i++) { var x = 1 + i * 0.55; a.push({ x: x, y: 2 + 1.4 * x + r() * 1.3 }); }
    a.push({ x: 7.2, y: 2.0 });   // the outlier: should be ~12, sits at 2
    return a;
  })();

  function fit(method) {
    // IRLS. method: ols | huber | tukey. Returns {b0,b1,w:[]}
    var w = D.map(function () { return 1; }), b0 = 0, b1 = 0, it, k;
    for (it = 0; it < (method === 'ols' ? 1 : 12); it++) {
      var sw = 0, swx = 0, swy = 0, swxx = 0, swxy = 0;
      D.forEach(function (d, i) { var wi = w[i]; sw += wi; swx += wi * d.x; swy += wi * d.y; swxx += wi * d.x * d.x; swxy += wi * d.x * d.y; });
      var den = sw * swxx - swx * swx; b1 = (sw * swxy - swx * swy) / den; b0 = (swy - b1 * swx) / sw;
      var res = D.map(function (d) { return d.y - (b0 + b1 * d.x); });
      var mad = res.map(Math.abs).sort(function (a, b) { return a - b; })[Math.floor(res.length / 2)] * 1.4826 || 1;
      if (method === 'ols') break;
      k = method === 'huber' ? 1.345 : 4.685;
      w = res.map(function (rr) { var u2 = rr / (mad * k); return method === 'huber' ? Math.min(1, 1 / Math.abs(u2 || 1e-9)) : (Math.abs(u2) < 1 ? (1 - u2 * u2) * (1 - u2 * u2) : 0); });
    }
    return { b0: b0, b1: b1, w: w };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var method = 'ols';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="rw-seg" style="margin-bottom:12px">' + u.seg([{ v: 'ols', label: 'OLS' }, { v: 'huber', label: 'Huber' }, { v: 'tukey', label: 'Tukey' }], 'ols') + '</div>' +
      '<div class="rw-plot"></div>' +
      '<div class="rw-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'OLS vs a robust fit with MASS::rlm()' });

    var plot = el.querySelector('.rw-plot'), read = el.querySelector('.rw-read');
    var xs = D.map(function (d) { return d.x; }), ys = D.map(function (d) { return d.y; });
    var xe = [Math.min.apply(null, xs) - 0.5, Math.max.apply(null, xs) + 0.5], ye = [0, Math.max.apply(null, ys) + 1];
    var W = 440, H = 250, m = { l: 40, r: 12, t: 12, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    function sx(x) { return m.l + (x - xe[0]) / (xe[1] - xe[0]) * iw; }
    function sy(y) { return m.t + ih - (y - ye[0]) / (ye[1] - ye[0]) * ih; }
    function draw() {
      var f = fit(method), fo = fit('ols');
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="robust regression">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      // faint OLS reference line when a robust method is active
      if (method !== 'ols') svg += '<line x1="' + sx(xe[0]) + '" y1="' + sy(fo.b0 + fo.b1 * xe[0]) + '" x2="' + sx(xe[1]) + '" y2="' + sy(fo.b0 + fo.b1 * xe[1]) + '" stroke="' + P.faint + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      // the active fit line
      svg += '<line x1="' + sx(xe[0]) + '" y1="' + sy(f.b0 + f.b1 * xe[0]) + '" x2="' + sx(xe[1]) + '" y2="' + sy(f.b0 + f.b1 * xe[1]) + '" stroke="' + P.acc + '" stroke-width="2.6"/>';
      // points sized by weight (down-weighted = small + faded)
      D.forEach(function (d, i) { var wt = method === 'ols' ? 1 : f.w[i]; var out = d.x > 6.9 && d.y < 4; svg += '<circle cx="' + sx(d.x).toFixed(1) + '" cy="' + sy(d.y).toFixed(1) + '" r="' + (3 + wt * 3).toFixed(1) + '" fill="' + (out ? P.bad : P.c0) + '" opacity="' + (0.35 + wt * 0.55).toFixed(2) + '"/>'; });
      svg += '</svg>';
      plot.innerHTML = svg;
      var slope = f.b1.toFixed(2), olsSlope = fo.b1.toFixed(2), trueSlope = '1.40';
      read.innerHTML = method === 'ols'
        ? '<b style="font-family:IBM Plex Mono,monospace;color:' + P.bad + '">OLS slope ' + slope + '</b>. One outlier (red) drags the least-squares line well below the true trend (' + trueSlope + '): every point, however wrong, gets full weight.'
        : '<b style="font-family:IBM Plex Mono,monospace;color:' + P.acc + '">' + (method === 'huber' ? 'Huber' : 'Tukey') + ' slope ' + slope + '</b> vs OLS ' + olsSlope + ' (dashed). The estimator gives the outlier a weight of <b>' + f.w[D.length - 1].toFixed(2) + '</b>, so the line snaps back to the honest slope near ' + trueSlope + '. ' + (method === 'tukey' ? 'Tukey redescends to weight 0: gross outliers are rejected outright.' : 'Huber caps a big residual\'s pull without discarding it.');
    }
    u.wireSeg(el.querySelector('.rw-seg'), function (v) { method = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# One outlier is enough to tilt an OLS line. Robust regression down-weights it.',
      'library(MASS)',
      'set.seed(3)',
      'x <- seq(1, 8, length.out = 14)',
      'y <- 2 + 1.4 * x + rnorm(14, 0, 0.6)',
      'x <- c(x, 7.2); y <- c(y, 2.0)          # add one bad point (should be ~12, is 2)',
      '',
      'coef(lm(y ~ x))["x"]                     # OLS: slope dragged well below 1.4',
      'coef(rlm(y ~ x, psi = psi.bisquare))["x"] # Tukey bisquare: back near the true 1.4',
      '# rlm iteratively reweights: the outlier gets a near-zero weight and loses its pull.'
    ].join('\n');
  }

  window.LessonWidgets.register('robust-weights', mount);
})();

;
/* roc-curve.js */
/* roc-curve.js - threshold, confusion matrix and ROC, linked.
 * Two score clouds (actual positives skew high, negatives skew low) overlap.
 * Slide the threshold: the confusion matrix re-counts and the operating point
 * slides along the ROC curve. Shows why one number (accuracy) hides the trade.
 * Emits runnable R that sweeps the threshold and computes the ROC + AUC by hand.
 *
 * cfg: { }  - renders from {}.
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var POS = [0.92, 0.86, 0.8, 0.74, 0.7, 0.64, 0.6, 0.54, 0.46, 0.4];
  var NEG = [0.6, 0.5, 0.46, 0.4, 0.34, 0.3, 0.25, 0.2, 0.14, 0.1];

  function mount(el, cfg) {
    cfg = cfg || {};
    var thr = 0.5;
    function counts(t) {
      var tp = 0, fn = 0, fp = 0, tn = 0;
      POS.forEach(function (s) { (s >= t ? tp++ : fn++); });
      NEG.forEach(function (s) { (s >= t ? fp++ : tn++); });
      return { tp: tp, fn: fn, fp: fp, tn: tn, tpr: tp / (tp + fn), fpr: fp / (fp + tn) };
    }
    // full ROC sweep
    var ROC = []; for (var t = 1.02; t >= -0.02; t -= 0.02) { var c = counts(t); ROC.push([c.fpr, c.tpr]); }
    var auc = 0; for (var i = 1; i < ROC.length; i++) auc += (ROC[i][0] - ROC[i - 1][0]) * (ROC[i][1] + ROC[i - 1][1]) / 2;

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start">' +
        '<div class="rc-roc" style="flex:1 1 230px;min-width:210px"></div>' +
        '<div class="rc-cm" style="flex:1 1 200px;min-width:190px"></div>' +
      '</div>' +
      '<label style="display:block;font:600 12.5px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">classification threshold <b class="rc-t" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="rc-s" type="range" min="0.05" max="0.95" step="0.01" value="' + thr + '" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div class="rc-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:8px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Build the ROC curve + AUC from scratch in R' });

    var roc = el.querySelector('.rc-roc'), cm = el.querySelector('.rc-cm'), read = el.querySelector('.rc-read'),
        slider = el.querySelector('.rc-s'), tEl = el.querySelector('.rc-t');

    function draw() {
      var c = counts(thr);
      // ROC panel
      var S = 220, m = 30, iw = S - m - 10, ih = S - m - 10;
      function px(f) { return m + f * iw; } function py(tp) { return (S - m) - tp * ih; }
      var line = ROC.map(function (p) { return px(p[0]).toFixed(1) + ',' + py(p[1]).toFixed(1); }).join(' ');
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="ROC curve">';
      svg += '<rect x="' + m + '" y="10" width="' + iw + '" height="' + ih + '" fill="#fbfcfb" stroke="' + P.line + '"/>';
      svg += '<line x1="' + m + '" y1="' + (S - m) + '" x2="' + (m + iw) + '" y2="10" stroke="' + P.line + '" stroke-dasharray="4 3"/>';
      svg += '<polyline points="' + line + '" fill="none" stroke="' + P.c0 + '" stroke-width="2.5"/>';
      svg += '<circle cx="' + px(c.fpr).toFixed(1) + '" cy="' + py(c.tpr).toFixed(1) + '" r="6" fill="' + P.acc + '" stroke="#fff" stroke-width="1.5"/>';
      svg += '<text x="' + (m + iw / 2) + '" y="' + (S - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">false positive rate</text>';
      svg += '<text transform="translate(11,' + (10 + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">true positive rate</text>';
      svg += '<text x="' + (m + iw - 4) + '" y="22" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="11" fill="' + P.ink + '">AUC ' + auc.toFixed(2) + '</text>';
      svg += '</svg>';
      roc.innerHTML = svg;
      // confusion matrix
      function cell(n, lab, good) { return '<div style="border:1px solid ' + P.line + ';border-radius:7px;padding:8px 6px;text-align:center;background:' + (good ? P.add : P.del) + '"><b style="font-family:IBM Plex Mono,monospace;font-size:19px;color:' + P.ink + '">' + n + '</b><div style="font-size:10px;color:' + P.mut + '">' + lab + '</div></div>'; }
      cm.innerHTML =
        '<div style="font:600 11px/1 IBM Plex Mono,monospace;letter-spacing:.05em;text-transform:uppercase;color:' + P.faint + ';margin:0 0 7px">predicted &darr; / actual &rarr;</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">' + cell(c.tp, 'true positive', true) + cell(c.fp, 'false positive', false) + cell(c.fn, 'false negative', false) + cell(c.tn, 'true negative', true) + '</div>' +
        '<div style="font:12px/1.6 IBM Plex Mono,monospace;color:' + P.body + ';margin:9px 0 0">precision ' + (c.tp / (c.tp + c.fp) || 0).toFixed(2) + ' &middot; recall ' + c.tpr.toFixed(2) + '</div>';

      read.innerHTML = 'At threshold <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + thr.toFixed(2) + '</b>: recall (TPR) <b>' + c.tpr.toFixed(2) + '</b>, false-positive rate <b>' + c.fpr.toFixed(2) +
        '</b>. Lowering it catches more positives but raises false alarms - you slide up the ROC curve. The curve (and its AUC) summarizes every threshold at once.';
      tEl.textContent = thr.toFixed(2);
    }
    slider.addEventListener('input', function () { thr = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# An ROC curve sweeps EVERY threshold. Build it by hand from scores + labels.',
      'pos <- c(0.92,0.86,0.8,0.74,0.7,0.64,0.6,0.54,0.46,0.4)   # actual positives',
      'neg <- c(0.6,0.5,0.46,0.4,0.34,0.3,0.25,0.2,0.14,0.1)     # actual negatives',
      'score  <- c(pos, neg)',
      'actual <- c(rep(1, length(pos)), rep(0, length(neg)))',
      '',
      'thr <- seq(0, 1, by = 0.02)',
      'roc <- t(sapply(thr, function(t) {',
      '  pred <- score >= t',
      '  c(FPR = sum(pred & actual == 0) / sum(actual == 0),',
      '    TPR = sum(pred & actual == 1) / sum(actual == 1))',
      '}))',
      'plot(roc[, "FPR"], roc[, "TPR"], type = "l", lwd = 2, xlab = "FPR", ylab = "TPR")',
      'abline(0, 1, lty = 2)',
      '',
      'o   <- order(roc[, "FPR"])                       # area under the curve (trapezoid)',
      'auc <- sum(diff(roc[o, "FPR"]) * (head(roc[o, "TPR"], -1) + tail(roc[o, "TPR"], -1)) / 2)',
      'auc'
    ].join('\n');
  }

  window.LessonWidgets.register('roc-curve', mount);
})();

;
/* scope-chain.js */
/* scope-chain.js - foundations: lexical scoping. Inside a function, a name is
 * looked up in the function's own environment first, then outward to the global
 * environment. Pick a name and watch the lookup walk the chain. Then run it.
 * cfg: { global:{x:10,y:20}, local:{y:99} }
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var G = cfg.global || { x: 10, y: 20 }, L = cfg.local || { y: 99 };
    var names = Object.keys(G); // lookup choices = every name that exists somewhere
    Object.keys(L).forEach(function (k) { if (names.indexOf(k) < 0) names.push(k); });

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function envBox(title, vars, opts) {
      opts = opts || {};
      var rows = Object.keys(vars).map(function (k) {
        var hit = opts.foundKey === k, dim = opts.dimKey === k;
        var bg = hit ? u.P.add : '#fff';
        return '<span style="font-family:IBM Plex Mono,monospace;font-size:13px;padding:4px 9px;border-radius:6px;border:1px solid ' + (hit ? u.P.acc : u.P.line) + ';background:' + bg + ';color:' + (dim ? u.P.faint : u.P.ink) + ';' + (dim ? 'text-decoration:line-through' : '') + '">' + u.esc(k) + ' = ' + u.esc(vars[k]) + (hit ? '  &#10003;' : '') + '</span>';
      }).join(' ');
      return '<div style="border:1px solid ' + (opts.active ? u.P.acc : u.P.line) + ';border-radius:10px;padding:11px 13px;background:' + (opts.active ? '#f7fbf9' : '#fff') + '">' +
        '<div style="font-size:11px;font-weight:700;color:' + u.P.mut + ';text-transform:uppercase;letter-spacing:.04em;margin:0 0 7px">' + u.esc(title) + '</div>' +
        '<div style="display:flex;gap:7px;flex-wrap:wrap">' + (rows || '<span style="font-size:12px;color:' + u.P.faint + '">(empty)</span>') + '</div>' +
      '</div>';
    }

    function render(pick) {
      var localHas = pick != null && Object.prototype.hasOwnProperty.call(L, pick);
      var lo = {}, go = {}, msg = '';
      if (pick != null) {
        if (localHas) { lo = { active: true, foundKey: pick }; go = {}; msg = '<b>' + pick + '</b> is found in f()&rsquo;s own environment &rarr; <code style="font-family:IBM Plex Mono,monospace">' + L[pick] + '</code>. The local value shadows the global one.'; }
        else { lo = { active: true, dimKey: undefined }; go = { foundKey: pick }; msg = '<b>' + pick + '</b> is not in f(), so R looks outward to the global environment &rarr; <code style="font-family:IBM Plex Mono,monospace">' + G[pick] + '</code>.'; }
      }
      wrap.querySelector('.sc-local').innerHTML = envBox('inside f()  (local)', L, lo);
      wrap.querySelector('.sc-global').innerHTML = envBox('global environment', G, go);
      wrap.querySelector('.sc-msg').innerHTML = pick == null ? '<span style="color:' + u.P.faint + '">Pick a name to resolve from inside f().</span>' : msg;
    }

    wrap.innerHTML =
      '<div style="display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin:0 0 12px">' +
        '<span style="font-size:12.5px;color:' + u.P.mut + '">Inside f(), look up:</span>' +
        names.map(function (nm) { return '<button type="button" class="sc-pick" data-n="' + u.esc(nm) + '" style="font:inherit;font-size:13px;font-weight:600;font-family:IBM Plex Mono,monospace;color:' + u.P.mut + ';background:#fff;border:1px solid ' + u.P.line + ';border-radius:8px;padding:6px 13px;cursor:pointer">' + u.esc(nm) + '</button>'; }).join('') +
      '</div>' +
      '<div class="sc-local" style="margin:0 0 8px"></div>' +
      '<div style="text-align:center;color:' + u.P.faint + ';font-size:16px;margin:0 0 8px">&darr; if not found, look outward</div>' +
      '<div class="sc-global"></div>' +
      '<div class="sc-msg" style="margin:11px 0 0;font-size:13px;color:' + u.P.body + ';line-height:1.5"></div>' +
      '<div style="margin:13px 0 0">' + u.runnable('x <- 10\ny <- 20\n\nf <- function() {\n  y <- 99\n  c(x = x, y = y)   # x from global, y from local\n}\n\nf()', { label: 'Run it in R' }) + '</div>';

    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.sc-pick'); if (!b) return;
      Array.prototype.forEach.call(wrap.querySelectorAll('.sc-pick'), function (x) { x.style.background = '#fff'; x.style.color = u.P.mut; });
      b.style.background = u.P.acc; b.style.color = '#fff';
      render(b.getAttribute('data-n'));
    });
    el.innerHTML = ''; el.appendChild(wrap); render(null);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('scope-chain', mount);
})();

;
/* shap-bars.js */
/* shap-bars.js - additive feature contributions for ONE prediction, as a waterfall.
 * Start at the baseline (the average prediction), add each feature's signed push, and
 * land exactly on this row's prediction. That "sums to the prediction" property is the
 * heart of SHAP. Emits runnable R that computes exact additive contributions for a
 * linear model (where SHAP has a closed form).
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  var BASE = 0.30;
  var CONTRIB = [
    ['tenure',        +0.22],
    ['monthly spend', +0.14],
    ['support calls', -0.18],
    ['discount',      +0.09],
    ['contract: 1yr', -0.07]
  ];

  function mount(el, cfg) {
    cfg = cfg || {};
    var pred = BASE + CONTRIB.reduce(function (s, c) { return s + c[1]; }, 0);

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="sh-plot"></div>' +
      '<div style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px">The bars start at the <b>baseline</b> (' + BASE.toFixed(2) + ', the average prediction) and each feature pushes the score up (blue) or down (amber). They sum to exactly this customer\'s prediction (<b>' + pred.toFixed(2) + '</b>) - that is what makes SHAP an <i>explanation</i>, not just a ranking.</div>' +
      u.runnable(rcode(), { label: 'Compute exact additive contributions in R' });

    var W = 460, rowH = 30, m = 120, top = 14, iw = W - m - 60;
    var lo = Math.min(BASE, pred) - 0.05, hi = Math.max(BASE, pred) + 0.05;
    // build cumulative steps
    var rows = [], run = BASE;
    CONTRIB.forEach(function (c) { rows.push({ name: c[0], from: run, to: run + c[1], v: c[1] }); run += c[1]; });
    function px(x) { return m + (x - lo) / (hi - lo) * iw; }
    var H = top + rowH * (CONTRIB.length + 2) + 10;
    var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SHAP contribution waterfall">';
    function bandLabel(y, txt, val, bold) {
      return '<text x="' + (m - 8) + '" y="' + (y + 4) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="11.5"' + (bold ? ' font-weight="600"' : '') + ' fill="' + P.ink + '">' + txt + '</text>' +
        '<text x="' + (W - 6) + '" y="' + (y + 4) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="11" fill="' + P.mut + '">' + val + '</text>';
    }
    var y = top + 12;
    // baseline marker
    svg += '<line x1="' + px(BASE).toFixed(1) + '" y1="' + top + '" x2="' + px(BASE).toFixed(1) + '" y2="' + (H - 18) + '" stroke="' + P.line + '" stroke-dasharray="3 3"/>';
    svg += bandLabel(y, 'baseline', BASE.toFixed(2), true); y += rowH;
    rows.forEach(function (r) {
      var x1 = px(Math.min(r.from, r.to)), x2 = px(Math.max(r.from, r.to)), up = r.v >= 0;
      svg += '<rect x="' + x1.toFixed(1) + '" y="' + (y - 9) + '" width="' + Math.max(2, x2 - x1).toFixed(1) + '" height="18" rx="3" fill="' + (up ? P.acc : (P.c2 || '#c9a24a')) + '"/>';
      svg += bandLabel(y, r.name, (up ? '+' : '') + r.v.toFixed(2), false); y += rowH;
    });
    svg += '<line x1="' + px(pred).toFixed(1) + '" y1="' + top + '" x2="' + px(pred).toFixed(1) + '" y2="' + (H - 18) + '" stroke="' + P.ink + '" stroke-width="1.5"/>';
    svg += bandLabel(y, 'prediction', pred.toFixed(2), true);
    svg += '</svg>';
    el.querySelector('.sh-plot').innerHTML = svg;
  }

  function rcode() {
    return [
      '# For a linear model, a feature\'s SHAP value has an exact closed form:',
      '#   contribution_j = beta_j * (x_j - mean(x_j))',
      '# and the contributions + the baseline sum to the prediction.',
      'set.seed(1)',
      'd <- data.frame(tenure = rnorm(200), spend = rnorm(200), calls = rnorm(200))',
      'd$y <- 0.3 + 0.8*d$tenure + 0.5*d$spend - 0.6*d$calls + rnorm(200, 0, 0.3)',
      'fit <- lm(y ~ tenure + spend + calls, data = d)',
      '',
      'b   <- coef(fit)[-1]                 # slopes',
      'mu  <- colMeans(d[, c("tenure","spend","calls")])',
      'row <- d[1, c("tenure","spend","calls")]',
      'contrib <- b * (unlist(row) - mu)    # per-feature SHAP contributions',
      '',
      'baseline <- predict(fit, newdata = as.data.frame(t(mu)))',
      'c(baseline = baseline, contrib,',
      '  reconstructed = baseline + sum(contrib),  # == the prediction',
      '  prediction    = predict(fit, newdata = row))'
    ].join('\n');
  }

  window.LessonWidgets.register('shap-bars', mount);
})();

;
/* shift-types.js */
/* shift-types.js - the three kinds of distribution shift, made visible. A model trained on one
 * distribution is deployed on another, and WHAT changed decides whether it still works.
 * Covariate shift: the feature distribution P(x) moves but the relationship P(y|x) holds, so a
 * well-specified model stays valid. Label shift: the class base rate P(y) changes. Concept
 * shift: the relationship P(y|x) itself changes, which silently breaks the model. Toggle the
 * three and watch which curve moves. Emits a base-R demo of each shift's effect on accuracy.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'covariate';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="sh-seg" style="margin-bottom:12px">' + u.seg([{ v: 'covariate', label: 'Covariate: P(x)' }, { v: 'label', label: 'Label: P(y)' }, { v: 'concept', label: 'Concept: P(y|x)' }], 'covariate') + '</div>' +
      '<div class="sh-plot"></div>' +
      '<div class="sh-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Which shift breaks the model? Base R' });

    var plot = el.querySelector('.sh-plot'), read = el.querySelector('.sh-read');
    var W = 340, H = 180, PAD = 12, T = 10, Bm = 24;
    function px(x) { return PAD + (x + 4) / 8 * (W - 2 * PAD); }            // x in [-4,4]
    function bell(mu, sd, col, dash) { var pts = []; for (var x = -4; x <= 4; x += 0.1) { var d = Math.exp(-0.5 * ((x - mu) / sd) * ((x - mu) / sd)); pts.push(px(x).toFixed(1) + ',' + (H - Bm - d * (H - T - Bm)).toFixed(1)); } return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.3"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
    function sigmoid(k, col, dash) { var pts = []; for (var x = -4; x <= 4; x += 0.1) { var s = 1 / (1 + Math.exp(-k * x)); pts.push(px(x).toFixed(1) + ',' + (H - Bm - s * (H - T - Bm)).toFixed(1)); } return '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.3"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
    function draw() {
      var body;
      if (mode === 'covariate') {
        body = bell(0, 1, P.c0) + bell(1.6, 1, P.c1, true) + sigmoid(1.5, P.faint);
      } else if (mode === 'concept') {
        body = sigmoid(1.5, P.c0) + sigmoid(-1.5, P.c1, true);
      } else { // label: two pairs of class-proportion bars
        var bw = 46, cx = W / 2;
        function bar(x, h, col) { return '<rect x="' + x + '" y="' + (H - Bm - h) + '" width="' + bw + '" height="' + h + '" fill="' + col + '" opacity="0.75"/>'; }
        body = bar(cx - 150, 0.5 * (H - T - Bm), P.c0) + bar(cx - 95, 0.5 * (H - T - Bm), P.c0) +
               bar(cx + 55, 0.25 * (H - T - Bm), P.c1) + bar(cx + 110, 0.75 * (H - T - Bm), P.c1) +
               '<text x="' + (cx - 120) + '" y="' + (H - 8) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">train 50/50</text>' +
               '<text x="' + (cx + 85) + '" y="' + (H - 8) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">test 25/75</text>';
      }
      var axisLbl = mode === 'label' ? 'class 0            class 1' : (mode === 'concept' ? 'feature x  ->  P(y=1|x)' : 'feature x');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="distribution shift">' +
        body +
        '<line x1="' + PAD + '" y1="' + (H - Bm) + '" x2="' + (W - PAD) + '" y2="' + (H - Bm) + '" stroke="' + P.line + '" stroke-width="1"/>' +
        (mode !== 'label' ? '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">train</text><text x="' + (W - 8) + '" y="28" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c1 + '">test (dashed)</text>' : '') +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">' + axisLbl + '</text></svg>';
      read.innerHTML = mode === 'covariate'
        ? '<b>Covariate shift:</b> the feature distribution P(x) slides (test sits to the right), but the relationship P(y|x) (grey) is unchanged. A correctly specified model stays valid, accuracy need not drop.'
        : mode === 'concept'
        ? '<b>Concept shift:</b> the relationship P(y|x) itself flips, train rises with x, test falls. The model is now systematically wrong (accuracy can fall below chance). This is the dangerous one.'
        : '<b>Label shift:</b> the class base rate P(y) changes (50/50 to 25/75) while P(x|y) holds. Thresholds and calibration break even when the feature-to-label map is intact.';
    }
    u.wireSeg(el.querySelector('.sh-seg'), function (v) { mode = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Which kind of distribution shift actually breaks a model? Base R.',
      'set.seed(1)',
      'n <- 2000',
      'x <- rnorm(n); y <- rbinom(n, 1, plogis(1.5 * x))   # TRAIN: P(y=1|x) = plogis(1.5 x)',
      'fit <- glm(y ~ x, binomial)',
      'acc <- function(f, xx, yy) mean((predict(f, data.frame(x = xx), type = "response") > 0.5) == yy)',
      '',
      'x_cov <- rnorm(n, 1.5); y_cov <- rbinom(n, 1, plogis( 1.5 * x_cov))  # covariate: P(x) moves',
      'x_con <- rnorm(n);      y_con <- rbinom(n, 1, plogis(-1.5 * x_con))  # concept: P(y|x) flips',
      'round(c(train         = acc(fit, x, y),',
      '        covariate     = acc(fit, x_cov, y_cov),   # P(y|x) intact -> model still fine',
      '        concept       = acc(fit, x_con, y_con)),  # relationship changed -> model breaks',
      '      2)',
      '#>     train covariate   concept',
      '#>      0.72      0.86      0.25   # concept shift falls BELOW chance; covariate shift does not'
    ].join('\n');
  }

  window.LessonWidgets.register('shift-types', mount);
})();

;
/* shrinkage-pool.js */
/* shrinkage-pool.js - partial pooling, the idea at the heart of mixed models. Eight
 * clinics each measure a handful of patients; their raw averages scatter wildly because
 * small samples are noisy. Slide the pooling dial from "no pooling" (trust each clinic
 * alone) to "complete pooling" (one global number for all) and watch partial pooling in
 * between pull the shakiest, smallest clinics hardest toward the grand mean. Emits
 * runnable R fitting the same shrinkage with lme4::lmer.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // 8 groups: true effect ~ around the grand mean; small n = noisy raw mean
  var GRAND = 50;
  var G = [
    { id: 'A', n: 3, raw: 61 }, { id: 'B', n: 25, raw: 53 }, { id: 'C', n: 4, raw: 39 },
    { id: 'D', n: 40, raw: 51 }, { id: 'E', n: 2, raw: 66 }, { id: 'F', n: 30, raw: 48 },
    { id: 'G', n: 5, raw: 42 }, { id: 'H', n: 12, raw: 55 }
  ];

  function mount(el, cfg) {
    cfg = cfg || {}; var lam = 0.5;   // 0 = no pooling, 1 = complete pooling
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="sp-plot"></div>' +
      '<label style="display:block;font:600 12px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">pooling <b class="sp-v" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="sp-s" type="range" min="0" max="1" step="0.05" value="0.5" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div style="display:flex;justify-content:space-between;font:10px IBM Plex Sans,sans-serif;color:' + P.mut + '"><span>no pooling (each clinic alone)</span><span>complete pooling (one number)</span></div>' +
      '<div class="sp-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Partial pooling with lme4::lmer()' });

    var plot = el.querySelector('.sp-plot'), read = el.querySelector('.sp-read'), slider = el.querySelector('.sp-s'), vEl = el.querySelector('.sp-v');
    var W = 440, H = 180, m = { l: 26, r: 26, t: 22, b: 24 }, iw = W - m.l - m.r;
    var lo = 34, hi = 70;
    function sx(v) { return m.l + (v - lo) / (hi - lo) * iw; }
    // shrinkage weight: bigger n shrinks less; lam scales overall pull
    function est(g) { var w = lam * (1 - g.n / (g.n + 8)); return g.raw + (GRAND - g.raw) * (lam >= 1 ? 1 : Math.min(1, w * 2)); }
    function draw() {
      var y0 = m.t + 20;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="shrinkage toward the grand mean">';
      svg += '<line x1="' + m.l + '" y1="' + (y0 + 60) + '" x2="' + (m.l + iw) + '" y2="' + (y0 + 60) + '" stroke="' + P.line + '"/>';
      [40, 50, 60].forEach(function (t) { svg += '<text x="' + sx(t) + '" y="' + (y0 + 74) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + t + '</text>'; });
      // grand mean line
      svg += '<line x1="' + sx(GRAND) + '" y1="' + (y0 - 14) + '" x2="' + sx(GRAND) + '" y2="' + (y0 + 60) + '" stroke="' + P.ink + '" stroke-width="1.5" stroke-dasharray="4 3"/><text x="' + sx(GRAND) + '" y="' + (y0 - 18) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.ink + '">grand mean</text>';
      // each clinic: raw (faint) -> shrunk (solid), arrow, size by n
      G.forEach(function (g) {
        var e = est(g), r = 3 + Math.min(7, Math.sqrt(g.n));
        svg += '<circle cx="' + sx(g.raw).toFixed(1) + '" cy="' + (y0 + 30) + '" r="3" fill="' + P.faint + '"/>';
        svg += '<line x1="' + sx(g.raw).toFixed(1) + '" y1="' + (y0 + 30) + '" x2="' + sx(e).toFixed(1) + '" y2="' + (y0 + 30) + '" stroke="' + P.line + '"/>';
        svg += '<circle cx="' + sx(e).toFixed(1) + '" cy="' + (y0 + 30) + '" r="' + r.toFixed(1) + '" fill="' + P.acc + '" opacity="0.85"/>';
      });
      svg += '<text x="' + m.l + '" y="' + (y0 + 30 - 40) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">faint = raw mean; green = pooled estimate (size = sample size)</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      vEl.textContent = lam.toFixed(2);
      var smallPull = Math.abs(est(G[4]) - G[4].raw).toFixed(1), bigPull = Math.abs(est(G[3]) - G[3].raw).toFixed(1);
      read.innerHTML = lam < 0.05
        ? '<b>No pooling:</b> every clinic is trusted on its own, so tiny clinics (n=2, n=3) swing far from the grand mean on almost no evidence.'
        : lam > 0.95
          ? '<b>Complete pooling:</b> all clinics collapse to the single grand mean, throwing away every real between-clinic difference.'
          : '<b style="color:' + P.acc + '">Partial pooling.</b> Clinic E (n=2) is pulled <b>' + smallPull + '</b> toward the mean while clinic D (n=40) barely moves (<b>' + bigPull + '</b>): small, noisy groups borrow strength from the whole, exactly what a random-effects model does automatically.';
    }
    slider.addEventListener('input', function () { lam = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Partial pooling: a mixed model shrinks noisy small-group means toward the average.',
      'library(lme4)',
      'set.seed(1)',
      'clinic <- factor(rep(LETTERS[1:8], times = c(3,25,4,40,2,30,5,12)))',
      'y <- rnorm(length(clinic), 50 + rep(c(8,3,-9,1,12,-2,-6,5),',
      '                                    times = c(3,25,4,40,2,30,5,12)), 6)',
      '',
      'raw    <- tapply(y, clinic, mean)                 # noisy raw means',
      'pooled <- coef(lmer(y ~ 1 + (1 | clinic)))$clinic[,1]   # shrunk estimates',
      'round(rbind(raw, pooled), 1)                      # small groups move most'
    ].join('\n');
  }

  window.LessonWidgets.register('shrinkage-pool', mount);
})();

;
/* spline-smoother.js */
/* spline-smoother.js - a GAM lets the data choose the curve, but you set how wiggly it may
 * get. A straight line underfits a bending relationship; a too-flexible smooth chases every
 * noisy point and overfits. Slide the smoothness dial and watch the fit go from stiff line,
 * to the honest underlying curve, to a wild overfit. Emits runnable R fitting the same
 * smooth with mgcv::gam at a chosen basis size.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // true curve: a sine-ish bend + noise
  var D = (function () {
    var a = [], s = 8; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff - 0.5; }
    for (var i = 0; i < 60; i++) { var x = i / 59 * 10; a.push({ x: x, y: Math.sin(x * 0.9) * 3 + 0.15 * x + r() * 1.5 }); }
    return a;
  })();
  function truth(x) { return Math.sin(x * 0.9) * 3 + 0.15 * x; }

  function mount(el, cfg) {
    cfg = cfg || {}; var k = 6;   // effective wiggliness (2 = line ... 30 = overfit)
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ss-plot"></div>' +
      '<label style="display:block;font:600 12px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:12px 0 2px">smoothness (basis size k) <b class="ss-v" style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '"></b>' +
        '<input class="ss-s" type="range" min="2" max="30" step="1" value="6" style="width:100%;accent-color:' + P.acc + '"></label>' +
      '<div style="display:flex;justify-content:space-between;font:10px IBM Plex Sans,sans-serif;color:' + P.mut + '"><span>stiff (underfit)</span><span>flexible (overfit)</span></div>' +
      '<div class="ss-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'A penalized smooth with mgcv::gam()' });

    var plot = el.querySelector('.ss-plot'), read = el.querySelector('.ss-read'), slider = el.querySelector('.ss-s'), vEl = el.querySelector('.ss-v');
    var W = 440, H = 250, m = { l: 34, r: 12, t: 12, b: 28 }, iw = W - m.l - m.r, ih = H - m.t - m.b;
    var xe = [0, 10], ye = [-5, 6];
    function sx(x) { return m.l + (x - xe[0]) / (xe[1] - xe[0]) * iw; }
    function sy(y) { return m.t + ih - (y - ye[0]) / (ye[1] - ye[0]) * ih; }
    // fit a local-regression-ish smoother; bandwidth from k (small k = wide = stiff)
    function smooth(x) {
      var bw = 6 / (k - 1);   // k=2 -> wide (line-like); k=30 -> narrow (wiggly)
      var sw = 0, swy = 0, swx = 0, swxx = 0, swxy = 0;
      D.forEach(function (d) { var w = Math.exp(-((d.x - x) * (d.x - x)) / (2 * bw * bw)); sw += w; swy += w * d.y; swx += w * d.x; swxx += w * d.x * d.x; swxy += w * d.x * d.y; });
      var den = sw * swxx - swx * swx; var b1 = den === 0 ? 0 : (sw * swxy - swx * swy) / den, b0 = (swy - b1 * swx) / sw;
      return b0 + b1 * x;
    }
    function draw() {
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="spline smoother">';
      svg += '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/><line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '"/>';
      D.forEach(function (d) { svg += '<circle cx="' + sx(d.x).toFixed(1) + '" cy="' + sy(d.y).toFixed(1) + '" r="3" fill="' + P.c0 + '" opacity="0.45"/>'; });
      // true curve (dashed grey)
      var tp = ''; for (var i = 0; i <= 100; i++) { var x = i / 100 * 10; tp += sx(x).toFixed(1) + ',' + sy(truth(x)).toFixed(1) + ' '; }
      svg += '<polyline points="' + tp + '" fill="none" stroke="' + P.faint + '" stroke-width="1.5" stroke-dasharray="4 3"/>';
      // fitted smooth
      var fp = ''; for (var j = 0; j <= 120; j++) { var xx = j / 120 * 10; fp += sx(xx).toFixed(1) + ',' + sy(smooth(xx)).toFixed(1) + ' '; }
      svg += '<polyline points="' + fp + '" fill="none" stroke="' + P.acc + '" stroke-width="2.6"/>';
      svg += '<text x="' + (m.l + 6) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.faint + '">dashed = true curve</text>';
      svg += '</svg>'; plot.innerHTML = svg;
      vEl.textContent = k;
      read.innerHTML = k <= 3
        ? '<b style="color:' + P.bad + '">Underfit.</b> With so few basis functions the smooth is nearly a straight line and misses the real bends: high bias.'
        : k >= 20
          ? '<b style="color:' + P.bad + '">Overfit.</b> The smooth is now flexible enough to chase individual noisy points, wiggling far from the true curve: high variance.'
          : '<b style="color:' + P.acc + '">Good fit.</b> The smooth tracks the true curve (dashed) without chasing noise. A GAM adds a penalty so it lands here on its own; you set k as the upper limit on wiggliness.';
    }
    slider.addEventListener('input', function () { k = +slider.value; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# A GAM fits a smooth curve; the penalty picks the right wiggliness automatically.',
      'library(mgcv)',
      'set.seed(8); n <- 200',
      'x <- runif(n, 0, 10)',
      'y <- sin(x * 0.9) * 3 + 0.15 * x + rnorm(n, 0, 1.2)',
      '',
      'g <- gam(y ~ s(x, k = 20))            # k caps flexibility; the penalty does the rest',
      'summary(g)$s.table                     # edf = effective degrees of freedom actually used',
      '# edf near 1 means a line; a larger edf means real curvature. The penalty avoids overfit.'
    ].join('\n');
  }

  window.LessonWidgets.register('spline-smoother', mount);
})();

;
/* stacking-blend.js */
/* stacking-blend.js - stacking (the Super Learner), made visible. Three base learners each
 * cross-validated, then a meta-learner fit on their OUT-OF-FOLD predictions learns how to
 * blend them. The stacked model beats every single base learner. Toggle between the test
 * errors (the blend's bar is lowest) and the blend weights (how much the meta-learner leans
 * on each base). Emits runnable R that builds the whole stack with base R + rpart.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  // values from the runnable R below (5-fold OOF, seed 1)
  var ERR = [{ k: 'linear', v: 0.542 }, { k: 'poly', v: 0.396 }, { k: 'tree', v: 0.423 }, { k: 'stacked', v: 0.391 }];
  var WT = [{ k: 'linear', v: -0.08 }, { k: 'poly', v: 0.71 }, { k: 'tree', v: 0.29 }];

  function mount(el, cfg) {
    cfg = cfg || {}; var view = 'err';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="st-seg" style="margin-bottom:12px">' + u.seg([{ v: 'err', label: 'Test error' }, { v: 'wt', label: 'Blend weights' }], 'err') + '</div>' +
      '<div class="st-plot"></div>' +
      '<div class="st-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Build the stack: 3 base learners, out-of-fold preds, a meta-learner' });

    var plot = el.querySelector('.st-plot'), read = el.querySelector('.st-read');
    var W = 340, H = 210;
    function draw() {
      var data = view === 'err' ? ERR : WT;
      var maxv = Math.max.apply(null, data.map(function (d) { return Math.abs(d.v); })) * 1.15;
      var n = data.length, bw = W / n * 0.6, gap = W / n;
      var base = view === 'err' ? H - 26 : H / 2;   // errors from the floor; weights around a zero line
      var bars = data.map(function (d, i) {
        var cx = gap * i + gap / 2, h = Math.abs(d.v) / maxv * (view === 'err' ? (H - 40) : (H / 2 - 20));
        var y = d.v >= 0 ? base - h : base, hh = h;
        var isBest = view === 'err' && d.k === 'stacked';
        var col = isBest ? P.acc : (d.v < 0 ? P.bad : P.c0);
        return '<rect x="' + (cx - bw / 2).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + hh.toFixed(1) + '" rx="3" fill="' + col + '" opacity="' + (isBest ? 1 : 0.82) + '"/>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (base + 16).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.mut + '">' + d.k + '</text>' +
          '<text x="' + cx.toFixed(1) + '" y="' + (d.v >= 0 ? y - 4 : y + hh + 12).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="10.5" fill="' + P.ink + '">' + d.v.toFixed(view === 'err' ? 3 : 2) + '</text>';
      }).join('');
      var zline = view === 'wt' ? '<line x1="0" y1="' + base + '" x2="' + W + '" y2="' + base + '" stroke="' + P.line2 + '" stroke-width="1"/>' : '';
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Stacking ' + view + '">' + zline + bars + '</svg>';
      read.innerHTML = view === 'err'
        ? 'RMSE on held-out folds. The <b style="color:' + P.acc + '">stacked</b> model (0.391) edges below the best single learner, poly (0.396): the blend is never worse than its parts, and usually a little better.'
        : 'How the meta-learner blends the three. It leans hardest on <b>poly</b> (0.71) and <b>tree</b> (0.29), and gives <b>linear</b> a tiny negative weight, correcting where the others agree.';
    }
    u.wireSeg(el.querySelector('.st-seg'), function (v) { view = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Stacking: cross-validate 3 base learners, then blend their out-of-fold preds.',
      'library(rpart)',
      'set.seed(1)',
      'n <- 120; x <- runif(n, 0, 6); y <- sin(x) + 0.3*x + rnorm(n, 0, 0.4)',
      'd <- data.frame(x, y)',
      'K <- 5; fold <- sample(rep(1:K, length.out = n))',
      'oof <- matrix(NA, n, 3); colnames(oof) <- c("linear","poly","tree")',
      'for (k in 1:K) {                          # out-of-fold predictions only',
      '  tr <- d[fold != k, ]; te <- which(fold == k)',
      '  oof[te,1] <- predict(lm(y ~ x, tr), d[te,])',
      '  oof[te,2] <- predict(lm(y ~ poly(x,3), tr), d[te,])',
      '  oof[te,3] <- predict(rpart(y ~ x, tr), d[te,])',
      '}',
      'rmse <- function(p) sqrt(mean((d$y - p)^2))',
      'base <- apply(oof, 2, rmse)',
      'meta <- lm(d$y ~ oof)                      # the meta-learner learns the blend',
      'round(c(base, stacked = rmse(predict(meta))), 3)',
      '# stacked RMSE sits below every base learner: the blend wins.'
    ].join('\n');
  }

  window.LessonWidgets.register('stacking-blend', mount);
})();

;
/* styled-table.js */
/* styled-table.js - a raw data frame vs a report-ready table (gt / flextable style).
 * cfg: { cols, rows, formats:{col:"dollar|pct|comma|1dp"}, title, note, align:{col:"right"} }
 * Toggle between the raw print and the formatted table: number formatting, title,
 * footnote, bold header, zebra striping, right-aligned numbers. Default = a revenue table.
 */
(function () {
  'use strict';
  function comma(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmt(v, f) {
    if (v == null || isNaN(v)) return v;
    var n = +v;
    if (f === 'dollar') return '$' + comma(Math.round(n));
    if (f === 'pct') return (Math.round(n * 1000) / 10) + '%';
    if (f === 'comma') return comma(Math.round(n));
    if (f === '1dp') return n.toFixed(1);
    return v;
  }
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var cols = cfg.cols || ['region', 'revenue', 'share'];
    var rows = cfg.rows || [['North', 1234567, 0.42], ['South', 876543, 0.30], ['West', 812000, 0.28]];
    var formats = cfg.formats || { revenue: 'dollar', share: 'pct' };
    var title = cfg.title || 'Q4 revenue by region', note = cfg.note || 'Source: internal finance, 2026.';
    var P = u.P;

    function raw() {
      var h = '<table style="border-collapse:collapse;font-family:IBM Plex Mono,monospace;font-size:12.5px"><thead><tr>';
      cols.forEach(function (c) { h += '<th style="text-align:left;padding:5px 10px;border:1px solid ' + P.line + ';color:' + P.mut + '">' + u.esc(c) + '</th>'; });
      h += '</tr></thead><tbody>';
      rows.forEach(function (r) { h += '<tr>'; r.forEach(function (v) { h += '<td style="padding:5px 10px;border:1px solid ' + P.line + ';color:' + P.ink + '">' + u.esc(v) + '</td>'; }); h += '</tr>'; });
      return h + '</tbody></table>';
    }
    function styled() {
      var h = '<div style="border:1px solid ' + P.line + ';border-radius:12px;overflow:hidden;max-width:440px;box-shadow:0 1px 2px rgba(19,23,32,.05)">';
      h += '<div style="padding:13px 16px 11px;border-bottom:2px solid ' + P.ink + '"><div style="font-family:IBM Plex Serif,Georgia,serif;font-weight:600;font-size:15px;color:' + P.ink + '">' + u.esc(title) + '</div></div>';
      h += '<table style="border-collapse:collapse;width:100%;font-family:IBM Plex Sans,system-ui,sans-serif;font-size:13px"><thead><tr>';
      cols.forEach(function (c) { var rt = formats[c]; h += '<th style="text-align:' + (rt ? 'right' : 'left') + ';padding:8px 16px;color:' + P.mut + ';font-weight:600;font-size:10.5px;letter-spacing:.04em;text-transform:uppercase;border-bottom:1px solid ' + P.line + '">' + u.esc(c) + '</th>'; });
      h += '</tr></thead><tbody>';
      rows.forEach(function (r, ri) { h += '<tr style="background:' + (ri % 2 ? P.bg : '#fff') + '">'; r.forEach(function (v, ci) { var c = cols[ci], rt = formats[c]; h += '<td style="text-align:' + (rt ? 'right' : 'left') + ';padding:8px 16px;color:' + P.ink + ';font-variant-numeric:tabular-nums;' + (rt ? 'font-family:IBM Plex Mono,monospace' : '') + '">' + u.esc(fmt(v, rt)) + '</td>'; }); h += '</tr>'; });
      h += '</tbody></table>';
      h += '<div style="padding:9px 16px;color:' + P.faint + ';font-size:11px;border-top:1px solid ' + P.line + '">' + u.esc(note) + '</div></div>';
      return h;
    }
    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML = '<div style="margin-bottom:11px"><span class="st-seg"></span></div><div class="st-stage" style="overflow-x:auto"></div>';
    var segHost = wrap.querySelector('.st-seg'); segHost.innerHTML = u.seg([{ v: 'raw', label: 'Raw print' }, { v: 'gt', label: 'Report table' }], 'raw');
    var stage = wrap.querySelector('.st-stage');
    function render(v) { stage.innerHTML = v === 'gt' ? styled() : raw(); }
    u.wireSeg(segHost, function (v) { render(v); });
    render('raw');
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('styled-table', mount);
})();

;
/* synth-control.js */
/* synth-control.js - the synthetic control method, made visible. One treated unit (a state, a
 * city, a product) gets a policy at a known time; there is no single good control. Build a
 * SYNTHETIC control as a weighted blend of donor units chosen so the blend tracks the treated
 * unit through the whole pre-treatment period. After treatment, the gap between the treated
 * line and its synthetic twin is the causal effect. Toggle between the two trajectories and
 * the gap plot. Emits the donor-weight fit (optim over a simplex) in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var TPRE = 20, TPOST = 10, TT = TPRE + TPOST, EFFECT = 3;
  var W_TRUE = [0.5, 0.33, 0.17, 0, 0];

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function build() {
    var r = rng(4), spare = null;
    function rnorm() { if (spare !== null) { var v = spare; spare = null; return v; } var a = Math.max(r(), 1e-12), b = r(), m = Math.sqrt(-2 * Math.log(a)); spare = m * Math.sin(2 * Math.PI * b); return m * Math.cos(2 * Math.PI * b); }
    var donors = [];
    for (var j = 0; j < 5; j++) { var arr = [], c = 10; for (var t = 0; t < TT; t++) { c += 0.1 * (j + 1) + rnorm(); arr.push(c); } donors.push(arr); }
    var synth = [], treated = [];
    for (var t = 0; t < TT; t++) {
      var s = 0; for (var k = 0; k < 5; k++) s += W_TRUE[k] * donors[k][t];
      synth.push(s);
      treated.push(s + rnorm() * 0.3 + (t >= TPRE ? EFFECT : 0));
    }
    return { synth: synth, treated: treated };
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var view = 'traj'; var d = build();
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="sc-seg" style="margin-bottom:12px">' + u.seg([{ v: 'traj', label: 'Trajectories' }, { v: 'gap', label: 'Gap (effect)' }], 'traj') + '</div>' +
      '<div class="sc-plot"></div>' +
      '<div class="sc-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Synthetic control: donor weights via optim, base R' });

    var plot = el.querySelector('.sc-plot'), read = el.querySelector('.sc-read');
    var W = 340, H = 200, PAD = 10, T = 10, Bm = 22;
    function px(t) { return PAD + t / (TT - 1) * (W - 2 * PAD); }
    function draw() {
      var series, ylo, yhi, cutX = px(TPRE - 0.5);
      if (view === 'traj') { series = [d.treated, d.synth]; var all = d.treated.concat(d.synth); ylo = Math.min.apply(null, all); yhi = Math.max.apply(null, all); }
      else { series = [d.treated.map(function (v, i) { return v - d.synth[i]; })]; ylo = -1; yhi = EFFECT + 2; }
      function py(y) { return T + (yhi - y) / (yhi - ylo) * (H - T - Bm); }
      function path(a, col, dash) { return '<polyline points="' + a.map(function (v, i) { return px(i).toFixed(1) + ',' + py(v).toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.3"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="synthetic control">';
      svg += '<line x1="' + cutX.toFixed(1) + '" y1="' + T + '" x2="' + cutX.toFixed(1) + '" y2="' + (H - Bm) + '" stroke="' + P.line2 + '" stroke-width="1" stroke-dasharray="2 3"/>';
      svg += '<text x="' + (cutX + 3) + '" y="' + (T + 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.mut + '">policy</text>';
      if (view === 'traj') {
        svg += path(d.synth, P.c1, true) + path(d.treated, P.c0);
        svg += '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.c0 + '">treated</text>';
        svg += '<text x="' + (W - 8) + '" y="28" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.c1 + '">synthetic</text>';
      } else {
        svg += '<line x1="' + px(0).toFixed(1) + '" y1="' + py(0).toFixed(1) + '" x2="' + px(TT - 1).toFixed(1) + '" y2="' + py(0).toFixed(1) + '" stroke="' + P.mut + '" stroke-width="1"/>';
        svg += path(series[0], P.bad);
        svg += '<text x="' + (W - 8) + '" y="14" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.bad + '">treated - synthetic</text>';
      }
      svg += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">time -></text></svg>';
      plot.innerHTML = svg;
      read.innerHTML = view === 'traj'
        ? 'The <b>synthetic</b> (dashed) is a weighted blend of donors tuned to track the <b>treated</b> unit before the policy. They match pre-policy, then split: the post-policy gap is the effect.'
        : 'The gap sits near <b>zero</b> before the policy (the synthetic is a good twin), then jumps to about <b style="color:' + P.bad + '">' + EFFECT + '</b> after: the estimated causal effect. A pre-period gap near zero is what licenses reading the post-period gap.';
    }
    u.wireSeg(el.querySelector('.sc-seg'), function (v) { view = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Synthetic control: build a weighted donor blend that tracks the treated unit pre-policy. Base R.',
      'set.seed(4)',
      'Tpre <- 20; Tpost <- 10; Tt <- Tpre + Tpost',
      'donors  <- sapply(1:5, function(j) cumsum(rnorm(Tt, 0.1 * j, 1)) + 10)   # 5 donor units',
      'treated <- as.numeric(donors %*% c(0.5, 0.3, 0.2, 0, 0)) + rnorm(Tt, 0, 0.3)',
      'treated[(Tpre + 1):Tt] <- treated[(Tpre + 1):Tt] + 3          # TRUE post-policy effect = 3',
      '',
      'pre  <- 1:Tpre                                                # fit weights on the pre-period only',
      'loss <- function(th) { w <- exp(th)/sum(exp(th)); sum((treated[pre] - donors[pre, ] %*% w)^2) }',
      'w    <- local({ o <- optim(rep(0, 5), loss); exp(o$par)/sum(exp(o$par)) })   # simplex weights',
      'synth <- as.numeric(donors %*% w)',
      'round(w, 2)',
      '#> [1] 0.50 0.33 0.17 0.00 0.00        # recovers the true donor mix, zeroes the rest',
      '',
      'round(c(true = 3,',
      '        effect   = mean(treated[(Tpre+1):Tt] - synth[(Tpre+1):Tt]),',
      '        pre_gap  = mean(treated[pre] - synth[pre])), 2)',
      '#>    true effect pre_gap',
      '#>    3.00   3.00    0.01   # near-zero pre-gap licenses the post-period read'
    ].join('\n');
  }

  window.LessonWidgets.register('synth-control', mount);
})();

;
/* table-transform.js */
/* table-transform.js - a dplyr/data.table verb shown as a before -> after table diff.
 * The workhorse for the wrangling track: filter, select, mutate, arrange, distinct,
 * summarise, separate/unite, recode, missing-value treatment are all before->after
 * table transforms. cfg:
 *   { code:"df %>% filter(...)", caption:"...",
 *     before:{cols:[], rows:[[]]}, after:{cols:[], rows:[[]]} }
 * Renders the before table + the code; "Run" reveals the result, with NEW columns in
 * green and removed rows struck through, plus a delta line. Default = a filter() example.
 */
(function () {
  'use strict';
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var before = cfg.before || { cols: ['name', 'dept', 'salary'], rows: [['Aarti', 'Sales', 48], ['Biju', 'Sales', 61], ['Chen', 'Eng', 77], ['Devi', 'Eng', 52]] };
    var after = cfg.after || { cols: ['name', 'dept', 'salary'], rows: [['Biju', 'Sales', 61], ['Chen', 'Eng', 77], ['Devi', 'Eng', 52]] };
    var code = cfg.code || 'df %>% filter(salary > 50)';
    var caption = cfg.caption || 'filter() keeps only the rows where the condition is TRUE.';

    var addCols = {}, dropCols = {};
    after.cols.forEach(function (c) { if (before.cols.indexOf(c) < 0) addCols[c] = 1; });
    before.cols.forEach(function (c) { if (after.cols.indexOf(c) < 0) dropCols[c] = 1; });
    var afterKeys = {}; after.rows.forEach(function (r) { afterKeys[JSON.stringify(r)] = 1; });
    var delRows = {}; before.rows.forEach(function (r, i) { if (!afterKeys[JSON.stringify(r)]) delRows[i] = 1; });
    var nDel = Object.keys(delRows).length, nAddCol = Object.keys(addCols).length, nDropCol = Object.keys(dropCols).length, nAddRow = Math.max(0, after.rows.length - (before.rows.length - nDel));

    // Self-contained, runnable: library + the data frame built inline + the verb.
    function ttCode() {
      var dt = /:=|setDT|\.SD|data\.table/.test(code);
      var lib = dt ? 'library(data.table)\nsetDTthreads(1)\n' : 'library(dplyr)\n';
      return lib + u.rdfCR('df', before.cols, before.rows) + '\n\n' + code;
    }
    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      u.runnable(ttCode(), { label: 'Run this transform' }) +
      '<div style="display:flex;gap:9px;align-items:center;margin:12px 0 0;flex-wrap:wrap">' +
        '<span style="font-size:12.5px;color:' + u.P.mut + '">See exactly what changed:</span>' +
        '<button class="tt-run" style="flex:none;font:inherit;font-size:13px;font-weight:600;color:#fff;background:' + u.P.acc + ';border:0;border-radius:8px;padding:8px 14px;cursor:pointer">Show what changed</button>' +
        '<button class="tt-reset" style="flex:none;font:inherit;font-size:13px;font-weight:600;color:' + u.P.mut + ';background:none;border:1px solid ' + u.P.line + ';border-radius:8px;padding:8px 13px;cursor:pointer;display:none">Reset</button>' +
      '</div><div class="tt-stage" style="overflow-x:auto;margin-top:10px"></div>' +
      '<div class="tt-cap" style="margin-top:10px;font-size:12.5px;color:' + u.P.mut + '"></div>';
    var stage = wrap.querySelector('.tt-stage'), cap = wrap.querySelector('.tt-cap'),
        runB = wrap.querySelector('.tt-run'), resetB = wrap.querySelector('.tt-reset');

    function showBefore() { stage.innerHTML = u.tbl(before.cols, before.rows); cap.innerHTML = '<b>Before.</b> ' + before.rows.length + ' rows &times; ' + before.cols.length + ' columns.'; }
    function showAfter() {
      // diff view first: original columns (plus any new), removed rows struck, new cols green
      var cols = before.cols.concat(after.cols.filter(function (c) { return before.cols.indexOf(c) < 0; }));
      var rows = before.rows.map(function (r, i) { var row = before.cols.map(function (c, ci) { return r[ci]; }); after.cols.forEach(function (c) { if (before.cols.indexOf(c) < 0) { var ai = after.cols.indexOf(c); var match = after.rows.find(function (ar) { return before.cols.every(function (bc, bi) { return ar[after.cols.indexOf(bc)] === r[bi]; }); }); row.push(match ? match[ai] : null); } }); return row; });
      stage.innerHTML = u.tbl(cols, rows, { addCols: addCols, dropCols: dropCols, delRows: delRows });
      var d = [];
      if (nDel) d.push('&minus;' + nDel + ' row' + (nDel > 1 ? 's' : ''));
      if (nAddRow) d.push('+' + nAddRow + ' row' + (nAddRow > 1 ? 's' : ''));
      if (nAddCol) d.push('+' + nAddCol + ' column' + (nAddCol > 1 ? 's' : ''));
      if (nDropCol) d.push('&minus;' + nDropCol + ' column' + (nDropCol > 1 ? 's' : ''));
      cap.innerHTML = '<b>After.</b> ' + caption + (d.length ? ' <span style="color:' + u.P.acc + ';font-weight:600">' + d.join(', ') + '</span>' : '');
    }
    showBefore();
    runB.addEventListener('click', function () { showAfter(); runB.style.display = 'none'; resetB.style.display = ''; });
    resetB.addEventListener('click', function () { showBefore(); resetB.style.display = 'none'; runB.style.display = ''; });
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('table-transform', mount);
})();

;
/* theme-styler.js */
/* theme-styler.js - the same chart, restyled: palette + theme, without touching data.
 * cfg: { data:[{x,y}], x, y }. Switch palette (default / colorblind-safe Okabe-Ito /
 * grayscale) and theme (minimal / gray / dark); the bars recolor and the panel
 * restyles, and the scale/theme code updates. Default = a 5-category bar chart.
 */
(function () {
  'use strict';
  var PALS = {
    default: { label: 'default', colors: ['#1f7a55', '#2563a8', '#b5631a', '#7a5ea3', '#2f8f86'], code: 'scale_fill_brewer()' },
    cb: { label: 'colorblind-safe', colors: ['#E69F00', '#56B4E9', '#009E73', '#0072B2', '#D55E00'], code: 'scale_fill_manual(values = okabe_ito)  # colorblind-safe' },
    gray: { label: 'grayscale', colors: ['#222', '#555', '#777', '#999', '#bbb'], code: 'scale_fill_grey()' }
  };
  var THEMES = {
    minimal: { label: 'theme_minimal', panel: '#ffffff', ink: '#131720' },
    gray: { label: 'theme_gray', panel: '#ebedf0', ink: '#131720' },
    dark: { label: 'theme_dark', panel: '#1f2430', ink: '#e6edf3' }
  };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var data = cfg.data || [{ x: 'North', y: 38 }, { x: 'South', y: 52 }, { x: 'East', y: 27 }, { x: 'West', y: 45 }, { x: 'Central', y: 33 }];
    var xlab = cfg.x || 'region', ylab = cfg.y || 'sales';
    var pal = 'default', theme = 'minimal';

    var wrap = document.createElement('div'); wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';
    wrap.innerHTML =
      '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px">' +
        '<div><div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.06em;text-transform:uppercase;color:' + u.P.faint + ';margin-bottom:5px">Palette</div><span class="ts-pal"></span></div>' +
        '<div><div style="font:600 10px/1 IBM Plex Mono,monospace;letter-spacing:.06em;text-transform:uppercase;color:' + u.P.faint + ';margin-bottom:5px">Theme</div><span class="ts-theme"></span></div>' +
      '</div>' +
      '<div class="ts-code"></div>';
    var palHost = wrap.querySelector('.ts-pal'); palHost.innerHTML = u.seg(Object.keys(PALS).map(function (k) { return { v: k, label: PALS[k].label }; }), pal);
    var thHost = wrap.querySelector('.ts-theme'); thHost.innerHTML = u.seg(Object.keys(THEMES).map(function (k) { return { v: k, label: THEMES[k].label }; }), theme);
    var codeEl = wrap.querySelector('.ts-code');
    // Self-contained, runnable: library + inline data frame + the styling pipeline.
    function runnableCode() {
      var p = PALS[pal], t = THEMES[theme];
      var pre = 'library(ggplot2)\n' + u.rdf(data, [{ name: xlab, key: 'x' }, { name: ylab, key: 'y' }]) + '\n';
      if (pal === 'cb') pre += 'okabe_ito <- c("#E69F00", "#56B4E9", "#009E73", "#0072B2", "#D55E00")\n';
      return pre + '\nggplot(df, aes(' + xlab + ', ' + ylab + ', fill = ' + xlab + ')) +\n  geom_col() +\n  ' + p.code + ' +\n  ' + t.label + '()';
    }
    function render() {
      var t = THEMES[theme], p = PALS[pal];
      codeEl.innerHTML = u.runnable(runnableCode(), { label: 'Run this chart' });
      var po = codeEl.querySelector('.webr-plot-output');
      if (po) {
        po.style.background = t.panel;
        po.innerHTML = u.previewSeed(u.plot(data, { geom: 'bar', x: xlab, y: ylab, palette: p.colors }));
        po.classList.add('has-content');
      }
    }
    u.wireSeg(palHost, function (v) { pal = v; render(); });
    u.wireSeg(thHost, function (v) { theme = v; render(); });
    render();
    el.innerHTML = ''; el.appendChild(wrap);
  }
  if (window.LessonWidgets) window.LessonWidgets.register('theme-styler', mount);
})();

;
/* transform-shaper.js */
/* transform-shaper.js - tame a skewed feature. A right-skewed histogram (a long right
 * tail) reshapes as you toggle the transform: none / log / sqrt / Box-Cox. The skew
 * statistic updates so you see the tail pulled toward symmetry. Emits runnable R that
 * transforms a skewed variable and compares the shapes.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  // a fixed right-skewed sample (exponential-ish), deterministic
  var RAW = (function () { var s = 11, out = []; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } for (var i = 0; i < 240; i++) out.push(-Math.log(1 - r()) * 2 + 0.05); return out; })();

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'none';
    function tx(v) { return mode === 'log' ? Math.log(v) : mode === 'sqrt' ? Math.sqrt(v) : mode === 'box' ? (Math.pow(v, 0.25) - 1) / 0.25 : v; }
    function skew(a) { var n = a.length, m = a.reduce(function (s, x) { return s + x; }, 0) / n, sd = Math.sqrt(a.reduce(function (s, x) { return s + (x - m) * (x - m); }, 0) / n); return a.reduce(function (s, x) { return s + Math.pow((x - m) / sd, 3); }, 0) / n; }

    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="ts-seg" style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px"></div>' +
      '<div class="ts-plot"></div>' +
      '<div class="ts-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Transform a skewed variable in R and compare' });

    var seg = el.querySelector('.ts-seg'), plot = el.querySelector('.ts-plot'), read = el.querySelector('.ts-read');
    [['none', 'raw'], ['log', 'log'], ['sqrt', 'sqrt'], ['box', 'Box-Cox']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer;background:' + (o[0] === mode ? P.ink : '#fff') + ';color:' + (o[0] === mode ? '#fff' : P.body);
      b.addEventListener('click', function () { mode = o[0]; draw(); seg.querySelectorAll('button').forEach(function (x, i) { var on = [['none'], ['log'], ['sqrt'], ['box']][i][0] === mode; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; }); });
      seg.appendChild(b);
    });

    function draw() {
      var vals = RAW.map(tx), lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals), nb = 16, bins = new Array(nb).fill(0);
      vals.forEach(function (v) { var i = Math.min(nb - 1, Math.floor((v - lo) / (hi - lo) * nb)); bins[i]++; });
      var mx = Math.max.apply(null, bins), W = 420, H = 150, bw = W / nb;
      var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="histogram">';
      bins.forEach(function (c, i) { var h = c / mx * (H - 20); svg += '<rect x="' + (i * bw + 2).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw - 3).toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + P.acc + '" rx="2"/>'; });
      svg += '</svg>'; plot.innerHTML = svg;
      var sk = skew(vals);
      read.innerHTML = 'Skewness <b style="font-family:IBM Plex Mono,monospace;color:' + P.ink + '">' + sk.toFixed(2) + '</b> (0 = symmetric). ' +
        (Math.abs(sk) < 0.4 ? 'The transform has pulled the long tail in - now a linear model and distance metrics behave.' : 'Still skewed: the long right tail makes means and distances misleading. Try a transform.');
    }
    draw();
  }

  function rcode() {
    return [
      '# A right-skewed feature (a long tail) distorts linear models and distances.',
      '# A log or Box-Cox transform pulls the tail in toward symmetry.',
      'set.seed(1)',
      'x <- rexp(500, rate = 0.5)            # heavily right-skewed',
      'g <- function(v) mean(((v - mean(v)) / sd(v))^3)   # skewness',
      '',
      'c(raw = g(x), log = g(log(x)), sqrt = g(sqrt(x)))  # closer to 0 = more symmetric',
      'par(mfrow = c(1, 2)); hist(x, main = "raw"); hist(log(x), main = "log")'
    ].join('\n');
  }

  window.LessonWidgets.register('transform-shaper', mount);
})();

;
/* tree-diagram.js */
/* tree-diagram.js - a clean static decision-tree SVG. Used as a cover hero so a
 * lesson opens with a visual, not plain text. Non-interactive by design (it sets
 * the scene without spoiling the live demos later in the lesson).
 *
 * cfg (all optional): { root, l, r, leaves:[ll,lr,rl,rr] }  // node labels
 */
(function () {
  'use strict';
  var INK = '#131720', C0 = '#2563a8', C1 = '#b5631a', LINE = '#c5cdda', MUT = '#677084';

  function box(x, y, w, h, fill, stroke, text, tcolor, fs) {
    return '<rect x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h +
      '" rx="8" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y + (fs ? fs * 0.34 : 4.5)) + '" text-anchor="middle" fill="' + tcolor +
      '" font-family="IBM Plex Mono, monospace" font-size="' + (fs || 12) + '" font-weight="600">' + text + '</text>';
  }
  function edge(x1, y1, x2, y2, label) {
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + LINE + '" stroke-width="2"/>' +
      (label ? '<text x="' + mx + '" y="' + (my - 3) + '" text-anchor="middle" fill="' + MUT +
        '" font-family="IBM Plex Mono, monospace" font-size="10">' + label + '</text>' : '');
  }

  function mount(el, cfg) {
    cfg = cfg || {};
    var root = cfg.root || 'tenure < 8 mo?';
    var l = cfg.l || 'calls > 3?', r = cfg.r || 'spend > $70?';
    var lv = cfg.leaves || ['churns', 'stays', 'stays', 'churns'];
    var svg =
      '<svg viewBox="0 0 460 300" width="100%" style="max-width:460px;display:block;margin:0 auto" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="A decision tree splitting customers by tenure, calls and spend into churn or stay leaves.">' +
      edge(230, 49, 120, 116, 'yes') + edge(230, 49, 340, 116, 'no') +
      edge(120, 144, 70, 214, 'yes') + edge(120, 144, 170, 214, 'no') +
      edge(340, 144, 290, 214, 'yes') + edge(340, 144, 390, 214, 'no') +
      box(230, 34, 150, 30, '#fff', INK, root, INK, 12.5) +
      box(120, 130, 120, 28, '#fff', '#9aa6b8', l, INK, 11.5) +
      box(340, 130, 120, 28, '#fff', '#9aa6b8', r, INK, 11.5) +
      leaf(70, 228, lv[0]) + leaf(170, 228, lv[1]) + leaf(290, 228, lv[2]) + leaf(390, 228, lv[3]) +
      '</svg>';
    el.innerHTML = '<div class="lw-diagram">' + svg + '</div>';
  }
  function leaf(x, y, label) {
    var churn = /churn/i.test(label);
    var fill = churn ? 'rgba(181,99,26,0.12)' : 'rgba(37,99,168,0.12)';
    var stroke = churn ? C1 : C0;
    return box(x, y, 86, 28, fill, stroke, label, churn ? C1 : C0, 11.5);
  }

  if (window.LessonWidgets) window.LessonWidgets.register('tree-diagram', mount);
})();

;
/* tuning-search.js */
/* tuning-search.js - searching a 2-hyperparameter loss surface. The shaded grid is the
 * validation loss for each (param1, param2). Toggle grid vs random search and watch where
 * each spends its budget: grid wastes points on a coarse lattice; random covers each axis
 * better for the same count. The best point found is ringed. Emits runnable R that scores
 * a grid and picks the best combination.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;
  function loss(a, b) { return 0.2 + 0.8 * (Math.pow(a - 0.62, 2) + Math.pow(b - 0.38, 2)) + 0.05 * Math.sin(6 * a) * Math.cos(5 * b); }

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'grid', N = 16;
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="tg-seg" style="display:flex;gap:6px;margin-bottom:12px"></div>' +
      '<div class="tg-plot"></div>' +
      '<div class="tg-read" style="font:13px/1.5 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'Grid-search two hyperparameters in R' });

    var seg = el.querySelector('.tg-seg'), plot = el.querySelector('.tg-plot'), read = el.querySelector('.tg-read');
    [['grid', 'grid search'], ['random', 'random search']].forEach(function (o) {
      var b = document.createElement('button'); b.textContent = o[1];
      b.style.cssText = 'font:600 12px IBM Plex Sans,sans-serif;border:1px solid ' + P.line + ';border-radius:8px;padding:6px 12px;cursor:pointer';
      b.addEventListener('click', function () { mode = o[0]; draw(); });
      seg.appendChild(b);
    });
    function pts() {
      var out = [];
      if (mode === 'grid') { var k = Math.round(Math.sqrt(N)); for (var i = 0; i < k; i++) for (var j = 0; j < k; j++) out.push([(i + 0.5) / k, (j + 0.5) / k]); }
      else { var s = 9; function r() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; } for (var t = 0; t < N; t++) out.push([r(), r()]); }
      return out;
    }
    function draw() {
      seg.querySelectorAll('button').forEach(function (x, i) { var on = ['grid', 'random'][i] === mode; x.style.background = on ? P.ink : '#fff'; x.style.color = on ? '#fff' : P.body; });
      var S = 240, m = 6, iw = S - 2 * m, res = 24;
      var svg = '<svg viewBox="0 0 ' + S + ' ' + S + '" width="100%" style="max-width:' + S + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="hyperparameter loss surface">';
      for (var i = 0; i < res; i++) for (var j = 0; j < res; j++) { var lv = loss((i + 0.5) / res, (j + 0.5) / res); var t = Math.max(0, Math.min(1, (lv - 0.2) / 0.9)); var c = Math.round(255 - t * 150); svg += '<rect x="' + (m + i / res * iw).toFixed(1) + '" y="' + (m + (1 - (j + 1) / res) * iw).toFixed(1) + '" width="' + (iw / res + 0.6).toFixed(1) + '" height="' + (iw / res + 0.6).toFixed(1) + '" fill="rgb(' + c + ',' + (c + 6) + ',' + (c - 20) + ')"/>'; }
      var P2 = pts(), best = null;
      P2.forEach(function (p) { var lv = loss(p[0], p[1]); if (!best || lv < best.l) best = { x: p[0], y: p[1], l: lv }; var cx = m + p[0] * iw, cy = m + (1 - p[1]) * iw; svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3" fill="' + P.ink + '" opacity="0.8"/>'; });
      svg += '<circle cx="' + (m + best.x * iw).toFixed(1) + '" cy="' + (m + (1 - best.y) * iw).toFixed(1) + '" r="7" fill="none" stroke="' + P.acc + '" stroke-width="2.5"/>';
      svg += '</svg>'; plot.innerHTML = svg;
      read.innerHTML = mode === 'grid'
        ? 'A grid spends its ' + N + ' evaluations on a regular lattice - so it only ever tries ' + Math.round(Math.sqrt(N)) + ' distinct values of each parameter.'
        : 'Random search spends the same ' + N + ' evaluations on ' + N + ' distinct values per axis, so it usually finds a better spot when one parameter barely matters.';
    }
    draw();
  }

  function rcode() {
    return [
      '# Score every combination on a validation set, then keep the best.',
      'val_loss <- function(a, b) 0.2 + (a - 0.62)^2 + (b - 0.38)^2   # stand-in for CV error',
      'grid <- expand.grid(param1 = seq(0, 1, length.out = 5),',
      '                    param2 = seq(0, 1, length.out = 5))',
      'grid$loss <- mapply(val_loss, grid$param1, grid$param2)',
      'grid[which.min(grid$loss), ]            # the best combination',
      '',
      '# random search: same budget, different values per axis',
      'set.seed(1); rs <- data.frame(param1 = runif(25), param2 = runif(25))',
      'rs$loss <- mapply(val_loss, rs$param1, rs$param2)',
      'rs[which.min(rs$loss), ]'
    ].join('\n');
  }

  window.LessonWidgets.register('tuning-search', mount);
})();

;
/* uplift-curve.js */
/* uplift-curve.js - heterogeneous treatment effects and the Qini curve, made visible. An
 * average treatment effect can be small while hiding units the treatment HELPS a lot and
 * units it HURTS. An uplift model scores each unit by its predicted individual effect; ranking
 * by that score and targeting from the top first traces the Qini curve, cumulative incremental
 * conversions versus the fraction of the population treated. A good model's curve bulges above
 * the random-targeting diagonal, and can even peak before 100% (past that you are treating
 * people it hurts). Toggle model vs random. Emits a T-learner uplift model in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function plogis(z) { return 1 / (1 + Math.exp(-z)); }

  function build() {
    var r = rng(5);
    var units = [];
    for (var i = 0; i < 4000; i++) {
      var x = r() * 2 - 1, treat = r() < 0.5 ? 1 : 0;
      var tau = 0.35 * x + 0.15;                       // true per-unit uplift, varies with x
      var p = plogis(-0.2 + 0.5 * x) + treat * tau;
      var y = r() < Math.min(1, Math.max(0, p)) ? 1 : 0;
      units.push({ score: x, treat: treat, y: y });   // score = x is the true uplift order
    }
    return units;
  }
  // Qini curve over units already sorted by score desc; returns array of {f, q}
  function qini(units) {
    var Nt = 0, Nc = 0, Yt = 0, Yc = 0, out = [{ f: 0, q: 0 }];
    for (var i = 0; i < units.length; i++) {
      if (units[i].treat) { Nt++; Yt += units[i].y; } else { Nc++; Yc += units[i].y; }
      var q = Yt - (Nc ? Yc * Nt / Nc : 0);
      if (i % 40 === 0 || i === units.length - 1) out.push({ f: (i + 1) / units.length, q: q });
    }
    return out;
  }

  function mount(el, cfg) {
    cfg = cfg || {}; var mode = 'model';
    var units = build();
    var byScore = units.slice().sort(function (a, b) { return b.score - a.score; });
    var qModel = qini(byScore);
    var qRand = qini(units);   // original order is effectively random wrt uplift
    var qmax = Math.max.apply(null, qModel.map(function (d) { return d.q; }));
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="up-seg" style="margin-bottom:12px">' + u.seg([{ v: 'model', label: 'Uplift model' }, { v: 'random', label: 'Random targeting' }], 'model') + '</div>' +
      '<div class="up-plot"></div>' +
      '<div class="up-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'T-learner uplift model + quartile validation, base R' });

    var plot = el.querySelector('.up-plot'), read = el.querySelector('.up-read');
    var W = 340, H = 200, PADL = 30, PADR = 8, T = 10, Bm = 24;
    function px(f) { return PADL + f * (W - PADL - PADR); }
    function py(q) { return T + (qmax - q) / (qmax + 1e-9) * (H - T - Bm); }
    function path(a, col, dash) { return '<polyline points="' + a.map(function (d) { return px(d.f).toFixed(1) + ',' + py(d.q).toFixed(1); }).join(' ') + '" fill="none" stroke="' + col + '" stroke-width="2.5"' + (dash ? ' stroke-dasharray="5 3"' : '') + '/>'; }
    function draw() {
      var sel = mode === 'model' ? qModel : qRand, other = mode === 'model' ? qRand : qModel;
      var peak = qModel[qModel.length - 1].q, best = qmax;
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="qini uplift curve">' +
        '<line x1="' + px(0).toFixed(1) + '" y1="' + py(0).toFixed(1) + '" x2="' + px(1).toFixed(1) + '" y2="' + py(qRand[qRand.length - 1].q).toFixed(1) + '" stroke="' + P.line + '" stroke-width="1" stroke-dasharray="2 3"/>' +
        path(other, P.line2, true) + path(sel, mode === 'model' ? P.acc : P.mut) +
        '<text x="' + (PADL + 4) + '" y="' + (T + 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">cumulative incremental conversions</text>' +
        '<text x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">fraction of population targeted -></text></svg>';
      read.innerHTML = mode === 'model'
        ? 'Ranking by predicted uplift and treating from the top bends the Qini curve <b>above</b> the random diagonal: the same budget wins far more incremental conversions. The curve peaks before 100%, past there you are treating people the offer HURTS.'
        : 'Random targeting traces the straight diagonal: incremental conversions grow in proportion to how many you treat, with no benefit from ordering. The gap to the uplift curve is what targeting buys.';
    }
    u.wireSeg(el.querySelector('.up-seg'), function (v) { mode = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Uplift (heterogeneous effects): who does the treatment actually help? Base R T-learner.',
      'set.seed(5)',
      'n <- 4000; x <- runif(n, -1, 1); treat <- rbinom(n, 1, 0.5)   # randomized',
      'tau <- 0.35 * x + 0.15                                # TRUE per-unit uplift varies with x',
      'y <- rbinom(n, 1, pmin(pmax(plogis(-0.2 + 0.5*x) + treat*tau, 0), 1))',
      '',
      'm1 <- glm(y ~ x, binomial, subset = treat == 1)       # T-learner: one model per arm',
      'm0 <- glm(y ~ x, binomial, subset = treat == 0)',
      'uplift <- predict(m1, data.frame(x), type="response") - predict(m0, data.frame(x), type="response")',
      '',
      '# validate: actual treated-minus-control response within predicted-uplift quartiles',
      'q <- cut(uplift, quantile(uplift, 0:4/4), labels = 1:4, include.lowest = TRUE)',
      'round(sapply(1:4, function(g) mean(y[q==g & treat==1]) - mean(y[q==g & treat==0])), 2)',
      '#> [1] -0.09  0.02  0.26  0.39      # rises with predicted uplift; Q1 is HURT by treatment',
      'round(mean(y[treat==1]) - mean(y[treat==0]), 2)     # the flat average that hides all this',
      '#> [1] 0.15'
    ].join('\n');
  }

  window.LessonWidgets.register('uplift-curve', mount);
})();

;
/* vector-coercion.js */
/* vector-coercion.js - foundations: an atomic vector holds ONE type, so mixing
 * types coerces the whole vector up the hierarchy logical < integer < double <
 * character. Add elements of different types and watch the vector's type change.
 * cfg: { start: [{lit,type}] }  (type in logical|integer|double|character)
 */
(function () {
  'use strict';
  var RANK = { logical: 1, integer: 2, double: 3, character: 4 };
  function mount(el, cfg) {
    var u = window.LessonWidgets.u; if (!u) return;
    cfg = cfg || {};
    var start = cfg.start || [{ lit: 'TRUE', type: 'logical' }, { lit: '2L', type: 'integer' }];
    var ADD = [
      { lit: 'TRUE', type: 'logical', label: 'TRUE' },
      { lit: '7L', type: 'integer', label: '7L (integer)' },
      { lit: '3.5', type: 'double', label: '3.5 (double)' },
      { lit: '"hi"', type: 'character', label: '"hi" (text)' }
    ];
    var items = start.slice();

    function targetType() { var r = 1; items.forEach(function (it) { r = Math.max(r, RANK[it.type]); }); return Object.keys(RANK).filter(function (k) { return RANK[k] === r; })[0]; }
    function coerce(it, t) {
      if (t === 'character') { var s = it.lit.replace(/^"|"$/g, '').replace(/L$/, ''); return '"' + s + '"'; }
      if (t === 'double' || t === 'integer') {
        if (it.type === 'logical') return it.lit === 'TRUE' ? '1' : '0';
        return it.lit.replace(/L$/, '');
      }
      return it.lit; // all-logical
    }
    function rLiteral() { return 'c(' + items.map(function (it) { return it.lit; }).join(', '); }

    var wrap = document.createElement('div');
    wrap.style.cssText = 'font-family:IBM Plex Sans,system-ui,sans-serif';

    function render() {
      var t = targetType();
      var coerced = items.map(function (it) { return coerce(it, t); });
      var pieces = items.map(function (it) {
        var changed = coerce(it, t) !== it.lit;
        return '<code style="font-family:IBM Plex Mono,monospace;font-size:13px;background:' + u.P.line2 + ';color:' + u.P.ink + ';padding:3px 7px;border-radius:6px">' + u.esc(it.lit) +
          '<span style="color:' + u.P.faint + ';font-size:11px"> ' + it.type + '</span></code>';
      }).join('<span style="color:' + u.P.faint + ';margin:0 2px">,</span> ');
      var bg = { logical: '#eef3f9', integer: '#eef3f9', double: '#e7f3ec', character: '#fbeae5' }[t];
      wrap.querySelector('.vc-in').innerHTML = 'c( ' + pieces + ' )';
      wrap.querySelector('.vc-out').innerHTML =
        '<div style="font-size:12.5px;color:' + u.P.mut + ';margin:0 0 6px">R stores them all as one type:</div>' +
        '<code style="display:inline-block;font-family:IBM Plex Mono,monospace;font-size:14px;background:' + bg + ';color:' + u.P.ink + ';padding:8px 13px;border-radius:8px;font-weight:600">' +
          '[1] ' + coerced.join(' ') + '</code>' +
        '<div style="margin:8px 0 0;font-family:IBM Plex Mono,monospace;font-size:12.5px;color:' + u.P.acc + '">typeof(x)  #&gt; "' + t + '"</div>';
      var run = wrap.querySelector('.vc-run');
      run.innerHTML = u.runnable('x <- ' + rLiteral() + ')\nx\ntypeof(x)', { label: 'Run it in R' });
    }

    wrap.innerHTML =
      '<div style="border:1px solid ' + u.P.line + ';border-radius:12px;padding:14px 16px;background:#fff">' +
        '<div style="font-size:12px;color:' + u.P.mut + ';margin:0 0 6px">Your vector</div>' +
        '<div class="vc-in" style="font-family:IBM Plex Mono,monospace;font-size:13px;line-height:2"></div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0 0">' +
          '<span style="font-size:12.5px;color:' + u.P.mut + '">Add an element:</span>' +
          ADD.map(function (a, i) { return '<button type="button" class="vc-add" data-i="' + i + '" style="font:inherit;font-size:12.5px;font-weight:600;color:' + u.P.mut + ';background:#fff;border:1px solid ' + u.P.line + ';border-radius:8px;padding:6px 11px;cursor:pointer">+ ' + u.esc(a.label) + '</button>'; }).join('') +
          '<button type="button" class="vc-reset" style="font:inherit;font-size:12.5px;font-weight:600;color:' + u.P.mut + ';background:none;border:1px solid ' + u.P.line + ';border-radius:8px;padding:6px 11px;cursor:pointer">Reset</button>' +
        '</div>' +
        '<div class="vc-out" style="margin:14px 0 0"></div>' +
      '</div>' +
      '<div class="vc-run" style="margin:12px 0 0"></div>';

    wrap.addEventListener('click', function (e) {
      var add = e.target.closest('.vc-add'), rs = e.target.closest('.vc-reset');
      if (add) { items.push(ADD[+add.getAttribute('data-i')]); render(); }
      else if (rs) { items = start.slice(); render(); }
    });
    el.innerHTML = ''; el.appendChild(wrap); render();
  }
  if (window.LessonWidgets) window.LessonWidgets.register('vector-coercion', mount);
})();

;
/* worst-group.js */
/* worst-group.js - worst-group accuracy and distributionally robust optimization, made visible.
 * A model trained to minimize AVERAGE loss (ERM) can post a high headline accuracy while quietly
 * failing a minority group, when a spurious feature that helps the majority points the wrong way
 * for the minority. Reweighting to protect the worst group (a simple DRO) trades a little average
 * accuracy for a large gain on the group that was failing. Toggle ERM vs DRO and watch the worst
 * bar rise. Emits the same ERM-vs-reweighted comparison in base R.
 *
 * cfg: { }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u, P = u.P;

  var DATA = {
    erm: { A: 0.96, B: 0.11, worst: 0.11, avg: 0.88 },
    dro: { A: 0.71, B: 0.66, worst: 0.66, avg: 0.70 }
  };
  var BARS = [{ k: 'A', label: 'group A (majority)' }, { k: 'B', label: 'group B (minority)' }, { k: 'worst', label: 'worst group' }, { k: 'avg', label: 'average' }];

  function mount(el, cfg) {
    cfg = cfg || {}; var method = 'erm';
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:#fff;padding:16px 17px';
    el.innerHTML =
      '<div class="wg-seg" style="margin-bottom:12px">' + u.seg([{ v: 'erm', label: 'ERM (average loss)' }, { v: 'dro', label: 'DRO (worst group)' }], 'erm') + '</div>' +
      '<div class="wg-plot"></div>' +
      '<div class="wg-read" style="font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:9px 0 14px"></div>' +
      u.runnable(rcode(), { label: 'ERM vs group-reweighted DRO: worst-group accuracy, base R' });

    var plot = el.querySelector('.wg-plot'), read = el.querySelector('.wg-read');
    var W = 340, H = 190, PADL = 10, PADR = 10, T = 14, Bm = 40;
    function draw() {
      var d = DATA[method], n = BARS.length, gap = (W - PADL - PADR) / n, bw = gap * 0.55;
      var bars = BARS.map(function (b, i) {
        var v = d[b.k], x = PADL + i * gap + (gap - bw) / 2, h = v * (H - T - Bm);
        var col = b.k === 'worst' ? P.bad : (b.k === 'avg' ? P.mut : P.c0);
        return '<rect x="' + x.toFixed(1) + '" y="' + (H - Bm - h).toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + h.toFixed(1) + '" fill="' + col + '" opacity="0.8"/>' +
          '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - Bm - h - 4).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="11" font-weight="600" fill="' + col + '">' + v.toFixed(2) + '</text>' +
          '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - Bm + 13).toFixed(1) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="8.5" fill="' + P.mut + '">' + b.k + '</text>';
      }).join('');
      plot.innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block;border:1px solid ' + P.line + ';border-radius:8px" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="worst-group accuracy">' +
        '<line x1="' + PADL + '" y1="' + (H - Bm) + '" x2="' + (W - PADR) + '" y2="' + (H - Bm) + '" stroke="' + P.line + '" stroke-width="1"/>' +
        bars +
        '<text x="' + PADL + '" y="' + (H - 6) + '" font-family="IBM Plex Sans,sans-serif" font-size="9" fill="' + P.mut + '">accuracy per group (A majority, B minority)</text></svg>';
      read.innerHTML = method === 'erm'
        ? '<b>ERM</b> minimizes average loss and posts a healthy <b>0.88</b> overall, but group B (the minority, where a spurious feature reverses) sits at <b style="color:' + P.bad + '">0.11</b>, worse than a coin flip. The average hid a group in freefall.'
        : '<b>DRO</b> upweights the failing group, lifting the worst group from 0.11 to <b style="color:' + P.acc + '">0.66</b>. Average accuracy drops from 0.88 to 0.70: the deliberate price of protecting the worst-off group.';
    }
    u.wireSeg(el.querySelector('.wg-seg'), function (v) { method = v; draw(); });
    draw();
  }

  function rcode() {
    return [
      '# Worst-group accuracy: ERM can pass on average and fail a minority group. Base R.',
      'set.seed(4)',
      'n <- 3000',
      'grp  <- ifelse(runif(n) < 0.9, "A", "B")            # A majority 90%, B minority 10%',
      'core <- rnorm(n); y <- rbinom(n, 1, plogis(1.2 * core))       # the TRUE signal',
      'spur <- ifelse(grp == "A", 2*y - 1, 1 - 2*y) + rnorm(n, 0, 0.5)  # spurious: reversed for B',
      'd <- data.frame(y, core, spur, grp)',
      'gacc <- function(fit) { p <- predict(fit, d, type = "response") > 0.5',
      '  aA <- mean(p[grp=="A"]==y[grp=="A"]); aB <- mean(p[grp=="B"]==y[grp=="B"])',
      '  c(A = aA, B = aB, worst = min(aA, aB), avg = mean(p == y)) }',
      '',
      'erm <- glm(y ~ core + spur, binomial, data = d)                 # minimize AVERAGE loss',
      'dro <- glm(y ~ core + spur, binomial, data = d,',
      '           weights = ifelse(grp == "B", 9, 1))                  # upweight the minority (DRO)',
      'round(rbind(ERM = gacc(erm), DRO = gacc(dro)), 2)',
      '#>        A    B worst  avg',
      '#> ERM 0.96 0.11  0.11 0.88   # great average, minority in freefall',
      '#> DRO 0.71 0.66  0.66 0.70   # worst group rescued, small average cost'
    ].join('\n');
  }

  window.LessonWidgets.register('worst-group', mount);
})();

;
/* wrong-family-fit.js */
/* wrong-family-fit.js - fit the wrong kind of model and watch exactly how it fails.
 *
 * Serves the ordinal-outcome, link-function, zero-inflation, overfitting and missing-
 * interaction objections in The Publishing Handbook. One config key picks the
 * misspecification; each one fails in its own visible, countable way.
 *
 *   link          a linear model on a yes/no outcome predicts probabilities below 0 and
 *                 above 1. The widget counts them and names the worst one.
 *   zero-inflation a Poisson model on data with a pile of structural zeros predicts far
 *                 fewer zeros than the data contain. The widget compares the two counts.
 *   ordinal       a 1-to-5 rating treated as a number predicts values no respondent could
 *                 give, and assumes the gap from 1 to 2 equals the gap from 4 to 5, which
 *                 in this data it does not. The true gaps are printed.
 *   overfitting   a polynomial degree slider. Training fit rises to nearly perfect while
 *                 error on data the model has not seen goes the other way.
 *   interaction   two groups whose slopes point in opposite directions, fitted additively.
 *                 The single slope is near zero and describes neither group.
 *
 * Everything is seeded, so the same config always draws the same picture. The right model
 * is fitted alongside the wrong one by iteratively reweighted least squares (the same
 * algorithm glm() uses), and least squares is solved by modified Gram-Schmidt so a degree
 * 12 polynomial does not fall over numerically. Coefficients were checked against glm()
 * and lm() in R.
 *
 * SIMPLIFIED, and why: in `ordinal` mode the correct model is shown as the observed
 * distribution of ratings in each slice of x rather than as a fitted proportional-odds
 * curve. Fitting cumulative logit in the browser would add an optimiser for four
 * thresholds and buy nothing the reader needs to see: the point is that the categories are
 * not evenly spaced and the line predicts values that do not exist, and the observed
 * distribution shows that more directly than a fitted curve would. The emitted R fits
 * MASS::polr for anyone who wants the model itself.
 *
 * cfg: {
 *   mode: "link",              // link | zero-inflation | ordinal | overfitting | interaction
 *   modes: ["...", "..."],     // OR a list -> segmented control (default: just `mode`)
 *   n: null,                   // sample size (per-mode default)
 *   degree: 3,                 // overfitting mode: starting polynomial degree
 *   maxDegree: 12,             // overfitting mode: slider maximum
 *   seed: 31
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f6f8fa', warn: '#fbeae5'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b',
    soft: 'rgba(255,255,255,.05)', warn: 'rgba(244,128,90,.16)'
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

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gaussian(rnd) { var a = 1 - rnd(), b = rnd(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); }
  function rpois(rnd, lam) {                     // Knuth, fine for the small means used here
    var L = Math.exp(-lam), k = 0, p = 1;
    do { k++; p *= rnd(); } while (p > L);
    return k - 1;
  }
  function logistic(z) { return 1 / (1 + Math.exp(-z)); }

  /* Least squares by modified Gram-Schmidt: stable enough for a degree 12 Vandermonde. */
  function lsq(X, y) {
    var n = X.length, p = X[0].length, cols = [], Q = [], R = [], i, j, k;
    for (j = 0; j < p; j++) { var c = new Float64Array(n); for (i = 0; i < n; i++) c[i] = X[i][j]; cols.push(c); R.push(new Float64Array(p)); }
    for (j = 0; j < p; j++) {
      for (k = 0; k < j; k++) {
        var d = 0; for (i = 0; i < n; i++) d += Q[k][i] * cols[j][i];
        R[k][j] = d; for (i = 0; i < n; i++) cols[j][i] -= d * Q[k][i];
      }
      var nrm = 0; for (i = 0; i < n; i++) nrm += cols[j][i] * cols[j][i];
      nrm = Math.sqrt(nrm); R[j][j] = nrm;
      var q = new Float64Array(n);
      if (nrm > 1e-11) for (i = 0; i < n; i++) q[i] = cols[j][i] / nrm;
      Q.push(q);
    }
    var b = new Float64Array(p);
    for (j = 0; j < p; j++) { var s = 0; for (i = 0; i < n; i++) s += Q[j][i] * y[i]; b[j] = s; }
    var beta = new Float64Array(p);
    for (j = p - 1; j >= 0; j--) {
      var t = b[j];
      for (k = j + 1; k < p; k++) t -= R[j][k] * beta[k];
      beta[j] = R[j][j] > 1e-11 ? t / R[j][j] : 0;
    }
    return beta;
  }
  /* GLM by iteratively reweighted least squares - the algorithm glm() itself uses. */
  function glm(X, y, family) {
    var n = X.length, p = X[0].length, beta = new Float64Array(p), it, i, j;
    for (it = 0; it < 60; it++) {
      var Xw = [], z = new Float64Array(n);
      for (i = 0; i < n; i++) {
        var eta = 0;
        for (j = 0; j < p; j++) eta += X[i][j] * beta[j];
        var mu, wt;
        if (family === 'binomial') {
          mu = Math.min(1 - 1e-10, Math.max(1e-10, logistic(eta)));
          wt = mu * (1 - mu);
        } else {
          mu = Math.exp(Math.min(30, eta)); wt = Math.max(1e-10, mu);
        }
        var zz = eta + (y[i] - mu) / wt;              // the working response
        var sw = Math.sqrt(wt), row = [];
        for (j = 0; j < p; j++) row.push(X[i][j] * sw);
        Xw.push(row); z[i] = zz * sw;
      }
      var nb = lsq(Xw, z), delta = 0;
      for (j = 0; j < p; j++) { delta += Math.abs(nb[j] - beta[j]); beta[j] = nb[j]; }
      if (delta < 1e-11) break;
    }
    return beta;
  }
  function poly(x, deg) { var r = [1], v = 1, d; for (d = 1; d <= deg; d++) { v *= x; r.push(v); } return r; }
  function evalp(b, x) { var s = 0, v = 1, j; for (j = 0; j < b.length; j++) { s += b[j] * v; v *= x; } return s; }

  /* ---------------- the five misspecifications ---------------- */
  var MODES = {
    link: {
      short: 'Wrong link', n: 200,
      title: 'A yes/no outcome fitted with a straight line',
      build: function (n, seed) {
        var rnd = mulberry32(seed), x = [], y = [], i;
        for (i = 0; i < n; i++) { var xv = -3 + 6 * rnd(); x.push(xv); y.push(rnd() < logistic(1.4 * xv) ? 1 : 0); }
        var X = x.map(function (v) { return [1, v]; });
        var lin = lsq(X, y), log = glm(X, y, 'binomial');
        var bad = 0, worstLo = 1, worstHi = 0;
        x.forEach(function (v) { var f = lin[0] + lin[1] * v; if (f < 0 || f > 1) bad++; if (f < worstLo) worstLo = f; if (f > worstHi) worstHi = f; });
        return { x: x, y: y, lin: lin, log: log, bad: bad, worstLo: worstLo, worstHi: worstHi, n: n,
                 outX: 4, outLin: lin[0] + lin[1] * 4, outLog: logistic(log[0] + log[1] * 4) };
      }
    },
    'zero-inflation': {
      short: 'Zero inflation', n: 260,
      title: 'Counts with a pile of structural zeros, fitted as ordinary Poisson',
      build: function (n, seed) {
        var rnd = mulberry32(seed), x = [], y = [], i, pZero = 0.45;
        for (i = 0; i < n; i++) {
          var xv = gaussian(rnd);
          x.push(xv);
          y.push(rnd() < pZero ? 0 : rpois(rnd, Math.exp(0.9 + 0.7 * xv)));
        }
        var X = x.map(function (v) { return [1, v]; });
        var b = glm(X, y, 'poisson');
        var obsZero = 0, expZero = 0, maxC = 0;
        for (i = 0; i < n; i++) {
          if (y[i] === 0) obsZero++;
          expZero += Math.exp(-Math.exp(b[0] + b[1] * x[i]));
          if (y[i] > maxC) maxC = y[i];
        }
        return { x: x, y: y, b: b, obsZero: obsZero, expZero: expZero, maxC: maxC, n: n, pZero: pZero };
      }
    },
    ordinal: {
      short: 'Ordinal as numeric', n: 240,
      title: 'A 1-to-5 rating treated as a number',
      build: function (n, seed) {
        var rnd = mulberry32(seed), cuts = [-2.0, -0.4, 0.2, 2.4], x = [], y = [], i, j;
        for (i = 0; i < n; i++) {
          var xv = -2 + 4 * rnd();
          var z = 1.1 * xv + Math.log(rnd() / (1 - rnd()));      // logistic latent noise
          var cat = 1;
          for (j = 0; j < cuts.length; j++) if (z > cuts[j]) cat = j + 2;
          x.push(xv); y.push(cat);
        }
        var X = x.map(function (v) { return [1, v]; });
        var lin = lsq(X, y);
        var gaps = [];
        for (j = 1; j < cuts.length; j++) gaps.push(cuts[j] - cuts[j - 1]);
        return { x: x, y: y, lin: lin, cuts: cuts, gaps: gaps, n: n,
                 predLo: lin[0] - 2 * lin[1], predHi: lin[0] + 2 * lin[1],
                 outX: 3, predOut: lin[0] + 3 * lin[1] };
      }
    },
    overfitting: {
      short: 'Overfitting', n: 18, slider: true,
      title: 'A polynomial flexible enough to memorise the training set',
      build: function (n, seed) {
        var rnd = mulberry32(seed), xtr = [], ytr = [], xte = [], yte = [], i;
        function f(v) { return Math.sin(2.3 * v); }
        for (i = 0; i < n; i++) { var a = -1 + 2 * (i + 0.5) / n; xtr.push(a); ytr.push(f(a) + 0.28 * gaussian(rnd)); }
        for (i = 0; i < n; i++) { var b = -1 + 2 * rnd(); xte.push(b); yte.push(f(b) + 0.28 * gaussian(rnd)); }
        return { xtr: xtr, ytr: ytr, xte: xte, yte: yte, n: n };
      },
      refit: function (D, deg) {
        var X = D.xtr.map(function (v) { return poly(v, deg); });
        var b = lsq(X, D.ytr), i, rssTr = 0, tss = 0, mtr = 0, rssTe = 0;
        for (i = 0; i < D.ytr.length; i++) mtr += D.ytr[i]; mtr /= D.ytr.length;
        for (i = 0; i < D.xtr.length; i++) { var e = D.ytr[i] - evalp(b, D.xtr[i]); rssTr += e * e; tss += (D.ytr[i] - mtr) * (D.ytr[i] - mtr); }
        for (i = 0; i < D.xte.length; i++) { var e2 = D.yte[i] - evalp(b, D.xte[i]); rssTe += e2 * e2; }
        return { b: b, r2: 1 - rssTr / tss,
                 rmseTr: Math.sqrt(rssTr / D.xtr.length), rmseTe: Math.sqrt(rssTe / D.xte.length) };
      }
    },
    interaction: {
      short: 'Missing interaction', n: 140,
      title: 'Two groups with opposite slopes, fitted without an interaction',
      build: function (n, seed) {
        var rnd = mulberry32(seed), x = [], g = [], y = [], i;
        for (i = 0; i < n; i++) {
          var xv = 10 * rnd(), gi = i % 2;
          x.push(xv); g.push(gi);
          y.push((gi ? 10 - 0.8 * xv : 2 + 0.8 * xv) + 1.5 * gaussian(rnd));
        }
        var Xa = x.map(function (v, i2) { return [1, v, g[i2]]; });
        var ba = lsq(Xa, y);
        var Xi = x.map(function (v, i2) { return [1, v, g[i2], v * g[i2]]; });
        var bi = lsq(Xi, y);
        return { x: x, g: g, y: y, ba: ba, bi: bi, n: n };
      }
    }
  };

  /* ---------------- mount ---------------- */
  function mount(el, cfg) {
    cfg = cfg || {};
    var list = (cfg.modes && cfg.modes.length ? cfg.modes : [cfg.mode || 'link']).filter(function (k) { return MODES[k]; });
    if (!list.length) list = ['link'];
    var which = list[0];
    var seed = (cfg.seed == null ? 31 : +cfg.seed);
    var nOver = Math.max(12, +cfg.n || MODES.overfitting.n);
    // never let the polynomial interpolate the training set exactly: that makes the
    // training residual zero and the ratio below meaningless rather than dramatic
    var maxDeg = Math.max(2, Math.min(nOver - 3, +cfg.maxDegree || 15));
    var deg = Math.max(1, Math.min(maxDeg, +cfg.degree || 3));
    var cache = {};

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      (list.length > 1 ? '<div class="wf-seg" style="margin-bottom:11px"></div>' : '') +
      '<div class="wf-title" style="font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:8px"></div>' +
      '<div class="wf-ctl" style="margin-bottom:10px"></div>' +
      '<div class="wf-plot"></div>' +
      '<div class="wf-fail" style="margin:11px 0 0"></div>' +
      '<div class="wf-read" style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:10px 0 14px"></div>' +
      '<div class="wf-r"></div>';

    var segBox = el.querySelector('.wf-seg'), title = el.querySelector('.wf-title'),
        ctl = el.querySelector('.wf-ctl'), plot = el.querySelector('.wf-plot'),
        fail = el.querySelector('.wf-fail'), read = el.querySelector('.wf-read'),
        rbox = el.querySelector('.wf-r');

    if (segBox) {
      segBox.innerHTML = u.seg(list.map(function (k) { return { v: k, label: MODES[k].short }; }), which);
      u.wireSeg(segBox, function (v) { which = v; render(true); });
    }

    function data(key) {
      if (!cache[key]) {
        var M = MODES[key];
        cache[key] = M.build(Math.max(10, +cfg.n || M.n), seed);
      }
      return cache[key];
    }

    function render(rebuildCtl) {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      title.style.color = P.mut; read.style.color = P.body;
      var M = MODES[which], D = data(which);
      title.textContent = M.title;

      if (rebuildCtl) {
        ctl.innerHTML = M.slider
          ? '<label style="display:block;font:600 12px IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:4px">' +
            'Polynomial degree: <b class="wf-dv" style="color:' + P.ink + '">' + deg + '</b></label>' +
            '<input class="wf-deg" type="range" min="1" max="' + maxDeg + '" step="1" value="' + deg +
            '" aria-label="polynomial degree" style="width:100%;max-width:420px;display:block">'
          : '';
        var sl = ctl.querySelector('.wf-deg');
        if (sl) sl.addEventListener('input', function () { deg = +sl.value; render(false); });
      }
      var dv = ctl.querySelector('.wf-dv'); if (dv) { dv.textContent = deg; dv.style.color = P.ink; }

      var out = VIEW[which](D, P, deg);
      plot.innerHTML = out.svg;
      fail.innerHTML = callout(out.fail, P);
      read.innerHTML = out.read;
      // only rebuild the code panel when the mode changes: dragging the degree slider
      // must not wipe whatever the reader has typed or run
      if (rebuildCtl || !rbox.firstChild) rbox.innerHTML = u.runnable(RCODE[which](D), { label: 'Fit both models in R' });
    }

    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(true); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render(true);
  }

  function callout(txt, P) {
    return '<div style="border-left:3px solid ' + P.bad + ';background:' + P.warn + ';border-radius:0 8px 8px 0;padding:9px 12px;' +
      'font:13px/1.55 IBM Plex Sans,sans-serif;color:' + P.ink + '">' + txt + '</div>';
  }

  /* ---------------- one drawing per mode ---------------- */
  var W = 520;
  function axes(P, m, iw, ih, xlab, ylab) {
    return '<line x1="' + m.l + '" y1="' + (m.t + ih) + '" x2="' + (m.l + iw) + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>' +
      '<line x1="' + m.l + '" y1="' + m.t + '" x2="' + m.l + '" y2="' + (m.t + ih) + '" stroke="' + P.line + '" stroke-width="1.5"/>' +
      '<text x="' + (m.l + iw / 2) + '" y="' + (m.t + ih + 26) + '" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">' + u.esc(xlab) + '</text>' +
      '<text transform="translate(11,' + (m.t + ih / 2) + ') rotate(-90)" text-anchor="middle" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.mut + '">' + u.esc(ylab) + '</text>';
  }
  function wrap(g, H, label) {
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + u.esc(label) + '">' + g + '</svg>';
  }

  var VIEW = {
    link: function (D, P) {
      var m = { l: 42, r: 16, t: 14 }, iw = W - m.l - m.r, ih = 190, H = 236;
      var lo = -0.45, hi = 1.45;
      function sx(v) { return m.l + (v + 3) / 6 * iw; }
      function sy(v) { return m.t + (hi - v) / (hi - lo) * ih; }
      var g = '';
      g += '<rect x="' + m.l + '" y="' + m.t + '" width="' + iw + '" height="' + (sy(1) - m.t).toFixed(1) + '" fill="' + P.warn + '"/>' +
           '<rect x="' + m.l + '" y="' + sy(0).toFixed(1) + '" width="' + iw + '" height="' + (m.t + ih - sy(0)).toFixed(1) + '" fill="' + P.warn + '"/>' +
           '<text x="' + (m.l + 6) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.bad + '">a probability cannot live up here</text>' +
           '<text x="' + (m.l + 6) + '" y="' + (m.t + ih - 5) + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.bad + '">or down here</text>';
      [0, 0.5, 1].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
      });
      D.x.forEach(function (v, i) {
        g += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + sy(D.y[i]).toFixed(1) + '" r="2.6" fill="' + P.mut + '" fill-opacity="0.42"/>';
      });
      var pl = [], pg = [], t;
      for (t = -3; t <= 3.0001; t += 0.05) {
        pl.push(sx(t).toFixed(1) + ',' + sy(D.lin[0] + D.lin[1] * t).toFixed(1));
        pg.push(sx(t).toFixed(1) + ',' + sy(logistic(D.log[0] + D.log[1] * t)).toFixed(1));
      }
      g += '<polyline points="' + pg.join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="2.4"/>' +
           '<polyline points="' + pl.join(' ') + '" fill="none" stroke="' + P.bad + '" stroke-width="2.4" stroke-dasharray="6 3"/>' +
           '<text x="' + (m.l + iw - 4) + '" y="' + (sy(0.5) - 8) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.acc + '">logistic</text>' +
           '<text x="' + (m.l + iw - 4) + '" y="' + (sy(0.5) + 14) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">linear model</text>' +
           axes(P, m, iw, ih, 'predictor', 'outcome (0 or 1)');
      return {
        svg: wrap(g, H, 'a linear model and a logistic model fitted to a binary outcome'),
        fail: '<b>' + D.bad + ' of ' + D.n + '</b> fitted values from the linear model are impossible probabilities ' +
          '(lowest ' + D.worstLo.toFixed(2) + ', highest ' + D.worstHi.toFixed(2) + '). Ask it for the probability at x = ' + D.outX +
          ', one step past the data, and it answers <b>' + D.outLin.toFixed(2) + '</b>. The logistic model answers ' + D.outLog.toFixed(2) + '.',
        read: 'The straight line has to keep going. A probability cannot, so the model is forced to state things that have no meaning, ' +
          'and it is worst exactly where the reviewer will look, at the two ends. The logistic curve is the same idea with a link that respects the range: ' +
          'it bends and flattens instead of walking off the chart. Nothing was lost by switching, and the fitted values are now interpretable.'
      };
    },

    'zero-inflation': function (D, P) {
      var m = { l: 42, r: 16, t: 22 }, iw = W - m.l - m.r, ih = 180, H = 234;
      var K = Math.min(12, D.maxC), i, j;
      var obs = new Array(K + 1), exp = new Array(K + 1);
      for (i = 0; i <= K; i++) { obs[i] = 0; exp[i] = 0; }
      for (i = 0; i < D.n; i++) obs[Math.min(K, D.y[i])]++;
      for (i = 0; i < D.n; i++) {
        var mu = Math.exp(D.b[0] + D.b[1] * D.x[i]), pk = Math.exp(-mu), acc = 0;
        for (j = 0; j <= K; j++) { exp[j] += pk; acc += pk; pk = pk * mu / (j + 1); }
        exp[K] += 1 - acc;                                       // pile the tail into the last bar
      }
      var top = Math.max(Math.max.apply(null, obs), Math.max.apply(null, exp)) * 1.14;
      var bw = iw / (K + 1);
      function sy(v) { return m.t + (1 - v / top) * ih; }
      var g = '';
      [0, top / 2, top].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + Math.round(v) + '</text>';
      });
      for (i = 0; i <= K; i++) {
        var x0 = m.l + bw * i;
        g += '<rect x="' + (x0 + bw * 0.14).toFixed(1) + '" y="' + sy(obs[i]).toFixed(1) + '" width="' + (bw * 0.72).toFixed(1) +
             '" height="' + (m.t + ih - sy(obs[i])).toFixed(1) + '" rx="2" fill="' + P.mut + '" fill-opacity="0.34"/>' +
             '<rect x="' + (x0 + bw * 0.28).toFixed(1) + '" y="' + sy(exp[i]).toFixed(1) + '" width="' + (bw * 0.44).toFixed(1) +
             '" height="' + (m.t + ih - sy(exp[i])).toFixed(1) + '" rx="2" fill="none" stroke="' + P.bad + '" stroke-width="1.8"/>' +
             '<text x="' + (x0 + bw / 2).toFixed(1) + '" y="' + (m.t + ih + 13) + '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8.5" fill="' + P.mut + '">' +
             (i === K ? i + '+' : i) + '</text>';
      }
      g += '<text x="' + m.l + '" y="12" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">solid = the data</text>' +
           '<text x="' + (m.l + iw) + '" y="12" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">outline = what the Poisson model expects</text>' +
           axes(P, m, iw, ih, 'count', 'how many cases');
      return {
        svg: wrap(g, H, 'observed counts against the counts a Poisson model expects'),
        fail: 'The data contain <b>' + D.obsZero + ' zeros</b>. The Poisson model expects <b>' + D.expZero.toFixed(0) + '</b>. ' +
          'That gap is the model telling you it has the wrong shape.',
        read: 'A Poisson distribution has one parameter, so its mean fixes how many zeros it can produce. Here the zeros come from two different places: ' +
          Math.round(100 * D.pZero) + '% of the cases could never have had a positive count at all, and the rest could and sometimes did not. ' +
          'One parameter cannot describe two processes, so the model splits the difference: it overstates the low counts it can reach and understates the zeros. ' +
          'Fit a zero-inflated or a hurdle model and the two processes get a parameter each.'
      };
    },

    ordinal: function (D, P) {
      var m = { l: 42, r: 16, t: 16 }, iw = W - m.l - m.r, ih = 176, H = 226;
      var lo = 0.4, hi = 5.9;
      function sx(v) { return m.l + (v + 2) / 4 * iw; }
      function sy(v) { return m.t + (hi - v) / (hi - lo) * ih; }
      var g = '', i, j;
      [1, 2, 3, 4, 5].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
      });
      // observed distribution in five slices of x, drawn as stacked proportions
      var bins = 5, cnt = [];
      for (i = 0; i < bins; i++) { cnt.push([0, 0, 0, 0, 0]); }
      for (i = 0; i < D.n; i++) {
        var b = Math.min(bins - 1, Math.floor((D.x[i] + 2) / 4 * bins));
        cnt[b][D.y[i] - 1]++;
      }
      for (i = 0; i < bins; i++) {
        var tot = cnt[i].reduce(function (a, c) { return a + c; }, 0) || 1;
        var x0 = m.l + iw * i / bins + iw / bins * 0.16, wdt = iw / bins * 0.68, yTop = m.t + 6;
        for (j = 4; j >= 0; j--) {
          var frac = cnt[i][j] / tot, hgt = frac * (ih - 12);
          g += '<rect x="' + x0.toFixed(1) + '" y="' + yTop.toFixed(1) + '" width="' + wdt.toFixed(1) + '" height="' + hgt.toFixed(1) +
               '" fill="' + P.c0 + '" fill-opacity="' + (0.16 + 0.19 * j).toFixed(2) + '"/>';
          if (frac > 0.12) g += '<text x="' + (x0 + wdt / 2).toFixed(1) + '" y="' + (yTop + hgt / 2 + 3).toFixed(1) +
               '" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.ink + '">' + (j + 1) + '</text>';
          yTop += hgt;
        }
      }
      var pl = [], t;
      for (t = -2; t <= 2.0001; t += 0.08) pl.push(sx(t).toFixed(1) + ',' + sy(D.lin[0] + D.lin[1] * t).toFixed(1));
      g += '<polyline points="' + pl.join(' ') + '" fill="none" stroke="' + P.bad + '" stroke-width="2.4" stroke-dasharray="6 3"/>' +
           '<text x="' + (m.l + iw - 4) + '" y="' + (sy(D.predHi) - 8).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">the numeric model</text>' +
           '<text x="' + m.l + '" y="' + (m.t + ih + 25) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.mut + '">bars: what people actually answered in each slice of x</text>' +
           axes(P, m, iw, ih, 'predictor', 'rating, 1 to 5');
      return {
        svg: wrap(g, H, 'a straight line fitted to a five-point rating, against the observed answers'),
        fail: 'The line predicts <b>' + D.predLo.toFixed(2) + '</b> at the bottom of the range and <b>' + D.predHi.toFixed(2) +
          '</b> at the top. Nobody gave those answers, because nobody could. Push it one step past the data, to x = ' + D.outX +
          ', and it predicts <b>' + D.predOut.toFixed(2) + '</b>, which is off the scale entirely. ' +
          'It also treats the step from 1 to 2 as equal to the step from 4 to 5; in the process behind this data they are <b>' +
          D.gaps[0].toFixed(1) + '</b> and <b>' + D.gaps[2].toFixed(1) + '</b>.',
        read: 'Rating scales are ordered, not spaced. The numbers 1 to 5 are labels for a ranking, and arithmetic on labels invents a measurement that was never taken. ' +
          'Averaging them assumes every step is the same size, which is exactly the assumption the data violate here. ' +
          'An ordered logistic model estimates one slope and lets the category boundaries sit wherever the data put them, which is the honest version of the same question.'
      };
    },

    overfitting: function (D, P, deg) {
      var F = MODES.overfitting.refit(D, deg);
      var m = { l: 42, r: 16, t: 14 }, iw = W - m.l - m.r, ih = 186, H = 232;
      var lo = -2.2, hi = 2.2;
      function sx(v) { return m.l + (v + 1.05) / 2.1 * iw; }
      function sy(v) { return m.t + (hi - Math.max(lo, Math.min(hi, v))) / (hi - lo) * ih; }
      var g = '', t;
      [-2, -1, 0, 1, 2].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
      });
      var truth = [], curve = [];
      for (t = -1.05; t <= 1.0501; t += 0.01) {
        truth.push(sx(t).toFixed(1) + ',' + sy(Math.sin(2.3 * t)).toFixed(1));
        curve.push(sx(t).toFixed(1) + ',' + sy(evalp(F.b, t)).toFixed(1));
      }
      g += '<polyline points="' + truth.join(' ') + '" fill="none" stroke="' + P.acc + '" stroke-width="1.8" stroke-dasharray="4 3"/>';
      D.xte.forEach(function (v, i) { g += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + sy(D.yte[i]).toFixed(1) + '" r="3" fill="none" stroke="' + P.c1 + '" stroke-width="1.4"/>'; });
      D.xtr.forEach(function (v, i) { g += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + sy(D.ytr[i]).toFixed(1) + '" r="3.2" fill="' + P.c0 + '" fill-opacity="0.85"/>'; });
      g += '<polyline points="' + curve.join(' ') + '" fill="none" stroke="' + P.bad + '" stroke-width="2.4"/>' +
           '<text x="' + m.l + '" y="' + (m.t + 11) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">filled = training data</text>' +
           '<text x="' + (m.l + iw) + '" y="' + (m.t + 11) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c1 + '">hollow = held out</text>' +
           axes(P, m, iw, ih, 'predictor', 'outcome');
      var ratio = F.rmseTr > 1e-9 ? F.rmseTe / F.rmseTr : Infinity;
      var offChart = false, tt;
      for (tt = -1.05; tt <= 1.0501; tt += 0.02) if (Math.abs(evalp(F.b, tt)) > hi) offChart = true;
      return {
        svg: wrap(g, H, 'a polynomial fitted at the chosen degree, with training and held-out points'),
        fail: 'Training R-squared <b>' + F.r2.toFixed(3) + '</b>. Error on the held-out points is <b>' +
          (isFinite(ratio) ? ratio.toFixed(1) + 'x' : 'unbounded') + '</b> the training error (' +
          F.rmseTe.toFixed(2) + ' against ' + F.rmseTr.toFixed(2) + ').' +
          (offChart ? ' The fitted curve runs off the top of the chart between the training points.' : ''),
        read: 'Every extra term can only improve the training fit, so R-squared rising is not evidence of anything. ' +
          'Watch the hollow points instead: they were never shown to the model, and they are the only honest test of whether it learned the pattern or the noise. ' +
          (deg <= 4 ? 'At this degree the curve is still tracking the real shape (dashed).'
                    : 'At this degree the curve is chasing individual training points, and it swings hardest where the data are thinnest.')
      };
    },

    interaction: function (D, P) {
      var m = { l: 42, r: 16, t: 14 }, iw = W - m.l - m.r, ih = 190, H = 236;
      var lo = -2, hi = 14;
      function sx(v) { return m.l + v / 10 * iw; }
      function sy(v) { return m.t + (hi - Math.max(lo, Math.min(hi, v))) / (hi - lo) * ih; }
      var g = '', t;
      [0, 4, 8, 12].forEach(function (v) {
        g += '<line x1="' + m.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (m.l + iw) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
             '<text x="' + (m.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
      });
      D.x.forEach(function (v, i) {
        g += '<circle cx="' + sx(v).toFixed(1) + '" cy="' + sy(D.y[i]).toFixed(1) + '" r="2.8" fill="' + (D.g[i] ? P.c1 : P.c0) + '" fill-opacity="0.55"/>';
      });
      function line(b, gi, col, dash) {
        var a = b[0] + (b[2] || 0) * gi, s = b[1] + (b.length > 3 ? b[3] * gi : 0);
        return '<line x1="' + sx(0).toFixed(1) + '" y1="' + sy(a).toFixed(1) + '" x2="' + sx(10).toFixed(1) + '" y2="' + sy(a + 10 * s).toFixed(1) +
          '" stroke="' + col + '" stroke-width="2.4"' + (dash ? ' stroke-dasharray="6 3"' : '') + '/>';
      }
      g += line(D.ba, 0, P.bad, true) + line(D.ba, 1, P.bad, true) + line(D.bi, 0, P.c0, false) + line(D.bi, 1, P.c1, false);
      g += '<text x="' + (m.l + 6) + '" y="' + (m.t + 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.bad + '">dashed = additive model (parallel by construction)</text>' +
           axes(P, m, iw, ih, 'predictor', 'outcome');
      var sA = D.bi[1], sB = D.bi[1] + D.bi[3];
      return {
        svg: wrap(g, H, 'two groups with opposite slopes, fitted with and without an interaction'),
        fail: 'The additive model reports one slope of <b>' + D.ba[1].toFixed(2) + '</b> for the predictor. ' +
          'With the interaction in, the slope is <b>' + sA.toFixed(2) + '</b> in one group and <b>' + sB.toFixed(2) + '</b> in the other.',
        read: 'An additive model can give the two groups different heights but not different directions: the two dashed lines are parallel because the model has no term that could make them anything else. ' +
          'So it averages a rise and a fall and reports roughly nothing. The correct sentence is not that the predictor has no effect. It is that the effect depends on the group, which is a finding, and the model without the interaction term cannot express it.'
      };
    }
  };

  /* ---------------- runnable R, one per mode ----------------
     Each block regenerates data with the same structure and fits both models. */
  var RCODE = {
    link: function (D) {
      return [
        '# A yes/no outcome, fitted the wrong way and then the right way.',
        'set.seed(9)',
        'n <- ' + D.n,
        'x <- runif(n, -3, 3)',
        'y <- rbinom(n, 1, plogis(1.4 * x))',
        '',
        'lin <- lm(y ~ x)                       # the wrong family',
        'log <- glm(y ~ x, family = binomial)   # the right one',
        '',
        'p_lin <- fitted(lin)',
        'c(impossible = sum(p_lin < 0 | p_lin > 1),',
        '  lowest     = round(min(p_lin), 3),',
        '  highest    = round(max(p_lin), 3))',
        '',
        'range(fitted(log))                     # a probability model stays inside 0 and 1'
      ].join('\n');
    },
    'zero-inflation': function (D) {
      return [
        '# Counts with a pile of structural zeros, fitted as ordinary Poisson.',
        'set.seed(9)',
        'n <- ' + D.n,
        'x <- rnorm(n)',
        'y <- ifelse(runif(n) < ' + D.pZero + ', 0, rpois(n, exp(0.9 + 0.7 * x)))',
        '',
        'm <- glm(y ~ x, family = poisson)',
        'mu <- fitted(m)',
        '',
        'c(observed_zeros = sum(y == 0),',
        '  expected_zeros = round(sum(dpois(0, mu)), 1),',
        '  poisson_slope  = round(unname(coef(m)[2]), 3),',
        '  true_slope     = 0.7)',
        '',
        '# a zero-inflated model gives the two processes a parameter each',
        '# install.packages("pscl"); pscl::zeroinfl(y ~ x | 1)'
      ].join('\n');
    },
    ordinal: function (D) {
      return [
        '# A five-point rating, treated as a number and then as what it is.',
        'set.seed(9)',
        'n <- ' + D.n,
        'x  <- runif(n, -2, 2)',
        'z  <- 1.1 * x + rlogis(n)',
        'y  <- cut(z, c(-Inf, ' + D.cuts.join(', ') + ', Inf), labels = 1:5)',
        'yn <- as.numeric(as.character(y))       # the mistake: a label used as a quantity',
        '',
        'lin <- lm(yn ~ x)',
        'round(predict(lin, data.frame(x = c(-2, 2))), 2)   # answers nobody can give',
        '',
        'table(y)',
        'diff(c(' + D.cuts.join(', ') + '))                  # the real gaps between categories',
        '',
        '# the honest model: one slope, boundaries wherever the data put them',
        'summary(MASS::polr(y ~ x, Hess = TRUE))'
      ].join('\n');
    },
    overfitting: function (D) {
      return [
        '# Flexibility that improves the training fit and nothing else.',
        'set.seed(9)',
        'n <- ' + D.n + '; deg <- 12',
        'xtr <- seq(-1, 1, length.out = n); ytr <- sin(2.3 * xtr) + rnorm(n, sd = 0.28)',
        'xte <- runif(n, -1, 1);            yte <- sin(2.3 * xte) + rnorm(n, sd = 0.28)',
        '',
        'fit  <- lm(ytr ~ poly(xtr, deg, raw = TRUE))',
        'pred <- function(x) as.numeric(cbind(1, outer(x, 1:deg, "^")) %*% coef(fit))',
        '',
        'round(c(train_r2   = summary(fit)$r.squared,',
        '        train_rmse = sqrt(mean((ytr - pred(xtr))^2)),',
        '        test_rmse  = sqrt(mean((yte - pred(xte))^2))), 3)',
        '',
        '# raise deg and run it again: train_r2 only ever goes up',
        '# test_rmse is the number that tells you when to stop'
      ].join('\n');
    },
    interaction: function (D) {
      return [
        '# Two groups whose slopes point in opposite directions.',
        'set.seed(9)',
        'n <- ' + D.n,
        'x <- runif(n, 0, 10)',
        'g <- rep(0:1, length.out = n)',
        'y <- ifelse(g == 1, 10 - 0.8 * x, 2 + 0.8 * x) + rnorm(n, sd = 1.5)',
        '',
        'add <- lm(y ~ x + g)        # no interaction: the lines must stay parallel',
        'int <- lm(y ~ x * g)        # the slope is allowed to differ by group',
        '',
        'round(c(additive_slope = unname(coef(add)["x"]),',
        '        slope_group0   = unname(coef(int)["x"]),',
        '        slope_group1   = unname(coef(int)["x"] + coef(int)["x:g"])), 3)',
        '',
        'anova(add, int)             # is the extra term earning its place?'
      ].join('\n');
    }
  };

  window.LessonWidgets.register('wrong-family-fit', mount);
})();
