---
title: "Forecasting Toolbox in R: An Interactive Course"
slug: "Forecasting-Toolbox-Course"
description: "Learn the forecasting toolbox in R across six interactive lessons: fitted values and residuals, the Ljung-Box test, prediction intervals, point versus distributional forecasts, rolling-origin cross-validation, and accuracy metrics like MASE and pinball loss."
keywords: "forecasting toolbox R, residual diagnostics fable, Ljung-Box test R, prediction intervals hilo, rolling origin cross validation, MASE RMSSE pinball loss, forecast accuracy R"
mathjax: false
webr: false
date: "2026-09-10"
curriculum_id: "5.30.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Forecasting Toolbox (Course)"
sidebar_order: "70"
---

# Forecasting Toolbox in R: A Hands-On Interactive Course

<p class="lead">A model's fitted line can sit almost exactly on top of the real data and still tell you nothing about whether it can forecast. This six-lesson interactive course teaches you to check the things that actually matter, one real dataset at a time.</p>

Every model in this track, whether it is a benchmark, ETS or ARIMA, hands back fitted values and residuals that need the same checks, and a forecast that is really a distribution needing the same interval and accuracy tools. This course builds that shared toolbox once: what `augment()` actually reports and why a fitted value is not a forecast, the residual diagnostics that decide whether a model is trustworthy, prediction intervals that do not collapse a distribution to one number, rolling-origin cross-validation for a fair comparison, and the accuracy metrics, MASE, RMSSE and pinball loss, that fit the decision rather than habit.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The six lessons

### Lesson 1: Fitted values, residuals and innovations

See what `augment()` adds to a fitted fable model: the fitted values and residual columns it hands back the moment a model is fit. Learn why a one-step fitted value is not the same thing as a real forecast, and which of the two residual columns, innovation or response, to trust for diagnostics.

[Start Lesson 1: Fitted values, residuals and innovations](Fitted-Values-Residuals-and-Innovations.html)

### Lesson 2: Residual diagnostics and the Ljung-Box test

Run `gg_tsresiduals()` and check a residual series against the four properties a healthy one should have: uncorrelated, zero mean, constant variance, roughly normal. Compute the Ljung-Box statistic, read its degrees of freedom, and see what to do when a model fails the check.

[Start Lesson 2: Residual diagnostics and the Ljung-Box test](Residual-Diagnostics-and-the-Ljung-Box-Test.html)

### Lesson 3: Forecast distributions and prediction intervals

Treat a forecast as a distribution rather than a single number. Build 80 and 95 percent intervals with `hilo()`, see the sigma-h formulas behind the benchmark methods, bootstrap intervals when residuals are not normal, and see why intervals widen with the horizon.

[Start Lesson 3: Forecast distributions and prediction intervals](Forecast-Distributions-and-Prediction-Intervals.html)

### Lesson 4: Point forecasts versus the whole distribution

Compare mean, median and quantile point forecasts and see when they disagree. Work through decisions, like stock levels and staffing, that actually need a quantile rather than a single number, read a fan chart, and see the cost of collapsing a distribution to one number.

[Start Lesson 4: Point forecasts versus the whole distribution](Point-Forecasts-vs-the-Whole-Distribution.html)

### Lesson 5: Time series cross-validation with rolling origins

Build rolling origins with `stretch_tsibble(.init, .step)`, forecast h steps ahead from each one, and score every origin with `accuracy()`. Compare methods fairly on the same folds, and see how cross-validation error differs from a single train/test split.

[Start Lesson 5: Time series cross-validation with rolling origins](Time-Series-Cross-Validation-Rolling-Origin.html)

### Lesson 6: Accuracy metrics: MASE, RMSSE and pinball loss

See where MAE, RMSE and MAPE each mislead, and how MASE and RMSSE fix that by scaling against the naive benchmark. Score distributional forecasts with pinball loss and CRPS through `accuracy(measures = distribution_accuracy_measures)`, and pick the metric from the decision it is meant to support.

[Start Lesson 6: Accuracy metrics: MASE, RMSSE and pinball loss](Accuracy-Metrics-MASE-RMSSE-and-Pinball-Loss.html)

## Who this is for

Anyone who has already fit a model in this track, a benchmark, ETS or ARIMA, and now needs to know whether to trust it. You do not need any prior residual-diagnostics or cross-validation experience. By the end you will be able to check a model's residuals, build honest prediction intervals, compare methods with rolling-origin cross-validation, and score forecasts with the metric that fits the decision.

## What you will be able to do

- Explain what `augment()` adds to a fitted model and why a fitted value is not a forecast
- Run `gg_tsresiduals()` and the Ljung-Box test to judge whether residuals are clean
- Build and interpret prediction intervals with `hilo()`, including bootstrapped intervals
- Choose between a mean, median or quantile point forecast for the decision at hand
- Build rolling-origin cross-validation folds and compare methods fairly across them
- Score forecasts with MASE, RMSSE and pinball loss, and pick the metric that fits the decision

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Fitted values, residuals and innovations](Fitted-Values-Residuals-and-Innovations.html).
