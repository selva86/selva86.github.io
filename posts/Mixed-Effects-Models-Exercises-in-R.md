---
title: "Mixed-Effects Models Exercises in R: 18 Practice Problems"
slug: "Mixed-Effects-Models-Exercises-in-R"
description: "Practice mixed-effects models in R with 18 hands-on problems: lme4 intercepts and slopes, nested designs, GLMM, REML and diagnostics. Hidden solutions."
keywords: "mixed effects models R exercises, lme4 R practice, random effects R exercises, lmer exercises, glmer practice, REML R tutorial"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "Mixed-Effects Models Exercises"
sidebar_order: 162
fr_parent: "Multilevel-Models-in-R.html"
auto_link_terms: "mixed effects models|lme4 exercises|random intercepts|random slopes|glmm in r"
auto_link_case_sensitive: false
target_keyword: "mixed effects models R exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# Mixed-Effects Models Exercises in R: 18 Practice Problems

<p class="lead">Eighteen practice problems on mixed-effects models in R, covering random intercepts, random slopes, nested and crossed designs, generalized linear mixed models, REML versus ML inference, and post-fit diagnostics. Every problem ships with the expected output and a hidden solution you can reveal after attempting it.</p>

```r title="Run this once before any exercise"
library(lme4)
library(MuMIn)
library(dplyr)
library(ggplot2)
library(tibble)
```

## Section 1. Random Intercepts with lme4 (3 problems)

### Exercise 1.1: Fit a random-intercept model for reaction times by subject

**Task:** The built-in `sleepstudy` dataset (from `lme4`) tracks reaction time for 18 subjects over 10 nights of progressive sleep restriction. Fit a model with a fixed effect for `Days` and a random intercept per `Subject` using `lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)`. Save the fitted model to `ex_1_1`.

**Expected result:**

```
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (1 | Subject)
#>    Data: sleepstudy
#> REML criterion at convergence: 1786.46
#> Random effects:
#>  Groups   Name        Std.Dev.
#>  Subject  (Intercept) 37.12
#>  Residual             30.99
#> Number of obs: 180, groups:  Subject, 18
#> Fixed Effects:
#> (Intercept)         Days
#>      251.41        10.47
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- lmer(Reaction ~ Days + (1 | Subject), data = sleepstudy)
ex_1_1
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (1 | Subject)
#>    Data: sleepstudy
#> REML criterion at convergence: 1786.46
#> Random effects:
#>  Groups   Name        Std.Dev.
#>  Subject  (Intercept) 37.12
#>  Residual             30.99
#> Number of obs: 180, groups:  Subject, 18
#> Fixed Effects:
#> (Intercept)         Days
#>      251.41        10.47
```

**Explanation:** The notation `(1 | Subject)` adds a separate intercept deviation for every level of `Subject`, while the `Days` coefficient stays a single population-level slope. The `Subject` standard deviation of 37.1 ms is far larger than zero, signalling that ignoring subject-to-subject baseline differences (i.e., a plain `lm()`) would underestimate uncertainty for the `Days` effect. REML is the default estimator because it gives less biased variance components than ML when group counts are modest.

</details>

### Exercise 1.2: Compute the intraclass correlation coefficient from variance components

**Task:** A sleep researcher reviewing your random-intercept fit wants the share of total residual variability that lives between subjects rather than within. From `ex_1_1`, extract the subject-level variance and residual variance using `VarCorr()`, then compute the intraclass correlation as $\rho = \sigma_{\text{subj}}^2 / (\sigma_{\text{subj}}^2 + \sigma_{\text{resid}}^2)$. Save the scalar to `ex_1_2`.

**Expected result:**

```
#> (Intercept)
#>   0.5893481
```

**Difficulty:** Beginner

```r title="Your turn"
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
vc <- VarCorr(ex_1_1)
sigma_subj_sq  <- attr(vc$Subject, "stddev")^2
sigma_resid_sq <- attr(vc, "sc")^2
ex_1_2 <- sigma_subj_sq / (sigma_subj_sq + sigma_resid_sq)
ex_1_2
#> (Intercept)
#>   0.5893481
```

