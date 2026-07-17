/* posthoc-math.js - the three post-hoc routes after a one-way ANOVA,
   for tools/post-hoc-calculator.html.

   Reproduces, to machine precision, what R prints for:
     TukeyHSD(aov(y ~ g))                            -> tukeyHSD()
     pairwise.t.test(y, g, p.adjust.method = "bonferroni")  -> pairwiseT()
     FSA::dunnTest(y, g, method = "bh")              -> dunnTest()
     multcompView::multcompLetters(...)              -> cld()

   Ground truth: Scripts/tool-truth/post-hoc-calculator.json (R 4.6.0,
   FSA 0.10.1, dunn.test 1.4.1, multcompView 0.1.11).

   WHAT IS NEW HERE (everything else is composed, not rewritten):
     ptukey / qtukey - the studentized range distribution. A faithful port of
     R's nmath (ptukey.c / qtukey.c: Copenhaver & Holland's algorithm, AS 190).
     R's own ptukey defines the p-value TukeyHSD prints, so the goal is to match
     R exactly - not to be "more accurate" than it.

   TWO QUIRKS THIS ENCODES ON PURPOSE (both verified against R):

   1. dunn.test's BH is NOT stats::p.adjust(p, "BH").  p.adjust applies cummin
      over the descending-sorted p's to enforce monotonicity; dunn.test applies
      the raw m/(m+1-i) multiplier with NO cummin, and handles the step-up
      logic separately in its Reject column.  They genuinely differ:
        p = (0.001, 0.049, 0.05):  p.adjust -> (0.003, 0.050, 0.050)
                                   dunn.test -> (0.003, 0.0735, 0.050)
      Because the tool emits FSA::dunnTest, dunnBH() reproduces dunn.test's
      value (so the page and the emitted R agree).  A consequence: dunn.test's
      reported adjusted p is not monotone in the raw p, so thresholding it
      naively at alpha does NOT give BH's rejections.  dunnReject() implements
      the real step-up rule (identical to p.adjust(p,"BH") <= alpha, and to
      dunn.test's own Reject column), and that - not the printed p - is what
      drives the verdict.

   2. pairwise.t.test defaults to pool.sd = TRUE: every pair is tested with the
      ANOVA's pooled error sqrt(MSW) on N-k df, NOT with each pair's own SDs.
      That is why it is an ANOVA follow-up rather than a pile of t-tests.

   Browser: window.PostHocMath (load ttest-math -> lm-math -> anova-math,
            normal-math, multiple-testing-math first).
   Node:    require('./posthoc-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./anova-math.js'), require('./normal-math.js'),
                             require('./multiple-testing-math.js'));
  } else {
    root.PostHocMath = factory(root.ANOVAMath, root.NormalMath, root.MultipleTestingMath);
  }
}(typeof self !== 'undefined' ? self : this, function (AN, NM, MT) {
  'use strict';

  var pnorm = NM.pnorm, gammq = NM.gammq;

  // ---- lgamma, Stirling + Bernoulli tail (NOT normal-math's) ----------------
  // ptukey's leading constant is
  //     f2lf = f2*log(df) - df*log(2) - lgamma(f2),   f2 = df/2
  // and those large terms cancel down to an O(1) log-density that is then
  // exponentiated, so an ABSOLUTE error in lgamma passes straight into the
  // answer.  normal-math's 6-term Lanczos is ~2e-15 RELATIVE, but lgamma(12499.5)
  // ~ 105422, so that is ~2e-10 absolute - and measurably so: ptukey's error vs
  // R grew with df exactly (5.5e-14 at df=2 -> 2.0e-10 at df=24999) and vanished
  // at df > 25000, the branch that never calls lgamma.
  // This local version is ~1e-16 relative, which drops ptukey's error to the
  // 1e-15 floor.  Kept local ON PURPOSE: normal-math is verified and shared by
  // ~30 shipped pages, and its lgamma is fine for every caller that does not
  // exponentiate a near-cancelling sum of six-figure logs.
  var LN_SQRT_2PI = 0.918938533204672741780329736406;   // log(sqrt(2*pi))
  function lgammaStirling(x) {
    // asymptotic Stirling correction; the series is accurate for x >= 10
    var inv = 1 / x, inv2 = inv * inv;
    var cor = inv * (1 / 12
            + inv2 * (-1 / 360
            + inv2 * (1 / 1260
            + inv2 * (-1 / 1680
            + inv2 * (1 / 1188
            + inv2 * (-691 / 360360
            + inv2 * (1 / 156
            + inv2 * (-3617 / 122400))))))));
    return (x - 0.5) * Math.log(x) - x + LN_SQRT_2PI + cor;
  }
  function lgamma(x) {
    // push small x up into Stirling's range via lgamma(x) = lgamma(x+n) - log(prod)
    if (x >= 10) return lgammaStirling(x);
    var n = 0, p = 1, y = x;
    while (y < 10) { p *= y; y += 1; n++; }
    return lgammaStirling(y) - Math.log(p);
  }
  var M_LN2 = 0.693147180559945309417232121458;
  // sqrt(2*pi): the Gauss-Legendre sum carries exp(-x^2/2), so dividing the
  // 2*cc*b factor by sqrt(2*pi) turns it into Hartley's doubled-tail integral
  //   2*cc * integral_{w/2}^{8} phi(a) [Phi(a) - Phi(a-w)]^(cc-1) da.
  var M_SQRT_2PI = 2.506628274631000502415765284811;
  var DBL_EPSILON = 2.220446049250313e-16;

  // =========================================================================
  // wprob() - R nmath ptukey.c.  Probability integral of the range of cc
  // independent N(0,1) deviates, raised to rr.  12-point Gauss-Legendre.
  // =========================================================================
  var nleg = 12, ihalf = 6;
  var xleg = [
    0.981560634246719250690549090149,
    0.904117256370474856678465866119,
    0.769902674194304687036893833213,
    0.587317954286617447296702418941,
    0.367831498998180193752691536644,
    0.125233408511468915472441369464
  ];
  var aleg = [
    0.047175336386511827194615961485,
    0.106939325995318430960254718194,
    0.160078328543346226334652529543,
    0.203167426723065921749064455810,
    0.233492536538354808760849898925,
    0.249147045813402785000562436043
  ];
  var C1 = -30.0, C2 = -50.0, C3 = 60.0;
  var bb = 8.0, wlar = 3.0, wincr1 = 2.0, wincr2 = 3.0;

  function wprob(w, rr, cc) {
    var qsqz = w * 0.5;
    // if w >= 16 the integral's lower limit is past z-max ~ 6
    if (qsqz >= bb) return 1.0;

    // (f(w))^cc between -w/2 and +w/2 ; if pr_w^cc < 2e-22 treat as 0
    var pr_w = 2 * pnorm(qsqz) - 1.0;
    if (pr_w >= Math.exp(C2 / cc)) pr_w = Math.pow(pr_w, cc);
    else pr_w = 0.0;

    // large w -> the second component is small, fewer intervals needed
    var wincr = w > wlar ? wincr1 : wincr2;

    var blb = qsqz;
    var binc = (bb - qsqz) / wincr;
    var einsum = 0.0, cc1 = cc - 1.0;
    var wi, jj, j, xx, a, b, c1, ac, qexpo, pplus, pminus, rinsum, elsum;

    for (wi = 1; wi <= wincr; wi++) {
      elsum = 0.0;
      a = 0.5 * (2 * blb + binc);      // interval midpoint
      b = 0.5 * binc;                  // interval half-width
      for (jj = 1; jj <= nleg; jj++) {
        // nodes sweep -xleg[0..5] then +xleg[5..0]: ac increases monotonically
        if (ihalf < jj) { j = nleg - jj; xx = xleg[j]; }      // j = 12-jj -> 5..0
        else { j = jj - 1; xx = -xleg[j]; }                   // j = 0..5
        c1 = b * xx;
        ac = a + c1;
        // if exp(-qexpo/2) < 9e-14 it cannot contribute (ac is increasing)
        qexpo = ac * ac;
        if (qexpo > C3) break;

        pplus = 2 * pnorm(ac);
        pminus = 2 * pnorm(ac - w);          // == pnorm(ac, mean = w, sd = 1)

        // if rinsum^(cc-1) < 9e-14 it cannot contribute
        rinsum = (pplus * 0.5) - (pminus * 0.5);
        if (rinsum >= Math.exp(C1 / cc1)) {
          rinsum = (aleg[j] * Math.exp(-(0.5 * qexpo))) * Math.pow(rinsum, cc1);
          elsum += rinsum;
        }
      }
      elsum *= (((2.0 * b) * cc) / M_SQRT_2PI);
      einsum += elsum;
      blb += binc;
    }

    pr_w = einsum + pr_w;
    if (pr_w <= Math.exp(C1 / rr)) return 0.0;
    pr_w = Math.pow(pr_w, rr);
    if (pr_w >= 1.0) return 1.0;
    return pr_w;
  }

  // =========================================================================
  // ptukey() - R nmath.  cc = nmeans (k), rr = nranges (1 for TukeyHSD),
  // df = residual df.  16-point Gauss-Legendre over the chi density of s.
  // =========================================================================
  var nlegq = 16, ihalfq = 8;
  var xlegq = [
    0.989400934991649932596154173450,
    0.944575023073232576077988415535,
    0.865631202387831743880467897712,
    0.755404408355003033895101194847,
    0.617876244402643748446671764049,
    0.458016777657227386342419442984,
    0.281603550779258913230460501460,
    0.950125098376374401853193354250e-1
  ];
  var alegq = [
    0.271524594117540948517805724560e-1,
    0.622535239386478928628438369944e-1,
    0.951585116824927848099251076022e-1,
    0.124628971255533872052476282192,
    0.149595988816576732081501730547,
    0.169156519395002538189312079030,
    0.182603415044923588866763667969,
    0.189450610455068496285396723208
  ];
  var eps1 = -30.0, eps2 = 1.0e-14;
  var dhaf = 100.0, dquar = 800.0, deigh = 5000.0, dlarg = 25000.0;
  var ulen1 = 1.0, ulen2 = 0.5, ulen3 = 0.25, ulen4 = 0.125;

  function ptukey(q, rr, cc, df, lowerTail) {
    if (lowerTail === undefined) lowerTail = true;
    if (isNaN(q) || isNaN(rr) || isNaN(cc) || isNaN(df)) return NaN;
    if (q <= 0) return lowerTail ? 0 : 1;
    if (df < 2 || rr < 1 || cc < 2) return NaN;
    if (!isFinite(q)) return lowerTail ? 1 : 0;
    if (df > dlarg) {
      var wl = wprob(q, rr, cc);
      return lowerTail ? wl : 1 - wl;
    }

    var f2 = df * 0.5;
    var f2lf = ((f2 * Math.log(df)) - (df * M_LN2)) - lgamma(f2);
    var f21 = f2 - 1.0;
    var ff4 = df * 0.25;
    var ulen = df <= dhaf ? ulen1 : df <= dquar ? ulen2 : df <= deigh ? ulen3 : ulen4;
    f2lf += Math.log(ulen);

    var ans = 0.0, otsum = 0.0, i, jj, j, t1, twa1, qsqz, wprb, rotsum;

    for (i = 1; i <= 50; i++) {
      otsum = 0.0;
      twa1 = (2 * i - 1) * ulen;
      for (jj = 1; jj <= nlegq; jj++) {
        if (ihalfq < jj) {
          j = jj - ihalfq - 1;                       // 0..7
          t1 = (f2lf + (f21 * Math.log(twa1 + (xlegq[j] * ulen))))
             - (((xlegq[j] * ulen) + twa1) * ff4);
        } else {
          j = jj - 1;                                // 0..7
          t1 = (f2lf + (f21 * Math.log(twa1 - (xlegq[j] * ulen))))
             + (((xlegq[j] * ulen) - twa1) * ff4);
        }
        // if exp(t1) < 9e-14 it cannot contribute
        if (t1 >= eps1) {
          if (ihalfq < jj) qsqz = q * Math.sqrt(((xlegq[j] * ulen) + twa1) * 0.5);
          else qsqz = q * Math.sqrt(((-(xlegq[j] * ulen)) + twa1) * 0.5);
          wprb = wprob(qsqz, rr, cc);
          rotsum = (wprb * alegq[j]) * Math.exp(t1);
          otsum += rotsum;
        }
      }
      // at least 1/ulen intervals, so the left tail is not clipped
      if (i * ulen >= 1.0 && otsum <= eps2) break;
      ans += otsum;
    }
    if (ans > 1.0) ans = 1.0;
    return lowerTail ? ans : 1 - ans;
  }

  // ---- qinv(): R's starting value for qtukey ----
  // The bracketed term is Odeh & Evans (AS 70): t ~= z_{1-ps}, exact enough that
  // for cc = 2 the whole function is the closed form sqrt(2)*z_{(1+p)/2}
  // (log(cc-1) = 0 there, and c5 = sqrt(2)).  Self-check: ps = .025 -> t = 1.9598
  // (z = 1.95996); ps = .25 -> t = 0.674454 (z = 0.6744898).
  function qinv(p, c, v) {
    var p0 = -0.322232431088, q0 = 0.993484626060e-01,
        p1 = -1.0, q1 = 0.588581570495,
        p2 = -0.342242088547, q2 = 0.531103462366,
        p3 = -0.204231210245e-01, q3 = 0.103537752850,
        p4 = -0.453642210148e-04, q4 = 0.38560700634e-02,
        c1 = 0.8832, c2 = 0.2368, c3 = 1.214, c4 = 1.208, c5 = 1.4142;
    var vmax = 120.0;
    var ps = 0.5 - 0.5 * p;
    var yi = Math.sqrt(Math.log(1.0 / (ps * ps)));
    var t = yi + ((((yi * p4 + p3) * yi + p2) * yi + p1) * yi + p0)
              / ((((yi * q4 + q3) * yi + q2) * yi + q1) * yi + q0);
    if (v < vmax) t += (t * t * t + t) / v / 4.0;
    var q = c1 - c2 * t;
    if (v < vmax) q += -c3 / v + c4 * t / v;
    return t * (q * Math.log(c - 1.0) + c5);
  }

  // ---- qtukey(): R nmath qtukey.c - secant iteration on ptukey ----
  // R stops on |x1 - x0| < 1e-4, which leaves its critical value converged only
  // to ~5e-8 (measured: ptukey(qtukey(.5), 2, 24) - .5 = 6.5e-8).  Stopping at
  // the same loose point would inherit that noise, so this runs the SAME
  // iteration to a real root instead: ptukey is exact and monotone, so the tight
  // eps plus the bisection fallback converge to ~1e-13.  The result still agrees
  // with R to ~1e-7 relative (R's own accuracy) - identical at any displayed
  // precision - while being strictly the better critical value.
  var eps = 1e-10, maxiter = 100;
  function qtukey(p, rr, cc, df) {
    if (isNaN(p) || isNaN(rr) || isNaN(cc) || isNaN(df)) return NaN;
    if (df < 2 || rr < 1 || cc < 2) return NaN;
    if (p > 1 - DBL_EPSILON) return Infinity;
    if (p < DBL_EPSILON) return 0;

    var x0 = qinv(p, cc, df);
    var valx0 = ptukey(x0, rr, cc, df, true) - p;

    // Second iterate: if the first overshoots p, step DOWN by 1, else step UP
    // by 1. Seeding both iterates on the same flat side (as x0-1 always would)
    // makes the secant extrapolate to infinity and then divide by zero.
    var x1 = valx0 > 0.0 ? Math.max(0.0, x0 - 1.0) : x0 + 1.0;
    var valx1 = ptukey(x1, rr, cc, df, true) - p;
    var ans = 0.0, iter, xabs;

    for (iter = 1; iter < maxiter; iter++) {
      if (valx1 === valx0) break;                  // guard R leaves implicit
      ans = x1 - ((valx1 * (x1 - x0)) / (valx1 - valx0));
      if (!isFinite(ans)) break;
      valx0 = valx1;
      x0 = x1;
      if (ans < 0.0) { ans = 0.0; valx1 = -p; }
      valx1 = ptukey(ans, rr, cc, df, true) - p;
      x1 = ans;
      xabs = Math.abs(x1 - x0);
      if (xabs < eps) return ans;
    }
    // R's secant can stall on a flat plateau: when qinv seeds far out in the
    // upper tail (tiny df, large cc, extreme p) both iterates land where ptukey
    // ~ 1, the near-zero slope throws the step negative, it clamps to 0, and the
    // cycle repeats until maxiter - returning whatever it last held. ptukey is
    // exact and monotone in q, so bisect instead of shipping that value.
    // Outside the tool's range (conf <= .99 keeps every reachable case on the
    // converging path) but a wrong number must never be reachable at all.
    return qtukeyBisect(p, rr, cc, df);
  }

  // Bracketed fallback: monotone solve of ptukey(q) = p to machine precision.
  function qtukeyBisect(p, rr, cc, df) {
    var lo = 0, hi = 1, i;
    while (ptukey(hi, rr, cc, df, true) < p && hi < 1e6) hi *= 2;
    if (hi >= 1e6) return NaN;
    for (i = 0; i < 200; i++) {
      var mid = 0.5 * (lo + hi);
      if (mid === lo || mid === hi) break;             // doubles exhausted
      if (ptukey(mid, rr, cc, df, true) < p) lo = mid; else hi = mid;
    }
    return 0.5 * (lo + hi);
  }

  // =========================================================================
  // Group plumbing
  // =========================================================================
  function mean(a) { var s = 0, i; for (i = 0; i < a.length; i++) s += a[i]; return s / a.length; }
  function sdOf(a) {
    if (a.length < 2) return NaN;
    var m = mean(a), s = 0, i;
    for (i = 0; i < a.length; i++) { var d = a[i] - m; s += d * d; }
    return Math.sqrt(s / (a.length - 1));
  }

  // Normalize input to [{name, values:[...]}] in ORDER OF APPEARANCE - the same
  // level order the emitted R pins with factor(g, levels = c(...)).
  function toGroups(input) {
    if (!Array.isArray(input)) throw new Error('Expected an array of groups.');
    return input.map(function (g, i) {
      var vals = Array.isArray(g) ? g : g.values;
      var nm = Array.isArray(g) ? ('Group ' + (i + 1))
             : (g.name != null && String(g.name) !== '' ? String(g.name) : 'Group ' + (i + 1));
      return { name: nm, values: (vals || []).slice() };
    }).filter(function (g) { return g.values.length > 0; });
  }

  // =========================================================================
  // Tukey HSD - mirrors stats:::TukeyHSD.aov exactly.
  //   center = outer(means, means, "-")[lower.tri]   -> means[i] - means[j], i>j
  //   se     = sqrt((MSE/2) * (1/n_i + 1/n_j))
  //   est    = center / se ; p = ptukey(|est|, k, dfW, lower = FALSE)
  //   width  = qtukey(conf, k, dfW) * se
  // Pair order is column-major lower triangle: (2,1),(3,1),(4,1),(3,2),(4,2)...
  // =========================================================================
  // Signature is explicit (names, means, ns, ...) rather than polymorphic on a
  // "groups or names" first argument: an array of group objects and an array of
  // name strings are both arrays, so Array.isArray cannot tell them apart.
  function tukeyHSD(names, means, ns, msW, dfW, conf) {
    var k = names.length, out = [], i, j;
    var qcrit = qtukey(conf, 1, k, dfW);
    // column-major lower triangle of the k x k matrix: j outer, i inner
    for (j = 0; j < k; j++) {
      for (i = j + 1; i < k; i++) {
        var center = means[i] - means[j];
        var se = Math.sqrt((msW / 2) * (1 / ns[i] + 1 / ns[j]));
        var est = center / se;
        var width = qcrit * se;
        out.push({
          pair: names[i] + '-' + names[j],
          a: names[i], b: names[j], ai: i, bi: j,
          diff: center, se: se, statistic: est,
          lwr: center - width, upr: center + width,
          padj: ptukey(Math.abs(est), 1, k, dfW, false)
        });
      }
    }
    return { qcrit: qcrit, pairs: out, conf: conf, msW: msW, dfW: dfW, k: k };
  }

  // =========================================================================
  // pairwise.t.test(pool.sd = TRUE) + p.adjust - mirrors stats::pairwise.t.test.
  //   pooled.sd = sqrt(sum(s_i^2 (n_i-1)) / sum(n_i-1)) == sqrt(MSW)
  //   se = pooled.sd * sqrt(1/n_i + 1/n_j) ; t = diff/se ; p = 2*pt(-|t|, N-k)
  // p.adjust runs over the k(k-1)/2 comparisons, so bonferroni multiplies by m.
  // Row/col order is R's matrix: rows = levels 2..k, cols = levels 1..k-1.
  // =========================================================================
  function tCDFlower(t, df) {
    // pt(t, df) via the verified regularized incomplete beta in ttest-math
    // (pulled through anova-math -> lm-math). Kept local to avoid a 5th global.
    return TT.tCDF(t, df);
  }
  var TT = (typeof module === 'object' && module.exports)
    ? require('./ttest-math.js')
    : (typeof self !== 'undefined' ? self.TTestMath : null);

  function pairwiseT(names, means, ns, msW, dfW, method) {
    var k = names.length, raw = [], i, j;
    var pooled = Math.sqrt(msW);
    // R builds rows i = 2..k, cols j = 1..i-1 and adjusts the lower triangle
    // (column-major). Order only matters for step-up methods, not bonferroni.
    var cells = [];
    for (j = 0; j < k; j++) {
      for (i = j + 1; i < k; i++) {
        var dif = means[i] - means[j];
        var se = pooled * Math.sqrt(1 / ns[i] + 1 / ns[j]);
        var tval = dif / se;
        var p = 2 * tCDFlower(-Math.abs(tval), dfW);
        cells.push({ pair: names[i] + '-' + names[j], a: names[i], b: names[j],
                     ai: i, bi: j, diff: dif, se: se, t: tval, praw: p });
      }
    }
    raw = cells.map(function (c) { return c.praw; });
    var adj = MT.padjust(raw, method || 'bonferroni');
    cells.forEach(function (c, ix) { c.padj = adj[ix]; });
    return { pairs: cells, pooledSD: pooled, dfW: dfW, m: cells.length,
             method: method || 'bonferroni' };
  }

  // =========================================================================
  // Kruskal-Wallis - mirrors stats::kruskal.test (tie-corrected).
  // =========================================================================
  function rankAvg(x) {
    var n = x.length;
    var idx = x.map(function (v, i) { return i; });
    idx.sort(function (p, q) { return x[p] - x[q]; });
    var r = new Array(n), i = 0;
    while (i < n) {
      var jx = i;
      while (jx + 1 < n && x[idx[jx + 1]] === x[idx[i]]) jx++;
      var avg = (i + jx) / 2 + 1;                       // average rank, 1-based
      for (var t = i; t <= jx; t++) r[idx[t]] = avg;
      i = jx + 1;
    }
    return r;
  }
  function tieGroups(x) {
    var s = x.slice().sort(function (a, b) { return a - b; }), out = [], i = 0;
    while (i < s.length) {
      var j = i; while (j + 1 < s.length && s[j + 1] === s[i]) j++;
      out.push(j - i + 1); i = j + 1;
    }
    return out;
  }
  function pchisqUpper(x, df) { return gammq(df / 2, x / 2); }

  function kruskal(groups) {
    var G = toGroups(groups);
    var all = [], gi = [];
    G.forEach(function (g, i) { g.values.forEach(function (v) { all.push(v); gi.push(i); }); });
    var n = all.length, k = G.length;
    var r = rankAvg(all);
    var sums = new Array(k).fill(0), cnt = new Array(k).fill(0);
    for (var i = 0; i < n; i++) { sums[gi[i]] += r[i]; cnt[gi[i]]++; }
    var stat = 0;
    for (i = 0; i < k; i++) stat += (sums[i] * sums[i]) / cnt[i];
    var ties = tieGroups(all), tsum = 0;
    ties.forEach(function (t) { tsum += t * t * t - t; });
    var chisq = ((12 * stat / (n * (n + 1)) - 3 * (n + 1)) / (1 - tsum / (n * n * n - n)));
    var df = k - 1;
    return { chisq: chisq, df: df, p: pchisqUpper(chisq, df) };
  }

  // =========================================================================
  // Dunn's test - mirrors dunn.test::dunn.test (what FSA::dunnTest wraps).
  //   tiesadj = sum(tau^3 - tau) / (12 (N-1))
  //   z = (meanrank_j - meanrank_i) / sqrt((N(N+1)/12 - tiesadj)(1/n_i + 1/n_j))
  //   labelled "j - i" for i > j, so the sign matches the label.
  //   two-sided p = 2 * pnorm(-|z|)   (altp = TRUE, FSA's default)
  // Pair order is dunn.test's: index = (i-2)(i-1)/2 + j -> (2,1),(3,1),(3,2),(4,1)...
  // =========================================================================

  // dunn.test's BH: raw multiplier, NO cummin (see header note 1).
  function dunnBH(p) {
    var m = p.length;
    var ord = p.map(function (_, i) { return i; })
               .sort(function (a, b) { return p[b] - p[a]; });      // decreasing
    var adj = new Array(m);
    for (var i = 0; i < m; i++) {
      adj[ord[i]] = Math.min(1, p[ord[i]] * (m / (m + 1 - (i + 1))));
    }
    return adj;
  }
  // dunn.test's bonferroni / none, for the method toggle.
  function dunnAdjust(p, method) {
    var m = p.length;
    if (method === 'none') return p.slice();
    if (method === 'bonferroni') return p.map(function (v) { return Math.min(1, v * m); });
    return dunnBH(p);
  }
  // The REAL BH step-up rejections (== dunn.test's Reject column,
  // == p.adjust(p,"BH") <= alpha). Not the same as thresholding dunnBH output.
  function dunnReject(p, method, alpha) {
    var m = p.length;
    if (method === 'none') return p.map(function (v) { return v <= alpha; });
    if (method === 'bonferroni') return p.map(function (v) { return Math.min(1, v * m) <= alpha; });
    var mono = MT.padjust(p, 'BH');          // cummin-enforced == step-up rule
    return mono.map(function (v) { return v <= alpha; });
  }

  function dunnTest(groups, method, alpha) {
    method = method || 'bh'; alpha = alpha == null ? 0.05 : alpha;
    var G = toGroups(groups);
    var k = G.length;
    if (k < 2) throw new Error('Need at least two groups.');
    var all = [], gi = [];
    G.forEach(function (g, i) { g.values.forEach(function (v) { all.push(v); gi.push(i); }); });
    var N = all.length;
    var r = rankAvg(all);
    var sums = new Array(k).fill(0), cnt = new Array(k).fill(0);
    for (var t = 0; t < N; t++) { sums[gi[t]] += r[t]; cnt[gi[t]]++; }
    var mr = sums.map(function (s, i) { return s / cnt[i]; });

    var ties = tieGroups(all), tiesadj = 0;
    ties.forEach(function (tau) { if (tau > 1) tiesadj += tau * tau * tau - tau; });
    tiesadj = tiesadj / (12 * (N - 1));
    var base = (N * (N + 1) / 12) - tiesadj;

    // dunn.test's own index order: for i = 2..k, j = 1..i-1
    var cells = [], i, j;
    for (i = 1; i < k; i++) {
      for (j = 0; j < i; j++) {
        var z = (mr[j] - mr[i]) / Math.sqrt(base * (1 / cnt[j] + 1 / cnt[i]));
        cells.push({ pair: G[j].name + ' - ' + G[i].name, a: G[j].name, b: G[i].name,
                     ai: j, bi: i, z: z, praw: 2 * pnorm(-Math.abs(z)) });
      }
    }
    var raw = cells.map(function (c) { return c.praw; });
    var adj = dunnAdjust(raw, method);
    var rej = dunnReject(raw, method, alpha);
    cells.forEach(function (c, ix) {
      c.padj = adj[ix];
      c.reject = rej[ix];
      // true when dunn.test's printed p is non-monotone vs the step-up rule
      c.padjNonMonotone = (method === 'bh') && ((c.padj <= alpha) !== rej[ix]);
    });
    return { pairs: cells, N: N, k: k, tiesadj: tiesadj, hasTies: ties.some(function (t) { return t > 1; }),
             meanRanks: mr, ns: cnt, method: method, alpha: alpha };
  }

  // =========================================================================
  // Compact letter display (Piepho's insert-absorb sweep).
  // Contract: two groups share a letter IFF their pair is NOT significant.
  // Verified against multcompView::multcompLetters as a set-partition.
  // =========================================================================
  function cld(names, sigPairs, orderIdx) {
    var k = names.length;
    // sig[i][j] = true when i,j significantly differ
    var sig = [];
    for (var i = 0; i < k; i++) { sig.push(new Array(k).fill(false)); }
    sigPairs.forEach(function (p) { sig[p.ai][p.bi] = true; sig[p.bi][p.ai] = true; });

    // start: one column holding every group
    var cols = [new Array(k).fill(true)];
    for (i = 0; i < k; i++) {
      for (var j = i + 1; j < k; j++) {
        if (!sig[i][j]) continue;
        var add = [];
        for (var c = 0; c < cols.length; c++) {
          if (cols[c][i] && cols[c][j]) {
            var dup = cols[c].slice();
            cols[c][j] = false;    // this column keeps i, drops j
            dup[i] = false;        // the clone keeps j, drops i
            add.push(dup);
          }
        }
        cols = cols.concat(add);
        // absorb: drop any column whose members are a subset of another's
        cols = cols.filter(function (col, ci) {
          for (var o = 0; o < cols.length; o++) {
            if (o === ci) continue;
            var subset = true, strict = false;
            for (var m = 0; m < k; m++) {
              if (col[m] && !cols[o][m]) { subset = false; break; }
              if (!col[m] && cols[o][m]) strict = true;
            }
            // strict subset -> drop; identical -> keep only the first
            if (subset && strict) return false;
            if (subset && !strict && o < ci) return false;
          }
          return true;
        });
      }
    }
    // order columns by their first member in the display order, then label
    var ord = orderIdx || names.map(function (_, i2) { return i2; });
    cols.sort(function (A, B) {
      for (var t = 0; t < k; t++) {
        var gA = A[ord[t]], gB = B[ord[t]];
        if (gA !== gB) return gA ? -1 : 1;
      }
      return 0;
    });
    var alpha = 'abcdefghijklmnopqrstuvwxyz';
    var out = names.map(function () { return ''; });
    cols.forEach(function (col, ci) {
      var ch = ci < 26 ? alpha[ci] : String(ci + 1);
      for (var m = 0; m < k; m++) if (col[m]) out[m] += ch;
    });
    return out;
  }

  // =========================================================================
  // Orchestrators
  // =========================================================================
  function summarize(names, means, sds, ns) {
    // MSW / dfW straight from the summaries (identical to aov on raw data)
    var k = names.length, N = 0, ssW = 0, gsum = 0, i;
    for (i = 0; i < k; i++) {
      N += ns[i]; gsum += means[i] * ns[i];
      if (ns[i] > 1) ssW += sds[i] * sds[i] * (ns[i] - 1);
    }
    var grand = gsum / N, ssB = 0;
    for (i = 0; i < k; i++) ssB += ns[i] * (means[i] - grand) * (means[i] - grand);
    var dfB = k - 1, dfW = N - k;
    var msB = ssB / dfB, msW = ssW / dfW;
    var f = msB / msW;
    return { k: k, N: N, grandMean: grand, ssB: ssB, ssW: ssW, dfB: dfB, dfW: dfW,
             msB: msB, msW: msW, f: f, p: AN.fPValue(f, dfB, dfW),
             eta2: ssB / (ssB + ssW),
             omega2: (ssB - dfB * msW) / (ssB + ssW + msW) };
  }

  function analyzeRaw(groups, opts) {
    opts = opts || {};
    var conf = opts.conf || 0.95, alpha = 1 - conf;
    var G = toGroups(groups);
    if (G.length < 3) throw new Error('Post-hoc tests need at least three groups. With two groups a single t-test already answers the question.');
    var withData = G.filter(function (g) { return g.values.length >= 1; });
    if (withData.length !== G.length) throw new Error('Every group needs at least one value.');
    var N = G.reduce(function (s, g) { return s + g.values.length; }, 0);
    if (N - G.length < 1) throw new Error('Need more observations than groups: at least one group must have more than one value.');

    var names = G.map(function (g) { return g.name; });
    var means = G.map(function (g) { return mean(g.values); });
    var ns = G.map(function (g) { return g.values.length; });
    var sds = G.map(function (g) { return sdOf(g.values); });

    var om = AN.oneWay(G, { conf: conf });
    var msW = om.msWithin, dfW = om.dfWithin;

    var tk = tukeyHSD(names, means, ns, msW, dfW, conf);
    var bf = pairwiseT(names, means, ns, msW, dfW, 'bonferroni');
    var dn = dunnTest(G, opts.dunnMethod || 'bh', alpha);
    var kw = kruskal(G);

    return {
      mode: 'raw', groups: G, names: names, means: means, sds: sds, ns: ns,
      k: G.length, N: N, conf: conf, alpha: alpha,
      omnibus: om, msW: msW, dfW: dfW,
      kruskal: kw, tukey: tk, bonferroni: bf, dunn: dn
    };
  }

  function analyzeSummary(names, means, sds, ns, opts) {
    opts = opts || {};
    var conf = opts.conf || 0.95, alpha = 1 - conf;
    if (names.length < 3) throw new Error('Post-hoc tests need at least three groups. With two groups a single t-test already answers the question.');
    for (var i = 0; i < ns.length; i++) {
      if (!(ns[i] >= 2)) throw new Error('Every group needs n of at least 2 to have a standard deviation.');
      if (!(sds[i] >= 0)) throw new Error('Standard deviations cannot be negative.');
    }
    var s = summarize(names, means, sds, ns);
    var tk = tukeyHSD(names, means, ns, s.msW, s.dfW, conf);
    var bf = pairwiseT(names, means, ns, s.msW, s.dfW, 'bonferroni');
    return {
      mode: 'summary', names: names, means: means, sds: sds, ns: ns,
      k: names.length, N: s.N, conf: conf, alpha: alpha,
      omnibus: s, msW: s.msW, dfW: s.dfW,
      tukey: tk, bonferroni: bf, dunn: null      // ranks need the raw values
    };
  }

  // Exact-moments reconstruction: x = m + s*scale(1:n) has mean m and sd s
  // EXACTLY, so aov() on these vectors is ground truth for summary-mode Tukey.
  // Exposed so the page can emit runnable R for summary input.
  function reconstruct(m, s, n) {
    var i, idx = [], mu = (n + 1) / 2, ss = 0;
    for (i = 1; i <= n; i++) { idx.push(i); ss += (i - mu) * (i - mu); }
    var sd0 = Math.sqrt(ss / (n - 1));
    return idx.map(function (v) { return m + s * ((v - mu) / sd0); });
  }

  return {
    wprob: wprob, ptukey: ptukey, qtukey: qtukey, qinv: qinv,
    tukeyHSD: tukeyHSD, pairwiseT: pairwiseT, dunnTest: dunnTest,
    dunnBH: dunnBH, dunnAdjust: dunnAdjust, dunnReject: dunnReject,
    kruskal: kruskal, rankAvg: rankAvg, cld: cld,
    summarize: summarize, analyzeRaw: analyzeRaw, analyzeSummary: analyzeSummary,
    reconstruct: reconstruct, mean: mean, sd: sdOf, toGroups: toGroups,
    __lgamma: lgamma            // exposed for the truth-table harness only
  };
}));
