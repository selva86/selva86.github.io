---
title: "Causal Inference Without Randomisation in R: An Interactive Course"
slug: "Causal-Inference-Without-Randomisation-Course"
description: "Estimate an effect you could never randomise: potential outcomes, DAGs, propensity scores and weighting, matching, difference-in-differences, staggered adoption, regression discontinuity, instrumental variables, synthetic control, doubly robust estimation and sensitivity analysis."
keywords: "causal inference in R, potential outcomes, causal DAG, confounder, collider, propensity score, inverse probability weighting, matching, difference-in-differences, staggered adoption, two-way fixed effects, regression discontinuity, instrumental variables, 2SLS, synthetic control, doubly robust, double machine learning, sensitivity analysis, placebo test"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "3.80.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Causal Inference Without Randomisation"
sidebar_order: "192"
---

# Causal Inference Without Randomisation: A Hands-On Interactive Course

<p class="lead">Half of what a product team wants to know cannot be randomised. You cannot randomly assign who adopts a feature, which market gets a launch, or who was already a heavy user. This course is the toolkit for those questions, and about being honest about what each tool assumes.</p>

It starts with the framework rather than a method, because every technique that follows is a different way of standing in for the same missing thing. Potential outcomes name the counterfactual you never observe, and show why comparing adopters with non-adopters answers a question nobody asked.

DAGs come next as a way of writing down what you are assuming, and the lesson spends as much time on colliders as confounders, because controlling for the wrong variable creates bias rather than removing it, and that mistake is both common and invisible.

Then the methods, each introduced through the assumption it rests on. Weighting and matching build a pseudo-experiment and are checked for overlap first. Difference-in-differences leans entirely on parallel trends, and the course shows a case with perfect pre-trends that still misleads. Staggered adoption breaks the standard estimator in a way that produces negative weights, which is recovered rather than described. Discontinuities and instruments each manufacture a comparison out of structure, with their failure modes produced on purpose.

The last three lessons are about not fooling yourself. Synthetic control earns its counterfactual with a pre-period fit, doubly robust and double machine learning give you two chances to be right, and sensitivity analysis asks how strong an unmeasured confounder would have to be to explain the whole thing away. That number is the one that belongs in the write-up.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Potential outcomes and the fundamental problem

The counterfactual you never observe, and why comparing adopters with non-adopters answers a different question from the one asked.

Lesson 1 is coming soon.

### Lesson 2: Causal diagrams, confounders and colliders

DAGs as a way of writing down what you are assuming, and the bias that controlling for the wrong variable creates rather than removes.

Lesson 2 is coming soon.

### Lesson 3: Propensity scores and inverse probability weighting

Building a pseudo-experiment from observational data, and checking overlap before trusting any of it.

Lesson 3 is coming soon.

### Lesson 4: Matching

The sample you finish with is not the sample you started with, and the question you are answering changes quietly along with it.

Lesson 4 is coming soon.

### Lesson 5: Difference-in-differences

The parallel-trends assumption doing all the work, and a simulated case with perfect pre-trends that still gives the wrong answer.

Lesson 5 is coming soon.

### Lesson 6: Staggered adoption and two-way fixed effects

Why the standard estimator breaks when units switch on at different times, shown by recovering a negative weight.

Lesson 6 is coming soon.

### Lesson 7: Regression discontinuity

Threshold rules as natural experiments, the bandwidth choice that changes the answer, and the manipulation check on the running variable.

Lesson 7 is coming soon.

### Lesson 8: Instrumental variables and two-stage least squares

Encouragement designs, the three conditions marked testable or not, and the weak-instrument failure produced on purpose.

Lesson 8 is coming soon.

### Lesson 9: Synthetic control

One treated market against a weighted blend of the others, with the pre-period fit presented as the credential that earns the counterfactual.

Lesson 9 is coming soon.

### Lesson 10: Doubly robust estimation and double machine learning

Two chances to be right, what happens when both models are wrong, and the cross-fitting that removes regularisation bias.

Lesson 10 is coming soon.

### Lesson 11: Sensitivity analysis and placebo tests

How strong an unmeasured confounder would have to be to explain the result away, which is the number that belongs in the write-up.

Lesson 11 is coming soon.

### Lesson 12: Causal inference quiz

Section quiz.

Lesson 12 is coming soon.

## Who this is for

Anyone who has to answer a causal question without a randomiser: product data scientists measuring launches and rollouts, and analysts asked whether a feature caused a change. [Causal Inference from Data](Causal-Inference-from-Data-Course.html) covers the same family of methods from an academic and observational-study angle if that is closer to your work. You should be able to fit `lm()` and `glm()` and read a regression table.

## What you will be able to do

- State a causal question in potential-outcomes terms
- Draw a DAG and tell a confounder from a collider
- Build and check a propensity-score or weighted comparison
- Run a difference-in-differences and test what parallel trends actually implies
- Recognise when staggered adoption breaks a two-way fixed-effects estimate
- Use a threshold rule or an instrument to manufacture a comparison
- Build a synthetic control and judge it on its pre-period fit
- Report how strong a hidden confounder would need to be to overturn your result

Ready? [Begin with Lesson 1: Potential outcomes and the fundamental problem](Potential-Outcomes-and-the-Fundamental-Problem.html).
