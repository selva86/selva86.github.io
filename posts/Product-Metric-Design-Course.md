---
title: "Product Metric Design in R: An Interactive Course"
slug: "Product-Metric-Design-Course"
description: "Learn to design metrics that can carry a decision: the overall evaluation criterion, guardrail metrics, Goodhart effects, multiple testing across metrics, proxy validity, metric sensitivity, and the delta method for ratio metrics."
keywords: "overall evaluation criterion, OEC, guardrail metrics, Goodhart law, metric gaming, multiple testing, proxy metrics, surrogacy, metric sensitivity, ratio metrics, delta method, variance of a ratio, product metrics in R, north star metric"
mathjax: false
webr: false
date: "2026-11-26"
curriculum_id: "3.20.0"
post_type: "C"
sidebar_section: "Statistics"
sidebar_title: "Product Metric Design"
sidebar_order: "185"
---

# Product Metric Design: A Hands-On Interactive Course

<p class="lead">Most experiments are lost before they are run, on the choice of what to measure. A metric that cannot detect the change, a proxy that stops tracking the thing it stood for, or twenty guardrails that between them raise an alarm three times in four. This course is about choosing numbers that can carry a decision.</p>

It starts with a taxonomy, because the single most common error is optimising an output metric that nobody on the team can move. Input, output, leading and lagging, with one product's numbers sorted into the four and the misclassification that sends a quarter in the wrong direction.

Then the idea that organises everything else: an overall evaluation criterion. One number that decides, assembled out of several, so an experiment has a single answer instead of twelve and an argument. The course is honest about what an OEC commits you to, and about Goodhart's law, which is demonstrated by optimising a proxy until the thing it proxied falls.

Guardrails come next, and with them a piece of arithmetic that surprises most teams. Three guardrails at the usual threshold raise a false alarm about fourteen percent of the time, ten about forty, twenty-five about seventy-three. The course simulates it, then corrects it, because the alternative is a team that learns to ignore its own alarms.

It ends on two technical lessons that pay for themselves immediately. Metric sensitivity, which decides before any design whether a test could detect the effect you care about. And ratio metrics, where the naive standard error is simply wrong, shown by simulating the coverage of the wrong interval before the delta method repairs it.

Each lesson is a guided, interactive experience: you run real R in the page, drive live simulations, answer checkpoints as you go, and write code yourself. Nothing to install.

## What the course covers

### Lesson 1: Metric Taxonomy: Input, Output, Leading, Lagging

The four kinds of metric and what each is for, with one product's numbers sorted into the taxonomy and the misclassification that causes a team to optimise the wrong one.

[Start Lesson 1: Metric Taxonomy: Input, Output, Leading, Lagging](Metric-Taxonomy-Input-Output-Leading-Lagging.html)

### Lesson 2: The Overall Evaluation Criterion

Combining several metrics into one criterion so a test has a single answer rather than twelve. Weighting, normalisation, and what the OEC commits you to.

[Start Lesson 2: The Overall Evaluation Criterion](The-Overall-Evaluation-Criterion.html)

### Lesson 3: Guardrail metrics

The metrics that block a launch even when the OEC improves. How to choose them, where to set thresholds, and why they must be fixed before the test runs.

Lesson 3 is coming soon.

### Lesson 4: Goodhart's law and metric gaming

What happens to a measure once it becomes a target, demonstrated by optimising a proxy until the real outcome falls.

Lesson 4 is coming soon.

### Lesson 5: Multiple testing across metrics

Three guardrails at the usual threshold false-alarm about 14% of the time, ten about 40%, twenty-five about 73%. Simulated, then corrected.

Lesson 5 is coming soon.

### Lesson 6: Proxy metrics and surrogacy

When a short-term stand-in is valid for a long-term outcome, the surrogacy conditions stated plainly, then violated so the estimate visibly breaks.

Lesson 6 is coming soon.

### Lesson 7: Metric sensitivity

Variance, traffic and effect size together decide what is detectable, so a metric can be the wrong instrument however long you run.

Lesson 7 is coming soon.

### Lesson 8: Ratio metrics and the delta method

Why a per-user rate breaks the naive standard error, shown by simulating the coverage of the wrong interval, then the delta method that fixes it.

Lesson 8 is coming soon.

### Lesson 9: Metric design quiz

Section quiz.

Lesson 9 is coming soon.

## Who this is for

Anyone who has to defend a metric choice to a room: product data scientists, analytics leads, and engineers who own a dashboard that drives decisions. [Confidence Intervals and P-Values](Confidence-Intervals-and-P-Values-Course.html) covers the inference this course assumes, though it is not required. You should be comfortable with a mean, a proportion and a standard error.

## What you will be able to do

- Sort a product's numbers into input, output, leading and lagging metrics
- Build an overall evaluation criterion and state what it commits you to
- Choose guardrail metrics and set their thresholds before a test runs
- Quantify and correct the false-alarm rate created by watching many metrics
- Judge whether a proxy metric is still valid for the outcome it stands in for
- Work out whether a metric can detect your effect before designing the test
- Compute a correct standard error for a per-user ratio metric

Ready? [Begin with Lesson 1: Metric taxonomy: input, output, leading and lagging](Metric-Taxonomy-Input-Output-Leading-Lagging.html).
