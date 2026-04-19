---
title: "Interpreting Regression Output Completely: Every Number in lm Summary"
slug: Interpreting-Regression-Output-Completely
description: "Decode every number in R's lm() summary: residuals, coefficients, Std. Error, t-values, p-values, R-squared, F-statistic. Interactive examples you can run."
keywords: "interpret lm summary r, regression output r, lm summary explained, r squared interpretation, f statistic lm, residual standard error, t value regression r, p value coefficient, regression coefficients r, adjusted r squared"
auto_link_terms: "interpret lm summary|lm summary output|residual standard error|adjusted R-squared|F-statistic interpretation|coefficient p-value|t-value regression|regression output interpretation"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: 2026-04-19
curriculum_id: FR-regr-22
post_type: FR
fr_parent: Simple-Linear-Regression-in-R.html
difficulty: Intermediate
---

# Interpreting Regression Output Completely: Every Number in lm Summary

<p class="lead">R's <code>summary()</code> of an <code>lm</code> object prints four blocks of numbers: the formula, a residual distribution, a coefficient table, and model-fit statistics. This page decodes every single number, including how each one is computed, so you never again wonder what <code>Pr(>|t|)</code> or <code>F-statistic: 69.21</code> actually means.</p>

## What does each section of the `lm()` summary mean?

When you run `summary(fit)` on a linear model, R prints a wall of numbers in seconds. Most articles translate each label in isolation, which leaves you with a glossary but no mental model. Instead, let's fit one model on `mtcars`, print the full summary once, and use that output as the reference we decode, number by number, through the rest of the page.

```r title="Fit a model and print the full summary"
fit <- lm(mpg ~ wt + hp, data = mtcars)
sm  <- summary(fit)
sm
#> Call:
#> lm(formula = mpg ~ wt + hp, data = mtcars)
#>
#> Residuals:
#>     Min      1Q  Median      3Q     Max
#> -3.9419 -1.6008 -0.1825  1.0501  5.8537
#>
#> Coefficients:
#>              Estimate Std. Error t value Pr(>|t|)
#> (Intercept) 37.22727    1.59879  23.285  < 2e-16 ***
#> wt          -3.87783    0.63273  -6.129 1.12e-06 ***
#> hp          -0.03177    0.00903  -3.519  0.00145 **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 2.593 on 29 degrees of freedom
#> Multiple R-squared:  0.8268,    Adjusted R-squared:  0.8148
#> F-statistic: 69.21 on 2 and 29 DF,  p-value: 9.109e-12
```

That one object holds 18 numbers across four blocks. The **Call** echoes your formula so you can confirm what was fit. **Residuals** summarise how far off each prediction is. **Coefficients** give you the fitted slopes with uncertainty and significance. **Fit statistics** tell you how well the model explains the variance in `mpg` overall. Every number we discuss below appears in this output.

[TIP]
**Read the summary top-to-bottom, then coefficients column-by-column.** The blocks are ordered from model description to predictor-level detail to overall fit, so scanning top-down gives you a sanity check (right formula, centred residuals, significant coefficients) before you study the numbers carefully.

**Try it:** Fit a simpler one-predictor model `lm(mpg ~ wt, mtcars)` and print its summary. Notice which block shrinks.

```r title="Your turn: fit a one-predictor model"
ex_fit <- lm(mpg ~ wt, data = mtcars)
# Print the summary:
# your code here
#> Expected: same 4 blocks, but the Coefficients table now has 2 rows instead of 3.
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-predictor summary solution"
ex_fit <- lm(mpg ~ wt, data = mtcars)
summary(ex_fit)
#> Coefficients:
#>             Estimate Std. Error t value Pr(>|t|)
#> (Intercept)  37.2851     1.8776   19.86  < 2e-16 ***
#> wt           -5.3445     0.5591   -9.56 1.29e-10 ***
#> ...
```

**Explanation:** Dropping `hp` removes one row from the coefficient table. The Residuals, RSE, R-squared and F lines still print, they always exist for any valid `lm`.

</details>

## How do you read the residuals distribution?

A residual is the difference between the actual response value and the model's prediction: $e_i = y_i - \hat{y}_i$. R prints a five-number summary of these residuals at the top of the output. That summary is your first, cheapest diagnostic: look at it before you stare at coefficients.

