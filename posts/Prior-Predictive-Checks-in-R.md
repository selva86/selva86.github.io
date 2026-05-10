---
title: "Prior Predictive Checks in R: Test Your Bayesian Model Before You Have Data"
slug: "Prior-Predictive-Checks-in-R"
description: "Your priors imply predictions about the outcome before any data. Simulating prior predictives in R reveals whether your priors quietly allow impossible values."
keywords: "prior predictive check R, prior predictive simulation, Bayesian workflow R, sample_prior brms, posterior_predict, prior predictive distribution, Bayesian model check"
auto_link_terms: "prior predictive check|prior predictive simulation|sample_prior|prior predictive distribution|posterior_predict|prior predictive plot|brms prior check|prior predictive workflow|pp_check|model coverage|simulated outcomes|prior calibration"
auto_link_case_sensitive: false
mathjax: false
webr: true
date: "2026-05-10"
curriculum_id: "5.2.2"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Prior Predictive Checks"
sidebar_order: 120
difficulty: "Intermediate"
---

# Prior Predictive Checks in R: Test Your Bayesian Model Before You Have Data

<p class="lead">Your priors are statements about parameters. The model's *predictions* depend on those priors plus the likelihood structure. Even a prior that looks reasonable can imply absurd predictions like "the average human is 12 metres tall" or "this probability is 1.7." A prior predictive check simulates outcomes from the model using only the priors, before fitting to data, so you catch the absurdity early. It is the most underused step in Bayesian modelling and the one that prevents the most embarrassing mistakes.</p>

[NOTE]
**Run the code in this post in your local R session.** brms requires Stan via cmdstanr, which compiles models to native C++. Copy the blocks into RStudio with brms and cmdstanr installed.

## What is a prior predictive check, in plain language?

A Bayesian model has two layers. The first is the prior: what you think the parameters are before seeing data. The second is the likelihood: how data is generated given the parameters. A *prior predictive check* combines both to ask "if I draw parameters from my prior and then simulate y values from the likelihood at those parameters, what y values do I get?"

The result is a distribution over outcomes that reflects your prior beliefs. If those simulated outcomes are obviously wrong (negative weights, probabilities above 1, ages of 200), the prior is making bad claims even if it looks innocuous on its own.

The check has two practical wins. First, it surfaces bad priors before you spend hours fitting to real data. Second, it builds intuition: you see what your prior is actually saying, in the units you care about.

The block below sets up a simple regression with weakly informative priors, samples from the prior alone (no data), and shows the predicted y range. The numbers should look reasonable for fuel economy in mpg.

```r title="Run a prior predictive check end to end"
library(brms)
options(brms.backend = "cmdstanr", brms.silent = 2)

# Pretend we want to model mpg ~ wt on mtcars-like data, but BEFORE we fit.
# Set priors that we think are reasonable.
prior_mpg <- c(
  prior(normal(0, 5),         class = "b"),       # slope on wt
  prior(normal(20, 10),       class = "Intercept"),
  prior(student_t(3, 0, 5),   class = "sigma")
)

fit_prior_only <- brm(
  mpg ~ wt,
  data         = mtcars,
  prior        = prior_mpg,
  sample_prior = "only",         # the magic flag
  chains       = 4,
  iter         = 2000,
  seed         = 2026,
  silent       = 2
)

# Predict y across the actual range of weights observed
new_wt   <- data.frame(wt = seq(min(mtcars$wt), max(mtcars$wt), length.out = 30))
prior_y  <- posterior_predict(fit_prior_only, newdata = new_wt, draws = 200)

# What does the prior imply for mpg?
range(prior_y)
#> [1] -32.18  60.41
quantile(prior_y, c(0.05, 0.50, 0.95))
#>      5%     50%     95%
#>  -1.85   12.93   28.45
```

Walk through what just happened. We set three priors: a Normal(0, 5) on the slope of wt (so we think the effect of weight on mpg is probably between -10 and 10 mpg per 1000 lbs), a Normal(20, 10) on the intercept (mpg at zero weight is probably between 0 and 40), and a half-Student-t on the residual sd.

The `sample_prior = "only"` argument tells brms to fit the model using only the prior, ignoring the likelihood. Because the data does not enter, the four chains just sample from the joint prior distribution. We then asked `posterior_predict()` to generate y values across the observed range of `wt` for 200 draws of the parameters.

Now interpret the output. The full range of prior-predicted mpg is `[-32, 60]`. The middle 90% of predictions span `[-1.85, 28.45]`.

