---
title: "brms Exercises in R: 8 Bayesian Regression Problems"
slug: "brms-Exercises-in-R"
description: "Eight brms exercises in R with worked solutions: fit Bayesian regressions, set priors, read credible intervals, predict, and build hierarchical models."
keywords: "brms exercises, brms in R, Bayesian regression R, brm() practice, Bayesian regression exercises, credible interval R, hierarchical model brms, loo model comparison"
auto_link_terms: "brms exercises|brms in R|brm()|Bayesian regression in R|credible interval|posterior_predict|loo()|hierarchical model|informative prior|bernoulli()|posterior distribution|R-hat"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-08-01"
curriculum_id: "E12.2"
post_type: "EX"
sidebar_title: "brms Exercises"
fr_parent: "brms-in-R.html"
difficulty: "Intermediate"
---

<p class="lead">Eight practice problems that walk you through a full Bayesian workflow with the brms package, from your first regression to hierarchical models and model comparison. Each problem states a clear task, lets you try it, then reveals a worked solution with the real fitted output. Work through them in order: later problems reuse models you fit earlier.</p>

[NOTE]
**Run the brms solutions in your local R session.** brms writes a Stan program from your formula and compiles it to C++ before sampling, which does not happen in the browser. The short blocks at the start of each exercise are plain base R and run right here in the page, so you can build intuition before you open RStudio. Install the package once with `install.packages("brms")`.

Every exercise uses `mtcars`, the built-in dataset of 32 cars with fuel efficiency (`mpg`), weight (`wt`), horsepower (`hp`), transmission (`am`), and cylinders (`cyl`). Keeping one small dataset lets you focus on the Bayesian ideas instead of the data. Try each problem before opening the solution: the struggle is where the learning happens.

## Exercise 1: How do you fit your first Bayesian regression with brms?

Before you meet brms, look at the tool you already know. Ordinary least squares (OLS), the engine behind `lm()`, fits a line by minimizing squared error and hands you one number per coefficient plus a standard error. Run the baseline so you have something to compare against.

```r title="Fit the least-squares baseline"
# Frequentist baseline: ordinary least squares
fit_ols <- lm(mpg ~ wt, data = mtcars)
round(coef(summary(fit_ols)), 3)
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)   37.285      1.878  19.858        0
#> wt            -5.344      0.559  -9.559        0
```

That table says a car gains about 37.3 mpg at zero weight and loses 5.34 mpg for every extra 1,000 pounds. The standard error (0.559) summarizes the uncertainty as a single spread. A Bayesian fit gives you something richer: a full posterior distribution, which is the range of slope values that stay plausible after combining your data with any prior belief. Instead of one estimate plus one error, you get thousands of draws you can summarize any way you like.

**Your task:** Fit the same model the Bayesian way with `brm(mpg ~ wt, data = mtcars)`, then read the summary. Use 2 chains and 1,000 iterations so it finishes quickly, and set `seed = 1` so your numbers match.

**Hint:** The `brm()` call takes the same formula as `lm()`. Add `chains = 2, iter = 1000, seed = 1, refresh = 0` to keep it fast and quiet, then call `summary()` on the result.

<details>
<summary>Click to reveal solution</summary>

```r-static title="Fit a Bayesian linear regression"
library(brms)

fit_lin <- brm(
  mpg ~ wt,
  data    = mtcars,
  chains  = 2,
  iter    = 1000,
  seed    = 1,
  refresh = 0
)

summary(fit_lin)
#>  Family: gaussian
#>   Links: mu = identity
#> Formula: mpg ~ wt
#>    Data: mtcars (Number of observations: 32)
#>   Draws: 2 chains, each with iter = 1000; warmup = 500; thin = 1;
#>          total post-warmup draws = 1000
#>
#> Regression Coefficients:
#>           Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> Intercept    37.27      2.00    33.51    41.26 1.00      948      662
#> wt           -5.35      0.59    -6.53    -4.24 1.00      905      658
#>
#> Further Distributional Parameters:
#>       Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> sigma     3.16      0.42     2.50     4.15 1.00      876      642
```