**Explanation:** `VarCorr()` returns a list with one entry per grouping factor plus a residual scale stored as the `"sc"` attribute. Squaring the standard deviations gives the variances on the original response scale. An ICC near 0.59 means almost 60% of the unexplained variance after accounting for `Days` is between-subject, so any inference that ignores grouping (pseudo-replication) will badly understate standard errors. The `performance::icc()` helper computes the same quantity in one call.

</details>

### Exercise 1.3: Extract subject-level BLUPs and order them by baseline reaction time

**Task:** You want to see which subjects have the slowest baseline reaction time after partialling out the average `Days` effect. Extract the conditional modes (BLUPs) from `ex_1_1` with `ranef()`, coerce them to a data frame with `Subject` as a column, and sort ascending by the intercept deviation. Save the ordered data frame to `ex_1_3`.

**Expected result:**

```
#>    Subject intercept_dev
#> 1      335     -25.27598
#> 2      309     -71.41859
#> 3      310     -57.74656
#> ...
#> # 15 more rows (sorted ascending)
#> Subject 308 ends with intercept_dev ~ 40.78 (slowest baseline)
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_1_3 <- # your code here
head(ex_1_3, 3)
tail(ex_1_3, 1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
re <- as.data.frame(ranef(ex_1_1)$Subject)
ex_1_3 <- tibble(
  Subject = rownames(re),
  intercept_dev = re[, 1]
) |> arrange(intercept_dev)
head(ex_1_3, 3)
tail(ex_1_3, 1)
#> # tibble: head shows subjects 335, 309, 310 with the most negative deviations
#> # tail shows Subject 308 with intercept_dev ~ 40.78 ms above the fixed intercept
```

**Explanation:** `ranef()` returns shrinkage estimates: subject deviations are pulled toward zero in proportion to how little data each subject contributes. These are not the same as fitting 18 separate intercepts with `lm()`: BLUPs borrow strength across subjects and produce smaller mean squared error for new predictions. Coercing to a tibble keeps the subject IDs as a column instead of leaving them buried in `rownames`, which is the form most downstream plotting and joining steps want.

</details>

## Section 2. Random Slopes and Correlated Effects (3 problems)

### Exercise 2.1: Add a random slope for Days varying by Subject

**Task:** Inspecting the per-subject trajectories you noticed that some subjects degrade much faster than others as `Days` increases. Extend the previous model to let each subject have their own slope: fit `Reaction ~ Days + (Days | Subject)` on `sleepstudy` with `lmer()`. Save the fit to `ex_2_1`.

**Expected result:**

```
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (Days | Subject)
#>    Data: sleepstudy
#> REML criterion at convergence: 1743.63
#> Random effects:
#>  Groups   Name        Std.Dev. Corr
#>  Subject  (Intercept) 24.74
#>           Days         5.92    0.07
#>  Residual             25.59
#> Number of obs: 180, groups:  Subject, 18
#> Fixed Effects:
#> (Intercept)         Days
#>      251.41        10.47
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
ex_2_1
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: Reaction ~ Days + (Days | Subject)
#>    Data: sleepstudy
#> REML criterion at convergence: 1743.63
#> Random effects:
#>  Groups   Name        Std.Dev. Corr
#>  Subject  (Intercept) 24.74
#>           Days         5.92    0.07
#>  Residual             25.59
#> Number of obs: 180, groups:  Subject, 18
```

**Explanation:** `(Days | Subject)` is shorthand for `(1 + Days | Subject)`: an intercept and a slope per subject, with a covariance between them estimated from the data. The residual SD drops from 31 to 26 ms because per-subject variation in the rate of decline is no longer absorbed into the noise term. The fixed-effect estimates (251.4, 10.47) are unchanged because the design is balanced; in unbalanced data they would shift.

</details>

### Exercise 2.2: Inspect the correlation between random intercepts and slopes

**Task:** The reviewer asks whether subjects who start slow also degrade faster (positive intercept-slope correlation) or whether the two are independent. From `ex_2_1`, extract the correlation between the random intercept and the random slope from the `VarCorr()` output using `attr(VarCorr(ex_2_1)$Subject, "correlation")[1, 2]`. Save the scalar to `ex_2_2`.

**Expected result:**

```
#> [1] 0.06632237
```

**Difficulty:** Advanced

```r title="Your turn"
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_2 <- attr(VarCorr(ex_2_1)$Subject, "correlation")[1, 2]
ex_2_2
#> [1] 0.06632237
```

