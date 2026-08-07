/* cluster-icc-sim.js - clustered data, and the standard error that a sandwich cannot save.
 *
 * Serves the independence objection and the mixed-model objection in The Publishing
 * Handbook. The reader raises the intraclass correlation and watches four standard errors
 * for the SAME estimate on the SAME data pull apart.
 *
 * The design is the classic one: k clusters (schools, clinics, litters, sites), m
 * observations each, and a treatment assigned at the CLUSTER level. Total variance is held
 * at 1 the whole way, so the dial moves information between "within cluster" and "between
 * cluster" and changes nothing else. Same random draws at every setting, so the picture
 * morphs rather than reshuffles.
 *
 * The identity being demonstrated, which is exact for this balanced design, not an
 * approximation:
 *
 *     Var(tau_hat) = 4 * (rho + (1 - rho) / m) / k          the truth
 *     Var_naive    = 4 / (k * m)                            what OLS assumes
 *     ratio        = 1 + (m - 1) * rho                      the design effect
 *
 * So ordinary OLS understates the standard error by sqrt(1 + (m-1)rho), and the widget's
 * simulated standard deviation of the estimate is checked against that formula on screen.
 *
 * The load-bearing point: HC1 "robust" standard errors, the usual reflex when a reviewer
 * says "standard errors", are computed under the assumption that observations are
 * independent. They track the naive standard error almost exactly here and repair nothing.
 * What repairs it is a cluster-robust standard error (consistent as the number of CLUSTERS
 * grows, not as n grows) or a model with a cluster random effect. With few clusters even
 * the cluster-robust version is optimistic, which the widget also shows.
 *
 * cfg: {
 *   k: 20,          // number of clusters
 *   m: 5,           // observations per cluster
 *   tau: 0.5,       // true treatment effect, in units of the total outcome sd
 *   iccMax: 0.5,    // right-hand end of the dial
 *   levels: 11,     // steps on the dial
 *   start: 0,       // starting step
 *   sims: 3000,     // simulated trials behind each coverage number
 *   seed: 23        // mulberry32 seed - same config, same picture
 * }
 */
