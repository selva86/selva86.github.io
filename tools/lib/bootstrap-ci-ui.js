/* bootstrap-ci-ui.js - UI/compute/render engine for the bootstrap CI tool.
   Externalized from the page so the rendered outerHTML stays under the page_audit
   size gate; math stays in bootstrap-math.js (R-verified vs boot::boot.ci(), 280/280).
   Classic script: every onclick-referenced function is a top-level `function`
   declaration (global on window) so inline handlers resolve. state/SCENARIOS are
   top-level (used only by this file). GA tool_use/tool_copy wiring + the boot call
   live INLINE in the page. */

function $(id){ return document.getElementById(id); }
function fmt(x, d){ d = d == null ? 4 : d; if (!isFinite(x)) return '-'; return Number(x).toFixed(d).replace(/\.?0+$/,''); }
function fmtViz(x, d){ d = d == null ? 3 : d; if (!isFinite(x)) return '-'; return Number(x).toFixed(d).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''); }
function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

var BM = window.BootMath;

// ---- parsing ------------------------------------------------------------
function parseColumn(text){
  if (!text) return [];
  var raw = String(text).split(/[\s,;]+/);
  var out = [];
  for (var i = 0; i < raw.length; i++){
    var s = raw[i].trim();
    if (!s) continue;
    var v = +s;
    if (isFinite(v)) out.push(v);
  }
  return out;
}

// Built-ins delegate to the R-verified lib (mean = R's corrected two-pass;
// median / IQR / p90 = R quantile type 7). Custom = user JS expression of x[].
function buildStatFn(kind){
  if (BM.STAT[kind]) return BM.STAT[kind];
  if (kind === 'custom'){
    var src = ($('custom-fn').value || '').trim();
    if (!src) return null;
    try {
      var fn = new Function('x', 'return (' + src + ');');
      var t = fn([1, 2, 3]);            // sanity: finite number on a test array
      if (typeof t !== 'number' || !isFinite(t)) return null;
      return fn;
    } catch (e){ return null; }
  }
  return BM.STAT.mean;
}

var METHOD_LABEL = { norm: 'Normal', basic: 'Basic', perc: 'Percentile', bca: 'BCa' };
var STAT_LABEL   = { mean: 'mean', median: 'median', sd: 'standard deviation', iqr: 'IQR', p90: '90th percentile', custom: 'custom statistic' };
var STAT_SHORT   = { mean: 'mean', median: 'median', sd: 'SD', iqr: 'IQR', p90: '90th percentile', custom: 'custom statistic' };

// Run the R-verified bootstrap; shape the selected method into { lo, hi, label,
// sorted, method }. res.ci carries all four intervals for the comparison table.
function computeBoot(x, statFn, method, conf, B, seed){
  var res = BM.bootstrap(x, statFn, { R: B, seed: seed, conf: conf });
  var key = method, label = METHOD_LABEL[key], pair = res.ci[key];
  if (key === 'bca' && !res.bcaOk){           // degenerate distribution -> percentile
    pair = res.ci.perc;
    label = 'BCa (fallback)';
  }
  return { res: res, ci: { lo: pair[0], hi: pair[1], label: label, sorted: res.sorted, method: key } };
}

// ---- state --------------------------------------------------------------
var state = {
  data: '',
  stat: 'mean',
  customFn: 'x.reduce(function(a,b){return a+b},0)/x.length',
  B: 2000,
  method: 'bca',
  conf: 0.95,
  seed: 42
};
var lastResult = null;
var activeMode = 'bootstrap';

function setStat(kind){
  state.stat = kind;
  document.querySelectorAll('.mode').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-mode') === kind); });
  var sel = $('banner-stat-select'); if (sel) sel.value = kind;
  $('custom-fn-row').style.display = kind === 'custom' ? '' : 'none';
  recompute();
}
function setMethod(m){
  state.method = m;
  document.querySelectorAll('#method-picker .pill').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-method') === m); });
  recompute();
}
function setConf(c){
  state.conf = c;
  document.querySelectorAll('#conf-picker .pill').forEach(function(b){ b.classList.toggle('on', Math.abs(+b.getAttribute('data-conf') - c) < 0.005); });
  recompute();
}

