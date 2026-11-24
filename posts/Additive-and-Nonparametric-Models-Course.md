---
title: "Additive and Nonparametric Models in R: An Interactive Course"
slug: "Additive-and-Nonparametric-Models-Course"
description: "Learn flexible regression in R across six interactive lessons: smoothers and the bias-variance trade, generalized additive models with mgcv, choosing smoothness by a criterion, kernel density estimation, quantile regression, and robust regression that resists an outlier."
keywords: "generalized additive models in R, GAM in R, mgcv, smoothing spline in R, loess in R, regression spline, effective degrees of freedom, REML smoothness selection, generalized cross validation, kernel density estimation in R, bandwidth selection, quantile regression in R, quantreg, robust regression in R, Huber loss, iteratively reweighted least squares"
mathjax: true
webr: false
date: "2026-11-22"
curriculum_id: "4.100.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Additive and Nonparametric Models (Course)"
sidebar_order: "41"
---

# Additive and Nonparametric Models in R: A Hands-On Interactive Course

<p class="lead">Straight lines are an assumption, not a finding, and so is the decision to model the mean rather than the median. This six-lesson interactive course is about what to do when the shape of a relationship is the thing you want the data to tell you, and about the two questions that get buried whenever a model is fitted by least squares without being asked to justify itself.</p>

It opens with a sweep rather than a menu. A scatter plot with a real curve in it, four smoothers laid over it, and each one's tuning parameter pushed from far too smooth to far too wiggly. The point is not which smoother wins. The point is that under-smoothing chases noise, over-smoothing erases the feature you were looking for, and the setting in between is a decision that should be made by a criterion rather than by eye.

Generalized additive models then arrive as something smaller than their reputation: a linear model with some columns replaced by smooth functions, which keeps the whole thing inside what you already know. Each smooth gets its own partial-effect plot, and the effective degrees of freedom are read as how much wiggliness the fit actually bought, so a term that comes back at nearly one degree of freedom is telling you plainly that it is linear.

The second half changes the question rather than the flexibility. Quantile regression asks how the tenth, fiftieth and ninetieth percentiles each move, which a single mean regression cannot answer and will not warn you about. Robust regression changes the loss so one bad point stops dominating, implemented by hand with the weights printed so the down-weighted observation is identifiable rather than mysterious.

The through-line is that flexibility has to be paid for and the price is measurable. Every tuning parameter here gets swept, every criterion gets computed and plotted, and each method is run against data where the truth is known, including the case that matters most: a smoother fitted to pure noise, where a correct procedure returns something nearly flat.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Smoothing without smoothing away the signal

A scatter plot with a real curve in it, and four smoothers laid over it: a moving average, a loess fit, a regression spline and a smoothing spline, each with its tuning parameter swept from far too smooth to far too wiggly, so you watch the same bias-variance trade appear in a new costume. The sweep is the lesson, not the menu. Under-smoothing chases noise, over-smoothing erases the feature you came for, and the right setting is a decision a criterion should make rather than your eye.

[Start Lesson 1: Smoothing without smoothing away the signal](Smoothing-Without-Smoothing-Away-the-Signal.html)

### Lesson 2: Generalized additive models, one smooth at a time

A GAM presented as what it is, a linear model with some columns replaced by smooth functions, which keeps it inside everything you already know. Fitted with `mgcv`, with each smooth term plotted on its own partial-effect axis, and the effective degrees of freedom read as how much wiggliness the fit actually bought: a term returning nearly one degree of freedom is telling you it is linear. A GAM and a spline-augmented `lm()` fitted to the same data to show they are close relatives, and the thing the GAM adds, which is choosing the smoothness for you.

[Start Lesson 2: Generalized additive models, one smooth at a time](Generalized-Additive-Models-One-Smooth-at-a-Time.html)

### Lesson 3: Choosing how wiggly is too wiggly

Smoothness selection treated as an estimation problem with a criterion rather than a matter of taste. The penalized objective written out, the penalty's effect shown by sweeping it, and generalized cross-validation and REML both computed and plotted against the penalty so you see the minimum being found. Then the two checks that matter: a smooth fitted to pure noise, where a correct procedure returns something nearly flat, and a smooth whose basis dimension is set too low, which cannot reach the truth no matter what the penalty does. The two failure directions, told apart.

[Start Lesson 3: Choosing how wiggly is too wiggly](Choosing-How-Wiggly-Is-Too-Wiggly.html)

### Lesson 4: Estimating a density without assuming one

A histogram's two arbitrary choices, bin width and bin origin, shown changing the apparent shape of the same data, which is the motivation for everything after it. The kernel density estimate built by hand as a sum of little bumps, one per observation, so the kernel and the bandwidth are both visible objects rather than arguments. The bandwidth swept to show that it, and not the choice of kernel, is what matters. Then the boundary problem demonstrated on data bounded at zero, where the estimate quietly leaks probability into impossible values.

[Start Lesson 4: Estimating a density without assuming one](Estimating-a-Density-Without-Assuming-One.html)

### Lesson 5: Modeling the median and the tails

Quantile regression as a different question rather than a robust alternative: not how the mean of the outcome moves, but how the tenth, fiftieth and ninetieth percentiles each move. Fitted with `quantreg` on data whose spread grows with the predictor, so the three fitted lines fan out and you can see what a single mean regression could never have told you. The objective function, an asymmetric absolute loss, written out and minimized by hand at the median to show that it does return the median. When this is the answer a subject-matter question actually wanted.

[Start Lesson 5: Modeling the median and the tails](Modeling-the-Median-and-the-Tails.html)

### Lesson 6: Regression that ignores the outlier

Least squares' sensitivity to one bad point quantified rather than deplored, then repaired by changing the loss. Huber and bisquare objectives plotted beside squared error so you can see where they stop growing, then the iteratively reweighted fit implemented by hand, printing the weights so the down-weighted observation is identifiable. Robust and ordinary fits compared on contaminated and on clean data, which shows the small price paid when there is no outlier and the large gain when there is. Why none of this is a licence to stop looking at influential points.

Lesson 6 is coming soon.

## Who this is for

Anyone who has fitted a straight line to something that was not straight, or reported a mean effect for an outcome whose spread was the interesting part. [Linear Regression, Properly](Linear-Regression-Properly-Course.html) builds the diagnostics this course relaxes, and [Regression Modeling Strategies](Regression-Modeling-Strategies-Course.html) introduces the splines that lesson 2 generalizes; either is useful first, though neither is required. You should be able to fit a model with `lm()`, write a function, and read a coefficient table.

It is also the right course if a residual plot has ever shown obvious curvature and your only tool was to try a log, or if a single stubborn observation has been quietly setting your slope.

## What you will be able to do

- Sweep a smoother's tuning parameter and say what under-smoothing and over-smoothing each cost
- Fit a generalized additive model, plot each smooth term, and read its effective degrees of freedom
- Recognise from the output when a smooth term is telling you the relationship is linear
- Choose smoothness by generalized cross-validation or REML rather than by eye, and show the criterion finding its minimum
- Check a smoother against pure noise and against a basis that is too small, and tell the two failures apart
- Build a kernel density estimate by hand, choose a bandwidth, and spot the boundary problem
- Fit quantile regressions and explain why three fanned lines say something a mean regression cannot
- Implement a robust fit by iteratively reweighted least squares and read the weights it assigns

Ready? [Begin with Lesson 1: Smoothing without smoothing away the signal](Smoothing-Without-Smoothing-Away-the-Signal.html).