```r title="Extract and inspect residuals"
resids <- residuals(fit)
summary(resids)
#>    Min. 1st Qu.  Median 3rd Qu.    Max.
#> -3.9419 -1.6008 -0.1825  1.0501  5.8537

# The same five numbers appear in summary(fit) under "Residuals:"
```

The five numbers (min, 1Q, median, 3Q, max) describe the distribution of prediction errors in the units of the response (miles per gallon here). Two sanity checks: the **median should sit near zero** (our -0.18 is fine), and the **tails should be roughly balanced** (here -3.94 vs 5.85, a little right-skew, worth noting). A wildly off-centre median or badly lopsided tails hints at model misspecification.

[WARNING]
**A median far from zero usually means the model is missing structure.** When residuals are consistently negative or positive, the functional form is wrong or a predictor is missing. Fix the model rather than explaining the bias away.

**Try it:** Verify the residuals definition by computing them from scratch as `y - fitted(fit)` and confirming they equal `residuals(fit)`.

```r title="Your turn: compute residuals from scratch"
y_hat <- fitted(fit)
# Compute residuals manually as the difference between observed mpg and y_hat:
ex_resids <- # your code here
all.equal(ex_resids, residuals(fit))
#> Expected: TRUE
```

<details>
<summary>Click to reveal solution</summary>

```r title="Manual residuals solution"
y_hat    <- fitted(fit)
ex_resids <- mtcars$mpg - y_hat
all.equal(ex_resids, residuals(fit))
#> [1] TRUE
```

**Explanation:** Residuals are defined as observed minus fitted. `residuals(fit)` is just a convenience accessor for this subtraction.

</details>

## What does each coefficient column tell you?

The coefficients table is the heart of the summary. It has four columns, one row per predictor (plus the intercept). Let's extract it and walk through the meaning of each column for the `wt` row.

```r title="Pull the coefficients table"
coefs <- coef(sm)
coefs
#>              Estimate Std. Error   t value     Pr(>|t|)
#> (Intercept) 37.22727    1.59879 23.284689 2.565459e-20
#> wt          -3.87783    0.63273 -6.128695 1.118685e-06
#> hp          -0.03177    0.00903 -3.518712 1.451229e-03
```

Reading the `wt` row:

- **Estimate** (`-3.878`). The fitted slope. Holding `hp` constant, each extra 1,000 lb of weight is associated with a **drop of 3.88 mpg**. Its sign and magnitude are the business story.
- **Std. Error** (`0.633`). The standard deviation of the estimate's sampling distribution. It tells you how precisely the slope is pinned down. Roughly, a 95% confidence interval is Estimate ± 2 × SE, so `wt` is between about -5.14 and -2.61 mpg per 1,000 lb.
- **t value** (`-6.13`). Estimate divided by Std. Error, that is, how many standard errors the estimate sits from zero. Large absolute values mean the predictor's effect clearly stands out from noise.
- **Pr(>|t|)** (`1.12e-06`). The two-sided p-value from a t-distribution with $n - k - 1$ degrees of freedom (here $32 - 2 - 1 = 29$). Tiny p-values mean the slope is unlikely to be zero by chance alone.
- **Significance codes.** The stars are a visual shortcut: `***` for p < 0.001, `**` for p < 0.01, `*` for p < 0.05, `.` for p < 0.1, blank otherwise.

[KEY INSIGHT]
**The t-value is a signal-to-noise ratio.** Estimate divided by Std. Error asks "how many standard errors away from zero is this effect?" Values above roughly 2 in absolute magnitude are usually worth paying attention to, because they correspond to p-values below 0.05.

Let's verify by computing the t-value and p-value for `wt` from scratch.

```r title="Hand-compute t-value and p-value for wt"
# t = Estimate / Std.Error
t_wt <- coefs["wt", "Estimate"] / coefs["wt", "Std. Error"]
t_wt
#> [1] -6.128695

# Two-sided p-value from t-distribution with df = n - k - 1
df_resid <- fit$df.residual
p_wt     <- 2 * pt(abs(t_wt), df = df_resid, lower.tail = FALSE)
p_wt
#> [1] 1.118685e-06
```

Both numbers match the printed summary to the last decimal. The p-value is `2 * pt(|t|, df, lower.tail = FALSE)` because it's two-sided: we ask "how likely is a t-statistic at least this far from zero in either direction, if the true slope were really 0?" The answer, one in a million, is the p-value.

