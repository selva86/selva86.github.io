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
