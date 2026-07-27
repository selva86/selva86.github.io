---
title: "GLM Diagnostics in R Beyond Gaussian Models"
slug: "GLM-Diagnostics-in-R"
description: "GLM diagnostics in R for Poisson and logistic models: residual types, overdispersion, randomized quantile residuals and influence, with runnable examples."
keywords: "GLM diagnostics in R, GLM residuals, deviance residuals, Pearson residuals, overdispersion, randomized quantile residuals, Poisson regression diagnostics, logistic regression diagnostics, Cook's distance GLM"
auto_link_terms: "GLM diagnostics|GLM residuals|deviance residuals|Pearson residuals|randomized quantile residuals|quantile residuals|overdispersion|dispersion statistic|binned residuals|residual diagnostics for GLMs"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-27"
curriculum_id: "ST2-10.7"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "GLM Diagnostics"
sidebar_order: "90"
difficulty: "Intermediate"
---

<p class="lead">GLM diagnostics are the checks that confirm a generalized linear model, like Poisson or logistic regression, actually fits your data. They work differently from linear-regression diagnostics because the ordinary residual plots you trust for <code>lm()</code> will mislead you for a GLM. This tutorial shows you which residuals to use, how to catch overdispersion, and how to build the one residual that behaves the same way for every model family. Everything uses base R plus MASS, and every code block runs right here in your browser.</p>

## Why do the residual plots from linear regression mislead you for a GLM?

When you fit a linear model, you learned a reflex: plot the residuals against the fitted values and panic if you see a pattern. That reflex backfires for a GLM. Below we simulate a count process where we know the true model exactly. Then we fit that exact model and look at its residuals. If patterns meant trouble, this plot should be clean. Watch what happens.

```r title="A correctly specified Poisson model"
set.seed(101)
n  <- 200
x  <- runif(n, 0, 3)
y  <- rpois(n, lambda = exp(0.5 + 0.7 * x))   # TRUE intercept 0.5, TRUE slope 0.7
m_pois <- glm(y ~ x, family = poisson)

# The fit recovers the true coefficients almost exactly, so the model is correct:
round(coef(m_pois), 2)
#> (Intercept)           x 
#>         0.5         0.7 

# Yet the deviance residuals still fan into curved stripes:
plot(fitted(m_pois), residuals(m_pois, type = "deviance"),
     xlab = "Fitted mean", ylab = "Deviance residual",
     main = "Patterned, but the model is correct")
abline(h = 0, lty = 2)
```

The estimated intercept and slope come back as 0.5 and 0.7, the exact numbers we simulated from. This model is not just good, it is perfect. And still the residual plot shows curved diagonal bands sweeping across the picture.

Two things cause those bands, and neither is a real problem. First, the response is a whole number (0, 1, 2, 3, ...), so for any given fitted mean the residuals can only take a few discrete values, which line up into stripes. Second, in a GLM the spread of the response changes with the mean on purpose. A Poisson count with a mean of 2 varies less than a count with a mean of 40. So the residuals naturally get bigger as the fitted value grows, producing that fanning shape.

[KEY INSIGHT]
**A pattern in a GLM residual plot is often a feature of the model family, not a sign of misfit.** For discrete responses the residuals fall into bands and grow with the mean by design, so the "residuals vs fitted" plot you rely on for linear regression is close to useless here. You need residuals built for non-Gaussian data instead.

That is what "beyond Gaussian" means in practice. The rest of this tutorial gives you the right tools: the residual types a GLM actually offers, a number that tells you when a count model is misbehaving, the one residual that looks Normal for any family, and how to spot a single row bending your fit.

**Try it:** A count model is behaving well when its dispersion statistic sits near 1.0. The dispersion statistic is the sum of squared Pearson residuals divided by the residual degrees of freedom (both explained in the next two sections). Compute it for `m_pois` and confirm it is close to 1.

```r title="Your turn: compute the dispersion"
# The dispersion statistic = sum(pearson residuals^2) / residual degrees of freedom.
# The residual df lives in m_pois$df.residual. Fill in and print your answer:
# ex_disp <- sum(residuals(m_pois, type = "pearson")^2) / ____
# Expected: a value near 0.97
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dispersion statistic solution"
ex_disp <- sum(residuals(m_pois, type = "pearson")^2) / m_pois$df.residual
round(ex_disp, 3)
#> [1] 0.971
```

