---
title: "Volatility Modeling with ARCH and GARCH Lesson 3: The GARCH family of volatility models"
slug: "The-GARCH-Family"
description: "GARCH(1,1) does the work of a long ARCH with 3 parameters. Fit it to FTSE 100 returns, read persistence and half-life, then add GJR asymmetry for falls."
keywords: "GARCH, ARCH, GARCH(1,1), GJR-GARCH, EGARCH, volatility clustering, persistence, half-life, conditional variance, GARCH in R, FTSE 100"
mathjax: true
webr: true
date: "2026-09-26"
post_type: "LESSON"
course_id: "ts-volatility"
course_title: "Volatility Modeling with ARCH and GARCH"
course_lesson: "3"
course_total: "6"
course_landing: "Volatility-Modeling-ARCH-and-GARCH-Course.html"
course_next: "Fitting-GARCH-in-R.html"
course_prev: "ARCH-Models.html"
curriculum_id: "5.100.3"
lesson_access: "pro"
catalog_blurb: "How GARCH models let volatility change over time, and how to read the fit."
---

=== step === cover
## The GARCH family of volatility models

Today let's see how the GARCH family of models describes a return series whose ups and downs grow and shrink over time.

The data is the FTSE 100, the London stock index, over 1,859 trading days from 1991 to 1998. Each day's return is the percentage change in the index from the day before. Across all 1,859 days the average return is 0.0432 and the standard deviation is 0.7958, and the largest single move is 5.44.

But that one standard deviation hides something. Take the standard deviation of any 20 consecutive days and it runs from a low of 0.369 to a high of 1.898. The chart below shows 120 consecutive days where the change is easy to see: the standard deviation of the first 60 days is 0.68, and of the last 60 days it is 1.42.

::widget chart-plotter {"x":"day","y":"return_pct","geoms":["line"],"data":[{"x":1,"y":1.264},{"x":2,"y":0.573},{"x":3,"y":-0.271},{"x":4,"y":0.523},{"x":5,"y":-0.406},{"x":6,"y":0.215},{"x":7,"y":0.000},{"x":8,"y":0.090},{"x":9,"y":1.362},{"x":10,"y":0.119},{"x":11,"y":0.877},{"x":12,"y":0.443},{"x":13,"y":-0.564},{"x":14,"y":-0.070},{"x":15,"y":-0.953},{"x":16,"y":-0.450},{"x":17,"y":0.780},{"x":18,"y":-0.111},{"x":19,"y":0.418},{"x":20,"y":-0.366},{"x":21,"y":0.480},{"x":22,"y":0.000},{"x":23,"y":-0.384},{"x":24,"y":-0.222},{"x":25,"y":-0.163},{"x":26,"y":0.496},{"x":27,"y":-0.370},{"x":28,"y":0.307},{"x":29,"y":-0.928},{"x":30,"y":0.037},{"x":31,"y":-0.501},{"x":32,"y":-0.854},{"x":33,"y":-0.394},{"x":34,"y":0.027},{"x":35,"y":-0.838},{"x":36,"y":-0.399},{"x":37,"y":-0.389},{"x":38,"y":0.871},{"x":39,"y":-0.687},{"x":40,"y":-1.383},{"x":41,"y":0.859},{"x":42,"y":-1.344},{"x":43,"y":0.403},{"x":44,"y":-1.100},{"x":45,"y":0.971},{"x":46,"y":-0.911},{"x":47,"y":-0.725},{"x":48,"y":0.214},{"x":49,"y":-1.089},{"x":50,"y":-0.716},{"x":51,"y":0.845},{"x":52,"y":-1.132},{"x":53,"y":0.995},{"x":54,"y":-0.850},{"x":55,"y":1.018},{"x":56,"y":-0.285},{"x":57,"y":-0.503},{"x":58,"y":0.230},{"x":59,"y":0.097},{"x":60,"y":-0.121},{"x":61,"y":-2.096},{"x":62,"y":-1.166},{"x":63,"y":0.494},{"x":64,"y":-1.153},{"x":65,"y":0.485},{"x":66,"y":-0.934},{"x":67,"y":-1.236},{"x":68,"y":1.076},{"x":69,"y":2.077},{"x":70,"y":-0.480},{"x":71,"y":-0.499},{"x":72,"y":0.855},{"x":73,"y":-0.526},{"x":74,"y":-0.612},{"x":75,"y":-0.637},{"x":76,"y":-1.163},{"x":77,"y":-1.044},{"x":78,"y":-0.695},{"x":79,"y":-0.282},{"x":80,"y":0.645},{"x":81,"y":1.660},{"x":82,"y":0.816},{"x":83,"y":-0.905},{"x":84,"y":0.373},{"x":85,"y":-0.174},{"x":86,"y":0.267},{"x":87,"y":-2.335},{"x":88,"y":-1.311},{"x":89,"y":0.175},{"x":90,"y":1.157},{"x":91,"y":0.043},{"x":92,"y":0.000},{"x":93,"y":-0.616},{"x":94,"y":0.633},{"x":95,"y":2.935},{"x":96,"y":-0.831},{"x":97,"y":0.422},{"x":98,"y":-1.465},{"x":99,"y":-0.437},{"x":100,"y":0.561},{"x":101,"y":1.286},{"x":102,"y":2.137},{"x":103,"y":-2.174},{"x":104,"y":0.350},{"x":105,"y":4.344},{"x":106,"y":3.291},{"x":107,"y":-0.269},{"x":108,"y":1.007},{"x":109,"y":-0.213},{"x":110,"y":1.565},{"x":111,"y":-0.774},{"x":112,"y":-1.589},{"x":113,"y":0.215},{"x":114,"y":-0.488},{"x":115,"y":0.753},{"x":116,"y":-0.882},{"x":117,"y":-4.140},{"x":118,"y":1.706},{"x":119,"y":1.147},{"x":120,"y":0.858}]}

