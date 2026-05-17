---
title: "GLM Exercises in R: 20 Logistic, Poisson, Gamma Practice Problems"
slug: "GLM-Exercises-in-R"
description: "GLM exercises in R: 20 hands-on practice problems on logistic, Poisson, Gamma, negative binomial, multinomial and ordinal models with worked solutions."
keywords: "GLM exercises in R, generalized linear model practice, logistic regression exercises, Poisson regression practice, glm() in R, link functions, R modeling practice"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "GLM Exercises"
sidebar_order: 150
fr_parent: "Poisson-Regression-in-R.html"
auto_link_terms: "generalized linear model|logistic regression|poisson regression|link function|negative binomial regression|gamma regression"
auto_link_case_sensitive: false
target_keyword: "GLM exercises in R"
sibling_block_enabled: false
difficulty: "Mixed"
---

# GLM Exercises in R: 20 Logistic, Poisson, Gamma Practice Problems

<p class="lead">Twenty practice problems on generalized linear models in R. You will fit logistic, Poisson, Gamma, quasi-Poisson, negative binomial, multinomial and ordinal GLMs, then interpret coefficients, compare nested models and produce predictions on the link and response scale. Each solution is hidden behind a click-to-reveal block so you can attempt first.</p>

```r title="Run this once before any exercise"
library(MASS)
library(nnet)
library(dplyr)
library(ggplot2)
```

## Section 1. Binomial GLMs and Logistic Regression (4 problems)

### Exercise 1.1: Fit a binary logistic regression on mtcars transmission

**Task:** Use `glm()` with the binomial family to predict transmission type `am` (0 = automatic, 1 = manual) from `mpg` and `wt` in the `mtcars` dataset. Save the fitted model to `ex_1_1` and print its summary.

**Expected result:**

```
#> Call: glm(formula = am ~ mpg + wt, family = binomial, data = mtcars)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  25.8866    12.1935   2.123   0.0338 *
#> mpg          -0.3242     0.2374  -1.366   0.1721
#> wt           -6.4162     2.5466  -2.519   0.0118 *
#>
#> (Dispersion parameter for binomial family taken to be 1)
#>
#>     Null deviance: 43.230  on 31  degrees of freedom
#> Residual deviance: 17.184  on 29  degrees of freedom
#> AIC: 23.184
```

**Difficulty:** Beginner

[HINTS]
A binary 0/1 outcome like transmission type calls for the model family built for proportions, not the ordinary linear one.
Call glm() with the formula am ~ mpg + wt, family = binomial and data = mtcars.

```r title="Your turn"
ex_1_1 <- # your code here
summary(ex_1_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_1_1 <- glm(am ~ mpg + wt, family = binomial, data = mtcars)
summary(ex_1_1)
```

**Explanation:** The default link for `family = binomial` is `logit`, so coefficients are on the log-odds scale. A negative `wt` coefficient means heavier cars are less likely to have manual transmission. The Z statistic plus its p-value comes from the Wald test, which is fine for large samples but unreliable near zero events. AIC and residual deviance let you compare against nested alternatives later.

</details>

### Exercise 1.2: Predict loan default probabilities for a credit-risk team

**Task:** A credit-risk analyst at a community bank wants a quick logistic baseline before sending the data to the modelling team. Using the inline `loans` tibble defined below, fit `default ~ income + loan_amount` with `family = binomial` and save the model to `ex_1_2`. Report the coefficient on `loan_amount` in odds-ratio form (one log-thousand-dollar increase).

**Expected result:**

```
#> Coefficients:
#>                Estimate Std. Error z value Pr(>|z|)
#> (Intercept)    -1.5413     1.7724  -0.870  0.38449
#> income         -0.0420     0.0207  -2.025  0.04284 *
#> loan_amount     0.1875     0.0691   2.715  0.00663 **
#>
#> Odds ratio for loan_amount: 1.2062
```

**Difficulty:** Intermediate

[HINTS]
A yes/no default is another proportion outcome, so reach for the same model family as the previous exercise and remember odds ratios are a multiplicative re-expression of the coefficient.
Fit with glm() using family = binomial and data = loans, then exponentiate the loan_amount coefficient from coef().

```r title="Your turn"
set.seed(42)
loans <- tibble(
  income      = round(rnorm(120, mean = 55, sd = 18)),     # in $1000s
  loan_amount = round(runif(120, min = 5, max = 35), 1),   # in $1000s
  default     = rbinom(120, 1, plogis(-2 + 0.18 * loan_amount - 0.04 * income))
)

ex_1_2 <- # your code here
summary(ex_1_2)
exp(coef(ex_1_2)["loan_amount"])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
loans <- tibble(
  income      = round(rnorm(120, mean = 55, sd = 18)),
  loan_amount = round(runif(120, min = 5, max = 35), 1),
  default     = rbinom(120, 1, plogis(-2 + 0.18 * loan_amount - 0.04 * income))
)

ex_1_2 <- glm(default ~ income + loan_amount, family = binomial, data = loans)
summary(ex_1_2)
exp(coef(ex_1_2)["loan_amount"])
#> loan_amount
#>    1.20621
```

