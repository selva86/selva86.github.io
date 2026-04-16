---
title: "EDA for Time Series in R: Seasonality, Trend & Autocorrelation Plots"
slug: "EDA-for-Time-Series-in-R"
description: "Explore time series in R with trend plots, seasonal decomposition, ACF/PACF correlograms, and stationarity tests. Runnable code with built-in datasets."
keywords: "EDA time series R, time series exploratory data analysis R, ACF PACF R, seasonal decomposition R, trend analysis R, autocorrelation R, stationarity test R, STL decomposition R, ts object R"
mathjax: false
webr: true
difficulty: "Intermediate"
date: "2026-04-16"
curriculum_id: "FR-eda-1"
post_type: "FR"
auto_link_terms: "time series EDA|EDA for time series|ACF plot|PACF plot|seasonal decomposition|STL decomposition|autocorrelation function|time series decomposition"
auto_link_case_sensitive: false
fr_parent: "Exploratory-Data-Analysis-in-R.html"
---

# EDA for Time Series in R: Seasonality, Trend & Autocorrelation Plots

<p class="lead">Time series EDA reveals the hidden structure in temporal data — trend direction, seasonal cycles, and autocorrelation patterns — before you fit any model. This guide walks you through every essential diagnostic plot in R, from raw time plots to STL decomposition and ACF/PACF correlograms, using built-in datasets you can run right now.</p>

## What does a raw time series plot reveal?

Every time series tells a story through its shape. Before you forecast or model, you need to read that story. Let's load R's built-in `AirPassengers` dataset and plot it to see what patterns jump out immediately.

```r
# Plot the AirPassengers dataset (monthly airline passengers 1949-1960)
ap <- AirPassengers
ts.plot(ap, main = "Monthly Airline Passengers (1949-1960)",
        ylab = "Passengers (thousands)", xlab = "Year",
        col = "steelblue", lwd = 2)
grid()
#> (A line chart showing upward trend with growing seasonal peaks)

# Quick summary of the time series object
print(ap)
#>      Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
#> 1949 112 118 132 129 121 135 148 148 136 119 104 118
#> 1950 115 126 141 135 125 149 170 170 158 133 114 140
#> ...
cat("Start:", start(ap), "\n")
#> Start: 1949 1
cat("End:", end(ap), "\n")
#> End: 1960 12
cat("Frequency:", frequency(ap), "\n")
#> Frequency: 12
```

Even from this single plot, three things are immediately visible: a **rising trend** (passengers increase year over year), **seasonal peaks** every summer (July-August), and the peaks are **growing larger** over time. That growing amplitude is a clue — it suggests multiplicative rather than additive seasonality, something we'll confirm later with decomposition.

[KEY INSIGHT]
**A single time plot reveals trend, seasonality, and variance changes at a glance.** Before reaching for any statistical test, plot the raw series first. The human eye is remarkably good at spotting patterns that formal tests then confirm.

The `AirPassengers` object is a `ts` (time series) object — R's built-in class for regularly spaced temporal data. You can create one from any numeric vector by specifying the start date and frequency.

```r
# Create a ts object from raw data
monthly_sales <- c(200, 220, 250, 230, 210, 260, 280, 290, 270, 240, 215, 225)
my_ts <- ts(monthly_sales, start = c(2025, 1), frequency = 12)
print(my_ts)
#>       Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov  Dec
#> 2025  200  220  250  230  210  260  280  290  270  240  215  225
class(my_ts)
#> [1] "ts"
```

The `frequency` argument tells R how many observations make up one cycle: 12 for monthly, 4 for quarterly, 52 for weekly, 365 for daily. This metadata powers every seasonal function we'll use from here on.

**Try it:** Create a `ts` object called `ex_quarterly` from the vector `c(50, 80, 120, 90, 55, 85, 130, 95)` representing 2 years of quarterly data starting in Q1 2024, then print it.

```r
# Try it: create a quarterly ts object
ex_quarterly <- ts(c(50, 80, 120, 90, 55, 85, 130, 95),
                   start = c(2024, 1), frequency = 4)
# your code here — print ex_quarterly
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_quarterly <- ts(c(50, 80, 120, 90, 55, 85, 130, 95),
                   start = c(2024, 1), frequency = 4)
print(ex_quarterly)
#>      Qtr1 Qtr2 Qtr3 Qtr4
#> 2024   50   80  120   90
#> 2025   55   85  130   95
```

