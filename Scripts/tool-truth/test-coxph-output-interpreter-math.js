/* Harness: tools/lib/cox-math.js vs Scripts/tool-truth/coxph-output-interpreter.json
   (R 4.6.0 survival::coxph, 16 real fits).

   Three gates, deliberately different because they are different claims:

     A. PARSE      - every number recovered from the pasted text must equal the
                     number R printed, exactly. A parser that is "close" is
                     broken. Tolerance: 0 (compared as printed strings ->
                     floats, so equality is exact).

     B. ARITHMETIC - HR = exp(coef), CI = exp(coef +- z*se) recomputed from the
                     PARSED (rounded) coef/se vs R's FULL-PRECISION values.
                     These cannot be equal: the paste lost digits. The gate is
                     the interval the printed precision actually supports
                     (cox-math precisionOf), not a tolerance tuned until green.
                     If R's value falls outside the achievable interval, the
                     arithmetic is wrong.

     C. GLOBAL P   - p recomputed from the printed chi-square + df vs R's
                     full-precision p, at 1e-6 relative. R prints the statistic
                     rounded (10.63), so this too is gated on the achievable
                     interval, not on equality.

   Run: node Scripts/tool-truth/test-coxph-output-interpreter-math.js */
'use strict';

const fs = require('fs');
const path = require('path');
const CM = require('../../tools/lib/cox-math.js');

const truth = JSON.parse(fs.readFileSync(
  path.join(__dirname, 'coxph-output-interpreter.json'), 'utf8'));

let pass = 0, fail = 0;
const fails = [];

function ok(cond, label, detail) {
  if (cond) { pass++; return true; }
  fail++;
  fails.push(label + (detail ? '  ' + detail : ''));
  return false;
}

function eq(got, want, label) {
  const good = (Number.isNaN(got) && Number.isNaN(want)) || got === want;
  return ok(good, label, `got ${got} want ${want}`);
}

function rel(got, want) {
  if (want === 0) return Math.abs(got);
  return Math.abs(got - want) / Math.abs(want);
}

function within(x, iv, label, slack) {
  // allow a hair of float slack on the interval edges
  const s = slack === undefined ? 1e-12 : slack;
  const lo = Math.min(iv[0], iv[1]) * (1 - s) - s;
  const hi = Math.max(iv[0], iv[1]) * (1 + s) + s;
  return ok(x >= lo && x <= hi, label, `${x} not in [${lo}, ${hi}]`);
}

// For p-values the additive slack above is useless: it spans [-1e-9, 1e-9],
// which contains every deep-tail p there is. This gate caught nothing when
// pFromChisq was returning a flat 0 for p ~ 1e-45. Positive quantities get a
// purely RELATIVE interval so the tail is actually policed.
function withinRel(x, iv, label) {
  const a = Math.min(iv[0], iv[1]), b = Math.max(iv[0], iv[1]);
  if (a === 0 && b === 0) return ok(x === 0, label, `${x} but interval is exactly [0,0]`);
  const lo = a * (1 - 1e-9), hi = b * (1 + 1e-9);
  return ok(x >= lo && x <= hi, label, `${x} not in [${lo}, ${hi}]`);
}

const cases = Array.isArray(truth.cases) ? truth.cases : [truth.cases];

// ---- deep tails, gated directly against R --------------------------------
// These are the numbers the page shows where R itself printed only "<2e-16".
for (const t of truth.chisq_tail) {
  const got = CM.pFromChisq(t.stat, t.df);
  ok(rel(got, t.p) < 1e-9,
     `chisq tail p(${t.stat}, df=${t.df})`, `${got} vs R ${t.p}`);
  ok(got > 0 || t.p === 0, `chisq tail p(${t.stat}, df=${t.df}) did not cancel to zero`);
}
for (const t of truth.ztail) {
  const got = CM.pFromZ(t.z);
  ok(rel(got, t.p) < 1e-9, `wald p from z=${t.z}`, `${got} vs R ${t.p}`);
}

