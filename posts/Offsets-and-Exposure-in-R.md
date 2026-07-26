---
title: "Offsets and Exposure in Poisson Models in R"
slug: "Offsets-and-Exposure-in-R"
description: "Learn how offsets and exposure turn Poisson count models into rate models in R. Fit glm() with offset(log(exposure)), read rate ratios, and predict rates."
keywords: "Poisson offset in R, exposure Poisson regression, offset glm R, rate ratio in R, incidence rate ratio, offset log exposure, Poisson rate model, modeling rates in R, glm offset argument, person-years offset"
mathjax: true
webr: true
date: "2026-07-26"
curriculum_id: "ST2-10.5"
post_type: "C"
auto_link_terms: "offset in Poisson model|Poisson offset|exposure in Poisson regression|offset log exposure|rate ratio in R|incidence rate ratio|Poisson rate model|glm offset|modeling rates in R|person-years offset|offset term|Poisson exposure"
auto_link_case_sensitive: false
sidebar_section: "Statistics"
sidebar_title: "Offsets & Exposure"
sidebar_order: "168"
difficulty: "Intermediate"
---

<p class="lead">An offset is a fixed term you add to a Poisson model so it predicts a rate (events per unit of exposure) instead of a raw count. It is the natural logarithm of the exposure, and its coefficient is locked at 1 rather than estimated. This guide builds the idea from a two-clinic example up to a full car-insurance model, all in base R with <code>glm()</code>, and shows how to read the results as rate ratios and turn them into predictions.</p>

## Why do raw counts mislead when exposure differs?

A count is only a fair comparison when every group had the same chance to accumulate events. The moment one group is observed longer, or contains more people, or covers more ground, it will log more events for no interesting reason. Exposure is that background amount of opportunity, and ignoring it is one of the most common mistakes in count modeling. Let's see it happen with two hospital clinics tracking infections over one year.

```r title="Two clinics, two very different sizes"
# Infections recorded at two clinics over one year
clinic <- data.frame(
  name       = c("Clinic A", "Clinic B"),
  infections = c(24, 42),
  patients   = c(200, 600)
)
# A rate puts both clinics on the same footing: infections per 100 patients
clinic$per_100 <- 100 * clinic$infections / clinic$patients
clinic
#>       name infections patients per_100
#> 1 Clinic A         24      200      12
#> 2 Clinic B         42      600       7
```

Look at the raw counts first: Clinic B recorded 42 infections against Clinic A's 24, so B looks worse. Now look at the last column. Clinic B saw 600 patients while A saw only 200, and once we express each as infections per 100 patients, B's rate is 7 and A's rate is 12. The clinic with more infections actually has the lower infection rate.

The fix was to divide each count by its exposure, here the number of patients, to get a rate everyone can be compared on. That single division is the whole intuition behind offsets. The rest of this guide is about doing the same thing inside a model, so we can add predictors and get uncertainty estimates on the rates.

**Try it:** Health reports usually quote infections per 1000 patients, not per 100. Change the multiplier so `ex_per_1000` holds the rate per 1000 patients for each clinic.

```r title="Your turn: rate per 1000 patients"
# The per-100 rate is 100 * infections / patients.
# Change the multiplier to get the rate per 1000 patients instead.
ex_per_1000 <- 100 * clinic$infections / clinic$patients   # edit the 100
ex_per_1000
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: rate per 1000 patients"
ex_per_1000 <- 1000 * clinic$infections / clinic$patients
ex_per_1000
#> [1] 120  70
```

**Explanation:** Swapping 100 for 1000 rescales the rate. Clinic A sits at 120 infections per 1000 patients and Clinic B at 70. The ranking is unchanged because the denominator is the same for both; only the units moved.

</details>

## What is an offset in a Poisson model?

A Poisson regression models a count using a log link, which means it predicts the logarithm of the expected count from a straight-line combination of your predictors. If you have not met it yet, think of it as the count-data cousin of ordinary linear regression, fitted with `glm(y ~ x, family = poisson)`. On its own it models counts, but we just saw that counts are the wrong target when exposure varies. We want it to model the rate.