**What the code did:** `brm()` translated `mpg ~ wt` into a Stan model, compiled it, and ran two Markov chains that together drew 1,000 samples from the posterior after discarding 500 warmup draws each. `summary()` then collapsed those draws into a table.

**What the output means:** The `Estimate` column is the posterior mean, and it lands almost exactly on the OLS numbers (37.27 and -5.35). The difference is what you gain: `l-95% CI` and `u-95% CI` give a 95% credible interval, so you can say there is a 95% probability the slope is between -6.53 and -4.24. `Est.Error` is the posterior standard deviation, `sigma` is the leftover scatter around the line, and the `Rhat` and `ESS` columns are convergence checks you will meet in Exercise 8.

</details>

## Exercise 2: How do priors change the answer?

A prior is what you believe about a parameter before seeing the data. brms uses gentle default priors so the data, not the prior, drives the estimate, but you can supply your own. Suppose a colleague insists that heavier cars lose about 4 mpg per 1,000 pounds, with some uncertainty. You can encode that as a `normal(-4, 1)` prior on the slope. First, see what that belief looks like on its own.

```r title="Simulate what the prior believes"
# What does a normal(-4, 1) prior on the slope believe before any data?
set.seed(7)
prior_draws <- rnorm(10000, mean = -4, sd = 1)
round(quantile(prior_draws, c(0.025, 0.5, 0.975)), 2)
#>  2.5%   50% 97.5%
#> -5.96 -4.00 -2.00
```

Before seeing a single car, this prior says the slope is probably between -5.96 and -2.00, centered at -4. That is a real opinion, and it disagrees a little with the data, which on its own pointed to about -5.3. When you fit the model, brms blends the two.

**Your task:** Refit `mpg ~ wt` with a `normal(-4, 1)` prior on the `wt` coefficient, then compare its posterior median slope against the default-prior model from Exercise 1.

**Hint:** Build the prior with `prior(normal(-4, 1), class = "b", coef = "wt")` and pass it to `brm()`. Pull each posterior slope with `as_draws_df(fit)$b_wt` and take the `median()` of each.

<details>
<summary>Click to reveal solution</summary>

```r-static title="Fit with an informative prior and compare"
fit_prior <- brm(
  mpg ~ wt,
  data    = mtcars,
  prior   = prior(normal(-4, 1), class = "b", coef = "wt"),
  chains  = 2,
  iter    = 1000,
  seed    = 1,
  refresh = 0
)

round(c(
  default     = median(as_draws_df(fit_lin)$b_wt),
  informative = median(as_draws_df(fit_prior)$b_wt)
), 2)
#>     default informative
#>       -5.33       -5.02
```

**What the code did:** `prior(normal(-4, 1), class = "b", coef = "wt")` set a normal prior on the slope (`class = "b"` means a regression coefficient). `as_draws_df()` pulled the raw posterior draws into a data frame, where `b_wt` is the column of slope samples, and `median()` summarized each.

**What the output means:** The default-prior slope sits at -5.33, close to OLS. The informative prior pulled it toward its own belief of -4, landing at -5.02. The posterior is always a compromise between prior and data, weighted by how strong each one is. With only 32 cars the prior has real pull; with thousands of rows it would barely move.

</details>

[TIP]
**Always run a prior sensitivity check before you trust a Bayesian result.** Fit the model under a couple of reasonable priors, as you just did, and confirm your conclusion does not flip. If it does, you are letting the prior drive the answer instead of the data, and you should say so plainly.

## Exercise 3: How do you report a 90% credible interval?

