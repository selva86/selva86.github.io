---
title: "Bayesian Modeling Lesson 8: Bayesian Regression and GLMs End to End"
catalog_blurb: "How to turn predictors and a prior into a decision you can defend."
description: "The full Bayesian regression workflow in base R: set priors on the slopes, fit a Poisson GLM on a grid, check it, compare it with WAIC, and report credible and prediction intervals."
keywords: "bayesian regression, bayesian glm, poisson regression, log link, credible interval, prediction interval, prior predictive check, posterior predictive check, waic, elpd, generalized linear model, rate ratio, R"
post_type: "LESSON"
curriculum_id: "6.160.8"
webr: true
mathjax: true
lesson_access: "pro"
course_id: "ds-bayesian"
course_title: "Bayesian Modeling"
course_lesson: "8"
course_total: "8"
course_landing: "R-Bayesian-Modeling-Course.html"
course_next: "Bayesian-Modeling-Quiz.html"
course_prev: "Bayesian-Model-Comparison-LOO-and-WAIC.html"
---

=== step === cover
::eyebrow Lesson 8 of 8
## Bayesian Regression and GLMs End to End

Every model in this course so far had exactly one unknown: a conversion rate, a demand level, a single number that the prior and the data fought over. Real questions have moving parts. Asha does not just want to know how many terrarium kits she sells; she wants to know whether the money she spends on ads actually moves that number, and by how much.

The moment a predictor enters, the unknown stops being a point and becomes a whole line. This capstone runs the entire pipeline you have built, once, start to finish, on that line.

By the end of this lesson you will be able to:

- Explain how a predictor turns a one-parameter model into a posterior over a line, and why that beats a single least-squares fit
- Write a Bayesian generalized linear model for counts (a Poisson likelihood, a log link, and priors on the coefficients), with every symbol defined
- Fit it in R by extending Lesson 1's grid to two coefficients, then check it, compare it, and report it
- Turn the posterior into a decision: a credible interval for the effect, a multiplier a stakeholder can act on, and a forecast for a new day, and know what that number does not license

**Prerequisites:** Lessons 1 to 7 of this course, especially the prior-times-likelihood update on a grid (Lesson 1), the Gamma-Poisson count model and posterior predictive checks (Lesson 6), and WAIC with its elpd difference and standard error (Lesson 7).

::widget ols-fit {}

=== step === concept
::eyebrow Where we are
## One unknown becomes a line

Look at the widget on the last slide: a scatter of points and one straight line you can drag. Ordinary regression asks "which single line fits best?" This whole course has trained you to distrust single answers. In Lesson 1 a point estimate became a curve of belief; here a single line becomes a distribution over lines.

Asha's new question needs data with two columns. Each lesson runs in a fresh interactive R session, so we build her log right here. We simulate it from a known truth, a slope of 0.35, so that at the very end we can check whether the fit recovered it (Asha, of course, does not get to peek at that number; we do, so we can grade ourselves):

```r
set.seed(1)
n     <- 90
spend <- round(runif(n, 0, 40))          # ad spend each day, in dollars
z     <- (spend - 20) / 10               # centered at a $20 day, in $10 units
kits  <- rpois(n, exp(0.4 + 0.35 * z))   # orders that day: a whole-number count
head(data.frame(spend, kits, z), 6)
#>   spend kits    z
#> 1    11    0 -0.9
#> 2    15    0 -0.5
#> 3    23    2  0.3
#> 4    36    5  1.6
#> 5     8    2 -1.2
#> 6    36    4  1.6
```

Two quick numbers frame the whole lesson: how many kits over the ninety days, and whether the busy ad days really do outsell the quiet ones.

```r
c(days = n, total = sum(kits), zero_days = sum(kits == 0), biggest = max(kits))
#>      days     total zero_days   biggest 
#>        90       146        21         6 
round(tapply(kits, spend > 20, mean), 2)   # mean orders on quiet vs busy ad days
#> FALSE  TRUE 
#>  1.12  2.19 
```

On the days Asha spent under twenty dollars she sold about 1.1 kits; over twenty, about 2.2, roughly double. That gap could be a real effect of the ads, or it could be the ordinary jitter of small counts. Telling those apart, with honest uncertainty, is the entire job.