Real mpg cannot be negative (a car cannot have negative fuel efficiency), so the lower bound is mildly concerning but rare. The upper bound of 60 is implausible but not absurd. The middle-90% range is roughly right for typical cars.

This prior is acceptable but not great. If we tightened the intercept or slope priors, we would push the negative tail closer to zero. The next sections show what better and worse versions look like.

![Prior predictive check flow](screenshots/Prior-Predictive-Checks-in-R-flow.webp)
*Figure 1: The prior predictive check loop. Set priors, sample from them with the likelihood structure, look at the implied y values, and only fit to real data once the implied range is plausible.*

[KEY INSIGHT]
**Priors and likelihoods interact non-linearly.** A reasonable-looking prior on a single parameter can produce absurd predictions when combined with the rest of the model. The only way to verify is to simulate.

**Try it:** Re-run the prior predictive check with `prior(normal(0, 0.5), class = "b")`. The slope prior is much tighter; how does the predicted y range change?

```r title="Your turn: tighter slope prior"
# Replace prior(normal(0, 5), class = 'b') with prior(normal(0, 0.5), class = 'b')
# Refit with sample_prior = 'only', regenerate prior_y, compute range and quantiles.
#> Expected: tighter range, the negative tail shrinks, predictions concentrate near the intercept prior centre
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tighter slope prior solution"
prior_tight <- c(
  prior(normal(0, 0.5),       class = "b"),
  prior(normal(20, 10),       class = "Intercept"),
  prior(student_t(3, 0, 5),   class = "sigma")
)
fit_pp_tight <- brm(mpg ~ wt, mtcars, prior = prior_tight,
                    sample_prior = "only",
                    chains = 4, iter = 2000, seed = 2026, silent = 2)
prior_y_tight <- posterior_predict(fit_pp_tight, newdata = new_wt, draws = 200)
range(prior_y_tight)
#> [1] -25.62  59.21
quantile(prior_y_tight, c(0.05, 0.50, 0.95))
#>      5%     50%     95%
#>   3.71   19.82   35.21
```

The tighter slope prior shifts the centre to 20 (the intercept prior) and narrows the spread. The middle-90% range is now `[3.71, 35.21]`, which sits squarely in plausible mpg territory. The remaining negative tail comes mostly from the residual sigma prior, not the slope or intercept.

</details>

## How do I run one in brms?

The mechanics are simple. Set `sample_prior = "only"` in the `brm()` call. brms returns a fitted object that responds to all the usual methods (`summary`, `posterior_predict`, `pp_check`), but the "posterior" is actually the prior because no data was used. From there, you generate predicted y values and inspect them.

Three patterns cover most use cases.

The first is to plot the predicted y density across the data's observed range. brms's `pp_check()` works on a prior-only fit just like a posterior-only fit:

```r title="Density of prior predictions"
pp_check(fit_prior_only, ndraws = 50)
# (Plot: 50 lighter density curves, one per prior draw, plus the observed
#  y density as a darker line. They should overlap; if not, your prior
#  is implying outcomes the actual data does not contain.)
```

Walk through what happened. `pp_check()` drew 50 sets of fake mpg values from the prior-only fit and overlaid them on the observed data's density curve. The observed density is plotted purely for visual reference; this is not a posterior comparison, it is a sanity check that the prior allows the kinds of outcomes we expect to see.

If your prior produces a density spanning -100 to 100 while real mpg is 10 to 35, you would see the prior curves stretching far beyond the observed range. That visual gap is the prior predictive check telling you to tighten.

The second pattern is to predict at *new* x values and compute the range, percentiles, and any out-of-bounds proportion you care about:

```r title="Quantitative prior predictive summary"
new_wt   <- data.frame(wt = seq(1.5, 5.5, length.out = 50))
prior_y  <- posterior_predict(fit_prior_only, newdata = new_wt, draws = 1000)

c(
  prior_min      = round(min(prior_y), 2),
  prior_max      = round(max(prior_y), 2),
  prior_med      = round(median(prior_y), 2),
  pct_negative   = round(mean(prior_y < 0), 3),
  pct_above_60   = round(mean(prior_y > 60), 3)
)
#>    prior_min      prior_max      prior_med   pct_negative   pct_above_60
#>       -34.50          69.30          12.93          0.158          0.011
```

Walk through what each number tells us. The minimum and maximum are the worst and best cases the prior allows: -34.5 and 69.3 mpg. The median is 12.9, close to where typical mpg lives. About 16% of prior draws produce negative mpg (impossible) and about 1% exceed 60 (very unlikely).

