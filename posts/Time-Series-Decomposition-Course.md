---
title: "Time Series Decomposition in R: An Interactive Course"
slug: "Time-Series-Decomposition-Course"
description: "Learn time series decomposition in R across six interactive lessons: moving averages, classical and STL decomposition, seasonal adjustment, Box-Cox transforms, calendar adjustments and feature extraction with feasts."
keywords: "time series decomposition in R, classical decomposition, STL, moving average, seasonal adjustment, Box-Cox transform, feasts, time series features"
mathjax: false
webr: false
date: "2026-09-10"
curriculum_id: "5.20.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Time Series Decomposition (Course)"
sidebar_order: "69"
---

# Time Series Decomposition in R: A Hands-On Interactive Course

<p class="lead">A time series is really several signals layered on top of each other: a slow trend, a repeating season, and whatever is left over. This six-lesson interactive course teaches you to pull those layers apart, read each one on its own, and know which method to reach for.</p>

Every later forecasting method in this track, from ETS to ARIMA to regression with seasonal terms, either assumes you can already separate trend from season or does that separation internally. This course builds that skill directly: computing a moving average by hand, running the classical and STL decompositions in `feasts`, choosing a variance-stabilizing transform, adjusting for calendar effects, and extracting numeric features that summarize a series' shape.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The six lessons

### Lesson 1: Moving averages and classical decomposition

Compute a centred moving average by hand, build the 2x12-MA that centres an even seasonal period, and run the additive and multiplicative `classical_decomposition()` in `feasts` on AirPassengers. See what each component means, and why the classical method is a stepping stone rather than a workhorse.

[Start Lesson 1: Moving averages and classical decomposition](Moving-Averages-and-Classical-Decomposition.html)

### Lesson 2: STL decomposition in practice

Move to the decomposition that actually gets used. Fit `STL(y ~ trend(window = ) + season(window = ))` in `feasts`, see how the trend and season windows trade smoothness for responsiveness, turn on robust fitting for outliers, and read the `components()` output and the scaled bars in `autoplot()` on a real retail series.

[Start Lesson 2: STL decomposition in practice](STL-Decomposition-in-Practice.html)

### Lesson 3: Seasonal adjustment with X-13 and STL

Learn what a seasonally adjusted series actually is, who publishes them, and why adjustment is not the same as forecasting. Compute one from STL with `season_adjust`, and meet X-13ARIMA-SEATS, the official statistics standard, explained and shown alongside the runnable STL path.

[Start Lesson 3: Seasonal adjustment with X-13 and STL](Seasonal-Adjustment-with-X13-and-STL.html)

### Lesson 4: Box-Cox and variance-stabilizing transforms

Handle a series whose seasonal swings grow with its level. Compare log and Box-Cox transforms with lambda chosen by `guerrero()`, apply `box_cox()` in `fabletools`, learn the bias a back-transformed point forecast picks up, and judge when a transform is not worth the interpretability cost.

[Start Lesson 4: Box-Cox and variance-stabilizing transforms](Box-Cox-and-Variance-Stabilizing-Transforms.html)

### Lesson 5: Calendar and population adjustments

Catch the patterns that masquerade as seasonality: month lengths, trading days and moving holidays. Apply per-capita and inflation adjustments, convert monthly totals to daily averages, and check that an adjustment actually removed the pattern it was meant to remove.

[Start Lesson 5: Calendar and population adjustments](Calendar-and-Population-Adjustments.html)

### Lesson 6: Time series features with feasts

Turn a whole series into a handful of numbers. Use `features(y, feature_set())` for STL strength of trend and seasonality, ACF features and spectral entropy, plot many series in feature space to find the odd ones out, and use features to route series to different models.

[Start Lesson 6: Time series features with feasts](Time-Series-Features-with-feasts.html)

## Who this is for

Anyone who has already worked through Time Series Foundations, or is otherwise comfortable holding a `tsibble` and reading a series' trend and season by eye. You do not need any prior decomposition experience. By the end you will be able to separate trend, season and remainder with both the classical method and STL, stabilize variance with the right transform, adjust for calendar effects, and summarize any series with a small set of numeric features.

## What you will be able to do

- Compute a centred moving average by hand and explain what it estimates
- Run and compare additive and multiplicative classical decomposition
- Fit an STL decomposition and tune its trend and season windows
- Compute a seasonally adjusted series and explain what adjustment does and does not do
- Choose and apply a Box-Cox or log transform to stabilize variance
- Adjust a series for calendar effects, trading days and population
- Extract STL, ACF and spectral-entropy features to summarize a series' shape

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Moving averages and classical decomposition](Moving-Averages-and-Classical-Decomposition.html).