=== step === concept
::eyebrow The old tool, and its cracks
## Least squares gives one line, and hides everything else

The reflex from ordinary regression is least squares: slide a line until the sum of the squared vertical misses (the shrinking red squares in the widget) is as small as it can be. Press "Snap to least squares" and R agrees exactly.

::widget ols-fit {"points":[{"x":11,"y":0},{"x":15,"y":0},{"x":23,"y":2},{"x":36,"y":5},{"x":8,"y":2},{"x":36,"y":4},{"x":38,"y":2},{"x":26,"y":1},{"x":25,"y":3},{"x":2,"y":1},{"x":8,"y":1},{"x":7,"y":0},{"x":27,"y":1},{"x":15,"y":5},{"x":31,"y":3},{"x":20,"y":0},{"x":29,"y":0},{"x":40,"y":3},{"x":15,"y":3},{"x":31,"y":2},{"x":37,"y":6},{"x":8,"y":1},{"x":26,"y":1},{"x":5,"y":1},{"x":11,"y":0},{"x":15,"y":0},{"x":1,"y":1},{"x":15,"y":0},{"x":35,"y":2},{"x":14,"y":1},{"x":19,"y":5},{"x":24,"y":2},{"x":20,"y":1},{"x":7,"y":0},{"x":33,"y":3},{"x":27,"y":2},{"x":32,"y":2},{"x":4,"y":0},{"x":29,"y":1},{"x":16,"y":1},{"x":33,"y":2},{"x":26,"y":0},{"x":31,"y":0},{"x":22,"y":2},{"x":21,"y":4},{"x":32,"y":2},{"x":1,"y":1},{"x":19,"y":1},{"x":29,"y":6},{"x":28,"y":2},{"x":19,"y":2},{"x":34,"y":3},{"x":18,"y":0},{"x":10,"y":0},{"x":3,"y":1},{"x":4,"y":1},{"x":13,"y":0},{"x":21,"y":2},{"x":26,"y":0},{"x":16,"y":3},{"x":37,"y":3},{"x":12,"y":1},{"x":18,"y":1},{"x":13,"y":1},{"x":26,"y":2},{"x":10,"y":0},{"x":19,"y":1},{"x":31,"y":0},{"x":3,"y":0},{"x":35,"y":1},{"x":14,"y":0},{"x":34,"y":4},{"x":14,"y":1},{"x":13,"y":2},{"x":19,"y":3},{"x":36,"y":2},{"x":35,"y":0},{"x":16,"y":1},{"x":31,"y":3},{"x":38,"y":2},{"x":17,"y":2},{"x":29,"y":3},{"x":16,"y":2},{"x":13,"y":1},{"x":30,"y":2},{"x":8,"y":2},{"x":28,"y":2},{"x":5,"y":1},{"x":10,"y":1},{"x":6,"y":2}]}

Here is that same fit in R, with one telling prediction:

```r
fit_ols <- lm(kits ~ spend)
round(coef(fit_ols), 3)
#> (Intercept)       spend 
#>       0.436       0.058 
round(predict(fit_ols, data.frame(spend = 0)), 2)   # orders it expects on a zero-ad day
#>    1 
#> 0.44 
```

The line is not wrong, exactly, but look at what it hands back. First, it is a single line: one intercept, one slope, and no hint of how sure we should be. Second, it predicts **0.44 of a kit** on a day with no ads, and a straight line dropped a little further would predict a negative count, which is nonsense for whole-number orders. Third, and most subtly, least squares assumes the scatter around the line is the same size everywhere, yet you can see it in the data: quiet days barely wobble, busy days swing widely. Count data is like that; the spread grows with the level.

Two fixes, one framework. The Bayesian move puts a whole distribution over lines instead of one. The generalized-linear-model move swaps the straight line and its constant-size Gaussian noise for a shape that fits counts. We take both.

=== step === quiz
::eyebrow Check yourself
## What did the single line leave out?

