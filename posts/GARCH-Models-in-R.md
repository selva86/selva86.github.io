---
title: "GARCH Models in R: Volatility Forecasting with rugarch"
slug: "GARCH-Models-in-R"
description: "Fit, interpret and forecast GARCH models in R. Learn what alpha and beta mean, test for ARCH effects, handle leverage, and backtest volatility honestly."
keywords: "GARCH models in R, rugarch, volatility forecasting, GARCH(1,1), ARCH effects, conditional variance, volatility clustering, gjrGARCH, eGARCH, ugarchfit"
auto_link_terms: "GARCH model|GARCH models in R|GARCH(1,1)|rugarch|volatility forecasting|conditional variance|volatility clustering|ARCH effects|leverage effect|gjrGARCH|eGARCH|ARCH-LM test|volatility persistence"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "FR-adva-4"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "GARCH Models"
sidebar_order: "24"
difficulty: "Advanced"
---

<p class="lead">A GARCH model forecasts how volatile a series will be tomorrow by blending three things: a baseline level of variance, how big yesterday's surprise was, and how volatile yesterday already was. In R you fit one with the rugarch package, and this guide builds the model from scratch first so that none of it stays a black box.</p>

Almost every tutorial on this topic hands you `ugarchfit()`, prints a wall of numbers, and moves on. You end up with output you cannot interpret. Here we do it the other way round. You will simulate a GARCH process by hand, write its likelihood function yourself, estimate it with `optim()`, and only then meet the package that does all of it for you. By that point you will be able to read the package output line by line and say what each number is.

Everything uses `EuStockMarkets`, a dataset that ships with R itself. No downloads, no API keys, and the numbers you see below are the numbers you will get.

## Why do stock returns break ordinary time series models?

Regression and ARIMA models rest on a quiet assumption: the typical size of the error stays the same throughout the sample. Financial returns violate that assumption more obviously than almost any other data you will meet. Run the block below and look at the shape of the noise, not its direction.

```r title="Plot daily DAX returns"
# Daily closing prices of the German DAX index, built into R
dax_ret <- as.numeric(diff(log(EuStockMarkets[, "DAX"])) * 100)

plot(dax_ret, type = "l", col = "steelblue",
     main = "Daily DAX log returns (%)",
     xlab = "Trading day", ylab = "Return (%)")

length(dax_ret)
#> [1] 1859
round(head(dax_ret, 5), 3)
#> [1] -0.933 -0.442  0.900 -0.178 -0.468
round(c(mean = mean(dax_ret), sd = sd(dax_ret)), 3)
#>  mean    sd 
#> 0.065 1.030
```

That block turned prices into returns and drew them. The `diff(log(...))` step converts a price series into log returns, which is the standard way to measure a percentage change, and multiplying by 100 puts everything in percentage points. So a value of `-0.933` means the index fell about 0.93% that day.

Now look at the picture. The series is not a uniform band of noise. There are long stretches where the line barely moves, and then bursts where it swings far in both directions for weeks at a time. Big moves arrive next to other big moves. Calm days arrive next to other calm days. That bunching is called **volatility clustering**, and it is the single fact this whole article exists to model.

Let us put a number on it by comparing an early calm stretch to a later turbulent one.

```r title="Compare calm and turbulent windows"
calm  <- dax_ret[1:250]
rough <- dax_ret[1550:1800]

round(c(calm_sd = sd(calm), rough_sd = sd(rough)), 3)
#>  calm_sd rough_sd 
#>    0.930    1.492
round(sd(rough) / sd(calm), 2)
#> [1] 1.6
```

Both windows come from the same index and both are 250-ish trading days long. Yet a typical day in the second window swings 1.6 times as far as a typical day in the first. A model that assumes one fixed standard deviation for the whole sample has to split the difference, and will be wrong in both periods: too high during the calm stretch, too low during the turbulent one.

Here is the part that surprises most people. The *direction* of returns really is close to unpredictable, exactly as the efficient-market story claims. It is the *size* that is predictable. We can show both at once by comparing the autocorrelation of returns with the autocorrelation of squared returns.

```r title="Autocorrelation of returns vs squared returns"
acf_raw <- acf(dax_ret, lag.max = 10, plot = FALSE)
acf_sq  <- acf(dax_ret^2, lag.max = 10, plot = FALSE)

round(data.frame(lag = 1:10,
                 returns = as.numeric(acf_raw$acf)[-1],
                 squared_returns = as.numeric(acf_sq$acf)[-1]), 4)
#>    lag returns squared_returns
#> 1    1 -0.0004          0.0789
#> 2    2 -0.0267          0.1713
#> 3    3 -0.0105          0.0735
#> 4    4  0.0003          0.0776
#> 5    5 -0.0317          0.0529
#> 6    6  0.0022          0.0472
#> 7    7 -0.0296          0.0636
#> 8    8 -0.0087          0.0351
#> 9    9  0.0233          0.0166
#> 10  10  0.0089          0.0427
```

An autocorrelation measures how much today's value tells you about the value some days later, on a scale from -1 to 1, where 0 means "nothing at all". Read down the two columns. The `returns` column hovers around zero: yesterday's return tells you essentially nothing about today's. The `squared_returns` column is positive at every single lag and reaches 0.17. Squaring throws away the sign and keeps only the magnitude, so that column is asking "does a big move yesterday predict a big move today?" The answer is a clear yes.

[KEY INSIGHT]
**Returns are unpredictable in direction but highly predictable in size.** That single gap is the entire subject of this article. GARCH ignores the first column, which nobody can forecast, and models the second column, which is strongly forecastable.

**Try it:** Check whether the same calm-versus-turbulent pattern shows up in the UK's FTSE index. Build FTSE log returns the same way, then compute the ratio of the standard deviations over the same two windows.

```r title="Your turn: FTSE volatility ratio"
ex_ftse <- as.numeric(diff(log(EuStockMarkets[, "FTSE"])) * 100)

# your code here: compute sd of ex_ftse[1:250], sd of ex_ftse[1550:1800],
# and the ratio of the second to the first

# Expected: three numbers, with the ratio above 1
```

<details>
<summary>Click to reveal solution</summary>

```r title="FTSE volatility ratio solution"
ex_ftse <- as.numeric(diff(log(EuStockMarkets[, "FTSE"])) * 100)
round(c(calm_sd = sd(ex_ftse[1:250]),
        rough_sd = sd(ex_ftse[1550:1800]),
        ratio = sd(ex_ftse[1550:1800]) / sd(ex_ftse[1:250])), 3)
#>  calm_sd rough_sd    ratio 
#>    0.814    1.020    1.254
```

**Explanation:** The FTSE shows the same effect as the DAX but milder, a ratio of 1.25 against the DAX's 1.6. Volatility clustering is a property of markets in general, though its strength varies from index to index.

</details>

## What exactly is a GARCH model?

The name is an acronym worth unpacking, because each letter is a real design decision:

- **Conditional Heteroskedasticity** means the variance changes over time, and that we are modelling it *conditional* on what we already saw. "Heteroskedasticity" is just the technical word for "non-constant variance".
- **Autoregressive** means today's variance depends on its own past values.
- **Generalized** means we let it depend on past variances, not only on past shocks.

A GARCH model has two separate equations, and keeping them separate is the key to not getting lost. The **mean equation** describes the return itself, and it is usually almost trivial:

$$r_t = \mu + \varepsilon_t, \qquad \varepsilon_t = \sigma_t z_t, \qquad z_t \sim D(0, 1)$$

The **variance equation** is where all the action is. This is GARCH(1,1), the workhorse:

$$\sigma_t^2 = \omega + \alpha_1 \varepsilon_{t-1}^2 + \beta_1 \sigma_{t-1}^2$$

Where:

- $r_t$ = the return on day $t$
- $\mu$ = the average return, typically tiny for daily data
- $\varepsilon_t$ = the surprise, or shock, on day $t$, meaning how far the return landed from its average
- $\sigma_t$ = the volatility on day $t$, which is what we forecast
- $z_t$ = a standardised random draw with mean 0 and variance 1
- $D$ = the distribution those draws come from, which you choose when you fit the model. A normal distribution is the default; we will see later why a fatter-tailed one usually fits returns better
- $\omega$ (omega) = a constant baseline level of variance
- $\alpha_1$ (alpha) = how strongly yesterday's shock feeds into today's variance
- $\beta_1$ (beta) = how much of yesterday's variance carries over

The `(1,1)` counts how many past terms of each kind we use: one past shock, one past variance. In plain words, the variance equation says: **today's variance is a baseline, plus a bit of yesterday's surprise, plus most of yesterday's variance.**

