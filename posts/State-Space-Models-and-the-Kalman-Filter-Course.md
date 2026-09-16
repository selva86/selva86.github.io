---
title: "State Space Models and the Kalman Filter in R: An Interactive Course"
slug: "State-Space-Models-and-the-Kalman-Filter-Course"
description: "Learn state space models and the Kalman filter in R across seven interactive lessons: the observation and state equations, filtering and smoothing, local level and local linear trend models, structural time series, Bayesian structural models, dynamic linear models, and time-varying parameters."
keywords: "state space models in R, Kalman filter tutorial, local level model, StructTS, structural time series R, bsts bayesian structural time series, dlm dynamic linear models, time-varying coefficients, ETS ARIMA equivalence"
mathjax: false
webr: false
date: "2026-09-16"
curriculum_id: "5.80.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "State Space Models and the Kalman Filter (Course)"
sidebar_order: "75"
---

# State Space Models and the Kalman Filter in R: A Hands-On Interactive Course

<p class="lead">Every forecasting model you have fit so far, ETS included, is secretly a state space model wearing a different name. This seven-lesson interactive course makes that hidden structure explicit: an observed series as a noisy view of a state you never see directly, updated one step at a time by a Kalman filter, and general enough to cover local trends, full structural decompositions, Bayesian priors, and coefficients that drift.</p>

Once a series is written as an observation equation plus a state equation, ETS and ARIMA stop looking like two competing toolboxes and start looking like two special cases of the same filter. From there the course builds outward: the predict-then-update loop worked by hand, the local level and local linear trend models StructTS() fits directly, a full structural decomposition into level, slope, seasonal and irregular components, the Bayesian version with priors and MCMC, dynamic linear models for regression with time-varying coefficients, and what to do when a coefficient you assumed was fixed turns out not to be.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one real dataset per idea. No setup, no installs.

## The seven lessons

### Lesson 1: Why state space models

See a time series as a hidden level plus noise, write its observation and state equations on the Nile, and see why ETS and ARIMA reach nearly the same forecast because both are state space models underneath.

[Start Lesson 1: Why state space models](Why-State-Space-Models.html)

### Lesson 2: The Kalman filter and smoother

Work the predict-then-update loop by hand on a local level model for a few steps, read the gain as a trust dial between the model and the data, see filtering versus smoothing, and reproduce the numbers with a base-R implementation.

Lesson 2 is coming soon.

### Lesson 3: Local level and local linear trend models

Meet the two simplest state space forms, see what the signal-to-noise ratio does to the fitted level, fit their ETS equivalents (ANN and AAN) in fable, and read the smoothed states as a component plot.

Lesson 3 is coming soon.

### Lesson 4: Basic structural time series

Split a series into level, slope, seasonal and irregular as separate states, fit it with StructTS() in base R, compare its components against an STL decomposition of the same series, and forecast from the structural model.

Lesson 4 is coming soon.

### Lesson 5: Bayesian structural time series (bsts)

Put priors and MCMC on the same components, use spike-and-slab regression to choose predictors, read a posterior forecast distribution, and see what the bsts package buys you over the fitted version.

Lesson 5 is coming soon.

### Lesson 6: Dynamic linear models with dlm

Learn the general DLM notation, write regression with time-varying coefficients as a DLM, see what the dlm package provides, and read a coefficient that drifts over time instead of sitting still.

Lesson 6 is coming soon.

### Lesson 7: Time-varying parameters

Understand why a fixed coefficient can be the wrong assumption, compare a rolling-window regression against the principled state space version, and see how to report a coefficient path honestly.

Lesson 7 is coming soon.

## Who this is for

Anyone who has already worked through ARIMA and Seasonal ARIMA, or is otherwise comfortable fitting an `ARIMA(p, d, q)` model in `fable` and reading its residual diagnostics. You do not need any prior experience with state space models or the Kalman filter. By the end you will be able to write a series as observation and state equations, filter and smooth a local level model by hand, fit structural and Bayesian structural models, build a dynamic linear model with time-varying coefficients, and judge when a fixed coefficient has stopped being a safe assumption.

## What you will be able to do

- Write a time series as an observation equation plus a state equation, and see ETS and ARIMA as special cases of the same framework
- Work the Kalman filter's predict-then-update loop by hand, and tell filtering apart from smoothing
- Fit local level and local linear trend models, and match them to their ETS equivalents
- Decompose a series into level, slope, seasonal and irregular states with StructTS()
- Fit a Bayesian structural time series model and read its posterior forecast distribution
- Build a dynamic linear model for regression with time-varying coefficients
- Report a drifting coefficient honestly instead of forcing a fixed one

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Why state space models](Why-State-Space-Models.html).