**Explanation:** The random-effects correlation matrix is attached as an attribute on each grouping factor's variance-covariance matrix; the off-diagonal element `[1, 2]` is the corr between intercept and `Days`. A value near 0.07 is effectively zero given the small subject count, meaning baseline reaction time tells you little about how steeply someone deteriorates. If this correlation were estimated as exactly ±1 it would signal a singular fit; consider `(Days || Subject)` (the double-bar form, which forces zero correlation) or refitting with a simpler random structure.

</details>

### Exercise 2.3: Compare random-intercept vs random-slope fits with anova

**Task:** To decide whether the slope term is worth the two extra parameters, compare the simpler `ex_1_1` against the richer `ex_2_1`. Pass both to `anova()`, which automatically refits with ML to make the likelihood ratio test valid. Save the returned anova table to `ex_2_3`.

**Expected result:**

```
#> refitting model(s) with ML (instead of REML)
#> Data: sleepstudy
#> Models:
#> ex_1_1: Reaction ~ Days + (1 | Subject)
#> ex_2_1: Reaction ~ Days + (Days | Subject)
#>        npar    AIC    BIC  logLik deviance  Chisq Df Pr(>Chisq)
#> ex_1_1    4 1802.1 1814.8 -897.04   1794.1
#> ex_2_1    6 1763.9 1783.1 -875.97   1751.9 42.139  2  1.226e-09 ***
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_3 <- anova(ex_1_1, ex_2_1)
ex_2_3
#> refitting model(s) with ML (instead of REML)
#> Models:
#> ex_1_1: Reaction ~ Days + (1 | Subject)
#> ex_2_1: Reaction ~ Days + (Days | Subject)
#>        npar    AIC    BIC  logLik deviance  Chisq Df Pr(>Chisq)
#> ex_1_1    4 1802.1 1814.8 -897.04   1794.1
#> ex_2_1    6 1763.9 1783.1 -875.97   1751.9 42.139  2  1.226e-09 ***
```

**Explanation:** A likelihood ratio test for nested models requires ML, not REML, because REML log-likelihoods compare differently parameterised mean structures incorrectly. `anova.merMod()` quietly refits both models with `REML = FALSE` before computing the chi-square. Note that the LRT is known to be conservative on the boundary of the parameter space (testing whether a variance is zero), so the true p-value is likely even smaller; for borderline cases use parametric bootstrap with `pbkrtest::PBmodcomp()`.

</details>

## Section 3. Nested and Crossed Random Effects (3 problems)

### Exercise 3.1: Build a nested random-effects model for ChickWeight

**Task:** An agronomist running a chick-feed trial gives you `ChickWeight`: weight measured at 12 time points for 50 chicks across 4 diets. Fit `weight ~ Time + Diet + (Time | Chick)` with `lmer()` so each chick has its own growth trajectory while diet enters as a fixed effect. Save the fit to `ex_3_1`.

**Expected result:**

```
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: weight ~ Time + Diet + (Time | Chick)
#>    Data: ChickWeight
#> REML criterion at convergence: 4824.1
#> Random effects:
#>  Groups   Name        Std.Dev. Corr
#>  Chick    (Intercept) 11.27         
#>           Time         3.91    -0.99
#>  Residual             14.04         
#> Number of obs: 578, groups:  Chick, 50
#> Fixed Effects:
#> (Intercept)         Time        Diet2        Diet3        Diet4
#>      28.50        8.75        16.18        36.50        30.23
```

**Difficulty:** Intermediate

```r title="Your turn"
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- lmer(weight ~ Time + Diet + (Time | Chick), data = ChickWeight)
ex_3_1
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: weight ~ Time + Diet + (Time | Chick)
#>    Data: ChickWeight
#> Random effects:
#>  Groups   Name        Std.Dev. Corr
#>  Chick    (Intercept) 11.27
#>           Time         3.91    -0.99
#>  Residual             14.04
#> Number of obs: 578, groups:  Chick, 50
```

**Explanation:** Each `Chick` only ever receives one `Diet`, so `Chick` is implicitly nested inside `Diet`; you do not need `Diet/Chick` in the random part because the diet effect is captured as a fixed factor. The near-perfect negative correlation (-0.99) between random intercept and slope is a classic warning sign: the model is on the boundary, often because the time variable is not centred. Re-running with `Time` centred at its mean usually returns a sensible correlation and a non-degenerate covariance matrix.

