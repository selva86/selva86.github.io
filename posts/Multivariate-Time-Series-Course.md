---
title: "Multivariate Time Series in R: An Interactive Course"
slug: "Multivariate-Time-Series-Course"
description: "Learn multivariate time series in R across six interactive lessons: fitting a vector autoregression, choosing the lag order, Granger causality, impulse response functions, cointegration and the VECM, and forecasting related series together."
keywords: "multivariate time series in R, vector autoregression, VAR model in R, vars package, lag order selection, Granger causality, impulse response function, cointegration, VECM, Johansen test"
mathjax: false
webr: false
date: "2026-09-26"
curriculum_id: "5.110.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Multivariate Time Series (Course)"
sidebar_order: "78"
---

# Multivariate Time Series in R: A Hands-On Interactive Course

<p class="lead">Employment and unemployment do not move on their own. What happened to one last quarter can help predict what the other does next, and a forecast built on each series alone never gets to use that. This six-lesson interactive course fits one model to several related series at once, the vector autoregression, and then adds the tools around it: choosing its size, testing what it says, tracing a shock through it, and forecasting from it.</p>

The first lesson starts with 84 quarters of Canadian employment and unemployment. You fit an AR(2) to each series alone, then a VAR(2) that lets both series see the past of both, read the coefficient block, and check the result against a rolling forecast. The answer is not the same for the two series, and seeing why is the point of the lesson. From there the course settles how many lags the system should look back, asks which series helps forecast which, follows a single shock through the system, and handles series that wander but stay tied together.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one dataset per idea. No setup, no installs.

## The six lessons

### Lesson 1: Fitting a vector autoregression (VAR) to two related series

See what an AR(2) leaves out: the lags of the other series. Fit a VAR(2) to Canadian employment and unemployment, read the coefficient block by separating own-lag from cross-lag coefficients, rebuild a forecast from the coefficients by hand, and compare rolling forecasts against one AR(2) per series.

[Start Lesson 1: Fitting a vector autoregression (VAR) to two related series](Vector-Autoregression-VAR.html)

### Lesson 2: Choosing the lag order

Settle how far back the system should look. Read the four information criteria that `VARselect()` reports and see why they disagree, see what too few lags leaves behind in the residuals and what too many costs in parameters, and confirm the choice with a serial correlation test on the fitted residuals.

Lesson 2 is coming soon.

### Lesson 3: Granger causality

Learn what Granger causality claims and what it does not. It is about forecast improvement, not mechanism. Run the test in both directions, find the case where one series helps predict the other but not the reverse, and see a confounded example where the test fires and the causal story is still wrong.

Lesson 3 is coming soon.

### Lesson 4: Impulse response functions

Push one variable by one shock and trace what the system does over the following quarters. Compute impulse responses with bootstrap bands, read a response that overshoots and then settles, and see why the ordering of the variables changes the answer and what that means for reporting the result honestly.

Lesson 4 is coming soon.

### Lesson 5: Cointegration and the VECM

Two series that each wander can still be tied together by a stable relationship. See spurious regression fail on unrelated series, count the cointegrating relationships with the Johansen trace test using `ca.jo()`, and read the speed-of-adjustment coefficient from `cajorls()` as how fast the system pulls back to equilibrium.

Lesson 5 is coming soon.

### Lesson 6: Forecasting multiple related series

Turn the fitted system into forecasts. Move from the VECM to a forecastable form with `vec2var()`, get paths and intervals from `predict()`, and compare the system forecast against forecasting each series on its own, so you can tell when the extra machinery pays and when it does not.

Lesson 6 is coming soon.

## Who this is for

Anyone comfortable fitting an AR model in R and reading a regression table, for example from the ARIMA and Seasonal ARIMA course. You do not need any economics background: every idea is introduced on a small real or simulated data set. By the end you will be able to fit a VAR and read its coefficients, choose its lag order, test what each series adds to the others, trace a shock through the system, and forecast from it.

## What you will be able to do

- Say what an AR model leaves out, and why the past of another series can improve a forecast
- Read a fitted VAR coefficient block, telling own-lag from cross-lag coefficients
- Choose a lag order with information criteria and a residual test, and explain why the criteria can disagree
- Run and interpret a Granger causality test in both directions, without reading it as proof of mechanism
- Compute and read impulse responses, and report how much the variable ordering matters
- Test for cointegration, fit a VECM, and forecast a system of related series against the one-series-at-a-time alternative

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Fitting a vector autoregression (VAR) to two related series](Vector-Autoregression-VAR.html).
