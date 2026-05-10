---
title: "ARIMA Exercises in R: 25 Practice Problems"
slug: "ARIMA-Exercises-in-R"
description: "Master ARIMA in R with 25 practice problems: identification, fitting, seasonal ARIMA, diagnostics, forecasting. Hidden solutions."
keywords: "ARIMA exercises in R, ARIMA R practice, auto.arima exercises, R forecasting practice, seasonal ARIMA exercises"
mathjax: false
webr: true
date: "2026-05-11"
post_type: "EX"
sidebar_title: "ARIMA Exercises"
sidebar_order: 132
fr_parent: "Time-Series-Analysis.html"
auto_link_terms: "ARIMA exercises in R|ARIMA R practice|auto.arima exercises|R forecasting practice"
auto_link_case_sensitive: false
target_keyword: "ARIMA exercises in R"
sibling_block_enabled: false
difficulty: "Advanced"
---

# ARIMA Exercises in R: 25 Practice Problems

<p class="lead">Twenty-five practice problems on ARIMA: identification (ACF/PACF), differencing, fitting, seasonal ARIMA, diagnostics, forecasts. Hidden solutions.</p>

```r title="Run this once before any exercise"
library(forecast)
library(tseries)
```

### Exercise 1: ACF

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
acf(AirPassengers)
```

</details>

### Exercise 2: PACF

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
pacf(AirPassengers)
```

</details>

### Exercise 3: ADF test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
adf.test(AirPassengers)
```

</details>

### Exercise 4: KPSS test

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
kpss.test(AirPassengers)
```

</details>

### Exercise 5: ndiffs

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
ndiffs(AirPassengers)
```

</details>

### Exercise 6: nsdiffs (seasonal)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
nsdiffs(AirPassengers)
```

</details>

### Exercise 7: First difference

**Difficulty:** Beginner.

<details><summary>Show solution</summary>

```r
diff(AirPassengers)
```

</details>

### Exercise 8: Seasonal difference

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
diff(AirPassengers, lag = 12)
```

</details>

### Exercise 9: Combined differencing

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
diff(diff(AirPassengers, lag = 12))
```

</details>

### Exercise 10: arima(p,d,q)

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
arima(AirPassengers, order = c(1, 1, 1))
```

</details>

### Exercise 11: SARIMA

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
arima(AirPassengers, order = c(0,1,1), seasonal = list(order = c(0,1,1), period = 12))
```

</details>

### Exercise 12: auto.arima

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
auto.arima(AirPassengers)
```

</details>

### Exercise 13: stepwise=FALSE for thorough search

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
auto.arima(AirPassengers, stepwise = FALSE, approximation = FALSE)
```

</details>

### Exercise 14: Forecast 24 periods

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
forecast(fit, h = 24)
```

</details>

### Exercise 15: Plot forecast

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
autoplot(forecast(fit, h = 24))
```

</details>

### Exercise 16: 80% and 95% prediction intervals

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
forecast(fit, h = 12, level = c(80, 95))
```

</details>

### Exercise 17: Residual diagnostics

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
checkresiduals(fit)
```

</details>

### Exercise 18: Ljung-Box test

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- auto.arima(AirPassengers)
Box.test(residuals(fit), lag = 24, type = "Ljung-Box")
```

</details>

### Exercise 19: AIC compare two ARIMAs

**Difficulty:** Intermediate.

<details><summary>Show solution</summary>

```r
f1 <- arima(AirPassengers, order = c(1,1,1))
f2 <- arima(AirPassengers, order = c(2,1,2))
c(AIC(f1), AIC(f2))
```

</details>

### Exercise 20: Train-test eval

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tr <- window(AirPassengers, end = c(1958,12))
te <- window(AirPassengers, start = c(1959,1))
fc <- forecast(auto.arima(tr), h = length(te))
accuracy(fc, te)
```

</details>

### Exercise 21: tsCV rolling origin

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
e <- tsCV(AirPassengers,
          forecastfunction = function(x, h) forecast(auto.arima(x), h = h),
          h = 1)
sqrt(mean(e^2, na.rm = TRUE))
```

</details>

### Exercise 22: Log transform before ARIMA

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
log_ap <- log(AirPassengers)
fit <- auto.arima(log_ap)
fc <- forecast(fit, h = 12)
exp(fc$mean)
```

</details>

### Exercise 23: ARIMA with regressor (xreg)

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
y <- AirPassengers
trend <- 1:length(y)
fit <- auto.arima(y, xreg = trend)
forecast(fit, h = 12, xreg = (length(y)+1):(length(y)+12))
```

</details>

### Exercise 24: Compare ARIMA vs ETS

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
tr <- window(AirPassengers, end = c(1958,12))
te <- window(AirPassengers, start = c(1959,1))
f1 <- forecast(auto.arima(tr), h = length(te))
f2 <- forecast(ets(tr), h = length(te))
list(arima = accuracy(f1, te)[2,"RMSE"],
     ets   = accuracy(f2, te)[2,"RMSE"])
```

</details>

### Exercise 25: ARIMA from differenced fit interpretation

**Difficulty:** Advanced.

<details><summary>Show solution</summary>

```r
fit <- arima(AirPassengers, order = c(0,1,1), seasonal = c(0,1,1))
coef(fit)   # MA(1) and seasonal MA(1) coefficients
```

</details>

## What to do next

- **Time-Series-Exercises** (shipped) — broader time series.
- **Linear-Regression-Exercises** (shipped) — regression on time features.