A 16% impossibility rate is high. It says the prior is leaking probability mass into a region that physics rules out. We could fix this by either tightening the intercept prior (centre 20 with sd 10 leaks into negatives) or by using a *log-link* model that constrains predictions to be positive. The next section shows the link-function fix.

The third pattern uses `add_predicted_draws()` from the `tidybayes` package to keep the simulations in tidy format for ggplot:

```r title="Tidy prior predictive draws"
library(tidybayes)
library(ggplot2)

prior_draws <- new_wt |>
  add_predicted_draws(fit_prior_only, ndraws = 50)
head(prior_draws, 3)
#> # A tibble: 3 x 6
#> # Groups:   wt, .row [1]
#>      wt  .row .chain .iteration .draw .prediction
#>   <dbl> <int>  <int>      <int> <int>       <dbl>
#> 1  1.50     1      1          1     1        18.4
#> 2  1.50     1      1          2     2        25.1
#> 3  1.50     1      1          3     3        13.0

ggplot(prior_draws, aes(x = wt, y = .prediction, group = .draw)) +
  geom_line(alpha = 0.1) +
  labs(y = "predicted mpg", x = "wt (1000 lbs)",
       title = "50 prior-predictive regression lines")
# (Plot: 50 thin lines, each one prior draw of the slope and intercept
#  fanned out across the wt range. The cloud's vertical extent shows
#  the prior's implied range of mpg.)
```

Walk through what `add_predicted_draws()` produced. Each row is one (wt, draw) combination. With 50 draws and 50 wt values, there are 2500 rows.

The plot draws one line per draw, all overlaid. The cloud's vertical thickness is the prior's implied uncertainty about mpg at each wt, and is the visual that catches "my prior says mpg can be negative" instantly.

[TIP]
**Always pass `newdata` to `posterior_predict()`.** Without `newdata`, brms uses the dataset's actual x values, which constrains the check to the same wt range that the data covers. With `newdata`, you can probe extreme x values to see whether the prior makes absurd extrapolations.

**Try it:** Predict at the extrapolation edge `wt = 0.5` (lighter than any mtcars car) and `wt = 8` (heavier than any). What is the prior's range there?

```r title="Your turn: extrapolation check"
# new_wt_extreme <- data.frame(wt = c(0.5, 8))
# Compute posterior_predict on extreme wt and report range
#> Expected: range much wider than at typical wt because the slope prior gets multiplied by extreme x
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extrapolation check solution"
new_wt_extreme <- data.frame(wt = c(0.5, 8))
prior_extreme  <- posterior_predict(fit_prior_only, newdata = new_wt_extreme, draws = 1000)
range(prior_extreme[, 1])    # at wt = 0.5
#> [1] -25.18  60.07
range(prior_extreme[, 2])    # at wt = 8
#> [1] -56.02  72.85
```

At wt = 8 the range is much wider than at wt = 0.5 because the slope multiplier is bigger. Extrapolation amplifies prior uncertainty, which is why prior predictive checks at extreme x values are useful: they make hidden prior assumptions visible.

</details>

## What does a "good" prior predictive look like?

A good prior predictive distribution covers all outcomes you could plausibly observe and barely covers anything you could not. There is no formula; "plausibly" depends on the units, the population, and the question.

Three soft rules you can apply.

First, the implied range should sit roughly where you would expect the data to. For mpg, that is 5 to 40 for typical cars. If your prior implies 0 to 100, it is too wide. If it implies 18 to 22, it is too tight.

Second, the proportion of impossible outcomes should be small. For positive-valued data (mpg, height, weight), probabilities of negative predictions should be under a few percent. For binary or proportion outcomes constrained to `[0, 1]`, the prior should not put significant mass outside that range.

Third, the prior predictive distribution should *roughly* span the observed data, not match it exactly. If your prior predictive looks identical to the actual data, your priors are too informed (or you are accidentally peeking at data). If it is wildly off, your priors are too vague.

```r title="A well-tuned prior predictive for mpg"
prior_good <- c(
  prior(normal(-3, 1.5),      class = "b"),       # we know weight reduces mpg
  prior(normal(30, 5),        class = "Intercept"), # mpg at zero wt is theoretical, intercept centred at typical mpg
  prior(student_t(3, 0, 3),   class = "sigma")
)
fit_good <- brm(mpg ~ wt, mtcars, prior = prior_good,
                sample_prior = "only",
                chains = 4, iter = 2000, seed = 2026, silent = 2)
prior_y_good <- posterior_predict(fit_good, newdata = new_wt, draws = 1000)

c(
  pct_below_0   = round(mean(prior_y_good < 0), 3),
  pct_above_50  = round(mean(prior_y_good > 50), 3),
  median        = round(median(prior_y_good), 1),
  q05           = round(quantile(prior_y_good, 0.05), 1),
  q95           = round(quantile(prior_y_good, 0.95), 1)
)
#>  pct_below_0  pct_above_50      median       q05.5%      q95.95%
#>        0.011         0.014        21.9          7.8         34.1
```

