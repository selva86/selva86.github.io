# The nurture email sequence, v1

Two parts, kept separate on purpose. **Part 1** is the owner's list: 47
topics people were actively reading (Google Analytics realtime, 2026-08-13),
put in sending order. **Part 2** is the corpus additions I found with the
same appeal profile - each row is select/deselect for the owner; nothing
from Part 2 is committed until ticked. The final interleaved calendar gets
assembled after selection. Supersedes the persona-queue model in
`nurture-topics-curated.md` (kept as the scan reference). Sunday is the
weekly recap, not a sequence day.

## The ordering logic

1. **Universal first.** The first two weeks build the open habit: inference,
   confidence intervals, power, effect size, plus the two biggest magnets
   (ARIMA, interviews).
2. **Threads, interleaved.** Related topics run as mini-series but never on
   consecutive days; each thread advances roughly weekly ("part 3 lands
   Thursday" anticipation, without drowning anyone).
3. **Deep-niche closes its thread.** PERMANOVA, blavaan, GLMMs arrive last,
   when the remaining readers are exactly the ones who want them.
4. **A treat about every 5th email**: career, capstones, practice sets.
5. **The DA-boredom answer**: one shared stats-forward sequence for everyone
   (the GA data shows this is what people actually read); pure-beginner
   items are conditional inserts, not a separate track.

## Subject-line rules

- Where the blog title already reads like a person talking, USE IT (title).
- Where the title is a chore-label, rewrite as the reader's own moment: the
  symptom they Googled, the question in their head (rw). Plain words, no
  cleverness, cashable by the body in two sentences.

---

## Part 1 - the owner's list, in sending order

Threads: F=foundations, R=regression clinic, T=time series, X=right test,
B=Bayesian, L=latent structure, G=correlated data, S=special/treat.

| # | Thr | Proposed subject | Source post |
|---|---|---|---|
| 0* | S | Write your first R script in 10 minutes (title) | R-Syntax-101 |
| 1 | F | How statistical inference works, no formulas yet (title) | How-Statistical-Inference-Works |
| 2 | F | What a confidence interval really means (rw) | Confidence-Intervals-in-R |
| 3 | T | ARIMA: what AR, I, and MA actually mean (title) | ARIMA-in-R |
| 4 | R | Interaction effects: when one variable changes what another does (rw) | Interaction-Effects-in-R |
| 5 | S | 50 R interview questions and answers (title) | R-Interview-Questions |
| 6 | F | Power analysis: find the sample size you need (title) | Statistical-Power-Analysis-in-R |
| 7 | F | Conditional probability, made concrete (title) | Conditional-Probability-in-R |
| 8 | T | ACF and PACF: how to actually read those plots (rw) | ACF-and-PACF-in-R |
| 9 | R | When two predictors tell the same story (rw: multicollinearity) | Multicollinearity-in-R |
| 10 | X | Group variances unequal? Welch's ANOVA (rw) | Welchs-ANOVA-in-R |
| 11 | S | A survey analysis, end to end (title) | Survey-Analysis-Capstone-in-R |
| 12 | F | Effect size: Cohen's d and friends, explained (title) | Effect-Size-in-R |
| 13 | F | Expected value and variance, explained (title) | Expected-Value-and-Variance-in-R |
| 14 | T | Is your ARIMA model actually okay? Two checks (rw: diagnostics) | ARIMA-Diagnostics-in-R |
| 15 | R | The residual pattern that quietly breaks your p-values (rw: autocorrelation) | Autocorrelation-in-Residuals |
| 16 | X | Mann-Whitney U: when and how to run it (title) | Mann-Whitney-U-Test-in-R |
| 17 | S | Is R worth learning in 2026? The honest answer (title) | Is-R-Worth-Learning-in-2026 |
| 18 | F | Law of Large Numbers vs CLT: the real difference (title) | Law-of-Large-Numbers-vs-CLT-in-R |
| 19 | T | ARIMA with outside information: ARIMAX (rw) | ARIMAX-in-R |
| 20 | R | Robust regression: when outliers bite (title) | Robust-Regression-in-R |
| 21 | X | Fisher's exact test: when and how (title) | Fishers-Exact-Test-in-R |
| 22 | S | R for finance: 25 real practice problems (title) | R-for-Finance-Exercises |
| 23 | F | Permutation tests: exact p-values by shuffling (rw) | Permutation-Tests-in-R |
| 24 | B | Choosing priors: the decision that matters (title) | Choosing-Priors-in-R |
| 25 | R | Find the breakpoint: segmented regression (rw) | Segmented-Regression-in-R |
| 26 | X | After ANOVA: Tukey or Bonferroni? (rw) | Post-Hoc-Tests-After-ANOVA |
| 27 | S | Experimental design: 20 solved problems (title) | Experimental-Design-Exercises-in-R |
| 28 | L | PCA results: what loadings and scores are telling you (rw) | Interpreting-PCA-Results-in-R |
| 29 | R | Count data? Poisson regression, done right (rw) | Poisson-Regression-in-R |
| 30 | T | Cointegration: two series that move together (rw) | Cointegration-in-R |
| 31 | B | Which Bayesian model wins? LOO and WAIC (rw) | Compare-Bayesian-Models-in-R |
| 32 | L | Exploratory factor analysis, step by step (title) | Exploratory-Factor-Analysis-in-R |
| 33 | R | Proportions as outcomes: beta regression (rw) | Beta-Regression-in-R |
| 34 | T | GARCH: forecasting volatility itself (rw) | GARCH-Models-in-R |
| 35 | X | Non-normal AND factorial? The aligned rank transform (rw) | Aligned-Rank-Transform-ANOVA-in-R |
| 36 | G | Siblings, clinics, repeat visits: when data points aren't independent (rw: GEE) | GEE-for-Correlated-Categorical-Data-in-R |
| 37 | R | Ordered categories: ordinal logistic regression (rw) | Ordinal-Logistic-Regression-in-R |
| 38 | T | Did the intervention move the series? CausalImpact (title) | CausalImpact-in-R |
| 39 | G | GEE or mixed models? How to choose (rw) | GEE-vs-Mixed-Models-in-R |
| 40 | R | GAM: let the data draw the curve (rw) | GAM-in-R |
| 41 | S | Optimization in R: methods and practical examples (title) | Optimization-With-R (legacy classic tutorial, exists at root) |
| 42 | R | Dose-response curves with drc (title) | Dose-Response-Analysis-in-R |
| 43 | X | PERMANOVA: ANOVA for whole communities (rw) | Permutation-ANOVA-in-R |
| 44 | T | Forecasting very short (and very long) series (title) | Forecasting-Short-Time-Series-in-R |
| 45 | R | Random slopes and GLMMs: the advanced regression toolkit (rw) | R-Advanced-Regression-Course |
| 46 | B | Bayesian factor analysis with blavaan (title) | Bayesian-Factor-Analysis-in-R |

*#0 is conditional: day one only when `level_r = new`; everyone else starts at #1.

---

## Part 2 - proposed additions (owner: tick to include, strike to drop)

Found by scanning the corpus for siblings of the Part 1 topics: same
demand profile (method pages people land on from search), same beginner-
from-scratch teachability. "Slots" = where it would weave into Part 1's
order; the final calendar is assembled after selection.

| [ ] | Thr | Proposed subject | Source post | Slots |
|---|---|---|---|---|
| [ ] | F | What p-values mean (and what they never meant) (title) | What-p-Values-Mean | after #1 |
| [ ] | R | lm() output, read line by line (title) | Read-lm-Output-in-R | after #3 |
| [ ] | X | Which statistical test? Five questions, one answer (rw) | Which-Statistical-Test-in-R | after #6 |
| [ ] | F | Hypothesis testing: the framework, explained (title) | Hypothesis-Testing-in-R | after #9 |
| [ ] | T | Choosing ARIMA's p, d, q (without guessing) (rw) | How-to-Choose-ARIMA-Order-in-R | after #13 |
| [ ] | R | The five checks before you trust a regression (rw) | Linear-Regression-Assumptions-in-R | after #17 |
| [ ] | T | Is your series stationary? ADF, KPSS, and what to do (rw) | Test-Stationarity-in-R | after #18 |
| [ ] | S | 50 R errors, decoded and fixed (title) | R-Common-Errors | after #21 |
| [ ] | F | Bayes' theorem: the simulation that makes it click (title) | Bayes-Theorem-in-R | after #22 |
| [ ] | R | The five diagnostic plots, and what each one catches (rw) | Regression-Diagnostics-in-R | after #23 |
| [ ] | X | Chi-square tests: which one, and how (rw) | Chi-Square-Tests-in-R | after #25 |
| [ ] | T | auto.arima: how it decides, and when to overrule it (rw) | auto-arima-in-R | after #29 |
| [ ] | S | Missing values: find, remove, or impute? (rw) | Missing-Values-in-R-Detect-Count-Remove-Impute-NA | after #31 |
| [ ] | F | The Central Limit Theorem: see it happen (rw) | Central-Limit-Theorem-in-R | after #32 |
| [ ] | R | Heteroscedasticity: spot it, fix it (rw) | Heteroscedasticity-in-R | after #33 |
| [ ] | T | Holt-Winters: additive or multiplicative? (title) | Holt-Winters-in-R | after #34 |
| [ ] | F | Type I vs Type II errors: the trade-off, visualized (rw) | Type-I-and-Type-II-Errors-in-R | after #38 |
| [ ] | T | Prophet: trend, seasonality, holidays (rw) | Prophet-in-R | after #38 |
| [ ] | B | The Bayesian t-test (rw) | Bayesian-t-Test-in-R | after #24 |
| [ ] | R | One point is steering your whole model (rw: Cook's distance) | Influential-Observations-in-R | after #20 |
| [ ] | S | Survival analysis: time-to-event, from scratch (rw) | R-Survival-Analysis-Course | after #27 |
| [ ] | T | Prediction intervals: honest forecast uncertainty (rw) | Prediction-Intervals-in-R | after #30 |
| [ ] | B | Credible vs confidence intervals (title) | Credible-Intervals-vs-Confidence-Intervals | after #24 |
| [ ] | F | Bootstrap a confidence interval for anything (rw) | Bootstrap-Confidence-Intervals-in-R | after #23 |
| [ ] | R | When Poisson doesn't fit: negative binomial (rw) | Negative-Binomial-Regression-in-R | after #29 |
| [ ] | T | Missing values in time series, without killing the season (rw) | Missing-Values-in-Time-Series-in-R | after #34 |
| [ ] | X | Kruskal-Wallis: nonparametric ANOVA (title) | Kruskal-Wallis-Test-in-R-2 | after #26 |
| [ ] | S | R vs Python: the actual data (title) | R-vs-Python | after #17 |
| [ ] | G | Random intercepts and slopes with lme4 (title) | Random-Intercepts-and-Slopes-in-R | before #36 |
| [ ] | B | brms: Bayesian regression without raw Stan (title) | brms-in-R | after #31 |
| [ ] | X | Repeated measures ANOVA, step by step (title) | Repeated-Measures-ANOVA-in-R | after #35 |
| [ ] | S | Outlier detection: 4 methods compared (title) | Outlier-Detection-in-R | after #20 |
| [ ] | B | Posterior predictive checks, in 5 minutes (title) | Posterior-Predictive-Checks-in-R | after #31 |
| [ ] | L | Clustering: k-means, hierarchical, or DBSCAN (title) | Cluster-Analysis-in-R | after #32 |
| [ ] | F | Which distribution when: a field guide (title) | Which-Distribution-When-in-R | after #28 |
| [ ] | X | When to go nonparametric: a decision guide (rw) | When-to-Use-Nonparametric-Tests-in-R | after #35 |
| [ ] | S | A clinical-style group comparison, end to end (title) | Clinical-Comparison-Capstone-in-R | after #37 |
| [ ] | T | Granger causality and impulse responses (title) | Granger-Causality-in-R | after #38 |
| [ ] | L | SEM and CFA with lavaan: a complete walkthrough (title) | CFA-and-Structural-Equation-Modeling-in-R | after #32 |
| [ ] | F | Significant but meaningless (rw) | Statistical-vs-Practical-Significance | after #26 |
| [ ] | R | Beyond the mean: quantile regression (rw) | Quantile-Regression-in-R-2 | after #40 |
| [ ] | T | VAR: forecasting several series at once (rw) | VAR-Models-in-R | after #44 |
| [ ] | G | lme4 says "failed to converge": five fixes, in order (title) | R-Error-lme4-Convergence | after #39 |
| [ ] | R | Ridge and lasso, explained simply (title) | Ridge-and-Lasso-Regression-in-R | after #40 |
| [ ] | B | Bayesian hierarchical models, explained (title) | Bayesian-Hierarchical-Models-in-R | after #31 |
| [ ] | G | Mixed model inference: p-values and bootstrap (title) | Mixed-Model-Inference-in-R | after #39 |

---

## The lesson-merge plan (the factory queue)

Owner rule, binding for every lesson built from this program: **assume a
beginner, even on the researcher track** - teach from scratch, completely,
in simple language (`_build/lesson-pedagogy.md` law; restated because email
landings are cold traffic). Topics sharing a spine merge into ONE multi-part
lesson; parts are what the emails link to, in sequence. Parts marked [+]
come from Part 2 and drop out automatically if deselected:

| Multi-part lesson | Parts, in email order |
|---|---|
| Inference from zero | how inference works -> [+]p-values -> CIs -> [+]hypothesis framework -> [+]Type I/II -> power -> effect size |
| ARIMA from zero | what ARIMA is -> ACF/PACF -> [+]choosing pdq -> [+]stationarity -> [+]auto.arima -> diagnostics -> ARIMAX |
| Reading model output | [+]lm() line by line -> [+]assumption checks -> [+]diagnostic plots |
| Regression health check | multicollinearity -> autocorrelated residuals -> [+]heteroscedasticity -> [+]Cook's distance -> robust regression |
| Which test do I run? | [+]the flowchart -> Welch's -> Mann-Whitney -> [+]chi-square -> Fisher's -> post-hoc -> [+]Kruskal-Wallis -> [+]repeated measures -> [+]nonparametric guide -> ART |
| Beyond straight lines | segmented -> Poisson -> [+]negative binomial -> beta -> ordinal -> [+]quantile -> [+]ridge/lasso -> GAM |
| Bayesian decisions | [+]Bayes' theorem -> priors -> [+]Bayesian t-test -> [+]credible intervals -> [+]brms -> [+]posterior checks -> LOO/WAIC -> [+]hierarchical -> blavaan |
| Hidden structure | PCA -> EFA -> [+]clustering -> [+]SEM/lavaan |
| Data that clumps | [+]random intercepts/slopes -> GEE -> GEE vs mixed -> [+]convergence fixes -> [+]mixed inference -> GLMMs |
| Resampling | permutation tests -> [+]bootstrap CIs |

Until a lesson part exists, the email links the interactive post (every post
runs code in the browser). Email click-through decides build order within
the queue; a built part earns its email a re-run pointing at the lesson.

## Mechanics (unchanged from the engine build)

Daily send at 13:00 UTC, nurture consent required, ledger key `seq:<n>` per
user (opt-in day = their day 1), one-brain rules apply, Sunday = recap. Pro
stays post-value: free lesson landings, the player chip, the lesson-3 gate,
the 3e wall follow-up.
