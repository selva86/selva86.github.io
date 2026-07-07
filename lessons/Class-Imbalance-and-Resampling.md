---
title: "Imbalanced Classification Lesson 2: Class Imbalance and Resampling"
catalog_blurb: "How to rebalance a rare class without leaking into your test results."
description: "Fix class imbalance in R: why accuracy lies, undersampling, oversampling and SMOTE, resampling only the training data to avoid leakage, and when not to resample."
keywords: "class imbalance, resampling, SMOTE, oversampling, undersampling, themis, data leakage, imbalanced classification, minority class, recall, R"
post_type: "LESSON"
curriculum_id: "6.80.2"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-imbalanced-classification"
course_title: "Imbalanced Classification in R"
course_lesson: "2"
course_total: "6"
course_landing: "R-Imbalanced-Classification-Course.html"
course_next: "Thresholds-Under-Asymmetric-Costs.html"
course_prev: "Beyond-Binary-Multiclass-Classification.html"
---

=== step === cover
::eyebrow Lesson 2 of 6
## Class Imbalance and Resampling

Priya is a fraud analyst at a bank. Last month's data has 10,000 card transactions, and exactly 52 of them were fraud. That is one fraud for every 191 legitimate transactions. She trains a classifier, and it comes back 99.5% accurate. She is thrilled, until she checks how many of the 52 frauds it actually caught: zero.

That is the trap of an imbalanced problem, where one class is far rarer than the other. This lesson is about seeing the trap, and the main tool for climbing out of it: **resampling** the training data so the rare class stops being invisible.

By the end you will be able to:

- Explain why plain accuracy is misleading when one class is rare, and read recall and precision instead
- Tell undersampling, oversampling and **SMOTE** apart, and describe what each does to the training rows
- Rebalance a training set in R and measure whether it actually helped
- Resample the **training data only**, so you never leak the fix into your own evaluation
- Judge when to reach for resampling, and when a different tool is better

**Prerequisites:** Lesson 1 of this course, [Beyond Binary: Multiclass Classification](Beyond-Binary-Multiclass-Classification.html) (the confusion matrix, precision and recall); a classifier that outputs a probability, from [Reading a Classifier](Reading-a-Classifier.html); a [train/test split and what leakage is](Train-Validation-Test-and-Data-Leakage.html); and you can [fit a model in R](Your-First-End-to-End-Model-in-R.html).

The panel below is Priya's problem in miniature: a sea of ordinary transactions (blue) with a handful of frauds (orange) huddled in one corner. Toggle the buttons to see the two fixes this lesson builds.

::widget imbalance-resample {}

=== step === concept
::eyebrow The trap
## The 99.5% trap

Let us rebuild Priya's month from scratch so every number here is real. Each transaction has a size, an hour, a count of recent declined attempts, and whether the card is foreign. Fraud is rare and tends to be large, late, foreign, and preceded by declines.

```r
set.seed(1)
n <- 10000
tx <- data.frame(
  amount     = round(rlnorm(n, 3.4, 1.0), 2),   # transaction size in dollars
  hour       = sample(0:23, n, replace = TRUE),  # hour of day, 0 to 23
  n_declines = rpois(n, 0.3),                    # recent declined attempts
  foreign    = rbinom(n, 1, 0.08)                # foreign card? 1 = yes
)
risk <- -6.4 + 0.004*tx$amount + 0.8*(tx$hour < 5) + 0.9*tx$n_declines + 1.1*tx$foreign
tx$fraud <- factor(ifelse(runif(n) < plogis(risk), "yes", "no"), levels = c("no", "yes"))
table(tx$fraud)
#>
#>   no  yes
#> 9948   52
```

There it is: 9,948 legitimate transactions and 52 frauds. Now split off a test set to grade the model honestly, exactly as you would in real life.

```r
set.seed(7)
train_idx <- sample(nrow(tx), 7000)   # 70% to train on
train <- tx[train_idx, ]
test  <- tx[-train_idx, ]             # 30% held out, never trained on
table(test$fraud)
#>
#>   no  yes
#> 2986   14
```

Fourteen of the test frauds are what we need the model to catch. Fit a logistic regression on the training data and look at how it does on the held-out test set. The table has the truth down the rows and the model's guess across the columns.

