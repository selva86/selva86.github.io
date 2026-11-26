---
title: "Experiment Trustworthiness in R: An Interactive Course"
slug: "Experiment-Trustworthiness-Course"
description: "Learn to tell a real experiment result from a broken one: A/A tests, sample ratio mismatch, Twyman's law, internal and external validity, Simpson's paradox, and the cost of peeking."
keywords: "A/A test, sample ratio mismatch, SRM, Twyman law, internal validity, external validity, Simpson paradox, peeking, alpha inflation, false positive rate, experiment trustworthiness, online controlled experiments, A/B test pitfalls"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "3.40.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Experiment Trustworthiness"
sidebar_order: "187"
---

# Experiment Trustworthiness: A Hands-On Interactive Course

<p class="lead">Most of the work in experimentation is not producing results. It is disbelieving them long enough to find out which ones survive. This course is the set of checks that stand between a number on a dashboard and a decision somebody acts on.</p>

It opens on the A/A test, which is the cheapest and least used idea in the field. Run an experiment containing no change at all. Whatever it finds is your false-positive rate, and on most platforms it is worse than the nominal one, for reasons the lesson then goes looking for.

Sample ratio mismatch follows, because it is the check that saves the most time per second spent. The lesson covers what a failed SRM means mechanically, and why it makes the result unusable rather than merely suspicious, which is the part teams argue about and get wrong.

Then the general habit, under Twyman's law: any figure that looks interesting is usually wrong. The standard culprits are enumerated and the reader learns to check the pipeline before celebrating. Validity is split into the two questions it actually contains, whether the result is wrong for this test and whether it is wrong for everybody outside it, with a worked example of each.

It ends on the two ways a correct analysis still misleads. Simpson's paradox, where a result reverses in every segment and the mix shift explains it, and peeking, where the error rate under daily checking is simulated so the inflated number is one the reader produced rather than a warning they half-remember.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: The A/A test

A test containing no change at all. Whatever it finds is your false-positive rate, and it is usually worse than the nominal one.

Lesson 1 is coming soon.

### Lesson 2: Sample ratio mismatch

The cheapest check in experimentation. What a failed SRM means mechanically, and why the result is then unusable rather than merely suspicious.

Lesson 2 is coming soon.

### Lesson 3: Twyman's law

Any figure that looks interesting is usually wrong. The standard culprits, and the habit of checking the pipeline before celebrating.

Lesson 3 is coming soon.

### Lesson 4: Internal and external validity

What makes a result wrong for this test, versus wrong for everybody outside it, with a worked example of each.

Lesson 4 is coming soon.

### Lesson 5: Simpson's paradox

A result that reverses in every segment, and the mix shift that produces it, computed both ways.

Lesson 5 is coming soon.

### Lesson 6: Peeking and alpha inflation

Simulate the error rate under daily checking, so the inflated number is one the reader produced rather than a warning they half-remember.

Lesson 6 is coming soon.

### Lesson 7: Trustworthiness quiz

Section quiz.

Lesson 7 is coming soon.

## Who this is for

Anyone whose job involves believing or disbelieving an experiment: product data scientists, experimentation platform owners, and the people who sign off launches. [Confidence Intervals and P-Values](Confidence-Intervals-and-P-Values-Course.html) sets up the inference these checks lean on. You should be able to simulate a null distribution and read a confidence interval.

## What you will be able to do

- Run an A/A test and read your platform's real false-positive rate off it
- Detect a sample ratio mismatch and explain why it voids the result
- Apply Twyman's law: treat an extraordinary result as a bug until proven otherwise
- Separate threats to internal validity from threats to external validity
- Recognise Simpson's paradox and identify the mix shift behind it
- Quantify the error inflation caused by peeking at a running test

Ready? [Begin with Lesson 1: The A/A test](The-A-A-Test.html).
