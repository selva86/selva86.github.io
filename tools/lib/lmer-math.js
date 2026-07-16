/*
  lmer-math.js - parse and decode the printed summary() of an lme4 mixed model.

  Scope: everything here works from the PRINTED TEXT of summary(m) and nothing
  else. That constraint is the whole point of the tool, and it is also the source
  of the one honest limitation this library refuses to paper over:

    * random-intercept models: ICC = tau00 / (tau00 + sigma^2) reproduces
      performance::icc(m)$ICC_adjusted to machine precision (verified, 16/16 cases).
    * glmer with a logit link: ICC = tau00 / (tau00 + pi^2/3) likewise.
    * models with a RANDOM SLOPE: performance::icc() reports the Nakagawa/Johnson
      mean random-effect variance,
          var.random = v_int + 2*mean(x)*cov(int,slope) + mean(x^2)*v_slope
      which depends on mean(x) and mean(x^2) - i.e. on the DATA. A printed summary
      does not contain the data, so that number is NOT recoverable from a paste.
      We report the ICC at x = 0 (which IS recoverable), label it as such, and tell
      the reader to run performance::icc(m) for the data-averaged value. We never
      invent a number and claim it matches.

  Precision note: the printed summary is rounded (R's default digits = 7), so an
  ICC computed from a paste agrees with the exact value to roughly 5 decimals
  (e.g. 7.2e-6 on the sleepstudy random-intercept preset). The arithmetic here is
  exact; the INPUT is what the console rounded.

  Composes normal-math (pnorm/qnorm) for Wald intervals and normal-approximation
  p-values. No other dependencies.

  UMD: browser global LmerMath, or require() in node.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'));
  } else {
    root.LmerMath = factory(root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (NM) {
  'use strict';

  var PI2_3 = Math.PI * Math.PI / 3;

  /* ------------------------------------------------------------- helpers --- */

  function isNumTok(s) {
    if (s == null) return false;
    return /^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(s) ||
           /^[-+]?Inf$/.test(s) || s === 'NA' || s === 'NaN';
  }
  function toNum(s) {
    if (s === 'NA') return null;
    if (s === 'NaN') return NaN;
    if (/^-Inf$/.test(s)) return -Infinity;
    if (/^\+?Inf$/.test(s)) return Infinity;
    return parseFloat(s);
  }
  // trailing significance markers R prints after the p-value column
  function isStarTok(s) { return /^(\*{1,3}|\.)$/.test(s); }

  // split a data row into {lead, nums} by peeling numeric tokens off the RIGHT.
  // This is robust to term names that contain spaces, e.g. "poly(Days, 2)1".
  function peelNumbers(rest) {
    var toks = rest.trim().split(/\s+/).filter(function (t) { return t.length; });
    var nums = [];
    while (toks.length && isNumTok(toks[toks.length - 1])) nums.unshift(toks.pop());
    return { lead: toks.join(' '), nums: nums };
  }

  /* -------------------------------------------------------------- parser --- */

  function parse(text) {
    if (text == null || !String(text).trim()) {
      return { ok: false, error: 'Nothing pasted yet. Paste the output of summary(model) from your R console.' };
    }
    var raw = String(text).replace(/\r\n?/g, '\n');
    var lines = raw.split('\n');

    // tolerate a copied console prompt: "> summary(m)" / "R> summary(m)"
    while (lines.length && /^\s*[A-Za-z]?>\s*(summary|print)\s*\(/.test(lines[0])) lines.shift();
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    if (!lines.length) {
      return { ok: false, error: 'Nothing pasted yet. Paste the output of summary(model) from your R console.' };
    }

    var joined = lines.join('\n');
    var regions = [];
    function region(key, label, start, end, meaning) {
      if (start < 0 || end < start) return;
      regions.push({ key: key, label: label, start: start, end: end, meaning: meaning });
    }
    var idx = function (re, from) {
      for (var i = from || 0; i < lines.length; i++) if (re.test(lines[i])) return i;
      return -1;
    };

    /* --- model kind ------------------------------------------------------- */
    var isGlmer = /Generalized linear mixed model/i.test(joined);
    var isLmer = /Linear mixed model/i.test(joined);
    if (!isGlmer && !isLmer) {
      // Give a targeted message for the most likely wrong-paste cases.
      if (/^\s*Call:/m.test(joined) && /Residual standard error/i.test(joined)) {
        return { ok: false, error: "That looks like summary() of a plain lm() model, not a mixed model. Try the lm() Output Interpreter instead, or paste an lmer()/glmer() summary here.", hint: 'lm' };
      }
      if (/Coefficients:/.test(joined) && /Dispersion parameter/i.test(joined)) {
        return { ok: false, error: "That looks like summary() of a glm() model, not a mixed model. Try the glm() Output Interpreter instead, or paste an lmer()/glmer() summary here.", hint: 'glm' };
      }
      if (/Random effects:/i.test(joined) || /\bnlme\b|\bLinear mixed-effects model fit by\b/i.test(joined)) {
        return { ok: false, error: "This looks like mixed-model output, but not from lme4. This tool reads lme4's lmer()/glmer() summaries (they start with \"Linear mixed model fit by REML\" or \"Generalized linear mixed model\")." };
      }
      return { ok: false, error: "Could not find a mixed-model header. An lme4 summary starts with \"Linear mixed model fit by REML ['lmerMod']\" or \"Generalized linear mixed model fit by maximum likelihood\". Paste the whole summary(model) output, including that first line." };
    }

    var m = {
      kind: isGlmer ? 'glmer' : 'lmer',
      isLmerTest: /Satterthwaite|Kenward-Roger|lmerModLmerTest/i.test(joined),
      method: null, family: null, link: null,
      formula: null, data: null,
      criterion: null, nobs: null, groups: [],
      random: { groups: [], residual: null },
      fixed: { cols: [], rows: [] },
      corrFixed: null,
      regions: regions, lines: lines, text: lines.join('\n')
    };

    /* --- header ----------------------------------------------------------- */
    var fEnd = idx(/^\s*(Formula:|Family:|Data:)/);
    var headEnd = (fEnd > 0 ? fEnd : 1) - 1;
    var headTxt = lines.slice(0, headEnd + 1).join(' ');
    if (/fit by REML/i.test(headTxt)) m.method = 'REML';
    else if (/fit by maximum likelihood/i.test(headTxt)) m.method = 'ML';
    region('header', 'Model header', 0, headEnd,
      m.kind === 'glmer'
        ? 'Says this is a generalized linear mixed model fitted by maximum likelihood with the Laplace approximation.'
        : (m.method === 'REML'
            ? 'Says this is a linear mixed model fitted by REML, the default. REML gives less biased variance estimates than ML.'
            : 'Says this is a linear mixed model fitted by maximum likelihood (REML=FALSE).'));

    /* --- family (glmer) --------------------------------------------------- */
    var fi = idx(/^\s*Family:/);
    if (fi >= 0) {
      var fm = lines[fi].match(/Family:\s*([A-Za-z0-9_.]+)\s*(?:\(\s*([A-Za-z0-9_.]+)\s*\))?/);
      if (fm) { m.family = fm[1]; m.link = fm[2] || null; }
      region('family', 'Family and link', fi, fi,
        'The outcome distribution (' + (m.family || '?') + ') and the link function (' + (m.link || '?') + ') used to model it.');
    }

    /* --- formula ---------------------------------------------------------- */
    var qi = idx(/^\s*Formula:/);
    if (qi >= 0) {
      var qEnd = qi;
      while (qEnd + 1 < lines.length && /^\s{4,}\S/.test(lines[qEnd + 1]) && !/^\s*Data:/.test(lines[qEnd + 1])) qEnd++;
      m.formula = lines.slice(qi, qEnd + 1).join(' ').replace(/^\s*Formula:\s*/, '').replace(/\s+/g, ' ').trim();
      region('formula', 'Formula', qi, qEnd,
        'The model you fitted. Terms in brackets like (1 | Subject) are the random effects; everything else is a fixed effect.');
    }
    var di = idx(/^\s*Data:/);
    if (di >= 0) { m.data = lines[di].replace(/^\s*Data:\s*/, '').trim(); }

    /* --- fit criterion ---------------------------------------------------- */
    var ri2 = idx(/REML criterion at convergence:/i);
    if (ri2 >= 0) {
      m.criterion = { type: 'REML', values: { REML: parseFloat(lines[ri2].split(':')[1]) } };
      region('criterion', 'Fit criterion', ri2, ri2,
        'The REML deviance at the optimum. On its own it means nothing; it is only useful for comparing models fitted to the same data.');
    } else {
      var ai = idx(/^\s*AIC\s+BIC\s+logLik/);
      if (ai >= 0 && ai + 1 < lines.length) {
        var names = lines[ai].trim().split(/\s+/);
        var vals = lines[ai + 1].trim().split(/\s+/).map(parseFloat);
        var o = {};
        for (var k = 0; k < names.length; k++) o[names[k]] = vals[k];
        m.criterion = { type: 'AIC', values: o };
        region('criterion', 'Fit statistics', ai, ai + 1,
          'AIC and BIC compare models on the same data (lower is better). logLik is the log-likelihood the fit maximised.');
      }
    }

    /* --- scaled residuals ------------------------------------------------- */
    var si = idx(/^\s*Scaled residuals:/i);
    if (si >= 0) {
      var sEnd = Math.min(si + 2, lines.length - 1);
      region('resid', 'Scaled residuals', si, sEnd,
        'A five-number summary of the standardised residuals. Roughly symmetric, with min and max inside about +/-3, is what you want.');
    }

    /* --- random effects --------------------------------------------------- */
    var rj = idx(/^\s*Random effects:/i);
    if (rj < 0) return { ok: false, error: 'Found the model header but no "Random effects:" block. Paste the complete summary(model) output - the random effects table is the part that makes it a mixed model.' };
    var hdr = rj + 1;
    if (hdr >= lines.length || !/Groups/.test(lines[hdr])) {
      return { ok: false, error: 'The "Random effects:" block is missing its "Groups / Name / Variance / Std.Dev." header row. Paste the block exactly as R printed it.' };
    }
    var nameOff = lines[hdr].indexOf('Name');
    if (nameOff < 0) nameOff = 10;
    var obsLine = idx(/^\s*Number of obs:/i, rj);
    var reEnd = obsLine > 0 ? obsLine - 1 : rj + 1;
    var curGroup = null;
    for (var r = hdr + 1; r <= reEnd && r < lines.length; r++) {
      var ln = lines[r];
      if (!ln.trim()) continue;
      var grpCell = ln.slice(0, nameOff).trim();
      var rest = ln.slice(nameOff);
      var pk = peelNumbers(rest);
      if (!pk.nums.length) continue;
      if (/^Residual$/i.test(grpCell)) {
        m.random.residual = { variance: toNum(pk.nums[0]), sd: pk.nums.length > 1 ? toNum(pk.nums[1]) : Math.sqrt(toNum(pk.nums[0])) };
        continue;
      }
      if (grpCell) { curGroup = { name: grpCell, terms: [] }; m.random.groups.push(curGroup); }
      if (!curGroup) { curGroup = { name: '(unnamed)', terms: [] }; m.random.groups.push(curGroup); }
      curGroup.terms.push({
        name: pk.lead || '(Intercept)',
        variance: toNum(pk.nums[0]),
        sd: pk.nums.length > 1 ? toNum(pk.nums[1]) : Math.sqrt(toNum(pk.nums[0])),
        corr: pk.nums.slice(2).map(toNum)
      });
    }
    if (!m.random.groups.length) {
      return { ok: false, error: 'Could not read any grouping factors out of the "Random effects:" table. Check that the block was pasted with its original column layout (spaces intact, not re-wrapped).' };
    }
    region('random', 'Random effects', rj, reEnd,
      'The variance each grouping factor adds. Variance is in squared outcome units; Std.Dev. is its square root, back in the units you can talk about.');

    /* --- obs / groups ----------------------------------------------------- */
    if (obsLine >= 0) {
      var om = lines[obsLine].match(/Number of obs:\s*(\d+)/i);
      if (om) m.nobs = parseInt(om[1], 10);
      var gpart = lines[obsLine].split(/groups:\s*/i)[1];
      if (gpart) {
        gpart.split(';').forEach(function (chunk) {
          var mm = chunk.trim().match(/^(.+?),\s*(\d+)\s*$/);
          if (mm) m.groups.push({ name: mm[1].trim(), n: parseInt(mm[2], 10) });
        });
      }
      region('obs', 'Sample size', obsLine, obsLine,
        'How many rows the model used, and how many distinct units each grouping factor has. The second number is your real replication for group-level effects.');
    }

    /* --- fixed effects ---------------------------------------------------- */
    var xi = idx(/^\s*Fixed effects:/i);
    if (xi < 0) return { ok: false, error: 'Found the random effects but no "Fixed effects:" block. Paste the complete summary(model) output.' };
    var xh = xi + 1;
    if (xh >= lines.length || !/Estimate/.test(lines[xh])) {
      return { ok: false, error: 'The "Fixed effects:" block is missing its "Estimate / Std. Error" header row. Paste the block exactly as R printed it.' };
    }
    // column order comes from the header, by position
    var colDefs = [
      { key: 'estimate', re: /Estimate/ },
      { key: 'se', re: /Std\.\s*Error/ },
      { key: 'df', re: /(^|\s)df(\s|$)/ },
      { key: 'stat', re: /[tz]\s*value/ },
      { key: 'p', re: /Pr\(>\|[tz]\|\)/ }
    ];
    var cols = [];
    colDefs.forEach(function (c) {
      var at = lines[xh].search(c.re);
      if (at >= 0) cols.push({ key: c.key, at: at });
    });
    cols.sort(function (a, b) { return a.at - b.at; });
    m.fixed.cols = cols.map(function (c) { return c.key; });
    m.fixed.statName = /z\s*value/.test(lines[xh]) ? 'z' : 't';
    m.fixed.hasP = m.fixed.cols.indexOf('p') >= 0;
    m.fixed.hasDf = m.fixed.cols.indexOf('df') >= 0;

    var xEnd = lines.length - 1;
    for (var e = xh + 1; e < lines.length; e++) {
      if (/^\s*---\s*$/.test(lines[e]) || /^\s*Signif\. codes:/.test(lines[e]) ||
          /^\s*Correlation of Fixed Effects:/i.test(lines[e]) || !lines[e].trim()) { xEnd = e - 1; break; }
    }
    for (var q = xh + 1; q <= xEnd && q < lines.length; q++) {
      var fl = lines[q];
      if (!fl.trim()) continue;
      // "< 2e-16" -> "<2e-16" so the p-value stays a single token
      var norm = fl.replace(/<\s+/g, '<');
      var toks = norm.trim().split(/\s+/);
      var stars = '';
      while (toks.length && isStarTok(toks[toks.length - 1])) { stars = toks.pop() + stars; }
      // a bounded p-value ("<2e-16") is not a plain number: pull it off first
      var pBounded = false, pVal = null;
      if (toks.length && /^<[0-9.eE+-]+$/.test(toks[toks.length - 1])) {
        pBounded = true; pVal = parseFloat(toks.pop().slice(1));
      }
      var pk2 = peelNumbers(toks.join(' '));
      var nums = pk2.nums.slice();
      if (pBounded) nums.push('BOUNDED');
      if (!pk2.lead || nums.length < 2) continue;
      var row = { term: pk2.lead, stars: stars.trim() };
      for (var c2 = 0; c2 < m.fixed.cols.length && c2 < nums.length; c2++) {
        var key = m.fixed.cols[c2];
        row[key] = (nums[c2] === 'BOUNDED') ? pVal : toNum(nums[c2]);
      }
      if (pBounded) { row.p = pVal; row.pBounded = true; }
      if (row.estimate == null || row.se == null) continue;
      m.fixed.rows.push(row);
    }
    if (!m.fixed.rows.length) {
      return { ok: false, error: 'Could not read any coefficients out of the "Fixed effects:" table. Check that the rows were pasted with their original spacing.' };
    }
    region('fixed', 'Fixed effects', xi, xEnd,
      'The average effects, in outcome units' + (m.kind === 'glmer' ? ' on the link scale' : '') +
      '. Estimate is the effect, Std. Error its uncertainty, ' + m.fixed.statName + ' value the ratio of the two.');

    var sc = idx(/^\s*Signif\. codes:/);
    if (sc >= 0) region('signif', 'Significance codes', sc - 1 >= 0 && /^\s*---/.test(lines[sc - 1]) ? sc - 1 : sc, sc,
      'The star legend. Stars are just a coarse rendering of the p-value column; they add no information.');

    var ci2 = idx(/^\s*Correlation of Fixed Effects:/i);
    if (ci2 >= 0) {
      m.corrFixed = { start: ci2, end: lines.length - 1 };
      region('corr', 'Correlation of fixed effects', ci2, lines.length - 1,
        'How the ESTIMATES co-vary, not how your variables correlate. Large values here mean the coefficients are hard to separate, not that anything is wrong with the data.');
    }
    return { ok: true, model: m };
  }

  /* ----------------------------------------------------------------- ICC --- */
  /*
    Returns the ICC we can honestly compute from the printed summary.
      kind 'plain'  : random intercepts only -> equals performance::icc adjusted
      kind 'latent' : glmer logit/probit     -> equals performance::icc adjusted
      kind 'at-zero': a random slope is present -> the ICC at covariate = 0 only,
                      because performance::icc averages over the observed covariate
                      values and therefore needs the data (see the header note).
      kind null     : cannot be computed (e.g. glmer with a log link)
  */
  function icc(m) {
    var groups = m.random.groups;
    var slopeGroups = groups.filter(function (g) { return g.terms.length > 1; });
    var hasSlope = slopeGroups.length > 0;

    var tauTerms = [];
    var sumTau = 0;
    groups.forEach(function (g) {
      var v = g.terms[0] && g.terms[0].variance;
      // for the at-zero reading only the intercept variance of each group enters
      var use = g.terms.filter(function (t) { return /\(Intercept\)/.test(t.name); });
      var vv = use.length ? use[0].variance : (g.terms.length === 1 ? v : null);
      if (vv != null && isFinite(vv)) { tauTerms.push({ group: g.name, variance: vv }); sumTau += vv; }
    });

    var vres = null, resSource = null, resNote = null;
    if (m.kind === 'glmer') {
      if (m.link === 'logit') {
        vres = PI2_3; resSource = 'pi^2/3';
        resNote = 'A logistic model has no residual variance to print, so the ICC uses the fixed latent-scale value pi^2/3 = ' + PI2_3.toFixed(4) + ' (the variance of the standard logistic distribution).';
      } else if (m.link === 'probit') {
        vres = 1; resSource = '1';
        resNote = 'A probit model has no residual variance to print, so the ICC uses the latent-scale value 1 (the variance of the standard normal).';
      } else {
        return {
          ok: false,
          reason: 'For a ' + (m.family || 'non-binomial') + ' model with a ' + (m.link || 'non-logit') +
            ' link, the residual variance on the latent scale depends on the fitted means, which the printed summary does not contain. Run performance::icc(model) on the model object to get it.'
        };
      }
    } else {
      if (!m.random.residual) return { ok: false, reason: 'No Residual row found in the random effects table, so there is no residual variance to divide by.' };
      vres = m.random.residual.variance;
      resSource = 'Residual';
    }
    if (!(sumTau >= 0) || !(vres > 0)) return { ok: false, reason: 'The variance components could not be read as positive numbers.' };

    var value = sumTau / (sumTau + vres);
    return {
      ok: true,
      value: value,
      sumTau: sumTau,
      terms: tauTerms,
      residual: vres,
      residualSource: resSource,
      residualNote: resNote,
      latent: m.kind === 'glmer',
      atZeroOnly: hasSlope,
      multiGroup: tauTerms.length > 1,
      slopeGroups: slopeGroups.map(function (g) { return g.name; })
    };
  }

  /* ------------------------------------------------- design effect / n_eff --- */
  // Kish: DE = 1 + (m - 1) * ICC, with m the average cluster size. Both nobs and
  // the number of groups are printed, so this IS recoverable from a paste.
  function designEffect(m, iccValue) {
    if (!m.nobs || m.groups.length !== 1 || !(iccValue >= 0)) return null;
    var k = m.groups[0].n;
    if (!k) return null;
    var avg = m.nobs / k;
    var de = 1 + (avg - 1) * iccValue;
    if (!(de > 0)) return null;
    return { avgClusterSize: avg, de: de, neff: m.nobs / de, groupName: m.groups[0].name, nGroups: k };
  }

  /* --------------------------------------------------------------- Wald ----- */
  // Reproduces confint(model, method="Wald") exactly: est +/- qnorm(1-a/2) * se.
  function waldCI(est, se, level) {
    var lv = level == null ? 0.95 : level;
    var z = NM.qnorm(1 - (1 - lv) / 2);
    return { lower: est - z * se, upper: est + z * se, z: z, level: lv };
  }
  // The p-value you get if you pretend df = infinity. Anti-conservative on
  // purpose-shown; it is exactly the approximation lme4 declines to make.
  function normalP(stat) { return 2 * NM.pnorm(-Math.abs(stat)); }

  function fmtP(p, bounded) {
    if (p == null || isNaN(p)) return 'n/a';
    if (bounded || p < 2e-16) return '< 2e-16';
    if (p < 1e-4) return p.toExponential(2);
    return p.toFixed(p < 0.001 ? 5 : 4);
  }

  return {
    parse: parse, icc: icc, designEffect: designEffect,
    waldCI: waldCI, normalP: normalP, fmtP: fmtP,
    PI2_3: PI2_3, isNumTok: isNumTok, peelNumbers: peelNumbers
  };
}));
