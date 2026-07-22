---
title: "TAR and STAR Models in R: Threshold Autoregression"
slug: "Threshold-ARMA-TARSTAR-in-R"
description: "TAR and STAR models in R from scratch: grid search the threshold, bootstrap the linearity test, fit SETAR and LSTAR, then forecast by simulation."
keywords: "TAR models in R, SETAR model, STAR model R, LSTAR model, threshold autoregression, regime switching time series, nonlinear time series R, tsDyn package, self-exciting threshold autoregressive"
auto_link_terms: "TAR model|TAR models|SETAR model|threshold autoregression|threshold autoregressive|threshold autoregressive model|STAR model|LSTAR model|smooth transition autoregressive|regime-switching model|self-exciting threshold|threshold variable|delay parameter|nonlinear time series model"
auto_link_case_sensitive: false
mathjax: true
webr: true
date: "2026-07-22"
curriculum_id: "FR-adva-11"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "TAR and STAR Models"
sidebar_order: 32
difficulty: "Advanced"
---

<p class="lead">A <strong>threshold autoregressive (TAR)</strong> model lets a time series obey one equation while it sits below some cut-off value and a completely different equation once it climbs above, flipping between them the moment a past value of the series crosses that line. A <strong>smooth transition (STAR)</strong> model keeps the same idea but replaces the hard flip with a dial that slides gradually from one equation to the other. This post builds both from scratch in base R, one runnable block at a time: you will write the estimator, the significance test, and the forecaster yourself before you ever call a package.</p>

## Why do linear AR models miss what threshold models catch?

Start with a series that linear models have never fitted well. R ships with `lynx`, the number of Canadian lynx trapped each year from 1821 to 1934. Populations like this rise gently as prey becomes abundant and then crash hard when food runs out. If that description is right, the *ups* and the *downs* of the series should not look alike. Let's measure that directly.

We take logarithms first, which is standard for count data because it turns proportional changes into equal-sized steps. Then `diff()` gives the year-on-year change, and we split those changes into risings and fallings.

```r title="Measure the rise and fall of the lynx series"
x <- log10(lynx)     # 114 annual lynx trappings, 1821 to 1934
steps <- diff(x)     # year-on-year change on the log scale

round(c(n_up      = sum(steps > 0),
        n_down    = sum(steps < 0),
        mean_up   = mean(steps[steps > 0]),
        mean_down = mean(steps[steps < 0])), 3)
#>      n_up    n_down   mean_up mean_down 
#>    70.000    43.000     0.244    -0.372 
```

Read the four numbers as a pair of stories. The series rose in 70 of the 113 transitions and fell in only 43, so it spends more years going up than coming down. But each fall is much bigger: the average drop of 0.372 is roughly half again the average climb of 0.244.

That is the signature of an asymmetric cycle. Many small steps up, then a few violent steps down. Here is what it looks like.

```r title="Plot the lynx cycles"
plot(x, type = "o", pch = 16, cex = 0.6, col = "#4a5fd4",
     main = "Canadian lynx trappings, 1821 to 1934",
     xlab = "Year", ylab = "log10(lynx trapped)")
abline(h = mean(x), lty = 2, col = "grey50")

round(range(x), 2)
#> [1] 1.59 3.84
```

The peaks are sharp and the troughs are broad and flat, like a row of shark fins rather than a row of sine waves. The series travels over two orders of magnitude, from about 39 animals to about 6,900.

Now here is the problem. A standard autoregressive model predicts today from a weighted sum of recent values, with one fixed set of weights that never changes. Let's fit an AR(2) to the lynx data, then generate a long artificial series from that fitted model and measure *its* asymmetry with the exact code we used above.

```r title="Simulate from the fitted linear AR(2)"
ar_fit <- ar(x, order.max = 2, aic = FALSE, method = "mle")
round(ar_fit$ar, 3)
#>    ar1    ar2 
#>  1.378 -0.740 

set.seed(11)
sim <- arima.sim(n = 20000, list(ar = ar_fit$ar), sd = sqrt(ar_fit$var.pred))
sim_steps <- diff(sim)

round(c(mean_up   = mean(sim_steps[sim_steps > 0]),
        mean_down = mean(sim_steps[sim_steps < 0])), 3)
#>   mean_up mean_down 
#>     0.285    -0.282 
```

Walk through what just happened. `ar()` estimated the two weights, 1.378 on last year and -0.740 on the year before, which together produce an oscillation. `arima.sim()` then rolled that fitted rule forward for 20,000 years to give us a huge sample of what the model believes lynx populations look like. Finally we measured rises and falls in the artificial data.

The simulated average rise is 0.285 and the average fall is -0.282. They are the same size to two decimal places. The model produces a series whose ups and downs are mirror images, while the real data climbs by 0.244 and crashes by 0.372.

[KEY INSIGHT]
**The symmetry is structural, not a fitting failure.** A linear autoregression built on symmetric shocks is reversible: run the fitted rule and it is equally willing to go up as down by the same amount, because the same coefficients apply at every level of the series. No amount of re-estimating, adding lags, or changing the sample can create asymmetry, because there is nothing in the model that knows whether the population is currently high or low. To get asymmetry you need the coefficients themselves to change with the state of the series.

That is precisely what a threshold model does.

**Try it:** Sunspot counts have the same reputation for rising slowly and falling fast. Measure the asymmetry in the annual sunspot series using the same recipe. The block below uses the raw counts, which are badly skewed. Change `sunspot.year` to `sqrt(sunspot.year)`, the standard variance-stabilising transform for this series, and run it again.

```r title="Your turn: measure asymmetry in sunspots"
# Goal: compare the average rise with the average fall.
# Change sunspot.year to sqrt(sunspot.year) below, then run.
ex_s <- sunspot.year
ex_d <- diff(ex_s)

round(c(mean_up = mean(ex_d[ex_d > 0]), mean_down = mean(ex_d[ex_d < 0])), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Sunspot asymmetry solution"
ex_s <- sqrt(sunspot.year)
ex_d <- diff(ex_s)

round(c(mean_up = mean(ex_d[ex_d > 0]), mean_down = mean(ex_d[ex_d < 0])), 3)
#>   mean_up mean_down 
#>     1.712    -1.201 
```

**Explanation:** On the square-root scale the average rise is 1.712 and the average fall is 1.201, so sunspot activity climbs about 43 percent faster than it decays. The asymmetry runs the opposite way to the lynx: sunspots shoot up and drift down, while lynx drift up and crash down. Both patterns are invisible to a linear model.

</details>

## What exactly is a TAR model, and what does the delay do?

A threshold autoregressive model is two ordinary AR models plus a rule for choosing between them. Written out for two regimes and one lag, it says:

$$x_t = \begin{cases} \phi_{1,0} + \phi_{1,1}x_{t-1} + \varepsilon_t & \text{if } z_t \le r \\[4pt] \phi_{2,0} + \phi_{2,1}x_{t-1} + \varepsilon_t & \text{if } z_t > r \end{cases}$$

Where:

- $x_t$ is the value of the series at time $t$, the thing we are predicting
- $r$ is the **threshold**, the cut-off that separates the two regimes
- $z_t$ is the **threshold variable**, the quantity we compare against $r$
- $\phi_{1,\cdot}$ are the coefficients used in the lower regime, $\phi_{2,\cdot}$ those used in the upper regime
- $\varepsilon_t$ is the usual random shock

Everything hangs on what you use for $z_t$. When the threshold variable is a past value of the series itself, so $z_t = x_{t-d}$, the model is called **self-exciting**, giving the name SETAR. The series decides its own regime. That is the version used in almost all practice and the version we build here.

The number $d$ in $x_{t-d}$ is the **delay parameter**. It answers "how far back does the series look when deciding which rule to apply today?" With $d = 1$ the model checks last period; with $d = 2$ it checks two periods ago.

![How a SETAR picks a regime each period](screenshots/Threshold-ARMA-TARSTAR-in-R-regime-switch.webp)

*Figure 1: A SETAR looks back d periods, compares that value with the threshold, and applies the matching AR equation.*

[NOTE]
**TAR is the family, SETAR is the common member.** A general TAR model allows the threshold variable to be anything you like, including an unrelated series such as an interest rate or a temperature index. A SETAR restricts it to a lagged value of the series being modelled. Every SETAR is a TAR, but not every TAR is a SETAR.

The fastest way to understand a model is to *be* the model. The loop below generates data one period at a time, checking the previous value against a threshold of zero and applying whichever equation matches. The lower regime has a coefficient of 0.90, which is close to 1, so the series climbs slowly and persistently. The upper regime has a coefficient of 0.40 and a constant of -1.20, which pulls the series back down sharply.

```r title="Simulate a two-regime SETAR by hand"
set.seed(7)
n <- 600
y <- numeric(n)
y[1] <- 0

for (t in 2:n) {
  if (y[t - 1] <= 0) {
    y[t] <-  0.30 + 0.90 * y[t - 1] + rnorm(1, sd = 0.5)   # lower regime: slow climb
  } else {
    y[t] <- -1.20 + 0.40 * y[t - 1] + rnorm(1, sd = 0.5)   # upper regime: sharp drop
  }
}

round(head(y, 8), 3)
#> [1]  0.000  1.444 -1.221 -1.146 -0.938 -1.029 -1.100 -0.316
```

Follow the first three values by hand. We start at `y[1] = 0`, which satisfies `y[1] <= 0`, so period 2 uses the lower rule and lands at 1.444 after a lucky shock. Now 1.444 is above zero, so period 3 uses the upper rule: `-1.20 + 0.40 * 1.444` is about -0.62, and the shock pushes it to -1.221. One period above the line was enough to trigger the crash.

