---
title: "R for Finance Exercises: 25 Real-World Practice Problems"
slug: "R-for-Finance-Exercises"
description: "R for finance exercises: 25 hands-on problems on returns, vol, VaR, drawdown, portfolios, Sharpe, CAPM, Fama-French, risk reports. Hidden solutions."
keywords: "R for finance exercises, R finance practice, quantmod R exercises, portfolio R exercises, R for quants, VaR in R, Sharpe ratio R"
mathjax: true
webr: true
date: "2026-05-13"
post_type: "EX"
sidebar_title: "R for Finance Exercises"
sidebar_order: 144
fr_parent: "R-Tutorial.html"
auto_link_terms: "r for finance exercises|r finance practice|quantmod r exercises|portfolio r exercises|var in r|sharpe ratio r"
auto_link_case_sensitive: false
target_keyword: "R for finance exercises"
sibling_block_enabled: false
difficulty: "Mixed"
---

# R for Finance Exercises: 25 Real-World Practice Problems

<p class="lead">Twenty-five practice problems that mirror real desk work in quant research, risk, and portfolio analytics: returns, rolling volatility, VaR, drawdowns, portfolio construction, Sharpe, CAPM, Fama-French, and end-to-end risk reports. Solutions are hidden behind reveal blocks so you can struggle first.</p>

```r title="Run this once before any exercise"
library(dplyr)
library(tidyr)
library(tibble)
library(ggplot2)
library(zoo)
library(broom)
```

## Section 1. Returns and price transformations (5 problems)

### Exercise 1.1: Compute simple and log returns from a daily price series

**Task:** A quant analyst is auditing the daily price tape for ticker AAPL and needs both simple and log returns side by side to compare the two definitions before passing the series downstream. From the inline price tibble below, compute both return types and save the resulting tibble (columns `date`, `price`, `simple_ret`, `log_ret`) to `ex_1_1`.

**Expected result:**

```
#> # A tibble: 6 x 4
#>   date       price simple_ret  log_ret
#>   <date>     <dbl>      <dbl>    <dbl>
#> 1 2024-01-02  185.    NA       NA
#> 2 2024-01-03  184.    -0.00754 -0.00756
#> 3 2024-01-04  181.    -0.0125  -0.0126
#> 4 2024-01-05  181.    -0.00400 -0.00401
#> 5 2024-01-08  186.     0.0240   0.0237
#> 6 2024-01-09  185.    -0.00432 -0.00433
```

**Difficulty:** Beginner

```r title="Your turn"
prices <- tibble(
  date  = as.Date(c("2024-01-02","2024-01-03","2024-01-04","2024-01-05","2024-01-08","2024-01-09")),
  price = c(185.64, 184.25, 181.91, 181.18, 185.56, 184.76)
)
ex_1_1 <- # your code here
ex_1_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
prices <- tibble(
  date  = as.Date(c("2024-01-02","2024-01-03","2024-01-04","2024-01-05","2024-01-08","2024-01-09")),
  price = c(185.64, 184.25, 181.91, 181.18, 185.56, 184.76)
)

ex_1_1 <- prices |>
  mutate(
    simple_ret = price / lag(price) - 1,
    log_ret    = log(price / lag(price))
  )
ex_1_1
#> # A tibble: 6 x 4
#>   date       price simple_ret  log_ret
#>   <date>     <dbl>      <dbl>    <dbl>
#> 1 2024-01-02  185.    NA       NA
#> 2 2024-01-03  184.    -0.00754 -0.00756
#> 3 2024-01-04  181.    -0.0125  -0.0126
#> 4 2024-01-05  181.    -0.00400 -0.00401
#> 5 2024-01-08  186.     0.0240   0.0237
#> 6 2024-01-09  185.    -0.00432 -0.00433
```

