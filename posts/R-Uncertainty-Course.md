---
title: "Uncertainty Quantification in R: A Course"
slug: "R-Uncertainty-Course"
description: "Seven interactive R lessons on turning a point prediction into an honest range: prediction intervals, split and classification conformal, quantile regression, calibration, the bootstrap and jackknife+."
keywords: "uncertainty quantification in R, prediction interval, confidence interval, coverage, split conformal prediction, conformalized quantile regression, prediction sets, quantile regression, pinball loss, distributional regression, calibration, reliability diagram, ECE, Brier score, Platt scaling, isotonic regression, bootstrap, jackknife plus, aleatoric, epistemic, interactive course"
mathjax: false
webr: false
date: "2026-07-08"
curriculum_id: "6.210.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Uncertainty Quantification (Course)"
sidebar_order: "210"
---

# Uncertainty Quantification in R: A Course

<p class="lead">A model hands you one number, but almost nothing in the real world lands exactly on it: a flat rarely sells for its predicted price, a "90% chance of rain" morning does not always rain. This seven-lesson interactive course turns a single guess into an honest range you can defend, a prediction with a coverage promise, and teaches when that promise can be certified rather than merely hoped for. Prediction intervals, split and classification conformal, quantile and distributional regression, calibration, and the bootstrap and jackknife+, each built in R with live diagrams you steer as you learn.</p>

Most of machine learning is about the best guess. This course is about everything the guess leaves out: how wrong it could be, how sure you are, and how to say so without either overselling your certainty or hiding behind a range so wide it informs no one. The trouble is that the tidy textbook interval quietly breaks the moment its assumptions crack, under-covering exactly the high-stakes cases. So the course builds a toolbox of methods that make honesty checkable, and in several cases guaranteed, then closes with the judgment to carry an uncertain number into a real decision.

This is the uncertainty stop on the advanced Data Scientist path. Every runnable example is plain base R (with `quantreg` where quantile regression needs it), built up so you watch each interval take shape rather than trusting a black-box function: held-out misses becoming a conformal band, a pinball loss aiming a line at a percentile, resampled medians forming a sampling distribution. Every lesson is a guided, interactive experience: you steer live charts in the browser, answer checkpoints, and write and run R as you go. Every term is defined the moment it appears. The first lesson is free to try; the rest unlock with a subscription.

## The seven lessons

### Lesson 1: Prediction Intervals You Can Trust

Start with the distinction the whole topic turns on: a confidence interval is about the average outcome and shrinks with data, while a prediction interval is about one new outcome and stays wide because it carries a single case's irreducible scatter. Read a 90% interval out of an `lm` model, learn exactly what "90%" promises, and watch the textbook interval quietly under-cover the very cases that matter most.

[Start Lesson 1: Prediction Intervals You Can Trust](Prediction-Intervals-You-Can-Trust.html)

### Lesson 2: Split Conformal Prediction

Stop betting on the errors and start guaranteeing coverage. Hold out a calibration set, score each miss, take a single quantile as the band's half-width, and wrap it around any model, even a wildly overfit one. The result is distribution-free and finite-sample: coverage holds at or above your target whatever the errors look like, as long as new cases stay exchangeable.

[Start Lesson 2: Split Conformal Prediction](Split-Conformal-Prediction.html)

### Lesson 3: Conformal Prediction for Classification

Make conformal adapt. First let the band's width follow the data with conformalized quantile regression, so it stretches over the uncertain cases and equalizes coverage across subgroups. Then carry the idea to classification, where the answer becomes a prediction set that stays a single label when the model is confident and grows only when it genuinely hesitates, fixed per class with Mondrian calibration.

[Start Lesson 3: Conformal Prediction for Classification](Conformal-Prediction-for-Classification.html)

### Lesson 4: Quantile and Distributional Regression

Model the whole spread, not just the average. The pinball loss aims a line at any percentile by penalizing too-low and too-high misses unequally, so a pair of lines becomes a band whose width breathes with the input. Fit a dense grid of quantiles and you hold the entire conditional distribution, from which any interval, the spread, or a tail probability is a single lookup.

[Start Lesson 4: Quantile and Distributional Regression](Quantile-and-Distributional-Regression.html)

### Lesson 5: Calibration, Reliability and Recalibration

Put a model's probabilities on trial. A probability is calibrated when, of all the times you say a number, that fraction come true; a reliability diagram shows the promise kept or broken, and ECE and the Brier score put a number on it. See why a high AUC never certifies honesty, then repair an over-confident model with Platt scaling and isotonic regression, on a held-out set, while its ranking power stays identical.

[Start Lesson 5: Calibration, Reliability and Recalibration](Calibration-Reliability-and-Recalibration.html)

### Lesson 6: The Bootstrap and the Jackknife+

Get uncertainty from resampling alone, assuming almost nothing. Resample one dataset with replacement to build a standard error and a percentile interval for any statistic, even the median, where no formula exists. Then turn leave-one-out residuals into a jackknife+ prediction interval that wastes no data and carries its own coverage guarantee, and see exactly where resampling breaks.

[Start Lesson 6: The Bootstrap and the Jackknife+](The-Bootstrap-and-Jackknife-Plus.html)

### Lesson 7: Reporting Uncertainty Honestly

Carry an uncertain number into a decision. Separate aleatoric uncertainty (the world's irreducible noise) from epistemic uncertainty (what more data could still teach you), match the interval to the question, weigh the lopsided cost of over- versus under-covering with the critical fractile, and state a result without false precision: a point, a range, its meaning, and its assumptions.

[Start Lesson 7: Reporting Uncertainty Honestly](Reporting-Uncertainty-Honestly.html)

### Section quiz: check what stuck

Eight graded questions across the whole section, prediction versus confidence intervals, split conformal coverage, prediction sets, the pinball loss, calibration and recalibration, the bootstrap percentile interval and the jackknife+, and aleatoric versus epistemic uncertainty, plus two live R snippets you can run. A quick way to find the ideas worth a second pass before you move on.

[Take the Uncertainty Quantification quiz](Uncertainty-Quantification-Quiz.html)

## Who this is for

You can run R and read its output, and you are comfortable with the basics of regression and probability: fitting a line with `lm()`, reading a residual, and thinking about a distribution and its quantiles. No prior background in conformal prediction or calibration is assumed, and because every method is built from scratch, you see exactly what each interval is measuring rather than trusting a package default. Data scientists, analysts and ML engineers who must attach a defensible range to a forecast, a price, a risk score, or a probability will get the most out of this, as will anyone who has been burned by an interval that promised 90% and delivered less.

## What you will be able to do

- Tell a confidence interval from a prediction interval, say what a stated coverage promises, and test whether an interval keeps it with empirical coverage
- Build a split conformal band whose coverage is guaranteed, distribution-free and for any model, and know why the held-out calibration set is load-bearing
- Make coverage adapt with conformalized quantile regression, and return a prediction set that grows only when a classifier is genuinely unsure
- Fit conditional quantiles with the pinball loss and read any interval, the spread, or a tail probability off a whole estimated distribution
- Diagnose miscalibration with a reliability diagram, ECE and the Brier score, and repair it with Platt scaling or isotonic regression without touching the ranking
- Get a standard error and a percentile interval for any statistic with the bootstrap, and a guaranteed prediction interval on small data with the jackknife+
- Separate aleatoric from epistemic uncertainty, match the tool to the decision, and report a number without false precision

Ready? [Begin with Lesson 1: Prediction Intervals You Can Trust](Prediction-Intervals-You-Can-Trust.html). It is free to try.