Here is the small piece of algebra that gets us there. If formulas are not your thing, skip to the code below: the three lines just say to drop `log(exposure)` into the model with its slope pinned to 1. Writing $\mu_i$ for the expected count of observation $i$, a plain Poisson model is:

$$\log(\mu_i) = \beta_0 + \beta_1 x_i$$

We actually care about the rate, which is the expected count divided by the exposure $t_i$. So put the rate inside the log instead:

$$\log\!\left(\frac{\mu_i}{t_i}\right) = \beta_0 + \beta_1 x_i$$

Using the rule that $\log(a/b) = \log(a) - \log(b)$, move the exposure to the other side:

$$\log(\mu_i) = \beta_0 + \beta_1 x_i + \log(t_i)$$

Where:

- $\mu_i$ = the expected event count for observation $i$
- $t_i$ = the exposure for observation $i$ (patient-days, person-years, population, area)
- $x_i$ = a predictor value
- $\beta_0, \beta_1$ = the coefficients R estimates

That extra $\log(t_i)$ on the end is the offset. It looks like a predictor, but notice it has no coefficient of its own to estimate. Its multiplier is fixed at 1, because doubling the exposure should exactly double the expected count. Exposure shows up in many fields under different names, so it helps to see the pattern.

| Field | Event (the count) | Exposure (the denominator) |
|---|---|---|
| Epidemiology | new infections | person-years at risk |
| Insurance | claims filed | policies or policy-years |
| Manufacturing | defects found | units produced |
| Ecology | animals seen | area surveyed |
| Traffic safety | crashes | miles driven |

To make the rest of this concrete, let's simulate a realistic dataset. Imagine 300 hospital wards, each observed for a different number of patient-days, where half used a new hygiene protocol that truly cuts the infection rate to 60% of the standard rate.

```r title="Simulate ward infections with unequal exposure"
set.seed(2010)
n <- 300
# Exposure: how long each ward was observed, in patient-days
patient_days <- sample(30:600, n, replace = TRUE)
# Half the wards used a new hygiene protocol (standard is the reference level)
protocol <- relevel(factor(sample(c("standard", "new"), n, replace = TRUE)), ref = "standard")
# True infection rate per patient-day: 0.03 standard, cut to 60% under the new protocol
base_rate <- ifelse(protocol == "new", 0.03 * 0.6, 0.03)
infections <- rpois(n, lambda = patient_days * base_rate)
wards <- data.frame(infections, patient_days, protocol)
head(wards)
#>   infections patient_days protocol
#> 1          7          462      new
#> 2          6          307 standard
#> 3          2          120 standard
#> 4         10          408 standard
#> 5          1          139      new
#> 6         15          598 standard
```

Each row is one ward with its infection count, its exposure, and its protocol. Because every ward ran for a different number of patient-days, the raw `infections` column is not comparable across rows. Let's pool the wards by protocol and compute the rate the same way we did for the clinics.

```r title="Empirical infection rate by protocol"
totals <- aggregate(cbind(infections, patient_days) ~ protocol, data = wards, FUN = sum)
totals$rate_per_1000 <- 1000 * totals$infections / totals$patient_days
totals
#>   protocol infections patient_days rate_per_1000
#> 1 standard       1419        48655      29.16453
#> 2      new        991        54220      18.27739
```

Standard wards ran up 1419 infections across 48655 patient-days, a rate of 29.2 per 1000 patient-days. The new-protocol wards recorded 991 infections over 54220 patient-days, a rate of 18.3. The ratio of the two rates, 18.3 divided by 29.2, is about 0.63, which is close to the true value of 0.60 we built into the simulation. An offset model will recover exactly this rate ratio while also giving us a confidence interval and room for more predictors.

![How a raw count becomes a rate model through the log link and an offset.](screenshots/Offsets-and-Exposure-in-R-count-to-rate-flow.webp)

*Figure 1: How a raw count becomes a rate model through the log link and an offset.*

[KEY INSIGHT]
**An offset is a known number, not a parameter to estimate.** Ordinary predictors get a coefficient that R fits from the data; the offset enters the model already multiplied by 1, so it shifts the prediction without ever competing for a coefficient.