**Explanation:** The value 0.971 is essentially 1, which is exactly what a correct Poisson model should produce. You now have your first honest GLM diagnostic, and it confirms what the coefficient recovery already told us: this model fits.

</details>

## Which residual types does a GLM give you, and which should you use?

A residual is the gap between what you observed and what the model predicted. Linear regression has one obvious way to measure that gap. A GLM gives you several, because the raw gap is not on a stable scale. Let us line up the three that `residuals()` produces and see how they differ.

The `type` argument picks the flavor. The `"response"` type is the plain gap, observed minus fitted mean. The `"pearson"` type divides that gap by the model's own standard deviation for each point, putting every residual on a comparable scale. The `"deviance"` type instead measures how much each point adds to the model's total lack of fit, and it is the default you get from `residuals()`.

```r title="Compare the three residual types"
r_response <- residuals(m_pois, type = "response")   # observed minus fitted mean
r_pearson  <- residuals(m_pois, type = "pearson")    # gap scaled by the model sd
r_deviance <- residuals(m_pois, type = "deviance")   # signed sqrt of deviance contribution

head(round(data.frame(r_response, r_pearson, r_deviance), 3))
#>   r_response r_pearson r_deviance
#> 1      0.396     0.209      0.205
#> 2      0.194     0.145      0.142
#> 3     -1.333    -0.492     -0.508
#> 4     -1.573    -0.613     -0.641
#> 5      4.214     2.525      2.114
#> 6     -2.096    -1.191     -1.390
```

Look at row 5. The response residual is a large 4.214, which looks alarming until you realize that point simply has a big fitted mean, so a gap of 4 is ordinary there. The Pearson and deviance residuals rescale it to about 2.5 and 2.1, numbers you can actually compare against the other rows. That rescaling is the whole point of Pearson and deviance residuals.

The Pearson residual has a clean formula. It is the gap divided by the square root of the model's variance function:

$$r^{P}_i = \frac{y_i - \hat{\mu}_i}{\sqrt{V(\hat{\mu}_i)}}$$

Where:

- $y_i$ = the observed value for row $i$
- $\hat{\mu}_i$ = the fitted mean the model predicts for row $i$
- $V(\hat{\mu}_i)$ = the model's variance function (for Poisson this is just $\hat{\mu}_i$, since a Poisson's variance equals its mean)

To see why the raw response residual is untrustworthy, measure its spread in the bottom half versus the top half of the fitted values. If the raw residuals were on a stable scale, the two numbers would match.

```r title="Raw residuals grow with the mean"
grp <- cut(fitted(m_pois), quantile(fitted(m_pois), c(0, .5, 1)),
           labels = c("low fitted", "high fitted"), include.lowest = TRUE)

round(tapply(r_response, grp, sd), 3)   # spread of the raw residual, low vs high fitted
#>  low fitted high fitted 
#>       1.876       2.806 
```

The raw residuals are 50% more spread out in the high-fitted half than in the low half. That growing spread is the mean-variance link again, and it is why a raw-residual plot looks like a funnel even for a perfect model. Pearson and deviance residuals divide that growth back out.

![Four residual types for a GLM, each standardizing the one before it](screenshots/GLM-Diagnostics-in-R-residual-types.webp)

*Figure 1: Each residual type standardizes the one before it, ending in the quantile residual, the only one that is Normal for any GLM family.*

[NOTE]
**The base plot() method uses standardized deviance residuals.** When you call `plot(model)` on a GLM, R draws standardized deviance residuals, which are deviance residuals further divided by their leverage-adjusted standard error. You can get them directly with `rstandard(model)`. They are a small refinement on the deviance residuals shown above, not a different animal.

**Try it:** Pearson residuals should have roughly constant spread across the fitted range, unlike the raw ones. Reuse the `grp` grouping and confirm the two spreads are both close to 1.

```r title="Your turn: check Pearson residual spread"
# Swap r_response for the Pearson residuals and measure spread in each half again.
# ex_spread <- tapply(residuals(m_pois, type = "pearson"), grp, ____)
# Expected: two numbers both near 1.0
```

<details>
<summary>Click to reveal solution</summary>

```r title="Pearson residual spread solution"
ex_spread <- tapply(residuals(m_pois, type = "pearson"), grp, sd)
round(ex_spread, 3)
#>  low fitted high fitted 
#>       1.020       0.946 
```