Because the two rules pull in opposite directions, the series cannot settle anywhere. It drifts upward until it crosses zero. Then it gets knocked straight back down, and the whole pattern starts over. Let's see how the time splits between the two rules.

```r title="Count time spent in each regime"
regime <- ifelse(head(y, -1) <= 0, "lower", "upper")

table(regime)
#> regime
#> lower upper 
#>   467   132 

round(c(mean_next_lower = mean(y[-1][regime == "lower"]),
        mean_next_upper = mean(y[-1][regime == "upper"])), 3)
#> mean_next_lower mean_next_upper 
#>          -0.422          -0.980 
```

The series spends 467 periods in the lower regime and only 132 in the upper, a 78-to-22 split. That imbalance is the point: crossing the threshold is a rare, brief event that is quickly undone. The second line confirms the mechanism, since the average value following an upper-regime period is -0.980, far below the average of -0.422 following a lower-regime period. Being above the line predicts a fall.

Now let's look at the series with each point coloured by the regime that produced it.

```r title="Plot the simulated series by regime"
plot(y, type = "l", col = "grey65", main = "A simulated two-regime SETAR",
     xlab = "period", ylab = "y")
points(2:n, y[-1], pch = 16, cex = 0.5,
       col = ifelse(regime == "lower", "#4a5fd4", "#d4534a"))
abline(h = 0, lty = 2)

round(c(min = min(y), max = max(y)), 2)
#>   min   max 
#> -2.37  1.44 
```

The blue points sit in the slow upward drifts and the red points cluster at the tops, immediately before each fall. That is the same shark-fin shape we saw in the lynx data, produced here by nothing more exotic than an `if` statement.

Now for the delay. Our simulation used `y[t - 1]`, so $d = 1$. Had we used `y[t - 2]` the regime classification would differ, and the difference is not small.

```r title="Compare delay 1 with delay 2"
table(delay1 = y[2:(n - 1)] <= 0, delay2 = y[1:(n - 2)] <= 0)
#>       delay2
#> delay1 FALSE TRUE
#>  FALSE     4  128
#>  TRUE    128  338
```

The table cross-tabulates the regime each rule assigns. The diagonal cells (4 and 338) are periods where both delays agree; the off-diagonal cells are where they disagree, and there are 128 + 128 = 256 of them out of 598 periods. The two delays disagree 43 percent of the time.

That matters because the delay is not something you can eyeball. It has to be estimated alongside the threshold, which is exactly what we do next.

**Try it:** The split between regimes depends on where you put the threshold. Recount the regimes using a threshold of 0.5 instead of 0. Do you expect the upper regime to gain or lose observations?

```r title="Your turn: recount at a different threshold"
# Goal: see how the regime split moves when the threshold moves.
# Change ex_thr from 0 to 0.5, then run.
ex_thr <- 0
ex_reg <- ifelse(head(y, -1) <= ex_thr, "lower", "upper")

table(ex_reg)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Threshold recount solution"
ex_thr <- 0.5
ex_reg <- ifelse(head(y, -1) <= ex_thr, "lower", "upper")

table(ex_reg)
#> ex_reg
#> lower upper 
#>   554    45 
```

**Explanation:** Raising the threshold to 0.5 moves the line upward, so observations that used to count as "upper" now fall below it. The upper regime shrinks from 132 to 45 and the lower grows from 467 to 554. Push the threshold high enough and the upper regime runs out of data entirely, which is why the search procedure in the next section has to refuse extreme candidates.

</details>

## How do you estimate the threshold from the data?

Here is the difficulty. If someone hands you the threshold, fitting is trivial: split the rows into two groups and run ordinary least squares in each. But nobody hands you the threshold. It has to come out of the data, and it appears inside an `if` statement rather than as a coefficient you can differentiate.

The way around this is the observation that makes the whole field practical. **Hold the threshold fixed and the model is completely linear.** So we can try every plausible threshold, fit the cheap linear model for each one, and keep whichever gives the smallest total error. That procedure is called conditional least squares.

![Estimating the threshold by grid search](screenshots/Threshold-ARMA-TARSTAR-in-R-threshold-search.webp)

*Figure 2: Conditional least squares scores every candidate threshold and keeps the one with the smallest total squared error.*

To build it we first need the data in a shape regression understands: one row per time point, with the response in one column and the lagged predictors beside it. Base R's `embed()` does this. Given a series and a window width `k`, it returns a matrix whose first column is $x_t$, second column $x_{t-1}$, and so on.

```r title="Build the lagged design matrix"
lag_matrix <- function(x, p, d) {
  k <- max(p, d) + 1
  E <- embed(x, k)                       # column 1 = x[t], column j+1 = x[t-j]
  list(y = E[, 1],                                    # response
       X = cbind(1, E[, 2:(p + 1), drop = FALSE]),    # intercept plus p lags
       z = E[, d + 1])                                # threshold variable x[t-d]
}

m1 <- lag_matrix(y, p = 1, d = 1)
c(rows = length(m1$y), cols = ncol(m1$X))
#> rows cols 
#>  599    2 

round(head(cbind(y_t = m1$y, const = m1$X[, 1], y_lag1 = m1$X[, 2], z_t = m1$z), 4), 3)
#>         y_t const y_lag1    z_t
#> [1,]  1.444     1  0.000  0.000
#> [2,] -1.221     1  1.444  1.444
#> [3,] -1.146     1 -1.221 -1.221
#> [4,] -0.938     1 -1.146 -1.146
```

The function returns three pieces: the response `y`, the predictor matrix `X` with a column of ones for the intercept, and the threshold variable `z`. We lose the first `k - 1` observations because they have no complete history, which is why 600 values became 599 rows.

Look at the printed rows to confirm the alignment. In row 2 the response is -1.221, the lagged predictor is 1.444, and the threshold variable is also 1.444. With `p = 1` and `d = 1` the lag and the threshold variable are the same column, which is the usual setup. When `d` differs from 1 they separate.

Now the scoring function. For a candidate threshold it splits the rows in two, then runs a regression inside each half and adds up the resulting errors. We use `.lm.fit()` rather than `lm()` because it skips all the formula parsing and summary machinery, which matters when you are about to call it thousands of times.

```r title="Score one candidate threshold"
setar_ssr <- function(x, thr, p = 1, d = 1) {
  m  <- lag_matrix(x, p, d)
  lo <- m$z <= thr
  if (sum(lo) < p + 2 || sum(!lo) < p + 2) return(NA_real_)   # refuse empty regimes
  ssr <- 0
  for (g in list(lo, !lo)) {
    ssr <- ssr + sum(.lm.fit(m$X[g, , drop = FALSE], m$y[g])$residuals^2)
  }
  ssr
}

lin_ssr <- function(x, p = 1, d = 1) {          # the one-regime benchmark
  m <- lag_matrix(x, p, d)
  sum(.lm.fit(m$X, m$y)$residuals^2)
}

round(c(thr_minus1 = setar_ssr(y, -1), thr_zero = setar_ssr(y, 0),
        thr_plus05 = setar_ssr(y, 0.5), linear = lin_ssr(y, 1, 1)), 2)
#> thr_minus1   thr_zero thr_plus05     linear 
#>     221.61     150.24     259.77     270.50 
```

Read those four numbers as a scoreboard, lower being better. A single linear model leaves 270.50 of squared error. Splitting at the true threshold of zero cuts that almost in half, to 150.24. Splitting at the wrong places is much worse: -1 leaves 221.61 and 0.5 leaves 259.77, barely better than not splitting at all.

The error surface therefore has a clear minimum at the right answer. All we have to do is find it by trying everything.

```r title="Search every candidate threshold"
setar_search <- function(x, p = 1, d = 1, trim = 0.15) {
  z    <- lag_matrix(x, p, d)$z
  cand <- sort(unique(z))
  keep <- (floor(trim * length(cand)) + 1):ceiling((1 - trim) * length(cand))
  cand <- cand[keep]                      # drop the extreme tails
  ssr  <- vapply(cand, function(th) setar_ssr(x, th, p, d), numeric(1))
  list(threshold = cand[which.min(ssr)], min_ssr = min(ssr, na.rm = TRUE),
       candidates = cand, ssr = ssr)
}

gs <- setar_search(y, p = 1, d = 1)
round(c(estimated = gs$threshold, truth = 0,
        setar_ssr = gs$min_ssr, linear_ssr = lin_ssr(y, 1, 1)), 3)
#>  estimated      truth  setar_ssr linear_ssr 
#>      0.000      0.000    150.236    270.501 
```

The estimate is 0.000 against a true value of 0.000. The search recovered the threshold exactly.

The one unfamiliar function there is `vapply()`, which calls `setar_ssr()` once per candidate threshold and collects the answers into a numeric vector, the same as a `for` loop that grows a vector but faster and safer. The `numeric(1)` argument is just a promise that each call returns a single number.

Two design choices deserve explanation. We only test values that actually occur in the data, because the split can only change when the threshold crosses an observed point; testing values in between would be wasted work. And we `trim` the extremes, discarding the lowest and highest 15 percent of candidates, so that neither regime is left with too few observations to estimate.

Plotting the whole error curve shows how sharp the minimum is.

```r title="Plot the threshold search profile"
plot(gs$candidates, gs$ssr, type = "l", col = "#4a5fd4", lwd = 2,
     main = "Total squared error at each candidate threshold",
     xlab = "candidate threshold", ylab = "sum of squared residuals")
abline(v = gs$threshold, lty = 2, col = "#d4534a")

c(n_candidates = length(gs$candidates))
#> n_candidates 
#>          421 
```

