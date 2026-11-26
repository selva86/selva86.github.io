---
title: "Survival and Event History Analysis in R: An Interactive Course"
slug: "Survival-and-Event-History-Analysis-Course"
description: "Learn survival analysis in R across seven interactive lessons: censoring, Kaplan-Meier curves and the log-rank test, the Cox model and hazard ratios, checking proportional hazards, time-varying covariates and immortal time bias, parametric survival models, and competing risks."
keywords: "survival analysis in R, censoring, right censoring, survival function, hazard function, Kaplan-Meier curve in R, log-rank test, median survival, Cox proportional hazards model, hazard ratio interpretation, partial likelihood, risk set, Schoenfeld residuals, proportional hazards assumption, stratified Cox model, time-varying covariate, counting process data, immortal time bias, parametric survival model, Weibull model, exponential model, accelerated failure time, competing risks, cumulative incidence function, survival package"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "4.140.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Survival and Event History Analysis (Course)"
sidebar_order: "45"
---

# Survival and Event History Analysis in R: A Hands-On Interactive Course

<p class="lead">Half your subscribers have not cancelled yet. Half your patients are still alive. You do not know when their event will happen, only that it has not happened so far, and that is information rather than a gap in your spreadsheet. Every method in this seven-lesson interactive course exists because the obvious ways of handling those rows quietly produce the wrong answer.</p>

The course opens by making that failure concrete rather than asserting it. A dataset where some subjects have not had the event yet is analysed twice, once by dropping those rows and once by treating the last known time as the event time, and both answers are compared against a truth we happen to know. One is badly too low, the other badly too high, and seeing them miss in opposite directions is what motivates the rest of the course. Censoring is then defined properly, as partial information rather than missing data, and the survival and hazard functions arrive as two views of the same thing, computed by hand off a small table so the link between them is arithmetic rather than assertion.

From there the tools get built before they get used. The Kaplan-Meier estimator is assembled down a sorted table of event times, multiplying conditional probabilities, which is the only way the staircase shape and the reason a censored observation flattens the curve instead of dropping it both become obvious. The log-rank test is then constructed from observed against expected events at each time point, which makes its real character visible: it compares whole curves rather than survival at one chosen moment, and it is at its weakest exactly when two curves cross.

The Cox model gets the same treatment. Its trick is explained before it is fitted, because the trick is the point: it models a ratio of hazards and leaves the baseline hazard entirely unspecified, which is why it needs no assumption about the shape of time. The partial likelihood is built from risk sets on a small dataset by hand, so you see for yourself that only the ordering of events matters. Then the hazard ratio is pinned down carefully, including the two things it is not, because a hazard ratio of 2 does not mean half the survival time and the course shows you the numbers rather than telling you.

The second half is about the assumptions you bought that flexibility with, and what to do when they fail. Proportional hazards is tested and then deliberately violated, so you can watch the model return a single number that describes neither early nor late follow-up. A covariate that changes partway through is handled with the counting-process layout, and the same data analysed the naive way manufactures a large spurious benefit out of nothing, which is the lesson. Parametric models then recover the one thing the Cox model cannot give you, an absolute prediction, at the price of having to be right about the shape. The course closes on competing risks, where a subject who dies of something else can never have the event you are studying, and treating that as ordinary censoring assumes they could have.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: What censoring does to your data

Time-to-event data earns its own methods by first getting it wrong on purpose. Subjects who have not had the event yet are handled two ways, dropped and then capped at their last known time, and both answers are checked against a known truth and found badly biased in opposite directions. Censoring is then defined as partial information rather than a missing value. The survival function and the hazard function are introduced as two views of one thing and computed from the same small dataset by hand, so the relationship between them is arithmetic you can follow rather than a formula you accept.

[Start Lesson 1: What censoring does to your data](What-Censoring-Does-to-Your-Data.html)

### Lesson 2: Kaplan-Meier curves and the log-rank test

The Kaplan-Meier estimator built by hand down a sorted table of event times, multiplying conditional survival probabilities, so the staircase shape and the reason censored observations flatten the curve rather than drop it are both visible. The confidence band is added, and the median survival read off with the honest note that it is undefined when the curve never reaches one half. The log-rank test is then constructed as observed against expected events at each time point, which makes clear that it tests the whole curve rather than survival at a single time, and that it is weakest when curves cross.

[Start Lesson 2: Kaplan-Meier curves and the log-rank test](Kaplan-Meier-Curves-and-the-Log-Rank-Test.html)

### Lesson 3: The Cox model and what a hazard ratio means

