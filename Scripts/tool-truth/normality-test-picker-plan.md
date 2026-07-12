# normality-test-picker - v2 R-verified rebuild plan

Rebuild of `tools/normality-test-picker.html` to the current Tool Farm v2 bar:
math extracted into an R-verified UMD library, everything else preserved.

## Pass 0 - Feature inventory (predecessor: the shipped v2 page)

The page was already on the Lab sheet shell with rich UX. Every capability is
preserved (parity), and the math is now R-verified rather than inline.

| Capability | Old | v2 rebuild |
|---|---|---|
| Tests: Shapiro-Wilk, Anderson-Darling, Lilliefors, Jarque-Bera, Q-Q plot | yes | yes (all kept) |
| 6 scenario presets (small / large / skewed / heavy / logfix / custom) | yes | yes |
| "I want to test ... using ... at alpha" banner (mode selector) | yes | yes |
| Tool lead under H1 | yes | yes |
| Live inference line after results | yes | yes |
| Q-Q plot + histogram viz with n/skew/kurt sliders | yes | yes |
| Method column (use-when / example / inputs) | yes | yes |
| Callouts (over-rejection at large n, under-power at small n) | yes | yes |
| Runnable R-code emitter (shapiro.test / ad.test / lillie.test / jarque.bera.test) | yes | yes |
| How-computed recap + anatomy | yes | yes |
| Primer dropdown + pre-flight | yes | yes |

Nothing dropped. Every displayed number is now backed by the verified lib.

## Pass 1 - R truth table

`normality-test-picker.R` -> `normality-test-picker.json`, 54 cases, bit-exact
vectors (%.17g round-trip so R and JS see identical doubles):
- shapiro.test (base stats): n = 3..5000, normal / lognormal / t3 / uniform /
  exp / bimodal, plus constant (errors).
- ad.test (nortest): n = 8 (min) .. 500, incl. n = 7 (errors) and AA in each
  p-value branch.
- lillie.test (nortest): n = 5 (min) .. 500, incl. n = 100/101 boundary
  (the n>100 scaling), n = 4 (errors), and KK in each small-sample branch.
- jarque.bera.test (tseries): n = 4..500.
Ground truth: local R 4.6.0 + nortest 1.0-4 + tseries 0.10-61.

## Pass 2 - math library (tools/lib/normality-math.js, UMD)

Reuses `normal-math.js` (pnorm/qnorm/lgamma/gammq, verified vs R). Faithful ports.

Node harness `test-normality-test-picker-math.js`: **54/54 pass**, worst stat
relerr 7.4e-13, worst p relerr 0 (gate: stat <= 1e-6 rel; p <= 1e-6 rel or 1e-9 abs).

### Bugs in the old inline math that the R-verified port fixes
1. **Shapiro-Wilk W** - old code used the largest expected order statistic `cn`
   as the weight-polynomial argument; Royston AS R94 uses `1/sqrt(n)`. W was off.
   Now a verbatim port of R's swilk.c.
2. **Shapiro-Wilk n = 3** - old code returned p = NaN; R has an exact closed
   form `pw = (6/pi)(asin(sqrt(W)) - asin(sqrt(3/4)))`. Fixed.
3. **Lilliefors p-value** - old code used a single `exp(-7.01256 Kd^2 + ...)`
   fit; nortest uses the Molin-Abdi analytic p-value plus a KK 4th-degree
   polynomial correction when p > 0.1. Old p-values were wrong. Fixed.
4. **Anderson-Darling statistic** - old code reported the adjusted A^2* as the
   statistic; R's ad.test reports the unadjusted A and uses A^2* only for the
   p-value. Label + value corrected to match R.
5. **Anderson-Darling min n** - old code allowed n >= 5; nortest requires n >= 8.
   Aligned (and tails now use log-space normal CDFs for accuracy).
6. **Precision** - old inline pnorm was a ~1e-7 rational approximation; the lib
   uses normal-math's erfc-based pnorm (~machine precision), which also tightens AD/Lilliefors.

## Pass 3 - page wiring

Inline math (pnorm/qnorm/logGamma/gamma*/chiSqUpper/parseData/summaryStats and
the four tests) replaced with thin delegators to `window.NormalityMath`; two
script tags added (normal-math.js then normality-math.js). AD stat label
A^2* -> A^2. Numerical-accuracy note rewritten to "verified against R 4.6.0".
dateModified -> 2026-07-13, softwareVersion 2.1.

## Pass 4 - gates

- Local Playwright E2E on http.server: both libs load; **54/54** rendered cases
  match R (worst stat relerr 7.4e-13); 4 representative cases driven through the
  full UI (data paste -> test select) render correct stat / p / verdict / inference.
- Console: only the localhost-only artifacts (auth /api/me 404, CF beacon CORS) - excepted.
- Chrome: exactly 1 injected chrome, 0 own mastheads, 1 canonical `nav.sitenav`,
  438 sidebar links, rail-fold present; tool-lead + banner + inference all present.
- Mobile 390px: documentElement.scrollWidth 375 <= 391, no horizontal overflow.
- R-code reproduction: emitted shapiro.test / lillie.test on the shown data
  reproduce the displayed W/D and p exactly.
- Parity: every Pass 0 capability retained.