We evaluated 421 candidates, and the curve drops into a distinct V at the answer. A flat or ragged curve here would be a warning that the threshold is poorly identified.

[KEY INSIGHT]
**Conditional on the threshold, a TAR model is just two ordinary regressions.** This is the single fact that makes threshold models estimable. The awkward parameter, the threshold, takes only finitely many distinct values in any real sample, so you can enumerate them instead of optimising over them. Everything else is textbook least squares. The same trick reappears in the smooth transition models later, where a two-dimensional grid replaces the one-dimensional one.

With the threshold settled, the coefficients follow directly. The next function fits both regimes with `qr.solve()`, which returns the least squares coefficients for a design matrix and a response, and packages up the residuals along with an AIC.

AIC, the Akaike information criterion, is the score we will use to compare models throughout the post. It adds the model's error to a penalty of 2 per estimated parameter, so a model only wins by fitting better than the extra parameters cost. Lower is better, and negative values are perfectly normal because the error term is a logarithm.

```r title="Fit both regimes at the chosen threshold"
setar_fit <- function(x, thr, p = 1, d = 1) {
  m  <- lag_matrix(x, p, d)
  lo <- m$z <= thr
  cf <- matrix(NA_real_, 2, p + 1,
               dimnames = list(c("lower", "upper"), c("const", paste0("lag", 1:p))))
  res <- numeric(length(m$y))
  for (i in 1:2) {
    g <- if (i == 1) lo else !lo
    b <- qr.solve(m$X[g, , drop = FALSE], m$y[g])
    cf[i, ] <- b
    res[g]  <- m$y[g] - m$X[g, , drop = FALSE] %*% b
  }
  ssr  <- sum(res^2)
  nobs <- length(m$y)
  npar <- 2 * (p + 1) + 1                 # both regimes plus the threshold
  list(coef = cf, threshold = thr, p = p, d = d, residuals = res,
       n_lower = sum(lo), n_upper = sum(!lo), nobs = nobs, ssr = ssr,
       aic = nobs * log(ssr / nobs) + 2 * npar)
}

fit_y <- setar_fit(y, gs$threshold, p = 1, d = 1)
round(fit_y$coef, 3)
#>        const  lag1
#> lower  0.298 0.888
#> upper -1.153 0.440

c(lower = fit_y$n_lower, upper = fit_y$n_upper)
#> lower upper 
#>   467   132 
```

Compare the estimates against the values we simulated from. The lower regime was built with a constant of 0.30 and a slope of 0.90; we recovered 0.298 and 0.888. The upper regime was built with -1.20 and 0.40; we recovered -1.153 and 0.440. Both regimes are close, and the regime counts match the true split exactly.

That is the whole estimator, in about thirty lines of base R. Everything from here is refinement.

[WARNING]
**Trimming too aggressively can hide the true threshold.** The trim fraction sets how far into the tails the search is allowed to look. Our simulated series spends 78 percent of its time in the lower regime, so the true threshold sits at roughly the 78th percentile of the threshold variable. A trim of 0.30 only searches the middle 40 percent of candidates and therefore cannot reach it. Use 0.10 to 0.15 unless you have a specific reason, and be suspicious whenever the winning threshold lands on the very edge of the searched range.

**Try it:** Confirm that warning yourself. Rerun the search on the simulated series with a heavier trim and see whether it still finds zero.

```r title="Your turn: change the trim fraction"
# Goal: check whether the search still recovers the true threshold of 0.
# Change trim from 0.15 to 0.30, then run.
ex_g <- setar_search(y, p = 1, d = 1, trim = 0.15)

round(c(threshold = ex_g$threshold, ssr = ex_g$min_ssr,
        n_candidates = length(ex_g$candidates)), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Trim fraction solution"
ex_g <- setar_search(y, p = 1, d = 1, trim = 0.30)

round(c(threshold = ex_g$threshold, ssr = ex_g$min_ssr,
        n_candidates = length(ex_g$candidates)), 3)
#>    threshold          ssr n_candidates 
#>       -0.205      192.559      241.000 
```

**Explanation:** With a trim of 0.30 the search sees only 241 candidates instead of 421, and the true threshold of 0 is no longer among them. It settles for -0.205, and the error rises from 150.24 to 192.56. The estimate is not merely less precise, it is looking in the wrong place, which is why a heavily trimmed search on an unbalanced series is a real hazard.

</details>

## How do you fit a SETAR model to a real time series?

Our machinery is general, so we can point it straight at the lynx data. Two things still need choosing: the number of lags `p` and the delay `d`. For lynx, two lags is the classic choice, matching the AR(2) we fitted earlier. The delay we can simply scan, since there are only a couple of sensible values.

One caution before we compare. Error sums are only comparable across models fitted to the *same rows*. With `p = 2`, both `d = 1` and `d = 2` need three periods of history, so both use the same 112 rows and the comparison is fair.

```r title="Scan the delay parameter on lynx"
for (dd in 1:2) {
  g <- setar_search(x, p = 2, d = dd)
  cat(sprintf("d=%d  threshold=%.3f  setar_ssr=%.4f  linear_ssr=%.4f\n",
              dd, g$threshold, g$min_ssr, lin_ssr(x, 2, dd)))
}
#> d=1  threshold=2.558  setar_ssr=4.5655  linear_ssr=5.7826
#> d=2  threshold=3.310  setar_ssr=4.3482  linear_ssr=5.7826
```

Both delays beat the linear benchmark of 5.7826, but `d = 2` is better, cutting the error to 4.3482. So the lynx population appears to decide its behaviour based on where it stood two years ago rather than last year, which is biologically reasonable given the lag between prey collapse and predator decline.

Let's fit the winner and read off the two regimes.

```r title="Fit the lynx SETAR and read the regimes"
gs_lynx  <- setar_search(x, p = 2, d = 2)
fit_lynx <- setar_fit(x, gs_lynx$threshold, p = 2, d = 2)

round(fit_lynx$coef, 3)
#>       const  lag1   lag2
#> lower 0.588 1.264 -0.428
#> upper 1.166 1.599 -1.012

c(lower = fit_lynx$n_lower, upper = fit_lynx$n_upper)
#> lower upper 
#>    78    34 

round(10^gs_lynx$threshold)
#> [1] 2042
```

The estimated threshold is 3.31 on the log scale. Undo the logarithm and it becomes about 2,042 lynx, which is the number that matters to a reader who has never thought in logarithms. Roughly 78 of the 112 years sat below that line.

Now interpret the coefficients, which is where the biology appears. Both regimes have a positive first lag and a negative second lag, the standard recipe for a cycle. But the upper regime reverses far harder: its second-lag coefficient of -1.012 is more than twice the lower regime's -0.428. A large negative weight on the value from two years ago means a strong pull back down. Once the population passes 2,042 animals, the model expects a hard reversal. Below that line the pull-back is much gentler and the population is free to keep climbing.

That single asymmetry is what the linear AR(2) could not express, and it is the whole reason the threshold model fits better.

[TIP]
**Always report the threshold on the scale your reader thinks in.** You almost always fit these models on transformed data, using logs or square roots, so the raw estimate is in transformed units and means nothing to a domain expert. Back-transforming 3.31 into "about 2,042 lynx" turns a statistical parameter into a statement a biologist can argue with, which is exactly what you want.

The tsDyn package implements all of this and much more, and it is the standard tool once you understand what it is doing. It needs to be installed and run in your local R session (RStudio or the R console) rather than in the browser, so this block and the other tsDyn blocks below are marked accordingly.

```r-static title="Confirm the fit with the tsDyn package"
library(tsDyn)

mod_auto <- setar(x, m = 2, thDelay = 1)   # m = lags, thDelay = 1 means x[t-2]
round(getTh(mod_auto), 3)
#>   th 
#> 3.31 

round(coef(setar(x, m = 2, thDelay = 1, th = 3.31)), 3)
#> const.L  phiL.1  phiL.2 const.H  phiH.1  phiH.2      th 
#>   0.603   1.262  -0.433   1.492   1.621  -1.123   3.310 

round(c(setar = AIC(mod_auto), linear_ar2 = AIC(linear(x, m = 2))), 2)
#>      setar linear_ar2 
#>    -358.37    -333.87 
```

Watch the argument naming, because it is the most common way to reproduce a different threshold from the same data: tsDyn counts the delay from zero, so its `thDelay = 1` is our `d = 2`. Set `thDelay = 2` and you are asking for `x[t-3]`.

With that translated, the package searches the same grid and lands on the same threshold, 3.31. Its lower-regime coefficients of 0.603, 1.262 and -0.433 sit right on top of our 0.588, 1.264 and -0.428. The upper regime differs a little more because tsDyn assigns one boundary observation differently, and with only 34 points in that regime a single row moves the constant noticeably. The conclusion is unchanged: the threshold model beats the linear one on AIC, by -358.37 to -333.87.

[WARNING]
**A near-unit-root warning inside one regime is normal, not a failure.** tsDyn often prints "Possible unit root in the high regime" for models like this. An individual regime is allowed to be explosive or borderline, because the series never stays in it long enough to run away; the *other* regime keeps pulling it back. What matters is that the system as a whole is stable, which you check by simulating from the fitted model rather than by inspecting one regime's roots.

**Try it:** We assumed two lags because that is traditional for lynx. Check whether a single lag would have done. Fit the `p = 1` model with the same delay and compare its error with the 4.3482 we got from `p = 2`.