**Try it:** Reproduce the t-value and p-value for the `hp` row. (Expected: t ≈ -3.519, p ≈ 0.00145.)

```r title="Your turn: verify hp's t and p"
ex_t_hp <- # your code here
ex_p_hp <- # your code here
c(ex_t_hp, ex_p_hp)
#> Expected: c(-3.518712, 0.001451229)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Verify hp's t and p solution"
ex_t_hp <- coefs["hp", "Estimate"] / coefs["hp", "Std. Error"]
ex_p_hp <- 2 * pt(abs(ex_t_hp), df = fit$df.residual, lower.tail = FALSE)
c(ex_t_hp, ex_p_hp)
#> [1] -3.518712265  0.001451229
```

**Explanation:** The same formula works for any predictor in the table. The only things that change are the Estimate and Std. Error for that row.

</details>

## What is the Residual Standard Error and how is it computed?

The `Residual standard error: 2.593 on 29 degrees of freedom` line condenses the residual distribution into one number with a precise meaning. RSE is the estimated standard deviation of the errors, roughly the typical distance between a prediction and the truth in the response variable's units.

The formula is:

$$\text{RSE} = \sqrt{\frac{\text{RSS}}{n - k - 1}}$$

Where:
- RSS is the residual sum of squares, $\sum_i e_i^2$
- $n$ is the number of observations
- $k$ is the number of predictors (excluding the intercept)
- $n - k - 1$ is the residual degrees of freedom

Let's build it from the residuals.

```r title="Compute Residual Standard Error by hand"
rss         <- sum(resids^2)
n           <- nrow(mtcars)
k           <- length(coef(fit)) - 1   # exclude the intercept
df_resid    <- n - k - 1                # matches fit$df.residual
rse_manual  <- sqrt(rss / df_resid)
c(rse_manual = rse_manual, rse_builtin = sigma(fit))
#>  rse_manual rse_builtin
#>    2.593412    2.593412
```

Our `rse_manual` exactly matches `sigma(fit)`, which is R's built-in accessor for the same number. The interpretation: given this model, a typical prediction for `mpg` misses by about 2.6 mpg. Units matter: RSE is always in the response variable's units, which makes it practically meaningful. A smaller RSE, for the same response, means a tighter fit.

[NOTE]
**RSE vs the standard deviation of `y`.** If `sd(mtcars$mpg) = 6.03` and our RSE is 2.59, the model reduced the typical prediction error from 6.03 (using only the mean) to 2.59 (using `wt` and `hp`). That shrinkage is the model's value, expressed in one number.

**Try it:** Fit `lm(Sepal.Length ~ Petal.Length, iris)`, compute its RSE from first principles, and confirm it matches `sigma(fit)`.

```r title="Your turn: RSE on iris"
ex_fit2    <- lm(Sepal.Length ~ Petal.Length, data = iris)
ex_resids2 <- residuals(ex_fit2)
ex_rse     <- # your code here
c(manual = ex_rse, builtin = sigma(ex_fit2))
#> Expected: both values close to 0.4071
```

<details>
<summary>Click to reveal solution</summary>

```r title="RSE on iris solution"
ex_fit2    <- lm(Sepal.Length ~ Petal.Length, data = iris)
ex_resids2 <- residuals(ex_fit2)
ex_rse     <- sqrt(sum(ex_resids2^2) / ex_fit2$df.residual)
c(manual = ex_rse, builtin = sigma(ex_fit2))
#>  manual builtin
#>  0.4071  0.4071
```

**Explanation:** Same formula, different model. The residual degrees of freedom are $150 - 1 - 1 = 148$ here.

</details>

## How do Multiple and Adjusted R-squared differ?

R-squared answers a single question: what fraction of the variance in `y` does our model explain? The total variance of `y` (TSS) is split into explained variance (ESS) and residual variance (RSS), and R² is simply the explained share.

![How total sum of squares splits into explained and residual parts.](screenshots/Interpreting-Regression-Output-Completely-rss-tss.webp)
*Figure 1: Total sum of squares (TSS) splits into explained (ESS) and residual (RSS) parts. R-squared is ESS/TSS. RSE and F-statistic reuse the same building blocks.*

Formally:

$$R^2 = 1 - \frac{\text{RSS}}{\text{TSS}}, \qquad \text{TSS} = \sum_i (y_i - \bar{y})^2$$

Adjusted R² tweaks this to penalise adding predictors just to inflate R². Its formula is:

$$R^2_{\text{adj}} = 1 - \frac{\text{RSS} / (n - k - 1)}{\text{TSS} / (n - 1)}$$

Where the numerator is the residual *variance* (RSE²) and the denominator is the sample variance of `y`. Adding a useless predictor barely shrinks RSS but always costs you one degree of freedom, so $R^2_{\text{adj}}$ goes down unless the predictor pulls real weight.

```r title="Multiple and Adjusted R-squared from scratch"
tss        <- sum((mtcars$mpg - mean(mtcars$mpg))^2)
rss        <- sum(resids^2)
r2_manual  <- 1 - rss / tss
adj_r2     <- 1 - (rss / df_resid) / (tss / (n - 1))
c(r2 = r2_manual, adj_r2 = adj_r2)
#>      r2   adj_r2
#>  0.8268   0.8148

# Compare to the built-ins
c(sm$r.squared, sm$adj.r.squared)
#> [1] 0.8268 0.8148
```

Multiple R² says `wt` and `hp` together explain about **82.7% of the variance** in `mpg`. The Adjusted R² shaves that down to **81.5%** because we spent two predictors' worth of degrees of freedom to get there. The gap between the two numbers is small here because both predictors genuinely help.

[KEY INSIGHT]
**Report Adjusted R² when you have more than one predictor.** Multiple R² can only go up as you add variables, even random noise. Adjusted R² goes up only when a new predictor buys you more explanatory power than it costs in degrees of freedom. That is the honest metric.

**Try it:** Add a random noise column to `mtcars`, refit `mpg ~ wt + hp + noise`, and see what happens to `r.squared` vs `adj.r.squared`.

```r title="Your turn: adding noise inflates R-squared"
set.seed(7)
mtcars_noise <- mtcars
mtcars_noise$noise <- rnorm(nrow(mtcars))
ex_fit3 <- lm(mpg ~ wt + hp + noise, data = mtcars_noise)
# Print the two R-squared numbers:
# your code here
#> Expected: r.squared rises slightly; adj.r.squared falls slightly.
```

<details>
<summary>Click to reveal solution</summary>

```r title="Noise predictor solution"
set.seed(7)
mtcars_noise <- mtcars
mtcars_noise$noise <- rnorm(nrow(mtcars))
ex_fit3 <- lm(mpg ~ wt + hp + noise, data = mtcars_noise)
s3 <- summary(ex_fit3)
c(r2 = s3$r.squared, adj_r2 = s3$adj.r.squared)
#>     r2  adj_r2
#> 0.8272  0.8088
```

**Explanation:** Multiple R² ticked up from 0.8268 to 0.8272 (useless noise still trims RSS by a hair). Adjusted R² fell from 0.8148 to 0.8088. The adjusted metric correctly exposes the waste.

</details>

## What does the F-statistic test?

While each t-value asks "is this one slope zero?", the F-statistic asks the global question: **is any slope non-zero?** Formally, it tests the null hypothesis $H_0: \beta_1 = \beta_2 = \dots = \beta_k = 0$ against the alternative that at least one coefficient is non-zero.

The formula is a ratio of explained variance per predictor to residual variance per degree of freedom:

$$F = \frac{\text{ESS} / k}{\text{RSS} / (n - k - 1)}$$

Where ESS = TSS − RSS is the explained sum of squares. Under the null, this ratio follows an F-distribution with $k$ and $n - k - 1$ degrees of freedom. A big F means the model explains a lot relative to the noise.

```r title="F-statistic and its p-value by hand"
ess       <- tss - rss
f_manual  <- (ess / k) / (rss / df_resid)
f_p       <- pf(f_manual, df1 = k, df2 = df_resid, lower.tail = FALSE)
c(F = f_manual, p = f_p)
#>          F          p
#>  6.921e+01  9.109e-12
```

That matches the printed `F-statistic: 69.21 on 2 and 29 DF, p-value: 9.109e-12`. An F of 69 with a p-value near 10⁻¹¹ is about as far from "no effect anywhere" as you can get, this model reliably explains `mpg`.

[TIP]
**Use the F-statistic before trusting individual t-values.** If the F p-value is large (say > 0.10), don't cherry-pick a single significant predictor, the model as a whole hasn't earned its keep. Conversely, a tiny F p-value plus all-non-significant t-values hints at multicollinearity rather than a useless model.