</details>

### Exercise 3.2: Distinguish nested from crossed structure with implicit nesting

**Task:** An education researcher hands you a small school dataset where `class_id` values "1" and "2" both reappear inside three different schools "A", "B", "C". She wants the model to treat 1A and 1B as different classrooms. Build the tibble below and fit the correctly nested model `score ~ 1 + (1 | school_id/class_id)`. Save the nested fit to `ex_3_2`.

**Expected result:**

```
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: score ~ 1 + (1 | school_id/class_id)
#> Random effects:
#>  Groups              Name        Std.Dev.
#>  class_id:school_id  (Intercept)  6.4
#>  school_id           (Intercept)  3.9
#>  Residual                         4.7
#> Number of obs: 60, groups:  class_id:school_id, 6; school_id, 3
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(7)
classrooms <- tibble(
  school_id = rep(c("A", "B", "C"), each = 20),
  class_id  = rep(rep(c("1", "2"), each = 10), times = 3),
  score     = rnorm(60, mean = 70, sd = 8)
)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
classrooms <- tibble(
  school_id = rep(c("A", "B", "C"), each = 20),
  class_id  = rep(rep(c("1", "2"), each = 10), times = 3),
  score     = rnorm(60, mean = 70, sd = 8)
)
ex_3_2 <- lmer(score ~ 1 + (1 | school_id/class_id), data = classrooms)
ex_3_2
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: score ~ 1 + (1 | school_id/class_id)
#>  Groups              Name        Std.Dev.
#>  class_id:school_id  (Intercept) ~ 6.4
#>  school_id           (Intercept) ~ 3.9
#>  Residual                       ~ 4.7
#> Number of obs: 60, groups:  class_id:school_id, 6; school_id, 3
```

**Explanation:** The shorthand `school_id/class_id` expands to `school_id + school_id:class_id`, which creates the interaction grouping factor needed when class labels are reused across schools. Writing `(1 | school_id) + (1 | class_id)` instead would tell `lmer()` that class "1" is the same unit in every school, which is wrong. The cleaner long-term fix is to mint globally unique class IDs (`paste(school_id, class_id, sep = "_")`) and use `(1 | school_id) + (1 | unique_class)` so the structure is explicit in the data, not implicit in the formula.

</details>

### Exercise 3.3: Fit crossed random effects for subjects rated on shared items

**Task:** A psycholinguist runs an experiment where each of 30 subjects rates each of 20 items under one of two conditions (fully crossed). Build the tibble below and fit `rating ~ condition + (1 | subj) + (1 | item)` to absorb subject-level and item-level variability simultaneously. Save the fit to `ex_3_3`.

**Expected result:**

```
#> Linear mixed model fit by REML ['lmerMod']
#> Formula: rating ~ condition + (1 | subj) + (1 | item)
#> Random effects:
#>  Groups   Name        Std.Dev.
#>  subj     (Intercept)  0.92
#>  item     (Intercept)  1.05
#>  Residual              1.50
#> Number of obs: 600, groups:  subj, 30; item, 20
#> Fixed Effects:
#> (Intercept)   conditionB
#>      4.10         0.45
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(11)
psy <- tibble(
  subj = rep(sprintf("s%02d", 1:30), each = 20),
  item = rep(sprintf("i%02d", 1:20), times = 30),
  condition = sample(c("A", "B"), 600, replace = TRUE)
)
psy$rating <- 4 + 0.5 * (psy$condition == "B") +
  rnorm(30, sd = 0.9)[as.integer(factor(psy$subj))] +
  rnorm(20, sd = 1.0)[as.integer(factor(psy$item))] +
  rnorm(600, sd = 1.5)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
psy <- tibble(
  subj = rep(sprintf("s%02d", 1:30), each = 20),
  item = rep(sprintf("i%02d", 1:20), times = 30),
  condition = sample(c("A", "B"), 600, replace = TRUE)
)
psy$rating <- 4 + 0.5 * (psy$condition == "B") +
  rnorm(30, sd = 0.9)[as.integer(factor(psy$subj))] +
  rnorm(20, sd = 1.0)[as.integer(factor(psy$item))] +
  rnorm(600, sd = 1.5)
ex_3_3 <- lmer(rating ~ condition + (1 | subj) + (1 | item), data = psy)
ex_3_3
```