```r title="Your turn: does one lag suffice for lynx?"
# Goal: compare a one-lag SETAR against the two-lag model.
# Change p from 2 to 1 below, then run.
ex_g1 <- setar_search(x, p = 2, d = 2)

round(c(threshold = ex_g1$threshold, setar_ssr = ex_g1$min_ssr), 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="One-lag lynx solution"
ex_g1 <- setar_search(x, p = 1, d = 2)
ex_f1 <- setar_fit(x, ex_g1$threshold, p = 1, d = 2)

round(c(threshold = ex_g1$threshold, setar_ssr = ex_g1$min_ssr), 4)
#> threshold setar_ssr 
#>    3.3101    6.1656 

round(ex_f1$coef, 3)
#>        const  lag1
#> lower  0.178 1.001
#> upper -1.910 1.453
```

**Explanation:** With one lag the error rises from 4.3482 to 6.1656, roughly 42 percent worse. Look at why: the lower regime's slope of 1.001 is a random walk, and the upper regime's 1.453 is explosive. Neither can turn the series around, because reversing direction requires the negative second-lag term that makes the model overshoot and come back. Stripped of that, the model can only describe drift punctuated by jumps. The threshold still helps, but it is patching a badly under-specified model. Settle the lag order first, then hunt for regimes.

</details>

## How do you test whether the threshold is real?

Our SETAR fits better than the linear model. That proves nothing on its own. A two-regime model has twice the coefficients plus a threshold chosen by searching hundreds of candidates for the best possible split, so it would fit better even on data with no regimes at all. We need to know whether the improvement is larger than luck can explain.

The natural statistic compares the two error sums, exactly like an F test:

$$F = n \cdot \frac{\text{SSR}_{\text{linear}} - \text{SSR}_{\text{threshold}}}{\text{SSR}_{\text{threshold}}}$$

Where $n$ is the number of rows used, $\text{SSR}_{\text{linear}}$ is the one-regime error, and $\text{SSR}_{\text{threshold}}$ is the error at the best threshold found.

Now the catch, and it is the deepest idea in this post. Under the null hypothesis of no threshold effect, the two regimes are identical, which means **the threshold parameter does not exist**. It has no true value, because changing it changes nothing. A parameter that vanishes under the null is called an unidentified nuisance parameter, and its presence destroys the usual distribution theory. The statistic above does not follow a chi-square or F distribution, and comparing it to those tables will make you reject far too often.

[KEY INSIGHT]
**Searching for the best threshold is what breaks the standard test.** We did not test one pre-specified split; we tested 421 of them and reported the winner. The distribution of a maximum over hundreds of correlated statistics is nothing like the distribution of any single one. Because no textbook table describes it, we generate the correct distribution ourselves by simulating data that genuinely has no threshold and running the identical search on each simulated set.

That is the bootstrap. First, the statistic itself. Because we compute the F value at every candidate threshold and keep the largest, the quantity is conventionally called the **sup-F** statistic, "sup" being short for supremum, the mathematician's word for the largest value a set reaches. You will see it printed as `sup_F` in the output below and referred to by that name in the literature.

```r title="Compute the threshold F statistic"
sup_f <- function(x, p = 1, d = 1, trim = 0.15) {
  m  <- lag_matrix(x, p, d)
  s0 <- sum(.lm.fit(m$X, m$y)$residuals^2)         # linear model error
  s1 <- setar_search(x, p, d, trim)$min_ssr        # best threshold error
  length(m$y) * (s0 - s1) / s1
}

obs_f <- sup_f(x, p = 2, d = 2)
round(obs_f, 2)
#> [1] 36.95
```

Is 36.95 large? We cannot say yet, because we have nothing to compare it against. So we build the comparison. The function below fits a plain linear AR to the data, then repeatedly generates new series from that linear model by resampling its own residuals, and runs the full threshold search on each one. Every one of those artificial series is genuinely linear, so the statistics we collect show what the search produces when there is nothing to find.

```r title="Bootstrap the null distribution"
boot_linearity <- function(x, p = 1, d = 1, B = 199) {
  m  <- lag_matrix(x, p, d)
  b0 <- qr.solve(m$X, m$y)                    # fit the linear AR under the null
  e0 <- as.vector(m$y - m$X %*% b0)
  nx <- length(x)
  obs <- sup_f(x, p, d)
  null <- numeric(B)
  for (b in 1:B) {
    xb <- numeric(nx)
    xb[1:p] <- x[1:p]
    eb <- sample(e0, nx, replace = TRUE)      # resample the residuals
    for (t in (p + 1):nx) {
      xb[t] <- b0[1] + sum(b0[-1] * xb[(t - 1):(t - p)]) + eb[t]
    }
    null[b] <- sup_f(xb, p, d)                # same search, linear data
  }
  list(statistic = obs, p_value = (1 + sum(null >= obs)) / (B + 1), null = null)
}

set.seed(2026)
bt <- boot_linearity(x, p = 2, d = 2, B = 199)
round(c(sup_F = bt$statistic, p_value = bt$p_value), 4)
#>   sup_F p_value 
#> 36.9468  0.0050 
```

The p-value of 0.005 is the smallest achievable with 199 replications, meaning not one artificial linear series produced a statistic as large as the real data's. Look at where the null distribution actually sits.

```r title="Inspect the simulated null distribution"
round(quantile(bt$null, c(0.5, 0.9, 0.95, 0.99)), 2)
#>   50%   90%   95%   99% 
#>  7.76 13.02 15.13 19.85 
```

This is why the bootstrap was worth the trouble. On purely linear data the search still produces a typical statistic of 7.76, and one time in twenty it exceeds 15.13. The search always finds *something*. Our observed 36.95 is more than twice the 99th percentile of what pure noise generates, so the lynx regimes are real.

A test that only ever says "yes" is worthless, so let's check the other direction. We generate a single series from a linear AR(2) with coefficients like the lynx model's, then run the identical test on it. The honest answer here is a non-rejection.

```r title="Check the test on a series with no regimes"
set.seed(505)
ctrl <- as.numeric(arima.sim(n = 114, list(ar = c(1.378, -0.740)), sd = 0.226))

bt_ctrl <- boot_linearity(ctrl, p = 2, d = 2, B = 199)
round(c(sup_F = bt_ctrl$statistic, p_value = bt_ctrl$p_value), 4)
#>   sup_F p_value 
#>  3.9122  0.9200 
```

On data we built with no threshold, the statistic is 3.91 with a p-value of 0.92. The test correctly declines to find regimes that are not there. Having seen it behave on a known-negative case, you can trust the 0.005 it returned for the lynx.

**Try it:** Run the test on our simulated SETAR series `y`, where we know for certain that two regimes exist. The statistic should be enormous.

```r title="Your turn: test the simulated SETAR"
# Goal: confirm the test fires on data that really does have two regimes.
# Change ctrl to y below, then run.
set.seed(31)
ex_bt <- boot_linearity(ctrl, p = 1, d = 1, B = 99)

round(c(sup_F = ex_bt$statistic, p_value = ex_bt$p_value), 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Simulated SETAR test solution"
set.seed(31)
ex_bt <- boot_linearity(y, p = 1, d = 1, B = 99)

round(c(sup_F = ex_bt$statistic, p_value = ex_bt$p_value), 4)
#>    sup_F  p_value 
#> 479.5045   0.0100 
```

**Explanation:** The statistic is 479.5, more than ten times the lynx value, with the smallest p-value 99 replications can deliver. That is what an unambiguous threshold effect looks like when you have 600 observations and a large coefficient difference between regimes. Real data is rarely this clear, which is precisely why the bootstrap comparison matters on borderline cases.

</details>

## What do STAR models fix that TAR models cannot?

The SETAR has a hard edge. At 2,041 lynx the model applies one set of coefficients; at 2,043 it applies a completely different set. Nothing in between. For some systems that is right, since a policy rule or a capacity constraint really does switch at a point. For a population of animals it is less believable, because there is no year in which every lynx simultaneously changes behaviour.

Smooth transition autoregressive models fix this by replacing the on/off indicator with a dial. Instead of asking "which regime?", they ask "how far through the transition are we?" and blend the two sets of coefficients accordingly.

![Hard switch versus smooth switch](screenshots/Threshold-ARMA-TARSTAR-in-R-tar-vs-star.webp)

*Figure 3: TAR flips between regimes; STAR blends them with a logistic weight.*

The dial is the logistic function, the same S-curve used in logistic regression:

$$G(z_t; \gamma, r) = \frac{1}{1 + e^{-\gamma (z_t - r)}}$$

Where $r$ is the location where the dial reads exactly one half, and $\gamma$ controls the steepness. The full model, with the weight $G$ mixing the two regimes, is:

$$x_t = \left(\phi_{1,0} + \phi_{1,1}x_{t-1}\right)\left(1 - G\right) + \left(\phi_{2,0} + \phi_{2,1}x_{t-1}\right)G + \varepsilon_t$$

When $G$ is 0 the first set of coefficients applies alone; when $G$ is 1 the second set does; in between you get a genuine mixture. Because $G$ is logistic, this is called a **logistic** STAR, or LSTAR.

We do not have to code that formula ourselves. R ships the logistic function as `plogis()`, where `plogis(u)` returns exactly $1/(1 + e^{-u})$, so all we supply is the argument $\gamma(z_t - r)$.

The whole behaviour of the model is governed by $\gamma$. Let's watch it directly, evaluating the dial at five values around a location of 3.31 for three different steepness settings.

```r title="Evaluate the transition dial"
G <- function(z, gamma, r) plogis(gamma * (z - r))
zz <- c(2.8, 3.1, 3.31, 3.5, 3.8)

round(rbind(gamma_2   = G(zz, 2,   3.31),
            gamma_10  = G(zz, 10,  3.31),
            gamma_200 = G(zz, 200, 3.31)), 3)
#>            [,1]  [,2] [,3]  [,4]  [,5]
#> gamma_2   0.265 0.397  0.5 0.594 0.727
#> gamma_10  0.006 0.109  0.5 0.870 0.993
#> gamma_200 0.000 0.000  0.5 1.000 1.000
```

