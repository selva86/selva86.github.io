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
