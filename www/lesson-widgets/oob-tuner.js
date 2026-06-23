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