Read the table row by row. With $\gamma = 2$ the dial barely moves, going from 0.265 to 0.727 across the whole range, so both regimes are always substantially active and the model is nearly linear. With $\gamma = 10$ the transition is decisive but still gradual. With $\gamma = 200$ the dial reads 0 or 1 everywhere except exactly at the location, which is an indicator function in all but name.

That last row is the key relationship between the two model families. Here is the curve.

```r title="Plot the transition dial at three steepness settings"
zseq <- seq(2.5, 4.1, length.out = 300)
plot(zseq, G(zseq, 2, 3.31), type = "l", lwd = 2, col = "#4a5fd4", ylim = c(0, 1),
     main = "The logistic transition at three values of gamma",
     xlab = "threshold variable z", ylab = "weight on the upper regime")
lines(zseq, G(zseq, 10, 3.31), lwd = 2, col = "#2e9e6b")
lines(zseq, G(zseq, 200, 3.31), lwd = 2, col = "#d4534a")
legend("topleft", c("gamma = 2", "gamma = 10", "gamma = 200"), bty = "n",
       lwd = 2, col = c("#4a5fd4", "#2e9e6b", "#d4534a"))

round(G(3.6, c(2, 10, 200), 3.31), 4)
#> [1] 0.6411 0.9478 1.0000
```

The blue line is a gentle ramp, the green a recognisable S, and the red is indistinguishable from a step. At $z = 3.6$ the three dials read 0.64, 0.95 and 1.00 respectively.

Let's prove the claim numerically rather than just asserting it. We fit the smooth model at increasing steepness and watch its error converge on the hard model's.

One line inside the function below needs explaining first, because it is the trick that keeps the fitting linear. Rather than running two separate regressions, we hand least squares the predictor matrix twice: once as it is, and once with every column multiplied by the weight `g`. That is what `cbind(m$X, m$X * g)` builds. The first block of coefficients then describes the model when the dial reads 0, and the second block describes how much each coefficient *changes* by the time the dial reaches 1. Both blocks are estimated in a single ordinary least squares call.

```r title="Show that a steep dial becomes a hard threshold"
lstar_ssr <- function(x, gamma, r, p = 1, d = 1) {
  m <- lag_matrix(x, p, d)
  g <- plogis(gamma * (m$z - r) / sd(m$z))    # gamma standardised by the spread of z
  f <- .lm.fit(cbind(m$X, m$X * g), m$y)      # regime 1 plus the weighted change
  if (any(is.na(f$coefficients))) return(NA_real_)
  sum(f$residuals^2)
}

round(c(gamma_1    = lstar_ssr(x, 1,   3.30, 2, 2),
        gamma_5    = lstar_ssr(x, 5,   3.30, 2, 2),
        gamma_20   = lstar_ssr(x, 20,  3.30, 2, 2),
        gamma_500  = lstar_ssr(x, 500, 3.30, 2, 2),
        hard_setar = setar_ssr(x, 3.30, 2, 2)), 4)
#>    gamma_1    gamma_5   gamma_20  gamma_500 hard_setar 
#>     4.6119     4.3547     4.3751     4.4217     4.4217 
```

At $\gamma = 500$ the smooth model's error is 4.4217, matching the hard SETAR's 4.4217 to four decimal places. A SETAR is an LSTAR with an infinitely steep dial. They are not rival theories but two points on one continuum, and the middle of that continuum is where the interesting models live: $\gamma = 5$ gives 4.3547, better than either extreme.

Notice the `/ sd(m$z)` inside the function. Without it, $\gamma$ would mean something different for every series, since a steepness of 10 is drastic for a series ranging over 2 units and negligible for one ranging over 2,000. Dividing by the standard deviation of the threshold variable makes $\gamma$ comparable across problems.

[TIP]
**Always standardise gamma by the spread of the threshold variable.** This is what tsDyn and the econometrics literature do, and it is the difference between a grid search that works on any series and one you have to hand-tune every time. It also makes reported gamma values meaningful to other people, since a gamma of 7 now means roughly the same thing whether you are modelling lynx counts or interest rates.

**Try it:** Compute the transition weight by hand for a series whose threshold variable is much larger in scale, and see why the standardisation matters. The block uses an unstandardised gamma of 10 on values in the thousands.

```r title="Your turn: gamma and the scale of z"
# Goal: see how gamma interacts with the scale of the threshold variable.
# Divide by 500 inside plogis to standardise, then run again.
ex_z <- c(1500, 1900, 2000, 2100, 2500)

round(plogis(10 * (ex_z - 2000)), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Scale standardisation solution"
ex_z <- c(1500, 1900, 2000, 2100, 2500)

round(plogis(10 * (ex_z - 2000) / 500), 3)
#> [1] 0.000 0.119 0.500 0.881 1.000
```

**Explanation:** Unstandardised, a gamma of 10 applied to differences of hundreds saturates the logistic completely, giving 0 and 1 with nothing in between, so the model silently becomes a hard threshold no matter what gamma you chose. After dividing by the spread of 500 the same gamma produces a usable S-curve reading 0.119 and 0.881 on either side. The standardisation is what keeps gamma interpretable.

</details>

## How do you fit an LSTAR model in R?

The estimation strategy is the one from the SETAR section, promoted to two dimensions. Fix both $\gamma$ and the location $r$, and the model becomes linear in its remaining coefficients, so ordinary least squares finishes the job. We therefore lay a grid over the pair and score every combination.

The inner regression is the stacked one we already built, so the only new work is laying out the grid and scoring it. `expand.grid()` forms every gamma-location pair, and `mapply()` runs `lstar_ssr()` on each pair in turn.

```r title="Search the gamma and location grid"
lstar_search <- function(x, p = 1, d = 1, trim = 0.15, n_gamma = 30, n_r = 30) {
  z  <- lag_matrix(x, p, d)$z
  gr <- expand.grid(gamma = exp(seq(log(0.5), log(200), length.out = n_gamma)),
                    r     = as.numeric(quantile(z, seq(trim, 1 - trim,
                                                       length.out = n_r))))
  gr$ssr <- mapply(function(a, b) lstar_ssr(x, a, b, p, d), gr$gamma, gr$r)
  b <- gr[which.min(gr$ssr), ]
  c(gamma = b$gamma, location = b$r, ssr = b$ssr)
}

bl <- lstar_search(x, p = 2, d = 2)
round(bl, 4)
#>    gamma location      ssr 
#>   7.3352   3.3267   4.3391 
```

We searched 30 steepness values spaced evenly on a log scale (because gamma matters multiplicatively) crossed with 30 candidate locations drawn from the quantiles of the threshold variable. The winner has $\gamma = 7.34$ and a location of 3.3267, remarkably close to the SETAR's threshold of 3.31.

A gamma of 7.34 is a genuine middle value, neither the near-linear flatness of 2 nor the effective step of 200. The lynx data prefers a transition that takes a couple of years to complete.

Now extract the coefficients.

```r title="Read the LSTAR regime coefficients"
lstar_fit <- function(x, gamma, r, p = 1, d = 1) {
  m <- lag_matrix(x, p, d)
  g <- plogis(gamma * (m$z - r) / sd(m$z))
  Z <- cbind(m$X, m$X * g)
  b <- qr.solve(Z, m$y)
  cf <- rbind(low = b[1:(p + 1)], change = b[(p + 2):(2 * p + 2)])
  colnames(cf) <- c("const", paste0("lag", 1:p))
  res  <- as.vector(m$y - Z %*% b)
  nobs <- length(m$y)
  ssr  <- sum(res^2)
  npar <- 2 * (p + 1) + 2                  # coefficients plus gamma and location
  list(coef = cf, gamma = gamma, location = r, residuals = res, nobs = nobs,
       ssr = ssr, aic = nobs * log(ssr / nobs) + 2 * npar, p = p, d = d)
}

lf <- lstar_fit(x, bl["gamma"], bl["location"], p = 2, d = 2)
round(lf$coef, 3)
#>         const  lag1   lag2
#> low     0.509 1.245 -0.374
#> change -0.661 0.411 -0.336
```

The `low` row gives the coefficients that apply when the dial reads 0, and the `change` row gives how much each coefficient shifts by the time the dial reaches 1. Adding them gives the far end of the transition.

```r title="Convert the change row into upper-regime coefficients"
round(rbind(low_regime  = lf$coef[1, ],
            high_regime = lf$coef[1, ] + lf$coef[2, ]), 3)
#>              const  lag1   lag2
#> low_regime   0.509 1.245 -0.374
#> high_regime -0.152 1.657 -0.710
```

The story matches the SETAR exactly. The second-lag coefficient moves from -0.374 at the bottom to -0.710 at the top, so the higher the population, the harder the model pulls it back. The LSTAR simply says this intensification happens over a range of population sizes rather than at one magic number.

So which model wins? Compare all three on the same data.

```r title="Compare linear, SETAR and LSTAR"
round(c(linear_ssr = lin_ssr(x, 2, 2), setar_ssr = fit_lynx$ssr,
        lstar_ssr = lf$ssr), 4)
#> linear_ssr  setar_ssr  lstar_ssr 
#>     5.7826     4.3482     4.3391 

round(c(linear_aic = fit_lynx$nobs * log(lin_ssr(x, 2, 2) / fit_lynx$nobs) + 2 * 4,
        setar_aic  = fit_lynx$aic,
        lstar_aic  = lf$aic), 2)
#> linear_aic  setar_aic  lstar_aic 
#>    -323.93    -349.86    -348.09 
```