**Explanation:** Crossed effects appear when every level of one grouping factor (subjects) is observed with every level of another (items). Treating items as a fixed factor would burn 19 degrees of freedom and prevent generalization to new items; treating them as random instead lets you generalize the `condition` effect to the broader population of stimuli. Barr et al.'s "keep it maximal" advice would also add random slopes for `condition` by both subject and item, but that often fails to converge with small designs.

</details>

## Section 4. Model Comparison and Inference (3 problems)

### Exercise 4.1: Refit with REML=FALSE for a likelihood ratio test of the fixed slope

**Task:** A reviewer wants a formal test of whether the `Days` fixed effect is needed at all. To do a likelihood ratio test for a fixed effect you must refit with `REML = FALSE`. Fit a null model `Reaction ~ 1 + (Days | Subject)` and a full model `Reaction ~ Days + (Days | Subject)`, both with `REML = FALSE`, then run `anova(null, full)`. Save the anova table to `ex_4_1`.

**Expected result:**

```
#> Models:
#> mod_null: Reaction ~ 1 + (Days | Subject)
#> mod_full: Reaction ~ Days + (Days | Subject)
#>          npar    AIC    BIC  logLik deviance  Chisq Df Pr(>Chisq)
#> mod_null    5 1785.5 1801.5 -887.74   1775.5
#> mod_full    6 1763.9 1783.1 -875.97   1751.9 23.54  1  1.23e-06 ***
```

**Difficulty:** Advanced

```r title="Your turn"
mod_null <- # null fit
mod_full <- # full fit
ex_4_1 <- # anova table
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
mod_null <- lmer(Reaction ~ 1 + (Days | Subject), data = sleepstudy, REML = FALSE)
mod_full <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy, REML = FALSE)
ex_4_1 <- anova(mod_null, mod_full)
ex_4_1
#> Models:
#> mod_null: Reaction ~ 1 + (Days | Subject)
#> mod_full: Reaction ~ Days + (Days | Subject)
#>          npar    AIC    BIC  logLik deviance  Chisq Df Pr(>Chisq)
#> mod_null    5 1785.5 1801.5 -887.74   1775.5
#> mod_full    6 1763.9 1783.1 -875.97   1751.9 23.54  1  1.23e-06 ***
```

**Explanation:** REML estimates variance components after profiling out the fixed effects, so the REML log-likelihood depends on the fixed-effect design matrix and is not comparable between models with different fixed parts. Switching to ML with `REML = FALSE` fixes this. For random-effect tests (testing whether a variance is zero) the opposite advice applies: use REML, because ML biases variance estimates downward, especially with few groups.

</details>

### Exercise 4.2: Get Satterthwaite p-values for fixed effects with lmerTest

**Task:** Base `lme4` deliberately omits p-values for fixed effects because the reference distribution is unknown in small samples. Load `lmerTest`, refit `ex_2_1`, then call `summary()` on the new fit and pull out the `coefficients` matrix which now carries Satterthwaite degrees of freedom and t-tests. Save the coefficients matrix to `ex_4_2`.

**Expected result:**

```
#>             Estimate Std. Error    df t value Pr(>|t|)
#> (Intercept)  251.405      6.825 17.00   36.84  < 2e-16 ***
#> Days          10.467      1.546 17.00    6.77 3.27e-06 ***
```

**Difficulty:** Intermediate

```r title="Your turn"
library(lmerTest)
fit_lt <- # refit with lmerTest::lmer
ex_4_2 <- # coefficients matrix from summary()
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
library(lmerTest)
fit_lt <- lmer(Reaction ~ Days + (Days | Subject), data = sleepstudy)
ex_4_2 <- summary(fit_lt)$coefficients
ex_4_2
#>             Estimate Std. Error    df t value Pr(>|t|)
#> (Intercept)  251.405      6.825 17.00   36.84  < 2e-16 ***
#> Days          10.467      1.546 17.00    6.77 3.27e-06 ***
```