**Explanation:** Both halves now sit near 1.0, so the funnel is gone. Pearson residuals have a stable spread because dividing by the model's standard deviation cancels out the mean-variance link. That is why you compare Pearson (or deviance) residuals, never raw ones, when you eyeball a GLM.

</details>

## How do you check a count model for overdispersion?

Here is the single most common thing that goes wrong with a count model. A Poisson distribution has one strict rule: its variance equals its mean. Real count data usually varies more than that. Extra variation between observations, clustering, or a missing predictor all inflate the spread beyond what Poisson allows. That excess spread is called overdispersion, and if you ignore it your standard errors come out too small and ordinary predictors look wildly significant when they are not.

You measure it with the dispersion statistic, the average squared Pearson residual:

$$\hat{\phi} = \frac{1}{n - p}\sum_{i=1}^{n} \frac{(y_i - \hat{\mu}_i)^2}{V(\hat{\mu}_i)}$$

Where $n - p$ is the residual degrees of freedom (sample size minus the number of estimated coefficients). For a well-behaved Poisson model $\hat{\phi}$ sits near 1. A value well above 1 signals overdispersion. Let us fit a real count model, `warpbreaks`, which records the number of warp breaks on looms under different wool types and tensions.

```r title="Measure overdispersion in a count model"
m_wb <- glm(breaks ~ wool + tension, family = poisson, data = warpbreaks)

dispersion <- sum(residuals(m_wb, type = "pearson")^2) / m_wb$df.residual
round(dispersion, 3)
#> [1] 4.262
```

A dispersion of 4.26 is a red flag. The data varies more than four times as much as a Poisson model assumes. The coefficients themselves are still roughly right, but every standard error, z-value, and p-value from this model is untrustworthy because they all assume the spread is four times smaller than it actually is.

![The overdispersion decision flow for a count model](screenshots/GLM-Diagnostics-in-R-overdispersion.webp)

*Figure 2: The overdispersion decision: measure dispersion, keep Poisson if it is near 1, otherwise switch model.*

The clean fix is a model that lets the variance grow faster than the mean. The negative binomial does exactly that: it adds a spare parameter that soaks up the extra spread. Refit with `glm.nb()` from the MASS package and compare the standard errors side by side.

```r title="Refit as a negative binomial"
library(MASS)
m_wb_nb <- glm.nb(breaks ~ wool + tension, data = warpbreaks)

# Standard errors: Poisson (too small) vs negative binomial (honest)
cbind(poisson_se = round(summary(m_wb)$coefficients[, "Std. Error"], 3),
      negbin_se  = round(summary(m_wb_nb)$coefficients[, "Std. Error"], 3))
#>             poisson_se negbin_se
#> (Intercept)      0.045     0.098
#> woolB            0.052     0.101
#> tensionM         0.060     0.122
#> tensionH         0.064     0.124
```

The negative binomial standard errors are roughly twice as large. That is the overdispersion the Poisson model understated. Under Poisson, `tensionH` looks extremely precise with a standard error of 0.064; the honest number is 0.124. Same estimate, very different confidence.

[WARNING]
**Ignoring overdispersion manufactures fake significance.** Because Poisson standard errors are too small under overdispersion, predictors routinely show p-values far below 0.05 when the real evidence is weak. Always check the dispersion statistic on a count model before you trust a single p-value from it.

**Try it:** A quicker fix than the negative binomial is the quasi-Poisson family, which keeps the Poisson estimates but multiplies the standard errors by the estimated dispersion. Fit it and read the dispersion straight from the summary.

```r title="Your turn: read the quasi-Poisson dispersion"
# Fit the same formula with family = quasipoisson, then pull summary(...)$dispersion.
# ex_quasi <- glm(breaks ~ wool + tension, family = ____, data = warpbreaks)
# Expected: about 4.26, matching the statistic we computed by hand
```

<details>
<summary>Click to reveal solution</summary>

```r title="Quasi-Poisson dispersion solution"
ex_quasi <- glm(breaks ~ wool + tension, family = quasipoisson, data = warpbreaks)
round(summary(ex_quasi)$dispersion, 3)
#> [1] 4.262
```

