---
title: "The Bayesian Workflow in R: All 5 Steps Explained"
slug: "Bayesian-Workflow-in-R"
description: "The Bayesian workflow is iterative: set priors, fit, check predictions, then revise. Learn all 5 steps in R with one running example, from prior to report."
keywords: "Bayesian workflow, Bayesian workflow in R, prior predictive check, posterior predictive check, rstanarm, Bayesian model checking, prior sensitivity analysis, Bayesian regression in R"
auto_link_terms: "Bayesian workflow|Bayesian workflow in R|the Bayesian workflow|full Bayesian workflow|iterative Bayesian workflow|Bayesian modeling workflow|Bayesian model building workflow|iterative model building|Bayesian workflow steps|model revision loop"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-28"
curriculum_id: "5.2.10"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Bayesian Workflow"
sidebar_order: "183"
difficulty: "Advanced"
---

<p class="lead">The Bayesian workflow is the disciplined loop that turns a single Bayesian model into a trustworthy answer: you set priors, fit the model, check whether the fit could have produced your real data, and revise when a check fails. It is iterative on purpose. This tutorial walks all five steps on one dataset in R, so by the end you can run the whole loop yourself, from prior to report.</p>

## What is the Bayesian workflow, and why is it a loop?

Most tutorials teach you to fit one Bayesian model and read off the numbers. Real analysis never works that way. Andrew Gelman and colleagues describe the honest practice as a loop: you propose a model, pit it against the data, then improve it wherever it falls short. The Bayesian workflow is that loop, done deliberately instead of by accident.

We will follow one question the whole way through. In the built-in `mtcars` data, does a car's weight affect its fuel economy differently for manual versus automatic transmissions? Let us start by centering weight at its average (so the intercept means "mpg for a typical-weight car") and looking at the raw slope of miles-per-gallon against weight inside each transmission group.

```r title="Set up the running example"
# One dataset carries the whole workflow: fuel economy vs weight in mtcars
mt <- mtcars
mt$am     <- factor(mt$am, labels = c("automatic", "manual"))
mt$manual <- as.integer(mt$am == "manual")   # 1 = manual, 0 = automatic
mt$wt_c   <- mt$wt - mean(mt$wt)              # weight centered at its mean

# How fast does mpg drop as weight rises, inside each transmission type?
round(as.numeric(coef(lm(mpg ~ wt_c, data = subset(mt, am == "automatic")))[2]), 1)
#> [1] -3.8
round(as.numeric(coef(lm(mpg ~ wt_c, data = subset(mt, am == "manual")))[2]), 1)
#> [1] -9.1
```

Read the two numbers. For automatic cars, every extra 1,000 pounds costs about 3.8 mpg. For manual cars, the same weight costs about 9.1 mpg, nearly two and a half times as much. That gap is the puzzle the whole workflow will test: is it a real difference the model must capture, or just noise from 32 cars? A single fit cannot answer that. The loop can.

Here are the five steps we will run, and how they connect.

![The five workflow steps form a loop](screenshots/Bayesian-Workflow-in-R-loop.webp)
*Figure 1: The five workflow steps form a loop: a failed check sends you back to revise and refit.*

1. **Set priors** and check them by simulating fake data before you look at the real data.
2. **Fit** the model to the data.
3. **Diagnose** the sampler to make sure the computation actually worked.
4. **Check** the fitted model against the data, looking for places it cannot reproduce.
5. **Revise** the model when a check fails, then run the loop again.

The arrow from step 5 back to step 2 is the whole point. A Bayesian analysis is finished not when the model runs, but when it survives the checks. Throughout, the model fitting itself uses the `rstanarm` package (which needs a local R session), while every prior and posterior check runs right here in your browser using base R.

[KEY INSIGHT]
**A Bayesian result is a loop, not a single fit.** The value is not in running one model; it is in the discipline of checking that model against reality and improving it until the checks pass.

**Try it:** The manual slope is about 9.1 and the automatic slope is about 3.8. Compute how many times steeper the manual slope is, rounded to one decimal.

```r title="Your turn: compare the two slopes"
# Replace NA with a calculation using 9.1 and 3.8.
ex_ratio <- NA
# ex_ratio should be about 2.4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Slope ratio solution"
round(9.1 / 3.8, 1)
#> [1] 2.4
```

**Explanation:** Manual cars lose fuel economy about 2.4 times faster per unit of weight. Whether that ratio is real is exactly what steps 4 and 5 will decide.

</details>

## Step 1: How do you set priors and check them before seeing data?

A prior is your belief about a parameter before you see the data, written as a probability distribution. A weakly-informative prior is one that rules out absurd values but stays open-minded about anything reasonable. For our model, we need priors for the intercept (average mpg at average weight) and the weight slopes, plus a prior for the size of the noise. Good starting choices are a Normal centered at 20 for the intercept, a Normal centered at 0 for each slope, and a positive prior for the noise size.

