---
title: "Poisson & Negative Binomial Regression: Model Count Data in R"
slug: "Poisson-and-Negative-Binomial-Regression"
description: "Step-by-step tutorial on Poisson & negative binomial regression in R. Includes working code examples, interpretation guidance, and common mistakes to avoid."
keywords: "Poisson regression in R, negative binomial regression, glm Poisson family, glm.nb, MASS package, count data regression, overdispersion, incidence rate ratio, IRR, offset term"
auto_link_terms: "Poisson regression|negative binomial regression|glm.nb|count data regression|overdispersion|incidence rate ratio|count regression|Quasi-Poisson regression|offset term"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-29
curriculum_id: "2.7.7"
post_type: C
sidebar_section: Statistics
sidebar_title: "Poisson & Negative Binomial Regression"
sidebar_order: 86
difficulty: Intermediate
---

# Poisson & Negative Binomial Regression: Model Count Data in R

<p class="lead">Poisson and negative binomial regression are the two workhorse models for count outcomes in R, the kind of integer data you get when counting events (school absences, accidents, doctor visits). Use Poisson when the variance of the count is roughly equal to its mean, and negative binomial when the variance is bigger, which is what real-world data almost always look like.</p>

## Why can't you use linear regression for count data?

Counts behave differently from continuous outcomes. They are non-negative integers, often clumped near zero with a long right tail, and their spread tends to grow with their average. Linear regression happily predicts negative values, assumes constant variance, and treats residuals as Normal, all of which are wrong here. The fix is a generalized linear model with a log link and a count-friendly distribution. Let's fit one in two lines on the `quine` school-attendance dataset and unpack what it says.

```r title="Fit your first Poisson regression"
library(MASS)
data(quine)

quine_pois <- glm(Days ~ Eth + Sex + Age + Lrn,
                  data = quine, family = poisson)
summary(quine_pois)
#> Call:
#> glm(formula = Days ~ Eth + Sex + Age + Lrn, family = poisson,
#>     data = quine)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  2.71538    0.06468  41.984  < 2e-16 ***
#> EthN        -0.53360    0.04188 -12.740  < 2e-16 ***
#> SexM         0.16160    0.04253   3.799  0.000145 ***
#> AgeF1       -0.33390    0.07009  -4.764  1.9e-06 ***
#> AgeF2        0.25783    0.06242   4.131  3.6e-05 ***
#> AgeF3        0.42769    0.06769   6.319  2.6e-10 ***
#> LrnSL        0.34325    0.05277   6.504  7.8e-11 ***
#>
#> (Dispersion parameter for poisson family taken to be 1)
#>     Null deviance: 2073.5  on 145  degrees of freedom
#> Residual deviance: 1696.7  on 139  degrees of freedom
#> AIC: 2299.2
```

That's a working count model. Each row is an Australian schoolchild, `Days` is the count of days absent in a year, and predictors are ethnicity, sex, age band, and learner status. The coefficients are on the log-count scale, so a positive number means more absences. `LrnSL = 0.34` says slow learners have a higher log-count of absences than the baseline group, with the size of that bump waiting in the next section. Notice the dispersion parameter is forced to 1 (Poisson assumes that), which we'll come back to.

The math behind the fit is simple. Poisson regression links the expected count to a linear combination of predictors through a logarithm:

$$\log(\mu_i) = \beta_0 + \beta_1 x_{1i} + \beta_2 x_{2i} + \dots + \beta_p x_{pi}$$

Where:

- $\mu_i$ is the expected count for observation $i$
- $\beta_0$ is the intercept (log of the baseline rate)
- $\beta_j$ is the effect of predictor $j$ on the log of the expected count
- $x_{ji}$ is the value of predictor $j$ for observation $i$

The log link guarantees predicted counts stay positive no matter what the linear combination evaluates to.

[KEY INSIGHT]
**Coefficients live on the log scale.** A coefficient of 0.34 doesn't mean "0.34 more days absent." It means "the log of expected days goes up by 0.34," which is a 41% increase in the count itself once you exponentiate. Always exponentiate before interpreting.

**Try it:** Refit the model dropping the `Lrn` predictor and read the residual deviance. A smaller residual deviance means the dropped term wasn't carrying weight. Save your fit to `ex_fit_simple`.