**Try it:** For a simple one-predictor regression, show that $F = t^2$.

```r title="Your turn: F equals t-squared for a single predictor"
ex_fit4  <- lm(mpg ~ wt, data = mtcars)
ex_s4    <- summary(ex_fit4)
t_slope  <- # your code here
f_stat   <- # your code here
c(t_squared = t_slope^2, F = f_stat)
#> Expected: both values roughly equal
```

<details>
<summary>Click to reveal solution</summary>

```r title="F = t-squared solution"
ex_fit4  <- lm(mpg ~ wt, data = mtcars)
ex_s4    <- summary(ex_fit4)
t_slope  <- coef(ex_s4)["wt", "t value"]
f_stat   <- ex_s4$fstatistic["value"]
c(t_squared = t_slope^2, F = f_stat)
#> t_squared     F.value
#>      91.38    91.38
```

**Explanation:** With one predictor, the global test is the same as the slope-is-zero test. Algebraically, an F-statistic with 1 numerator degree of freedom equals the square of a t-statistic with the same denominator df.

</details>

## How do you extract these numbers programmatically with broom?

`summary()` is designed for humans. When you need these numbers inside a pipeline (a report, a loop, a comparison table), the `broom` package turns the summary into tidy data frames.

```r title="Tidy the coefficient table and fit stats with broom"
library(broom)

tidy_coefs     <- tidy(fit)
glance_stats   <- glance(fit)

tidy_coefs
#> # A tibble: 3 x 5
#>   term        estimate std.error statistic   p.value
#>   <chr>          <dbl>     <dbl>     <dbl>     <dbl>
#> 1 (Intercept)  37.2      1.60       23.3   2.57e-20
#> 2 wt           -3.88     0.633      -6.13  1.12e-06
#> 3 hp           -0.0318   0.00903    -3.52  1.45e-03

glance_stats
#> # A tibble: 1 x 12
#>   r.squared adj.r.squared sigma statistic  p.value    df logLik   AIC
#>       <dbl>         <dbl> <dbl>     <dbl>    <dbl> <dbl>  <dbl> <dbl>
#> 1     0.827         0.815  2.59      69.2 9.11e-12     2  -74.3  157.
```

Every number we decoded in the earlier sections has a named column here: `tidy()` returns the coefficient table as rows, `glance()` returns the one-line fit summary. That makes it trivial to compare models side by side, for example `bind_rows(glance(fit_a), glance(fit_b))`.

[TIP]
**Reach for `broom::glance()` when comparing models.** One row per model means you can stack fits from different formulas, datasets, or subsets into a single data frame, sort by `adj.r.squared` or `AIC`, and pick the winner with `arrange()`. It scales from two models to two hundred.

**Try it:** Pull the Adjusted R² and F-statistic p-value out of `glance(fit)` into a named numeric vector.

```r title="Your turn: extract adj_r_squared and F p-value"
g <- glance(fit)
ex_report <- # your code here, build c(adj_r2 = ..., f_p = ...)
ex_report
#> Expected: adj_r2 ≈ 0.815, f_p ≈ 9.11e-12
```

<details>
<summary>Click to reveal solution</summary>

```r title="Extract fit stats solution"
g <- glance(fit)
ex_report <- c(adj_r2 = g$adj.r.squared, f_p = g$p.value)
ex_report
#>    adj_r2       f_p
#>  0.814809  9.11e-12
```

**Explanation:** `glance()` returns a one-row tibble, so plain `$` indexing grabs the scalar values you want, no list-digging required.

</details>

## Practice Exercises

### Exercise 1: Decode a new model's summary end-to-end

Fit `lm(Sepal.Length ~ Sepal.Width + Petal.Length, iris)`. From its summary, report: (a) the median residual, (b) the t-value for `Sepal.Width`, (c) the Residual Standard Error, (d) Adjusted R-squared, and (e) the overall F-statistic's p-value. Save each to a named element of `my_report`.

