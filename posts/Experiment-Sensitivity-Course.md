---
title: "Experiment Sensitivity in R: An Interactive Course"
slug: "Experiment-Sensitivity-Course"
description: "Get a trustworthy answer from less traffic: triggering, CUPED and CUPAC variance reduction, sequential testing with always-valid inference, A/B/n tests, and interleaving."
keywords: "variance reduction, CUPED, CUPAC, triggering, experiment sensitivity, sequential testing, always-valid p-values, confidence sequences, A/B/n test, interleaving, statistical power, online controlled experiments in R"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "3.50.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Experiment Sensitivity"
sidebar_order: "189"
---

# Experiment Sensitivity: A Hands-On Interactive Course

<p class="lead">Most experiments that fail to answer anything were not wrong, they were underpowered. Variance, not effect size, is usually what decides whether a test can see the thing you care about, and there is a surprising amount you can do about variance before resorting to more traffic or more time.</p>

The course opens on the quantity everything else is about. Three levers reduce variance, and knowing which one a situation calls for is most of the skill: remove users the change could not possibly have touched, explain away variation you already have data for, or change the comparison itself.

Triggering is the first and usually the largest. If a change can only affect the eight percent of users who reach a particular screen, including the other ninety-two percent dilutes the effect toward nothing, and the lesson quantifies exactly how much.

Then the two covariate methods. CUPED uses the same user's pre-period behaviour to explain away variation that has nothing to do with the treatment, and the course is honest about when it buys nothing. CUPAC replaces that pre-period mean with a model's prediction, which is what you reach for when the units have no history at all.

The last three lessons change the shape of the test rather than the analysis. Sequential testing makes continuous monitoring legitimate instead of forbidden, A/B/n handles more than two variants with the correction the extra arms demand, and interleaving answers ranking questions far faster by showing both rankings to the same user.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Variance and statistical sensitivity

Why variance rather than effect size usually decides whether a test can answer anything, and the three levers that reduce it.

Lesson 1 is coming soon.

### Lesson 2: Triggering

Restricting analysis to the users a change could possibly have affected, often the single largest sensitivity win available, with the dilution it removes quantified.

Lesson 2 is coming soon.

### Lesson 3: CUPED: pre-period data as a covariate

Pre-period data used as a covariate, what it buys in sample size, and the conditions under which it buys nothing.

Lesson 3 is coming soon.

### Lesson 4: CUPAC: predictions as covariates

A model's prediction in place of the pre-period mean, for units with no history, and the extra variance reduction it recovers.

Lesson 4 is coming soon.

### Lesson 5: Sequential testing and always-valid inference

Confidence sequences that stay valid under continuous monitoring: the fix for peeking rather than the prohibition, and the power it costs.

Lesson 5 is coming soon.

### Lesson 6: A/B/n tests and multiple comparisons

More than two variants, what the control is for, and the correction the extra arms require.

Lesson 6 is coming soon.

### Lesson 7: Interleaving

Showing two rankings to the same user instead of splitting users, and why it reaches an answer far faster for ranking changes.

Lesson 7 is coming soon.

### Lesson 8: Sensitivity quiz

Section quiz.

Lesson 8 is coming soon.

## Who this is for

Anyone whose experiments take too long or end inconclusive: product data scientists, experimentation platform engineers and growth teams working with limited traffic. [Experiment Design and Power](Experiment-Design-and-Power-Course.html) comes first in the track and sets up the power calculations this course then improves. You should be comfortable with variance, a standard error, and fitting a simple regression.

## What you will be able to do

- Name the three levers that reduce variance and pick the right one
- Apply triggering and quantify the dilution it removes
- Run a CUPED adjustment and say when it will not help
- Use model predictions as covariates for units with no pre-period history
- Monitor a test continuously using always-valid confidence sequences
- Run an A/B/n test with the correction the extra arms require
- Choose interleaving over a split test for a ranking change

Ready? [Begin with Lesson 1: Variance and statistical sensitivity](Variance-and-Statistical-Sensitivity.html).
