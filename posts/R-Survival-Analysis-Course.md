---
title: "Survival Analysis in R: A Hands-On Course"
slug: "R-Survival-Analysis-Course"
description: "Learn survival analysis in R across seven interactive lessons: censoring, Kaplan-Meier curves, the log-rank test, Cox models, competing risks, and survival ML."
keywords: "survival analysis in R, censoring, Kaplan-Meier, log-rank test, Cox proportional hazards, coxph, survfit, hazard ratio, Schoenfeld residuals, AFT model, Weibull survival, competing risks, cumulative incidence, C-index, survival package, interactive course"
mathjax: false
webr: false
date: "2026-07-02"
curriculum_id: "6.150.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Survival Analysis (Course)"
sidebar_order: "150"
---

# Survival Analysis in R: A Hands-On Course

<p class="lead">Time-to-event data breaks the tools you already know. Half the patients are still alive when the trial ends, the churn file is full of customers who have not churned yet, and an ordinary average quietly throws that information away. This seven-lesson interactive course teaches survival analysis in R from the ground up: censoring, Kaplan-Meier curves, the log-rank test, Cox proportional hazards, parametric and competing-risks models, and how to score a survival model honestly. You run live R in the browser at every step.</p>

Survival analysis is the statistics of "how long until something happens": death in a clinical trial, churn in a subscription business, failure in a machine fleet, default on a loan. What makes it its own field is not the clock but the incomplete stories. A patient who leaves a two-year study alive at month 14 tells you something real, she survived at least 14 months, yet she has no event time you can average. Drop her and you bias the result; count her as an event and you bias it the other way. Every method in this course exists to use that partial information correctly.

The thread through every lesson is honesty with incomplete data: what a censored row is allowed to say, and how each estimator listens to exactly that much and no more. You meet each idea as a live picture first, a survival curve you can read or a hazard ratio you can bend, then build it in R with the `survival` package and run it yourself. Every term is defined the moment it appears.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints, and write code as you go.

## The seven lessons

### Lesson 1: Survival Data and Censoring

A patient who leaves a two-year trial alive at month 14 is not missing data, and treating her as a death, or dropping her, biases every estimate low. Learn what a censored observation does and does not tell you, meet the survival function S(t) and the hazard, and encode follow-up times as a survival outcome in R with `Surv()`.

[Start Lesson 1: Survival Data and Censoring](Survival-Data-and-Censoring.html)

### Lesson 2: Kaplan-Meier and the Log-Rank Test

The Kaplan-Meier estimator turns censored follow-up into an honest survival curve, one event at a time. Learn the product-limit recipe step by step, read a KM curve and its median, and compare two treatment arms with `survfit()` and the log-rank test.

[Start Lesson 2: Kaplan-Meier and the Log-Rank Test](Kaplan-Meier-and-the-Log-Rank-Test.html)

### Lesson 3: Cox Proportional Hazards

Curves compare groups; the Cox model measures effects. Learn the semiparametric workhorse of survival analysis, what a hazard ratio actually says, how partial likelihood sidesteps the baseline hazard, and how to read `coxph()` output line by line.

[Start Lesson 3: Cox Proportional Hazards](Cox-Proportional-Hazards.html)

### Lesson 4: Checking Proportional Hazards

Every Cox model leans on one assumption: hazard ratios stay constant over time. Learn to test it with Schoenfeld residuals and `cox.zph()`, recognize what a violation looks like, and repair one with time-varying covariates.

[Start Lesson 4: Checking Proportional Hazards](Checking-Proportional-Hazards.html)

### Lesson 5: Parametric and AFT Models

Sometimes you know the shape of the hazard, and saying so buys you smoother estimates and real extrapolation. Learn Weibull and exponential survival models, the accelerated-failure-time reading of `survreg()`, and when a parametric fit beats Cox.

[Start Lesson 5: Parametric and AFT Models](Parametric-and-AFT-Models.html)

### Lesson 6: Competing Risks and Cumulative Incidence

When patients can die of something other than the disease you study, one minus Kaplan-Meier overcounts the risk. Learn why, replace it with the cumulative incidence function from a multi-state `survfit()`, and meet the Fine-Gray idea for modeling it.

[Start Lesson 6: Competing Risks and Cumulative Incidence](Competing-Risks-and-Cumulative-Incidence.html)

### Lesson 7: Survival ML and Evaluation

Machine learning meets censoring: random survival forests can bend where Cox stays linear, but only honest scoring tells you whether that helps. Learn Harrell's C-index and the time-dependent Brier score, and evaluate a survival model the way you would any other.

[Start Lesson 7: Survival ML and Evaluation](Survival-ML-and-Evaluation.html)

## Who this is for

You can fit and read a simple regression, you know probability as a long-run fraction, and you can work with a data frame in R. That is the whole prerequisite. Every survival idea, from censoring to the hazard to the Cox model, is built from scratch as it arrives. It follows naturally from the regression material on the Data Scientist path, but no prior survival analysis is assumed.

## What you will be able to do

- Encode censored follow-up with `Surv()` and explain exactly what a censored row contributes
- Estimate and read Kaplan-Meier curves and medians, and compare groups with the log-rank test
- Fit Cox proportional hazards models and interpret hazard ratios with confidence intervals
- Check the proportional-hazards assumption with Schoenfeld residuals and repair violations
- Choose between Cox, Weibull/AFT, and competing-risks models for the problem at hand
- Score survival models honestly with Harrell's C-index and the time-dependent Brier score

Ready? [Begin with Lesson 1](Survival-Data-and-Censoring.html).