So the variance of these returns is not one fixed number. Small moves come in runs and large moves come in runs, a pattern called **volatility clustering**, and the size of the swings changes from one stretch to the next. The question for this lesson is which equation for the variance follows those changes with the fewest parameters. ARCH is the starting point, and GARCH, GJR and EGARCH are the family that grows from it.

=== step === concept
## Why does an ARCH model need so many lags?

Let's start by building the data. The return is 100 times the change in the log of the index, and the shock is a day's return minus the average return. The `tseries` function we use has no mean term, so we fit it to the shocks.

```r
# Build the FTSE 100 daily returns and the shocks
suppressMessages(library(tseries))
ftse <- 100 * diff(log(as.numeric(EuStockMarkets[, "FTSE"])))   # daily return in percent
e    <- ftse - mean(ftse)                                       # shock: the return minus its mean

length(ftse)
round(c(mean = mean(ftse), sd = sd(ftse), largest_move = max(abs(ftse))), 4)

roll_sd <- sapply(20:length(ftse), function(i) sd(ftse[(i - 19):i]))   # sd of every run of 20 days
round(range(roll_sd), 3)
#> [1] 1859
#>         mean           sd largest_move
#>       0.0432       0.7958       5.4396
#> [1] 0.369 1.898
```

The last line prints the range of that 20-day standard deviation, 0.369 to 1.898, so the spread of the shocks depends on when you look. The number a volatility model has to follow is therefore not the plain variance of all 1,859 days. It is the variance of today's shock given the shocks up to yesterday, called the **conditional variance**.

How do we predict it? The shocks average 0, so the average of a squared shock is the variance, which makes a squared shock a noisy measurement of that day's variance. If busy days follow busy days, the squared shocks should be correlated from one day to the next.

```r
# Check whether a large squared shock is followed by a large squared shock
round(acf(e^2, plot = FALSE)$acf[2], 3)   # lag 1 autocorrelation of the squared shocks
round(2 / sqrt(length(e)), 3)             # the band around 0 that chance alone stays inside
#> [1] 0.105
#> [1] 0.046
```

The lag 1 autocorrelation is 0.105. With 1,859 days, chance alone would keep it within about 0.046 of zero (two divided by the square root of 1,859), so yesterday's squared shock does carry information about today's variance.

An **ARCH(q)** model uses exactly that. It writes today's conditional variance as a constant plus a weighted sum of the last q squared shocks.

\[ \sigma_t^2 = \omega + \alpha_1 \varepsilon_{t-1}^2 + \alpha_2 \varepsilon_{t-2}^2 + \cdots + \alpha_q \varepsilon_{t-q}^2 \]

Here \(\sigma_t^2\) is the conditional variance of day t, \(\varepsilon_{t-j}^2\) is the squared shock j days back, \(\omega\) is a constant and the \(\alpha_j\) are the weights. So a large shock j days ago raises today's variance by \(\alpha_j\) times its square.

How many lags do we need? Let's fit ARCH(1), ARCH(5) and ARCH(10) and compare them by AIC. AIC is minus twice the log-likelihood plus twice the number of parameters, so lower is better and every extra parameter adds a penalty of 2. In `garch(e, order = c(0, q))`, the first number is the count of GARCH terms and the second is the count of ARCH terms, so `c(0, q)` is ARCH(q).

```r
# Fit ARCH(1), ARCH(5) and ARCH(10) and compare their AIC
fit_arch1  <- garch(e, order = c(0, 1),  trace = FALSE)
fit_arch5  <- garch(e, order = c(0, 5),  trace = FALSE)
fit_arch10 <- garch(e, order = c(0, 10), trace = FALSE)
arch_fits  <- list(fit_arch1, fit_arch5, fit_arch10)

data.frame(
  q          = c(1, 5, 10),
  parameters = sapply(arch_fits, function(f) length(coef(f))),
  AIC        = round(sapply(arch_fits, AIC), 2)
)
#>    q parameters     AIC
#> 1  1          2 4398.58
#> 2  5          6 4340.46
#> 3 10         11 4292.34
```

The AIC falls from 4398.58 to 4340.46 to 4292.34, even though ARCH(10) has 11 parameters (the constant and ten weights) against 2 for ARCH(1). So the FTSE 100 shocks call for a long lag order. Here are the ten weights of ARCH(10).

```r
# Print the ten ARCH(10) weights and plot them
arch10_w <- coef(fit_arch10)[-1]   # drop the constant, keep the ten weights
round(arch10_w, 4)
#>     a1     a2     a3     a4     a5     a6     a7     a8     a9    a10
#> 0.0587 0.0542 0.0782 0.0064 0.0552 0.0761 0.1214 0.0428 0.0114 0.0529
round(sum(arch10_w), 4)
#> [1] 0.5573

barplot(arch10_w, names.arg = 1:10, col = "grey70",
        xlab = "days back", ylab = "weight on the squared shock")
```