**Explanation:** The quasi-Poisson dispersion, 4.262, is exactly the statistic we computed by hand earlier. Quasi-Poisson is the fastest way to correct standard errors for overdispersion. The negative binomial goes further by giving you a full probability model you can predict and simulate from, which is why it is usually the better choice.

</details>

## What are randomized quantile residuals, and why do they fix GLM diagnostics?

The residuals we have seen still carry the discreteness stripes from the very first plot. There is one residual that erases them completely, and once you meet it you will reach for it every time. It is the randomized quantile residual, from Dunn and Smyth (1996), and it is the engine behind modern diagnostic packages.

The idea is a two-step transform. First, feed each observation through the model's own fitted cumulative distribution. If the model is correct, those probabilities are spread evenly between 0 and 1, no matter whether the response was a count, a 0/1 outcome, or anything else. For a discrete response we spread each point randomly across the little probability step it lands on, which is the "randomized" part. Second, push those uniform values through the Normal quantile function so a correct model produces textbook Normal residuals.

$$u_i \sim \text{Uniform}\big(F(y_i - 1),\; F(y_i)\big), \qquad r^{Q}_i = \Phi^{-1}(u_i)$$

Where $F$ is the fitted CDF of the response (for a Poisson, `ppois` at the fitted mean), and $\Phi^{-1}$ is the Normal quantile function (`qnorm`). Let us build it by hand for our known-correct Poisson model from the first section and check it with a Normal quantile plot.

```r title="Build randomized quantile residuals"
set.seed(202)
lambda_hat <- fitted(m_pois)                                 # fitted Poisson means
u     <- runif(n, ppois(y - 1, lambda_hat), ppois(y, lambda_hat))
q_res <- qnorm(u)                                            # randomized quantile residuals

qqnorm(q_res, main = "Quantile residuals: a straight line means the model fits")
qqline(q_res)

# A formal normality check should NOT reject for a correct model:
round(shapiro.test(q_res)$p.value, 3)
#> [1] 0.675
```

The points fall along the reference line and the Shapiro-Wilk p-value of 0.675 gives no reason to doubt normality. Compare that with the ugly striped plot we started with, from the exact same model. The quantile residuals remove the discreteness and show that the fit is correct. This is why they are the gold standard for anything beyond Gaussian.

[KEY INSIGHT]
**Randomized quantile residuals are Normal for any GLM family when the model is right.** That single property lets you reuse the one diagnostic you already understand, the Normal quantile plot, no matter which GLM family you fit. A straight line means the fit is good; systematic curvature or heavy tails mean it is not.

[TIP]
**You do not have to hand-roll these in practice.** The `statmod` package computes them with `qresiduals()`, and the popular `DHARMa` package builds simulation-based versions plus formal tests for overdispersion and zero-inflation. Building them by hand once, as we just did, is the fastest way to understand what those packages are doing under the hood.

**Try it:** For a correct model, quantile residuals behave like standard Normal draws, so about 5% should fall outside the plus-or-minus 1.96 band. Check that on `q_res`.

```r title="Your turn: count residuals outside the band"
# mean(abs(...) > 1.96) gives the fraction outside the 95% Normal band.
# ex_outside <- mean(abs(q_res) > ____)
# Expected: roughly 0.05
```

<details>
<summary>Click to reveal solution</summary>

```r title="Quantile residual tail solution"
ex_outside <- mean(abs(q_res) > 1.96)
round(ex_outside, 3)
#> [1] 0.035
```

**Explanation:** About 3.5% of the residuals land outside the band, close to the 5% you expect from a standard Normal. If this fraction were much larger, say 20% or 30%, it would be strong evidence that the model is wrong. We use exactly that idea to expose a bad model in the practice exercises.

</details>

## How do you diagnose a logistic regression with only 0/1 outcomes?

Logistic regression pushes the discreteness problem to its extreme. The response is only ever 0 or 1, so for any fitted probability the residual can take just two values. Plot them and you get two useless curves, one for the zeros and one for the ones. Let us see it on `birthwt`, a study of low-birthweight births, where we model the chance of a low-weight baby from the mother's age and pre-pregnancy weight, plus whether she smoked or had hypertension.

```r title="Logistic residuals form two stripes"
data(birthwt)
m_low <- glm(low ~ age + lwt + smoke + ht, family = binomial, data = birthwt)

plot(fitted(m_low), residuals(m_low, type = "deviance"),
     xlab = "Fitted probability", ylab = "Deviance residual",
     main = "Two useless stripes: one per outcome (0 and 1)")
abline(h = 0, lty = 2)
```