How do you know a prior is reasonable? You simulate. A prior predictive check draws parameter values from the priors alone, generates the fake datasets those priors imply, and asks a simple question: could this data plausibly exist? Let us draw 1,000 sets of parameters from weakly-informative priors and see what range of fuel economy they imply across the real weights.

```r title="Simulate data from the priors alone"
set.seed(7)
S  <- 1000
b0 <- rnorm(S, 20, 10)   # intercept prior: mpg for an average-weight car
bw <- rnorm(S,  0, 10)   # slope prior: change in mpg per 1,000 lb

# implied average mpg at every observed weight, for each prior draw
implied <- outer(bw, mt$wt_c) + b0
round(quantile(implied, c(0.05, 0.95)))
#>  5% 95%
#>  -2  42
round(100 * mean(implied < 0), 1)
#> [1] 6.4
```

The middle 90% of prior-implied mpg values runs from about -2 to 42. That is wide, which is the point of a weakly-informative prior: it does not pretend to know the answer. About 6% of the implied values dip below zero, which is impossible for real fuel economy. A small amount of leakage into impossible territory is acceptable here, because the data we are about to add will easily pull the estimates into a sensible range.

Now watch what a careless prior does. If we make the slope prior vague, a Normal centered at 0 with a standard deviation of 100, the implied data becomes nonsense.

```r title="Repeat the check with a vague prior"
set.seed(70)
b0v <- rnorm(S, 20, 10)
bwv <- rnorm(S,  0, 100)   # a near-flat, "let anything happen" slope prior
implied_vague <- outer(bwv, mt$wt_c) + b0v
round(quantile(implied_vague, c(0.05, 0.95)))
#>   5%  95%
#> -127  167
round(100 * mean(implied_vague < 0), 1)
#> [1] 31.4
```

Under the vague prior, the implied mpg swings from -127 to 167, and nearly a third of the values are physically impossible. A prior that expects cars getting -127 mpg is not "letting the data speak"; it is asserting a belief that most possible worlds are absurd. The prior predictive check catches this before any fitting happens, which is exactly when it is cheapest to fix.

[KEY INSIGHT]
**Priors are assumptions you can test, not fudge factors.** Simulating from the prior turns an abstract choice into concrete fake datasets you can eyeball, so you can reject an absurd prior before it ever touches your data.

**Try it:** Suppose you wanted an even tighter slope prior with a standard deviation of 5. Set up the scaffold, then compute what percent of implied mpg values would be impossible.

```r title="Your turn: try a tighter slope prior"
# You will draw slopes from a Normal(0, 5) instead of Normal(0, 10).
ex_slope_sd <- 5
# Combine a fresh b0 and the new slopes, then compute the percent below 0.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Tighter prior solution"
set.seed(7)
b0b <- rnorm(S, 20, 10)
bw5 <- rnorm(S, 0, 5)
round(100 * mean((outer(bw5, mt$wt_c) + b0b) < 0), 1)
#> [1] 3.2
```

**Explanation:** A tighter slope prior halves the impossible fraction, from 6.4% to about 3.2%. Tightening priors is a legitimate response to a prior predictive check, as long as you are not sneaking in the answer you want.

</details>

## Step 2: How do you fit the model and read it honestly?

We will start with the simplest model that could answer our question: mpg depends on weight and on transmission, but with a single common weight slope for both groups. In formula terms that is `mpg ~ wt_c + am`. We fit it with `stan_glm()`, which draws thousands of samples from the posterior distribution, the updated belief about each parameter after seeing the data.

$$ \text{mpg}_i = \beta_0 + \beta_{\text{wt}}\, \text{wt\_c}_i + \beta_{\text{am}}\, \text{manual}_i + \varepsilon_i $$

This additive form gives manual cars a different intercept (through the `am` term) but forces both transmission types to share the same weight slope. Let us fit it and read the summary.

```r-static title="Fit the additive model"
library(rstanarm)
options(mc.cores = 1)

fit_add <- stan_glm(mpg ~ wt_c + am, data = mt,
                    prior = normal(0, 10), prior_intercept = normal(20, 10),
                    prior_aux = exponential(0.2),
                    seed = 2027, refresh = 0)
print(fit_add)
#> stan_glm
#>  family:       gaussian [identity]
#>  formula:      mpg ~ wt_c + am
#>  observations: 32
#>  predictors:   3
#> ------
#>             Median MAD_SD
#> (Intercept) 20.1    0.8
#> wt_c        -5.3    0.8
#> ammanual     0.0    1.6
#>
#> Auxiliary parameter(s):
#>       Median MAD_SD
#> sigma 3.1    0.4
```

Read this honestly. The weight slope is about -5.3 mpg per 1,000 pounds, tightly estimated. But look at the transmission term, `ammanual`: its posterior median is 0.0 with a spread of 1.6. Once the model already knows a car's weight, adding "is it manual?" does essentially nothing. The coefficient table shows that once weight is in the model, transmission does not matter.

