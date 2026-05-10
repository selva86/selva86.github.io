# Asset Track: Calculators

**Total:** 78 (28 live + 50 net new)
**Companion-post pairing:** every calculator ships with a 1500-word `/X-Calculator-Guide.html` Core post. Calculator captures transactional intent ("p value calculator"); companion captures informational ("how to calculate p value"). Both cross-link.

URL patterns:
- Calculator: `/tools/<slug>.html`
- Companion: `/<Slug-Capitalized>-Calculator-Guide.html` (Core post, sidebar listed)

Tracking: `Plans/PSEO/asset-tracker.json` (under `calculators.live_existing` and `calculators.net_new`).

Companion posts tracked separately in `curriculum-status.json` as Core type.

---

## Live (28)

| Slug | Subcategory | Companion guide |
|---|---|---|
| ab-test-calculator | experiment | (backfill) AB-Test-Calculator-Guide |
| anova-output-interpreter | interpreter | (backfill) ANOVA-Output-Interpreter-Guide |
| bayes-factor-calculator | bayesian | (backfill) Bayes-Factor-Calculator-Guide |
| bayes-theorem-calculator | probability | (backfill) Bayes-Theorem-Calculator-Guide |
| bootstrap-ci-calculator | interval | (backfill) Bootstrap-CI-Calculator-Guide |
| chi-square-calculator | test | (backfill) Chi-Square-Calculator-Guide |
| confidence-interval-calculator | interval | (backfill) Confidence-Interval-Calculator-Guide |
| confusion-matrix-interpreter | ml-eval | (backfill) Confusion-Matrix-Interpreter-Guide |
| dag-confounder-picker | causal | (backfill) DAG-Confounder-Picker-Guide |
| diagnostic-plot-interpreter | interpreter | (backfill) Diagnostic-Plot-Interpreter-Guide |
| effect-size-converter | effect-size | (backfill) Effect-Size-Converter-Guide |
| equivalence-noninferiority-calculator | test | (backfill) Equivalence-Noninferiority-Calculator-Guide |
| glm-output-interpreter | interpreter | (backfill) GLM-Output-Interpreter-Guide |
| lm-output-interpreter | interpreter | (backfill) LM-Output-Interpreter-Guide |
| multiple-testing-correction | test | (backfill) Multiple-Testing-Correction-Guide |
| nonparametric-test-picker | picker | (backfill) Nonparametric-Test-Picker-Guide |
| normality-test-picker | picker | (backfill) Normality-Test-Picker-Guide |
| outlier-detection-calculator | diagnostic | (backfill) Outlier-Detection-Calculator-Guide |
| power-analysis | power | (backfill) Power-Analysis-Calculator-Guide |
| reprex-builder | utility | (backfill) Reprex-Builder-Guide |
| roc-auc-calculator | ml-eval | (backfill) ROC-AUC-Calculator-Guide |
| survival-power-calculator | power | (backfill) Survival-Power-Calculator-Guide |
| t-test-calculator | test | (backfill) t-Test-Calculator-Guide |
| ts-stationarity-calculator | time-series | (backfill) TS-Stationarity-Calculator-Guide |
| type-i-ii-error-visualizer | concept | (backfill) Type-I-II-Error-Visualizer-Guide |
| vif-interpreter | diagnostic | (backfill) VIF-Interpreter-Guide |
| z-score-percentile | descriptive | (backfill) Z-Score-Percentile-Guide |

**Companion-post backfill:** 28 calculators currently ship without companion posts. Backfill is a Wave-1 task; one companion post per existing calculator. See `ops/refresh-policy.md` for the backfill playbook.

---

## Net new (50)

### Distribution probability (15)