All ten weights are positive and they add up to 0.5573. But they do not fall off smoothly: lag 4 gets 0.0064 and lag 7 gets 0.1214. A variance that reacts to shocks from 10 days back takes ten weights to write down one lag at a time, so is there a shorter way to carry the old shocks along?

=== step === concept
## How adding yesterday's variance gives GARCH(1,1)

There is a shorter way. Yesterday's conditional variance was built from the shocks before it, so it already carries what those older shocks did. Adding it as a second term to the ARCH(1) equation gives **GARCH(1,1)**.

\[ \sigma_t^2 = \omega + \alpha \varepsilon_{t-1}^2 + \beta \sigma_{t-1}^2 \]

The weight \(\alpha\) multiplies yesterday's squared shock, and the weight \(\beta\) multiplies yesterday's conditional variance. The two 1s in (1,1) count one GARCH term, the \(\beta\) one, and one ARCH term, the \(\alpha\) one. That leaves three parameters: \(\omega\), \(\alpha\) and \(\beta\).

The block below fits GARCH(1,1) to the shocks and prints each coefficient with its standard error. In `tseries`, `order = c(p, q)` puts the GARCH order first, so `c(1, 1)` is GARCH(1,1) and `c(0, 10)` was ARCH(10). The `fGarch` package takes the two orders the other way round, ARCH first.

```r
# Fit GARCH(1,1) to the shocks and read its coefficients
fit_garch <- garch(e, order = c(1, 1), trace = FALSE)
round(summary(fit_garch)$coef[, 1:2], 5)   # estimates and standard errors
#>     Estimate  Std. Error
#> a0   0.00848     0.00300
#> a1   0.04501     0.00687
#> b1   0.94252     0.01023

a0 <- coef(fit_garch)[["a0"]]   # omega
a1 <- coef(fit_garch)[["a1"]]   # alpha
b1 <- coef(fit_garch)[["b1"]]   # beta

round(c(parameters = length(coef(fit_garch)), AIC = AIC(fit_garch), AIC_arch10 = AIC(fit_arch10)), 2)
#> parameters        AIC AIC_arch10
#>       3.00    4273.72    4292.34
```

Omega is 0.00848, alpha is 0.04501 (standard error 0.00687) and beta is 0.94252 (standard error 0.01023). Three parameters give an AIC of 4273.72, lower than the 4292.34 of ARCH(10), which needed 11.

Beta is close to 1, so most of yesterday's conditional variance carries over to today. Alpha is small, so one day's squared shock moves the variance only a little. Together they describe a variance that moves slowly from one day to the next.

The next plot draws the conditional standard deviation the fit gives each day, in red, over the absolute shocks in grey.

```r
# Plot the fitted conditional standard deviation over the absolute shocks
plot(abs(e), type = "h", col = "grey75", xlab = "trading day", ylab = "percent")
lines(fitted(fit_garch)[, 1], col = "red", lwd = 1.5)
legend("topleft", legend = c("absolute shock", "conditional standard deviation"),
       col = c("grey75", "red"), lty = 1, bty = "n")
```

The red line jumps after the days with the largest absolute shocks and then comes down slowly. That slow decline is the carry-over that beta produces.

=== step === concept
## How GARCH(1,1) works as an ARCH model of infinite order

The GARCH(1,1) equation has only one lagged squared shock in it, yet it does the work of a long ARCH. The reason is that yesterday's conditional variance is not a new quantity. It was built from the day before's squared shock and variance, so each day's variance is a running blend of every earlier shock. Substituting the equation into itself shows this exactly.

Start with the GARCH(1,1) equation and replace yesterday's variance with the same equation, one day earlier.

\[ \sigma_t^2 = \omega(1 + \beta) + \alpha \varepsilon_{t-1}^2 + \alpha\beta\, \varepsilon_{t-2}^2 + \beta^2 \sigma_{t-2}^2 \]

The squared shock from two days back has now entered, with weight \(\alpha\beta\). Replace \(\sigma_{t-2}^2\) the same way and a third squared shock enters, with weight \(\alpha\beta^2\). Each replacement leaves a leftover term \(\beta^k \sigma_{t-k}^2\), and it shrinks toward 0 as k grows because \(\beta\) is below 1. Repeat it without end and only the sum is left.

\[ \sigma_t^2 = \frac{\omega}{1 - \beta} + \alpha \sum_{j=1}^{\infty} \beta^{j-1} \varepsilon_{t-j}^2 \]

So the weight on the squared shock j days back is \(\alpha\beta^{j-1}\). That is an ARCH model with infinitely many lags, whose weights are fixed by just two numbers. Let's compute them from the fit.

```r
# Compute the GARCH(1,1) weights on the squared shock 1 to 10 days back
j <- 1:10
w_garch <- a1 * b1^(j - 1)
round(w_garch, 4)
#>  [1] 0.0450 0.0424 0.0400 0.0377 0.0355 0.0335 0.0316 0.0297 0.0280 0.0264
round(a1 / (1 - b1), 3)   # the weights added over all lags
#> [1] 0.783
```

The weight is 0.0450 at lag 1, 0.0355 at lag 5 and 0.0264 at lag 10, and each one is 0.9425 times the weight before it. Added over all lags, they come to alpha divided by 1 minus beta, which is 0.783. The bars below put these ten weights next to the ARCH(10) weights.