**Try it:** Using the `totals` table above, compute the rate ratio for the new protocol by dividing its rate by the standard rate. You should land near 0.63.

```r title="Your turn: rate ratio from the totals"
# totals has one row per protocol. Divide the new-protocol rate
# by the standard-protocol rate to estimate the rate ratio.
ex_ratio <- totals$rate_per_1000[totals$protocol == "new"]   # divide this by the standard rate
ex_ratio
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: rate ratio from the totals"
ex_ratio <- totals$rate_per_1000[totals$protocol == "new"] /
            totals$rate_per_1000[totals$protocol == "standard"]
round(ex_ratio, 3)
#> [1] 0.627
```

**Explanation:** Dividing the two pooled rates gives 0.627, meaning the new protocol's infection rate is roughly 63% of the standard rate. This hand calculation is exactly what the model will estimate in a moment, only the model adds a confidence interval.

</details>

## How do you fit an offset with glm() in R?

You fit an offset with the same `glm()` you would use for any Poisson model, and you name the exposure inside an `offset()` wrapper in the formula. The exposure goes in on the log scale, so you write `offset(log(patient_days))`, matching the algebra above. Let's fit the ward model and read the summary.

```r title="Fit a Poisson rate model with an offset"
m <- glm(infections ~ protocol + offset(log(patient_days)),
         family = poisson, data = wards)
summary(m)
#>
#> Call:
#> glm(formula = infections ~ protocol + offset(log(patient_days)),
#>     family = poisson, data = wards)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -3.53480    0.02655 -133.16   <2e-16 ***
#> protocolnew -0.46729    0.04140  -11.29   <2e-16 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>
#>     Null deviance: 416.69  on 299  degrees of freedom
#> Residual deviance: 286.87  on 298  degrees of freedom
#> AIC: 1381.9
#>
#> Number of Fisher Scoring iterations: 4
```

Read the coefficients on the log scale for now, we will convert them to rates in the next section. The intercept of -3.535 is the log baseline rate for the reference group, standard wards. The `protocolnew` coefficient of -0.467 is the change in log rate for switching to the new protocol, and its tiny p-value says that change is very unlikely to be chance. Everything here is the log of a rate per patient-day, because the offset accounts for the exposure.

R gives you a second way to supply the offset: a dedicated `offset =` argument, separate from the formula. It fits the identical model, so use whichever reads more clearly to you.

```r title="The offset = argument gives the same fit"
m_arg <- glm(infections ~ protocol,
             family = poisson, offset = log(patient_days), data = wards)
coef(m_arg)
#> (Intercept) protocolnew
#>  -3.5348022  -0.4672884
```

The coefficients match `m` to every decimal, confirming the two syntaxes are interchangeable. The formula version keeps the exposure visible next to your predictors, while the argument version keeps the formula short. Neither is more correct.

[NOTE]
**Always put exposure on the log scale.** The offset must be the log of the exposure, not the raw exposure, because it slots into a model of the log rate. Writing `offset(patient_days)` instead of `offset(log(patient_days))` silently fits a different and wrong model, so double-check the log is there.

**Try it:** Refit the ward model, but pass the exposure through the `offset =` argument instead of inside the formula. Confirm the coefficients still match `m`.

```r title="Your turn: fit with the offset = argument"
# Fit infections on protocol, but move the exposure into the offset = argument.
ex_m <- glm(infections ~ protocol, family = poisson, data = wards)   # add offset = log(patient_days)
coef(ex_m)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: offset = argument"
ex_m <- glm(infections ~ protocol, family = poisson,
            offset = log(patient_days), data = wards)
coef(ex_m)
#> (Intercept) protocolnew
#>  -3.5348022  -0.4672884
```

**Explanation:** Adding `offset = log(patient_days)` produces the same intercept and slope as the formula-based `m`. The starter code left the offset out, which would have fitted a count model that ignores how long each ward was watched.

</details>

## Why fix the exposure coefficient at 1 instead of estimating it?

It is fair to ask why we bolt the exposure in with a fixed coefficient of 1 rather than letting the model estimate its effect like any other predictor. The answer is that fixing it at 1 is what makes the model a rate model. A coefficient of 1 on `log(exposure)` says that doubling the exposure doubles the expected count exactly, which is the definition of a constant rate. Let's test that assumption by freeing the coefficient and seeing where it lands.

