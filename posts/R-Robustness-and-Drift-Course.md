---
title: "Robustness, Drift and Distribution Shift in R: A Course"
slug: "R-Robustness-and-Drift-Course"
description: "Seven interactive R lessons on keeping a deployed model honest: distribution shift, PSI drift detection, novelty detection, worst-group accuracy, DRO, and adversarial robustness."
keywords: "distribution shift in R, data drift, covariate shift, concept drift, population stability index, PSI, out-of-distribution detection, Mahalanobis distance, worst-group accuracy, distributionally robust optimization, DRO, adversarial robustness, FGSM, model monitoring, interactive course"
mathjax: false
webr: false
date: "2026-07-03"
curriculum_id: "6.190.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "Robustness & Drift (Course)"
sidebar_order: "190"
---

# Robustness, Drift and Distribution Shift in R: A Course

<p class="lead">A model that scored well on a test set can still fail in production: the inputs drift, a strange request arrives, a subgroup is quietly failed, or an adversary aims straight at the boundary. This seven-lesson interactive course teaches you to see each failure coming and act on it, distribution shift, PSI drift detection, Mahalanobis novelty detection, worst-group accuracy, distributionally robust optimization, adversarial robustness, and a monitoring playbook, each taught in R with live diagrams you steer as you learn.</p>

Training accuracy is a promise about the past. The moment a model goes live it meets a world that keeps moving: customers change, new segments appear, an attacker probes the filter, and the true labels that would tell you something broke do not arrive for weeks. This course is the practitioner's answer to "the model shipped, now what?", a sequence of detectors and defenses, each built for a specific way a deployed model quietly goes wrong, and each paired with the honest question of how sure it lets you be.

This is the robustness stop on the advanced Data Scientist path. It picks up where a first end-to-end model leaves off and turns "monitoring" from a vague intention into working checks you can defend: what to log, which alarm to wire, and when an alert should page a human instead of rolling the model back on its own. Every lesson is a guided, interactive experience: you manipulate live charts in the browser, answer checkpoints, and write and run R as you go. Every term is defined the moment it appears. The first lesson is free to try; the rest unlock with a subscription.

## The seven lessons

### Lesson 1: Kinds of Distribution Shift

Start with the vocabulary that decides your whole response. Separate covariate shift (the inputs move), label shift (the base rate moves), and concept shift (the input-to-label rule itself changes), and see with a live model why the same accuracy drop demands recalibration, reweighting, or a full retrain depending on which one you are facing.

[Start Lesson 1: Kinds of Distribution Shift](Kinds-of-Distribution-Shift.html)

### Lesson 2: Detecting Distribution Shift

Catch a moving distribution before the labels arrive. Build the Population Stability Index and the Kolmogorov-Smirnov test from scratch, add a classifier two-sample test, and learn to read each one against a control limit so you know when "the world changed" is real.

[Start Lesson 2: Detecting Distribution Shift](Detecting-Distribution-Shift.html)

### Lesson 3: Adapting to Drift: Reweighting and Retraining

Once you have detected a shift, do something about it. Correct covariate shift by importance-weighting training rows toward the new input mix, watch the effective sample size that tells you when reweighting is running out of road, and set a principled trigger for when to retrain on fresh labeled data instead.

[Start Lesson 3: Adapting to Drift: Reweighting and Retraining](Adapting-to-Drift-Reweighting-and-Retraining.html)

### Lesson 4: Out-of-Distribution and Novelty Detection

Ask the sharp single-input question the drift monitors cannot. Score how unusual one transaction is with the Mahalanobis distance (distance measured in the training cloud's own shape), turn the score into a flag with a chi-square cutoff, and tune the false-positive-versus-detection tradeoff the threshold controls.

[Start Lesson 4: Out-of-Distribution and Novelty Detection](Out-of-Distribution-and-Novelty-Detection.html)

### Lesson 5: Group Robustness and DRO

A model can post excellent average accuracy while quietly failing an entire subgroup. Measure worst-group accuracy, trace the failure to a spurious feature that reverses sign for a minority, and train a group-reweighted (DRO) model that lifts the worst group, reading the deliberate average-versus-worst tradeoff.

[Start Lesson 5: Group Robustness and DRO](Group-Robustness-and-DRO.html)

### Lesson 6: Adversarial Robustness

Meet the first failure with a mind behind it. Build the fast gradient sign method (FGSM) in R, watch a tiny nudge flip a confident, correct prediction, reason about the perturbation budget, and harden the model with adversarial training, always stated against an explicit threat model.

[Start Lesson 6: Adversarial Robustness](Adversarial-Robustness.html)

### Lesson 7: A Monitoring and Robustness Playbook

Assemble the whole section into one thing you can run in production. Decide what to log, stack the detectors by latency into a layered alarm system, write a severity-to-response policy that says when to page a human versus roll back automatically, and run a pre-deploy gate that pairs a worst-group floor with an adversarial ceiling.

[Start Lesson 7: A Monitoring and Robustness Playbook](A-Monitoring-and-Robustness-Playbook.html)

### Section quiz: check what stuck

Ten graded questions across the whole section, kinds of shift, PSI and drift detection, importance weighting, Mahalanobis novelty detection, worst-group accuracy and DRO, adversarial robustness and FGSM, and the monitoring playbook, plus two live R snippets you can run. A quick way to find the ideas worth a second pass before you move on.

[Take the Robustness and Drift quiz](Robustness-and-Drift-Quiz.html)

## Who this is for

You can run R and read its output, and you are comfortable fitting and reading a logistic regression. You have trained a model and want to know how to keep it healthy once it is live. Data scientists and ML engineers who own a deployed model, or are about to, will get the most out of this. If you have ever shipped a model that looked great in validation and then drifted, failed a segment, or got gamed, this course hands you the tools to catch it and the judgment to respond in proportion to what you actually know.

## What you will be able to do

- Name the three kinds of distribution shift and choose the right response (recalibrate, reweight, or retrain) for each
- Detect a moving input distribution before labels arrive, with the PSI, the KS test, and a classifier two-sample test
- Correct covariate shift with importance weighting, and recognize when its effective sample size has collapsed
- Flag a single out-of-distribution input with a Mahalanobis novelty score and a chi-square cutoff you tune to a false-alarm budget
- Expose a failing subgroup with worst-group accuracy and lift it with distributionally robust optimization
- Craft an FGSM adversarial example and defend against it with adversarial training inside a stated threat model
- Wire it all into a monitoring playbook: what to log, which alarms to stack, and when to page a human versus roll back

Ready? [Begin with Lesson 1: Kinds of Distribution Shift](Kinds-of-Distribution-Shift.html).