```r title="Your turn: refit without Lrn"
# Refit Poisson without Lrn

ex_fit_simple <- glm(  # your code here
)

deviance(ex_fit_simple)
#> Expected: a number larger than 1696.7 (because removing Lrn loses information)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Drop Lrn solution"
ex_fit_simple <- glm(Days ~ Eth + Sex + Age,
                     data = quine, family = poisson)
deviance(ex_fit_simple)
#> [1] 1738.957
```

The deviance grew from 1696.7 to about 1739 once `Lrn` was dropped, so the learner-status flag was indeed explaining real variation in absences.

</details>

## How do you interpret Poisson regression coefficients?

Raw Poisson coefficients are awkward because they live on the log scale. Exponentiating turns them into **incidence rate ratios (IRRs)**: multiplicative factors on the expected count. An IRR of 1 means no effect; 1.5 means 50% more events; 0.7 means 30% fewer.

```r title="Convert coefficients to incidence rate ratios"
quine_irr <- exp(coef(quine_pois))
quine_ci  <- exp(confint.default(quine_pois))

round(cbind(IRR = quine_irr, quine_ci), 3)
#>                IRR 2.5 %  97.5 %
#> (Intercept) 15.110 13.31  17.155
#> EthN         0.587  0.54   0.637
#> SexM         1.175  1.08   1.278
#> AgeF1        0.716  0.62   0.822
#> AgeF2        1.294  1.14   1.464
#> AgeF3        1.534  1.34   1.751
#> LrnSL        1.410  1.27   1.563
```

Now the numbers tell a clear story. Non-Aboriginal students (`EthN`) miss 41% fewer days than the Aboriginal baseline (IRR 0.59). Boys miss 17% more days than girls. Slow learners (`LrnSL`) miss 41% more days than average learners, with a 95% confidence interval of 27% to 56%. The intercept of 15.1 is the predicted baseline count for a girl from the reference age and learner groups.

[TIP]
**Use `confint.default()` for fast Wald intervals, `confint()` for accurate profile intervals.** Wald uses the SE and a Normal approximation, which is instant. The profile method searches the likelihood directly and is more reliable for small samples or extreme effects, but it's slower. Default to Wald during exploration, switch to profile when you finalize numbers for a report.

**Try it:** Compute the IRR and 95% CI just for the `SexM` coefficient and write a one-sentence interpretation. Save the IRR to `ex_irr_sex`.

```r title="Your turn: IRR for Sex=M"
# Extract IRR + CI for SexM only

ex_irr_sex <-   # your code here

ex_irr_sex
#> Expected: about 1.18 with CI roughly (1.08, 1.28)
```

<details>
<summary>Click to reveal solution</summary>

```r title="IRR for Sex solution"
ex_irr_sex <- exp(coef(quine_pois)["SexM"])
ex_ci_sex  <- exp(confint.default(quine_pois)["SexM", ])
c(IRR = ex_irr_sex, ex_ci_sex)
#>    IRR.SexM     2.5 %    97.5 %
#> 1.1753989 1.0814105 1.2775571
```

Interpretation: holding ethnicity, age, and learner status constant, boys are absent about 18% more days than girls, and we're fairly confident the true effect is between 8% and 28%.

</details>

## How do you check for overdispersion?

Poisson regression rests on a strong assumption: the variance of the count equals its mean. When that fails (and it usually does for real data), the coefficients themselves stay roughly correct, but the standard errors shrink, p-values look smaller than they should, and confidence intervals are too narrow. The model becomes overconfident. Spotting that is the single most important check after fitting a Poisson model.

The quickest sanity check is to compare the variance and mean of the raw outcome:

```r title="Compare variance and mean of the count"
mean(quine$Days)
#> [1] 16.46

var(quine$Days)
#> [1] 264.17

hist(quine$Days, breaks = 25, col = "lightblue",
     main = "Distribution of days absent",
     xlab = "Days absent")
```

The variance is sixteen times the mean. If Poisson were the right distribution, those two numbers should be close. The histogram would also look bell-shaped around the mean for a Poisson; here it has a long right tail and zero spike, which screams overdispersion.