```r
# Plot the ARCH(10) weights beside the GARCH(1,1) weights
barplot(rbind(arch10_w, w_garch), beside = TRUE, names.arg = j,
        col = c("grey70", "#1f7a55"),
        xlab = "days back", ylab = "weight on the squared shock",
        legend.text = c("ARCH(10)", "GARCH(1,1)"))
```

ARCH(10) has ten free weights that bounce around and stop at lag 10. GARCH(1,1) draws one smooth curve from two numbers, and the curve keeps going past lag 10.

[KEY INSIGHT]
GARCH(1,1) is an ARCH model of infinite order whose weight on the squared shock j days back is alpha times beta to the power j minus 1. Three parameters replace a lag order of 10 or more, and the AIC is lower: 4273.72 against 4292.34.

=== step === concept
## Persistence, half-life and the unconditional variance

Alpha and beta are not read one at a time: how long a shock lasts depends on their sum.

Suppose a large shock arrives today. The shocks on the days after it are not known yet, so in a forecast we replace each future squared shock by its expected value, which is that day's conditional variance. Write \(f_k\) for the forecast of the variance k days after the shock. Then the forecast for the next day is built from the forecast for the day before it.

\[ f_{k+1} = \omega + (\alpha + \beta) f_k \]

The forecast stops changing at the value V where \(V = \omega + (\alpha + \beta)V\), which is \(V = \omega / (1 - \alpha - \beta)\). Subtract V from both sides of the equation above and the gap to V shrinks by the same factor every day.

\[ f_{k+1} - V = (\alpha + \beta)\,(f_k - V) \]

That gives three quantities to read off a fitted GARCH(1,1).

- **Persistence** is \(\alpha + \beta\). Each day, that share of the gap between the forecast and V is still there.
- **Half-life** is the number of days until half of the gap is gone. It solves \((\alpha + \beta)^h = 0.5\), so \(h = \ln(0.5) / \ln(\alpha + \beta)\).
- **Unconditional variance** is V, the level the variance forecast settles at. It exists only when \(\alpha + \beta\) is below 1. When \(\alpha + \beta = 1\) the model is called IGARCH: a shock never fades and there is no unconditional variance.

```r
# Compute persistence, half-life and the unconditional variance from the fit
pers       <- a1 + b1                # persistence
half_life  <- log(0.5) / log(pers)   # days until half of the gap is gone
uncond_var <- a0 / (1 - pers)        # unconditional variance

round(c(persistence = pers, half_life = half_life, uncond_var = uncond_var,
        uncond_sd = sqrt(uncond_var), sample_var = var(ftse)), 4)
#> persistence   half_life  uncond_var   uncond_sd  sample_var
#>      0.9875     55.2197      0.6801      0.8247      0.6333
```

Persistence is 0.9875, so the half-life is 55.2 days. The block works from the unrounded alpha plus beta, 0.98753; the rounded 0.9875 would give 55.1. The unconditional variance is 0.6801, a standard deviation of 0.8247, against a sample variance of 0.6333 (standard deviation 0.7958). The two need not match, because the first comes from the fitted coefficients and the second from averaging the squared shocks.

Let's follow one shock. Say the conditional variance sits at its unconditional value 0.6801 and a shock of 3 arrives. The variance forecast for the next day is omega plus alpha times 3 squared plus beta times 0.6801, and after that the gap to 0.6801 shrinks by the persistence each day.

```r
# Forecast the variance after a shock of 3, for the next 60 days
v_day1 <- a0 + a1 * 3^2 + b1 * uncond_var    # variance forecast for the day after the shock
days   <- c(1, seq(5, 60, by = 5))
v_path <- uncond_var + pers^(days - 1) * (v_day1 - uncond_var)

data.frame(day = days, variance = round(v_path, 4))
#>    day variance
#> 1    1   1.0546
#> 2    5   1.0363
#> 3   10   1.0146
#> 4   15   0.9942
#> 5   20   0.9751
#> 6   25   0.9572
#> 7   30   0.9403
#> 8   35   0.9245
#> 9   40   0.9096
#> 10  45   0.8957
#> 11  50   0.8826
#> 12  55   0.8703
#> 13  60   0.8587
round(pers^(c(20, 60) - 1), 2)   # share of the day 1 gap still there on day 20 and day 60
#> [1] 0.79 0.48
```

The chart plots the same 13 days. Day 1 is the day after the shock.

::widget chart-plotter {"x":"day","y":"variance_forecast","geoms":["line","bar"],"data":[{"x":1,"y":1.0546},{"x":5,"y":1.0363},{"x":10,"y":1.0146},{"x":15,"y":0.9942},{"x":20,"y":0.9751},{"x":25,"y":0.9572},{"x":30,"y":0.9403},{"x":35,"y":0.9245},{"x":40,"y":0.9096},{"x":45,"y":0.8957},{"x":50,"y":0.8826},{"x":55,"y":0.8703},{"x":60,"y":0.8587}]}

The forecast starts at 1.0546 and falls slowly. Of the day 1 gap above 0.6801, 79% is left on day 20 and 48% on day 60, so even after 60 days the forecast, 0.8587, is still above the unconditional variance.

The half-life is very sensitive to persistence. The next lines compute it for three values.

```r
# Compute the half-life for persistence of 0.90, 0.95 and 0.99
persistence <- c(0.90, 0.95, 0.99)
data.frame(persistence, half_life = round(log(0.5) / log(persistence), 1))
#>   persistence half_life
#> 1        0.90       6.6
#> 2        0.95      13.5
#> 3        0.99      69.0
```

