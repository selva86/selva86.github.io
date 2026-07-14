/* roc-auc-ui.js - ROC/AUC calculator UI controller (compute wiring, SVG render, scenarios,
 * R-code emitter). Depends on window.RocMath (roc-math.js), window.RocData (roc-auc-data.js)
 * and the inline window.RocGA shim. Externalized to keep the rendered page under budget. */
(function () {
  'use strict';
  var RM = window.RocMath;
  function $(id) { return document.getElementById(id); }
  function fx(x, d) { d = (d == null ? 3 : d); if (x == null || !isFinite(x)) return '-'; return Number(x).toFixed(d); }

  /* Frozen datasets + scenario copy: loaded from tools/lib/roc-auc-data.js (identical to
     Scripts/tool-truth/roc-auc.json, verified vs pROC; externalized to keep the page small). */
  var _RD = window.RocData || { DATASETS: {}, SCENARIOS: {} };
  var DATASETS = _RD.DATASETS;
  var SCENARIOS = _RD.SCENARIOS;

  /* GA (consent-mode gtag) */
  var _used = false;
  function markUse() { if (_used) return; _used = true; if (window.RocGA) window.RocGA.u(); }
  function markCopy(it) { if (window.RocGA) window.RocGA.c(it); }

  function showToast(msg) {
    var a = $('toast-area'); if (!a) return;
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    a.appendChild(t); setTimeout(function () { t.remove(); }, 3000);
  }

  /* Parse pasted "outcome score" rows (whitespace / comma / semicolon separated). */
  function parsePaste(txt) {
    if (!txt || !txt.trim()) return { err: 'empty' };
    var lines = txt.trim().split(/\r?\n/), y = [], score = [], i;
    for (i = 0; i < lines.length; i++) {
      var ln = lines[i].trim(); if (!ln) continue;
      var parts = ln.split(/[\s,;\t]+/);
      if (parts.length < 2) continue;
      var a = parseFloat(parts[0]), b = parseFloat(parts[1]);
      if (!isFinite(a) || !isFinite(b)) continue;
      if (a !== 0 && a !== 1) continue;
      y.push(a); score.push(b);
    }
    if (y.length < 2) return { err: 'too few rows' };
    return { y: y, score: score };
  }

  var current = null;          // { y, score, res }
  var currentThreshold = 0.5;
  var activeScenario = null;

  function confLevel() { var s = $('conf-level'); var v = s ? parseFloat(s.value) : 95; return (isFinite(v) ? v : 95) / 100; }
  function costRatio() { var v = parseFloat($('cost-ratio').value); return (isFinite(v) && v > 0) ? v : 1; }
  function metricsAt(t) { return RM.metricsAt(current.y, current.score, t); }
  function scoresLookLikeProb() { var sc = current.score; return Math.min.apply(null, sc) >= -1e-4 && Math.max.apply(null, sc) <= 1 + 1e-4; }
  function setPasteMeta(n) { var pm = $('paste-meta'); if (pm) pm.textContent = 'n = ' + (n == null ? 0 : n); }

  function clearOutputs(msg) {
    $('result-bounds').textContent = '-';
    $('result-aux').textContent = msg || 'paste data on the left';
    var vc = $('vchip'); if (vc) { vc.textContent = '-'; vc.className = 'vchip na'; }
    var pb = $('plain-box'); if (pb) pb.innerHTML = 'Paste outcomes (0/1) and predicted scores to see what the AUC means for your data.';
    var rp = $('report'); if (rp) rp.textContent = 'paste data to get a report line';
    $('cmat-area').innerHTML = ''; $('metrics-area').innerHTML = '';
    $('calib-area').textContent = 'paste data to compute the Brier score and reliability bins.';
    $('roc-readout').textContent = 'paste data to draw the curve';
    var rm = $('recap-mini'); if (rm) rm.style.display = 'none';
    ['opt-youden-t', 'opt-f1-t', 'opt-cost-t'].forEach(function (id) { $(id).textContent = '-'; });
    drawROC(); drawDist();
    var ib = $('inference-banner'); if (ib) ib.innerHTML = 'Paste outcomes (0/1) and predicted scores on the left to see the AUC, optimal thresholds and a live confusion matrix.';
  }

  function recompute() {
    var parsed = parsePaste($('paste-input').value);
    if (parsed.err) { current = null; setPasteMeta(0); clearOutputs(parsed.err === 'empty' ? 'paste data on the left' : 'parse error: ' + parsed.err); return; }
    setPasteMeta(parsed.y.length);
    var res = RM.analyze(parsed.y, parsed.score, { conf: confLevel(), costRatio: costRatio() });
    if (res.error) { current = null; clearOutputs(res.error === 'need both classes' ? 'need at least one positive and one negative row' : 'compute error'); return; }
    current = { y: parsed.y, score: parsed.score, res: res };
    markUse();
    currentThreshold = isFinite(res.youden.t) ? res.youden.t : 0.5;
    renderAll();
    if (res.n < 10) showToast('Small n: the AUC CI is wide and unstable.');
    else if (res.auc >= 0.99999) showToast('AUC = 1.0: perfect separation, CI degenerate.');
  }

  function renderAll() {
    renderHeader(); renderOpts(); syncSlider();
    drawROC(); drawDist(); drawThresholdMarker();
    renderConfusion(); renderCalibration(); renderRecap();
    renderInference(); renderVerdict(); updateRCode();
  }

  function renderHeader() {
    var r = current.res, ci = r.ci, hasCI = isFinite(ci.lo) && r.se > 0;
    $('result-bounds').innerHTML = '<span>' + fx(r.auc, 3) + '</span>' +
      (hasCI ? ' <span class="ci-sep">' + Math.round(ci.conf * 100) + '% CI</span> <span>[' + fx(ci.lo, 3) + ', ' + fx(ci.hi, 3) + ']</span>' : '');
    $('result-aux').innerHTML = 'n = <b>' + r.n + '</b> (n+ = ' + r.n_pos + ', n- = ' + r.n_neg + ') &middot; SE = <b>' + fx(r.se, 4) + '</b> &middot; DeLong';
  }

  function renderVerdict() {
    if (!current) return;
    var r = current.res, auc = r.auc, ci = r.ci, hasCI = isFinite(ci.lo) && r.se > 0, y = r.youden;
    var vc = $('vchip');
    if (vc) {
      var word = auc >= 0.9 ? 'Excellent' : auc >= 0.8 ? 'Good' : auc >= 0.7 ? 'Fair' : auc >= 0.6 ? 'Modest' : 'Near-random';
      vc.textContent = word + ' discrimination';
      vc.className = 'vchip' + (auc >= 0.7 ? '' : ' na');
    }
    var pb = $('plain-box');
    if (pb) {
      var pct = Math.round(auc * 100);
      pb.innerHTML = 'Pick one positive and one negative case at random: the model gives the positive the higher score about <b>' + pct + '%</b> of the time. That is exactly what AUC = <b>' + fx(auc, 3) + '</b> means. ' +
        (auc >= 0.8 ? 'That is strong separation between the classes.' : auc >= 0.7 ? 'That is fair separation, so the threshold you pick still matters.' : 'That is close to guessing, so ranking alone will not carry the model.');
    }
    var rp = $('report');
    if (rp) {
      rp.textContent = 'AUC = ' + fx(auc, 3) + (hasCI ? ', ' + Math.round(ci.conf * 100) + '% DeLong CI [' + fx(ci.lo, 3) + ', ' + fx(ci.hi, 3) + ']' : '') +
        ', n = ' + r.n + ' (' + r.n_pos + ' pos / ' + r.n_neg + ' neg)' + (isFinite(y.t) ? '; Youden threshold ' + fx(y.t, 3) + ' (sens ' + fx(y.sens, 2) + ', spec ' + fx(y.spec, 2) + ')' : '') + '.';
    }
  }

  function renderOpts() {
    var r = current.res;
    $('opt-youden-t').textContent = fx(r.youden.t, 3);
    $('opt-youden-d').textContent = 'sens=' + fx(r.youden.sens, 2) + ' / spec=' + fx(r.youden.spec, 2);
    $('opt-f1-t').textContent = fx(r.f1.t, 3);
    $('opt-f1-d').textContent = 'F1=' + fx(r.f1.f1, 3);
    $('opt-cost-t').textContent = fx(r.cost.t, 3);
    $('opt-cost-d').textContent = 'cost=' + fx(r.cost.value, 1);
    document.querySelectorAll('.opt-card').forEach(function (c) { c.classList.toggle('active', c.dataset.opt === 'youden'); });
  }

  function setThresholdFromOpt(which) {
    if (!current) return;
    var r = current.res, t = which === 'youden' ? r.youden.t : which === 'f1' ? r.f1.t : r.cost.t;
    if (!isFinite(t)) return;
    currentThreshold = t;
    document.querySelectorAll('.opt-card').forEach(function (c) { c.classList.toggle('active', c.dataset.opt === which); });
    syncSlider(); drawThresholdMarker(); renderConfusion(); renderInference();
  }

  function finiteGrid() { return current.res.points.map(function (p) { return p.t; }).filter(isFinite); }

  function syncSlider() {
    var sl = $('thresh-slider'); if (!sl || !current) return;
    var sc = current.score, mn = Math.min.apply(null, sc), mx = Math.max.apply(null, sc);
    var t = isFinite(currentThreshold) ? currentThreshold : (mn + mx) / 2;
    sl.value = Math.max(0, Math.min(100, mx > mn ? (t - mn) / (mx - mn) * 100 : 50));
    $('thresh-val').textContent = fx(currentThreshold, 3);
  }

  function renderConfusion() {
    if (!current) return;
    var m = metricsAt(currentThreshold);
    $('cmat-area').innerHTML =
      '<div class="cmat" aria-label="confusion matrix at threshold ' + fx(currentThreshold, 3) + '">' +
      '<div class="cmh"></div><div class="cmh">Actual +</div><div class="cmh">Actual -</div>' +
      '<div class="cmrowlbl">Pred +</div>' +
      '<div class="cmcell tp"><div class="cmcount">' + m.TP + '</div><div class="cmlbl">TP</div></div>' +
      '<div class="cmcell fp"><div class="cmcount">' + m.FP + '</div><div class="cmlbl">FP</div></div>' +
      '<div class="cmrowlbl">Pred -</div>' +
      '<div class="cmcell fn"><div class="cmcount">' + m.FN + '</div><div class="cmlbl">FN</div></div>' +
      '<div class="cmcell tn"><div class="cmcount">' + m.TN + '</div><div class="cmlbl">TN</div></div></div>';
    var den = Math.sqrt((m.TP + m.FP) * (m.TP + m.FN) * (m.TN + m.FP) * (m.TN + m.FN));
    var mcc = den > 0 ? (m.TP * m.TN - m.FP * m.FN) / den : NaN;
    $('metrics-area').innerHTML =
      '<div class="metrics-mini">' +
      '<div class="mm-row"><span class="mm-key">Acc</span><span class="mm-val">' + fx(m.acc, 3) + '</span></div>' +
      '<div class="mm-row"><span class="mm-key">F1</span><span class="mm-val">' + fx(m.f1, 3) + '</span></div>' +
      '<div class="mm-row"><span class="mm-key">Sens</span><span class="mm-val">' + fx(m.sens, 3) + '</span></div>' +
      '<div class="mm-row"><span class="mm-key">Spec</span><span class="mm-val">' + fx(m.spec, 3) + '</span></div>' +
      '<div class="mm-row"><span class="mm-key">PPV</span><span class="mm-val">' + fx(m.ppv, 3) + '</span></div>' +
      '<div class="mm-row"><span class="mm-key">NPV</span><span class="mm-val">' + fx(m.npv, 3) + '</span></div>' +
      '<div class="mm-row"><span class="mm-key">MCC</span><span class="mm-val">' + fx(mcc, 3) + '</span></div>' +
      '</div>';
  }

  function renderRecap() {
    if (!current) return;
    var r = current.res, U = Math.round(r.auc * r.n_pos * r.n_neg);
    $('recap-rows').innerHTML =
      '<div class="recap-mini-row"><span class="key">U</span><span class="val">' + U + '</span></div>' +
      '<div class="recap-mini-row"><span class="key">n+ &middot; n-</span><span class="val">' + r.n_pos + ' &middot; ' + r.n_neg + '</span></div>' +
      '<div class="recap-mini-row"><span class="key">SE</span><span class="val">' + fx(r.se, 5) + '</span></div>' +
      '<div class="recap-mini-row"><span class="key">t</span><span class="val">' + fx(currentThreshold, 3) + '</span></div>';
    $('recap-mini').style.display = 'block';
  }

  function renderCalibration() {
    if (!current) return;
    if (!scoresLookLikeProb()) {
      $('calib-area').innerHTML = '<em>Scores are outside [0, 1], so calibration is not defined. Brier and reliability bins need predicted probabilities.</em>';
      return;
    }
    var r = current.res, bins = r.calib;
    var svg = '<svg viewBox="0 0 360 200" style="width:100%;max-width:480px;height:200px;background:var(--panel);border:1px solid var(--line2);border-radius:6px" aria-label="reliability diagram">';
    svg += '<line class="ax" x1="40" y1="170" x2="340" y2="170"/><line class="ax" x1="40" y1="20" x2="40" y2="170"/>';
    svg += '<line x1="40" y1="170" x2="340" y2="20" stroke="#c9c9c2" stroke-dasharray="3 3"/>';
    for (var i = 0; i < bins.length; i++) {
      var b = bins[i], cx = 40 + b.mean_score * 300, cy = 170 - b.mean_y * 150;
      svg += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + Math.max(2.5, Math.sqrt(b.n)).toFixed(1) + '" fill="#1f7a55" opacity="0.7"/>';
    }
    svg += '<text class="ax-label" x="190" y="195" text-anchor="middle">predicted probability</text>';
    svg += '<text class="ax-label" x="15" y="95" text-anchor="middle" transform="rotate(-90 15 95)">empirical rate</text></svg>';
    $('calib-area').innerHTML = '<p style="margin-bottom:10px"><strong>Brier score:</strong> <code>' + fx(r.brier, 4) +
      '</code> (lower is better; max for a binary outcome is 0.25). Each dot is a decile of predicted probability; a well-calibrated model sits on the diagonal.</p>' + svg;
  }

  function renderInference() {
    var el = $('inference-banner'); if (!el || !current) return;
    var r = current.res, auc = r.auc, n = r.n;
    var ci = r.ci, hasCI = isFinite(ci.lo) && r.se > 0;
    var word = auc >= 0.9 ? 'excellent' : auc >= 0.8 ? 'good' : auc >= 0.7 ? 'fair' : auc >= 0.6 ? 'modest' : 'near-random';
    var art = word === 'excellent' ? 'an' : 'a';
    var cls = auc >= 0.8 ? 'sig' : (auc <= 0.6 ? 'insig' : '');
    var ciTxt = hasCI ? ' with a ' + Math.round(ci.conf * 100) + '% DeLong CI of <b>[' + fx(ci.lo, 3) + ', ' + fx(ci.hi, 3) + ']</b>' : '';
    var y = r.youden;
    var yTxt = isFinite(y.t) ? ' The Youden-optimal cutoff is <b>' + fx(y.t, 3) + '</b> (sens=<b>' + fx(y.sens, 2) + '</b>, spec=<b>' + fx(y.spec, 2) + '</b>).' : '';
    var m = metricsAt(currentThreshold);
    var mTxt = ' At the current threshold <b>' + fx(currentThreshold, 3) + '</b>: TP/FP/FN/TN = <b>' + m.TP + '</b>/<b>' + m.FP + '</b>/<b>' + m.FN + '</b>/<b>' + m.TN + '</b> (accuracy=<b>' + fx(m.acc, 3) + '</b>).';
    el.innerHTML = 'On <b>n=' + n + '</b> cases (<b>' + r.n_pos + '</b> positives, <b>' + r.n_neg + '</b> negatives), AUC = <span class="' + cls + '"><b>' + fx(auc, 3) + '</b></span>' + ciTxt + ', ' + art + ' <em>' + word + '</em> level of discrimination.' + yTxt + mTxt;
  }

  /* ---------------- SVG: ROC curve ---------------- */
  function svgEl(name) { return document.createElementNS('http://www.w3.org/2000/svg', name); }
  function drawROC() {
    var svg = $('roc-svg'); if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 360, H = 200, mx = 40, my = 20, w = W - mx - 20, h = H - my - 30;
    function ax(x1, y1, x2, y2, cls) { var e = svgEl('line'); e.setAttribute('x1', x1); e.setAttribute('y1', y1); e.setAttribute('x2', x2); e.setAttribute('y2', y2); e.setAttribute('class', cls); svg.appendChild(e); }
    function txt(x, y, t, cls, anchor) { var e = svgEl('text'); e.setAttribute('x', x); e.setAttribute('y', y); e.setAttribute('class', cls || 'ax-label'); if (anchor) e.setAttribute('text-anchor', anchor); e.textContent = t; svg.appendChild(e); }
    ax(mx, my, mx, my + h, 'ax'); ax(mx, my + h, mx + w, my + h, 'ax');
    for (var f = 0; f <= 1.01; f += 0.25) {
      var xx = mx + f * w, yy = my + h - f * h;
      ax(xx, my + h, xx, my + h + 3, 'ax'); ax(mx - 3, yy, mx, yy, 'ax');
      txt(xx, my + h + 13, fx(f, 2), 'tick-label', 'middle'); txt(mx - 6, yy + 3, fx(f, 2), 'tick-label', 'end');
    }
    txt(mx + w / 2, my + h + 24, 'FPR', 'ax-label', 'middle'); txt(8, my + h / 2, 'TPR', 'ax-label', 'middle');
    ax(mx, my + h, mx + w, my, 'ax');   // diagonal
    if (!current) return;
    var pts = current.res.points.slice().sort(function (a, b) { return a.fpr - b.fpr || a.tpr - b.tpr; });
    var d = 'M ' + mx + ',' + (my + h), i;
    for (i = 0; i < pts.length; i++) d += ' L ' + (mx + pts[i].fpr * w).toFixed(2) + ',' + (my + h - pts[i].tpr * h).toFixed(2);
    var fill = svgEl('path'); fill.setAttribute('d', d + ' L ' + (mx + w) + ',' + (my + h) + ' Z'); fill.setAttribute('fill', 'rgba(31,122,85,0.12)'); svg.appendChild(fill);
    var lp = svgEl('path'); lp.setAttribute('d', d); lp.setAttribute('fill', 'none'); lp.setAttribute('stroke', '#1f7a55'); lp.setAttribute('stroke-width', '2'); svg.appendChild(lp);
    drawThresholdMarker();
  }

  function drawThresholdMarker() {
    var svg = $('roc-svg'); if (!svg || !current) return;
    svg.querySelectorAll('.thresh-marker').forEach(function (e) { e.remove(); });
    var W = 360, H = 200, mx = 40, my = 20, w = W - mx - 20, h = H - my - 30;
    var m = metricsAt(currentThreshold), fpr = 1 - m.spec, tpr = m.sens;
    var dot = svgEl('circle'); dot.setAttribute('cx', (mx + fpr * w).toFixed(2)); dot.setAttribute('cy', (my + h - tpr * h).toFixed(2));
    dot.setAttribute('r', 5); dot.setAttribute('fill', '#fff'); dot.setAttribute('stroke', '#155c40'); dot.setAttribute('stroke-width', '2'); dot.setAttribute('class', 'thresh-marker');
    svg.appendChild(dot);
    $('roc-readout').innerHTML = 't = <b>' + fx(currentThreshold, 3) + '</b> &middot; TPR = <b>' + fx(tpr, 3) + '</b> &middot; FPR = <b>' + fx(fpr, 3) + '</b>';
    $('thresh-val').textContent = fx(currentThreshold, 3);
    drawDistMarker();
  }

  /* ---------------- SVG: score distribution ---------------- */
  function drawDist() {
    var svg = $('dist-svg'); if (!svg) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (!current) return;
    var y = current.y, score = current.score;
    var W = 360, H = 120, mx = 30, my = 10, w = W - mx - 15, h = H - my - 25;
    function line(x1, y1, x2, y2) { var e = svgEl('line'); e.setAttribute('x1', x1); e.setAttribute('y1', y1); e.setAttribute('x2', x2); e.setAttribute('y2', y2); e.setAttribute('stroke', '#e6e6e0'); svg.appendChild(e); }
    line(mx, my + h, mx + w, my + h);
    var mn = Math.min.apply(null, score), mxs = Math.max.apply(null, score), range = mxs - mn || 1, nBin = 30;
    var bp = new Array(nBin).fill(0), bn = new Array(nBin).fill(0), i, k;
    for (i = 0; i < score.length; i++) { k = Math.min(nBin - 1, Math.floor((score[i] - mn) / range * nBin)); if (y[i] === 1) bp[k]++; else bn[k]++; }
    var maxC = Math.max.apply(null, bp.concat(bn).concat([1]));
    function bars(arr, color) {
      for (var kk = 0; kk < nBin; kk++) {
        var v = arr[kk]; if (!v) continue;
        var r = svgEl('rect'); r.setAttribute('x', (mx + (kk / nBin) * w).toFixed(2)); r.setAttribute('y', (my + h - (v / maxC) * h).toFixed(2));
        r.setAttribute('width', (w / nBin - 0.5).toFixed(2)); r.setAttribute('height', ((v / maxC) * h).toFixed(2)); r.setAttribute('fill', color); r.setAttribute('opacity', 0.55); svg.appendChild(r);
      }
    }
    bars(bn, '#8a6d1f'); bars(bp, '#1f7a55');
    function legend(x, yy, c, t) {
      var r = svgEl('rect'); r.setAttribute('x', x); r.setAttribute('y', yy); r.setAttribute('width', 8); r.setAttribute('height', 8); r.setAttribute('fill', c); r.setAttribute('opacity', 0.7); svg.appendChild(r);
      var tt = svgEl('text'); tt.setAttribute('x', x + 12); tt.setAttribute('y', yy + 8); tt.setAttribute('class', 'tick-label'); tt.textContent = t; svg.appendChild(tt);
    }
    legend(mx, my, '#1f7a55', 'positives'); legend(mx + 72, my, '#8a6d1f', 'negatives');
    for (var f = 0; f <= 1.01; f += 0.25) {
      var tx = mx + f * w, tt = svgEl('text'); tt.setAttribute('x', tx); tt.setAttribute('y', my + h + 12); tt.setAttribute('class', 'tick-label'); tt.setAttribute('text-anchor', 'middle'); tt.textContent = fx(mn + f * range, 2); svg.appendChild(tt);
    }
    drawDistMarker();
  }

  function drawDistMarker() {
    var svg = $('dist-svg'); if (!svg || !current) return;
    svg.querySelectorAll('.dist-marker').forEach(function (e) { e.remove(); });
    var score = current.score, mn = Math.min.apply(null, score), mxs = Math.max.apply(null, score), range = mxs - mn || 1;
    var W = 360, H = 120, mx = 30, my = 10, w = W - mx - 15, h = H - my - 25;
    var x = mx + Math.max(0, Math.min(1, (currentThreshold - mn) / range)) * w;
    var ln = svgEl('line'); ln.setAttribute('x1', x); ln.setAttribute('y1', my); ln.setAttribute('x2', x); ln.setAttribute('y2', my + h);
    ln.setAttribute('stroke', '#a8322c'); ln.setAttribute('stroke-width', 1.5); ln.setAttribute('stroke-dasharray', '3 2'); ln.setAttribute('class', 'dist-marker'); svg.appendChild(ln);
  }

  /* ---------------- R code (static, reproduces the displayed numbers) ------ */
  function rvec(a) { return 'c(' + a.join(', ') + ')'; }
  function updateRCode() {
    var el = $('r-code-roc'); if (!el) return;
    if (!current) { el.textContent = 'library(pROC)\n# paste data to generate reproducible R code'; return; }
    var r = current.res, conf = confLevel();
    var txt =
      'library(pROC)\n\n' +
      'y     <- ' + rvec(current.y) + '\n' +
      'score <- ' + rvec(current.score) + '\n\n' +
      'roc_obj <- roc(response = y, predictor = score, direction = "<",\n' +
      '               levels = c(0, 1), ci = TRUE, quiet = TRUE)\n\n' +
      'auc(roc_obj)                                  # ' + fx(r.auc, 4) + '\n' +
      'ci.auc(roc_obj, method = "delong", conf.level = ' + conf.toFixed(2) + ')\n' +
      '#> ' + fx(r.ci.lo, 4) + '  ' + fx(r.auc, 4) + '  ' + fx(r.ci.hi, 4) + '\n\n' +
      '# Optimal threshold (Youden J)\n' +
      'coords(roc_obj, "best", best.method = "youden",\n' +
      '       ret = c("threshold", "sensitivity", "specificity"))\n' +
      '#> threshold = ' + fx(r.youden.t, 4) + '\n\n' +
      '# Brier score (scores must be probabilities)\n' +
      'mean((score - y)^2)                           # ' + fx(r.brier, 4) + '\n';
    el.textContent = txt;
  }

  function copyRCode(btn) {
    var el = $('r-code-roc'); if (!el) return;
    var txt = el.textContent;
    function done() { var o = btn.textContent; btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = o; }, 1600); markCopy('r-code'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
    else { fallbackCopy(txt); done(); }
  }
  function fallbackCopy(txt) { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) { } ta.remove(); }

  /* ---------------- Scenarios ---------------- */
  function loadScenario(key) {
    activeScenario = key;
    document.querySelectorAll('.scenario-card').forEach(function (c) { c.classList.toggle('active', c.dataset.scenario === key); });
    var s = SCENARIOS[key], ctx = $('scenario-context');
    if (s && ctx) {
      $('sc-icon').textContent = s.icon; $('sc-title').textContent = s.title; $('sc-story').textContent = s.story;
      ctx.classList.add('show');
    }
    if (s && !s.custom && DATASETS[key]) {
      var ds = DATASETS[key], rows = [], i;
      for (i = 0; i < ds.y.length; i++) rows.push(ds.y[i] + '\t' + ds.score[i]);
      $('paste-input').value = rows.join('\n');
      recompute();
    } else {
      $('paste-input').value = ''; $('paste-input').focus(); setPasteMeta(0); clearOutputs('paste your data on the left'); current = null;
    }
  }
  function clearScenario() {
    activeScenario = null;
    document.querySelectorAll('.scenario-card').forEach(function (c) { c.classList.remove('active'); });
    var ctx = $('scenario-context'); if (ctx) ctx.classList.remove('show');
  }

  /* ---------------- Wiring ---------------- */
  var sl = $('thresh-slider');
  if (sl) sl.addEventListener('input', function (e) {
    if (!current) return;
    var sc = current.score, mn = Math.min.apply(null, sc), mxs = Math.max.apply(null, sc);
    if (mxs === mn) return;
    var target = mn + (parseFloat(e.target.value) / 100) * (mxs - mn);
    var grid = finiteGrid(), best = target, bd = Infinity;
    for (var i = 0; i < grid.length; i++) { var dd = Math.abs(grid[i] - target); if (dd < bd) { bd = dd; best = grid[i]; } }
    currentThreshold = best;
    drawThresholdMarker(); renderConfusion(); renderInference();
    document.querySelectorAll('.opt-card').forEach(function (c) { c.classList.remove('active'); });
  });
  if ($('conf-level')) $('conf-level').addEventListener('change', function () { var f = $('conf-face'); if (f) f.textContent = this.value; recompute(); });
  if ($('cost-ratio')) $('cost-ratio').addEventListener('input', recompute);
  if ($('paste-input')) $('paste-input').addEventListener('input', recompute);
  var rcb = $('report-copy');
  if (rcb) rcb.addEventListener('click', function () {
    var el = $('report'); if (!el) return;
    var txt = el.textContent, self = this;
    function done() { var o = self.textContent; self.textContent = 'Copied'; setTimeout(function () { self.textContent = o; }, 1600); markCopy('report'); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function () { fallbackCopy(txt); done(); });
    else { fallbackCopy(txt); done(); }
  });

  // expose handlers used by inline markup
  window.recompute = recompute;
  window.loadScenario = loadScenario;
  window.clearScenario = clearScenario;
  window.setThresholdFromOpt = setThresholdFromOpt;
  window.copyRCode = copyRCode;

  function init() { loadScenario('breast'); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
