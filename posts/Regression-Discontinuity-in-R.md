---
title: "Regression Discontinuity in R: rdrobust Package for Causal Inference"
slug: Regression-Discontinuity-in-R
description: "Learn regression discontinuity in R with the rdrobust package. Run sharp and fuzzy RD designs, choose bandwidths, and interpret causal effects with clear code."
keywords: "regression discontinuity, rdrobust, causal inference, R, sharp RD, fuzzy RD, bandwidth selection, treatment effect, rdplot, rdbwselect"
auto_link_terms: "regression discontinuity|regression discontinuity design|rdrobust|rdrobust package|sharp RD design|fuzzy RD design|RD bandwidth|local average treatment effect"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: 2026-04-20
curriculum_id: FR-regr-24
post_type: FR
fr_parent: Multiple-Regression-in-R.html
difficulty: Intermediate
---

# Regression Discontinuity in R: rdrobust Package for Causal Inference

<p class="lead">Regression discontinuity (RD) is a causal inference method that compares units just above and just below a cutoff to estimate a treatment effect. The <code>rdrobust</code> R package by Calonico, Cattaneo, Farrell, and Titiunik gives you robust local-polynomial estimates, automatic bandwidth selection, and publication-ready plots for sharp and fuzzy designs in a handful of lines of code.</p>

## When can you use regression discontinuity in R?

Many causal questions share the same shape: a policy or program kicks in when a score crosses a threshold. Students above 70 get tutoring, firms below a size limit pay a lower tax, babies just under 1500 g get extra care. If the cutoff is strictly enforced and people cannot finely game their score, you can compare units just above and below it to estimate the effect. Let's simulate data where crossing a score of 50 causes a 5-unit jump, then plot it.

```r title="Simulate sharp RD and plot the jump"
library(rdrobust)

set.seed(2026)
n <- 2000
x <- runif(n, 0, 100)           # running variable (e.g., test score)
treat <- as.integer(x >= 50)    # treatment turns on at cutoff = 50
y <- 30 + 0.3 * x + 5 * treat + rnorm(n, sd = 4)

sharp_df <- data.frame(x = x, y = y, treat = treat)

rdplot(y = sharp_df$y, x = sharp_df$x, c = 50,
       title = "Sharp RD: outcome jumps at cutoff = 50",
       x.label = "Running variable (score)",
       y.label = "Outcome")
#> Call: rdplot
#> Number of Obs.            2000
#> Kernel                 Uniform
#> Number of Obs.           1009       991
#> Polynomial Order            4         4
#> Scale                   1.000     1.000
#> Bins Selected              15        15
#> Average Bin Length      3.333     3.333
```

The plot shows binned means on each side of the cutoff with fitted polynomials. The visible vertical gap at x = 50 is the treatment effect we will estimate. If you cannot see a gap in the plot, an RD model will not rescue the design, so always plot first.

[NOTE]
**`rdrobust` is WebR-compatible.** Every code block on this page runs directly in the browser, so you can change parameters and see results without installing anything locally.

**Try it:** Change the cutoff to 60 in the simulation and rerun `rdplot()`. The jump location should move with it.

```r title="Your turn: shift the cutoff"
# Regenerate sharp_df using cutoff = 60, then call rdplot with c = 60
# your code here

# Expected: the jump appears at x = 60 instead of x = 50
```

<details>
<summary>Click to reveal solution</summary>

```r title="Shifted-cutoff solution"
set.seed(2026)
x_ex <- runif(2000, 0, 100)
treat_ex <- as.integer(x_ex >= 60)
y_ex <- 30 + 0.3 * x_ex + 5 * treat_ex + rnorm(2000, sd = 4)
rdplot(y = y_ex, x = x_ex, c = 60, title = "Cutoff = 60")
```

**Explanation:** The running variable is unchanged, but the jump lives wherever the cutoff is. Moving `c` slides the treatment boundary along the x-axis.