A more rigorous check uses the residual deviance from the fitted model. Under a true Poisson, the ratio of residual deviance to residual degrees of freedom should be near 1. Larger means overdispersion.

```r title="Compute the residual dispersion ratio"
disp_ratio <- deviance(quine_pois) / df.residual(quine_pois)
disp_ratio
#> [1] 12.20
```

A ratio of 12 is dramatic. Anything above 1.5 already warrants attention; values above 2 mean Poisson p-values are not trustworthy. The model is fitting the means but underestimating the spread, which means every confidence interval and p-value in the previous section is artificially tight.

[NOTE]
**A formal test lives in `AER::dispersiontest()`.** It runs a Pearson chi-square style test against equidispersion. The AER package isn't pre-built for browser R, so this tutorial uses the deviance-over-df ratio, which agrees with the formal test in practice. If you want the p-value for a paper, install AER locally and run `AER::dispersiontest(quine_pois)`.

[WARNING]
**Never report Poisson p-values without checking dispersion.** A Poisson model with a dispersion ratio of 5 will print three-star significance on every coefficient by default. Those stars are an artifact of the wrong model, not evidence of an effect. Either move to negative binomial or use a Quasi-Poisson sandwich.

**Try it:** Fit a Poisson regression of `gear` (a count) on `mpg` from `mtcars`, then compute its dispersion ratio. Save the ratio to `ex_disp_ratio`.

```r title="Your turn: dispersion ratio on mtcars"
# Fit Poisson glm and compute dispersion ratio

ex_fit <- glm(  # your code here
)

ex_disp_ratio <-   # your code here

ex_disp_ratio
#> Expected: a number well below 1 (gear has very little spread)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Dispersion ratio solution"
ex_fit <- glm(gear ~ mpg, data = mtcars, family = poisson)
ex_disp_ratio <- deviance(ex_fit) / df.residual(ex_fit)
ex_disp_ratio
#> [1] 0.0473
```

A ratio far below 1 means under-dispersion: the counts are tighter than Poisson expects (there are only three gear values in mtcars, so the variance is tiny). Under-dispersion is rare in practice and usually signals that Poisson isn't the natural model for the data.

</details>

## When should you use negative binomial regression?

The negative binomial (NB) model fixes overdispersion by adding a single extra parameter, traditionally written as $\theta$ (theta) or $k$. Where Poisson forces variance to equal mean, NB lets variance grow as a quadratic of the mean:

$$\text{Var}(Y) = \mu + \frac{\mu^2}{\theta}$$

Where:

- $\mu$ is the expected count
- $\theta$ is the dispersion parameter (estimated from the data)
- Smaller $\theta$ = more overdispersion; as $\theta \to \infty$, NB reduces to Poisson

In R, `MASS::glm.nb()` is a near drop-in replacement for `glm(family = poisson)`:

```r title="Fit a negative binomial regression"
quine_nb <- glm.nb(Days ~ Eth + Sex + Age + Lrn, data = quine)
summary(quine_nb)
#> Call:
#> glm.nb(formula = Days ~ Eth + Sex + Age + Lrn, data = quine,
#>     init.theta = 1.274892646)
#>
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)   2.8917     0.2272  12.726  < 2e-16 ***
#> EthN         -0.5694     0.1527  -3.728 0.000193 ***
#> SexM          0.0823     0.1551   0.530 0.595782
#> AgeF1        -0.4451     0.2364  -1.883 0.059722 .
#> AgeF2         0.0901     0.2362   0.382 0.702830
#> AgeF3         0.3567     0.2474   1.442 0.149258
#> LrnSL         0.2956     0.1849   1.599 0.109839
#>
#>               Theta:  1.275
#>           Std. Err.:  0.161
#>
#>  2 x log-likelihood:  -1093.025
```

Compare those standard errors to the Poisson fit. The point estimates barely moved, but the SEs roughly tripled. Effects that looked rock-solid under Poisson, like `SexM` and `AgeF3`, now have honest p-values that no longer scream significance. That's the cost of the missing dispersion in the Poisson model showing up where it should: in the uncertainty.

The estimated `Theta` of 1.27 is small, confirming heavy overdispersion (a Theta of 100+ would mean Poisson was fine). The Std. Err. of 0.16 is the uncertainty around theta itself. Smaller theta means each predicted mean carries a wider distribution of actual outcomes.

