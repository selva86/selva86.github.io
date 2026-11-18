---
title: "Choosing Statistical Tests in R: An Interactive Course"
slug: "Choosing-Statistical-Tests-Course"
description: "Learn how to choose and defend a statistical test in R across six interactive lessons: matching test to question, which assumptions actually matter, rank based tests, permutation tests, effect size, and equivalence testing with TOST."
keywords: "choosing a statistical test in R, which statistical test to use, test assumptions in R, normality test, Wilcoxon rank sum in R, Kruskal Wallis in R, permutation test in R, Cohen's d in R, effect size in R, equivalence testing, TOST in R"
mathjax: true
webr: false
date: "2026-11-17"
curriculum_id: "4.40.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Choosing Statistical Tests (Course)"
sidebar_order: "35"
---

# Choosing Statistical Tests in R: A Hands-On Interactive Course

<p class="lead">The question "which test should I use?" is usually answered with a flowchart, which works right up to the point where your data do not fit one of the boxes. This six-lesson interactive course replaces the flowchart with the reasoning behind it, so you can pick a test, defend the choice, and recognise the cases where the honest answer is that no standard test applies.</p>

Choosing a test is three decisions, not one: what is being compared, what kind of outcome was measured, and how the data were collected. This course walks those decisions end to end on real questions, then spends most of its time on what the flowchart leaves out. Which assumptions actually matter and which barely do. What a rank-based test is really testing, which is not what most papers claim it is. How to get an exact p-value from the design itself rather than from a distributional assumption. And how to answer the question a p-value cannot: how big is it.

The through-line is that a test is a claim about a procedure, and every one of these claims can be checked by simulation. So rather than being told that a t-test is robust to mild non-normality and fragile under dependence, you break each assumption on purpose and measure what it costs.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Choosing the right test

A path from the question to a named test, driven by three things: what is being compared, what kind of outcome was measured, and how the data were collected, meaning paired, independent, or more than two groups. Walked end to end on four real questions, one of which has no standard test that fits, where the honest answer is that a model is wanted instead. The point is the reasoning, so that an unfamiliar question is still tractable.

[Start Lesson 1: Choosing the right test](Choosing-the-Right-Test.html)

### Lesson 2: Checking assumptions and what breaks them

Every test assumes something, and the assumptions are nowhere near equally important. Normality, equal variance and independence are each violated on purpose by simulation, with the damage to the error rate measured, which shows a t-test shrugging off mild non-normality and being wrecked by dependence. Then why running a preliminary normality test is a poor way to decide anything, and what to look at instead.

[Start Lesson 2: Checking assumptions and what breaks them](Checking-Assumptions-and-What-Breaks-Them.html)

### Lesson 3: Testing on ranks with Wilcoxon and Kruskal-Wallis

Testing on ranks when the measurements themselves cannot carry the weight. What the Wilcoxon rank-sum and the Kruskal-Wallis actually test, which is a shift in distribution and not a difference in means, worked through the ranks by hand on a small sample before any R function is called. What you gain on a skewed outcome, what you give up in interpretability, and the common error of reporting a mean next to a rank test.

[Start Lesson 3: Testing on ranks with Wilcoxon and Kruskal-Wallis](Nonparametric-Tests-Wilcoxon-and-Kruskal-Wallis.html)

### Lesson 4: Permutation and randomization tests

An exact p-value that comes from the design rather than from a distributional assumption. Enumerate every relabelling for a sample small enough to do it completely, see that the p-value is a counting fact, then sample the permutations once n is realistic. Where the test is genuinely exact, what exchangeability means in practice, and why a permutation test on clustered data is still the wrong answer.

[Start Lesson 4: Permutation and randomization tests](Permutation-and-Randomization-Tests.html)

### Lesson 5: Reporting effect size, not just significance

The question a p-value cannot answer: how big is it. Cohen's d, a correlation and a risk ratio are all computed by hand from the same two groups a t-test was just run on, so significance and magnitude become two separate readings of one dataset rather than two names for one thing. Then the two simulations that settle it: a negligible difference reaching p below 0.05 at large n, and a large difference missing it at small n.

Lesson 5 is coming soon.

### Lesson 6: Equivalence testing with TOST

Showing that a difference is small enough to ignore, which no ordinary test can do. The equivalence bound is chosen on subject-matter grounds before the data are seen, two one-sided tests are run against it, and the pair can return four outcomes including an honest inconclusive. Why a non-significant t-test is not evidence of equivalence, and how the power calculation changes when the real question is sameness.

Lesson 6 is coming soon.

## Who this is for

Anyone who has run `t.test()` and wanted to know whether it was the right call. Hypothesis testing itself is built from scratch in the [t-test course](T-Test-Course.html), and the logic of p-values and intervals is developed in [Confidence Intervals and P-Values](Confidence-Intervals-and-P-Values-Course.html); either is useful first, neither is required. You should be able to run R, write a function, and use `replicate()` and `sample()`. Everything here runs on base R.

It is also the right course if a reviewer has ever asked you to justify a test choice, or to report an effect size next to a p-value, and you were not sure which effect size they meant.

## What you will be able to do

- Choose a test from the question, the outcome type and the study design, and say which of the three drove the decision
- Recognise the questions no standard test fits, and explain why a model is the better answer
- Rank test assumptions by how much a violation actually costs, measured rather than asserted
- Explain why a preliminary normality test is a poor gatekeeper, and what to use in its place
- Say what a Wilcoxon or Kruskal-Wallis test is testing, and avoid reporting a mean beside a rank test
- Run a permutation test, state what exchangeability requires, and spot where it fails
- Compute Cohen's d, a correlation and a risk ratio from the same two groups, and read significance and magnitude separately
- Set an equivalence bound in advance and run TOST, including reporting an inconclusive result honestly

Ready? [Begin with Lesson 1: Choosing the right test](Choosing-the-Right-Test.html).