A credible interval is the Bayesian answer to "how sure are we?" A 90% credible interval is simply the range that holds the middle 90% of the posterior draws. Because it is a statement about the parameter, you can say the plain-English thing everyone wants to say: "there is a 90% probability the slope is in this range." A frequentist confidence interval does not let you say that. You can get the idea from the least-squares numbers first, treating the slope as roughly normal.

```r title="Build a 90% interval from a normal approximation"
# Take the slope estimate (-5.34) and its standard error (0.56) from lm() above.
post_mean <- -5.34
post_sd   <- 0.56
round(post_mean + qnorm(c(0.05, 0.95)) * post_sd, 2)
#> [1] -6.26 -4.42
```

Those two numbers, -6.26 and -4.42, are the 5th and 95th percentiles of a normal centered at -5.34. That is a decent approximation, but the real posterior may be skewed, so you should read the interval straight from the draws instead of assuming a shape.

**Your task:** Pull the 90% credible interval for the `wt` slope directly from `fit_lin`.

**Hint:** `fixef()` returns the fixed-effect coefficients, and its `probs` argument sets which quantiles you want. Ask for `probs = c(0.05, 0.95)`.

<details>
<summary>Click to reveal solution</summary>

```r-static title="Read the credible interval from the fit"
fixef(fit_lin, probs = c(0.05, 0.95))
#>            Estimate Est.Error        Q5      Q95
#> Intercept 37.265616 2.0044209 34.049186 40.64086
#> wt        -5.347817 0.5933275 -6.358572 -4.39285
```

**What the code did:** `fixef()` extracted the population-level coefficients and, thanks to `probs = c(0.05, 0.95)`, reported the 5th and 95th posterior percentiles as columns `Q5` and `Q95`.

**What the output means:** The slope's 90% credible interval is -6.36 to -4.39. Notice how close that is to the -6.26 to -4.42 you got from the normal shortcut: with plenty of data and gentle priors, the Bayesian interval and the frequentist one nearly coincide. What differs is the interpretation. This interval is a direct probability statement about the slope, not a statement about hypothetical repeated samples.

</details>

## Exercise 4: How do you predict a new car's mpg with full uncertainty?

Coefficients are useful, but often you want a prediction for a specific new case. OLS gives you a single predicted value and, by default, no honest sense of spread.

```r title="Predict one point with least squares"
# OLS gives a single number, with no built-in spread:
predict(fit_ols, newdata = data.frame(wt = 3.0))
#>        1
#> 21.25171
```

A 3,000-pound car is predicted at 21.25 mpg. But how confident should you be? A Bayesian posterior predictive distribution answers that by simulating many possible outcomes, folding in both the uncertainty about the coefficients and the natural scatter of real cars around the line.

**Your task:** Use `fit_lin` to produce the posterior predictive distribution of `mpg` for a car with `wt = 3.0`, then report the mean and a 90% predictive interval.

**Hint:** `posterior_predict(fit, newdata = ...)` returns a matrix of simulated outcomes. Summarize its column with `mean()` and `quantile(..., c(0.05, 0.95))`.

<details>
<summary>Click to reveal solution</summary>

```r-static title="Predict with the posterior predictive distribution"
newcar <- data.frame(wt = 3.0)
pp <- posterior_predict(fit_lin, newdata = newcar)

round(c(
  mean = mean(pp),
  q05  = unname(quantile(pp, 0.05)),
  q95  = unname(quantile(pp, 0.95))
), 2)
#>  mean   q05   q95
#> 21.26 15.88 26.29
```

**What the code did:** `posterior_predict()` drew a simulated `mpg` for the new car from every posterior sample, producing a whole distribution of plausible outcomes. `mean()` and `quantile()` then summarized it.

**What the output means:** The predictive mean, 21.26, matches the OLS point prediction almost exactly. The difference is the interval: from 15.88 to 26.29, an honest 90% range for a single new car. That band is far wider than the credible interval for the slope, because predicting one real car carries residual scatter on top of coefficient uncertainty. When you forecast an individual outcome, quote the predictive interval, not the coefficient interval.

