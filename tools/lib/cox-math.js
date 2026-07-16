/* cox-math.js - parse and decode a printed summary(coxph) from R's survival
   package (Tool Farm v2).

   Ground truth: R 4.6.0 survival::coxph over 16 real fits, see
   Scripts/tool-truth/coxph-output-interpreter.json. Two separate contracts:

     PARSE      - every number this recovers must equal, digit for digit, the
                  number R printed. Zero tolerance.
     ARITHMETIC - HR = exp(coef) and CI = exp(coef +- z*se) recomputed from the
                  parsed (already rounded) coef/se, checked against R's
                  full-precision internals within the bound the printed
                  precision actually allows. A pasted summary cannot do better
                  than the digits it carries, and this library does not pretend
                  otherwise: `precision` reports the interval the paste
                  supports.

   Composes the existing exact primitives, adds no new ones:
     - DistTablesMath: pnorm/qnorm (Wald p and CI multiplier), pchisq (the
       three global tests). Cox global tests carry small df, well inside the
       range where the shared incomplete-gamma tail is exact.

   Browser: window.CoxMath (needs NormalMath + TTestMath + DistTablesMath
   loaded first). Node: require('./cox-math.js'). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./dist-tables-math.js'));
  } else {
    root.CoxMath = factory(root.DistTablesMath);
  }
}(typeof self !== 'undefined' ? self : this, function (D) {
  'use strict';

  var pnorm = D.pnorm, qnorm = D.qnorm, pvChisq = D.pvChisq;

  // ---------------------------------------------------------------- helpers

  // A token R would print as a number in a summary: -0.5310, 9.18e-05, 1e-06,
  // <2e-16, NA. The leading "<" matters: R censors tiny p-values that way and
  // a parser that drops it silently reports a false exact value.
  var NUMRE = /^<?-?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;
  var STARRE = /^[*.]+$/;

  function isNum(tok) { return NUMRE.test(tok) || tok === 'NA' || tok === 'NaN'; }

  // parse a printed token -> {value, censored, text}
  function tok2num(tok) {
    if (tok === 'NA' || tok === 'NaN') return { value: NaN, censored: false, text: tok };
    if (tok.charAt(0) === '<') {
      return { value: parseFloat(tok.slice(1)), censored: true, text: tok };
    }
    return { value: parseFloat(tok), censored: false, text: tok };
  }

  function words(line) { return line.trim().split(/\s+/).filter(function (s) { return s.length; }); }

  // R censors a tiny p BOTH ways depending on the column width it chose:
  // "< 2e-16" (spaced) in a wide coef table, "<2e-16" (unspaced) in a narrow
  // one, and "p=<2e-16" in the global-test block. Splitting on whitespace
  // turns the spaced form into two tokens, which silently knocks the row out
  // of alignment, so stitch a lone "<" back onto the number it belongs to.
  function mergeLt(w) {
    var out = [];
    for (var i = 0; i < w.length; i++) {
      if (w[i] === '<' && i + 1 < w.length) { out.push('<' + w[i + 1]); i++; }
      else out.push(w[i]);
    }
    return out;
  }

  // Number of decimals / significant digits R printed, so the achievable
  // precision of anything recomputed from it can be stated rather than guessed.
  function halfUlp(text) {
    if (!text || text === 'NA') return 0;
    var t = text.charAt(0) === '<' ? text.slice(1) : text;
    var m = /^[-+]?(\d*)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(t);
    if (!m) return 0;
    var dec = m[2] ? m[2].length : 0;
    var exp = m[3] ? parseInt(m[3], 10) : 0;
    return 0.5 * Math.pow(10, -dec + exp);
  }

  // ---------------------------------------------------------------- parsing

  function fail(msg, hint) { return { ok: false, error: msg, hint: hint || '' }; }

  function parseSummary(text) {
    if (typeof text !== 'string' || !text.trim()) {
      return fail('Nothing pasted yet.',
                  'Paste the whole thing summary(model) printed, from the Call: line to the last test.');
    }

    var lines = text.replace(/\r\n?/g, '\n').split('\n');
    var i, L, m;
    var out = {
      ok: true, call: '', n: null, events: null, nmiss: 0,
      robust: false, level: 0.95, terms: [], conc: null, concSe: null,
      tests: {}, regions: {}, warnings: []
    };

    // --- Call: possibly wrapped over several lines
    for (i = 0; i < lines.length; i++) {
      if (/^\s*Call:/.test(lines[i])) {
        var callLines = [], j = i + 1;
        while (j < lines.length && lines[j].trim() !== '') { callLines.push(lines[j].trim()); j++; }
        out.call = callLines.join(' ');
        out.regions.call = [i, j - 1];
        break;
      }
    }

    // --- n / events header:  "  n= 228, number of events= 165"
    for (i = 0; i < lines.length; i++) {
      m = /n\s*=\s*(\d+)\s*,\s*number of events\s*=\s*(\d+)/.exec(lines[i]);
      if (m) {
        out.n = parseInt(m[1], 10);
        out.events = parseInt(m[2], 10);
        out.regions.header = [i, i];
        // "   (14 observations deleted due to missingness)"
        if (i + 1 < lines.length) {
          var mm = /\((\d+)\s+observations?\s+deleted due to missingness\)/.exec(lines[i + 1]);
          if (mm) { out.nmiss = parseInt(mm[1], 10); out.regions.header = [i, i + 1]; }
        }
        break;
      }
    }

    // --- coefficient table: find its header line
    var chIdx = -1;
    for (i = 0; i < lines.length; i++) {
      L = lines[i];
      if (/\bcoef\b/.test(L) && /exp\(coef\)/.test(L) && /se\(coef\)/.test(L) && /Pr\(>\|z\|\)/.test(L)) {
        chIdx = i; break;
      }
    }
    if (chIdx < 0) {
      return fail('That does not look like a coxph summary.',
                  'The coefficient table with the coef, exp(coef), se(coef), z and Pr(>|z|) columns is missing. Paste the output of summary(model) where model came from coxph(), not the model object itself.');
    }
    out.robust = /robust se/.test(lines[chIdx]);
    var ncol = out.robust ? 6 : 5;   // coef, exp(coef), se(coef), [robust se,] z, Pr(>|z|)

    // rows run until a blank line, "---", or "Signif. codes"
    var rows = [], rEnd = chIdx;
    for (i = chIdx + 1; i < lines.length; i++) {
      L = lines[i];
      if (L.trim() === '' || /^---/.test(L) || /^Signif\. codes/.test(L)) break;
      var w = mergeLt(words(L));
      if (!w.length) break;
      // drop a trailing significance-stars token, then take the numbers from
      // the right: term names can be anything (factor levels, I(...) terms),
      // so anchoring on the right is the only safe read.
      if (w.length && STARRE.test(w[w.length - 1]) && !isNum(w[w.length - 1])) w.pop();
      if (w.length < ncol + 1) { out.warnings.push('Skipped a row that had too few columns: "' + L.trim() + '"'); continue; }
      var nums = w.slice(w.length - ncol);
      var allNum = nums.every(isNum);
      if (!allNum) { out.warnings.push('Skipped a row that did not parse as numbers: "' + L.trim() + '"'); continue; }
      var name = w.slice(0, w.length - ncol).join(' ');
      var k = 0;
      var row = { name: name };
      row.coefT    = tok2num(nums[k++]);
      row.expcoefT = tok2num(nums[k++]);
      row.seT      = tok2num(nums[k++]);
      if (out.robust) row.robustSeT = tok2num(nums[k++]);
      row.zT       = tok2num(nums[k++]);
      row.pT       = tok2num(nums[k++]);
      rows.push(row);
      rEnd = i;
    }
    if (!rows.length) {
      return fail('The coefficient table has no rows.',
                  'The header was found but no term rows under it. Copy the block again, keeping the line breaks R printed.');
    }
    out.regions.coeftable = [chIdx, rEnd];

    // --- exp(coef) / CI table:  "exp(coef) exp(-coef) lower .95 upper .95"
    var ciIdx = -1, ciMap = {};
    for (i = chIdx; i < lines.length; i++) {
      L = lines[i];
      m = /lower\s+\.(\d+)\s+upper\s+\.(\d+)/.exec(L);
      if (m && /exp\(coef\)/.test(L) && /exp\(-coef\)/.test(L)) {
        ciIdx = i;
        // ".95" -> 0.95, ".9" -> 0.90, ".995" -> 0.995
        out.level = parseFloat('0.' + m[1]);
        break;
      }
    }
    var ciEnd = ciIdx;
    if (ciIdx >= 0) {
      for (i = ciIdx + 1; i < lines.length; i++) {
        L = lines[i];
        if (L.trim() === '' || /^Concordance/.test(L)) break;
        var cw = mergeLt(words(L));
        if (cw.length < 5) break;
        var cn = cw.slice(cw.length - 4);
        if (!cn.every(isNum)) break;
        ciMap[cw.slice(0, cw.length - 4).join(' ')] = {
          expcoefT: tok2num(cn[0]), expnegT: tok2num(cn[1]),
          lowerT:   tok2num(cn[2]), upperT:  tok2num(cn[3])
        };
        ciEnd = i;
      }
      out.regions.citable = [ciIdx, ciEnd];
    }

    // --- Concordance= 0.579  (se = 0.021 )
    for (i = 0; i < lines.length; i++) {
      m = /Concordance\s*=\s*([0-9.]+)\s*(?:\(\s*se\s*=\s*([0-9.]+)\s*\))?/.exec(lines[i]);
      if (m) {
        out.conc = parseFloat(m[1]);
        out.concT = m[1];
        out.concSe = m[2] ? parseFloat(m[2]) : null;
        out.regions.concordance = [i, i];
        break;
      }
    }

    // --- the three global tests
    // "Likelihood ratio test= 10.63  on 1 df,   p=0.001"
    // "Score (logrank) test = 30.5  on 3 df,   p=1e-06,   Robust = 7.03  p=0.03"
    var testDefs = [
      { key: 'lrt',   re: /Likelihood ratio test\s*=\s*([0-9.eE+-]+)\s+on\s+(\d+)\s+df,\s*p\s*=\s*(<?[0-9.eE+-]+)/ },
      { key: 'wald',  re: /Wald test\s*=\s*([0-9.eE+-]+)\s+on\s+(\d+)\s+df,\s*p\s*=\s*(<?[0-9.eE+-]+)/ },
      { key: 'score', re: /Score \(logrank\) test\s*=\s*([0-9.eE+-]+)\s+on\s+(\d+)\s+df,\s*p\s*=\s*(<?[0-9.eE+-]+)/ }
    ];
    var tFirst = -1, tLast = -1;
    for (i = 0; i < lines.length; i++) {
      for (var t = 0; t < testDefs.length; t++) {
        m = testDefs[t].re.exec(lines[i]);
        if (m) {
          out.tests[testDefs[t].key] = {
            stat: parseFloat(m[1]), df: parseInt(m[2], 10),
            p: tok2num(m[3]).value, pCensored: tok2num(m[3]).censored, pText: m[3]
          };
          if (tFirst < 0) tFirst = i;
          tLast = i;
          if (testDefs[t].key === 'score') {
            var rm = /Robust\s*=\s*([0-9.eE+-]+)\s+p\s*=\s*(<?[0-9.eE+-]+)/.exec(lines[i]);
            if (rm) {
              out.tests.robustScore = {
                stat: parseFloat(rm[1]), df: out.tests.score.df,
                p: tok2num(rm[2]).value, pCensored: tok2num(rm[2]).censored, pText: rm[2]
              };
            }
          }
        }
      }
    }
    if (tFirst >= 0) out.regions.tests = [tFirst, tLast];

    // --- stitch the CI table onto the coef rows
    out.terms = rows.map(function (r) {
      var ci = ciMap[r.name] || null;
      var seT = out.robust ? r.robustSeT : r.seT;
      return {
        name: r.name,
        coef: r.coefT.value, coefText: r.coefT.text,
        expcoef: r.expcoefT.value, expcoefText: r.expcoefT.text,
        se: r.seT.value, seText: r.seT.text,
        robustSe: r.robustSeT ? r.robustSeT.value : null,
        robustSeText: r.robustSeT ? r.robustSeT.text : null,
        seUsed: seT.value, seUsedText: seT.text,
        z: r.zT.value, zText: r.zT.text,
        p: r.pT.value, pCensored: r.pT.censored, pText: r.pT.text,
        expneg:  ci ? ci.expnegT.value : null,
        expnegText: ci ? ci.expnegT.text : null,
        // R prints exp(coef) TWICE at different precision: 1.086059 in the coef
        // table, 1.0861 in the interval table. The interval table's version is
        // the one to show beside its own lower/upper bounds.
        ciExpcoef: ci ? ci.expcoefT.value : null,
        ciExpcoefText: ci ? ci.expcoefT.text : null,
        lower:   ci ? ci.lowerT.value : null, lowerText: ci ? ci.lowerT.text : null,
        upper:   ci ? ci.upperT.value : null, upperText: ci ? ci.upperT.text : null
      };
    });

    if (out.n === null || out.events === null) {
      out.warnings.push('The "n=, number of events=" header line was not found, so counts are unavailable.');
    }
    if (ciIdx < 0) {
      out.warnings.push('The exp(coef) confidence-interval table was not found. Intervals below are recomputed from coef and se.');
    }

    return out;
  }

  // ------------------------------------------------------------- arithmetic

  // The two identities the whole summary rests on.
  function hrFromCoef(coef) { return Math.exp(coef); }
  function ciFromCoef(coef, se, level) {
    var z = qnorm(1 - (1 - level) / 2);
    return { lower: Math.exp(coef - z * se), upper: Math.exp(coef + z * se), z: z };
  }
  function zFromCoef(coef, se) { return coef / se; }
  function pFromZ(z) { return 2 * pnorm(-Math.abs(z)); }

  // Upper tail, taken DIRECTLY from the incomplete gamma. Writing this as
  // 1 - pchisq() is 1 - (1 - Q), which cancels away the whole answer once the
  // tail is small: the pbc fit's LRT of 210.7 on 3 df has p ~ 1e-44 and the
  // subtraction returns a flat 0. Recovering that number is the entire reason
  // to recompute a p-value R only printed as "<2e-16", so it has to come from
  // the tail itself.
  function pFromChisq(stat, df) { return pvChisq(stat, df, 'upper'); }

  // What the PRINTED digits actually pin down. R prints coef rounded, so a
  // recomputed HR is only known to the interval implied by that rounding.
  // Reporting this instead of a spuriously precise number is the point.
  function precisionOf(term, level) {
    var dc = halfUlp(term.coefText), ds = halfUlp(term.seUsedText);
    var zq = qnorm(1 - (1 - level) / 2);
    return {
      hr:    [Math.exp(term.coef - dc), Math.exp(term.coef + dc)],
      lower: [Math.exp(term.coef - dc - zq * (term.seUsed + ds)),
              Math.exp(term.coef + dc - zq * (term.seUsed - ds))],
      upper: [Math.exp(term.coef - dc + zq * (term.seUsed - ds)),
              Math.exp(term.coef + dc + zq * (term.seUsed + ds))],
      coefHalfUlp: dc, seHalfUlp: ds
    };
  }

  // ---------------------------------------------------------------- reading

  function pctChange(hr) { return (hr - 1) * 100; }

  function direction(hr) {
    if (hr > 1) return 'higher';
    if (hr < 1) return 'lower';
    return 'identical';
  }

  // The sentence a reader can actually use: what HR means for one person
  // compared with another who differs by one unit and matches on everything
  // else in the model.
  function readTerm(term, level) {
    var hr = hrFromCoef(term.coef);
    var pc = pctChange(hr);
    var lo = term.lower, up = term.upper;
    if (lo === null || up === null) {
      var ci = ciFromCoef(term.coef, term.seUsed, level);
      lo = ci.lower; up = ci.upper;
    }
    var crosses = (lo < 1 && up > 1);
    var sig = !crosses;
    var pctPhrase = Math.abs(pc) < 0.05
      ? 'essentially no change in'
      : (pc > 0 ? 'a ' + fmtPct(Math.abs(pc)) + ' higher' : 'a ' + fmtPct(Math.abs(pc)) + ' lower') + ' hazard of';

    return {
      name: term.name,
      hr: hr,
      pct: pc,
      lower: lo, upper: up,
      crossesOne: crosses,
      significant: sig,
      dir: direction(hr),
      pctPhrase: pctPhrase,
      // "each one-unit increase in age multiplies the hazard by 1.011"
      plain: oneUnitSentence(term.name, hr, pc),
      inverse: 1 / hr
    };
  }

  function fmtPct(x) {
    if (x >= 10) return Math.round(x) + '%';
    if (x >= 1) return (Math.round(x * 10) / 10) + '%';
    return (Math.round(x * 100) / 100) + '%';
  }

  function oneUnitSentence(name, hr, pc) {
    var tail;
    if (Math.abs(pc) < 0.05) {
      tail = 'leaves the hazard essentially unchanged';
    } else if (hr > 1) {
      tail = 'multiplies the hazard by ' + round(hr, 4) + ', a ' + fmtPct(Math.abs(pc)) + ' increase in the risk of the event at any moment';
    } else {
      tail = 'multiplies the hazard by ' + round(hr, 4) + ', a ' + fmtPct(Math.abs(pc)) + ' reduction in the risk of the event at any moment';
    }
    return 'A one-unit increase in ' + name + ' ' + tail + ', holding every other term in the model fixed.';
  }

  // The sentence that actually lands: two patients, alike on everything the
  // model knows about, differing only in this one covariate.
  // Two decimals is right for an HR of 1.73 and wrong for one of 0.9978, which
  // rounds to a flat "1 times the hazard" and reads as a bug.
  function fmtHR(hr) {
    var d = Math.abs(hr - 1) < 0.05 ? 3 : 2;
    return hr.toFixed(d);
  }

  function twoPatientSentence(name, hr, isLevel, base, level) {
    var pc = pctChange(hr);
    var who = isLevel
      ? 'A patient with ' + base + ' = ' + level + ', compared with one in the reference group'
      : 'A patient one unit higher in ' + name + ', compared with one otherwise identical';
    if (Math.abs(pc) < 0.05) {
      return who + ', has essentially the same hazard: this covariate is doing nothing here.';
    }
    var times = fmtHR(hr);
    if (hr > 1) {
      return who + ', has ' + times + ' times the hazard at every instant. Over the same follow-up, that patient is the one more likely to reach the event first, and by roughly ' + fmtPct(Math.abs(pc)) + '.';
    }
    return who + ', has ' + times + ' times the hazard at every instant, a ' + fmtPct(Math.abs(pc)) +
           ' lower risk at any moment. Read the other way round, the reference patient carries ' + fmtHR(1 / hr) +
           ' times the hazard of this one.';
  }

  // The outcome expression, exactly as it was written: Surv(time, status),
  // Surv(futime, fustat), Surv(time, status == 2). Emitting a generic
  // Surv(time, status) into the R block would hand the reader code that does
  // not run against their own model.
  function survExpr(call) {
    if (!call) return null;
    var i = call.indexOf('Surv(');
    if (i < 0) return null;
    var depth = 0;
    for (var j = i + 4; j < call.length; j++) {
      if (call.charAt(j) === '(') depth++;
      else if (call.charAt(j) === ')') { depth--; if (depth === 0) return call.slice(i, j + 1); }
    }
    return null;
  }

  // The data frame the fit used, so the emitted code names their data.
  function dataName(call) {
    if (!call) return null;
    var m = /,\s*data\s*=\s*([A-Za-z._][\w.]*)/.exec(call);
    return m ? m[1] : null;
  }

  // The variables in the model, read off the right-hand side of the formula in
  // the Call. strata() and cluster() are dropped: they shape the fit but never
  // produce a coefficient row.
  function formulaVars(call) {
    if (!call) return [];
    var m = /~([^]*?)(?:,\s*data\s*=|,\s*cluster\s*=|,\s*weights\s*=|\)\s*$)/.exec(call);
    if (!m) return [];
    return m[1].split('+').map(function (s) {
      return s.trim().replace(/\s+/g, '');
    }).filter(function (s) {
      return s && !/^(strata|cluster|frailty|offset)\(/.test(s);
    });
  }

  // R names a factor level <variable><level>, so a coefficient row is a level
  // when a MODEL VARIABLE is a strict prefix of its name.
  //
  // Reading the variable names out of the Call beats guessing from shared
  // prefixes among the rows. The colon fit prints rxLev and rxLev+5FU, whose
  // longest shared prefix is "rxLev" -- not the variable, which is "rx". And a
  // lone level like sexffemale has no sibling to share a prefix with at all,
  // yet the formula names sexf outright. The prefix heuristic stays only as a
  // fallback for a paste with no Call line.
  function tagFactorLevels(terms, call) {
    var vars = formulaVars(call).slice().sort(function (a, b) { return b.length - a.length; });
    var names = terms.map(function (t) { return t.name; });

    return terms.map(function (t) {
      for (var i = 0; i < vars.length; i++) {
        var v = vars[i];
        if (t.name === v) return { isLevel: false, base: null, level: null };  // the variable itself
        if (t.name.indexOf(v) === 0 && t.name.length > v.length) {
          return { isLevel: true, base: v, level: t.name.slice(v.length) };
        }
      }
      if (vars.length) return { isLevel: false, base: null, level: null };

      // no Call in the paste: fall back to shared prefixes among the rows
      var best = null;
      for (var j = 0; j < names.length; j++) {
        if (names[j] === t.name) continue;
        var other = names[j], p = 0;
        while (p < other.length && p < t.name.length && other.charAt(p) === t.name.charAt(p)) p++;
        if (p >= 2 && p < t.name.length && p < other.length && (best === null || p > best)) best = p;
      }
      if (best === null) return { isLevel: false, base: null, level: null };
      return { isLevel: true, base: t.name.slice(0, best), level: t.name.slice(best) };
    });
  }

  function round(x, d) {
    if (!isFinite(x)) return String(x);
    var f = Math.pow(10, d);
    return String(Math.round(x * f) / f);
  }

  // Concordance in words. c = P(the model ranks a random pair correctly).
  function readConcordance(c) {
    if (c === null || c === undefined || isNaN(c)) return null;
    var band;
    if (c < 0.55) band = 'barely better than a coin flip';
    else if (c < 0.6) band = 'weak';
    else if (c < 0.7) band = 'modest';
    else if (c < 0.8) band = 'good';
    else if (c < 0.9) band = 'strong';
    else band = 'very strong, which is rare enough with real survival data to be worth double-checking for leakage';
    return {
      c: c, band: band,
      pct: Math.round(c * 1000) / 10,
      plain: 'Take any two patients whose survival can be ordered. The model puts them in the right order ' +
             (Math.round(c * 1000) / 10) + '% of the time. 0.5 is guessing, 1.0 is perfect: this is ' + band + '.'
    };
  }

  // The three global tests are asymptotically equivalent, so they usually
  // agree. When they do not, that IS the finding.
  //
  // Agreement is judged on what the tests CONCLUDE, not on how far apart the
  // raw statistics are. Those are different questions: the pbc fit prints
  // 210.7 / 223.2 / 279.5, a 33% spread, yet all three p-values are below
  // 1e-44 and the tests could not agree more completely. Spread is reported
  // separately, because a wide spread with a shared conclusion is a note about
  // sample size, not a conflict.
  function readGlobalTests(tests, n, events, alpha, robust) {
    alpha = alpha || 0.05;
    var keys = ['lrt', 'wald', 'score'];
    var present = keys.filter(function (k) { return tests[k]; });
    if (!present.length) return null;
    var stats = present.map(function (k) { return tests[k].stat; });
    var mx = Math.max.apply(null, stats), mn = Math.min.apply(null, stats);
    var spread = mx - mn;
    var rel = mn > 0 ? spread / mn : Infinity;

    // p from the printed statistic: R rounds this block hard (p=1e-06,
    // p=<2e-16), so the chi-square tail recovers real information.
    var recomputed = {};
    present.forEach(function (k) { recomputed[k] = pFromChisq(tests[k].stat, tests[k].df); });

    var ps = present.map(function (k) { return recomputed[k]; });
    var sameSide = ps.every(function (x) { return x < alpha; }) ||
                   ps.every(function (x) { return x >= alpha; });
    var wideSpread = rel >= 0.25;
    var agree = sameSide;

    var verdict;
    if (sameSide && !wideSpread) {
      verdict = 'The three tests agree, which is the normal case. They are asymptotically equivalent, so with a decent number of events they land in the same place. Report the likelihood ratio test and move on.';
    } else if (sameSide && wideSpread) {
      verdict = 'All three tests reach the same conclusion, so there is nothing to resolve. Their statistics are noticeably far apart, which is only a reminder that they are equivalent in large samples and you are not in the limit yet. It changes nothing about the finding. Report the likelihood ratio test.';
    } else {
      verdict = 'The three tests do not reach the same conclusion at ' + alpha +
                ', which is worth a pause. They agree only in large samples, and with ' + events +
                ' events that limit is not doing much for you. The likelihood ratio test is the one to trust. A genuine split usually means few events, a covariate on a wildly different scale, or near-separation where one group has almost no events.';
    }
    if (robust) {
      verdict += ' This fit used a robust or clustered variance, so the Wald test is built on the robust standard errors while the likelihood ratio and score tests are not. R prints that caveat under the tests for exactly this reason, and a gap between them here is expected rather than alarming.';
    }
    return {
      present: present, recomputed: recomputed,
      spread: spread, rel: rel, wideSpread: wideSpread,
      sameSide: sameSide, agree: agree, verdict: verdict
    };
  }

  // ---------------------------------------------------------------- analyze

  function analyze(parsed) {
    if (!parsed || !parsed.ok) return parsed;
    var level = parsed.level;
    var zq = qnorm(1 - (1 - level) / 2);
    var facts = tagFactorLevels(parsed.terms, parsed.call);

    var terms = parsed.terms.map(function (t, i) {
      var r = readTerm(t, level);
      var f = facts[i];
      r.isLevel = f.isLevel; r.base = f.base; r.levelName = f.level;
      r.twoPatient = twoPatientSentence(t.name, r.hr, f.isLevel, f.base, f.level);
      var rec = {
        hr: hrFromCoef(t.coef),
        ci: ciFromCoef(t.coef, t.seUsed, level),
        z: zFromCoef(t.coef, t.seUsed),
        p: pFromZ(zFromCoef(t.coef, t.seUsed))
      };
      return {
        raw: t, read: r, recomputed: rec,
        precision: precisionOf(t, level)
      };
    });

    var nsig = terms.filter(function (t) { return t.read.significant; }).length;
    var conc = readConcordance(parsed.conc);
    var global = readGlobalTests(parsed.tests, parsed.n, parsed.events, 1 - level, parsed.robust);

    // events per variable: the rule of thumb that decides whether any of this
    // is stable enough to report.
    var epv = (parsed.events && parsed.terms.length) ? parsed.events / parsed.terms.length : null;

    return {
      ok: true, parsed: parsed, level: level, zq: zq,
      terms: terms, nsig: nsig, conc: conc, global: global, epv: epv
    };
  }

  return {
    parseSummary: parseSummary,
    analyze: analyze,
    hrFromCoef: hrFromCoef,
    ciFromCoef: ciFromCoef,
    zFromCoef: zFromCoef,
    pFromZ: pFromZ,
    pFromChisq: pFromChisq,
    precisionOf: precisionOf,
    readTerm: readTerm,
    readConcordance: readConcordance,
    readGlobalTests: readGlobalTests,
    halfUlp: halfUlp,
    fmtPct: fmtPct,
    fmtHR: fmtHR,
    formulaVars: formulaVars,
    survExpr: survExpr,
    dataName: dataName,
    tagFactorLevels: tagFactorLevels
  };
}));