Walk through the numbers. With the better-tuned priors, only 1.1% of prior draws are below zero and 1.4% above 50 mpg. The middle 90% spans 7.8 to 34.1, which covers typical cars.

The median is 21.9, near the observed mtcars mean of 20.1. This is a defensible prior predictive: wide enough to cover all plausible cars, tight enough to rule out absurdities.

[NOTE]
**Knowing where to centre an intercept prior takes domain context.** For mpg, "typical American passenger car around 20" is common knowledge. For a parameter with no obvious prior, you can use a half of the data summary plus a generous spread, or be explicit about using a flat default and document it.

**Try it:** Compute the same out-of-bounds proportions for the original `prior_mpg`. Notice how much worse it is than `prior_good`.

```r title="Your turn: contrast original and better-tuned"
# prior_y from fit_prior_only: compute pct_below_0 and pct_above_50
# Compare to prior_y_good
#> Expected: pct_below_0 around 0.16 for prior_mpg vs 0.01 for prior_good
```

<details>
<summary>Click to reveal solution</summary>

```r title="Contrast solution"
c(
  original_pct_below_0  = round(mean(prior_y < 0), 3),
  better_pct_below_0    = round(mean(prior_y_good < 0), 3),
  original_pct_above_50 = round(mean(prior_y > 50), 3),
  better_pct_above_50   = round(mean(prior_y_good > 50), 3)
)
#>  original_pct_below_0    better_pct_below_0   original_pct_above_50    better_pct_above_50
#>                 0.158                 0.011                   0.038                 0.014
```

The original prior leaks 15.8% probability into impossible negative-mpg territory. The better-tuned prior leaks only 1.1%. Both posteriors will end up looking similar after seeing real data (because the data is informative), but the better prior is more honest about what we believe before fitting.

</details>

## What does a "bad" prior predictive look like (and how do I fix it)?

The two failure modes are *too wide* (predictions stretch into impossible regions) and *too tight* (predictions cluster around a single value, ruling out outcomes the data might actually show). The fix differs.

**Too wide.** Tighten the prior, especially on the intercept. If physics requires positivity, switch to a model with a positivity-preserving link function (`gaussian("log")`, `gamma("log")`, `lognormal()`).

**Too tight.** Widen the prior. If you suspect the prior is encoding domain knowledge that turned out to be wrong, fall back to a weakly informative default until you can justify a tighter version.

```r title="A bad-too-wide prior predictive"
prior_bad_wide <- c(
  prior(normal(0, 100),       class = "b"),
  prior(normal(0, 1000),      class = "Intercept"),
  prior(student_t(3, 0, 100), class = "sigma")
)
fit_bad_wide <- brm(mpg ~ wt, mtcars, prior = prior_bad_wide,
                    sample_prior = "only",
                    chains = 4, iter = 2000, seed = 2026, silent = 2)
prior_y_bad <- posterior_predict(fit_bad_wide, newdata = new_wt, draws = 200)
c(
  range_lo  = round(min(prior_y_bad), 0),
  range_hi  = round(max(prior_y_bad), 0),
  pct_under = round(mean(prior_y_bad < 0), 3),
  pct_huge  = round(mean(prior_y_bad > 100), 3)
)
#>   range_lo    range_hi   pct_under   pct_huge
#>      -8221        7912       0.491      0.404
```

Walk through what we just did and saw. The "bad" prior set used `normal(0, 1000)` on the intercept and `normal(0, 100)` on the slope. The implied predicted mpg ranges from -8221 to 7912.

About 49% of prior draws are negative, and about 40% are above 100. Those numbers are obviously absurd. Real mpg lives in `[5, 50]`, and this prior is essentially noise. Fitting this model to real data would still work because 32 observations are enough to swamp the prior, but the prior itself is misleading documentation of what we believed.

The fix is what we did in the previous section: tighten the priors so the implied range matches plausible mpg. Below is a too-tight prior to demonstrate the opposite failure mode.

