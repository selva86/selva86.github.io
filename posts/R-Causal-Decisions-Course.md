---
title: "Causal Inference for Decisions in R: A Course"
slug: "R-Causal-Decisions-Course"
description: "Eleven interactive R lessons on causal methods for real decisions: propensity matching, IPW, difference-in-differences, regression discontinuity, IV, and more."
keywords: "causal inference in R, propensity score matching, inverse probability weighting, doubly robust, difference in differences, parallel trends, regression discontinuity, instrumental variables, 2SLS, synthetic control, uplift modeling, double machine learning, sensitivity analysis, mediation analysis, average treatment effect, interactive course"
mathjax: false
webr: false
date: "2026-07-03"
curriculum_id: "6.180.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Causal Decisions (Course)"
sidebar_order: "180"
---

# Causal Inference for Decisions in R: A Course

<p class="lead">When you cannot run the clean experiment, you have to earn the causal claim from messy observational data instead. This eleven-lesson interactive course builds the modern toolkit for exactly that: matching, weighting, difference-in-differences, regression discontinuity, instrumental variables, synthetic control, uplift, double machine learning, and the honest checks that tell you when to trust the answer, each taught in R with live diagrams you steer as you learn.</p>

Most real decisions never come with a randomized trial. The policy already launched. The customers chose their own treatment. The regions adopted at different times. In every one of those cases a naive before-and-after or treated-versus-untreated comparison quietly bakes in the reasons people ended up in each group, and reports that bias as if it were the effect. This course is the practitioner's answer: a sequence of methods, each built for a specific way the data refuses to randomize itself, and each paired with the assumption it asks you to buy.

This is the advanced causal stop on the Data Scientist path. It picks up where an introduction to potential outcomes and DAGs leaves off and turns the ideas into working estimators you can defend in a room full of skeptics. Every lesson is a guided, interactive experience: you manipulate live charts in the browser, answer checkpoints, and write and run R as you go. Every term is defined the moment it appears. The first lesson is free to try; the rest unlock with a subscription.

## The eleven lessons

### Lesson 1: Matching and the Propensity Score

Start with the core problem: when people choose their own treatment, the groups differ before the treatment ever acts. Estimate each unit's propensity to be treated with `glm`, pair treated units to look-alike controls, check that the groups actually balanced (standardized mean difference), and recover an effect the naive difference gets wrong.

[Start Lesson 1: Matching and the Propensity Score](Matching-and-the-Propensity-Score.html)

### Lesson 2: Inverse-Probability Weighting and Doubly Robust Estimation

Instead of discarding unmatched units, reweight them. Weighting each unit by one over its propensity rebuilds a pseudo-randomized sample, the positivity assumption says when you are allowed to, and the doubly robust (AIPW) estimator stays honest if either the propensity model or the outcome model is right.

[Start Lesson 2: Inverse-Probability Weighting and Doubly Robust](Inverse-Probability-Weighting-and-Doubly-Robust.html)

### Lesson 3: Difference-in-Differences and Parallel Trends

Two groups, before and after a policy. The double-difference via `lm(y ~ treat*post)` cancels out fixed differences between the groups and shared time shocks, the parallel-trends assumption is the price of admission, and this lesson shows you how to probe whether it holds.

[Start Lesson 3: Difference-in-Differences and Parallel Trends](Difference-in-Differences-and-Parallel-Trends.html)

### Lesson 4: Staggered DiD and the Negative-Weights Problem

When units adopt treatment at different times, the workhorse two-way fixed-effects model can silently put negative weights on some comparisons, using already-treated units as controls. Meet the Goodman-Bacon intuition for why, and the modern estimators that fix it.

[Start Lesson 4: Staggered DiD and the Negative-Weights Problem](Staggered-DiD-and-the-Negative-Weights-Problem.html)

### Lesson 5: Regression Discontinuity

A cutoff on a running variable decides who gets treated: a test score, an income threshold, a date. Fit a local line on each side, read the jump at the threshold as the effect, and navigate the bias-variance trade-off hiding in the bandwidth you choose.

