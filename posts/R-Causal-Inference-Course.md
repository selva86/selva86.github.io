---
title: "Causal Inference in R: A Hands-On Course"
slug: "R-Causal-Inference-Course"
description: "Learn causal inference in R across five interactive lessons: potential outcomes, DAGs and confounding, A/B testing, reading an experiment, and quasi-experiments."
keywords: "causal inference in R, potential outcomes, counterfactual, confounding, DAG, A/B testing, difference in differences, matching, average treatment effect, interactive course"
mathjax: false
webr: false
date: "2026-07-01"
curriculum_id: "6.100.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Causal Inference (Course)"
sidebar_order: "100"
---

# Causal Inference in R: A Hands-On Course

<p class="lead">Causal inference is the discipline of answering "did this actually cause that?" instead of settling for "these two things move together." This five-lesson interactive course builds the modern toolkit in R from the ground up, from the potential-outcomes idea at its core to the experiments and quasi-experiments you use when the data will not hand you an answer, with live diagrams you steer as you learn.</p>

A model can predict beautifully and still be useless for a decision. Prediction tells you what tends to come with what; a decision needs to know what would happen if you *changed* something. That gap is where careers and budgets are lost: the coupon that "worked" because loyal customers were the ones who got it, the training program that "helped" the people who were already improving. This course teaches you to tell a real effect from a convincing illusion, and to say honestly how sure you are allowed to be.

This is the causal-inference stop on the Data Scientist path. Each lesson is a guided, interactive experience: you manipulate live charts in the browser, answer checkpoints, and write and run R as you go. Every term is defined the moment it appears.

## The five lessons

### Lesson 1: Correlation, Causation and Potential Outcomes

The counterfactual frame that underpins everything else: what a causal effect actually *is*, why a correlation is never proof of one, and how a hidden confounder can manufacture an effect out of thin air. You will watch a coupon's raw $18 "effect" shrink to its true $8 once randomization strips the confounding away.

[Start Lesson 1: Correlation, Causation and Potential Outcomes](Correlation-Causation-and-Potential-Outcomes.html)

### Lesson 2: Causal Diagrams with DAGs

Draw your assumptions before you touch the data. A directed acyclic graph turns vague worries about "other factors" into a picture you can reason with, so you can read confounders and colliders straight off the graph and know which variables to control for and, just as important, which ones to leave alone.

[Start Lesson 2: Causal Diagrams with DAGs](Causal-Diagrams-with-DAGs.html)

### Lesson 3: A/B Testing and Experiment Design

The gold standard: randomize, and the confounding vanishes by construction. How randomization earns you a causal claim, what statistical power means, and how to work out the sample size you actually need *before* you run the test instead of regretting it after.

[Start Lesson 3: A/B Testing and Experiment Design](AB-Testing-and-Experiment-Design.html)

### Lesson 4: Reading an Experiment

A result arrives. Now what may you claim from it? Effect sizes versus p-values, what a confidence interval does and does not promise, and the difference between a finding that is statistically detectable and one that is large enough to act on.

[Start Lesson 4: Reading an Experiment](Reading-an-Experiment.html)

### Lesson 5: When You Cannot Randomize

Most of the time you cannot run the experiment you want. Matching and difference-in-differences let you approximate one from observational data, and this lesson is honest about the assumptions each method quietly asks you to buy, and how wrong you can be when those assumptions fail.

[Start Lesson 5: When You Cannot Randomize](When-You-Cannot-Randomize.html)

## Who this is for

You can run R and read its output, and you can read a scatterplot and take a mean. You do not need any statistics background beyond that; the course builds the causal ideas from scratch. It pairs naturally with the ML Workflow and Statistics material, but nothing there is assumed. If you have ever presented a chart and been asked "but does it *cause* the outcome?", this course is for you.

## What you will be able to do

- Define a causal effect using potential outcomes, and explain why correlation alone can never establish one
- Draw a DAG of your assumptions and read off which variables to control for and which to leave alone
- Design an A/B test with enough power, and compute the sample size before you launch
- Interpret an experiment honestly, separating a detectable effect from one worth acting on
- Reach for matching or difference-in-differences when randomization is off the table, and state the assumptions you are relying on

Ready? [Begin with Lesson 1](Correlation-Causation-and-Potential-Outcomes.html).
