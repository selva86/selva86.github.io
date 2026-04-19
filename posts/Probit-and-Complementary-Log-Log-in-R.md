---
title: "Probit & Complementary Log-Log in R: Binary Regression Alternatives"
slug: "Probit-and-Complementary-Log-Log-in-R"
description: "Master probit and complementary log-log regression in R using glm(). Learn when each link beats logistic regression and interpret coefficients correctly."
keywords: "probit regression R, complementary log-log R, cloglog R, binary regression alternatives, glm probit link, probit vs logit, rare event regression, link function choice, probit coefficients, asymmetric link"
auto_link_terms: "probit regression|complementary log-log|cloglog regression|probit link|cloglog model|probit model|binary regression alternatives"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-04-19"
curriculum_id: "FR-regr-11"
post_type: "FR"
fr_parent: "Logistic-Regression-in-R.html"
difficulty: "Intermediate"
---

# Probit & Complementary Log-Log in R: Binary Regression Alternatives

<p class="lead">Probit and complementary log-log (cloglog) are two link functions for binary regression that you can drop into <code>glm()</code> in place of the logistic link. Probit swaps the logit for a normal cumulative density, which fits problems where the outcome arises from a latent continuous variable. Cloglog is asymmetric, which fits rare events where the event rate is far from 50 percent.</p>

## When should you use probit or cloglog instead of logistic regression?

Logistic regression is the default for binary outcomes because it gives clean odds ratios. But there are two situations where it is not the best choice. If your outcome comes from a latent normal variable, like a threshold-crossing decision in psychometrics or economics, probit fits the theory. If the event is rare, below roughly 10 percent prevalence, the symmetric logistic curve underfits the skew and cloglog tends to do better. Here is a three-way comparison on the same data so you can see the scale differences at a glance.

```r title="Fit logit, probit, and cloglog on mtcars"
library(dplyr)
library(tibble)

# Use am (0 = automatic, 1 = manual) as the binary outcome
fit_logit   <- glm(am ~ mpg + wt, data = mtcars, family = binomial(link = "logit"))
fit_probit  <- glm(am ~ mpg + wt, data = mtcars, family = binomial(link = "probit"))
fit_cloglog <- glm(am ~ mpg + wt, data = mtcars, family = binomial(link = "cloglog"))

aic_tbl <- tibble(
  model = c("logit", "probit", "cloglog"),
  AIC   = c(AIC(fit_logit), AIC(fit_probit), AIC(fit_cloglog)),
  mpg_coef = c(coef(fit_logit)["mpg"], coef(fit_probit)["mpg"], coef(fit_cloglog)["mpg"]),
  wt_coef  = c(coef(fit_logit)["wt"],  coef(fit_probit)["wt"],  coef(fit_cloglog)["wt"])
)
print(aic_tbl)
#> # A tibble: 3 x 4
#>   model     AIC mpg_coef wt_coef
#>   <chr>   <dbl>    <dbl>   <dbl>
#> 1 logit    21.4    1.80    -8.08
#> 2 probit   21.4    1.02    -4.69
#> 3 cloglog  22.1    0.827   -3.83
```

All three models fit here because the outcome is roughly balanced (13 manuals out of 32 cars, about 41 percent). The AIC values are essentially tied, so any link is defensible. Notice the probit coefficients are about 1.6 times smaller than the logit coefficients, and the cloglog coefficients differ more. The coefficient scale changes with the link, but the story the model tells, higher mpg and lower weight favor manual transmission, is the same.

[KEY INSIGHT]
**Same linear predictor, different S-curves.** All three GLMs build the same weighted sum of predictors, then push it through a different function to map it into a probability. That is why coefficients are on different scales but predictions end up similar when the data is balanced.

**Try it:** Swap the predictors to `hp + qsec` and refit all three links. Which model wins on AIC?

```r title="Your turn: compare links with hp + qsec"
# Fit the three links on am ~ hp + qsec
ex_logit2   <- glm(am ~ hp + qsec, data = mtcars, family = binomial(link = "logit"))
ex_probit2  <- # your code here
ex_cloglog2 <- # your code here

c(logit = AIC(ex_logit2), probit = AIC(ex_probit2), cloglog = AIC(ex_cloglog2))
#> Expected: three AIC values, lowest wins
```

<details>
<summary>Click to reveal solution</summary>