</details>

[KEY INSIGHT]
**A posterior over parameters becomes a posterior over anything you compute from them.** Once brms hands you draws, a prediction, a difference between groups, or a probability that a coefficient is positive is just a summary of those draws. You never have to derive a new formula for uncertainty; you summarize the samples.

## Exercise 5: How do you fit a Bayesian logistic regression?

Not every outcome is a number on a continuous scale. Transmission type (`am`) is 0 for automatic and 1 for manual, a yes/no outcome. Logistic regression models the log-odds of the "yes" as a linear function of predictors. The frequentist version is one line of base R.

```r title="Fit a frequentist logistic baseline"
# Frequentist logistic regression for comparison:
fit_glm <- glm(am ~ hp + wt, data = mtcars, family = binomial)
round(coef(fit_glm), 3)
#> (Intercept)          hp          wt
#>      18.866       0.036      -8.083
```

The `family = binomial` argument tells `glm()` this is a yes/no outcome. The negative weight coefficient says heavier cars are less likely to be manual. To get a posterior over these log-odds, you switch to brms and set its matching family, `bernoulli()`.

**Your task:** Fit `am ~ hp + wt` with `brm()` and `family = bernoulli()`, then read the coefficients.

**Hint:** The formula and data are the same as the `glm()` call. Add `family = bernoulli()` to `brm()` and inspect the result with `fixef()`.

<details>
<summary>Click to reveal solution</summary>

```r-static title="Fit a Bayesian logistic regression"
fit_logit <- brm(
  am ~ hp + wt,
  data    = mtcars,
  family  = bernoulli(),
  chains  = 2,
  iter    = 1000,
  seed    = 5,
  refresh = 0
)

fixef(fit_logit)
#>               Estimate  Est.Error         Q2.5      Q97.5
#> Intercept  25.44023554 9.45110377  10.94618156 46.1270537
#> hp          0.05021934 0.02233619   0.01471145  0.1007207
#> wt        -10.81204019 3.80545851 -18.99550786 -4.9454987
```

**What the code did:** `family = bernoulli()` told brms to model a binary outcome on the log-odds scale, the Bayesian counterpart of `glm(..., family = binomial)`. `fixef()` reported each coefficient's posterior mean and 95% credible interval.

**What the output means:** The signs agree with the frequentist fit: horsepower raises the odds of a manual transmission, weight lowers them. The estimates are larger in size than the `glm()` values because the posterior explores the full uncertainty rather than settling on a single maximum-likelihood point, and the intervals are wide (weight runs from about -19 to -5). With only 32 cars, that width is the honest level of uncertainty, and the wide credible intervals report it directly.

</details>

## Exercise 6: How do you add group structure with a hierarchical model?

So far every car shared one intercept. But cars cluster: 4-, 6-, and 8-cylinder engines have different baseline efficiencies. A hierarchical model, also called a multilevel or mixed model, gives each group its own intercept while tying those intercepts together through a shared distribution. First, confirm the groups really differ.

```r title="Check the group averages"
# Average mpg differs by cylinder group, so one shared intercept is too rigid:
aggregate(mpg ~ cyl, data = mtcars, FUN = mean)
#>   cyl      mpg
#> 1   4 26.66364
#> 2   6 19.74286
#> 3   8 15.10000
```

The groups clearly differ, from 26.7 mpg for 4-cylinder cars down to 15.1 for 8-cylinder ones. A hierarchical model lets each cylinder group shift its own intercept up or down, but pulls small or noisy groups toward the overall average. This gentle pull is called partial pooling, and it protects you from over-trusting a group with only a few cars.

**Your task:** Fit `mpg ~ wt + (1 | cyl)` with `brm()`, treating `cyl` as a grouping factor, then read the summary.

**Hint:** The term `(1 | cyl)` adds a varying intercept per cylinder group. Make `cyl` a factor first, for example with `transform(mtcars, cyl = factor(cyl))`, then fit and call `summary()`.

