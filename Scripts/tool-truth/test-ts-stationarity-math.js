/* Node gate: tools/lib/timeseries-math.js vs Scripts/tool-truth/ts-stationarity.json
   Verifies every ADF / KPSS(Level,Trend,long) / PP(Z-alpha,Z-t) / ndiffs / acf /
   pacf case at <=1e-6 relative (statistics) and exact (integer lags, ndiffs).
   Run: node Scripts/tool-truth/test-ts-stationarity-math.js */
'use strict';
const fs = require('fs');
const path = require('path');
const TS = require(path.join(__dirname, '..', '..', 'tools', 'lib', 'timeseries-math.js'));
const truth = JSON.parse(fs.readFileSync(path.join(__dirname, 'ts-stationarity.json'), 'utf8'));

let pass = 0, fail = 0;
const fails = [];
const REL = 1e-6;

function rel(a, b) {
  if (a === b) return 0;
  if (!isFinite(a) || !isFinite(b)) return Infinity;
  const d = Math.abs(a - b), s = Math.max(Math.abs(a), Math.abs(b));
  return s < 1e-12 ? d : d / s;
}
function chk(name, got, exp, tol) {
  tol = tol == null ? REL : tol;
  if (exp == null) return;                 // R produced no value (edge) -> skip
  if (got == null || isNaN(got)) { fail++; fails.push(`${name}: got ${got}, exp ${exp}`); return; }
  const r = rel(got, exp);
  if (r <= tol) pass++;
  else { fail++; fails.push(`${name}: got ${got}, exp ${exp} (rel ${r.toExponential(2)})`); }
}
function chkInt(name, got, exp) {
  if (exp == null) return;
  if (got === exp) pass++; else { fail++; fails.push(`${name}: got ${got}, exp ${exp}`); }
}

for (const key of Object.keys(truth)) {
  const c = truth[key];
  const x = c.series;
  if (!x) continue;

  // Constant / degenerate series: the tool guards these (constant verdict,
  // d=0, no test numbers shown) because R's tests on a flat line are pure
  // float noise (residuals ~1e-15). Only the differencing decision is defined.
  const degenerate = TS.isConstant(x);
  if (degenerate) { chkInt(`${key} ndiffs.kpss`, TS.ndiffs(x, { test: 'kpss', type: 'level' }), c.ndiffs_kpss); continue; }

  // ADF (skip constant: R returns NaN there)
  if (c.adf && c.adf.statistic != null) {
    const r = TS.adf(x);
    if (r.error) { fail++; fails.push(`${key} adf: ${r.error}`); }
    else { chk(`${key} adf.stat`, r.statistic, c.adf.statistic); chkInt(`${key} adf.lag`, r.lag, c.adf.lag); chk(`${key} adf.p`, r.p, c.adf.p); }
  }

  // KPSS Level / Trend / Level-long
  const kpssCases = [
    ['kpss_level', { null_: 'Level', lshort: true }],
    ['kpss_trend', { null_: 'Trend', lshort: true }],
    ['kpss_level_long', { null_: 'Level', lshort: false }]
  ];
  for (const [fld, opt] of kpssCases) {
    const t = c[fld];
    if (t && t.statistic != null && isFinite(t.statistic) && !c.constant) {
      const r = TS.kpss(x, opt);
      chk(`${key} ${fld}.stat`, r.statistic, t.statistic);
      chkInt(`${key} ${fld}.lag`, r.lag, t.lag);
      chk(`${key} ${fld}.p`, r.p, t.p);
    }
  }

  // Phillips-Perron
  if (c.pp_alpha && c.pp_alpha.statistic != null && !c.constant) {
    const r = TS.pp(x, { type: 'Z(alpha)', lshort: true });
    chk(`${key} pp_alpha.stat`, r.statistic, c.pp_alpha.statistic);
    chkInt(`${key} pp_alpha.lag`, r.lag, c.pp_alpha.lag);
    chk(`${key} pp_alpha.p`, r.p, c.pp_alpha.p);
  }
  if (c.pp_talpha && c.pp_talpha.statistic != null && !c.constant) {
    const r = TS.pp(x, { type: 'Z(t_alpha)', lshort: true });
    chk(`${key} pp_talpha.stat`, r.statistic, c.pp_talpha.statistic);
    chkInt(`${key} pp_talpha.lag`, r.lag, c.pp_talpha.lag);
    chk(`${key} pp_talpha.p`, r.p, c.pp_talpha.p);
  }

  // ndiffs (kpss level + trend)
  chkInt(`${key} ndiffs.kpss.level`, TS.ndiffs(x, { test: 'kpss', type: 'level' }), c.ndiffs_kpss);
  chkInt(`${key} ndiffs.kpss.trend`, TS.ndiffs(x, { test: 'kpss', type: 'trend' }), c.ndiffs_kpss_trend);

  // ACF / PACF
  if (c.acf) {
    const r = TS.acf(x, c.acf.lagmax);
    chkInt(`${key} acf.lagmax`, r.lagmax, c.acf.lagmax);
    for (let k = 0; k <= c.acf.lagmax; k++) chk(`${key} acf[${k}]`, r.values[k], c.acf.values[k]);
  }
  if (c.pacf) {
    const r = TS.pacf(x, c.pacf.lagmax);
    chkInt(`${key} pacf.lagmax`, r.lagmax, c.pacf.lagmax);
    for (let k = 0; k < c.pacf.lagmax; k++) chk(`${key} pacf[${k + 1}]`, r.values[k], c.pacf.values[k]);
  }
}

console.log(`\n  timeseries-math vs R truth: ${pass} passed, ${fail} failed`);
if (fail) { console.log('  FAILURES (first 40):'); fails.slice(0, 40).forEach(f => console.log('   - ' + f)); process.exit(1); }
console.log('  ALL GREEN (<=1e-6)\n');
