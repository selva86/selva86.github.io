---
title: "Heterogeneous Treatment Effects in R: An Interactive Course"
slug: "Heterogeneous-Treatment-Effects-Course"
description: "Find who an effect is for and decide who to treat: conditional treatment effects, subgroup pre-specification, uplift modelling, causal forests with honest estimation, and bandits."
keywords: "heterogeneous treatment effects, CATE, conditional average treatment effect, subgroup analysis, uplift modelling, causal forest, honest estimation, multi-armed bandit, Thompson sampling, contextual bandit, targeting in R"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "3.70.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Heterogeneous Treatment Effects"
sidebar_order: "191"
---

# Heterogeneous Treatment Effects: A Hands-On Interactive Course

<p class="lead">An average effect of zero can hide a real gain for one group and a real loss for another, in exactly equal measure. Finding out who a change actually helps is a different question from whether it helps on average, and it needs different tools and more discipline.</p>

The course starts by constructing the case that should worry you: a flat headline containing a genuine win and a genuine loss. Average and conditional treatment effects are defined against each other on that dataset, so the distinction is something the reader has seen rather than a definition they have read.

Then the discipline, before the methods. The difference between a subgroup you declared and a subgroup you found is demonstrated by running the search on pure noise and finding something significant, which is the most honest way to teach pre-specification.

Uplift modelling follows: model the effect rather than the outcome, and discover that the two rank people differently, because the customers most likely to convert are often the ones your change moves least. Causal forests add the machinery for finding structure you did not hypothesise, with honest estimation that uses separate data to find a subgroup and to measure it.

It closes on bandits, which are what you reach for when you would rather act on heterogeneity than merely measure it. Thompson sampling is built from scratch and then extended with context, and the course is clear about the inference you give up in exchange.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Average and conditional treatment effects

ATE and CATE defined against each other, with a flat headline hiding a real gain for one group and a real loss for another.

Lesson 1 is coming soon.

### Lesson 2: Subgroup analysis and pre-specification

The difference between a hypothesis and a search, demonstrated by running the search on pure noise and finding a significant subgroup.

Lesson 2 is coming soon.

### Lesson 3: Uplift modelling

Modelling the effect rather than the outcome, and why the two rank people differently: the likeliest converters are often the least moved.

Lesson 3 is coming soon.

### Lesson 4: Causal forests and honest estimation

Using separate data to find a subgroup and to estimate its effect, and how much reusing one overstates the result.

Lesson 4 is coming soon.

### Lesson 5: Multi-armed bandits

Adaptive allocation, the regret it saves against a fixed split, and the inference it quietly costs you.

Lesson 5 is coming soon.

### Lesson 6: Thompson sampling and contextual bandits

The sampler built from scratch in a few lines, then extended to use context, with regret compared against epsilon-greedy.

Lesson 6 is coming soon.

### Lesson 7: Heterogeneity quiz

Section quiz.

Lesson 7 is coming soon.

## Who this is for

Anyone who has to decide not just whether to ship but to whom: product data scientists working on targeting, personalisation, pricing or lifecycle marketing. [Experiment Trustworthiness](Experiment-Trustworthiness-Course.html) covers the multiple-comparison problem this course runs into constantly. You should be able to fit a regression and a tree-based model.

## What you will be able to do

- Distinguish an average treatment effect from a conditional one, with data
- Tell a pre-specified subgroup from a discovered one, and report each honestly
- Fit an uplift model and rank users by effect rather than by outcome
- Use honest estimation so a discovered subgroup is not also measured on its own data
- Decide when an adaptive allocation beats a fixed split
- Implement Thompson sampling and reason about the inference it costs

Ready? [Begin with Lesson 1: Average and conditional treatment effects](Average-and-Conditional-Treatment-Effects.html).
