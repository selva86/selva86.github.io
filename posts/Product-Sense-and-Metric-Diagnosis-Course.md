---
title: "Product Sense and Metric Diagnosis in R: An Interactive Course"
slug: "Product-Sense-and-Metric-Diagnosis-Course"
description: "Learn the open-ended product questions a data scientist is actually asked: framing a vague question, diagnosing a metric drop, decomposing a funnel, reading a cohort table, and sizing an opportunity before anything gets built."
keywords: "product sense, metric drop diagnosis, root cause analysis, funnel analysis in R, funnel decomposition, cohort analysis in R, mix shift, Simpson paradox, opportunity sizing, product data scientist interview, north star metric, product analytics in R"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "3.10.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Product Sense and Metric Diagnosis"
sidebar_order: "184"
---

# Product Sense and Metric Diagnosis: A Hands-On Interactive Course

<p class="lead">The first question nobody prepares for is the vague one. "Is the new onboarding working?" has no population in it, no measure, and no decision attached, and an analysis that starts before those are settled will answer something nobody asked. This course is about the part of the job that happens before any test is designed.</p>

It opens on framing, because that is where most of the damage is done. A question arrives without a population or a comparison, and the lesson turns it into both, then writes down what result would change the decision. That last step is the one people skip, and it is the one that makes an analysis worth running.

Then the question every data scientist gets at least once a quarter: a metric dropped, find out why. The course teaches an order rather than a hunch, because the order is what keeps you out of trouble. Is the drop real, is it instrumentation, is it seasonality, is it one segment. The worked case resolves to instrumentation, which is both the most common answer and the one people guess last.

From there the two tools that locate a problem rather than describe it. A funnel decomposition turns one rate into the steps that produce it, so a drop has a location before it has a theory. A cohort table separates a change in behaviour from a change in who is showing up, and the worked example has every cohort flat while the headline falls, which is the shape that fools whole teams.

It closes on opportunity sizing, which is the skill that lets a team decline cheaply. Reachable population times conversion times plausible effect, with the uncertainty carried through, so the answer arrives as a range rather than a number pretending to be one.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Framing an Ambiguous Product Question

Turning "is the new feed working?" into a population, a measure, a comparison and a decision rule, so the analysis has somewhere to land before it starts.

[Start Lesson 1: Framing an Ambiguous Product Question](Framing-an-Ambiguous-Product-Question.html)

### Lesson 2: Metric Drop Diagnosis

The diagnosis order that keeps you out of trouble: is the drop real, is it instrumentation, is it seasonality, is it one segment. Run on a dataset where the answer is instrumentation, which is the most common and least guessed.

[Start Lesson 2: Metric Drop Diagnosis](Metric-Drop-Diagnosis.html)

### Lesson 3: Funnel decomposition

Breaking a rate into the steps that produce it, so a drop has a location before it has a theory. Step conversion computed and the leaking step identified.

Lesson 3 is coming soon.

### Lesson 4: Cohort analysis and mix shift

Reading a cohort table, then the composition change that moves a headline nobody touched, with every cohort flat and the average falling.

Lesson 4 is coming soon.

### Lesson 5: Opportunity sizing

Estimating the ceiling on a feature's impact before it is built: reachable population times conversion times effect, with the uncertainty carried through so the answer is a range.

Lesson 5 is coming soon.

### Lesson 6: Product sense quiz

Section quiz.

Lesson 6 is coming soon.

## Who this is for

Anyone who is asked product questions without being handed a method: product data scientists, product analysts, and analytics engineers who get pulled into "why did this change?". It also suits anyone preparing for a product data science interview, where this material is the round that eliminates the most candidates. [Exploratory Data Analysis](EDA-Course.html) pairs well if you want more on looking at data before modelling it. You should be able to filter and group a data frame and read a chart.

## What you will be able to do

- Turn a vague product question into a population, a measure and a decision rule
- Diagnose a metric drop in an order that rules out instrumentation before biology
- Decompose a rate into a funnel and name the step that is leaking
- Read a cohort table and tell a behaviour change from a mix shift
- Size an opportunity before it is built, and report it as a range
- Say out loud what result would change your recommendation, before you look

Ready? [Begin with Lesson 1: Framing an ambiguous product question](Framing-an-Ambiguous-Product-Question.html).
