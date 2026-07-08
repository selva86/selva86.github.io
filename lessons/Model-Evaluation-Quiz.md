---
title: "Model Evaluation and Tuning in R: Quiz"
description: "A short, graded check on the model-evaluation section: cross-validation, grouped and time-aware resampling, nested CV, hyperparameter search, scoring rules, comparing models, and turning metrics into decisions."
keywords: "R quiz, model evaluation, cross-validation, nested CV, hyperparameter tuning, scoring rules, log loss, comparing models, ds-evaluation-tuning"
post_type: "LESSON"
curriculum_id: "6.70.8"
webr: true
lesson_access: "pro"
course_id: "ds-evaluation-tuning"
course_title: "Model Evaluation and Tuning in R"
course_lesson: "8"
course_total: "8"
course_landing: "R-Model-Evaluation-Course.html"
lesson_kind: "quiz"
course_prev: "From-Metrics-to-Money.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have learned to estimate a model's real accuracy with cross-validation, resample safely when data is grouped or time-ordered, tune without fooling yourself using nested CV, search hyperparameters efficiently, pick scoring rules that match the decision, compare models with uncertainty, and translate a metric gain into money. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## Why not a single split
Compared with one train/test split, k-fold cross-validation gives:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- A guaranteed higher accuracy. ::no CV estimates accuracy more reliably; it does not raise it.
- A steadier estimate, because every row is tested once across the folds. ::ok Correct: averaging over folds reduces the luck of one particular split.
- A faster result than a single fit. ::no It fits the model k times, so it is slower, not faster.
- A model that cannot overfit. ::no CV measures performance; it does not prevent overfitting.

=== step === quiz
::eyebrow Question 2 of 6
## When random folds leak
Plain random k-fold folds give a too-good score when:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- The dataset is large. ::no Size alone does not cause leakage.
- The target is binary. ::no Target type is unrelated to this leak.
- Rows are grouped (repeated subjects) or ordered in time, so related rows land in both train and test. ::ok Correct: use grouped or time-aware splits so a subject or the future never leaks across folds.
- The features are already standardized. ::no Standardizing does not create this leak.

=== step === quiz
::eyebrow Question 3 of 6
## Why nest the cross-validation
Nested cross-validation exists because:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Tuning and evaluating on the same folds makes the reported score optimistic. ::ok Correct: the inner loop tunes, the outer loop scores unseen folds, so the number is honest.
- It runs faster than plain k-fold. ::no It runs many more fits; it is slower.
- It removes the need to choose hyperparameters. ::no It still tunes; it just keeps evaluation separate.
- It only applies to regression. ::no It applies to any tuned model.

=== step === quiz
::eyebrow Question 4 of 6
## Grid versus random search
Random search often beats grid search on the same budget when:
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- All hyperparameters matter equally. ::no When all matter equally, grid is competitive; random wins in the opposite case.
- Only a few hyperparameters actually matter, so random covers more distinct values of them. ::ok Correct: grid wastes trials on unimportant axes; random samples the important ones more richly.
- The model has no hyperparameters. ::no With none to tune, neither search applies.
- You want a fully reproducible grid of points. ::no A fixed grid is what guarantees exact points; that is grid search.

=== step === quiz
::eyebrow Question 5 of 6
## Choosing a scoring rule
For predicted probabilities, a proper scoring rule such as log loss is preferred over plain accuracy because it:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Ignores how confident the model was. ::no That is accuracy's weakness; log loss does the opposite.
- Always gives a higher number for better models. ::no Lower log loss is better, and the point is calibration, not direction.
- Rewards probabilities that are both correct and well-calibrated, punishing confident mistakes. ::ok Correct: a confident wrong prediction is penalized heavily, which accuracy never sees.
- Requires a balanced dataset. ::no It needs no class-balance assumption.

=== step === quiz
::eyebrow Question 6 of 6
## Is model A really better
Model A scored higher than model B on one test split. To claim a real improvement you should:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Compare their scores across many resamples and look at the variability of the difference. ::ok Correct: a difference smaller than its noise is not evidence of a better model.
- Trust the single split, since A won. ::no One split is exactly the luck you are trying to rule out.
- Pick whichever has more parameters. ::no Complexity is not a measure of quality.
- Retrain A until it wins by more. ::no Retraining to chase a win is how you fool yourself.

=== step === concept
::eyebrow Run it: k-fold is steadier than one split
## Five folds, five scores
Run a manual 5-fold cross-validation and watch the per-fold RMSE vary around a stable mean. One split could have handed you any single one of these.

```r
set.seed(1)
k <- 5
folds <- sample(rep(1:k, length.out = nrow(mtcars)))
rmse <- sapply(1:k, function(i) {
  tr <- mtcars[folds != i, ]; te <- mtcars[folds == i, ]
  p <- predict(lm(mpg ~ wt + hp, tr), te)
  sqrt(mean((te$mpg - p)^2))
})
round(rmse, 2)
round(mean(rmse), 2)
```

The individual folds scatter, but their average is the number you would report, and it is far steadier than any single one.

=== step === concept
::eyebrow Run it: log loss punishes confident mistakes
## Why the metric matters
Log loss scores probabilities, not just the final label. Run it and see a confident wrong call cost more than a hesitant one.

```r
y      <- c(1, 0, 1, 1, 0)
p_good <- c(0.9, 0.2, 0.8, 0.7, 0.3)   # calibrated
p_bad  <- c(0.9, 0.9, 0.8, 0.7, 0.3)   # one confident mistake
ll <- function(y, p) -mean(y * log(p) + (1 - y) * log(1 - p))
round(c(good = ll(y, p_good), bad = ll(y, p_bad)), 3)
```

The single overconfident wrong prediction drives the "bad" log loss up sharply, which plain accuracy would never register.

=== step === complete
## Section complete
Well done. You can estimate real accuracy with cross-validation, resample safely around groups and time, tune honestly with nested CV, search hyperparameters efficiently, choose scoring rules that match the decision, and compare models with uncertainty. Next: handling imbalanced classes and asymmetric costs.
