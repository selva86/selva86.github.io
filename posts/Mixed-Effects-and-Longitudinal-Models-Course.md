---
title: "Mixed-Effects and Longitudinal Models in R: An Interactive Course"
slug: "Mixed-Effects-and-Longitudinal-Models-Course"
description: "Learn mixed-effects models in R across seven interactive lessons: why grouped data breaks ordinary regression, random intercepts and slopes, growth curves, variance components and the ICC, GEE versus mixed models, correlated residuals, and fixing a model that will not converge."
keywords: "mixed effects models in R, lmer in R, lme4, random intercept model, random slope model, intraclass correlation in R, ICC in R, variance components in R, growth curve model in R, longitudinal data analysis in R, repeated measures in R, GEE in R, population averaged vs subject specific, autoregressive residuals, lmer convergence warning, singular fit lmer, effective sample size clustered data"
mathjax: true
webr: false
date: "2026-11-22"
curriculum_id: "4.90.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Mixed-Effects and Longitudinal Models (Course)"
sidebar_order: "40"
---

# Mixed-Effects and Longitudinal Models in R: A Hands-On Interactive Course

<p class="lead">Thirty clinics, ten patients each, and an ordinary regression that reports a confidence interval far too narrow, because it believes it has three hundred independent observations when it has closer to thirty. That single failure is the reason this seven-lesson interactive course exists, and the first lesson measures it rather than warning about it.</p>

Grouped data is the normal case, not the exception. Patients within clinics, measurements within people, students within schools, readings within machines. The moment observations come in clusters, the arithmetic that produces a standard error is counting something that is not there, and no diagnostic plot from ordinary regression will tell you. The damage shows up as intervals that are too narrow and p-values that are too small, which is the worst possible failure mode because it looks like a stronger result.

The course builds the repair in the order that makes it understandable. The model is written out in full before anything is fitted, so you know which quantities are being estimated: one intercept per group, drawn from a distribution whose variance is the thing actually estimated, and then optionally one slope per group the same way. Only then does `lmer()` appear, and its variance components are mapped line by line back onto the model you just wrote.

The middle of the course is about change within a person, where the grouping factor is the subject and the interesting coefficient is a slope over time. Each subject gets their own trajectory, plotted against the population average, and the reason a within-subject comparison is more precise than a between-subject one is derived from the variance decomposition rather than asserted.

The through-line is that the variance components are the answer to a question, not output to skim past. The intraclass correlation gets read two ways, as the correlation between two observations from the same group and as the fraction of variation the grouping explains, and then turned into a design consequence you can compute: the effective sample size of a clustered study, and why adding more patients to the same thirty clinics stops helping.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Why grouped data breaks ordinary regression

Thirty clinics, ten patients each, and an ordinary regression whose interval is far too narrow because it counts three hundred independent observations when it has closer to thirty. Simulated so the failure arrives as a coverage count rather than a caution. Then the three analyses a researcher might reach for, which are ignoring the grouping, averaging within group, and adding the group as a fixed factor, each shown to answer a different question and two of them to answer the wrong one. The mixed model previewed as the one that uses both levels of information at once.

Lesson 1 is coming soon.

### Lesson 2: Random intercepts and random slopes

The model written out before it is fitted, so you know which quantities are being estimated: one intercept per group drawn from a distribution whose variance is the estimated thing, and then optionally one slope per group the same way. Fitted with `lmer()`, with the output's variance components mapped line by line onto the model just written. Random intercepts set against random slopes on data where the effect genuinely varies by group, and the fixed-effect interval widening appropriately once that variation is modelled instead of ignored.

Lesson 2 is coming soon.

### Lesson 3: Modeling change within a person

Repeated measurements on the same subjects, where the grouping factor is the person and the interesting coefficient is a slope over time. A growth-curve model with a random intercept and a random slope for time, so each subject gets their own trajectory, plotted against the population average. Why the within-subject comparison is more precise than the between-subject one, derived from the variance decomposition rather than asserted, and the trap of reading a population slope as though it described every individual.

Lesson 3 is coming soon.

### Lesson 4: Reading variance components and the ICC

The numbers most people skip past, turned into the answer to a question. Between-group and within-group variance computed by hand from group means, their ratio formed into the intraclass correlation, and that number interpreted two ways: as the correlation between two observations from the same group, and as the fraction of total variation the grouping explains. The design consequence computed directly, which is the effective sample size of a clustered study, and why adding more patients to the same thirty clinics stops helping.

Lesson 4 is coming soon.

### Lesson 5: GEE or mixed model, two different questions

Two methods that fit the same data and estimate different things, which is why "which is better" has no answer. A mixed model estimates a subject-specific effect; GEE estimates a population-averaged one, and for a nonlinear link those two numbers genuinely differ, shown numerically on the same dataset rather than described. GEE's working correlation structure explained as something that need not be right for the estimate to stay consistent, which is its main attraction, and the mixed model's advantage named: it hands you the variance components lesson 4 just made useful.

Lesson 5 is coming soon.

### Lesson 6: Correlated residuals inside a group

What is left after the random effects. Observations close in time within a subject are still more alike than distant ones, and a random intercept alone does not capture that. An autoregressive residual structure added, with the improvement measured and the consequence for the fixed-effect standard error shown. Why this matters most for long series per subject and barely at all for three visits, demonstrated by varying the number of measurements, so you leave with a rule for when to bother rather than one more thing to always do.

Lesson 6 is coming soon.

### Lesson 7: What to do when your mixed model will not converge

The most common practical failure in this material, treated as a diagnosable problem rather than bad luck. Four causes reproduced on purpose: a variance component that is genuinely zero, a random-effects structure too complex for the number of groups, predictors on wildly different scales, and near-perfect separation. Each one's warning message shown and mapped to its cause, then fixed, in the order worth trying them. Why a singular fit is sometimes the correct answer rather than an error, and when simplifying the random structure is honest and when it quietly changes the question.

Lesson 7 is coming soon.

## Who this is for

Anyone whose data arrives in clusters: patients within clinics, measurements within people, students within schools, parts within batches. [Linear Regression, Properly](Linear-Regression-Properly-Course.html) builds the interpretation and diagnostics this course extends, and [Regression Modeling Strategies](Regression-Modeling-Strategies-Course.html) builds the validation habits; either is useful first, though neither is required. You should be able to fit a model with `lm()`, write a function, and read a coefficient table.

It is also the right course if you have reported an interval from clustered data without accounting for the clustering, or fitted a model with `lmer()` and not known what to do with the variance components it printed.

## What you will be able to do

- Show by simulation why ignoring a grouping gives intervals that are too narrow, measured as a coverage count
- Tell apart ignoring the grouping, averaging within group, and adding group as a fixed factor, and say what each one estimates
- Write out a random-intercept and random-slope model, fit it with `lmer()`, and map its variance components back onto the model
- Fit a growth curve so each subject has their own trajectory, and explain why within-subject comparisons are more precise
- Compute an intraclass correlation by hand and interpret it both ways
- Work out the effective sample size of a clustered design, and judge whether more observations per group will help
- Choose between a mixed model and GEE on the basis of which question you are asking, not which is fashionable
- Add a correlated residual structure when the design calls for it, and say when it is not worth the trouble
- Diagnose the four usual causes of a convergence failure and repair each one defensibly

Ready? [Begin with Lesson 1: Why grouped data breaks ordinary regression](Why-Grouped-Data-Breaks-Ordinary-Regression.html).
