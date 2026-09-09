---
title: "Time Series Foundations in R: An Interactive Course"
slug: "Time-Series-Foundations-Course"
description: "Learn time series foundations in R across eight interactive lessons: tsibble, decomposition, seasonal plots, the ACF, train/test splits, and benchmark forecasts."
keywords: "time series in R, time series foundations, tsibble, autocorrelation, ACF, time series course, train test split time series, benchmark forecasts, seasonal plots R"
mathjax: false
webr: false
date: "2026-09-10"
curriculum_id: "5.10.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Time Series Foundations (Course)"
sidebar_order: "68"
---

# Time Series Foundations in R: A Hands-On Interactive Course

<p class="lead">A time series is not a random sample: the order the values arrived in carries real information. This eight-lesson interactive course builds the foundation every later forecasting topic assumes, one real dataset at a time.</p>

Most time series material jumps straight to ARIMA or exponential smoothing before explaining why ordinary statistics methods break on ordered data in the first place. This course starts earlier: what autocorrelation actually does to your effective sample size, how to hold temporal data in the tidy `tsibble` structure the rest of the ecosystem expects, how to read a series before modeling it, and how to split and benchmark it honestly before you ever fit a forecasting model.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The eight lessons

### Lesson 1: What makes time series different

See why treating a time series like a random sample breaks your assumptions. Watch autocorrelation shrink the effective sample size in a real bike-rental series, meet the vocabulary the whole track uses, trend, seasonality, cycle, noise, lag and horizon, and see a forecast as a distribution over the future rather than a single number.

[Start Lesson 1: What makes time series different](What-Makes-Time-Series-Different.html)

### Lesson 2: Tidy temporal data with tsibble

Hold time series data the way the modern R forecasting ecosystem expects. Learn the index and key that define a `tsibble`, regular versus irregular intervals, filling implicit gaps with `fill_gaps()`, converting a data frame to a tsibble and back, and aggregating daily data to monthly with `index_by()`.

Lesson 2 is coming soon.

### Lesson 3: Time series analysis in R

Read what a series says before you fit anything to it. Practice naming level, trend, seasonal pattern, cycles and noise across three real series, retail sales, energy demand and web traffic, and describe each one in a single honest sentence.

Lesson 3 is coming soon.

### Lesson 4: EDA for time series

Adopt the plots-first workflow that catches problems before modeling does. Use `autoplot()`, summarize by season and year, and learn to spot outliers, structural breaks, missing runs and calendar effects while they are still cheap to fix.

Lesson 4 is coming soon.

### Lesson 5: Seasonal, subseries and lag plots

Go beyond a single line chart. Use `gg_season()` and `gg_subseries()` to read a seasonal shape and check how stable it is year over year, then use `gg_lag()` for your first direct look at how a series depends on its own past.

Lesson 5 is coming soon.

### Lesson 6: Autocorrelation and the ACF

Compute the lag-k correlation by hand, then read it properly from `ACF()` and its significance band. Learn what trend and seasonality look like in an ACF plot, what white noise looks like as the null case, and the idea behind the Ljung-Box test.

Lesson 6 is coming soon.

### Lesson 7: Train and test splits for temporal data

See exactly why a random train/test split leaks the future into training. Build the last-h holdout with `filter_index()`, get a first look at rolling origins, and learn to evaluate a model only on the window it never saw.

Lesson 7 is coming soon.

### Lesson 8: Benchmark forecasts: naive, seasonal naive and drift

Fit the three benchmarks every real model must beat, `MEAN()`, `NAIVE()`, `SNAIVE()` and `RW(y ~ drift())` in `fable`. Generate forecasts with intervals, score them with `accuracy()` on the test window, and lock in the rule that no model earns a place in your workflow until it beats these.

Lesson 8 is coming soon.

## Who this is for

Anyone who can already write basic R and has a dataset with a date or time column, but has only ever analyzed it the way they would analyze a random sample. You do not need any prior tsibble, fable or forecasting experience. By the end you will be able to hold temporal data correctly, read a series honestly, split it without leaking the future, and judge any forecast against a real benchmark.

## What you will be able to do

- Explain why autocorrelation shrinks a time series' effective sample size
- Hold temporal data as a tidy `tsibble` with the right index and key
- Read level, trend, seasonality, cycles and noise off a real series
- Run a plots-first EDA workflow that catches problems before modeling
- Compute and interpret the ACF, including the white-noise null case
- Split temporal data without leaking the future into training
- Fit and score naive, seasonal naive and drift benchmark forecasts

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: What makes time series different](What-Makes-Time-Series-Different.html).