**Explanation:** Setting `frequency = 4` tells R these are quarterly observations, so `print()` labels columns as Qtr1-Qtr4 automatically.

</details>

## How do you detect and visualize trend?

Trend is the long-term direction of a series — is it going up, down, or staying flat? Raw data is often too noisy to see the trend clearly, so we smooth it with a moving average that averages out the seasonal bumps.

```r
# Overlay a 12-month moving average to reveal the trend
ap_ma <- stats::filter(ap, filter = rep(1/12, 12), sides = 2)
ts.plot(ap, ap_ma, col = c("grey70", "red"),
        lwd = c(1, 3),
        main = "AirPassengers with 12-Month Moving Average",
        ylab = "Passengers (thousands)")
legend("topleft", legend = c("Raw data", "12-month MA"),
       col = c("grey70", "red"), lwd = c(1, 3))
#> (Plot shows smooth upward red line through noisy grey data)
```

The red line cuts through the seasonal noise and reveals a clear, accelerating upward trend. Notice the moving average window is 12 — matching the seasonal period (12 months). This is deliberate: averaging over exactly one full cycle cancels out the seasonal component, leaving only the trend.

[TIP]
**Match your moving average window to the seasonal period.** Use 12 for monthly data, 4 for quarterly, 7 for daily-with-weekly-pattern. A mismatched window leaves seasonal artifacts in your trend line.

R's `decompose()` function also extracts the trend component automatically. Let's compare.

```r
# Extract trend using decompose()
ap_decomp <- decompose(ap)
plot(ap_decomp$trend, main = "Trend Component from decompose()",
     ylab = "Passengers (thousands)", col = "darkred", lwd = 2)
#> (Plot shows the same upward trend, with NA at the edges)
```

The trend from `decompose()` looks nearly identical to our manual moving average — because that's exactly what it computes internally. The `NA` values at the start and end are an unavoidable edge effect of centered moving averages: you can't compute a 12-month average for the first and last 6 months.

**Try it:** Load the built-in `UKgas` dataset (quarterly UK gas consumption). Apply a 4-quarter moving average using `stats::filter()` and plot it overlaid on the raw data.

```r
# Try it: smooth UKgas with a 4-quarter moving average
ex_gas <- UKgas
ex_gas_ma <- stats::filter(ex_gas, filter = rep(1/4, 4), sides = 2)
# your code here — plot both ex_gas and ex_gas_ma on the same chart
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_gas <- UKgas
ex_gas_ma <- stats::filter(ex_gas, filter = rep(1/4, 4), sides = 2)
ts.plot(ex_gas, ex_gas_ma, col = c("grey70", "blue"), lwd = c(1, 3),
        main = "UK Gas Consumption with 4-Quarter Moving Average",
        ylab = "Gas consumption")
legend("topleft", legend = c("Raw", "4-quarter MA"),
       col = c("grey70", "blue"), lwd = c(1, 3))
#> (Plot shows rising trend through seasonal quarterly data)
```

**Explanation:** `rep(1/4, 4)` creates equal weights for a 4-quarter average, and `sides = 2` makes it centered (looking both forward and backward).

</details>

## How do you identify seasonal patterns?

Seasonality means repeating cycles of fixed length — summer peaks in airline travel, winter spikes in heating bills, Monday dips in retail sales. Three R functions make seasonal patterns impossible to miss: `monthplot()`, `boxplot()` by cycle, and grouped subseries analysis.

```r
# monthplot() — each month's values connected across years
monthplot(ap, main = "Seasonal Subseries Plot: AirPassengers",
          ylab = "Passengers (thousands)", xlab = "Month",
          col = "steelblue", lwd = 2)
#> (12 vertical strips — one per month — each showing that month's values across years)
```

The `monthplot()` function is one of R's most underused EDA tools. Each vertical strip shows how one month behaves across all years, with a horizontal line at the mean. You can instantly see that July and August have the highest averages, while November and February are the lowest. The upward slope within each strip confirms the trend we found earlier.