Going from 0.95 to 0.99 multiplies the half-life by about 5, from 13.5 to 69.0 days.

[KEY INSIGHT]
A fitted GARCH(1,1) is read by three numbers. Persistence alpha plus beta says how much of a variance gap carries over to the next day (0.9875), the half-life says how long the gap takes to halve (55.2 days), and the unconditional variance says where the forecast ends up (0.6801).

=== step === concept
## How alpha and beta change the volatility path

Persistence tells us how long a shock lasts, but alpha and beta are two numbers and each does its own job. Alpha is the weight on yesterday's squared shock, so it sets how far one shock pushes the variance. Beta is the share of yesterday's variance that carries over to today.

To see both at work, the block below simulates 500 days from the GARCH(1,1) equation under three settings of alpha and beta. Every setting uses the same 500 standard normal draws z, so the paths differ only through alpha and beta. A day's shock is that day's standard deviation times one draw, which makes its square the variance times z squared. And omega is set to 0.6801 times (1 minus alpha minus beta), so all three settings share the unconditional variance 0.6801.

The first setting is the FTSE 100 fit. The other two are a high alpha and a high beta. You can edit the alpha and beta values in the `settings` table and run the block again.

```r
# Simulate 500-day GARCH(1,1) variance paths for three settings of alpha and beta
set.seed(7)
n <- 500
z <- rnorm(n)   # the same standard normal draws for every setting

settings <- data.frame(
  label = c("FTSE fit", "High alpha", "High beta"),
  alpha = c(a1, 0.15, 0.04),
  beta  = c(b1, 0.80, 0.95)
)

simulate_variance <- function(alpha, beta) {
  omega <- uncond_var * (1 - alpha - beta)
  v <- numeric(n)
  v[1] <- uncond_var
  for (i in 2:n) {
    shock_sq <- v[i - 1] * z[i - 1]^2
    v[i] <- omega + alpha * shock_sq + beta * v[i - 1]
  }
  v
}

paths <- lapply(seq_len(nrow(settings)), function(i) {
  simulate_variance(settings$alpha[i], settings$beta[i])
})

persistence <- settings$alpha + settings$beta
data.frame(
  label       = settings$label,
  alpha       = round(settings$alpha, 4),
  beta        = round(settings$beta, 4),
  persistence = round(persistence, 4),
  half_life   = round(log(0.5) / log(persistence), 1),
  max_sd      = round(sapply(paths, function(v) max(sqrt(v))), 2),
  acf_lag10   = round(sapply(paths, function(v) acf(v, plot = FALSE, lag.max = 10)$acf[11]), 2)
)
#>        label alpha   beta persistence half_life max_sd acf_lag10
#> 1   FTSE fit 0.045 0.9425      0.9875      55.2   1.11      0.80
#> 2 High alpha 0.150 0.8000      0.9500      13.5   1.65      0.45
#> 3  High beta 0.040 0.9500      0.9900      69.0   1.08      0.83

par(mfrow = c(3, 1), mar = c(3, 4, 2, 1))
sd_range <- range(sqrt(unlist(paths)))
for (i in seq_along(paths)) {
  plot(sqrt(paths[[i]]), type = "l", ylim = sd_range,
       xlab = "day", ylab = "conditional sd", main = settings$label[i])
}
```

The table reads back the three settings. `max_sd` is the largest conditional standard deviation on the path, and `acf_lag10` is the correlation between the variance on one day and the variance 10 days later.

The setting with the largest alpha, 0.15, has the highest peak: its conditional standard deviation reaches 1.65, against 1.11 and 1.08. But its persistence is 0.95, its half-life 13.5 days, and its lag 10 correlation only 0.45, so its spikes fade quickly. The setting with the largest beta, 0.95, has the longest half-life, 69.0 days, and the highest lag 10 correlation, 0.83.

So persistence alone tells how long a shock lasts. How that persistence is split between alpha and beta tells how sharp the spike is.

=== step === quiz
## Quick check: which setting makes a volatility shock last longer?

Two GARCH(1,1) settings have the same unconditional variance, 0.6801. Setting A has alpha 0.15 and beta 0.80. Setting B has alpha 0.04 and beta 0.95. After a large shock, in which setting does the variance take longer to fall back toward 0.6801?

::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Setting A, because its larger alpha makes the variance respond more, so the effect lasts longer. ::no
- Setting B, because its persistence, alpha plus beta, is 0.99 against 0.95 for A, which gives a half-life of 69.0 days against 13.5. ::ok Yes. How long a shock lasts depends on alpha plus beta, and B's 0.99 is higher than A's 0.95. A's larger alpha only makes its first response bigger.
- Both take the same time, because both have the same unconditional variance. ::no
- It cannot be told from alpha and beta alone. ::no How long a shock lasts is set by alpha plus beta alone, since the gap to the unconditional variance shrinks by that factor each day. Alpha by itself sets how far the variance jumps on the first day, and the unconditional variance is only where the forecast ends up, not how fast it gets there. Setting A jumps further but its gap halves in 13.5 days, while B's takes 69.0.

=== step === concept
## GJR-GARCH: a larger weight for negative returns

The GARCH(1,1) equation uses the squared shock, and a square loses the sign. So a shock of -2 and a shock of 2 raise the next day's variance by exactly the same amount. Let's check it with the fitted coefficients, taking yesterday's conditional variance as 0.68, which is close to the unconditional variance.