```r
model <- glm(fraud ~ amount + hour + n_declines + foreign, data = train, family = binomial)
pred  <- factor(ifelse(predict(model, test, type = "response") > 0.5, "yes", "no"),
                levels = c("no", "yes"))
table(actual = test$fraud, predicted = pred)
#>       predicted
#> actual   no  yes
#>    no  2986    0
#>    yes   14    0
mean(pred == test$fraud)   # overall accuracy
#> [1] 0.9953333
```

Look at that bottom row. The model labelled every single transaction "no fraud". It caught **0 of the 14** frauds, and still scored **99.5% accuracy**, because guessing the majority class is almost always right when the majority is 99.5% of the data. Accuracy rewarded the model for ignoring exactly the thing Priya cares about.

[KEY INSIGHT]
When one class is rare, a model can score sky-high accuracy by never predicting the rare class at all. Accuracy measures the wrong thing here. You need a score that notices the minority.

=== step === quiz
::eyebrow Check yourself
## Why is 99.5% not good enough?

Priya's model is 99.5% accurate on the held-out test set but catches 0 of the 14 frauds. What is the real problem?

::quiz {"correct":2,"gate":true,"difficulty":"beginner"}
- The model is basically fine; 99.5% accuracy is excellent and a few missed frauds is unavoidable ::no It caught ZERO frauds. The whole job is to catch fraud, and on that job the model scored 0%. High accuracy is hiding a total failure on the class that matters.
- Accuracy is the wrong yardstick here: with 99.5% legitimate transactions, always guessing "no fraud" scores 99.5% while catching nothing ::ok Exactly. The base rate alone gives you 99.5%. A useful score has to measure how many of the 52 frauds you actually catch, not how often you are right overall.
- The model needs more training data before it can work ::no More rows of the same 191-to-1 mix would not help; the model would still find "always predict no" the easiest way to be accurate. The metric, not the data volume, is the problem.

=== step === concept
::eyebrow The right scorecard
## A scorecard that notices the rare class

To measure a rare-class model you count four outcomes on the fraud class: true positives \(TP\) (frauds correctly flagged), false negatives \(FN\) (frauds missed), false positives \(FP\) (good transactions wrongly flagged), and true negatives \(TN\). Two numbers built from these tell the real story.

**Recall** is the fraction of actual frauds you caught: \( \text{recall} = \dfrac{TP}{TP + FN} \). Priya's model caught 0 of 14, so its recall is 0.

**Precision** is the fraction of your fraud alarms that were right: \( \text{precision} = \dfrac{TP}{TP + FP} \). When the model never raises an alarm, precision is undefined (you cannot divide by zero alarms).

They trade off, so people often combine them into the **F1 score**, their harmonic mean: \( F_1 = 2 \cdot \dfrac{\text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}} \). And **balanced accuracy**, \( \tfrac{1}{2}\left(\text{recall}_\text{fraud} + \text{recall}_\text{legit}\right) \), averages the two classes' recalls so the rare class counts as much as the common one.

Compute recall and precision for Priya's model to confirm what the confusion matrix already told us.

```r
recall    <- function(actual, pred) sum(pred == "yes" & actual == "yes") / sum(actual == "yes")
precision <- function(actual, pred) {
  flagged <- sum(pred == "yes")
  if (flagged == 0) NA else sum(pred == "yes" & actual == "yes") / flagged
}
c(recall = recall(test$fraud, pred), precision = precision(test$fraud, pred))
#>    recall precision
#>         0        NA
```

Recall 0, precision undefined. This is the honest scorecard, and it is what resampling is going to move.

=== step === widget
::eyebrow The fix, three flavours
## Three ways to rebalance

The model ignores fraud because fraud is drowned out during training: for every fraud it sees roughly 191 non-frauds, so "always say no" minimises its training error. Resampling changes the training set's balance so the rare class gets a real say. There are three common moves. Toggle them below and watch the minority region fill in.

- **Undersampling**: throw away most of the majority rows until the classes are even. Fast, but you discard real data.
- **Oversampling**: copy the minority rows until the classes are even. Keeps all the data, but the copies are exact duplicates, which can lead the model to memorise those few points.
- **SMOTE**: instead of copying minority points, *synthesise* new ones between existing minority neighbours. Balanced counts, and more variety than plain duplication.

::widget imbalance-resample {}

Notice the trade in the readout: oversampling and SMOTE both reach balanced counts, but SMOTE spreads new points through the minority region rather than stacking copies on the same spots. Next we build a SMOTE point by hand so it is not magic.

