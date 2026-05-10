---
title: "Time Series Exercises in R: 40 Practice Problems"
slug: "Time-Series-Exercises-in-R"
description: "Master time series in R with 40 practice problems: ts objects, decomposition, ACF/PACF, ARIMA, ETS, forecasting. Hidden solutions, runnable code."
keywords: "time series exercises in R, time series practice R, R time series problems, ts() exercises R, forecasting R exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "Time Series Exercises"
sidebar_order: 119
fr_parent: "Time-Series-Analysis.html"
auto_link_terms: "time series exercises|time series practice|R time series problems|forecasting R exercises"
auto_link_case_sensitive: false
target_keyword: "time series exercises in R"
sibling_block_enabled: false
difficulty: "Intermediate"
---

# Time Series Exercises in R: 40 Practice Problems

<p class="lead">Forty practice problems on time series in R: ts objects, decomposition, stationarity, autocorrelation, ARIMA, ETS, forecasting. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(forecast)
library(tseries)
library(dplyr)
library(tibble)
```

## Section 1. ts objects and basics (8 problems)

### Exercise 1.1: Create a ts

**Difficulty:** Beginner. Monthly series starting Jan 2020.

<details><summary>Show solution</summary>

```r
ts(rnorm(24), frequency = 12, start = c(2020, 1))
```

</details>

### Exercise 1.2: Plot ts

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
plot(AirPassengers)
```

</details>

### Exercise 1.3: Frequency

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
frequency(AirPassengers)
```

</details>

### Exercise 1.4: Window subset

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
window(AirPassengers, start = c(1955,1), end = c(1957,12))
```

</details>

### Exercise 1.5: Aggregate to yearly

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
aggregate(AirPassengers, FUN = sum)
```

</details>

### Exercise 1.6: Lag

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
lag(AirPassengers, k = -1)
```

</details>

### Exercise 1.7: Difference

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
diff(AirPassengers)
```

</details>

### Exercise 1.8: Seasonal lag-12 difference

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diff(AirPassengers, lag = 12)
```

</details>

## Section 2. Decomposition (6 problems)

### Exercise 2.1: Classical decomposition

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot(decompose(AirPassengers))
```

</details>

### Exercise 2.2: Multiplicative decomposition

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
plot(decompose(AirPassengers, type = "multiplicative"))
```

</details>

### Exercise 2.3: STL decomposition

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
plot(stl(AirPassengers, s.window = "periodic"))
```

</details>

### Exercise 2.4: Extract trend

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
decompose(AirPassengers)$trend
```

</details>

### Exercise 2.5: Seasonally adjusted

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
d <- decompose(AirPassengers)
AirPassengers - d$seasonal
```

</details>

### Exercise 2.6: Strength of seasonality

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
mstl(AirPassengers) |> head()
```

</details>

## Section 3. Stationarity and autocorrelation (6 problems)

### Exercise 3.1: ACF plot

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
acf(AirPassengers)
```

</details>

### Exercise 3.2: PACF plot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
pacf(AirPassengers)
```

</details>

### Exercise 3.3: ADF test for stationarity

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
adf.test(AirPassengers)
```

</details>

### Exercise 3.4: KPSS test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
kpss.test(AirPassengers)
```

</details>

### Exercise 3.5: Difference until stationary

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
ndiffs(AirPassengers)
```

</details>

### Exercise 3.6: Seasonal differences needed

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
nsdiffs(AirPassengers)
```

</details>

## Section 4. ARIMA (8 problems)

### Exercise 4.1: Auto ARIMA

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
fit
```

</details>

### Exercise 4.2: Specific ARIMA(p,d,q)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
arima(AirPassengers, order = c(1, 1, 1))
```

</details>

### Exercise 4.3: Seasonal ARIMA

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
arima(AirPassengers, order = c(1,1,1), seasonal = c(1,1,1))
```

</details>

### Exercise 4.4: Forecast horizon

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
forecast(fit, h = 24)
```

</details>

### Exercise 4.5: Plot forecast

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
plot(forecast(fit, h = 24))
```

</details>

### Exercise 4.6: Residual diagnostics

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
checkresiduals(fit)
```

</details>

### Exercise 4.7: Ljung-Box test

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
Box.test(residuals(fit), lag = 12, type = "Ljung-Box")
```

</details>

### Exercise 4.8: AIC comparison

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
f1 <- arima(AirPassengers, order = c(1,1,1))
f2 <- arima(AirPassengers, order = c(2,1,2))
c(AIC(f1), AIC(f2))
```

</details>

## Section 5. ETS and others (6 problems)

### Exercise 5.1: Auto ETS

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ets(AirPassengers)
```

</details>

### Exercise 5.2: Specific ETS

**Difficulty:** Advanced. Holt-Winters multiplicative.

<details><summary>Show solution</summary>

```r
ets(AirPassengers, model = "MAM")
```

</details>

### Exercise 5.3: Holt-Winters

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
HoltWinters(AirPassengers)
```

</details>

### Exercise 5.4: Naive forecast

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
naive(AirPassengers, h = 12) |> autoplot()
```

</details>

### Exercise 5.5: Seasonal naive

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
snaive(AirPassengers, h = 12)
```

</details>

### Exercise 5.6: Mean forecast

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
meanf(AirPassengers, h = 12)
```

</details>

## Section 6. Train-test and accuracy (6 problems)

### Exercise 6.1: Train-test split

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
list(train = length(train), test = length(test))
```

</details>

### Exercise 6.2: Forecast accuracy

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
fit <- auto.arima(train)
fc  <- forecast(fit, h = length(test))
accuracy(fc, test)
```

</details>

### Exercise 6.3: Compare ARIMA vs ETS

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
f1 <- forecast(auto.arima(train), h = length(test))
f2 <- forecast(ets(train), h = length(test))
list(arima = accuracy(f1, test)[2,"RMSE"],
     ets   = accuracy(f2, test)[2,"RMSE"])
```

</details>

### Exercise 6.4: Cross-validation rolling origin

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
e <- tsCV(AirPassengers, forecastfunction = function(x, h) forecast(auto.arima(x), h = h), h = 1)
sqrt(mean(e^2, na.rm = TRUE))
```

</details>

### Exercise 6.5: MAPE

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
train <- window(AirPassengers, end = c(1958, 12))
test  <- window(AirPassengers, start = c(1959, 1))
fc <- forecast(auto.arima(train), h = length(test))
accuracy(fc, test)[, "MAPE"]
```

</details>

### Exercise 6.6: Out-of-sample forecast plot

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
autoplot(forecast(fit, h = 36))
```

</details>

## What to do next

- **ARIMA-Exercises** (coming) — focused ARIMA drilling.
- **Linear-Regression-Exercises** (shipped) — regression on time-features.