</details>

## How do you run a sharp RD with rdrobust()?

A **sharp RD design** is one where the treatment flips deterministically at the cutoff: everyone above gets it, everyone below does not. The full workflow has three steps: pick a bandwidth around the cutoff, fit a local polynomial on each side, and read the gap as the treatment effect. `rdrobust` handles all three, but seeing each step helps you trust the output.

Step one is bandwidth selection. A narrow bandwidth uses only observations very close to the cutoff (low bias, high variance). A wide bandwidth uses more data (lower variance, higher bias). The `rdbwselect()` function picks the mean-squared-error-optimal bandwidth automatically using the Calonico, Cattaneo, and Titiunik (2014) method.

```r title="Pick an optimal bandwidth"
bw <- rdbwselect(y = sharp_df$y, x = sharp_df$x, c = 50)
summary(bw)
#> Call: rdbwselect
#> Number of Obs.                 2000
#> BW type                       mserd
#> Kernel                   Triangular
#> VCE method                       NN
#> 
#> =======================================================
#>                   BW est. (h)    BW bias (b)
#>               Left of c  Right of c  Left of c  Right of c
#> =======================================================
#>      mserd        9.345       9.345     14.512     14.512
#> =======================================================
```

The optimal bandwidth `h` is roughly 9.3 units on each side of the cutoff. That is the window `rdrobust()` will use by default when you fit the estimator.

Step two is the estimate itself. `rdrobust()` runs a local linear regression on each side of the cutoff within the chosen bandwidth, using a triangular kernel that gives more weight to observations closer to 50.

```r title="Fit the sharp RD estimator"
rd_sharp <- rdrobust(y = sharp_df$y, x = sharp_df$x, c = 50)
summary(rd_sharp)
#> Sharp RD estimates using local polynomial regression.
#> 
#> Number of Obs.                 2000
#> BW type                       mserd
#> Kernel                   Triangular
#> VCE method                       NN
#> 
#> Number of Obs.                  1009         991
#> Eff. Number of Obs.              187         183
#> Order est. (p)                     1           1
#> Order bias (q)                     2           2
#> BW est. (h)                    9.345       9.345
#> BW bias (b)                   14.512      14.512
#> rho (h/b)                      0.644       0.644
#> 
#> =============================================================================
#>         Method     Coef. Std. Err.      z     P>|z|      [ 95% C.I. ]
#> =============================================================================
#>   Conventional    5.012     0.811    6.180     0.000     [3.422 , 6.602]
#>         Robust       -         -    5.324     0.000     [3.320 , 7.205]
#> =============================================================================
```

The `Conventional` coefficient of 5.01 is the estimated jump in the outcome at the cutoff, which matches the true 5 we simulated. The `Eff. Number of Obs.` row shows that only 187 and 183 observations on each side actually enter the weighted regression once the kernel and bandwidth are applied, even though the full dataset has 2000 rows.

[TIP]
**The defaults are battle-tested.** Triangular kernel, linear polynomial on each side, MSE-optimal bandwidth, and nearest-neighbour variance are the Calonico et al. recommendations. Do not override them unless you have a specific reason and know what changes.

**Try it:** Rerun `rdrobust()` with a quadratic polynomial by setting `p = 2`. The point estimate should move slightly, and the standard error should grow.

```r title="Your turn: try quadratic polynomial"
# Fit rdrobust with p = 2 on sharp_df and print summary
# your code here

# Expected: slightly different point estimate, larger SE, wider CI
```

<details>
<summary>Click to reveal solution</summary>

```r title="Quadratic polynomial solution"
rd_ex <- rdrobust(y = sharp_df$y, x = sharp_df$x, c = 50, p = 2)
summary(rd_ex)
```

**Explanation:** A quadratic fit uses more flexible curves on each side of the cutoff, so it can absorb real non-linearity but also overfit noise. That trade-off is why linear (`p = 1`) is the safer default for reporting.