(function () {
  'use strict';
  var u = window.LessonWidgets.u;

  var LIGHT = {
    ink: '#131720', body: '#434b59', mut: '#677084', faint: '#97a0b2',
    line: '#d8dee9', grid: '#eef1f6', acc: '#1f7a55', c0: '#2563a8', c1: '#b5631a',
    bad: '#c2410c', panel: '#ffffff', soft: '#f3f6f4'
  };
  var DARK = {
    ink: '#eef4fb', body: '#c3d1e3', mut: '#93a4bb', faint: '#6f8299',
    line: 'rgba(255,255,255,.24)', grid: 'rgba(255,255,255,.10)', acc: '#46c08a',
    c0: '#7fb2ea', c1: '#e3a05a', bad: '#f4805a', panel: '#101c2b', soft: 'rgba(255,255,255,.05)'
  };
  function lumOf(c) {
    c = String(c).trim(); var r, g, b, m;
    if (c.charAt(0) === '#') {
      if (c.length === 4) { r = parseInt(c[1] + c[1], 16); g = parseInt(c[2] + c[2], 16); b = parseInt(c[3] + c[3], 16); }
      else { r = parseInt(c.substr(1, 2), 16); g = parseInt(c.substr(3, 2), 16); b = parseInt(c.substr(5, 2), 16); }
    } else if ((m = c.match(/rgba?\(([^)]+)\)/))) { var p = m[1].split(','); r = +p[0]; g = +p[1]; b = +p[2]; }
    else return 1;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function isDark(el) {
    try { var v = getComputedStyle(el).getPropertyValue('--lm-panel'); if (v && v.trim()) return lumOf(v) < 0.45; } catch (e) {}
    return !!(document.documentElement && document.documentElement.classList.contains('dark'));
  }
  function palette(el) { return isDark(el) ? DARK : LIGHT; }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function gaussian(rnd) { var a = 1 - rnd(), b = rnd(); return Math.sqrt(-2 * Math.log(a)) * Math.cos(2 * Math.PI * b); }

  function lgamma(x) {
    var c = [76.18009172947146, -86.50532032941677, 24.01409824083091,
             -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    var y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (var j = 0; j < 6; j++) s += c[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  function betacf(a, b, x) {
    var FPMIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    d = 1 / d; var h = d;
    for (var mi = 1; mi <= 300; mi++) {
      var m2 = 2 * mi, aa = mi * (b - mi) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; h *= d * c;
      aa = -(a + mi) * (qab + mi) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
      c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d; var del = d * c; h *= del;
      if (Math.abs(del - 1) < 3e-12) break;
    }
    return h;
  }
  function ibeta(a, b, x) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    var bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return (x < (a + 1) / (a + b + 2)) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  }
  function pt2(t, df) { return ibeta(df / 2, 0.5, df / (df + t * t)); }   // two-sided p
  function qt(p, df) {
    var lo = 0, hi = 60, i;
    for (i = 0; i < 140; i++) { var mid = (lo + hi) / 2; if (1 - pt2(mid, df) / 2 < p) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }

  /* ---- one trial, analysed four ways ----
     y is already built; arm[j] is 1 for a treated cluster. Everything below is the exact
     algebra for a two-group design, which keeps the whole thing allocation free. */
  function analyse(y, k, m, arm) {
    var n = k * m, i, j;
    var sT = 0, sC = 0, nT = 0, nC = 0, kT = 0, kC = 0;
    for (j = 0; j < k; j++) { if (arm[j]) { kT++; } else { kC++; } }
    for (i = 0; i < n; i++) { if (arm[(i / m) | 0]) { sT += y[i]; nT++; } else { sC += y[i]; nC++; } }
    var mT = sT / nT, mC = sC / nC, est = mT - mC;

    var rss = 0, eT2 = 0, eC2 = 0;
    var clSum = new Float64Array(k);
    for (i = 0; i < n; i++) {
      var cj = (i / m) | 0, e = y[i] - (arm[cj] ? mT : mC);
      rss += e * e; clSum[cj] += e;
      if (arm[cj]) eT2 += e * e; else eC2 += e * e;
    }
    var s2 = rss / (n - 2);
    var seNaive = Math.sqrt(s2 * (1 / nT + 1 / nC));
    // HC1: heteroskedasticity-consistent, and it assumes independent rows
    var seHC1 = Math.sqrt(n / (n - 2) * (eT2 / (nT * nT) + eC2 / (nC * nC)));
    // CR1: cluster-robust, the Stata small-sample correction
    var gT = 0, gC = 0;
    for (j = 0; j < k; j++) { if (arm[j]) gT += clSum[j] * clSum[j]; else gC += clSum[j] * clSum[j]; }
    var cf = (k / (k - 1)) * ((n - 1) / (n - 2));
    var seCR = Math.sqrt(cf * (gT / (nT * nT) + gC / (nC * nC)));
    // cluster means: for a balanced design with a cluster-level treatment this is
    // algebraically the random-intercept model's standard error
    var cm = new Float64Array(k), mmT = 0, mmC = 0;
    for (j = 0; j < k; j++) { var s = 0; for (i = 0; i < m; i++) s += y[j * m + i]; cm[j] = s / m; if (arm[j]) mmT += cm[j]; else mmC += cm[j]; }
    mmT /= kT; mmC /= kC;
    var ssm = 0;
    for (j = 0; j < k; j++) { var dv = cm[j] - (arm[j] ? mmT : mmC); ssm += dv * dv; }
    var seCM = Math.sqrt((ssm / (k - 2)) * (1 / kT + 1 / kC));
    return { est: est, seNaive: seNaive, seHC1: seHC1, seCR: seCR, seCM: seCM,
             dfN: n - 2, dfCR: k - 1, dfCM: k - 2 };
  }

  var METHODS = [
    { key: 'seNaive', df: 'dfN', label: 'Ordinary OLS', note: 'assumes every row is new information' },
    { key: 'seHC1', df: 'dfN', label: 'Robust (HC1)', note: 'fixes unequal variance, still assumes independence' },
    { key: 'seCR', df: 'dfCR', label: 'Cluster-robust', note: 'consistent in the number of CLUSTERS' },
    { key: 'seCM', df: 'dfCM', label: 'Cluster means / mixed model', note: 'exact for this balanced design' }
  ];

  function mount(el, cfg) {
    cfg = cfg || {};
    var k = Math.max(6, +cfg.k || 20), m = Math.max(2, +cfg.m || 5), n = k * m;
    var tau = (cfg.tau == null ? 0.5 : +cfg.tau);
    var iccMax = Math.min(0.9, +cfg.iccMax || 0.5);
    var levels = Math.max(3, +cfg.levels || 11);
    var sims = Math.max(300, +cfg.sims || 3000);
    var seed = (cfg.seed == null ? 23 : +cfg.seed);
    var step = Math.max(0, Math.min(levels - 1, +cfg.start || 0));

    /* one fixed pool of random draws: the dial reweights them, it never redraws them */
    var rnd = mulberry32(seed);
    var arm = new Int8Array(k), i, j;
    for (j = 0; j < k; j++) arm[j] = j % 2;                 // alternate, so exactly half treated
    var uFix = new Float64Array(k), eFix = new Float64Array(n);
    for (j = 0; j < k; j++) uFix[j] = gaussian(rnd);
    for (i = 0; i < n; i++) eFix[i] = gaussian(rnd);

    var yShow = new Float64Array(n), ySim = new Float64Array(n);
    function build(rho, y, uu, ee) {
      var a = Math.sqrt(rho), b = Math.sqrt(1 - rho), q;
      for (q = 0; q < n; q++) { var cj = (q / m) | 0; y[q] = tau * arm[cj] + a * uu[cj] + b * ee[q]; }
    }

    /* coverage + the true spread of the estimate, per dial setting */
    var cache = {};
    function sim(li) {
      if (cache[li]) return cache[li];
      var rho = iccMax * li / (levels - 1);
      var r2 = mulberry32(seed + 7919 * (li + 1));
      var uu = new Float64Array(k), ee = new Float64Array(n);
      var hit = [0, 0, 0, 0], sum = 0, sum2 = 0, q, t;
      var tcCache = {};
      for (t = 0; t < sims; t++) {
        for (q = 0; q < k; q++) uu[q] = gaussian(r2);
        for (q = 0; q < n; q++) ee[q] = gaussian(r2);
        build(rho, ySim, uu, ee);
        var a = analyse(ySim, k, m, arm);
        sum += a.est; sum2 += a.est * a.est;
        for (q = 0; q < 4; q++) {
          var dfq = a[METHODS[q].df];
          if (!tcCache[dfq]) tcCache[dfq] = qt(0.975, dfq);
          var half = tcCache[dfq] * a[METHODS[q].key];
          if (a.est - half < tau && tau < a.est + half) hit[q]++;
        }
      }
      var sd = Math.sqrt((sum2 - sum * sum / sims) / (sims - 1));
      cache[li] = { rho: rho, cov: hit.map(function (h) { return h / sims; }), sd: sd,
                    deff: 1 + (m - 1) * rho,
                    trueSd: Math.sqrt(4 * (rho + (1 - rho) / m) / k) };
      return cache[li];
    }

    var P = palette(el);
    el.style.cssText = 'border:1px solid ' + P.line + ';border-radius:12px;background:' + P.panel + ';padding:16px 17px';
    el.innerHTML =
      '<div class="ci-lab" style="font:600 12.5px/1.5 IBM Plex Sans,sans-serif;color:' + P.mut + ';margin-bottom:5px"></div>' +
      '<input class="ci-rho" type="range" min="0" max="' + (levels - 1) + '" step="1" value="' + step +
        '" aria-label="intraclass correlation" style="width:100%;max-width:460px;display:block;margin-bottom:13px">' +
      '<div class="ci-plot"></div>' +
      '<div class="ci-tbl" style="margin:12px 0 0;overflow-x:auto"></div>' +
      '<div class="ci-read" style="font:13px/1.6 IBM Plex Sans,sans-serif;color:' + P.body + ';margin:11px 0 14px"></div>' +
      '<div class="ci-r"></div>';

    var lab = el.querySelector('.ci-lab'), plot = el.querySelector('.ci-plot'),
        tbl = el.querySelector('.ci-tbl'), read = el.querySelector('.ci-read'),
        slider = el.querySelector('.ci-rho'), rbox = el.querySelector('.ci-r');

    function render(first) {
      P = palette(el);
      el.style.background = P.panel; el.style.borderColor = P.line;
      lab.style.color = P.mut; read.style.color = P.body;
      var S = sim(step), rho = S.rho;
      build(rho, yShow, uFix, eFix);
      var one = analyse(yShow, k, m, arm);

      lab.innerHTML = 'Intraclass correlation: <b style="color:' + P.ink + '">' + rho.toFixed(2) + '</b> ' +
        '<span style="color:' + P.faint + '">(' + k + ' clusters of ' + m + ', treatment assigned to whole clusters)</span>';
      plot.innerHTML = draw(yShow, one, S, k, m, arm, tau, P);
      tbl.innerHTML = table(one, S, tau, P);
      read.innerHTML = verdict(S, one, k, m, P);
      if (first) rbox.innerHTML = u.runnable(rcode(k, m, tau), { label: 'Run the same comparison in R' });
    }

    slider.addEventListener('input', function () { step = +slider.value; render(false); });
    var wasDark = isDark(el);
    if (window.MutationObserver) {
      var mo = new MutationObserver(function () {
        if (!document.contains(el)) { mo.disconnect(); return; }
        var now = isDark(el); if (now !== wasDark) { wasDark = now; render(false); }
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    render(true);
  }

  /* ---------------- picture: the clusters, then the four standard errors ---------------- */
  function draw(y, one, S, k, m, arm, tau, P) {
    var W = 520, mg = { l: 40, r: 14, t: 30 }, hS = 138, n = k * m;
    var g = '', i, j;
    var lo = -3.2, hi = 3.2 + tau;                       // fixed scale: the spread must be comparable
    function sy(v) { return mg.t + (hi - Math.max(lo, Math.min(hi, v))) / (hi - lo) * hS; }
    var colW = (W - mg.l - mg.r) / k;

    g += '<text x="' + mg.l + '" y="14" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">One trial: every dot is an observation, every column a cluster</text>';
    [-2, 0, 2].forEach(function (v) {
      g += '<line x1="' + mg.l + '" y1="' + sy(v).toFixed(1) + '" x2="' + (W - mg.r) + '" y2="' + sy(v).toFixed(1) + '" stroke="' + P.grid + '"/>' +
           '<text x="' + (mg.l - 6) + '" y="' + (sy(v) + 3).toFixed(1) + '" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="9" fill="' + P.mut + '">' + v + '</text>';
    });
    for (j = 0; j < k; j++) {
      var cx = mg.l + colW * (j + 0.5), col = arm[j] ? P.c0 : P.c1, cm = 0;
      for (i = 0; i < m; i++) {
        var v = y[j * m + i]; cm += v;
        var jitter = (i - (m - 1) / 2) * Math.min(3.2, colW * 0.22);
        g += '<circle cx="' + (cx + jitter).toFixed(1) + '" cy="' + sy(v).toFixed(1) + '" r="2.4" fill="' + col + '" fill-opacity="0.62"/>';
      }
      cm /= m;
      g += '<line x1="' + (cx - colW * 0.36).toFixed(1) + '" y1="' + sy(cm).toFixed(1) + '" x2="' + (cx + colW * 0.36).toFixed(1) + '" y2="' + sy(cm).toFixed(1) +
           '" stroke="' + col + '" stroke-width="2.4"/>';
    }
    g += '<line x1="' + mg.l + '" y1="' + (mg.t + hS) + '" x2="' + (W - mg.r) + '" y2="' + (mg.t + hS) + '" stroke="' + P.line + '" stroke-width="1.5"/>' +
         '<text x="' + mg.l + '" y="' + (mg.t + hS + 14) + '" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c1 + '">control clusters</text>' +
         '<text x="' + (W - mg.r) + '" y="' + (mg.t + hS + 14) + '" text-anchor="end" font-family="IBM Plex Sans,sans-serif" font-size="10" fill="' + P.c0 + '">treated clusters</text>';

    /* standard-error bars, against the simulated truth */
    var yB = mg.t + hS + 42, rowH = 21, barL = 186;
    var vals = METHODS.map(function (M) { return one[M.key]; });
    var maxV = Math.max(S.sd, Math.max.apply(null, vals)) * 1.16;
    function bw(v) { return (v / maxV) * (W - barL - 22); }
    g += '<text x="0" y="' + (yB - 12) + '" font-family="IBM Plex Sans,sans-serif" font-size="10.5" fill="' + P.ink + '">Standard error for that one estimate, four ways</text>';
    METHODS.forEach(function (M, r) {
      var yy = yB + r * rowH, v = one[M.key], wd = bw(v);
      var off = v < S.sd * 0.8;
      // a long bar leaves no room for an outside label, so the number moves inside it
      var inside = barL + wd > W - 46;
      g += '<text x="0" y="' + (yy + 10) + '" font-family="IBM Plex Sans,sans-serif" font-size="11" fill="' + P.body + '">' + u.esc(M.label) + '</text>' +
           '<rect x="' + barL + '" y="' + (yy + 2) + '" width="' + Math.max(1, wd).toFixed(1) + '" height="11" rx="2.5" fill="' + (off ? P.bad : P.acc) + '" fill-opacity="0.82"/>' +
           '<text x="' + (inside ? barL + wd - 6 : barL + wd + 6).toFixed(1) + '" y="' + (yy + 11) + '" text-anchor="' + (inside ? 'end' : 'start') +
             '" font-family="IBM Plex Mono,monospace" font-size="10" fill="' + (inside ? '#fff' : (off ? P.bad : P.mut)) + '">' + v.toFixed(3) + '</text>';
    });
    var xT = barL + bw(S.sd);
    // keep the caption inside the frame however far right the marker sits
    var capAnchor = xT > W - 108 ? 'end' : (xT < 108 ? 'start' : 'middle');
    var capX = capAnchor === 'end' ? W - 2 : (capAnchor === 'start' ? 2 : xT);
    g += '<line x1="' + xT.toFixed(1) + '" y1="' + (yB - 6) + '" x2="' + xT.toFixed(1) + '" y2="' + (yB + METHODS.length * rowH - 2) + '" stroke="' + P.ink + '" stroke-width="1.6" stroke-dasharray="3 2"/>' +
         '<text x="' + capX.toFixed(1) + '" y="' + (yB - 10) + '" text-anchor="' + capAnchor + '" font-family="IBM Plex Sans,sans-serif" font-size="9.5" fill="' + P.ink + '">how much the estimate really varies</text>';
    var H = yB + METHODS.length * rowH + 8;
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;display:block" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Clustered observations and four standard errors for the same treatment effect">' + g + '</svg>';
  }

  /* ---------------- the same estimate, four intervals ---------------- */
  function table(one, S, tau, P) {
    var cols = ['Analysis', 'SE', '95% interval', 'p', 'Covers truth in'];
    var rows = METHODS.map(function (M, r) {
      var se = one[M.key], df = one[M.df], tc = qt(0.975, df), t = one.est / se;
      return [M.label, se.toFixed(3),
              '[' + (one.est - tc * se).toFixed(2) + ', ' + (one.est + tc * se).toFixed(2) + ']',
              fmtP(pt2(Math.abs(t), df)),
              (100 * S.cov[r]).toFixed(1) + '%'];
    });
    var h = '<table style="border-collapse:collapse;font-family:IBM Plex Mono,monospace;font-size:12px;width:100%;min-width:430px"><thead><tr>';
    cols.forEach(function (c, ci) {
      h += '<th style="text-align:' + (ci ? 'right' : 'left') + ';padding:6px 9px;border-bottom:1px solid ' + P.line +
           ';color:' + P.mut + ';font-weight:600;white-space:nowrap;font-family:IBM Plex Sans,sans-serif;font-size:11px">' + u.esc(c) + '</th>';
    });
    h += '</tr></thead><tbody>';
    rows.forEach(function (r, ri) {
      var bad = S.cov[ri] < 0.9;
      h += '<tr>';
      r.forEach(function (v, ci) {
        h += '<td style="text-align:' + (ci ? 'right' : 'left') + ';padding:6px 9px;border-bottom:1px solid ' + P.grid +
             ';color:' + (ci === 4 && bad ? P.bad : P.ink) + ';white-space:nowrap' +
             (ci === 0 ? ';font-family:IBM Plex Sans,sans-serif' : '') + '">' + u.esc(v) + '</td>';
      });
      h += '</tr>';
    });
    return h + '</tbody></table>' +
      '<div style="font:11px/1.5 IBM Plex Sans,sans-serif;color:' + P.faint + ';margin-top:6px">' +
      'All four rows describe the same estimate on the same data. The true effect is ' + tau + '.</div>';
  }
  function fmtP(p) { return p < 0.001 ? '<0.001' : p.toFixed(3); }

  function verdict(S, one, k, m, P) {
    var rho = S.rho, deff = S.deff, nEff = (k * m) / deff;
    if (rho < 1e-9) {
      return 'At an intraclass correlation of zero the four standard errors agree, because there is nothing to correct for. ' +
        'Raise it and watch which ones move.';
    }
    var ratio = one.seCM / one.seNaive;
    return 'The design effect is <b>1 + (' + m + ' &minus; 1) &times; ' + rho.toFixed(2) + ' = ' + deff.toFixed(2) + '</b>, ' +
      'so ' + (k * m) + ' rows carry about <b>' + nEff.toFixed(0) + ' rows</b> of independent information. ' +
      'The naive interval covers the truth <b style="color:' + (S.cov[0] < 0.9 ? P.bad : P.acc) + '">' + (100 * S.cov[0]).toFixed(1) + '%</b> of the time instead of 95%. ' +
      'HC1 gets to <b>' + (100 * S.cov[1]).toFixed(1) + '%</b>: it is robust to the wrong thing. ' +
      'Cluster-robust reaches <b>' + (100 * S.cov[2]).toFixed(1) + '%</b> and the cluster-level analysis <b>' + (100 * S.cov[3]).toFixed(1) + '%</b>. ' +
      'The simulated spread of the estimate is ' + S.sd.toFixed(3) + ' against the formula\'s ' + S.trueSd.toFixed(3) + '.';
  }

  /* ---------------- runnable R ----------------
     Base R only, and it computes HC1 and CR1 by hand rather than leaning on a package, so
     the arithmetic is visible. Verified against sandwich::vcovHC / vcovCL and lme4::lmer. */
  function rcode(k, m, tau) {
    return [
      '# One cluster-randomised trial, analysed four ways. Raise rho and run it again.',
      'set.seed(4)',
      'k <- ' + k + '; m <- ' + m + '; n <- k * m; tau <- ' + tau,
      'rho <- 0.30                       # intraclass correlation',
      '',
      'cl  <- rep(1:k, each = m)',
      'arm <- rep(rep(0:1, length.out = k), each = m)     # treatment is a CLUSTER property',
      'y   <- tau * arm + sqrt(rho) * rnorm(k)[cl] + sqrt(1 - rho) * rnorm(n)',
      '',
      'fit <- lm(y ~ arm)',
      'e   <- residuals(fit)',
      'nT  <- sum(arm == 1); nC <- n - nT',
      '',
      'se_ols <- coef(summary(fit))["arm", "Std. Error"]',
      'se_hc1 <- sqrt(n / (n - 2) * (sum(e[arm == 1]^2) / nT^2 + sum(e[arm == 0]^2) / nC^2))',
      'g      <- tapply(e, cl, sum)',
      'armcl  <- tapply(arm, cl, max)',
      'se_cr1 <- sqrt(k / (k - 1) * (n - 1) / (n - 2) *',
      '                (sum(g[armcl == 1]^2) / nT^2 + sum(g[armcl == 0]^2) / nC^2))',
      '',
      '# cluster means: for a balanced design with cluster-level treatment this is exactly',
      '# the standard error a random-intercept model reports',
      'cm     <- tapply(y, cl, mean)',
      'se_cm  <- sqrt(sum((cm - ave(cm, armcl))^2) / (k - 2) * (2 / (k / 2)))',
      '',
      'round(c(ols = se_ols, hc1 = se_hc1, cluster_robust = se_cr1, cluster_means = se_cm), 4)',
      'round(c(design_effect = 1 + (m - 1) * rho,',
      '        true_se       = sqrt(4 * (rho + (1 - rho) / m) / k)), 4)'
    ].join('\n');
  }

  window.LessonWidgets.register('cluster-icc-sim', mount);
})();
