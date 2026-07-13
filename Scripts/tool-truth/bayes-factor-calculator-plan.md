# bayes-factor-calculator v2 rebuild - plan, parity, and math verification

Rebuilt `tools/bayes-factor-calculator.html` from the v1-era WebR page to the v2
R-verified standard. Branch `tools-v2`.

## Pass 0 - feature inventory + parity (v1 -> v2)

| v1 capability | v2 status |
|---|---|
| 6 modes: two-sample t, one-sample t, two-proportion, correlation, one-way ANOVA, linear regression | KEPT (all 6) |
| Input formats: summary + t-statistic (t-tests); F-form + R2-form (regression); summary (prop/cor/anova) | KEPT |
| Single global rscale knob: narrow 0.5 / medium 0.707 / wide 1.0 / ultrawide 1.414 applied to every mode | REPLACED with family-aware presets that equal BayesFactor's named scales per family (see below) - correctness upgrade |
| BF10 vs BF01 toggle | KEPT |
| 8 scenario presets (moderate, extreme, null, paired, prop, cor, anova, regression) | KEPT |
| Posterior P(H1) under 50/50 prior | KEPT |
| Side-by-side frequentist p-value | KEPT (t two-sided, prop z-test, cor t, anova/reg F) |
| Sensitivity-to-prior plot | KEPT, now family-aware axis (Cauchy r / g-prior r / beta kappa / Dirichlet a) |
| R code emitter | KEPT and CORRECTED (see math fixes) |
| Primer + method column + anatomy + caveats + FAQ + further reading | KEPT |
| Live in-browser WebR run/reset buttons + output pane | DROPPED with reason: v2 standard is a static COPY-READY R block; the in-browser R runtime is never named and the numbers come from the R-verified JS lib |
| (none) Google Analytics | ADDED consent-mode GA4 + consent-banner (v1 had no gtag) |
| (none) shared math lib | ADDED tools/lib/bayes-factor-math.js (UMD, R-verified) |
| (none) input validation | ADDED plain-English domain messages (r in (-1,1), x<=n, N>p+1, ...) |

### Family-aware prior presets (numeric = BayesFactor named-scale value)

- t-test:     medium sqrt(2)/2 . wide 1 . ultrawide sqrt(2)
- regression: medium sqrt(2)/4 . wide 1/2 . ultrawide sqrt(2)/2
- ANOVA:      medium 1/2 . wide sqrt(2)/2 . ultrawide 1
- correlation: narrow 1/sqrt(27) . medium 1/3 . wide 1/sqrt(3) . ultrawide 1
- proportion: Dirichlet concentration a = 1 (uniform, default) / 2 / 5

The v1 "narrow r=0.5" preset was dropped for the t/regression/ANOVA families: it
is not a BayesFactor named scale, and the old single knob silently mislabeled the
non-t families. The numeric value is passed identically to the JS lib and the
emitted R code, so the shown BF always matches the R.

## Pass 1 - R truth table

`Scripts/tool-truth/bayes-factor-calculator.R` -> `bayes-factor-calculator.json`,
48 cases across all 6 modes, all prior scales, and edge cases (t=0, tiny n, huge
effects, x=0, equal rates, x=n, negative r). Ground truth = BayesFactor 0.9.12-4.8:

- t-tests    -> `ttest.tstat(t, n1, n2, rscale, simple=TRUE)`
- regression -> `linearReg.R2stat(N, p, R2, rscale, simple=TRUE)`
- ANOVA      -> `linearReg.R2stat` from R2 = F*df1/(F*df1+df2)
- correlation -> `.bf10Exact(n, r, kappa)` (== public `correlationBF`, cross-checked)
- two-prop   -> `contingencyIndepMultinomial` (== public `contingencyTableBF(indepMulti)`, cross-checked)

Cross-checks in the JSON confirm the internal functions equal the public
`correlationBF` / `contingencyTableBF` to 15 digits.

## Pass 2 - math library

`tools/lib/bayes-factor-math.js` (UMD). Node harness
`test-bayes-factor-calculator-math.js` gates every case at <=1e-6 relative:
**48/48 pass, worst relative error 2.05e-9.**

- t / regression / ANOVA: JZS / Zellner-Siow g-prior integrated on log(g) by a
  deterministic mode-centred composite Simpson rule (fixed grid, always
  terminates - a naive recursive adaptive Simpson blew up to 2^50 on sharp peaks
  because its halving tolerance underflowed machine precision).
- correlation: exact analytic BF via a log-space Gauss 2F1 series (Ly et al. 2016).
- two-proportion: exact Gunel-Dickey Dirichlet closed form (log-Gamma).
- 15-term Lanczos lgamma so large-argument differences stay accurate.

### Math correctness fixes vs v1 (all silent v1 bugs)

1. **two-proportion**: v1 computed a **beta-binomial** BF that did NOT match the
   `contingencyTableBF(sampleType="indepMulti")` its own R code told users to run.
   v2 reproduces the independent-multinomial contingency BF exactly.
2. **correlation**: v1 used a hand-rolled numerical integration of a reduced
   likelihood. v2 uses the exact analytic BF, matching `correlationBF` to 15 digits.
3. **ANOVA**: v1 labeled the mode "one-way ANOVA" and its copy claimed to mirror
   `anovaBF`, but it computed the regression R2-route BF (differs from `anovaBF`
   by ~10-20% because of a different effect prior). v2 keeps the exact,
   summary-stat-reproducible R2-route BF but frames it honestly on-page and emits
   `linearReg.R2stat` with a numeric rscale plus an `anovaBF` note.

## Pass 4 - gates

1. Local Playwright E2E: all 48 truth cases verified through the full DOM compute
   pipeline (numeric + rendered `#result-bounds`); worst rel 2.05e-9.
2. Chrome: exactly 1 injected chrome, 0 own mastheads, 0 data-tool-v2, canonical
   `.sitenav`, sidebar + rail-fold present.
3. Mobile 390px: scrollWidth 375 <= innerWidth 390 (no horizontal overflow).
4. Interactivity: mode / prior / direction selects, scenario chips, copy button
   (toast + tool_copy), sensitivity viz all update live.
5. Input validation: out-of-domain inputs show a plain-English message, clear the
   viz, and recover when fixed. Zero real console errors (CF-beacon CORS on
   localhost excepted).