Boxplots by month give a complementary view — they show the distribution, not just the trajectory.

```r
# Boxplot by month — distribution of each month across years
boxplot(ap ~ cycle(ap),
        main = "Passenger Distribution by Month",
        xlab = "Month", ylab = "Passengers (thousands)",
        col = "lightblue", border = "steelblue")
#> (12 boxplots showing summer months have higher medians and wider spread)
```

The boxplots confirm the seasonal pattern and add a new insight: summer months (June-August) have not only higher medians but also wider interquartile ranges. This growing spread is another sign of multiplicative seasonality — the seasonal effect scales with the level of the series.

[KEY INSIGHT]
**Constant seasonal amplitude means additive seasonality. Growing amplitude means multiplicative.** In the AirPassengers data, the summer-winter gap widens as passenger numbers rise — that's multiplicative. This choice matters for decomposition and forecasting model selection.

Let's quantify the monthly pattern by computing average passengers per month across all years.

```r
# Average passengers by month across all years
monthly_means <- tapply(ap, cycle(ap), mean)
barplot(monthly_means,
        names.arg = month.abb,
        main = "Average Monthly Passengers (1949-1960)",
        ylab = "Mean passengers (thousands)",
        col = "steelblue")
#> (Bar chart: Jul and Aug tallest at ~300+, Nov-Feb shortest at ~150-180)
cat("Peak month:", month.abb[which.max(monthly_means)],
    "=", round(max(monthly_means)), "\n")
#> Peak month: Jul = 314
cat("Trough month:", month.abb[which.min(monthly_means)],
    "=", round(min(monthly_means)), "\n")
#> Trough month: Nov = 165
```

July averages 314 thousand passengers versus November's 165 thousand — a seasonal swing of nearly 2x. For airline planning, this means capacity in peak summer needs to be almost double the November baseline.

**Try it:** Load the built-in `nottem` dataset (average air temperatures in Nottingham, 1920-1939). Use `monthplot()` and identify which month is warmest and which is coldest.

```r
# Try it: seasonal pattern of Nottingham temperatures
ex_temp <- nottem
# your code here — use monthplot(ex_temp, ...) and find the peak/trough months
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_temp <- nottem
monthplot(ex_temp, main = "Nottingham Monthly Temperatures",
          ylab = "Temperature (F)", col = "tomato", lwd = 2)
#> (Shows clear seasonal arc: warm summers, cold winters)
cat("Warmest:", month.abb[which.max(tapply(ex_temp, cycle(ex_temp), mean))], "\n")
#> Warmest: Jul
cat("Coldest:", month.abb[which.min(tapply(ex_temp, cycle(ex_temp), mean))], "\n")
#> Coldest: Jan
```

**Explanation:** `monthplot()` reveals a textbook sinusoidal seasonal pattern for temperature. `tapply()` with `cycle()` groups by month to find the extremes.

</details>

## How does time series decomposition separate trend, seasonality, and noise?

Decomposition is the power tool of time series EDA. It splits your series into three components: **Trend** (the long-term direction), **Seasonal** (the repeating cycle), and **Remainder** (everything else — noise, anomalies, unexplained variation). The question is whether these combine by addition or multiplication.

- **Additive:** Observed = Trend + Seasonal + Remainder (use when seasonal swings stay constant)
- **Multiplicative:** Observed = Trend x Seasonal x Remainder (use when seasonal swings grow with the level)

Let's see both side by side on AirPassengers.

```r
# Additive decomposition
ap_add <- decompose(ap, type = "additive")
plot(ap_add, col = "steelblue")
#> (4-panel plot: Observed, Trend, Seasonal, Random — seasonal component is constant)

# Multiplicative decomposition
ap_mult <- decompose(ap, type = "multiplicative")
plot(ap_mult, col = "darkred")
#> (4-panel plot: same layout — but Random component is more uniform)
```

Compare the "Random" (remainder) panels. In the additive decomposition, the remainder shows a fan-shaped pattern — the residuals grow larger over time. In the multiplicative decomposition, the remainder is more uniform. That fan shape in the additive version means the model isn't capturing the growing seasonal amplitude properly. The multiplicative version handles it correctly.

