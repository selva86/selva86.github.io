---
title: "Generalized Linear Models in R: An Interactive Course"
slug: "Generalized-Linear-Models-Course"
description: "Learn GLMs in R across eight interactive lessons: logistic regression from the odds up, link functions, Poisson regression, overdispersion, offsets and exposure, ordinal and multinomial outcomes, zero inflation, and checking a GLM with simulated residuals."
keywords: "generalized linear models in R, glm in R, logistic regression in R, odds ratio in R, link function, probit vs logit, Poisson regression in R, overdispersion in R, negative binomial in R, offset in Poisson regression, ordinal logistic regression in R, multinomial logistic in R, zero inflated model in R, hurdle model, DHARMa residuals"
mathjax: true
webr: false
date: "2026-11-19"
curriculum_id: "4.80.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Generalized Linear Models (Course)"
sidebar_order: "39"
---

# Generalized Linear Models in R: A Hands-On Interactive Course

<p class="lead">Most outcomes worth modelling are not continuous. They are yes or no, a count, a rate, or a position on an ordered scale, and an ordinary regression handles all of them badly in ways that no residual plot will tell you about. This eight-lesson interactive course builds the generalized linear model as the honest answer, one family at a time.</p>

It starts where every applied course should and most do not: with the arithmetic. A probability, then odds, then log odds, computed on the same small table until you can convert between them by hand. Only then is a model fitted, and its coefficient read three ways, as a log odds ratio, as an odds ratio, and as a change in probability at a stated covariate setting, because the third is the only one a non-specialist reader will actually understand.

The middle of the course is about counts, and about the two failures that make count models wrong quietly. Overdispersion is diagnosed as a number and then shown to matter, with standard errors far too small and the coverage measured. Unequal exposure is worse, because nothing diagnoses it: clinics observed for different numbers of months and villages of different populations produce counts that are not comparable at all, and the offset is derived rather than asserted.

The through-line is that choosing a family is a modelling decision with consequences you can measure, not a lookup. The course closes with the check that makes all of it verifiable: simulated quantile residuals, built by hand, which are uniform for any correctly specified model no matter the family. That is what makes a GLM diagnosable at all, because the habits from ordinary regression actively mislead here.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Logistic regression, from the odds up

Built in the order that makes it stick: a probability, then odds, then log odds, each computed on the same small table so you can convert between them by hand before any model is fitted. Why a linear model on a zero-or-one outcome gives predictions outside zero and one, demonstrated rather than asserted. Then the logistic fit, with the coefficient read as a log odds ratio, exponentiated to an odds ratio, and converted to a change in probability at a stated covariate setting, which is the only one of the three a non-specialist reader will understand.

[Start Lesson 1: Logistic regression, from the odds up](Logistic-Regression-from-the-Odds-Up.html)

### Lesson 2: Three link functions, and why the choice rarely matters

Logit, probit and complementary log-log plotted on the same axes, where logit and probit are nearly indistinguishable over the range where data usually live and cloglog is visibly asymmetric. The same dataset fitted with all three, producing near-identical predicted probabilities and quite different coefficients, which is the lesson: the link changes the scale the coefficients live on, not usually the conclusion. When cloglog is the principled choice rather than a curiosity, which is when the outcome is a time-to-event in disguise.

[Start Lesson 2: Three link functions, and why the choice rarely matters](Three-Link-Functions-and-Why-the-Choice-Rarely-Matters.html)

### Lesson 3: Modeling counts with Poisson regression

Poisson regression as the natural model when the outcome is "how many", with the log link motivated by what it does rather than by convention: it makes the model multiplicative, so a coefficient is a rate ratio. Fitted on a real count outcome, with the coefficient exponentiated and read as a percentage change in the rate. The distribution's defining property, that variance equals mean, restated and then computed here, so the next lesson has somewhere to start.

[Start Lesson 3: Modeling counts with Poisson regression](Modeling-Counts-with-Poisson-Regression.html)

### Lesson 4: When your counts are too variable for Poisson