[NOTE]
**The fit runs locally, the checks run here.** The `stan_glm()` call above needs a local R session with rstanarm installed. Every check in the sections below is written in base R so you can run it in your browser. To do that we summarize the fitted posterior by its center and spread and draw from that summary, which for a model like this is an excellent stand-in for the full posterior.

A single number is not a Bayesian answer. The whole appeal of the Bayesian approach is that it gives you a full distribution for each parameter, so you can state a credible interval: a range that contains the parameter with a stated probability. Let us draw from the fitted posterior and read off the 90% credible interval for the transmission effect. The four numbers in `mu_a` are the posterior means of the three coefficients plus log sigma, and `S_a` is their covariance matrix; both are summaries of the local fit above.

```r title="Read a credible interval from the posterior"
library(MASS)
# posterior means and covariance of (intercept, wt_c, ammanual, log sigma)
mu_a <- c(20.087, -5.306, 0.039, 1.151)
S_a  <- matrix(c( 0.707, -0.341, -0.940,  0.000,
                 -0.341,  0.623,  0.842,  0.004,
                 -0.940,  0.842,  2.383,  0.006,
                  0.000,  0.004,  0.006,  0.018), 4, 4, byrow = TRUE)

set.seed(11)
tha <- mvrnorm(4000, mu_a, S_a)          # 4000 posterior draws
round(quantile(tha[, 3], c(0.05, 0.95)), 2)   # column 3 = transmission effect
#>    5%   95%
#> -2.49  2.53
```

The 90% credible interval for the transmission effect runs from about -2.5 to +2.5 mpg. It straddles zero, and it is roughly symmetric around zero. In plain language: after accounting for weight, this model sees no evidence that transmission changes fuel economy in either direction. If you stopped here, you would report "transmission does not matter" and move on. Hold that thought, because it is wrong, and the workflow is about to show you why.

**Try it:** Using the same posterior draws in `tha`, estimate the posterior probability that the transmission effect is positive.

```r title="Your turn: posterior probability the effect is positive"
# tha[, 3] holds 4000 posterior draws of the transmission effect.
# Compute the fraction that are greater than 0, rounded to 2 decimals.
ex_prob <- NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Posterior probability solution"
round(mean(tha[, 3] > 0), 2)
#> [1] 0.5
```

**Explanation:** The probability is about 0.5, a coin flip. The posterior is centered on zero, so the model genuinely cannot tell whether the effect is positive or negative. That is what "no effect" looks like in a Bayesian summary.

</details>

## Step 3: Did the sampler actually converge?

Before you trust a single number from a fitted model, you have to know the computation worked. `stan_glm()` does not solve the posterior with algebra; it explores it with a Markov chain that wanders through parameter space. If that wandering has not settled down, the summaries are garbage no matter how sensible they look.

Two numbers tell you whether it settled. R-hat compares the several chains the sampler runs in parallel: if they have all converged to the same distribution, R-hat sits at 1.00, and anything above about 1.01 is a warning. The effective sample size (`n_eff`) estimates how many truly independent draws you have; you want it in the hundreds or thousands, not the tens. Here they are for our additive fit.

```r-static title="Check R-hat and effective sample size"
diag <- summary(fit_add)[c("(Intercept)", "wt_c", "ammanual", "sigma"),
                         c("Rhat", "n_eff")]
round(diag, 2)
#>             Rhat n_eff
#> (Intercept)    1  2223
#> wt_c           1  2133
#> ammanual       1  2268
#> sigma          1  2413
```

Every R-hat is 1.00 and every effective sample size is over 2,000. The sampler converged and gave us plenty of independent information about each parameter. This is the step people skip, and skipping it is how wrong conclusions get published. For the full battery of convergence diagnostics, including trace plots that show the chains overlapping like a fuzzy caterpillar, see the companion tutorial on MCMC diagnostics.

[WARNING]
**Never read coefficients from a model you have not diagnosed.** A high R-hat means the chains disagree about the answer, so the posterior summary is meaningless. Check R-hat and effective sample size first, every time, before you interpret anything.

**Try it:** Imagine a model reports these four R-hat values, one per chain summary. Decide whether they all pass the usual threshold of being below 1.01.

```r title="Your turn: judge these R-hat values"
rhat <- c(1.00, 1.00, 1.35, 1.00)
# Write one line that returns TRUE only if every value is below 1.01.
```

<details>
<summary>Click to reveal solution</summary>

```r title="R-hat check solution"
rhat <- c(1.00, 1.00, 1.35, 1.00)
all(rhat < 1.01)
#> [1] FALSE
```

**Explanation:** The third value, 1.35, is far above 1.01, so the check returns FALSE. One bad chain is enough to reject the whole fit. You would need to rerun the sampler, often with more iterations or a reparameterized model, before trusting any result.

</details>

## Step 4: Does the model reproduce the data?