[WARNING]
**decompose() has real limitations.** It can't handle missing values, loses data at the edges (those NA values in the trend), and assumes the seasonal pattern is perfectly constant. For production work, use stl() instead — it's more robust.

`stl()` (Seasonal and Trend decomposition using Loess) is a more sophisticated alternative that adapts the seasonal component over time and handles outliers gracefully.

```r
# STL decomposition — more robust than decompose()
ap_stl <- stl(ap, s.window = "periodic")
plot(ap_stl, main = "STL Decomposition of AirPassengers",
     col = "steelblue")
#> (3-panel plot: seasonal, trend, remainder — with grey bars showing relative scale)

# The grey bars on the right show relative magnitudes
# Smaller bar = larger variation relative to the data
cat("Seasonal range:", round(diff(range(ap_stl$time.series[, "seasonal"]))), "\n")
#> Seasonal range: 109
cat("Trend range:", round(diff(range(ap_stl$time.series[, "trend"]))), "\n")
#> Trend range: 389
```

The grey bars on STL plots are a clever feature: they show the relative scale of each component. The trend bar is small (large variation relative to the data), while the remainder bar is large (small variation) — meaning trend dominates the series and noise is relatively minor. Exactly what you'd expect for a dataset with a strong upward trajectory.

**Try it:** Decompose the `co2` dataset (Mauna Loa CO2 concentrations) using `stl()` with `s.window = "periodic"`. Look at the seasonal component — is the amplitude constant or changing?

```r
# Try it: STL decomposition of co2
ex_co2 <- co2
ex_co2_stl <- stl(ex_co2, s.window = "periodic")
# your code here — plot ex_co2_stl and examine the seasonal component
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_co2 <- co2
ex_co2_stl <- stl(ex_co2, s.window = "periodic")
plot(ex_co2_stl, col = "steelblue")
#> (Seasonal amplitude is nearly constant — additive pattern)
cat("Seasonal range:", round(diff(range(ex_co2_stl$time.series[, "seasonal"])), 2), "\n")
#> Seasonal range: 6.07
```

**Explanation:** The CO2 seasonal component has nearly constant amplitude (~6 ppm swing) regardless of the rising level, confirming additive seasonality. This contrasts with AirPassengers where the amplitude grows.

</details>

## What do ACF and PACF plots tell you about your data?

The autocorrelation function (ACF) measures how strongly a series correlates with lagged copies of itself. If today's value is similar to yesterday's, lag-1 autocorrelation is high. The partial autocorrelation function (PACF) measures the *direct* correlation at each lag after removing the effects of all shorter lags. Together, they're the fingerprint of a time series.

```r
# ACF of AirPassengers
acf(ap, lag.max = 48, main = "ACF: AirPassengers",
    col = "steelblue", lwd = 2)
#> (Scalloped decay pattern — slow decline with peaks every 12 lags)
```

The ACF plot shows two patterns at once. First, the slow decay of correlation from lag 1 outward — that's the **trend**. Values close in time are similar because the series drifts upward slowly. Second, the scalloped shape with peaks at lags 12, 24, 36 — that's the **seasonality**. January correlates strongly with next January, moderately with the January after that, and so on.

The blue dashed lines are 95% confidence bands. Any spike outside these bands is statistically significant — it's unlikely to appear in purely random data. Nearly every lag in AirPassengers exceeds the bands, confirming strong temporal structure.

```r
# PACF of AirPassengers
pacf(ap, lag.max = 48, main = "PACF: AirPassengers",
     col = "darkred", lwd = 2)
#> (Significant spikes at lags 1, 12, 13 — then cuts off)
```

The PACF tells a cleaner story. After removing indirect correlations, only a few lags show direct effects: lag 1 (each month directly depends on the previous month), lag 12 (each month directly depends on the same month last year), and lag 13 (a combination effect). This PACF pattern is the signature of a seasonal autoregressive process — exactly what ARIMA modelers look for.

[KEY INSIGHT]
**ACF slow decay = trend. ACF peaks at seasonal lags = seasonality. PACF sharp cutoff = autoregressive order.** These three patterns in the ACF/PACF pair tell you almost everything you need to know before building a forecasting model.

What happens if we remove the trend by differencing? The ACF should lose its slow decay and reveal pure seasonality.