// R's qnorm multipliers must be what the library uses for the CI.
{
  const got95 = CM.ciFromCoef(0, 1, 0.95).z;
  ok(rel(got95, truth.zmult.z95) < 1e-12, 'zmult .95', `${got95} vs ${truth.zmult.z95}`);
  const got90 = CM.ciFromCoef(0, 1, 0.90).z;
  ok(rel(got90, truth.zmult.z90) < 1e-12, 'zmult .90', `${got90} vs ${truth.zmult.z90}`);
  const got99 = CM.ciFromCoef(0, 1, 0.99).z;
  ok(rel(got99, truth.zmult.z99) < 1e-12, 'zmult .99', `${got99} vs ${truth.zmult.z99}`);
}

for (const c of cases) {
  const tag = c.id;
  const p = CM.parseSummary(c.text);

  if (!ok(p.ok, `${tag}: parses`, p.error)) continue;

  // ---- A. PARSE fidelity -------------------------------------------------
  eq(p.n, c.n, `${tag}: n`);
  eq(p.events, c.nevent, `${tag}: events`);
  eq(p.nmiss, c.nmiss, `${tag}: nmiss`);
  eq(p.level, c.conf, `${tag}: conf level`);
  eq(p.robust, c.robust, `${tag}: robust flag`);
  ok(p.terms.length === c.terms.length, `${tag}: term count`,
     `got ${p.terms.length} want ${c.terms.length}`);

  const rterms = Array.isArray(c.terms) ? c.terms : [c.terms];
  for (let i = 0; i < Math.min(p.terms.length, rterms.length); i++) {
    const g = p.terms[i], w = rterms[i];
    eq(g.name, w.name, `${tag}[${i}]: name`);

    // the parsed number must equal R's own value ROUNDED to what R printed.
    // That is the only exact statement available: compare parsed <-> printed.
    const roundToText = (val, text) => {
      if (!text) return null;
      const t = text.charAt(0) === '<' ? text.slice(1) : text;
      const m = /^[-+]?(\d*)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(t);
      if (!m) return null;
      if (m[3] !== undefined) {                    // scientific: use sig digits
        const sig = (m[1] || '').replace(/^0+/, '').length + (m[2] ? m[2].length : 0);
        return Number(val.toPrecision(Math.max(sig, 1)));
      }
      const dec = m[2] ? m[2].length : 0;
      return Number(val.toFixed(dec));
    };

    // coef / se / z as printed
    eq(g.coef, roundToText(w.coef, g.coefText), `${tag}[${i}]: coef parsed == R printed`);
    eq(g.se,   roundToText(w.se,   g.seText),   `${tag}[${i}]: se parsed == R printed`);
    if (c.robust) {
      ok(g.robustSe !== null, `${tag}[${i}]: robust se present`);
      eq(g.robustSe, roundToText(w.robust_se, g.robustSeText), `${tag}[${i}]: robust se parsed`);
      // the CI/z must be driven by the ROBUST se, not se(coef)
      ok(Math.abs(g.seUsed - g.robustSe) < 1e-15, `${tag}[${i}]: seUsed is the robust se`);
    } else {
      ok(Math.abs(g.seUsed - g.se) < 1e-15, `${tag}[${i}]: seUsed is se(coef)`);
    }
    if (!g.pCensored) {
      eq(g.p, roundToText(w.p, g.pText), `${tag}[${i}]: p parsed == R printed`);
    } else {
      ok(w.p < g.p, `${tag}[${i}]: censored p (<${g.p}) brackets R's ${w.p}`);
    }
    // CI table values as printed
    if (g.lower !== null) {
      eq(g.lower, roundToText(w.lower, g.lowerText), `${tag}[${i}]: CI lower parsed == R printed`);
      eq(g.upper, roundToText(w.upper, g.upperText), `${tag}[${i}]: CI upper parsed == R printed`);
    }
  }

  // concordance
  if (c.conc !== null && c.conc !== undefined && p.conc !== null) {
    const dec = (p.concT.split('.')[1] || '').length;
    eq(p.conc, Number(c.conc.toFixed(dec)), `${tag}: concordance parsed == R printed`);
  }

  // global tests parsed
  const tmap = { lrt: c.logtest, wald: c.waldtest, score: c.sctest };
  for (const k of Object.keys(tmap)) {
    const w = tmap[k], g = p.tests[k];
    if (!ok(!!g, `${tag}: ${k} test present`)) continue;
    eq(g.df, w.df, `${tag}: ${k} df`);
    // The statistic is gated on the interval its OWN printing supports, not a
    // fixed relative tolerance: R prints "0.34" for 0.33784, which is a 6e-3
    // relative gap purely from rounding and says nothing about the parser.
    const sh = CM.halfUlp(String(g.stat));
    within(w.stat, [g.stat - sh, g.stat + sh], `${tag}: ${k} stat parsed == R printed`, 1e-9);
  }

  // ---- B. ARITHMETIC vs R's full precision ------------------------------
  const a = CM.analyze(p);
  for (let i = 0; i < Math.min(a.terms.length, rterms.length); i++) {
    const t = a.terms[i], w = rterms[i];

    // HR = exp(coef): R's full-precision exp(coef) must sit inside the
    // interval the printed coef supports.
    within(w.expcoef, t.precision.hr, `${tag}[${i}]: R exp(coef) within printed-precision HR interval`);

    // and the recomputed HR must match R's to the precision the paste allows
    const hrTol = Math.max(1e-9, t.precision.coefHalfUlp * 1.5);
    ok(rel(t.recomputed.hr, w.expcoef) < hrTol,
       `${tag}[${i}]: recomputed HR ~ R exp(coef)`,
       `${t.recomputed.hr} vs ${w.expcoef} (tol ${hrTol})`);

    // CI bounds
    within(w.lower, t.precision.lower, `${tag}[${i}]: R CI lower within printed-precision interval`);
    within(w.upper, t.precision.upper, `${tag}[${i}]: R CI upper within printed-precision interval`);

    // z = coef/se
    if (isFinite(w.z)) {
      const zTol = Math.max(1e-6, (t.precision.coefHalfUlp / Math.abs(w.coef) +
                                   t.precision.seHalfUlp / Math.abs(w.se_used)) * 2);
      ok(rel(t.recomputed.z, w.z) < zTol,
         `${tag}[${i}]: recomputed z ~ R z`, `${t.recomputed.z} vs ${w.z} (tol ${zTol})`);
    }

    // exp(-coef) is R's own reciprocal
    if (t.raw.expneg !== null) {
      ok(rel(1 / t.recomputed.hr, w.expneg) < Math.max(1e-3, hrTol * 2),
         `${tag}[${i}]: 1/HR ~ R exp(-coef)`, `${1 / t.recomputed.hr} vs ${w.expneg}`);
    }

    // CI must bracket the point estimate, always
    ok(t.recomputed.ci.lower < t.recomputed.hr && t.recomputed.hr < t.recomputed.ci.upper,
       `${tag}[${i}]: CI brackets HR`);

    // crosses-1 reading must agree with R's own printed interval
    if (t.raw.lower !== null) {
      const rCross = (w.lower < 1 && w.upper > 1);
      ok(t.read.crossesOne === rCross,
         `${tag}[${i}]: crosses-1 reading matches R's interval`,
         `read ${t.read.crossesOne} vs R ${rCross}`);
    }
  }

  // ---- C. GLOBAL test p recomputation ------------------------------------
  const gm = { lrt: c.logtest, wald: c.waldtest, score: c.sctest };
  for (const k of Object.keys(gm)) {
    const w = gm[k], g = p.tests[k];
    if (!g) continue;
    const got = CM.pFromChisq(g.stat, g.df);
    // the printed statistic is rounded, so p is only pinned to the interval
    // that rounding supports. Derive it rather than loosening a tolerance.
    const h = CM.halfUlp(String(g.stat));
    const pHi = CM.pFromChisq(Math.max(g.stat - h, 0), g.df);
    const pLo = CM.pFromChisq(g.stat + h, g.df);
    withinRel(w.p, [pLo, pHi], `${tag}: R ${k} p within printed-statistic interval`);
    ok(got > 0 && got <= 1, `${tag}: ${k} recomputed p is a live positive tail`, `got ${got}`);
    // R prints "<2e-16" and stops. Recovering the actual tail is the point of
    // recomputing at all, so assert it survived rather than cancelling to 0.
    if (g.pCensored) {
      ok(got > 0 && got < 2e-16,
         `${tag}: ${k} censored p recomputed to a real tail`, `got ${got}`);
    }
  }
}