<details>
<summary>Click to reveal solution</summary>

```r-static title="Fit a hierarchical model with varying intercepts"
mtcars_h <- transform(mtcars, cyl = factor(cyl))

fit_hier <- brm(
  mpg ~ wt + (1 | cyl),
  data    = mtcars_h,
  chains  = 2,
  iter    = 1000,
  seed    = 3,
  refresh = 0
)

summary(fit_hier)
#>  Family: gaussian
#>   Links: mu = identity
#> Formula: mpg ~ wt + (1 | cyl)
#>    Data: mtcars_h (Number of observations: 32)
#>   Draws: 2 chains, each with iter = 1000; warmup = 500; thin = 1;
#>          total post-warmup draws = 1000
#>
#> Multilevel Hyperparameters:
#> ~cyl (Number of levels: 3)
#>               Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> sd(Intercept)     3.75      2.24     0.97     9.58 1.00      309      434
#>
#> Regression Coefficients:
#>           Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> Intercept    31.44      3.40    23.71    38.07 1.00      345      153
#> wt           -3.59      0.83    -5.31    -1.98 1.00      521      531
#>
#> Further Distributional Parameters:
#>       Estimate Est.Error l-95% CI u-95% CI Rhat Bulk_ESS Tail_ESS
#> sigma     2.69      0.39     2.04     3.57 1.01      607      497
```

**What the code did:** `(1 | cyl)` told brms to estimate one intercept per cylinder group, drawn from a shared normal distribution whose standard deviation, `sd(Intercept)`, brms estimates from the data. The rest of the call is the same as your first model.

**What the output means:** Two things changed. The `Multilevel Hyperparameters` block reports `sd(Intercept)` at 3.75, meaning cylinder groups differ by roughly 3.75 mpg in baseline efficiency. And the weight slope shrank from -5.35 to -3.59, because some of what plain OLS blamed on weight was really the cylinder groups differing. Once you let groups have their own baselines, weight gets less credit.

</details>

[WARNING]
**Three groups is too few to pin down a group-level standard deviation.** Notice how wide the `sd(Intercept)` interval is, from 0.97 to 9.58. mtcars has only three cylinder categories, and estimating a variance from three numbers is genuinely hard. Hierarchical models earn their keep when you have several groups; aim for at least five to eight before leaning on the group-level spread.

## Exercise 7: How do you compare two models with LOO?

You have two candidate models for `mpg`: weight alone, and weight plus horsepower. Which predicts better on data it has not seen? The frequentist quick answer is AIC, where lower is better.

```r title="Compare models with AIC"
# Frequentist model comparison by AIC (lower is better):
m1 <- lm(mpg ~ wt,      data = mtcars)
m2 <- lm(mpg ~ wt + hp, data = mtcars)
AIC(m1, m2)
#>    df      AIC
#> m1  3 166.0294
#> m2  4 156.6523
```

AIC prefers the two-predictor model (156.7 versus 166.0). The Bayesian counterpart is leave-one-out cross-validation, or LOO, which estimates how well each model predicts a left-out point without actually refitting 32 times. It reports the expected log predictive density (elpd), where higher is better, and, crucially, a standard error for the difference so you know whether the gap is real.

**Your task:** Fit `mpg ~ wt + hp` with `brm()`, then compare it against `fit_lin` using `loo_compare()`.

**Hint:** Compute `loo()` on each fitted model, then hand both results to `loo_compare()`. Name the two loo objects so the output rows are easy to read.

<details>
<summary>Click to reveal solution</summary>

```r-static title="Compare two Bayesian models with LOO"
fit_add <- brm(
  mpg ~ wt + hp,
  data    = mtcars,
  chains  = 2,
  iter    = 1000,
  seed    = 1,
  refresh = 0
)

loo_lin <- loo(fit_lin)
loo_add <- loo(fit_add)
loo_compare(loo_lin, loo_add)
#>    model elpd_diff se_diff p_worse diag_diff       diag_elpd
#>  fit_add       0.0     0.0      NA           1 k_psis > 0.67
#>  fit_lin      -4.3     2.0    0.98   N < 100
```