=== step === concept
::eyebrow How SMOTE works
## How SMOTE invents a new case

Copying a fraud row teaches the model nothing new, it just sees the same point twice. SMOTE (Synthetic Minority Over-sampling Technique) is cleverer: it takes a real fraud, picks one of its fraud neighbours, and drops a brand-new point somewhere on the straight line between them.

If \(x_i\) is a real fraud transaction and \(x_j\) is a nearby fraud, SMOTE creates

\[ x_\text{new} = x_i + \lambda\,(x_j - x_i), \qquad \lambda \sim \text{Uniform}(0, 1) \]

where \(\lambda\) (lambda) is a random number between 0 and 1 saying how far along the line to go: \(\lambda = 0\) lands on \(x_i\), \(\lambda = 1\) lands on \(x_j\), and \(\lambda = 0.5\) sits exactly halfway. Let us build one from two of Priya's real frauds, using just the amount and hour so we can read it.

```r
set.seed(3)
minority  <- train[train$fraud == "yes", c("amount", "hour")]  # the real frauds
x_i       <- minority[1, ]           # one real fraud
x_j       <- minority[6, ]           # another real fraud
lambda    <- runif(1)                # how far along the line, 0 to 1
synthetic <- x_i + lambda * (x_j - x_i)
rbind(real_i = x_i, real_j = x_j, synthetic = round(synthetic, 2))
#>           amount  hour
#> real_i     10.70 11.00
#> real_j      4.86  6.00
#> synthetic   9.72 10.16
```

Here \(\lambda\) came out at 0.168, so the synthetic fraud sits about 17% of the way from the first real fraud toward the second: amount 9.72 (between 10.70 and 4.86) and hour 10.16 (between 11 and 6). It is a plausible fraud the model has never seen, built entirely from two that really happened. Repeat this until the minority is as large as the majority and you have SMOTE.

=== step === quiz
::eyebrow Check yourself
## SMOTE vs plain oversampling

Plain oversampling and SMOTE both end with a balanced training set. What does SMOTE do that plain oversampling does not?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- It removes majority rows to make room for the minority ::no That is undersampling. SMOTE only adds minority points; it never touches the majority rows.
- It weights the minority rows more heavily in the loss function without changing their count ::no That is class weighting, a different technique (we meet it at the end). SMOTE physically adds new rows to the data.
- It creates new, in-between minority points instead of exact copies, giving the minority class more variety ::ok Right. Oversampling stacks identical copies on the same spots; SMOTE interpolates new points between real neighbours, so the model sees a more varied minority region instead of a few points repeated.

=== step === tryit
::eyebrow Your turn
## Balance the training set

The simplest fix is plain oversampling: duplicate random minority rows until the two classes are even. The trick is that you must sample **with replacement**, so the same minority row can be picked more than once (there are only 38 frauds in the training set but you need thousands of copies). Fill in the blank.

```r
minority_rows <- which(train$fraud == "yes")
n_needed      <- sum(train$fraud == "no") - length(minority_rows)  # how many copies to add
set.seed(42)                                                       # so the draw is reproducible
extra         <- sample(minority_rows, n_needed, replace = ____)
balanced      <- train[c(seq_len(nrow(train)), extra), ]
table(balanced$fraud)
```
::check {"regex":"replace\\s*=\\s*TRUE","gate":true,"difficulty":"beginner","ok":"Right: replace = TRUE lets the 38 real frauds be drawn thousands of times, filling the minority up to the majority count.","no":"You are drawing thousands of rows from only 38 frauds, so you must sample WITH replacement: set replace = TRUE."}
::solution
```r
minority_rows <- which(train$fraud == "yes")
n_needed      <- sum(train$fraud == "no") - length(minority_rows)
set.seed(42)
extra         <- sample(minority_rows, n_needed, replace = TRUE)
balanced      <- train[c(seq_len(nrow(train)), extra), ]
table(balanced$fraud)
#>
#>   no  yes
#> 6962 6962
```

=== step === concept
::eyebrow Did it work?
## Did it actually help?

Now retrain on the balanced training set and grade it on the **same untouched test set** as before. If resampling works, the frauds the raw model missed should start getting caught.