// ---- factor levels are read off the Call, not guessed ---------------------
// R names a level <variable><level>. These are the real names from the fits.
{
  const expect = {
    veteran_celltype: { celltypesmallcell: ['celltype', 'smallcell'],
                        celltypeadeno:     ['celltype', 'adeno'],
                        celltypelarge:     ['celltype', 'large'],
                        trt: null, karno: null },
    // "rxLev" and "rxLev+5FU" share the prefix "rxLev", but the VARIABLE is "rx"
    colon_big:       { rxLev: ['rx', 'Lev'], 'rxLev+5FU': ['rx', 'Lev+5FU'],
                       nodes: null, extent: null },
    // a lone level with no sibling to share a prefix with
    preset_factor:   { sexffemale: ['sexf', 'female'],
                       age: null, 'ph.karno': null, 'wt.loss': null },
    // a function call in the formula must not be mistaken for a level
    pbc_bili:        { 'log(bili)': null, age: null, edema: null },
    preset_sex:      { sex: null }
  };
  for (const [cid, want] of Object.entries(expect)) {
    const c = cases.find(x => x.id === cid);
    const a = CM.analyze(CM.parseSummary(c.text));
    for (const t of a.terms) {
      const w = want[t.raw.name];
      if (w === undefined) continue;
      if (w === null) {
        ok(t.read.isLevel === false, `${cid}: ${t.raw.name} is not a factor level`,
           `got base=${t.read.base} level=${t.read.levelName}`);
      } else {
        ok(t.read.isLevel === true && t.read.base === w[0] && t.read.levelName === w[1],
           `${cid}: ${t.raw.name} -> ${w[0]} = ${w[1]}`,
           `got base=${t.read.base} level=${t.read.levelName}`);
      }
    }
  }
}

