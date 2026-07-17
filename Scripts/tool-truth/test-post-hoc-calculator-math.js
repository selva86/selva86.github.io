/* test-post-hoc-calculator-math.js - gate for tools/lib/posthoc-math.js
   against Scripts/tool-truth/post-hoc-calculator.json (R 4.6.0 + FSA +
   dunn.test + multcompView).

   Run: node Scripts/tool-truth/test-post-hoc-calculator-math.js

   ON TOLERANCES (why they are not all "1e-6 relative"):

   * Tukey p adj is ptukey(q, ..., lower.tail = FALSE), and R computes that as
     1 - ans with ans ~ 1.  Near-total cancellation: R's own upper tail carries
     ~1e-16 ABSOLUTE resolution, so below ~1e-8 its leading digits are noise.
     Measured: |mine - R| sits on a FLAT ~2.3e-13 absolute floor whether p adj
     is 1.9e-9 or 1.3e-12 - the signature of cancellation, not of error.  So the
     gate is relative where p adj is representable (>= 1e-6, which covers every
     value the page can display) and absolute below that.  R is not an oracle
     in that tail and pretending otherwise would be dishonest.

   * qtukey is the one place R is NOT the more accurate oracle.  R stops on
     |x1 - x0| < 1e-4, leaving its critical value converged to only ~6.5e-8
     (measured: ptukey(qtukey(.5), 2, 24) - .5 = 6.5e-8).  This port runs the
     same iteration to a real root, so ptukey(qtukey(p)) - p = 2.8e-15 -- about
     1e7 times tighter.  Where the two differ (<= 1.2e-6 relative, far inside
     R's own 1e-4 tolerance) MY value is the root and R's carries the noise, and
     the round-trip check below PROVES it rather than asserting it.  So: gated
     vs R at R's tolerance, and gated tolerance-free on the round-trip.

   Every other quantity (diff, Bonferroni p, Dunn z and p, Kruskal-Wallis,
   omnibus F) is gated at 1e-9 relative or tighter - they have no cancellation.

   The gate is mutation-tested at the end: deliberately broken variants of the
   math MUST fail it.  A gate that cannot fail is not a gate. */

var path = require('path');
var ROOT = path.join(__dirname, '..', '..');
var P = require(path.join(ROOT, 'tools', 'lib', 'posthoc-math.js'));
var T = require(path.join(ROOT, 'Scripts', 'tool-truth', 'post-hoc-calculator.json'));

var pass = 0, fail = 0, checks = 0;
var failures = [];

function rel(a, b) { return Math.abs(a - b) / Math.max(1e-300, Math.abs(b)); }
function ok(cond, label, detail) {
  checks++;
  if (cond) { pass++; return true; }
  fail++;
  if (failures.length < 25) failures.push(label + '  ' + (detail || ''));
  return false;
}
function closeRel(a, b, tol, label) {
  return ok(rel(a, b) <= tol, label,
    'mine=' + a + ' R=' + b + ' rel=' + rel(a, b).toExponential(3) + ' tol=' + tol);
}
function closeAbs(a, b, tol, label) {
  return ok(Math.abs(a - b) <= tol, label,
    'mine=' + a + ' R=' + b + ' abs=' + Math.abs(a - b).toExponential(3) + ' tol=' + tol);
}

function groupsOf(c) {
  return c.levels.map(function (L) {
    return { name: L, values: c.values.filter(function (_, i) { return c.labels[i] === L; }) };
  });
}
var CONFS = ['0.90', '0.95', '0.99'];