| Slug | Target keyword | Companion guide slug |
|---|---|---|
| normal-distribution-calculator | normal distribution calculator | Normal-Distribution-Calculator-Guide |
| binomial-distribution-calculator | binomial distribution calculator | Binomial-Distribution-Calculator-Guide |
| poisson-distribution-calculator | poisson distribution calculator | Poisson-Distribution-Calculator-Guide |
| t-distribution-calculator | t distribution calculator | t-Distribution-Calculator-Guide |
| f-distribution-calculator | f distribution calculator | F-Distribution-Calculator-Guide |
| chi-square-distribution-calculator | chi square distribution calculator | Chi-Square-Distribution-Calculator-Guide |
| beta-distribution-calculator | beta distribution calculator | Beta-Distribution-Calculator-Guide |
| gamma-distribution-calculator | gamma distribution calculator | Gamma-Distribution-Calculator-Guide |
| exponential-distribution-calculator | exponential distribution calculator | Exponential-Distribution-Calculator-Guide |
| uniform-distribution-calculator | uniform distribution calculator | Uniform-Distribution-Calculator-Guide |
| lognormal-distribution-calculator | lognormal distribution calculator | Lognormal-Distribution-Calculator-Guide |
| weibull-distribution-calculator | weibull distribution calculator | Weibull-Distribution-Calculator-Guide |
| negative-binomial-calculator | negative binomial calculator | Negative-Binomial-Calculator-Guide |
| geometric-distribution-calculator | geometric distribution calculator | Geometric-Distribution-Calculator-Guide |
| hypergeometric-distribution-calculator | hypergeometric distribution calculator | Hypergeometric-Distribution-Calculator-Guide |

### Inferential test (15)

| Slug | Target keyword | Companion guide |
|---|---|---|
| z-test-calculator | z test calculator | Z-Test-Calculator-Guide |
| one-proportion-z-test-calculator | one proportion z test | One-Proportion-Z-Test-Calculator-Guide |
| two-proportion-z-test-calculator | two proportion z test | Two-Proportion-Z-Test-Calculator-Guide |
| welch-t-test-calculator | welch t test calculator | Welch-t-Test-Calculator-Guide |
| mann-whitney-u-calculator | mann whitney u calculator | Mann-Whitney-U-Calculator-Guide |
| wilcoxon-signed-rank-calculator | wilcoxon signed rank calculator | Wilcoxon-Signed-Rank-Calculator-Guide |
| kruskal-wallis-calculator | kruskal wallis calculator | Kruskal-Wallis-Calculator-Guide |
| friedman-test-calculator | friedman test calculator | Friedman-Test-Calculator-Guide |
| mcnemar-test-calculator | mcnemar test calculator | McNemar-Test-Calculator-Guide |
| fisher-exact-calculator | fisher exact test calculator | Fisher-Exact-Calculator-Guide |
| spearman-correlation-calculator | spearman correlation calculator | Spearman-Correlation-Calculator-Guide |
| kendall-tau-calculator | kendall tau calculator | Kendall-Tau-Calculator-Guide |
| ancova-calculator | ancova calculator | ANCOVA-Calculator-Guide |
| manova-calculator | manova calculator | MANOVA-Calculator-Guide |
| repeated-measures-anova-calculator | repeated measures anova calculator | Repeated-Measures-ANOVA-Calculator-Guide |

### Power and sample size (5)

| Slug | Target keyword | Companion guide |
|---|---|---|
| survey-sample-size-calculator | survey sample size calculator | Survey-Sample-Size-Calculator-Guide |
| ab-test-mde-calculator | minimum detectable effect calculator | AB-Test-MDE-Calculator-Guide |
| two-proportion-power-calculator | two proportion power calculator | Two-Proportion-Power-Calculator-Guide |
| correlation-power-calculator | correlation power calculator | Correlation-Power-Calculator-Guide |
| cluster-rct-power-calculator | cluster rct power calculator | Cluster-RCT-Power-Calculator-Guide |

### Diagnostic and agreement (5)

