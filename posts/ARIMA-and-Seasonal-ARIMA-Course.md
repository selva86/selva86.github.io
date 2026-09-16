---
title: "ARIMA and Seasonal ARIMA in R: An Interactive Course"
slug: "ARIMA-and-Seasonal-ARIMA-Course"
description: "Learn ARIMA and seasonal ARIMA in R across seven interactive lessons: stationarity and unit-root tests, differencing, reading the ACF and PACF, non-seasonal and seasonal ARIMA, ARIMA versus ETS, and automatic model selection."
keywords: "ARIMA in R, seasonal ARIMA, SARIMA in R, unit root test, KPSS test, ACF and PACF, auto ARIMA selection, ARIMA vs ETS, fable ARIMA"
mathjax: false
webr: false
date: "2026-09-16"
curriculum_id: "5.60.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "ARIMA and Seasonal ARIMA (Course)"
sidebar_order: "73"
---

# ARIMA and Seasonal ARIMA in R: A Hands-On Interactive Course

<p class="lead">ARIMA builds a forecast out of three simple ingredients: how much differencing a series needs to sit still, how many of its own past values to lean on, and how many past errors to correct for. This seven-lesson interactive course takes those ingredients one at a time, from testing whether a series is stationary at all to letting R search the whole model space for you.</p>

Before you can fit an ARIMA model you have to earn the right to: check that the series is stationary, difference it if it is not, and read its ACF and PACF closely enough to guess a starting order. Only then do the non-seasonal and seasonal ARIMA notations start to make sense, and only once you can fit them by hand does the automatic search in `ARIMA()` become something you can check rather than just trust.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The seven lessons

### Lesson 1: Stationarity and unit-root tests

See what it means for a series to be stationary, in the three properties that have to hold still: mean, variance and autocorrelation structure. Test AirPassengers with the KPSS test via `features(y, unitroot_kpss)`, read its statistic against the critical value, and let `unitroot_ndiffs()` tell you how many differences a series actually needs.

[Start Lesson 1: Stationarity and unit-root tests](Stationarity-and-Unit-Root-Tests-KPSS.html)

### Lesson 2: Differencing and seasonal differencing

Take a first difference to remove a trend and a seasonal difference at lag 12 to remove a repeating pattern, in the order that usually works: seasonal first. Check the result with a plot and the ACF, see what over-differencing costs you, and undo a differenced forecast back to the original scale.

[Start Lesson 2: Differencing and seasonal differencing](Differencing-and-Seasonal-Differencing.html)

### Lesson 3: Reading the ACF and PACF

Learn to read the partial autocorrelation as what is left over once the intermediate lags are accounted for, then use that to tell an AR(p) signature (PACF cuts off, ACF decays) from an MA(q) signature (ACF cuts off, PACF decays) with `gg_tsdisplay(plot_type = "partial")` on real series.

[Start Lesson 3: Reading the ACF and PACF](Reading-the-ACF-and-PACF.html)

### Lesson 4: Non-seasonal ARIMA models

Meet the ARIMA(p, d, q) notation and what the AR and MA terms each remember about the past. Fit `ARIMA(y ~ pdq(p, d, q))` in `fable`, read the coefficients it returns, and see what the constant term does to a forecast's long-run drift.

[Start Lesson 4: Non-seasonal ARIMA models](Non-Seasonal-ARIMA-Models.html)

### Lesson 5: Seasonal ARIMA

Add the seasonal (P, D, Q)[m] part and see how it multiplies against the non-seasonal terms. Fit `ARIMA(y ~ pdq() + PDQ())` on a monthly retail series, spot the seasonal signature in the ACF at lags m, 2m and 3m, and forecast with the fitted SARIMA model.

[Start Lesson 5: Seasonal ARIMA](Seasonal-ARIMA-SARIMA.html)

### Lesson 6: ARIMA versus ETS, when to use each

Put the two forecasting families side by side: which ETS models have an ARIMA twin, which do not, and why AICc cannot referee across them. Settle the argument with time-series cross-validation on the same series, and come away with practical rules of thumb for choosing.

[Start Lesson 6: ARIMA versus ETS, when to use each](ARIMA-vs-ETS-When-to-Use-Each.html)

### Lesson 7: Automatic and manual ARIMA selection

See exactly what `ARIMA()` does with no formula: unit-root tests decide d, then a stepwise search over p and q ranks candidates by AICc. Turn off `stepwise` and `approximation` for a fuller search, know when to override the automatic choice by hand, and run the residual checks that come before trusting any order.

[Start Lesson 7: Automatic and manual ARIMA selection](Automatic-and-Manual-ARIMA-Selection.html)

## Who this is for

Anyone who has already worked through Time Series Foundations, or is otherwise comfortable holding a `tsibble` and reading a series' trend and season by eye. You do not need any prior ARIMA experience. By the end you will be able to test a series for stationarity, difference it correctly, read its ACF and PACF, fit non-seasonal and seasonal ARIMA models by hand, choose between ARIMA and ETS with evidence instead of a guess, and run `ARIMA()`'s automatic search with a checklist for when to trust it.

## What you will be able to do

- Test whether a series is stationary with the KPSS test and know how many differences it needs
- Difference a series for trend and season, in the order that actually works, without over-differencing it
- Read the ACF and PACF well enough to tell an AR signature from an MA signature
- Fit a non-seasonal ARIMA(p, d, q) model in `fable` and read its coefficients
- Fit a seasonal ARIMA with the (P, D, Q)[m] part and forecast a monthly series with it
- Choose between ARIMA and ETS with cross-validation instead of guessing
- Let `ARIMA()` search automatically, know when to search harder, and check residuals before trusting the result

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Stationarity and unit-root tests](Stationarity-and-Unit-Root-Tests-KPSS.html).