Least squares handed Asha a slope of 0.058 kits per dollar and stopped there. Of the objections below, which is the one that Bayesian modeling and a GLM together are built to fix?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Nothing important: the slope is the answer, and the model is done once you have it ::no A point slope with no interval cannot say whether the ad effect is real or noise, and a straight-line-plus-constant-Gaussian model can predict fractions of a kit and negative counts. Both are exactly what the rest of this lesson repairs.
- The fit overfit the ninety days and should use fewer points ::no A one-slope line is the opposite of overfitting; it is rigid. The problem is not too much flexibility, it is a single answer with no uncertainty and a noise model that does not match counts.
- It reports one line with no measure of uncertainty, and it assumes a constant-size Gaussian scatter that lets it predict fractional and negative counts ::ok Right. A regression should say how sure it is (a distribution over lines, not one), and a count outcome needs a likelihood whose spread grows with the mean and never goes negative. The next steps supply both.
- It is biased low and the true slope must be larger ::no Least squares is not systematically low here; the issue is not the slope's value but the absence of any uncertainty around it and a noise model that is wrong for counts.

=== step === concept
::eyebrow The right model
## A generalized linear model, in three pieces

A generalized linear model (GLM) keeps regression's good idea, an outcome that responds to predictors through a straight-line combination, but wraps it so the outcome can be any type: a yes/no, a count, a positive amount. It has three pieces.

First, the **linear predictor**, the familiar line, written \( \eta_i = \beta_0 + \beta_1 z_i \). Here \( z_i \) is the centered ad spend on day \(i\), \( \beta_0 \) (beta-zero) is the intercept, \( \beta_1 \) (beta-one) is the slope, and \( \eta_i \) (eta) is their combination for that day.

Second, the **link**, a function that connects the line to the average outcome so the average always stays in bounds. For counts the average must be positive, so we model its logarithm:

\[ \log \lambda_i = \eta_i = \beta_0 + \beta_1 z_i, \qquad\text{equivalently}\qquad \lambda_i = e^{\beta_0 + \beta_1 z_i}. \]

Here \( \lambda_i \) (lambda) is the expected number of orders on day \(i\). Because it is an exponential, \( \lambda_i \) can never dip below zero, which cures the negative-count nonsense. It also changes what the slope means: adding one to \( z_i \) (a ten-dollar rise in ad spend) does not add a fixed number of kits, it **multiplies** the expected count by \( e^{\beta_1} \). That is why GLM effects are read as ratios.

Third, the **likelihood family**, the distribution of the actual counts around that average. For counts the natural choice, and the count model from Lesson 6, is the Poisson, whose spread grows with its mean (variance equals mean), matching the widening scatter you saw:

\[ y_i \sim \text{Poisson}(\lambda_i), \]