```r title="Estimate the exposure coefficient instead of fixing it"
m_cov <- glm(infections ~ protocol + log(patient_days),
             family = poisson, data = wards)
coef(m_cov)
#>       (Intercept)       protocolnew log(patient_days)
#>        -3.4344887        -0.4666903         0.9831720
```

Now `log(patient_days)` is an ordinary predictor with its own estimated coefficient, and that coefficient came out at 0.983, very close to 1. When the data really do behave like a rate, the freed coefficient hovers around 1, which is a reassuring check that the offset assumption fits. Let's confirm that 1 is a plausible value with a confidence interval.

```r title="Is the exposure coefficient consistent with 1?"
confint.default(m_cov)["log(patient_days)", ]
#>     2.5 %    97.5 %
#> 0.8974298 1.0689143
```

The 95% interval runs from 0.90 to 1.07, and it comfortably contains 1. That means the data give us no reason to reject the fixed-at-1 offset, so the simpler rate model is justified. If instead the interval sat well away from 1, it would be a signal that events do not scale proportionally with exposure, and you might keep exposure as a free predictor or rethink the exposure measure.

![The same log(exposure) term means two different models depending on whether its coefficient is fixed or estimated.](screenshots/Offsets-and-Exposure-in-R-offset-vs-covariate.webp)

*Figure 2: The same log(exposure) term means two different models depending on whether its coefficient is fixed or estimated.*

[WARNING]
**Freeing the exposure coefficient changes what every other coefficient means.** With the offset, the other coefficients are rate ratios you can report directly. Once exposure becomes a fitted predictor, the model no longer estimates a clean rate, and the remaining coefficients answer a subtly different question. Use the offset unless you have a specific reason not to.

**Try it:** Pull just the `log(patient_days)` coefficient out of `m_cov` and round it to two decimals, so you can quote how close the freed exposure effect is to 1.

```r title="Your turn: read the exposure coefficient"
# m_cov estimated the exposure coefficient instead of fixing it.
# Narrow coef(m_cov) down to only the log(patient_days) element.
ex_exp_coef <- coef(m_cov)   # index this to the "log(patient_days)" element
ex_exp_coef
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: read the exposure coefficient"
ex_exp_coef <- coef(m_cov)["log(patient_days)"]
round(ex_exp_coef, 2)
#> log(patient_days)
#>              0.98
```

**Explanation:** Indexing the coefficient vector by name isolates the exposure effect, which rounds to 0.98. That is close enough to 1 that fixing it as an offset costs almost nothing and buys a clean rate interpretation.

</details>

## How do you read the coefficients as rate ratios?

Log-scale coefficients are hard to feel, so the standard move is to exponentiate them. Taking `exp()` of a coefficient turns it into a rate ratio, often called an incidence rate ratio: the factor by which the rate multiplies when that predictor changes by one unit. Doing the same to the confidence limits gives you an interval on the rate ratio. Let's convert the whole ward model at once.

```r title="Turn coefficients into rate ratios"
exp(cbind(RateRatio = coef(m), confint.default(m)))
#>             RateRatio      2.5 %     97.5 %
#> (Intercept) 0.02916453 0.02768589 0.03072214
#> protocolnew 0.62669932 0.57785800 0.67966877
```

Start with the intercept: its rate ratio of 0.0292 is the baseline rate itself, about 29 infections per 1000 patient-days for standard wards, which matches the pooled number we computed by hand earlier. The `protocolnew` rate ratio of 0.627 is the headline result. Switching to the new protocol multiplies the infection rate by 0.627, a reduction of about 37%. Because the confidence interval, 0.58 to 0.68, sits entirely below 1, we can say the drop is statistically clear, not noise.

[TIP]
**Report rate ratios with their interval, not the raw log coefficients.** A reader understands "the new protocol cut the infection rate by 37%, 95% CI 32% to 42%" far better than "the log coefficient was -0.47". Exponentiate both the estimate and the confidence limits so the interval stays honest.

