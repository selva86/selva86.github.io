---
title: "Machine Learning in Production: Quiz"
description: "A short, graded check on the production section: reproducible pipelines with targets, versioning models, serving with plumber, batch versus real-time inference, monitoring and drift, and an ML system design checklist."
keywords: "R quiz, machine learning production, targets, model versioning, vetiver, pins, plumber, batch inference, real-time inference, drift, monitoring, ds-production"
post_type: "LESSON"
curriculum_id: "6.120.7"
webr: true
lesson_access: "free"
course_id: "ds-production"
course_title: "Machine Learning in Production"
course_lesson: "7"
course_total: "7"
course_landing: "R-ML-Production-Course.html"
lesson_kind: "quiz"
course_prev: "An-ML-System-Design-Checklist.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have learned to build reproducible pipelines with targets, version models so you know which one is live, serve a model as an API with plumber, choose between batch and real-time inference, monitor a live model for drift, and work through a system-design checklist before shipping. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## What targets buys you
A pipeline tool like `targets` helps mainly because it:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Makes your models more accurate. ::no It manages the workflow; it does not change model quality.
- Reruns only the steps whose inputs changed, and keeps results in sync with the code. ::ok Correct: it tracks dependencies, so a small change does not force a full, error-prone rerun.
- Removes the need to write any R code. ::no You still write the steps; targets orchestrates them.
- Stores your data in the cloud automatically. ::no Storage is a separate concern.

=== step === quiz
::eyebrow Question 2 of 6
## Why version a model
Tools like vetiver and pins version a trained model so that you can:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Know exactly which model is deployed and roll back to a previous one if needed. ::ok Correct: a versioned, retrievable model is what makes "which one is live" and rollback answerable.
- Make the model train faster. ::no Versioning is about tracking, not training speed.
- Avoid ever retraining. ::no You will still retrain; versioning tracks each result.
- Guarantee the model never drifts. ::no Versioning records models; it does not stop drift.

=== step === quiz
::eyebrow Question 3 of 6
## What plumber does
Wrapping a model in a `plumber` API lets you:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Retrain the model on every request. ::no A serving API scores with the existing model; it does not retrain per call.
- Turn the model into a spreadsheet. ::no plumber exposes an HTTP endpoint, not a spreadsheet.
- Expose the model as an HTTP endpoint other systems can call to get predictions. ::ok Correct: plumber turns an R function into a web service any client can hit.
- Encrypt the training data. ::no That is unrelated to what plumber provides.

=== step === quiz
::eyebrow Question 4 of 6
## Batch or real-time
You should serve a model with real-time (online) inference rather than batch when:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- You score millions of rows overnight for a weekly report. ::no That is the classic case for batch scoring.
- A prediction is needed the instant a user acts, like fraud scoring at checkout. ::ok Correct: low-latency, per-event decisions call for real-time serving.
- You never need the predictions quickly. ::no If latency does not matter, batch is simpler and cheaper.
- The model has no hyperparameters. ::no Hyperparameters have nothing to do with the serving mode.

=== step === quiz
::eyebrow Question 5 of 6
## Spotting drift
Monitoring a live model for drift means watching for:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- The input distribution or accuracy shifting away from what the model was trained on. ::ok Correct: when today's inputs no longer look like training data, performance quietly degrades and it may be time to retrain.
- The R version changing on the server. ::no A runtime upgrade is an ops concern, not model drift.
- The number of features staying the same. ::no A stable schema is expected; drift is about the values, not the count.
- The training code being deleted. ::no Losing code is a source-control problem, not drift.

=== step === quiz
::eyebrow Question 6 of 6
## Leakage versus drift
Data leakage and model drift are different failures because:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- They are two names for the same thing. ::no They are distinct and happen at different times.
- Both happen only after deployment. ::no Leakage happens during training; drift happens after deployment.
- Leakage inflates your score before launch; drift degrades a live model after launch. ::ok Correct: leakage is a training-time mistake, drift is a runtime reality, and you guard against each differently.
- Neither affects the reported metrics. ::no Both distort the numbers you rely on.

=== step === concept
::eyebrow Run it: a drift score
## When inputs move away from training
Compare a reference (training) sample to a later, shifted sample with a population-stability-index style score. A larger value flags drift.

```r
set.seed(1)
ref  <- rnorm(1000, 0, 1)            # training distribution
live <- rnorm(1000, 0.6, 1)          # months later: shifted
br <- quantile(ref, probs = seq(0, 1, 0.1))
e  <- table(cut(ref,  br)) / length(ref)
o  <- table(cut(live, br)) / length(live)
psi <- sum((o - e) * log(pmax(o, 1e-4) / pmax(e, 1e-4)))
round(psi, 3)                        # compare to 0.1 (watch) and 0.2 (alert)
```

The score sits well above 0.2, the usual alert line: the live inputs no longer match training, so it is time to look at retraining.

=== step === concept
::eyebrow Run it: save and reload a model
## Versioning in miniature
Serving and versioning both rely on writing a trained model out and reading it back unchanged. Fit a model, save it, reload it, and confirm the predictions match.

```r
fit <- lm(mpg ~ wt + hp, data = mtcars)
path <- tempfile(fileext = ".rds")
saveRDS(fit, path)
reloaded <- readRDS(path)
identical(round(predict(fit), 4), round(predict(reloaded, mtcars), 4))
```

The reloaded model gives identical predictions: the exact round-trip that lets a serving system or a version store hand you back the model you registered.

=== step === complete
## Section complete
Excellent work, and that completes the Data Scientist track. You can build reproducible pipelines, version and serve models, choose batch or real-time inference, monitor for drift, and reason through a system-design checklist before shipping. You now have the full arc, from raw features to a model running in production.