Every point sits on one of two smooth curves. Nothing about an individual residual tells you whether the model fits, because a single 0/1 outcome carries almost no information on its own. The fix is to stop looking at individual points and look at groups. Sort the observations by their fitted probability, cut them into bins, and average the raw residual inside each bin. If the model is calibrated, those bin averages hover around zero.

```r title="Compute binned residuals by hand"
bins   <- cut(fitted(m_low),
              breaks = quantile(fitted(m_low), probs = seq(0, 1, 0.2)),
              include.lowest = TRUE)
raw    <- residuals(m_low, type = "response")   # observed 0/1 minus predicted probability
binned <- tapply(raw, bins, mean)               # average residual within each probability bin

round(binned, 3)
#> [0.0501,0.192]  (0.192,0.259]  (0.259,0.332]  (0.332,0.436]  (0.436,0.783] 
#>         -0.001         -0.042          0.005          0.071         -0.033 
```

Now you can read the fit. Every bin average is small, within about 0.07 of zero, and no run of consecutive bins shares the same sign. That is what a calibrated logistic model looks like: in each slice of predicted risk, the model is neither systematically too high nor too low.

[TIP]
**Binned residuals turn a hopeless plot into a readable one.** Group the observations by fitted probability and average the residuals per group. The `binnedplot()` function in the `arm` package draws this automatically with confidence bounds, but the hand-built version above shows exactly what it computes: predicted risk versus observed rate, slice by slice.

**Try it:** A binned residual near zero means predicted risk matches observed rate in that bin. Confirm it directly by averaging the fitted probability and the actual `low` outcome within each bin.

```r title="Your turn: compare bin rates"
# tapply(fitted(m_low), bins, mean) gives predicted risk per bin.
# tapply(birthwt$low, bins, mean) gives the observed rate per bin. Compare them.
# ex_pred_rate <- tapply(fitted(m_low), bins, ____)
# Expected: predicted and observed rows that track each other closely
```

<details>
<summary>Click to reveal solution</summary>

```r title="Binned rate comparison solution"
ex_pred_rate <- tapply(fitted(m_low), bins, mean)
ex_obs_rate  <- tapply(birthwt$low, bins, mean)
round(rbind(predicted = ex_pred_rate, observed = ex_obs_rate), 3)
#>           [0.0501,0.192] (0.192,0.259] (0.259,0.332] (0.332,0.436] (0.436,0.783]
#> predicted          0.132         0.226         0.293         0.377         0.533
#> observed           0.132         0.184         0.297         0.447         0.500
```

**Explanation:** The predicted and observed rows track each other closely across all five bins, which is the same information the binned residuals gave you: the model is well calibrated. The bin average residual is simply observed rate minus predicted rate, which is why the two views agree.

</details>

## How do you find influential and high-leverage points in a GLM?

A model can pass every residual check and still be quietly steered by one or two rows. Two quantities catch that. Leverage measures how unusual a point's predictor values are, and Cook's distance measures how much the whole fit would move if you deleted that point. Both work for GLMs just as they do for linear models, through `hatvalues()` and `cooks.distance()`. Let us rank the `warpbreaks` negative binomial rows by influence.

```r title="Rank points by Cook's distance"
infl <- cooks.distance(m_wb_nb)
round(sort(infl, decreasing = TRUE)[1:5], 4)
#>      5     24      9     37     14 
#> 0.1069 0.1017 0.0870 0.0805 0.0563 
```

Row 5 has the largest Cook's distance at about 0.11. There is no magic threshold, but a common rule of thumb flags any point above 4 divided by the sample size. The values here are modest and no single row dominates, which is reassuring. If one point were an order of magnitude larger than the rest, you would refit without it and see whether your conclusions held.

Leverage has its own rule of thumb: watch points above two times the number of coefficients divided by the sample size. Compare that threshold with the largest leverage in the data.

```r title="Check leverage against a threshold"
lev <- hatvalues(m_wb_nb)
p   <- length(coef(m_wb_nb))
round(c(rule_2p_over_n = 2 * p / nrow(warpbreaks),
        max_leverage   = max(lev)), 3)
#> rule_2p_over_n   max_leverage 
#>          0.148          0.076 
```