```r
# Compute next-day variance from the GARCH(1,1) fit after a shock of -2 and of 2
v_yest <- 0.68
round(c(fall = a0 + a1 * (-2)^2 + b1 * v_yest,
        rise = a0 + a1 * 2^2 + b1 * v_yest), 4)
#>   fall   rise
#> 0.8294 0.8294
```

Both give 0.8294. Call a negative shock a fall and a positive shock a rise. For stock indexes, a fall is often followed by higher volatility than a rise of the same size, and GARCH(1,1) cannot express that. The **GJR** model, named after Glosten, Jagannathan and Runkle, adds one term for it.

\[ \sigma_t^2 = \omega + \left(\alpha + \gamma\, I_{t-1}\right)\varepsilon_{t-1}^2 + \beta \sigma_{t-1}^2 \]

Here \(I_{t-1}\) is 1 when yesterday's shock was a fall and 0 when it was a rise. So the weight on the squared shock is \(\alpha\) after a rise and \(\alpha + \gamma\) after a fall. With \(\gamma = 0\) this is GARCH(1,1), and \(\gamma > 0\) means falls count for more.

The `fGarch` package has no GJR keyword, but its APARCH model contains GJR. Setting `delta = 2` and `include.delta = FALSE` in `aparch(1, 1)` fixes its power parameter delta at 2, and what is left is this equation.

\[ \sigma_t^2 = \omega + \alpha_1 \left(\lvert \varepsilon_{t-1} \rvert - \gamma_1 \varepsilon_{t-1}\right)^2 + \beta_1 \sigma_{t-1}^2 \]

The coefficients alpha1 and gamma1 are fGarch's own, not the \(\alpha\) and \(\gamma\) of the GJR equation above, but they give the same two weights: alpha1 times (1 + gamma1) squared on a squared fall, and alpha1 times (1 - gamma1) squared on a squared rise. A positive gamma1 gives falls the larger weight, and gamma1 = 0 gives GARCH(1,1).

```r
# Fit GARCH(1,1) and the GJR model to the FTSE 100 returns with fGarch
suppressMessages(library(fGarch))
fit_garch_f <- garchFit(~ garch(1, 1), data = ftse, trace = FALSE)
fit_gjr     <- garchFit(~ aparch(1, 1), data = ftse, delta = 2, include.delta = FALSE, trace = FALSE)

round(fit_gjr@fit$matcoef, 4)   # estimate, standard error, t value, p-value
#>         Estimate  Std. Error  t value Pr(>|t|)
#> mu        0.0368      0.0169   2.1778   0.0294
#> omega     0.0085      0.0031   2.7337   0.0063
#> alpha1    0.0327      0.0090   3.6519   0.0003
#> gamma1    0.5032      0.1699   2.9621   0.0031
#> beta1     0.9471      0.0110  85.9021   0.0000

gjr_cf <- coef(fit_gjr)
w_fall <- gjr_cf[["alpha1"]] * (1 + gjr_cf[["gamma1"]])^2   # weight on a squared fall
w_rise <- gjr_cf[["alpha1"]] * (1 - gjr_cf[["gamma1"]])^2   # weight on a squared rise
round(c(w_fall = w_fall, w_rise = w_rise, ratio = w_fall / w_rise), 4)
#> w_fall w_rise  ratio
#> 0.0739 0.0081 9.1574
```

The estimate of gamma1 is 0.5032 with a standard error of 0.1699 (t = 2.96), about three standard errors above 0. The weight on a squared fall is 0.0739 and on a squared rise 0.0081, a ratio of 9.2. So in this fit, a shock of a given size counts 9.2 times as much toward the next day's variance when it is a fall.

The persistence of a GJR model is not just alpha1 plus beta1, because the weight on the squared shock depends on the sign. If falls and rises are equally likely, which holds when the shocks have a symmetric distribution, the average weight is the mean of the two weights.

```r
# Compute the persistence of the GJR fit and compare the two fits by AIC
round(gjr_cf[["beta1"]] + (w_fall + w_rise) / 2, 4)   # persistence
#> [1] 0.9881

# fGarch reports AIC per observation, so multiply by the number of days
round(c(GARCH = fit_garch_f@fit$ics[["AIC"]], GJR = fit_gjr@fit$ics[["AIC"]]) * length(ftse), 1)
#>  GARCH    GJR
#> 4277.6 4256.5
```

The persistence is beta1 plus that average weight: 0.9471 + (0.0739 + 0.0081) / 2 = 0.9881. The AIC compares the two fGarch fits with each other. Both estimate a mean, which the `tseries` fit did not, so their AIC values are not comparable with 4273.72. GJR gets 4256.5 against 4277.6 for GARCH(1,1), lower by 21.1 with one more parameter.

=== step === concept
## The news impact curve of GARCH and GJR

A **news impact curve** shows how a model turns yesterday's shock into today's conditional variance. It plots next-day variance against yesterday's shock, with yesterday's variance held fixed. The block below computes it from the GJR coefficients at a yesterday's variance of 0.68, for shocks of -2, 0 and 2.