Here is the heart of the workflow. A model can converge perfectly and still be wrong, because converging only means the computation matched the model you specified, not that the model matches reality. A posterior predictive check closes that gap. It asks: if this fitted model is true, what data would it generate, and does that fake data look like the data we actually saw?

The recipe is simple. Draw parameters from the posterior, use them to simulate a replicated dataset the same size as the real one, compute some summary statistic on that replicate, and repeat thousands of times. Then compare the real data's statistic to the cloud of replicated statistics. Pick a statistic that targets what you care about. Our question is about group-specific slopes, so the natural statistic is the gap between the manual weight slope and the automatic weight slope.

$$ T(y) = \text{slope}_{\text{manual}} - \text{slope}_{\text{automatic}} $$

We already know the observed gap is about -5.3 (manuals lose mpg roughly 5.3 faster per 1,000 pounds). Let us simulate that gap from the additive model many times and see where the observed value falls.

```r title="Posterior predictive check on the additive model"
# test statistic: manual weight slope minus automatic weight slope
slope_gap <- function(y) {
  a <- coef(lm(y[mt$manual == 0] ~ mt$wt_c[mt$manual == 0]))[2]
  m <- coef(lm(y[mt$manual == 1] ~ mt$wt_c[mt$manual == 1]))[2]
  as.numeric(m - a)
}
T_obs <- slope_gap(mt$mpg)
round(T_obs, 2)
#> [1] -5.3

n <- nrow(mt)
set.seed(11)
Trep_add <- numeric(4000)
for (d in 1:4000) {
  mu <- tha[d, 1] + tha[d, 2] * mt$wt_c + tha[d, 3] * mt$manual
  Trep_add[d] <- slope_gap(rnorm(n, mu, exp(tha[d, 4])))
}
hist(Trep_add, breaks = 30, main = "Additive model: replicated slope gaps",
     xlab = "manual slope - automatic slope")
abline(v = T_obs, col = "red", lwd = 2)   # the observed gap
round(mean(Trep_add), 2)
#> [1] -0.01
round(mean(Trep_add <= T_obs), 3)
#> [1] 0.002
```

Look at what happened. The additive model replicates slope gaps centered on zero, because it forces both groups to share one slope, so any gap it produces is pure noise. The observed gap of -5.3 sits far out in the left tail. The fraction of replicates as extreme as the data, a posterior predictive p-value, is 0.002. That is a clear failure: the model almost never generates data with a slope gap like the one we actually see.

![How a posterior predictive check decides](screenshots/Bayesian-Workflow-in-R-ppc-decision.webp)
*Figure 2: A posterior predictive check compares the data to what the fitted model would generate, and the verdict decides whether you revise.*

This is the decision point of the loop. The coefficient table in step 2 said transmission does not matter. The check says the model that assumes transmission does not matter cannot reproduce the data. When the summary and the check disagree, the check wins, because the check is looking at the actual data-generating behavior of the model, not just one parameter in isolation.

[KEY INSIGHT]
**A posterior predictive check catches failures that coefficient tables hide.** The transmission coefficient looked like zero, but the model still could not reproduce the group-specific slopes. Checking predictions, not just reading estimates, is what turns a fit into a diagnosis.

**Try it:** The p-value above counted replicates at least as low as the observed gap. Compute a two-sided version instead: the fraction of replicated gaps whose size (absolute value) is at least as large as the observed size.

```r title="Your turn: a two-sided predictive p-value"
# Trep_add holds 4000 replicated slope gaps; T_obs is the observed gap.
# Compute the fraction with abs(replicate) >= abs(T_obs), rounded to 3 decimals.
ex_pval <- NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Two-sided p-value solution"
round(mean(abs(Trep_add) >= abs(T_obs)), 3)
#> [1] 0.003
```

**Explanation:** Even counting extremes in both directions, only about 0.3% of replicates are as far from zero as the real data. The additive model is decisively rejected by this check.

</details>

## Step 5: How do you revise the model when a check fails?

A failed check is not a dead end; it is an instruction. The check told us the additive model cannot produce different slopes for different transmissions, so we revise the model to allow exactly that. We add an interaction between weight and transmission, written `mpg ~ wt_c * am`. The interaction term lets each group have its own weight slope.

$$ \text{mpg}_i = \beta_0 + \beta_{\text{wt}}\, \text{wt\_c}_i + \beta_{\text{am}}\, \text{manual}_i + \beta_{\text{wt:am}}\, (\text{wt\_c}_i \times \text{manual}_i) + \varepsilon_i $$

The new coefficient, the one multiplying weight-times-manual, is the extra slope manual cars get on top of the automatic slope. Let us refit and read it.