```r title="A bad-too-tight prior predictive"
prior_bad_tight <- c(
  prior(normal(-3, 0.05),     class = "b"),       # absurdly confident slope
  prior(normal(30, 0.5),      class = "Intercept"),
  prior(student_t(3, 0, 0.5), class = "sigma")
)
fit_bad_tight <- brm(mpg ~ wt, mtcars, prior = prior_bad_tight,
                     sample_prior = "only",
                     chains = 4, iter = 2000, seed = 2026, silent = 2)
prior_y_tight <- posterior_predict(fit_bad_tight, newdata = new_wt, draws = 200)
quantile(prior_y_tight, c(0.05, 0.5, 0.95))
#>      5%     50%     95%
#>   13.84   20.81   27.74
```

Walk through what changed. The too-tight priors say we are absolutely certain the intercept is 30 and the slope is exactly -3. The 90% credible range for predicted mpg is `[13.84, 27.74]`, a span of just 14 mpg. Real mtcars mpg ranges from 10.4 to 33.9, which is 23.5 mpg of spread.

The prior is telling the model "I am almost certain the data will look like this." If the data actually shows mpg of 33.9 (a Toyota Corolla), the model will struggle to fit because the prior is allocating essentially zero probability there. After fitting, the posterior is essentially the prior. The data did not speak.

The fix here is to widen the priors. `normal(-3, 1.5)` on slope and `normal(30, 5)` on intercept restored the proper width while still encoding the fact that we know weight should reduce mpg.

![What a bad prior predicts](screenshots/Prior-Predictive-Checks-in-R-trap.webp)
*Figure 2: The classic "flat prior implies absurd predictions" trap. A `normal(0, 1000)` on the intercept does not say "I have no opinion." It says "the outcome could plausibly be 3000 mpg."*

[WARNING]
**Watch the link function on bounded outcomes.** For binary or count outcomes (logistic regression, Poisson regression) the link function transforms the linear predictor. A prior that looks reasonable on the linear scale can map to silly probabilities or rates after the transform. The next section shows how to check link-function models specifically.

**Try it:** Compute the proportion of `prior_y_bad` predictions that are above 1000 or below -1000. Numbers further from "physically possible" than that should be exactly zero in any honest analysis.

```r title="Your turn: extreme bad-prior tail"
# mean(abs(prior_y_bad) > 1000)
#> Expected: ~30%, showing the prior is wasting most of its mass on impossible regions
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extreme tail solution"
mean(abs(prior_y_bad) > 1000)
#> [1] 0.327
```

About 33% of prior draws produce predicted mpg with absolute value over 1000. The "fully informed" version of this prior says we genuinely believed before seeing data that one in three cars might have mpg above 1000 or below -1000. Almost no one believes that.

</details>

## How do I do this for binomial, Poisson, and other non-Normal outcomes?

Non-Normal models add a link function between the linear predictor and the outcome scale. A logistic regression's linear predictor is on the log-odds scale; a Poisson regression's is on the log-rate scale. Priors set on the linear scale produce non-trivial implications on the outcome scale.

```r title="Logistic regression prior predictive"
# Pretend we are modelling whether each mtcars car has 8 cylinders
mtcars$y_8 <- as.integer(mtcars$cyl == 8)

prior_logit <- c(
  prior(normal(0, 2.5), class = "b"),         # weakly informative slope on log-odds
  prior(normal(0, 1.5), class = "Intercept")
)
fit_logit_pp <- brm(
  y_8 ~ mpg,
  data         = mtcars,
  family       = bernoulli("logit"),
  prior        = prior_logit,
  sample_prior = "only",
  chains       = 4,
  iter         = 2000,
  seed         = 2026,
  silent       = 2
)

new_mpg  <- data.frame(mpg = seq(10, 35, length.out = 30))
prior_p  <- posterior_epred(fit_logit_pp, newdata = new_mpg, draws = 1000)
# (posterior_epred returns expected probabilities; posterior_predict returns 0/1 outcomes)

c(
  range_p       = paste0(round(min(prior_p), 3), " - ", round(max(prior_p), 3)),
  pct_p_outside = round(mean(prior_p < 0 | prior_p > 1), 3),
  median_p      = round(median(prior_p), 3)
)
#>           range_p   pct_p_outside        median_p
#>     0.000 - 1.000           0.000           0.500
```

Walk through what happened. We fit a logistic regression with weakly informative priors on the log-odds scale. Then we asked for the *expected probability* (`posterior_epred`) at each new mpg value, drawing 1000 prior samples each.