```r
# Compute next-day variance from the GJR fit after a shock of -2, 0 and 2
next_var_gjr <- function(shock) {
  weight <- ifelse(shock < 0, w_fall, w_rise)
  gjr_cf[["omega"]] + weight * shock^2 + gjr_cf[["beta1"]] * v_yest
}

round(next_var_gjr(c(-2, 0, 2)), 4)
#> [1] 0.9482 0.6525 0.6848
round(sqrt(next_var_gjr(c(-2, 2))), 3)   # the same values as standard deviations
#> [1] 0.974 0.828
round(next_var_gjr(c(-2, 2)) - next_var_gjr(0), 4)   # rise over the no-shock value
#> [1] 0.2957 0.0323
```

The chart plots the same curve for shocks from -4 to 4 in steps of 0.5. The line and bar buttons switch between the two ways of drawing it.

::widget chart-plotter {"x":"yesterday_shock","y":"next_day_variance","geoms":["line","bar"],"data":[{"x":-4,"y":1.8354},{"x":-3.5,"y":1.5581},{"x":-3,"y":1.3179},{"x":-2.5,"y":1.1146},{"x":-2,"y":0.9482},{"x":-1.5,"y":0.8188},{"x":-1,"y":0.7264},{"x":-0.5,"y":0.6710},{"x":0,"y":0.6525},{"x":0.5,"y":0.6545},{"x":1,"y":0.6606},{"x":1.5,"y":0.6707},{"x":2,"y":0.6848},{"x":2.5,"y":0.7030},{"x":3,"y":0.7252},{"x":3.5,"y":0.7514},{"x":4,"y":0.7817}]}

After a fall of 2 the next-day variance is 0.9482, a standard deviation of 0.974. After a rise of 2 it is 0.6848, a standard deviation of 0.828. With no shock it is 0.6525.

So a fall of 2 lifts the variance 0.2957 above its no-shock value and a rise of 2 lifts it 0.0323 above it, the same 9.2 to 1 as the two weights. The GARCH(1,1) fit gives 0.8294 at both -2 and 2, a symmetric curve. The GJR curve is much steeper on the left, which is the asymmetry that GARCH(1,1) cannot show.

=== step === concept
## EGARCH: modelling the log of the variance

GJR changes the weight when the shock is negative. **EGARCH** takes a different route: it models the logarithm of the variance. In the notation of the `rugarch` package, the equation is the following.

\[ \ln \sigma_t^2 = \omega + \beta \ln \sigma_{t-1}^2 + \alpha z_{t-1} + \gamma \left( \lvert z_{t-1} \rvert - E\lvert z \rvert \right), \qquad z_{t-1} = \frac{\varepsilon_{t-1}}{\sigma_{t-1}} \]

Here \(z_{t-1}\) is yesterday's shock divided by yesterday's conditional standard deviation, and \(E\lvert z \rvert\) is the average size of \(z\). The term with \(\gamma\) reacts to how big the shock was, whatever its sign. The term \(\alpha z_{t-1}\) reacts to its sign.

There are two consequences.

1. The right side can be any number, positive or negative, and the variance is its exponential, which is always positive. GARCH and GJR need omega above 0 and non-negative weights to keep the variance positive. EGARCH needs no such constraint.
2. When \(\alpha\) is negative, a fall (\(z\) below 0) adds to the log variance and a rise of the same size subtracts from it, so falls raise the variance more. Because the log variance is what changes, the effect on the variance itself is multiplicative.

Let's put numbers on it. Take yesterday's conditional variance as 0.68, a standard deviation of 0.8246. A shock of -2 gives z = -2 / 0.8246 = -2.43, and a shock of 2 gives z = 2.43. The \(\gamma\) term is the same for both, because \(\lvert z \rvert\) is the same, so the two log variances differ only through \(\alpha z\): by -4.85 times \(\alpha\), whatever omega, beta and gamma are. That makes the variance after a fall exp(-4.85 alpha) times the variance after a rise.

EGARCH is in the `rugarch` package, which does not run in this lesson's browser session, so the specification below is for your own machine. It only declares the model; there is no fit here.

```r-static
# Specify an EGARCH(1,1) model with rugarch (run this locally)
library(rugarch)
spec_egarch <- ugarchspec(
  variance.model = list(model = "eGARCH", garchOrder = c(1, 1)),
  mean.model     = list(armaOrder = c(0, 0))
)
```

GJR and EGARCH answer the same question in two ways. GJR gives a fall its own weight, and EGARCH puts the sign into the log variance.

=== step === quiz
## Quick check: what do the GJR weights say about the FTSE 100?

The GJR fit to the FTSE 100 gave a weight of 0.0739 on a squared fall, 0.0081 on a squared rise, and a beta1 of 0.9471. Which sentence reads the fit correctly?

::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- A fall and a rise of the same size raise the next day's variance by the same amount, because alpha1 is a single coefficient. ::no
- Persistence is 0.0081 + 0.9471 = 0.9552, because only rises count toward it. ::no
- A fall raises the next day's variance more than a rise of the same size, and the persistence is about 0.988. ::ok Yes. The weight on a squared fall is 9.2 times the weight on a squared rise, and persistence is beta1 plus the average of the two weights, 0.9471 + (0.0739 + 0.0081) / 2 = 0.9881.
- Persistence is 0.0739 + 0.9471 = 1.021, above 1, so the fit is unstable. ::no Persistence in a GJR model uses the average of the two weights, not one of them, because falls and rises are equally likely. That gives 0.9471 + (0.0739 + 0.0081) / 2 = 0.9881, below 1. And the two weights differ, 0.0739 on a fall against 0.0081 on a rise, so a fall of a given size raises the next day's variance more.