![Diagram showing tomorrow's variance built from a baseline omega, yesterday's squared shock weighted by alpha, and yesterday's variance weighted by beta](screenshots/GARCH-Models-in-R-variance-recursion.webp)

*Figure 1: Tomorrow's variance is a weighted blend of three things: a baseline, yesterday's shock, and yesterday's variance.*

The parameters are not free to be anything. All three must be non-negative, otherwise the model could predict a negative variance, which is meaningless. And $\alpha_1 + \beta_1$ must stay below 1, for a reason we will see shortly.

The clearest way to understand a recursion is to run it. Below we generate a GARCH(1,1) series ourselves, one day at a time, with parameters we choose.

```r title="Simulate a GARCH(1,1) series by hand"
set.seed(2024)
n <- 1500
omega <- 0.05; alpha <- 0.10; beta <- 0.85

z <- rnorm(n)                 # the standardised random draws
sigma2 <- numeric(n)          # variance on each day
eps    <- numeric(n)          # the actual shock on each day

sigma2[1] <- omega / (1 - alpha - beta)   # start at the long-run level
eps[1]    <- sqrt(sigma2[1]) * z[1]

for (t in 2:n) {
  sigma2[t] <- omega + alpha * eps[t - 1]^2 + beta * sigma2[t - 1]
  eps[t]    <- sqrt(sigma2[t]) * z[t]
}

round(head(data.frame(t = 1:6, sigma2 = sigma2[1:6],
                      sigma = sqrt(sigma2[1:6]), eps = eps[1:6]), 6), 4)
#>   t sigma2  sigma     eps
#> 1 1 1.0000 1.0000  0.9820
#> 2 2 0.9964 0.9982  0.4679
#> 3 3 0.9189 0.9586 -0.1035
#> 4 4 0.8321 0.9122 -0.1942
#> 5 5 0.7611 0.8724  1.0103
#> 6 6 0.7990 0.8938  1.1552
```

The loop is the model. On each pass it computes today's variance from yesterday's shock and yesterday's variance, then draws today's shock by scaling a standard random number by today's volatility. Follow rows 2 to 4 in the output: the shocks are small, so `sigma2` drifts steadily downward. Then row 5 delivers a shock of 1.01, and `sigma2` turns around and climbs at row 6. That is volatility clustering, produced by the recursion rather than assumed.

Let us open up a single step to see the three contributions separately.

```r title="Decompose one step of the recursion"
round(c(omega      = omega,
        shock_term = alpha * eps[999]^2,
        carry      = beta * sigma2[999],
        total      = sigma2[1000]), 4)
#>      omega shock_term      carry      total 
#>     0.0500     0.2179     0.9177     1.1855
```

The three pieces add to the total, and notice how lopsided the split is. The carried-over variance contributes 0.918 while yesterday's fresh news contributes only 0.218. With `beta` at 0.85, volatility mostly remembers. New information nudges the level; it rarely resets it. That is why volatility drifts in long waves instead of jumping around at random.

Now the reason $\alpha_1 + \beta_1 < 1$ matters. That sum is called **persistence**, and it controls whether the process settles down to a stable long-run variance:

$$\text{Unconditional variance} = \frac{\omega}{1 - \alpha_1 - \beta_1}$$

```r title="Check the long-run variance formula"
round(c(formula_var = omega / (1 - alpha - beta),
        simulated_var = var(eps)), 4)
#> formula_var simulated_var 
#>      1.0000        0.8163
round(c(persistence = alpha + beta), 4)
#> persistence 
#>        0.95
```

With persistence at 0.95 the formula predicts a long-run variance of exactly 1.0, and our 1,500 simulated days delivered 0.82. The gap is ordinary sampling variation: a highly persistent process wanders slowly, so 1,500 days is not a lot of independent information about its average level. Push the simulation to 100,000 days and the two numbers converge.

[NOTE]
**Persistence at or above 1 breaks the model.** If alpha plus beta reaches 1 there is no finite long-run variance, shocks never fade, and the formula above divides by zero. That boundary case has its own name, IGARCH, and we return to it in the pitfalls section.

**Try it:** Two GARCH processes can share the same persistence but behave completely differently. Simulate one that reacts hard to news (alpha 0.25, beta 0.70) and one that mostly remembers (alpha 0.05, beta 0.90), then compare how much each one's volatility path bounces around, measured by the standard deviation of sigma itself.

```r title="Your turn: spiky vs smooth volatility"
ex_sim_garch <- function(n, omega, alpha, beta) {
  z <- rnorm(n); s2 <- numeric(n); e <- numeric(n)
  s2[1] <- omega / (1 - alpha - beta); e[1] <- sqrt(s2[1]) * z[1]
  for (t in 2:n) {
    s2[t] <- omega + alpha * e[t - 1]^2 + beta * s2[t - 1]
    e[t]  <- sqrt(s2[t]) * z[t]
  }
  sqrt(s2)                      # returns the volatility path
}

set.seed(99)
# your code here: call ex_sim_garch twice with the two parameter sets
# above (n = 1500, omega = 0.05) and compare sd() of each path

# Expected: the high-alpha path has a much larger sd
```

<details>
<summary>Click to reveal solution</summary>

```r title="Spiky vs smooth solution"
set.seed(99)
spiky  <- ex_sim_garch(1500, 0.05, 0.25, 0.70)
smooth <- ex_sim_garch(1500, 0.05, 0.05, 0.90)

round(c(spiky_sd_of_sigma = sd(spiky), smooth_sd_of_sigma = sd(smooth)), 4)
#>  spiky_sd_of_sigma smooth_sd_of_sigma 
#>             0.4281             0.1408
```

**Explanation:** Both have persistence 0.95 and the same long-run variance, yet the volatility path of the first is three times as jumpy. Alpha controls how violently the model reacts to news; beta controls how long it remembers. Persistence alone does not tell you the character of the process.

</details>

## How do you test whether your returns actually need a GARCH model?

Fitting GARCH to data with no volatility clustering wastes parameters and can mislead you. So test first. There are two tests worth running, and the crucial thing is that they answer **different questions**.

The Ljung-Box test asks whether a series has any leftover autocorrelation. Run it on returns and it asks about predictable direction. Run it on *squared* returns and it asks about predictable size.

```r title="Ljung-Box on returns and squared returns"
Box.test(dax_ret, lag = 10, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  dax_ret
#> X-squared = 6.3656, df = 10, p-value = 0.7837
#> 
Box.test(dax_ret^2, lag = 10, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  dax_ret^2
#> X-squared = 110.75, df = 10, p-value < 2.2e-16
```

A p-value is the probability of seeing a pattern this strong if there were really no pattern at all. Small p-value means the pattern is real. The first test returns 0.78, so there is no evidence of predictable direction, and we do not need an elaborate mean model. The second returns a number smaller than R will print, so the evidence for predictable *magnitude* is overwhelming. That contrast is the green light for GARCH.

The second test is the **ARCH-LM test**, and it is worth building yourself because the idea is only one line of statistics. If big shocks cluster, then a squared shock should be predictable from recent squared shocks. So regress squared deviations on their own lags and check whether that regression explains anything. The test statistic is the number of observations times the regression's R-squared, and it follows a chi-squared distribution.

```r title="Build the ARCH-LM test from scratch"
arch_lm <- function(x, lags = 5) {
  e2 <- (x - mean(x))^2          # squared deviations from the mean
  n  <- length(e2)
  Y  <- e2[(lags + 1):n]                                        # today
  X  <- sapply(1:lags, function(k) e2[(lags + 1 - k):(n - k)])  # the last few days
  r2 <- summary(lm(Y ~ X))$r.squared
  stat <- length(Y) * r2
  c(LM_statistic = stat, df = lags,
    p_value = pchisq(stat, df = lags, lower.tail = FALSE))
}

round(arch_lm(dax_ret, lags = 5), 4)
#> LM_statistic           df      p_value 
#>      69.7109       5.0000       0.0000
```

The function squares the deviations, lines up each day against its previous five days, fits an ordinary linear regression, and converts the fit quality into a test statistic. An LM statistic of 69.7 against 5 degrees of freedom gives a p-value indistinguishable from zero. The DAX has ARCH effects, decisively.

Any test that always says yes is useless, so let us feed it data that genuinely has no clustering.

```r title="Run the same test on pure noise"
set.seed(7)
round(arch_lm(rnorm(1859), lags = 5), 4)
#> LM_statistic           df      p_value 
#>       2.2456       5.0000       0.8142
```

Same function, same sample size, but the data are independent random draws with genuinely constant variance. The statistic collapses to 2.2 and the p-value is 0.81. The test correctly finds nothing. Now you can trust it on real data.

[TIP]
**Always run the Ljung-Box test on both the returns and their squares.** The first tells you whether you need a mean model such as ARMA, the second tells you whether you need a variance model such as GARCH. Many published tutorials run only one and quietly assume the answer to the other.

**Try it:** Apply your `arch_lm()` function to the FTSE returns you built earlier. Does the UK index also need a GARCH model?

```r title="Your turn: ARCH-LM on the FTSE"
# your code here: call arch_lm() on ex_ftse with 5 lags

# Expected: a large statistic and a p-value near zero
```

<details>
<summary>Click to reveal solution</summary>

```r title="ARCH-LM on the FTSE solution"
round(arch_lm(ex_ftse, lags = 5), 4)
#> LM_statistic           df      p_value 
#>      43.9201       5.0000       0.0000
```

**Explanation:** The statistic is 43.9, smaller than the DAX's 69.7 but still far beyond any reasonable cutoff. The FTSE has weaker but unmistakable ARCH effects, consistent with the milder clustering ratio we measured earlier.

</details>

## How do you estimate the parameters, and what do they mean?

There is no formula that hands you omega, alpha and beta the way least squares hands you a regression slope. They have to be found by search, using **maximum likelihood**.

The idea is more intuitive than the name suggests. Pick candidate values for the three parameters. Run the variance recursion forward through your data, which gives a predicted volatility for every single day. Then ask: how plausible do the returns we actually observed look under those predicted volatilities? A day with a 3% move looks perfectly ordinary if the model predicted high volatility, and looks shocking if the model predicted calm. Score every day that way, add up the scores, and keep searching for the parameters that make the observed data look least surprising overall.

For normally distributed shocks the score for one day, written as a negative log-likelihood so that smaller is better, is:

$$-\ell_t = \frac{1}{2}\left[\log(2\pi) + \log(\sigma_t^2) + \frac{\varepsilon_t^2}{\sigma_t^2}\right]$$

The last term is the one doing the work: it is the squared shock measured in units of the model's own predicted variance. The middle term is a penalty that stops the model from simply declaring every day enormously volatile to make the last term small.

One practical wrinkle. The optimiser wanders freely over all real numbers, but our parameters must stay positive and their sum below 1. Rather than fight it with constraints, we let the optimiser work on unconstrained numbers and squeeze them into the legal range: `exp()` forces omega positive, and `plogis()` maps anything onto the interval from 0 to 1. The third line multiplies that second `plogis()` result by `1 - alpha`, which is what guarantees `alpha + beta` stays below 1: whatever fraction beta takes, it can only take it out of the room alpha left over.

```r title="Write the GARCH likelihood and optimise it"
garch_nll <- function(par, r) {
  omega <- exp(par[1])                    # forced positive
  alpha <- plogis(par[2])                 # forced into (0, 1)
  beta  <- plogis(par[3]) * (1 - alpha)   # forced so that alpha + beta < 1

  e  <- r - mean(r)
  s2 <- numeric(length(e))
  s2[1] <- var(e)                         # start at the sample variance
  for (t in 2:length(e)) {
    s2[t] <- omega + alpha * e[t - 1]^2 + beta * s2[t - 1]
  }
  0.5 * sum(log(2 * pi) + log(s2) + e^2 / s2)
}

opt <- optim(c(log(0.05), qlogis(0.10), qlogis(0.9)), garch_nll,
             r = dax_ret, method = "BFGS", control = list(maxit = 500))

est_alpha <- plogis(opt$par[2])
round(c(omega = exp(opt$par[1]),
        alpha = est_alpha,
        beta  = plogis(opt$par[3]) * (1 - est_alpha)), 6)
#>    omega    alpha     beta 
#> 0.047493 0.068368 0.887705
round(-opt$value, 4)
#> [1] -2594.797
```

That is a complete GARCH estimator in about a dozen lines. The function runs the variance recursion for a candidate parameter set and returns the total negative log-likelihood; `optim()` searches until it cannot lower that number further. The result says the DAX has alpha near 0.068 and beta near 0.888, and the best achievable log-likelihood is -2594.797. Hold on to that number, because we are going to see it again.

In practice you would not hand-roll this every time. The `tseries` package fits the same model in one line.

```r title="Fit the same model with tseries"
suppressMessages(library(tseries))

dax_c <- dax_ret - mean(dax_ret)          # work with deviations from the mean
g <- garch(dax_c, order = c(1, 1), trace = FALSE)

round(coef(g), 6)
#>       a0       a1       b1 
#> 0.047462 0.068377 0.887741
round(confint(g), 6)
#>       2.5 %   97.5 %
#> a0 0.032197 0.062727
#> a1 0.046593 0.090160
#> b1 0.855071 0.920410
```

Here `a0` is omega, `a1` is alpha and `b1` is beta. Compare them to what our own function found: 0.047462 against 0.047493, 0.068377 against 0.068368, 0.887741 against 0.887705. They agree to four decimal places. The confidence intervals confirm all three parameters are comfortably away from zero, so every term in the model is earning its place.

[KEY INSIGHT]
**Your twelve-line function and a published R package found the same answer.** GARCH estimation is not magic, it is a recursion inside an optimiser. Once you have seen that, the package output stops being intimidating and becomes a convenience.

**Try it:** Fit a GARCH(1,1) to the FTSE returns with `tseries::garch()` and report the persistence, meaning `a1 + b1`.

```r title="Your turn: fit GARCH to the FTSE"
# your code here: centre ex_ftse, fit garch(), then add a1 and b1

# Expected: persistence close to 0.99
```

<details>
<summary>Click to reveal solution</summary>

```r title="FTSE GARCH fit solution"
ex_gf <- garch(ex_ftse - mean(ex_ftse), order = c(1, 1), trace = FALSE)
round(coef(ex_gf), 6)
#>       a0       a1       b1 
#> 0.008484 0.045010 0.942516
round(unname(coef(ex_gf)["a1"] + coef(ex_gf)["b1"]), 4)
#> [1] 0.9875
```

**Explanation:** The FTSE has persistence of 0.9875 against the DAX's 0.956. Its volatility has a much longer memory, which we will quantify as a half-life in the next section.

</details>

### What do omega, alpha and beta actually mean?

Fitting the model hands you three numbers. Left as numbers they are not much use, so here is the practical reading of each.

- **alpha is reactivity.** How much does the model raise today's variance in response to yesterday's news? Higher alpha means a spikier, more headline-driven volatility path.
- **beta is memory.** How much of yesterday's volatility survives into today? Higher beta means longer, smoother waves.
- **omega is the anchor.** It sets the floor that stops volatility decaying to zero during long calm spells.

From those three you can compute three quantities that a risk manager actually cares about.

**Persistence**, $\alpha_1 + \beta_1$, says what fraction of a volatility shock is still present one day later. **Half-life** converts that into a human timescale: how many days until a volatility shock has half faded.

$$\text{half-life} = \frac{\log(0.5)}{\log(\alpha_1 + \beta_1)}$$

**Long-run volatility** is the level the model drifts back toward, the square root of $\omega / (1 - \alpha_1 - \beta_1)$.

```r title="Translate coefficients into risk quantities"
cf <- coef(g)
persistence <- unname(cf["a1"] + cf["b1"])

round(c(persistence = persistence,
        long_run_var = unname(cf["a0"]) / (1 - persistence),
        long_run_sd  = sqrt(unname(cf["a0"]) / (1 - persistence)),
        half_life    = log(0.5) / log(persistence)), 4)
#>  persistence long_run_var  long_run_sd    half_life 
#>       0.9561       1.0816       1.0400      15.4463
round(sd(dax_ret), 4)
#> [1] 1.0301
```

Read that as four sentences. Persistence of 0.956 means 96% of today's volatility shock is still there tomorrow. The long-run daily volatility the model settles toward is 1.04%, and the plain sample standard deviation of the data is 1.03%, so the model's implied long-run level agrees with the raw data, which is a good sanity check. And a volatility shock takes about 15 trading days, three calendar weeks, to half fade.

That last number is the useful one. If the market spikes today, this model says the elevated risk is still half with you three weeks from now. The half-life is very sensitive to persistence though, so it is worth seeing how fast it grows as persistence approaches 1.

```r title="How half-life explodes near persistence of one"
half_life <- function(p) log(0.5) / log(p)

round(c(p_0.95 = half_life(0.95),
        p_0.99 = half_life(0.99),
        p_0.999 = half_life(0.999)), 2)
#>  p_0.95  p_0.99 p_0.999 
#>   13.51   68.97  692.80
```

Moving persistence from 0.95 to 0.99, a change that looks trivial on the page, stretches the half-life from about two and a half weeks to about three months. From 0.99 to 0.999 stretches it to nearly three years. This is why you should never eyeball persistence and call it "roughly one".

[TIP]
**Sanity-check your estimates against typical values.** For daily equity index returns, alpha usually lands between 0.05 and 0.12, beta between 0.85 and 0.93, and persistence between 0.97 and 0.99. Our DAX fit sits right in that band. Estimates far outside it usually mean a data problem rather than an exotic market.

**Try it:** The FTSE fit gave persistence of 0.9875. Use the `half_life()` function to convert that into days, and compare it with the DAX's 15.4.

```r title="Your turn: FTSE shock half-life"
# your code here: call half_life() on 0.9875

# Expected: about 55 days
```

<details>
<summary>Click to reveal solution</summary>

```r title="FTSE half-life solution"
round(half_life(0.9875), 2)
#> [1] 55.1
```

**Explanation:** A shock to FTSE volatility takes about 55 trading days, roughly eleven weeks, to half fade, against three weeks for the DAX. The two indices need very different risk horizons even though their persistence figures look superficially similar.

</details>

## How do you fit and check a GARCH model with rugarch?

Everything so far ran on base R plus `tseries`. For real work you want **rugarch**, which supports asymmetric models, non-normal shock distributions, forecasting and backtesting in one consistent interface.

[NOTE]
**The rugarch blocks below are marked to run locally, not in the browser.** rugarch depends on compiled libraries that the in-browser R engine cannot load. Install it once with `install.packages("rugarch")` in RStudio and paste the code there. Every output shown below is real output captured from an actual run against the same DAX data, so the numbers will match what you get.

A rugarch model is built in two moves: describe the model with `ugarchspec()`, then fit that description to data with `ugarchfit()`. The specification has three parts, matching the equations from earlier.

```r-static title="Specify a GARCH(1,1) model"
suppressMessages(library(rugarch))

spec <- ugarchspec(
  variance.model     = list(model = "sGARCH", garchOrder = c(1, 1)),
  mean.model         = list(armaOrder = c(0, 0), include.mean = TRUE),
  distribution.model = "norm"
)
spec
#> 
#> *---------------------------------*
#> *       GARCH Model Spec          *
#> *---------------------------------*
#> 
#> Conditional Variance Dynamics 	
#> ------------------------------------
#> GARCH Model		: sGARCH(1,1)
#> Variance Targeting	: FALSE 
#> 
#> Conditional Mean Dynamics
#> ------------------------------------
#> Mean Model		: ARFIMA(0,0,0)
#> Include Mean		: TRUE 
#> GARCH-in-Mean		: FALSE 
#> 
#> Conditional Distribution
#> ------------------------------------
#> Distribution	:  norm 
#> Includes Skew	:  FALSE 
#> Includes Shape	:  FALSE 
#> Includes Lambda	:  FALSE
```

`variance.model` picks the variance equation, where `"sGARCH"` means standard GARCH. `mean.model` describes the return equation, where `armaOrder = c(0, 0)` says "just a constant mean". `distribution.model` chooses the shape of the random draws.

[WARNING]
**The default armaOrder is c(1,1), not c(0,0).** If you omit `mean.model` entirely, rugarch silently fits an ARMA(1,1) mean equation you never asked for, adding two parameters and changing every coefficient. Our Ljung-Box test on returns gave p = 0.78, meaning there is no mean structure to model, so specifying `c(0, 0)` is the correct and deliberate choice here.

Now fit it.

```r-static title="Fit the model and read the parameters"
fit <- ugarchfit(spec = spec, data = dax_ret, solver = "hybrid")

round(fit@fit$matcoef, 6)
#>         Estimate  Std. Error   t value Pr(>|t|)
#> mu      0.065353    0.021576  3.028967 0.002454
#> omega   0.047563    0.012813  3.712129 0.000206
#> alpha1  0.068454    0.014975  4.571263 0.000005
#> beta1   0.887569    0.023897 37.141671 0.000000
```

Four columns, and each has a job. `Estimate` is the fitted value. `Std. Error` measures how precisely it was pinned down. `t value` is the estimate divided by its standard error. `Pr(>|t|)` is the p-value: the probability of an estimate this large if the true parameter were zero. All four p-values are tiny, so every parameter is doing real work.

Now compare with what we computed by hand: omega 0.047563 against our 0.047493, alpha1 0.068454 against 0.068368, beta1 0.887569 against 0.887705. And rugarch reports a log-likelihood of -2594.796 against our `optim` result of -2594.797. So `ugarchfit()` is running the same estimation your own function ran, with a better optimiser and a lot more bookkeeping around it.

The extra parameter, `mu` at 0.0654, is the average daily return the mean equation estimates. It matches the raw average of 0.065 we printed in the very first code block.

**Try it:** Without running anything, answer two questions. Which argument would you change to fit a GARCH(2,1) instead of a GARCH(1,1)? And which argument stops rugarch from silently adding an ARMA(1,1) mean equation?

<details>
<summary>Click to reveal solution</summary>

```r-static title="GARCH(2,1) specification"
spec_21 <- ugarchspec(
  variance.model = list(model = "sGARCH", garchOrder = c(2, 1)),
  mean.model     = list(armaOrder = c(0, 0), include.mean = TRUE)
)
```

**Explanation:** `garchOrder = c(2, 1)` sets two ARCH terms and one GARCH term, adding an `alpha2` parameter. Setting `armaOrder = c(0, 0)` explicitly is what suppresses the ARMA(1,1) default. In practice GARCH(1,1) is very hard to beat, and higher orders usually add parameters without improving fit.

</details>

### How do you check whether the fitted model is any good?

A model that fits is not the same as a model that is right. The check is simple in principle: if the model captured the volatility dynamics correctly, then dividing each shock by the volatility the model predicted for that day should leave behind something with no structure at all.

Those rescaled shocks are called **standardized residuals**. If the model worked, their squares should show no remaining autocorrelation. We can test that live on our `tseries` fit. One housekeeping detail in the code below: `fitted(g)` returns the model's estimated volatility for each day, and its first entry is `NA` because the recursion needs a previous day to start from, so `na.omit()` drops that one row.

```r title="Test the standardized residuals"
z_t <- as.numeric(dax_c / fitted(g)[, 1])   # shock divided by predicted volatility

Box.test(na.omit(z_t)^2, lag = 10, type = "Ljung-Box")
#> 
#> 	Box-Ljung test
#> 
#> data:  na.omit(z_t)^2
#> X-squared = 0.89364, df = 10, p-value = 0.9999
```

Recall that the *same test on the raw squared returns* gave a statistic of 110.75 and a p-value below 2.2e-16. After the GARCH model has done its work, the statistic collapses to 0.89 and the p-value is 0.9999. All that clustering has been absorbed. There is nothing left in the magnitudes for another variance model to find.

rugarch runs a whole battery of these checks automatically. `show(fit)` prints a long report; the diagnostic sections are reproduced below, with the coefficient table and information criteria left out since we have already seen them.

```r-static title="Read the rugarch diagnostic battery"
show(fit)
#> Weighted Ljung-Box Test on Standardized Residuals
#> ------------------------------------
#>                         statistic p-value
#> Lag[1]                     0.1997  0.6550
#> Lag[2*(p+q)+(p+q)-1][2]    0.3475  0.7699
#> 
#> Weighted Ljung-Box Test on Standardized Squared Residuals
#> ------------------------------------
#>                         statistic p-value
#> Lag[1]                     0.1255  0.7231
#> Lag[2*(p+q)+(p+q)-1][5]    0.3366  0.9797
#> 
#> Weighted ARCH LM Tests
#> ------------------------------------
#>             Statistic Shape Scale P-Value
#> ARCH Lag[3]   0.01578 0.500 2.000  0.9000
#> ARCH Lag[5]   0.32054 1.440 1.667  0.9348
#> 
#> Sign Bias Test
#> ------------------------------------
#>                    t-value   prob sig
#> Sign Bias           1.4183 0.1563    
#> Negative Sign Bias  0.8066 0.4200    
#> Joint Effect        4.2421 0.2365    
#> 
#> Adjusted Pearson Goodness-of-Fit Test:
#> ------------------------------------
#>   group statistic p-value(g-1)
#> 1    20     97.12    1.776e-12
#> 2    30    132.02    4.270e-15
```

Here is what each block asks, and what you do when it fails:

| Test | Question it answers | If the p-value is small |
|---|---|---|
| Ljung-Box on standardized residuals | Is there leftover structure in the **direction** of returns? | Add or extend the ARMA mean model |
| Ljung-Box on squared standardized residuals | Is there leftover structure in the **size** of returns? | Increase the GARCH order |
| Weighted ARCH-LM | Same question, different construction | Increase the GARCH order |
| Sign Bias | Do up-moves and down-moves affect variance **differently**? | Switch to an asymmetric model |
| Adjusted Pearson | Does the assumed **distribution** match the residuals? | Change the distribution, not the variance model |

Now read our results against that table. Every test about variance structure passes comfortably, with p-values from 0.65 to 0.98. The Sign Bias test gives 0.1563, above the usual 0.05 cutoff, so it does not demand an asymmetric model. But the Adjusted Pearson test returns 1.776e-12, an emphatic rejection.

[KEY INSIGHT]
**This model has captured the dynamics and failed the distribution.** The variance equation is fine, so do not go looking for a fancier one. What is broken is the assumption that the shocks are normally distributed. The diagnostics have told us exactly which knob to turn, and we turn it two sections from now.

**Try it:** Explain in one sentence why the p-value of 0.9999 in the live block above is good news rather than suspicious. What would a p-value of 0.001 have meant?

<details>
<summary>Click to reveal solution</summary>

A large p-value here means the test found no evidence of leftover autocorrelation in the squared standardized residuals, which is exactly what we want: the GARCH model has absorbed the volatility clustering. A p-value of 0.001 would have meant clustering remained even after fitting, telling us the variance equation was too simple and needed a higher order or a different form.

Note that this is one of the rare situations in statistics where you are hoping to fail to reject the null hypothesis. You are not proving the model correct, only failing to find a specific fault.

</details>

## Which model variant and which distribution should you choose?

The diagnostics left us with two open questions, and this section answers both. The first is whether the variance equation should treat a fall and a rise of the same size differently. The second is what shape the shocks themselves follow, which is the one thing the DAX model clearly got wrong.

### Why do crashes hit harder than rallies?

Standard GARCH has a blind spot that is obvious once you see it. In the equation $\sigma_t^2 = \omega + \alpha_1 \varepsilon_{t-1}^2 + \beta_1 \sigma_{t-1}^2$, the shock enters **squared**. Squaring destroys the sign. So a 5% crash and a 5% rally push tomorrow's variance up by exactly the same amount.

Markets do not behave that way. A crash frightens people, and fear raises volatility far more than an equally sized rally does. This asymmetry is called the **leverage effect**, and two model variants exist to capture it.

**GJR-GARCH** adds a term that only switches on for negative shocks:

$$\sigma_t^2 = \omega + \alpha_1 \varepsilon_{t-1}^2 + \gamma_1 I_{[\varepsilon_{t-1} < 0]}\varepsilon_{t-1}^2 + \beta_1 \sigma_{t-1}^2$$

where $I$ is 1 when yesterday's shock was negative and 0 otherwise. A positive $\gamma_1$ means bad news adds extra variance on top of the usual amount.

**EGARCH** takes a different route. It models the *logarithm* of the variance, which means the variance is automatically positive no matter what the parameters do, so no non-negativity constraints are needed at all. That makes it the better choice when a constrained standard model keeps hitting its boundaries.

![Decision flowchart: fit sGARCH with normal errors, check the sign bias test to decide on a leverage term, then check normality to decide on Student t innovations](screenshots/GARCH-Models-in-R-model-choice.webp)

*Figure 2: Let the diagnostic tests, not trial and error, pick your specification.*

Let us fit the GJR version to the DAX.

```r-static title="Fit a GJR-GARCH with a leverage term"
spec_gjr <- ugarchspec(
  variance.model     = list(model = "gjrGARCH", garchOrder = c(1, 1)),
  mean.model         = list(armaOrder = c(0, 0), include.mean = TRUE),
  distribution.model = "norm"
)
fit_gjr <- ugarchfit(spec_gjr, dax_ret, solver = "hybrid")

round(fit_gjr@fit$matcoef, 6)
#>         Estimate  Std. Error   t value Pr(>|t|)
#> mu      0.058375    0.021918  2.663338 0.007737
#> omega   0.053992    0.014247  3.789642 0.000151
#> alpha1  0.044245    0.015832  2.794590 0.005197
#> beta1   0.882691    0.023969 36.826536 0.000000
#> gamma1  0.043548    0.023312  1.868090 0.061749
```

`gamma1` is positive at 0.0435, the direction the leverage story predicts, but its p-value is 0.0617, which sits just above the conventional 0.05 threshold. Combined with the Sign Bias test result of 0.1563, the honest reading is that the evidence for asymmetry in this sample is suggestive but not conclusive. Keep that thought, because it changes shortly.

To see what a leverage term actually does, we can compute the **news impact curve** by hand. This plots tomorrow's variance against the size and sign of today's shock, holding everything else at its long-run level. It is pure arithmetic on the coefficients, so it runs live.

The six coefficients typed into the block below are not new numbers pulled from nowhere. They are the fits of the same two models estimated with Student t shocks rather than normal ones, which is the specification we settle on in the next section: omega 0.021617, alpha 0.079090, beta 0.903588 for the symmetric model, and omega 0.028067, alpha 0.055994, beta 0.890428, gamma 0.058863 for the GJR version. Using the Student t fits here is deliberate, because those are the coefficients we end up trusting.

```r title="Compute and plot the news impact curve"
nic <- function(e, omega, alpha, beta, gamma = 0, s2bar) {
  omega + alpha * e^2 + gamma * (e < 0) * e^2 + beta * s2bar
}

s2bar  <- 0.021617 / (1 - 0.079090 - 0.903588)   # long-run variance level
shocks <- seq(-4, 4, by = 0.1)

sym <- nic(shocks, 0.021617, 0.079090, 0.903588, 0,        s2bar)
asy <- nic(shocks, 0.028067, 0.055994, 0.890428, 0.058863, s2bar)

plot(shocks, sym, type = "l", lwd = 2, col = "steelblue",
     main = "News impact curve", xlab = "Yesterday's shock (%)",
     ylab = "Today's variance")
lines(shocks, asy, lwd = 2, col = "firebrick")
legend("top", c("sGARCH (symmetric)", "gjrGARCH (asymmetric)"),
       col = c("steelblue", "firebrick"), lwd = 2, bty = "n")

round(data.frame(shock = c(-3, -2, -1, 0, 1, 2, 3),
                 sGARCH   = nic(c(-3, -2, -1, 0, 1, 2, 3), 0.021617, 0.079090, 0.903588, 0, s2bar),
                 gjrGARCH = nic(c(-3, -2, -1, 0, 1, 2, 3), 0.028067, 0.055994, 0.890428, 0.058863, s2bar)), 4)
#>   shock sGARCH gjrGARCH
#> 1    -3 1.8611   2.1730
#> 2    -2 1.4656   1.5987
#> 3    -1 1.2283   1.2541
#> 4     0 1.1493   1.1393
#> 5     1 1.2283   1.1953
#> 6     2 1.4656   1.3633
#> 7     3 1.8611   1.6432
```

The blue curve is a clean symmetric parabola: read off the rows for -3 and +3 and both give exactly 1.8611. The red curve is kinked. A 3% drop pushes variance to 2.1730 while a 3% gain pushes it only to 1.6432, about a third less. That is the leverage effect drawn as a picture, and it is why a symmetric model systematically underestimates risk right after a sell-off.

**Try it:** Using the `nic()` function above, compute how much more a 2% drop raises tomorrow's variance than a 2% gain under the GJR model, as a ratio.

```r title="Your turn: asymmetry ratio at plus and minus two"
# your code here: call nic() at e = -2 and e = 2 with the gjrGARCH
# coefficients (0.028067, 0.055994, 0.890428, gamma 0.058863, s2bar)
# then divide the first by the second

# Expected: a ratio a little under 1.2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Asymmetry ratio solution"
down <- nic(-2, 0.028067, 0.055994, 0.890428, 0.058863, s2bar)
up   <- nic( 2, 0.028067, 0.055994, 0.890428, 0.058863, s2bar)
round(c(down = down, up = up, ratio = down / up), 4)
#>   down     up  ratio 
#> 1.5987 1.3633 1.1727
```

**Explanation:** A 2% fall raises tomorrow's variance about 17% more than a 2% rise. The gap widens for larger shocks because the extra gamma term is multiplied by the squared shock.

</details>

### Which distribution should the shocks follow?

The Adjusted Pearson test rejected normality decisively, so let us find out why. Financial returns are famously **fat-tailed**: extreme days happen far more often than a bell curve allows.

Part of that fat-tailedness is an illusion created by changing volatility. Mix together calm periods and wild periods and even perfectly normal draws produce a combined distribution with fat tails. A GARCH model should therefore *remove* some of the excess. Kurtosis measures tail heaviness, and a normal distribution has a kurtosis of 3.

```r title="Compare kurtosis before and after standardizing"
kurt <- function(x) { x <- x[!is.na(x)]; mean((x - mean(x))^4) / sd(x)^4 }

round(c(returns = kurt(dax_ret),
        standardized = kurt(z_t),
        standardized_no_burnin = kurt(z_t[-(1:50)])), 4)
#>                returns           standardized standardized_no_burnin 
#>                 9.2697                15.9369                 4.1021
```

Raw returns have kurtosis 9.27, three times the normal benchmark. But standardizing made it **worse**, jumping to 15.94, which is the opposite of what the theory predicts. Drop the first 50 observations and it falls to 4.10. Something in the early sample is distorting everything, so let us find it.

```r title="Find the observation driving the tail"
worst <- which.max(abs(z_t))

round(c(observation = worst,
        return_pct  = dax_c[worst],
        model_sigma = unname(fitted(g)[worst, 1]),
        z_score     = z_t[worst]), 4)
#> observation  return_pct model_sigma     z_score 
#>     35.0000     -9.6929      0.7857    -12.3361
```

There it is. Thirty-five trading days into the sample the DAX fell 9.69% in a single session, at a moment when the model's estimated volatility was only 0.79%. That is a **12-sigma event**. Under a normal distribution a 12-sigma move should not occur even once in the lifetime of the universe, yet here is one in a routine 1,859-day sample of a major index.

Excluding the model's warm-up period, kurtosis drops to 4.10, close to but still above the normal benchmark of 3. So the honest summary is: GARCH removes most of the apparent fat-tailedness, and a genuine excess remains. That leftover is what the shock distribution has to handle.

The fix is to let the shocks follow a Student t distribution, which has heavier tails than a normal. Its `shape` parameter is the degrees of freedom, and lower means fatter.

```r-static title="Fit with Student t shocks"
spec_std <- ugarchspec(
  variance.model     = list(model = "sGARCH", garchOrder = c(1, 1)),
  mean.model         = list(armaOrder = c(0, 0), include.mean = TRUE),
  distribution.model = "std"
)
fit_std <- ugarchfit(spec_std, dax_ret, solver = "hybrid")

round(fit_std@fit$matcoef, 6)
#>         Estimate  Std. Error   t value Pr(>|t|)
#> mu      0.076399    0.018886  4.045289 0.000052
#> omega   0.021617    0.008742  2.472660 0.013411
#> alpha1  0.079090    0.016377  4.829254 0.000001
#> beta1   0.903588    0.020428 44.232208 0.000000
#> shape   6.034057    0.813542  7.417018 0.000000
```

The estimated `shape` is 6.03 with a p-value of essentially zero. Six degrees of freedom is a distinctly fat-tailed distribution: a normal is the limiting case as shape goes to infinity, and anything under about 10 is meaningfully heavy-tailed. The data are telling us loudly that they are not normal.

Rather than guess which combination is best, fit a grid and compare with information criteria. AIC and BIC both reward fit and penalise extra parameters, so lower is better, and BIC penalises complexity harder.

```r-static title="Compare nine model and distribution combinations"
grid <- expand.grid(model = c("sGARCH", "gjrGARCH", "eGARCH"),
                    dist  = c("norm", "std", "sstd"), stringsAsFactors = FALSE)

res <- do.call(rbind, lapply(seq_len(nrow(grid)), function(i) {
  s <- ugarchspec(variance.model = list(model = grid$model[i], garchOrder = c(1, 1)),
                  mean.model     = list(armaOrder = c(0, 0), include.mean = TRUE),
                  distribution.model = grid$dist[i])
  f  <- ugarchfit(s, dax_ret, solver = "hybrid")
  ic <- infocriteria(f)
  data.frame(model = grid$model[i], dist = grid$dist[i],
             logLik = round(likelihood(f), 2),
             AIC = round(ic[1], 4), BIC = round(ic[2], 4))
}))
print(res[order(res$BIC), ], row.names = FALSE)
#>     model dist   logLik    AIC    BIC
#>    eGARCH  std -2487.63 2.6828 2.7006
#>    eGARCH sstd -2487.14 2.6833 2.7041
#>    sGARCH  std -2495.26 2.6899 2.7048
#>  gjrGARCH  std -2492.54 2.6880 2.7059
#>    sGARCH sstd -2494.64 2.6903 2.7082
#>  gjrGARCH sstd -2491.94 2.6885 2.7093
#>    eGARCH norm -2589.36 2.7911 2.8060
#>    sGARCH norm -2594.80 2.7959 2.8078
#>  gjrGARCH norm -2592.77 2.7948 2.8097
```

Look at the shape of that ranking rather than only the winner. Every single model with `std` or `sstd` shocks beats every single model with `norm` shocks. The three normal models occupy the bottom three rows regardless of how sophisticated their variance equation is. Switching distribution improved the log-likelihood by about 100 points; switching from sGARCH to eGARCH while keeping normality improved it by only 5.

[KEY INSIGHT]
**The distribution assumption mattered roughly twenty times more than the variance equation here.** Most tutorials spend their energy comparing sGARCH against eGARCH against GJR while leaving the distribution at its normal default. That is optimising the small knob and ignoring the big one.

One more thing falls out of this table. Earlier, GJR's leverage term looked marginal at p = 0.0617. Refit it with Student t shocks and `gamma1` becomes 0.058863 with a p-value of 0.0409, which is significant at the 5% level. The normality assumption had been masking a real asymmetry: forcing thin tails onto fat-tailed data absorbs into the leverage parameter some of what should be tail behaviour.

**Try it:** Compute the excess kurtosis, meaning kurtosis minus 3, of the standardized residuals after dropping the first 50 warm-up observations. How far from normal is what remains?

```r title="Your turn: leftover excess kurtosis"
# your code here: use kurt() on z_t[-(1:50)] and subtract 3

# Expected: a positive number near 1.1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Excess kurtosis solution"
round(kurt(z_t[-(1:50)]) - 3, 4)
#> [1] 1.1021
```

**Explanation:** The raw returns had excess kurtosis of 6.27. After the GARCH model absorbs the volatility clustering, only 1.10 remains. GARCH explained about 82% of the excess tail weight, and the Student t distribution is there to cover the rest.

</details>

## How do you forecast volatility, and can you trust the forecast?

Everything so far described the past. Forecasting uses the same recursion, pushed forward. For one day ahead there is no guesswork at all, because both inputs are already known.

$$\sigma_{T+1}^2 = \omega + \alpha_1 \varepsilon_T^2 + \beta_1 \sigma_T^2$$

Let us compute it directly using the Student t model's coefficients, along with the final shock and final volatility from that fit.

```r title="Forecast one day ahead by hand"
omega_f <- 0.021617; alpha_f <- 0.079090; beta_f <- 0.903588
last_sigma <- 1.589620      # model volatility on the final day
last_shock <- 2.115816      # actual shock on the final day

sigma2_next <- omega_f + alpha_f * last_shock^2 + beta_f * last_sigma^2
round(sqrt(sigma2_next), 6)
#> [1] 1.630628
```

The model forecasts 1.63% volatility for the next day. Beyond one day we do not know the future shock, so we replace $\varepsilon^2$ with its expected value, which is the variance itself. The recursion then collapses to a single line:

$$\sigma_{T+k}^2 = \omega + (\alpha_1 + \beta_1)\,\sigma_{T+k-1}^2$$

Persistence is now the only thing driving the path.

```r title="Project the forecast ten days forward"
h <- 10
s2_path <- numeric(h)
s2_path[1] <- sigma2_next
for (k in 2:h) {
  s2_path[k] <- omega_f + (alpha_f + beta_f) * s2_path[k - 1]
}
round(sqrt(s2_path), 4)
#>  [1] 1.6306 1.6231 1.6157 1.6084 1.6012 1.5940 1.5870 1.5800 1.5732 1.5664

round(sqrt(omega_f / (1 - alpha_f - beta_f)), 4)   # the long-run level
#> [1] 1.1171
```

The forecast starts at 1.63% and decays a little each day toward 1.12%, the long-run level. This is the defining behaviour of a GARCH forecast: **it always drifts back to the unconditional volatility**, quickly when persistence is low and slowly when it is high. Today's turbulence fades; it does not last forever.

Now let us confirm that rugarch does exactly this.

```r-static title="Forecast with rugarch and compare"
fc <- ugarchforecast(fit_std, n.ahead = 10)

round(as.numeric(sigma(fc)), 6)
#>  [1] 1.630628 1.623117 1.615702 1.608382 1.601156 1.594024 1.586983 1.580034 1.573176 1.566407

round(as.numeric(fitted(fc)), 6)
#>  [1] 0.076399 0.076399 0.076399 0.076399 0.076399 0.076399 0.076399 0.076399 0.076399 0.076399
```

The `sigma()` column is identical to the path we computed by hand, to six decimal places. `ugarchforecast()` is running the same three lines of arithmetic you just wrote.

Now look at the second output, the forecast of the returns themselves. It is 0.076399 on every single day, a flat line equal to the estimated mean. This is the point readers most often get wrong.

[WARNING]
**GARCH does not predict returns, and it never will.** The mean forecast is a flat line because we fitted a constant mean, and our Ljung-Box test said that was correct. GARCH forecasts how *uncertain* tomorrow is, not which *direction* it will go. If you came here hoping to predict prices, this is the model telling you honestly that it cannot.

What volatility forecasts are genuinely used for is risk, and risk is usually quoted per year. Convert with the square root of the number of trading days.

```r title="Annualize the volatility forecast"
round(c(tomorrow_daily_pct  = sqrt(s2_path[1]),
        tomorrow_annual_pct = sqrt(s2_path[1]) * sqrt(252),
        longrun_daily_pct   = sqrt(omega_f / (1 - alpha_f - beta_f)),
        longrun_annual_pct  = sqrt(omega_f / (1 - alpha_f - beta_f)) * sqrt(252)), 3)
#>  tomorrow_daily_pct tomorrow_annual_pct   longrun_daily_pct  longrun_annual_pct 
#>               1.631              25.885               1.117              17.734
```

Variance grows roughly in proportion to time, so volatility grows with the square root of time, giving the familiar `sqrt(252)` factor for daily data. The model says the market is currently priced for about 26% annualised volatility against a long-run average near 18%. Those two figures come from the Student t fit; the plain `tseries` fit from earlier puts the long-run level slightly lower, at 1.04% daily or 16.5% annualised, because the two fits divide the same data differently between the variance equation and the tail of the distribution. That is a statement a risk committee can act on, and it came from three coefficients.

**Try it:** Suppose a different asset has omega 0.03, alpha 0.10 and beta 0.85, with a one-day-ahead variance forecast of 4.0. Project the volatility five days ahead and compare it with the long-run level.

```r title="Your turn: five-day forecast path"
# your code here: run the recursion s2[k] = omega + (alpha + beta) * s2[k-1]
# starting from s2[1] = 4.0, for 5 steps, then take sqrt()
# also compute sqrt(omega / (1 - alpha - beta))

# Expected: a path falling from 2.0, well above the long-run level
```

<details>
<summary>Click to reveal solution</summary>

```r title="Five-day forecast solution"
o <- 0.03; a <- 0.10; b <- 0.85
s2 <- numeric(5); s2[1] <- 4.0
for (k in 2:5) s2[k] <- o + (a + b) * s2[k - 1]

round(sqrt(s2), 4)
#> [1] 2.0000 1.9570 1.9153 1.8749 1.8356
round(sqrt(o / (1 - a - b)), 4)
#> [1] 0.7746
```

**Explanation:** Volatility falls from 2.00 to 1.84 over five days, still far above the long-run 0.77. With persistence of 0.95 the half-life is about 13.5 days, so after only five days most of the shock is still present.

</details>

### How do you know your forecasts are actually any good?

Everything up to here was in-sample. The model saw all the data before being judged on it, which is not evidence of anything. The real test is a **rolling backtest**: fit on data up to a point, forecast one day forward, step forward, refit periodically, and score only the forecasts the model never saw the answers to.

`ugarchroll()` does this. Below it produces 500 genuine one-step-ahead forecasts, refitting every 50 days on a moving window.

```r-static title="Run a rolling out-of-sample backtest"
roll <- ugarchroll(spec_std, data = dax_ret, n.ahead = 1,
                   forecast.length = 500, refit.every = 50,
                   refit.window = "moving", solver = "hybrid",
                   calculate.VaR = TRUE, VaR.alpha = c(0.01, 0.05),
                   keep.coef = TRUE)

report(roll, type = "fpm")
#> 
#> GARCH Roll Mean Forecast Performance Measures
#> ---------------------------------------------
#> Model		: sGARCH
#> No.Refits	: 10
#> No.Forecasts: 500
#> 
#>      Stats
#> MSE 1.6870
#> MAE 0.9704
#> DAC 0.5520
```

`MSE` and `MAE` are the average squared and average absolute error of those 500 variance forecasts, and `DAC` is directional accuracy, which is not informative here because GARCH does not forecast direction in the first place. Error numbers like these mean little on their own anyway. A forecast is only good or bad *relative to a sensible alternative*, and the obvious alternative is "just use the historical standard deviation and never update it". We can run that comparison live, fitting on all but the last 500 days and rolling the variance recursion forward across them.

```r title="Compare GARCH against a constant-variance benchmark"
n <- length(dax_c); n_train <- n - 500
g_tr <- garch(dax_c[1:n_train], order = c(1, 1), trace = FALSE)
cc <- coef(g_tr)
o <- unname(cc["a0"]); a <- unname(cc["a1"]); b <- unname(cc["b1"])

s2 <- as.numeric(fitted(g_tr)[, 1])[n_train]^2
pred <- numeric(500)
for (k in 1:500) {
  s2 <- o + a * dax_c[n_train + k - 1]^2 + b * s2   # one-step-ahead each day
  pred[k] <- s2
}

actual <- dax_c[(n_train + 1):n]^2
const  <- var(dax_c[1:n_train])

round(c(garch_MSE = mean((actual - pred)^2),
        constant_MSE = mean((actual - const)^2),
        improvement_pct = 100 * (1 - mean((actual - pred)^2) / mean((actual - const)^2))), 4)
#>       garch_MSE    constant_MSE improvement_pct 
#>          9.1041         10.0514          9.4245
```

GARCH beats the naive constant-variance forecast by about 9% in mean squared error on data it never saw. That is a real improvement, and it is also a modest one. Anyone promising that GARCH transforms volatility forecasting is overselling it. What GARCH reliably does is tell you *when* risk is elevated, which the constant benchmark can never do.

The sharpest test is **Value at Risk**. A 1% VaR is a loss level that should be breached on about 1% of days. Count the breaches and you have a direct verdict.

```r-static title="Backtest Value at Risk"
report(roll, type = "VaR", VaR.alpha = 0.01, conf.level = 0.95)
#> VaR Backtest Report
#> ===========================================
#> Model:				sGARCH-std
#> Backtest Length:	500
#> 
#> ==========================================
#> alpha:				1%
#> Expected Exceed:	5
#> Actual VaR Exceed:	10
#> Actual %:			2%
#> 
#> Unconditional Coverage (Kupiec)
#> Null-Hypothesis:	Correct Exceedances
#> LR.uc Statistic:	3.914
#> LR.uc Critical:		3.841
#> LR.uc p-value:		0.048
#> Reject Null:		YES
#> 
#> Conditional Coverage (Christoffersen)
#> Null-Hypothesis:	Correct Exceedances and
#> 					Independence of Failures
#> LR.cc Statistic:	4.323
#> LR.cc p-value:		0.115
#> Reject Null:		NO
```

Read the two tests together, because they say different things and the combination is the whole story.

**Kupiec** asks whether the *number* of breaches is right. Expected 5, observed 10, p-value 0.048, rejected. The model underestimates how far the tail extends.

**Christoffersen** asks whether the breaches are *independent*, meaning they do not arrive in clusters. p-value 0.115, not rejected. The breaches are spread out rather than bunched.

Put together: **the model gets the timing of risk right and the depth of risk wrong.** It knows which weeks are dangerous, since breaches are not clustering. It still underestimates how bad the worst days can be. And you already met the reason, back in the kurtosis section: a 12-sigma day sits in this sample, and no model with only six degrees of freedom of tail was ever going to price that correctly.

[KEY INSIGHT]
**Every honest GARCH evaluation ends here.** The model is a genuine improvement over assuming constant risk, and it still underestimates extreme losses. Any tutorial that reports only the in-sample fit and stops has skipped the part that decides whether you should trust it with money.

**Try it:** Count VaR breaches yourself. Given the simulated returns below and a constant volatility of 1, the 1% VaR under a normal assumption is `qnorm(0.01)`, about -2.326. Count how many returns fall below it out of 500.

```r title="Your turn: count VaR breaches"
set.seed(5)
ex_r <- rt(500, df = 5) / sqrt(5 / 3)    # fat-tailed returns, scaled to variance 1

# your code here: count how many of ex_r fall below qnorm(0.01),
# and compare with the 5 breaches expected out of 500

# Expected: noticeably more than 5
```

<details>
<summary>Click to reveal solution</summary>

```r title="VaR breach count solution"
breaches <- sum(ex_r < qnorm(0.01))
round(c(expected = 0.01 * 500, actual = breaches,
        actual_pct = 100 * breaches / 500), 3)
#>   expected     actual actual_pct 
#>        5.0       11.0        2.2
```

**Explanation:** Eleven breaches against five expected, a rate of 2.2% instead of 1%. The returns were deliberately drawn from a fat-tailed t distribution while the VaR was computed with a normal quantile. This is exactly the failure the DAX backtest exhibited, reproduced in miniature.

</details>

## What goes wrong in practice, and should you still use rugarch?

Three mistakes account for most broken GARCH models, and all three are silent.

**Mistake one: fitting prices instead of returns.** GARCH assumes a stationary series that hovers around a fixed mean. Prices trend, so they do not qualify.

```r title="What happens when you fit prices by mistake"
dax_price <- as.numeric(EuStockMarkets[, "DAX"])
g_price <- garch(dax_price - mean(dax_price), order = c(1, 1), trace = FALSE)

round(coef(g_price), 6)
#>           a0           a1           b1 
#> 1.059098e+06 2.119730e-01 0.000000e+00
```

The output is nonsense. Omega comes back as roughly one million because it is trying to describe the variance of index *levels*, and beta comes back as exactly zero, so the fitted model carries no memory term at all. R also prints a `singular information` warning alongside that fit, which is how it reports that the estimation is degenerate. Always difference and log first.

**Mistake two: forgetting how scaling moves omega.** Returns as decimals and returns as percentages are the same data, but the coefficients do not all behave the same way.

```r title="How rescaling changes omega but not alpha or beta"
dax_dec <- dax_ret / 100                       # decimals instead of percent
g_dec <- garch(dax_dec - mean(dax_dec), order = c(1, 1), trace = FALSE)

round(coef(g_dec), 10)
#>           a0           a1           b1 
#> 0.0000047459 0.0683704573 0.8877458227
```

Compare with the percent-scale fit: alpha was 0.068377 and beta 0.887741, essentially unchanged. But omega went from 0.047462 to 0.0000047459, smaller by a factor of 10,000, which is 100 squared. Alpha and beta are scale-free ratios; omega carries the units of variance. This is why omega values look wildly different across papers, and why you should never compare omega between two fits without checking the scale first.

**Mistake three: a fit that does not converge.** If `ugarchfit()` returns NaN standard errors or an obviously wrong fit, try `solver = "hybrid"`, which is what every rugarch block in this article uses. It falls back through several optimisers instead of giving up on the first failure. If persistence comes back at 0.9999 or above, your model is effectively IGARCH, meaning shocks never decay and there is no finite long-run variance. That is occasionally real, and more often a sign of a structural break sitting in the middle of your sample.

There is one more thing worth knowing before you build anything long-lived on this package.

[NOTE]
**rugarch is in maintenance mode.** Its own CRAN README states that the package will no longer be updated, that bug fixes continue until roughly 2027, and that users should switch to the newer `tsgarch` package by the same author. Learn rugarch anyway, because every existing codebase, course and paper uses it, but start new long-lived projects with the successor in mind.

The translation is mostly mechanical, with one trap:

| Task | rugarch | tsgarch |
|---|---|---|
| Describe the model | `ugarchspec(...)` | `garch_modelspec(y, model = "garch", order = c(1,1))` |
| Fit it | `ugarchfit(spec, data)` | `estimate(spec)` |
| Forecast | `ugarchforecast(fit, n.ahead = 10)` | `predict(fit, h = 10)` |
| Backtest | `ugarchroll(...)` | `tsbacktest(...)` |
| Asymmetric model | `model = "gjrGARCH"` | `model = "gjrgarch"` |

The trap is the mean equation. `garch_modelspec()` has no `armaOrder` argument at all, only a `constant` flag. ARMA dynamics moved into a separate package, `tsarma`. If you are porting a model that relied on rugarch's ARMA mean, that part does not translate directly.

**Try it:** Predict, without running it, what happens to omega if you fit the same returns divided by 10 rather than 100. Would alpha and beta change?

<details>
<summary>Click to reveal solution</summary>

Dividing returns by 10 divides their variance by 100, so omega should shrink by a factor of 100, from about 0.047462 to about 0.00047462. Alpha and beta would be essentially unchanged, because both are dimensionless ratios describing how variance propagates rather than how large it is.

The general rule: rescaling returns by a factor `c` rescales omega by `c` squared and leaves alpha, beta and persistence alone. Every derived quantity that depends only on persistence, such as half-life, is also unaffected.

</details>

## Practice Exercises

These combine several ideas at once. All three run in your browser.

### Exercise 1: A complete workflow on the FTSE

Run the full pipeline on the FTSE index: test for ARCH effects, fit a GARCH(1,1), report persistence, half-life and long-run daily volatility, then forecast five days ahead by hand. Use `my_` prefixes so you do not overwrite tutorial variables.

```r title="Exercise 1 starter"
my_ftse <- as.numeric(diff(log(EuStockMarkets[, "FTSE"])) * 100)
my_c <- my_ftse - mean(my_ftse)

# Hint: reuse arch_lm(), then garch(), then the recursion
#   s2[k] <- a0 + (a1 + b1) * s2[k-1]
# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
my_ftse <- as.numeric(diff(log(EuStockMarkets[, "FTSE"])) * 100)
my_c <- my_ftse - mean(my_ftse)

round(arch_lm(my_c, 5), 4)
#> LM_statistic           df      p_value 
#>      43.9201       5.0000       0.0000

my_fit <- garch(my_c, order = c(1, 1), trace = FALSE)
my_cf <- coef(my_fit)
round(c(omega = unname(my_cf["a0"]), alpha = unname(my_cf["a1"]),
        beta = unname(my_cf["b1"])), 6)
#>    omega    alpha     beta 
#> 0.008484 0.045010 0.942516

my_p <- unname(my_cf["a1"] + my_cf["b1"])
round(c(persistence = my_p,
        halflife = log(0.5) / log(my_p),
        longrun_sd = sqrt(unname(my_cf["a0"]) / (1 - my_p))), 4)
#> persistence    halflife  longrun_sd 
#>      0.9875     55.2197      0.8247

my_s <- as.numeric(fitted(my_fit)[, 1])
my_s2 <- numeric(5)
my_s2[1] <- unname(my_cf["a0"]) + unname(my_cf["a1"]) * my_c[length(my_c)]^2 +
            unname(my_cf["b1"]) * my_s[length(my_s)]^2
for (k in 2:5) my_s2[k] <- unname(my_cf["a0"]) + my_p * my_s2[k - 1]
round(sqrt(my_s2), 4)
#> [1] 1.1703 1.1666 1.1629 1.1593 1.1558
```

**Explanation:** The FTSE has clear ARCH effects and very high persistence at 0.9875, giving a 55-day half-life. Notice how flat the five-day forecast is, falling only from 1.170 to 1.156. With persistence that close to 1, forecasts barely move over a week, which is the practical meaning of a long memory.

</details>

### Exercise 2: Which European market has the longest volatility memory?

`EuStockMarkets` holds four indices: DAX, SMI, CAC and FTSE. Fit a GARCH(1,1) to each and build a comparison table of alpha, beta, persistence, half-life and long-run daily volatility. Which market forgets a shock fastest?

```r title="Exercise 2 starter"
# Hint: loop over colnames(EuStockMarkets) with lapply(), build a one-row
# data.frame per index, and combine with do.call(rbind, ...)

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_tab <- do.call(rbind, lapply(colnames(EuStockMarkets), function(nm) {
  r <- as.numeric(diff(log(EuStockMarkets[, nm])) * 100)
  f <- garch(r - mean(r), order = c(1, 1), trace = FALSE)
  cc <- coef(f); pp <- unname(cc["a1"] + cc["b1"])
  data.frame(index = nm,
             alpha = round(unname(cc["a1"]), 4),
             beta = round(unname(cc["b1"]), 4),
             persistence = round(pp, 4),
             halflife = round(log(0.5) / log(pp), 1),
             longrun_sd = round(sqrt(unname(cc["a0"]) / (1 - pp)), 4))
}))
print(my_tab, row.names = FALSE)
#>  index  alpha   beta persistence halflife longrun_sd
#>    DAX 0.0684 0.8877      0.9561     15.4     1.0400
#>    SMI 0.1269 0.7310      0.8579      4.5     0.9360
#>    CAC 0.0512 0.8772      0.9285      9.3     1.1037
#>   FTSE 0.0450 0.9425      0.9875     55.2     0.8247
```

**Explanation:** The SMI forgets fastest, with a half-life of 4.5 days, and it has the highest alpha at 0.127 combined with the lowest beta at 0.731, so it reacts sharply to news but does not dwell on it. The FTSE is the opposite: the lowest alpha, the highest beta, and a 55-day memory. Same asset class, same period, and volatility half-lives spanning more than a factor of ten.

</details>

### Exercise 3: Build a VaR backtest from scratch

Using the DAX model already fitted as `g`, compute the 1% Value at Risk for each day as `qnorm(0.01) * sigma_t + mean(dax_ret)`, count how many actual returns fell below their VaR, and compare with the 1% you would expect. Does the normal assumption hold up?

```r title="Exercise 3 starter"
# Hint: the fitted volatilities are as.numeric(fitted(g)[, 1]) and the
# first one is NA, so filter with !is.na() before counting

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_sigma <- as.numeric(fitted(g)[, 1])
my_ok <- !is.na(my_sigma)

my_var99 <- qnorm(0.01) * my_sigma[my_ok] + mean(dax_ret)
my_breach <- dax_ret[my_ok] < my_var99

round(c(days = sum(my_ok),
        expected = 0.01 * sum(my_ok),
        actual = sum(my_breach),
        actual_pct = 100 * mean(my_breach)), 3)
#>       days   expected     actual actual_pct 
#>   1858.000     18.580     30.000      1.615
```

**Explanation:** Thirty breaches where 18.6 were expected, a rate of 1.6% instead of 1%. This mirrors the out-of-sample rugarch backtest almost exactly, and it is the same diagnosis: the GARCH variance dynamics are sound, but pairing them with a normal distribution understates the tail. Rerunning this with a Student t quantile in place of `qnorm()` moves the count much closer to expectation.

</details>

## Complete Example

Here is the whole workflow as one reusable function. Give it a price series and it returns a labelled volatility report.

```r title="End-to-end GARCH report function"
garch_report <- function(prices, label = "series", h = 5) {
  r  <- as.numeric(diff(log(prices)) * 100)
  rc <- r - mean(r)

  test <- arch_lm(rc, 5)
  fit  <- garch(rc, order = c(1, 1), trace = FALSE)
  cf   <- coef(fit)
  p    <- unname(cf["a1"] + cf["b1"])
  sg   <- as.numeric(fitted(fit)[, 1])
  lb   <- Box.test(na.omit(rc / sg)^2, lag = 10, type = "Ljung-Box")

  s2 <- unname(cf["a0"]) + unname(cf["a1"]) * rc[length(rc)]^2 +
        unname(cf["b1"]) * sg[length(sg)]^2
  path <- numeric(h); path[1] <- s2
  for (k in 2:h) path[k] <- unname(cf["a0"]) + p * path[k - 1]

  cat("Series            :", label, "\n")
  cat("Observations      :", length(r), "\n")
  cat("ARCH-LM p-value   :", format.pval(test["p_value"], digits = 3), "\n")
  cat("alpha / beta      :", round(unname(cf["a1"]), 4), "/",
                             round(unname(cf["b1"]), 4), "\n")
  cat("Persistence       :", round(p, 4), "\n")
  cat("Shock half-life   :", round(log(0.5) / log(p), 1), "days\n")
  cat("Long-run daily sd :", round(sqrt(unname(cf["a0"]) / (1 - p)), 4), "%\n")
  cat("Long-run annual   :", round(sqrt(unname(cf["a0"]) / (1 - p)) * sqrt(252), 1), "%\n")
  cat("Residual LB p-val :", round(lb$p.value, 4), "\n")
  cat("Next", h, "days sd   :", round(sqrt(path), 4), "\n")
  invisible(NULL)
}

garch_report(EuStockMarkets[, "DAX"], label = "DAX")
#> Series            : DAX 
#> Observations      : 1859 
#> ARCH-LM p-value   : 1.18e-13 
#> alpha / beta      : 0.0684 / 0.8877 
#> Persistence       : 0.9561 
#> Shock half-life   : 15.4 days
#> Long-run daily sd : 1.04 %
#> Long-run annual   : 16.5 %
#> Residual LB p-val : 0.9999 
#> Next 5 days sd   : 1.5269 1.5089 1.4914 1.4745 1.4581
```

Every line traces back to something built earlier: `arch_lm()` from the testing section, the recursion from the simulation section, half-life from the interpretation section, the Ljung-Box residual check from the diagnostics section, and the forward recursion from the forecasting section. Swap in `EuStockMarkets[, "CAC"]` and you get the same report for the French market.

## Frequently Asked Questions

**How much data do I need to fit a GARCH model?**

Maximum likelihood needs a lot of observations to pin down three parameters that describe rare events, and beta in particular is badly estimated in short samples. A practical floor for daily data is around 500 observations, with 1,000 or more preferred, which is why the DAX sample of 1,859 days here is comfortable. Below a few hundred points you will often see beta drift toward 1 or standard errors that swamp the estimates, and the fix is more data rather than a cleverer specification.

**Do I need to fit an ARMA model to the returns first?**

Test before you assume. Run the Ljung-Box test on the raw returns: if the p-value is large, as it was for the DAX at 0.78, there is no direction to model and a constant mean is correct. If it is small, fit the ARMA mean and the GARCH variance together in one `ugarchspec()` via `armaOrder`, rather than fitting ARIMA first and running GARCH on the residuals, because the two-step route understates the standard errors.

**My alpha plus beta came out above 1. What went wrong?**

Most often nothing is wrong with your code and something is wrong with the sample. A persistence estimate at or above 1 means shocks never fade and there is no finite long-run variance, and the usual cause is a structural break sitting inside the sample, such as a regime change or a merged series from two different assets. Split the sample at the suspected break and refit each half before concluding that the volatility genuinely has infinite memory.

**Is GARCH(1,1) enough, or should I try higher orders?**

GARCH(1,1) is famously hard to beat on daily financial returns, and higher orders usually buy a fraction of a log-likelihood point for an extra parameter. The horse race in this article makes the same point from the other direction: changing the shock distribution was worth about 100 log-likelihood points, while changing the variance equation was worth about 5. Try (2,1) if the diagnostics on squared standardized residuals still fail, but change the distribution first.

**Can I use GARCH to forecast prices or the direction of the market?**

No. GARCH forecasts the conditional variance, and the mean forecast it produces is a flat line at the estimated average return, which the forecasting section above shows explicitly. It is used for position sizing, option pricing, Value at Risk and margin setting, all of which need to know how uncertain tomorrow is rather than which way it goes.

**Should I start a new project in rugarch or tsgarch?**

If you are learning, reading existing code or reproducing published work, use rugarch, because that is what everything is written in. If you are starting a codebase that has to survive several years, use `tsgarch`, since rugarch's own README says the package will not be updated further and points users to the successor. The one thing that does not carry over cleanly is the ARMA mean equation, which lives in a separate package, `tsarma`.

## Summary

![Workflow diagram running from log returns through ARCH testing, model specification, maximum likelihood fitting, diagnostics, forecasting and out-of-sample backtesting](screenshots/GARCH-Models-in-R-workflow.webp)

*Figure 3: The complete GARCH workflow, from raw returns to an honest out-of-sample verdict.*

The parameters and what they tell you:

| Quantity | Formula | DAX value | What it means |
|---|---|---|---|
| alpha | fitted | 0.068 | How hard volatility reacts to yesterday's news |
| beta | fitted | 0.888 | How much of yesterday's volatility carries over |
| omega | fitted | 0.047 | The baseline anchor, and it moves with your data's scale |
| Persistence | alpha + beta | 0.956 | Fraction of a volatility shock surviving one day |
| Half-life | log(0.5)/log(persistence) | 15.4 days | How long until a shock half fades |
| Long-run volatility | sqrt(omega/(1 - persistence)) | 1.04% daily | The level forecasts drift back toward |
| Annualized | daily * sqrt(252) | 16.5% | The same number in the units risk desks quote |

The decisions, and what drives each one:

- **Do I need GARCH at all?** Ljung-Box on squared returns, plus the ARCH-LM test.
- **Symmetric or asymmetric?** The Sign Bias test. If it fires, use gjrGARCH or eGARCH.
- **Which distribution?** The Adjusted Pearson test. For daily equity data the answer is almost always Student t, not normal.
- **Is the fit adequate?** Ljung-Box on squared standardized residuals should come back large and boring.
- **Is it actually useful?** Only a rolling out-of-sample backtest can answer that.

And the three things worth remembering above all:

1. **GARCH forecasts variance, not returns.** The mean forecast is a flat line by design.
2. **Forecasts always mean-revert** to the long-run level, at a speed set entirely by persistence.
3. **The distribution assumption often matters more than the variance equation.** On the DAX it was worth roughly twenty times as much log-likelihood.

## References

1. Bollerslev, T. Generalized Autoregressive Conditional Heteroskedasticity. *Journal of Econometrics*, 31(3), 307-327 (1986). The paper that introduced GARCH. [Link](https://doi.org/10.1016/0304-4076%2886%2990063-1)
2. Engle, R. F. Autoregressive Conditional Heteroscedasticity with Estimates of the Variance of United Kingdom Inflation. *Econometrica*, 50(4), 987-1007 (1982). The original ARCH paper, which won the 2003 Nobel Prize. [Link](https://ideas.repec.org/a/ecm/emetrp/v50y1982i4p987-1007.html)
3. Galanos, A. rugarch: Univariate GARCH Models. CRAN package documentation and introductory vignette. [Link](https://cran.r-project.org/web/packages/rugarch/index.html)
4. Galanos, A. rugarch README, containing the maintenance and migration notice. [Link](https://cran.r-project.org/web/packages/rugarch/readme/README.html)
5. Galanos, A. tsgarch: Univariate GARCH Models, the successor package. [Link](https://cran.r-project.org/web/packages/tsgarch/index.html)
6. Glosten, L. R., Jagannathan, R., and Runkle, D. E. On the Relation between the Expected Value and the Volatility of the Nominal Excess Return on Stocks. *Journal of Finance*, 48(5), 1779-1801 (1993). The GJR-GARCH model. [Link](https://ideas.repec.org/a/bla/jfinan/v48y1993i5p1779-1801.html)
7. Nelson, D. B. Conditional Heteroskedasticity in Asset Returns: A New Approach. *Econometrica*, 59(2), 347-370 (1991). The EGARCH model. [Link](https://ideas.repec.org/a/ecm/emetrp/v59y1991i2p347-70.html)
8. Perlin, M. S., Mastella, M., Vancin, D. F., and Ramos, H. P. A GARCH Tutorial with R. *Revista de Administracao Contemporanea*, 25(1) (2021). A peer-reviewed applied walkthrough. [Link](https://www.scielo.br/j/rac/a/FyNM3rThZN7wQgMKshwLHjk/?lang=en)
9. Trapletti, A. and Hornik, K. tseries: Time Series Analysis and Computational Finance. CRAN package documentation. [Link](https://cran.r-project.org/web/packages/tseries/index.html)

## Continue Learning

- [ARIMA Models in R](ARIMA-in-R.html) covers the mean-equation side of time series modelling. GARCH handles the variance; ARIMA handles the level, and serious models often combine both.
- [Test Stationarity in R](Test-Stationarity-in-R.html) explains the ADF and KPSS tests. Since GARCH requires a stationary input, this is the check to run before you difference and log your prices.
- [Time Series Forecasting in R](Time-Series-Forecasting-With-R.html) walks through building and evaluating forecasts more generally, including the accuracy measures used in the backtesting section above.
