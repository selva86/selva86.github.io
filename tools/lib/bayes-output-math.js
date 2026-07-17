/* bayes-output-math.js - parse and judge a pasted rstanarm / brms summary().

   Two console formats, one model shape out:

     rstanarm  summary(stanreg)  "Model Info:" + "Estimates:" (mean sd 10% 50% 90%)
                                 + "MCMC diagnostics" (mcse Rhat n_eff), which is a
                                 SEPARATE table joined back by parameter name.
     brms      summary(brmsfit)  "Family:/Formula:/Draws:" + per-block tables carrying
                                 Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS.

   Both are read the same way: column order comes off the header BY POSITION, and each
   data row is split by peeling numeric tokens off the RIGHT. That is what survives
   parameter names containing spaces, e.g. "b[(Intercept) cyl:4]".

   Everything here is derived from the printed text alone. A printed summary carries
   only marginal summaries - no draws - so anything needing the posterior draws (loo,
   bayes_R2, pp_check, joint probabilities) is deliberately not attempted. P(theta > 0)
   is offered only as a normal approximation from mean/sd and is labelled as one.

   Ground truth: Scripts/tool-truth/bayesian-output-interpreter.json (real rstanarm fits,
   R 4.6.0 / rstanarm 2.32.2) and Scripts/tool-truth/brms-preset.json.
   Browser (window.BayesOutputMath) + Node. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./normal-math.js'));
  } else {
    root.BayesOutputMath = factory(root.NormalMath);
  }
}(typeof self !== 'undefined' ? self : this, function (NM) {
  'use strict';

  /* Thresholds. Rhat > 1.01 and ESS < 400 follow Vehtari, Gelman, Simpson, Carpenter
     and Buerkner (2021), "Rank-normalization, folding, and localization: an improved
     Rhat for assessing convergence of MCMC", Bayesian Analysis 16(2). */
  var RHAT_WARN = 1.01;
  var RHAT_BAD = 1.05;
  var ESS_WARN = 400;
  var ESS_BAD = 100;

  // ---------------------------------------------------------------- tokens

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

  /* Split a data row into {lead, nums} by peeling numeric tokens off the RIGHT.
     Left-to-right tokenising breaks on "b[(Intercept) cyl:4]"; this does not. */
  function peelNumbers(rest) {
    var toks = String(rest).trim().split(/\s+/).filter(function (t) { return t.length; });
    var nums = [];
    while (toks.length && isNumTok(toks[toks.length - 1])) nums.unshift(toks.pop());
    return { lead: toks.join(' '), nums: nums };
  }

  // ---------------------------------------------------------------- headers

  /* Read a table header and return [{key, at, prob?}] sorted left to right.
     Position, not token count: "l-95% CI" is two whitespace tokens but one column. */
  function headerCols(line) {
    var cols = [];
    function add(key, at, extra) {
      if (at < 0) return;
      var rec = { key: key, at: at };
      if (extra != null) rec.prob = extra;
      cols.push(rec);
    }
    // brms
    add('estimate', line.search(/\bEstimate\b/));
    add('est_error', line.search(/\bEst\.Error\b/));
    var lo = line.match(/l-(\d+(?:\.\d+)?)%\s*CI/);
    if (lo) add('lower', line.indexOf(lo[0]), parseFloat(lo[1]));
    var hi = line.match(/u-(\d+(?:\.\d+)?)%\s*CI/);
    if (hi) add('upper', line.indexOf(hi[0]), parseFloat(hi[1]));
    add('bulk_ess', line.search(/\bBulk_ESS\b/));
    add('tail_ess', line.search(/\bTail_ESS\b/));
    add('eff_sample', line.search(/\bEff\.Sample\b/));   // brms < 2.11
    // rstanarm
    add('mean', line.search(/\bmean\b/));
    add('sd', line.search(/\bsd\b/));
    add('mcse', line.search(/\bmcse\b/));
    add('n_eff', line.search(/\bn_eff\b/));
    // shared
    add('rhat', line.search(/\bRhat\b/));
    // bare quantile columns, rstanarm style: 10%  50%  90%
    var re = /(\d+(?:\.\d+)?)%/g, m;
    while ((m = re.exec(line)) !== null) {
      var at = m.index;
      // skip the "95%" inside an already-claimed "l-95% CI" / "u-95% CI"
      if (at > 0 && /[lu]-$/.test(line.slice(Math.max(0, at - 2), at))) continue;
      cols.push({ key: 'q', at: at, prob: parseFloat(m[1]) });
    }
    cols.sort(function (a, b) { return a.at - b.at; });
    return cols;
  }

  function isHeaderLine(line) {
    return /\bEstimate\b/.test(line) || /\bEst\.Error\b/.test(line) ||
           (/\bmean\b/.test(line) && /\bsd\b/.test(line)) ||
           (/\bmcse\b/.test(line) && /\bRhat\b/.test(line));
  }

  /* Zip one data row onto a column list. Returns null for anything that is not
     a data row (prose, blank, a stray note). */
  function readRow(line, cols) {
    if (!line || !line.trim()) return null;
    var pk = peelNumbers(line);
    if (!pk.lead || !pk.nums.length) return null;
    if (pk.nums.length !== cols.length) return null;
    var row = { name: pk.lead };
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i];
      var v = toNum(pk.nums[i]);
      if (c.key === 'q') {
        row.q = row.q || {};
        row.q[c.prob] = v;
      } else {
        row[c.key] = v;
      }
    }
    return row;
  }

  // ---------------------------------------------------------------- classify

  /* What kind of thing is this row? Drives how it is explained. */
  function classify(name, block) {
    if (name === 'log-posterior' || name === 'lp__') return 'lp';
    if (name === 'mean_PPD') return 'ppd';
    if (/^sigma$/.test(name)) return 'sigma';
    if (/^Sigma\[/.test(name)) return 'group_var';
    if (/^b\[/.test(name)) return 'group_offset';
    if (/^sd\(/.test(name)) return 'group_sd';
    if (/^cor\(/.test(name)) return 'group_cor';
    if (block === 'group') return 'group_sd';
    if (block === 'family') return 'sigma';
    return 'coef';
  }

  // ---------------------------------------------------------------- parse

  function fail(error, hint) {
    return { ok: false, error: error, hint: hint || null };
  }

  var SUPPORTED = 'This page reads two formats: rstanarm summary(fit) (it starts with ' +
    '"Model Info:") and brms summary(fit) (it starts with " Family:"). ' +
    'Paste the whole summary, first line to last, with the spacing R printed.';

  function detect(joined) {
    var isRstanarm = /^\s*Model Info:/m.test(joined) &&
                     (/^\s*Estimates:/m.test(joined) || /MCMC diagnostics/.test(joined));
    var isBrms = /^\s*Family:/m.test(joined) &&
                 (/Population-Level Effects:|Regression Coefficients:|Group-Level Effects:/.test(joined) ||
                  /^\s*(Draws|Samples):/m.test(joined));
    return { rstanarm: isRstanarm, brms: isBrms };
  }

  /* Warnings the console printed under the summary. Read only what is there;
     absence of a divergence line is not evidence of no divergences. */
  function readDiagnostics(joined) {
    var d = { divergences: null, divergenceTotal: null, maxRhatReported: null,
              treedepth: null, bfmi: false, notConverged: false, essWarn: [],
              mentioned: false };
    var m = joined.match(/There were (\d+) divergent transitions after warmup/i);
    if (m) { d.divergences = parseInt(m[1], 10); d.mentioned = true; }
    if (!m) {
      // cmdstanr / brms phrasing
      m = joined.match(/(\d+)\s+of\s+(\d+)\s+\([\d.]+%\)\s+transitions ended with a divergence/i);
      if (m) { d.divergences = parseInt(m[1], 10); d.divergenceTotal = parseInt(m[2], 10); d.mentioned = true; }
    }
    if (!m && /divergent transition/i.test(joined)) d.mentioned = true;
    m = joined.match(/The largest R-hat is ([\d.]+)/i);
    if (m) { d.maxRhatReported = parseFloat(m[1]); d.mentioned = true; }
    m = joined.match(/(\d+) transitions after warmup that exceeded the maximum treedepth/i);
    if (m) { d.treedepth = parseInt(m[1], 10); d.mentioned = true; }
    if (/Bayesian Fraction of Missing Information was low/i.test(joined)) { d.bfmi = true; d.mentioned = true; }
    if (/Markov chains did not converge/i.test(joined)) { d.notConverged = true; d.mentioned = true; }
    if (/Bulk Effective Samples? Size \(ESS\) is too low/i.test(joined)) { d.essWarn.push('bulk'); d.mentioned = true; }
    if (/Tail Effective Samples? Size \(ESS\) is too low/i.test(joined)) { d.essWarn.push('tail'); d.mentioned = true; }
    return d;
  }

  // ---- rstanarm ---------------------------------------------------------

  function parseRstanarm(lines, joined) {
    var m = {
      engine: 'rstanarm', regions: [], lines: lines, text: lines.join('\n'),
      family: null, link: null, formula: null, stanFunction: null, algorithm: null,
      nobs: null, draws: null, npreds: null, groups: [], params: [],
      probs: [], ciFrom: null, ciTo: null, ciLevel: null
    };
    var regions = m.regions;
    function region(key, label, start, end, meaning) {
      if (start < 0 || end < start) return;
      regions.push({ key: key, label: label, start: start, end: end, meaning: meaning });
    }
    function idx(re, from) {
      for (var i = from || 0; i < lines.length; i++) if (re.test(lines[i])) return i;
      return -1;
    }

    // ---- Model Info
    var mi = idx(/^\s*Model Info:/);
    var g;
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      if ((g = ln.match(/^\s*function:\s*(\S+)/))) m.stanFunction = g[1];
      else if ((g = ln.match(/^\s*family:\s*(\S+)\s*(?:\[([^\]]+)\])?/))) { m.family = g[1]; m.link = g[2] || null; }
      else if ((g = ln.match(/^\s*formula:\s*(.+?)\s*$/))) { if (!m.formula) m.formula = g[1]; }
      else if ((g = ln.match(/^\s*algorithm:\s*(\S+)/))) m.algorithm = g[1];
      else if ((g = ln.match(/^\s*sample:\s*(\d+)/))) m.draws = parseInt(g[1], 10);
      else if ((g = ln.match(/^\s*observations:\s*(\d+)/))) m.nobs = parseInt(g[1], 10);
      else if ((g = ln.match(/^\s*predictors:\s*(\d+)/))) m.npreds = parseInt(g[1], 10);
      else if ((g = ln.match(/^\s*groups:\s*(.+?)\s*$/))) {
        g[1].split(/,\s*(?=[^()]*\()/).forEach(function (chunk) {
          var gm = chunk.trim().match(/^(.+?)\s*\((\d+)\)\s*$/);
          if (gm) m.groups.push({ name: gm[1].trim(), levels: parseInt(gm[2], 10) });
        });
      }
    }
    var miEnd = idx(/^\s*Estimates:/);
    region('info', 'Model Info', mi, (miEnd > 0 ? miEnd - 1 : mi + 8),
      'What was fitted, and how much posterior you have. "sample" is the number of ' +
      'post-warmup draws kept, not your data size; "observations" is the data size.');

    // ---- the two tables, joined by parameter name
    var byName = {};
    var order = [];
    function slot(name, block) {
      if (!byName[name]) {
        byName[name] = { name: name, block: block, kind: classify(name, block) };
        order.push(name);
      }
      return byName[name];
    }

    var block = null, cols = null;
    var estStart = -1, estEnd = -1, diagStart = -1, diagEnd = -1, fitStart = -1, fitEnd = -1;
    for (var j = 0; j < lines.length; j++) {
      var L = lines[j];
      if (/^\s*Estimates:/.test(L)) { block = 'est'; cols = null; estStart = j; continue; }
      if (/^\s*Fit Diagnostics:/.test(L)) { if (estEnd < 0) estEnd = j - 1; block = 'fit'; cols = null; fitStart = j; continue; }
      if (/^\s*MCMC diagnostics/.test(L)) { if (fitEnd < 0) fitEnd = j - 1; block = 'diag'; cols = null; diagStart = j; continue; }
      if (/^\s*The mean_ppd/.test(L) || /^\s*For each parameter/.test(L) ||
          /^\s*Warning messages:/.test(L)) {
        if (block === 'est' && estEnd < 0) estEnd = j - 1;
        if (block === 'fit' && fitEnd < 0) fitEnd = j - 1;
        if (block === 'diag' && diagEnd < 0) diagEnd = j - 1;
        block = null; cols = null; continue;
      }
      if (!block) continue;
      if (!L.trim()) continue;
      if (cols === null) {
        if (isHeaderLine(L)) { cols = headerCols(L); }
        continue;
      }
      var row = readRow(L, cols);
      if (!row) continue;
      var p = slot(row.name, block === 'diag' ? 'diag' : 'est');
      if (row.mean != null) p.estimate = row.mean;
      if (row.sd != null) p.est_error = row.sd;
      if (row.mcse != null) p.mcse = row.mcse;
      if (row.rhat != null) p.rhat = row.rhat;
      if (row.n_eff != null) p.n_eff = row.n_eff;
      if (row.q) {
        p.q = p.q || {};
        for (var k in row.q) if (Object.prototype.hasOwnProperty.call(row.q, k)) p.q[k] = row.q[k];
      }
      if (block === 'fit') p.kind = classify(row.name, 'fit');
    }
    if (estEnd < 0) estEnd = estStart;
    if (diagEnd < 0) diagEnd = lines.length - 1;

    if (!order.length) {
      return fail('Found the "Model Info:" header but no parameter rows underneath it. ' +
                  'Paste the whole summary, including the "Estimates:" table, with the ' +
                  'spacing R printed.');
    }

    // ---- which quantiles were printed -> what interval they span
    var probsSeen = {};
    order.forEach(function (n) {
      var p = byName[n];
      if (p.q) for (var k in p.q) if (Object.prototype.hasOwnProperty.call(p.q, k)) probsSeen[k] = true;
    });
    m.probs = Object.keys(probsSeen).map(parseFloat).sort(function (a, b) { return a - b; });
    if (m.probs.length >= 2) {
      m.ciFrom = m.probs[0];
      m.ciTo = m.probs[m.probs.length - 1];
      m.ciLevel = m.ciTo - m.ciFrom;
    }

    order.forEach(function (n) {
      var p = byName[n];
      if (p.q && m.ciFrom != null) {
        p.lower = p.q[m.ciFrom];
        p.upper = p.q[m.ciTo];
        if (p.q[50] != null) p.median = p.q[50];
      }
      m.params.push(p);
    });

    region('est', 'Estimates', estStart, estEnd,
      'One row per parameter. "mean" is the posterior mean, "sd" is the posterior ' +
      'standard deviation (how uncertain that mean is), and the percent columns are ' +
      'quantiles of the posterior.');
    if (fitStart >= 0) {
      region('fit', 'Fit Diagnostics', fitStart, (fitEnd >= 0 ? fitEnd : fitStart + 2),
        'mean_PPD is the average of the posterior predictive distribution. Compare it ' +
        'with the mean of your actual outcome: if they are far apart the model is not ' +
        'reproducing your data.');
    }
    if (diagStart >= 0) {
      region('diag', 'MCMC diagnostics', diagStart, diagEnd,
        'Not about your science, about whether the sampler worked. Rhat near 1 and a ' +
        'large n_eff mean the chains explored the posterior properly.');
    }
    var wi = idx(/^\s*Warning messages:/);
    if (wi >= 0) {
      region('warn', 'Warnings', wi, lines.length - 1,
        'What Stan complained about while sampling. These are not cosmetic: a ' +
        'divergence or a large Rhat means the numbers above may be wrong.');
    }
    return { ok: true, model: m };
  }

  // ---- brms -------------------------------------------------------------

  function parseBrms(lines, joined) {
    var m = {
      engine: 'brms', regions: [], lines: lines, text: lines.join('\n'),
      family: null, link: null, links: null, formula: null, data: null,
      nobs: null, draws: null, chains: null, iter: null, warmup: null, thin: null,
      groups: [], params: [], ciLevel: null, ciFrom: null, ciTo: null, probs: []
    };
    var regions = m.regions;
    function region(key, label, start, end, meaning) {
      if (start < 0 || end < start) return;
      regions.push({ key: key, label: label, start: start, end: end, meaning: meaning });
    }
    function idx(re, from) {
      for (var i = from || 0; i < lines.length; i++) if (re.test(lines[i])) return i;
      return -1;
    }

    var g;
    for (var i = 0; i < lines.length; i++) {
      var L = lines[i];
      if ((g = L.match(/^\s*Family:\s*(.+?)\s*$/)) && !m.family) m.family = g[1];
      else if ((g = L.match(/^\s*Links:\s*(.+?)\s*$/)) && !m.links) {
        m.links = g[1];
        var lm = g[1].match(/mu\s*=\s*(\S+)/);
        m.link = lm ? lm[1] : null;
      } else if ((g = L.match(/^\s*Formula:\s*(.+?)\s*$/)) && !m.formula) m.formula = g[1];
      else if ((g = L.match(/^\s*Data:\s*(.+?)\s*$/)) && !m.data) {
        m.data = g[1];
        var nm = g[1].match(/Number of observations:\s*(\d+)/);
        if (nm) m.nobs = parseInt(nm[1], 10);
      }
      if ((g = L.match(/total post-warmup draws\s*=\s*(\d+)/))) m.draws = parseInt(g[1], 10);
      if ((g = L.match(/(\d+)\s+chains, each with iter\s*=\s*(\d+);\s*warmup\s*=\s*(\d+);\s*thin\s*=\s*(\d+)/))) {
        m.chains = parseInt(g[1], 10); m.iter = parseInt(g[2], 10);
        m.warmup = parseInt(g[3], 10); m.thin = parseInt(g[4], 10);
      }
    }

    var hEnd = idx(/^\s*(Group-Level Effects:|Population-Level Effects:|Regression Coefficients:|Family Specific Parameters:|Further Distributional Parameters:)/);
    region('head', 'Header', 0, (hEnd > 0 ? hEnd - 1 : Math.min(5, lines.length - 1)),
      'The model, the data, and how much posterior you have. "total post-warmup draws" ' +
      'is the number of samples kept after warmup, which is what every number below is ' +
      'computed from.');

    var block = null, cols = null, curGroup = null;
    var marks = {};
    for (var j = 0; j < lines.length; j++) {
      var ln = lines[j];
      if (/^\s*Group-Level Effects:/.test(ln)) { block = 'group'; cols = null; curGroup = null; marks.group = marks.group == null ? j : marks.group; continue; }
      if (/^\s*(Population-Level Effects:|Regression Coefficients:)/.test(ln)) { block = 'pop'; cols = null; marks.pop = j; continue; }
      if (/^\s*(Family Specific Parameters:|Further Distributional Parameters:)/.test(ln)) { block = 'family'; cols = null; marks.family = j; continue; }
      if (/^\s*(Correlation Structures?:|Smooth Terms:|Spline Terms:|Autocorrelation|Monotonic Simplex Parameters:)/.test(ln)) { block = 'other'; cols = null; continue; }
      if (/^\s*Draws were sampled|^\s*Samples were drawn/.test(ln)) { marks.foot = j; block = null; cols = null; continue; }
      if (/^\s*Warning messages:/.test(ln)) { block = null; cols = null; continue; }
      if (!block) continue;
      if (!ln.trim()) continue;
      if ((g = ln.match(/^\s*~(\S+)\s*\(Number of levels:\s*(\d+)\)/))) {
        curGroup = g[1];
        m.groups.push({ name: g[1], levels: parseInt(g[2], 10) });
        cols = null;
        continue;
      }
      if (cols === null) {
        if (isHeaderLine(ln)) cols = headerCols(ln);
        continue;
      }
      var row = readRow(ln, cols);
      if (!row) continue;
      var p = {
        name: row.name, block: block, kind: classify(row.name, block),
        estimate: row.estimate, est_error: row.est_error,
        lower: row.lower, upper: row.upper,
        rhat: row.rhat, bulk_ess: row.bulk_ess, tail_ess: row.tail_ess
      };
      if (row.eff_sample != null) { p.bulk_ess = row.eff_sample; p.effSampleOnly = true; }
      if (block === 'group' && curGroup) p.group = curGroup;
      if (m.ciFrom == null) {
        for (var c = 0; c < cols.length; c++) {
          if (cols[c].key === 'lower') m.ciFrom = cols[c].prob;
          if (cols[c].key === 'upper') m.ciTo = cols[c].prob;
        }
      }
      m.params.push(p);
    }

    if (!m.params.length) {
      return fail('This looks like brms output, but no parameter rows could be read. ' +
                  'The tables need their "Estimate Est.Error l-95% CI u-95% CI" header ' +
                  'row and the original spacing. Paste the whole summary(fit) output.');
    }

    /* brms prints l-95% / u-95%: the two bounds ARE the level, so the interval is 95%,
       not 95 - 95. Recover the level from the tail mass. */
    if (m.ciFrom != null && m.ciTo != null) {
      m.ciLevel = m.ciFrom === m.ciTo ? m.ciFrom : (m.ciTo - m.ciFrom);
      m.probs = [(100 - m.ciLevel) / 2, 100 - (100 - m.ciLevel) / 2];
    }

    if (marks.group != null) {
      region('group', 'Group-Level Effects', marks.group,
        (marks.pop != null ? marks.pop - 1 : (marks.family != null ? marks.family - 1 : lines.length - 1)),
        'The random effects. sd(...) rows are standard deviations ACROSS groups: how ' +
        'much the groups differ from each other. They are not coefficients and cannot ' +
        'be read as one.');
    }
    if (marks.pop != null) {
      region('pop', 'Population-Level Effects', marks.pop,
        (marks.family != null ? marks.family - 1 : (marks.foot != null ? marks.foot - 2 : lines.length - 1)),
        'The fixed effects: the average relationship across all groups. This is the ' +
        'block most people mean when they say "the coefficients".');
    }
    if (marks.family != null) {
      region('family', 'Family Specific Parameters', marks.family,
        (marks.foot != null ? marks.foot - 2 : lines.length - 1),
        'Parameters of the response distribution itself, such as sigma for a gaussian ' +
        'model. sigma is the residual spread, not an effect.');
    }
    if (marks.foot != null) {
      region('foot', 'Footer', marks.foot, lines.length - 1,
        'How the draws were produced and what Rhat and ESS mean, printed by brms every time.');
    }
    return { ok: true, model: m };
  }

  // ---- entry ------------------------------------------------------------

  function parse(text) {
    if (text == null || !String(text).trim()) {
      return fail('Nothing pasted yet. Paste the output of summary(fit) from an ' +
                  'rstanarm or brms model.');
    }
    var raw = String(text).replace(/\r\n?/g, '\n');
    var lines = raw.split('\n');
    // tolerate a copied console prompt: "> summary(fit)" / "R> print(summary(fit))"
    while (lines.length && /^\s*[A-Za-z]?>\s*(summary|print)\s*\(/.test(lines[0])) lines.shift();
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    if (!lines.length) {
      return fail('Nothing pasted yet. Paste the output of summary(fit) from an ' +
                  'rstanarm or brms model.');
    }
    var joined = lines.join('\n');
    var d = detect(joined);

    if (!d.rstanarm && !d.brms) {
      // Point at the right tool rather than just refusing.
      if (/^\s*Call:/m.test(joined) && /Residual standard error/i.test(joined)) {
        return fail('That is summary() of a plain lm() model, not a Bayesian fit. ' +
                    'Try the lm() Output Interpreter instead.', 'lm');
      }
      if (/Coefficients:/.test(joined) && /Dispersion parameter/i.test(joined)) {
        return fail('That is summary() of a glm() model, not a Bayesian fit. ' +
                    'Try the glm() Output Interpreter instead.', 'glm');
      }
      if (/Linear mixed model fit by REML|Generalized linear mixed model/i.test(joined)) {
        return fail('That is lme4 output, which is fitted by maximum likelihood, not ' +
                    'by MCMC. Try the lmer() Output Interpreter instead.', 'lmer');
      }
      if (/^\s*coxph\(formula/m.test(joined) || /exp\(coef\)/.test(joined)) {
        return fail('That is a Cox proportional hazards summary. ' +
                    'Try the coxph() Output Interpreter instead.', 'coxph');
      }
      if (/Inference for Stan model/.test(joined)) {
        return fail('That is raw rstan print(stanfit) output. This page reads the ' +
                    'rstanarm and brms summary() layouts, which label their blocks. ' +
                    'If the model came from stan_glm() or brm(), paste summary(fit) instead.');
      }
      if (/^\s*Estimates:/m.test(joined) || /Bulk_ESS|Tail_ESS/.test(joined)) {
        return fail('That looks like part of a Bayesian summary, but the header block ' +
                    'is missing, so there is no way to tell which package printed it. ' +
                    SUPPORTED);
      }
      return fail('That does not look like a Bayesian model summary. ' + SUPPORTED);
    }

    var res = d.brms && !d.rstanarm ? parseBrms(lines, joined) : parseRstanarm(lines, joined);
    if (!res.ok) return res;
    res.model.diagnostics = readDiagnostics(joined);
    res.model.raw = raw;
    return res;
  }

  // ---------------------------------------------------------------- judging

  function rhatVerdict(rhat) {
    if (rhat == null || isNaN(rhat)) return { level: 'unknown', label: 'not reported' };
    if (rhat > RHAT_BAD) return { level: 'bad', label: 'far too high' };
    if (rhat > RHAT_WARN) return { level: 'warn', label: 'above 1.01' };
    return { level: 'ok', label: 'fine' };
  }

  function essVerdict(ess) {
    if (ess == null || isNaN(ess)) return { level: 'unknown', label: 'not reported' };
    if (ess < ESS_BAD) return { level: 'bad', label: 'far too low' };
    if (ess < ESS_WARN) return { level: 'warn', label: 'below 400' };
    return { level: 'ok', label: 'fine' };
  }

  /* Rows that describe the science, as opposed to the sampler's own bookkeeping. */
  function isReportable(p) {
    return p.kind === 'coef' || p.kind === 'sigma' || p.kind === 'group_sd' ||
           p.kind === 'group_var' || p.kind === 'group_cor';
  }

  function coefficients(model) {
    return model.params.filter(function (p) { return p.kind === 'coef'; });
  }

  /* Does the printed interval exclude zero? Null when no interval was printed. */
  function excludesZero(p) {
    if (p.lower == null || p.upper == null) return null;
    if (isNaN(p.lower) || isNaN(p.upper)) return null;
    return (p.lower > 0 && p.upper > 0) || (p.lower < 0 && p.upper < 0);
  }

  /* P(theta > 0) under a NORMAL approximation to the marginal posterior, from the
     printed mean and sd. Exact only if that marginal is gaussian; it is not for
     sd() rows, sigma, or anything skewed. The UI must label it an approximation. */
  function probPositive(p) {
    if (p.estimate == null || p.est_error == null) return null;
    if (!(p.est_error > 0)) return null;
    return 1 - NM.pnorm(-p.estimate / p.est_error);
  }

  function probDirection(p) {
    var pp = probPositive(p);
    if (pp == null) return null;
    return Math.max(pp, 1 - pp);
  }

  /* Is the normal approximation defensible for this row? A variance/sd parameter is
     bounded at zero and skewed, so it is not. */
  function normalApproxOk(p) {
    if (p.kind !== 'coef') return false;
    if (p.lower == null || p.upper == null || p.estimate == null) return true;
    var lo = p.estimate - p.lower, hi = p.upper - p.estimate;
    if (!(lo > 0) || !(hi > 0)) return false;
    var skew = Math.abs(lo - hi) / Math.max(lo, hi);
    return skew < 0.25;   // the printed interval is near enough symmetric
  }

  function worstRhat(model) {
    var w = null;
    model.params.forEach(function (p) {
      if (p.rhat == null || isNaN(p.rhat)) return;
      if (w === null || p.rhat > w.rhat) w = p;
    });
    return w;
  }

  function essOf(p) {
    if (p.bulk_ess != null) return p.bulk_ess;
    if (p.n_eff != null) return p.n_eff;
    return null;
  }

  function worstEss(model) {
    var w = null, wv = null;
    model.params.forEach(function (p) {
      var e = essOf(p);
      if (e == null || isNaN(e)) return;
      if (wv === null || e < wv) { wv = e; w = p; }
    });
    return w;
  }

  /* The overall call: is this fit safe to report? */
  function fitVerdict(model) {
    var wr = worstRhat(model), we = worstEss(model);
    var d = model.diagnostics || {};
    var reasons = [];
    var level = 'ok';

    function demote(to) {
      var rank = { ok: 0, warn: 1, bad: 2 };
      if (rank[to] > rank[level]) level = to;
    }

    if (wr && wr.rhat > RHAT_BAD) {
      demote('bad');
      reasons.push('Rhat reaches ' + fmt(wr.rhat, 3) + ' on ' + wr.name +
                   ', far above the 1.01 threshold: the chains did not converge on the same answer.');
    } else if (wr && wr.rhat > RHAT_WARN) {
      demote('warn');
      reasons.push('Rhat reaches ' + fmt(wr.rhat, 3) + ' on ' + wr.name +
                   ', above the 1.01 threshold.');
    }
    if (we) {
      var ev = essOf(we);
      if (ev < ESS_BAD) {
        demote('bad');
        reasons.push('Effective sample size falls to ' + fmt(ev, 0) + ' on ' + we.name +
                     ', which is nowhere near enough to pin down a posterior.');
      } else if (ev < ESS_WARN) {
        demote('warn');
        reasons.push('Effective sample size falls to ' + fmt(ev, 0) + ' on ' + we.name +
                     ', below the 400 rule of thumb.');
      }
    }
    if (d.divergences != null && d.divergences > 0) {
      demote('bad');
      reasons.push(d.divergences + ' divergent transition' + (d.divergences === 1 ? '' : 's') +
                   ' after warmup: the sampler could not follow the posterior geometry, ' +
                   'so parts of it were never explored.');
    }
    if (d.notConverged) {
      demote('bad');
      reasons.push('Stan itself printed "Markov chains did not converge! Do not analyze results!".');
    }
    if (d.bfmi) {
      demote('warn');
      reasons.push('A low Bayesian Fraction of Missing Information was reported, which usually points at a badly scaled or funnel-shaped posterior.');
    }
    if (d.treedepth != null && d.treedepth > 0) {
      demote('warn');
      reasons.push(d.treedepth + ' transition' + (d.treedepth === 1 ? '' : 's') +
                   ' hit the maximum treedepth, which costs efficiency rather than correctness.');
    }
    return { level: level, reasons: reasons, worstRhat: wr, worstEss: we };
  }

  /* Which adapt_delta to try next, given what the paste shows. */
  function adaptDeltaLadder(current) {
    var ladder = [0.9, 0.95, 0.99];
    var cur = (current == null || isNaN(current)) ? 0.8 : current;
    for (var i = 0; i < ladder.length; i++) if (ladder[i] > cur) return ladder[i];
    return 0.999;
  }

  // ---------------------------------------------------------------- format

  function fmt(x, d) {
    if (x == null || (typeof x === 'number' && isNaN(x))) return 'n/a';
    if (x === Infinity) return 'Inf';
    if (x === -Infinity) return '-Inf';
    return Number(x).toFixed(d == null ? 3 : d);
  }

  return {
    parse: parse,
    detect: detect,
    classify: classify,
    headerCols: headerCols,
    readRow: readRow,
    peelNumbers: peelNumbers,
    isNumTok: isNumTok,
    readDiagnostics: readDiagnostics,
    rhatVerdict: rhatVerdict,
    essVerdict: essVerdict,
    excludesZero: excludesZero,
    probPositive: probPositive,
    probDirection: probDirection,
    normalApproxOk: normalApproxOk,
    coefficients: coefficients,
    isReportable: isReportable,
    essOf: essOf,
    worstRhat: worstRhat,
    worstEss: worstEss,
    fitVerdict: fitVerdict,
    adaptDeltaLadder: adaptDeltaLadder,
    fmt: fmt,
    RHAT_WARN: RHAT_WARN, RHAT_BAD: RHAT_BAD,
    ESS_WARN: ESS_WARN, ESS_BAD: ESS_BAD
  };
}));