</details>

## How do you read rdrobust output?

The `rdrobust()` summary has three things you should read in order: the effective sample size, the bandwidth, and the three estimator rows. The effective sample size tells you how much data is actually driving the estimate. If it is under 50 observations per side, your confidence intervals will be wide and you should think hard before publishing.

The bandwidth (`BW est. (h)`) tells you the window used. If it is a huge fraction of the running variable's range, your design is basically a global regression, which defeats the point of RD. If it is tiny, variance explodes. The MSE-optimal choice tries to balance these.

Now the estimator rows. `rdrobust()` reports three:

- **Conventional**, standard local linear estimate and its CI. Point estimate is unbiased asymptotically, but the CI assumes the bandwidth was picked without any bias correction.
- **Bias-Corrected**, same point estimate after subtracting an estimated bias term from the polynomial fit.
- **Robust**, bias-corrected CI that also accounts for the variance of the bias correction itself.

The Calonico, Cattaneo, Titiunik papers recommend **reporting the Conventional point estimate and the Robust confidence interval**. That is the combination most journal reviewers expect. You can pull those values out of the fitted object directly for tables and reports.

```r title="Extract the estimate and robust CI"
est_robust <- c(
  estimate = rd_sharp$Estimate[1, "tau.us"],
  ci_low   = rd_sharp$ci["Robust", "CI Lower"],
  ci_high  = rd_sharp$ci["Robust", "CI Upper"],
  p_value  = rd_sharp$pv["Robust", ]
)
round(est_robust, 3)
#> estimate   ci_low  ci_high  p_value
#>    5.012    3.320    7.205    0.000
```

The object stores matrices you can index directly, so you can pull point estimates and CIs into a results table without parsing text. This matters because every RD paper reports at least two model specifications, so scripting beats copy-pasting.

[KEY INSIGHT]
**The robust CI is wider than the conventional CI on purpose.** The extra width accounts for uncertainty from the bandwidth and bias-correction steps that the conventional CI silently ignores. A wider interval is the price of being honest about where the estimator came from.

**Try it:** Compute the ratio of the Robust CI width to the Conventional CI width from `rd_sharp`. It should be greater than 1.

```r title="Your turn: compare CI widths"
# Using rd_sharp, compute robust CI width / conventional CI width
# your code here

# Expected: a ratio > 1 (robust CIs are wider)
```

<details>
<summary>Click to reveal solution</summary>

```r title="CI width comparison solution"
rob_w  <- diff(rd_sharp$ci["Robust", ])
conv_w <- diff(rd_sharp$ci["Conventional", ])
as.numeric(rob_w / conv_w)
#> [1] 1.22
```

**Explanation:** A ratio of about 1.2 means the robust CI is 20% wider. That extra width is the honesty premium for bias-corrected inference.

</details>

## How is a fuzzy RD different, and how do you fit one?

In a **sharp RD design**, everyone above the cutoff gets treatment and no one below does. In practice, programs rarely work that cleanly. Some eligible people skip the program; some ineligible people sneak in. This is a **fuzzy RD design**: treatment *probability* jumps at the cutoff, but not from 0 to 1.

Fuzzy designs are handled by passing the actual treatment indicator (not assignment) to `rdrobust()` via the `fuzzy=` argument. The cutoff becomes an instrument for the probability of treatment, and the estimate is a local average treatment effect (LATE) for compliers, meaning units whose treatment status is decided by the cutoff.

Let's simulate a realistic fuzzy design where 80% of units above the cutoff take treatment and 15% of units below do.