```r-static title="Refit with a weight-by-transmission interaction"
fit_int <- stan_glm(mpg ~ wt_c * am, data = mt,
                    prior = normal(0, 10), prior_intercept = normal(20, 10),
                    prior_aux = exponential(0.2),
                    seed = 2027, refresh = 0)
print(fit_int)
#> stan_glm
#>  family:       gaussian [identity]
#>  formula:      mpg ~ wt_c * am
#>  observations: 32
#>  predictors:   4
#> ------
#>               Median MAD_SD
#> (Intercept)   19.2    0.7
#> wt_c          -3.8    0.8
#> ammanual      -2.1    1.4
#> wt_c:ammanual -5.2    1.5
#>
#> Auxiliary parameter(s):
#>       Median MAD_SD
#> sigma 2.6    0.4
```

Now the story changes. The automatic weight slope is about -3.8, and the interaction term `wt_c:ammanual` is about -5.2, well separated from zero given its spread of 1.5. Manual cars lose roughly 5.2 mpg more per 1,000 pounds than automatics, which recovers the raw -3.8-versus-9.1 gap we saw at the very start. The transmission effect the additive model missed was never about the intercept; it was about the slope.

But a smaller residual noise (sigma dropped from 3.1 to 2.6) and a plausible-looking coefficient are not proof. We revised because a check failed, so we are only done when the same check passes. Let us rerun the identical posterior predictive check on the interaction model.

```r title="Re-run the same check on the revised model"
# posterior means and covariance for the interaction model
mu_i <- c(19.225, -3.779, -2.109, -5.242, 0.976)
S_i  <- matrix(c( 0.544, -0.331, -0.550,  0.309,  0.000,
                 -0.331,  0.630,  0.321, -0.617,  0.000,
                 -0.550,  0.321,  2.202,  1.037, -0.005,
                  0.309, -0.617,  1.037,  2.258, -0.004,
                  0.000,  0.000, -0.005, -0.004,  0.019), 5, 5, byrow = TRUE)

set.seed(11)
thi <- mvrnorm(4000, mu_i, S_i)
Trep_int <- numeric(4000)
for (d in 1:4000) {
  mu <- thi[d, 1] + thi[d, 2] * mt$wt_c + thi[d, 3] * mt$manual +
        thi[d, 4] * mt$wt_c * mt$manual
  Trep_int[d] <- slope_gap(rnorm(n, mu, exp(thi[d, 5])))
}
round(mean(Trep_int), 2)
#> [1] -5.26
round(mean(Trep_int <= T_obs), 3)
#> [1] 0.489
```

The replicated slope gaps now center on -5.26, right where the observed -5.3 lives, and the posterior predictive p-value is 0.489, almost exactly one half. The observed data is now completely typical of what the model generates. The revision worked, and we can prove it with the same check that rejected the old model. That is the loop closing: a failed check drove a specific change, and the change fixed the specific failure.

**Try it:** The manual weight slope equals the automatic slope plus the interaction term, that is `thi[, 2] + thi[, 4]`. Report its posterior median and 90% credible interval, rounded to one decimal.

```r title="Your turn: the manual weight slope"
# Add the automatic slope (column 2) and the interaction (column 4),
# then take the 5%, 50%, and 95% quantiles.
ex_slope <- NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual slope solution"
round(quantile(thi[, 2] + thi[, 4], c(0.05, 0.5, 0.95)), 1)
#>   5%   50%   95%
#> -11.1  -9.1  -7.0
```

**Explanation:** The manual weight slope has a median of -9.1, matching the raw slope from step 1, with a 90% credible interval from -11.1 to -7.0 that stays well below the automatic slope of -3.8. The two groups really do respond to weight differently.

</details>

## How sensitive are your conclusions to the prior?

You chose those priors. A careful reader will wonder whether your conclusion is a fact about the data or an artifact of that choice. A sensitivity analysis answers the question directly: refit the model under a much wider prior and a much tighter one, and see whether the conclusion moves. If the answer barely changes, the data is doing the talking. If it swings, you must report that your result depends on your assumptions.

We refit the interaction model three ways: a skeptical prior that strongly doubts large effects (Normal centered at 0 with standard deviation 2), our weakly-informative baseline (standard deviation 10), and a nearly flat prior (standard deviation 50). Then we compare the posterior for the interaction term.

```r-static title="Refit under a skeptical and a vague prior"
fit_tight <- stan_glm(mpg ~ wt_c * am, data = mt, prior = normal(0, 2),
                      prior_intercept = normal(20, 10), prior_aux = exponential(0.2),
                      seed = 2027, refresh = 0)
fit_wide  <- stan_glm(mpg ~ wt_c * am, data = mt, prior = normal(0, 50),
                      prior_intercept = normal(20, 10), prior_aux = exponential(0.2),
                      seed = 2027, refresh = 0)

pick <- function(f) {
  x <- as.matrix(f)[, "wt_c:ammanual"]
  round(c(median = median(x), q05 = quantile(x, 0.05), q95 = quantile(x, 0.95)), 2)
}
rbind(tight = pick(fit_tight), base = pick(fit_int), wide = pick(fit_wide))
#>       median q05.5% q95.95%
#> tight  -3.67  -5.60   -1.64
#> base   -5.24  -7.73   -2.86
#> wide   -5.28  -7.73   -2.78
```

