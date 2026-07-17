/* bayesian-output-interpreter-ui.js - rendering only.
   Parsing and judgement live in bayes-output-math.js; presets in
   bayes-output-presets.js. This file turns a parsed model into HTML and
   never does statistics of its own. */
(function () {
  'use strict';

  var B = window.BayesOutputMath;
  var P = window.BayesPresets;
  var SLUG = 'bayesian-output-interpreter';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmt(x, d) { return B.fmt(x, d); }
  function num(x, d) {
    if (x == null || (typeof x === 'number' && isNaN(x))) return 'n/a';
    return Number(x).toFixed(d == null ? 3 : d);
  }
  function pct(p, d) {
    if (p == null || isNaN(p)) return 'n/a';
    return (100 * p).toFixed(d == null ? 1 : d) + '%';
  }

  /* A posterior probability is never exactly 1. Rounding 0.9999999 to "100.0%"
     claims a certainty the arithmetic does not have, so bound the display instead.
     The floor is set where the normal approximation stops being worth quoting
     anyway: past four nines the tail shape, not the mass, is doing the talking. */
  function fmtProb(p) {
    if (p == null || isNaN(p)) return 'n/a';
    if (p >= 0.9995) return 'greater than 99.9%';
    if (p <= 0.0005) return 'less than 0.1%';
    return pct(p, 1);
  }
  function plural(n, one, many) { return n === 1 ? one : (many || one + 's'); }

  var MODES = [
    { key: 'read', pill: 'Read every line', want: 'understand every line of this output' },
    { key: 'coef', pill: 'Coefficients', want: 'read the coefficients and their intervals' },
    { key: 'diag', pill: 'Convergence', want: 'check Rhat, ESS and divergences' },
    { key: 'verdict', pill: 'Can I trust it?', want: 'know whether I can report this fit' }
  ];

  var mode = 'read';
  var lastScen = null;

  // ------------------------------------------------------------- iwant

  function renderIWant() {
    var opts = MODES.map(function (m) {
      return '<option value="' + m.key + '"' + (m.key === mode ? ' selected' : '') + '>' +
             esc(m.want) + '</option>';
    }).join('');
    var cur = MODES.filter(function (m) { return m.key === mode; })[0] || MODES[0];
    $('iwant').innerHTML = 'I want to <span class="psel">' + esc(cur.want) +
      '<span class="pcaret" aria-hidden="true">&#9662;</span>' +
      '<select id="iwantsel" aria-label="What do you want to do">' + opts + '</select></span>';
    $('iwantsel').addEventListener('change', function () { setMode(this.value); });
  }

  function setMode(k) {
    mode = k;
    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-mode') === k);
    });
    renderIWant();
    run();
  }

  // ------------------------------------------------------------- anatomy

  function anatomyView(model) {
    var out = ['<div class="anat">'];
    model.regions.forEach(function (r) {
      var slice = model.lines.slice(r.start, r.end + 1).join('\n').replace(/\s+$/, '');
      if (!slice.trim()) return;
      out.push('<div class="rgn"><div class="rh"><span class="rt">' + esc(r.label) + '</span></div>' +
               '<pre>' + esc(slice) + '</pre>' +
               '<p class="rm">' + r.meaning + '</p></div>');
    });
    out.push('</div>');
    if (model.regions.length < 2) {
      out.push('<p class="note">Only part of this output was recognised, so only the ' +
               'blocks above are labelled. Paste the whole summary for the full anatomy.</p>');
    }
    return out.join('');
  }

  // ------------------------------------------------------------- forest plot

  /* One scale per row, deliberately.
     A shared x-axis is the textbook forest plot, and it is wrong here: an intercept
     of 37 and a slope of -0.03 do not share a scale, so on a common axis every slope
     collapses into an invisible sliver against the intercept and the one thing this
     view exists to show, where the interval sits relative to zero, becomes unreadable.
     Each row therefore gets its own domain, always including zero. The trade is that
     bar widths are no longer comparable BETWEEN rows, which the caption says outright
     rather than letting the picture imply a comparison it cannot support. */
  function forestPlot(coefs, model) {
    var rows = coefs.filter(function (p) {
      return p.estimate != null && p.lower != null && p.upper != null &&
             !isNaN(p.lower) && !isNaN(p.upper);
    });
    if (!rows.length) return '';
    var out = ['<div class="fplot" role="img" aria-label="' + esc(
      'Credible interval for each coefficient. Each row is drawn on its own scale with zero marked. ' +
      rows.map(function (p) {
        return p.name + ': ' + num(p.estimate, 3) + ', interval ' + num(p.lower, 3) +
               ' to ' + num(p.upper, 3) + ', ' +
               (B.excludesZero(p) ? 'excludes zero' : 'includes zero');
      }).join('. ')) + '">'];

    rows.forEach(function (p) {
      var spans = B.excludesZero(p) === false;
      var lo = Math.min(p.lower, 0), hi = Math.max(p.upper, 0);
      var span = hi - lo;
      if (!(span > 0)) span = Math.abs(p.estimate) || 1;
      var pad = span * 0.12;
      lo -= pad; hi += pad;
      function x(v) { return ((v - lo) / (hi - lo)) * 100; }
      var l = x(p.lower), u = x(p.upper), e = x(p.estimate), z = x(0);
      out.push('<div class="fp-row">' +
        '<div class="fp-name" title="' + esc(p.name) + '">' + esc(p.name) + '</div>' +
        '<div class="fp-track">' +
          '<div class="fp-axis"></div>' +
          '<div class="fp-zero" style="left:' + z.toFixed(2) + '%"></div>' +
          '<div class="fp-int' + (spans ? ' spans' : '') + '" style="left:' + l.toFixed(2) +
            '%;width:' + Math.max(0.6, u - l).toFixed(2) + '%"></div>' +
          '<div class="fp-dot' + (spans ? ' spans' : '') + '" style="left:' + e.toFixed(2) + '%"></div>' +
        '</div>' +
        '<div class="fp-val">' + num(p.lower, 3) + ' to ' + num(p.upper, 3) + '</div>' +
        '</div>');
    });
    out.push('<p class="fp-cap">Each bar is that coefficient\'s ' + fmtLevel(model) +
             ' credible interval and the dot is its posterior mean. The red line is zero. ' +
             'Grey bars cross it. <b>Every row is drawn on its own scale</b>, because an ' +
             'intercept and a slope do not share one: read each row against its own zero, ' +
             'and do not compare bar widths between rows.</p>');
    out.push('</div>');
    return out.join('');
  }

  function fmtLevel(model) {
    if (model.ciLevel == null) return 'printed';
    return num(model.ciLevel, 0) + '%';
  }

  // ------------------------------------------------------------- coefficients

  function linkNote(model) {
    var f = (model.family || '').toLowerCase();
    var link = (model.link || '').toLowerCase();
    if (link === 'logit') {
      return 'These coefficients are on the <b>log-odds</b> scale because the link is logit. ' +
             'exp(Estimate) turns one into an odds ratio; exp() of the interval bounds turns ' +
             'the interval into one too, because exponentiating is monotonic.';
    }
    if (link === 'log') {
      return 'These coefficients are on the <b>log</b> scale because the link is log. ' +
             'exp(Estimate) gives a multiplicative effect: a value of 1 means no effect, not 0.';
    }
    if (f.indexOf('gaussian') === 0 && (link === 'identity' || !link)) {
      return 'The link is the identity, so each coefficient is already in the units of your ' +
             'outcome: a one unit rise in the predictor moves the outcome by that many units.';
    }
    return null;
  }

  function coefView(model) {
    var coefs = B.coefficients(model);
    if (!coefs.length) {
      return '<p class="note">No population-level coefficients were found in this paste.</p>';
    }
    var out = [forestPlot(coefs, model)];
    var ln = linkNote(model);
    if (ln) out.push('<p class="note">' + ln + '</p>');

    coefs.forEach(function (p) {
      var ex = B.excludesZero(p);
      var pill = ex === null ? '' :
        (ex ? '<span class="pill on">interval excludes 0</span>'
            : '<span class="pill">interval includes 0</span>');
      var bits = [];
      bits.push('<b>' + num(p.estimate, 3) + '</b> is the posterior ' +
                (model.engine === 'brms' ? 'mean (Estimate)' : 'mean') +
                ': the centre of what the model believes about this coefficient after seeing your data.');
      var sdName = model.engine === 'brms' ? 'Est.Error' : 'sd';
      bits.push('<b>' + num(p.est_error, 3) + '</b> (' + sdName + ') is the posterior <i>standard deviation</i>, ' +
                'which measures how spread out that belief is. It is not a standard error in the ' +
                'frequentist sense, though it plays a similar role.');
      if (p.lower != null && p.upper != null) {
        bits.push('The ' + fmtLevel(model) + ' credible interval runs from <b>' + num(p.lower, 3) +
                  '</b> to <b>' + num(p.upper, 3) + '</b>: given this model, this prior and this data, ' +
                  'there is a ' + fmtLevel(model) + ' probability the coefficient lies in there.');
        if (ex === true) {
          bits.push('It <b>excludes zero</b>. That means zero is not among the values the model finds ' +
                    'credible at this level. It does not mean the effect is proven, and it is not a ' +
                    'p-value: a different prior could move this bound.');
        } else if (ex === false) {
          bits.push('It <b>includes zero</b>, so "no effect" is still credible. That is not the same as ' +
                    'evidence for no effect: an interval this wide may simply mean you do not yet have ' +
                    'the data to tell.');
        }
      }
      if (B.normalApproxOk(p)) {
        var pp = B.probPositive(p);
        var dirP = Math.max(pp, 1 - pp);
        bits.push('Treating this marginal posterior as normal, P(coefficient ' +
                  (pp >= 0.5 ? '&gt;' : '&lt;') + ' 0) is <b>' + fmtProb(dirP) +
                  '</b>. That is an approximation from the printed mean and ' + sdName +
                  ', not a number this output contains: for the exact figure you need the draws.');
      }
      var essTxt = [];
      if (p.bulk_ess != null) essTxt.push('Bulk_ESS ' + num(p.bulk_ess, 0));
      if (p.tail_ess != null) essTxt.push('Tail_ESS ' + num(p.tail_ess, 0));
      if (p.n_eff != null) essTxt.push('n_eff ' + num(p.n_eff, 0));
      var meta = [];
      if (p.rhat != null) meta.push('Rhat ' + num(p.rhat, 3));
      if (essTxt.length) meta.push(essTxt.join(', '));
      out.push('<div class="drow"><div class="dt">' + esc(p.name) + pill + '</div>' +
               (meta.length ? '<div class="dv">' + esc(meta.join('  |  ')) + '</div>' : '') +
               '<div class="dd">' + bits.join(' ') + '</div></div>');
    });

    // sigma / family rows and group-level rows
    var others = model.params.filter(function (p) {
      return p.kind === 'sigma' || p.kind === 'group_sd' || p.kind === 'group_var' || p.kind === 'group_cor';
    });
    others.forEach(function (p) {
      var d;
      if (p.kind === 'sigma') {
        d = '<b>sigma</b> is the residual standard deviation: the spread of your outcome that the ' +
            'predictors do not account for, in the outcome\'s own units. It is a parameter of the ' +
            'response distribution, not an effect, so asking whether its interval excludes zero is ' +
            'meaningless. It cannot be negative.';
      } else if (p.kind === 'group_sd') {
        d = '<b>' + esc(p.name) + '</b> is a group-level standard deviation: how much the ' +
            (p.group ? esc(p.group) + ' ' : '') + 'groups differ from each other. A large value means ' +
            'the groups are genuinely unalike and pooling them would hide that. Like sigma it is ' +
            'bounded at zero, so its interval never excludes zero and never should.';
      } else if (p.kind === 'group_var') {
        d = '<b>' + esc(p.name) + '</b> is a <i>variance</i>, not a standard deviation: rstanarm prints ' +
            'the Sigma matrix on the variance scale. Take the square root to get it into the units of ' +
            'your outcome (here about <b>' + num(Math.sqrt(Math.abs(p.estimate)), 3) + '</b>). ' +
            'Its posterior is strongly right skewed, which is why the mean sits so far above the median.';
      } else {
        d = '<b>' + esc(p.name) + '</b> is a correlation between group-level terms, bounded to [-1, 1].';
      }
      out.push('<div class="drow"><div class="dt">' + esc(p.name) +
               '<span class="pill">not a coefficient</span></div>' +
               '<div class="dv">' + esc((model.engine === 'brms' ? 'Estimate ' : 'mean ') + num(p.estimate, 3) +
                 (p.lower != null ? '  |  ' + fmtLevel(model) + ' CI ' + num(p.lower, 3) + ' to ' + num(p.upper, 3) : '')) +
               '</div><div class="dd">' + d + '</div></div>');
    });

    var offs = model.params.filter(function (p) { return p.kind === 'group_offset'; });
    if (offs.length) {
      out.push('<div class="drow"><div class="dt">b[...] rows<span class="pill">group offsets</span></div>' +
        '<div class="dv">' + offs.length + ' ' + plural(offs.length, 'row') + '</div>' +
        '<div class="dd">Each b[] row is one group\'s departure from the population-level intercept, ' +
        'already shrunk toward it. Add it to the intercept to get that group\'s own value. These are ' +
        'not extra predictors and should not be reported as coefficients.</div></div>');
    }
    return out.join('');
  }

  // ------------------------------------------------------------- diagnostics

  function diagView(model) {
    var d = model.diagnostics || {};
    var rows = model.params.filter(function (p) {
      return p.rhat != null || B.essOf(p) != null;
    });
    var out = [];

    out.push('<div class="dlabel">Per parameter</div>');
    out.push('<div class="dtable"><table><tr><th>Parameter</th><th>Rhat</th>' +
      (model.engine === 'brms' ? '<th>Bulk_ESS</th><th>Tail_ESS</th>' : '<th>n_eff</th>') +
      '</tr>');
    rows.forEach(function (p) {
      var rv = B.rhatVerdict(p.rhat);
      var ev = B.essVerdict(B.essOf(p));
      function cell(v, verdict, dec) {
        var cls = verdict.level === 'bad' ? ' class="bad"' : (verdict.level === 'warn' ? ' class="warn"' : '');
        return '<td' + cls + '>' + (v == null ? '&ndash;' : num(v, dec)) + '</td>';
      }
      out.push('<tr><td class="pn">' + esc(p.name) + '</td>' +
        cell(p.rhat, rv, 3) +
        (model.engine === 'brms'
          ? cell(p.bulk_ess, B.essVerdict(p.bulk_ess), 0) + cell(p.tail_ess, B.essVerdict(p.tail_ess), 0)
          : cell(p.n_eff, ev, 0)) +
        '</tr>');
    });
    out.push('</table></div>');

    // ---- Rhat
    var wr = B.worstRhat(model);
    var rhatOk = !wr || wr.rhat <= B.RHAT_WARN;
    out.push('<div class="drow"><div class="dt">Rhat' +
      (wr ? '<span class="pill' + (rhatOk ? ' on' : ' warn') + '">worst ' + num(wr.rhat, 3) + '</span>' : '') +
      '</div><div class="dd">' +
      'Rhat compares the variance <i>between</i> your chains with the variance <i>within</i> each chain. ' +
      'If every chain wandered over the same territory, those two agree and the ratio sits at 1. ' +
      'If the chains settled in different places, the between-chain variance is larger and Rhat climbs. ' +
      'The modern threshold is <b>1.01</b>: above that, the chains disagree about where the posterior is, ' +
      'and every estimate above is suspect. ' +
      (rhatOk
        ? 'Here the largest is <b>' + (wr ? num(wr.rhat, 3) : 'n/a') + '</b>, so the chains agree.'
        : 'Here <b>' + esc(wr.name) + '</b> reaches <b>' + num(wr.rhat, 3) + '</b>, so they do not.') +
      '</div></div>');
    if (!rhatOk) {
      out.push('<div class="drow"><div class="dt">Fixing a high Rhat</div><div class="dd">' +
        'In rough order of what to try. <b>1. Run longer.</b> Raise <code>iter</code> (and let warmup ' +
        'scale with it); often that alone is enough when the chains are merely slow. ' +
        '<b>2. Tighten the priors.</b> A flat prior on a weakly identified parameter leaves the chains ' +
        'nothing to hold onto; a weakly informative prior gives the geometry a floor. ' +
        '<b>3. Reparameterize.</b> If Rhat stays high no matter how long you run, the model itself is the ' +
        'problem: centre and scale your predictors, or move a hierarchical model to a non-centred ' +
        'parameterization. Length cannot fix a posterior the sampler physically cannot traverse.' +
        '</div></div>');
    }

    // ---- ESS
    var we = B.worstEss(model);
    var essv = we ? B.essVerdict(B.essOf(we)) : { level: 'unknown' };
    out.push('<div class="drow"><div class="dt">Effective sample size' +
      (we ? '<span class="pill' + (essv.level === 'ok' ? ' on' : ' warn') + '">lowest ' + num(B.essOf(we), 0) + '</span>' : '') +
      '</div><div class="dd">' +
      'MCMC draws are autocorrelated: consecutive draws are near neighbours, so ' +
      (model.draws != null ? '<b>' + num(model.draws, 0) + '</b> draws' : 'your draws') +
      ' carry less information than that many independent ones would. ESS is how many independent ' +
      'draws they are <i>worth</i>. The rule of thumb is <b>400</b> or more' +
      (model.engine === 'brms' || model.chains ? ' (roughly 100 per chain)' : '') + '. ' +
      (essv.level === 'ok'
        ? 'The lowest here is <b>' + num(B.essOf(we), 0) + '</b>, which clears it.'
        : 'The lowest here is <b>' + num(B.essOf(we), 0) + '</b> on <b>' + esc(we.name) + '</b>, which does not.') +
      '</div></div>');

    if (model.engine === 'brms') {
      out.push('<div class="drow"><div class="dt">Why there are two of them</div><div class="dd">' +
        '<b>Bulk_ESS</b> covers the middle of the posterior, so it governs whether the mean and median ' +
        'are trustworthy. <b>Tail_ESS</b> covers the extremes, and the extremes are exactly where your ' +
        'interval endpoints live. A fit can have a healthy Bulk_ESS and still report a credible interval ' +
        'you cannot rely on, because the 2.5% and 97.5% points are estimated from the sparse tails. ' +
        'If you quote intervals, Tail_ESS is the one to check.' +
        '</div></div>');
    } else {
      out.push('<div class="drow"><div class="dt">n_eff, and what it does not split out</div><div class="dd">' +
        'rstanarm prints a single <b>n_eff</b>. brms splits the same idea into Bulk_ESS (the middle of ' +
        'the posterior, which drives the mean) and Tail_ESS (the extremes, which drive the interval ' +
        'endpoints). The distinction still applies here even though it is not printed: a fit can pin ' +
        'down the mean while the tails, and so the interval bounds, stay noisy. ' +
        'Reach for <code>bayesplot::mcmc_trace()</code> or run longer if you are quoting intervals.' +
        '</div></div>');
    }

    if (essv.level !== 'ok' && we) {
      out.push('<div class="drow"><div class="dt">Fixing a low ESS</div><div class="dd">' +
        'ESS scales with the number of draws, so <b>more iterations</b> is the direct fix and usually ' +
        'the right one: doubling <code>iter</code> roughly doubles ESS. More chains help too, and cost ' +
        'nothing on a multicore machine. But if ESS is low because the sampler is fighting the geometry ' +
        '(you will normally see divergences or a high Rhat alongside), more draws just buys more bad ' +
        'draws slowly: fix the parameterization first.' +
        '</div></div>');
    }

    // ---- divergences
    if (d.divergences != null && d.divergences > 0) {
      var nd = d.divergences;
      out.push('<div class="drow"><div class="dt">Divergent transitions' +
        '<span class="pill warn">' + nd + '</span></div><div class="dd">' +
        'Your paste reports <b>' + nd + ' divergent ' + plural(nd, 'transition') + ' after warmup</b>. ' +
        'A divergence means the sampler\'s simulated trajectory blew up, usually where the posterior ' +
        'has a region of sharp curvature the step size is too coarse to follow. This matters more than ' +
        'it sounds: the sampler is not just slow there, it is <b>systematically failing to visit</b> ' +
        'that region, so your draws are biased and no amount of extra iterations fixes it. ' +
        'Even a handful is worth taking seriously.' +
        '</div></div>');
      var next = B.adaptDeltaLadder(null);
      out.push('<div class="drow"><div class="dt">The adapt_delta ladder</div><div class="dd">' +
        '<code>adapt_delta</code> is the target acceptance rate: raising it forces a smaller step size, ' +
        'so the sampler can negotiate tighter curvature. The default is 0.8. Climb it: ' +
        '<b>0.9</b>, then <b>0.95</b>, then <b>0.99</b>' +
        (model.engine === 'brms'
          ? ', as <code>control = list(adapt_delta = ' + next + ')</code>.'
          : ', as <code>adapt_delta = ' + next + '</code>.') +
        ' Each rung costs sampling speed. ' +
        '<b>The escape hatch:</b> if divergences survive 0.99, stop climbing. The ladder buys you a finer ' +
        'step, and at some point the answer is that the geometry itself is wrong: reparameterize. ' +
        'For hierarchical models that usually means the non-centred form, ' +
        'and for anything else it means scaling your predictors and giving weakly informative priors ' +
        'something to grip.' +
        '</div></div>');
    } else if (d.mentioned) {
      out.push('<div class="drow"><div class="dt">Divergent transitions<span class="pill on">none reported</span></div>' +
        '<div class="dd">The warnings in your paste do not mention divergent transitions, so there were ' +
        'probably none. If you only pasted the summary and not the warnings underneath it, this page ' +
        'cannot know either way: divergences are reported by the sampler, not by summary().</div></div>');
    } else {
      out.push('<div class="drow"><div class="dt">Divergent transitions<span class="pill">not in this paste</span></div>' +
        '<div class="dd">A <code>summary()</code> does not print divergences: Stan reports them as ' +
        'warnings when the model runs. Nothing here says whether there were any. If you still have the ' +
        'fit, run <code>rstan::check_hmc_diagnostics(fit$stanfit)</code>' +
        (model.engine === 'brms' ? ' or <code>brms::nuts_params(fit)</code>' : '') +
        ', or paste the warnings in along with the summary and they will be read.</div></div>');
    }

    if (d.bfmi) {
      out.push('<div class="drow"><div class="dt">Low BFMI<span class="pill warn">reported</span></div>' +
        '<div class="dd">A low Bayesian Fraction of Missing Information means the sampler struggled to ' +
        'move through the energy distribution, which typically points at a badly scaled or funnel-shaped ' +
        'posterior. The fix is the same as the divergence escape hatch: reparameterize, and scale your ' +
        'predictors so they are on comparable ranges.</div></div>');
    }
    if (d.treedepth != null && d.treedepth > 0) {
      out.push('<div class="drow"><div class="dt">Maximum treedepth<span class="pill">' + d.treedepth + '</span></div>' +
        '<div class="dd">Transitions hitting the treedepth cap is an <i>efficiency</i> problem rather than ' +
        'a correctness one: the sampler ran out of allowed steps before it wanted to stop. Raise ' +
        '<code>max_treedepth</code> if you need the speed. Unlike divergences, this does not bias your draws.' +
        '</div></div>');
    }
    return out.join('');
  }

  // ------------------------------------------------------------- verdict view

  function verdictView(model) {
    var v = B.fitVerdict(model);
    var coefs = B.coefficients(model);
    var out = [];

    out.push('<div class="drow"><div class="dt">The paragraph</div><div class="dd">' +
      'Written for a report. Check it reads true before you use it.</div></div>');
    out.push('<div class="vpara" id="vpara">' + verdictParagraph(model, v) + '</div>');
    out.push('<div class="copyrow"><span class="report" id="report2"></span>' +
             '<button class="copy" id="copypara">Copy paragraph</button></div>');

    out.push('<div class="drow"><div class="dt">What to do next</div><div class="dd"><ol class="nx">' +
      nextSteps(model, v).map(function (s) { return '<li>' + s + '</li>'; }).join('') +
      '</ol></div></div>');

    if (coefs.length) {
      var matter = coefs.filter(function (p) { return B.excludesZero(p) === true; });
      var dont = coefs.filter(function (p) { return B.excludesZero(p) === false; });
      out.push('<div class="drow"><div class="dt">Which coefficients carry weight</div><div class="dd">' +
        (matter.length
          ? 'At the ' + fmtLevel(model) + ' level printed here, ' +
            listNames(matter) + ' ' + (matter.length === 1 ? 'has an interval that excludes' : 'have intervals that exclude') +
            ' zero. '
          : 'None of these coefficients has an interval that excludes zero at the ' + fmtLevel(model) + ' level. ') +
        (dont.length
          ? listNames(dont) + ' ' + (dont.length === 1 ? 'spans' : 'span') + ' zero, so "no effect" stays credible for ' +
            (dont.length === 1 ? 'it' : 'them') + '. '
          : '') +
        'Ranking coefficients by whether they cross zero is a habit imported from significance testing, ' +
        'and it throws away most of what you have: the interval width tells you how much you know, and ' +
        'the estimate tells you whether the effect is big enough to care about. A coefficient can clear ' +
        'zero and still be too small to matter.' +
        '</div></div>');
    }
    return out.join('');
  }

  function listNames(ps) {
    var n = ps.map(function (p) { return '<b>' + esc(p.name) + '</b>'; });
    if (n.length === 1) return n[0];
    if (n.length === 2) return n[0] + ' and ' + n[1];
    return n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1];
  }

  function verdictParagraph(model, v) {
    var bits = [];
    var what = model.engine === 'brms'
      ? 'a brms model' + (model.family ? ' (' + esc(model.family.trim()) + ')' : '')
      : 'an rstanarm ' + esc(model.stanFunction || 'model') + (model.family ? ' (' + esc(model.family) + ')' : '');
    bits.push('This is ' + what +
      (model.formula ? ', <code>' + esc(model.formula) + '</code>' : '') +
      (model.nobs != null ? ', fitted to ' + num(model.nobs, 0) + ' observations' : '') +
      (model.draws != null ? ' with ' + num(model.draws, 0) + ' post-warmup draws' : '') + '.');

    if (v.level === 'ok') {
      bits.push('<b>The sampler behaved.</b> ' +
        (v.worstRhat ? 'The largest Rhat is ' + num(v.worstRhat.rhat, 3) + ', at or under the 1.01 threshold, so the chains agree with each other. ' : '') +
        (v.worstEss ? 'The smallest effective sample size is ' + num(B.essOf(v.worstEss), 0) + ', clearing the 400 rule of thumb. ' : '') +
        'On the evidence in this output there is no reason to distrust the numbers.');
    } else {
      bits.push('<b>' + (v.level === 'bad' ? 'Do not report this fit as it stands.' : 'Treat this fit with caution.') +
        '</b> ' + v.reasons.map(function (r) { return esc(r).replace(/&lt;b&gt;/g, '<b>'); }).join(' '));
    }

    var coefs = B.coefficients(model);
    var matter = coefs.filter(function (p) { return B.excludesZero(p) === true; });
    if (coefs.length) {
      if (v.level === 'bad') {
        bits.push('Because the sampler did not converge, the coefficients below are not worth ' +
          'interpreting yet: they describe the chains, not the posterior.');
      } else if (matter.length) {
        bits.push('Of the ' + coefs.length + ' population-level ' + plural(coefs.length, 'coefficient') +
          ', ' + matter.map(function (p) {
            return '<b>' + esc(p.name) + '</b> (' + num(p.estimate, 3) + ', ' + fmtLevel(model) +
                   ' CrI ' + num(p.lower, 3) + ' to ' + num(p.upper, 3) + ')';
          }).join(', ') + ' ' + (matter.length === 1 ? 'has a credible interval that excludes' : 'have credible intervals that exclude') +
          ' zero.');
      } else {
        bits.push('None of the ' + coefs.length + ' population-level ' + plural(coefs.length, 'coefficient') +
          ' has a credible interval that excludes zero at the ' + fmtLevel(model) + ' level.');
      }
    }
    if (model.ciLevel === 80) {
      bits.push('Note that the interval printed here is the <b>80%</b> interval (the 10% and 90% ' +
        'quantiles), which is rstanarm\'s default and is narrower than the 95% interval most readers ' +
        'will assume. Say which level you are quoting, or ask for the 95% one explicitly.');
    }
    return bits.map(function (b) { return '<p>' + b + '</p>'; }).join('');
  }

  function nextSteps(model, v) {
    var s = [];
    var d = model.diagnostics || {};
    if (d.divergences != null && d.divergences > 0) {
      s.push('Deal with the ' + d.divergences + ' ' + plural(d.divergences, 'divergence') +
        ' first, since they bias the draws: refit with <code>adapt_delta = ' +
        B.adaptDeltaLadder(null) + '</code>, and if they persist at 0.99, reparameterize instead of climbing further.');
    }
    if (v.worstRhat && v.worstRhat.rhat > B.RHAT_WARN) {
      s.push('Get every Rhat to 1.01 or below before you read a single coefficient. Start by raising ' +
        '<code>iter</code>; if that does not shift it, the model needs tighter priors or a different parameterization.');
    }
    if (v.worstEss && B.essOf(v.worstEss) < B.ESS_WARN) {
      s.push('Raise the effective sample size above 400, normally just by raising <code>iter</code>.');
    }
    if (v.level === 'ok') {
      s.push('Check the model actually fits the data, which convergence does not tell you: ' +
        '<code>pp_check(fit)</code> compares draws from the model against your real outcome.');
      s.push('Get the interval you actually mean to quote: ' + (model.engine === 'brms'
        ? '<code>posterior_summary(fit)</code> or <code>summary(fit, prob = 0.95)</code>.'
        : '<code>posterior_interval(fit, prob = 0.95)</code>, since the printed one is the ' + fmtLevel(model) + ' interval.'));
      s.push('Compare it against a rival model with <code>loo(fit)</code>, which needs the draws and so ' +
        'cannot be computed from a paste.');
    } else {
      s.push('Once it converges, come back and re-read the coefficients: nothing above is safe until then.');
    }
    return s;
  }

  // ------------------------------------------------------------- R code

  function rCode(model) {
    if (lastScen && P.presets[lastScen]) {
      var pre = P.presets[lastScen];
      var head = '# ' + pre.label + '\n' + pre.r + '\n';
      return head + '\n' + rFollowUp(model);
    }
    var lines = [];
    lines.push('# Your fit is already in memory as `fit`.');
    lines.push(model.engine === 'brms' ? 'library(brms)' : 'library(rstanarm)');
    lines.push('');
    return lines.join('\n') + rFollowUp(model);
  }

  function rFollowUp(model) {
    var L = [];
    if (model.engine === 'brms') {
      L.push('# Every number the summary printed, as data you can index:');
      L.push('posterior_summary(fit)');
      L.push('');
      L.push('# Rhat and both ESS columns on their own:');
      L.push('summary(fit)$fixed[, c("Rhat", "Bulk_ESS", "Tail_ESS")]');
      L.push('');
      L.push('# The interval at the level you actually want to quote:');
      L.push('posterior_interval(fit, prob = 0.95)');
      L.push('');
      L.push('# Divergences and treedepth, which summary() does not print:');
      L.push('rstan::check_hmc_diagnostics(fit$fit)');
      L.push('');
      L.push('# Does the model reproduce your data? Convergence does not answer this.');
      L.push('pp_check(fit)');
    } else {
      L.push('# Every number the summary printed, as a plain matrix you can index:');
      L.push('as.matrix(summary(fit))');
      L.push('');
      L.push('# Rhat and n_eff on their own:');
      L.push('summary(fit)[, c("Rhat", "n_eff")]');
      L.push('');
      L.push('# The printed interval is the ' + fmtLevel(model) + ' one. For the 95%:');
      L.push('posterior_interval(fit, prob = 0.95)');
      L.push('');
      L.push('# ... or reprint the whole summary at 95%:');
      L.push('print(summary(fit, probs = c(0.025, 0.5, 0.975)), digits = 3)');
      L.push('');
      L.push('# Divergences and treedepth, which summary() does not print:');
      L.push('rstan::check_hmc_diagnostics(fit$stanfit)');
      L.push('');
      L.push('# Does the model reproduce your data? Convergence does not answer this.');
      L.push('pp_check(fit)');
    }
    var d = model.diagnostics || {};
    if (d.divergences != null && d.divergences > 0) {
      L.push('');
      L.push('# ' + d.divergences + ' divergent ' + plural(d.divergences, 'transition') + ': climb the ladder.');
      L.push(model.engine === 'brms'
        ? '# fit2 <- update(fit, control = list(adapt_delta = 0.95))'
        : '# fit2 <- update(fit, adapt_delta = 0.95)');
    }
    return L.join('\n');
  }

  // ------------------------------------------------------------- verdict head

  function headline(model, v) {
    if (v.level === 'bad') {
      return { chip: 'Do not report this', head: 'This fit did not converge',
               sub: 'The sampler failed, so the estimates below describe the chains rather than the posterior.' };
    }
    if (v.level === 'warn') {
      return { chip: 'Read with care', head: 'This fit is borderline',
               sub: 'It sampled, but not cleanly enough to report without a second look.' };
    }
    return { chip: 'Looks trustworthy', head: 'This fit looks safe to report',
             sub: 'Rhat and the effective sample sizes are where they should be.' };
  }

  function reportLine(model, v) {
    var bits = [];
    bits.push((model.engine === 'brms' ? 'brms' : (model.stanFunction || 'rstanarm')));
    if (model.nobs != null) bits.push('n = ' + num(model.nobs, 0));
    if (model.draws != null) bits.push(num(model.draws, 0) + ' draws');
    if (v.worstRhat) bits.push('max Rhat = ' + num(v.worstRhat.rhat, 3));
    if (v.worstEss) bits.push('min ESS = ' + num(B.essOf(v.worstEss), 0));
    var d = model.diagnostics || {};
    if (d.divergences != null) bits.push(d.divergences + ' divergences');
    bits.push(v.level === 'ok' ? 'converged' : (v.level === 'warn' ? 'borderline' : 'DID NOT CONVERGE'));
    return bits.join('; ');
  }

  // ------------------------------------------------------------- run

  function run() {
    var txt = $('paste').value;
    var err = $('ierr');
    var res = B.parse(txt);

    if (!res.ok) {
      var msg = esc(res.error);
      var links = {
        lm: ['lm() Output Interpreter', '/tools/lm-output-interpreter.html'],
        glm: ['glm() Output Interpreter', '/tools/glm-output-interpreter.html'],
        lmer: ['lmer() Output Interpreter', '/tools/lmer-output-interpreter.html'],
        coxph: ['coxph() Output Interpreter', '/tools/coxph-output-interpreter.html']
      };
      if (res.hint && links[res.hint]) {
        msg = msg.replace(links[res.hint][0],
          '<a href="' + links[res.hint][1] + '">' + links[res.hint][0] + '</a>');
      }
      err.innerHTML = msg;
      err.classList.add('show');
      $('vchip').textContent = 'Could not read that';
      $('vhead').textContent = 'That is not an rstanarm or brms summary';
      $('vsub').textContent = 'Fix the paste and the reading appears here straight away.';
      ['statgrid', 'plain', 'inference-line', 'copyrow'].forEach(function (i) { $(i).hidden = true; });
      $('body').innerHTML = '';
      $('rcodepre').textContent = '# Waiting for a readable summary.';
      return;
    }
    err.classList.remove('show');

    var model = res.model;
    var v = B.fitVerdict(model);
    var h = headline(model, v);

    $('vchip').textContent = h.chip;
    $('vchip').className = 'vchip' + (v.level === 'ok' ? '' : ' bad');
    $('vhead').textContent = h.head;
    $('vsub').textContent = h.sub;

    // stat grid
    var coefs = B.coefficients(model);
    var wr = v.worstRhat, we = v.worstEss;
    $('k1').textContent = model.engine === 'brms' ? 'Package' : 'Fitted with';
    $('v1').innerHTML = '<span class="sm">' + esc(model.engine === 'brms' ? 'brms' : (model.stanFunction || 'rstanarm')) + '</span>';
    $('k2').textContent = 'Interval printed';
    $('v2').innerHTML = '<span class="sm">' + (model.ciLevel != null ? num(model.ciLevel, 0) + '%' : 'n/a') + '</span>';
    $('k3').textContent = 'Worst Rhat';
    $('v3').textContent = wr ? num(wr.rhat, 3) : 'n/a';
    $('v3').className = 'v' + (wr && wr.rhat > B.RHAT_WARN ? ' bad' : ' acc');
    $('k4').textContent = 'Lowest ESS';
    $('v4').textContent = we ? num(B.essOf(we), 0) : 'n/a';
    $('v4').className = 'v' + (we && B.essOf(we) < B.ESS_WARN ? ' bad' : ' acc');
    $('statgrid').hidden = false;

    // body
    var html = '';
    if (mode === 'read') html = anatomyView(model);
    else if (mode === 'coef') html = coefView(model);
    else if (mode === 'diag') html = diagView(model);
    else html = verdictView(model);
    $('body').innerHTML = html;

    // plain english + inference line
    var plainTxt;
    if (v.level === 'ok') {
      plainTxt = 'The chains agree with each other and there are enough effective draws, so the ' +
        'numbers in this output mean what they say. ' +
        (coefs.length ? 'Read the coefficients on the ' + (model.link === 'logit' ? 'log-odds' : (model.link === 'log' ? 'log' : 'outcome\'s own')) +
          ' scale, and quote the interval level you are actually using.' : '');
    } else {
      plainTxt = 'Stop at the diagnostics. ' + esc(v.reasons[0] || '') +
        ' Until that is fixed, the estimates describe the sampler\'s failure rather than your data.';
    }
    $('plain').innerHTML = plainTxt;
    $('plain').hidden = false;

    var infl;
    if (v.level === 'bad') {
      infl = 'Since ' + (wr && wr.rhat > B.RHAT_BAD ? 'Rhat reaches ' + num(wr.rhat, 3) + ' &gt; 1.01'
        : ((model.diagnostics.divergences || 0) > 0 ? 'the sampler diverged ' + model.diagnostics.divergences + ' times' : 'the diagnostics failed')) +
        ', <b>this fit must not be reported</b>: refit it before interpreting anything.';
    } else if (v.level === 'warn') {
      infl = 'Since ' + esc(v.reasons[0] || 'a diagnostic is borderline') +
        ' <b>treat these estimates as provisional</b> and rerun for longer before quoting them.';
    } else {
      var m2 = coefs.filter(function (p) { return B.excludesZero(p) === true; });
      infl = 'Since every Rhat is at or below 1.01 and the lowest ESS is ' + (we ? num(B.essOf(we), 0) : 'n/a') +
        ', <b>the sampling is sound</b>' +
        (m2.length ? ', and ' + listNames(m2) + ' ' + (m2.length === 1 ? 'has a ' : 'have ') +
          fmtLevel(model) + ' credible ' + plural(m2.length, 'interval') + ' clear of zero.'
          : ', though no coefficient has an interval clear of zero at ' + fmtLevel(model) + '.');
    }
    $('inference-line').innerHTML = '<span class="ik">What this says</span>' + infl;
    $('inference-line').hidden = false;

    var rep = reportLine(model, v);
    $('report').textContent = rep;
    $('copyrow').hidden = false;
    if ($('report2')) $('report2').textContent = rep;
    if ($('copypara')) {
      $('copypara').addEventListener('click', function () {
        var t = $('vpara') ? $('vpara').innerText : rep;
        copyText(t, $('copypara'), 'paragraph');
      });
    }

    // how-computed
    $('h2c').innerHTML = 'Your paste was recognised as <b>' + (model.engine === 'brms' ? 'brms' : 'rstanarm') +
      '</b> output. Column order is read off each header row by position, then every data row is split ' +
      'by peeling numbers off the right, which is what keeps a name like <code>b[(Intercept) cyl:4]</code> intact.' +
      (model.engine === 'rstanarm' ? ' rstanarm prints estimates and diagnostics as two separate tables, so they are joined back together by parameter name.' : '');
    $('h3c').innerHTML = 'The interval shown is the <b>' + fmtLevel(model) + '</b> one, taken from ' +
      (model.engine === 'brms' ? 'the l- and u- CI columns' : 'the ' + num(model.ciFrom, 0) + '% and ' + num(model.ciTo, 0) + '% quantile columns') +
      ' exactly as printed. Nothing is recomputed: this page rounds nothing and invents nothing, it reads.';

    $('rcodepre').textContent = rCode(model);
    if (window.hljsRHighlight) { try { window.hljsRHighlight($('rcodepre')); } catch (e) {} }
  }

  function copyText(t, btn, what) {
    navigator.clipboard.writeText(t).then(function () {
      var o = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = o; }, 1400);
    }, function () {});
    if (window.__toolCopy) window.__toolCopy(what || 'result');
  }

  // ------------------------------------------------------------- boot

  function boot() {
    renderIWant();

    // scenario chips, built from the generated preset file so the page and the
    // presets can never drift apart
    var scen = $('scenchips');
    if (scen) {
      scen.innerHTML = P.order.map(function (k) {
        var p = P.presets[k];
        return '<button class="chip" data-scen="' + esc(k) + '" title="' + esc(p.blurb) + '">' +
               esc(p.label) + '</button>';
      }).join('');
    }

    Array.prototype.forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.addEventListener('click', function () { setMode(b.getAttribute('data-mode')); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.chip'), function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-scen');
        if (!P.presets[k]) return;
        lastScen = k;
        $('paste').value = P.presets[k].text;
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
      copyText($('report').textContent, $('copybtn'), 'verdict');
    });
    $('rcopy').addEventListener('click', function () {
      copyText($('rcodepre').textContent, $('rcopy'), 'rcode');
    });

    /* Version and provenance line, straight from the generated presets so it cannot
       drift from what actually shipped. It names the brms exception explicitly:
       that preset was not fitted here and the page should not imply it was. */
    var vl = $('verline');
    if (vl && P.meta) {
      var rst = P.presets ? Object.keys(P.presets).filter(function (k) {
        return P.presets[k].engine === 'rstanarm';
      }).length : 0;
      vl.innerHTML = 'The ' + rst + ' rstanarm examples are real console output from models fitted on ' +
        esc(P.meta.r_version) + ' with rstanarm ' + esc(P.meta.rstanarm_version) + ' and rstan ' +
        esc(P.meta.rstan_version) + ', captured with <code>print(summary(fit), digits = ' +
        esc(P.meta.print_digits) + ')</code>. The brms example is quoted verbatim from the official ' +
        'brms documentation at <a href="' + esc(P.meta.brms_source_url) + '">' +
        esc(String(P.meta.brms_source_url).replace(/^https?:\/\//, '').replace(/\/$/, '')) +
        '</a>, because brms compiles each model with a C++ toolchain this build machine does not have.';
    }

    // never an empty tool on first paint
    lastScen = 'gauss';
    $('paste').value = P.presets.gauss ? P.presets.gauss.text : '';
    run();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