```r title="Exercise 1 scaffold"
# Hint: fit the model, then pull each number from summary() or glance()

my_fit    <- lm(Sepal.Length ~ Sepal.Width + Petal.Length, data = iris)
my_report <- c(
  median_resid = NA,
  t_sepal_w    = NA,
  rse          = NA,
  adj_r2       = NA,
  f_p          = NA
)
my_report
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_fit    <- lm(Sepal.Length ~ Sepal.Width + Petal.Length, data = iris)
my_s      <- summary(my_fit)
my_g      <- glance(my_fit)

my_report <- c(
  median_resid = median(residuals(my_fit)),
  t_sepal_w    = coef(my_s)["Sepal.Width", "t value"],
  rse          = my_s$sigma,
  adj_r2       = my_g$adj.r.squared,
  f_p          = my_g$p.value
)
round(my_report, 4)
#> median_resid    t_sepal_w          rse       adj_r2          f_p
#>      -0.0157      10.8994       0.3333       0.8371       0.0000
```

**Explanation:** `summary()` feeds you coefficients and `sigma`; `glance()` hands you the single-row fit stats. Between the two you have every number in the printed summary as data.

</details>

### Exercise 2: Reproduce the summary from first principles

For `lm(mpg ~ wt, mtcars)`, compute the intercept, slope, their standard errors, t-values, p-values, RSE, Multiple R², and F-statistic **using only base R arithmetic** (no `lm`, no `summary`). Compare each result to the actual `lm()` summary at the end.

```r title="Exercise 2 scaffold"
# Hint: X = cbind(1, mtcars$wt), y = mtcars$mpg
# beta_hat = solve(t(X) %*% X) %*% t(X) %*% y
# var(beta_hat) = sigma_squared * solve(t(X) %*% X)

X   <- cbind(1, mtcars$wt)
y   <- mtcars$mpg
n   <- nrow(mtcars)
k   <- 1

# Compute beta_hat, residuals, sigma_squared, SEs, t-values, p-values, R-squared, F
# your code here
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
X        <- cbind(1, mtcars$wt)
y        <- mtcars$mpg
n        <- nrow(mtcars)
k        <- 1
df_res   <- n - k - 1

beta_hat <- solve(t(X) %*% X) %*% t(X) %*% y
y_hat    <- X %*% beta_hat
e        <- y - y_hat
rss_m    <- sum(e^2)
tss_m    <- sum((y - mean(y))^2)
sigma2   <- rss_m / df_res

vcov_b   <- sigma2 * solve(t(X) %*% X)
se_b     <- sqrt(diag(vcov_b))
t_vals   <- as.vector(beta_hat) / se_b
p_vals   <- 2 * pt(abs(t_vals), df_res, lower.tail = FALSE)

rse_m    <- sqrt(sigma2)
r2_m     <- 1 - rss_m / tss_m
ess_m    <- tss_m - rss_m
f_m      <- (ess_m / k) / (rss_m / df_res)

data.frame(
  term     = c("(Intercept)", "wt"),
  est      = round(as.vector(beta_hat), 4),
  se       = round(se_b, 4),
  t        = round(t_vals, 3),
  p        = signif(p_vals, 3)
)
#>         term      est     se       t        p
#> 1 (Intercept)  37.2851  1.8776  19.858 8.24e-19
#> 2          wt  -5.3445  0.5591  -9.559 1.29e-10

c(rse = rse_m, r2 = r2_m, F = f_m)
#>       rse         r2          F
#>  3.045882   0.752832  91.375326

# Compare to summary(lm(mpg ~ wt, mtcars)): every number matches.
```

**Explanation:** OLS has closed-form matrix solutions. `lm()` is just a polished wrapper around these arithmetic steps. Reproducing them once end-to-end makes the summary's numbers feel inevitable rather than magical.

</details>

## Putting It All Together

Now let's replay our `fit` summary one last time and map every printed number to what we computed.

```r title="Annotated end-to-end recap"
fit <- lm(mpg ~ wt + hp, data = mtcars)
summary(fit)
#> Call:                                                              <- the formula you fit
#> lm(formula = mpg ~ wt + hp, data = mtcars)
#>
#> Residuals:                                                         <- 5-number summary of e_i = y_i - yhat_i
#>     Min      1Q  Median      3Q     Max
#> -3.9419 -1.6008 -0.1825  1.0501  5.8537
#>
#> Coefficients:                                                      <- per-predictor table
#>              Estimate   Std. Error    t value     Pr(>|t|)
#> (Intercept) 37.22727      1.59879      23.285    < 2e-16   ***     <- Est/SE = t; pt() for p
#> wt          -3.87783      0.63273      -6.129   1.12e-06   ***
#> hp          -0.03177      0.00903      -3.519    0.00145    **
#> ---
#> Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1
#>
#> Residual standard error: 2.593 on 29 degrees of freedom            <- sqrt(RSS/df); df = n-k-1
#> Multiple R-squared:  0.8268,    Adjusted R-squared:  0.8148        <- 1 - RSS/TSS, with df adjustment
#> F-statistic: 69.21 on 2 and 29 DF,  p-value: 9.109e-12             <- (ESS/k) / (RSS/df); pf() for p
```