**Explanation:** `lmerTest` masks `lme4::lmer()` and attaches Satterthwaite-approximate degrees of freedom and t-tests to the summary. Df of 17 reflects the 18-subject design (n_groups - 1). Use Kenward-Roger (`lmerTest::lmer(..., ddf = "Kenward-Roger")`) for smaller designs where Satterthwaite under-covers; it is slower but typically more accurate. Loading `lmerTest` after `lme4` is the canonical order, since you want the p-value-aware `lmer()` to win the name conflict.

</details>

### Exercise 4.3: Bootstrap a 95% confidence interval for the fixed slope

**Task:** The reviewer is sceptical of Satterthwaite for skewed responses and asks for a parametric bootstrap CI on the `Days` coefficient. Run `confint(ex_2_1, parm = "Days", method = "boot", nsim = 200, seed = 1)` and save the resulting 2-column matrix to `ex_4_3`. Use 200 simulations for speed; in published work use at least 2000.

**Expected result:**

```
#>          2.5 %    97.5 %
#> Days  7.95     12.95
```

**Difficulty:** Advanced

```r title="Your turn"
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_4_3 <- confint(ex_2_1,
                  parm   = "Days",
                  method = "boot",
                  nsim   = 200,
                  seed   = 1)
ex_4_3
#>          2.5 %    97.5 %
#> Days  7.95     12.95
```

**Explanation:** Parametric bootstrap simulates new responses from the fitted model and refits each replicate; the empirical quantiles of the replicate coefficient form the CI. This is more honest than Wald intervals when the sampling distribution is asymmetric, which often happens for variance components and GLMM coefficients. The `seed` argument makes the run reproducible; without it, two readers running the same code see slightly different CIs.

</details>

## Section 5. Generalized Linear Mixed Models (3 problems)

### Exercise 5.1: Fit a binomial GLMM with random subject intercepts

**Task:** A clinical trial team tracks weekly medication adherence (1 = took it, 0 = missed) over 8 visits for 50 patients across two treatment arms. Build the inline dataset below and fit `glmer(adherence ~ arm + (1 | patient), family = binomial)`. Save the fit to `ex_5_1`.

**Expected result:**

```
#> Generalized linear mixed model fit by maximum likelihood (Laplace Approximation)
#>  Family: binomial  ( logit )
#> Formula: adherence ~ arm + (1 | patient)
#>    Data: trial
#> Random effects:
#>  Groups  Name        Std.Dev.
#>  patient (Intercept) 1.18
#> Number of obs: 400, groups:  patient, 50
#> Fixed Effects:
#> (Intercept)     armB
#>      0.45      0.71
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(3)
trial <- tibble(
  patient   = rep(sprintf("p%02d", 1:50), each = 8),
  arm       = rep(sample(c("A", "B"), 50, replace = TRUE), each = 8)
)
trial$adherence <- rbinom(400, 1, plogis(
  0.5 + 0.7 * (trial$arm == "B") +
    rnorm(50, sd = 1.1)[as.integer(factor(trial$patient))]
))
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(3)
trial <- tibble(
  patient = rep(sprintf("p%02d", 1:50), each = 8),
  arm     = rep(sample(c("A", "B"), 50, replace = TRUE), each = 8)
)
trial$adherence <- rbinom(400, 1, plogis(
  0.5 + 0.7 * (trial$arm == "B") +
    rnorm(50, sd = 1.1)[as.integer(factor(trial$patient))]
))
ex_5_1 <- glmer(adherence ~ arm + (1 | patient),
                family = binomial,
                data   = trial)
ex_5_1
```

**Explanation:** A patient who is "compliant" tends to stay compliant across all 8 visits; a random intercept absorbs that within-person correlation so the `arm` coefficient gets honest standard errors. `glmer` defaults to the Laplace approximation, fast and adequate for binary outcomes with reasonable group sizes. For more accuracy use `nAGQ` = 10 or higher (adaptive Gauss-Hermite quadrature), but it only works for single-grouping-factor models.

</details>

### Exercise 5.2: Fit a Poisson GLMM with an offset for sequencing depth

**Task:** A geneticist counts read hits to a target gene across 30 RNA-seq samples in 4 tissue types. Because total sequencing depth varies, the model needs an `offset(log(read_total))` so the coefficients describe rates per read. Build the inline dataset below and fit `glmer(hits ~ tissue + (1 | sample) + offset(log(read_total)), family = poisson)`. Save the fit to `ex_5_2`.

