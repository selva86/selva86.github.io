# The nurture email sequence, v2

Two parts, kept separate on purpose. **Part 1** is the owner's list: 47
topics people were actively reading (Google Analytics realtime, 2026-08-13),
in sending order. **Part 2** is the corpus additions, select/deselect per
row (five removed by owner 2026-08-13). Sunday is the weekly recap, not a
sequence day.

## Subject-line rule (v2, owner-corrected)

**Name the topic plainly, then the concrete outcome.** No oblique or
symptom-only subjects: if the reader cannot tell what the email is about in
one glance, it fails regardless of how clever it is. The GA titles are the
model: "Power analysis: find the sample size you need." Strong blog titles
are used verbatim (title); rewrites (rw) follow topic + outcome.

## Body style (the compelling hook)

Vintage-Neil-Patel register in the Akshay voice: open with the outcome or
the sharp question, short punchy lines, speak directly to "you", build the
why-this-matters in 3-5 sentences, one link, out. The email sells the
CLICK by selling what the reader will be able to do; the post/lesson does
the teaching. Natural speech, friendly, zero corporate filler.

## The windowed-lesson model (v3, owner-designed 2026-08-13: the free rotation)

Each sequence topic gets a DEDICATED interactive lesson (Pro-grade,
beginner-first, NOT public: noindex, no sitemap, no sidebar - email and
dashboard are its only doors; the public blog post stays live for search).
The daily email is a KEY, not a pointer:

- **The send unlocks the lesson for that user for 3 days.** Real scarcity,
  honestly enforced: after the window, the lesson locks (Pro opens
  everything, forever). Unlimited rereads INSIDE the window - the clock is
  the boundary, never a read counter (owner-settled).
- **The unlock IS the ledger row**: a lesson is open for user U iff their
  `seq:<n>` send is within 72h; Pro bypasses. Derived state, no new tables.
- **The rolling shelf**: daily sends + 3-day windows = ~3 lessons open at
  any moment. The dashboard frames it exactly that way ("Your open lessons")
  and shows the full catalog with locks - desire built from experienced
  value. Window length is a tunable dial (launch 3d; data may argue 4).
- **The expiry page is graceful, never a 404**: what the lesson was, that
  the window was real ("open for you Aug 12-15"), what is open right now,
  and the Pro line. Its traffic feeds intent_signals (purest purchase
  intent in the whole funnel).
- **One scarcity per surface**: lesson content stays meter-exempt; the
  window is the only wall here.
- **Factory runway before launch**: no mixed modes (post links would blur
  the email-is-a-key identity). Hold the sequence launch until ~14 lessons
  exist; keep the factory a week ahead of the calendar. Sequence order =
  build order; click data refines from day 15.
