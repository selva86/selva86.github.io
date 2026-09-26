---
title: "Hierarchical and Grouped Forecasting in R: An Interactive Course"
slug: "Hierarchical-and-Grouped-Forecasting-Course"
description: "Learn hierarchical and grouped forecasting in R across five interactive lessons: declaring a hierarchy, the classic bottom-up and top-down methods, MinT optimal reconciliation, the fable workflow, and coherent forecasts a planning team can use."
keywords: "hierarchical time series, grouped time series, forecast reconciliation, hierarchical forecasting in R, aggregate_key, MinT reconciliation, bottom-up forecasting, top-down forecasting, fable, fabletools"
mathjax: false
webr: false
date: "2026-09-27"
curriculum_id: "5.120.0"
post_type: "C"
sidebar_section: "Time Series"
sidebar_title: "Hierarchical and Grouped Forecasting (Course)"
sidebar_order: "79"
---

# Hierarchical and Grouped Forecasting in R: A Hands-On Interactive Course

<p class="lead">A company forecasts sales for each store, each region and the whole country, and the three sets of numbers never agree. Each forecast was made on its own, so the stores do not add up to the region and the regions do not add up to the country. This five-lesson interactive course starts from how a set of related series is organised, and ends with forecasts that add up and that a planning meeting can use.</p>

The first lesson starts with quarterly tourism trips for Tasmania and Western Australia, 40 bottom-level series in all. You build a hierarchy, a grouped structure and a combination of both from the same table, and count the series in each. Then you forecast every series on its own and measure the gap between the state forecast and the sum of its regions. That gap is the reason the rest of the course exists.

Each lesson is a guided, interactive experience: you run real R code in the page, answer checkpoints, and work with one dataset per idea. No setup, no installs.

## The five lessons

### Lesson 1: Hierarchical and grouped time series

Learn how the structure of your series decides which forecasts can add up. Tell a hierarchy from a grouped structure by counting the parents of a bottom-level series, declare both with `aggregate_key()`, and see why forecasts made series by series do not sum.

[Start Lesson 1: Hierarchical and grouped time series](Hierarchical-and-Grouped-Time-Series.html)

### Lesson 2: Bottom-up, top-down and middle-out

Meet the three classic answers and the honest trade in each. Bottom-up keeps the detail and accumulates the noise, top-down forecasts the stable total and loses series-specific signal, and middle-out picks a level in between. Run all three on the same hierarchy and compare accuracy level by level.

Lesson 2 is coming soon.

### Lesson 3: Optimal reconciliation with MinT

See why the classic three are special cases of one projection. Use the forecast error covariance to choose the adjustment that minimises variance, and watch it beat bottom-up on the same data.

Lesson 3 is coming soon.

### Lesson 4: Reconciliation with fabletools

Run the whole workflow in the fable grammar: declare the structure with `aggregate_key()`, fit a model across every node, reconcile with `min_trace()`, and forecast coherent paths. Read the accuracy table by level and confirm that the children now add to the parent exactly.

Lesson 4 is coming soon.

### Lesson 5: Coherent forecasts a finance team can plan against

Take a set of incoherent forecasts and show the gap in money terms. Reconcile them, and show exactly what changed for the planning meeting, so the regional plans and the national plan finally agree.

Lesson 5 is coming soon.

## Who this is for

Anyone comfortable fitting a forecasting model in R and reading an accuracy table, for example from the Forecasting Toolbox or Exponential Smoothing courses. You do not need any prior knowledge of hierarchical methods: every idea is introduced on a small real data set. By the end you will be able to describe your series as a hierarchy or a grouped structure, choose a reconciliation method that suits it, and produce forecasts that add up.

## What you will be able to do

- Tell a hierarchical time series from a grouped one by counting the parents of a bottom-level series
- Declare a hierarchy, a grouped structure or both with `aggregate_key()` and count the series it creates
- Explain why forecasts made series by series are incoherent, and measure the gap
- Say which reconciliation methods each structure allows
- Compare bottom-up, top-down, middle-out and optimal reconciliation by accuracy at each level
- Reconcile forecasts with `min_trace()` and check that the parts add up to the whole

This course is part of the Forecaster track.

Ready? [Begin with Lesson 1: Hierarchical and grouped time series](Hierarchical-and-Grouped-Time-Series.html).