**What the code did:** `loo()` estimated each model's out-of-sample predictive accuracy with Pareto-smoothed importance sampling, and `loo_compare()` ranked them, putting the best model on top with a difference of zero.

**What the output means:** The two-predictor model `fit_add` wins, and `fit_lin` trails it by 4.3 elpd units. Because that gap (4.3) is about twice its standard error (2.0), the evidence leans toward keeping horsepower but is not overwhelming. Note the diagnostic columns: `N < 100` and `k_psis > 0.67` are LOO warning you that with only 32 rows its approximation is shaky. On small data, read a LOO comparison as suggestive, not final, and confirm it with a held-out test if the decision matters.

</details>

## Exercise 8: How do you check that the sampler converged?

brms answers by simulation, running Markov chains that wander through the posterior. If the chains did not mix well, the summary numbers are not trustworthy. Two diagnostics tell you whether to believe the fit. R-hat compares the variation between chains to the variation within each chain; when the chains agree, R-hat sits near 1.00. You can feel the idea with two toy chains that both sample the same target.

```r title="See why well-mixed chains agree"
# Two well-mixed chains sampling the same target have nearly equal means.
set.seed(9)
chains <- matrix(rnorm(1000), ncol = 2)   # columns = two chains of 500 draws
round(apply(chains, 2, mean), 3)          # chain means should be close
#> [1] -0.012  0.023
```

Both chains land near zero, so their between-chain spread is tiny compared to the scatter within each chain, and R-hat would be about 1. If one chain had drifted to a different value, R-hat would climb above 1 and warn you. The second diagnostic, effective sample size (ESS), counts how many truly independent draws you effectively have after accounting for the correlation between consecutive steps.

**Your task:** Report the posterior mean, R-hat, and bulk ESS for every parameter in `fit_lin`.

**Hint:** The `posterior` package works on any brms fit. Convert with `as_draws()` and summarize with `summarise_draws(draws, "mean", "rhat", "ess_bulk")`.

<details>
<summary>Click to reveal solution</summary>

```r-static title="Report R-hat and effective sample size"
library(posterior)
summarise_draws(as_draws(fit_lin), "mean", "rhat", "ess_bulk")
#> # A tibble: 6 × 4
#>   variable      mean  rhat ess_bulk
#>   <chr>        <dbl> <dbl>    <dbl>
#> 1 b_Intercept  37.3  1.00      948.
#> 2 b_wt         -5.35 1.00      905.
#> 3 sigma         3.16 1.00      876.
#> 4 Intercept    20.1  1.01      920.
#> 5 lprior       -4.92 0.999     845.
#> 6 lp__        -85.4  1.00      452.
```

**What the code did:** `as_draws()` handed the posterior samples to the `posterior` package, and `summarise_draws()` computed the mean, R-hat, and bulk ESS for each parameter, including brms internals like `lp__` (the log-posterior).

**What the output means:** Every R-hat is 1.00 or 1.01, at or under the usual 1.01 threshold, so the chains converged. Every bulk ESS is in the hundreds, above the rule-of-thumb floor of 400 for stable summaries. If you ever see R-hat above 1.01 or ESS in the low dozens, run more iterations or more chains before you trust a single number in the summary. These two checks are the first thing to read on any brms fit, before the coefficients.

</details>

## Frequently asked questions

**Should I use brms or rstanarm?** Both fit Bayesian regressions with familiar formula syntax. rstanarm ships pre-compiled models for common cases, so it starts sampling instantly, while brms compiles a fresh Stan program per model. The trade is flexibility: brms supports far more families, custom priors, non-linear terms, and distributional models. Learn brms as your general tool and reach for rstanarm when you want a quick standard GLM.

