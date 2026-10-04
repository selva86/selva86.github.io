---
title: "Production Forecasting in R: An Interactive Course"
slug: "Production-Forecasting-Course"
description: "Learn to run a forecasting model in production across six interactive lessons: setting a refit cadence, monitoring accuracy by horizon, diagnosing degradation, calendar and event features, scaling to thousands of series with fable, and deploying a forecasting service."
keywords: "production forecasting, model retraining, refit cadence, forecast monitoring, forecast degradation, concept drift, calendar features, fable at scale, forecasting service, vetiver, R"
mathjax: false
webr: true
date: "2026-10-04"
curriculum_id: "5.160.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Production Forecasting (Course)"
sidebar_order: "83"
---

# Production Forecasting in R: A Hands-On Interactive Course

<p class="lead">A forecasting model that works on the day you fit it does not stay working on its own. Someone has to decide when to refit it, notice when its accuracy slips, and keep it fed with the calendar and event data it needs as the series grows from one to thousands. This six-lesson interactive course is about that someone's job: running a forecast in production, not just building one.</p>

The first lesson starts with Highgate Paper Co., a wholesale paper products supplier whose demand holds steady for 60 weeks and then steps up for good. You derive a refit cadence from how fast the model's own parameters move, not from a fixed calendar, and see exactly what refitting too often or too rarely costs in forecast accuracy.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one dataset per idea. No setup, no installs.

## The six lessons

### Lesson 1: Choosing how often to refit a forecast model

Refit too often and you chase noise; refit too rarely and the model drifts away from the data it is supposed to describe. Simulate both failure modes against a series whose level genuinely changes, and derive a refit trigger from the model's own noise instead of from habit.

[Start Lesson 1: Choosing how often to refit a forecast model](Setting-a-Refresh-Cadence-and-Retraining.html)

### Lesson 2: Monitoring forecast accuracy over time

Build the dashboard that tells you something. Track error by horizon instead of only in aggregate, because a model can look fine on average while being useless at the horizon the business actually plans on, and learn to tell a bad month apart from a bad model.

[Start Lesson 2: Monitoring forecast accuracy over time](Monitoring-Forecast-Accuracy-Over-Time.html)

### Lesson 3: Diagnosing a drop in forecast accuracy

Accuracy has dropped. Work through the cause in order: a pipeline change, a distribution shift in an input, a structural break in the series, then genuine model decay. Each leaves a different signature in the residuals, and confusing them is how teams retrain a model that was never the problem.

[Start Lesson 3: Diagnosing a drop in forecast accuracy](Detecting-and-Diagnosing-Forecast-Degradation.html)

### Lesson 4: Calendar and event features for production forecasts

Fix the unglamorous thing that breaks most production forecasts: holiday and event features that differ between training and serving. Build a calendar table once, handle a moving holiday and a country with its own calendar, and see what a one-day misalignment does to a forecast.

[Start Lesson 4: Calendar and event features for production forecasts](Feature-Stores-for-Calendars-and-Events.html)

### Lesson 5: Forecasting thousands of series with fable

Turn one model into thousands. Fit across many series at once in the fable grammar, keep memory and run time sane as the count grows, handle the series that fail to fit without losing the batch, and read an accuracy table across a whole portfolio.

[Start Lesson 5: Forecasting thousands of series with fable](Scaling-fable-and-fabletools.html)

### Lesson 6: Deploying a forecasting service

Learn what it takes to let something else ask for a forecast: the contract for a request and a response, versioning a model with vetiver so a forecast can be traced to what produced it, and the operational questions that decide whether anyone trusts the answer. The service itself is explained and shown running locally, since an API cannot serve from inside a browser session.

[Start Lesson 6: Deploying a forecasting service](Deploying-a-Forecasting-Service.html)

## Who this is for

Anyone who already fits a forecasting model in R and reads an accuracy table, for example from the Forecasting Toolbox or Exponential Smoothing courses. You do not need any prior production experience: every idea is introduced on a small, real dataset. By the end you will be able to set a refit cadence from evidence, monitor a live forecast, diagnose why its accuracy dropped, and scale the whole workflow to a portfolio of series.

## What you will be able to do

- Derive a refit cadence from how fast a model's parameters actually move, rather than from a fixed calendar
- Track forecast error by horizon, not just in aggregate, and tell a bad month from a bad model
- Diagnose a drop in accuracy by working through pipeline changes, input shifts, structural breaks, and model decay in order
- Build a calendar table that supplies holiday and event features consistently between training and serving
- Fit, monitor, and reconcile a forecasting workflow across thousands of series with fable
- Describe the contract and the versioning a forecasting service needs before anyone else can trust it

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Choosing how often to refit a forecast model](Setting-a-Refresh-Cadence-and-Retraining.html).
