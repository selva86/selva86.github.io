---
title: "R for Finance Exercises: 25 Practice Problems"
slug: "R-for-Finance-Exercises"
description: "Master R for finance with 25 practice problems: returns, volatility, portfolios, Sharpe, VaR, CAPM, time series. Hidden solutions."
keywords: "R for finance exercises, R finance practice, quantmod R exercises, portfolio R exercises, R for quants"
mathjax: true
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "R for Finance Exercises"
sidebar_order: 144
fr_parent: "R-Tutorial.html"
auto_link_terms: "R for finance exercises|R finance practice|quantmod R exercises|portfolio R exercises"
auto_link_case_sensitive: false
target_keyword: "R for finance exercises"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# R for Finance Exercises: 25 Practice Problems

<p class="lead">Twenty-five practice problems for finance work in R: returns, volatility, portfolios, Sharpe, VaR, CAPM, factor models. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tibble)
library(ggplot2)
```

### Exercise 1: Simple returns

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
p <- c(100, 102, 99, 105, 108)
diff(p) / head(p, -1)
```

</details>

### Exercise 2: Log returns

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
p <- c(100, 102, 99, 105, 108)
diff(log(p))
```

</details>

### Exercise 3: Cumulative return

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
r <- c(0.02, -0.03, 0.06, 0.03)
prod(1 + r) - 1
```

</details>

### Exercise 4: Annualized return

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
r <- runif(252, -0.02, 0.02)
prod(1 + r)^(252/length(r)) - 1
```

</details>

### Exercise 5: Daily volatility

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
r <- rnorm(252, 0, 0.01)
sd(r)
```

</details>

### Exercise 6: Annualized vol from daily

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
r <- rnorm(252, 0, 0.01)
sd(r) * sqrt(252)
```

</details>

### Exercise 7: Sharpe ratio

**Difficulty:** Intermediate. Excess return / std.

<details><summary>Show solution</summary>

```r
r <- rnorm(252, 0.0005, 0.01)   # daily
rf <- 0.04 / 252
(mean(r) - rf) / sd(r) * sqrt(252)
```

</details>

### Exercise 8: Maximum drawdown

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
prices <- cumprod(1 + rnorm(252, 0.0005, 0.01)) * 100
peak <- cummax(prices)
dd <- prices / peak - 1
min(dd)
```

</details>

### Exercise 9: Portfolio return (2 assets)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
w <- c(0.6, 0.4)
r <- c(0.08, 0.05)
sum(w * r)
```

</details>

### Exercise 10: Portfolio variance

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
w <- c(0.6, 0.4)
S <- matrix(c(0.04, 0.01, 0.01, 0.025), 2, 2)
t(w) %*% S %*% w
```

</details>

### Exercise 11: Covariance matrix

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
r <- matrix(rnorm(252*3, 0, 0.01), ncol = 3)
cov(r) * 252
```

</details>

### Exercise 12: Correlation matrix

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
set.seed(1)
r <- matrix(rnorm(252*3, 0, 0.01), ncol = 3)
cor(r)
```

</details>

### Exercise 13: Historical VaR 5%

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
r <- rnorm(1000, 0, 0.01)
quantile(r, 0.05)
```

</details>

### Exercise 14: Parametric VaR

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mu <- 0; sigma <- 0.01
qnorm(0.05, mu, sigma)
```

</details>

### Exercise 15: Conditional VaR (Expected Shortfall)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
r <- rnorm(1000, 0, 0.01)
v <- quantile(r, 0.05)
mean(r[r <= v])
```

</details>

### Exercise 16: Beta vs market (CAPM)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
mkt <- rnorm(252, 0, 0.012)
asset <- 1.3 * mkt + rnorm(252, 0, 0.005)
coef(lm(asset ~ mkt))["mkt"]
```

</details>

### Exercise 17: Rolling mean return

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
r <- rnorm(252, 0.0005, 0.01)
roll <- zoo::rollmean(r, k = 20, fill = NA, align = "right")
tail(roll, 5)
```

</details>

### Exercise 18: Compounding 10 years at 7%

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
100 * (1 + 0.07)^10
```

</details>

### Exercise 19: Time-weighted return

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
sub_returns <- c(0.05, -0.02, 0.03)
prod(1 + sub_returns) - 1
```

</details>

### Exercise 20: Equal-weight portfolio backtest

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
r <- matrix(rnorm(252 * 3, 0.0003, 0.01), ncol = 3)
portfolio <- rowMeans(r)
cumprod(1 + portfolio)[252]
```

</details>

### Exercise 21: Plot returns

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
set.seed(1)
r <- rnorm(252, 0.0005, 0.01)
plot(cumprod(1 + r), type = "l", main = "Equity curve")
```

</details>

### Exercise 22: Correlation of two assets over rolling window

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
a <- rnorm(252, 0, 0.01); b <- rnorm(252, 0, 0.01)
slider::slide2_dbl(a, b, ~ cor(.x, .y), .before = 59, .complete = TRUE) |> tail()
```

</details>

### Exercise 23: Black-Scholes call price (formula)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
bs_call <- function(S, K, r, T, sigma) {
  d1 <- (log(S/K) + (r + 0.5*sigma^2)*T) / (sigma*sqrt(T))
  d2 <- d1 - sigma*sqrt(T)
  S*pnorm(d1) - K*exp(-r*T)*pnorm(d2)
}
bs_call(S = 100, K = 100, r = 0.05, T = 1, sigma = 0.2)
```

</details>

### Exercise 24: Monte Carlo portfolio simulation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
set.seed(1)
final <- replicate(5000, prod(1 + rnorm(252, 0.0005, 0.01)))
quantile(final, c(0.05, 0.95))
```

</details>

### Exercise 25: Read Yahoo prices with quantmod (concept)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
# quantmod::getSymbols("AAPL", src = "yahoo", from = "2024-01-01")
# Returns an xts object named AAPL with OHLC columns
```

</details>

## What to do next

- **Time-Series-Exercises** (shipped) — broader TS drills.
- **ARIMA-Exercises** (shipped) — forecasting.