Read the three rows. Under the skeptical prior the interaction shrinks toward zero, from -5.2 down to -3.7, exactly what a skeptical prior is supposed to do. But even then its 90% credible interval, -5.6 to -1.6, stays entirely below zero. The wide prior is almost identical to the baseline. Across an aggressive range of prior beliefs, the sign and the significance of the effect never change; only the magnitude wobbles a little under the most skeptical prior. That is a conclusion that holds up, and being able to say so honestly is worth more than any single point estimate.

[TIP]
**Report the range, not just the winner.** When a skeptical prior shrinks an effect but keeps its sign and interval on the same side of zero, say exactly that. A conclusion that survives a genuinely skeptical prior is far more convincing than one you only get with a prior tuned to produce it.

**Try it:** From the table, the three 90% upper bounds are -1.64, -2.86, and -2.78. Confirm that all three intervals exclude zero.

```r title="Your turn: do all three intervals exclude zero?"
hi <- c(-1.64, -2.86, -2.78)   # the 95% upper bounds under the three priors
# Return TRUE only if every upper bound is below 0.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Interval check solution"
hi <- c(-1.64, -2.86, -2.78)
all(hi < 0)
#> [1] TRUE
```

**Explanation:** Every upper bound sits below zero, so under all three priors the interaction is credibly negative. The conclusion does not hinge on the prior.

</details>

## How do you report a Bayesian analysis honestly?

An honest Bayesian write-up shows its work at every step of the loop. It states the priors and why they are reasonable, confirms the sampler converged, presents the posterior predictive checks that the final model passes, reports a sensitivity analysis, and gives uncertainty as intervals rather than bare point estimates. A reader should be able to see not just your answer but every place the model could have failed and did not.

One more tool belongs in the report: a fair comparison of the models you considered. Leave-one-out cross-validation (LOO) estimates how well each model predicts data it has not seen, which is a better basis for comparison than in-sample fit. It is a large topic; here we use it only to confirm that the revision earned its extra complexity.

```r-static title="Compare the two models with LOO"
loo_add <- loo(fit_add)
loo_int <- loo(fit_int)
loo_compare(loo_add, loo_int)
#>         elpd_diff se_diff
#> fit_int  0.0       0.0
#> fit_add -5.5       2.4
```

The interaction model (`fit_int`) sits at the top, and the additive model predicts about 5.5 units worse, with a standard error of 2.4 on that difference. The gap is a little over two standard errors, so LOO agrees with the predictive check: the interaction model is the better description, and its extra parameter pays for itself. With only 32 cars this comparison is suggestive rather than decisive, which is itself worth stating in a report.

[NOTE]
**LOO ranks models; it does not bless them.** A model can win a LOO comparison and still fail a posterior predictive check. Use predictive checks to decide whether a model is adequate, and use LOO to choose among adequate models. They answer different questions.

**Try it:** The LOO difference is 5.5 with a standard error of 2.4. Compute how many standard errors that is, rounded to one decimal.

```r title="Your turn: express the LOO gap in standard errors"
# Divide the difference by its standard error.
ex_se_units <- NA
```

<details>
<summary>Click to reveal solution</summary>

```r title="LOO standard-error solution"
round(5.5 / 2.4, 1)
#> [1] 2.3
```

**Explanation:** The additive model predicts about 2.3 standard errors worse. A common rule of thumb treats a gap beyond about two standard errors as meaningful, so this comparison mildly favors the interaction model, consistent with everything else the workflow found.

</details>

### The complete workflow in one script

Here is the entire loop in one place: fit the simple model, check it, revise when the check fails, then confirm the fix works. This block uses the real posterior draws from rstanarm (through `posterior_predict()`), so it complements the browser-friendly approximations above and gives the same verdict. Run it in a local R session with rstanarm installed.

```r-static title="The whole workflow end to end"
library(rstanarm)
cars <- mtcars
cars$am   <- factor(cars$am, labels = c("automatic", "manual"))
cars$wt_c <- cars$wt - mean(cars$wt)

gap <- function(y, d) {
  a <- coef(lm(y[d$am == "automatic"] ~ d$wt_c[d$am == "automatic"]))[2]
  m <- coef(lm(y[d$am == "manual"]    ~ d$wt_c[d$am == "manual"]))[2]
  as.numeric(m - a)
}
obs <- gap(cars$mpg, cars)

# Step 1-2: priors + fit the simple additive model
m_add <- stan_glm(mpg ~ wt_c + am, data = cars, prior = normal(0, 10),
                  prior_intercept = normal(20, 10), prior_aux = exponential(0.2),
                  seed = 2027, refresh = 0)

# Step 4: posterior predictive check on the group-slope gap
set.seed(5)
rep_add <- apply(posterior_predict(m_add, draws = 2000), 1, gap, d = cars)
cat("additive model check p-value:", round(mean(rep_add <= obs), 2), "\n")
#> additive model check p-value: 0

# Step 5: revise (add interaction) and re-check
m_int <- stan_glm(mpg ~ wt_c * am, data = cars, prior = normal(0, 10),
                  prior_intercept = normal(20, 10), prior_aux = exponential(0.2),
                  seed = 2027, refresh = 0)
set.seed(5)
rep_int <- apply(posterior_predict(m_int, draws = 2000), 1, gap, d = cars)
cat("revised model check p-value:", round(mean(rep_int <= obs), 2), "\n")
#> revised model check p-value: 0.49
```

