---
title: "Dynamic Regression and Complex Seasonality in R: An Interactive Course"
slug: "Dynamic-Regression-and-Complex-Seasonality-Course"
description: "Learn dynamic regression and complex seasonality in R across six interactive lessons: regression with ARIMA errors, dynamic harmonic regression, multiple seasonal periods, TBATS, Prophet, and lagged predictors with transfer functions."
keywords: "dynamic regression in R, regression with ARIMA errors, dynamic harmonic regression, Fourier terms forecasting, multiple seasonal periods, TBATS model, Prophet forecasting, transfer function model, fable ARIMA regression"
mathjax: false
webr: false
date: "2026-09-16"
curriculum_id: "5.70.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Dynamic Regression and Complex Seasonality (Course)"
sidebar_order: "74"
---

# Dynamic Regression and Complex Seasonality in R: A Hands-On Interactive Course

<p class="lead">Ordinary regression assumes its leftover error is independent noise, and on a time series that assumption almost never holds. This six-lesson interactive course starts from that one broken assumption and builds outward, modeling the error itself, then reaching for Fourier terms, TBATS, Prophet and transfer functions as the seasonality or the predictor gets more complicated.</p>

A plain regression against a time-varying predictor almost always leaves autocorrelated residuals behind, and once you can see why, fitting an ARIMA error process becomes the obvious next step rather than a black box. From there the course keeps stretching the same idea: Fourier terms instead of seasonal ARIMA when the period is too long, two seasonal periods inside one series, TBATS when the seasonality itself needs fitting, Prophet as an alternative worth judging honestly, and lagged predictors for when today's outcome depends on last month's input.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The six lessons

### Lesson 1: Regression with ARIMA errors

See why ordinary regression residuals on a time series are autocorrelated, fit `ARIMA(y ~ x + pdq())` in `fable` as regression with an ARIMA error process, read the two halves of the report, and forecast with real prediction intervals using future values of the predictor.

[Start Lesson 1: Regression with ARIMA errors](Regression-with-ARIMA-Errors.html)

### Lesson 2: Dynamic harmonic regression

Replace seasonal ARIMA with Fourier terms for the seasonal shape plus an ARIMA error for the short-run dynamics, choose K by AICc, and see why this handles long seasonal periods that seasonal ARIMA cannot reach.

Lesson 2 is coming soon.

### Lesson 3: Multiple seasonal periods

Work with a series that carries a daily cycle and a weekly cycle at once, see both in the plots and the ACF, add Fourier terms for two periods in the same model, and read which cycle actually carries the variance.

Lesson 3 is coming soon.

### Lesson 4: TBATS for complex seasonality

Meet what the letters in TBATS stand for, trigonometric terms, Box-Cox transform, ARMA errors, trend and seasonal components, fit `tbats()` from the forecast package on a series with two periods, and weigh its fitting cost against dynamic harmonic regression.

Lesson 4 is coming soon.

### Lesson 5: Forecasting with Prophet

Learn the additive trend, seasonality and holiday components behind Prophet, how changepoints and their prior are specified, and an honest comparison against a Fourier-plus-piecewise-trend model in `fable`, the runnable stand-in for where Prophet itself is not run in the browser.

Lesson 5 is coming soon.

### Lesson 6: Lagged predictors and transfer functions

Handle a predictor whose effect lingers, like advertising that keeps moving sales for months, with distributed lag terms inside `ARIMA()`, choose the lag length by AICc, and forecast when the predictor itself has to be forecast first.

Lesson 6 is coming soon.

## Who this is for

Anyone who has already worked through ARIMA and Seasonal ARIMA, or is otherwise comfortable fitting an `ARIMA(p, d, q)` model in `fable` and reading its residual diagnostics. You do not need any prior experience with regression errors or complex seasonality. By the end you will be able to fit a regression with ARIMA errors, build dynamic harmonic regressions for long or multiple seasonal periods, fit TBATS and judge Prophet against a `fable` alternative, and forecast with lagged predictors and transfer functions.

## What you will be able to do

- Fit a regression with ARIMA errors and know why plain regression residuals on a time series are usually autocorrelated
- Build a dynamic harmonic regression with Fourier terms, and choose the number of terms K by AICc
- Model two seasonal periods in the same series and read which one carries the variance
- Fit TBATS for seasonality that changes over time or repeats at more than one period
- Judge Prophet's trend, seasonality and holiday components against a comparable `fable` model
- Add lagged predictors and transfer functions to a regression, and forecast when the predictor must be forecast first

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Regression with ARIMA errors](Regression-with-ARIMA-Errors.html).