// ===========================================================================
console.log('== 1. ptukey vs R (' + T.ptukey.length + ' grid points) ==');
// lower tail: no cancellation -> tight absolute; upper tail: relative only
// where R can represent it.
var wLoAbs = 0, wUpRel = 0, wUpAbs = 0;
T.ptukey.forEach(function (g) {
  var lo = P.ptukey(g.q, 1, g.cc, g.df, true);
  var up = P.ptukey(g.q, 1, g.cc, g.df, false);
  wLoAbs = Math.max(wLoAbs, Math.abs(lo - g.p));
  wUpAbs = Math.max(wUpAbs, Math.abs(up - g.pupper));
  if (g.pupper >= 1e-6) wUpRel = Math.max(wUpRel, rel(up, g.pupper));
  ok(Math.abs(lo - g.p) <= 1e-9, 'ptukey lower q=' + g.q + ' cc=' + g.cc + ' df=' + g.df,
     'mine=' + lo + ' R=' + g.p);
  if (g.pupper >= 1e-6) {
    ok(rel(up, g.pupper) <= 1e-6, 'ptukey upper q=' + g.q + ' cc=' + g.cc + ' df=' + g.df,
       'mine=' + up + ' R=' + g.pupper + ' rel=' + rel(up, g.pupper).toExponential(2));
  } else {
    ok(Math.abs(up - g.pupper) <= 5e-12, 'ptukey upper(floor) q=' + g.q + ' cc=' + g.cc + ' df=' + g.df,
       'mine=' + up + ' R=' + g.pupper);
  }
});
console.log('   worst lower ABS: ' + wLoAbs.toExponential(2) +
            ' | worst upper REL (p>=1e-6): ' + wUpRel.toExponential(2) +
            ' | worst upper ABS: ' + wUpAbs.toExponential(2));

// ===========================================================================
console.log('== 2. qtukey vs R (' + T.qtukey.length + ' grid points) ==');
var wQRel = 0, wRT = 0;
T.qtukey.forEach(function (g) {
  var m = P.qtukey(g.p, 1, g.cc, g.df);
  wQRel = Math.max(wQRel, rel(m, g.q));
  // tolerance-free: my q must invert ptukey, regardless of where R stopped
  var rt = Math.abs(P.ptukey(m, 1, g.cc, g.df, true) - g.p);
  wRT = Math.max(wRT, rt);
  ok(rt <= 1e-9, 'qtukey round-trip p=' + g.p + ' cc=' + g.cc + ' df=' + g.df,
     'ptukey(qtukey(p)) - p = ' + rt.toExponential(3));
  ok(rel(m, g.q) <= 1e-4, 'qtukey vs R p=' + g.p + ' cc=' + g.cc + ' df=' + g.df,
     'mine=' + m + ' R=' + g.q + ' rel=' + rel(m, g.q).toExponential(3));
});
// adjudication: my q must invert ptukey at least as well as R's q does.
var mineBetter = 0, rWorse = 0;
T.qtukey.forEach(function (g) {
  var m = P.qtukey(g.p, 1, g.cc, g.df);
  var rtMine = Math.abs(P.ptukey(m, 1, g.cc, g.df, true) - g.p);
  var rtR = Math.abs(P.ptukey(g.q, 1, g.cc, g.df, true) - g.p);
  if (rtMine <= rtR + 1e-15) mineBetter++; else rWorse++;
  ok(rtMine <= rtR + 1e-15, 'qtukey mine inverts >= as well as R p=' + g.p + ' cc=' + g.cc + ' df=' + g.df,
     'mineRT=' + rtMine.toExponential(2) + ' R_RT=' + rtR.toExponential(2));
});
console.log('   worst REL vs R: ' + wQRel.toExponential(2) +
            ' | worst round-trip |ptukey(q)-p|: ' + wRT.toExponential(2));
console.log('   adjudication: mine inverts ptukey >= as well as R in ' +
            mineBetter + '/' + T.qtukey.length + ' (R worse in ' + rWorse + ')');