Overdispersion diagnosed as a number, the ratio of residual deviance to degrees of freedom, and then shown to matter: a Poisson model on overdispersed data gives standard errors that are far too small, with the coverage measured. Three repairs compared on the same data, which are a quasi-Poisson correction, a negative binomial fit, and cluster-robust standard errors, with what each assumes made explicit. The negative binomial's extra parameter explained as a variance that grows faster than the mean.

[Start Lesson 4: When your counts are too variable for Poisson](When-Your-Counts-Are-Too-Variable-for-Poisson.html)

### Lesson 5: Rates, offsets and unequal exposure

The mistake that makes count models wrong in a way nothing diagnoses: comparing counts from windows of different size. Clinics observed for different numbers of months, villages of different populations, machines run for different hours. The offset derived from the log link, so that including `log(exposure)` with its coefficient fixed at one turns a count model into a rate model, shown algebraically and then checked numerically against the same model fitted to rates directly. Why an offset is not a covariate, and what goes wrong if you let its coefficient float.

[Start Lesson 5: Rates, offsets and unequal exposure](Rates-Offsets-and-Unequal-Exposure.html)

### Lesson 6: Outcomes with an order, and outcomes without

An ordinal outcome, a five-point severity scale, and a nominal one, which of four treatments was chosen, separated by the question each asks. The proportional-odds model built as a set of cumulative splits, with the single shared slope being exactly the assumption the name refers to, plotted so you can see what is being assumed and then check it. Multinomial logistic introduced as the model that assumes nothing about order and pays for it in parameters. The common error of running ordinary regression on a Likert item, with the damage shown.

[Start Lesson 6: Outcomes with an order, and outcomes without](Outcomes-with-an-Order-and-Outcomes-Without.html)

### Lesson 7: Too many zeros, and the two ways to model them

Counts with far more zeros than any Poisson or negative binomial can produce, and the two stories that explain them, which are genuinely different and lead to different models. The zero-inflated model says some zeros come from a separate never-at-risk process; the hurdle model says the decision to be non-zero and the size once non-zero are two stages. Both fitted by hand, as a mixture and as a two-part likelihood, on data simulated from each, so each model is seen to recover its own truth and misfit the other. Which story a given dataset supports, and how to tell.

[Start Lesson 7: Too many zeros, and the two ways to model them](Too-Many-Zeros-and-the-Two-Ways-to-Model-Them.html)

### Lesson 8: Checking a GLM with simulated residuals

Why a residual plot from a GLM looks alarming even when the model is right: the residuals are not expected to be normal or homoscedastic, so the habits from ordinary regression mislead. Simulated quantile residuals built from first principles, by simulating many datasets from the fitted model and asking where each observed value falls in its own predicted distribution, which makes a correctly specified model's residuals uniform no matter the family. Implemented by hand, then shown catching the three faults from lessons 4, 5 and 7 on data where each was injected.

Lesson 8 is coming soon.

## Who this is for

Anyone whose outcome is not a continuous measurement: a yes or no, a count, a rate, or a rating on an ordered scale. [Linear Regression, Properly](Linear-Regression-Properly-Course.html) and [Regression Modeling Strategies](Regression-Modeling-Strategies-Course.html) build the foundation this course generalizes, and either is useful first, though neither is required. You should be able to fit a model with `lm()`, write a function, and read a coefficient table.

It is also the right course if you have reported an odds ratio and been asked what it means in plain probability, or fitted a Poisson model to counts collected over unequal periods without adding an offset.

## What you will be able to do

- Convert between probability, odds and log odds by hand, and explain a logistic coefficient three ways
- Say what a link function does and why logit and probit almost always agree
- Fit a Poisson regression and read its coefficient as a rate ratio
- Diagnose overdispersion as a number, and choose between quasi-Poisson, negative binomial and robust standard errors
- Use an offset correctly so counts over unequal exposure become comparable rates
- Fit and check a proportional-odds model, and know when a multinomial model is the honest choice
- Tell a zero-inflated story from a hurdle story and fit the model that matches
- Build simulated quantile residuals by hand and use them to check any GLM

Ready? [Begin with Lesson 1: Logistic regression from the odds up](Logistic-Regression-from-the-Odds-Up.html).