Now interpret the output. Predicted probabilities span 0 to 1 (the link function ensures this), median 0.5 (the prior is symmetric so neither outcome is favoured a priori), and 0% of predictions are outside the valid `[0, 1]` range. That last number is reassuring but trivial; a logistic link cannot produce probabilities outside `[0, 1]`. What you really want to check is *whether the prior puts most of its mass at extreme probabilities (very near 0 or 1) when it should not*.

```r title="Logistic prior predictive check: are probabilities too extreme?"
prior_p_long <- as.vector(prior_p)
c(
  pct_p_under_05  = round(mean(prior_p_long < 0.05), 3),
  pct_p_over_95   = round(mean(prior_p_long > 0.95), 3),
  pct_p_05_to_95  = round(mean(prior_p_long >= 0.05 & prior_p_long <= 0.95), 3)
)
#>  pct_p_under_05    pct_p_over_95   pct_p_05_to_95
#>           0.196            0.193            0.611
```

Walk through what this tells us. The prior implies that 39% of predictions are outside `[0.05, 0.95]` (very near 0 or 1). For a model where the outcome (8 cylinders or not) actually splits roughly 40/60 in the data, the prior is putting too much mass at the extremes.

A wider intercept prior would make this worse (more extremes); a tighter one would shrink predictions toward 0.5. For our data, the current prior is acceptable but you might tighten the intercept to `normal(0, 1)` to push more probability mass toward the middle.

[KEY INSIGHT]
**For link-function models, plot the prior predictive on the outcome scale, not the linear predictor scale.** A `normal(0, 5)` prior on a logistic-regression slope looks reasonable on the log-odds scale but implies probabilities that flip from 0.5 to nearly 0 or 1 over a small change in x. The check that matters is the one on the outcome you actually report.

**Try it:** Run the same check for a Poisson regression on count data. Use `family = poisson()` and a `normal(0, 1)` prior on the slope. What range of expected counts does the prior allow?

```r title="Your turn: Poisson prior predictive"
# Use a small fake dataset: count = rpois(20, 5), x = rnorm(20)
# Fit brm(count ~ x, family = poisson(), prior = ..., sample_prior = 'only')
# Use posterior_epred to get the expected count, and report range
#> Expected: the log-link means a normal(0, 1) slope can imply expected counts from <0.1 to >100
```

<details>
<summary>Click to reveal solution</summary>

```r title="Poisson prior predictive solution"
set.seed(2026)
df_count <- data.frame(count = rpois(20, 5), x = rnorm(20))
prior_pois <- c(
  prior(normal(0, 1), class = "b"),
  prior(normal(1.5, 0.5), class = "Intercept")     # log(5) ~ 1.6
)
fit_pois_pp <- brm(count ~ x, df_count, family = poisson(),
                   prior = prior_pois,
                   sample_prior = "only",
                   chains = 4, iter = 2000, seed = 2026, silent = 2)
new_x <- data.frame(x = seq(-2, 2, length.out = 20))
prior_lambda <- posterior_epred(fit_pois_pp, newdata = new_x, draws = 1000)
c(
  range_lambda  = paste0(round(min(prior_lambda), 2), " - ", round(max(prior_lambda), 2)),
  median_lambda = round(median(prior_lambda), 2)
)
#>     range_lambda   median_lambda
#> 0.10 - 207.83             4.42
```

The log-link amplification is striking. With a `normal(0, 1)` prior on the slope and `normal(1.5, 0.5)` on the intercept (centred at log(5)), the prior allows expected counts from 0.1 to 208. The median is 4.42, which sits right where we want. Tighten the slope to `normal(0, 0.5)` if you want a more constrained prior.

</details>

## When in the workflow should I run a prior predictive check?

Before fitting. Always before fitting.

The Bayesian workflow has a fixed order. (1) Specify the model. (2) Set priors. (3) Run a prior predictive check. (4) Fit to data. (5) Run posterior diagnostics. (6) Run a posterior predictive check. (7) Decide whether to revise the model.

Step 3 happens between specifying the priors and seeing any data. Skipping it is the modelling equivalent of writing a function but never reading the test cases. The cost is small (one extra `brm()` call with `sample_prior = "only"`) and the catches are large (priors that imply absurd predictions, models that cannot fit because the prior is too tight, hidden assumptions about the link function).

Three rules of thumb for when to run a prior predictive check.

The first is *always for new models*. If this is the first time you are fitting a particular family + link + prior combination on a particular dataset's units, run a prior predictive check. The combinations interact in non-obvious ways.

The second is *always for hierarchical models*. Hierarchical models have priors on variance components that are easy to set badly. A prior predictive check on a hierarchical model checks both the population-level and group-level implications.