```r
model_bal <- glm(fraud ~ amount + hour + n_declines + foreign, data = balanced, family = binomial)
pred_bal  <- factor(ifelse(predict(model_bal, test, type = "response") > 0.5, "yes", "no"),
                    levels = c("no", "yes"))
table(actual = test$fraud, predicted = pred_bal)
#>       predicted
#> actual   no  yes
#>    no  2150  836
#>    yes    7    7
c(recall = recall(test$fraud, pred_bal), precision = precision(test$fraud, pred_bal))
#>      recall   precision
#> 0.500000000 0.008303677
mean(pred_bal == test$fraud)   # accuracy, on purpose lower
#> [1] 0.719
```

Recall went from 0 to **0.5**: the model now catches 7 of the 14 frauds instead of none. But look at the cost. It flagged **836 legitimate transactions** as fraud, so precision is a dismal 0.8%, and overall accuracy fell from 99.5% to 72%.

[NOTE]
Resampling did its one job: it stopped the model ignoring the rare class, so recall jumped. It also bought that recall with a flood of false alarms. That trade is expected, not a bug. Later lessons recover the balance by moving the decision threshold ([Lesson 3](Thresholds-Under-Asymmetric-Costs.html)) and calibrating the probabilities ([Lesson 5](Calibrating-Predicted-Probabilities.html)). Resampling's job is just to make the minority visible in the first place.

=== step === widget
::eyebrow The dangerous mistake
## The leak that flatters you

There is one way to use resampling that quietly ruins everything, and almost everyone does it once. The rule is simple: **resample the training data only, after the split, and never let it touch the data you score on.** Here is the correct order.

::widget process-flow {"steps":[{"title":"Split first","sub":"hold out a test set before touching the classes"},{"title":"Resample the training rows only","sub":"oversample or SMOTE inside the training set"},{"title":"Fit the model","sub":"train on the rebalanced training data"},{"title":"Score the untouched test","sub":"evaluate on the real, imbalanced test set"}]}

Break that order, by balancing the whole dataset *before* you split, and duplicated or synthetic copies of the same frauds land in both train and test. The model effectively studies the answers to its own exam. Watch the reported recall balloon.

```r
set.seed(11)
all_min <- which(tx$fraud == "yes")
all_maj <- which(tx$fraud == "no")
tx_bal  <- tx[c(seq_len(nrow(tx)),
                sample(all_min, length(all_maj) - length(all_min), replace = TRUE)), ]
leak_idx  <- sample(nrow(tx_bal), 0.7 * nrow(tx_bal))       # split AFTER balancing (wrong)
leak_fit  <- glm(fraud ~ amount + hour + n_declines + foreign,
                 data = tx_bal[leak_idx, ], family = binomial)
leak_test <- tx_bal[-leak_idx, ]
leak_pred <- factor(ifelse(predict(leak_fit, leak_test, type = "response") > 0.5, "yes", "no"),
                    levels = c("no", "yes"))
recall(leak_test$fraud, leak_pred)
#> [1] 0.7255426
```

This pipeline reports **73% recall**, versus the honest **50%** you measured the correct way. That extra 23 points is pure illusion: copies of the same frauds sat on both sides of the split. Deploy this model on genuinely new transactions and it will quietly fall back to 50%, and you will have promised your boss a number you cannot deliver.

=== step === quiz
::eyebrow Check yourself
## Before or after the split?

You want to use SMOTE on Priya's imbalanced data and report an honest recall. When do you apply it?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Apply SMOTE to the whole dataset first, then split into train and test, so both sets are balanced ::no This is the leak. Synthetic frauds built from test rows end up in training (and copies of training frauds end up in test), so your test score is inflated and meaningless. This is exactly the mistake that reported a fake 73%.
- Split into train and test first, then apply SMOTE to the training set only, and score on the untouched test ::ok Correct. The test set stays a real, imbalanced sample of the world, so its recall is an honest estimate. Only the training data is rebalanced.
- Balance the test set too, otherwise the test recall is not comparable ::no The test set must mirror reality, which is imbalanced. Balancing it would flatter the score and hide how the model behaves on the true 191-to-1 mix it will actually face.

=== step === concept
::eyebrow In practice
## In a real pipeline: themis inside a recipe

Doing the split-then-resample dance by hand is error-prone, and it gets worse under cross-validation, where the training set is itself re-split into folds and each fold must be resampled separately. In practice you let a pipeline handle it. In R, the **themis** package adds resampling as recipe steps, and the recipe is re-estimated on each fold's training rows only, so the leak above is impossible by construction.