// ===========================================================================
console.log('== 3. omnibus ANOVA + Kruskal-Wallis vs R (14 datasets) ==');
Object.keys(T.cases).forEach(function (key) {
  var c = T.cases[key], A = P.analyzeRaw(groupsOf(c), { conf: 0.95 });
  closeRel(A.omnibus.f, c.aov.f, 1e-10, key + ' aov F');
  closeRel(A.omnibus.p, c.aov.p, 1e-9, key + ' aov p');
  closeRel(A.msW, c.aov.msW, 1e-12, key + ' MSW');
  ok(A.dfW === c.aov.dfW, key + ' dfW', 'mine=' + A.dfW + ' R=' + c.aov.dfW);
  closeRel(A.kruskal.chisq, c.kruskal.chisq, 1e-10, key + ' KW chisq');
  closeRel(A.kruskal.p, c.kruskal.p, 1e-9, key + ' KW p');
  // group summaries (jsonlite data.frame -> array of row objects)
  c.groups.forEach(function (g, i) {
    closeRel(A.means[i], g.mean, 1e-12, key + ' mean[' + g.name + ']');
    ok(A.ns[i] === g.n, key + ' n[' + g.name + ']', 'mine=' + A.ns[i] + ' R=' + g.n);
    if (g.n > 1) closeRel(A.sds[i], g.sd, 1e-12, key + ' sd[' + g.name + ']');
  });
});

// ===========================================================================
console.log('== 4. TukeyHSD vs R (14 datasets x 3 conf levels) ==');
var wDiff = 0, wLwr = 0, wUpr = 0, wPadjRel = 0, wPadjAbs = 0, floorRows = 0;
Object.keys(T.cases).forEach(function (key) {
  var c = T.cases[key], G = groupsOf(c);
  CONFS.forEach(function (cf) {
    var A = P.analyzeRaw(G, { conf: parseFloat(cf) });
    var ref = c.tukey[cf];
    ok(A.tukey.pairs.length === ref.length, key + ' ' + cf + ' pair count');
    A.tukey.pairs.forEach(function (pr, i) {
      var rr = ref[i];
      ok(pr.pair === rr.pair, key + ' ' + cf + ' pair order[' + i + ']',
         'mine=' + pr.pair + ' R=' + rr.pair);
      closeRel(pr.diff, rr.diff, 1e-10, key + ' ' + cf + ' diff ' + pr.pair);
      wDiff = Math.max(wDiff, rel(pr.diff, rr.diff));
      // CI bounds can straddle zero, so scale the error by the half-width
      var half = pr.upr - pr.diff;
      var eL = Math.abs(pr.lwr - rr.lwr) / half, eU = Math.abs(pr.upr - rr.upr) / half;
      wLwr = Math.max(wLwr, eL); wUpr = Math.max(wUpr, eU);
      // the bound is diff +/- qtukey*se, so it inherits R's ~1e-6 qtukey noise
      ok(eL <= 1e-5, key + ' ' + cf + ' lwr ' + pr.pair,
         'mine=' + pr.lwr + ' R=' + rr.lwr + ' err/halfwidth=' + eL.toExponential(2));
      ok(eU <= 1e-5, key + ' ' + cf + ' upr ' + pr.pair,
         'mine=' + pr.upr + ' R=' + rr.upr + ' err/halfwidth=' + eU.toExponential(2));
      wPadjAbs = Math.max(wPadjAbs, Math.abs(pr.padj - rr.padj));
      if (rr.padj >= 1e-6) {
        wPadjRel = Math.max(wPadjRel, rel(pr.padj, rr.padj));
        ok(rel(pr.padj, rr.padj) <= 1e-6, key + ' ' + cf + ' padj ' + pr.pair,
           'mine=' + pr.padj + ' R=' + rr.padj + ' rel=' + rel(pr.padj, rr.padj).toExponential(2));
      } else {
        floorRows++;
        ok(Math.abs(pr.padj - rr.padj) <= 5e-12, key + ' ' + cf + ' padj(floor) ' + pr.pair,
           'mine=' + pr.padj + ' R=' + rr.padj);
      }
    });
  });
});
console.log('   worst diff REL: ' + wDiff.toExponential(2) +
            ' | worst lwr/upr err-over-halfwidth: ' + Math.max(wLwr, wUpr).toExponential(2));
console.log('   worst padj REL (p>=1e-6): ' + wPadjRel.toExponential(2) +
            ' | worst padj ABS: ' + wPadjAbs.toExponential(2) +
            ' | rows in cancellation floor: ' + floorRows);