**Try it:** Convert the `protocolnew` coefficient into a percentage change in the rate. A rate ratio of 0.627 should come out near a 37% reduction.

```r title="Your turn: percentage change in the rate"
# exp(coef) is a rate ratio. Turn the protocolnew rate ratio into a percentage change.
ex_pct <- exp(coef(m)["protocolnew"])   # subtract 1, then multiply by 100
ex_pct
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: percentage change in the rate"
ex_pct <- (exp(coef(m)["protocolnew"]) - 1) * 100
round(ex_pct, 1)
#> protocolnew
#>       -37.3
```

**Explanation:** Subtracting 1 from the rate ratio and multiplying by 100 converts it to a percentage change. The value of -37.3 means the new protocol is associated with a 37.3% lower infection rate, the plain-language version of the rate ratio 0.627.

</details>

## How do you predict rates and counts from the model?

A fitted offset model can answer two different questions: how many events to expect, and at what rate. The key is that `predict(..., type = "response")` returns an expected count and automatically includes whatever exposure you supply in the new data. So to predict a count, give the real exposure; to predict a rate, fix the exposure at a chosen unit. Let's predict counts first, for a standard and a new ward each watched for 500 patient-days.

```r title="Predict expected infection counts"
new_wards <- data.frame(
  protocol = factor(c("standard", "new"), levels = levels(wards$protocol)),
  patient_days = c(500, 500)
)
predict(m, newdata = new_wards, type = "response")
#>         1         2
#> 14.582263  9.138694
```

Over 500 patient-days, the model expects about 14.6 infections in a standard ward and 9.1 in a new-protocol ward. Those are counts, and they carry the exposure of 500 baked in. To get a rate instead, we fix the exposure at a fixed reference amount, say 1000 patient-days, so the offset becomes the same constant for every row and the prediction reads as a rate per 1000.

```r title="Predict the rate per 1000 patient-days"
rate_data <- data.frame(
  protocol = factor(c("standard", "new"), levels = levels(wards$protocol)),
  patient_days = 1000
)
predict(m, newdata = rate_data, type = "response")
#>        1        2
#> 29.16453 18.27739
```

Setting the exposure to 1000 turns the predicted count into a rate per 1000 patient-days: 29.2 for standard wards and 18.3 for new. These match the pooled rates from the very first ward table, confirming the model recovered the empirical rates exactly, now with the machinery to add predictors and intervals.

[KEY INSIGHT]
**The exposure you put in the new data decides whether you get a count or a rate.** Supply each unit's real exposure to forecast actual event counts; supply one common exposure value to read every group's rate on the same scale. Same model, two answers.

**Try it:** Predict the expected number of infections for a single new-protocol ward observed for 250 patient-days.

```r title="Your turn: predict counts for 250 patient-days"
# Build a one-row new data frame for a new-protocol ward with 250 patient-days.
ex_new <- data.frame(protocol = factor("new", levels = levels(wards$protocol)),
                     patient_days = 250)
# Next step: call predict(m, newdata = ex_new, type = "response")
ex_new
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: predict counts for 250 patient-days"
ex_new <- data.frame(protocol = factor("new", levels = levels(wards$protocol)),
                     patient_days = 250)
predict(m, newdata = ex_new, type = "response")
#>        1
#> 4.569347
```

**Explanation:** With 250 patient-days of exposure, the model expects about 4.6 infections in a new-protocol ward. That is half the 9.1 it predicted for 500 patient-days, exactly as a constant rate demands when you halve the exposure.

</details>

## Complete Example: Modeling Car Insurance Claim Rates

Let's put the whole workflow together on real data. The `Insurance` dataset in the MASS package records, for groups of British car-insurance policyholders in 1973, how many claims each group filed and how many policyholders it contained. The number of policyholders is the exposure, because a group with more drivers will file more claims even if each driver is no riskier. We coerce the two ordered factors to plain factors so the coefficients read as simple group comparisons.