[KEY INSIGHT]
**Quasi-Poisson is a third option, but NB is usually better.** Quasi-Poisson keeps Poisson coefficients and inflates the SEs by a single overdispersion factor (`family = quasipoisson` in `glm()`). It's quick but it's a quasi-likelihood, so you can't compare quasi-Poisson with anything via AIC. NB is a real likelihood model: it gives you AIC, predicted distributions, and deviance you can trust.

**Try it:** Fit an NB model with only `Age` as a predictor and inspect the new theta. Save the fit to `ex_nb_age`.

```r title="Your turn: NB with only Age"
# Fit glm.nb with Age as the only predictor

ex_nb_age <- glm.nb(  # your code here
)

ex_nb_age$theta
#> Expected: a value smaller than 1.275 (less explanatory power, so more leftover spread)
```

<details>
<summary>Click to reveal solution</summary>

```r title="NB Age-only solution"
ex_nb_age <- glm.nb(Days ~ Age, data = quine)
ex_nb_age$theta
#> [1] 1.103
```

Theta dropped from 1.27 to 1.10 because removing predictors leaves more unexplained spread, which the dispersion parameter has to absorb. You always want the smallest model that gives you a usable theta and acceptable AIC.

</details>

## How do you model rates with an offset term?

Counts almost always sit on top of an exposure. Insurance claims accumulate per policy-year, accidents per million miles driven, ER visits per person-day. A raw count of 5 is meaningful only relative to its denominator. The standard fix is an **offset term**: a known coefficient of 1 on the log of the exposure, which lets the rest of the coefficients describe the rate, not the count.

Let's simulate a small insurance dataset and fit a rate model.

```r title="Simulate an insurance claims dataset"
set.seed(2026)

n <- 100
insurance_df <- data.frame(
  region = sample(c("urban", "rural"), n, replace = TRUE),
  exposure_years = round(runif(n, 0.5, 5), 1)
)

# True rate: urban has higher claim rate than rural
rate <- ifelse(insurance_df$region == "urban", 0.30, 0.15)
insurance_df$claims <- rpois(n, lambda = rate * insurance_df$exposure_years)

head(insurance_df, 4)
#>   region exposure_years claims
#> 1  rural            2.5      0
#> 2  urban            4.7      1
#> 3  urban            3.6      0
#> 4  rural            1.4      0
```

Each row is a policy with a region label, a length of coverage, and the observed number of claims during that coverage. Rural policies tend to have lower claim rates, but they also tend to have different exposures, so a raw `claims ~ region` Poisson would conflate the two. The offset separates them.

```r title="Fit a Poisson rate model with offset"
claims_fit <- glm(claims ~ region + offset(log(exposure_years)),
                  data = insurance_df, family = poisson)
summary(claims_fit)$coefficients
#>              Estimate Std. Error   z value     Pr(>|z|)
#> (Intercept) -1.948    0.378       -5.16    2.5e-07
#> regionurban  0.811    0.451        1.80    0.0721
```

Exponentiating, urban policies have $e^{0.811} \approx 2.25$ times the claim rate of rural policies, which matches the simulation (0.30 vs 0.15 = a 2× rate ratio, well within the CI). Without the offset, the coefficient on `regionurban` would mix true rate differences with whatever exposure imbalance existed in the sample.

[TIP]
**Always log the offset.** `offset(log(exposure_years))` is correct; `offset(exposure_years)` is silently wrong. The offset has to be on the same scale as the linear predictor, and the linear predictor is the log of the expected count.

**Try it:** Refit the model without the offset and compare the `regionurban` coefficient to the version with offset. Save the no-offset fit to `ex_offset_fit`.

```r title="Your turn: refit without offset"
# Same model but no offset

ex_offset_fit <- glm(  # your code here
)

coef(ex_offset_fit)
#> Expected: regionurban coefficient is different (and biased)
```

<details>
<summary>Click to reveal solution</summary>

```r title="No-offset solution"
ex_offset_fit <- glm(claims ~ region,
                     data = insurance_df, family = poisson)
coef(ex_offset_fit)
#> (Intercept) regionurban
#>      -0.916       0.500
```