Here is an honest result that most tutorials skip. The LSTAR does fit slightly better in raw error, 4.3391 against 4.3482. But it spends an extra parameter to get there, and AIC therefore ranks it *below* the SETAR, -348.09 against -349.86. Both beat the linear model at -323.93 by a wide margin.

For the lynx, the smooth transition buys nothing. The hard switch is the better description. That is a real finding, not a failure of the LSTAR, and you should expect it whenever the transition genuinely is abrupt.

```r-static title="Confirm the LSTAR with tsDyn"
set.seed(12)
ml <- lstar(x, m = 2, thDelay = 1, trace = FALSE)

round(coef(ml), 4)
#> const.L  phiL.1  phiL.2 const.H  phiH.1  phiH.2   gamma      th 
#>  0.4891  1.2465 -0.3664 -1.0241  0.4233 -0.2546 11.1538  3.3392 

round(c(linear = AIC(linear(x, m = 2)), setar = AIC(setar(x, m = 2, thDelay = 1)),
        lstar = AIC(ml)), 2)
#>  linear   setar   lstar 
#> -333.87 -358.37 -356.65 
```

tsDyn uses a proper optimiser rather than a coarse grid, so it refines gamma to 11.15 and the location to 3.3392. Its lower-regime coefficients of 0.4891, 1.2465 and -0.3664 match our 0.509, 1.245 and -0.374 closely. Most importantly it reaches the same verdict independently: SETAR at -358.37 beats LSTAR at -356.65.

[NOTE]
**LSTAR is not the only smooth transition available.** Swapping the logistic dial for an exponential one, $G = 1 - e^{-\gamma(z_t - r)^2}$, gives the ESTAR model. Because that function is symmetric around the location, ESTAR treats large deviations in either direction the same way and returns to the inner regime in the middle. It suits series where the *size* of a deviation matters but its sign does not, such as an exchange rate held inside a band. Use LSTAR when high and low behave differently, ESTAR when big and small do.

**Try it:** Force the smooth model to behave like a hard one by fixing gamma very high, then compare its error with the freely fitted 4.3391.

```r title="Your turn: force a hard transition"
# Goal: check what the LSTAR loses when the dial is forced to be a step.
# Change ex_gamma from 7.3352 to 500, then run.
ex_gamma <- 7.3352

round(c(ssr = lstar_ssr(x, ex_gamma, 3.30, p = 2, d = 2)), 4)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Forced hard transition solution"
ex_gamma <- 500

round(c(ssr = lstar_ssr(x, ex_gamma, 3.30, p = 2, d = 2)), 4)
#>    ssr 
#> 4.4217 
```

**Explanation:** Forcing the dial to a step gives 4.4217, exactly the hard SETAR error we computed earlier at the same location. The freely fitted smooth model reached 4.3391, so 0.083 is the entire contribution smoothness makes on this data. Set against the extra parameter it costs, that gap does not pay for itself, which is what the AIC comparison already told us.

</details>

## How do you forecast with a threshold model?

Forecasting one step ahead is easy and looks just like the linear case: check which regime the current threshold value puts you in, then apply that regime's equation. The helper below does exactly that, taking the recent history most-recent-first.

```r title="Forecast one step ahead"
setar_step <- function(fit, hist) {          # hist[1] = x[T], hist[2] = x[T-1], ...
  row <- if (hist[fit$d] <= fit$threshold) 1L else 2L
  sum(fit$coef[row, ] * c(1, hist[1:fit$p]))
}

hist0 <- rev(tail(x, 2))
round(hist0, 3)
#> [1] 3.531 3.424

round(setar_step(fit_lynx, hist0), 3)
#> [1] 3.349
```

The last two observations are 3.531 and 3.424. With `d = 2` the model looks at `hist[2]`, which is 3.424, and compares it against the threshold of 3.31. Since 3.424 sits above the line, the upper regime applies. That produces a forecast for 1935 of 3.349 on the log scale, which is about 2,231 lynx once you undo the logarithm.

Multi-step forecasting is where nonlinear models stop resembling linear ones, and where it is easy to get quietly wrong answers. The tempting approach is to feed each forecast back in as if it were data, producing a chain of predictions. That is called the skeleton, and for a *linear* model it is exactly right.

For a nonlinear model it is not. The reason is that the average of a nonlinear function is not the function of the average. Your point forecast for two steps ahead sits at some value, but the actual distribution of possible values two steps ahead straddles the threshold, so some of those futures switch regime and some do not. The skeleton ignores that entirely by committing to one regime.

The correct approach is to simulate many futures with random shocks and average them. Let's build both and compare.

```r title="Skeleton forecast versus simulated forecast"
skeleton <- function(fit, x, h) {
  hist <- rev(tail(x, max(fit$p, fit$d)))
  out  <- numeric(h)
  for (i in 1:h) {
    out[i] <- setar_step(fit, hist)
    hist   <- c(out[i], head(hist, -1))
  }
  out
}

mc_forecast <- function(fit, x, h, B = 2000) {
  paths <- matrix(NA_real_, B, h)
  for (b in 1:B) {
    hist <- rev(tail(x, max(fit$p, fit$d)))
    for (i in 1:h) {
      v <- setar_step(fit, hist) + sample(fit$residuals, 1)   # add a real shock
      paths[b, i] <- v
      hist <- c(v, head(hist, -1))
    }
  }
  paths
}

set.seed(808)
sk <- skeleton(fit_lynx, x, 12)
pa <- mc_forecast(fit_lynx, x, 12, B = 2000)

round(rbind(skeleton = sk, monte_carlo = colMeans(pa)), 3)
#>              [,1]  [,2]  [,3]  [,4]  [,5]  [,6]  [,7]  [,8]  [,9] [,10] [,11] [,12]
#> skeleton    3.349 2.949 2.495 2.479 2.654 2.881 3.094 3.266 3.392 3.478 3.296 2.919
#> monte_carlo 3.350 2.948 2.629 2.585 2.714 2.900 3.064 3.158 3.166 3.104 3.009 2.920
```

At one step the two agree to three decimals, 3.349 against 3.350, because at horizon one there is no uncertainty about the regime yet. From step three they part company, and by step nine the skeleton says 3.392 while the simulation says 3.166.

```r title="Measure how far the two forecasts diverge"
round(max(abs(sk - colMeans(pa))), 3)
#> [1] 0.374
```

The largest gap is 0.374 on the log scale, which back-transforms to a factor of about 2.4 in lynx numbers. That is not a rounding difference, it is one forecast predicting more than double the other. The skeleton produces a cleaner-looking cycle because a single deterministic path crosses the threshold at the same point every cycle. The simulated paths cross at different times, so averaging them flattens the cycle, and that flatter average is the correct expected value.

Simulation also hands you prediction intervals for free, since you already have thousands of complete futures.

```r title="Build prediction intervals from the simulated paths"
qs <- apply(pa, 2, quantile, probs = c(0.1, 0.5, 0.9))
round(qs[, c(1, 3, 6, 12)], 3)
#>      [,1]  [,2]  [,3]  [,4]
#> 10% 3.078 2.094 2.260 2.127
#> 50% 3.361 2.661 2.915 2.968
#> 90% 3.589 3.128 3.517 3.639
```

The columns shown are horizons 1, 3, 6 and 12. At one step the 10-to-90 band spans 3.078 to 3.589, about half a log unit. By horizon 12 it runs from 2.127 to 3.639, three times wider. Note that these intervals are not symmetric around the median, which is another thing a linear model cannot produce and a direct consequence of futures splitting between regimes.

[WARNING]
**Never use plug-in multi-step forecasts from a nonlinear model without checking them.** Feeding point forecasts back into a threshold model is the default thing to do and it is biased, sometimes badly. The bias grows with the horizon and is worst when the series is currently near the threshold, which is exactly when forecasts matter most. Simulate instead: a few thousand paths cost milliseconds and give you the correct mean along with honest, asymmetric intervals.

**Try it:** See how the gap between the two methods grows with the horizon. Run the block once as written to get the 12-step gap, then extend it and watch the number move.

```r title="Your turn: extend the forecast horizon"
# Goal: check whether the skeleton bias grows with the horizon.
# Change ex_h from 12 to 30, then run.
ex_h <- 12
set.seed(55)

round(max(abs(skeleton(fit_lynx, x, ex_h) -
              colMeans(mc_forecast(fit_lynx, x, ex_h, B = 1000)))), 3)
```

<details>
<summary>Click to reveal solution</summary>

```r title="Longer horizon solution"
ex_h <- 30
set.seed(55)

round(max(abs(skeleton(fit_lynx, x, ex_h) -
              colMeans(mc_forecast(fit_lynx, x, ex_h, B = 1000)))), 3)
#> [1] 0.503
```

**Explanation:** Stretching the horizon to 30 steps widens the maximum gap to 0.503, up from the 0.367 the same block reports at 12 steps. (That 0.367 is slightly below the 0.374 we measured earlier only because this block simulates 1,000 paths from a different seed rather than 2,000; the gap itself is the same phenomenon.) On the raw count scale that is a factor of about three between the two forecasts. The skeleton keeps oscillating with undiminished amplitude because it deterministically retraces one cycle forever, while the simulated average damps toward the long-run mean as individual paths drift out of step with one another. The longer the horizon, the more misleading the plug-in forecast becomes.

</details>

## A Complete Example: Modelling the Sunspot Cycle

Let's run the entire workflow start to finish on a series we have not touched: annual sunspot counts from 1700 onward. This section reuses only the functions we wrote above, in the order you would use them on a new problem.