The highest leverage, 0.076, sits comfortably below the 0.148 threshold, so no point has an unusual combination of predictor values. That makes sense here because the predictors are just wool type and tension, a small tidy grid with no extreme rows.

[WARNING]
**There is no universal cutoff for Cook's distance.** The 4/n and 2p/n rules are conversation starters, not verdicts. A point that clears them is worth inspecting, not automatically deleting. Deleting data to improve a fit, without a substantive reason, is how you fool yourself. Always ask why a point is influential before you act on it.

**Try it:** Count how many `warpbreaks` rows exceed the common Cook's distance rule of thumb, 4 divided by the sample size.

```r title="Your turn: count influential points"
# sum(cooks.distance(m_wb_nb) > 4 / nrow(warpbreaks)) counts the flagged rows.
# ex_flag <- sum(cooks.distance(m_wb_nb) > 4 / ____)
# Expected: a small single-digit count
```

<details>
<summary>Click to reveal solution</summary>

```r title="Influential point count solution"
ex_flag <- sum(cooks.distance(m_wb_nb) > 4 / nrow(warpbreaks))
ex_flag
#> [1] 4
```

**Explanation:** Four rows clear the rule of thumb. That is normal for a threshold this loose, and none of them was extreme in the ranking above. You would glance at those four rows, confirm they are genuine looms and not data-entry errors, and move on.

</details>

## Complete Example: A Full GLM Diagnostic Workflow

Let us put every step together on a fresh dataset. `quine` records days of school absence for Australian schoolchildren, broken down by ethnicity and sex, plus age group and learning speed. Absence counts are exactly the kind of data that overdisperses, so it is a realistic test. We follow one fixed order: fit, check the shape with quantile residuals, check the spread with dispersion, check individual points with Cook's distance, then refit if needed.

![The recommended order for GLM diagnostic checks](screenshots/GLM-Diagnostics-in-R-workflow.webp)

*Figure 3: The order to run GLM checks: shape first, then spread, then individual points.*

Start with a Poisson fit and its dispersion statistic.

```r title="Fit and test a Poisson model"
data(quine)
m_q <- glm(Days ~ Eth + Sex + Age + Lrn, family = poisson, data = quine)

round(sum(residuals(m_q, type = "pearson")^2) / m_q$df.residual, 2)
#> [1] 13.17
```

A dispersion of 13 is severe overdispersion, far worse than the warpbreaks case. This Poisson model's standard errors are hopelessly optimistic. Refit as a negative binomial and let the AIC, a fit score where lower is better, confirm the upgrade.

```r title="Compare Poisson and negative binomial"
m_q_nb <- glm.nb(Days ~ Eth + Sex + Age + Lrn, data = quine)

c(poisson_AIC = round(AIC(m_q), 0), negbin_AIC = round(AIC(m_q_nb), 0))
#> poisson_AIC  negbin_AIC 
#>        2299        1109 
```

The AIC drops from 2299 to 1109, an enormous improvement. The negative binomial is unambiguously the right model here. Now check its shape with quantile residuals, using `pnbinom` as the fitted CDF and the estimated `theta` as the size parameter.

```r title="Quantile residuals for the final model"
set.seed(303)
mu_hat <- fitted(m_q_nb)
th     <- m_q_nb$theta
u_q    <- runif(nrow(quine),
                pnbinom(quine$Days - 1, size = th, mu = mu_hat),
                pnbinom(quine$Days,     size = th, mu = mu_hat))

qqnorm(qnorm(u_q), main = "Negative binomial quantile residuals")
qqline(qnorm(u_q))
```

The points track the reference line, so the negative binomial captures the spread that Poisson missed. Finish by checking whether any single school is steering the fit.

```r title="Rank the most influential schools"
round(sort(cooks.distance(m_q_nb), decreasing = TRUE)[1:3], 4)
#>     72    104    126 
#> 0.1662 0.0962 0.0863 
```

Row 72 stands out a little but nothing is extreme, so we keep the full data. That is the whole workflow: we caught the overdispersion, fixed it with a negative binomial, confirmed the shape with quantile residuals, and cleared the influence check. A one-line summary of the model is now safe to report.

[TIP]
**Always run the checks in the same order: shape, spread, points.** Fix distributional and dispersion problems first, because a misspecified model makes every residual and every influence measure untrustworthy. Only hunt for influential rows once the model family and dispersion are settled.

