---
title: "Confidence Intervals and P-Values in R: An Interactive Course"
slug: "Confidence-Intervals-and-P-Values-Course"
description: "Learn statistical inference in R across six interactive lessons: what a confidence interval promises, what a p-value is and is not, permutation tests, measuring interval coverage, robust and clustered standard errors, and reporting uncertainty honestly."
keywords: "confidence interval in R, p-value in R, interval coverage simulation, permutation test in R, simulation based inference, robust standard errors in R, cluster robust standard errors, heteroskedasticity, reporting statistical results, misinterpreting p-values"
mathjax: true
webr: false
date: "2026-11-17"
curriculum_id: "4.30.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Confidence Intervals & P-Values (Course)"
sidebar_order: "34"
---

# Confidence Intervals and P-Values in R: A Hands-On Interactive Course

<p class="lead">Two numbers carry almost every quantitative claim ever published, and both are routinely described in ways their own definitions do not support. This six-lesson interactive course rebuilds the confidence interval and the p-value from the ground up, so that what each one promises becomes a thing you can count rather than a phrase you repeat.</p>

The previous course produced estimates and standard errors. This one is about what you are entitled to say once you have them. You will draw sixty intervals from sixty samples and count how many contain the truth, simulate a null distribution before the word p-value is used, shuffle group labels to get a p-value where no formula exists, and measure the real coverage of interval recipes whose labels claim 95%.

The through-line is that every one of these quantities is a statement about a procedure repeated many times, not about the single result in front of you. Once that distinction is concrete rather than verbal, the common misreadings stop being rules to memorise and start being obviously wrong.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: What a confidence interval promises

What the 95% is actually attached to. Not this interval, but the procedure that produced it, and the gap between those two readings is the single most common misreading in applied statistics. Sixty intervals from sixty samples are drawn against a known true value, so the promise becomes a count you can check rather than a claim you accept. Then the three sentences people write about an interval, with the one that survives a referee separated from the two that do not.

[Start Lesson 1: What a confidence interval promises](What-a-Confidence-Interval-Promises.html)

### Lesson 2: What a p-value is and is not

A p-value built from scratch as a tail area under a null distribution you simulate yourself, before the term is introduced. Then, carefully, what it does not mean: not the probability the null is true, not the probability the result was luck, not a measure of how big the effect is, and not something that grows more convincing without limit as it shrinks. Each misreading is shown failing on a concrete number instead of being forbidden.

[Start Lesson 2: What a p-value is and is not](What-a-P-Value-Is-and-Is-Not.html)

### Lesson 3: Inference by simulation instead of formula

Permutation tests and simulation-based inference: shuffle the labels, recompute the statistic, repeat, and read the p-value off the result. The payoff is that this works when no formula exists for your statistic, so you test a difference in medians and a difference in trimmed means, neither of which has a convenient table. Set against the t-test on the same data, it shows where the two agree and where the formula's assumptions were quietly doing work the shuffle never needed.

[Start Lesson 3: Inference by simulation instead of formula](Inference-by-Simulation-Instead-of-Formula.html)

### Lesson 4: Checking that your intervals actually cover

Coverage as something you measure rather than assume. Build an interval recipe, run it a few thousand times against a known truth, count how often it contains that truth, and compare the result with what the label claims. The recipes that fail are the interesting part: the z interval on a skewed population at small n, and the percentile bootstrap at n = 5, both visibly overconfident. The real subject is the habit, because a broken assumption is invisible inside any single interval.

[Start Lesson 4: Checking that your intervals actually cover](Checking-That-Your-Intervals-Actually-Cover.html)

### Lesson 5: Standard errors you can trust

When the default standard error is wrong, and what to do about it. Three cases, each simulated so the damage is measured rather than asserted: unequal variance, where robust standard errors fix it; clustered data, where they do not and a cluster-robust estimator is needed; and the small-cluster case, where even that is optimistic. The decision rule at the end is short, and it is earned by the simulations above it instead of handed down as advice.

[Start Lesson 5: Standard errors you can trust](Standard-Errors-You-Can-Trust.html)

### Lesson 6: Reporting uncertainty without overclaiming

The write-up. One result reported four ways, from a bare claim of significance to an estimate with an interval and a stated assumption, and the demonstration that all four describe the same analysis. Which numbers belong in a sentence, how to phrase an interval so a careful reader cannot misread it, what to say about a result that did not reach significance without pretending it did or pretending it is nothing, and the sentence to write when the assumption behind your interval is one you could not check.

Lesson 6 is coming soon.

## Who this is for

Anyone who can produce an estimate and a standard error and wants to know what may honestly be said about them. The [Estimation and the Bootstrap course](Estimation-and-the-Bootstrap-Course.html) builds those tools from scratch if you want them first. You should be able to run R, write a function, and use `replicate()` and `sample()`. Everything here runs on base R, so there is nothing to install.

It is also the right course if you have been asked by a reviewer to justify an interval or defend a p-value and found that the standard phrases did not survive the question.

## What you will be able to do

- State what a 95% confidence interval promises, and say precisely why it is not a 95% probability about the interval in front of you
- Build a null distribution by simulation and read a p-value off it as a tail area
- Name the four common p-value misreadings and show, on a number, why each one fails
- Run a permutation test for a statistic that has no standard error formula, such as a difference in medians
- Measure the actual coverage of an interval recipe instead of trusting its label, and identify the conditions that break it
- Choose between classical, robust and cluster-robust standard errors, and say what each one assumes
- Report an estimate, an interval and a non-significant result in language a careful reader cannot misread

Ready? [Begin with Lesson 1: What a confidence interval promises](What-a-Confidence-Interval-Promises.html).
