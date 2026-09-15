---
title: "Time Series Regression in R: An Interactive Course"
slug: "Time-Series-Regression-Course"
description: "Learn time series regression in R across six interactive lessons: TSLM(), trend and seasonal dummies, Fourier terms, useful predictors, predictor selection, and spurious regression."
keywords: "time series regression in R, TSLM, trend and seasonal dummy variables, Fourier terms seasonality, lagged predictors forecasting, predictor selection AICc, spurious regression time series"
mathjax: false
webr: false
date: "2026-09-11"
curriculum_id: "5.40.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Time Series Regression (Course)"
sidebar_order: "71"
---

# Time Series Regression in R: A Hands-On Interactive Course

<p class="lead">Every time series can be explained the way you would explain any outcome: with a regression. This six-lesson interactive course takes the ordinary linear model you already know and shows exactly which of TSLM()'s extra tools, and dangers, show up once the predictor is time itself.</p>

TSLM() looks like lm() and fits the same way, but it understands `trend()` and `season()` as time-aware predictors, forecasts forward with `new_data()`, and inherits two assumptions, independent errors and a stable relationship, that time series breaks more often than not. This course works through the regression toolkit end to end: fitting and reading a trend line, building seasonal predictors two different ways, adding lags and calendar effects, selecting predictors honestly, and catching the classic trap of spurious regression before it costs you a real forecast.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The six lessons

### Lesson 1: Fitting a trend line with TSLM

Fit an ordinary regression line to 48 months of a SaaS company's user growth with TSLM(), read what the slope and intercept mean, forecast ahead with `new_data()`, and see the two assumptions ordinary regression borrows and time series breaks.

[Start Lesson 1: Fitting a trend line with TSLM](Time-Series-Linear-Models-TSLM.html)

### Lesson 2: Trend and seasonal dummy variables

Add `season()` alongside `trend()` in `TSLM(y ~ trend() + season())`, avoid the dummy variable trap, fit a piecewise linear trend with knots, read seasonal coefficients against a baseline period, and see why a linear trend is a dangerous tool to extrapolate far beyond the data.

Lesson 2 is coming soon.

### Lesson 3: Fourier terms for seasonality

Replace a long run of seasonal dummies with a compact sine and cosine basis. Use `fourier(K = )` inside TSLM, choose K by AICc, and see why Fourier terms beat dummies once a series has a long or multiple seasonal period.

Lesson 3 is coming soon.

### Lesson 4: Useful predictors: lags, calendar and holidays

Add lagged predictors, and learn why the lag has to be known at forecast time. Build calendar, holiday and intervention dummies, and separate an ex-ante forecast from an ex-post one when a predictor's own future path is only a scenario.

Lesson 4 is coming soon.

### Lesson 5: Selecting predictors with cross-validation

Compare adjusted R-squared, AICc and BIC as selection criteria, see why a predictor's p-value is the wrong tool for choosing it, and use cross-validated error as the honest test. Walk through best-subset versus stepwise selection, and the leakage trap of selecting a model on the same window you test it on.

Lesson 5 is coming soon.

### Lesson 6: Spurious regression and how to avoid it

Regress two completely unrelated trending series against each other and watch r climb near 0.97. See why non-stationary regressors produce huge t-statistics and an autocorrelated residual ACF, use that residual ACF as the alarm, and learn the three cures: difference the data, model the errors directly, or move to dynamic regression.

Lesson 6 is coming soon.

## Who this is for

Anyone who has already worked through Time Series Foundations and is comfortable holding a `tsibble` and reading a series' trend and season by eye. You do not need any prior regression modeling experience beyond `lm()`. By the end you will be able to fit and read a TSLM() model end to end, build seasonal predictors two different ways, add lags and calendar effects correctly, select predictors without leaking the test window, and recognize spurious regression before it reaches a client.

## What you will be able to do

- Fit `TSLM(y ~ trend())` and read the slope, intercept and forecast it implies
- Build seasonal predictors with dummy variables and with Fourier terms, and choose between them
- Add lagged, calendar and holiday predictors without breaking the forecast horizon
- Tell an ex-ante forecast from an ex-post one when a predictor's future is a scenario
- Select predictors with AICc, BIC and cross-validated error instead of p-values
- Spot spurious regression from a high r and an autocorrelated residual ACF, and fix it

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Fitting a trend line with TSLM](Time-Series-Linear-Models-TSLM.html).