```r title="Simulate fuzzy compliance and fit"
set.seed(42)
n <- 2500
x_f <- runif(n, 0, 100)
eligible <- as.integer(x_f >= 50)
take_up <- ifelse(eligible == 1,
                  rbinom(n, 1, 0.80),   # 80% take-up above
                  rbinom(n, 1, 0.15))   # 15% always-takers below
y_f <- 30 + 0.3 * x_f + 5 * take_up + rnorm(n, sd = 4)

fuzzy_df <- data.frame(x = x_f, y = y_f, take_up = take_up)

rd_fuzzy <- rdrobust(y = fuzzy_df$y, x = fuzzy_df$x,
                     c = 50, fuzzy = fuzzy_df$take_up)
summary(rd_fuzzy)
#> Fuzzy RD estimates using local polynomial regression.
#> 
#> Number of Obs.                 2500
#> BW type                       mserd
#> Kernel                   Triangular
#> 
#> First-stage estimates.
#> =============================================================================
#>         Method     Coef. Std. Err.      z     P>|z|      [ 95% C.I. ]
#> =============================================================================
#>   Conventional    0.651     0.048   13.615     0.000     [0.557 , 0.745]
#>         Robust       -         -   11.790     0.000     [0.537 , 0.751]
#> =============================================================================
#> 
#> Treatment effect estimates.
#> =============================================================================
#>         Method     Coef. Std. Err.      z     P>|z|      [ 95% C.I. ]
#> =============================================================================
#>   Conventional    5.089     0.932    5.461     0.000     [3.262 , 6.916]
#>         Robust       -         -    4.721     0.000     [3.047 , 7.354]
#> =============================================================================
```

The output has two blocks. The **first-stage** shows that crossing the cutoff increases the probability of treatment by about 0.65, matching the 80% − 15% compliance gap. The **treatment effect** block shows the LATE of about 5.1 on the outcome, very close to the true effect of 5 we injected for takers.

[NOTE]
**Fuzzy `rdrobust` output has two blocks, not one.** The first-stage block is the jump in treatment *probability* at the cutoff. The treatment effect block is the jump in *outcome* divided by that first stage, which gives you the LATE for compliers.

**Try it:** Change the compliance rate above the cutoff from 0.80 to 0.50 in the simulation and refit. The first-stage shrinks, so the LATE estimate gets noisier.

```r title="Your turn: weaken compliance"
# Regenerate take_up with 0.50 compliance above, refit rd_fuzzy
# your code here

# Expected: first-stage coefficient drops to around 0.35, SE on LATE grows
```

<details>
<summary>Click to reveal solution</summary>

```r title="Weaker-compliance solution"
set.seed(42)
x_ex <- runif(2500, 0, 100)
elig_ex <- as.integer(x_ex >= 50)
take_ex <- ifelse(elig_ex == 1,
                  rbinom(2500, 1, 0.50),
                  rbinom(2500, 1, 0.15))
y_ex <- 30 + 0.3 * x_ex + 5 * take_ex + rnorm(2500, sd = 4)
rd_weak <- rdrobust(y = y_ex, x = x_ex, c = 50, fuzzy = take_ex)
summary(rd_weak)
```

**Explanation:** Weaker compliance means the cutoff is a weaker instrument, so the denominator in the LATE (the first stage) gets smaller and the standard error gets larger. Always report the first-stage F-statistic or coefficient so readers can judge instrument strength.

</details>

## How do you validate RD assumptions?

An RD estimate is only credible if three things are true: the running variable is not manipulated around the cutoff, no other policy changes at the same threshold, and the outcome trend is smooth enough that a polynomial captures it. You cannot prove any of these, but you can run tests that would reveal the worst violations.

The most common check is the **density test**, which asks whether the running variable has a suspicious spike just on one side of the cutoff. If people can game their score to get into the treated group, you will see bunching. The `rddensity` package implements the Cattaneo, Jansson, and Ma (2020) test, which is the modern successor to the McCrary (2008) test.

```r title="Density manipulation test"
library(rddensity)

dens_test <- rddensity(X = sharp_df$x, c = 50)
summary(dens_test)
#> Manipulation testing using local polynomial density estimation.
#> 
#> Number of obs =       2000
#> Cutoff c = 50
#> 
#>                 Left of c    Right of c
#> Number of obs        1009           991
#> Eff. Number of obs    312           298
#> 
#> Test Statistic T = -0.412
#> p-value         P = 0.681
#> 
#> Binomial test
#> p-value           = 0.618
```

