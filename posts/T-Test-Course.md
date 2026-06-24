---
title: "The t-test in R: A Hands-On Interactive Lesson"
slug: "T-Test-Course"
description: "Learn the t-test from scratch in one interactive lesson: why sample means wobble, the standard error, the t-statistic, p-values, effect size, and t.test() in R."
keywords: "t-test in R, t test, t.test, hypothesis testing, p-value, t-statistic, standard error, effect size, one-sample t-test, two-sample t-test, paired t-test, Welch t-test"
mathjax: false
webr: false
date: "2026-06-24"
curriculum_id: "4.2.1"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "The t-test (Lesson)"
sidebar_order: "40"
---

# The t-test in R: A Hands-On Interactive Lesson

<p class="lead">The t-test answers one question: is the difference you measured real, or could plain sampling luck have produced it? This interactive lesson builds the test from the ground up, so every number it reports finally makes sense.</p>

Most tutorials hand you `t.test()` and a rule about p-values below 0.05. This lesson starts one level deeper, with the reason a difference is never proof on its own, and builds up until you can run a t-test in R and read every figure it gives you back.

It is a guided, interactive experience: you drive live simulations in the browser, answer checkpoints as you go, and write R yourself.

## What the lesson covers

You start with the catch that makes the whole problem interesting: take two samples from the very same population and their means still differ, purely by chance. From there the lesson builds the machinery piece by piece, the standard error that measures that wobble, the t-statistic as signal over noise, and the p-value as the test's verdict, then puts it to work on real data.

[Start the lesson: The t-test from scratch](The-t-test-from-scratch.html)

## Who this is for

You can run R and make a vector, and you know what a mean and a standard deviation are. You do not need any prior statistics. Everything else, the standard error, the t-distribution, the p-value, is built here from scratch.

## What you will be able to do

- Say, in plain words, what question a t-test answers, and compute the t-statistic by hand
- Read a p-value correctly, and spot the misreading almost everyone makes
- Run a one-sample, two-sample and paired t-test in R and interpret every number
- Tell statistical significance apart from a real effect, and name the ways the test is misused

Ready? [Begin the lesson](The-t-test-from-scratch.html).