**Why is brms so slow the first time I run a model?** The first run spends most of its time translating your formula into Stan code and compiling that to C++, not sampling. Fit the model once, save the object, and reuse it for summaries and predictions. Installing the cmdstanr backend speeds compilation noticeably if you fit many models.

**How many chains and iterations do I actually need?** The brms defaults, 4 chains of 2,000 iterations, are a sensible starting point. These exercises use 2 chains of 1,000 to run fast. The right number is not fixed: watch R-hat and effective sample size from Exercise 8. If R-hat sits at 1.00 and ESS is in the hundreds, you have enough; if not, run more.

**How do I choose a prior?** Start weakly informative, letting the data lead, and add real domain knowledge only for the scale of an effect, as you did in Exercise 2. Always inspect what brms used with `prior_summary()`, and run a sensitivity check across a couple of reasonable priors. Fully flat priors are rarely the best choice and can make sampling harder.

**How many groups do I need for a hierarchical model?** Enough to estimate the group-level standard deviation, which is hard with only a handful. mtcars has three cylinder groups, which is why its `sd(Intercept)` interval in Exercise 6 was so wide. Aim for at least five to eight groups, and more when the group-level spread is the quantity you care about.

## Summary

You worked through the full brms regression toolkit on one small dataset. Here is what each problem practiced and the function that carries it.

| Exercise | Skill | Key function |
|----------|-------|--------------|
| 1 | Fit a Bayesian linear regression | `brm()`, `summary()` |
| 2 | Set an informative prior and compare | `prior()`, `as_draws_df()` |
| 3 | Report a credible interval | `fixef(probs = ...)` |
| 4 | Predict with full uncertainty | `posterior_predict()` |
| 5 | Fit a logistic regression | `brm(family = bernoulli())` |
| 6 | Build a hierarchical model | `brm(y ~ x + (1 | group))` |
| 7 | Compare models out of sample | `loo()`, `loo_compare()` |
| 8 | Check convergence | `summarise_draws()` |

The thread running through all eight is that brms turns a familiar formula into a posterior distribution, and every quantity you care about, whether a slope, a prediction, or a model comparison, is just a summary of that posterior's draws.

## References

1. Burkner, P. C. brms: An R Package for Bayesian Multilevel Models Using Stan. Journal of Statistical Software (2017). [Link](https://www.jstatsoft.org/article/view/v080i01)
2. brms package on CRAN. [Link](https://cran.r-project.org/package=brms)
3. brms package website and vignettes. [Link](https://paul-buerkner.github.io/brms/)
4. Stan documentation. [Link](https://mc-stan.org/users/documentation/)
5. loo package: efficient LOO cross-validation and model comparison. [Link](https://mc-stan.org/loo/)
6. posterior package: tools for working with posterior draws (R-hat, ESS). [Link](https://mc-stan.org/posterior/)
7. McElreath, R. Statistical Rethinking, a course and textbook on applied Bayesian modeling. [Link](https://xcelab.net/rm/statistical-rethinking/)

## Continue learning

- **[brms in R: Bayesian Regression Without Writing Stan](brms-in-R.html)**: the parent tutorial that explains every concept these exercises drill, from formula syntax to diagnostics.
- **[Bayesian Statistics in R](Bayesian-Statistics-in-R.html)**: how priors and posteriors work, and what a credible interval really means.
- **[Bayesian Statistics Exercises in R](Bayesian-Statistics-Exercises-in-R.html)**: 20 more problems spanning conjugate priors and grid approximation, plus deeper MCMC diagnostics.
- **[GLM Exercises in R](GLM-Exercises-in-R.html)**: frequentist generalized linear models that translate directly to Bayesian GLMs with brms.
- **[Mixed Effects Models Exercises in R](Mixed-Effects-Models-Exercises-in-R.html)**: more practice with the group structure you met in Exercise 6.