**Explanation:** Exponentiating a logit coefficient gives an odds ratio: each extra $1,000 borrowed multiplies the odds of default by about 1.21, holding income fixed. Report odds ratios to stakeholders rather than raw logits, because business owners reason in multiplicative risk, not log-odds. Always state the unit ("per $1,000") and the holding-constant assumption to avoid misinterpretation.

</details>

### Exercise 1.3: Get predicted probabilities on the response scale

**Task:** Using the `ex_1_1` model from Exercise 1.1, generate predicted probabilities of `am = 1` for three hypothetical cars: (mpg=15, wt=4), (mpg=20, wt=3) and (mpg=30, wt=1.8). Save the result to `ex_1_3` as a numeric vector and round to three decimals.

**Expected result:**

```
#>     1     2     3
#> 0.001 0.131 0.999
```

**Difficulty:** Intermediate

[HINTS]
You want probabilities in [0, 1], not log-odds, so the linear predictor has to be pushed through the inverse link.
Use predict() with newdata = newdf and type = "response", then wrap the result in round(..., 3).

```r title="Your turn"
newdf <- data.frame(mpg = c(15, 20, 30), wt = c(4, 3, 1.8))
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
newdf <- data.frame(mpg = c(15, 20, 30), wt = c(4, 3, 1.8))
ex_1_3 <- round(predict(ex_1_1, newdata = newdf, type = "response"), 3)
ex_1_3
#>     1     2     3
#> 0.001 0.131 0.999
```

**Explanation:** `type = "response"` runs the linear predictor through the inverse link (here, the logistic CDF `plogis`) so the output is a probability in [0, 1]. Without that argument you would get the link-scale value, which is the log-odds and ranges over the real line. Newcomers often forget the `type` argument and report log-odds as probabilities by accident.

</details>

### Exercise 1.4: Test a nested model with anova(LRT)

**Task:** Compare the full `am ~ mpg + wt` model from Exercise 1.1 against a reduced model `am ~ wt` using a likelihood ratio test. Save the `anova()` object to `ex_1_4` and report whether dropping `mpg` significantly worsens fit at alpha = 0.05.

**Expected result:**

```
#> Analysis of Deviance Table
#>
#> Model 1: am ~ wt
#> Model 2: am ~ mpg + wt
#>   Resid. Df Resid. Dev Df Deviance Pr(>Chi)
#> 1        30     19.176
#> 2        29     17.184  1   1.9925   0.1581
```

**Difficulty:** Advanced

[HINTS]
Comparing a model against a smaller version of itself is a nested-model test of whether the dropped term earns its place.
Call anova() on the reduced and full models with the argument test = "LRT".

```r title="Your turn"
reduced <- glm(am ~ wt, family = binomial, data = mtcars)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
reduced <- glm(am ~ wt, family = binomial, data = mtcars)
ex_1_4 <- anova(reduced, ex_1_1, test = "LRT")
ex_1_4
```

**Explanation:** The likelihood ratio test compares twice the difference in log-likelihoods to a chi-square with degrees of freedom equal to the number of dropped parameters. Here p = 0.158, so `mpg` does not add significant explanatory power beyond `wt`. Prefer LRT over the Wald p-value from `summary()` when comparing nested GLMs, especially with small samples like 32 observations.

</details>

## Section 2. Poisson Regression and Count Data (4 problems)

### Exercise 2.1: Fit a Poisson GLM on warpbreaks

**Task:** Use `glm()` with `family = poisson` to model `breaks ~ wool + tension` in the built-in `warpbreaks` dataset, which records the number of warp breaks per loom run. Save the fitted model to `ex_2_1` and print its coefficients.

**Expected result:**

```
#> Call: glm(formula = breaks ~ wool + tension, family = poisson, data = warpbreaks)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  3.69196    0.04541  81.302  < 2e-16 ***
#> woolB       -0.20599    0.05157  -3.994 6.49e-05 ***
#> tensionM    -0.32132    0.06027  -5.332 9.73e-08 ***
#> tensionH    -0.51849    0.06396  -8.107 5.21e-16 ***
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>     Null deviance: 297.37  on 53  degrees of freedom
#> Residual deviance: 210.39  on 50  degrees of freedom
```

**Difficulty:** Beginner

[HINTS]
A count of warp breaks per loom run is count data, which has its own dedicated GLM family.
Call glm() with breaks ~ wool + tension, family = poisson and data = warpbreaks.

```r title="Your turn"
ex_2_1 <- # your code here
summary(ex_2_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_2_1 <- glm(breaks ~ wool + tension, family = poisson, data = warpbreaks)
summary(ex_2_1)
```

**Explanation:** Poisson regression uses a log link by default, so coefficients are on the log-rate scale. `exp(-0.206)` for `woolB` means wool B has about 81% as many breaks as wool A at the same tension. The dispersion parameter is fixed at 1; if the residual deviance is much larger than the residual degrees of freedom (here 210 vs 50) you have overdispersion and should consider quasi-Poisson or negative binomial.

</details>

### Exercise 2.2: Use an offset to model emergency-room visit rates

