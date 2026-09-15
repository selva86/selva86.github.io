---
title: "Exponential Smoothing ETS in R: An Interactive Course"
slug: "Exponential-Smoothing-ETS-Course"
description: "Learn exponential smoothing in R across six interactive lessons: simple exponential smoothing, Holt linear and damped trend, Holt-Winters seasonal methods, the ETS taxonomy, automatic model selection and forecasting with fable."
keywords: "exponential smoothing in R, simple exponential smoothing, Holt linear trend, damped trend, Holt-Winters, ETS models, ETS taxonomy, automatic ETS selection, fable forecast"
mathjax: false
webr: false
date: "2026-09-15"
curriculum_id: "5.50.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Exponential Smoothing ETS (Course)"
sidebar_order: "72"
---

# Exponential Smoothing ETS in R: A Hands-On Interactive Course

<p class="lead">Exponential smoothing does one simple thing well: it weights recent observations more than old ones, with the weights decaying geometrically the further back you look. This six-lesson interactive course builds that one idea into a full forecasting toolkit, from a series with no trend to one with both trend and season.</p>

Exponential smoothing is not a single technique but a family, one that gets a new component added at a time. You start with simple exponential smoothing on a series with no clear direction, add a slope with Holt's method, add a seasonal cycle with Holt-Winters, then step back to see the state-space taxonomy that ties all of it together and the automatic selection that fits, compares and forecasts with one function call.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The six lessons

### Lesson 1: Simple exponential smoothing

Forecast a series with no trend to follow by weighting recent years more than old ones. Build Algeria's 58 years of export data as a tsibble, compare a naive repeat-the-last-value guess and a flat historical average against SES, then fit `ETS(y ~ error("A") + trend("N") + season("N"))` in `fable` and see why every SES forecast is a flat line at the last smoothed level.

[Start Lesson 1: Simple exponential smoothing](Simple-Exponential-Smoothing.html)

### Lesson 2: Holt linear trend and the damped trend

Add a slope component with beta to forecast a series that climbs or falls steadily. See why an undamped trend embarrasses you at long horizons, meet the damping parameter phi and its usual range, and compare the naive, Holt and damped-Holt forecasts on a decade of air passenger numbers.

Lesson 2 is coming soon.

### Lesson 3: Holt-Winters seasonal methods

Add a seasonal component with gamma to forecast a series with a repeating calendar pattern. Tell additive from multiplicative seasonality, meet the damped seasonal variant, and forecast quarterly tourism with each version side by side.

Lesson 3 is coming soon.

### Lesson 4: The ETS taxonomy

Learn what the three letters in ETS, error, trend and season, actually mean, and which of the thirty combinations are stable enough to fit. See the state-space form behind an additive versus a multiplicative error, and why that choice decides the width of your prediction interval as much as the point forecast does.

Lesson 4 is coming soon.

### Lesson 5: Automatic ETS model selection

Let `ETS()` search the whole taxonomy for you. See how maximum likelihood estimates the parameters and initial states, how AICc ranks the candidates, how to read `report()` output, and the cases where the automatic choice still needs a human override.

Lesson 5 is coming soon.

### Lesson 6: Forecasting with ETS in fable

Turn a fitted ETS model into a forecast you can trust. Call `forecast(h = )`, compare prediction intervals from the state-space form against simulation, pull apart the fitted states with `components()` and `autoplot()`, check the residuals, and benchmark the result against the naive and seasonal-naive baselines with `accuracy()`.

Lesson 6 is coming soon.

## Who this is for

Anyone who has already worked through Time Series Foundations, or is otherwise comfortable holding a `tsibble` and reading a series' trend and season by eye. You do not need any prior exponential smoothing experience. By the end you will be able to fit simple exponential smoothing, Holt's linear and damped trend, and Holt-Winters seasonal methods by hand and automatically, read the ETS taxonomy that ties them together, and forecast with a fitted model's prediction intervals and diagnostics in `fable`.

## What you will be able to do

- Fit simple exponential smoothing and explain what the smoothing parameter alpha controls
- Add a trend component with Holt's method, and damp it with phi to avoid runaway long-horizon forecasts
- Add a seasonal component with Holt-Winters, and choose additive versus multiplicative seasonality
- Read the ETS(error, trend, season) taxonomy and know which combinations are stable
- Let `ETS()` select a model automatically with AICc, and know when to override it
- Generate forecasts with `forecast()`, read state-space versus simulated prediction intervals, and check residuals

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Simple exponential smoothing](Simple-Exponential-Smoothing.html).