We work on the square-root scale, the standard transform for sunspot data, because raw counts have variance that grows with the level.

```r title="Step 1: transform and measure the asymmetry"
s <- sqrt(sunspot.year)
c(n = length(s))
#> n 
#> 289 

ds <- diff(s)
round(c(mean_up = mean(ds[ds > 0]), mean_down = mean(ds[ds < 0])), 3)
#>   mean_up mean_down 
#>     1.712    -1.201 
```

289 annual observations, rising on average by 1.712 and falling by 1.201. The asymmetry runs the opposite way to the lynx: sunspots erupt quickly and decay slowly. A threshold model is worth trying.

```r title="Step 2: choose the delay"
for (dd in 1:2) {
  g <- setar_search(s, p = 2, d = dd)
  cat(sprintf("d=%d  threshold=%.3f  setar_ssr=%.2f  linear_ssr=%.2f\n",
              dd, g$threshold, g$min_ssr, lin_ssr(s, 2, dd)))
}
#> d=1  threshold=3.376  setar_ssr=381.37  linear_ssr=397.55
#> d=2  threshold=4.940  setar_ssr=363.87  linear_ssr=397.55
```

A delay of 2 wins again. Now fit it and, critically, check the residuals before believing anything.

```r title="Step 3: fit with two lags and check the residuals"
gs_s2  <- setar_search(s, p = 2, d = 2)
fit_s2 <- setar_fit(s, gs_s2$threshold, p = 2, d = 2)

round(fit_s2$coef, 3)
#>       const  lag1   lag2
#> lower 1.602 1.459 -0.593
#> upper 0.524 1.353 -0.499

round(unlist(Box.test(fit_s2$residuals, lag = 12,
                      type = "Ljung-Box")[c("statistic", "p.value")]), 4)
#> statistic.X-squared             p.value 
#>             37.8522              0.0002 
```

The model beats the linear benchmark, and the two regimes look different. But the Ljung-Box test on the residuals returns a p-value of 0.0002. That test asks whether any predictable pattern is left in the errors, and a p-value that small says yes, plenty. **This model is not adequate**, regardless of how good its error sum looks.

The problem is the lag order, not the regimes. The sunspot cycle runs about eleven years, so two lags cannot possibly capture its shape. Let's give the model enough lags to see a full cycle.

```r title="Step 4: refit with enough lags for an 11-year cycle"
gs_s9  <- setar_search(s, p = 9, d = 2)
fit_s9 <- setar_fit(s, gs_s9$threshold, p = 9, d = 2)

round(unlist(Box.test(fit_s9$residuals, lag = 12,
                      type = "Ljung-Box")[c("statistic", "p.value")]), 4)
#> statistic.X-squared             p.value 
#>              5.3113              0.9468 

round(c(threshold = gs_s9$threshold, in_sunspots = gs_s9$threshold^2), 3)
#>   threshold in_sunspots 
#>       3.376      11.400 
```

With nine lags the Ljung-Box p-value rises to 0.9468. The residuals now look like noise, which means the model has extracted the structure it was supposed to. The threshold sits at 3.376 on the square-root scale, which is about 11.4 sunspots, a strikingly low number that separates quiet years from active ones.

```r title="Step 5: inspect the regimes and compare against linear"
round(fit_s9$coef[, 1:5], 3)
#>        const  lag1   lag2   lag3   lag4
#> lower -0.882 1.450 -1.052  0.679 -0.787
#> upper  1.387 1.068 -0.202 -0.422  0.426

c(lower = fit_s9$n_lower, upper = fit_s9$n_upper)
#> lower upper 
#>    55   225 

round(c(linear_aic = fit_s9$nobs * log(lin_ssr(s, 9, 2) / fit_s9$nobs) + 2 * 11,
        setar_aic  = fit_s9$aic), 2)
#> linear_aic setar_aic 
#>      43.84      6.68 
```

Only 55 of 280 usable years fall in the quiet regime, so most of the time the sun is in its active state. The two regimes behave very differently: the quiet regime has strongly alternating coefficients (1.450, then -1.052, then 0.679) which describes a sharp turnaround, while the active regime's coefficients decay smoothly. In plain terms, the model says a quiet sun snaps back to activity, whereas an active sun winds down gradually.

AIC confirms the threshold model at 6.68 against 43.84 for the linear equivalent. Finally, the formal test.

```r title="Step 6: bootstrap the linearity test"
set.seed(99)
bt_s <- boot_linearity(s, p = 9, d = 2, B = 199)
round(c(sup_F = bt_s$statistic, p_value = bt_s$p_value), 4)
#>   sup_F p_value 
#> 63.4111  0.0050 
```

A statistic of 63.41 with a p-value of 0.005 means no simulated linear series came close. The sunspot series has genuine regimes, and we have a model whose residuals are clean.

[TIP]
**Check residual autocorrelation before you interpret a single regime coefficient.** Our first sunspot model had a plausible threshold, sensible-looking regimes, and a better error sum than the linear model, yet it was badly under-specified. Threshold search will happily find a split in a misspecified model, and that split can be an artifact of the missing lags rather than a real regime. Get the lag order right first, then look for regimes.

## Practice Exercises

### Exercise 1: How much data does threshold estimation need?

Threshold estimates are often described as noisy. Test it. Using the simulated series `y` (whose true threshold is 0 and whose true coefficients are 0.30 and 0.90 in the lower regime, -1.20 and 0.40 in the upper), fit the model on the first 100 observations, then on the first 200, then on all 600. Report the estimated threshold and both regimes' coefficients each time. Which is estimated more reliably, the threshold or the coefficients?

```r title="Exercise 1 starter"
# Loop over sample sizes, fit, and print.
# Hint: use y[1:nn], then setar_search() and setar_fit() with p = 1, d = 1.

for (nn in c(100, 200, 600)) {
  my_sub <- y[1:nn]
  # your code here
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 1 solution"
for (nn in c(100, 200, 600)) {
  my_sub <- y[1:nn]
  my_g   <- setar_search(my_sub, p = 1, d = 1)
  my_f   <- setar_fit(my_sub, my_g$threshold, p = 1, d = 1)
  cat(sprintf("n=%3d thr=%+.3f lower=(%.2f,%.2f) upper=(%.2f,%.2f)\n",
              nn, my_g$threshold, my_f$coef[1, 1], my_f$coef[1, 2],
              my_f$coef[2, 1], my_f$coef[2, 2]))
}
#> n=100 thr=+0.000 lower=(0.37,0.95) upper=(-0.94,0.21)
#> n=200 thr=+0.000 lower=(0.35,0.89) upper=(-1.12,0.49)
#> n=600 thr=+0.000 lower=(0.30,0.89) upper=(-1.15,0.44)
```

**Explanation:** The threshold is pinned at exactly 0.000 even with 100 observations, while the coefficients wander considerably: the upper regime's slope reads 0.21 at n=100 against a truth of 0.40, and only settles near 0.44 by n=600. That ordering surprises most people, but it follows from the geometry. The threshold is found by minimising a step function that drops sharply at the right value, so a modest amount of data locates it; the coefficients are ordinary regression estimates and converge at the usual slow rate. The minority upper regime suffers most, because 100 total observations give it only about 20 rows.

</details>

### Exercise 2: Does the threshold model actually forecast better?

In-sample fit is not forecasting. Build a rolling one-step-ahead comparison on the lynx data: train on the first 80 observations, forecast observation 81, then retrain on 81 and forecast 82, continuing to the end. Do this for both a linear AR(2) and a SETAR with `p = 2, d = 2`, refitting the threshold at every step. Report the RMSE of each and the percentage improvement.

```r title="Exercise 2 starter"
# Hint: inside the loop, tr <- x[1:i] is the training set and h <- rev(tail(tr, 2))
# is the history. Use qr.solve(lag_matrix(...)$X, ...$y) for the linear forecast
# and setar_search() plus setar_fit() plus setar_step() for the SETAR one.

my_err_ar <- my_err_st <- numeric(0)
for (i in 80:(length(x) - 1)) {
  # your code here
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 2 solution"
my_err_ar <- my_err_st <- numeric(0)

for (i in 80:(length(x) - 1)) {
  tr <- x[1:i]
  mm <- lag_matrix(tr, 2, 2)
  a  <- qr.solve(mm$X, mm$y)                       # linear AR(2)
  h  <- rev(tail(tr, 2))
  f_ar <- a[1] + a[2] * h[1] + a[3] * h[2]

  g    <- setar_search(tr, p = 2, d = 2)           # SETAR, refit each step
  ff   <- setar_fit(tr, g$threshold, p = 2, d = 2)
  f_st <- setar_step(ff, h)

  my_err_ar <- c(my_err_ar, x[i + 1] - f_ar)
  my_err_st <- c(my_err_st, x[i + 1] - f_st)
}

round(c(n_forecasts = length(my_err_ar),
        rmse_ar     = sqrt(mean(my_err_ar^2)),
        rmse_setar  = sqrt(mean(my_err_st^2))), 4)
#> n_forecasts     rmse_ar  rmse_setar 
#>     34.0000      0.2294      0.2136 

round(100 * (1 - sqrt(mean(my_err_st^2)) / sqrt(mean(my_err_ar^2))), 1)
#> [1] 6.9
```

**Explanation:** Over 34 genuine out-of-sample forecasts the SETAR cuts RMSE from 0.2294 to 0.2136, an improvement of 6.9 percent. That is real but far smaller than the in-sample error reduction of 25 percent suggested, which is the usual story: some of the in-sample gain was the threshold search fitting noise. A 7 percent one-step improvement is still worth having, and the gap would widen at longer horizons where the regime structure matters more.

