---
title: "Advanced Regression and GLMs in R: A Hands-On Course"
slug: "R-Advanced-Regression-Course"
description: "Learn advanced regression and GLMs in R across thirteen interactive lessons: robust regression, quantile, ridge and lasso, GAMs, count models, and mixed models."
keywords: "advanced regression in R, GLM, robust regression, quantile regression, ridge regression, lasso, elastic net, GAM, mgcv, Poisson regression, negative binomial, mixed models, lme4, interactive course"
mathjax: false
webr: false
date: "2026-07-02"
curriculum_id: "6.130.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Advanced Regression & GLMs (Course)"
sidebar_order: "130"
---

# Advanced Regression and GLMs in R: A Hands-On Course

<p class="lead">Ordinary least squares makes four quiet promises: one straight-line mean, constant spread, bell-shaped noise, and rows that do not talk to each other. Real data breaks all four. This thirteen-lesson interactive course teaches the regression toolkit for when OLS stops being enough, from robust fits and quantile regression to GAMs, count and skewed-outcome models, and mixed models, all built up in R from the ground up. You run live R in the browser at every step.</p>

Most regression training stops at `lm()` and hopes the assumptions hold. They rarely do. A single mistyped row drags the line off course; the spread fans out as the outcome grows; the outcome is a count, a proportion, or a pile of zeros that no straight line was built for; the same patient, store, or school appears in row after row. Each of these is not a nuisance to apologize for. It is a signal that the model you reached for is the wrong shape.

This course teaches you to match the model to the data instead of the other way around. The thread through every lesson is a single question asked again and again: which OLS assumption is this dataset violating, and what is the honest fix? You will relax the assumptions one at a time, see each failure in a live chart, and leave with a model family you can actually defend.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints, and write code as you go. Every term is defined the moment it appears.

## The thirteen lessons

### Lesson 1: Robust Regression with M-Estimators

Squaring the residuals hands one outlier enough leverage to steer the whole fit. Learn why that happens, then use M-estimators (Huber, Tukey) to down-weight bad rows instead of deleting them, and read the per-row weights `rlm()` assigns.

[Start Lesson 1: Robust Regression with M-Estimators](Robust-Regression-M-Estimators.html)

### Lesson 2: Robust Regression, MM-Estimation and Breakdown

How much contamination can a fit survive before it lies? Learn the breakdown point, why M-estimators alone are not enough against high-leverage outliers, and how MM-estimation with `lmrob()` buys both robustness and efficiency.

[Start Lesson 2: Robust Regression, MM-Estimation and Breakdown](Robust-Regression-MM-and-Breakdown.html)

### Lesson 3: Quantile Regression

The mean is one summary of a relationship, and often the least interesting one. Learn to model the median and the tails directly with `rq()`, so you can see how the whole distribution of the outcome, not just its average, shifts with a predictor.

[Start Lesson 3: Quantile Regression](Quantile-Regression.html)

### Lesson 4: Ridge Regression and Shrinkage

When predictors are many or correlated, unbiased coefficients can be wildly unstable. Learn how ridge trades a little bias for a large drop in variance by shrinking coefficients toward zero, and when that trade is worth making.

[Start Lesson 4: Ridge Regression and Shrinkage](Ridge-Regression-and-Shrinkage.html)

### Lesson 5: Lasso and Elastic Net

Ridge shrinks; lasso shrinks and selects. Learn how the L1 penalty drives coefficients exactly to zero, read the coefficient path as the penalty tightens, and reach for elastic net when predictors travel in correlated groups.

[Start Lesson 5: Lasso and Elastic Net](Lasso-and-Elastic-Net.html)

### Lesson 6: GAMs, Splines and Smooths

Not every relationship is a straight line, and guessing the curve by hand is a losing game. Learn how a generalized additive model lets penalized splines in `mgcv` find the smooth shape the data supports, without you specifying it up front.

[Start Lesson 6: GAMs, Splines and Smooths](GAMs-Splines-and-Smooths.html)

### Lesson 7: GAMs, Choosing the Right Smoothness