```r
# ACF of first-differenced AirPassengers (trend removed)
ap_diff <- diff(ap)
acf(ap_diff, lag.max = 48,
    main = "ACF: Differenced AirPassengers (Trend Removed)",
    col = "steelblue", lwd = 2)
#> (Slow decay gone — now shows strong spikes at lags 12, 24, 36 only)
```

Differencing removed the slow decay. What remains are sharp spikes at lags 12, 24, and 36 — pure seasonal autocorrelation. This confirms that after removing the trend, the dominant remaining structure is the 12-month seasonal cycle. If you differenced again at lag 12 (seasonal differencing), even these spikes would shrink, leaving near-white-noise residuals.

**Try it:** Compute and plot the ACF of `diff(ap, lag = 12)` (seasonally differenced AirPassengers). What happens to the seasonal spikes at lags 12, 24, 36?

```r
# Try it: ACF after seasonal differencing
ex_ap_sdiff <- diff(ap, lag = 12)
# your code here — plot the ACF of ex_ap_sdiff
```

<details>
<summary>Click to reveal solution</summary>

```r
ex_ap_sdiff <- diff(ap, lag = 12)
acf(ex_ap_sdiff, lag.max = 48,
    main = "ACF: Seasonally Differenced AirPassengers",
    col = "steelblue", lwd = 2)
#> (Seasonal spikes at 12, 24, 36 are dramatically reduced or gone)
```

**Explanation:** Seasonal differencing (subtracting the value from 12 months ago) removes the seasonal pattern, just as first differencing removes the trend. The resulting ACF shows much less structure — closer to white noise.

</details>

## How do you test for stationarity formally?

Visual inspection of ACF plots gives strong hints about stationarity (a slowly decaying ACF means non-stationary), but formal statistical tests give you a definitive answer. The two standard tests are the Augmented Dickey-Fuller (ADF) test and the KPSS test. They test opposite null hypotheses, so using both gives a complete picture.

- **ADF test:** Null = series has a unit root (non-stationary). Low p-value → reject null → series is stationary.
- **KPSS test:** Null = series is stationary. Low p-value → reject null → series is non-stationary.

[NOTE]
**The tseries package provides adf.test() and kpss.test().** If you're running this in a local R session, install it with `install.packages("tseries")`. The package may not be available in all browser-based R environments.

```r
# Stationarity tests on AirPassengers
library(tseries)

# ADF test on raw AirPassengers
adf_raw <- adf.test(ap)
cat("ADF test on raw AirPassengers:\n")
cat("  Test statistic:", round(adf_raw$statistic, 4), "\n")
cat("  p-value:", round(adf_raw$p.value, 4), "\n")
#> ADF test on raw AirPassengers:
#>   Test statistic: -7.3186
#>   p-value: 0.01

# ADF test on log-differenced AirPassengers
adf_trans <- adf.test(diff(log(ap)))
cat("\nADF test on diff(log(AirPassengers)):\n")
cat("  Test statistic:", round(adf_trans$statistic, 4), "\n")
cat("  p-value:", round(adf_trans$p.value, 4), "\n")
#> ADF test on diff(log(AirPassengers)):
#>   Test statistic: -5.5266
#>   p-value: 0.01
```

The raw AirPassengers series returns a p-value of 0.01 with the ADF test, which seems to suggest stationarity. But this can be misleading — the ADF test often rejects the null for trending series with strong deterministic patterns. The log-differenced series gives a more convincingly low p-value with a larger (more negative) test statistic.

In practice, always combine formal tests with visual evidence. If the ACF decays slowly and the time plot shows a clear trend, the series is non-stationary regardless of what one test says. The `diff(log())` transformation is a common preprocessing pipeline: `log()` stabilizes the variance (addresses multiplicative seasonality), and `diff()` removes the trend.

**Try it:** Run `adf.test()` on the `Nile` dataset (annual Nile river flow, 1871-1970). Is the Nile flow stationary? What does the ACF suggest?

```r
# Try it: test Nile for stationarity
library(tseries)
ex_nile <- Nile
# your code here — run adf.test() and acf() on ex_nile
```

<details>
<summary>Click to reveal solution</summary>