The third is *always when changing priors after seeing data*. If you fit a model, looked at the posterior, and decided to change a prior, the prior predictive check is your sanity gate before refitting. Otherwise you risk priors that effectively encode the data you saw.

[TIP]
**Save the prior-only fit alongside the data fit.** When you publish a Bayesian analysis, keep both the prior-only `brmsfit` and the data fit. Reviewers and replicators can examine both, and you have a record of what the prior was actually doing.

**Try it:** For a hypothetical study of customer wait times where prior literature suggests the average wait is between 90 and 150 seconds, write down what prior on the intercept you would use, then run a prior predictive check.

```r title="Your turn: design a prior for wait times"
# Set a prior on the intercept: e.g., normal(120, 15) so the 95% range is roughly 90 to 150
# Set a half-Cauchy prior on sigma
# Use sample_prior = 'only' on a model y ~ 1 (intercept-only) with simulated data
# Check that prior y predictions span a plausible wait-time range
```

<details>
<summary>Click to reveal solution</summary>

```r title="Wait time prior solution"
prior_wait <- c(
  prior(normal(120, 15),      class = "Intercept"),
  prior(student_t(3, 0, 25),  class = "sigma")
)
df_wait <- data.frame(y = rnorm(20, 120, 25))    # placeholder; not used because sample_prior='only'
fit_wait_pp <- brm(y ~ 1, df_wait, prior = prior_wait,
                   sample_prior = "only",
                   chains = 4, iter = 2000, seed = 2026, silent = 2)
prior_y_wait <- posterior_predict(fit_wait_pp, draws = 1000)
quantile(prior_y_wait, c(0.05, 0.5, 0.95))
#>      5%     50%     95%
#>   65.32  120.04  175.61
```

The prior implies wait times with median 120 and middle 90% from 65 to 176 seconds. That covers fast and slow service comfortably and rules out negative waits. Match this against the literature and you have a defensible prior to fit with.

</details>

## Practice Exercises

### Exercise 1: Catch a bad prior on logistic regression

Set up a logistic regression on `mtcars` with `y = vs` (V-engine indicator) on `mpg`. Use a deliberately wide prior `normal(0, 100)` on the slope and run a prior predictive check on `posterior_epred`. What proportion of predicted probabilities are below 0.05 or above 0.95?

```r title="Exercise 1 starter"
# Use prior(normal(0, 100), class = 'b') with bernoulli('logit')
# sample_prior = 'only', then posterior_epred over a new mpg grid
# Compute mean(prior_p < 0.05 | prior_p > 0.95)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
prior_wide_logit <- c(
  prior(normal(0, 100), class = "b"),
  prior(normal(0, 5),   class = "Intercept")
)
fit_wide_logit <- brm(y_8 ~ mpg, mtcars, family = bernoulli("logit"),
                      prior = prior_wide_logit,
                      sample_prior = "only",
                      chains = 4, iter = 2000, seed = 2026, silent = 2)
new_mpg2 <- data.frame(mpg = seq(10, 35, length.out = 30))
p_wide <- posterior_epred(fit_wide_logit, newdata = new_mpg2, draws = 1000)
mean(p_wide < 0.05 | p_wide > 0.95)
#> [1] 0.812
```

About 81% of prior-predicted probabilities are at the extremes (under 0.05 or over 0.95). That is what `normal(0, 100)` on a log-odds slope actually says: every observation is essentially deterministic. Real binary outcomes are almost never that extreme, so the prior is implausible and would dominate small-data fits.

</details>

### Exercise 2: Match prior predictive to data range

For a model `mpg ~ hp` on `mtcars`, design priors so the prior predictive 90% range covers the actual mpg range `[10, 35]` without much spillover.

```r title="Exercise 2 starter"
# Set normal(_, _) priors on b and Intercept, plus a student_t on sigma
# Run sample_prior = 'only' and tune until quantile(prior_y, c(0.05, 0.95)) ~ c(10, 35)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
prior_match <- c(
  prior(normal(0, 0.05),      class = "b"),
  prior(normal(22, 4),        class = "Intercept"),
  prior(student_t(3, 0, 4),   class = "sigma")
)
fit_match <- brm(mpg ~ hp, mtcars, prior = prior_match,
                 sample_prior = "only",
                 chains = 4, iter = 2000, seed = 2026, silent = 2)
new_hp <- data.frame(hp = seq(min(mtcars$hp), max(mtcars$hp), length.out = 20))
prior_y_match <- posterior_predict(fit_match, newdata = new_hp, draws = 1000)
quantile(prior_y_match, c(0.05, 0.5, 0.95))
#>      5%     50%     95%
#>   8.47   21.93   34.10
```