// ---- viz sliders (what-if) ---------------------------------------------
var VIZ_CONFIG = {
  bootstrap: function(){ return [
    { key: 'B',    sym: 'B',    label: 'resamples', min: 200,  max: 10000, step: 100,  decimals: 0, get: function(){ return state.B; },    set: function(v){ state.B = v; $('B-input').value = v; } },
    { key: 'conf', sym: '1-a',  label: 'level',     min: 0.50, max: 0.99,  step: 0.01, decimals: 2, get: function(){ return state.conf; }, set: function(v){ state.conf = v; document.querySelectorAll('#conf-picker .pill').forEach(function(b){ b.classList.toggle('on', Math.abs(+b.getAttribute('data-conf') - v) < 0.005); }); } },
    { key: 'seed', sym: 'seed', label: 'rng',       min: 1,    max: 9999,  step: 1,    decimals: 0, get: function(){ return state.seed; }, set: function(v){ state.seed = v; $('seed-input').value = v; } }
  ]; }
};
function renderVizSliders(){
  var el = $('viz-sliders'); if (!el) return;
  var defs = (VIZ_CONFIG[activeMode] || function(){ return []; })();
  el.innerHTML = defs.map(function(s){
    var v = s.get();
    return '<div class="vsrow">' +
      '<label><span class="vsym">' + s.sym + '</span>' + s.label + '</label>' +
      '<input type="range" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + v + '" aria-label="' + s.label + '" oninput="onVizSlide(\'' + s.key + '\', this.value)">' +
      '<span class="vval" id="viz-val-' + s.key + '">' + fmtViz(v, s.decimals) + '</span>' +
      '</div>';
  }).join('');
}
function refreshSliderValues(){
  var cfg = VIZ_CONFIG[activeMode]; if (!cfg) return;
  cfg().forEach(function(s){ var el = $('viz-val-' + s.key); if (el) el.textContent = fmtViz(s.get(), s.decimals); });
}
function onVizSlide(key, val){
  var v = +val;
  (VIZ_CONFIG[activeMode] || function(){ return []; })().forEach(function(s){ if (s.key === key) s.set(v); });
  refreshSliderValues();
  recompute();
}

// ---- banner -------------------------------------------------------------
function renderBanner(){
  var t = $('banner-stat-text'); if (t) t.textContent = STAT_SHORT[state.stat];
  var m = $('banner-method');     if (m) m.textContent = METHOD_LABEL[state.method];
  var c = $('banner-conf');       if (c) c.textContent = Math.round(state.conf * 100) + '%';
}

// ---- recompute + render -------------------------------------------------
function clearResults(msg, isErr){
  $('vchip').className = 'vchip na';
  $('vchip').textContent = 'no result';
  $('result-headline').textContent = msg || 'Enter data to see the interval';
  $('verdict-line').textContent = '';
  ['stat-n','stat-theta','stat-bias','stat-se','stat-b'].forEach(function(id){ $(id).textContent = '-'; });
  $('method-body').innerHTML = '';
  $('callouts-area').innerHTML = '';
  $('english-read').style.display = 'none';
  $('report').textContent = '';
  var ie = $('ierr');
  if (isErr){ ie.textContent = msg; ie.classList.add('show'); } else { ie.classList.remove('show'); }
  drawViz(null);
  renderInferenceBanner();
  renderHow(null);
}

function recompute(){
  state.data = $('data-input').value;
  state.B = Math.max(200, Math.min(50000, parseInt($('B-input').value || '2000', 10)));
  state.seed = parseInt($('seed-input').value || '42', 10);
  if (!isFinite(state.seed)) state.seed = 42;

  var x = parseColumn(state.data);
  var statFn = buildStatFn(state.stat);

  renderBanner();
  renderVizSliders();
  renderRCode(x);

  if (x.length < 2){ lastResult = null; clearResults('Enter at least 2 numeric values', false); return; }
  if (!statFn){ lastResult = null; clearResults('Custom function did not return a finite number on a test array', true); return; }
  var probe = statFn(x);
  if (!isFinite(probe)){ lastResult = null; clearResults('That statistic is not finite on this data', true); return; }
  $('ierr').classList.remove('show');

  var t0 = performance.now();
  var out = computeBoot(x, statFn, state.method, state.conf, state.B, state.seed);
  var res = out.res, ci = out.ci;
  var elapsed = performance.now() - t0;
  var theta_hat = res.t0;       // R's corrected two-pass for the mean
  var bias = res.bias;          // mean(theta*) - theta_hat
  var seBoot = res.sdStar;      // sd(theta*)

  lastResult = { x: x, theta_hat: theta_hat, theta: res.t, ci: ci, res: res, bias: bias, se: seBoot, elapsed: elapsed };

  // verdict
  $('vchip').className = 'vchip';
  $('vchip').textContent = ci.label + ' · ' + Math.round(state.conf * 100) + '%';
  $('result-headline').innerHTML = fmt(ci.lo, 4) + ' <span class="rto">to</span> ' + fmt(ci.hi, 4);
  $('verdict-line').innerHTML = Math.round(state.conf * 100) + '% ' + ci.label + ' bootstrap CI for the <b>' + STAT_LABEL[state.stat] +
    '</b> of your ' + x.length + ' values (&theta;&#770; = <b>' + fmt(theta_hat, 4) + '</b>).';

  // stats grid
  $('stat-n').textContent = x.length;
  $('stat-theta').textContent = fmt(theta_hat, 4);
  $('stat-bias').textContent = fmt(bias, 4);
  $('stat-se').textContent = fmt(seBoot, 4);
  $('stat-b').textContent = res.t.length;

  renderMethodTable(lastResult);
  renderCallouts(lastResult);
  renderEnglish(lastResult);
  renderInferenceBanner();
  renderHow(lastResult);
  renderReport(lastResult);
  drawViz(lastResult);
  refreshSliderValues();
}

// All four intervals side by side; active method row tagged. Values are exactly
// boot.ci(type=c("norm","basic","perc","bca")) for these resamples.
function renderMethodTable(r){
  var body = $('method-body'); if (!body) return;
  var order = ['norm', 'basic', 'perc', 'bca'];
  body.innerHTML = order.map(function(k){
    var pair = r.res.ci[k], lo = pair[0], hi = pair[1];
    var active = (k === r.ci.method);
    var cells = (isFinite(lo) && isFinite(hi))
      ? '<td>' + fmt(lo, 4) + '</td><td>' + fmt(hi, 4) + '</td><td>' + fmt(hi - lo, 4) + '</td>'
      : '<td>-</td><td>-</td><td>-</td>';
    return '<tr' + (active ? ' class="mc-on"' : '') + '><th>' + METHOD_LABEL[k] + (active ? ' <span class="mc-tag">shown</span>' : '') + '</th>' + cells + '</tr>';
  }).join('');
}

function renderCallouts(r){
  var el = $('callouts-area'); el.innerHTML = '';
  if (r.x.length < 10){
    el.innerHTML += '<div class="callout"><span class="callout-icon">&#9888;</span><div>n = ' + r.x.length + ' is small. Bootstrap CIs are unreliable below n &asymp; 30; treat the bounds as approximate.</div></div>';
  }
  if (state.method === 'bca' && state.B < 1000){
    el.innerHTML += '<div class="callout"><span class="callout-icon">&#9888;</span><div>BCa needs B &ge; 1000 for stable acceleration; consider raising B.</div></div>';
  }
  if (r.ci.label === 'BCa (fallback)'){
    el.innerHTML += '<div class="callout danger"><span class="callout-icon">&#9888;</span><div>BCa is undefined for this distribution (bias correction or acceleration is not finite); showing the percentile interval instead.</div></div>';
  }
  var allSame = true;
  for (var i = 1; i < r.x.length; i++){ if (r.x[i] !== r.x[0]){ allSame = false; break; } }
  if (allSame){
    el.innerHTML += '<div class="callout danger"><span class="callout-icon">&#9888;</span><div>All values are identical; the bootstrap distribution is a point mass.</div></div>';
  }
}

function renderEnglish(r){
  var el = $('english-read'); if (!el) return;
  var statName = STAT_LABEL[state.stat];
  var biasWord = Math.abs(r.bias) < 0.5 * r.se ? 'small relative to the standard error, so the estimate is roughly unbiased'
                                               : 'large relative to the standard error, so read the interval with care';
  el.style.display = '';
  el.innerHTML = 'Across <b>' + r.theta.length + '</b> resamples of your <b>' + r.x.length + '</b> values, the ' + statName +
    ' is <b>' + fmt(r.theta_hat, 4) + '</b>. A <b>' + Math.round(state.conf * 100) + '%</b> ' + r.ci.label +
    ' interval runs from <b>' + fmt(r.ci.lo, 4) + '</b> to <b>' + fmt(r.ci.hi, 4) + '</b>. The bootstrap standard error is <b>' +
    fmt(r.se, 4) + '</b> and the bias is <b>' + fmt(r.bias, 4) + '</b> (' + biasWord + ').';
}

function renderInferenceBanner(){
  var el = $('inference-banner'); if (!el) return;
  if (!lastResult){
    el.innerHTML = '<span class="ik">Inference</span>Paste at least two numeric values to see the bootstrap CI conclusion.';
    return;
  }
  var r = lastResult;
  var methodLabel = ({ norm: 'normal', perc: 'percentile', basic: 'basic', bca: 'BCa' })[state.method];
  if (r.ci.label === 'BCa (fallback)') methodLabel = 'percentile (BCa fallback)';
  el.innerHTML = '<span class="ik">Inference</span>Based on <b>B = ' + r.theta.length + '</b> resamples (seed = <b>' + state.seed +
    '</b>), the <em>' + STAT_LABEL[state.stat] + '</em> of your sample is <b>' + fmt(r.theta_hat, 4) + '</b> with a <b>' +
    Math.round(state.conf * 100) + '%</b> ' + methodLabel + ' CI of <b>[' + fmt(r.ci.lo, 4) + ', ' + fmt(r.ci.hi, 4) +
    ']</b>. The bootstrap distribution has SE = <b>' + fmt(r.se, 4) + '</b> and bias = <b>' + fmt(r.bias, 4) + '</b>.';
}

function renderHow(r){
  var s1 = $('h1c'), s2 = $('h2c'), s3 = $('h3c'), s4 = $('h4c');
  if (!s1) return;
  if (!r){
    s1.textContent = 'Enter data above to see the steps on your numbers.';
    s2.textContent = ''; s3.textContent = ''; s4.textContent = '';
    return;
  }
  var statName = STAT_LABEL[state.stat];
  s1.innerHTML = '<b>Resample.</b> Draw <b>n = ' + r.x.length + '</b> values from your sample with replacement, <b>B = ' +
    r.theta.length + '</b> times, recomputing the ' + statName + ' on each resample.';
  s2.innerHTML = '<b>Build the distribution.</b> The ' + r.theta.length + ' recomputed values form the bootstrap distribution; its SD is the bootstrap SE = <b>' +
    fmt(r.se, 4) + '</b>, and its mean minus &theta;&#770; is the bias = <b>' + fmt(r.bias, 4) + '</b>.';
  var methodExpl = ({
    norm: 'The <b>Normal</b> interval recenters &theta;&#770; by the bias and goes z standard errors either way.',
    perc: 'The <b>Percentile</b> interval reads the ' + fmt((1 - state.conf) / 2 * 100, 2) + 'th and ' + fmt((1 - (1 - state.conf) / 2) * 100, 2) + 'th quantiles of the sorted resamples.',
    basic: 'The <b>Basic</b> interval reflects the percentile bounds about &theta;&#770;.',
    bca: 'The <b>BCa</b> interval shifts the percentiles by a bias correction (z0) and a jackknife acceleration (a) before reading them off.'
  })[state.method];
  s3.innerHTML = '<b>Read the interval.</b> ' + methodExpl + ' Result: <b>[' + fmt(r.ci.lo, 4) + ', ' + fmt(r.ci.hi, 4) + ']</b>.';
  s4.innerHTML = '<b>Reproduce.</b> Seeded with R\'s Mersenne-Twister, so <code>set.seed(' + state.seed +
    '); boot()</code> draws the identical resamples and <code>boot.ci()</code> returns the identical interval.';
}

function renderReport(r){
  var methodLabel = r.ci.label;
  var txt = 'Bootstrap ' + Math.round(state.conf * 100) + '% ' + methodLabel + ' CI for the ' + STAT_LABEL[state.stat] +
    ': [' + fmt(r.ci.lo, 4) + ', ' + fmt(r.ci.hi, 4) + '] (theta-hat=' + fmt(r.theta_hat, 4) + ', SE=' + fmt(r.se, 4) +
    ', bias=' + fmt(r.bias, 4) + ', B=' + r.theta.length + ', seed=' + state.seed + '). r-statistics.co';
  $('report').textContent = txt;
}

// ---- histogram of the bootstrap distribution ---------------------------
function drawViz(r){
  var svg = $('viz-svg'); if (!svg) return;
  var W = 360, H = 200, ml = 24, mr = 14, mt = 14, mb = 32;
  var plotW = W - ml - mr, plotH = H - mt - mb;
  if (!r){
    svg.innerHTML = '<text class="ax-label" x="' + (W / 2) + '" y="' + (H / 2) + '" text-anchor="middle">No data</text>';
    $('viz-caption').textContent = '';
    $('viz-readout').innerHTML = '';
    return;
  }
  var theta = r.ci.sorted, n = theta.length;
  var lo = theta[0], hi = theta[n - 1];
  if (lo === hi){ lo -= 1; hi += 1; }
  var nbins = Math.min(60, Math.max(20, Math.round(Math.sqrt(n))));
  var bw = (hi - lo) / nbins;
  var bins = new Array(nbins).fill(0);
  for (var i = 0; i < n; i++){
    var k = Math.floor((theta[i] - lo) / bw);
    if (k >= nbins) k = nbins - 1; if (k < 0) k = 0;
    bins[k]++;
  }
  var maxC = 0;
  for (i = 0; i < nbins; i++) if (bins[i] > maxC) maxC = bins[i];
  var tx = function(v){ return ml + ((v - lo) / (hi - lo)) * plotW; };
  var ty = function(c){ return mt + plotH - (c / maxC) * plotH; };

  var bars = '';
  for (i = 0; i < nbins; i++){
    var x0 = tx(lo + i * bw), x1 = tx(lo + (i + 1) * bw), y0 = ty(bins[i]);
    var w = Math.max(1, x1 - x0 - 1);
    bars += '<rect x="' + x0.toFixed(1) + '" y="' + y0.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + (mt + plotH - y0).toFixed(1) + '" fill="var(--acc)" opacity="0.55"/>';
  }
  var cLo = r.ci.lo, cHi = r.ci.hi;
  var bandX0 = Math.max(ml, tx(Math.max(lo, cLo)));
  var bandX1 = Math.min(ml + plotW, tx(Math.min(hi, cHi)));
  var ciBand = (bandX1 > bandX0)
    ? '<rect x="' + bandX0.toFixed(1) + '" y="' + mt + '" width="' + (bandX1 - bandX0).toFixed(1) + '" height="' + plotH + '" fill="var(--acc)" opacity="0.12"/>' : '';
  var loLine = (cLo >= lo && cLo <= hi) ? '<line x1="' + tx(cLo).toFixed(1) + '" y1="' + mt + '" x2="' + tx(cLo).toFixed(1) + '" y2="' + (mt + plotH) + '" stroke="var(--acc-dk)" stroke-width="1.5" stroke-dasharray="4 3"/>' : '';
  var hiLine = (cHi >= lo && cHi <= hi) ? '<line x1="' + tx(cHi).toFixed(1) + '" y1="' + mt + '" x2="' + tx(cHi).toFixed(1) + '" y2="' + (mt + plotH) + '" stroke="var(--acc-dk)" stroke-width="1.5" stroke-dasharray="4 3"/>' : '';
  var thMark = '';
  if (r.theta_hat >= lo && r.theta_hat <= hi){
    thMark = '<line x1="' + tx(r.theta_hat).toFixed(1) + '" y1="' + mt + '" x2="' + tx(r.theta_hat).toFixed(1) + '" y2="' + (mt + plotH) + '" stroke="#c2860f" stroke-width="2"/>' +
      '<text class="estimate-label" x="' + tx(r.theta_hat).toFixed(1) + '" y="' + (mt + 12) + '" text-anchor="middle" fill="#a8720b">&theta;&#770;=' + fmtViz(r.theta_hat, 3) + '</text>';
  }
  var ticks = '', tickN = 5;
  for (var kk = 0; kk <= tickN; kk++){
    var xv = lo + (kk / tickN) * (hi - lo);
    ticks += '<line class="ax" x1="' + tx(xv).toFixed(1) + '" y1="' + (mt + plotH) + '" x2="' + tx(xv).toFixed(1) + '" y2="' + (mt + plotH + 3) + '"/>' +
      '<text class="tick-label" x="' + tx(xv).toFixed(1) + '" y="' + (mt + plotH + 14) + '" text-anchor="middle">' + fmtViz(xv, 2) + '</text>';
  }
  svg.innerHTML = ciBand + bars + loLine + hiLine + thMark +
    '<line class="ax" x1="' + ml + '" y1="' + (mt + plotH) + '" x2="' + (W - mr) + '" y2="' + (mt + plotH) + '"/>' + ticks +
    '<text class="ax-label" x="' + (ml + plotW / 2) + '" y="' + (H - 6) + '" text-anchor="middle">bootstrap distribution of &theta;* with CI shaded</text>';

  $('viz-caption').textContent = 'Histogram of B = ' + n + ' bootstrap resamples · ' + r.elapsed.toFixed(0) + ' ms';
  $('viz-readout').innerHTML = '&theta;&#770; = <b>' + fmtViz(r.theta_hat, 4) + '</b> · CI = [<b>' + fmtViz(r.ci.lo, 4) +
    '</b>, <b>' + fmtViz(r.ci.hi, 4) + '</b>] · SE = <b>' + fmtViz(r.se, 4) + '</b>';
}

// ---- R code -------------------------------------------------------------
function renderRCode(x){
  var statBody = ({
    mean: 'mean(d)', median: 'median(d)', sd: 'sd(d)', iqr: 'IQR(d)',
    p90: 'quantile(d, 0.90, names = FALSE)',
    custom: '# replace with your custom expression on d\n  mean(d)'
  })[state.stat];
  var methodName = METHOD_LABEL[state.method];
  var dataLine = 'my_vector <- c(' + x.slice(0, 200).map(function(v){ return fmtViz(v, 6); }).join(', ') + ')';
  if (x.length > 200) dataLine += '\n# (showing first 200 of ' + x.length + ')';
  var code =
    'library(boot)\n\n' +
    dataLine + '\n\n' +
    'stat_fn <- function(data, indices) {\n' +
    '  d <- data[indices]\n' +
    '  ' + statBody + '\n' +
    '}\n\n' +
    'set.seed(' + state.seed + ')\n' +
    'b <- boot(data = my_vector, statistic = stat_fn, R = ' + state.B + ')\n\n' +
    '# All four intervals (the tool shows ' + methodName + ' by default)\n' +
    'boot.ci(b, type = c("norm", "basic", "perc", "bca"), conf = ' + state.conf + ')\n' +
    'b$t0                  # original statistic\n' +
    'mean(b$t) - b$t0      # bias estimate\n' +
    'sd(b$t)               # SE estimate\n';
  var pre = $('rcodepre');
  if (pre) pre.textContent = code;
}

// ---- copy + toast -------------------------------------------------------
function copyReport(){
  var t = $('report'); if (!t || !t.textContent) return;
  navigator.clipboard.writeText(t.textContent).then(function(){
    var b = $('copybtn'); if (b){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy report line'; }, 1400); }
    toast('Report line copied');
  });
}
function copyRCode(){
  var pre = $('rcodepre'); if (!pre) return;
  navigator.clipboard.writeText(pre.textContent).then(function(){
    var b = $('rcopy'); if (b){ b.textContent = 'Copied'; setTimeout(function(){ b.textContent = 'Copy code'; }, 1400); }
    toast('R code copied');
  });
}
function toast(msg){
  var area = $('toast-area'); if (!area) return;
  var t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  area.appendChild(t);
  setTimeout(function(){ t.remove(); }, 3000);
}

// ---- scenarios ----------------------------------------------------------
// Deterministic samplers for the demo datasets, reproducible across reloads;
// reuse the lib's R RNG. Box-Muller uses two uniforms.
function rng_seq(seed, n){ var r = BM.RRNG(seed); var out = []; for (var i = 0; i < n; i++) out.push(r.unif()); return out; }
function rnormSeq(seed, n, mu, sigma){
  var u = rng_seq(seed, 2 * n), out = [];
  for (var i = 0; i < n; i++){
    var u1 = Math.max(1e-12, u[2 * i]), u2 = u[2 * i + 1];
    var z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    out.push(mu + sigma * z);
  }
  return out;
}
function rlnormSeq(seed, n, mlog, slog){
  return rnormSeq(seed, n, 0, 1).map(function(v){ return Math.exp(mlog + slog * v); });
}

var SCENARIOS = {
  meanNormal: { name: 'Mean of n=30 normal', icon: '\u{1F4CA}',
    story: '30 draws from N(50, 10). The bootstrap CI for the mean is close to the parametric t-CI; useful as a sanity check.',
    apply: function(){ state.data = rnormSeq(7, 30, 50, 10).map(function(v){ return v.toFixed(3); }).join('\n'); state.stat = 'mean'; state.method = 'bca'; state.conf = 0.95; state.B = 2000; } },
  medianLognormal: { name: 'Median of n=100 lognormal', icon: '\u{1F4C8}',
    story: '100 lognormal draws (heavy right tail). The parametric CI for the median is awkward; the bootstrap percentile / BCa CI is the standard answer.',
    apply: function(){ state.data = rlnormSeq(11, 100, 0, 1).map(function(v){ return v.toFixed(3); }).join('\n'); state.stat = 'median'; state.method = 'bca'; state.conf = 0.95; state.B = 2000; } },
  sdOutlier: { name: 'SD with outliers', icon: '\u{1F50D}',
    story: '50 N(10, 2) values plus a couple of clear outliers; the bootstrap SE of the SD is much wider than the chi-square CI predicts.',
    apply: function(){ var base = rnormSeq(13, 50, 10, 2); base.push(28); base.push(30); state.data = base.map(function(v){ return v.toFixed(3); }).join('\n'); state.stat = 'sd'; state.method = 'bca'; state.conf = 0.95; state.B = 2000; } },
  iqrLarge: { name: 'IQR of n=200', icon: '\u{1F4D0}',
    story: '200 N(0, 1) draws; the IQR has no closed-form CI in base R. The bootstrap is the easiest path.',
    apply: function(){ state.data = rnormSeq(17, 200, 0, 1).map(function(v){ return v.toFixed(3); }).join('\n'); state.stat = 'iqr'; state.method = 'perc'; state.conf = 0.95; state.B = 2000; } },
  p90: { name: '90th percentile', icon: '\u{1F4CF}',
    story: '100 lognormal draws; CI for the 90th percentile (a tail quantile) where parametric assumptions matter most.',
    apply: function(){ state.data = rlnormSeq(19, 100, 0, 0.6).map(function(v){ return v.toFixed(3); }).join('\n'); state.stat = 'p90'; state.method = 'bca'; state.conf = 0.95; state.B = 2000; } },
  custom: { name: 'Use my own data', icon: '\u{2699}',
    story: 'Edit the inputs to your own values and pick any statistic, including a custom function.',
    apply: function(){} }
};

function syncInputs(){
  $('data-input').value = state.data;
  $('B-input').value = state.B;
  $('seed-input').value = state.seed;
  var sel = $('banner-stat-select'); if (sel) sel.value = state.stat;
  $('custom-fn-row').style.display = state.stat === 'custom' ? '' : 'none';
  document.querySelectorAll('.mode').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-mode') === state.stat); });
  document.querySelectorAll('#method-picker .pill').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-method') === state.method); });
  document.querySelectorAll('#conf-picker .pill').forEach(function(b){ b.classList.toggle('on', Math.abs(+b.getAttribute('data-conf') - state.conf) < 0.005); });
}
function loadScenario(key){
  var s = SCENARIOS[key]; if (!s) return;
  document.querySelectorAll('.scechip').forEach(function(c){ c.classList.toggle('active', c.getAttribute('data-scenario') === key); });
  s.apply();
  syncInputs();
  var ctx = $('scenario-context');
  if (key !== 'custom'){
    if ($('sc-icon')) $('sc-icon').textContent = s.icon;
    if ($('sc-title')) $('sc-title').textContent = s.name;
    if ($('sc-story')) $('sc-story').textContent = s.story;
    if (ctx) ctx.classList.add('show');
  } else if (ctx){ ctx.classList.remove('show'); }
  recompute();
}
function clearScenario(){
  document.querySelectorAll('.scechip').forEach(function(c){ c.classList.remove('active'); });
  var ctx = $('scenario-context'); if (ctx) ctx.classList.remove('show');
}