```r-static
library(recipes)
library(themis)     # SMOTE, upsampling and downsampling as recipe steps
library(rsample)

rec <- recipe(fraud ~ ., data = train) |>
  step_smote(fraud)              # oversample the minority INSIDE the recipe

# Under cross-validation the recipe is re-prepped on each fold's analysis
# rows only; the held-out assessment rows are never resampled. Leak-safe.
folds <- vfold_cv(train, v = 5, strata = fraud)
```

Run that locally in a tidymodels workflow and you get the leak-safe version of everything above, with `step_downsample()` and `step_upsample()` available as alternatives. The mechanics are exactly what you built by hand; the recipe just makes the correct order automatic.

=== step === concept
::eyebrow Know your tool
## When to reach for resampling, and when not to

Resampling is one tool, not the whole answer. Knowing its edges is what separates a practitioner from someone who reaches for SMOTE on reflex.

**Reach for it when**

- Your model ignores the rare class entirely (recall near zero), and you have too few minority rows for the model to learn their pattern.
- You are using a model that has no built-in way to weight classes.

**Prefer something else when**

- You mostly need to *rank* or set a cutoff: often just **moving the decision threshold** ([Lesson 3](Thresholds-Under-Asymmetric-Costs.html)) recovers the rare class without inventing any rows.
- Your model supports **class weights** (`glm` weights, `randomForest`'s `classwt`, `xgboost`'s `scale_pos_weight`): weighting penalises minority mistakes without duplicating or synthesising data.
- You need trustworthy **probabilities**, not just labels. Resampling distorts the base rate, so a resampled model's "0.7" no longer means a 70% chance; you must recalibrate afterwards ([Lesson 5](Calibrating-Predicted-Probabilities.html)).

[WARNING]
SMOTE interpolates numerically, so it mangles non-continuous features: on a count like `n_declines` it will invent 0.83 of a declined attempt, and on a categorical code it produces values that mean nothing. It also weakens in high dimensions, where "between two neighbours" stops being meaningful. Treat resampling as a targeted fix for a real recall failure, not a default first move.

=== step === quiz
::eyebrow Check yourself
## Your model is drowning in false alarms

You SMOTE'd the training data and refit. Recall is now high, but the model flags 30% of all legitimate transactions as fraud, far too many to review. What is the best next move?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- Add even more synthetic minority points to push recall higher still ::no More resampling raises recall further but makes the false-alarm flood worse, not better. The problem now is precision, and more minority rows will not fix it.
- Balance the test set to match, so the false-positive rate looks reasonable ::no Never touch the test set. Its imbalance is the reality the model faces; balancing it just hides the false alarms instead of fixing them.
- Raise the decision threshold (or calibrate the probabilities) so only the most confident fraud alarms fire ::ok Right. Resampling made the minority visible; now you tune precision against recall by moving the threshold or calibrating, which is exactly what Lessons 3 and 5 are for. That trims false alarms without discarding the recall you gained.

=== step === concept
::eyebrow Go deeper
## References

- [Chawla, Bowyer, Hall & Kegelmeyer (2002), SMOTE, JAIR 16](https://doi.org/10.1613/jair.953) - the original paper that defined the method you built by hand here.
- [He & Garcia (2009), Learning from Imbalanced Data, IEEE TKDE](https://doi.org/10.1109/TKDE.2008.239) - the canonical survey of the whole problem: metrics, sampling, and cost-sensitive methods.
- [themis (tidymodels)](https://themis.tidymodels.org/) - the R package for leak-safe resampling as recipe steps, including SMOTE, up- and down-sampling.
- [van den Goorbergh et al. (2022), The harm of class imbalance corrections, JAMIA](https://doi.org/10.1093/jamia/ocac093) - honest counter-evidence that resampling can wreck probability calibration; read it before resampling by reflex.

=== step === complete
## Lesson 2 complete

You saw the imbalance trap for real: a 99.5%-accurate model that caught 0 of 52 frauds, and the scorecard (recall and precision) that exposes it. You rebalanced the training data three ways, built a SMOTE point from scratch, and, most importantly, learned to resample the training data only, after the split, so you never lie to yourself about the result.

Resampling made the rare class visible, but it left you flooded with false alarms. That is the next problem to solve.

Up next, Lesson 3: Thresholds Under Asymmetric Costs. When a missed fraud costs far more than a false alarm, the 0.5 cutoff is arbitrary. You will learn to move the decision threshold to the point that actually minimises what your errors cost.
