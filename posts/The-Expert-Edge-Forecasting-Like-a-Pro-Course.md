---
title: "The Expert Edge in Forecasting Like a Pro: An Interactive Course"
slug: "The-Expert-Edge-Forecasting-Like-a-Pro-Course"
description: "Learn to test and trust a forecasting process in R across seven interactive lessons: rolling-origin backtests without leakage, conformal prediction intervals, intermittent demand, forecast value added, scaled error metrics, judgmental adjustments, and prediction interval coverage."
keywords: "rolling origin cross validation, time series backtesting, conformal prediction intervals, intermittent demand forecasting, Croston method, forecast value added, MASE RMSSE, prediction interval coverage, forecast governance"
mathjax: false
webr: false
date: "2026-10-03"
curriculum_id: "5.150.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "The Expert Edge in Forecasting Like a Pro (Course)"
sidebar_order: "82"
---

# The Expert Edge in Forecasting Like a Pro: A Hands-On Interactive Course

<p class="lead">A backtest can look excellent and still mislead, and an accurate forecast is not finished until it has an interval that holds, a fair comparison against a simple baseline and a process someone else can check. This seven-lesson interactive course covers that work: the step from building a model to defending its numbers.</p>

The other forecaster courses teach you to build a model. This one is about the harder discipline of proving it is actually good: catching the leaks that inflate a backtest, quantifying uncertainty with intervals that keep their promise, handling the series that ordinary methods quietly fail on, measuring whether you beat the dumb baseline, scoring errors fairly across many series at once, knowing when a human override earns its place, and checking whether an interval's coverage is really what it claims.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The seven lessons

### Lesson 1: Rolling-origin backtests without leakage

See exactly where a backtest quietly lies to you: a scaler fit on the whole series, a feature built from data that had not happened yet, a model picked on the same window used to judge it, and a missing gap between training and test. Build a correct rolling-origin evaluation on Lumen & Co.'s weekly sales, then plant each leak one at a time and watch the reported accuracy improve while the model's real skill never moves.

[Start Lesson 1: Rolling-origin backtests without leakage](Rolling-Origin-CV-and-the-Leakage-That-Fakes-Great-Backtests.html)

### Lesson 2: Conformal prediction intervals for time series

Get an interval that keeps its promise without assuming the residuals follow any particular distribution. Calibrate on held-out residuals and read their quantiles directly, so a 90% interval covers 90% of outcomes empirically, then compare its width and coverage against a model-based interval and see which one survives residuals that are not Normal.

[Start Lesson 2: Conformal prediction intervals for time series](Conformal-Prediction-Intervals-for-Time-Series.html)

### Lesson 3: Forecasting intermittent demand with Croston, ADIDA and TSB

See what exponential smoothing does to a spare-parts series that is mostly zero: it forecasts a smooth trickle that never matches any real week. Fit Croston's split of demand size and interval, then ADIDA's aggregation trick and TSB's probability update with `tsintermittent`, and judge all three on a metric that does not just reward predicting zero forever.

[Start Lesson 3: Forecasting intermittent demand with Croston, ADIDA and TSB](Intermittent-Demand-Croston-ADIDA-and-TSB.html)

### Lesson 4: Forecast value added against a naive baseline

Settle the question that ends most forecasting arguments. Compute forecast value added against a seasonal naive benchmark, per series and in aggregate, and find the series where your sophisticated model is quietly worse than the dumbest possible forecast, which in most portfolios is a real and uncomfortable minority.

[Start Lesson 4: Forecast value added against a naive baseline](Forecast-Value-Added-Are-You-Beating-the-Naive-Baseline.html)

### Lesson 5: Scaled errors and what the M competitions found

See why MAPE breaks down on series near zero and punishes over-forecasting less than under-forecasting, and what MASE and RMSSE fix. Learn to average errors across series of wildly different scale without one loud series dominating the average, then look at what the M competitions actually found, including that simple combinations beat most individual methods.

[Start Lesson 5: Scaled errors and what the M competitions found](Scaled-Errors-and-the-Lessons-of-the-M-Competitions.html)

### Lesson 6: Judgmental adjustments and forecast governance

Learn the part no package covers: when a human should override a statistical forecast, a known one-off the model cannot see coming, and when they should not, optimism, anchoring, the loudest voice in the room. Learn to record an adjustment so its value can be measured later, and the governance that keeps a forecasting process honest instead of just convenient.

[Start Lesson 6: Judgmental adjustments and forecast governance](Judgmental-Adjustments-and-Forecast-Governance.html)

### Lesson 7: Checking prediction interval coverage

A 95% interval that only covers 80% of real outcomes is not a 95% interval, whatever the model claims. Measure empirical coverage over a rolling evaluation, plot coverage against the nominal level to see exactly where it breaks, diagnose the usual causes, a variance that moves, fat tails, a parameter treated as fixed when it is not, and decide between widening the interval and fixing the model underneath it.

[Start Lesson 7: Checking prediction interval coverage](Checking-Prediction-Interval-Coverage.html)

## Who this is for

Anyone who can already fit a forecasting model in R, with `fable`, `forecast`, or a model of their own, and wants to know whether that model's reported accuracy can actually be trusted. You do not need any prior exposure to conformal prediction, intermittent-demand methods, or forecast governance; everything here is built from scratch.

## What you will be able to do

- Build a rolling-origin backtest and recognize the four leaks that inflate a backtest
- Calibrate a conformal prediction interval and check it against a model-based one
- Forecast intermittent, mostly-zero demand with Croston, ADIDA and TSB
- Compute forecast value added against a naive baseline and find where a model loses to it
- Average forecast errors fairly across series with MASE and RMSSE
- Judge when a human override belongs in a forecast, and record it so its value can be measured
- Measure a prediction interval's empirical coverage and diagnose why it misses its target

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Rolling-origin backtests without leakage](Rolling-Origin-CV-and-the-Leakage-That-Fakes-Great-Backtests.html).