```r title="Load the car insurance claims data"
data(Insurance, package = "MASS")
Insurance$Group <- factor(Insurance$Group, ordered = FALSE)
Insurance$Age   <- factor(Insurance$Age, ordered = FALSE)
head(Insurance)
#>   District  Group   Age Holders Claims
#> 1        1    <1l   <25     197     38
#> 2        1    <1l 25-29     264     35
#> 3        1    <1l 30-35     246     20
#> 4        1    <1l   >35    1680    156
#> 5        1 1-1.5l   <25     284     63
#> 6        1 1-1.5l 25-29     536     84
```

Each row is a group of policyholders described by district, engine size (`Group`), and driver age band, with `Holders` as the exposure and `Claims` as the count. We model the claim rate with district, engine size, and age as predictors, and `log(Holders)` as the offset.

```r title="Model claim rates with an exposure offset"
ins_fit <- glm(Claims ~ District + Group + Age,
               family = poisson, offset = log(Holders), data = Insurance)
summary(ins_fit)
#>
#> Call:
#> glm(formula = Claims ~ District + Group + Age, family = poisson,
#>     data = Insurance, offset = log(Holders))
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept) -1.82174    0.07679 -23.724  < 2e-16 ***
#> District2    0.02587    0.04302   0.601 0.547597
#> District3    0.03852    0.05051   0.763 0.445657
#> District4    0.23421    0.06167   3.798 0.000146 ***
#> Group1-1.5l  0.16134    0.05053   3.193 0.001409 **
#> Group1.5-2l  0.39281    0.05500   7.142 9.18e-13 ***
#> Group>2l     0.56341    0.07232   7.791 6.65e-15 ***
#> Age25-29    -0.19101    0.08286  -2.305 0.021149 *
#> Age30-35    -0.34495    0.08137  -4.239 2.24e-05 ***
#> Age>35      -0.53667    0.06996  -7.672 1.70e-14 ***
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>
#>     Null deviance: 236.26  on 63  degrees of freedom
#> Residual deviance:  51.42  on 54  degrees of freedom
#> AIC: 388.74
#>
#> Number of Fisher Scoring iterations: 4
```

The signs are already easy to read. Bigger engines carry positive coefficients that grow with engine size, so larger cars claim at a higher rate. Older age bands carry negative coefficients that grow more negative with age, so older drivers claim at a lower rate. To make those readable, exponentiate every coefficient into a rate ratio.

```r title="Insurance rate ratios"
round(exp(coef(ins_fit)), 3)
#> (Intercept)   District2   District3   District4 Group1-1.5l Group1.5-2l    Group>2l    Age25-29
#>       0.162       1.026       1.039       1.264       1.175       1.481       1.757       0.826
#>    Age30-35      Age>35
#>       0.708       0.585
```

Now each number is a multiplier on the claim rate relative to its reference group. Drivers over 35 have a rate ratio of 0.585, meaning they claim at about 59% of the rate of the under-25 reference band, a 41% lower rate. The largest engines carry a rate ratio of 1.757, so they claim at roughly 76% above the smallest-engine reference. District 4 stands out among districts at 1.264. Finally, let's turn the model into a business forecast: the expected number of claims from a group of 3000 young drivers in District 1 with the smallest engines.

```r title="Expected claims for a group of policyholders"
profile <- data.frame(
  District = factor("1",   levels = levels(Insurance$District)),
  Group    = factor("<1l", levels = levels(Insurance$Group)),
  Age      = factor("<25", levels = levels(Insurance$Age)),
  Holders  = 3000
)
predict(ins_fit, newdata = profile, type = "response")
#>        1
#> 485.2323
```

The model expects about 485 claims from those 3000 policyholders, which is a rate of roughly 0.16 claims per holder, the baseline rate for this highest-risk profile. Because we passed the real `Holders` count of 3000, this comes back as a count you could plug straight into a reserving calculation. Swap in a different exposure and you would get the forecast for a differently sized book of business.

## Practice Exercises

These pull together fitting, rate ratios, prediction, and the offset-versus-covariate idea. Each uses distinct variable names so it will not overwrite the tutorial objects.

### Exercise 1: Report a rate ratio with its interval

Using the `wards` data, fit a Poisson model of `infections` on `protocol` with `offset(log(patient_days))`, then report the new-protocol rate ratio together with its 95% confidence interval. Save the fit as `my_fit`. You should recover a rate ratio near 0.63.