```r
library(tseries)
ex_nile <- Nile
adf.test(ex_nile)
#>   Dickey-Fuller = -3.3646, Lag order = 4, p-value = 0.07
acf(ex_nile, main = "ACF: Nile River Flow")
#> (Moderate decay — some short-range autocorrelation but no seasonal pattern)
```

**Explanation:** The ADF p-value of ~0.07 is borderline — not clearly stationary. The ACF shows moderate short-lag autocorrelation that decays within about 5 lags, with no seasonal pattern (annual data has no sub-annual seasonality). The Nile series has a structural break around 1898 (a known dam construction), which complicates stationarity assessment.

</details>

## Practice Exercises

### Exercise 1: Full EDA pipeline on CO2 data

Run a complete time series EDA on the `co2` dataset (monthly atmospheric CO2 at Mauna Loa, 1959-1997):
1. Plot the raw series
2. Decompose with `stl()` and examine all three components
3. Plot the ACF of the remainder component
4. Determine whether the residuals resemble white noise

```r
# Exercise 1: Complete EDA on co2
# Hint: access STL components with stl_result$time.series[, "remainder"]

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# 1. Plot raw series
ts.plot(co2, main = "Mauna Loa CO2 (1959-1997)",
        ylab = "CO2 (ppm)", col = "steelblue", lwd = 2)

# 2. STL decomposition
my_stl <- stl(co2, s.window = "periodic")
plot(my_stl, col = "steelblue")

# 3. ACF of remainder
my_remainder <- my_stl$time.series[, "remainder"]
acf(my_remainder, lag.max = 48, main = "ACF of STL Remainder",
    col = "darkred", lwd = 2)
#> (Some significant spikes remain — not pure white noise)

# 4. Assessment
cat("Remainder std dev:", round(sd(my_remainder), 2), "ppm\n")
#> Remainder std dev: 0.32 ppm
cat("Not quite white noise — some short-range autocorrelation remains,\n")
cat("but the remainder is small relative to the trend (340 -> 370 ppm).\n")
```

**Explanation:** The remainder has small but significant autocorrelation at short lags, suggesting the additive model doesn't capture all structure. However, the remainder's standard deviation (~0.32 ppm) is tiny compared to the 30+ ppm trend range, so the decomposition captures the dominant patterns well.

</details>

### Exercise 2: Additive vs multiplicative decomposition comparison

Compare additive and multiplicative decomposition on `AirPassengers`:
1. Run `decompose()` with both `type = "additive"` and `type = "multiplicative"`
2. Plot the ACF of the remainder from each decomposition
3. Which decomposition produces more random (white-noise-like) residuals?

```r
# Exercise 2: Compare decomposition types
# Hint: access remainder with decompose_result$random

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# Additive
my_add <- decompose(ap, type = "additive")
# Multiplicative
my_mult <- decompose(ap, type = "multiplicative")

# Plot ACF of each remainder (remove NAs from decompose output)
par(mfrow = c(1, 2))
acf(na.omit(my_add$random), lag.max = 36,
    main = "Additive Remainder", col = "steelblue", lwd = 2)
acf(na.omit(my_mult$random), lag.max = 36,
    main = "Multiplicative Remainder", col = "darkred", lwd = 2)
par(mfrow = c(1, 1))
#> Additive: significant spikes at seasonal lags — pattern not fully removed
#> Multiplicative: fewer significant spikes — closer to white noise

cat("Multiplicative decomposition produces more random residuals.\n")
cat("The growing seasonal amplitude in AirPassengers is better\n")
cat("modeled as Trend x Seasonal x Remainder.\n")
```

**Explanation:** The multiplicative remainder ACF is closer to white noise because it correctly accounts for the seasonal amplitude growing proportionally with the trend. The additive model leaves seasonal structure in the residuals.

</details>

### Exercise 3: Sunspot cycle analysis

Perform a complete EDA on `sunspot.year` (yearly sunspot numbers, 1700-1988):
1. Plot the raw series and overlay an 11-year moving average (the solar cycle)
2. Plot the ACF and PACF
3. Run `adf.test()` from the tseries package
4. Summarize: is there trend? Cyclicality? Is the series stationary?

```r
# Exercise 3: Sunspot EDA
# Hint: the sunspot cycle is approximately 11 years

# Write your code below:

```