A p-value of 0.68 (well above 0.05) means we cannot reject the null that the density is continuous at the cutoff. That is exactly what we want. If this p-value were below 0.05, it would suggest units are sorting around the threshold, and the RD estimate would be biased.

A second check is the **placebo cutoff test**. The treatment effect should only appear at the real cutoff. Pick a fake threshold where no treatment exists (say 40), and refit. If you get a significant jump, something is generating discontinuities that are not the treatment.

```r title="Placebo cutoff test"
rd_placebo <- rdrobust(y = sharp_df$y, x = sharp_df$x, c = 40)
summary(rd_placebo)
#> Sharp RD estimates using local polynomial regression.
#> 
#> =============================================================================
#>         Method     Coef. Std. Err.      z     P>|z|      [ 95% C.I. ]
#> =============================================================================
#>   Conventional    0.247     0.781    0.316     0.752    [-1.284 , 1.779]
#>         Robust       -         -    0.281     0.779    [-1.491 , 1.988]
#> =============================================================================
```

A point estimate of 0.25 with a p-value of 0.75 is a clean null. No jump where no jump should be, which strengthens the credibility of the real estimate at 50.

The third check is **bandwidth sensitivity**. Rerun `rdrobust()` with halved and doubled bandwidths. If the point estimate wobbles wildly, the MSE-optimal choice is a lucky sweet spot, not a signal.

```r title="Bandwidth sensitivity check"
rd_narrow <- rdrobust(y = sharp_df$y, x = sharp_df$x, c = 50, h = 5)
rd_wide   <- rdrobust(y = sharp_df$y, x = sharp_df$x, c = 50, h = 20)

bw_check <- data.frame(
  spec  = c("narrow h=5", "default", "wide h=20"),
  coef  = round(c(rd_narrow$Estimate[1,"tau.us"],
                  rd_sharp$Estimate[1,"tau.us"],
                  rd_wide$Estimate[1,"tau.us"]), 3),
  se    = round(c(rd_narrow$Estimate[1,"se.tau.us"],
                  rd_sharp$Estimate[1,"se.tau.us"],
                  rd_wide$Estimate[1,"se.tau.us"]), 3)
)
bw_check
#>          spec  coef    se
#> 1  narrow h=5 5.165 1.099
#> 2     default 5.012 0.811
#> 3   wide h=20 4.938 0.563
```

All three coefficients land in the 4.9 to 5.2 range, so the estimate is stable across bandwidths. The standard error shrinks as the bandwidth grows (more data, less noise) but at the cost of more bias, which is why the MSE-optimal choice exists.

[WARNING]
**A significant density test is a dealbreaker.** If units can manipulate their running variable and you find evidence of sorting, the continuity assumption fails and your RD estimate is biased in an unknown direction. Investigate the assignment mechanism before publishing.

[TIP]
**Always report bandwidth sensitivity.** A single estimate at the MSE-optimal bandwidth is easy to misread as precision. A short table across three bandwidths shows reviewers the result is not an artefact.

**Try it:** Run a placebo at `c = 60` on `sharp_df` and verify the estimate is close to zero with a non-significant p-value.

```r title="Your turn: placebo at 60"
# Run rdrobust on sharp_df with c = 60 and print summary
# your code here

# Expected: coefficient near 0, p > 0.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Placebo-at-60 solution"
rd_ex <- rdrobust(y = sharp_df$y, x = sharp_df$x, c = 60)
summary(rd_ex)
```

**Explanation:** At a fake cutoff far from the real one, the local polynomial on each side is just fitting noise. The expected coefficient is zero, and a significant jump would mean your smoothing assumption is wrong.

</details>