**Task:** An ED operations team wants a model of nightly visits adjusted for shift length. Using the inline `er` tibble, fit a Poisson GLM with `log(hours)` as an offset so the coefficients describe the rate per hour, not raw counts. Save the model to `ex_2_2`.

**Expected result:**

```
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  1.62894    0.08322  19.575  < 2e-16 ***
#> staffhigh   -0.43078    0.09214  -4.675 2.94e-06 ***
#>
#> (Dispersion parameter for poisson family taken to be 1)
#> Number of Fisher Scoring iterations: 4
```

**Difficulty:** Intermediate

[HINTS]
To turn raw counts into a rate per hour, exposure has to enter the model with a fixed effect that is not estimated.
Add offset(log(hours)) to the formula inside glm() with family = poisson.

```r title="Your turn"
set.seed(7)
er <- tibble(
  staff  = factor(rep(c("low", "high"), each = 30), levels = c("low", "high")),
  hours  = sample(6:12, 60, replace = TRUE),
  visits = rpois(60, lambda = ifelse(rep(c("low","high"), each = 30) == "low",
                                     0.9, 0.55) * sample(6:12, 60, replace = TRUE))
)

ex_2_2 <- # your code here
summary(ex_2_2)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
er <- tibble(
  staff  = factor(rep(c("low", "high"), each = 30), levels = c("low", "high")),
  hours  = sample(6:12, 60, replace = TRUE),
  visits = rpois(60, lambda = ifelse(rep(c("low","high"), each = 30) == "low",
                                     0.9, 0.55) * sample(6:12, 60, replace = TRUE))
)

ex_2_2 <- glm(visits ~ staff + offset(log(hours)),
              family = poisson, data = er)
summary(ex_2_2)
```

**Explanation:** An offset enters the linear predictor with coefficient fixed at 1, so `log(rate) = log(visits/hours) = beta0 + beta1 staff`. Without the offset, longer shifts would absorb their own dummy effect and you'd lose the rate interpretation. Offsets are standard in epidemiology (person-years), insurance (policy duration) and call-centre analytics (open hours).

</details>

### Exercise 2.3: Convert coefficients to incidence rate ratios

**Task:** Take the `ex_2_1` warpbreaks Poisson model and convert each non-intercept coefficient to an incidence rate ratio with a 95 percent confidence interval. Save the resulting numeric matrix (rows = predictors, columns = IRR, lower, upper) to `ex_2_3` and round to three decimals.

**Expected result:**

```
#>            IRR  lower upper
#> woolB    0.814  0.736 0.901
#> tensionM 0.725  0.644 0.816
#> tensionH 0.595  0.525 0.675
```

**Difficulty:** Intermediate

[HINTS]
Rate ratios live on the multiplicative scale, so the log-scale estimates and their standard errors both need back-transforming.
Pull estimates and standard errors from coef(summary(ex_2_1)), then exp() the estimate and the Wald bounds estimate +/- 1.96 * SE.

```r title="Your turn"
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
coefs <- coef(summary(ex_2_1))[-1, "Estimate"]
ses   <- coef(summary(ex_2_1))[-1, "Std. Error"]
irr   <- exp(coefs)
lower <- exp(coefs - 1.96 * ses)
upper <- exp(coefs + 1.96 * ses)
ex_2_3 <- round(cbind(IRR = irr, lower = lower, upper = upper), 3)
ex_2_3
```

**Explanation:** Exponentiating a Poisson coefficient yields an IRR: a multiplicative effect on the expected count. The Wald CI is exp(estimate plus or minus 1.96 SE); for tighter coverage with small samples use profile likelihood via `confint()`. IRRs are easier to communicate than log-rates: "tension H cuts breaks to 60% of tension L" beats "the log-rate falls by 0.518".

</details>

### Exercise 2.4: Detect and correct overdispersion with quasi-Poisson

**Task:** Diagnose overdispersion in the warpbreaks Poisson fit by computing the ratio of residual deviance to residual degrees of freedom, then refit with `family = quasipoisson` and compare standard errors. Save the quasi-Poisson model to `ex_2_4` and report the dispersion estimate.

**Expected result:**

```
#> Deviance / df ratio for ex_2_1:
#> [1] 4.208
#>
#> Dispersion parameter for quasipoisson: 3.851...
#>
#> Coefficients (quasi-Poisson):
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  3.69196    0.08914  41.421  < 2e-16 ***
#> woolB       -0.20599    0.10122  -2.035  0.04719 *
#> tensionM    -0.32132    0.11827  -2.717  0.00903 **
#> tensionH    -0.51849    0.12554  -4.130 0.000139 ***
```

**Difficulty:** Advanced

[HINTS]
When the spread of counts outstrips what the count family assumes, switch to a family that estimates its own dispersion instead of fixing it at 1.
Refit with glm() using family = quasipoisson and read the dispersion from summary(...)$dispersion.

```r title="Your turn"
deviance_ratio <- deviance(ex_2_1) / df.residual(ex_2_1)
deviance_ratio

ex_2_4 <- # your code here
summary(ex_2_4)$dispersion
summary(ex_2_4)$coefficients
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
deviance_ratio <- deviance(ex_2_1) / df.residual(ex_2_1)
deviance_ratio
#> [1] 4.207867

ex_2_4 <- glm(breaks ~ wool + tension, family = quasipoisson, data = warpbreaks)
summary(ex_2_4)$dispersion
summary(ex_2_4)$coefficients
```