The simple model fails the check with a p-value of essentially 0; the revised model passes with a p-value near 0.5. That is the workflow in miniature: propose, check, revise, confirm.

## Practice Exercises

These combine several steps of the workflow. Each runs in your browser using the posterior draws you built above (`tha` for the additive model, `thi` for the interaction model). Use fresh variable names so you do not overwrite the tutorial's objects.

### Exercise 1: Summarize and probe the interaction effect

Using the interaction draws in `thi`, report the 90% credible interval for the extra weight penalty manual cars pay (column 4, `wt_c:ammanual`), and the posterior probability that this penalty is steeper than -3 mpg per 1,000 pounds.

```r title="Exercise 1: interval and tail probability"
# thi[, 4] holds 4000 draws of the interaction term.
# 1) 90% credible interval, rounded to 1 decimal
# 2) posterior probability the draw is less than -3, rounded to 2 decimals

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
round(quantile(thi[, 4], c(0.05, 0.95)), 1)
#>   5%  95%
#> -7.7 -2.9
round(mean(thi[, 4] < -3), 2)
#> [1] 0.94
```

**Explanation:** The 90% interval runs from -7.7 to -2.9, and there is a 94% posterior probability the manual penalty is steeper than -3. This is how you turn a fitted coefficient into a statement a stakeholder can act on.

</details>

### Exercise 2: Build a reusable posterior predictive check

Write a function that runs a posterior predictive check for any test statistic, then use it to check whether the interaction model reproduces the maximum mpg in the data. A good model should generate replicates whose maximum is similar to the observed maximum.

```r title="Exercise 2: a general PPC function"
# Fill in the body so ppc_stat() returns the fraction of replicated datasets
# whose statistic is at least as large as the observed statistic.
# Then call it with stat = max on the interaction draws thi.
ppc_stat <- function(draws, stat) {
  # your code here
}

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
ppc_stat <- function(draws, stat) {
  reps <- numeric(nrow(draws))
  for (d in seq_len(nrow(draws))) {
    mu <- draws[d, 1] + draws[d, 2] * mt$wt_c + draws[d, 3] * mt$manual +
          draws[d, 4] * mt$wt_c * mt$manual
    reps[d] <- stat(rnorm(n, mu, exp(draws[d, 5])))
  }
  mean(reps >= stat(mt$mpg))
}
set.seed(3)
round(ppc_stat(thi, max), 2)
#> [1] 0.49
```

**Explanation:** The p-value is about 0.49, so the observed maximum is completely typical of what the interaction model generates. A model can fail one check and pass another; a thorough workflow tries several statistics, not just one.

</details>

### Exercise 3: Interpret the effect at an average-weight car

The interaction changed the story about transmission. Using `thi`, compute the posterior probability that a manual car gets higher mpg than an automatic car of average weight (weight centered at zero). At that point the difference is just the `ammanual` term, column 3. Then say in one sentence what this means for the old claim that "manuals get better mileage."

```r title="Exercise 3: manuals versus automatics at average weight"
# At average weight, manual minus automatic mpg = thi[, 3].
# Compute the posterior probability that this is positive, rounded to 2 decimals.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
round(mean(thi[, 3] > 0), 2)
#> [1] 0.08
```

**Explanation:** There is only about an 8% chance a manual beats an automatic at average weight; if anything a manual is slightly worse. Once weight is in the model, the old "manuals get better mileage" story turns out to be mostly "manuals are lighter." The interaction did not just improve the fit; it corrected the interpretation.

</details>

## Frequently Asked Questions

#### Is the Bayesian workflow the same as just fitting a Bayesian model?

No. Fitting is only step 2. The workflow is the full loop of setting and checking priors, fitting, diagnosing the sampler, checking predictions against data, and revising. The discipline lives in the checking and revising, not in the fit.

#### What is the difference between a prior predictive check and a posterior predictive check?

A prior predictive check simulates data from the priors alone, before fitting, to catch absurd assumptions early. A posterior predictive check simulates data from the fitted model, after seeing the data, to find where the model fails to reproduce reality. One guards the input, the other tests the output.

#### Is a posterior predictive p-value the same as a frequentist p-value?

