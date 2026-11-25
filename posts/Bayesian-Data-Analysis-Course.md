---
title: "Bayesian Data Analysis in R: An Interactive Course"
slug: "Bayesian-Data-Analysis-Course"
description: "Learn Bayesian data analysis in R across eight interactive lessons: conjugate updating, a Metropolis sampler built from scratch, Bayesian regression, partial pooling, prior and posterior predictive checks, model comparison by predictive accuracy, regularizing priors and a defensible workflow."
keywords: "Bayesian data analysis in R, Bayes rule, prior and posterior, beta binomial conjugate, credible interval, Metropolis algorithm in R, MCMC from scratch, Gibbs sampler, Hamiltonian Monte Carlo, R-hat, effective sample size, Bayesian regression in R, partial pooling, shrinkage, hierarchical model, prior predictive check, posterior predictive check, WAIC, leave-one-out cross validation, elpd, weakly informative prior, regularizing prior, brms, rstanarm"
mathjax: true
webr: false
date: "2026-11-25"
curriculum_id: "4.110.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Bayesian Data Analysis (Course)"
sidebar_order: "42"
---

# Bayesian Data Analysis in R: A Hands-On Interactive Course

<p class="lead">Bayes' rule always holds. A tidy formula for the answer almost never does, and that single gap explains why Bayesian analysis looks like algebra in a textbook and like sampling in practice. This eight-lesson interactive course closes that gap by building the sampler yourself, then using it on models worth the trouble.</p>

It opens on the case where the algebra works. A university tutoring program's real pass counts update a prior belief into a posterior one, the beta distribution gives a belief about a proportion a shape you can see, and the conjugate update turns out to be arithmetic: add the successes and failures to the prior. Three different priors are then shown meeting the same thirty-six students, which is where a confident but wrong prior reveals its character by barely moving at all.

Then the formula breaks on purpose. An entirely reasonable prior destroys conjugacy, a fine grid handles one parameter and collapses for several, and the lesson's response is to build a Metropolis sampler from scratch in about fifteen lines of R. The order matters here: the sampler is validated against a posterior whose answer is already known before it is trusted on one where it is not. Hamiltonian Monte Carlo is then introduced as what the production tools actually run, together with the checklist that decides whether a chain deserves your belief at all.

With sampling in hand, the course moves to models. A least-squares regression is refit as Bayesian under a weak prior, where the coefficients barely budge but the posterior supplies something no confidence interval provides, which is a direct probability about the quantity you care about. Partial pooling then blends a small group's noisy mean with the overall mean, weighted by how much each deserves to be trusted, and beats both of the obvious alternatives. It is checked against `lme4` and then against a simulated truth, which is the only way to confirm that shrinkage is a genuine gain rather than a comfortable story.

The last three lessons are about discipline. A prior called vague is simulated from and found to imply impossible data, so it gets caught before it ever meets the evidence, while a posterior predictive check catches a model that has already fitted. Models are compared by how well they predict new data rather than how well they fit old data, with leave-one-out computed directly, then approximated, then read against the standard error of the difference so a comparison is reported honestly. A flat prior is shown not to be neutral, since on the log-odds scale it quietly believes in enormous effects, and a weakly informative prior rescues a logistic fit that `glm()` could not handle. The course then assembles everything into one workflow, run end to end in the order that survives review.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Updating a belief with one dataset

A university tutoring program's real pass counts, used to turn a prior belief into a posterior one with nothing hidden. The beta distribution gives a belief about a proportion a shape you can look at, and the conjugate update reduces to adding successes and failures to the prior's parameters. Three priors, one confident and wrong, meet the same thirty-six students, which demonstrates how much evidence it takes to move a stubborn belief. The lesson closes on what a 95% credible interval actually claims, which is not what a confidence interval claims.

[Start Lesson 1: Updating a belief with one dataset](Updating-a-Belief-with-One-Dataset.html)

### Lesson 2: Why sampling works when algebra does not

The pivot of the course. An everyday prior breaks the tidy conjugate formula, a grid works for one parameter and fails for several, and the way forward is to notice that you can always compute the posterior's height at a point even when you cannot describe its whole shape. A Metropolis sampler is then built from scratch in about fifteen lines, validated against a posterior whose answer is already known, and only then turned loose on the real prior. Hamiltonian Monte Carlo and the trust checklist for a chain close the lesson.

[Start Lesson 2: Why sampling works when algebra does not](Why-Sampling-Works-When-Algebra-Does-Not.html)

### Lesson 3: Your first Bayesian regression

The same linear model you already fit with least squares, refit as Bayesian, with a Gibbs sampler assembled from three familiar updates cycled in turn. Under a weak prior the coefficients barely move, which is the point: the gain is not a different estimate but a different account of uncertainty. The full posterior is then used for things a point estimate throws away, including a direct posterior probability computed from the draws. Three ways to summarize one posterior are compared, and the lesson explains what `brms` and `rstanarm` exist to do once you have built this by hand.