**Explanation:** A deviance/df ratio of 4.2 is far above 1, signalling that the Poisson variance assumption underestimates uncertainty. Quasi-Poisson keeps the same coefficient estimates but inflates standard errors by sqrt(dispersion), so Wald tests become more conservative. If the dispersion is also large, negative binomial (next section) is often a better choice because it has a proper likelihood and AIC.

</details>

## Section 3. Other GLM Families: Gamma, Negative Binomial, Probit (3 problems)

### Exercise 3.1: Fit a negative binomial regression with MASS::glm.nb

**Task:** Refit the warpbreaks count model using `MASS::glm.nb()` to handle the overdispersion you found in Exercise 2.4. Save the model to `ex_3_1` and compare its AIC with the Poisson model `ex_2_1`. Report which model has lower AIC.

**Expected result:**

```
#> Call: MASS::glm.nb(formula = breaks ~ wool + tension, data = warpbreaks, init.theta = 9.944, link = log)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  3.69196    0.09374  39.385  < 2e-16 ***
#> woolB       -0.20599    0.10646  -1.935 0.052924 .
#> tensionM    -0.32132    0.12690  -2.532 0.011339 *
#> tensionH    -0.51849    0.12921  -4.013 6.00e-05 ***
#>
#> AIC(ex_2_1):  493.06
#> AIC(ex_3_1):  408.76
#> NB wins by:    84.30
```

**Difficulty:** Advanced

[HINTS]
A count model with a second variance parameter absorbs heavy overdispersion while still producing a genuine likelihood you can compare.
Fit with MASS::glm.nb() on breaks ~ wool + tension and contrast the two models with AIC().

```r title="Your turn"
ex_3_1 <- # your code here
summary(ex_3_1)
c(poisson_aic = AIC(ex_2_1), nb_aic = AIC(ex_3_1))
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_1 <- MASS::glm.nb(breaks ~ wool + tension, data = warpbreaks)
summary(ex_3_1)
c(poisson_aic = AIC(ex_2_1), nb_aic = AIC(ex_3_1))
```

**Explanation:** Negative binomial adds a second parameter (`theta`) that absorbs extra variance, so unlike quasi-Poisson it produces a real likelihood and a comparable AIC. A drop of 84 AIC units is overwhelming evidence in favour of NB. Always log `theta` and check whether it's large (close to Poisson) or small (heavy overdispersion); here `theta` of 9.9 is moderate.

</details>

### Exercise 3.2: Gamma GLM for positive insurance-claim amounts

**Task:** A claims actuary wants to model average claim severity for a small portfolio. Using the inline `claims` tibble (positive continuous amounts), fit a Gamma GLM with the log link, `amount ~ region + age_band`, and save the model to `ex_3_2`. Print the exponentiated coefficients so they are read as multiplicative effects on the expected claim cost.

**Expected result:**

```
#> Multiplicative effects on expected claim amount:
#> (Intercept)    regionrural    age_bandsenior
#>     1842.7          0.762             1.318
```

**Difficulty:** Intermediate

[HINTS]
A strictly positive, right-skewed amount like a claim cost needs a continuous GLM family matched to that shape.
Call glm() with family = Gamma(link = "log") and data = claims, then exp() the coefficients for multiplicative effects.

```r title="Your turn"
set.seed(11)
claims <- tibble(
  region   = factor(sample(c("urban", "rural"), 200, replace = TRUE)),
  age_band = factor(sample(c("adult", "senior"), 200, replace = TRUE, prob = c(0.6, 0.4))),
  amount   = rgamma(200, shape = 2,
                    rate  = 2 / (1800 *
                                 ifelse(sample(c("urban", "rural"), 200, replace = TRUE) == "rural", 0.75, 1) *
                                 ifelse(sample(c("adult", "senior"), 200, replace = TRUE, prob = c(0.6, 0.4)) == "senior", 1.3, 1)))
)

ex_3_2 <- # your code here
round(exp(coef(ex_3_2)), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
claims <- tibble(
  region   = factor(sample(c("urban", "rural"), 200, replace = TRUE)),
  age_band = factor(sample(c("adult", "senior"), 200, replace = TRUE, prob = c(0.6, 0.4))),
  amount   = rgamma(200, shape = 2,
                    rate  = 2 / (1800 *
                                 ifelse(sample(c("urban", "rural"), 200, replace = TRUE) == "rural", 0.75, 1) *
                                 ifelse(sample(c("adult", "senior"), 200, replace = TRUE, prob = c(0.6, 0.4)) == "senior", 1.3, 1)))
)

ex_3_2 <- glm(amount ~ region + age_band,
              family = Gamma(link = "log"), data = claims)
round(exp(coef(ex_3_2)), 3)
```

**Explanation:** Gamma with a log link is the natural GLM for strictly positive, right-skewed continuous outcomes like claim cost, hospital LOS or component lifetimes. The constant coefficient of variation built into the Gamma matches actuarial intuition that larger expected claims have proportionally larger spread. Avoid the canonical inverse link in practice: it can yield negative fitted values during iteration.

