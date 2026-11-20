---
title: "Regression Modeling Strategies in R: An Interactive Course"
slug: "Regression-Modeling-Strategies-Course"
description: "Learn to build a regression model that validates across seven interactive lessons: why stepwise selection lies, restricted cubic splines, pre-specified interactions, ridge and lasso, bootstrap optimism, events per variable, and presenting a model that survives review."
keywords: "regression modeling strategies in R, stepwise selection bias, restricted cubic splines in R, rcs in R, ridge regression in R, lasso in R, glmnet, cross validation in R, bootstrap optimism, model validation in R, events per variable, calibration curve in R, nomogram in R"
mathjax: true
webr: false
date: "2026-11-19"
curriculum_id: "4.70.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Regression Modeling Strategies (Course)"
sidebar_order: "38"
---

# Regression Modeling Strategies in R: A Hands-On Interactive Course

<p class="lead">A model that fits the data you have is easy. A model that still works on the data you do not have is a different craft, and almost every habit that makes the first one look good makes the second one worse. This seven-lesson interactive course is about that gap, and about measuring it rather than hoping about it.</p>

It opens with a demonstration rather than a warning. Stepwise selection is run on a dataset where every single predictor is pure noise, and it reliably returns a model with several significant predictors and a respectable R-squared. Nothing is wrong with the code. The problem is that the p-values are computed as though no search took place, so they are wrong by construction, and the coefficients that survived were selected precisely for being large.

Everything after that follows from taking the demonstration seriously. If you cannot find your model by searching, you choose predictors on subject-matter grounds and spend the degrees of freedom you have on the ones you kept. You fit a curve with splines rather than hunting for a transformation. You pre-specify the interactions you will test, because ten predictors offer forty-five two-way interactions and testing all of them guarantees findings.

The through-line is honesty about optimism. The number from the data you fitted on is always too good, and the last third of the course is about measuring by how much: bootstrap optimism computed by hand, cross-validation agreeing with it, and calibration introduced as the thing that breaks first and gets reported least.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Why stepwise selection lies to you

Stepwise selection run on data where every predictor is pure noise, which reliably returns a model with several significant predictors and a respectable R-squared. That demonstration is the lesson. Then why it happens, stated precisely: the p-values reported after a search are computed as though no search occurred, so they are wrong by construction, and the coefficients that survive are biased away from zero because they were selected for being large. What to do instead, which is to choose predictors on subject-matter grounds and spend the degrees of freedom you have on the ones you kept.

[Start Lesson 1: Why stepwise selection lies to you](Why-Stepwise-Selection-Lies-to-You.html)

### Lesson 2: Fitting a curve without guessing its shape

Restricted cubic splines explained as what they are: a few fixed basis columns added to an ordinary linear model, so the fit stays an `lm()` and every tool from the previous course still applies. The basis matrix printed and plotted so it stops being magic, knots placed at quantiles as the default that needs no tuning, and the restriction at the tails motivated by showing an unrestricted polynomial going wild outside the data. Three, four and five knots compared, with the honest finding that the choice rarely matters much.

[Start Lesson 2: Fitting a curve without guessing its shape](Fitting-a-Curve-Without-Guessing-Its-Shape.html)

### Lesson 3: Choosing interactions before you look

The combinatorial problem stated plainly: ten predictors offer forty-five two-way interactions, and testing all of them guarantees findings. So interactions get chosen the way predictors do, from subject-matter reasoning. Three real cases where an interaction was predicted in advance, and one where a tempting one should be refused. The degrees-of-freedom accounting made explicit, and the pre-specified interaction test contrasted with the same test found by searching, on identical data, so the difference in what the p-value means is visible.

[Start Lesson 3: Choosing interactions before you look](Choosing-Interactions-Before-You-Look.html)

### Lesson 4: Paying a penalty to get a better model

Ridge and lasso introduced as the bias-variance trade applied to coefficients: accept some bias, buy a large reduction in variance, come out ahead on prediction error. The penalty path computed and plotted so you watch coefficients shrink toward zero as the penalty grows, lasso's ability to reach exactly zero contrasted with ridge's inability, and the penalty chosen by cross-validation rather than by eye. The cost named honestly: a penalized coefficient is no longer an unbiased estimate of anything, so inference on it needs care.

[Start Lesson 4: Paying a penalty to get a better model](Paying-a-Penalty-to-Get-a-Better-Model.html)

### Lesson 5: Measuring how optimistic your model is

The number from the data you fitted on is always too good, and this lesson measures by how much rather than warning about it. Apparent R-squared compared with a bootstrap-optimism estimate computed by hand: resample, refit, score on the original data, average the gap. Cross-validation run on the same model for comparison, with the two agreeing. Then the point that makes it matter: the optimism is large exactly when the model was selected or tuned on the same data, which ties straight back to lesson 1.

[Start Lesson 5: Measuring how optimistic your model is](Measuring-How-Optimistic-Your-Model-Is.html)

### Lesson 6: How many events per variable you can afford

A sample-size rule derived rather than quoted. Models fitted at descending events-per-variable ratios on simulated data with a known truth, with coefficient bias, interval coverage and calibration all degrading together, so you see where a model stops being trustworthy and why the familiar rule of thumb sits where it does. Calibration introduced here as the thing that breaks first and is reported least: a model can rank cases well and still give predicted probabilities that are systematically too extreme.

[Start Lesson 6: How many events per variable you can afford](How-Many-Events-per-Variable-You-Can-Afford.html)

### Lesson 7: Presenting a model so it survives review

The write-up, but for a model rather than a single estimate. One fitted model presented four ways: a coefficient table, partial-effect plots across each predictor's range, a nomogram, and a plain-language paragraph. What belongs in each, which numbers a reviewer will ask for and should already be there, meaning the validation estimate, the calibration, the handling of missing data and the pre-specification, and the sentence to write about a predictor whose effect the data could not pin down.

Lesson 7 is coming soon.

## Who this is for

Anyone who builds regression models that other people will rely on, and wants them to hold up when someone checks. [Linear Regression, Properly](Linear-Regression-Properly-Course.html) builds the diagnostics and interpretation this course assumes, and is the natural one to take first. You should be able to fit a model with `lm()`, write a function, and use `replicate()` and `sample()`.

It is also the right course if you have ever been asked how your model was selected, or how it would perform on new data, and did not have a number to give.

## What you will be able to do

- Show, by simulation, why a model found by searching reports p-values that cannot be believed
- Choose predictors on subject-matter grounds and account for the degrees of freedom you spend
- Fit a nonlinear relationship with restricted cubic splines and explain why the knot count rarely matters
- Pre-specify interactions and explain why a searched interaction means something different
- Apply ridge and lasso, choose the penalty by cross-validation, and state what shrinkage costs you
- Estimate a model's optimism by bootstrap and confirm it against cross-validation
- Judge whether your sample supports the model you want, using events per variable and calibration
- Present a model with the validation, calibration and pre-specification a reviewer will ask for

Ready? [Begin with Lesson 1: Why stepwise selection lies to you](Why-Stepwise-Selection-Lies-to-You.html).