```r title="Your turn: rate ratio with a confidence interval"
# Fit an offset model of infections on protocol using the wards data,
# then turn the protocol coefficient into a rate ratio with a 95% CI.
# Hint: exp(cbind(coef(fit), confint.default(fit)))

my_fit <- glm(infections ~ protocol + offset(log(patient_days)),
              family = poisson, data = wards)
# Write your exp(...) line below:
my_fit
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: rate ratio with a confidence interval"
my_fit <- glm(infections ~ protocol + offset(log(patient_days)),
              family = poisson, data = wards)
exp(cbind(RateRatio = coef(my_fit), confint.default(my_fit)))["protocolnew", ]
#> RateRatio     2.5 %    97.5 %
#> 0.6266993 0.5778580 0.6796688
```

**Explanation:** Exponentiating the coefficient and its Wald interval gives a rate ratio of 0.627 with a 95% CI of 0.58 to 0.68. Because the interval is entirely below 1, the new protocol's rate reduction is statistically clear.

</details>

### Exercise 2: Rank age bands and forecast claims

Using the `Insurance` model, report the rate ratios for the three older age bands relative to the under-25 reference, then predict the expected claims for 5000 policyholders over 35 in District 1 with the smallest engines. Save the fit as `my_ins`.

```r title="Your turn: age rate ratios and a prediction"
# Fit Claims on District + Group + Age with offset(log(Holders)),
# read the Age rate ratios, then predict for 5000 over-35 holders
# in District 1 with the <1l engine group.
# Hint: round(exp(coef(fit)), 3) for the ratios; a one-row newdata for predict().

my_ins <- glm(Claims ~ District + Group + Age,
              family = poisson, offset = log(Holders), data = Insurance)
# Write your exp(coef()) and predict() lines below:
my_ins$coefficients["Age>35"]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: age rate ratios and a prediction"
my_ins <- glm(Claims ~ District + Group + Age,
              family = poisson, offset = log(Holders), data = Insurance)
round(exp(coef(my_ins))[c("Age25-29", "Age30-35", "Age>35")], 3)
#> Age25-29 Age30-35   Age>35
#>    0.826    0.708    0.585
my_profile <- data.frame(
  District = factor("1",   levels = levels(Insurance$District)),
  Group    = factor("<1l", levels = levels(Insurance$Group)),
  Age      = factor(">35", levels = levels(Insurance$Age)),
  Holders  = 5000
)
predict(my_ins, newdata = my_profile, type = "response")
#>        1
#> 472.8521
```

**Explanation:** The claim rate falls steadily with age, from 0.826 for 25-29 down to 0.585 for over-35, each relative to the youngest band. The forecast for 5000 older, small-engine, District 1 drivers is about 473 claims, lower per holder than the young-driver profile despite the larger group.

</details>

### Exercise 3: Show what ignoring exposure does

This is the payoff exercise. Fit two models of `Claims` on `Age` alone: one with no offset, and one with `offset(log(Holders))`. Compare the age rate ratios. The no-offset model will give nonsense because older bands simply contain more policyholders.

```r title="Your turn: what happens when you ignore exposure"
# Fit two models of Claims on Age only: one WITHOUT an offset and one WITH
# offset(log(Holders)). Compare the Age rate ratios from each.
# Hint: exp(coef(model))[c("Age25-29", "Age30-35", "Age>35")]

no_off <- glm(Claims ~ Age, family = poisson, data = Insurance)
# Add the offset model below, then compare the two sets of ratios:
exp(coef(no_off))["Age>35"]
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution: with and without the offset"
no_off   <- glm(Claims ~ Age, family = poisson, data = Insurance)
with_off <- glm(Claims ~ Age, family = poisson, offset = log(Holders), data = Insurance)
round(exp(coef(no_off))[c("Age25-29", "Age30-35", "Age>35")], 3)
#> Age25-29 Age30-35   Age>35
#>    1.764    1.978    9.017
round(exp(coef(with_off))[c("Age25-29", "Age30-35", "Age>35")], 3)
#> Age25-29 Age30-35   Age>35
#>    0.859    0.749    0.608
```