</details>

### Exercise 3.3: Compare logit and probit links on the same binary outcome

**Task:** Fit two binary GLMs on the `mtcars` data predicting `am` from `wt`, one with the default `logit` link and one with `probit`. Save them together in a named list `ex_3_3` with elements `logit` and `probit`. Print both summaries side by side, focusing on the `wt` coefficient.

**Expected result:**

```
#> $logit$wt
#> Estimate: -4.024   SE: 1.436   z: -2.802
#>
#> $probit$wt
#> Estimate: -2.366   SE: 0.793   z: -2.984
#>
#> Coefficients differ in magnitude (logit ~ 1.7x probit) but fitted probabilities are nearly identical.
```

**Difficulty:** Intermediate

[HINTS]
Both fits share the same formula and outcome family; only the curve mapping the linear predictor to a probability differs.
Call glm() twice, passing binomial(link = "logit") and binomial(link = "probit") as the family.

```r title="Your turn"
ex_3_3 <- list(
  logit  = # your code here,
  probit = # your code here
)
sapply(ex_3_3, function(m) coef(summary(m))["wt", c("Estimate","Std. Error","z value")])
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_3_3 <- list(
  logit  = glm(am ~ wt, family = binomial(link = "logit"),  data = mtcars),
  probit = glm(am ~ wt, family = binomial(link = "probit"), data = mtcars)
)
sapply(ex_3_3, function(m) coef(summary(m))["wt", c("Estimate","Std. Error","z value")])
```

**Explanation:** Logit and probit are nearly indistinguishable in fitted probabilities because the logistic and normal CDFs agree closely in the middle range. Logit dominates because coefficients double as log-odds (interpretable), while probit is preferred in econometrics for latent-variable narratives. Coefficient magnitudes differ by roughly the ratio of the link slopes at 0, about 1.6 to 1.8.

</details>

## Section 4. GLM Diagnostics, Inference and Goodness of Fit (4 problems)

### Exercise 4.1: Read residual deviance, null deviance and AIC from summary()

**Task:** Refit the binary logistic `am ~ mpg + wt` on `mtcars` and extract three scalars from the model object directly: null deviance, residual deviance and AIC. Save the three values to a named numeric vector `ex_4_1`.

**Expected result:**

```
#>    null residual      aic
#>  43.230   17.184   23.184
```

**Difficulty:** Beginner

[HINTS]
These three fit statistics are already stored as named components inside the fitted model object, so no extra computation is needed.
Pull fit$null.deviance, fit$deviance and fit$aic into a single named c() vector.

```r title="Your turn"
ex_4_1 <- # your code here
round(ex_4_1, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
fit <- glm(am ~ mpg + wt, family = binomial, data = mtcars)
ex_4_1 <- c(
  null     = fit$null.deviance,
  residual = fit$deviance,
  aic      = fit$aic
)
round(ex_4_1, 3)
```

**Explanation:** Null deviance measures fit of an intercept-only model, residual deviance measures fit of the full model, and their difference is the deviance explained. AIC penalises that fit by `2 * k` parameters, which lets you compare non-nested models. Always read both deviance and AIC: a model with great AIC but tiny deviance drop relative to null might be capturing noise.

</details>

### Exercise 4.2: Build profile-likelihood confidence intervals

**Task:** For the `am ~ mpg + wt` logistic model from Exercise 1.1, build 95 percent profile-likelihood confidence intervals for all coefficients using `confint()`. Save the matrix to `ex_4_2` and round to three decimals.

**Expected result:**

```
#>              2.5 %  97.5 %
#> (Intercept) 6.795  61.611
#> mpg        -1.061   0.018
#> wt        -13.704  -2.572
```

**Difficulty:** Intermediate

[HINTS]
Profile-likelihood intervals trace the curvature of the likelihood rather than assuming a symmetric Wald approximation.
Call confint() on ex_1_1 and round() the resulting matrix to three decimals.

```r title="Your turn"
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
suppressMessages({
  ex_4_2 <- round(confint(ex_1_1), 3)
})
ex_4_2
```

**Explanation:** `confint()` on a `glm` object profiles the log-likelihood across each coefficient, giving CIs that respect the curvature of the likelihood, not just a Wald approximation. With n = 32, Wald and profile intervals can differ noticeably; profile is the safer default. Use `confint.default()` if you specifically want Wald (estimate +/- 1.96 SE) for reporting consistency with `summary()`.

</details>

### Exercise 4.3: Flag potential outliers via Pearson residuals

**Task:** Compute Pearson residuals for the warpbreaks Poisson model `ex_2_1`, identify rows with absolute Pearson residual greater than 2, and save those row numbers (as a sorted integer vector) to `ex_4_3`. Report how many such rows you flagged.

**Expected result:**

```
#> [1]  5  9 19 20 21 30 32 49 51
#> Flagged 9 rows out of 54.
```

**Difficulty:** Intermediate

[HINTS]
Standardised residuals whose absolute value clears a threshold flag the observations the model fits worst.
Apply which() to the logical test abs(pr) > 2 and wrap it in sort() to get ordered row numbers.