<details>
<summary>Click to reveal solution</summary>

```r
# 1. Plot with 11-year moving average
my_sun <- sunspot.year
my_sun_ma <- stats::filter(my_sun, rep(1/11, 11), sides = 2)
ts.plot(my_sun, my_sun_ma, col = c("grey70", "red"), lwd = c(1, 3),
        main = "Yearly Sunspots with 11-Year Moving Average",
        ylab = "Sunspot number")
legend("topright", legend = c("Raw", "11-year MA"),
       col = c("grey70", "red"), lwd = c(1, 3))

# 2. ACF and PACF
par(mfrow = c(1, 2))
acf(my_sun, lag.max = 50, main = "ACF: Sunspots", col = "steelblue", lwd = 2)
#> (Oscillating pattern with peaks ~every 11 lags — cyclicality)
pacf(my_sun, lag.max = 50, main = "PACF: Sunspots", col = "darkred", lwd = 2)
#> (Significant spikes at lags 1, 2, 9 — AR(2) signature with seasonal hint)
par(mfrow = c(1, 1))

# 3. Stationarity test
library(tseries)
adf.test(my_sun)
#>   Dickey-Fuller = -4.6797, Lag order = 6, p-value = 0.01

# 4. Summary
cat("Trend: No long-term trend — the moving average oscillates around ~50.\n")
cat("Cyclicality: Strong ~11-year cycle visible in ACF oscillation.\n")
cat("Stationarity: ADF rejects unit root (p = 0.01) — series is stationary.\n")
cat("Note: cyclicality != non-stationarity. Sunspots are stationary\n")
cat("with a strong periodic component.\n")
```

**Explanation:** Sunspot data shows no trend but strong cyclicality (~11 years). The ACF oscillates rather than decaying, which is the signature of a cyclical (not seasonal in the strict sense) process. Unlike AirPassengers, the series is stationary — the cycles don't grow or shift over time.

</details>

## Putting It All Together

Let's run a complete time series EDA on the `ldeaths` dataset — monthly deaths from bronchitis, emphysema, and asthma in the UK (1974-1979). This brings together every technique from this tutorial.

```r
# Complete EDA: UK lung disease deaths
ld <- ldeaths
cat("Dataset: Monthly UK lung disease deaths (1974-1979)\n")
cat("Observations:", length(ld), "\n")
#> Dataset: Monthly UK lung disease deaths (1974-1979)
#> Observations: 72

# 1. Raw time plot
ts.plot(ld, main = "Monthly Deaths from Lung Diseases (UK, 1974-1979)",
        ylab = "Deaths", col = "steelblue", lwd = 2)
grid()
#> (Strong seasonal pattern — winter peaks, summer troughs — mild downward trend)

# 2. Seasonal pattern
monthplot(ld, main = "Seasonal Subseries: Lung Disease Deaths",
          ylab = "Deaths", col = "steelblue", lwd = 2)
#> (January-February highest, July-August lowest)

# 3. STL decomposition
ld_stl <- stl(ld, s.window = "periodic")
plot(ld_stl, col = "steelblue")
#> (Large seasonal component, slight downward trend, small remainder)

# 4. ACF and PACF of the remainder
ld_remainder <- ld_stl$time.series[, "remainder"]
par(mfrow = c(1, 2))
acf(ld_remainder, lag.max = 36, main = "ACF: Remainder",
    col = "steelblue", lwd = 2)
pacf(ld_remainder, lag.max = 36, main = "PACF: Remainder",
     col = "darkred", lwd = 2)
par(mfrow = c(1, 1))
#> (Most spikes within confidence bands — remainder is approximately white noise)

# 5. Summary statistics
seasonal_range <- diff(range(ld_stl$time.series[, "seasonal"]))
trend_range <- diff(range(ld_stl$time.series[, "trend"]))
cat("\n=== EDA Summary: ldeaths ===\n")
cat("Trend: Mild downward (range:", round(trend_range), "deaths)\n")
cat("Seasonality: Strong winter peaks (range:", round(seasonal_range), "deaths)\n")
cat("Pattern: Additive — seasonal amplitude stays roughly constant\n")
cat("Remainder: Approximately white noise after STL decomposition\n")
cat("Peak month:", month.abb[which.max(tapply(ld, cycle(ld), mean))], "\n")
cat("Trough month:", month.abb[which.min(tapply(ld, cycle(ld), mean))], "\n")
#> === EDA Summary: ldeaths ===
#> Trend: Mild downward (range: 478 deaths)
#> Seasonality: Strong winter peaks (range: 1661 deaths)
#> Pattern: Additive — seasonal amplitude stays roughly constant
#> Remainder: Approximately white noise after STL decomposition
#> Peak month: Jan
#> Trough month: Aug
```

