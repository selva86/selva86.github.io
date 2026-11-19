---
title: "Linear Regression Properly in R: An Interactive Course"
slug: "Linear-Regression-Properly-Course"
description: "Learn multiple regression in R across eight interactive lessons: what holding other variables constant really means, the five assumptions ranked by what they cost, collinearity, robust and weighted standard errors, influential points, transformations, and predictions people understand."
keywords: "multiple regression in R, lm in R, holding other variables constant, regression assumptions in R, collinearity in R, variance inflation factor in R, VIF in R, robust standard errors in R, weighted least squares in R, Cook's distance in R, leverage and influence, log transformation regression, prediction interval in R"
mathjax: true
webr: false
date: "2026-11-18"
curriculum_id: "4.60.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Linear Regression Properly (Course)"
sidebar_order: "37"
---

# Linear Regression Properly in R: A Hands-On Interactive Course

<p class="lead">Almost everyone can fit a multiple regression, and almost every write-up of one contains the phrase "holding the other variables constant", which is rarely explained and often wrong. This eight-lesson interactive course takes the fitting for granted and spends its whole length on the harder half: what the coefficients mean, which assumptions actually cost you something when they fail, and what to hand a reader at the end.</p>

The first lesson makes the famous phrase literal. A coefficient is recovered twice from the same data, once from the full fit and once by regressing the outcome on what is left of one predictor after the others have been accounted for, because that second route is what "holding constant" is doing arithmetically. The consequence people miss arrives immediately after: a coefficient changes when a correlated variable joins the model, and neither value is wrong, because they answer different questions.

From there the course works through the things that go wrong, and insists on measuring each one rather than warning about it. The five assumptions are violated on purpose and ranked by what the violation actually costs, which turns out to differ enormously between them. Collinearity is shown making coefficients imprecise without making the model wrong. An influential point is told apart from a high-leverage one and from a large residual, three things most treatments blur together.

The through-line is that a regression is a set of claims, and every one of these claims can be checked by simulation on data whose truth you control. So instead of being told that non-normal residuals are usually harmless and dependence is not, you break each assumption yourself and read the damage off a coverage count.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: What holding other variables constant really means

The phrase every multiple regression is explained with, made literal. A coefficient recovered two ways on the same data: once from the full fit, and once by regressing the outcome on the residuals of one predictor after the others, which is what "holding constant" is doing arithmetically. Then the consequence people miss: the coefficient on a variable changes when you add a correlated one, and neither value is wrong, because they answer different questions. Simpson's paradox on a small dataset as the version that changes sign.

[Start Lesson 1: What holding other variables constant really means](What-Holding-Other-Variables-Constant-Really-Means.html)

### Lesson 2: The five assumptions, ranked by what they cost

Linearity, independence, equal variance, normal residuals and no influential outliers, each violated on purpose by simulation with the damage measured in interval coverage rather than described. The ranking is the lesson: dependence is catastrophic, non-constant variance is serious for intervals and harmless for the fit, non-normal residuals are nearly free at moderate sample sizes, and the whole exercise is what makes a diagnostic plot worth reading. Why a significance test for an assumption is a poor decision rule, since it answers a question about sample size as much as about the assumption.

[Start Lesson 2: The five assumptions, ranked by what they cost](The-Five-Assumptions-Ranked-by-What-They-Cost.html)

### Lesson 3: Diagnosing collinearity without panicking

The variance inflation factor built from its definition, by regressing each predictor on the others, so VIF becomes a quantity rather than a threshold. Two correlated predictors introduced gradually, with the coefficient estimates jumping around while the fitted values and the predictions stay stable, which is exactly what collinearity does: it makes individual coefficients imprecise without making the model wrong. Why the interval already told you this, why dropping a variable to fix VIF usually changes the question, and the cases that genuinely need action.

[Start Lesson 3: Diagnosing collinearity without panicking](Diagnosing-Collinearity-Without-Panicking.html)

### Lesson 4: Robust standard errors, and when they are not enough