Reading this model, the story is clear: `wt` and `hp` together explain about 82.7% of the variance in `mpg`, both predictors contribute well beyond chance, and a typical prediction misses by about 2.6 mpg. Every claim in that sentence is backed by a specific number from the summary, and you now know exactly where each number comes from.

## Summary

Here is the full reference table for the lm() summary output:

| Block | Number | Symbol | Meaning | How computed |
|---|---|---|---|---|
| Call | formula | (none) | The model you fit | Echoed from `lm()` call |
| Residuals | Min, 1Q, Median, 3Q, Max | e_i | Prediction errors distribution | `quantile(residuals(fit))` |
| Coefficients | Estimate | β̂ | Fitted slope (or intercept) | OLS: (XᵀX)⁻¹Xᵀy |
| Coefficients | Std. Error | SE(β̂) | Uncertainty of the estimate | sqrt(diag(σ²(XᵀX)⁻¹)) |
| Coefficients | t value | t | Signal-to-noise ratio | Estimate / Std. Error |
| Coefficients | Pr(>\|t\|) | p | Two-sided p-value | `2*pt(|t|, df, lower.tail=FALSE)` |
| Coefficients | Signif. codes | stars | Quick-glance significance | Derived from Pr(>\|t\|) |
| Fit stats | Residual standard error | σ̂ | Typical prediction error in y-units | sqrt(RSS / (n - k - 1)) |
| Fit stats | degrees of freedom | df | n − k − 1 | `fit$df.residual` |
| Fit stats | Multiple R-squared | R² | Share of TSS explained | 1 − RSS/TSS |
| Fit stats | Adjusted R-squared | R²_adj | R² penalised for predictors | 1 − (RSS/(n-k-1)) / (TSS/(n-1)) |
| Fit stats | F-statistic | F | Global test: any slope ≠ 0? | (ESS/k) / (RSS/(n-k-1)) |
| Fit stats | F p-value | p_F | Tail prob from F-distribution | `pf(F, k, n-k-1, lower.tail=FALSE)` |

![Anatomy of the lm() summary output at a glance.](screenshots/Interpreting-Regression-Output-Completely-anatomy-flow.webp)
*Figure 2: The four blocks of lm() summary and what each one reports.*

[KEY INSIGHT]
**Every number in the summary is a function of residuals, predictors, or both.** Once you internalise that Estimate → SE → t → p is a chain, and that RSE, R² and F are all built from RSS and TSS, reading any new regression output becomes a pattern-match rather than a memorisation task.

## References

1. Kutner, M. H., Nachtsheim, C. J., Neter, J., Li, W. *Applied Linear Statistical Models*, 5th ed. McGraw-Hill. Chapter 2: Inferences in regression. [Link](https://www.mheducation.com/highered/product/applied-linear-statistical-models-kutner-nachtsheim/M9780073108742.html)
2. R Core Team. `summary.lm` reference documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/summary.lm.html)
3. Faraway, J. J. *Linear Models with R*, 2nd Edition. CRC Press. [Link](https://julianfaraway.github.io/faraway/LMR/)
4. James, G., Witten, D., Hastie, T., Tibshirani, R. *An Introduction to Statistical Learning*, Chapter 3: Linear Regression. [Link](https://www.statlearning.com/)
5. broom package documentation. `tidy.lm()` and `glance.lm()` references. [Link](https://broom.tidymodels.org/reference/tidy.lm.html)
6. Fox, J. *Applied Regression Analysis and Generalized Linear Models*, 3rd Edition. Sage. [Link](https://www.john-fox.ca/AppliedRegression/)

## Continue Learning

- [Linear Regression in R](Linear-Regression.html): the broader fit-diagnose-predict workflow once summary interpretation is second nature.
- [Regression Diagnostics in R](Regression-Diagnostics-in-R.html): use residuals and RSE to check model assumptions visually.
- [Linear Regression Assumptions in R](Linear-Regression-Assumptions-in-R.html): the four assumptions whose violations show up first in this summary.
