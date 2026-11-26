---
title: "Experiment Design and Power in R: An Interactive Course"
slug: "Experiment-Design-and-Power-Course"
description: "Learn to design an A/B test that answers the question it was built for: randomisation units, type I and type II error, power by simulation, the minimum detectable effect, staged rollout, and pre-registering the analysis."
keywords: "A/B test design, experiment design in R, randomisation unit, statistical power, power analysis by simulation, minimum detectable effect, MDE, sample size calculation, ramping, staged rollout, pre-registration, analysis plan, online controlled experiment"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "3.30.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Experiment Design and Power"
sidebar_order: "186"
---

# Experiment Design and Power: A Hands-On Interactive Course

<p class="lead">An experiment is mostly decided before anyone presses start. The unit you randomise, the effect you would act on, the number of users that implies, and what you wrote down beforehand about how you would analyse it. Get those wrong and no amount of care afterwards recovers the test.</p>

The course opens by running one experiment end to end in a single lesson, from the question to the decision, so the whole loop is visible before any part of it is pulled apart. Everything after that is a closer look at one step.

Randomisation units come first because the choice is irreversible once the test runs. User, session, device or cluster, each trading variance against validity, demonstrated by analysing one dataset at two different units and getting two different answers.

Then power, built rather than quoted. Type I error, type II error and power are simulated so the reader watches power rise as the sample grows, and the power calculation itself is done by simulating the design that will actually run, with its real metric and its real variance, rather than a formula for a design nobody runs. The minimum detectable effect is treated as what it is: a product decision about what would be worth shipping, which then becomes a sample size.

It closes on the two habits that separate a trustworthy team from a busy one. Ramping exposure in phases so a bad release is caught at one percent rather than fifty, and writing the analysis down before the data arrives, with the degrees of freedom that closes actually counted.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: An A/B test end to end

One experiment walked from question to decision in a single lesson, so the whole loop is visible before any part of it is examined closely.

Lesson 1 is coming soon.

### Lesson 2: Randomisation units

User, session, device or cluster. The same dataset analysed at two units gives two answers, which is the lesson.

Lesson 2 is coming soon.

### Lesson 3: Type I error, type II error and power

The three quantities every design trades against each other, built by simulation rather than asserted, so the reader can see power rise as the sample grows.

Lesson 3 is coming soon.

### Lesson 4: Power analysis by simulation

Simulating the design you will actually run, with the real metric and its real variance, instead of a formula for a design nobody runs.

Lesson 4 is coming soon.

### Lesson 5: Minimum detectable effect

The smallest effect worth shipping, chosen as a product decision first and then converted into a sample size.

Lesson 5 is coming soon.

### Lesson 6: Ramping and staged rollout

Exposure raised in phases, trading speed against quality and risk, and what each phase is actually for.

Lesson 6 is coming soon.

### Lesson 7: Pre-registration and the analysis plan

Writing the analysis down before the data, and counting the degrees of freedom that closes.

Lesson 7 is coming soon.

### Lesson 8: Experiment design quiz

Section quiz.

Lesson 8 is coming soon.

## Who this is for

Anyone who runs or reviews online experiments: product data scientists, growth engineers and the analysts who get handed the readout. [Experimental Design and A/B Testing](Experimental-Design-and-A-B-Testing-Course.html) covers the classical design tradition, blocking and factorial layouts, and complements this course rather than repeating it. You should know what a p-value is and be able to simulate from `rnorm()` and `rbinom()`.

## What you will be able to do

- Run an experiment end to end, from a question to a shipped decision
- Choose a randomisation unit and say what it costs you
- Explain type I error, type II error and power in terms of a design you simulated
- Compute power by simulating the test you will actually run
- Set a minimum detectable effect as a business decision and convert it to a sample size
- Ramp exposure in phases that trade speed against risk deliberately
- Write an analysis plan that closes the degrees of freedom you would otherwise spend

Ready? [Begin with Lesson 1: An A/B test end to end](An-A-B-Test-End-to-End.html).
