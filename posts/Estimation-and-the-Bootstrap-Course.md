---
title: "Estimation and the Bootstrap in R: An Interactive Course"
slug: "Estimation-and-the-Bootstrap-Course"
description: "Learn statistical estimation in R across seven interactive lessons: bias and variance, maximum likelihood, the method of moments, Fisher information, bootstrap confidence intervals, the jackknife, and the delta method."
keywords: "estimation in R, maximum likelihood in R, method of moments, bias variance tradeoff, mean squared error, Fisher information, Cramer-Rao bound, bootstrap confidence interval in R, BCa interval, jackknife in R, delta method standard error"
mathjax: true
webr: false
date: "2026-11-16"
curriculum_id: "4.20.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Estimation & the Bootstrap (Course)"
sidebar_order: "33"
---

# Estimation and the Bootstrap in R: A Hands-On Interactive Course

<p class="lead">Every analysis ends with a number you did not know before: a rate, a mean, a proportion, a parameter of a model. This seven-lesson interactive course is about where that number comes from, how to choose between two ways of producing it, and how to say honestly how wrong it might be.</p>

The previous course established that a statistic computed from a sample has a distribution of its own. This one puts that to work. You will build estimates three different ways, score rival estimators against each other on the same data, read a standard error off the shape of a likelihood curve, and put an interval around a statistic that has no formula for its standard error at all.

The through-line is that an estimate without a sense of its own error is not yet a result. Each method here is introduced by doing it the slow, visible way first, so the closed form arrives as a shortcut for something you have already done by hand rather than as a rule to memorise.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Bias, variance, and the cost of an estimator

What makes one estimator better than another, made concrete by putting two competing estimators of the same quantity side by side and scoring both. Bias as the gap between an estimator's long-run average and the truth, variance as how much it moves from sample to sample, and mean squared error as the sum that trades them against each other. Then the uncomfortable result, shown rather than asserted: a biased estimator can beat an unbiased one, and that is not a paradox.

[Start Lesson 1: Bias, variance, and the cost of an estimator](Bias-Variance-and-the-Cost-of-an-Estimator.html)

### Lesson 2: Maximum likelihood, from the curve up

Maximum likelihood as a picture instead of a formula handed down. Every candidate value of the parameter is scored by how well it explains the data in hand, those scores form a curve, and the estimate is its peak. You find that peak three ways that agree: by eye, by grid search, and with `optimise()`. The closed form falls out at the end as a shortcut for a thing you have already done the slow way, which is the only order that makes it memorable.

[Start Lesson 2: Maximum likelihood, from the curve up](Maximum-Likelihood-from-the-Curve-Up.html)

### Lesson 3: Matching moments to estimate a parameter

The method of moments: set the sample mean equal to the distribution's own mean, solve, done. Worked for a Poisson, an exponential and a gamma, where it is quick and needs no optimiser at all. Then the comparison that matters. On the same data, see exactly where the method of moments and maximum likelihood agree, where they part company, and why the moment estimator is the one that falls apart first when the model is slightly wrong.

[Start Lesson 3: Matching moments to estimate a parameter](Matching-Moments-to-Estimate-a-Parameter.html)

### Lesson 4: How much information a sample carries

Fisher information as a reading of the same likelihood curve from Lesson 2: how sharply it falls away from its peak. A sharp peak means nearby values are firmly ruled out and the standard error is small; a flat one means the data barely tell them apart. You compute the information by differentiating twice, numerically and then in closed form, and meet the Cramer-Rao bound as what it actually is, a floor no unbiased estimator can get under, checked by simulation against one that reaches it.

Lesson 4 is coming soon.

### Lesson 5: Two bootstrap intervals, and when they differ

The percentile bootstrap and the BCa interval computed on the same resamples, so the difference is visible rather than described. Why the percentile interval is biased when the statistic's sampling distribution is skewed, what the bias correction and acceleration terms are correcting, and the honest finding that at very small samples neither interval is close to its nominal coverage. The coverage check that proves it is included, rather than a reassurance that it is fine.

Lesson 5 is coming soon.

### Lesson 6: Estimating error by leaving one out

The jackknife: recompute the statistic n times, each time with one observation removed, and read the spread of those values as a standard error. Built by hand in base R, set against the bootstrap on the same data, and then used for the thing it is still genuinely best at, which is spotting the single observation carrying an estimate. Where it fails, on medians and other non-smooth statistics, is shown rather than listed.

Lesson 6 is coming soon.

### Lesson 7: Standard errors for transformed estimates

The delta method: once you have a standard error for an estimate, how to get one for a function of that estimate without starting over. The rule is that the standard error gets multiplied by the absolute slope of the transformation, derived here from a one-term Taylor expansion and then checked against a bootstrap on the same data. The worked cases are the ones researchers actually hit, turning a rate into a mean and an odds into a probability, where the interval has to be transformed rather than its endpoints recomputed.

Lesson 7 is coming soon.

## Who this is for

Anyone comfortable with the idea that a statistic has a sampling distribution, which is exactly what the [Probability and Estimation course](Probability-and-Estimation-Course.html) builds from scratch. You should be able to run R, write a function, and use `replicate()`. No calculus is assumed: the two lessons that differentiate do it numerically first, so you can see what the derivative is measuring before any symbol appears.

It is also the right course if you have been reporting estimates with standard errors taken from whatever `summary()` printed, and want to know where those numbers come from and when to distrust them.

## What you will be able to do

- Score two estimators of the same quantity against each other on bias, variance and mean squared error
- Explain why a biased estimator sometimes wins, with a worked case rather than an assertion
- Find a maximum likelihood estimate by eye, by grid search and by optimiser, and recognise when the closed form applies
- Fit a distribution by matching moments, and say when that answer will differ from the likelihood one
- Read a standard error off the curvature of a likelihood curve, and check it against the Cramer-Rao floor
- Build percentile and BCa bootstrap intervals, and test their actual coverage instead of trusting the label
- Use the jackknife to find the observation that is carrying an estimate
- Transform a standard error through a function with the delta method, and verify it against a bootstrap

Ready? [Begin with Lesson 1: Bias, variance, and the cost of an estimator](Bias-Variance-and-the-Cost-of-an-Estimator.html).