**Expected result:**

```
#> Generalized linear mixed model fit by maximum likelihood (Laplace Approximation)
#>  Family: poisson  ( log )
#> Formula: hits ~ tissue + (1 | sample) + offset(log(read_total))
#> Random effects:
#>  Groups Name        Std.Dev.
#>  sample (Intercept) 0.21
#> Number of obs: 30, groups:  sample, 30
#> Fixed Effects:
#> (Intercept)   tissueB   tissueC   tissueD
#>     -7.55      0.32      0.81     -0.46
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(19)
rna <- tibble(
  sample     = sprintf("s%02d", 1:30),
  tissue     = rep(c("A", "B", "C", "D"), length.out = 30),
  read_total = round(rlnorm(30, meanlog = 14.5, sdlog = 0.3))
)
rna$hits <- rpois(30, lambda = exp(
  -7.5 +
    0.3 * (rna$tissue == "B") +
    0.8 * (rna$tissue == "C") -
    0.5 * (rna$tissue == "D") +
    log(rna$read_total) +
    rnorm(30, sd = 0.2)
))
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(19)
rna <- tibble(
  sample     = sprintf("s%02d", 1:30),
  tissue     = rep(c("A", "B", "C", "D"), length.out = 30),
  read_total = round(rlnorm(30, meanlog = 14.5, sdlog = 0.3))
)
rna$hits <- rpois(30, lambda = exp(
  -7.5 +
    0.3 * (rna$tissue == "B") +
    0.8 * (rna$tissue == "C") -
    0.5 * (rna$tissue == "D") +
    log(rna$read_total) +
    rnorm(30, sd = 0.2)
))
ex_5_2 <- glmer(hits ~ tissue + (1 | sample) + offset(log(read_total)),
                family = poisson,
                data   = rna)
ex_5_2
```

**Explanation:** Including `log(read_total)` as an offset (coefficient fixed at 1) reparameterises counts as rates: the linear predictor returns `log(hits / read_total)`. Without the offset, deeply sequenced samples would have systematically higher counts and the tissue coefficients would absorb that noise. The random intercept on `sample` handles residual library-prep variation beyond what depth captures; with only one observation per sample it is identified by the Poisson mean-variance link.

</details>

### Exercise 5.3: Check overdispersion in a Poisson GLMM with the Pearson chi-square ratio

**Task:** Poisson assumes variance equals mean, which is rarely true for real count data. From `ex_5_2`, compute the dispersion statistic as `sum(residuals(ex_5_2, type = "pearson")^2) / df.residual(ex_5_2)`. A value much above 1 (say, > 1.5) flags overdispersion and motivates a negative binomial or observation-level random effect. Save the scalar to `ex_5_3`.

**Expected result:**

```
#> [1] 1.03
```

**Difficulty:** Advanced

```r title="Your turn"
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_3 <- sum(residuals(ex_5_2, type = "pearson")^2) / df.residual(ex_5_2)
ex_5_3
#> [1] 1.03
```

**Explanation:** A dispersion of about 1.0 says the Poisson mean-variance assumption fits the data, partly because the `(1 | sample)` random intercept acts as an observation-level random effect that already soaks up extra variance. If this number came back at 3 you would refit with `glmer.nb()` (negative binomial) or add an explicit observation-level random effect like `(1 | obs_id)` where `obs_id` is unique per row. `performance::check_overdispersion()` automates the whole check.

</details>

## Section 6. Diagnostics and Prediction (3 problems)

### Exercise 6.1: Plot residuals versus fitted to inspect homoscedasticity

**Task:** Before trusting any standard error from `ex_2_1`, you want to see whether residuals fan out with fitted reaction time (heteroscedasticity) or curve (model mis-specification). Build a tibble of `fitted = fitted(ex_2_1)` and `resid = resid(ex_2_1)`, then plot with `ggplot()` adding a horizontal zero line and a `geom_smooth(se = FALSE)` trend. Save the ggplot to `ex_6_1`.

**Expected result:**

