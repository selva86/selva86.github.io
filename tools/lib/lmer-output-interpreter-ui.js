/*
  UI for tools/lmer-output-interpreter.html
  Math + parsing live in lmer-math.js; this file only renders.

  PRESET_TEXT below is spliced in mechanically by
  Scripts/tool-truth/splice-lmer-presets.py from the R-generated truth table
  (Scripts/tool-truth/lmer-output-interpreter.json). It is never hand-typed:
  the presets must be byte-identical to what lme4 actually printed, and the E2E
  asserts exactly that.
*/
(function () {
  'use strict';
  var L = window.LmerMath;

  /* __PRESETS_BEGIN__ */
    var PRESET_TEXT = {
    "ri": "Linear mixed model fit by REML ['lmerMod']\nFormula: Reaction ~ Days + (1 | Subject)\n   Data: sleepstudy\n\nREML criterion at convergence: 1786.5\n\nScaled residuals: \n    Min      1Q  Median      3Q     Max \n-3.2257 -0.5529  0.0109  0.5188  4.2506 \n\nRandom effects:\n Groups   Name        Variance Std.Dev.\n Subject  (Intercept) 1378.2   37.12   \n Residual              960.5   30.99   \nNumber of obs: 180, groups:  Subject, 18\n\nFixed effects:\n            Estimate Std. Error t value\n(Intercept) 251.4051     9.7467   25.79\nDays         10.4673     0.8042   13.02\n\nCorrelation of Fixed Effects:\n     (Intr)\nDays -0.371",
    "rs": "Linear mixed model fit by REML ['lmerMod']\nFormula: Reaction ~ Days + (Days | Subject)\n   Data: sleepstudy\n\nREML criterion at convergence: 1743.6\n\nScaled residuals: \n    Min      1Q  Median      3Q     Max \n-3.9536 -0.4634  0.0231  0.4634  5.1793 \n\nRandom effects:\n Groups   Name        Variance Std.Dev. Corr \n Subject  (Intercept) 612.10   24.741        \n          Days         35.07    5.922   0.07 \n Residual             654.94   25.592        \nNumber of obs: 180, groups:  Subject, 18\n\nFixed effects:\n            Estimate Std. Error t value\n(Intercept)  251.405      6.825  36.838\nDays          10.467      1.546   6.771\n\nCorrelation of Fixed Effects:\n     (Intr)\nDays -0.138",
    "glmer": "Generalized linear mixed model fit by maximum likelihood (Laplace\n  Approximation) [glmerMod]\n Family: binomial  ( logit )\nFormula: r2 ~ Anger + Gender + btype + (1 | id)\n   Data: VerbAgg\n\n      AIC       BIC    logLik -2*log(L)  df.resid \n   8702.0    8743.6   -4345.0    8690.0      7578 \n\nScaled residuals: \n    Min      1Q  Median      3Q     Max \n-4.4697 -0.6895 -0.2540  0.7057  5.5323 \n\nRandom effects:\n Groups Name        Variance Std.Dev.\n id     (Intercept) 1.456    1.207   \nNumber of obs: 7584, groups:  id, 316\n\nFixed effects:\n            Estimate Std. Error z value Pr(>|z|)    \n(Intercept) -0.28125    0.31892  -0.882 0.377837    \nAnger        0.05211    0.01525   3.416 0.000636 ***\nGenderM      0.29297    0.17394   1.684 0.092122 .  \nbtypescold  -0.97878    0.06615 -14.797  < 2e-16 ***\nbtypeshout  -1.89468    0.07078 -26.770  < 2e-16 ***\n---\nSignif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n\nCorrelation of Fixed Effects:\n           (Intr) Anger  GendrM btypsc\nAnger      -0.957                     \nGenderM    -0.147  0.023              \nbtypescold -0.094 -0.015 -0.008       \nbtypeshout -0.080 -0.026 -0.013  0.522",
    "lmertest": "Linear mixed model fit by REML. t-tests use Satterthwaite's method [\nlmerModLmerTest]\nFormula: Reaction ~ Days + (1 | Subject)\n   Data: sleepstudy\n\nREML criterion at convergence: 1786.5\n\nScaled residuals: \n    Min      1Q  Median      3Q     Max \n-3.2257 -0.5529  0.0109  0.5188  4.2506 \n\nRandom effects:\n Groups   Name        Variance Std.Dev.\n Subject  (Intercept) 1378.2   37.12   \n Residual              960.5   30.99   \nNumber of obs: 180, groups:  Subject, 18\n\nFixed effects:\n            Estimate Std. Error       df t value Pr(>|t|)    \n(Intercept) 251.4051     9.7467  22.8102   25.79   <2e-16 ***\nDays         10.4673     0.8042 161.0000   13.02   <2e-16 ***\n---\nSignif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1\n\nCorrelation of Fixed Effects:\n     (Intr)\nDays -0.371"
  };
    /* __PRESETS_END__ */

  var PRESET_META = {
    ri:       { r: "library(lme4)\nm <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)" },
    rs:       { r: "library(lme4)\nm <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)" },
    glmer:    { r: "library(lme4)\nm <- glmer(r2 ~ Anger + Gender + btype + (1 | id), family = binomial, data = VerbAgg)" },
    lmertest: { r: "library(lmerTest)\nm <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)" }
  };

  var MODE_PHRASE = {
    anatomy: 'decode every block of my summary',
    icc:     'read the random effects and the ICC',
    fixed:   'read the fixed effects',
    pvalues: 'work out the p-values'
  };

  var $ = function (id) { return document.getElementById(id); };
  var mode = 'anatomy';
  var lastScen = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function fmt(x, d) {
    if (x == null || !isFinite(x)) return 'n/a';
    return Number(x).toFixed(d == null ? 3 : d);
  }
  function sig(x, n) {
    if (x == null || !isFinite(x)) return 'n/a';
    var a = Math.abs(x);
    if (a !== 0 && (a < 1e-4 || a >= 1e6)) return Number(x).toExponential((n || 4) - 1);
    return String(Number(Number(x).toPrecision(n || 4)));
  }
  function pct(x) { return (100 * x).toFixed(1) + '%'; }

  /* --------------------------------------------------------------- banner --- */
  function renderIWant() {
    var opts = Object.keys(MODE_PHRASE).map(function (k) {
      return '<option value="' + k + '"' + (k === mode ? ' selected' : '') + '>' + MODE_PHRASE[k] + '</option>';
    }).join('');
    $('iwant').innerHTML = 'I want to <span class="psel">' + esc(MODE_PHRASE[mode]) +
      '<span class="pcaret">&#9662;</span><select id="modesel" aria-label="What to read">' + opts + '</select></span>';
    $('modesel').addEventListener('change', function () { setMode(this.value); });
  }

  function setMode(m) {
    if (!MODE_PHRASE[m]) return;
    mode = m;
    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-mode') === m);
    });
    renderIWant();
    run();
  }

  /* ------------------------------------------------------------ rendering --- */

  function varianceBar(model, ic) {
    var segs = [];
    model.random.groups.forEach(function (g) {
      var inter = g.terms.filter(function (t) { return /\(Intercept\)/.test(t.name); })[0] || g.terms[0];
      if (inter && isFinite(inter.variance)) segs.push({ label: g.name, v: inter.variance, cls: 'g' + Math.min(segs.length + 1, 3) });
    });
    var resid = ic && ic.ok ? ic.residual : (model.random.residual ? model.random.residual.variance : null);
    if (resid == null) return null;
    segs.push({ label: model.kind === 'glmer' ? 'Residual (latent)' : 'Residual', v: resid, cls: 'res' });
    var tot = segs.reduce(function (s, x) { return s + x.v; }, 0);
    if (!(tot > 0)) return null;
    var bar = segs.map(function (s) {
      var w = 100 * s.v / tot;
      return '<div class="seg ' + s.cls + '" style="width:' + w.toFixed(3) + '%" title="' + esc(s.label) + ': ' + pct(s.v / tot) + '">' +
        (w > 12 ? pct(s.v / tot) : '') + '</div>';
    }).join('');
    var lg = segs.map(function (s) {
      var c = s.cls === 'res' ? '#c9cec7' : (s.cls === 'g1' ? '#1f7a55' : (s.cls === 'g2' ? '#3f9d78' : '#63b394'));
      return '<span><i style="background:' + c + '"></i>' + esc(s.label) + ' &middot; ' + sig(s.v, 4) + '</span>';
    }).join('');
    return { bar: bar, lg: lg };
  }

  function anatomyView(model) {
    var html = '';
    var covered = [];
    model.regions.forEach(function (r) { covered.push(r); });
    covered.sort(function (a, b) { return a.start - b.start; });
    covered.forEach(function (r) {
      var txt = model.lines.slice(r.start, r.end + 1).join('\n');
      if (!txt.trim()) return;
      var dim = (r.key === 'resid' || r.key === 'signif') ? ' dim' : '';
      html += '<div class="rgn' + dim + '" data-rgn="' + r.key + '">' +
        '<div class="rh"><span class="rt">' + esc(r.label) + '</span></div>' +
        '<pre>' + esc(txt) + '</pre>' +
        '<p class="rm">' + r.meaning + '</p></div>';
    });
    return '<div class="anat">' + html + '</div>';
  }

  function iccView(model, ic) {
    var h = '';
    if (!ic.ok) {
      h += '<div class="note"><b>No ICC from this paste.</b> ' + esc(ic.reason) + '</div>';
      return h;
    }
    var termLines = ic.terms.map(function (t) {
      return t.group + ' variance = ' + sig(t.variance, 6);
    }).join('\n');
    h += '<div class="formula">' +
      esc(termLines) + '\n' +
      esc((ic.latent ? 'residual variance = ' + ic.residualSource + ' = ' + sig(ic.residual, 6)
                     : 'residual variance = ' + sig(ic.residual, 6))) + '\n\n' +
      esc('ICC = ' + sig(ic.sumTau, 6) + ' / (' + sig(ic.sumTau, 6) + ' + ' + sig(ic.residual, 6) + ') = ' + fmt(ic.value, 4)) +
      '</div>';

    if (ic.residualNote) h += '<div class="note">' + esc(ic.residualNote) + '</div>';
    if (ic.multiGroup) {
      h += '<div class="note"><b>More than one grouping factor.</b> The variances of ' +
        esc(ic.terms.map(function (t) { return t.group; }).join(' and ')) +
        ' are added together, so this ICC is the share of leftover variance explained by all grouping factors at once. ' +
        'For one factor at a time, divide that factor\'s variance by the same total.</div>';
    }
    if (ic.atZeroOnly) {
      h += '<div class="note"><b>This model has a random slope, so the ICC is not a single number.</b> ' +
        'Once ' + esc(ic.slopeGroups.join(' and ')) + ' varies in both intercept and slope, the between-group variance depends on where you stand on the predictor. ' +
        'The figure above is the ICC <b>at the predictor\'s zero point</b>, which is all a printed summary can support. ' +
        'performance::icc() averages that variance over your observed predictor values (it needs mean(x) and mean(x&sup2;), which live in the data, not in this text), so it will report a different, larger number. Run <b>performance::icc(model)</b> on the model object for it.</div>';
    }

    model.random.groups.forEach(function (g) {
      g.terms.forEach(function (t) {
        var isInt = /\(Intercept\)/.test(t.name);
        var zero = !(t.variance > 1e-10);
        h += '<div class="drow"><div class="dt">' + esc(g.name) + ' &middot; ' + esc(t.name) +
          (zero ? '<span class="pill warn">zero variance</span>' : '') + '</div>' +
          '<div class="dv">Variance ' + sig(t.variance, 5) + ' &nbsp;|&nbsp; Std.Dev. ' + sig(t.sd, 5) + '</div>' +
          '<div class="dd">' + (zero
            ? 'The optimiser pushed this component to zero: the data give no evidence that it varies at all. This is a singular fit. The model is over-specified rather than broken, and the usual remedy is to drop this term.'
            : (isInt
              ? 'A typical ' + esc(g.name) + ' sits about <b>' + sig(t.sd, 4) + '</b> ' + (model.kind === 'glmer' ? 'log-odds' : 'outcome units') +
                ' above or below the average ' + esc(g.name) + ', after the fixed effects are accounted for.'
              : 'The effect of <b>' + esc(t.name) + '</b> itself differs between ' + esc(g.name) + 's, with a spread of about <b>' + sig(t.sd, 4) +
                '</b> ' + (model.kind === 'glmer' ? 'log-odds' : 'outcome units') + ' per unit of ' + esc(t.name) +
                '. Two thirds of ' + esc(g.name) + 's have a slope within &plusmn;' + sig(t.sd, 4) + ' of the average slope.')) +
          '</div></div>';
        if (t.corr && t.corr.length) {
          h += '<div class="drow"><div class="dt">Corr(' + esc(g.name) + ')</div>' +
            '<div class="dv">' + t.corr.map(function (c) { return fmt(c, 2); }).join(', ') + '</div>' +
            '<div class="dd">' + (Math.abs(t.corr[0]) < 0.25
              ? 'Groups with a high intercept are <b>not</b> systematically groups with a high slope: the two random effects are close to unrelated here.'
              : (t.corr[0] > 0
                ? 'Groups starting higher also tend to climb faster (correlation <b>' + fmt(t.corr[0], 2) + '</b>). Note this is sensitive to where zero sits on your predictor.'
                : 'Groups starting higher tend to climb more slowly (correlation <b>' + fmt(t.corr[0], 2) + '</b>). Note this is sensitive to where zero sits on your predictor.')) +
            '</div></div>';
        }
      });
    });
    if (model.random.residual) {
      h += '<div class="drow"><div class="dt">Residual</div>' +
        '<div class="dv">Variance ' + sig(model.random.residual.variance, 5) + ' &nbsp;|&nbsp; Std.Dev. ' + sig(model.random.residual.sd, 5) + '</div>' +
        '<div class="dd">What is left once both the fixed effects and the group differences are accounted for. A single measurement lands about <b>' +
        sig(model.random.residual.sd, 4) + '</b> outcome units away from its own group\'s fitted line.</div></div>';
    }
    return h;
  }

  function fixedView(model) {
    var h = '';
    if (!model.fixed.hasP) {
      h += '<div class="note"><b>No p-value column, by design.</b> Plain <code>lmer()</code> prints the ' + model.fixed.statName +
        ' value but stops there, because the degrees of freedom for a mixed model have no agreed definition. Switch to <b>The p-value question</b> above for the options.</div>';
    }
    model.fixed.rows.forEach(function (r) {
      var ci = L.waldCI(r.estimate, r.se, 0.95);
      var crosses = (ci.lower <= 0 && ci.upper >= 0);
      var isInt = /\(Intercept\)/.test(r.term);
      var glm = model.kind === 'glmer';
      h += '<div class="drow"><div class="dt">' + esc(r.term) +
        (crosses ? '<span class="pill">interval spans 0</span>' : '<span class="pill on">interval excludes 0</span>') + '</div>' +
        '<div class="dv">Estimate ' + sig(r.estimate, 5) + ' &nbsp;|&nbsp; SE ' + sig(r.se, 4) +
        ' &nbsp;|&nbsp; ' + model.fixed.statName + ' = ' + sig(r.stat, 4) +
        (r.df != null ? ' &nbsp;|&nbsp; df = ' + sig(r.df, 4) : '') +
        (r.p != null ? ' &nbsp;|&nbsp; p ' + (r.pBounded ? '&lt; ' + sig(r.p, 2) : '= ' + L.fmtP(r.p)) : '') +
        '</div><div class="dd">';
      if (isInt) {
        h += glm
          ? 'The log-odds of the outcome when every predictor is at zero or its reference level, which is an odds of <b>' + sig(Math.exp(r.estimate), 4) +
            '</b> and a probability of <b>' + pct(1 / (1 + Math.exp(-r.estimate))) + '</b> for that baseline case.'
          : 'The fitted average outcome when every predictor is zero or at its reference level: <b>' + sig(r.estimate, 5) + '</b> outcome units. It is only meaningful if zero is a real value for your predictors.';
      } else {
        h += glm
          ? 'Each one-unit increase in <b>' + esc(r.term) + '</b> multiplies the odds by <b>' + sig(Math.exp(r.estimate), 4) + '</b> (' +
            (r.estimate >= 0 ? 'a ' + fmt(100 * (Math.exp(r.estimate) - 1), 1) + '% increase' : 'a ' + fmt(100 * (1 - Math.exp(r.estimate)), 1) + '% decrease') +
            ' in the odds), holding the rest fixed.'
          : 'Each one-unit increase in <b>' + esc(r.term) + '</b> is associated with a change of <b>' + sig(r.estimate, 4) +
            '</b> outcome units on average, holding the rest fixed.';
      }
      h += ' The 95% Wald interval runs <b>' + sig(ci.lower, 4) + '</b> to <b>' + sig(ci.upper, 4) + '</b>' +
        (glm ? ', which is an odds ratio of ' + sig(Math.exp(ci.lower), 3) + ' to ' + sig(Math.exp(ci.upper), 3) : '') + '.';
      if (!model.fixed.hasP) {
        h += ' Its ' + model.fixed.statName + ' value of ' + sig(r.stat, 4) + ' is ' +
          (Math.abs(r.stat) > 2 ? 'past the rough |t| &gt; 2 mark' : 'inside the rough |t| &gt; 2 mark') +
          ', but that mark assumes infinite degrees of freedom.';
      }
      h += '</div></div>';
    });
    return h;
  }

  function pvalueView(model) {
    var h = '';
    if (model.fixed.hasP) {
      h += '<div class="note"><b>This summary already has p-values.</b> ' +
        (model.isLmerTest
          ? 'The header names Satterthwaite\'s method, so this is an <code>lmerTest</code> fit: it supplies the approximate degrees of freedom that plain lme4 refuses to guess. The df column is the giveaway, and it is rarely a whole number.'
          : 'A <code>glmer()</code> fit reports z values, not t values. The reference distribution is the normal, so no denominator degrees of freedom are needed and the p-value is well defined. That is why glmer prints them and lmer does not.') +
        '</div>';
    } else {
      h += '<div class="note"><b>No p-values here, and that is deliberate.</b> A p-value needs degrees of freedom, and for a mixed model there is no agreed way to compute them. lme4 prints the t value and stops rather than defend a number it cannot.</div>';
    }
    var rows = model.fixed.rows.filter(function (r) { return !/\(Intercept\)/.test(r.term); });
    if (!rows.length) rows = model.fixed.rows.slice(0);
    rows.forEach(function (r) {
      var np = L.normalP(r.stat);
      h += '<div class="drow"><div class="dt">' + esc(r.term) + '</div>' +
        '<div class="dv">' + model.fixed.statName + ' = ' + sig(r.stat, 4) +
        (r.df != null ? ' &nbsp;|&nbsp; df = ' + sig(r.df, 4) : '') +
        (r.p != null ? ' &nbsp;|&nbsp; reported p ' + (r.pBounded ? '&lt; ' + sig(r.p, 2) : '= ' + L.fmtP(r.p)) : '') + '</div>' +
        '<div class="dd">';
      if (model.fixed.hasP) {
        h += 'The p-value in your output is <b>' + (r.pBounded ? '&lt; ' + sig(r.p, 2) : L.fmtP(r.p)) + '</b>' +
          (model.isLmerTest ? ', from a t distribution with the Satterthwaite df shown' : ', from the normal distribution') + '.';
      } else {
        h += 'Treating the df as infinite gives p &asymp; <b>' + L.fmtP(np) + '</b>. That is the number the |t| &gt; 2 rule leans on, and it is <b>anti-conservative</b>: the real p is larger, and the gap widens as the number of groups shrinks. Use it to see where you stand, not to make the call.';
      }
      h += '</div></div>';
    });
    h += '<div class="note">Whatever route you take, decide it before you look. Refitting with <code>lmerTest</code> until a term clears 0.05 is the same p-hacking it would be anywhere else.</div>';
    return h;
  }

  /* ------------------------------------------------------------ R emitter --- */
  function rCode(model, ic) {
    var meta = lastScen && PRESET_META[lastScen];
    var lines = [];
    if (meta) {
      lines.push(meta.r);
    } else {
      lines.push('library(lme4)');
      var call = (model.kind === 'glmer' ? 'glmer(' : 'lmer(') + (model.formula || 'y ~ x + (1 | g)') +
        (model.kind === 'glmer' && model.family ? ', family = ' + model.family : '') +
        (model.data ? ', data = ' + model.data : '') + ')';
      lines.push('m <- ' + call);
    }
    lines.push('');
    lines.push('# the ICC this page reports, straight from the model object');
    lines.push('performance::icc(m)');
    if (ic && ic.ok && ic.atZeroOnly) {
      lines.push('#> this model has a random slope, so performance::icc() averages the');
      lines.push('#> random-effect variance over your observed predictor values. It needs');
      lines.push('#> the data, so it will differ from the at-zero ICC shown on this page.');
    }
    lines.push('');
    lines.push('# the 95% intervals shown above (estimate +/- 1.96 * SE)');
    lines.push('confint(m, method = "Wald")');
    lines.push('');
    if (model.kind === 'glmer') {
      // Profiling a glmer can stop with "profiling detected new, lower deviance"
      // when the optimiser did not land exactly on the optimum. It does exactly
      // that on the VerbAgg fit, so this stays commented rather than handing you
      // a line that errors.
      lines.push('# Profile intervals are better when the call is close, but on a glmer fit');
      lines.push('# profiling often stops with "profiling detected new, lower deviance" if the');
      lines.push('# optimiser did not land exactly on the optimum. Refit with a tighter');
      lines.push('# tolerance first, or stay with the Wald intervals above.');
      lines.push('# confint(m, method = "profile")');
    } else {
      lines.push('# better intervals when the call is close (slower, no df needed)');
      lines.push('confint(m, method = "profile")');
    }
    if (model.kind !== 'glmer' && !model.fixed.hasP) {
      lines.push('');
      lines.push('# p-values, if you want them: lmerTest adds Satterthwaite df');
      lines.push('library(lmerTest)');
      lines.push('m2 <- ' + (model.formula
        ? 'lmer(' + model.formula + (model.data ? ', data = ' + model.data : '') + ')'
        : 'lmer(<your formula>, data = <your data>)'));
      lines.push('summary(m2)');
    }
    return lines.join('\n');
  }

  /* -------------------------------------------------------------- verdict --- */
  function verdict(model, ic, de) {
    var g = model.groups[0];
    var kindWord = model.kind === 'glmer'
      ? 'A generalized linear mixed model (' + (model.family || '?') + ', ' + (model.link || '?') + ' link)'
      : 'A linear mixed model fitted by ' + (model.method || 'REML');
    var slope = model.random.groups.some(function (x) { return x.terms.length > 1; });
    var structure = slope ? 'random intercepts and slopes' : 'random intercepts';
    var head, sub;
    if (ic.ok) {
      head = (g ? esc(g.name) : 'The grouping factor') + ' accounts for ' + pct(ic.value) + ' of the leftover variance';
      sub = kindWord + ' with ' + structure + (g ? ' for ' + g.name : '') + '.' +
        (ic.atZeroOnly ? ' ICC shown at the predictor\'s zero point.' : '');
    } else {
      head = kindWord;
      sub = 'The ICC cannot be computed from this paste. ' + ic.reason;
    }
    var plain = '';
    if (ic.ok) {
      plain = 'Of the variance your fixed effects did not explain, <b>' + pct(ic.value) + '</b> is a stable difference between ' +
        (g ? esc(g.name) + 's' : 'groups') + ' and the rest is noise within them. Put another way, two observations from the same ' +
        (g ? esc(g.name) : 'group') + ' correlate about <b>' + fmt(ic.value, 2) + '</b>' +
        (ic.atZeroOnly ? ' at the point where the predictor is zero' : '') + '. ';
      if (de) {
        plain += 'That dependence has a price: your <b>' + model.nobs + '</b> rows carry roughly the information of <b>' +
          fmt(de.neff, 0) + '</b> independent observations (design effect ' + fmt(de.de, 2) + '), because ' +
          fmt(de.avgClusterSize, 1) + ' measurements per ' + esc(de.groupName) + ' are far from independent. Ignoring the grouping would have made every standard error too small.';
      }
    } else {
      plain = 'The fixed effects and variance components below are read straight from your paste. ' + ic.reason;
    }
    var infl;
    if (ic.ok && ic.atZeroOnly) {
      infl = 'Since this model has a random slope, the ICC is not one number: <b>' + fmt(ic.value, 3) +
        '</b> is its value where the predictor is zero, and it changes as the predictor moves. Run <b>performance::icc(model)</b> for the value averaged over your data.';
    } else if (ic.ok) {
      infl = 'Since ICC = ' + fmt(ic.value, 3) + ', ' + (ic.value >= 0.5
        ? 'more than half the unexplained variance is between ' + (g ? esc(g.name) + 's' : 'groups') + ': the grouping is the dominant structure in this data and the random effect earns its place.'
        : (ic.value >= 0.1
          ? 'a meaningful minority of the unexplained variance is between ' + (g ? esc(g.name) + 's' : 'groups') + ': the random effect is doing real work and dropping it would understate your standard errors.'
          : 'very little of the unexplained variance is between ' + (g ? esc(g.name) + 's' : 'groups') + ': the grouping matters little here, though keeping it costs you almost nothing.'));
    } else {
      infl = 'No ICC is available from a printed summary for this model type, so the reading below stops at the fixed effects.';
    }
    var rep;
    if (ic.ok) {
      rep = (model.kind === 'glmer' ? 'glmer' : 'lmer') + ': ICC = ' + fmt(ic.value, 3) +
        (ic.atZeroOnly ? ' (at x=0)' : '') + '; ' +
        (g ? g.n + ' ' + g.name + 's' : '') + ', ' + model.nobs + ' obs' +
        (de ? '; design effect ' + fmt(de.de, 2) + ', n_eff = ' + fmt(de.neff, 0) : '');
    } else {
      rep = (model.kind === 'glmer' ? 'glmer' : 'lmer') + ': ' + model.nobs + ' obs' + (g ? ', ' + g.n + ' ' + g.name + 's' : '') + '; ICC not available from printed output';
    }
    return { head: head, sub: sub, plain: plain, infl: infl, rep: rep };
  }

  /* ------------------------------------------------------------------ run --- */
  function run() {
    var txt = $('paste').value;
    var err = $('ierr');
    var empty = !txt.trim();

    if (empty) {
      err.classList.remove('show');
      $('vchip').textContent = 'Waiting for a paste';
      $('vhead').textContent = 'Paste an lme4 summary to decode it';
      $('vsub').textContent = 'Or load one of the four real model outputs above.';
      ['vbar', 'statgrid', 'plain', 'inference-line', 'copyrow'].forEach(function (i) { $(i).hidden = true; });
      $('body').innerHTML = '';
      $('rcodepre').textContent = '# Paste a summary above and the matching R lines appear here.';
      $('h2c').textContent = '';
      $('h3c').textContent = '';
      return;
    }

    var res = L.parse(txt);
    if (!res.ok) {
      var msg = esc(res.error);
      if (res.hint === 'lm') msg = msg.replace('lm() Output Interpreter', '<a href="/tools/lm-output-interpreter.html">lm() Output Interpreter</a>');
      if (res.hint === 'glm') msg = msg.replace('glm() Output Interpreter', '<a href="/tools/glm-output-interpreter.html">glm() Output Interpreter</a>');
      err.innerHTML = msg;
      err.classList.add('show');
      $('vchip').textContent = 'Could not read that';
      $('vhead').textContent = 'That does not look like an lme4 summary';
      $('vsub').textContent = 'Fix the paste and the reading appears here straight away.';
      ['vbar', 'statgrid', 'plain', 'inference-line', 'copyrow'].forEach(function (i) { $(i).hidden = true; });
      $('body').innerHTML = '';
      $('rcodepre').textContent = '# Waiting for a readable summary.';
      return;
    }
    err.classList.remove('show');

    var model = res.model;
    var ic = L.icc(model);
    var de = ic.ok && !ic.atZeroOnly ? L.designEffect(model, ic.value) : null;
    var v = verdict(model, ic, de);

    $('vchip').textContent = model.kind === 'glmer'
      ? 'glmer &middot; ' + (model.family || '') : (model.isLmerTest ? 'lmerTest' : 'lmer &middot; ' + (model.method || ''));
    $('vchip').innerHTML = $('vchip').textContent;
    $('vhead').innerHTML = v.head;
    $('vsub').textContent = v.sub;

    // variance bar
    var vb = varianceBar(model, ic);
    if (vb) {
      $('vbarbar').innerHTML = vb.bar;
      $('vbarlg').innerHTML = vb.lg;
      $('vbarcap').textContent = model.kind === 'glmer'
        ? 'How the unexplained variance splits, using the latent-scale residual pi^2/3.'
        : 'How the variance the fixed effects did not explain splits between groups and noise.';
      $('vbar').hidden = false;
    } else { $('vbar').hidden = true; }

    // stat grid
    var g0 = model.random.groups[0];
    var gInt = g0 && (g0.terms.filter(function (t) { return /\(Intercept\)/.test(t.name); })[0] || g0.terms[0]);
    $('k1').innerHTML = ic.ok && ic.atZeroOnly ? 'ICC (at x = 0)' : 'ICC';
    $('v1').textContent = ic.ok ? fmt(ic.value, 3) : 'n/a';
    $('k2').textContent = g0 ? g0.name + ' SD' : 'Between-group SD';
    $('v2').textContent = gInt ? sig(gInt.sd, 4) : 'n/a';
    $('k3').innerHTML = model.kind === 'glmer' ? 'Residual (latent)' : 'Residual SD';
    $('v3').textContent = model.random.residual ? sig(model.random.residual.sd, 4)
      : (ic.ok && ic.latent ? sig(Math.sqrt(ic.residual), 4) : 'n/a');
    if (de) {
      $('k4').innerHTML = 'Effective n';
      $('v4').innerHTML = '<span class="sm">' + fmt(de.neff, 0) + ' of ' + model.nobs + '</span>';
    } else {
      $('k4').textContent = 'Observations';
      $('v4').innerHTML = '<span class="sm">' + model.nobs + (model.groups[0] ? ' / ' + model.groups[0].n + ' ' + esc(model.groups[0].name) : '') + '</span>';
    }
    $('statgrid').hidden = false;

    // main body per mode
    var html = '';
    if (mode === 'anatomy') html = anatomyView(model);
    else if (mode === 'icc') html = iccView(model, ic);
    else if (mode === 'fixed') html = fixedView(model);
    else html = pvalueView(model);
    $('body').innerHTML = html;

    $('plain').innerHTML = v.plain; $('plain').hidden = false;
    $('inference-line').innerHTML = '<span class="ik">What this says</span>' + v.infl;
    $('inference-line').hidden = false;
    $('report').textContent = v.rep; $('copyrow').hidden = false;

    $('rcodepre').textContent = rCode(model, ic);
    if (window.hljsRHighlight) { try { window.hljsRHighlight($('rcodepre')); } catch (e) {} }

    // how-computed, with live numbers
    $('h2c').innerHTML = ic.ok
      ? 'Your variance components are read from the Random effects table: ' +
        esc(ic.terms.map(function (t) { return t.group + ' = ' + sig(t.variance, 5); }).join(', ')) +
        ' and residual = ' + sig(ic.residual, 5) + (ic.latent ? ' (the latent-scale ' + ic.residualSource + ')' : '') + '.'
      : 'No ICC is available for this model from printed output alone.';
    $('h3c').innerHTML = ic.ok
      ? 'ICC = ' + sig(ic.sumTau, 5) + ' / (' + sig(ic.sumTau, 5) + ' + ' + sig(ic.residual, 5) + ') = <b>' + fmt(ic.value, 4) + '</b>' +
        (ic.atZeroOnly
          ? '. Because a random slope is present this is the value at the predictor\'s zero point, not the data-averaged ICC that performance::icc() reports.'
          : '. This is the adjusted ICC that performance::icc() reports for this model.')
      : '';
  }

  /* ----------------------------------------------------------------- wire --- */
  function boot() {
    renderIWant();
    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-scen');
        if (!PRESET_TEXT[k]) return;
        lastScen = k;
        $('paste').value = PRESET_TEXT[k];
        if (window.__toolUse) window.__toolUse();
        run();
      });
    });
    $('paste').addEventListener('input', function () {
      lastScen = null;
      if (window.__toolUse) window.__toolUse();
      run();
    });
    $('clearbtn').addEventListener('click', function () {
      $('paste').value = ''; lastScen = null; run(); $('paste').focus();
    });
    $('copybtn').addEventListener('click', function () {
      var t = $('report').textContent;
      navigator.clipboard.writeText(t).then(function () {
        var b = $('copybtn'); var o = b.textContent; b.textContent = 'Copied';
        setTimeout(function () { b.textContent = o; }, 1400);
      }, function () {});
      if (window.__toolCopy) window.__toolCopy('verdict');
    });
    $('rcopy').addEventListener('click', function () {
      navigator.clipboard.writeText($('rcodepre').textContent).then(function () {
        var b = $('rcopy'); var o = b.textContent; b.textContent = 'Copied';
        setTimeout(function () { b.textContent = o; }, 1400);
      }, function () {});
      if (window.__toolCopy) window.__toolCopy('rcode');
    });
    // never an empty tool on first paint
    lastScen = 'ri';
    $('paste').value = PRESET_TEXT.ri || '';
    run();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