Without the offset, the urban coefficient drops from 0.811 to 0.500. The model is now describing total counts rather than rates, and any imbalance in exposure between rural and urban policies leaks into the region effect. With offset, you get the cleaner rate ratio.

</details>

## How do you compare and diagnose count models?

Once you've fit Poisson and NB on the same data, the practical question is which one to trust. The comparison itself is easy because they're both real likelihood models: AIC works directly. Diagnostics matter too: a smaller AIC on a poorly-fitting model is no win.

![Decision flow for choosing a count regression model.](screenshots/Poisson-and-Negative-Binomial-Regression-decision-flow.webp)

*Figure 1: Decision flow for choosing a count regression model.*

The flowchart captures the whole game. Start with Poisson, check dispersion, escalate to NB if needed, and consider zero-inflated extensions only if you have a true excess of zeros beyond what NB can explain.

```r title="Compare Poisson and NB by AIC"
AIC(quine_pois, quine_nb)
#>           df     AIC
#> quine_pois  7  2299.2
#> quine_nb    8  1109.0
```

NB beats Poisson by 1190 AIC points. That's not a marginal call; that's an avalanche. AIC differences above 10 are usually decisive, and we're an order of magnitude past that. The extra parameter (theta) is paid back many times over by the gain in fit.

A second diagnostic is plotting predicted counts against observed counts. If the model is well-calibrated, the points should hug the diagonal:

```r title="Plot predicted vs observed counts"
quine$pred <- predict(quine_nb, type = "response")

plot(quine$pred, quine$Days,
     xlab = "Predicted days absent",
     ylab = "Observed days absent",
     main = "NB model: predicted vs observed",
     pch = 19, col = rgb(0, 0, 0, 0.4))
abline(0, 1, col = "red", lty = 2)
```

The cloud sits around the diagonal, meaning the NB model is calibrated on average. The vertical scatter is large because individual student absences are noisy, but that noise is what theta is there to absorb. For a more diagnostic view, `plot(quine_nb, which = 1)` shows residuals vs fitted values; you want no funneling pattern.

[WARNING]
**AIC is only fair when models share the same data and link.** A Poisson with offset and a Poisson without offset are fit on the same likelihood scale, so AIC works there. But a Poisson and a Quasi-Poisson are not directly comparable by AIC because Quasi-Poisson has no proper likelihood. Always check that your models are nested or at least on the same likelihood family before comparing.

**Try it:** Fit Poisson and NB on the simulated `insurance_df` (with the offset) and compare AIC. Save the AIC table to `ex_aic_compare`.

```r title="Your turn: AIC compare on insurance data"
# Fit two models and compare AIC

claims_pois <-   # your code here
claims_nb   <-   # your code here

ex_aic_compare <- AIC(claims_pois, claims_nb)
ex_aic_compare
#> Expected: AICs very close (the data is barely overdispersed by design)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Insurance AIC solution"
claims_pois <- glm(claims ~ region + offset(log(exposure_years)),
                   data = insurance_df, family = poisson)
claims_nb   <- glm.nb(claims ~ region + offset(log(exposure_years)),
                      data = insurance_df)
ex_aic_compare <- AIC(claims_pois, claims_nb)
ex_aic_compare
#>             df    AIC
#> claims_pois  2  140.2
#> claims_nb    3  142.2
```

The AICs are almost identical, with NB slightly worse because it pays for an extra parameter that buys nothing on this clean simulated Poisson data. When that happens, stay with Poisson: simpler, just as good.

</details>

## Practice Exercises

These combine multiple concepts from the tutorial. Work through them in order; difficulty grows.

### Exercise 1: IRR with confidence interval for an age effect

From `quine_nb` (the NB model fit earlier), compute the IRR for `AgeF3` with its 95% Wald confidence interval. Save the IRR (a single number) to `my_irr_age`.

```r title="Exercise 1: IRR for AgeF3"
# Hint: exponentiate the coefficient and confint.default() row

my_irr_age <-   # your code here

my_irr_age
#> Expected: a number near 1.43
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_irr_age <- exp(coef(quine_nb)["AgeF3"])
my_ci_age  <- exp(confint.default(quine_nb)["AgeF3", ])
c(IRR = my_irr_age, my_ci_age)
#>   IRR.AgeF3       2.5%       97.5%
#>     1.4287     0.8800     2.3199
```