[Start Lesson 3: Your first Bayesian regression](Your-First-Bayesian-Regression.html)

### Lesson 4: Partial pooling and the shrinkage it buys

Eight branches reporting wildly different averages, two easy answers that each cost something, and a third that beats both. The prior's width is estimated from the data, and partial pooling turns out to be one weighted average: each branch's own mean blended with the overall mean in proportion to how much it can be trusted. The result is checked against `lme4`, watched on a second dataset, and then measured against a truth only a simulation can supply. The honest closing note is that this free lunch is paid for by a modelling assumption.

[Start Lesson 4: Partial pooling and the shrinkage it buys](Partial-Pooling-and-the-Shrinkage-It-Buys.html)

### Lesson 5: Checking a Bayesian model before and after

Two checks at two different times, on a store's sixty days of refund counts. Before any data is seen, simulating from a prior called vague, Gamma(0.001, 0.001), shows it implying refund counts that could not happen, while a weakly informative prior stays inside the possible. After fitting, the posterior predictive check simulates new data from the fitted model and compares it to the real thing. The check is then run on a model known to be wrong, where it fails visibly, which is how you learn to read it.

[Start Lesson 5: Checking a Bayesian model before and after](Checking-a-Bayesian-Model-Before-and-After.html)

### Lesson 6: Comparing models by predictive accuracy

Why fit alone cannot judge a model, shown by letting complexity improve the fit while prediction gets worse. The log pointwise predictive density is built as the quantity that measures the right thing, then computed two ways on three nested Bayesian regressions: leave-one-out done directly by refitting, and an approximation that avoids refitting. WAIC arrives as a related approximation rather than a separate idea. The lesson ends on the standard error of the difference, because an elpd gap without its uncertainty is not a comparison.

[Start Lesson 6: Comparing models by predictive accuracy](Comparing-Models-by-Predictive-Accuracy.html)

### Lesson 7: Priors that regularize without dictating

A pilot study where `glm()` breaks, because the data are nearly separated and the likelihood has no finite maximum. A flat prior on the log-odds scale is then examined for what it actually believes, which turns out to be that enormous effects are plausible, so it is not neutral at all. A weakly informative prior refits the same data sensibly. Ridge and lasso are then revealed as a normal prior and a Laplace prior, which connects regularization to everything in this course rather than leaving it as a separate trick.

[Start Lesson 7: Priors that regularize without dictating](Priors-That-Regularize-Without-Dictating.html)

### Lesson 8: A Bayesian workflow you can defend

One analysis run end to end in the order that holds up under review: write the model down as likelihood and prior, check the prior by simulation before it sees data, fit by sampling, establish convergence with the trace, R-hat and effective sample size, check that the model reproduces the data it was fitted to, compare the two candidates by predictive accuracy, and report the result in a form a reviewer can audit. Every step is one you built earlier, which is what makes the sequence defensible rather than ceremonial.

[Start Lesson 8: A Bayesian workflow you can defend](A-Bayesian-Workflow-You-Can-Defend.html)

## Who this is for

Anyone who has reported a confidence interval and been asked, reasonably, for the probability that the effect is positive. [Confidence Intervals and P-Values](Confidence-Intervals-and-P-Values-Course.html) sets up the contrast this course answers, and [Mixed-Effects and Longitudinal Models](Mixed-Effects-and-Longitudinal-Models-Course.html) covers the same partial pooling from the frequentist side, so either pairs well, though neither is required. You should be able to fit `lm()` and `glm()`, write a `for` loop, and simulate from `rnorm()` and `rbinom()`.

It is also the right course if you have used `brms` or `rstanarm` productively without being certain what the sampler underneath was doing, or if a reviewer has ever asked you to justify a prior and the honest answer was that it was the default.

## What you will be able to do

- Update a prior to a posterior by conjugacy, and say what a credible interval claims
- Explain why most real posteriors have no closed form, and what that forces you to do
- Write a Metropolis sampler from scratch and validate it against a known answer before trusting it
- Judge whether an MCMC chain can be trusted using the trace, R-hat and effective sample size
- Fit a Bayesian regression and compute a direct posterior probability about a coefficient
- Apply partial pooling to small groups and explain the shrinkage as a weighted average
- Catch a bad prior by simulating from it before it ever touches your data
- Run a posterior predictive check and recognise what it does and does not prove
- Compare models by leave-one-out or WAIC and report the difference with its standard error
- Choose a weakly informative prior that regularizes a near-separated fit without dictating the answer
- Run a full Bayesian analysis in a defensible order and write it up so a reviewer can follow it

Ready? [Begin with Lesson 1: Updating a belief with one dataset](Updating-a-Belief-with-One-Dataset.html).