- Back-pocket lever, not launch scope: amnesty reruns ("the five
  most-missed lessons, open again this week") as a re-engagement campaign.

**Badges + the completion ceremony (owner 2026-08-14):**

- Every completed mini course awards a **BADGE** (not a certificate - the
  certificate word stays reserved for track-level credentials, protecting
  their premium meaning). Badge = public verify URL + one-click Add to
  LinkedIn + OG share image, reusing the cert-page machinery. The dashboard
  shows the badge wall (earned in color, unearned gray) beside the catalog.
- **Ceremony order at course completion:** final check passed -> the
  "Why invest in r-statistics.co Pro?" screen (Boot.dev pattern, ALWAYS
  one-tap dismissable) -> the badge ceremony. Guardrails: the badge is
  never conditional on the pitch (dismiss still awards it instantly); Pro
  users skip straight to the badge.
- Why-Pro placement map (refined): slim next-part nudge at each lesson's
  end ("Part 3 unlocks with tomorrow's email - or open it now with Pro");
  the FULL Why-Pro screen once per course at completion; the expiry page;
  locked catalog cards. Post-value at every door.
- Later lever, design-aware now: badge ROLL-UPS - collecting every badge in
  a cluster can mint a real track certificate (the collection's endgame and
  the Pro bridge).

Dashboard nav: once signed in, **Dashboard becomes a navbar tab** (approved;
ships with the profiler/dashboard build increment).

## The ordering logic

Universal first (open-habit weeks), threads interleaved so no topic block
drowns anyone, deep-niche closes each thread, a treat about every 5th email.
One shared stats-forward sequence for all personas; pure-beginner items are
conditional inserts.

---

> 2026-08-16, owner: "lm() output, read line by line" removed from the
> series (was seq 5); everything after renumbered down by one in the live
> registry. The reading-model-output mini course is retitled "Reading
> Regression Models" (parts: interaction effects + the 5 assumption checks).
> The registry (functions/_data/mini-courses.json) is the numbering SSOT.

## Part 1 - the owner's list, in sending order

Threads: F=foundations, R=regression clinic, T=time series, X=right test,
B=Bayesian, L=latent structure, G=correlated data, S=special/treat.

| # | Thr | Subject | Source post |
|---|---|---|---|
| 0* | S | Write your first R script in 10 minutes (title) | R-Syntax-101 |
| 1 | F | How statistical inference works, no formulas yet (title) | How-Statistical-Inference-Works |
| 2 | F | Confidence intervals: what they really mean (title) | Confidence-Intervals-in-R |
| 3 | T | ARIMA: what AR, I, and MA actually mean (title) | ARIMA-in-R |
| 4 | R | Interaction effects: test and interpret them (title) | Interaction-Effects-in-R |
| 5 | S | 50 R interview questions and answers (title) | R-Interview-Questions |
| 6 | F | Power analysis: find the sample size you need (title) | Statistical-Power-Analysis-in-R |
| 7 | F | Conditional probability: P(A given B), made concrete (title) | Conditional-Probability-in-R |
| 8 | T | ACF and PACF: how to read the plots for ARIMA orders (title) | ACF-and-PACF-in-R |
| 9 | R | Multicollinearity: why your coefficients look wrong, and the fix (rw) | Multicollinearity-in-R |
| 10 | X | Welch's ANOVA: the test for unequal group variances (rw) | Welchs-ANOVA-in-R |
| 11 | S | A survey analysis, end to end in R (title) | Survey-Analysis-Capstone-in-R |
| 12 | F | Effect size: Cohen's d and friends, explained (title) | Effect-Size-in-R |
| 13 | F | Expected value and variance, explained (title) | Expected-Value-and-Variance-in-R |
| 14 | T | ARIMA diagnostics: the two checks before you trust a forecast (rw) | ARIMA-Diagnostics-in-R |
| 15 | R | Autocorrelation in residuals: how to test and fix it (title) | Autocorrelation-in-Residuals |
| 16 | X | Mann-Whitney U test: when and how to run it (title) | Mann-Whitney-U-Test-in-R |
| 17 | S | Is R worth learning in 2026? The honest answer (title) | Is-R-Worth-Learning-in-2026 |
| 18 | F | Law of Large Numbers vs CLT: the real difference (title) | Law-of-Large-Numbers-vs-CLT-in-R |
| 19 | T | ARIMAX: add outside variables to your ARIMA forecast (rw) | ARIMAX-in-R |
| 20 | R | Robust regression: when outliers bite (title) | Robust-Regression-in-R |
| 21 | X | Fisher's exact test: when and how, with a worked example (title) | Fishers-Exact-Test-in-R |
| 22 | S | R for finance: 25 real practice problems (title) | R-for-Finance-Exercises |
| 23 | F | Permutation tests: exact p-values without formulas (rw) | Permutation-Tests-in-R |
| 24 | B | Choosing priors: the decision that matters (title) | Choosing-Priors-in-R |
| 25 | R | Segmented regression: find the breakpoints (title) | Segmented-Regression-in-R |
| 26 | X | ANOVA post-hoc tests: Tukey vs Bonferroni (title) | Post-Hoc-Tests-After-ANOVA |
| 27 | S | Experimental design: 20 solved problems (title) | Experimental-Design-Exercises-in-R |
| 28 | L | Interpreting PCA: what loadings and scores mean (rw) | Interpreting-PCA-Results-in-R |
| 29 | R | Poisson regression: model count data right (title) | Poisson-Regression-in-R |
| 30 | T | Cointegration: test when two series move together (rw) | Cointegration-in-R |
| 31 | B | Compare Bayesian models: LOO and WAIC (title) | Compare-Bayesian-Models-in-R |
| 32 | L | Exploratory factor analysis, step by step (title) | Exploratory-Factor-Analysis-in-R |
| 33 | R | Beta regression: model proportions between 0 and 1 (rw) | Beta-Regression-in-R |
| 34 | T | GARCH models: forecast volatility with rugarch (title) | GARCH-Models-in-R |
| 35 | X | Aligned rank transform: factorial ANOVA when data isn't normal (rw) | Aligned-Rank-Transform-ANOVA-in-R |
| 36 | G | GEE: regression for correlated data (repeat visits, clusters) (rw) | GEE-for-Correlated-Categorical-Data-in-R |
| 37 | R | Ordinal logistic regression: model ordered categories (rw) | Ordinal-Logistic-Regression-in-R |
| 38 | T | CausalImpact: did the intervention move the series? (title) | CausalImpact-in-R |
| 39 | G | GEE vs mixed models: how to choose (title) | GEE-vs-Mixed-Models-in-R |
| 40 | R | GAM with mgcv: fit curves without picking a formula (rw) | GAM-in-R |
| 41 | S | Optimization in R: methods and practical examples (title) | Optimization-With-R (legacy classic tutorial) |
| 42 | R | Dose-response analysis with drc: a how-to (title) | Dose-Response-Analysis-in-R |
| 43 | X | PERMANOVA: ANOVA for multivariate data, with vegan (rw) | Permutation-ANOVA-in-R |
| 44 | T | Forecasting very short (and very long) time series (title) | Forecasting-Short-Time-Series-in-R |
| 45 | R | Random slopes and GLMMs: advanced regression, explained (rw) | R-Advanced-Regression-Course |
| 46 | B | Bayesian factor analysis with blavaan (title) | Bayesian-Factor-Analysis-in-R |

*#0 is conditional: day one only when `level_r = new`; everyone else starts at #1.

---

## Part 2 - proposed additions (owner: tick to include, strike to drop)

Removed by owner 2026-08-13: 50 R errors, the five diagnostic plots, missing
values (find/remove/impute), R vs Python, outlier detection.

| [ ] | Thr | Subject | Source post | Slots |
|---|---|---|---|---|
| [ ] | F | What p-values mean (and what they never meant) (title) | What-p-Values-Mean | after #1 |
| [ ] | R | lm() output, read line by line (title) | Read-lm-Output-in-R | after #3 |
| [ ] | X | Which statistical test to use? A 5-question decision flowchart (title) | Which-Statistical-Test-in-R | after #6 |
| [ ] | F | Hypothesis testing: the framework, explained (title) | Hypothesis-Testing-in-R | after #9 |
| [ ] | T | How to choose ARIMA order (p, d, q): a practical guide (title) | How-to-Choose-ARIMA-Order-in-R | after #13 |
| [ ] | R | Linear regression assumptions: the 5 checks (title) | Linear-Regression-Assumptions-in-R | after #17 |
| [ ] | T | Test stationarity: ADF, KPSS, and when to difference (title) | Test-Stationarity-in-R | after #18 |
| [ ] | F | Bayes' theorem: the simulation that makes it click (title) | Bayes-Theorem-in-R | after #22 |
| [ ] | X | Chi-square tests: which one to use and how (title) | Chi-Square-Tests-in-R | after #25 |
| [ ] | T | auto.arima: how it works and when to override it (title) | auto-arima-in-R | after #29 |
| [ ] | F | The Central Limit Theorem: watch it work in a simulation (rw) | Central-Limit-Theorem-in-R | after #32 |
| [ ] | R | Heteroscedasticity: how to detect it and fix it (rw) | Heteroscedasticity-in-R | after #33 |
| [ ] | T | Holt-Winters forecasting: additive or multiplicative seasonality? (title) | Holt-Winters-in-R | after #34 |
| [ ] | F | Type I vs Type II errors: see the trade-off in R (title) | Type-I-and-Type-II-Errors-in-R | after #38 |
| [ ] | T | Prophet: forecast with trend, seasonality and holidays (title) | Prophet-in-R | after #38 |
| [ ] | B | The Bayesian t-test: measure evidence, not just significance (rw) | Bayesian-t-Test-in-R | after #24 |
| [ ] | R | Cook's distance: find the points that change your model (rw) | Influential-Observations-in-R | after #20 |
| [ ] | S | Survival analysis: model time-to-event data, from scratch (rw) | R-Survival-Analysis-Course | after #27 |
| [ ] | T | Prediction intervals: put honest uncertainty on your forecasts (rw) | Prediction-Intervals-in-R | after #30 |
| [ ] | B | Credible vs confidence intervals: the difference that matters (rw) | Credible-Intervals-vs-Confidence-Intervals | after #24 |
| [ ] | F | Bootstrap confidence intervals: for any statistic (title) | Bootstrap-Confidence-Intervals-in-R | after #23 |
| [ ] | R | Negative binomial regression: when Poisson doesn't fit your counts (rw) | Negative-Binomial-Regression-in-R | after #29 |
| [ ] | T | Missing values in time series: impute without breaking seasonality (rw) | Missing-Values-in-Time-Series-in-R | after #34 |
| [ ] | X | Kruskal-Wallis: the nonparametric ANOVA (title) | Kruskal-Wallis-Test-in-R-2 | after #26 |
| [ ] | G | Random intercepts and slopes with lme4 (title) | Random-Intercepts-and-Slopes-in-R | before #36 |
| [ ] | B | brms: Bayesian regression without writing Stan (title) | brms-in-R | after #31 |
| [ ] | X | Repeated measures ANOVA: a step-by-step guide (title) | Repeated-Measures-ANOVA-in-R | after #35 |
| [ ] | B | Posterior predictive checks, in 5 minutes (title) | Posterior-Predictive-Checks-in-R | after #31 |
| [ ] | L | Clustering in R: k-means, hierarchical, or DBSCAN (title) | Cluster-Analysis-in-R | after #32 |
| [ ] | F | Which distribution when: a field guide (title) | Which-Distribution-When-in-R | after #28 |
| [ ] | X | When to use nonparametric tests: a decision guide (title) | When-to-Use-Nonparametric-Tests-in-R | after #35 |
| [ ] | S | A clinical-style group comparison, end to end (title) | Clinical-Comparison-Capstone-in-R | after #37 |
| [ ] | T | Granger causality: does one series predict another? (rw) | Granger-Causality-in-R | after #38 |
| [ ] | L | SEM and CFA with lavaan: a complete walkthrough (title) | CFA-and-Structural-Equation-Modeling-in-R | after #32 |
| [ ] | F | Statistical vs practical significance: report both (rw) | Statistical-vs-Practical-Significance | after #26 |
| [ ] | R | Quantile regression: model the tails, not just the mean (rw) | Quantile-Regression-in-R-2 | after #40 |
| [ ] | T | VAR models: forecast several related series together (rw) | VAR-Models-in-R | after #44 |
| [ ] | G | lme4 "failed to converge": five fixes, in order (title) | R-Error-lme4-Convergence | after #39 |
| [ ] | R | Ridge and lasso regression, explained simply (title) | Ridge-and-Lasso-Regression-in-R | after #40 |
| [ ] | B | Bayesian hierarchical models, explained (title) | Bayesian-Hierarchical-Models-in-R | after #31 |
| [ ] | G | Mixed model inference: p-values and bootstrap (title) | Mixed-Model-Inference-in-R | after #39 |

---

## The mini-course plan (the factory queue)

Each row = one named MINI COURSE for the dashboard catalog. Part 1 free,
parts 2+ Pro. Parts marked [+] come from Part 2 selections and drop out if
deselected. Beginner-first, from scratch, always.

| Mini course | Parts, in email order |
|---|---|
| Inference from zero | how inference works -> [+]p-values -> CIs -> [+]hypothesis framework -> [+]Type I/II -> power -> effect size |
| ARIMA from zero | what ARIMA is -> ACF/PACF -> [+]choosing pdq -> [+]stationarity -> [+]auto.arima -> diagnostics -> ARIMAX |
| Reading model output | [+]lm() line by line -> [+]the 5 assumption checks |
| Regression health check | multicollinearity -> autocorrelated residuals -> [+]heteroscedasticity -> [+]Cook's distance -> robust regression |
| Which test do I run? | [+]the flowchart -> Welch's -> Mann-Whitney -> [+]chi-square -> Fisher's -> post-hoc -> [+]Kruskal-Wallis -> [+]repeated measures -> [+]nonparametric guide -> ART |
| Beyond straight lines | segmented -> Poisson -> [+]negative binomial -> beta -> ordinal -> [+]quantile -> [+]ridge/lasso -> GAM |
| Bayesian decisions | [+]Bayes' theorem -> priors -> [+]Bayesian t-test -> [+]credible intervals -> [+]brms -> [+]posterior checks -> LOO/WAIC -> [+]hierarchical -> blavaan |
| Hidden structure | PCA -> EFA -> [+]clustering -> [+]SEM/lavaan |
| Data that clumps | [+]random intercepts/slopes -> GEE -> GEE vs mixed -> [+]convergence fixes -> [+]mixed inference -> GLMMs |
| Resampling | permutation tests -> [+]bootstrap CIs |

## Mechanics

Daily send at 13:00 UTC, nurture consent required, ledger key `seq:<n>` per
user (opt-in day = their day 1), one-brain rules, Sunday = recap. The send
unlocks the day's lesson for 72h (v3 model above); the expiry page and the
dashboard shelf carry the Pro moments.