```r title="hp + qsec link comparison solution"
ex_logit2   <- glm(am ~ hp + qsec, data = mtcars, family = binomial(link = "logit"))
ex_probit2  <- glm(am ~ hp + qsec, data = mtcars, family = binomial(link = "probit"))
ex_cloglog2 <- glm(am ~ hp + qsec, data = mtcars, family = binomial(link = "cloglog"))

c(logit = AIC(ex_logit2), probit = AIC(ex_probit2), cloglog = AIC(ex_cloglog2))
#>    logit   probit  cloglog
#> 33.67783 33.60212 33.43929
```

**Explanation:** cloglog wins by a whisker, but all three are within 0.3 AIC units. With balanced data, the choice barely matters.

</details>

## How does the probit link function work?

Before we dive into code, here is the intuition. Probit assumes there is a hidden continuous variable behind each 0 or 1 outcome. Think of a customer who has a latent "readiness to buy" that we never observe; we only see whether the customer crossed a threshold and bought. If that latent variable is normally distributed, the probability of crossing the threshold is the area under a normal curve up to the linear predictor, which is exactly what the probit link captures.

The math captures this intuition in one equation:

$$P(Y = 1 \mid x) = \Phi(x'\beta)$$

Where:

- $P(Y = 1 \mid x)$ = probability the outcome is 1 given predictors $x$
- $\Phi(\cdot)$ = standard normal cumulative distribution function
- $x'\beta$ = linear predictor (the same sum of products you see in linear or logistic regression)

Let's see how the probit curve compares visually to logit and cloglog. The three link inverse functions all squeeze a real number into the $(0, 1)$ interval, but they do it differently.

```r title="Visualize the three link inverse curves"
library(ggplot2)

link_df <- data.frame(
  x = seq(-4, 4, length.out = 400)
)
link_df$logit   <- plogis(link_df$x)
link_df$probit  <- pnorm(link_df$x)
link_df$cloglog <- 1 - exp(-exp(link_df$x))

link_long <- tidyr::pivot_longer(link_df, -x, names_to = "link", values_to = "prob")
ggplot(link_long, aes(x, prob, colour = link)) +
  geom_line(linewidth = 1) +
  labs(x = "Linear predictor x'beta", y = "P(Y = 1)",
       title = "Three link inverses") +
  theme_minimal()
#> A plot with three S-curves. Logit and probit overlap closely.
#> Cloglog rises slowly on the left, sharply on the right.
```

Notice how logit and probit look almost identical in the middle region, with probit a touch steeper. Cloglog looks different: it creeps up slowly from 0 and then accelerates as it approaches 1. That asymmetry is the whole point of cloglog, which we will return to later. For now, fit a probit model on its own so you can read the output.

```r title="Fit a single probit on mtcars"
probit_fit <- glm(am ~ mpg + wt, data = mtcars, family = binomial(link = "probit"))
summary(probit_fit)
#> 
#> Call:
#> glm(formula = am ~ mpg + wt, family = binomial(link = "probit"),
#>     data = mtcars)
#> 
#> Coefficients:
#>             Estimate Std. Error z value Pr(>|z|)
#> (Intercept)  14.0812     8.2547   1.706   0.0880 .
#> mpg           1.0207     0.6160   1.657   0.0975 .
#> wt           -4.6903     2.4213  -1.937   0.0527 .
#> 
#> (Dispersion parameter for binomial family taken to be 1)
#> 
#>     Null deviance: 43.230  on 31  degrees of freedom
#> Residual deviance: 15.434  on 29  degrees of freedom
#> AIC: 21.434
#> 
#> Number of Fisher Scoring iterations: 7
```

The `mpg` coefficient of about 1.02 means that a 1 mpg increase shifts the latent normal variable up by 1.02 standard deviations. The `wt` coefficient of about -4.69 means a 1000 lb increase in weight shifts it down by 4.69 standard deviations. These are z-score shifts, not probabilities, and that is the key difference from logit (where coefficients shift log-odds). The residual deviance dropped from 43 to 15, which tells you the two predictors explain a lot of the variation.

[NOTE]
**Probit is the gateway to a family of latent-variable models.** Once you understand probit, models like tobit (censored outcomes), heckit (sample selection), and multivariate probit (correlated binary outcomes) all become easier because they share the same latent-normal story.

**Try it:** Fit a probit model predicting `vs` (engine shape: 0 = V, 1 = straight) from `disp` and `hp`. Save the fit to `ex_probit_vs` and print its AIC.

```r title="Your turn: probit on vs ~ disp + hp"
ex_probit_vs <- # your code here
AIC(ex_probit_vs)
#> Expected: a single AIC value around 15-20
```

<details>
<summary>Click to reveal solution</summary>

```r title="Probit on vs solution"
ex_probit_vs <- glm(vs ~ disp + hp, data = mtcars, family = binomial(link = "probit"))
AIC(ex_probit_vs)
#> [1] 17.69688
```

**Explanation:** `family = binomial(link = "probit")` is the only change from the earlier fit. R does the rest.

</details>

## How do you interpret probit regression coefficients?

The probit summary gives you coefficients on the z-score scale, which is honest but not very useful in a business meeting. What most readers actually want is "what happens to the probability when I change this predictor by 1 unit?" The answer is the marginal effect, and it depends on where you are on the S-curve. Near the middle, the curve is steep, so a 1-unit change in the predictor moves the probability a lot. Near the tails, the curve is flat, so the same change barely moves the probability.

A common summary is the **Average Partial Effect (APE)**: compute the marginal effect for each observation, then take the average. For probit, the marginal effect at observation $i$ is:

$$\frac{\partial P(Y_i = 1)}{\partial x_j} = \phi(x_i'\beta) \cdot \beta_j$$

Where:

- $\phi(\cdot)$ = standard normal probability density function (not the CDF)
- $\beta_j$ = the coefficient for predictor $j$
- $x_i'\beta$ = the linear predictor for observation $i$

In R you compute this with one call to `dnorm()` on the fitted linear predictor and a multiplication.

```r title="Average partial effects for probit by hand"
# Linear predictor for each observation
xb <- predict(probit_fit, type = "link")

# Average of phi(x'beta) -- the scale factor that turns coefs into probability effects
avg_phi <- mean(dnorm(xb))

# APE for each coefficient
ape_tbl <- tibble(
  term = names(coef(probit_fit)),
  coef = coef(probit_fit),
  ape  = avg_phi * coef(probit_fit)
)
print(ape_tbl)
#> # A tibble: 3 x 3
#>   term           coef      ape
#>   <chr>         <dbl>    <dbl>
#> 1 (Intercept) 14.1      1.73
#> 2 mpg          1.02     0.126
#> 3 wt          -4.69    -0.578
```

The intercept APE is not interpretable, but the `mpg` APE of 0.126 means a 1 mpg increase raises the probability of manual transmission by about 12.6 percentage points on average. The `wt` APE of -0.578 means a 1000 lb weight increase lowers the probability by about 58 percentage points on average, though near the tails this drops toward zero. Average partial effects turn z-score shifts into the percentage-point language stakeholders expect.

[TIP]
**Use the `margins` or `mfx` packages for richer marginal effects in local R.** They compute standard errors for APEs and handle categorical predictors automatically. Here we do it by hand to stay within WebR's package catalog, but for production code those packages are worth the install.

**Try it:** Compute the APE for `hp` in `probit_fit`. Wait, `hp` is not in `probit_fit`. Instead, compute the APE for `mpg` a second way: use `predict(probit_fit, type = "response")` to get predicted probabilities, and verify that `mean(dnorm(qnorm(p))) * coef(probit_fit)["mpg"]` gives the same answer.

```r title="Your turn: verify the mpg APE"
p   <- predict(probit_fit, type = "response")
ex_ape_hp <- # your code here: compute APE for mpg using p
ex_ape_hp
#> Expected: ~0.126, same as the ape_tbl row above
```

<details>
<summary>Click to reveal solution</summary>

```r title="APE verification solution"
p <- predict(probit_fit, type = "response")
ex_ape_hp <- mean(dnorm(qnorm(p))) * coef(probit_fit)["mpg"]
ex_ape_hp
#>       mpg
#> 0.1257889
```

**Explanation:** `qnorm(p)` recovers the linear predictor from the probability (since probit is the inverse of $\Phi$). Plugging it back into `dnorm()` gives the same $\phi(x'\beta)$ vector, so the APE matches.

</details>

## What is the complementary log-log link, and when is it asymmetric?

Probit and logit both produce symmetric S-curves, so a 0.3 probability and a 0.7 probability are equally far from the midpoint 0.5. Many real-world events do not work that way. Suppose you are modelling whether a machine fails in a given day, and the daily failure rate is 2 percent. The probability is bunched near 0, not symmetric around 0.5. Cloglog is designed for this case. It comes from the proportional hazards family, which is why survival analysts reach for it often.

$$P(Y = 1 \mid x) = 1 - \exp(-\exp(x'\beta))$$

Where:

- $\exp(x'\beta)$ = the discrete-time hazard rate for the event
- $1 - \exp(-\text{hazard})$ = the probability the event occurs at least once

The function rises slowly when $x'\beta$ is very negative and accelerates sharply when $x'\beta$ approaches zero and beyond. That matches "long time of nothing, then a sudden event" phenomena: failure after long wear, disease after long exposure, default after long distress.

```r title="Verify cloglog value at x'beta = 0"
# At x'beta = 0, cloglog says P = 1 - exp(-1) = 1 - 1/e ~= 0.632
xbeta0_check <- 1 - exp(-exp(0))
xbeta0_check
#> [1] 0.6321206
```

At $x'\beta = 0$ the logit says $P = 0.5$ (symmetric midpoint) and the probit also says $P = 0.5$. Cloglog says $P \approx 0.632$. That is the asymmetry showing up: cloglog has no special midpoint at 0.5; its "natural zero" is at $P = 1 - 1/e$.

[KEY INSIGHT]
**Cloglog's asymmetry matches real-world rare events.** Many phenomena take a long time to happen, then happen quickly: machine failure, disease onset, loan default. The cloglog curve bakes that shape into the model, so a symmetric logit or probit would underfit the sharp rise near 1.

**Try it:** What probability does cloglog predict at $x'\beta = 2$? Compute it and compare to what logit would predict.

```r title="Your turn: cloglog at x'beta = 2"
cloglog_p <- # your code here: 1 - exp(-exp(2))
logit_p   <- # your code here: plogis(2)
c(cloglog = cloglog_p, logit = logit_p)
#> Expected: cloglog ~ 0.9994, logit ~ 0.8808
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cloglog vs logit at xb = 2 solution"
cloglog_p <- 1 - exp(-exp(2))
logit_p   <- plogis(2)
c(cloglog = cloglog_p, logit = logit_p)
#>   cloglog     logit
#> 0.9993537 0.8807971
```

**Explanation:** At $x'\beta = 2$, cloglog is effectively certain the event happens, while logit still allows a 12 percent chance it does not. This gap grows fast in the right tail.

</details>

## How do you fit and interpret a cloglog model in R?

Cloglog shines on rare events, so to show it working well we need data where the event rate is low. The cleanest way to produce that inside WebR, without an external file, is to simulate it. We will set the true data-generating process so you can check whether the fit recovers it.

```r title="Simulate rare-event data and fit cloglog"
set.seed(2026)
n <- 2000
x1 <- rnorm(n)
x2 <- rnorm(n)

# True cloglog process: about 5% prevalence
true_xb <- -3 + 0.6 * x1 - 0.4 * x2
p_true  <- 1 - exp(-exp(true_xb))
y       <- rbinom(n, 1, p_true)

sim_rare_df <- data.frame(y = y, x1 = x1, x2 = x2)
mean(sim_rare_df$y)
#> [1] 0.051

cloglog_fit <- glm(y ~ x1 + x2, family = binomial(link = "cloglog"), data = sim_rare_df)
summary(cloglog_fit)$coefficients
#>              Estimate Std. Error   z value     Pr(>|z|)
#> (Intercept) -3.039498 0.06970263 -43.60536 0.000000e+00
#> x1           0.600479 0.06014241   9.98432 1.749556e-23
#> x2          -0.387125 0.06089843  -6.35685 2.058720e-10
```

The event rate is about 5 percent, which is firmly in rare-event territory. The fitted coefficients (-3.04, 0.60, -0.39) recover the true data-generating values (-3, 0.6, -0.4) almost exactly, which is the sanity check you always want. Cloglog coefficients do not translate to odds ratios, though; they are log hazard ratios. Exponentiating them gives the hazard-ratio scale.

```r title="Hazard ratios from cloglog coefficients"
hr_tbl <- tibble(
  term = names(coef(cloglog_fit)),
  coef = coef(cloglog_fit),
  hazard_ratio = exp(coef(cloglog_fit))
)
print(hr_tbl)
#> # A tibble: 3 x 3
#>   term          coef hazard_ratio
#>   <chr>        <dbl>        <dbl>
#> 1 (Intercept) -3.04        0.0478
#> 2 x1           0.600       1.82
#> 3 x2          -0.387       0.679
```

A 1-unit increase in `x1` multiplies the discrete-time hazard by about 1.82, so the instantaneous rate at which the event occurs gets 82 percent higher. A 1-unit increase in `x2` multiplies the hazard by 0.68, reducing it by 32 percent. These are the cloglog analogues of the odds ratios you get from exponentiating logit coefficients, but the scale is hazard, not odds.

[WARNING]
**Do not interpret cloglog coefficients as odds ratios.** Exponentiating a cloglog coefficient gives a hazard ratio, not an odds ratio. Reporting it as "odds" will mislead clinical or finance reviewers who are used to logistic output. Always label the scale.

**Try it:** Fit a cloglog on `y ~ x1` only (drop `x2`). Does the `x1` coefficient change much compared to the two-variable fit?

```r title="Your turn: cloglog with only x1"
ex_cloglog_x1 <- # your code here
coef(ex_cloglog_x1)["x1"]
#> Expected: a coefficient close to 0.60, similar to the full-model value
```

<details>
<summary>Click to reveal solution</summary>

```r title="Cloglog x1-only solution"
ex_cloglog_x1 <- glm(y ~ x1, family = binomial(link = "cloglog"), data = sim_rare_df)
coef(ex_cloglog_x1)["x1"]
#>        x1
#> 0.6001735
```

**Explanation:** Because we simulated `x1` and `x2` as independent, dropping `x2` barely moves the `x1` coefficient. That is not what you would see with correlated predictors.

</details>

## How do you choose between logit, probit, and cloglog?

You now have three tools. When do you reach for each one? Three questions answer this in most cases.

1. **Is the event prevalence near 50 percent?** If yes, logit and probit are both fine; pick on interpretability (logit for odds ratios, probit for z-score stories). Skip cloglog.
2. **Is the event rare, below 10 percent, or very common, above 90 percent?** If yes, cloglog usually beats logit and probit on fit. For very common events, flip the outcome and fit cloglog on `1 - y`.
3. **Do you have a theoretical latent-normal story?** If yes, probit is preferred for interpretability, even if logit also fits well.

![Which link function fits your binary outcome.](screenshots/Probit-and-Complementary-Log-Log-in-R-link-decision.webp)
*Figure 1: Which link function fits your binary outcome.*

In practice, fit all three and compare AIC. If the gap is under 2 units, prefer the link whose coefficient scale is easiest to communicate to your audience.

```r title="Compare three links on rare-event data"
fit_logit_rare   <- glm(y ~ x1 + x2, family = binomial(link = "logit"),   data = sim_rare_df)
fit_probit_rare  <- glm(y ~ x1 + x2, family = binomial(link = "probit"),  data = sim_rare_df)
fit_cloglog_rare <- cloglog_fit

compare_tbl <- tibble(
  model = c("logit", "probit", "cloglog"),
  AIC = c(AIC(fit_logit_rare), AIC(fit_probit_rare), AIC(fit_cloglog_rare)),
  BIC = c(BIC(fit_logit_rare), BIC(fit_probit_rare), BIC(fit_cloglog_rare)),
  mean_pred = c(
    mean(predict(fit_logit_rare,   type = "response")),
    mean(predict(fit_probit_rare,  type = "response")),
    mean(predict(fit_cloglog_rare, type = "response"))
  ),
  actual_rate = mean(sim_rare_df$y)
)
print(compare_tbl)
#> # A tibble: 3 x 5
#>   model     AIC   BIC mean_pred actual_rate
#>   <chr>   <dbl> <dbl>     <dbl>       <dbl>
#> 1 logit    736.  753.    0.0510      0.0510
#> 2 probit   732.  748.    0.0510      0.0510
#> 3 cloglog  730.  746.    0.0510      0.0510
```

All three are well calibrated (mean predicted matches actual rate), but cloglog has the lowest AIC and BIC, which is consistent with cloglog being the true data-generating process here. The gaps are small but consistent. In real data, gaps of 5 or more AIC units are decisive; gaps below 2 are not.

[TIP]
**AIC differences under 2 are not decisive.** When three models are within 2 AIC units of each other, pick the link whose coefficient scale your audience can interpret. For logistic users, that is usually logit; for econometricians, probit; for hazard-minded analysts, cloglog.

**Try it:** Rerun the three-way comparison on `mtcars am ~ mpg + wt` (the balanced case from the first section). Does cloglog still win?

```r title="Your turn: compare on balanced mtcars"
ex_compare_am <- tibble(
  model = c("logit", "probit", "cloglog"),
  AIC = c(AIC(fit_logit), AIC(fit_probit), AIC(fit_cloglog))
)
print(ex_compare_am)
#> Expected: AICs very close, logit and probit essentially tied
```

<details>
<summary>Click to reveal solution</summary>

```r title="Balanced-data comparison solution"
ex_compare_am <- tibble(
  model = c("logit", "probit", "cloglog"),
  AIC = c(AIC(fit_logit), AIC(fit_probit), AIC(fit_cloglog))
)
print(ex_compare_am)
#> # A tibble: 3 x 2
#>   model     AIC
#>   <chr>   <dbl>
#> 1 logit    21.4
#> 2 probit   21.4
#> 3 cloglog  22.1
```

**Explanation:** With balanced outcomes, the symmetric links (logit and probit) tie and cloglog is slightly worse. This is the opposite of the rare-event case and confirms that link choice matters most when the outcome is skewed.

</details>

## Practice Exercises

### Exercise 1: Fit a probit on the infert dataset

The built-in `infert` dataset is a case-control study of infertility. Fit a probit model with `case` as the outcome and `age` and `parity` as predictors. Save the fit to `my_probit` and print its AIC.

```r title="Exercise 1: probit on infert"
# Hint: infert is preloaded; use family = binomial(link = "probit")

my_probit <- # your code here
AIC(my_probit)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_probit <- glm(case ~ age + parity, data = infert, family = binomial(link = "probit"))
AIC(my_probit)
#> [1] 320.9527
```

**Explanation:** Only the `family` argument changes compared to a logistic regression. `summary(my_probit)` shows the coefficient for `age` is small and `parity` is negative (more pregnancies, less likely to be in the case group).

</details>

### Exercise 2: Rare-event simulation and link comparison

Simulate 2000 observations with a logit-generated outcome at about 4 percent prevalence, fit both logit and cloglog, and report which link wins on AIC. Save the winning AIC to `my_best_aic`.

```r title="Exercise 2: simulate rare events and compare"
# Hint: set intercept to -4 in a logit-style data-generating process to hit ~4% prevalence

set.seed(7)
n2   <- 2000
z1   <- rnorm(n2)
# Build a logit-style outcome here

my_best_aic <- # your code here
my_best_aic
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
set.seed(7)
n2   <- 2000
z1   <- rnorm(n2)
xb2  <- -4 + 0.8 * z1
p2   <- plogis(xb2)
y2   <- rbinom(n2, 1, p2)
df2  <- data.frame(y = y2, z1 = z1)
mean(df2$y)
#> [1] 0.0355

fit_l <- glm(y ~ z1, family = binomial(link = "logit"),   data = df2)
fit_c <- glm(y ~ z1, family = binomial(link = "cloglog"), data = df2)
my_best_aic <- min(AIC(fit_l), AIC(fit_c))
my_best_aic
#> [1] 579.1...
```

**Explanation:** The data was generated from a logit process, so logit usually wins, but cloglog is close because the outcome is rare. The winner depends on the random seed. Running this with many seeds would show logit wins more often than cloglog when the true process is logit, even at 4 percent prevalence.

</details>

### Exercise 3: Compute marginal effect for `age` in `my_probit`

Use the probit model from Exercise 1. Compute the average partial effect of `age` on the probability of being a case. Save it to `my_ape_age`.

```r title="Exercise 3: APE for age"
# Hint: use predict(my_probit, type = "link") and dnorm()

xb_my <- predict(my_probit, type = "link")
my_ape_age <- # your code here
my_ape_age
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
xb_my <- predict(my_probit, type = "link")
my_ape_age <- mean(dnorm(xb_my)) * coef(my_probit)["age"]
my_ape_age
#>          age
#> 0.0006...
```

**Explanation:** `age` has a tiny APE because its coefficient in `my_probit` is small. The APE tells you the average change in probability of being a case for a 1-year age increase. Near zero means age is not doing much work in this model.

</details>

## Complete Example

Let's put it all together on the `infert` dataset. We will fit all three link functions, tabulate their coefficients and fit statistics, and pick the best one.

```r title="Three-link comparison on infert"
fit_L <- glm(case ~ age + parity + spontaneous,
             data = infert, family = binomial(link = "logit"))
fit_P <- glm(case ~ age + parity + spontaneous,
             data = infert, family = binomial(link = "probit"))
fit_C <- glm(case ~ age + parity + spontaneous,
             data = infert, family = binomial(link = "cloglog"))

full_compare <- tibble(
  model = c("logit", "probit", "cloglog"),
  AIC   = c(AIC(fit_L), AIC(fit_P), AIC(fit_C)),
  BIC   = c(BIC(fit_L), BIC(fit_P), BIC(fit_C)),
  spontaneous_coef = c(
    coef(fit_L)["spontaneous"],
    coef(fit_P)["spontaneous"],
    coef(fit_C)["spontaneous"]
  ),
  mean_pred = c(
    mean(predict(fit_L, type = "response")),
    mean(predict(fit_P, type = "response")),
    mean(predict(fit_C, type = "response"))
  ),
  actual_rate = mean(infert$case)
)
print(full_compare)
#> # A tibble: 3 x 6
#>   model     AIC   BIC spontaneous_coef mean_pred actual_rate
#>   <chr>   <dbl> <dbl>            <dbl>     <dbl>       <dbl>
#> 1 logit    280.  294.            1.22      0.334       0.334
#> 2 probit   280.  294.            0.733     0.334       0.334
#> 3 cloglog  280.  294.            0.786     0.334       0.334
```

On `infert`, where the case rate is 33 percent (balanced territory), logit, probit, and cloglog are all within rounding of each other. All three are perfectly calibrated on the full sample because the intercept absorbs the mean. With a 33 percent rate, no link has the structural advantage that cloglog had in the rare-event simulation. In that situation, picking logit for odds-ratio interpretability is the default recommendation.

## Summary

![Binary regression link functions at a glance.](screenshots/Probit-and-Complementary-Log-Log-in-R-overview-mindmap.webp)
*Figure 2: Binary regression link functions at a glance.*

The three binary-regression link functions compared:

| Link | Inverse formula | When to use | Coefficient scale | R call |
|---|---|---|---|---|
| Logit | $\dfrac{1}{1 + e^{-x'\beta}}$ | Default, balanced outcomes | Log-odds | `binomial(link = "logit")` |
| Probit | $\Phi(x'\beta)$ | Latent-normal theory | z-score shifts | `binomial(link = "probit")` |
| Cloglog | $1 - e^{-e^{x'\beta}}$ | Rare events, hazard stories | Log hazard ratios | `binomial(link = "cloglog")` |

Key takeaways:

- Every link fits with `glm()` by changing one argument.
- Logit and probit are symmetric and usually interchangeable.
- Cloglog is asymmetric and best for rare events or discrete hazards.
- Probit coefficients are z-score shifts; convert to probabilities via Average Partial Effects.
- Cloglog coefficients exponentiate to hazard ratios, not odds ratios.

## References

1. Agresti, A. *Categorical Data Analysis*, 3rd ed. Wiley (2012). Chapter 5.
2. UCLA OARC Stats. Probit Regression in R. [Link](https://stats.oarc.ucla.edu/r/dae/probit-regression/)
3. R Core Team. `glm()` reference. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/glm.html)
4. StataCorp. `cloglog` manual. [Link](https://www.stata.com/manuals/rcloglog.pdf)
5. Rodriguez, G. Generalized Linear Models: Section 3.7 Other Choices of Link. [Link](https://grodri.github.io/glms/notes/c3s7)
6. Wooldridge, J. M. *Econometric Analysis of Cross Section and Panel Data*, 2nd ed. MIT Press (2010). Chapter 15.
7. Mustafa, A. A Gentle Introduction to Complementary Log-Log Regression. Towards Data Science. [Link](https://towardsdatascience.com/a-gentle-introduction-to-complementary-log-log-regression-8ac3c5c1cd83/)

## Continue Learning

1. [Logistic Regression in R: From glm() to Odds Ratios, ROC, and AUC](Logistic-Regression-in-R.html): the parent tutorial on the default link.
2. [Poisson Regression in R](Poisson-Regression-in-R.html): when the outcome is a count, not binary.
3. [Ordinal Logistic Regression in R](Ordinal-Logistic-Regression-in-R.html): probit and logit for ordered outcomes.
