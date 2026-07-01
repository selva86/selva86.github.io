---
title: "Machine Learning in Production with R: A Course"
slug: "R-ML-Production-Course"
description: "Take an R model from a script to production in six interactive lessons: reproducible pipelines with targets, model versioning, REST APIs, inference patterns, and drift."
keywords: "machine learning in production R, MLOps in R, targets package, vetiver, pins, plumber API, model deployment R, model monitoring, data drift, ML system design, reproducible pipelines"
mathjax: false
webr: false
date: "2026-07-01"
curriculum_id: "6.120.0"
post_type: "C"
sidebar_section: "Machine Learning"
sidebar_title: "ML in Production (Course)"
sidebar_order: "120"
---

# Machine Learning in Production with R: A Course

<p class="lead">A model that scores well on your laptop is not in production. Production means someone else can rerun it, retrieve the exact version that made a prediction, call it from another system, and notice when it starts to go wrong. This six-lesson interactive course teaches that craft in R from the ground up, one tool at a time, with live examples you run in the browser.</p>

Most machine-learning courses stop at `predict()`. The hard part starts right after: the analysis has to rerun without a 40-minute wait every time you tweak a number, the model has to be versioned like code so you can roll back, it has to be reachable by the app that needs its scores, and its accuracy has to be watched after launch because the world it was trained on keeps moving. None of that is modeling. All of it is what separates a notebook from a system people depend on.

This course follows one data scientist, Dev, as his churn model goes from a single slow script to a monitored service. Every lesson introduces the specific R tool that solves the problem in front of him, how it works, and the trap that bites you if you use it without understanding it.

Each lesson is a guided, interactive experience: you run live R in the browser, answer checkpoints, and read every result as it appears.

## The six lessons

### Lesson 1: Reproducible Pipelines with targets

One long analysis script reruns everything on every edit, and lets your results quietly drift out of sync with your code. Learn to describe your analysis as a dependency graph with the **targets** package, so `tar_make()` reruns only the steps that actually changed and a one-character edit costs seconds instead of 40 minutes.

[Start Lesson 1: Reproducible Pipelines with targets](Reproducible-Pipelines-with-targets.html)

### Lesson 2: Versioning Models with vetiver and pins

A model file called `model_final_v2.rds` is not version control. Learn to register, version, and retrieve a fitted model the way you already do with code, using **vetiver** and **pins**, so you can always say which model made a prediction and roll back to an earlier one.

[Start Lesson 2: Versioning Models with vetiver and pins](Versioning-Models-with-vetiver-and-pins.html)

### Lesson 3: Serving a Model with plumber

A model that only runs inside your R session cannot be used by anything else. Learn to wrap a fitted model in a small REST API with **plumber**, so another application can send it data over HTTP and get a prediction back.

[Start Lesson 3: Serving a Model with plumber](Serving-a-Model-with-plumber.html)

### Lesson 4: Batch vs Real-Time Inference

Not every model needs to answer in milliseconds, and paying for that when you do not is a common, expensive mistake. Learn to match the serving pattern (scheduled batch scoring vs a live real-time endpoint) to the decision the prediction actually drives.

[Start Lesson 4: Batch vs Real-Time Inference](Batch-vs-Real-Time-Inference.html)

### Lesson 5: Monitoring and Drift

A model is most accurate the day it ships and slowly gets worse as the world moves away from its training data. Learn to watch the inputs and the performance after launch, spot drift before it hurts, and know when it is time to retrain.

[Start Lesson 5: Monitoring and Drift](Monitoring-and-Drift.html)

### Lesson 6: An ML System Design Checklist

Most models that fail in production fail for reasons you could have written down before launch. Learn the questions to answer before a model ships, from data lineage to rollback plan, as a checklist you can reuse on every project.

[Start Lesson 6: An ML System Design Checklist](An-ML-System-Design-Checklist.html)

## Who this is for

You can fit a model in R (a logistic regression, a tree, a random forest) and read its output, and you can write a function. You do not need any prior experience with pipelines, APIs, or MLOps tooling. Every idea is built from the ground up, with the problem it solves shown before the code that solves it. It helps to have met reproducibility with renv and git, but it is not required.

## What you will be able to do

- Turn a slow analysis script into a targets pipeline that reruns only the steps that changed
- Version, store, and retrieve a fitted model with vetiver and pins, so every prediction is traceable to a model
- Serve a model as a REST API with plumber that other systems can call
- Choose batch or real-time inference based on the decision the model supports, not on habit
- Monitor a live model for input and performance drift, and decide when to retrain
- Walk a checklist that catches the design gaps that sink models before they ship

Ready? [Begin with Lesson 1: Reproducible Pipelines with targets](Reproducible-Pipelines-with-targets.html).