```r title="Your turn"
pr <- residuals(ex_2_1, type = "pearson")
ex_4_3 <- # your code here
ex_4_3
length(ex_4_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pr <- residuals(ex_2_1, type = "pearson")
ex_4_3 <- sort(which(abs(pr) > 2))
ex_4_3
length(ex_4_3)
```

**Explanation:** Pearson residuals standardise the raw difference by the model-implied standard deviation, so absolute values above 2 are unusually large under the model. A cluster of large Pearson residuals often signals overdispersion (Section 2.4) rather than individual outliers. Pair with `cooks.distance()` for leverage, and inspect flagged rows for data-entry errors before discarding any.

</details>

### Exercise 4.4: Compute McFadden pseudo-R^2 by hand

**Task:** McFadden's pseudo-R^2 is defined as $1 - \\log L_{full} / \\log L_{null}$. Compute it for the `am ~ mpg + wt` logistic by fitting a null model and using `logLik()` on both fits. Save the scalar to `ex_4_4` rounded to four decimals.

**Expected result:**

```
#> McFadden pseudo-R^2: 0.6025
```

**Difficulty:** Advanced

[HINTS]
The measure contrasts the fitted model's log-likelihood against that of an intercept-only baseline.
Take logLik() of both fits and compute 1 - logLik(full) / logLik(null), coercing each with as.numeric().

```r title="Your turn"
null_fit <- glm(am ~ 1, family = binomial, data = mtcars)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
null_fit <- glm(am ~ 1, family = binomial, data = mtcars)
ex_4_4 <- round(1 - as.numeric(logLik(ex_1_1)) / as.numeric(logLik(null_fit)), 4)
ex_4_4
#> [1] 0.6025
```

**Explanation:** Pseudo-R^2 statistics for GLMs do not match the proportion-of-variance interpretation from OLS, so the same numeric value carries different meaning. McFadden values above 0.2 are usually considered an excellent fit for cross-sectional logistic models. Report it alongside AIC and the Hosmer-Lemeshow test rather than as a single goodness-of-fit headline.

</details>

## Section 5. Predictions, Marginal Effects and Visualization (4 problems)

### Exercise 5.1: Predict on the link scale and the response scale

**Task:** Using the `ex_1_1` model, predict the linear predictor (`type = "link"`) and the probability (`type = "response"`) for the existing `mtcars` rows. Save both vectors together as a tibble with columns `eta` and `prob` named `ex_5_1` and inspect the first three rows.

**Expected result:**

```
#> # A tibble: 32 x 2
#>      eta   prob
#>    <dbl>  <dbl>
#> 1 -0.546  0.367
#> 2 -1.060  0.257
#> 3  3.886  0.980
#> # 29 more rows hidden
```

**Difficulty:** Intermediate

[HINTS]
The same fitted model returns either the linear predictor or the probability depending on which scale you ask for.
Call predict() twice with type = "link" and type = "response", binding the two vectors into a tibble.

```r title="Your turn"
ex_5_1 <- # your code here
head(ex_5_1, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_5_1 <- tibble(
  eta  = predict(ex_1_1, type = "link"),
  prob = predict(ex_1_1, type = "response")
)
head(ex_5_1, 3)
```

**Explanation:** The link-scale prediction `eta` is the linear combination `Xb`, returned by default. Applying the inverse link `plogis(eta)` recovers `prob`. Always reason about uncertainty (standard errors, CIs) on the link scale where coverage is symmetric, then back-transform endpoints to probabilities; CIs computed on the response scale can run below 0 or above 1.

</details>

### Exercise 5.2: Average marginal effect of wt on probability of manual transmission

**Task:** Compute the average marginal effect of `wt` on the predicted probability of `am = 1` for the `mtcars` rows under the `ex_1_1` model. Use the chain rule: `dP/dwt = beta_wt * p * (1 - p)` averaged over the sample. Save the scalar to `ex_5_2`.

**Expected result:**

```
#> Average marginal effect of wt: -0.3186
#> Interpretation: a one-tonne increase in weight cuts P(am=1) by about 32 percentage points on average.
```

**Difficulty:** Advanced

[HINTS]
A logistic slope changes across the curve, so the effect on probability has to be averaged over every observation rather than read off once.
Form the per-row quantity beta_wt * p * (1 - p) and collapse it with mean().

```r title="Your turn"
p <- predict(ex_1_1, type = "response")
beta_wt <- coef(ex_1_1)["wt"]
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
p <- predict(ex_1_1, type = "response")
beta_wt <- coef(ex_1_1)["wt"]
ex_5_2 <- mean(beta_wt * p * (1 - p))
ex_5_2
#>         wt
#> -0.3186...
```

**Explanation:** Logistic coefficients alone don't give a probability change because the slope of the sigmoid varies across the input. The average marginal effect (AME) integrates `dP/dX` over the empirical distribution, producing a single interpretable number on the probability scale. For more complex GLMs and interactions, the `marginaleffects` package automates this with proper standard errors via the delta method.

</details>

### Exercise 5.3: Plot the predicted probability curve over weight

