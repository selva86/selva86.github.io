# Wave 3 tools queue (owner-approved 2026-07-14)

Build AFTER the current re-skin queue (6 remaining) + final 37-page audit sweep.
Pipeline: the write-tool SKILL as-is (R truth table, UMD lib or reuse, Lab-sheet shell,
full gate incl. design fingerprint, preview -> master -> prod). One worker at a time.
Every page: matches-R-exactly trust line + shows-work teaching angle is the differentiator.

## Tier 1 - high-volume calculators, near-free on existing verified libs

| # | slug | notes / reuse |
|---|---|---|
| 1 | normal-distribution-calculator | area between/outside bounds, inverse lookup, shaded curve; normal-math |
| 2 | linear-regression-calculator | paste x,y -> fit, equation, R2, residuals, plot; data-parse + lm-math |
| 3 | anova-calculator | one-way/two-way from raw pasted groups (distinct from aov interpreter); anova-math + data-parse |
| 4 | fisher-exact-test-calculator | machinery R-verified in odds-ratio suite; GraphPad-owned keyword, worse UX |
| 5 | margin-of-error-calculator | survey/marketing audience; ci-math |
| 6 | binomial-probability-calculator | exact + cumulative, distribution bars |
| 7 | percentile-calculator | paste data -> percentiles / percentile-of-value; pairs with z-score |
| 8 | iqr-calculator | quartiles + 1.5xIQR outlier flags; descriptive-math |
| 9 | standard-deviation-calculator | competitive head term but near-zero cost; ship cheap, let it climb |
| 10 | mean-median-mode-calculator | same cluster, same economics |

## Tier 2 - reliability/agreement cluster + remaining tables + sample-size family

| # | slug | notes |
|---|---|---|
| 11 | cohens-kappa-calculator | rater agreement; psych truth; sibling to Cronbach |
| 12 | icc-calculator | ICC(1,1)..ICC(3,k); no good interactive tool exists |
| 13 | binomial-table | printable + interactive, t/z-table pattern |
| 14 | pearson-critical-values-table | the "r table"; tiny competition; correlation-math |
| 15a | sample-size-t-test-calculator | long-tail first per standing plan; power-math |
| 15b | sample-size-proportion-calculator | power-math |
| 15c | sample-size-anova-calculator | power-math |
| 15d | sample-size-calculator | the hub page, built LAST of the family, links the three |

## Tier 3 - interpreter moat (low volume, zero competition, link magnets)

| # | slug | notes |
|---|---|---|
| 16 | lmer-output-interpreter | mixed-effects summary() decoded; strongest moat candidate |
| 17 | coxph-output-interpreter | hazard ratios in plain English; pairs with survival-power |
| 18 | post-hoc-calculator | TukeyHSD/Bonferroni/Dunn from group data; the "what now?" after ANOVA |
| 19 | meta-analysis-quick-tool | fixed/random effects + forest plot vs metafor truth; citation magnet |
| 20 | prediction-interval-calculator | from fitted regression; the PI-vs-CI confusion IS the teaching hook |

## Bayesian group

| # | slug | notes |
|---|---|---|
| B1 | bayesian-ab-test-calculator | Beta posteriors, P(B>A), expected loss, lift credible intervals, stopping read. MUST own the DECISION WORKFLOW (loss thresholds, when-to-stop), not repeat the A/B tool's Bayesian math |
| B2 | posterior-calculator | conjugate explorer: Beta-Binomial, Normal-Normal, Gamma-Poisson; credible-vs-confidence hook; cross-link Bayesian Foundations sidebar cluster |
| B3 | bayesian-output-interpreter | brms/rstanarm summary decoded incl. Rhat, ESS, divergences WITH fixes; nothing like it exists |
| B4 | beta-distribution-calculator | PDF/CDF/quantiles, shaded curve; rounds out the distribution family |

Passed deliberately: Bayesian sample-size/assurance (pharma-thin), naive-Bayes demo (lesson-widget material, not a tool).

## Keyword gaps (capability exists, term-owning page doesn't)

| # | slug | notes |
|---|---|---|
| G1 | proportion-test-calculator | one- AND two-proportion z-tests, classroom framing (A/B tool never wins the classroom query); normal-math |
| G2 | poisson-distribution-calculator | same pattern as binomial/normal |
| G3 | correlation-matrix-calculator | paste multi-column -> matrix + heatmap + significance stars; data-parse multi-col |
| G4 | acf-pacf-plotter | with ARIMA order suggestion; DECIDE AT BUILD: new page vs extension of ts-stationarity |
| G5 | box-plot-calculator | five-number summary + live boxplot; owns both phrasings |
| G6 | empirical-rule-calculator | 68-95-99.7; homework volume; trivial on normal-math |
| G7 | statistical-significance-calculator | big head term mapping to the A/B math; own landing framed for the generic query |

## Build order

Tier 1 (1-10) -> keyword gaps G1, G2, G5, G6, G7 (cheap, high volume) -> Tier 2 (11-15d)
-> G3, G4 -> Bayesian B4, B1, B2 -> Tier 3 (16-20) -> B3.
Rationale: volume-per-effort first; interpreters last (they take the longest and earn on links, not SERPs).

## Standing specials (outside this queue)

- r-error-decoder: gated on the ~Aug 4 GSC read of the 7 validation pages.
- ggplot2-theme-builder: hand-build showpiece, own design session.

Registration reminders per tool: COMPENDIUM_TOOLS + icon in build.py, CATEGORIES in
gen_tools_landing.py, C3META card, content-hash ?v pins on any lib, page_audit tool-list.json.
