---
title: "Interference and Network Effects in R: An Interactive Course"
slug: "Interference-and-Network-Effects-Course"
description: "Run a valid experiment when one user affects another: SUTVA, cluster randomisation, switchback experiments, geo experiments, and detecting interference you did not design for."
keywords: "SUTVA, interference, network effects, spillover, cluster randomisation, switchback experiment, geo experiment, marketplace experiment, intra-cluster correlation, A/B testing in R"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "3.60.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Interference and Network Effects"
sidebar_order: "190"
---

# Interference and Network Effects: A Hands-On Interactive Course

<p class="lead">Every A/B test makes one assumption silently: that what happens to one user does not change what happens to another. In a marketplace, a social graph, or anything with shared inventory, that assumption is false, and the test is biased in a direction you can work out in advance.</p>

The course names the assumption first and then breaks it on purpose. A simulated marketplace where treated buyers take supply from control buyers produces a measured effect that is larger than the real one, and the lesson recovers both numbers so the bias has a size and a sign rather than a warning label.

Cluster randomisation is the first answer: randomise groups instead of individuals, so the spillover happens inside a unit rather than across the boundary. The price is paid in variance, and the intra-cluster correlation that sets that price is computed rather than assumed.

Switchbacks handle the case where there is only one marketplace to experiment on, by turning the change on and off over time instead of splitting users. Geo experiments do the same across cities or regions, and the lesson is candid about the small number of units you end up with and what that does to power.

It closes on detection, because interference is usually discovered rather than anticipated. The tests that reveal spillover after the fact are run on a dataset that has it, so the reader has seen the signal before they need to recognise it.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: SUTVA and the no-interference assumption

The assumption every A/B test makes silently, stated precisely, then broken on a simulated marketplace so the bias has a size and a sign.

Lesson 1 is coming soon.

### Lesson 2: Cluster randomisation

Randomising groups rather than individuals, the intra-cluster correlation that drives the cost, and the variance price it charges.

Lesson 2 is coming soon.

### Lesson 3: Switchback experiments

Turning the whole system on and off over time, for when there is only one marketplace to experiment on, and the carryover it must handle.

Lesson 3 is coming soon.

### Lesson 4: Geo experiments

Whole cities or regions as units, how comparable ones are chosen, and the small number of units you end up with.

Lesson 4 is coming soon.

### Lesson 5: Interference detection

Tests that reveal spillover you did not design for, run after the fact on a dataset that has it.

Lesson 5 is coming soon.

### Lesson 6: Interference quiz

Section quiz.

Lesson 6 is coming soon.

## Who this is for

Anyone experimenting on a product where users interact: marketplaces, social products, delivery and ride-hailing, ad auctions, and anything with shared supply. [Experiment Design and Power](Experiment-Design-and-Power-Course.html) sets up the randomisation-unit choice this course extends. You should be able to simulate data and fit a mixed or clustered model.

## What you will be able to do

- State the no-interference assumption precisely and recognise when it fails
- Predict the direction and rough size of interference bias before running a test
- Design a cluster-randomised experiment and compute its variance cost
- Run and analyse a switchback experiment on a single marketplace
- Set up a geo experiment and choose comparable regions
- Detect spillover in an experiment that was not designed for it

Ready? [Begin with Lesson 1: SUTVA and the no-interference assumption](SUTVA-and-the-No-Interference-Assumption.html).