// ===========================================================================
console.log('== 5. pairwise.t.test bonferroni vs R (14 datasets) ==');
Object.keys(T.cases).forEach(function (key) {
  var c = T.cases[key], A = P.analyzeRaw(groupsOf(c), { conf: 0.95 });
  var ref = c.bonferroni, refMap = {};
  ref.forEach(function (r) { refMap[r.pair] = r; });
  A.bonferroni.pairs.forEach(function (pr) {
    var r = refMap[pr.pair];
    if (!ok(!!r, key + ' bonf pair present ' + pr.pair,
            'R pairs=' + JSON.stringify(ref.map(function (x) { return x.pair; })))) return;
    closeRel(pr.praw, r.praw, 1e-9, key + ' bonf raw p ' + pr.pair);
    closeRel(pr.padj, r.padj, 1e-9, key + ' bonf adj p ' + pr.pair);
  });
  ok(A.bonferroni.pairs.length === ref.length, key + ' bonf pair count');
});

// ===========================================================================
console.log('== 6. FSA::dunnTest(method="bh") vs R (14 datasets) ==');
var wZ = 0, wDp = 0;
Object.keys(T.cases).forEach(function (key) {
  var c = T.cases[key], A = P.analyzeRaw(groupsOf(c), { conf: 0.95 });
  var ref = c.dunn;
  ok(A.dunn.pairs.length === ref.length, key + ' dunn pair count',
     'mine=' + A.dunn.pairs.length + ' R=' + ref.length);
  A.dunn.pairs.forEach(function (pr, i) {
    ok(pr.pair === ref[i].pair, key + ' dunn pair order[' + i + ']',
       'mine=' + pr.pair + ' R=' + ref[i].pair);
    closeRel(pr.z, ref[i].z, 1e-10, key + ' dunn z ' + pr.pair);
    closeRel(pr.praw, ref[i].praw, 1e-9, key + ' dunn raw p ' + pr.pair);
    closeRel(pr.padj, ref[i].padj, 1e-9, key + ' dunn BH p ' + pr.pair);
    wZ = Math.max(wZ, rel(pr.z, ref[i].z));
    wDp = Math.max(wDp, rel(pr.padj, ref[i].padj));
  });
});
console.log('   worst z REL: ' + wZ.toExponential(2) + ' | worst BH p REL: ' + wDp.toExponential(2));

// ===========================================================================
console.log('== 7. dunn.test BH quirk is reproduced (NOT p.adjust BH) ==');
(function () {
  var d = T.bhDivergence;
  var mine = P.dunnBH(d.p);
  d.dunntest_bh.forEach(function (v, i) {
    closeRel(mine[i], v, 1e-12, 'dunnBH[' + i + '] matches dunn.test');
  });
  // and it must genuinely DIFFER from p.adjust BH, else the quirk is not encoded
  var differs = d.padjust_bh.some(function (v, i) { return Math.abs(v - mine[i]) > 1e-12; });
  ok(differs, 'dunnBH differs from p.adjust BH on the divergent case',
     'mine=' + JSON.stringify(mine) + ' p.adjust=' + JSON.stringify(d.padjust_bh));
  // the step-up rejections must equal p.adjust(BH) <= alpha
  var rej = P.dunnReject(d.p, 'bh', 0.05);
  d.padjust_bh.forEach(function (v, i) {
    ok(rej[i] === (v <= 0.05), 'dunnReject[' + i + '] == (p.adjust BH <= .05)');
  });
})();