## Practice Exercises

### Exercise 1: Full sharp RD workflow

Simulate 1500 observations with a running variable uniform on [0, 100], cutoff = 55, and a true jump of 3 units in the outcome. Run `rdplot()`, pick the MSE-optimal bandwidth with `rdbwselect()`, and fit the estimator with `rdrobust()`. Report the Robust 95% CI.

```r title="Exercise 1 starter"
# Hint: mirror the sharp_df workflow but with n = 1500 and cutoff = 55

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
set.seed(123)
my_x <- runif(1500, 0, 100)
my_treat <- as.integer(my_x >= 55)
my_y <- 20 + 0.2 * my_x + 3 * my_treat + rnorm(1500, sd = 3)
my_df <- data.frame(x = my_x, y = my_y)

rdplot(y = my_df$y, x = my_df$x, c = 55)
summary(rdbwselect(y = my_df$y, x = my_df$x, c = 55))
my_fit <- rdrobust(y = my_df$y, x = my_df$x, c = 55)
my_fit$ci["Robust", ]
#> CI Lower  CI Upper
#>    2.1       3.9
```

**Explanation:** The Robust CI contains the true effect of 3. The point estimate comes from the `Conventional` row; the CI to report is the `Robust` row.

</details>

### Exercise 2: Fuzzy vs intent-to-treat

Using `fuzzy_df` from earlier, fit two models: (a) a fuzzy RD with `fuzzy = fuzzy_df$take_up`, and (b) a sharp RD ignoring take-up (the intent-to-treat effect). Compare the two point estimates. The fuzzy estimate should be larger because it scales by the first stage.

```r title="Exercise 2 starter"
# Hint: the sharp specification uses only y and x (no fuzzy= argument)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_fuzzy <- rdrobust(y = fuzzy_df$y, x = fuzzy_df$x, c = 50,
                     fuzzy = fuzzy_df$take_up)
my_itt   <- rdrobust(y = fuzzy_df$y, x = fuzzy_df$x, c = 50)

c(fuzzy_late = my_fuzzy$Estimate[1, "tau.us"],
  itt        = my_itt$Estimate[1, "tau.us"])
#> fuzzy_late        itt
#>      5.089      3.314
```

**Explanation:** The intent-to-treat (ITT) effect is the jump in outcome for crossing the *eligibility* line, regardless of whether people actually took the treatment. Dividing ITT by the first-stage jump in treatment probability (about 0.65) recovers the LATE of about 5.1. This is the Wald estimator interpretation of fuzzy RD.

</details>

## Complete Example

Here is a full workflow on a simulated policy evaluation. A job-training program is offered to counties whose median income falls below \$50k, and we want to know whether it raised the employment rate. The running variable is median income, the cutoff is 50, and the outcome is a 12-month change in employment rate.

```r title="Simulate a county-level RD dataset"
set.seed(2027)
n_county <- 1800
income <- runif(n_county, 20, 80)
elig   <- as.integer(income <= 50)
take   <- ifelse(elig == 1,
                 rbinom(n_county, 1, 0.72),
                 rbinom(n_county, 1, 0.08))
emp_change <- 1 + 0.05 * income + 1.8 * take + rnorm(n_county, sd = 1.2)
county_df  <- data.frame(income = income, emp_change = emp_change,
                         elig = elig, take = take)

head(county_df, 3)
#>    income emp_change elig take
#> 1   41.16      3.074    1    1
#> 2   68.73      4.611    0    0
#> 3   33.78      4.427    1    1
```

The running variable runs from \$20k to \$80k. Eligible counties (below \$50k) show a take-up of about 72%; ineligible counties show around 8%. Now visualise and fit the fuzzy RD.