where \( y_i \) is the whole-number orders on day \(i\). The widget below is the reminder that the family is a choice: a Poisson line can miss when real counts have extra spread or extra zeros, and there are richer count families for those cases (Lesson 6's territory).

::widget count-dist {}

The same three-piece recipe, with a different link and family, gives every model in this table. Change the pieces, keep the machinery:

| Outcome | Link | Likelihood family | The model |
|---|---|---|---|
| a continuous measurement | identity | Normal | ordinary linear regression |
| yes or no | logit | Bernoulli | logistic regression |
| a count (0, 1, 2, ...) | log | Poisson | what we build here |

[KEY INSIGHT]
Regression made the unknown a line. A GLM wraps that line in a link and a matching likelihood so any outcome type fits the same machinery. Everything Bayesian you already know, prior times likelihood, then read the posterior, applies unchanged; only the likelihood in the middle has been swapped for one that suits the data.

=== step === tryit
::eyebrow Feel the link
## What the log link does to one day

Before trusting a fit, see the link work on a single day. Day 4 in Asha's log was a busy one: thirty-six dollars of ads, so \( z = (36 - 20)/10 = 1.6 \). Take a candidate line with intercept 0.4 and slope 0.35 and read off its expected orders for that day. The mean is \( e^{\beta_0 + \beta_1 z} \); fill in the exponent.

```r
cand_b0 <- 0.4      # a candidate intercept
cand_b1 <- 0.35     # a candidate slope
z_day   <- 1.6      # a $36 ad-spend day, centered and in $10 units
lambda_day <- exp(____)      # this line's expected orders on that day
round(lambda_day, 2)
```
::check {"regex":"cand_b0\\s*\\+\\s*cand_b1\\s*\\*\\s*z_day","gate":true,"difficulty":"beginner","ok":"That is the link at work: exp(0.4 + 0.35 * 1.6) = exp(0.96) = 2.61 expected kits. Push z_day to a quiet day and the exponential keeps the mean positive but small; it can never go negative.","no":"The linear predictor is intercept plus slope times the day's z: cand_b0 + cand_b1 * z_day, all inside exp()."}
::solution
```r
cand_b0 <- 0.4
cand_b1 <- 0.35
z_day   <- 1.6
lambda_day <- exp(cand_b0 + cand_b1 * z_day)
round(lambda_day, 2)
#> [1] 2.61
```

=== step === concept
::eyebrow Priors, and a trap
## Priors on the slopes, checked before any data

The Bayesian half of the model is a prior for each coefficient. It is tempting to reach for something "vague" and let the data speak, but the log link sets a trap: a prior that looks harmless on \( \beta \) can be insane once it passes through the exponential. Watch a genuinely vague prior, \( \beta_0, \beta_1 \sim \mathcal{N}(0, 5) \), imply orders for a busy forty-dollar day (\( z = 2 \)):

```r
set.seed(100)
S <- 20000
lambda_vague <- exp(rnorm(S, 0, 5) + rnorm(S, 0, 5) * 2)     # a "vague" prior's implied rate
signif(quantile(lambda_vague, c(0.5, 0.975)), 3)
#>      50%    97.5% 
#> 8.82e-01 3.24e+09 
```

The median implied rate is a sensible 0.9 kits, but the upper edge of that prior seriously entertains **three billion kits in a day** at a plant stall. "Vague" is not the same as "harmless"; through the exponential it is a wild belief. This is a **prior predictive check**: simulate the data the priors alone predict, before touching the real counts, and throw out any prior that predicts nonsense.

A weakly informative prior fixes it. Keep the priors open-minded but let them know a stall sells single digits: \( \beta_0 \sim \mathcal{N}(0, 1) \) and \( \beta_1 \sim \mathcal{N}(0, 0.5) \). The same busy day now implies a believable range.

```r
lambda_weak <- exp(rnorm(S, 0, 1) + rnorm(S, 0, 0.5) * 2)    # weakly informative prior
round(quantile(lambda_weak, c(0.5, 0.975)), 2)
#>   50% 97.5% 
#>  1.00 16.13 
```

Median 1 kit, and even the 97.5th percentile is about 16, a busy but possible day. That is what "weakly informative" means: wide enough to be overturned by evidence, narrow enough to rule out the physically absurd. Each coefficient's prior is exactly Lesson 1's belief curve, one per slope; the widget replays that update so you can watch a prior meet the data and move.

::widget bayes-update {}

=== step === concept
::eyebrow The fit
## Extend Lesson 1's grid to two coefficients

Lesson 1 fit one unknown by laying it on a grid, scoring every candidate with prior times likelihood, and normalizing. A line has two unknowns, so the grid becomes a sheet: every pair \( (\beta_0, \beta_1) \) is one candidate line, scored the same way. Nothing new, one more dimension.

```r
b0_grid <- seq(-0.4, 1.2, length.out = 60)   # candidate intercepts
b1_grid <- seq(-0.2, 0.9, length.out = 60)   # candidate slopes
grid    <- expand.grid(b0 = b0_grid, b1 = b1_grid)

log_post <- function(b0, b1) {
  lambda <- exp(b0 + b1 * z)                  # the log link: one expected count per day
  sum(dpois(kits, lambda, log = TRUE)) +      # Poisson log-likelihood over the 90 days
    dnorm(b0, 0, 1,   log = TRUE) +           # prior on the intercept
    dnorm(b1, 0, 0.5, log = TRUE)             # prior on the slope
}

grid$logp <- mapply(log_post, grid$b0, grid$b1)   # score every candidate line
grid$w    <- exp(grid$logp - max(grid$logp))      # to weights (subtract the max for safety)
grid$w    <- grid$w / sum(grid$w)                 # normalize so the weights sum to 1
round(unlist(grid[which.max(grid$w), c("b0", "b1")]), 3)   # the single most probable line
#>    b0    b1 
#> 0.386 0.359 
```

The grid is exact and effortless with two coefficients. It stops being effortless with many: a ten-predictor model would need a ten-dimensional sheet, far too many cells to fill. That is the wall where you trade the grid for a sampler, the Metropolis algorithm, Hamiltonian Monte Carlo, the Stan tooling underneath the one-liner you will see shortly. For two coefficients the grid IS the posterior, so we read it directly. Draw four thousand lines from it, in proportion to their weight, and the whole posterior is in hand:

```r
set.seed(7)
pick    <- sample(nrow(grid), 4000, replace = TRUE, prob = grid$w)
post_b0 <- grid$b0[pick]     # 4000 plausible intercepts
post_b1 <- grid$b1[pick]     # 4000 plausible slopes

round(quantile(post_b1, c(0.025, 0.5, 0.975)), 3)        # the slope, on the log scale
#>  2.5%   50% 97.5% 
#> 0.210 0.359 0.527 
round(quantile(exp(post_b1), c(0.025, 0.5, 0.975)), 3)   # the same slope as a per-$10 multiplier
#>  2.5%   50% 97.5% 
#> 1.234 1.432 1.694 
mean(post_b1 > 0)                                         # posterior belief that ads help at all
#> [1] 1
```

Read those three lines as a sentence. The slope is almost certainly positive (probability essentially 1). Its 95 percent credible interval on the log scale is (0.21, 0.53), which comfortably contains the true 0.35 we simulated from, so the fit recovered the answer. And exponentiated, the effect is a **multiplier**: each extra ten dollars of daily ad spend multiplies expected orders by about 1.43, with a 95 percent credible interval of (1.23, 1.69). A quick maximum-likelihood fit agrees to the decimal, a reassuring cross-check that the grid did its job:

```r
round(coef(glm(kits ~ z, family = poisson())), 3)   # the same model, fit by maximum likelihood
#> (Intercept)           z 
#>       0.390       0.369 
```

=== step === quiz
::eyebrow Check yourself
## Reading the multiplier

Asha's report says: the posterior for \( e^{\beta_1} \) has median 1.43 with a 95 percent credible interval of (1.23, 1.69), where one unit of the predictor is a ten-dollar rise in daily ad spend. Which reading is right?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Each extra ten dollars a day of ad spend multiplies expected orders by about 1.43, and the data are consistent with a multiplier anywhere from 1.23 to 1.69 ::ok Right. A log link makes the effect multiplicative, so exp(beta1) is a ratio: spend ten dollars more per day and the expected count scales by roughly 1.43, a 43 percent lift, with honest uncertainty on the multiplier itself.
- Each extra ten dollars a day adds about 1.43 kits to that day's orders ::no The link is logarithmic, so the effect multiplies, it does not add. 1.43 is a factor applied to whatever the expected count already was, not a fixed number of extra kits.
- About 43 percent of the variation in daily orders is explained by ad spend ::no exp(beta1) is a rate ratio, not a share of variance. It says how the expected count scales with the predictor, nothing about an R-squared.
- There is a 95 percent chance ad spend causes between 23 and 69 more orders over the ninety days ::no The interval is for a per-ten-dollar multiplier on the daily rate, not a total count of extra orders, and a regression slope is an association, not a proven causal effect (a caution we return to at the end).

=== step === concept
::eyebrow Does it fit?
## Check: a posterior predictive test

A posterior that recovered the truth is still worthless if the model cannot reproduce the data it was fit on. That is the Lesson 6 check, now applied to the regression. Pick a test statistic the model was never explicitly told to match, simulate fresh data from the fitted posterior many times, and see where the observed value falls. The widget is the picture: replicate a statistic under the model, mark the observed value, and read whether it sits in the crowd or out in the tail.

::widget ppc-overlay {}

For Asha the natural statistic is the number of zero-order days: her log has twenty-one, and a model that got the shape of low counts wrong would betray itself here. Draw a line from the posterior, simulate ninety days from it, count the zeros, and repeat:

```r
set.seed(5)
zeros_obs <- sum(kits == 0)                                   # 21 blank days in the real log
zeros_rep <- replicate(2000, {
  s        <- sample(length(post_b0), 1)                      # one plausible line from the posterior
  fake_day <- rpois(length(kits), exp(post_b0[s] + post_b1[s] * z))
  sum(fake_day == 0)                                          # its number of blank days
})
c(observed = zeros_obs, ppc_p = round(mean(zeros_rep >= zeros_obs), 2))
#> observed    ppc_p 
#>    21.00     0.58 
```

A posterior predictive p-value of 0.58 sits right in the middle: the model's simulated worlds produce about as many blank days as Asha actually saw. The Poisson GLM reproduces this feature of her data, so it earns the right to be trusted, or at least compared.

=== step === concept
::eyebrow Is the predictor worth it?
## Compare: does ad spend earn its keep?

The model fits. But so does the simpler model from Lesson 7, the one with no predictor at all, a single rate for every day. Adding a slope always fits the training data at least as well; the honest question is whether it predicts better on days it has not seen. That is exactly what WAIC and its leave-one-out cousin estimate, and the tool you built in Lesson 7 answers it. This comparison is the fourth stage of the workflow loop you now own end to end:

::widget process-flow {"steps":[{"title":"Model","sub":"a likelihood and priors: Poisson counts, a log-linear rate, priors on the slopes"},{"title":"Fit","sub":"turn prior plus data into a posterior over the whole line"},{"title":"Check","sub":"posterior predictive checks: does it reproduce the data?"},{"title":"Compare","sub":"WAIC or LOO ranks it against the simpler model"},{"title":"Report","sub":"credible and prediction intervals a decision can lean on"}]}

Fit the predictor-free model on a one-dimensional grid, build a log-likelihood matrix for each model (one row per posterior draw, one column per day, exactly Lesson 7's object), and score both with WAIC:

```r
b0_only <- seq(-0.4, 1.2, length.out = 600)                  # the flat model has one unknown
w_only  <- exp(sapply(b0_only, function(b0)
  sum(dpois(kits, exp(b0), log = TRUE)) + dnorm(b0, 0, 1, log = TRUE)))
w_only  <- w_only / sum(w_only)
set.seed(9); draw0 <- sample(b0_only, 4000, TRUE, prob = w_only)

llik_spend <- sapply(1:length(kits), function(i) dpois(kits[i], exp(post_b0 + post_b1 * z[i]), log = TRUE))
llik_flat  <- sapply(1:length(kits), function(i) dpois(kits[i], exp(draw0), log = TRUE))

waic <- function(llik) {
  lppd   <- sum(log(colMeans(exp(llik))))     # fit, flattered by using each day's own data
  p_waic <- sum(apply(llik, 2, var))          # the complexity penalty (Lesson 7)
  c(elpd_waic = lppd - p_waic, p_waic = p_waic)
}
round(rbind(with_spend = waic(llik_spend), flat = waic(llik_flat)), 2)
#>            elpd_waic p_waic
#> with_spend   -139.82   1.75
#> flat         -149.88   1.22
```

The spend model scores higher (less negative), and its penalty of about 1.75 is close to its two free parameters, the flat model's about 1.22 to its one, WAIC measuring each model's real complexity off the matrix. But a scoreboard needs its standard error before you trust the gap, the discipline from Lesson 7:

```r
lpd_spend <- log(colMeans(exp(llik_spend)))
lpd_flat  <- log(colMeans(exp(llik_flat)))
d <- lpd_spend - lpd_flat                      # the spend model's per-day edge
round(c(elpd_diff = sum(d), se = sqrt(length(d) * var(d))), 2)
#> elpd_diff        se 
#>     10.59      4.16 
```

An edge of 10.6, about two and a half of its own standard errors: the predictor genuinely improves out-of-sample prediction, not by luck of these ninety days. Ad spend earns its keep. With Stan tooling this whole comparison is a few calls; read it now, run it when you have a local R with Stan installed (it does not run in a browser session):

```r-static
# The same model and comparison with Stan tooling (local R)
library(rstanarm)
fit  <- stan_glm(kits ~ z, family = poisson(),
                 prior = normal(0, 0.5), prior_intercept = normal(0, 1),
                 data = data.frame(kits, z))
fit_flat <- update(fit, . ~ 1)                 # drop the predictor
loo_compare(loo(fit), loo(fit_flat))           # the same elpd difference, via PSIS-LOO
```

=== step === concept
::eyebrow Say it for a decision
## Report: two intervals, one for the mean, one for a day

Asha does not want coefficients, she wants a forecast she can plan around. Suppose she settles on a thirty-dollar daily ad budget for next month. The posterior answers two different questions, and confusing them is the classic reporting mistake. The credible interval says where the average order rate for such days lives; the prediction interval says what a single actual day might sell, and it is always wider because it also carries the day-to-day Poisson randomness on top of the uncertainty about the line.

```r
z_new      <- (30 - 20) / 10                          # a $30 ad-spend day
lambda_new <- exp(post_b0 + post_b1 * z_new)          # posterior for the MEAN rate that day
set.seed(3)
orders_new <- rpois(length(lambda_new), lambda_new)   # posterior PREDICTIVE for actual orders

round(quantile(lambda_new, c(0.025, 0.5, 0.975)), 2)  # credible interval: the average rate
#>  2.5%   50% 97.5% 
#>  1.74  2.11  2.52 
round(quantile(orders_new, c(0.025, 0.5, 0.975)), 2)  # prediction interval: one real day
#>  2.5%   50% 97.5% 
#>     0     2     5 
```

Two honest sentences for Asha. On average, a thirty-dollar ad day is worth about 2.1 kits, and she can be 95 percent sure that long-run average lies between 1.7 and 2.5. But any single such day is a roll of the dice: expect a typical day near 2 kits, with anything from 0 to 5 entirely ordinary. She stocks moss for the day-to-day range (0 to 5), and plans her monthly revenue off the mean (near 2.1). The widget makes the two bands concrete: the inner one, the mean, pins down as data grows; the outer one, a new day, never shrinks past the irreducible noise.

::widget regression-intervals {}

[NOTE]
Every number here still carries Lesson 1's preamble: given the model and the priors. A different weakly informative prior would nudge these intervals a little, and much less than it would have at ten days. The prior is not cheating; it is an assumption stated in the open, and the prior predictive check earlier is how you keep it honest.

=== step === quiz
::eyebrow Check yourself
## Which interval does the decision use?

Asha needs to decide how many spare moss packs to keep on hand for a single upcoming thirty-dollar ad day, since unsold moss must be re-misted daily. Which interval should she plan that day's stock around?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- The credible interval for the mean rate, (1.74, 2.52), because it is the model's best estimate ::no That interval is about the long-run average across many thirty-dollar days, not what one day will actually sell. Planning a single day's stock off it would leave her short whenever that day runs busy.
- The prediction interval for a single day, (0, 5), because she is stocking for one real day, not for the average ::ok Right. A single day carries the full Poisson randomness on top of the uncertainty about the line, so its interval is wider. Stock for the range an actual day can hit, which is 0 to 5, not the mean's tight band.
- Neither: she should just use the point estimate of about 2 kits ::no A point estimate ignores the day-to-day spread entirely. Stocking exactly 2 would leave her under-supplied on every busier-than-average day, which the prediction interval says reach 5.
- The credible interval, because it is narrower and therefore safer ::no Narrower is not safer here, it answers the wrong question. The mean's interval understates what a single day can do; using it for one day's stock is precisely the mean-versus-day confusion to avoid.

=== step === concept
::eyebrow Know the limits
## A slope is an association, not a lever

The posterior is decisive that ad spend and orders move together, and the model predicts well. It is tempting to end with "so spending ten dollars more will multiply orders by 1.43." Be careful: that is a causal claim, and a regression on observed days does not, by itself, earn it.

[WARNING]
The slope measures association in the data Asha happened to record. Maybe she spent more on ads exactly on weekends or paydays, when orders would have been higher anyway; then ad spend is riding a hidden cause, and cutting the ad budget would not cut orders as the slope suggests. To read a slope as a lever you can pull, you need the causal machinery of a later course (a randomized test, or the confounding controls of causal inference), not just a good fit.

Two more honest edges. The model should not be trusted far outside the observed spend range of roughly zero to forty dollars; the exponential will happily predict enormous counts at spend levels she has never tried. And if real orders are more spread out than a Poisson allows (overdispersion) or pile up extra zeros, the Poisson family is too tight, and richer count families (a negative binomial, or a zero-inflated model) are the fix. The posterior predictive check is exactly how you would have caught that; here it passed.

=== step === quiz
::eyebrow Check yourself
## What the verdict licenses

A colleague reads Asha's report, credible interval for the multiplier (1.23, 1.69), WAIC favouring the spend model by about 2.5 standard errors, and concludes: "Proven. If we double the ad budget, orders will jump by the predicted multiplier." What is the sharpest correction?

::quiz {"correct":2,"gate":true,"difficulty":"advanced"}
- He is right: a credible interval that excludes 1 and a clear WAIC win together prove the intervention effect ::no Both numbers are strong evidence of association and of better prediction, but neither rules out a hidden common cause. A slope fit on observed days measures how ad spend and orders co-vary, not what changing the budget would do.
- The evidence is strong that spend and orders move together and that the predictor improves forecasts, but a slope from observed data is an association; without a randomized test or explicit confounding controls it does not license a "change the budget, get this effect" claim ::ok Exactly. Prediction and causation are different questions. The model earns a confident forecast for days like the ones observed, and honest uncertainty on the multiplier, but the lever-pulling claim needs a design the data here does not have.
- The interval is too wide to act on, so nothing can be concluded ::no A multiplier interval of (1.23, 1.69) is decisive that the association is positive and material; width is not the problem. The problem is upgrading an association to a guaranteed intervention effect.
- WAIC only tells you which model predicts worse, so it says nothing about the ad effect ::no WAIC did its job, showing the predictor genuinely improves out-of-sample prediction. The gap is not in the comparison; it is in reading a predictive, associational result as a causal one.

=== step === concept
::eyebrow Go deeper
## References

Five authoritative places to take this further:

- [Regression and Other Stories (Gelman, Hill and Vehtari), free PDF](https://avehtari.github.io/ROS-Examples/) - the modern applied companion to exactly this workflow: GLMs, priors on coefficients, and honest predictive summaries.
- [Statistical Rethinking (McElreath)](https://xcelab.net/rm/) - chapters 10 to 11 build Poisson and binomial GLMs from priors on the link scale, with the prior-predictive-check habit front and centre.
- [Bayesian Data Analysis, 3rd edition (Gelman, Carlin, Stern, Dunson, Vehtari, Rubin), free PDF](https://sites.stat.columbia.edu/gelman/book/) - the canonical reference; its GLM chapter is the rigorous version of this lesson.
- [rstanarm: stan_glm and the Bayesian GLM](https://mc-stan.org/rstanarm/articles/rstanarm.html) - the one-call tool that fits the model you built by hand, with the same prior specification.
- [Burkner (2017), brms: Bayesian Regression Models using Stan, Journal of Statistical Software](https://doi.org/10.18637/jss.v080.i01) - the flexible package for Bayesian regression, from GLMs to multilevel and beyond.

=== step === complete
## Module complete

You ran the entire Bayesian workflow, once, on the first model in this course with a predictor. You saw a single least-squares line and named its three failures, then built a generalized linear model that fixes them: a linear predictor, a log link that keeps the rate positive and makes effects multiplicative, and a Poisson likelihood whose spread matches counts, with weakly informative priors you vetted by a prior predictive check before the data was allowed to speak. You fit it by extending Lesson 1's grid to two coefficients, recovered the true slope inside its credible interval, checked it with a posterior predictive test, proved with WAIC that the predictor earns its keep, and reported it as a decision would need it: a multiplier of about 1.43 per ten dollars, a mean-rate credible interval, and a wider prediction interval for a single day, ending on the honest line between an association and a lever.

That closes the course. Across eight lessons you built the machinery from the ground up: the prior-times-likelihood update, conjugacy, the Metropolis sampler and its diagnostics, hierarchical partial pooling, posterior predictive checks, LOO and WAIC, and now a full Bayesian regression that ties them all together. You can state a model, fit it, prove it deserves trust, and report what it does and does not license, which is the whole of applied Bayesian practice.

One step remains: the section Quiz, where you put the eight lessons together for your Bayesian Modeling badge.