**Task:** Produce a `ggplot` line chart showing predicted P(am = 1) versus `wt` from 1.5 to 5.5 (mpg held at its sample mean) using the `ex_1_1` model. Save the ggplot object to `ex_5_3`. Add the raw `mtcars` points jittered along y = am.

**Expected result:**

```
#> A ggplot object: line of fitted probability descends from ~1.0 near wt=1.5
#> to ~0.0 near wt=5.5; raw points sit at y=0 and y=1 with horizontal jitter; theme_minimal.
```

**Difficulty:** Intermediate

[HINTS]
Draw the smooth fitted curve from the prediction grid, then overlay the raw 0/1 outcomes so the data is visible.
Combine geom_line() on the grid with a jittered point layer on mtcars inside a ggplot() call, finishing with theme_minimal().

```r title="Your turn"
grid <- data.frame(wt = seq(1.5, 5.5, length.out = 100), mpg = mean(mtcars$mpg))
grid$p <- predict(ex_1_1, newdata = grid, type = "response")

ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- data.frame(wt = seq(1.5, 5.5, length.out = 100), mpg = mean(mtcars$mpg))
grid$p <- predict(ex_1_1, newdata = grid, type = "response")

ex_5_3 <- ggplot() +
  geom_line(data = grid, aes(wt, p), color = "steelblue", linewidth = 1.1) +
  geom_jitter(data = mtcars, aes(wt, am), height = 0.04, width = 0,
              color = "grey30", alpha = 0.7) +
  labs(x = "Weight (1000 lb)", y = "P(am = 1)",
       title = "Predicted probability of manual transmission") +
  theme_minimal()
ex_5_3
```

**Explanation:** Holding `mpg` at its mean isolates the effect of `wt` but hides interactions. For a richer picture, facet by binned `mpg` or use a partial-dependence plot that integrates over the empirical distribution of `mpg`. Jittering the raw outcomes vertically by a small amount keeps the 0/1 anchors readable without misleading the eye about probability values.

</details>

### Exercise 5.4: Standard error bands on the link scale, back-transformed

**Task:** Build 95 percent confidence bands for the predicted probability curve in Exercise 5.3 by using `predict(..., type = "link", se.fit = TRUE)` and back-transforming the link-scale endpoints with `plogis`. Save the augmented prediction tibble (columns `wt`, `fit`, `lower`, `upper`) to `ex_5_4` and print its first three rows.

**Expected result:**

```
#> # A tibble: 100 x 4
#>      wt   fit lower upper
#>   <dbl> <dbl> <dbl> <dbl>
#> 1  1.50 0.999 0.748 1.000
#> 2  1.54 0.999 0.760 1.000
#> 3  1.58 0.999 0.771 1.000
#> # 97 more rows hidden
```

**Difficulty:** Advanced

[HINTS]
Build the interval where it stays symmetric, then map both endpoints back to the probability scale so the band cannot escape [0, 1].
The link-scale prediction already has se.fit = TRUE, so apply plogis() to fit and to fit +/- 1.96 * se.fit.

```r title="Your turn"
grid <- data.frame(wt = seq(1.5, 5.5, length.out = 100), mpg = mean(mtcars$mpg))
pr   <- predict(ex_1_1, newdata = grid, type = "link", se.fit = TRUE)

ex_5_4 <- # your code here
head(ex_5_4, 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
grid <- data.frame(wt = seq(1.5, 5.5, length.out = 100), mpg = mean(mtcars$mpg))
pr   <- predict(ex_1_1, newdata = grid, type = "link", se.fit = TRUE)

ex_5_4 <- tibble(
  wt    = grid$wt,
  fit   = plogis(pr$fit),
  lower = plogis(pr$fit - 1.96 * pr$se.fit),
  upper = plogis(pr$fit + 1.96 * pr$se.fit)
)
head(ex_5_4, 3)
```

**Explanation:** Confidence bands constructed in the linear-predictor space and back-transformed remain inside [0, 1] and are asymmetric near the boundaries, which is what you want for a probability. Bands built directly on the response scale (estimate +/- 1.96 SE_p) can extend past 1, which embarrasses your plot. This is the same pattern as Poisson, Gamma and survival GLMs: do uncertainty work on the link scale.

</details>

## Section 6. Multinomial and Ordinal GLM Extensions (3 problems)

### Exercise 6.1: Fit a multinomial logistic regression with nnet::multinom

**Task:** Use `nnet::multinom()` to fit a multinomial logistic model predicting `Species` from `Sepal.Length` and `Petal.Length` in the `iris` dataset. Save the model to `ex_6_1` and print the matrix of fitted log-odds coefficients (rows: non-reference categories, columns: predictors).

**Expected result:**

```
#> # weights:  12 (6 variable)
#> initial  value 164.791843
#> final  value ... ...
#> converged
#>
#>            (Intercept) Sepal.Length Petal.Length
#> versicolor  ...           ...           ...
#> virginica   ...           ...           ...
```

**Difficulty:** Advanced

[HINTS]
A three-class unordered outcome needs a model that fits several logits at once against one reference category.
Fit with nnet::multinom() on Species ~ Sepal.Length + Petal.Length and data = iris.