```r title="Visualise and fit the county RD"
rdplot(y = county_df$emp_change, x = county_df$income, c = 50,
       title = "Employment change around income cutoff",
       x.label = "Median income (k$)",
       y.label = "12-month employment rate change (pp)")

rd_county <- rdrobust(y = county_df$emp_change,
                      x = county_df$income,
                      c = 50,
                      fuzzy = county_df$take)
summary(rd_county)
#> Fuzzy RD estimates using local polynomial regression.
#> ...
#> First-stage estimates.
#>   Conventional    0.641     0.052  ...
#> Treatment effect estimates.
#>   Conventional    1.794     0.402   4.463   0.000   [1.006 , 2.582]
#>         Robust       -         -   4.086   0.000   [0.875 , 2.693]
```

The first stage is a 0.64 jump in take-up. The LATE is 1.79 percentage points of employment change per compliant county, almost exactly the 1.8 we injected. The robust 95% CI excludes zero, so we can report that the training program raised employment for counties on the margin.

Always close an RD analysis with the validation suite:

```r title="Validate the county RD"
summary(rddensity(X = county_df$income, c = 50))
summary(rdrobust(y = county_df$emp_change, x = county_df$income, c = 40))
#> (density p-value > 0.1, placebo at 40 not significant)
```

Both checks pass: no sorting around \$50k, and no spurious jump at a fake cutoff. The estimated 1.8-point gain is credible within the modelling assumptions.

## Summary

| Step | Function | What it does |
|---|---|---|
| Visualise | `rdplot()` | Binned-mean plot with fitted polynomials on each side |
| Bandwidth | `rdbwselect()` | MSE-optimal window around the cutoff |
| Estimate | `rdrobust()` | Local linear regression with triangular kernel |
| Validate | `rddensity()` + placebo + sensitivity | Check continuity, placebo cutoffs, bandwidth stability |

Key takeaways:

- Report the **Conventional point estimate** and the **Robust 95% CI**.
- Use `fuzzy=` when compliance is imperfect; read the two-block output carefully.
- Always plot first and always validate. A density discontinuity or unstable point estimate is a red flag.
- The RD effect is a **local average treatment effect** at the cutoff, not the population-average effect. Policy generalisation needs a separate argument.

## References

1. Calonico, S., Cattaneo, M. D., Farrell, M. H., & Titiunik, R., *rdrobust: Software for Regression-Discontinuity Designs*. R Journal (2015). [Link](https://journal.r-project.org/articles/RJ-2015-004/)
2. Cattaneo, M. D., Idrobo, N., & Titiunik, R., *A Practical Introduction to Regression Discontinuity Designs: Foundations*. arXiv:1911.09511 (2019). [Link](https://arxiv.org/pdf/1911.09511)
3. Calonico, S., Cattaneo, M. D., & Titiunik, R., *Robust Nonparametric Confidence Intervals for Regression-Discontinuity Designs*. Econometrica (2014). [Link](https://rdpackages.github.io/references/Calonico-Cattaneo-Titiunik_2014_ECMA.pdf)
4. rdrobust CRAN page. [Link](https://cran.r-project.org/web/packages/rdrobust/index.html)
5. RD Packages project. [Link](https://rdpackages.github.io/)
6. Lee, D. S., & Lemieux, T., *Regression Discontinuity Designs in Economics*. Journal of Economic Literature (2010). [Link](https://www.aeaweb.org/articles?id=10.1257/jel.48.2.281)
7. Cattaneo, M. D., Jansson, M., & Ma, X., *Simple Local Polynomial Density Estimators*. Journal of the American Statistical Association (2020). [Link](https://rdpackages.github.io/rddensity/)

## Continue Learning

- [Multiple Regression in R](Multiple-Regression-in-R.html), the base linear model that RD fits locally on each side of the cutoff.
- [Interpreting Regression Output Completely](Interpreting-Regression-Output-Completely.html), how to read coefficients, standard errors, and p-values from any R regression summary.
- [Logistic Regression in R](Logistic-Regression-in-R.html), when your outcome is binary rather than continuous, and you still want a clean causal comparison.