[Start Lesson 5: Regression Discontinuity](Regression-Discontinuity.html)

### Lesson 6: Instrumental Variables and 2SLS

When treatment is tangled with unobserved confounders, an instrument, something that shifts treatment but touches the outcome only through it, can still recover the effect. Build two-stage least squares by hand, understand the exclusion restriction, and learn to spot a weak instrument before it wrecks your estimate.

[Start Lesson 6: Instrumental Variables and 2SLS](Instrumental-Variables-and-2SLS.html)

### Lesson 7: Synthetic Control

One treated unit and no clean comparison. Build a weighted blend of donor units that tracks the treated one before the policy, then read the post-policy gap as the effect. You will find the weights yourself with `optim` over a simplex.

[Start Lesson 7: Synthetic Control](Synthetic-Control.html)

### Lesson 8: Uplift and Heterogeneous Effects

A single average effect hides who was helped and who was hurt. A T-learner fits one model per arm to predict per-unit uplift, the Qini curve tells you how well you can target, and quantile validation keeps the story honest.

[Start Lesson 8: Uplift and Heterogeneous Effects](Uplift-and-Heterogeneous-Effects.html)

### Lesson 9: Double / Debiased Machine Learning

Let flexible machine learning estimate the nuisance pieces (the propensity and the outcome), then use cross-fitting and Neyman-orthogonal scores so the treatment-effect estimate stays root-n and unbiased despite all that regularization.

[Start Lesson 9: Double / Debiased Machine Learning](Double-Debiased-Machine-Learning.html)

### Lesson 10: Sensitivity Analysis and Placebo Tests

No observational estimate is assumption-free, so quantify how strong an unmeasured confounder would have to be to overturn your result (E-value and Rosenbaum bounds), and stress-test it with placebo outcomes and placebo timing.

[Start Lesson 10: Sensitivity Analysis and Placebo Tests](Sensitivity-Analysis-and-Placebo-Tests.html)

### Lesson 11: Mediation Analysis

Split a total effect into the direct path and the indirect path that runs through a mediator, using the base-R product and difference methods, and see clearly why mediation leans on stronger assumptions than anything else in the course.

[Start Lesson 11: Mediation Analysis](Mediation-Analysis.html)

### Section quiz: check what stuck

Twelve graded questions across the whole section, matching and propensity scores, IPW and doubly-robust, difference-in-differences and its staggered-rollout trap, regression discontinuity, instrumental variables, synthetic control, uplift, double machine learning, sensitivity analysis, and mediation, plus two live R snippets you can run. A quick way to find the ideas worth a second pass before you move on.

[Take the Causal Inference for Decisions quiz](Causal-Inference-for-Decisions-Quiz.html)

## Who this is for

You can run R and read its output, and you are comfortable with a linear model and a logistic regression. You have met the basic causal ideas (potential outcomes, confounding, a DAG) or are willing to pick them up in the introductory Causal Inference course first. Analysts, data scientists, and researchers who have to turn observational data into a decision, and defend it, will get the most out of this. If you have ever been asked "but would it have happened anyway?", this course hands you the methods to answer.

## What you will be able to do

- Remove confounding from an observational comparison with matching, inverse-probability weighting, and doubly robust estimation, and check that it worked
- Exploit natural experiments with difference-in-differences, regression discontinuity, instrumental variables, and synthetic control, and state the assumption each one rests on
- Recognize when staggered adoption breaks two-way fixed effects, and reach for an estimator that survives it
- Estimate who a treatment helps, not just the average, with uplift modeling and a targeting curve
- Combine machine learning with valid inference using double/debiased ML and cross-fitting
- Pressure-test any causal claim with sensitivity analysis and placebo tests, and decompose an effect with mediation analysis

Ready? [Begin with Lesson 1: Matching and the Propensity Score](Matching-and-the-Propensity-Score.html).