// ===========================================================================
console.log('== 8. compact letter display vs multcompView (14 x 3) ==');
Object.keys(T.cases).forEach(function (key) {
  var c = T.cases[key], G = groupsOf(c);
  CONFS.forEach(function (cf) {
    var conf = parseFloat(cf), alpha = 1 - conf;
    var A = P.analyzeRaw(G, { conf: conf });
    var sig = A.tukey.pairs.filter(function (p) { return p.padj < alpha; });
    var letters = P.cld(A.names, sig, null);

    // (a) the CLD contract: share a letter <=> NOT significant
    A.tukey.pairs.forEach(function (pr) {
      var shares = letters[pr.ai].split('').some(function (ch) {
        return letters[pr.bi].indexOf(ch) >= 0;
      });
      var significant = pr.padj < alpha;
      ok(shares !== significant, key + ' ' + cf + ' CLD contract ' + pr.pair,
         'letters=' + letters[pr.ai] + '/' + letters[pr.bi] + ' padj=' + pr.padj + ' alpha=' + alpha);
    });

    // (b) same SET PARTITION as multcompView (letter names are arbitrary)
    var refMap = {};
    c.letters[cf].forEach(function (r) { refMap[r.group] = r.letters; });
    function partition(namesArr, get) {
      var byLetter = {};
      namesArr.forEach(function (nm, i) {
        get(nm, i).split('').forEach(function (ch) {
          (byLetter[ch] = byLetter[ch] || []).push(nm);
        });
      });
      return Object.keys(byLetter).map(function (ch) { return byLetter[ch].slice().sort().join('|'); })
                   .sort().join(' ; ');
    }
    var mineP = partition(A.names, function (nm, i) { return letters[i]; });
    var refP = partition(A.names, function (nm) { return refMap[nm] || ''; });
    ok(mineP === refP, key + ' ' + cf + ' CLD partition == multcompView',
       'mine=[' + mineP + '] multcompView=[' + refP + ']');
  });
});

// ===========================================================================
console.log('== 9. summary mode vs exact-moments reconstruction (4 x 3 conf) ==');
Object.keys(T.summaryMode).forEach(function (key) {
  var s = T.summaryMode[key];
  // the reconstruction R used is exact: prove it before trusting the case
  s.mean.forEach(function (m, i) {
    closeRel(s.reconMean[i], m, 1e-12, key + ' R reconstruction mean exact[' + i + ']');
    closeRel(s.reconSd[i], s.sd[i], 1e-12, key + ' R reconstruction sd exact[' + i + ']');
  });
  // my own reconstruct() must have the same property
  s.n.forEach(function (n, i) {
    var x = P.reconstruct(s.mean[i], s.sd[i], n);
    closeRel(P.mean(x), s.mean[i], 1e-12, key + ' JS reconstruct mean[' + i + ']');
    closeRel(P.sd(x), s.sd[i], 1e-12, key + ' JS reconstruct sd[' + i + ']');
  });
  CONFS.forEach(function (cf) {
    var A = P.analyzeSummary(s.groupNames, s.mean, s.sd, s.n, { conf: parseFloat(cf) });
    closeRel(A.omnibus.f, s.aov.f, 1e-9, key + ' ' + cf + ' summary F');
    closeRel(A.omnibus.p, s.aov.p, 1e-8, key + ' ' + cf + ' summary p');
    closeRel(A.msW, s.aov.msW, 1e-10, key + ' ' + cf + ' summary MSW');
    var ref = s.tukey[cf];
    A.tukey.pairs.forEach(function (pr, i) {
      var rr = ref[i];
      ok(pr.pair === rr.pair, key + ' ' + cf + ' summary pair order');
      closeRel(pr.diff, rr.diff, 1e-9, key + ' ' + cf + ' summary diff ' + pr.pair);
      var half = pr.upr - pr.diff;
      ok(Math.abs(pr.lwr - rr.lwr) / half <= 1e-5, key + ' ' + cf + ' summary lwr ' + pr.pair,
         'mine=' + pr.lwr + ' R=' + rr.lwr);
      ok(Math.abs(pr.upr - rr.upr) / half <= 1e-5, key + ' ' + cf + ' summary upr ' + pr.pair,
         'mine=' + pr.upr + ' R=' + rr.upr);
      if (rr.padj >= 1e-6) closeRel(pr.padj, rr.padj, 1e-6, key + ' ' + cf + ' summary padj ' + pr.pair);
      else closeAbs(pr.padj, rr.padj, 5e-12, key + ' ' + cf + ' summary padj(floor) ' + pr.pair);
    });
    // bonferroni too
    var bmap = {};
    s.bonferroni.forEach(function (r) { bmap[r.pair] = r.padj; });
    A.bonferroni.pairs.forEach(function (pr) {
      closeRel(pr.padj, bmap[pr.pair], 1e-9, key + ' ' + cf + ' summary bonf ' + pr.pair);
    });
  });
});