</details>

### Exercise 3: Would a third regime help?

Nothing restricts a threshold model to two regimes. Extend the search to two thresholds, splitting the lynx data into low, middle and high regimes, by writing a scoring function that fits three OLS regressions and searching over all ordered pairs of candidates. Compare the resulting error and AIC against the two-regime model. Remember that a three-regime model has 11 parameters (three regimes of three, plus two thresholds) versus 7 for the two-regime version.

```r title="Exercise 3 starter"
# Hint: build gs <- list(z <= t1, z > t1 & z <= t2, z > t2) and sum the three
# .lm.fit() residual sums. Then expand.grid() the candidates and keep t1 < t2.

my_setar2_ssr <- function(x, t1, t2, p = 2, d = 2) {
  # your code here
}
```

<details>
<summary>Click to reveal solution</summary>

```r title="Exercise 3 solution"
my_setar2_ssr <- function(x, t1, t2, p = 2, d = 2) {
  m  <- lag_matrix(x, p, d)
  gg <- list(m$z <= t1, m$z > t1 & m$z <= t2, m$z > t2)
  if (any(vapply(gg, sum, 1L) < p + 2)) return(NA_real_)
  sum(vapply(gg, function(g)
    sum(.lm.fit(m$X[g, , drop = FALSE], m$y[g])$residuals^2), numeric(1)))
}

my_z    <- lag_matrix(x, 2, 2)$z
my_cand <- sort(unique(my_z))
my_cand <- my_cand[(floor(0.15 * length(my_cand)) + 1):ceiling(0.85 * length(my_cand))]
my_gr   <- expand.grid(t1 = my_cand, t2 = my_cand)
my_gr   <- my_gr[my_gr$t1 < my_gr$t2, ]
my_gr$ssr <- mapply(function(a, b) my_setar2_ssr(x, a, b), my_gr$t1, my_gr$t2)
my_best <- my_gr[which.min(my_gr$ssr), ]

round(unlist(my_best), 4)
#>     t1     t2    ssr 
#> 2.6117 3.3101 4.0838 

my_n <- length(my_z)
round(c(setar2_aic = my_n * log(my_best$ssr / my_n) + 2 * (3 * 3 + 2),
        setar1_aic = my_n * log(setar_search(x, 2, 2)$min_ssr / my_n) + 2 * (2 * 3 + 1)), 2)
#> setar2_aic setar1_aic 
#>    -348.88    -349.86 
```

**Explanation:** The three-regime model finds thresholds at 2.61 and 3.31 and reduces the error from 4.3482 to 4.0838, a 6 percent improvement. Yet its AIC of -348.88 is *worse* than the two-regime model's -349.86, because four extra parameters bought only a small gain. Note that the upper threshold of 3.3101 is essentially the two-regime answer, so the extra split is carving up the lower regime rather than finding something new. More regimes will always fit better in sample; the question is always whether they pay for themselves.

</details>

## Frequently Asked Questions

### What is the difference between TAR and SETAR?

TAR is the general family, in which the variable that decides the regime can be anything, including a different series entirely. SETAR is the special case where that variable is a lagged value of the series being modelled, which is why it is called self-exciting. Almost every applied paper uses a SETAR, and most software defaults to it. If you want a genuine TAR with an external threshold variable, tsDyn's `setar()` accepts a `thVar` argument for exactly that.

### How do I choose the lag order p and the delay d?

Choose `p` first, using the same tools you would use for a linear AR model, since a threshold model cannot fix an under-specified lag structure. The sunspot example above shows what happens if you skip this: the model looked fine until the residual test exposed it. Once `p` is settled, scan `d` over a small range, typically 1 to `p`, and pick the value with the lowest error, taking care that all candidate delays use the same number of rows so the comparison is fair. tsDyn's `selectSETAR()` automates the joint search.

### How many regimes should I use?

Two, unless you have a strong reason and a lot of data. Exercise 3 shows the typical outcome: a third regime improves in-sample fit and loses on AIC. Each extra regime costs a full set of coefficients plus a threshold, and it takes the smallest regime's observation count with it. Three-regime models do appear in the literature, mostly for series with a genuine neutral band in the middle, such as prices inside a transaction-cost corridor.

### Why can't I just use a standard F test for the threshold?

Because under the null hypothesis of no regimes, the threshold parameter has no meaning at all. Any value describes the data equally well, so the parameter is unidentified, and the usual asymptotic theory that produces chi-square and F distributions does not apply. On top of that, we report the maximum statistic over hundreds of candidate splits rather than a single pre-chosen one. The bootstrap in this post handles both problems by generating the distribution of that maximum on data known to be linear. Hansen's papers, listed in the references, are the definitive treatment.

### Is a threshold model the same as a Markov-switching model?

No, and the difference is about what triggers the switch. In a threshold model the regime is a deterministic function of something you can observe, so at any moment you know exactly which regime you are in. In a Markov-switching model the regime is hidden and moves according to its own random transition probabilities, so you can only estimate the probability of being in each state. Choose a threshold model when you can name the trigger, such as a price level or a policy rate. Choose Markov switching when regimes are driven by something unobserved.

### What about moving-average terms, as in a threshold ARMA?

Threshold ARMA (TARMA) models add regime-dependent MA terms and are a real research area, but they are much harder to estimate. The convenient property this whole post relies on, that fixing the threshold leaves an ordinary least squares problem, disappears once MA terms are present, because MA estimation is already nonlinear. In practice most applied work uses a pure threshold autoregression with enough lags to approximate whatever MA structure exists, which is what we did with nine lags for sunspots.

### Do these models work on non-stationary series?

Fit them to stationary data, using the same differencing or transformation you would apply before an ARIMA model. There is one important nuance: an individual *regime* is allowed to contain a unit root or even be explosive, as tsDyn's warning on the lynx model reminded us, provided the other regime pulls the series back. That behaviour is a feature, and it is how threshold models represent bubbles that inflate and then collapse. What you should not do is fit one to a series with an unhandled trend and interpret the threshold as economically meaningful.

## Summary

![The threshold modelling workflow](screenshots/Threshold-ARMA-TARSTAR-in-R-workflow.webp)

*Figure 4: The five steps of fitting a threshold model, start to finish.*

| Decision | What to do | Why it matters |
|---|---|---|
| Is a threshold model warranted? | Compare average rises against average falls | Linear AR models are symmetric by construction, so measured asymmetry is evidence they cannot fit |
| Lag order p | Choose it first, exactly as for a linear AR | Threshold search cannot repair a missing lag structure, and will invent regimes to try |
| Delay d | Scan a small range, comparing only at equal sample size | The regime split changes substantially with d, disagreeing 43 percent of the time in our simulation |
| Threshold r | Grid search every observed value, trimming 10 to 15 percent | Fixing r makes the model two ordinary regressions, so enumeration is cheap and exact |
| Is it real? | Bootstrap the sup-F statistic | The threshold is unidentified under the null, so standard tables reject far too often |
| Hard or smooth switch? | Fit both, compare on AIC | SETAR is the infinitely steep limit of LSTAR, so the choice is empirical, not philosophical |
| Multi-step forecasts | Simulate paths, never plug in | Plug-in forecasts are biased for nonlinear models, by a factor of 2.4 at 12 steps here |
| Is the model adequate? | Ljung-Box on the residuals | A threshold split can look convincing in a badly under-specified model |

The key results from this post: the lynx series switches behaviour at about 2,042 animals, with a bootstrap p-value of 0.005; a smooth transition fits marginally better but loses on AIC; and out of sample the threshold model beat a linear AR(2) by 6.9 percent.

## References

1. Hansen, B. E. Inference in TAR Models. *Studies in Nonlinear Dynamics and Econometrics* (1997). The standard reference for bootstrap threshold testing. [Link](https://users.ssc.wisc.edu/~bhansen/papers/snde_97.pdf)
2. Hansen, B. E. Inference When a Nuisance Parameter Is Not Identified Under the Null Hypothesis. *Econometrica* (1996). The theory behind why standard tables fail. [Link](https://www.ssc.wisc.edu/~bhansen/papers/ecnmt_96.pdf)
3. tsDyn documentation, `setar()` reference. [Link](https://search.r-project.org/CRAN/refmans/tsDyn/html/setar.html)
4. tsDyn documentation, `lstar()` reference. [Link](https://search.r-project.org/CRAN/refmans/tsDyn/html/lstar.html)
5. Di Narzo, A. F., Aznarte, J. L., Stigler, M. tsDyn: Nonlinear Time Series Models with Regime Switching, CRAN package page. [Link](https://cran.r-project.org/package=tsDyn)
6. Stigler, M. Threshold cointegration and nonlinear time series, tsDyn package vignette. [Link](https://cran.r-project.org/web/packages/tsDyn/vignettes/tsDyn.pdf)
7. R Core Team. `lynx`: Annual Canadian Lynx trappings 1821 to 1934, R datasets documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/lynx.html)
8. R Core Team. `sunspot.year`: Yearly sunspot data 1700 to 1988, R datasets documentation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/datasets/html/sunspot.year.html)

## Continue Learning

- [ARIMA in R](ARIMA-in-R.html) covers the linear models these threshold models generalise, including how to pick a lag order properly before you go hunting for regimes.
- [Test for Stationarity in R](Test-Stationarity-in-R.html) walks through the unit root tests you should run before fitting any of these models, and explains why a regime containing a unit root is not automatically a problem.
- [GARCH Models in R](GARCH-Models-in-R.html) handles the other main kind of nonlinearity, where the *variance* rather than the mean switches between calm and turbulent states.