Heteroskedasticity simulated so the damage is a coverage count rather than a worry: the fit stays unbiased, the default standard error does not. Sandwich estimators built from the formula and checked against `sandwich`, with coverage restored. Then the case that matters more and is treated as the same problem far too often: clustered data, where heteroskedasticity-robust standard errors do not help and cluster-robust ones do, followed by the small-number-of-clusters case where even those are optimistic. The decision rule at the end is earned by the three simulations above it.

[Start Lesson 4: Robust standard errors, and when they are not enough](Robust-Standard-Errors-and-When-They-Are-Not-Enough.html)

### Lesson 5: Weighting observations that deserve less say

Weighted least squares as the answer when you know the variance structure instead of merely suspecting it, worked on data where each row is a group mean of known size, so the correct weights are available and the improvement over ordinary least squares is measurable. The estimator derived as minimising a weighted sum of squares, implemented by hand, then by `lm(weights=)`. Generalised least squares introduced as the same move for correlated errors, and the honest warning: made-up weights are worse than no weights, because they shift the estimate as well as the standard error.

Lesson 5 is coming soon.

### Lesson 6: The one point carrying your regression

Leverage, residual and influence told apart, which most treatments blur. A point far out in x has leverage and may be harmless; a point with a big residual may have no influence; influence is the product, and Cook's distance is how you measure it. Built by refitting the model once per row with that row dropped and plotting how much the coefficient moves, so you see that leave-one-out influence is literally what the statistic approximates. What to do about an influential point, which is almost never to delete it silently.

Lesson 6 is coming soon.

### Lesson 7: Transformations that earn their keep

A log, a square root and a reciprocal applied to the same skewed outcome, with the diagnostic improvement and the interpretability cost both shown, because a transformation that fixes a residual plot and makes the coefficient unexplainable is rarely a good trade. The log-log model's coefficient read as an elasticity and the log-linear model's as a percentage change, both derived rather than asserted. Then the trap: the mean of a log is not the log of the mean, so back-transforming a prediction understates it, and the correction is shown.

Lesson 7 is coming soon.

### Lesson 8: From coefficients to predictions people understand

The last mile of a regression. A fitted model turned into the three things a reader actually wants: a predicted value with an interval, a marginal effect at a meaningful covariate setting, and a plot of the predicted outcome across the range of one predictor with the rest held fixed. The confidence interval for a mean set against the prediction interval for a new observation, with the reason the second is much wider derived from the variance it includes.

Lesson 8 is coming soon.

## Who this is for

Anyone who fits regressions and writes them up, and wants the write-up to survive a careful reader. Hypothesis testing and intervals are built from scratch in [Confidence Intervals and P-Values](Confidence-Intervals-and-P-Values-Course.html), and group comparisons in [ANOVA and Multiple Comparisons](ANOVA-and-Multiple-Comparisons-Course.html); either is useful first, neither is required. You should be able to run R, write a function, and fit a model with `lm()`. Everything here runs on base R, with one optional package named where it helps.

It is also the right course if a reviewer has ever questioned a standard error, asked about influential observations, or pointed at a residual plot, and you were not sure how much any of it actually mattered.

## What you will be able to do

- Say precisely what "holding the other variables constant" does arithmetically, and recover a coefficient two ways to prove it
- Explain why a coefficient changes when a correlated predictor is added, without calling either value wrong
- Rank the regression assumptions by what a violation actually costs, measured in coverage rather than asserted
- Read a diagnostic plot knowing which departures matter and which are nearly free
- Compute a variance inflation factor from its definition, and decide when collinearity needs action and when it needs none
- Choose between classical, robust and cluster-robust standard errors, and say what each one assumes
- Tell leverage, residual and influence apart, and handle an influential point defensibly
- Choose a transformation that improves the fit without destroying the interpretation, and back-transform a prediction correctly
- Report a prediction with the right interval, and explain why a prediction interval is wider than a confidence interval

Ready? [Begin with Lesson 1: What holding other variables constant really means](What-Holding-Other-Variables-Constant-Really-Means.html).