// ===========================================================================
console.log('== 10. input guards ==');
(function () {
  function throws(fn, label) { try { fn(); ok(false, label, 'did not throw'); } catch (e) { ok(true, label); } }
  throws(function () { P.analyzeRaw([{ name: 'A', values: [1, 2] }, { name: 'B', values: [3, 4] }]); },
         'two groups rejected (t-test territory)');
  throws(function () { P.analyzeSummary(['A', 'B'], [1, 2], [1, 1], [5, 5]); },
         'summary two groups rejected');
  throws(function () { P.analyzeSummary(['A', 'B', 'C'], [1, 2, 3], [1, 1, 1], [1, 5, 5]); },
         'summary n=1 rejected (no SD)');
  throws(function () { P.analyzeSummary(['A', 'B', 'C'], [1, 2, 3], [-1, 1, 1], [5, 5, 5]); },
         'summary negative SD rejected');
  throws(function () { P.analyzeRaw([{ name: 'A', values: [1] }, { name: 'B', values: [2] }, { name: 'C', values: [3] }]); },
         'all n=1 rejected (no residual df)');
})();

// ===========================================================================
// MUTATION TEST: the gate must be able to fail.
console.log('== 11. mutation test (these MUST be caught) ==');
(function () {
  var c = T.cases.balanced_k3, G = groupsOf(c), A = P.analyzeRaw(G, { conf: 0.95 });
  var ref = c.tukey['0.95'];
  var mut = 0, caught = 0;

  // (a) Tukey p adj without the /2 in the SE (a classic reimplementation bug)
  mut++;
  var seWrong = Math.sqrt(A.msW * (1 / A.ns[1] + 1 / A.ns[0]));
  var pWrong = P.ptukey(Math.abs((A.means[1] - A.means[0]) / seWrong), 1, 3, A.dfW, false);
  if (rel(pWrong, ref[0].padj) > 1e-6) caught++;

  // (b) Dunn using p.adjust BH instead of dunn.test's raw multiplier
  mut++;
  var d = T.bhDivergence;
  var MT = require(path.join(ROOT, 'tools', 'lib', 'multiple-testing-math.js'));
  if (MT.padjust(d.p, 'BH').some(function (v, i) { return rel(v, d.dunntest_bh[i]) > 1e-9; })) caught++;

  // (c) pairwise.t.test with per-pair SDs instead of the pooled SD
  mut++;
  var s1 = A.sds[0], s2 = A.sds[1], n1 = A.ns[0], n2 = A.ns[1];
  var seUnpooled = Math.sqrt(s1 * s1 / n1 + s2 * s2 / n2);
  var tW = (A.means[1] - A.means[0]) / seUnpooled;
  var bref = c.bonferroni;
  var TTm = require(path.join(ROOT, 'tools', 'lib', 'ttest-math.js'));
  var pw = Math.min(1, 3 * 2 * TTm.tCDF(-Math.abs(tW), A.dfW));
  if (rel(pw, bref[0].padj) > 1e-9) caught++;

  // (d) wprob with the wrong scale constant (the sqrt(32)/sqrt(2pi) bug)
  mut++;
  var badWprob = P.wprob(1.5, 1, 2) * (2.506628274631 / 5.65685424949238);
  if (rel(badWprob, 0.711155633653516) > 1e-6) caught++;

  ok(caught === mut, 'all ' + mut + ' mutations caught', 'caught=' + caught + '/' + mut);
  console.log('   mutations caught: ' + caught + '/' + mut);
})();

// ===========================================================================
console.log('\n' + (fail === 0 ? 'PASS' : 'FAIL') + ': ' + pass + '/' + checks + ' checks');
if (fail) {
  console.log('\nfirst failures:');
  failures.forEach(function (f) { console.log('  - ' + f); });
  process.exit(1);
}