A smooth that wiggles too much memorizes noise; one that is too stiff misses the signal. Learn the wiggliness penalty, how `k` sets the ceiling on flexibility, what concurvity does to your terms, and how to read `gam.check()`.

[Start Lesson 7: GAMs, Choosing the Right Smoothness](GAMs-Choosing-Smoothness.html)

### Lesson 8: Count Models, Poisson and Negative Binomial

Counts are not continuous and their spread grows with their mean, so OLS gives nonsense like negative predicted counts. Learn Poisson regression, spot the overdispersion that breaks it, and switch to the negative binomial when the variance runs hot.

[Start Lesson 8: Count Models, Poisson and Negative Binomial](Count-Models-Poisson-and-Negative-Binomial.html)

### Lesson 9: Zero-Inflated and Hurdle Models

Sometimes the zeros come from two different stories: people who could never have the event and people who simply did not this time. Learn when a pile of extra zeros needs a two-part zero-inflated or hurdle model, and how to tell the two apart.

[Start Lesson 9: Zero-Inflated and Hurdle Models](Zero-Inflated-and-Hurdle-Models.html)

### Lesson 10: Gamma and Tweedie Regression

Costs, times and claim sizes are positive and right-skewed, and forcing a symmetric model onto them fits badly. Learn gamma regression for skewed positive outcomes and the Tweedie family for insurance-style data that mixes exact zeros with positive amounts.

[Start Lesson 10: Gamma and Tweedie Regression](Gamma-and-Tweedie-Regression.html)

### Lesson 11: Beta and Ordinal Regression

Proportions live inside 0 and 1, and ordered ratings are categories with a direction, so neither belongs in a plain linear model. Learn beta regression for rates and fractions, and proportional-odds models for ordered categories like ratings and grades.

[Start Lesson 11: Beta and Ordinal Regression](Beta-and-Ordinal-Regression.html)

### Lesson 12: Mixed Models, Random Intercepts

When rows are grouped by patient, store or school, treating them as independent overstates your certainty. Learn random intercepts and partial pooling with `lme4`, and read the intraclass correlation that tells you how much the grouping matters.

[Start Lesson 12: Mixed Models, Random Intercepts](Mixed-Models-Random-Intercepts.html)

### Lesson 13: Mixed Models, Random Slopes and GLMMs

Groups can differ not just in their baseline but in how strongly a predictor acts on them. Learn random slopes, extend to generalized linear mixed models for non-Gaussian outcomes, and troubleshoot the convergence warnings these models are famous for.

[Start Lesson 13: Mixed Models, Random Slopes and GLMMs](Mixed-Models-Random-Slopes-and-GLMMs.html)

### Section quiz: check what stuck

Ten graded questions across the whole toolkit, robust and quantile methods, shrinkage, GAMs, count and zero-inflated models, Gamma and Tweedie, beta and ordinal, and mixed models, plus two live R snippets you can run. A quick way to find the ideas worth a second pass before you move on.

[Take the Advanced Regression and GLMs quiz](Advanced-Regression-Quiz.html)

## Who this is for

You can fit and read a linear regression with `lm()`, and you know a residual is the gap between actual and predicted. That is the whole prerequisite. Every advanced idea, from breakdown points to random slopes, is built from scratch as it arrives. It pairs naturally with the Regression and Statistics material on the Data Scientist path, but nothing beyond a first regression course is assumed. If you have ever shipped an `lm()` fit while quietly worrying that its assumptions did not hold, this course is for you.

## What you will be able to do

- Diagnose which OLS assumption a dataset violates, and choose the regression family that fixes it
- Fit robust regressions that survive outliers and high-leverage points instead of being steered by them
- Model the median, the tails, and shrunken or selected coefficients with quantile, ridge, lasso and elastic net
- Let a GAM find a nonlinear shape for you, and tune its smoothness without overfitting
- Handle counts, excess zeros, skewed positive outcomes, proportions and ordered categories with the right GLM
- Fit mixed models with random intercepts and slopes for grouped data, and read what the grouping is telling you

Ready? [Begin with Lesson 1](Robust-Regression-M-Estimators.html).