Compared to the Poisson IRR for `AgeF3` (1.53 with a tight CI), the NB IRR is 1.43 with a much wider CI that crosses 1. Once dispersion is accounted for, the age-3 effect is no longer statistically distinguishable from no effect.

</details>

### Exercise 2: Simulate overdispersed counts and pick the winning model

Simulate 300 counts where `lambda = exp(0.5 + 0.4 * x)` with `x ~ N(0, 1)`, but add NB noise with `size = 2` (use `rnegbin()` from MASS). Fit both Poisson and NB, compare via AIC, and save the model with the lower AIC to `my_winner`.

```r title="Exercise 2: simulate and pick"
# Hint: rnegbin(n, mu = lambda, theta = 2)

set.seed(7)
my_x      <- rnorm(300)
my_lambda <-   # your code here
my_y      <-   # your code here

# Fit both
my_pois <-   # your code here
my_nb   <-   # your code here

my_winner <- # whichever has lower AIC
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(7)
my_x      <- rnorm(300)
my_lambda <- exp(0.5 + 0.4 * my_x)
my_y      <- rnegbin(300, mu = my_lambda, theta = 2)

my_df   <- data.frame(my_y, my_x)
my_pois <- glm(my_y ~ my_x, data = my_df, family = poisson)
my_nb   <- glm.nb(my_y ~ my_x, data = my_df)

aic_table <- AIC(my_pois, my_nb)
aic_table
#>          df     AIC
#> my_pois   2  1488.9
#> my_nb     3  1273.1

my_winner <- if (AIC(my_pois) < AIC(my_nb)) my_pois else my_nb
class(my_winner)
#> [1] "negbin" "glm" "lm"
```

NB wins by 200+ AIC points, exactly as expected because we added genuine overdispersion to the simulation. The takeaway: when the true data-generating process has extra noise beyond Poisson, AIC reliably finds it.

</details>

### Exercise 3: Rate ratio from an offset model with a continuous predictor

Extend `insurance_df` with a `policy_age` column (random integers 1–10), and rebuild the outcome so that the true claim rate also rises with policy age (multiplier `exp(0.1 * policy_age)`). Fit a Poisson with offset and report the rate ratio for `policy_age`. Save to `my_rate_ratio`.

```r title="Exercise 3: offset + continuous predictor"
# Hint: exp(0.1) ≈ 1.105 should be the recovered rate ratio

set.seed(99)
insurance_df$policy_age <-   # your code here
true_rate <- ifelse(insurance_df$region == "urban", 0.30, 0.15) *
             exp(0.1 * insurance_df$policy_age)
insurance_df$claims <- rpois(nrow(insurance_df),
                             lambda = true_rate * insurance_df$exposure_years)

my_fit <- glm(  # your code here
)

my_rate_ratio <-   # your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
set.seed(99)
insurance_df$policy_age <- sample(1:10, nrow(insurance_df), replace = TRUE)
true_rate <- ifelse(insurance_df$region == "urban", 0.30, 0.15) *
             exp(0.1 * insurance_df$policy_age)
insurance_df$claims <- rpois(nrow(insurance_df),
                             lambda = true_rate * insurance_df$exposure_years)

my_fit <- glm(claims ~ region + policy_age +
              offset(log(exposure_years)),
              data = insurance_df, family = poisson)

my_rate_ratio <- exp(coef(my_fit)["policy_age"])
my_rate_ratio
#> policy_age
#>   1.0876
```

The fitted rate ratio of about 1.09 per year of policy age is close to the true 1.105 (sampling noise accounts for the gap). Each additional policy year multiplies the expected claim rate by ~1.09, holding region and exposure constant.

</details>

## Complete Example

Here's the whole workflow on `quine`, from raw data to interpreted results, in one continuous flow.