=== step === tryit
## Your turn: how long do shocks last in the SMI returns?

The SMI is the Swiss stock index, and it sits in the same `EuStockMarkets` data as the FTSE 100. The block below builds its daily returns in percent and its shocks. Fit GARCH(1,1) to the shocks with `tseries::garch()`, then compute the persistence, the half-life in days, and the weight on the squared shock 5 days back, which is alpha times beta to the power 4.

```r
# Fit GARCH(1,1) to the SMI shocks, then compute persistence, half-life and one weight
smi   <- 100 * diff(log(as.numeric(EuStockMarkets[, "SMI"])))   # SMI daily returns in percent
e_smi <- smi - mean(smi)                                        # shocks

# 1. Fit GARCH(1,1) to e_smi and keep alpha and beta from the coefficients.
# 2. Compute the persistence and the half-life in days.
# 3. Compute the weight on the squared shock 5 days back.
# Press Check when you have them.
```
::check {"regex": "log[(]0?[.]5[)]\\s*/\\s*log[(]", "gate": true, "difficulty": "intermediate", "ok": "Yes: persistence 0.8579 gives a half-life of 4.5 days, against 55.2 for the FTSE 100, and the weight on the squared shock 5 days back is 0.0362. In this fit, half of a shock's effect on the SMI variance is gone in about 4.5 days.", "no": "The half-life comes from persistence: `log(0.5) / log(alpha + beta)`, with alpha and beta taken from `coef(fit)`. The weight on the squared shock 5 days back is `alpha * beta^4`."}
::solution
```r
# Fit GARCH(1,1) to the SMI shocks, then compute persistence, half-life and one weight
fit_smi <- garch(e_smi, order = c(1, 1), trace = FALSE)
round(coef(fit_smi), 4)
#>     a0     a1     b1
#> 0.1245 0.1269 0.7310

a1_smi <- coef(fit_smi)[["a1"]]
b1_smi <- coef(fit_smi)[["b1"]]

pers_smi      <- a1_smi + b1_smi
half_life_smi <- log(0.5) / log(pers_smi)
weight5_smi   <- a1_smi * b1_smi^4
round(c(persistence = pers_smi, half_life = half_life_smi, weight_5 = weight5_smi), 4)
#> persistence   half_life    weight_5
#>      0.8579      4.5227      0.0362
```

The SMI alpha is 0.1269, nearly three times the FTSE 100's 0.0450, and its beta is 0.7310 against 0.9425. So a shock moves the SMI variance more, but it fades much faster: the half-life is 4.5 days against 55.2.

=== step === concept
## References
::prose-only the step lists sources and needs no visual

- [Autoregressive conditional heteroscedasticity with estimates of the variance of United Kingdom inflation](https://doi.org/10.2307/1912773) - Engle (1982), Econometrica 50(4), 987-1007. Introduces the ARCH model, fitted to UK inflation.
- [Generalized autoregressive conditional heteroskedasticity](https://doi.org/10.1016/0304-4076(86)90063-1) - Bollerslev (1986), Journal of Econometrics 31(3), 307-327. Adds the lagged conditional variance, which gives GARCH.
- [On the relation between the expected value and the volatility of the nominal excess return on stocks](https://doi.org/10.1111/j.1540-6261.1993.tb05128.x) - Glosten, Jagannathan and Runkle (1993), Journal of Finance 48(5), 1779-1801. The source of the extra weight on negative shocks.
- [Conditional heteroskedasticity in asset returns: a new approach](https://doi.org/10.2307/2938260) - Nelson (1991), Econometrica 59(2), 347-370. Introduces EGARCH.
- [A long memory property of stock market returns and a new model](https://doi.org/10.1016/0927-5398(93)90006-D) - Ding, Granger and Engle (1993), Journal of Empirical Finance 1(1), 83-106. Introduces the APARCH model that `fGarch` fits, which contains GJR as a special case.

=== step === complete
## Quick recap

You started from a stock index whose variance changes over time, and built up the GARCH family one equation at a time. To summarize:

- ARCH(10) needs 11 parameters (AIC 4292.34) to follow the FTSE 100 shocks. GARCH(1,1) does it with 3 (AIC 4273.72) by adding yesterday's conditional variance.
- Written out, GARCH(1,1) is an ARCH model of infinite order. Its weight on the squared shock j days back is alpha times beta to the power j minus 1: 0.0450, 0.0424, 0.0400 and so on.
- A fitted GARCH(1,1) is read by persistence (0.9875), half-life (55.2 days) and unconditional variance (0.6801). The gap between the variance forecast and the unconditional variance shrinks by the persistence every day.
- Alpha sets how far one shock pushes the variance, and alpha plus beta sets how long the push lasts.
- GJR gives a fall its own weight: 0.0739 on a squared fall against 0.0081 on a squared rise, so a fall raises next-day variance 9.2 times as much as a rise of the same size.
- EGARCH models the log of the variance, so the variance stays positive with no constraints, and a negative alpha makes a fall raise it more.

So when someone shows you a fitted GARCH(1,1) with alpha 0.045 and beta 0.9425, you can read it in one breath: a shock lifts the variance by alpha times its square, 98.75% of the gap to the unconditional variance carries over to the next day, and it takes about 55 days to halve.

The next lesson fits GARCH end to end in R with `tseries::garch()` and `fGarch::garchFit()`, with coefficient tables, standardized residual checks and Normal against Student-t errors.
