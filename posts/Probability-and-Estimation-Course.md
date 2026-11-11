---
title: "Probability and Estimation in R: An Interactive Course"
slug: "Probability-and-Estimation-Course"
description: "Learn probability and estimation in R across seven interactive lessons: random variables and expectation, the four distributions inference runs on, binomial and Poisson counts, the central limit theorem, sampling distributions, standard errors, and bootstrap confidence intervals."
keywords: "probability in R, random variables in R, expectation and variance, central limit theorem in R, sampling distribution of the mean, standard error, bootstrap confidence interval in R, binomial and Poisson in R, t distribution, chi-squared distribution, F distribution"
mathjax: false
webr: false
date: "2026-11-11"
curriculum_id: "4.10.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Probability & Estimation (Course)"
sidebar_order: "32"
---

# Probability and Estimation in R: A Hands-On Interactive Course

<p class="lead">Most statistics training teaches the formulas and skips the thing they are all about: your data is one sample out of many you could have drawn, and every number you report would have come out differently. This seven-lesson interactive course builds that idea from the ground up, so the formulas arrive as answers to a question you already feel.</p>

Every method a researcher uses later, every interval, every p-value, every standard error, rests on the same foundation: a statistic computed from a sample has its own distribution, and knowing that distribution is what turns a number into a claim. This course builds the foundation once, properly. You start with what a random variable actually is, work through the distributions that inference is conducted in, watch the central limit theorem happen rather than take it on trust, and finish able to put an honest interval around an estimate with no formula at all.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: What a random variable really is

A random variable is a rule that attaches a number to an uncertain outcome, not a number that wiggles. See the discrete and continuous cases on concrete examples, compute an expectation as a long-run average by hand before meeting the closed form, and understand why `E[X]` is a property of the rule and never of the sample you happened to draw.

[Start Lesson 1: What a random variable really is](What-a-Random-Variable-Really-Is.html)

### Lesson 2: The four distributions inference runs on

Normal, t, chi-squared and F, introduced as the distributions *of things you compute* rather than shapes to memorise. Assemble each one from standard normals in R so none of them is a new assumption, watch degrees of freedom control tail weight, and set `qt()` against `qnorm()` to price exactly what estimating sigma costs you.

[Start Lesson 2: The four distributions inference runs on](The-Four-Distributions-Inference-Runs-On.html)

### Lesson 3: Counting Outcomes: Binomial and Poisson

The two discrete distributions research data actually arrives in: binomial for a fixed number of yes-or-no trials, Poisson for counts in a window with no ceiling. Read `dbinom()` and `dpois()` as probabilities rather than incantations, see the Poisson emerge numerically as a binomial limit, and meet the variance-equals-mean property that real count data usually breaks.

[Start Lesson 3: Counting Outcomes: Binomial and Poisson](Counting-Outcomes-Binomial-and-Poisson.html)

### Lesson 4: Why averages go normal

The central limit theorem as a claim you can check instead of accept. Averages from a flat, a skewed and a two-humped population all turn bell shaped as n grows, while their spread tracks sigma over the square root of n. Then the honest limit: a heavy-tailed population with no finite variance, where averaging buys you nothing at all.

[Start Lesson 4: Why averages go normal](Why-Averages-Go-Normal.html)

### Lesson 5: The sampling distribution of a statistic

The same idea past the mean. Simulate the sampling distribution of a median, a variance and a proportion, see why a standard error is the spread of *that* distribution and not of your data, and learn to decide by simulation whether the normal approximation you want to lean on is actually close enough.

[Start Lesson 5: The sampling distribution of a statistic](The-Sampling-Distribution-of-a-Statistic.html)

### Lesson 6: Point estimates and the standard error

What makes an estimator good: bias, variance, and the mean squared error that trades them off, computed for two rival estimators of the same quantity. Where the square root of n in the formula comes from, why a bigger sample buys precision at a decelerating rate, and the three things beginners merge: an estimate, an estimator, and the parameter.

Lesson 6 is coming soon.

### Lesson 7: Confidence intervals by bootstrap

Resample your sample with replacement, recompute the statistic, read the interval off the resulting distribution. Build the percentile interval by hand in base R, see why it works with no formula for the standard error, learn what 95% actually promises, and meet the cases where the bootstrap quietly fails.

Lesson 7 is coming soon.

## Who this is for

Anyone who can run R and make a vector, and who knows what a mean and a standard deviation are. You do not need any prior probability or statistics. Everything else, expectation, variance, the t distribution, the standard error, the bootstrap, is built here from scratch. Everything runs on base R plus `replicate()` and `sample()`, so there is nothing to install and every result is reproducible from one `set.seed()`.

It is also the right starting point if you have used statistical tests for years without ever being shown where their assumptions come from.

## What you will be able to do

- Say what a random variable is, and compute an expectation and a variance by hand and in R
- Recognise which of the four inference distributions a given quantity belongs to, and why
- Tell a fixed-count problem from an open-ended one, and compute either one exactly
- Demonstrate the central limit theorem by simulation, and name the population where it does not apply
- Simulate the sampling distribution of any statistic you can compute, not just a mean
- Separate an estimate from an estimator from the parameter, and score two estimators against each other
- Put a bootstrap confidence interval around a statistic that has no standard error formula

Ready? [Begin with Lesson 1: What a random variable really is](What-a-Random-Variable-Really-Is.html).
