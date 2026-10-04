---
title: "Intervention, Causal Impact and Anomaly Detection in R: An Interactive Course"
slug: "Intervention-Causal-Impact-and-Anomaly-Detection-Course"
description: "Learn to measure events and spot unusual behaviour in time series across five interactive lessons: intervention analysis, counterfactual forecasts, changepoint detection, anomaly detection and handling outliers in R."
keywords: "intervention analysis, interrupted time series, causal impact, counterfactual forecast, changepoint detection, PELT, binary segmentation, anomaly detection, anomalize, tsclean, time series outliers, R"
mathjax: false
webr: false
date: "2026-10-04"
curriculum_id: "5.140.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Intervention, Causal Impact and Anomaly Detection (Course)"
sidebar_order: "81"
---

# Intervention, Causal Impact and Anomaly Detection in R: A Hands-On Interactive Course

<p class="lead">Something happened to the series: a price change, a new policy, a site redesign, or a week nobody can explain. This five-lesson interactive course is about the questions that follow. What did the event do, when exactly did the series change, and which points are unusual enough to act on?</p>

The course starts with events you know the date of. You code an intervention as a regressor, fit it alongside ARIMA errors, and read its effect with a standard error. Then you build the counterfactual directly: fit on the days before the event, forecast forward, and read the gap. From there the date is unknown, so you find it with changepoint methods, and the last two lessons turn to single points and stretches that do not fit: how to detect them and what to do once you have.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one dataset per idea. No setup, no installs.

## The five lessons

### Lesson 1: Intervention analysis for a known event

Code an event on a known date as a step for a permanent shift, a pulse for a one-off or a ramp for a gradual change. Fit it alongside ARIMA errors so serial correlation does not fake significance, and read the coefficient as the effect with its standard error.

[Start Lesson 1: Intervention analysis for a known event](Intervention-Analysis-and-Interrupted-Time-Series.html)

### Lesson 2: Estimating an event's effect with a counterfactual forecast

Fit a model on the days before an event, forecast it forward as the counterfactual, and read the gap against what actually happened as the event's effect, with the forecast interval as its uncertainty. Then the caveats that undo most of these analyses: a concurrent event, a season the pre-period never saw, and a control series that was itself affected.

[Start Lesson 2: Estimating an event's effect with a counterfactual forecast](Causal-Impact-of-an-Event.html)

### Lesson 3: Finding changepoints when the date is unknown

Compare binary segmentation and PELT for finding changepoints, see how the penalty decides how many you get and why the default is not always right, and tell a change in mean from a change in variance.

[Start Lesson 3: Finding changepoints when the date is unknown](Changepoint-Detection.html)

### Lesson 4: Detecting anomalies and outliers in a series

Tell a point anomaly from a contextual or a collective one, fit a residual-based detector, choose the threshold that trades false alarms against misses, and catch all three kinds with anomalize.

[Start Lesson 4: Detecting anomalies and outliers in a series](Anomaly-and-Outlier-Detection.html)

### Lesson 5: Handling outliers in a time series

Compare deleting, capping and tsclean against coding a known outlier as an intervention regressor, and see how each choice changes the forecast and its interval.

[Start Lesson 5: Handling outliers in a time series](Handling-Outliers-in-Time-Series.html)

## Who this is for

Analysts and forecasters who already fit ARIMA and ETS models in R and now need to answer what an event did, or whether a strange week is worth acting on. The Forecaster track's earlier sections cover the models these lessons build on.

## What you will be able to do

- Code an intervention as a step, pulse or ramp regressor and estimate its effect with ARIMA errors
- Build a counterfactual forecast from the pre-event period and read the event's effect with its uncertainty
- Find changepoints with binary segmentation and PELT and choose the penalty deliberately
- Separate point, contextual and collective anomalies and set a detection threshold
- Decide between deleting, capping, cleaning and modelling an outlier, and see what each does to the forecast

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Intervention analysis for a known event](Intervention-Analysis-and-Interrupted-Time-Series.html).