// ---- malformed input must fail cleanly, never throw or half-parse ---------
const junk = [
  ['', 'empty'],
  ['   \n  \n', 'whitespace'],
  ['hello world', 'prose'],
  ['Call:\nlm(formula = y ~ x)\n\nResiduals:\n', 'an lm summary, not coxph'],
  ['{"a":1}', 'json'],
  ['coef exp(coef) se(coef) z Pr(>|z|)', 'header with no rows']
];
for (const [txt, label] of junk) {
  let r;
  try { r = CM.parseSummary(txt); }
  catch (e) { ok(false, `malformed (${label}): threw instead of returning an error`, e.message); continue; }
  ok(r && r.ok === false && typeof r.error === 'string' && r.error.length > 0,
     `malformed (${label}): returns a clean error`);
}

// a truncated-but-real paste: coef table only, no CI table. Must still work.
{
  const full = cases.find(c => c.id === 'preset_sex');
  const cut = full.text.split('\n').slice(0, 8).join('\n');
  const r = CM.parseSummary(cut);
  ok(r.ok, 'truncated paste (coef table only) still parses');
  if (r.ok) {
    ok(r.terms.length === 1, 'truncated paste: term recovered');
    ok(r.terms[0].lower === null, 'truncated paste: no CI table -> null, not a guess');
    const a = CM.analyze(r);
    ok(a.terms[0].read.lower > 0, 'truncated paste: CI recomputed from coef/se');
    ok(r.warnings.some(w => /confidence-interval table was not found/.test(w)),
       'truncated paste: warns that the CI was recomputed');
  }
}

console.log(`\ncox-math vs R: ${pass} passed, ${fail} failed`);
if (fails.length) {
  console.log('\nFailures:');
  fails.slice(0, 40).forEach(f => console.log('  ' + f));
  if (fails.length > 40) console.log(`  ... and ${fails.length - 40} more`);
  process.exit(1);
}
process.exit(0);