The Cox model's trick explained before it is used: it models the ratio of hazards and leaves the baseline hazard completely unspecified, which is why it needs no distributional assumption about time. The partial likelihood is built from risk sets on a small dataset, by hand, so you see that only the ordering of events matters. The hazard ratio is then interpreted carefully, including the two things it is not, since it is neither a risk ratio nor a constant difference in survival time. Why a hazard ratio of 2 does not mean half the survival time is shown numerically.

[Start Lesson 3: The Cox model and what a hazard ratio means](The-Cox-Model-and-What-a-Hazard-Ratio-Means.html)

### Lesson 4: Checking proportional hazards and what to do instead

The one assumption the previous lesson bought its flexibility with, tested and then violated. Schoenfeld residuals are computed and plotted against time, where a flat band means the assumption holds and a trend means the hazard ratio is drifting. Data is simulated with a deliberately time-varying effect, and the Cox model returns a single number describing neither early nor late follow-up, which is the demonstration. Three honest responses are compared, stratify, add a time interaction, or report time-specific effects, with what each one gives up.

[Start Lesson 4: Checking proportional hazards and what to do instead](Checking-Proportional-Hazards-and-What-to-Do-Instead.html)

### Lesson 5: Covariates that change during follow-up

A covariate that is not fixed at baseline, such as a treatment started partway through, and the counting-process layout that handles it, with one row per interval per subject rather than one row per subject. The layout is printed so the restructuring is concrete. Then the error this exists to prevent, immortal time bias, is demonstrated by analysing the same data with the time-varying covariate treated as a baseline trait, which assigns post-treatment survival to the treated group and manufactures a large spurious benefit. The size of that bias is the point of the lesson.

[Start Lesson 5: Covariates that change during follow-up](Covariates-That-Change-During-Follow-Up.html)

### Lesson 6: Parametric survival models and when to prefer them

The Cox model's unspecified baseline is a cost as well as a feature, because it cannot give you an absolute prediction. Exponential, Weibull and log-normal models are fitted to the same data and their hazard shapes plotted, so what each one assumes about how risk changes over time is something you can look at rather than something you take on trust, and each fit is checked against the Kaplan-Meier curve. What a parametric model buys is extrapolation, absolute survival predictions and smaller standard errors when the shape is right. What it risks when the shape is wrong is shown by fitting an exponential to data whose hazard is clearly not constant.

[Start Lesson 6: Parametric survival models and when to prefer them](Parametric-Survival-Models-and-When-to-Prefer-Them.html)

### Lesson 7: Competing risks and why Kaplan-Meier overstates

A subject who dies of something else can never have the event you are studying, and treating that as ordinary censoring assumes they could have, which inflates the estimated event probability. Kaplan-Meier and the cumulative incidence function are computed on the same data and the gap between them widens as the competing event gets more common. The cause-specific hazard and the subdistribution hazard are then separated by the question each one answers, since one is about the mechanism and the other about what fraction of people will actually experience the event. Frailty models are named as the related idea for unobserved heterogeneity.

Lesson 7 is coming soon.

## Who this is for

Anyone whose outcome is a time rather than a number or a yes, and whose data arrives before everyone in it has finished. That covers churn and retention, time to failure in a component, time to relapse or death in a trial, and time to any event you can date. [Generalized Linear Models](Generalized-Linear-Models-Course.html) is the natural companion, since it covers what to do when the outcome is a count or a yes instead, and [Regression Modeling Strategies](Regression-Modeling-Strategies-Course.html) covers the model-building judgment this course assumes. Neither is required. You should be able to fit `lm()` and `glm()`, subset a data frame, and read a plot.

It is also the right course if you have run `survfit()` and `coxph()` and reported the output honestly without being certain what a hazard ratio compares, or if you have ever analysed a treatment that started mid-study by recording it as a baseline column.

## What you will be able to do

- Recognise censored data and explain why dropping or capping those rows biases the answer in opposite directions
- Move between the survival function and the hazard function and say what each one answers
- Build a Kaplan-Meier curve by hand and read a median survival off it, including when there is not one
- Run a log-rank test and state what it tests, which is the whole curve rather than one time point
- Fit a Cox model and interpret a hazard ratio without the two readings that are wrong
- Explain why the Cox model needs no assumption about the shape of time, and what it gives up for that
- Test proportional hazards with Schoenfeld residuals and recognise a drifting effect in the plot
- Choose between stratifying, adding a time interaction, and reporting time-specific effects
- Restructure data into the counting-process layout to handle a covariate that changes during follow-up
- Spot immortal time bias in someone else's analysis and quantify how large it is in your own
- Fit exponential, Weibull and log-normal models and judge the hazard shape each one assumes
- Decide when a parametric model is worth its assumption, and produce an absolute survival prediction
- Recognise a competing event and report cumulative incidence instead of a curve that overstates the risk

Ready? [Begin with Lesson 1: What censoring does to your data](What-Censoring-Does-to-Your-Data.html).