## Practice Exercises

These combine several ideas from the tutorial. Each starter block runs as-is so you can iterate; the solutions include the output to check against. Use the distinct variable names shown so your exercise code does not overwrite the models above.

### Exercise 1: Decide whether a Poisson model is adequate

Not every count is overdispersed. Using `mtcars`, fit a Poisson model for `carb` (the number of carburetors) on `hp` and `wt`, then compute the dispersion statistic and decide whether Poisson is a reasonable choice.

```r title="Your turn: dispersion of a carb model"
# Fit glm(carb ~ hp + wt, family = poisson, data = mtcars), then
# compute dispersion = sum(pearson residuals^2) / residual df.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Carburetor dispersion solution"
cap_m    <- glm(carb ~ hp + wt, family = poisson, data = mtcars)
cap_disp <- sum(residuals(cap_m, type = "pearson")^2) / cap_m$df.residual
round(cap_disp, 3)
#> [1] 0.46
```

**Explanation:** The dispersion is 0.46, which is below 1. This is underdispersion, the opposite problem: the counts vary less than Poisson expects. Underdispersion makes Poisson standard errors slightly conservative (too wide), which is far less dangerous than overdispersion. For a quick analysis, plain Poisson is perfectly acceptable here. The lesson: always check dispersion, but the direction and severity decide whether you must act.

</details>

### Exercise 2: Use quantile residuals to expose a bad model

Earlier, quantile residuals confirmed a good model. Now use them to catch a bad one. Build randomized quantile residuals for the overdispersed `warpbreaks` Poisson model `m_wb`, then compute the fraction that fall outside the plus-or-minus 1.96 band. For a correct model this is about 0.05; a much larger fraction is a smoking gun.

```r title="Your turn: quantile residuals for warpbreaks"
# Use ppois with fitted(m_wb) to build u, then qnorm(u).
# Set a seed first, then report mean(abs(cap_q) > 1.96).

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Warpbreaks quantile residual solution"
set.seed(404)
mu_wb <- fitted(m_wb)
u_wb  <- runif(nrow(warpbreaks),
               ppois(warpbreaks$breaks - 1, mu_wb),
               ppois(warpbreaks$breaks,     mu_wb))
cap_q <- qnorm(u_wb)
round(mean(abs(cap_q) > 1.96), 3)
#> [1] 0.37
```

**Explanation:** A full 37% of the residuals fall outside the band, seven times the 5% a correct model would produce. Because the Poisson model badly understates the true spread, the fitted CDF is too narrow, pushing the probability values toward 0 and 1 and the quantile residuals into extreme tails. This is exactly the overdispersion the dispersion statistic flagged, now visible in the residuals themselves.

</details>

### Exercise 3: Measure how much one point moves the fit

Cook's distance told you which point is most influential in the `quine` negative binomial model, but not how much it matters. Find the single row with the largest Cook's distance, refit the model without it, and compare the coefficients with and without that row.

```r title="Your turn: drop the most influential row"
# which.max(cooks.distance(m_q_nb)) gives the row index.
# Refit glm.nb on quine[-worst, ] and rbind the two coefficient vectors.

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Influence refit solution"
worst   <- which.max(cooks.distance(m_q_nb))
m_q_nb2 <- glm.nb(Days ~ Eth + Sex + Age + Lrn, data = quine[-worst, ])
round(rbind(with = coef(m_q_nb), without = coef(m_q_nb2)), 3)
#>         (Intercept)   EthN  SexM  AgeF1 AgeF2 AgeF3 LrnSL
#> with          2.895 -0.569 0.082 -0.448 0.088 0.357 0.292
#> without       2.834 -0.612 0.005 -0.266 0.296 0.488 0.162
```

**Explanation:** Dropping one child leaves the big effects stable (ethnicity stays near -0.6) but noticeably moves the smaller age and sex terms, for example `SexM` from 0.082 down to 0.005. Because no coefficient flips sign or changes conclusion, the model is robust to this single point and you would keep the full data. Refitting without an influential point, and checking whether your story survives, is the honest way to use Cook's distance.

</details>

## Summary

GLM diagnostics rest on one idea: because a GLM's spread changes with its mean and the response is often discrete, the residual tools from linear regression mislead you, so you need residuals and checks built for non-Gaussian data.

