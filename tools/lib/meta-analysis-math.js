/* meta-analysis-math.js - fixed-effect and DerSimonian-Laird random-effects
   pooling for tools/meta-analysis-quick-tool.html.

   Verified against R metafor 5.0.1 in Scripts/tool-truth/meta-analysis-quick-tool.R:
     fixed effect    rma(yi, sei=, method="FE")
     random effects  rma(yi, sei=, method="DL")
     2x2 counts      escalc(measure="OR", ai=, bi=, ci=, di=)
     per-study %     weights(res)

   Depends on normal-math.js (qnorm/pnorm) and chisq-math.js (pchisqUpper).

   The DL identity this file leans on, worth stating once:
     tau2 = (Q - df) / C   with   C = sum(w) - sum(w^2)/sum(w)
     the "typical" within-study variance is  s2 = df / C
     so  I2 = tau2/(tau2+s2) = (Q-df)/Q
   metafor computes I2 the first way, this file the second; the truth table
   confirms they agree to ~1e-15. That is why one clamp, max(0, .), serves both.

   metafor defaults reproduced here deliberately (probed, not assumed):
     escalc add=1/2, to="only0", drop00=FALSE
       -> a study with ANY zero cell gets 0.5 added to ALL FOUR of its cells;
          studies with no zero cell are left alone.
     rma test="z" -> CI = est +/- qnorm(1-alpha/2) * se
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'), require('./chisq-math.js'));
  } else {
    root.MetaMath = factory(root.NormalMath, root.ChisqMath);
  }
}(typeof self !== 'undefined' ? self : this, function (N, X) {
  'use strict';

  var qnorm = N.qnorm, pnorm = N.pnorm;
  var pchisqUpper = X.pchisqUpper;

  // ---- 2x2 counts -> log odds ratio -----------------------------------
  // ai = events treated, bi = non-events treated,
  // ci = events control, di = non-events control.
  function escalcOR(et, nt, ec, nc) {
    var ai = et, bi = nt - et, ci = ec, di = nc - ec;
    var adjusted = (ai === 0 || bi === 0 || ci === 0 || di === 0);
    var a = ai, b = bi, c = ci, d = di;
    if (adjusted) { a += 0.5; b += 0.5; c += 0.5; d += 0.5; }
    return {
      ai: ai, bi: bi, ci: ci, di: di,
      a: a, b: b, c: c, d: d,
      adjusted: adjusted,
      yi: Math.log((a * d) / (b * c)),
      vi: 1 / a + 1 / b + 1 / c + 1 / d,
      sei: Math.sqrt(1 / a + 1 / b + 1 / c + 1 / d)
    };
  }

  // ---- the pool --------------------------------------------------------
  // studies: [{label, yi, sei}]  level: 90 | 95 | 99
  function analyze(studies, level) {
    var k = studies.length;
    var lev = level == null ? 95 : level;
    var zc = qnorm(1 - (1 - lev / 100) / 2);

    var yi = studies.map(function (s) { return s.yi; });
    var vi = studies.map(function (s) { return s.sei * s.sei; });

    // --- fixed effect: inverse-variance weights ---
    var w = vi.map(function (v) { return 1 / v; });
    var sumW = w.reduce(add, 0);
    var sumW2 = w.reduce(function (t, x) { return t + x * x; }, 0);
    var sumWY = 0;
    for (var i = 0; i < k; i++) sumWY += w[i] * yi[i];
    var feEst = sumWY / sumW;
    var feSe = Math.sqrt(1 / sumW);

    // --- heterogeneity: Q about the FIXED-effect pool ---
    var Q = 0;
    for (var j = 0; j < k; j++) Q += w[j] * (yi[j] - feEst) * (yi[j] - feEst);
    var df = k - 1;
    var Qp = df > 0 ? pchisqUpper(Q, df) : 1;

    // --- DerSimonian-Laird tau^2 ---
    var C = sumW - sumW2 / sumW;
    var tau2 = C > 0 ? Math.max(0, (Q - df) / C) : 0;
    var I2 = Q > df && Q > 0 ? 100 * (Q - df) / Q : 0;

    // --- random effects: re-weight by 1/(vi + tau2) ---
    var wr = vi.map(function (v) { return 1 / (v + tau2); });
    var sumWr = wr.reduce(add, 0);
    var sumWrY = 0;
    for (var m = 0; m < k; m++) sumWrY += wr[m] * yi[m];
    var reEst = sumWrY / sumWr;
    var reSe = Math.sqrt(1 / sumWr);

    return {
      k: k, level: lev, zcrit: zc,
      studies: studies.map(function (s, idx) {
        return {
          label: s.label, yi: s.yi, sei: s.sei, vi: vi[idx],
          lo: s.yi - zc * s.sei, hi: s.yi + zc * s.sei,
          wFE: w[idx], wRE: wr[idx],
          pctFE: 100 * w[idx] / sumW,
          pctRE: 100 * wr[idx] / sumWr,
          counts: s.counts || null
        };
      }),
      fe: model(feEst, feSe, zc),
      re: model(reEst, reSe, zc),
      het: {
        Q: Q, df: df, Qp: Qp, I2: I2, tau2: tau2, C: C,
        tau: Math.sqrt(tau2), sumW: sumW, sumW2: sumW2
      }
    };
  }

  function add(t, x) { return t + x; }

  function model(est, se, zc) {
    var z = est / se;
    return {
      est: est, se: se,
      lo: est - zc * se, hi: est + zc * se,
      z: z, p: 2 * (1 - pnorm(Math.abs(z)))
    };
  }

  // ---- parsing ---------------------------------------------------------
  // Accepts comma, tab, semicolon or run-of-spaces separated rows. The label
  // may be omitted; it is then auto-filled as "Study n". A leading header row
  // is skipped only when EVERY numeric slot in it fails to parse, so a real
  // typo in row 1 still raises an error instead of being silently eaten.
  var SEP = /\s*[,;\t]\s*|\s{2,}|\s+/;

  function splitRow(line) {
    return line.trim().split(SEP).filter(function (t) { return t !== ''; });
  }

  function num(tok) {
    if (tok == null) return NaN;
    var t = String(tok).replace(/[%\s]/g, '').replace(/^\+/, '');
    if (t === '' || !/^-?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(t)) return NaN;
    return parseFloat(t);
  }

  function isHeader(cells, mode) {
    var need = mode === 'counts' ? 4 : 2;
    var nums = cells.slice(Math.max(0, cells.length - need))
      .filter(function (c) { return !isNaN(num(c)); });
    return nums.length === 0;
  }

  function parse(text, mode) {
    var out = { studies: [], error: null };
    var raw = String(text == null ? '' : text).split(/\r?\n/);
    var lines = [];
    for (var i = 0; i < raw.length; i++) {
      if (raw[i].trim() !== '') lines.push({ n: i + 1, s: raw[i] });
    }
    if (!lines.length) {
      out.error = 'Nothing to pool yet. Paste one row per study, or press a Try button above.';
      return out;
    }
    // header row?
    if (lines.length && isHeader(splitRow(lines[0].s), mode)) lines.shift();

    var wantES = 'Each row needs a study label, the effect, then its standard error, like: Smith 2020, 0.42, 0.15';
    var wantCT = 'Each row needs a label, then events and total for treatment, then events and total for control, like: Trial A, 12, 100, 20, 100';

    for (var L = 0; L < lines.length; L++) {
      var ln = lines[L], cells = splitRow(ln.s);
      var wanted = mode === 'counts' ? 5 : 3, minimum = mode === 'counts' ? 4 : 2;

      if (cells.length < minimum) {
        out.error = 'Line ' + ln.n + ' has only ' + cells.length + ' value' +
          (cells.length === 1 ? '' : 's') + '. ' + (mode === 'counts' ? wantCT : wantES);
        return out;
      }
      if (cells.length > wanted) {
        // A label with spaces is normal ("Smith et al 2020, 0.42, 0.15"): fold
        // the extra leading cells back into the label rather than rejecting.
        var keep = wanted - 1;
        cells = [cells.slice(0, cells.length - keep).join(' ')].concat(cells.slice(cells.length - keep));
      }

      var hasLabel = cells.length === wanted;
      var label = hasLabel ? cells[0] : 'Study ' + (out.studies.length + 1);
      var vals = hasLabel ? cells.slice(1) : cells;

      // A row one cell short whose first cell is not a number, but whose every
      // other cell IS one, is a LABELLED row with a value missing rather than an
      // unlabelled row opening with junk. Saying "0.3 is not a number" there
      // would be nonsense, so name the real problem: a value is absent.
      // When the rest are not numeric either the row is simply junk, and the
      // per-field checks below name the offending cell, which is more useful.
      if (!hasLabel && isNaN(num(vals[0])) &&
          vals.slice(1).every(function (v) { return !isNaN(num(v)); })) {
        out.error = 'Line ' + ln.n + ': "' + vals[0] + '" reads as a study label, which leaves only ' +
          (vals.length - 1) + ' number' + (vals.length - 1 === 1 ? '' : 's') + ' on this row. ' +
          (mode === 'counts' ? wantCT : wantES);
        return out;
      }

      if (mode === 'counts') {
        var et = num(vals[0]), nt = num(vals[1]), ec = num(vals[2]), nc = num(vals[3]);
        var names = ['treatment events', 'treatment total', 'control events', 'control total'];
        var got = [et, nt, ec, nc];
        for (var q = 0; q < 4; q++) {
          if (isNaN(got[q])) {
            out.error = 'Line ' + ln.n + ': "' + vals[q] + '" is not a number (' + names[q] + '). ' + wantCT;
            return out;
          }
          if (got[q] < 0) {
            out.error = 'Line ' + ln.n + ': ' + names[q] + ' cannot be negative (got ' + got[q] + ').';
            return out;
          }
          if (got[q] !== Math.round(got[q])) {
            out.error = 'Line ' + ln.n + ': ' + names[q] + ' must be a whole count (got ' + got[q] + ').';
            return out;
          }
        }
        if (nt <= 0 || nc <= 0) {
          out.error = 'Line ' + ln.n + ': group totals must be above zero.';
          return out;
        }
        if (et > nt) {
          out.error = 'Line ' + ln.n + ': treatment events (' + et + ') cannot exceed the treatment total (' + nt + ').';
          return out;
        }
        if (ec > nc) {
          out.error = 'Line ' + ln.n + ': control events (' + ec + ') cannot exceed the control total (' + nc + ').';
          return out;
        }
        var es = escalcOR(et, nt, ec, nc);
        out.studies.push({
          label: label, yi: es.yi, sei: es.sei,
          counts: { et: et, nt: nt, ec: ec, nc: nc, esc: es }
        });
      } else {
        var y = num(vals[0]), se = num(vals[1]);
        if (isNaN(y)) {
          out.error = 'Line ' + ln.n + ': "' + vals[0] + '" is not a number (the effect estimate). ' + wantES;
          return out;
        }
        if (isNaN(se)) {
          out.error = 'Line ' + ln.n + ': "' + vals[1] + '" is not a number (the standard error). ' + wantES;
          return out;
        }
        if (se <= 0) {
          out.error = 'Line ' + ln.n + ': the standard error must be above zero (got ' + se + '). A standard error of 0 would give that study infinite weight.';
          return out;
        }
        out.studies.push({ label: label, yi: y, sei: se });
      }
    }

    if (out.studies.length < 2) {
      out.error = 'A meta-analysis needs at least 2 studies. You have ' + out.studies.length + '.';
      out.studies = [];
      return out;
    }
    return out;
  }

  // ---- plain-English readouts -----------------------------------------
  function i2Band(I2) {
    if (I2 < 25) return 'low';
    if (I2 < 50) return 'moderate';
    if (I2 < 75) return 'substantial';
    return 'considerable';
  }

  return {
    escalcOR: escalcOR,
    analyze: analyze,
    parse: parse,
    i2Band: i2Band
  };
}));