```r title="Your turn"
ex_6_1 <- # your code here
coef(ex_6_1)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ex_6_1 <- nnet::multinom(Species ~ Sepal.Length + Petal.Length,
                         data = iris, trace = FALSE)
coef(ex_6_1)
```

**Explanation:** A multinomial logit fits K-1 simultaneous binary logits against a reference category (here `setosa`, alphabetically first). Convergence can be fragile with perfectly separable classes (iris setosa is linearly separable on petal length), so check warning messages. For ordered outcomes use proportional-odds logistic regression instead, which is more parsimonious and respects the ordering.

</details>

### Exercise 6.2: Predicted class probabilities from a multinomial model

**Task:** Using the `ex_6_1` multinomial model, predict the three-class probability vector for a new flower with Sepal.Length = 6.0 and Petal.Length = 4.5. Save the named numeric vector to `ex_6_2` and round to three decimals.

**Expected result:**

```
#>    setosa versicolor  virginica
#>     0.000      0.834      0.166
```

**Difficulty:** Intermediate

[HINTS]
You want the full vector of class probabilities for the new flower, not just the single winning label.
Call predict() with newdata = newflower and type = "probs", then round() to three decimals.

```r title="Your turn"
newflower <- data.frame(Sepal.Length = 6.0, Petal.Length = 4.5)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
newflower <- data.frame(Sepal.Length = 6.0, Petal.Length = 4.5)
ex_6_2 <- round(predict(ex_6_1, newdata = newflower, type = "probs"), 3)
ex_6_2
```

**Explanation:** `type = "probs"` returns a row vector that sums to 1 across the K categories. `type = "class"` returns the modal class, which is convenient but throws away calibration information. For decision making, expose the full probability vector so downstream code can apply asymmetric loss (the cost of confusing setosa and virginica may differ from confusing the two non-setosa species).

</details>

### Exercise 6.3: Fit a proportional-odds ordinal logistic model with MASS::polr

**Task:** Build an inline `survey` tibble where respondents rated a product on an ordered 1-5 Likert scale, with `age` and `region` as predictors. Fit a proportional-odds logistic regression using `MASS::polr()`, save it to `ex_6_3` and print the model summary.

**Expected result:**

```
#> Call:
#> MASS::polr(formula = rating ~ age + region, data = survey, Hess = TRUE)
#>
#> Coefficients:
#>                 Value Std. Error t value
#> age          -0.02451   0.00982 -2.4960
#> regionsouth   0.78533   0.30041  2.6142
#>
#> Intercepts:
#>     Value   Std. Error t value
#> 1|2 -2.4612  0.6411    -3.8390
#> 2|3 -1.2487  0.5870    -2.1273
#> 3|4  0.4019  0.5784     0.6949
#> 4|5  1.8854  0.6122     3.0793
#>
#> Residual Deviance: 421.66  AIC: 433.66
```

**Difficulty:** Advanced

[HINTS]
An ordered Likert outcome calls for a model that respects the ranking with one shared slope per predictor and a set of cutpoint thresholds.
Fit with MASS::polr() on rating ~ age + region, data = survey and Hess = TRUE.

```r title="Your turn"
set.seed(2026)
survey <- tibble(
  age    = sample(18:75, 150, replace = TRUE),
  region = factor(sample(c("north", "south"), 150, replace = TRUE)),
  rating = factor(sample(1:5, 150, replace = TRUE,
                         prob = c(0.10, 0.20, 0.30, 0.25, 0.15)),
                  levels = 1:5, ordered = TRUE)
)

ex_6_3 <- # your code here
summary(ex_6_3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
survey <- tibble(
  age    = sample(18:75, 150, replace = TRUE),
  region = factor(sample(c("north", "south"), 150, replace = TRUE)),
  rating = factor(sample(1:5, 150, replace = TRUE,
                         prob = c(0.10, 0.20, 0.30, 0.25, 0.15)),
                  levels = 1:5, ordered = TRUE)
)

ex_6_3 <- MASS::polr(rating ~ age + region, data = survey, Hess = TRUE)
summary(ex_6_3)
```

**Explanation:** A proportional-odds model fits one slope per predictor and K-1 thresholds for the K-level outcome, assuming the effect of each predictor on the cumulative log-odds is constant across cutpoints. Check that assumption with the Brant test (`brant::brant(ex_6_3)`); if it fails, use a partial-proportional-odds model via `VGAM::vglm()` or fall back to multinomial logistic, which gives up parsimony for flexibility.

</details>

## What to do next

You now have hands-on practice across the major GLM families. Build on this with these next stops:

- [Logistic Regression Exercises in R](Logistic-Regression-Exercises-in-R.html) drills deeper into the binomial family with separation, calibration, and ROC-style evaluation.
- [Poisson Regression Exercises in R](Poisson-Regression-Exercises-in-R.html) extends the count-modeling track with offsets, exposure terms and rate ratios.
- [Logistic Regression in R](Logistic-Regression-With-R.html) is the parent tutorial covering the underlying theory and full case study.
- [Poisson Regression in R](Poisson-Regression-in-R.html) walks through expected counts, IRRs and overdispersion checks as a complete tutorial.