| Slug | Target keyword | Companion guide |
|---|---|---|
| diagnostic-accuracy-calculator | sensitivity specificity calculator | Diagnostic-Accuracy-Calculator-Guide |
| cohen-kappa-calculator | cohen kappa calculator | Cohen-Kappa-Calculator-Guide |
| icc-calculator | icc calculator | ICC-Calculator-Guide |
| cronbach-alpha-calculator | cronbach alpha calculator | Cronbach-Alpha-Calculator-Guide |
| bland-altman-calculator | bland altman calculator | Bland-Altman-Calculator-Guide |

### Effect size and intervals (5)

| Slug | Target keyword | Companion guide |
|---|---|---|
| eta-omega-squared-calculator | eta squared calculator | Eta-Omega-Squared-Calculator-Guide |
| cliff-delta-calculator | cliff delta calculator | Cliff-Delta-Calculator-Guide |
| tolerance-interval-calculator | tolerance interval calculator | Tolerance-Interval-Calculator-Guide |
| prediction-interval-calculator | prediction interval calculator | Prediction-Interval-Calculator-Guide |
| five-number-summary-calculator | five number summary calculator | Five-Number-Summary-Calculator-Guide |

### Time-series (4)

| Slug | Target keyword | Companion guide |
|---|---|---|
| adf-kpss-calculator | adf kpss calculator | ADF-KPSS-Calculator-Guide |
| ljung-box-calculator | ljung box test calculator | Ljung-Box-Calculator-Guide |
| box-cox-lambda-calculator | box cox lambda calculator | Box-Cox-Lambda-Calculator-Guide |
| acf-pacf-visualizer | acf pacf calculator | ACF-PACF-Visualizer-Guide |

### Model selection (3)

| Slug | Target keyword | Companion guide |
|---|---|---|
| aic-bic-calculator | aic bic calculator | AIC-BIC-Calculator-Guide |
| waic-loo-calculator | waic loo calculator | WAIC-LOO-Calculator-Guide |
| likelihood-ratio-test-calculator | likelihood ratio test calculator | Likelihood-Ratio-Test-Calculator-Guide |

### Visual sims (6)

These are calculator-as-experience pages. Each is interactive, embeds animated visuals, and includes parameter sliders. Highest engagement-per-visit on the calculator surface.

| Slug | Target keyword | Companion guide |
|---|---|---|
| clt-animator | central limit theorem simulator | CLT-Animator-Guide |
| bootstrap-visualizer | bootstrap visualization | Bootstrap-Visualizer-Guide |
| k-fold-cv-simulator | k fold cross validation simulator | K-Fold-CV-Simulator-Guide |
| mcmc-convergence-demo | mcmc convergence visualization | MCMC-Convergence-Demo-Guide |
| posterior-updater | bayesian posterior calculator | Posterior-Updater-Guide |
| p-hacking-simulator | p hacking simulator | P-Hacking-Simulator-Guide |

---

## Build / publish notes

**Per calculator:**
1. Build interactive page in `/tools/<slug>.html` (use existing tool template; React or vanilla JS, no R runtime needed for client-side stat math)
2. Write companion 1500-word post in `posts/<Companion-Slug>.md`
3. Cross-link: calculator page links to companion in a "Learn more about X" block; companion links to calculator with a "Try the X Calculator" CTA
4. Tag both with shared `target_keyword` cluster for the auto-link engine
5. Schema: `SoftwareApplication` JSON-LD on calculator; `HowTo` + `Article` on companion
6. Sidebar: companion post listed under appropriate learning path (e.g., `Statistics > Inference`); calculator listed in `tools/index.html` only

**Quality bar (per calculator):**
- Loads in <1s on 4G
- All inputs validate without alerts
- Mobile-responsive
- Includes 3 worked examples on the page itself
- Result block displays formula used + R code equivalent
- Cites at least 1 reference for the methodology

**Quality bar (per companion):**
- 1500 +/- 200 words
- 1 R code block (worked example matching calculator's default inputs)
- Decision-tree diagram or flowchart (Mermaid rendered to webp)
- FAQ section with 5+ questions
- Cross-links to: parent post (e.g., `Statistical-Tests-in-R.html`), calculator, related calculators, related FR posts