No. A posterior predictive p-value measures how typical your observed data is among datasets the fitted model would generate. It is a model-checking tool rather than a hypothesis test, and it has no fixed 0.05 threshold. Values near 0 or 1 flag a model that cannot reproduce the chosen statistic; values in the middle mean the model reproduces it well.

#### How many times should I go around the loop?

Until the checks you care about pass and a sensitivity analysis shows your conclusions are stable. In practice that is often two or three iterations. Stop when new revisions stop changing the checks that matter, not when the model runs without error.

#### Do I always need rstanarm, or can I use brms or Stan?

Any engine works. This tutorial uses rstanarm because it fits standard regressions with one function call, but the same five steps apply to brms and to raw Stan. The workflow is a discipline, not a package.

#### The tutorial fit models with rstanarm but ran checks in base R. Why?

The model fitting needs a local R session with rstanarm installed. The checks are written in base R so you can run them here in your browser, drawing from a compact summary of the fitted posterior. For linear models like this one, that summary behaves just like the full posterior, which is why the browser checks and the local `posterior_predict()` version give the same verdict.

## Summary

The Bayesian workflow turns a single model into a defensible conclusion by looping through five steps and revising whenever a check fails. On the `mtcars` question, the loop moved us from a model that wrongly declared transmission irrelevant to one that correctly captured a weight-by-transmission interaction, and it did so because a posterior predictive check forced the revision.

![The five steps at a glance](screenshots/Bayesian-Workflow-in-R-recap-mindmap.webp)
*Figure 3: Each step and the tool it produces, at a glance.*

| Step | Question it answers | Main tool |
|---|---|---|
| 1. Set priors | Could this prior generate sensible data? | Prior predictive check |
| 2. Fit | What does the data say about the parameters? | stan_glm and credible intervals |
| 3. Diagnose | Did the computation actually work? | R-hat and effective sample size |
| 4. Check | Can the model reproduce the data? | Posterior predictive check |
| 5. Revise | Does a targeted change fix the failure? | Refit and re-check |
| Report | Is the conclusion robust and honest? | Sensitivity analysis and LOO |

The lesson that outlasts this example: a coefficient table can hide a model's failures, and only checking predictions reveals them. Set priors you can defend, always diagnose before interpreting, let the checks drive your revisions, and report the sensitivity of your conclusions. That loop is what makes a Bayesian analysis trustworthy.

#### Continue learning

- [Prior Predictive Checks in R](Prior-Predictive-Checks-in-R.html): go deeper on step 1, including how to elicit and calibrate priors before fitting.
- [Posterior Predictive Checks in R](Posterior-Predictive-Checks-in-R.html): more test statistics and graphical checks for step 4.
- [MCMC Diagnostics in R](MCMC-Diagnostics-in-R.html): the full set of convergence checks behind step 3, including trace plots and divergences.

## References

1. Gelman, A., Vehtari, A., Simpson, D., Margossian, C. C., Carpenter, B., Yao, Y., Kennedy, L., Gabry, J., Bürkner, P.-C., and Modrák, M. Bayesian Workflow. arXiv:2011.01808 (2020). [Link](https://arxiv.org/abs/2011.01808) - the paper that named and organized the five-step loop this tutorial teaches.
2. McElreath, R. Statistical Rethinking: A Bayesian Course with Examples in R and Stan, 2nd Edition. CRC Press (2020). [Link](https://xcelab.net/rm/statistical-rethinking/) - a ground-up Bayesian course that builds the same modeling habits with worked R and Stan examples.
3. rstanarm documentation: How to Use the rstanarm Package. [Link](https://mc-stan.org/rstanarm/articles/rstanarm.html) - the package reference for stan_glm() and the prior arguments used throughout.
4. Gabry, J., Simpson, D., Vehtari, A., Betancourt, M., and Gelman, A. Visualization in Bayesian workflow. Journal of the Royal Statistical Society A (2019). [Link](https://mc-stan.org/bayesplot/articles/graphical-ppcs.html) - shows the graphical prior and posterior predictive checks behind steps 1 and 4.
5. Vehtari, A., Gelman, A., and Gabry, J. Practical Bayesian model evaluation using leave-one-out cross-validation and WAIC. Statistics and Computing (2017). [Link](https://mc-stan.org/loo/articles/loo2-example.html) - the method behind loo() and loo_compare() and how to read elpd_diff.
6. Muth, C., Oravecz, Z., and Gabry, J. User-friendly Bayesian regression modeling: A tutorial with rstanarm and shinystan. The Quantitative Methods for Psychology (2018). [Link](https://www.tqmp.org/RegularArticles/vol14-2/p099/p099.pdf) - a gentle applied walkthrough of Bayesian regression with rstanarm.
7. Stan Development Team. Posterior and Prior Predictive Checks (Stan User's Guide). [Link](https://mc-stan.org/docs/stan-users-guide/posterior-predictive-checks.html) - the reference explanation of prior and posterior predictive checks.