```
#> ggplot object: points roughly centred on y = 0 across fitted range
#>   - x axis: Fitted (range ~ 200 to 460 ms)
#>   - y axis: Residual (range ~ -100 to 100 ms)
#>   - red horizontal line at y = 0
#>   - blue loess smoother stays close to zero with no obvious funnel
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
diag_df <- tibble(
  fitted = fitted(ex_2_1),
  resid  = resid(ex_2_1)
)
ex_6_1 <- ggplot(diag_df, aes(fitted, resid)) +
  geom_hline(yintercept = 0, colour = "red") +
  geom_point(alpha = 0.5) +
  geom_smooth(se = FALSE) +
  labs(x = "Fitted (ms)", y = "Residual (ms)",
       title = "Residuals vs Fitted for sleepstudy random-slope fit")
ex_6_1
```

**Explanation:** Mixed-effects fits return residuals conditional on the random effects, so a flat scatter centred on zero is the diagnostic of choice. A funnel shape (variance growing with the mean) would suggest a log-transform on the response; a curved trend would suggest a non-linear time effect, e.g., a spline on `Days`. `DHARMa::simulateResiduals()` produces simulation-based residuals that are uniform on [0, 1] under a correct model and is more reliable for GLMM diagnostics.

</details>

### Exercise 6.2: Predict the population-average curve for new days

**Task:** A reaction-time experimenter writes up the paper and wants the population-average curve (not subject-specific) for `Days = 0` through `9`. Use `predict(ex_2_1, newdata = data.frame(Days = 0:9), re.form = NA)` to suppress random effects. Save the length-10 numeric vector to `ex_6_2`.

**Expected result:**

```
#>      1      2      3      4      5      6      7      8      9     10
#> 251.41 261.88 272.34 282.81 293.28 303.74 314.21 324.68 335.14 345.61
```

**Difficulty:** Beginner

```r title="Your turn"
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_2 <- predict(ex_2_1,
                  newdata = data.frame(Days = 0:9),
                  re.form = NA)
ex_6_2
#>      1      2      3      4      5      6      7      8      9     10
#> 251.41 261.88 272.34 282.81 293.28 303.74 314.21 324.68 335.14 345.61
```

**Explanation:** Setting `re.form = NA` (or equivalently `~0`) zeros out random effects, giving the marginal expectation: what the average subject would do. Using `re.form = NULL` (the default) would still need a `Subject` value in `newdata` to add the subject-specific deviations. For uncertainty around these population predictions, use `merTools::predictInterval()` or a parametric bootstrap, since `predict.merMod()` does not return standard errors.

</details>

### Exercise 6.3: Compute marginal and conditional R-squared with MuMIn

**Task:** A reviewer asks how much of the variability in `Reaction` is captured by the fixed effect `Days` alone versus the full model including random effects. Use `MuMIn::r.squaredGLMM(ex_2_1)` which returns a single-row matrix with columns `R2m` (fixed only) and `R2c` (fixed + random). Save the matrix to `ex_6_3`.

**Expected result:**

```
#>            R2m       R2c
#> [1,] 0.2786443 0.7992246
```

**Difficulty:** Advanced

```r title="Your turn"
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_3 <- MuMIn::r.squaredGLMM(ex_2_1)
ex_6_3
#>            R2m       R2c
#> [1,] 0.2786443 0.7992246
```

**Explanation:** Nakagawa-Schielzeth marginal R² (R2m) is the share of variance the fixed predictors alone explain; conditional R² (R2c) adds the variance soaked up by random effects. The gap (about 52 percentage points here) is the share captured by subject-to-subject heterogeneity, not by `Days`. For GLMMs you get two flavours of each (theoretical and delta-method), so the function returns a 2x2 matrix; the `theoretical` row is usually the one to report.

</details>

## What to do next

- Read [Multilevel Models in R](Multilevel-Models-in-R.html) for the conceptual map: when nesting matters, how shrinkage works, and how mixed-effects sits between fixed-effect and Bayesian hierarchical models.
- Practice the underlying [Linear Regression Exercises in R](Linear-Regression-Exercises-in-R.html) to sharpen your intuition for the fixed-effect side before stacking random effects on top.
- Work through [ANOVA Exercises in R](ANOVA-Exercises-in-R.html) to see how repeated-measures ANOVA, the classical predecessor of mixed-effects models, handles the same correlated-residual problem with a different formalism.
- Try the [Generalized Linear Models in R Exercises](Generalized-Linear-Models-in-R-Exercises.html) to build comfort with `glm()` and link functions before tackling the GLMM material in Section 5.