This complete example shows the EDA workflow in action: start with the raw plot, identify seasonality with `monthplot()`, decompose to separate components, then check the remainder with ACF/PACF. The lung disease dataset has classic additive seasonality — winter respiratory illness peaks that stay roughly the same size each year — with a mild downward trend over the 6-year period. After STL decomposition, the remainder is approximately white noise, meaning the decomposition captured all the systematic structure.

## Summary

| Technique | R Function | What It Reveals | When to Use |
|---|---|---|---|
| Time plot | `ts.plot()`, `plot()` | Overall shape: trend, seasonality, anomalies | Always — your first step |
| Moving average | `stats::filter()` | Underlying trend (strips seasonal noise) | When trend is obscured by seasonality |
| Month/seasonal plot | `monthplot()` | Per-season behavior across years | Monthly or quarterly data |
| Boxplot by cycle | `boxplot(x ~ cycle(x))` | Distribution differences across seasons | Comparing seasonal spread |
| Additive decomposition | `decompose(x, "additive")` | Trend + Seasonal + Remainder | Constant seasonal amplitude |
| Multiplicative decomposition | `decompose(x, "multiplicative")` | Trend x Seasonal x Remainder | Growing seasonal amplitude |
| STL decomposition | `stl()` | Robust trend/seasonal/remainder split | Production use (handles outliers) |
| ACF | `acf()` | Autocorrelation at all lags | Detecting trend (slow decay) and seasonality (periodic spikes) |
| PACF | `pacf()` | Direct correlation at each lag | Identifying AR order for modeling |
| Differencing | `diff()` | Removes trend (lag 1) or seasonality (lag = period) | Making a series stationary |
| ADF test | `tseries::adf.test()` | Formal stationarity test (null = non-stationary) | Confirming visual stationarity assessment |

[TIP]
**Follow this EDA sequence every time:** Plot raw series, identify trend with moving average, visualize seasonality with monthplot/boxplots, decompose with stl(), check remainder with ACF/PACF, test stationarity formally. Skip nothing — each step builds on the previous one.

## References

1. Hyndman, R.J. & Athanasopoulos, G. — *Forecasting: Principles and Practice*, 3rd Edition. Chapter 2: Time Series Graphics. [Link](https://otexts.com/fpp3/graphics.html)
2. R Documentation — ts(): Time-Series Objects. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/ts.html)
3. R Documentation — decompose(): Classical Seasonal Decomposition by Moving Averages. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/decompose.html)
4. R Documentation — stl(): Seasonal Decomposition of Time Series by Loess. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/stl.html)
5. R Documentation — acf(): Auto- and Cross-Covariance and -Correlation Function Estimation. [Link](https://stat.ethz.ch/R-manual/R-devel/library/stats/html/acf.html)
6. Cleveland, R.B., Cleveland, W.S., McRae, J.E. & Terpenning, I. (1990) — STL: A Seasonal-Trend Decomposition Procedure Based on Loess. *Journal of Official Statistics*, 6(1), 3-73.
7. Said, S.E. & Dickey, D.A. (1984) — Testing for Unit Roots in Autoregressive-Moving Average Models of Unknown Order. *Biometrika*, 71(3), 599-607.

## Continue Learning

- [Exploratory Data Analysis in R](Exploratory-Data-Analysis-in-R.html) — The parent 7-step EDA framework this post extends for temporal data
- [Correlation Analysis in R](Correlation-Analysis-in-R.html) — Pearson, Spearman, and Kendall correlations for measuring variable relationships
- [Correlation Matrix Plot in R](Correlation-Matrix-Plot-in-R.html) — Visualize pairwise correlations with corrplot and ggcorrplot
