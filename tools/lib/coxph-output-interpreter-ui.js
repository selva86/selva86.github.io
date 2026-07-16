/* coxph-output-interpreter-ui.js - UI for tools/coxph-output-interpreter.html
   All numbers come from CoxMath (verified against R 4.6.0 survival, see
   Scripts/tool-truth/test-coxph-output-interpreter-math.js). Nothing is
   computed here; this file only renders. */
(function () {
  'use strict';

  var CM = window.CoxMath, PRE = window.CoxPresets;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var MODES = {
    anatomy: 'understand what every block of this output is',
    hazard:  'read the hazard ratios in plain English',
    fit:     'judge how well the model fits',
    ph:      'check the proportional hazards assumption'
  };

  var state = { mode: 'anatomy', text: '' };

  // ---------------------------------------------------------------- number formatting
  function fmtP(p, censored) {
    if (p === null || p === undefined || isNaN(p)) return 'NA';
    if (censored) return '< ' + p;
    if (p < 1e-4) return p.toExponential(2).replace('e-', ' x 10^-').replace('e+', ' x 10^');
    if (p < 0.001) return p.toExponential(2);
    return (Math.round(p * 100000) / 100000).toString();
  }
  function fmtPShort(p) {
    if (p === null || isNaN(p)) return 'NA';
    if (p < 1e-15) return p.toExponential(1);
    if (p < 1e-4) return p.toExponential(2);
    return String(Math.round(p * 10000) / 10000);
  }
  function num(x, d) {
    if (x === null || x === undefined || isNaN(x)) return 'NA';
    return Number(x).toFixed(d === undefined ? 3 : d);
  }

  // ---------------------------------------------------------------- boot
  function init() {
    // mode pills + the banner select stay in lockstep
    [].forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.addEventListener('click', function () { setMode(b.dataset.mode); });
    });
    $('psel').addEventListener('change', function () { setMode(this.value); });

    [].forEach.call(document.querySelectorAll('.chip'), function (b) {
      b.addEventListener('click', function () {
        var p = PRE[b.dataset.scen];
        if (!p) return;
        $('paste').value = p.text;
        render();
        $('paste').scrollTop = 0;
      });
    });

    $('paste').addEventListener('input', function () { gaOnce(); render(); });
    $('clearbtn').addEventListener('click', function () {
      $('paste').value = ''; render(); $('paste').focus();
    });
    $('copybtn').addEventListener('click', function () { copy($('report').textContent, this, 'Copy verdict'); });
    $('rcopy').addEventListener('click', function () { copy($('rcodepre').textContent, this, 'Copy code'); });

    setMode('anatomy');
    // start with a real model on screen: an empty tool teaches nothing
    $('paste').value = PRE.sex.text;
    render();
  }

  var gaFired = false;
  function gaOnce() {
    if (gaFired) return;
    gaFired = true;
    if (typeof gtag === 'function') gtag('event', 'tool_use', { tool: 'coxph-output-interpreter' });
  }
  function copy(txt, btn, label) {
    navigator.clipboard.writeText(txt).then(function () {
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = label; }, 1400);
      if (typeof gtag === 'function') gtag('event', 'tool_copy', { tool: 'coxph-output-interpreter' });
    });
  }

  function setMode(m) {
    state.mode = m;
    [].forEach.call(document.querySelectorAll('.mode'), function (b) {
      b.classList.toggle('on', b.dataset.mode === m);
    });
    $('psel').value = m;
    render();
  }

  // ---------------------------------------------------------------- render
  function render() {
    var text = $('paste').value;
    state.text = text;
    var parsed = CM.parseSummary(text);

    if (!parsed.ok) {
      showError(parsed);
      return;
    }
    $('ierr').classList.remove('show');
    $('ierr').textContent = '';

    var a = CM.analyze(parsed);
    ['statgrid', 'plain', 'inference-line', 'copyrow', 'how'].forEach(function (id) {
      var el = $(id); if (el) el.hidden = false;
    });
    $('how').hidden = false;

    header(a);
    stats(a);
    $('body').innerHTML = view(a);
    plain(a);
    inference(a);
    report(a);
    steps(a);
    rcode(a);
    warnings(a);
  }

  function showError(parsed) {
    var e = $('ierr');
    e.innerHTML = '<b>' + esc(parsed.error) + '</b>' + (parsed.hint ? '<br>' + esc(parsed.hint) : '');
    e.classList.add('show');
    $('vchip').textContent = 'Waiting for a coxph summary';
    $('vhead').textContent = 'Paste the output of summary(model)';
    $('vsub').textContent = 'Or load one of the three real model summaries above.';
    ['statgrid', 'plain', 'inference-line', 'copyrow'].forEach(function (id) {
      var el = $(id); if (el) el.hidden = true;
    });
    $('body').innerHTML = '';
    $('warn').hidden = true;
  }

  function warnings(a) {
    var w = a.parsed.warnings || [];
    var el = $('warn');
    if (!w.length) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '<b>Read from your paste, with a caveat:</b><ul>' +
      w.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
  }

  // ---- headline ---------------------------------------------------------
  function header(a) {
    var p = a.parsed;
    var sig = a.terms.filter(function (t) { return t.read.significant; });
    var lvl = Math.round(a.level * 100);

    $('vchip').textContent = p.terms.length + (p.terms.length === 1 ? ' covariate' : ' covariates') +
      ' | ' + p.events + ' events | ' + lvl + '% intervals' + (p.robust ? ' | robust SE' : '');

    if (state.mode === 'ph') {
      $('vhead').textContent = 'This output cannot tell you whether PH holds';
      $('vsub').textContent = 'Every hazard ratio above assumes one constant ratio for the whole follow-up. Nothing printed here tests that. The check is cox.zph(model), and it needs the model object.';
      return;
    }
    if (state.mode === 'fit') {
      var c = a.conc;
      $('vhead').textContent = c ? 'Concordance ' + num(c.c, 3) + ': ' + c.band : 'No concordance line found';
      $('vsub').textContent = c ? c.plain : 'The Concordance= line was not in the paste.';
      return;
    }
    if (state.mode === 'anatomy') {
      $('vhead').textContent = 'A Cox model on ' + p.n + ' subjects, ' + p.events + ' of whom had the event';
      $('vsub').textContent = 'The ' + (p.n - p.events) + ' others were censored: they left the study, or the study ended, without the event happening. ' +
        (p.nmiss ? p.nmiss + ' more rows were dropped for missing values before any of this was fitted. ' : '') +
        'Every block below is labelled.';
      return;
    }
    // hazard mode
    if (sig.length === 0) {
      $('vhead').textContent = 'No covariate has an interval clear of 1';
      $('vsub').textContent = 'Every confidence interval below includes a hazard ratio of 1, which is the value that means "no effect on the hazard".';
    } else {
      var names = sig.map(function (t) { return t.raw.name; });
      $('vhead').textContent = (sig.length === 1 ? names[0] + ' is' : names.slice(0, 3).join(', ') + (names.length > 3 ? ' and others are' : ' are')) +
        ' clear of a hazard ratio of 1';
      $('vsub').textContent = sig.length + ' of ' + a.terms.length + ' covariates have a ' + lvl +
        '% interval that does not include 1. The rest are consistent with no effect.';
    }
  }

  function stats(a) {
    var p = a.parsed;
    var strongest = null;
    a.terms.forEach(function (t) {
      if (!strongest || Math.abs(Math.log(t.read.hr)) > Math.abs(Math.log(strongest.read.hr))) strongest = t;
    });
    $('k1').textContent = 'Events';
    $('v1').textContent = p.events + ' / ' + p.n;
    $('k2').textContent = 'Concordance';
    $('v2').textContent = a.conc ? num(a.conc.c, 3) : 'NA';
    $('k3').textContent = 'Largest HR';
    $('v3').textContent = strongest ? CM.fmtHR(strongest.read.hr) : 'NA';
    $('k4').textContent = 'Events per covariate';
    $('v4').textContent = a.epv ? Math.round(a.epv * 10) / 10 : 'NA';
  }

  // ---- the visual bar: HR on a log scale, 1 in the middle ----------------
  function hrBar(a) {
    var terms = a.terms;
    var los = terms.map(function (t) { return t.read.lower; });
    var his = terms.map(function (t) { return t.read.upper; });
    var lo = Math.min.apply(null, los.concat([0.5]));
    var hi = Math.max.apply(null, his.concat([2]));
    // pad the log range a little
    var L = Math.log(lo) * 1.12, H = Math.log(hi) * 1.12;
    var span = H - L;
    var pos = function (x) { return ((Math.log(x) - L) / span) * 100; };

    var rows = terms.map(function (t) {
      var r = t.read;
      var l = pos(r.lower), u = pos(r.upper), c = pos(r.hr);
      var cls = r.crossesOne ? ' rm' : '';
      return '<div class="fr">' +
        '<div class="fn" title="' + esc(t.raw.name) + '">' + esc(t.raw.name) + '</div>' +
        '<div class="ft">' +
          '<div class="fline' + cls + '" style="left:' + l.toFixed(2) + '%;width:' + Math.max(u - l, 0.4).toFixed(2) + '%"></div>' +
          '<div class="fdot' + cls + '" style="left:' + c.toFixed(2) + '%"></div>' +
        '</div>' +
        '<div class="fv">' + CM.fmtHR(r.hr) + '</div>' +
      '</div>';
    }).join('');

    var onePos = pos(1);
    var ticks = [];
    [0.25, 0.5, 1, 2, 4, 8].forEach(function (v) {
      if (v > lo * 0.95 && v < hi * 1.05) ticks.push('<span class="fk" style="left:' + pos(v).toFixed(2) + '%">' + v + '</span>');
    });

    return '<div class="forest" role="img" aria-label="Hazard ratios with ' +
      Math.round(a.level * 100) + ' percent confidence intervals, on a log scale, with the no-effect line at 1">' +
      '<div class="fbody"><div class="fone" style="left:' + onePos.toFixed(2) + '%"></div>' + rows + '</div>' +
      '<div class="fax">' + ticks.join('') + '</div>' +
      '<p class="cap">Hazard ratio, log scale. The vertical line is 1: no effect. A bar touching it is a covariate the data cannot separate from nothing. Grey bars cross 1.</p>' +
      '</div>';
  }

  // ---- mode views -------------------------------------------------------
  function view(a) {
    if (state.mode === 'anatomy') return anatomyView(a);
    if (state.mode === 'hazard') return hazardView(a);
    if (state.mode === 'fit') return fitView(a);
    return phView(a);
  }

  // Label each region of the pasted text and say what it is in one sentence.
  function anatomyView(a) {
    var p = a.parsed;
    var lines = state.text.replace(/\r\n?/g, '\n').split('\n');
    var R = p.regions;
    var labels = [
      ['call', 'The Call', 'The formula you fitted, echoed back. Surv(time, status) is the outcome: how long each subject was watched, and whether the event actually happened. Check this line first, because a model of the wrong thing looks exactly like a model of the right thing.'],
      ['header', 'Counts', 'n is subjects, number of events is how many reached the event. The gap is censoring. The event count, not n, is what your standard errors are really made of.'],
      ['coeftable', 'The coefficients', 'One row per covariate. coef is on the log-hazard scale, exp(coef) is the same thing as a hazard ratio, se(coef) is its standard error, z is coef/se, and Pr(>|z|) is the Wald p-value.'],
      ['citable', 'Hazard ratios with intervals', 'The same exp(coef) again, then its reciprocal, then the confidence interval. This is the block to read and report. exp(-coef) is just the effect stated in the other direction.'],
      ['concordance', 'Concordance', 'The share of orderable patient pairs the model ranks correctly. 0.5 is a coin flip. This is the closest thing a Cox model has to an accuracy score.'],
      ['tests', 'The three global tests', 'All three ask one question: is this model better than a model with no covariates at all? They are asymptotically equivalent, which is why they usually agree.']
    ];

    var out = '<div class="anat">';
    labels.forEach(function (l) {
      var rg = R[l[0]];
      if (!rg) return;
      var seg = lines.slice(rg[0], rg[1] + 1).join('\n');
      if (!seg.trim()) return;
      out += '<div class="rgn"><div class="rh">' + esc(l[1]) + '</div>' +
             '<pre class="rt">' + esc(seg) + '</pre>' +
             '<p class="rm">' + esc(l[2]) + '</p></div>';
    });
    out += '</div>';

    if (p.robust) {
      out += '<p class="note"><b>This fit used a robust variance.</b> There is an extra <code>robust se</code> column, and it is that column, not <code>se(coef)</code>, that produced the z values and the confidence intervals. R keeps the naive se in the output for comparison, and the gap between the two columns tells you how much the clustering mattered.</p>';
    }
    return out;
  }

  // Numbers in the table are shown exactly as R printed them. Re-rounding them
  // would be double rounding: R prints a CI bound of 0.9595, and rounding THAT
  // to three places gives 0.960 while the underlying 0.95948 gives 0.959. It
  // would also make the table disagree with the console the reader pasted from,
  // which is the one thing they can check by eye. Prose keeps the friendlier
  // rounding, because "0.59 times the hazard" reads better than "0.5880".
  function printedOr(text, value, d) {
    return text !== null && text !== undefined ? esc(text) : num(value, d);
  }

  function hazardView(a) {
    var lvl = Math.round(a.level * 100);
    var out = hrBar(a);
    var anyRecomputed = a.terms.some(function (t) { return t.raw.lowerText === null; });
    out += '<div class="tscroll"><table class="hrt"><tr><th>Term</th><th>HR</th><th>' + lvl + '% interval</th><th>p</th><th>Reading</th></tr>';
    a.terms.forEach(function (t) {
      var r = t.read, raw = t.raw;
      out += '<tr>' +
        '<td><code>' + esc(raw.name) + '</code></td>' +
        '<td class="mono"><b>' + printedOr(raw.ciExpcoefText || raw.expcoefText, r.hr, 4) + '</b></td>' +
        '<td class="mono">' + printedOr(raw.lowerText, r.lower, 4) + ' to ' +
                              printedOr(raw.upperText, r.upper, 4) + '</td>' +
        '<td class="mono">' + (raw.pCensored ? '&lt;' + raw.p : fmtPShort(raw.p)) + '</td>' +
        '<td>' + (r.crossesOne
          ? '<span class="pill dim">crosses 1</span>'
          : '<span class="pill">clear of 1</span>') + '</td>' +
      '</tr>';
    });
    out += '</table></div>';
    if (anyRecomputed) {
      out += '<p class="note"><b>The interval table was not in your paste</b>, so the intervals above were recomputed from coef and se as <code>exp(coef &plusmn; ' +
        num(a.zq, 4) + ' &times; se)</code>. That is the same formula R uses, working from the digits your console printed.</p>';
    }

    out += '<div class="reads">';
    a.terms.forEach(function (t) {
      var r = t.read, raw = t.raw;
      out += '<div class="read">' +
        '<div class="rn"><code>' + esc(raw.name) + '</code> <span class="rhr">HR ' + CM.fmtHR(r.hr) + '</span></div>' +
        '<p>' + esc(r.twoPatient) + '</p>' +
        '<p class="sm">' + esc(explainCI(t, a.level)) + '</p>' +
      '</div>';
    });
    out += '</div>';

    out += '<p class="note"><b>Where the number comes from.</b> The hazard ratio is nothing more than <code>exp(coef)</code>. ' +
      'For <code>' + esc(a.terms[0].raw.name) + '</code>, <code>exp(' + a.terms[0].raw.coefText + ') = ' +
      num(a.terms[0].recomputed.hr, 4) + '</code>, which is what R printed in the exp(coef) column. ' +
      'The interval is <code>exp(coef &plusmn; ' + num(a.zq, 4) + ' &times; se)</code>, a Wald interval on the log scale, exponentiated back. ' +
      'That is why it is not symmetric around the HR: it is symmetric around the coefficient, before the exp.</p>';
    return out;
  }

  function explainCI(t, level) {
    var r = t.read;
    var lvl = Math.round(level * 100);
    if (r.crossesOne) {
      return 'The ' + lvl + '% interval runs from ' + num(r.lower, 3) + ' to ' + num(r.upper, 3) +
        ', and it contains 1. The data are consistent with this covariate having no effect on the hazard at all, and also with effects in both directions. That is not proof it does nothing: it means this study cannot tell.';
    }
    var side = r.hr > 1 ? 'entirely above 1' : 'entirely below 1';
    return 'The ' + lvl + '% interval runs from ' + num(r.lower, 3) + ' to ' + num(r.upper, 3) +
      ', ' + side + '. Every value it contains points the same way, which is what makes this covariate reportable: the direction is not in dispute, only the size.';
  }

  function fitView(a) {
    var out = '';
    var c = a.conc;
    if (c) {
      var pos = Math.max(0, Math.min(1, (c.c - 0.5) / 0.5)) * 100;
      out += '<div class="cbar" role="img" aria-label="Concordance ' + num(c.c, 3) + ' on a scale from 0.5, a coin flip, to 1.0, perfect">' +
        '<div class="ct"><div class="cfill" style="width:' + pos.toFixed(1) + '%"></div>' +
        '<div class="cdot" style="left:' + pos.toFixed(1) + '%"></div></div>' +
        '<div class="clg"><span>0.5 coin flip</span><span>0.7 useful</span><span>1.0 perfect</span></div>' +
        '<p class="cap">' + esc(c.plain) + '</p></div>';
    }

    var g = a.global;
    if (g) {
      out += '<div class="tscroll"><table class="hrt"><tr><th>Test</th><th>Statistic</th><th>df</th><th>p as R printed it</th><th>p recomputed</th></tr>';
      var nm = { lrt: 'Likelihood ratio', wald: 'Wald', score: 'Score (logrank)' };
      g.present.forEach(function (k) {
        var t = a.parsed.tests[k];
        out += '<tr><td>' + nm[k] + '</td><td class="mono">' + t.stat + '</td><td class="mono">' + t.df + '</td>' +
          '<td class="mono">' + esc(t.pText) + '</td>' +
          '<td class="mono">' + fmtPShort(g.recomputed[k]) + '</td></tr>';
      });
      if (a.parsed.tests.robustScore) {
        var rs = a.parsed.tests.robustScore;
        out += '<tr><td>Robust score</td><td class="mono">' + rs.stat + '</td><td class="mono">' + rs.df + '</td>' +
          '<td class="mono">' + esc(rs.pText) + '</td><td class="mono">' + fmtPShort(CM.pFromChisq(rs.stat, rs.df)) + '</td></tr>';
      }
      out += '</table></div>';

      var anyCensored = g.present.some(function (k) { return a.parsed.tests[k].pCensored; });
      if (anyCensored) {
        out += '<p class="note"><b>R stopped at <code>&lt;2e-16</code>, but the number exists.</b> ' +
          'That is just the smallest p the print routine will show. Feeding the printed statistic back through the chi-square distribution recovers the real tail, shown in the last column. ' +
          'Treat it as an order of magnitude and nothing finer: the statistic itself was rounded before it was printed, so only the exponent survives the round trip.</p>';
      }
      out += '<p class="plain2">' + esc(g.verdict) + '</p>';
    }

    if (a.epv) {
      var epv = Math.round(a.epv * 10) / 10;
      var epvMsg = a.epv >= 10
        ? 'You have ' + epv + ' events per covariate, comfortably past the rule-of-thumb floor of 10. The coefficients have enough events behind them to be stable.'
        : 'You have only ' + epv + ' events per covariate, under the usual rule-of-thumb floor of 10. With this little information per term the coefficients can be biased away from zero and the standard errors optimistic. Consider fewer covariates, or say plainly in the write-up that the model is over-specified for the number of events.';
      out += '<p class="note"><b>Events per covariate: ' + epv + '.</b> ' + esc(epvMsg) +
        ' The count that matters for a Cox model is events, never n: ' + a.parsed.events + ' here, not ' + a.parsed.n + '.</p>';
    }
    return out;
  }

  function phView(a) {
    var first = a.terms[0];
    return '<div class="phb">' +
      '<p>Every hazard ratio in this output rests on one assumption that the output itself never checks: <b>proportional hazards</b>. ' +
      'The claim is that <code>' + esc(first.raw.name) + '</code> multiplies the hazard by ' + CM.fmtHR(first.read.hr) +
      ' on day 1, and by ' + CM.fmtHR(first.read.hr) + ' on the last day of follow-up, and by ' + CM.fmtHR(first.read.hr) +
      ' at every moment in between. One number, forever.</p>' +
      '<p>Plenty of real effects are not like that. A surgery raises the hazard sharply for a fortnight and lowers it thereafter. A treatment works for a year and then wears off. Two survival curves cross. In each case a single hazard ratio is an average of things that point in different directions, and averaging them is exactly the wrong summary.</p>' +
      '<p><b>Nothing printed above can tell you which case you are in.</b> The coefficients, the p-values, the concordance and all three global tests are equally happy whether the assumption holds or not. The check is a separate command, and it needs the model object rather than the printed text, which is why this page cannot run it for you.</p>' +
      '<div class="phsteps">' +
        '<div class="ph1"><b>1. Test it</b><p><code>cox.zph(model)</code> gives one row per covariate plus a GLOBAL row. It correlates the scaled Schoenfeld residuals with time: a small p means the effect of that covariate is moving over time, so the single hazard ratio is not describing it.</p></div>' +
        '<div class="ph1"><b>2. Look at it</b><p><code>plot(cox.zph(model))</code> draws the estimated log hazard ratio against time with a smoother. A flat line is proportional hazards. A drifting or crossing line is the violation, and the shape tells you what is happening in a way the p-value cannot.</p></div>' +
        '<div class="ph1"><b>3. Fix it</b><p>A violated assumption is not a dead model. Stratify on the offending covariate with <code>strata()</code> if you do not need its hazard ratio, or fit a time-varying coefficient with <code>tt()</code> if you do. Both are honest; ignoring the violation is not.</p></div>' +
      '</div>' +
      '<p class="note"><b>One warning about the test.</b> <code>cox.zph()</code> is a hypothesis test, so its power scales with your event count. With ' + a.parsed.events +
      ' events it can miss a real violation, and on a very large dataset it will flag violations too small to change any conclusion. Read the plot alongside the p-value rather than instead of it.</p>' +
      '</div>';
  }

  // ---- plain English + inference line ------------------------------------
  function plain(a) {
    var el = $('plain');
    if (state.mode === 'ph') {
      el.textContent = 'A Cox model buys its elegance by never modelling the baseline hazard, and pays for it with the assumption that every hazard ratio is constant over time. cox.zph() is the receipt.';
      return;
    }
    if (state.mode === 'fit') {
      el.textContent = a.conc
        ? 'Concordance answers "can this model rank patients", which is a different and usually more useful question than "is any coefficient significant". A model can be full of tiny p-values and still rank patients barely better than a coin flip.'
        : 'No concordance line was found in the paste.';
      return;
    }
    if (state.mode === 'anatomy') {
      el.textContent = 'The whole output is three claims stacked up: these covariates multiply the hazard by these amounts (the coefficient table), here is how sure we are (the interval table), and here is whether the model beats no model at all (the three tests).';
      return;
    }
    var sig = a.terms.filter(function (t) { return t.read.significant; });
    if (!sig.length) {
      el.textContent = 'Every interval here includes 1. Nothing in this model is separable from no effect, which is a finding in itself and not a failed analysis.';
      return;
    }
    var t = sig[0];
    el.textContent = t.read.twoPatient + ' That is the sentence to carry into the write-up, not the p-value.';
  }

  function inference(a) {
    var el = $('inference-line');
    var lvl = Math.round(a.level * 100);
    var alpha = Math.round((1 - a.level) * 100) / 100;

    if (state.mode === 'ph') {
      el.innerHTML = 'Since nothing in this output tests proportional hazards, <b>the assumption behind every hazard ratio above is currently unchecked</b>: run <code>cox.zph(model)</code> before reporting any of them.';
      return;
    }
    if (state.mode === 'fit') {
      var g = a.global;
      if (!g) { el.textContent = 'No global tests found in the paste.'; return; }
      var lp = g.recomputed.lrt;
      if (lp === undefined) { el.textContent = 'No likelihood ratio test found in the paste.'; return; }
      var beats = lp < alpha;
      el.innerHTML = 'Since the likelihood ratio test gives p = ' + fmtPShort(lp) + ' ' + (beats ? '&lt;' : '&ge;') + ' ' + alpha +
        ', <b>' + (beats ? 'this model beats a model with no covariates at all' : 'this model is not distinguishable from a model with no covariates') +
        '</b>' + (a.conc ? ', and it ranks patients correctly ' + num(a.conc.pct, 1) + '% of the time' : '') + '.';
      return;
    }
    if (state.mode === 'anatomy') {
      el.innerHTML = 'This is a Cox model of <b>' + a.parsed.events + ' events among ' + a.parsed.n + ' subjects</b>' +
        (a.parsed.nmiss ? ', with ' + a.parsed.nmiss + ' rows dropped for missing data' : '') +
        ', estimating ' + a.terms.length + ' hazard ratio' + (a.terms.length === 1 ? '' : 's') +
        ' at ' + lvl + '% confidence.';
      return;
    }
    var sig = a.terms.filter(function (t) { return t.read.significant; });
    if (!sig.length) {
      el.innerHTML = 'Since every ' + lvl + '% interval contains 1, <b>no covariate in this model has a hazard ratio the data can separate from no effect</b>.';
      return;
    }
    var t = sig[0];
    el.innerHTML = 'Since the ' + lvl + '% interval for <code>' + esc(t.raw.name) + '</code> is ' + num(t.read.lower, 3) +
      ' to ' + num(t.read.upper, 3) + ' and does not contain 1, <b>' + esc(t.raw.name) + ' ' +
      (t.read.hr > 1 ? 'raises' : 'lowers') + ' the hazard by ' + CM.fmtPct(Math.abs(t.read.pct)) +
      '</b> among patients alike on everything else in the model.';
  }

  function report(a) {
    var lvl = Math.round(a.level * 100);
    if (state.mode === 'ph') {
      $('report').textContent = 'Proportional hazards was assessed with scaled Schoenfeld residuals (cox.zph); ' +
        'hazard ratios are reported as constant over the follow-up period.';
      return;
    }
    var sig = a.terms.filter(function (t) { return t.read.significant; });
    var bits = (sig.length ? sig : a.terms).slice(0, 4).map(function (t) {
      return t.raw.name + ' HR ' + CM.fmtHR(t.read.hr) + ' (' + lvl + '% CI ' +
        num(t.read.lower, 2) + ' to ' + num(t.read.upper, 2) + ', p ' +
        (t.raw.pCensored ? '< ' + t.raw.p : '= ' + fmtPShort(t.raw.p)) + ')';
    });
    $('report').textContent = 'A Cox proportional hazards model was fitted to ' + a.parsed.n +
      ' subjects with ' + a.parsed.events + ' events' +
      (a.parsed.nmiss ? ' (' + a.parsed.nmiss + ' excluded for missing data)' : '') + '. ' +
      bits.join('; ') + '. ' +
      (a.conc ? 'Concordance was ' + num(a.conc.c, 3) + (a.parsed.concSe ? ' (SE ' + a.parsed.concSe + ')' : '') + '. ' : '') +
      'Proportional hazards was assessed using scaled Schoenfeld residuals.';
  }

  function steps(a) {
    var t = a.terms[0];
    $('h1c').innerHTML = 'Your paste gave <b>' + a.parsed.n + ' subjects</b> and <b>' + a.parsed.events +
      ' events</b>, with ' + a.terms.length + ' covariate row' + (a.terms.length === 1 ? '' : 's') +
      ' and ' + Math.round(a.level * 100) + '% intervals.';
    $('h2c').innerHTML = 'Hazard ratio for <code>' + esc(t.raw.name) + '</code>: <code>exp(' + t.raw.coefText +
      ') = ' + num(t.recomputed.hr, 4) + '</code>' +
      ', which is the exp(coef) column R printed as <code>' + t.raw.expcoefText + '</code>.';
    $('h3c').innerHTML = 'Its interval: <code>exp(' + t.raw.coefText + ' &plusmn; ' + num(a.zq, 4) + ' &times; ' +
      t.raw.seUsedText + ') = ' + num(t.recomputed.ci.lower, 4) + ' to ' + num(t.recomputed.ci.upper, 4) + '</code>' +
      (t.raw.lower !== null ? ', matching the <code>' + t.raw.lowerText + ' ' + t.raw.upperText + '</code> R printed' : '') +
      '. The multiplier is qnorm(' + (1 - (1 - a.level) / 2) + '), not a rounded 1.96.';
    $('h4c').innerHTML = 'Everything here is read from the printed text alone. Your console rounded before it printed, so a recomputed number can differ from R in the last digit. Where that matters, the page says so rather than inventing precision the paste does not carry.';
  }

  // ---- the R block ------------------------------------------------------
  function rcode(a) {
    var vars = CM.formulaVars(a.parsed.call);
    var first = a.terms[0].raw.name;
    // Name the reader's own outcome and data rather than a generic
    // Surv(time, status) / df, so the block runs against their model as pasted.
    var sv = CM.survExpr(a.parsed.call) || 'Surv(time, status)';
    var dn = CM.dataName(a.parsed.call) || 'df';
    var v0 = vars[0] || 'x';
    var code = '';

    if (state.mode === 'ph') {
      // stratify on the first covariate; with only one covariate there is
      // nothing left to model, so show the null stratified fit instead.
      var strat = vars.length > 1
        ? vars.slice(1).join(' + ') + ' + strata(' + v0 + ')'
        : 'strata(' + v0 + ')';
      code =
        'library(survival)\n' +
        '\n' +
        '# The assumption behind every hazard ratio: one constant HR for all time.\n' +
        'zph <- cox.zph(model)\n' +
        'zph                       # a small p on a row = that HR moves over time\n' +
        '\n' +
        '# Always read the picture, not just the p-value.\n' +
        'plot(zph)                 # flat = proportional; drifting = violated\n' +
        '\n' +
        '# If a covariate violates PH, you have two honest options:\n' +
        '# 1. stratify, when you do not need its hazard ratio\n' +
        'coxph(' + sv + ' ~ ' + strat + ', data = ' + dn + ')\n' +
        '\n' +
        '# 2. let its effect vary with time, when you do\n' +
        'coxph(' + sv + ' ~ ' + v0 + ' + tt(' + v0 + '), data = ' + dn + ',\n' +
        '      tt = function(x, t, ...) x * log(t))';
    } else if (state.mode === 'fit') {
      code =
        'library(survival)\n' +
        '\n' +
        's <- summary(model)\n' +
        's$concordance             # the c-statistic and its standard error\n' +
        's$logtest                 # likelihood ratio test: report this one\n' +
        's$waldtest                # Wald\n' +
        's$sctest                  # score (logrank)\n' +
        '\n' +
        '# R prints "p=<2e-16" and stops. The real tail is still there:\n' +
        'pchisq(s$logtest["test"], s$logtest["df"], lower.tail = FALSE)\n' +
        '\n' +
        '# Events per covariate is the number that decides if any of this is stable.\n' +
        'model$nevent / length(coef(model))';
    } else if (state.mode === 'anatomy') {
      code =
        'library(survival)\n' +
        '\n' +
        '# Every block of the printout, as an object you can index:\n' +
        's <- summary(model)\n' +
        's$n                       # subjects\n' +
        's$nevent                  # events (the count your SEs are made of)\n' +
        's$coefficients            # coef, exp(coef), se(coef), z, Pr(>|z|)\n' +
        's$conf.int                # exp(coef), exp(-coef), lower .95, upper .95\n' +
        's$concordance             # the c-statistic\n' +
        '\n' +
        '# The survival curve the hazard ratios are relative to:\n' +
        'plot(survfit(model), xlab = "Time", ylab = "Survival")';
    } else {
      code =
        'library(survival)\n' +
        '\n' +
        '# The hazard ratio IS exp(coef). These two agree by construction:\n' +
        'exp(coef(model))\n' +
        'summary(model)$conf.int[, "exp(coef)"]\n' +
        '\n' +
        '# Hazard ratios with ' + Math.round(a.level * 100) + '% intervals, the block to report:\n' +
        'summary(model, conf.int = ' + a.level + ')$conf.int\n' +
        'exp(confint(model, level = ' + a.level + '))   # same interval, from the log scale\n' +
        '\n' +
        '# A forest plot of exactly the numbers above:\n' +
        '# install.packages("survminer")\n' +
        'survminer::ggforest(model, data = ' + dn + ')\n' +
        '\n' +
        '# Predicted survival for a named patient, which is what an HR of ' +
          CM.fmtHR(a.terms[0].read.hr) + ' on\n' +
        '# ' + first + ' actually buys you:\n' +
        'nd <- ' + dn + '[1, , drop = FALSE]\n' +
        'plot(survfit(model, newdata = nd), xlab = "Time", ylab = "Survival")';
    }
    $('rcodepre').textContent = code;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
