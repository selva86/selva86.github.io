---
title: "Modeling with tidymodels: Quiz"
description: "A short, graded check on the tidymodels section: recipes, parsnip, workflows, rsample, yardstick, tuning, and workflow sets."
keywords: "R quiz, tidymodels, recipes, parsnip, workflows, rsample, yardstick, ds-tidymodels"
post_type: "LESSON"
curriculum_id: "6.50.8"
webr: true
lesson_access: "free"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "8"
course_total: "8"
course_landing: "R-tidymodels-Course.html"
lesson_kind: "quiz"
course_prev: "Compare-Many-Models-with-workflowsets.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have assembled the tidymodels stack: recipes for preprocessing, parsnip for models, workflows to bundle them, rsample to resample, yardstick to score, tune to search hyperparameters, and workflow sets to compare many models at once. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## What a recipe is for
A recipe in tidymodels is where you:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Fit the final model. ::no Fitting is the model's job; a recipe handles the data before the model sees it.
- Declare preprocessing steps once, then apply them the same way to train and new data. ::ok Correct: a recipe is a reusable plan (impute, dummy, normalise) prepped on train and baked consistently elsewhere.
- Store the raw CSV file. ::no A recipe describes transformations, not storage.
- Pick the evaluation metric. ::no Metrics live in yardstick, not in a recipe.

=== step === quiz
::eyebrow Question 2 of 6
## What parsnip provides
parsnip gives you:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- One consistent interface to many models across different engines. ::ok Correct: you specify a model once and swap the engine (ranger, xgboost, glmnet) without rewriting your code.
- A plotting system for results. ::no Plotting is not parsnip's role.
- A way to read databases. ::no That is dbplyr / DBI territory.
- Automatic feature selection. ::no parsnip standardises model specification, not feature selection.

=== step === quiz
::eyebrow Question 3 of 6
## What a workflow bundles
A workflow object holds:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Only the model. ::no That misses the preprocessing half of the pipeline.
- Only the recipe. ::no A recipe alone cannot make predictions.
- A preprocessor (recipe or formula) and a model, fitted and predicted as one unit. ::ok Correct: bundling them keeps preprocessing and modelling in lockstep, which also prevents leakage.
- The raw data and nothing else. ::no A workflow carries the *steps*, applied to data when you fit.

=== step === quiz
::eyebrow Question 4 of 6
## What rsample does
rsample is the package for:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Creating resamples: train/test splits, cross-validation folds, and bootstraps. ::ok Correct: rsample produces the splits you train and evaluate across.
- Drawing the final chart. ::no That is not its purpose.
- Computing the accuracy score. ::no Scoring is yardstick's job.
- Defining the model type. ::no Model specs come from parsnip.

=== step === quiz
::eyebrow Question 5 of 6
## What yardstick is for
yardstick exists to:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- Split the data into folds. ::no That is rsample.
- Compute metrics (RMSE, accuracy, ROC AUC) in a consistent way. ::ok Correct: yardstick turns predictions and truth into comparable scores.
- Preprocess the predictors. ::no Preprocessing is what recipes do.
- Tune hyperparameters. ::no Tuning is the tune package.

=== step === quiz
::eyebrow Question 6 of 6
## How tuning works
Hyperparameter tuning with the tune package works by:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Picking values at random and trusting them. ::no Tuning evaluates candidates rather than trusting a guess.
- Reusing the training score to choose settings. ::no Scoring on the training data overfits the choice; tuning uses held-out resamples.
- Trying candidate values across resamples and keeping the best-scoring setting. ::ok Correct: tune fits each candidate on cross-validation folds and compares their out-of-fold metrics.
- Always choosing the largest possible value. ::no The best setting is found by evaluation, not by going to an extreme.

=== step === concept
::eyebrow Run it: the resampling idea
## Cross-validation folds, by hand
rsample wraps this idea. Run it to split `iris` into 5 folds and confirm the rows are spread evenly.

```r
set.seed(1)
folds <- cut(sample(nrow(iris)), breaks = 5, labels = FALSE)
table(fold = folds)
```

Each fold takes a turn as the held-out set while the other four train, the rotation that gives an honest performance estimate.

=== step === concept
::eyebrow Run it: a metric, by hand
## What yardstick computes
yardstick standardises this calculation. Fit a quick model and score it with RMSE.

```r
fit <- lm(Sepal.Length ~ Petal.Length, data = iris)
pred <- predict(fit)
rmse <- sqrt(mean((iris$Sepal.Length - pred)^2))
round(rmse, 3)
```

RMSE is the typical prediction error in the target's own units; yardstick gives you this and dozens more through one consistent interface.

=== step === complete
## Section complete
Strong work. You can describe the whole tidymodels stack: recipes to preprocess, parsnip to specify models, workflows to bundle them, rsample to resample, yardstick to score, tune to search, and workflow sets to compare. That is a complete, leakage-safe modelling pipeline.