```r title="End-to-end: quine school absences"
# 1. Inspect the outcome
mean(quine$Days)
var(quine$Days)
hist(quine$Days, breaks = 25, main = "Days absent", xlab = "Days")

# 2. Fit Poisson, check dispersion
fit_pois <- glm(Days ~ Eth + Sex + Age + Lrn,
                data = quine, family = poisson)
deviance(fit_pois) / df.residual(fit_pois)
#> [1] 12.20  -> heavy overdispersion, Poisson is wrong

# 3. Refit with negative binomial
fit_nb <- glm.nb(Days ~ Eth + Sex + Age + Lrn, data = quine)
fit_nb$theta
#> [1] 1.275

# 4. Compare AIC
AIC(fit_pois, fit_nb)
#>          df     AIC
#> fit_pois   7  2299.2
#> fit_nb     8  1109.0  -> NB wins decisively

# 5. Convert NB coefficients to IRRs
round(exp(cbind(IRR = coef(fit_nb), confint.default(fit_nb))), 3)
#>                IRR  2.5 %  97.5 %
#> (Intercept)  18.027  11.55  28.144
#> EthN          0.566   0.42   0.764
#> SexM          1.086   0.80   1.471
#> AgeF1         0.641   0.40   1.018
#> AgeF2         1.094   0.69   1.738
#> AgeF3         1.429   0.88   2.320
#> LrnSL         1.344   0.94   1.929

# 6. Predict for a new student profile
new_student <- data.frame(Eth = "N", Sex = "F", Age = "F2", Lrn = "AL")
final_pred <- predict(fit_nb, newdata = new_student, type = "response")
final_pred
#>        1
#> 11.16   -> ~11 days absent expected for this profile
```

The NB model gives honest standard errors, sensible IRRs, and a ready prediction for any new student. Ethnicity is the single biggest driver, and once dispersion is accounted for the marginal effects of sex and age weaken substantially compared to the naive Poisson fit.

## Summary

![Overview of count regression concepts.](screenshots/Poisson-and-Negative-Binomial-Regression-overview-mindmap.webp)

*Figure 2: Overview of count regression concepts.*

The decision tree for count data is short and reliable.

| Question | Answer |
|---|---|
| Outcome is a non-negative integer count? | Start with Poisson via `glm(family = poisson)` |
| Variance ≫ mean (or deviance/df ≫ 1)? | Switch to NB via `MASS::glm.nb()` |
| Counts are per unit time/area/exposure? | Add `offset(log(exposure))` to keep coefficients on the rate scale |
| Want effect sizes that read like multipliers? | `exp(coef(fit))` gives incidence rate ratios |
| Choosing between two count models? | Compare AIC (Poisson vs NB are directly comparable) |

Skip Quasi-Poisson unless you specifically need Poisson coefficients with sandwich SEs. NB does the same job better and gives you AIC.

## References

1. Venables, W. N. & Ripley, B. D. *Modern Applied Statistics with S*, 4th Edition. Springer (2002). Origin of `glm.nb()` in the MASS package. [Link](https://www.stats.ox.ac.uk/pub/MASS4/)
2. Faraway, J. *Extending the Linear Model with R*, 2nd Edition. CRC Press (2016). Chapter on count regression.
3. Cameron, A. C. & Trivedi, P. K. *Regression Analysis of Count Data*, 2nd Edition. Cambridge University Press (2013). The standard reference. [Link](https://www.cambridge.org/9781107014169)
4. UCLA OARC. Negative Binomial Regression: R Data Analysis Examples. [Link](https://stats.oarc.ucla.edu/r/dae/negative-binomial-regression/)
5. R Core Team. `glm()` documentation, stats package. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
6. CRAN. MASS package reference manual. [Link](https://cran.r-project.org/web/packages/MASS/MASS.pdf)
7. Hilbe, J. M. *Negative Binomial Regression*, 2nd Edition. Cambridge University Press (2011). Deep dive on NB variants and diagnostics.

## Continue Learning

- [Logistic Regression in R](Logistic-Regression-in-R-2.html), when the outcome is binary instead of a count, logistic is the parallel GLM workhorse.
- [Zero-Inflated Models in R](Zero-Inflated-Models-in-R.html), for counts with more zeros than even NB can explain (e.g., counts of doctor visits where many people simply don't see a doctor).
- [Which Regression Model in R](Which-Regression-Model-in-R.html), a broader decision guide that places Poisson and NB alongside linear, logistic, and ordinal regression.
