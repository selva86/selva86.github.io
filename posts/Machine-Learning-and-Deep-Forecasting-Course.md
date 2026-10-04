---
title: "Machine Learning and Deep Forecasting in R: An Interactive Course"
slug: "Machine-Learning-and-Deep-Forecasting-Course"
description: "Learn machine learning and deep forecasting in R across seven interactive lessons: one global model across many series, machine learning with modeltime, boosted trees, neural networks with NNETAR, deep learning architectures, and forecast combinations."
keywords: "global forecasting models, machine learning forecasting in R, modeltime, boosted trees for forecasting, NNETAR, neural network forecasting, DeepAR, N-BEATS, temporal fusion transformer, forecast combinations"
mathjax: false
webr: false
date: "2026-09-27"
curriculum_id: "5.130.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Machine Learning and Deep Forecasting (Course)"
sidebar_order: "80"
---

# Machine Learning and Deep Forecasting in R: A Hands-On Interactive Course

<p class="lead">A retailer needs a monthly forecast for every store and every product line, and there are far too many series to tune one model at a time. This seven-lesson interactive course starts from the choice between one model per series and one model for all of them, and works up through machine learning, boosted trees and neural networks to the deep learning models you read about in papers.</p>

The first lesson starts with 148 monthly retail turnover series from Australia, one for each state and industry. You reshape them into rows of lagged values, fit a single linear model to all the rows together, and score it on 2018 against a model fitted to each series on its own. Then you give the series more history and see when the separate models catch up. That comparison is the question every lesson in the course keeps asking: did the extra machinery earn its place against a simple benchmark?

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one dataset per idea. No setup, no installs.

## The seven lessons

### Lesson 1: One global model across many series

Learn why one model fitted to the stacked rows of all your series can beat a model for each series when each history is short. Build lag features inside each series, fit one linear model to all the rows, score it with MAPE on a holdout year, and decide from the history length and how alike the series are whether to share one model, one per industry, or none.

[Start Lesson 1: One global model across many series](Global-Models-One-Model-Across-Many-Series.html)

### Lesson 2: Machine Learning Forecasting with modeltime

Treat forecasting as supervised learning inside a tidy workflow. Build lagged and calendar features, fit a model, and put the result on the same accuracy table as a seasonal naive forecast and an ARIMA so you can see whether the machinery paid for itself.

[Start Lesson 2: Machine Learning Forecasting with modeltime](Machine-Learning-Forecasting-with-modeltime.html)

### Lesson 3: Boosted Trees for Forecasting

Use gradient boosting on lagged features. See why trees cannot extrapolate a trend and what to do about it, which features matter for a seasonal series, and how the result compares with a statistical benchmark.

[Start Lesson 3: Boosted Trees for Forecasting](Boosted-Trees-for-Forecasting.html)

### Lesson 4: Forecasting with a neural network using NNETAR

Fit a feed-forward network on lagged values. Learn what the architecture is in plain terms, why the fit is averaged over several random starts, how prediction intervals come from simulation, and whether it beats ETS on a series of this size.

[Start Lesson 4: Forecasting with a neural network using NNETAR](Neural-Network-Forecasts-NNETAR.html)

### Lesson 5: How DeepAR, N-BEATS and N-HiTS forecast

See what the modern deep forecasters do differently. DeepAR learns a distribution across many series, N-BEATS stacks basis expansions, and N-HiTS samples at several rates for long horizons. The ideas are taught from diagrams and a small network built by hand in base R, and the deep learning code is shown and explained for you to run on your own machine.

[Start Lesson 5: How DeepAR, N-BEATS and N-HiTS forecast](Deep-Learning-DeepAR-N-BEATS-and-N-HiTS.html)

### Lesson 6: How a Temporal Fusion Transformer forecasts

Learn attention for forecasting in plain language: static covariates, inputs known in the future, inputs observed in the past, and what the attention weights tell you about which time steps mattered. The code is shown and explained, with the focus on when this class of model is worth its cost and when it is not.

[Start Lesson 6: How a Temporal Fusion Transformer forecasts](Temporal-Fusion-Transformers.html)

### Lesson 7: Bootstrapping, bagging and forecast combinations

Finish with the cheapest reliable win in forecasting. Bootstrap a series, bag the forecasts, and combine models by simple averaging, then see why the average so often beats the single best model chosen after the fact.

Lesson 7 is coming soon.

## Who this is for

Anyone comfortable fitting a forecasting model in R and reading an accuracy table, for example from the Forecasting Toolbox or Exponential Smoothing courses. You do not need any prior knowledge of machine learning or deep learning: every idea is introduced on a small real data set. By the end you will be able to frame a forecast as a supervised learning problem, choose between local and global models, and judge whether a complex model beats a simple one on your data.

## What you will be able to do

- Say what a global forecasting model is and when it beats one model per series
- Build lag features inside each series so no row takes a value from another series
- Fit one model across many series and score it with MAPE on a holdout period
- Choose between one shared model, a model per group and a model per series from the history length
- Compare machine learning, boosted tree and neural network forecasts against seasonal naive and statistical benchmarks
- Explain in plain terms what DeepAR, N-BEATS and temporal fusion transformers add
- Combine forecasts and explain why the average is hard to beat

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: One global model across many series](Global-Models-One-Model-Across-Many-Series.html).