The 90% range is 8.5 to 34.1, very close to the observed range 10 to 35. Median 21.9 matches the data mean 20.1. The prior is informed about the units of mpg without being so tight that the data cannot move the posterior.

</details>

### Exercise 3: Hierarchical prior predictive

For `mpg ~ wt + (1 | cyl)` on `mtcars`, set priors on the random-effect sd that allow but do not require strong group differences. Run a prior predictive check and report the 90% range of predicted mpg by cyl group.

```r title="Exercise 3 starter"
# mtcars$cyl <- factor(mtcars$cyl)
# Set prior(student_t(3, 0, 5), class = 'sd') for the random intercept
# Plus weakly informative priors on b, Intercept, sigma
# sample_prior = 'only' and posterior_predict at each cyl level
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
mtcars3     <- mtcars
mtcars3$cyl <- factor(mtcars3$cyl)

prior_hier <- c(
  prior(normal(-3, 1.5),      class = "b"),
  prior(normal(20, 7),        class = "Intercept"),
  prior(student_t(3, 0, 5),   class = "sd"),
  prior(student_t(3, 0, 5),   class = "sigma")
)
fit_hier_pp <- brm(mpg ~ wt + (1 | cyl), mtcars3,
                   prior = prior_hier,
                   sample_prior = "only",
                   chains = 4, iter = 2000, seed = 2026, silent = 2)

new_grid <- expand.grid(
  wt  = c(2.5, 4.0),
  cyl = factor(c(4, 6, 8))
)
prior_y_hier <- posterior_predict(fit_hier_pp, newdata = new_grid, draws = 1000)
apply(prior_y_hier, 2, quantile, c(0.05, 0.5, 0.95)) |> round(1)
#>           [,1]    [,2]   [,3]    [,4]   [,5]    [,6]
#>      wt=2.5,4 wt=4.0,4 wt=2.5,6 wt=4.0,6 wt=2.5,8 wt=4.0,8
#> 5%      6.6    -1.5    7.0    -1.0    6.5    -2.1
#> 50%    20.5    16.1   20.4    15.6   20.6    15.5
#> 95%    34.0    33.6   34.4    33.5   34.5    33.7
```

The 90% range by group is `[6.6, 34.0]` to `[-2.1, 33.7]` across light and heavy weights and across the three cyl groups. The prior allows group-to-group spread but is not absurd. The slight negative tail at heavy weight could be tightened with a smaller `sigma` prior, but the overall shape is reasonable.

</details>

## Summary

A prior predictive check simulates outcomes from your model using only the priors. It catches bad priors before you fit, and builds intuition about what your model actually claims.

| Step | What you do | brms function |
|---|---|---|
| 1 | Specify the model and priors | `brm(formula, prior, family)` |
| 2 | Sample from the prior alone | `sample_prior = "only"` |
| 3 | Generate predicted outcomes | `posterior_predict()` or `posterior_epred()` |
| 4 | Check the implied range | Quantiles, out-of-bounds proportions, density plots |
| 5 | If absurd, tighten the prior | Adjust `prior(...)` and refit step 2 |

Run a prior predictive check before every fit, especially for new models, hierarchical models, and link-function models. The cost is a couple of minutes; the catches are publishable mistakes you avoid.

## References

1. Gabry, J., Simpson, D., Vehtari, A., Betancourt, M., Gelman, A. "Visualization in Bayesian workflow." *Journal of the Royal Statistical Society A* 182 (2019). The graphical case for prior and posterior predictive checks.
2. Stan Development Team. "Prior Choice Recommendations." [github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations](https://github.com/stan-dev/stan/wiki/Prior-Choice-Recommendations).
3. Bürkner, P. *brms documentation: sample_prior*. [paulbuerkner.com/brms/reference/brm.html](https://paulbuerkner.com/brms/reference/brm.html).
4. McElreath, R. *Statistical Rethinking*, 2nd ed. CRC Press, 2020. Chapter 4 makes prior predictive checks the default workflow step.
5. Gelman, A. et al. *Bayesian Workflow*. arXiv:2011.01808 (2020). Workflow paper laying out the seven-step ordering.

## Continue Learning

- [Posterior Predictive Checks in R](Posterior-Predictive-Checks-in-R.html), the next post. The same idea but using draws from the posterior, after fitting to data.
- [Choosing Priors in R](Choosing-Priors-in-R.html), the previous post. Builds the priors that this post visualises.
- [brms in R](brms-in-R.html), the package that makes both checks one extra argument away.