| Question | Tool | Rule of thumb |
|---|---|---|
| Which residual to eyeball? | Pearson or deviance, never raw | Stable spread across fitted values |
| Is a count model overdispersed? | Dispersion statistic (Pearson sum / df) | Near 1 is fine; well above 1 needs a fix |
| How to fix overdispersion? | Quasi-Poisson or negative binomial | Negative binomial gives a full model |
| One residual for any family? | Randomized quantile residual | Straight Normal quantile plot means good fit |
| A logistic model with 0/1 stripes? | Binned residuals | Bin averages should hover near zero |
| Is one row steering the fit? | Cook's distance and leverage | Inspect points above 4/n or 2p/n, do not auto-delete |

Run the checks in a fixed order: shape (quantile residuals), then spread (dispersion), then individual points (Cook's distance). Fix distribution and dispersion problems before you trust any residual or influence measure, because a misspecified model corrupts all of them.

## Frequently Asked Questions

### Are GLM assumptions the same as linear regression assumptions?

No. A GLM does not assume Normal errors or constant variance, so the Normal quantile plot and the "residuals vs fitted" scatter you use for `lm()` do not transfer directly. Instead you check the mean-variance relationship through the dispersion statistic and judge the distribution with randomized quantile residuals.

### How high does dispersion have to be before I worry?

For a Poisson model the dispersion statistic should sit near 1. A value a little above 1 is usually harmless, but anything from roughly 1.5 upward is worth addressing, and a value of 2 or more almost always calls for a quasi-Poisson or negative binomial refit. Confirm the fix by comparing the standard errors before and after.

### Should I plot deviance or Pearson residuals?

Use deviance residuals, the `residuals()` default, for general plots, and use Pearson residuals to compute the dispersion statistic. For any serious distribution check, reach for randomized quantile residuals instead, because they are the only residuals that look Normal for every family.

### Can I just call plot() on a glm object?

Yes, and it draws standardized deviance residuals with a Normal quantile plot. It is a fine first look, but it inherits the discreteness stripes we saw at the start, so do not over-read patterns in it. A quantile-residual plot gives a much clearer verdict.

### Does logistic regression suffer from overdispersion?

Ungrouped 0/1 data cannot be overdispersed, so a dispersion statistic from a Bernoulli logistic model is not meaningful. Grouped binomial data (successes out of trials) can be overdispersed, and there you check dispersion exactly as you do for counts.

## References

1. R Core Team. *glm and residuals.glm reference* (stats package). [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.summaries.html)
2. Venables, W. N. & Ripley, B. D. *Modern Applied Statistics with S* (MASS), 4th Edition. Springer (2002). Source of `glm.nb()`. [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
3. Dunn, P. K. & Smyth, G. K. Randomized Quantile Residuals. *Journal of Computational and Graphical Statistics*, 5(3), 236-244 (1996). [Link](https://www.tandfonline.com/doi/abs/10.1080/10618600.1996.10474708)
4. Hartig, F. *DHARMa: Residual Diagnostics for Hierarchical Regression Models* (package vignette). [Link](https://cran.r-project.org/web/packages/DHARMa/vignettes/DHARMa.html)
5. Dunn, P. K. & Smyth, G. K. *Generalized Linear Models With Examples in R*. Springer (2018). [Link](https://link.springer.com/book/10.1007/978-1-4419-0118-7)
6. Faraway, J. J. *Extending the Linear Model with R*, 2nd Edition. CRC Press (2016). [Link](https://julianfaraway.github.io/faraway/ELM/)
7. Fox, J. & Weisberg, S. *An R Companion to Applied Regression*, 3rd Edition (car package). SAGE (2019). [Link](https://socialsciences.mcmaster.ca/jfox/Books/Companion/)

## Continue Learning

- [How to Read Logistic Regression Output in R](Read-Logistic-Output-in-R.html) - Interpret coefficients, odds ratios, and fit statistics line by line before you diagnose the model.
- [Offsets and Exposure in Poisson Models in R](Offsets-and-Exposure-in-R.html) - Model rates instead of counts, a common cause of apparent overdispersion.
- [Zero-Inflated and Hurdle Models in R](Zero-Inflated-Hurdle-Models-in-R.html) - When too many zeros break a count model, and how to model the extra zeros directly.