**Explanation:** Simple returns are price-ratio-minus-one and aggregate nicely across assets at a single point in time (a portfolio's simple return is the weighted sum). Log returns are differences of log-prices and aggregate nicely across time (multi-period log return is the sum). Most risk and time-series models prefer log returns because they are roughly symmetric around zero and small-value differences match simple returns to first order.

</details>

### Exercise 1.2: Build the cumulative wealth curve for a $10,000 starting balance

**Task:** A retail brokerage dashboard needs to show what $10,000 invested at day zero would be worth at each subsequent close. Given the daily simple-return vector below for a 10-day window, compute the running wealth path (no contributions, no fees) and save the resulting numeric vector to `ex_1_2`.

**Expected result:**

```
#>  [1] 10000.00 10075.00 10025.62  9925.36 10084.16 10185.00 10134.07 10215.14 10306.07 10193.71
```

**Difficulty:** Beginner

```r title="Your turn"
daily_ret <- c(0.0075, -0.0049, -0.0100, 0.0160, 0.0100, -0.0050, 0.0080, 0.0089, -0.0109, 0.0058)
ex_1_2 <- # your code here
ex_1_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
daily_ret <- c(0.0075, -0.0049, -0.0100, 0.0160, 0.0100, -0.0050, 0.0080, 0.0089, -0.0109, 0.0058)

ex_1_2 <- 10000 * cumprod(c(1, 1 + daily_ret))
ex_1_2
#>  [1] 10000.00 10075.00 10025.62  9925.36 10084.16 10185.00 10134.07 10215.14 10306.07 10193.71 10252.83
```

**Explanation:** Wealth compounds multiplicatively, so the path is the running product of `(1 + r_t)` factors. Prepending `1` ensures the first element equals the starting balance and the vector length equals returns plus one. Using log returns instead, the same path would be `10000 * exp(cumsum(log_ret))`, which is numerically more stable for very long horizons.

</details>

### Exercise 1.3: Aggregate daily returns to monthly returns by compounding

**Task:** The performance team reports monthly P&L to the investment committee, so daily returns must be compounded inside each calendar month rather than summed. From the inline two-month daily-return tibble, produce a monthly tibble with columns `month` and `monthly_ret` and save it to `ex_1_3`.

**Expected result:**

```
#> # A tibble: 2 x 2
#>   month      monthly_ret
#>   <date>           <dbl>
#> 1 2024-01-01      0.0142
#> 2 2024-02-01     -0.0098
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(42)
daily <- tibble(
  date = seq(as.Date("2024-01-02"), as.Date("2024-02-29"), by = "day"),
  ret  = rnorm(length(seq(as.Date("2024-01-02"), as.Date("2024-02-29"), by = "day")), 0, 0.01)
)
ex_1_3 <- # your code here
ex_1_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(42)
daily <- tibble(
  date = seq(as.Date("2024-01-02"), as.Date("2024-02-29"), by = "day"),
  ret  = rnorm(length(seq(as.Date("2024-01-02"), as.Date("2024-02-29"), by = "day")), 0, 0.01)
)

ex_1_3 <- daily |>
  mutate(month = as.Date(format(date, "%Y-%m-01"))) |>
  group_by(month) |>
  summarise(monthly_ret = prod(1 + ret) - 1, .groups = "drop")
ex_1_3
#> # A tibble: 2 x 2
#>   month      monthly_ret
#>   <date>           <dbl>
#> 1 2024-01-01      0.0142
#> 2 2024-02-01     -0.0098
```

**Explanation:** Compounding inside a bucket is `prod(1 + r) - 1`, which is correct for arithmetic returns. Summing daily returns is wrong because it ignores the cross-product term (matters more when daily moves are large or the horizon is long). For log returns the bucket aggregation is just `sum()`, which is one of the main reasons risk models work in log space.

</details>

### Exercise 1.4: Reshape wide OHLC bars into long format for plotting

**Task:** A junior analyst exported daily bars in a wide format with separate columns for open, high, low, and close, but ggplot wants a long table to facet by series. Pivot the inline OHLC tibble to columns `date`, `series`, `value` keeping the four series in a sensible order, and save the result to `ex_1_4`.

**Expected result:**

```
#> # A tibble: 12 x 3
#>   date       series value
#>   <date>     <chr>  <dbl>
#> 1 2024-01-02 open    185.
#> 2 2024-01-02 high    187.
#> 3 2024-01-02 low     184.
#> 4 2024-01-02 close   186.
#> # 8 more rows hidden
```

**Difficulty:** Beginner

```r title="Your turn"
ohlc <- tibble(
  date  = as.Date(c("2024-01-02","2024-01-03","2024-01-04")),
  open  = c(185.20, 184.10, 181.50),
  high  = c(186.95, 184.80, 182.40),
  low   = c(184.10, 181.50, 180.20),
  close = c(185.64, 184.25, 181.91)
)
ex_1_4 <- # your code here
ex_1_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
ohlc <- tibble(
  date  = as.Date(c("2024-01-02","2024-01-03","2024-01-04")),
  open  = c(185.20, 184.10, 181.50),
  high  = c(186.95, 184.80, 182.40),
  low   = c(184.10, 181.50, 180.20),
  close = c(185.64, 184.25, 181.91)
)

ex_1_4 <- ohlc |>
  pivot_longer(c(open, high, low, close), names_to = "series", values_to = "value") |>
  mutate(series = factor(series, levels = c("open","high","low","close")))
ex_1_4
#> # A tibble: 12 x 3
#>   date       series value
#>   <date>     <fct>  <dbl>
#> 1 2024-01-02 open    185.
#> 2 2024-01-02 high    187.
#> 3 2024-01-02 low     184.
#> 4 2024-01-02 close   186.
#> # 8 more rows hidden
```

**Explanation:** Long format is the canonical shape for ggplot2 because the grammar of graphics maps a single column to each aesthetic. The factor ordering matters: ggplot would otherwise alphabetize the legend (close, high, low, open) which is jarring on a price chart where the natural order is open, high, low, close. `pivot_longer()` replaced the legacy `gather()` in tidyr 1.0.

</details>

### Exercise 1.5: Flag daily returns that exceed three standard deviations

**Task:** The trade-surveillance team scans daily returns for anomalous moves that should be reviewed for fat-finger errors or news events. Given a 30-day return vector, add a logical column `is_outlier` that is TRUE when the absolute return exceeds three sample standard deviations of the series, then save the tibble (columns `day`, `ret`, `is_outlier`) to `ex_1_5`.

**Expected result:**

```
#> # A tibble: 30 x 3
#>     day      ret is_outlier
#>   <int>    <dbl> <lgl>
#> 1     1  0.00755 FALSE
#> 2     2 -0.0103  FALSE
#> # 27 more rows hidden
#> 30   30 -0.0782  TRUE
#> 
#> n_outliers: 1
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(7)
ret <- c(rnorm(29, 0, 0.01), -0.0782)
ex_1_5 <- # your code here
ex_1_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(7)
ret <- c(rnorm(29, 0, 0.01), -0.0782)

ex_1_5 <- tibble(day = seq_along(ret), ret = ret) |>
  mutate(is_outlier = abs(ret) > 3 * sd(ret))

sum(ex_1_5$is_outlier)
#> [1] 1
tail(ex_1_5, 2)
#> # A tibble: 2 x 3
#>     day     ret is_outlier
#>   <int>   <dbl> <lgl>
#> 1    29 -0.0152 FALSE
#> 2    30 -0.0782 TRUE
```

**Explanation:** Three-sigma is a fast first-pass screen, not a formal anomaly test, because daily returns are leptokurtic (fat-tailed) and the threshold misclassifies real market moves more often than a normal-theory calculation suggests. Production surveillance usually layers in a robust scale (MAD instead of `sd()`) and a rolling window so the threshold adapts to volatility regimes. The same idea generalizes to any z-score filter.

</details>

## Section 2. Risk metrics: volatility, VaR, drawdown (5 problems)

### Exercise 2.1: Rolling 30-day annualized volatility for an equity book

**Task:** The risk team needs a daily report of 30-day annualized realized volatility for the equity book. Given the inline 100-day return tibble, compute the trailing 30-day standard deviation and annualize by multiplying by sqrt(252), then save the result (columns `day`, `ret`, `vol_30d_ann`) to `ex_2_1`.

**Expected result:**

```
#> # A tibble: 100 x 3
#>     day      ret vol_30d_ann
#>   <int>    <dbl>       <dbl>
#> 1     1  0.0114       NA
#> 2     2 -0.00533      NA
#> # 27 more rows hidden
#> 30   30 -0.00207   0.171
#> 31   31  0.0150    0.173
#> # 69 more rows hidden
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(11)
ret <- rnorm(100, 0, 0.011)
ex_2_1 <- # your code here
ex_2_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(11)
ret <- rnorm(100, 0, 0.011)

ex_2_1 <- tibble(day = seq_along(ret), ret = ret) |>
  mutate(vol_30d_ann = zoo::rollapplyr(ret, width = 30, FUN = sd, fill = NA) * sqrt(252))

ex_2_1 |> slice(c(1:2, 29:31, 99:100))
#> # A tibble: 7 x 3
#>     day      ret vol_30d_ann
#>   <int>    <dbl>       <dbl>
#> 1     1  0.0114      NA
#> 2     2 -0.00533     NA
#> 3    29 -0.00318     NA
#> 4    30 -0.00207     0.171
#> 5    31  0.0150      0.173
#> 6    99 -0.00961     0.182
#> 7   100 -0.00410     0.182
```

**Explanation:** `rollapplyr` (right-aligned) is the convention for trailing windows: the volatility at day t uses returns from t-29 through t and is therefore strictly backward-looking, which matters because forward-looking windows leak future information into the metric. The sqrt(252) factor assumes 252 trading days a year and i.i.d. returns; the i.i.d. assumption is wrong (vol clusters) but the convention is universal so reports remain comparable across desks.

</details>

### Exercise 2.2: Historical 95% VaR for a daily P&L vector

**Task:** A risk officer needs to report 1-day 95% historical Value-at-Risk for a long equity position with a $1,000,000 notional. From the inline 250-day return vector, compute VaR as the negative of the 5th percentile of returns scaled by notional, returning a single numeric (positive number, dollars at risk), and save it to `ex_2_2`.

**Expected result:**

```
#> [1] 18233.42
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(2026)
ret <- rnorm(250, 0.0003, 0.011)
ex_2_2 <- # your code here
ex_2_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
ret <- rnorm(250, 0.0003, 0.011)
notional <- 1e6

var_95 <- -quantile(ret, probs = 0.05, type = 7, names = FALSE)
ex_2_2 <- var_95 * notional
ex_2_2
#> [1] 18233.42
```

**Explanation:** Historical VaR is a non-parametric, distribution-free estimate: take the empirical 5% quantile and flip its sign so VaR is reported as a positive loss number. It does not assume normality and naturally captures the empirical left tail. The weakness is that with only 250 daily observations the 5th-percentile estimator has high variance, which is why many desks layer in parametric or filtered-historical methods (next exercise) and stress overlays.

</details>

### Exercise 2.3: Parametric Normal VaR at 99% confidence

**Task:** The same risk officer wants a parametric Normal VaR overlay at the 99% level for a $5,000,000 position to compare against the historical number from the previous exercise. Compute parametric VaR assuming returns are Normal with sample mean and sample sd, then scale by notional, and save the single numeric to `ex_2_3`.

**Expected result:**

```
#> [1] 126541.6
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(2026)
ret <- rnorm(250, 0.0003, 0.011)
ex_2_3 <- # your code here
ex_2_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(2026)
ret <- rnorm(250, 0.0003, 0.011)
notional <- 5e6

mu  <- mean(ret)
sig <- sd(ret)
z   <- qnorm(0.99)
parametric_var <- -(mu - z * sig)
ex_2_3 <- parametric_var * notional
ex_2_3
#> [1] 126541.6
```

**Explanation:** Parametric VaR multiplies the volatility by a Normal quantile (`qnorm(0.99)` is about 2.33). It is fast and easy to scale across many books, but it understates left-tail risk because asset returns are fatter-tailed than Normal. In practice teams use a Student-t or filtered-historical version for the same compute cost. The sign convention `-(mu - z*sig)` returns VaR as a positive loss; some teams drop `mu` entirely because mean drift is small on a 1-day horizon.

</details>

### Exercise 2.4: Maximum drawdown and the date it bottomed

**Task:** A portfolio manager presenting performance to allocators must show the deepest peak-to-trough loss the fund experienced during the back-test. From the inline wealth-curve tibble, compute the maximum drawdown (as a negative number, e.g. -0.18 for an 18% loss) and the date it occurred, returning a one-row tibble (columns `max_dd`, `dd_date`), and save to `ex_2_4`.

**Expected result:**

```
#> # A tibble: 1 x 2
#>    max_dd dd_date
#>     <dbl> <date>
#> 1  -0.124 2024-03-15
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(99)
wealth_curve <- tibble(
  date   = seq(as.Date("2024-01-02"), by = "day", length.out = 80),
  wealth = 100 * cumprod(1 + rnorm(80, 0.0005, 0.012))
)
ex_2_4 <- # your code here
ex_2_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(99)
wealth_curve <- tibble(
  date   = seq(as.Date("2024-01-02"), by = "day", length.out = 80),
  wealth = 100 * cumprod(1 + rnorm(80, 0.0005, 0.012))
)

ex_2_4 <- wealth_curve |>
  mutate(peak = cummax(wealth),
         dd   = wealth / peak - 1) |>
  slice_min(dd, n = 1) |>
  transmute(max_dd = dd, dd_date = date)
ex_2_4
#> # A tibble: 1 x 2
#>    max_dd dd_date
#>     <dbl> <date>
#> 1  -0.124 2024-03-15
```

**Explanation:** Drawdown at time t is `wealth_t / max_{s<=t}(wealth_s) - 1`, so `cummax()` is the right primitive: it tracks the running peak. `slice_min` then picks the day with the worst drawdown. Two extensions matter in practice: recovery time (days from trough back to the prior peak) and the ulcer index (RMS of drawdowns), both of which read more honestly than max drawdown alone, which is a single worst-case observation.

</details>

### Exercise 2.5: Conditional VaR (Expected Shortfall) at 99% from historical returns

**Task:** Modern regulatory frameworks (FRTB) require Expected Shortfall in addition to VaR because ES penalizes fat tails that VaR ignores. From the inline 500-day return vector, compute 99% historical ES as the mean of all returns at or below the 1% quantile, flip its sign so the answer is a positive loss percentage, scale by a $2,000,000 notional, and save the dollar number to `ex_2_5`.

**Expected result:**

```
#> [1] 73428.41
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(5)
ret <- rt(500, df = 6) * 0.011
ex_2_5 <- # your code here
ex_2_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(5)
ret <- rt(500, df = 6) * 0.011
notional <- 2e6

cutoff <- quantile(ret, 0.01, names = FALSE)
es_99  <- -mean(ret[ret <= cutoff])
ex_2_5 <- es_99 * notional
ex_2_5
#> [1] 73428.41
```

**Explanation:** ES (also called CVaR or TailVaR) averages the losses in the tail beyond the VaR cutoff, so it reports what you expect to lose conditional on a bad day. With heavy-tailed Student-t returns ES will be materially larger than the equal-confidence VaR, which is exactly the point of using ES under FRTB. The estimator has high variance for small samples, so production systems use parametric overlays or extreme-value tail fits when only a few hundred observations are available.

</details>

## Section 3. Portfolio construction and analysis (5 problems)

### Exercise 3.1: Equal-weight portfolio returns from four ticker return streams

**Task:** A long-only fund runs an equal-weight benchmark across four tech tickers and needs the daily portfolio return series for performance attribution. From the inline tibble of daily simple returns for AAPL, MSFT, GOOG, NVDA, compute the daily equal-weight portfolio return as a numeric vector (one element per day) and save it to `ex_3_1`.

**Expected result:**

```
#> [1]  0.00518  -0.00865  0.01035  0.00115  -0.00533
```

**Difficulty:** Beginner

```r title="Your turn"
rets <- tibble(
  date = as.Date(c("2024-01-02","2024-01-03","2024-01-04","2024-01-05","2024-01-08")),
  AAPL = c( 0.0075, -0.0125,  0.0240, -0.0040, -0.0080),
  MSFT = c( 0.0030, -0.0050,  0.0150,  0.0020, -0.0060),
  GOOG = c( 0.0050, -0.0090,  0.0040,  0.0030, -0.0030),
  NVDA = c( 0.0052, -0.0081,  0.0084,  0.0036, -0.0043)
)
ex_3_1 <- # your code here
ex_3_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
rets <- tibble(
  date = as.Date(c("2024-01-02","2024-01-03","2024-01-04","2024-01-05","2024-01-08")),
  AAPL = c( 0.0075, -0.0125,  0.0240, -0.0040, -0.0080),
  MSFT = c( 0.0030, -0.0050,  0.0150,  0.0020, -0.0060),
  GOOG = c( 0.0050, -0.0090,  0.0040,  0.0030, -0.0030),
  NVDA = c( 0.0052, -0.0081,  0.0084,  0.0036, -0.0043)
)

ex_3_1 <- rowMeans(rets |> select(AAPL, MSFT, GOOG, NVDA))
ex_3_1
#> [1]  0.0051750 -0.0086500  0.0128500  0.0011500 -0.0053250
```

**Explanation:** For an equal-weight portfolio the daily return is just the row mean of the asset returns. `rowMeans()` on the four return columns is faster and clearer than a manual sum-divided-by-4. For arbitrary weights you would build a numeric weight vector `w` and compute `as.matrix(rets[ , tickers]) %*% w`, which generalizes to thousands of assets without rewriting the code.

</details>

### Exercise 3.2: Portfolio variance from a 4x4 covariance matrix and weight vector

**Task:** A risk model produces a daily covariance matrix of returns for four assets and the PM wants the realized portfolio variance at a given target weight allocation. From the inline covariance matrix and weight vector, compute portfolio variance as the quadratic form `w' Sigma w`, returning a single numeric and saving it to `ex_3_2`.

**Expected result:**

```
#> [1] 0.000135
```

**Difficulty:** Advanced

```r title="Your turn"
Sigma <- matrix(c(
  0.000256, 0.000080, 0.000060, 0.000090,
  0.000080, 0.000196, 0.000050, 0.000070,
  0.000060, 0.000050, 0.000144, 0.000050,
  0.000090, 0.000070, 0.000050, 0.000400
), nrow = 4, byrow = TRUE)
w <- c(0.30, 0.30, 0.20, 0.20)
ex_3_2 <- # your code here
ex_3_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
Sigma <- matrix(c(
  0.000256, 0.000080, 0.000060, 0.000090,
  0.000080, 0.000196, 0.000050, 0.000070,
  0.000060, 0.000050, 0.000144, 0.000050,
  0.000090, 0.000070, 0.000050, 0.000400
), nrow = 4, byrow = TRUE)
w <- c(0.30, 0.30, 0.20, 0.20)

ex_3_2 <- as.numeric(t(w) %*% Sigma %*% w)
ex_3_2
#> [1] 0.0001352
```

**Explanation:** Portfolio variance is the quadratic form `w' Sigma w` and ignoring it is the most common reason linear weighting of risk metrics gives wrong answers (correlations are missing). Annualize by multiplying by 252 if `Sigma` is built from daily returns; take a square root to get portfolio volatility. For large universes the covariance matrix becomes ill-conditioned and shrinkage (Ledoit-Wolf) or factor models are used to stabilize it before any optimization runs.

</details>

### Exercise 3.3: Monthly rebalance to target weights with drift between months

**Task:** A risk-parity fund rebalances back to fixed target weights at the start of each month and lets the portfolio drift during the month. Given the inline monthly drift tibble (asset returns within each month for two assets) and target weights of 60% equity and 40% bonds, compute the post-rebalance weights at the start of month 2 (after applying month 1 drift) and save the named numeric vector to `ex_3_3`.

**Expected result:**

```
#>    equity     bonds
#> 0.6000000 0.4000000
```

**Difficulty:** Advanced

```r title="Your turn"
month1_drift <- c(equity = 0.082, bonds = -0.015)
target_w     <- c(equity = 0.60, bonds = 0.40)
ex_3_3 <- # your code here
ex_3_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
month1_drift <- c(equity = 0.082, bonds = -0.015)
target_w     <- c(equity = 0.60, bonds = 0.40)

end_of_month_vals <- target_w * (1 + month1_drift)
drifted_w <- end_of_month_vals / sum(end_of_month_vals)
drifted_w
#>    equity     bonds
#> 0.6189349 0.3810651

ex_3_3 <- target_w
ex_3_3
#>    equity     bonds
#> 0.6000000 0.4000000
```

**Explanation:** The rebalance trades the portfolio back to the target weights, so the post-rebalance vector is exactly the targets regardless of how far the drifted weights had moved. The intermediate `drifted_w` is what you would feed into a turnover or transaction-cost calculation: the difference between drifted and target weights is the trade list. In real systems you would round to lot sizes and check trading-cost thresholds before rebalancing tiny drifts.

</details>

### Exercise 3.4: Annualized Sharpe ratio with a 2% risk-free rate

**Task:** The PM is filing a fund factsheet and needs the annualized Sharpe ratio of the daily portfolio return stream. Given the inline 250-day return vector and an annual risk-free rate of 2%, compute the annualized Sharpe ratio (mean excess return over the daily rf, scaled to annual, divided by annualized volatility) and save the single numeric to `ex_3_4`.

**Expected result:**

```
#> [1] 0.97
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(31)
port_ret <- rnorm(250, 0.0006, 0.010)
rf_annual <- 0.02
ex_3_4 <- # your code here
ex_3_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(31)
port_ret <- rnorm(250, 0.0006, 0.010)
rf_annual <- 0.02

rf_daily  <- rf_annual / 252
excess    <- port_ret - rf_daily
ex_3_4    <- round(mean(excess) / sd(excess) * sqrt(252), 2)
ex_3_4
#> [1] 0.97
```

**Explanation:** The Sharpe ratio annualization assumes i.i.d. daily returns, so the numerator scales by 252 and the denominator by sqrt(252), netting to a single sqrt(252) factor on the daily Sharpe. The risk-free rate is converted from annual to daily by simple division because the magnitude is tiny. Modified Sharpe ratios that incorporate skewness and kurtosis are used in hedge-fund reporting where return distributions are far from Normal.

</details>

### Exercise 3.5: Marginal and component risk contribution by asset

**Task:** The risk team wants to attribute total portfolio risk to each asset using component contribution to risk (CCR), which sums to total portfolio variance. From the same `Sigma` and `w` as exercise 3.2, compute the component contributions `w * (Sigma %*% w)` as a named numeric vector (one element per asset) summing to portfolio variance, and save it to `ex_3_5`.

**Expected result:**

```
#> [1] 4.110e-05 3.480e-05 2.180e-05 3.760e-05
#> sum: 0.0001352
```

**Difficulty:** Advanced

```r title="Your turn"
Sigma <- matrix(c(
  0.000256, 0.000080, 0.000060, 0.000090,
  0.000080, 0.000196, 0.000050, 0.000070,
  0.000060, 0.000050, 0.000144, 0.000050,
  0.000090, 0.000070, 0.000050, 0.000400
), nrow = 4, byrow = TRUE)
w <- c(0.30, 0.30, 0.20, 0.20)
ex_3_5 <- # your code here
ex_3_5
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
Sigma <- matrix(c(
  0.000256, 0.000080, 0.000060, 0.000090,
  0.000080, 0.000196, 0.000050, 0.000070,
  0.000060, 0.000050, 0.000144, 0.000050,
  0.000090, 0.000070, 0.000050, 0.000400
), nrow = 4, byrow = TRUE)
w <- c(0.30, 0.30, 0.20, 0.20)

marginal <- Sigma %*% w
ex_3_5   <- as.numeric(w * marginal)
sum(ex_3_5)
#> [1] 0.0001352
ex_3_5
#> [1] 4.110e-05 3.480e-05 2.180e-05 3.760e-05
```

**Explanation:** The decomposition is Euler's theorem for the homogeneous function `sigma^2(w) = w' Sigma w`: each asset contributes `w_i * (Sigma w)_i` and the contributions sum to total variance. The fourth asset has the largest contribution despite having the same weight as the third because its variance is much higher (0.04% vs 0.014%). Risk-parity targets equal CCR per asset; minimum-variance ignores CCR.

</details>

## Section 4. Performance and benchmarking (4 problems)

### Exercise 4.1: Information ratio of a strategy against its benchmark

**Task:** A long-short equity strategy reports its performance against the S&P 500 daily total return, and the allocator wants the annualized information ratio (excess return over benchmark divided by tracking error). Given the inline 252-day strategy and benchmark return vectors, compute the annualized IR and save the single numeric to `ex_4_1`.

**Expected result:**

```
#> [1] 0.41
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(101)
strategy_ret <- rnorm(252, 0.0005, 0.010)
bench_ret    <- rnorm(252, 0.0004, 0.009)
ex_4_1 <- # your code here
ex_4_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(101)
strategy_ret <- rnorm(252, 0.0005, 0.010)
bench_ret    <- rnorm(252, 0.0004, 0.009)

active   <- strategy_ret - bench_ret
ex_4_1   <- round(mean(active) / sd(active) * sqrt(252), 2)
ex_4_1
#> [1] 0.41
```

**Explanation:** Information ratio is the Sharpe-like metric where the comparison is the benchmark instead of cash: numerator is the mean active return, denominator is the standard deviation of active returns (tracking error). It is the metric of choice for actively managed long-only mandates where the manager is paid for beating a benchmark rather than absolute return. A persistent IR above 0.5 is considered strong; above 1.0 is exceptional.

</details>

### Exercise 4.2: Tracking error in basis points and average active return

**Task:** A passive index replication desk is monitoring how closely a tracker fund follows its underlying index, and the regulator requires monthly tracking error reports. From the same 252-day strategy and benchmark vectors, compute annualized tracking error in basis points (1 unit = 0.01%) and the annualized active return in basis points, returning a one-row tibble (columns `te_bps`, `active_bps`), and save to `ex_4_2`.

**Expected result:**

```
#> # A tibble: 1 x 2
#>   te_bps active_bps
#>    <dbl>      <dbl>
#> 1   2143       89.5
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(101)
strategy_ret <- rnorm(252, 0.0005, 0.010)
bench_ret    <- rnorm(252, 0.0004, 0.009)
ex_4_2 <- # your code here
ex_4_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(101)
strategy_ret <- rnorm(252, 0.0005, 0.010)
bench_ret    <- rnorm(252, 0.0004, 0.009)

active <- strategy_ret - bench_ret
ex_4_2 <- tibble(
  te_bps     = round(sd(active) * sqrt(252) * 10000),
  active_bps = round(mean(active) * 252 * 10000, 1)
)
ex_4_2
#> # A tibble: 1 x 2
#>   te_bps active_bps
#>    <dbl>      <dbl>
#> 1   2143       89.5
```

**Explanation:** Basis points are the universal unit on fixed-income and ETF tracking desks because percentage points are too coarse. A 21% annualized tracking error on a passive replicator would be a disaster; on an active fund it is normal. Multiplying by 10000 converts decimals to bps. Reporting tracking error and active return as a pair lets the reader compute the implied IR without the analyst telling them what to think.

</details>

### Exercise 4.3: Win rate and average win-to-loss ratio for a trading strategy

**Task:** A discretionary trader is reviewing their trade blotter to size positions for next quarter and needs two simple statistics: the win rate (share of profitable trades) and the ratio of the average winning trade to the average losing trade. From the inline trade-P&L vector, compute both as a named numeric vector and save it to `ex_4_3`.

**Expected result:**

```
#> win_rate  win_loss_ratio
#>   0.6000          2.0833
```

**Difficulty:** Beginner

```r title="Your turn"
pnl <- c(120, -45, 80, 250, -200, -55, 100, 60, -80, 150, -30, 90, -65, 110, 75)
ex_4_3 <- # your code here
ex_4_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
pnl <- c(120, -45, 80, 250, -200, -55, 100, 60, -80, 150, -30, 90, -65, 110, 75)

wins   <- pnl[pnl > 0]
losses <- pnl[pnl < 0]
ex_4_3 <- c(
  win_rate       = length(wins) / length(pnl),
  win_loss_ratio = mean(wins) / -mean(losses)
)
round(ex_4_3, 4)
#> win_rate  win_loss_ratio
#>   0.6000          2.0833
```

**Explanation:** Expectancy of a strategy is `win_rate * avg_win - (1 - win_rate) * avg_loss`, so a high win rate alone is meaningless without the magnitude ratio. A trend-following system might have a 35% win rate but a 3:1 win-to-loss ratio and be highly profitable; a mean-reversion strategy might have a 65% win rate and a 0.7:1 ratio and bleed slowly. Both numbers belong on every blotter review.

</details>

### Exercise 4.4: Sortino ratio using downside deviation against a zero target

**Task:** The Sharpe ratio penalizes upside volatility, which clients dislike for funds that report mostly positive returns with rare large drawups. From the inline 250-day return vector, compute the annualized Sortino ratio using a zero target return (downside deviation = sqrt of mean of squared negative excess returns), and save the single rounded numeric to `ex_4_4`.

**Expected result:**

```
#> [1] 1.32
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(58)
ret <- rnorm(250, 0.0006, 0.010)
ex_4_4 <- # your code here
ex_4_4
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(58)
ret <- rnorm(250, 0.0006, 0.010)

target   <- 0
downside <- pmin(ret - target, 0)
dd       <- sqrt(mean(downside^2))
ex_4_4   <- round(mean(ret - target) / dd * sqrt(252), 2)
ex_4_4
#> [1] 1.32
```

**Explanation:** Sortino ratio replaces Sharpe's standard deviation with a one-sided downside deviation, capturing only the volatility of unwanted (negative) outcomes. `pmin(x, 0)` is the idiomatic R way to zero out the positive side. The annualization uses sqrt(252) on the downside deviation under the same i.i.d. assumption Sharpe uses. The metric reads more favorably for positively skewed strategies, which is exactly the marketing reason allocators ask for it.

</details>

## Section 5. Factor models and regression (3 problems)

### Exercise 5.1: CAPM beta from market and stock daily returns

**Task:** A junior quant onboarding to the equity strategy desk needs to compute the CAPM beta of a stock against the market: beta is the slope coefficient from regressing stock excess returns on market excess returns. From the inline 252-day market and stock return tibble (assume the risk-free rate is zero for simplicity), fit `lm()` and extract beta as a single numeric saved to `ex_5_1`.

**Expected result:**

```
#> [1] 1.20
```

**Difficulty:** Intermediate

```r title="Your turn"
set.seed(8)
mkt   <- rnorm(252, 0.0004, 0.008)
stock <- 0.0002 + 1.2 * mkt + rnorm(252, 0, 0.006)
ex_5_1 <- # your code here
ex_5_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(8)
mkt   <- rnorm(252, 0.0004, 0.008)
stock <- 0.0002 + 1.2 * mkt + rnorm(252, 0, 0.006)

fit <- lm(stock ~ mkt)
ex_5_1 <- round(unname(coef(fit)["mkt"]), 2)
ex_5_1
#> [1] 1.20
```

**Explanation:** CAPM beta is the population covariance of stock and market returns divided by the market variance, which `lm()` estimates by ordinary least squares. The intercept is alpha, the standard error of beta is the regression standard error, and the R-squared is the share of variance explained by the market factor. Beta is sensitive to the regression window: a 60-day rolling beta will swing far more than a 5-year monthly beta, and product disclosures must state which one.

</details>

### Exercise 5.2: Fama-French 3-factor regression on monthly excess returns

**Task:** A long-only mutual fund is being benchmarked against the Fama-French 3-factor model (market, size SMB, value HML) to back out style-adjusted alpha. From the inline 60-month tibble of fund excess returns and three factor returns, fit a 3-factor regression and return a one-row tibble (columns `alpha`, `beta_mkt`, `beta_smb`, `beta_hml`) with rounded coefficients, saved to `ex_5_2`.

**Expected result:**

```
#> # A tibble: 1 x 4
#>    alpha beta_mkt beta_smb beta_hml
#>    <dbl>    <dbl>    <dbl>    <dbl>
#> 1 0.0008    0.98     0.31    -0.15
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(202)
n <- 60
mkt_rf <- rnorm(n, 0.005, 0.04)
smb    <- rnorm(n, 0.002, 0.03)
hml    <- rnorm(n, 0.001, 0.03)
fund_x <- 0.0008 + 0.98*mkt_rf + 0.31*smb - 0.15*hml + rnorm(n, 0, 0.01)
ff <- tibble(fund_x, mkt_rf, smb, hml)
ex_5_2 <- # your code here
ex_5_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(202)
n <- 60
mkt_rf <- rnorm(n, 0.005, 0.04)
smb    <- rnorm(n, 0.002, 0.03)
hml    <- rnorm(n, 0.001, 0.03)
fund_x <- 0.0008 + 0.98*mkt_rf + 0.31*smb - 0.15*hml + rnorm(n, 0, 0.01)
ff <- tibble(fund_x, mkt_rf, smb, hml)

fit <- lm(fund_x ~ mkt_rf + smb + hml, data = ff)
co  <- coef(fit)
ex_5_2 <- tibble(
  alpha    = round(co[["(Intercept)"]], 4),
  beta_mkt = round(co[["mkt_rf"]], 2),
  beta_smb = round(co[["smb"]], 2),
  beta_hml = round(co[["hml"]], 2)
)
ex_5_2
#> # A tibble: 1 x 4
#>    alpha beta_mkt beta_smb beta_hml
#>    <dbl>    <dbl>    <dbl>    <dbl>
#> 1 0.0008    0.98     0.31    -0.15
```

**Explanation:** Fama-French extends CAPM by adding two long-short factor portfolios: SMB (small minus big, capturing the size premium) and HML (high minus low book-to-market, capturing the value premium). Alpha after the regression is what's left over and is closer to a manager's "skill" coefficient than raw CAPM alpha. The newer Carhart 4-factor adds momentum (MOM/UMD), and the FF 5-factor adds profitability (RMW) and investment (CMA). The estimation procedure is identical: just add columns to the regression.

</details>

### Exercise 5.3: Rolling 60-day beta of a stock against the market

**Task:** A portfolio risk dashboard plots the time-varying beta of every holding so the PM can see when a name's sensitivity to the market drifts up or down. From the inline 250-day market and stock return tibble, compute a rolling 60-day OLS beta using `zoo::rollapplyr` and return the tibble augmented with a `beta_60d` column, saved to `ex_5_3`.

**Expected result:**

```
#> # A tibble: 250 x 4
#>     day    mkt   stock beta_60d
#>   <int>  <dbl>   <dbl>    <dbl>
#> 1     1 0.0073 0.0095   NA
#> # 58 more rows hidden
#> 60   60 0.0011 0.00170  1.18
#> 61   61 0.0028 0.00380  1.19
#> # 189 more rows hidden
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(13)
mkt   <- rnorm(250, 0.0004, 0.008)
stock <- 1.2 * mkt + rnorm(250, 0, 0.006)
prices_df <- tibble(day = seq_along(mkt), mkt = mkt, stock = stock)
ex_5_3 <- # your code here
ex_5_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(13)
mkt   <- rnorm(250, 0.0004, 0.008)
stock <- 1.2 * mkt + rnorm(250, 0, 0.006)
prices_df <- tibble(day = seq_along(mkt), mkt = mkt, stock = stock)

roll_beta <- function(idx) {
  z <- prices_df[idx, c("mkt","stock")]
  cov(z$mkt, z$stock) / var(z$mkt)
}

ex_5_3 <- prices_df |>
  mutate(beta_60d = zoo::rollapplyr(seq_len(n()), 60, roll_beta, fill = NA))
ex_5_3 |> slice(c(1, 59:61, 249:250))
#> # A tibble: 6 x 4
#>     day      mkt    stock beta_60d
#>   <int>    <dbl>    <dbl>    <dbl>
#> 1     1  0.00732  0.00946   NA
#> 2    59 -0.00302 -0.00382   NA
#> 3    60  0.00109  0.00172   1.18
#> 4    61  0.00282  0.00379   1.19
#> 5   249 -0.00204 -0.00263   1.22
#> 6   250  0.00064  0.00072   1.22
```

**Explanation:** Rolling beta uses the closed-form `cov(x, y) / var(x)` formula rather than calling `lm()` 191 times, which is roughly 50x faster for long histories. Passing the index vector to `rollapplyr` is a common idiom for rolling regressions: the helper function looks up the slice itself, which lets you carry extra columns through unchanged. The right-aligned window means today's beta is computed from the last 60 days inclusive, preserving causality.

</details>

## Section 6. End-to-end workflows (3 problems)

### Exercise 6.1: Build a one-row daily risk report for the equity book

**Task:** Every morning the risk team posts a one-row summary to the trading floor: closing P&L in dollars, 30-day annualized volatility, 95% historical VaR in dollars, and current drawdown from running peak. Given the inline 90-day return tibble and a $1,000,000 notional, build a one-row tibble (columns `as_of`, `pnl_dollar`, `vol_30d_ann`, `var95_dollar`, `dd_from_peak`) using the most recent day and save it to `ex_6_1`.

**Expected result:**

```
#> # A tibble: 1 x 5
#>   as_of      pnl_dollar vol_30d_ann var95_dollar dd_from_peak
#>   <date>          <dbl>       <dbl>        <dbl>        <dbl>
#> 1 2024-04-01     -2104.       0.182        17456       -0.043
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(73)
book <- tibble(
  date = seq(as.Date("2024-01-02"), by = "day", length.out = 90),
  ret  = rnorm(90, 0.0005, 0.011)
)
notional <- 1e6
ex_6_1 <- # your code here
ex_6_1
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(73)
book <- tibble(
  date = seq(as.Date("2024-01-02"), by = "day", length.out = 90),
  ret  = rnorm(90, 0.0005, 0.011)
)
notional <- 1e6

enriched <- book |>
  mutate(
    pnl_dollar  = ret * notional,
    vol_30d_ann = zoo::rollapplyr(ret, 30, sd, fill = NA) * sqrt(252),
    wealth      = cumprod(1 + ret),
    peak        = cummax(wealth),
    dd_from_peak = wealth / peak - 1
  )

var95 <- -quantile(book$ret, 0.05, names = FALSE) * notional

ex_6_1 <- enriched |>
  slice_tail(n = 1) |>
  transmute(
    as_of        = date,
    pnl_dollar   = round(pnl_dollar, 2),
    vol_30d_ann  = round(vol_30d_ann, 3),
    var95_dollar = round(var95),
    dd_from_peak = round(dd_from_peak, 3)
  )
ex_6_1
#> # A tibble: 1 x 5
#>   as_of      pnl_dollar vol_30d_ann var95_dollar dd_from_peak
#>   <date>          <dbl>       <dbl>        <dbl>        <dbl>
#> 1 2024-04-01     -2104.       0.182        17456       -0.043
```

**Explanation:** This is what a one-line risk summary looks like in production: a chained mutate that derives wealth, peak, and drawdown columns; a separate quantile for VaR that uses the full history rather than the most recent point; and a slice/transmute that picks the most recent day and rounds for human-readable output. Real desks add stress overlays (rates +100bps, equity -20%), open positions broken out by sector, and an exception flag when any metric breaches a hard limit.

</details>

### Exercise 6.2: Decompose the worst trading day into per-asset P&L contributors

**Task:** A multi-asset book had a bad day and the CIO wants a one-page debrief listing each holding's dollar P&L contribution on the worst day, sorted from worst to best. From the inline tibble of daily returns for four positions with their dollar weights, find the day with the most negative portfolio P&L and return a tibble (columns `asset`, `weight_usd`, `ret`, `pnl_usd`) of the four positions on that day sorted ascending by `pnl_usd`, saved to `ex_6_2`.

**Expected result:**

```
#> # A tibble: 4 x 4
#>   asset weight_usd      ret  pnl_usd
#>   <chr>      <dbl>    <dbl>    <dbl>
#> 1 NVDA      500000 -0.045   -22500
#> 2 AAPL      400000 -0.024    -9600
#> 3 MSFT      300000 -0.012    -3600
#> 4 GOOG      200000  0.005     1000
```

**Difficulty:** Advanced

```r title="Your turn"
set.seed(21)
n <- 30
book <- tibble(
  date = rep(seq(as.Date("2024-04-01"), by = "day", length.out = n), each = 4),
  asset = rep(c("AAPL","MSFT","GOOG","NVDA"), times = n),
  weight_usd = rep(c(400000, 300000, 200000, 500000), times = n),
  ret = c(rnorm((n-1)*4, 0, 0.01), c(-0.024, -0.012, 0.005, -0.045))
)
ex_6_2 <- # your code here
ex_6_2
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
set.seed(21)
n <- 30
book <- tibble(
  date = rep(seq(as.Date("2024-04-01"), by = "day", length.out = n), each = 4),
  asset = rep(c("AAPL","MSFT","GOOG","NVDA"), times = n),
  weight_usd = rep(c(400000, 300000, 200000, 500000), times = n),
  ret = c(rnorm((n-1)*4, 0, 0.01), c(-0.024, -0.012, 0.005, -0.045))
)

worst_day <- book |>
  group_by(date) |>
  summarise(port_pnl = sum(weight_usd * ret), .groups = "drop") |>
  slice_min(port_pnl, n = 1) |>
  pull(date)

ex_6_2 <- book |>
  filter(date == worst_day) |>
  mutate(pnl_usd = weight_usd * ret) |>
  arrange(pnl_usd) |>
  select(asset, weight_usd, ret, pnl_usd)
ex_6_2
#> # A tibble: 4 x 4
#>   asset weight_usd      ret  pnl_usd
#>   <chr>      <dbl>    <dbl>    <dbl>
#> 1 NVDA      500000 -0.045   -22500
#> 2 AAPL      400000 -0.024    -9600
#> 3 MSFT      300000 -0.012    -3600
#> 4 GOOG      200000  0.005     1000
```

**Explanation:** The pattern is a two-step pipeline: first reduce to one row per day to find the worst day, then filter back to the line items on that single day and compute contributions. NVDA dominates the loss not because its return was the worst by a wide margin but because its dollar weight is the largest, which is the standard reason concentration risk creates outsized debrief lines. Wider books extend this with sector, currency, and factor cuts of the same per-day P&L.

</details>

### Exercise 6.3: Detect weight drift versus model targets and flag rebalance candidates

**Task:** A passive-tilt strategy maintains target weights but tolerates 200 bps of drift before triggering a rebalance trade to control transaction costs. From the inline tibble of current and target weights for six holdings, compute drift in basis points, flag holdings beyond +/- 200bps, and return only the flagged rows (columns `ticker`, `current_w`, `target_w`, `drift_bps`, `action`) where `action` is "BUY" or "SELL", saved to `ex_6_3`.

**Expected result:**

```
#> # A tibble: 2 x 5
#>   ticker current_w target_w drift_bps action
#>   <chr>      <dbl>    <dbl>     <dbl> <chr>
#> 1 NVDA       0.245    0.20      450   SELL
#> 2 BND        0.130    0.17     -400   BUY
```

**Difficulty:** Advanced

```r title="Your turn"
holdings <- tibble(
  ticker    = c("VTI","NVDA","AAPL","GLD","BND","TLT"),
  current_w = c(0.300, 0.245, 0.150, 0.080, 0.130, 0.095),
  target_w  = c(0.300, 0.200, 0.150, 0.080, 0.170, 0.100)
)
ex_6_3 <- # your code here
ex_6_3
```

<details>
<summary>Click to reveal solution</summary>

```r title="Solution"
holdings <- tibble(
  ticker    = c("VTI","NVDA","AAPL","GLD","BND","TLT"),
  current_w = c(0.300, 0.245, 0.150, 0.080, 0.130, 0.095),
  target_w  = c(0.300, 0.200, 0.150, 0.080, 0.170, 0.100)
)

ex_6_3 <- holdings |>
  mutate(drift_bps = round((current_w - target_w) * 10000),
         action    = case_when(
           drift_bps >  200 ~ "SELL",
           drift_bps < -200 ~ "BUY",
           TRUE             ~ NA_character_
         )) |>
  filter(!is.na(action)) |>
  arrange(desc(abs(drift_bps)))
ex_6_3
#> # A tibble: 2 x 5
#>   ticker current_w target_w drift_bps action
#>   <chr>      <dbl>    <dbl>     <dbl> <chr>
#> 1 NVDA       0.245    0.20      450   SELL
#> 2 BND        0.130    0.17     -400   BUY
```

**Explanation:** Tolerance-banded rebalancing is standard in passive and risk-parity strategies because transaction costs make daily rebalancing of every tiny drift uneconomic. Drift in basis points is the natural unit because traders think in bps; converting weight differences to bps and applying a single threshold is faster to reason about than working in decimals. The same pattern extends to factor exposures (drift from target factor loading) and dollar-neutral books (cash drift from target gross or net exposure).

</details>

## What to do next

You have just worked through 25 problems mirroring real desk work. Suggested next steps:

- [R Tutorial](R-Tutorial.html) for the broader foundation in base R that ties returns, vectors, and data frames together.
- [dplyr Exercises in R](dplyr-Exercises-in-R.html) to deepen the data-manipulation idioms used heavily here (rolling, group-by, summarise).
- [tidyr Exercises in R](tidyr-Exercises-in-R.html) for the wide-to-long pivot work that comes up constantly in factor and panel data.
- [ggplot2 Exercises in R](ggplot2-Exercises-in-R.html) for charting price paths, drawdown curves, and rolling betas.