**Explanation:** Without the offset, the over-35 band looks like it claims 9 times as often as the youngest, purely because it holds far more policyholders. Add `offset(log(Holders))` and the estimate flips to a rate ratio of 0.608, a 39% lower rate. Exposure was the confounder all along, and the offset removed it.

</details>

## Frequently Asked Questions

### Is an offset the same as a weight in glm()?

No. An offset shifts the linear predictor by a known amount and is the right tool for exposure. A weight in the `weights =` argument changes how much each row influences the fit, which answers a different question. For rate modeling of counts, you want the offset.

### Does the exposure always have to be logged?

Yes, when you use the standard log link for Poisson regression. The model works on the log scale, so the exposure must enter as `log(exposure)` to line up with the algebra. Passing the raw exposure fits a different, incorrect model.

### Can I use an offset with negative binomial models too?

Yes. Overdispersed counts are often fitted with `MASS::glm.nb()`, which accepts the very same `offset(log(exposure))` term in the formula. The offset idea carries over unchanged; only the error distribution differs.

### What if some rows have zero exposure?

You cannot log a zero, so `log(0)` is undefined and those rows break the model. A row with zero exposure also had no opportunity for an event, so it carries no rate information. Drop such rows before fitting.

### Why not just model the rate directly as the response?

Because a rate is a ratio of a count to an exposure, and modeling it as a plain number throws away the count nature that makes the Poisson distribution appropriate. The offset lets you keep the integer count as the response while still targeting the rate, which is both more correct and better behaved for small counts.

## Summary

Offsets are the bridge between counts and rates. When exposure varies across your rows, you fold `log(exposure)` into a Poisson model as an offset, a term whose coefficient is fixed at 1, and the model then estimates rates instead of raw counts. The table below is your quick reference.

| Task | Code |
|---|---|
| Fit with offset in the formula | `glm(y ~ x + offset(log(E)), family = poisson)` |
| Fit with the offset argument | `glm(y ~ x, offset = log(E), family = poisson)` |
| Rate ratio for a predictor | `exp(coef(m))` |
| Rate ratio with interval | `exp(cbind(coef(m), confint.default(m)))` |
| Predict an expected count | `predict(m, newdata, type = "response")` with the real exposure |
| Predict a rate | same call with exposure fixed at a common value |

![The offset modeling workflow from raw counts to interpreted rate ratios.](screenshots/Offsets-and-Exposure-in-R-workflow.webp)

*Figure 3: The offset modeling workflow from raw counts to interpreted rate ratios.*

The core habits to keep: log the exposure, exponentiate coefficients into rate ratios you can explain in plain words, and decide between a count answer and a rate answer by what exposure you feed to `predict()`. Get those right and Poisson models with offsets become one of the most practical tools in applied statistics.

## References

1. R Core Team. glm() function documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
2. R Core Team. family() and link functions in R. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/family.html)
3. Venables, W. N. and Ripley, B. D. Insurance dataset reference (MASS package). [Link](https://rdrr.io/cran/MASS/man/Insurance.html)
4. Venables, W. N. and Ripley, B. D. Modern Applied Statistics with S, 4th Edition. [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
5. MASS package on CRAN. [Link](https://cran.r-project.org/package=MASS)
6. UCLA Office of Advanced Research Computing. Poisson Regression in R. [Link](https://stats.oarc.ucla.edu/r/dae/poisson-regression/)
7. Musa, K. I. Poisson Regression, Data Analysis in Medicine and Health using R. [Link](https://bookdown.org/drki_musa/dataanalysis/poisson-regression.html)
8. R Core Team. An Introduction to R. [Link](https://cran.r-project.org/doc/manuals/r-release/R-intro.html)

## Continue Learning

- [Poisson Regression in R](Poisson-Regression-in-R.html): the foundation this guide builds on, covering the log link and count modeling from the start.
- [Poisson and Negative Binomial Regression](Poisson-and-Negative-Binomial-Regression.html): what to do when counts are overdispersed and a plain Poisson model underestimates uncertainty.
- [How to Read Logistic Regression Output in R](Read-Logistic-Output-in-R.html): the same coefficient-reading skills applied to the other workhorse GLM.
