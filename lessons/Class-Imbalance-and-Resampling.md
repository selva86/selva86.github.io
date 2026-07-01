---
title: "Imbalanced Classification Lesson 2: Class Imbalance and Resampling"
catalog_blurb: "Rebalance a rare class so a model catches it, without leaking into evaluation."
description: "How class imbalance makes accuracy lie, how undersampling, oversampling and SMOTE rebalance a rare class in R, and how to resample without leaking into your test set."
keywords: "class imbalance, imbalanced classification, resampling, SMOTE, oversampling, undersampling, themis, data leakage, recall, R"
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

A bank's fraud detector sees 3,000 card transactions. Only 150 of them are fraud. A model that flags nothing at all is 95% accurate, and completely useless: it catches zero fraud.

That is class imbalance, and it quietly breaks the metric most people trust first. In this lesson you will fix it by changing the data the model trains on.

By the end you will be able to:

- Explain why plain accuracy lies on a rare-class problem, and what to watch instead
- Rebalance a training set by under- and oversampling, and watch a model start catching the rare class
- Explain what SMOTE does that plain copying does not
- Resample the right way, so you never leak the fix into your test score

**Prerequisites:** you can fit a basic classifier in R, and you know what a train/test split is ([Train, Validation, Test and Data Leakage](Train-Validation-Test-and-Data-Leakage.html)). Lesson 1 handled many classes at once; this one handles the case where one class is rare.

::widget imbalance-resample {}

=== step === concept
::eyebrow The problem
## When accuracy lies

Back to the bank. Of every 100 transactions, 95 are legitimate and 5 are fraud. Call the common class (legit) the **majority** and the rare class (fraud) the **minority**. The *imbalance ratio* is just how lopsided that is, \(\text{IR} = N_{\text{majority}} / N_{\text{minority}}\); here it is \(1900/100 = 19\) to one.

Let us build that data and try the laziest model imaginable: predict "legit" every single time. Each lesson runs in a fresh R session, so we build the transactions right here.

```r
# 3,000 card transactions; fraud is rare and looks a little different.
set.seed(42)
make_txns <- function(n_legit, n_fraud) {
  legit <- data.frame(
    amount  = round(rlnorm(n_legit, 3.3, 0.8), 2),          # everyday spend
    hour    = sample(6:23, n_legit, replace = TRUE),        # mostly daytime
    foreign = rbinom(n_legit, 1, 0.04),                     # rarely abroad
    class   = "legit"
  )
  fraud <- data.frame(
    amount  = round(rlnorm(n_fraud, 3.9, 0.9), 2),          # a bit larger
    hour    = sample(0:23, n_fraud, replace = TRUE),        # any hour
    foreign = rbinom(n_fraud, 1, 0.30),                     # more often abroad
    class   = "fraud"
  )
  d <- rbind(legit, fraud)
  d$class <- factor(d$class, levels = c("legit", "fraud"))
  d[sample(nrow(d)), ]                                       # shuffle the rows
}
train <- make_txns(1900, 100)   # 2,000 rows, 5% fraud
test  <- make_txns(950,  50)    # 1,000 rows, 5% fraud, kept untouched
table(train$class)
#> 
#> legit fraud 
#>  1900   100
```

```r
# The laziest possible model: call every transaction "legit".
always_legit <- factor(rep("legit", nrow(test)), levels = c("legit", "fraud"))

mean(always_legit == test$class)                      # accuracy
#> [1] 0.95

table(prediction = always_legit, actual = test$class) # where did the fraud go?
#>           actual
#> prediction legit fraud
#>      legit   950    50
#>      fraud     0     0
```

Ninety-five percent accurate, and it caught none of the 50 real fraud cases. Accuracy counts every correct call equally, so a model can score high just by nailing the majority. The metric that exposes this is **recall** (also called sensitivity): of all the transactions that really were fraud, what fraction did we catch?

\[ \text{Recall} = \frac{TP}{TP + FN} \]

Here \(TP\) (true positives) is fraud we correctly flagged and \(FN\) (false negatives) is fraud we missed. The lazy model has \(TP = 0\), so its recall is \(0/50 = 0\).

[KEY INSIGHT]
On an imbalanced problem, accuracy is dominated by the majority class. Track recall on the minority class (and precision alongside it: of everything you flag as fraud, the fraction that truly is) so a model cannot hide behind the easy 95%.

=== step === quiz
::eyebrow Check yourself
## A very accurate, very useless model

Your fraud model reports **95% accuracy** on the test set. You then notice it flagged **zero** transactions as fraud. What is going on?

::quiz {"correct":3,"gate":true,"difficulty":"beginner"}
- The model is excellent; 95% is a strong score ::no Accuracy is inflated by the 95% of easy legit rows. A model that catches no fraud has failed at its one job.
- The model just needs more training data to improve ::no More data of the same 95/5 mix will not help; the problem is the imbalance and the metric, not the sample size.
- Accuracy is the wrong metric here; it scores high by always predicting the majority, while recall on fraud is 0 ::ok Exactly. With 95% legit, predicting "legit" everywhere is 95% accurate and catches nothing. Recall exposes the failure.

=== step === concept
::eyebrow The first fix
## Rebalance the training data

If the model ignores fraud because fraud is rare, make it less rare, in the training data. Two moves do this:

- **Undersampling:** throw away most of the 1,900 legit rows until legit and fraud are even. Simple, but you discard real data.
- **Oversampling:** duplicate the 100 fraud rows until the two classes match. You keep every legit row, but the copies carry no new information.

Toggle between them below. Watch the minority region fill in and the class counts even out.

::widget imbalance-resample {}

Now do it for real. We fit the same tree twice, once on the raw imbalanced data and once after oversampling the training minority, and score both on the untouched test set with recall and precision.

```r
library(rpart)

# recall: of all real fraud, the fraction we catch.
# precision: of everything we flag as fraud, the fraction that truly is.
recall    <- function(p, a) sum(p == "fraud" & a == "fraud") / sum(a == "fraud")
precision <- function(p, a) sum(p == "fraud" & a == "fraud") / sum(p == "fraud")

# Train on the raw, imbalanced data.
fit_imb  <- rpart(class ~ amount + hour + foreign, data = train, method = "class")
pred_imb <- predict(fit_imb, test, type = "class")
round(c(recall = recall(pred_imb, test$class),
        precision = precision(pred_imb, test$class)), 2)
#>    recall precision 
#>      0.42      0.66
```

```r
# Oversample: duplicate minority rows until the classes are even (TRAIN ONLY).
set.seed(1)
min_i    <- which(train$class == "fraud")
extra    <- sample(min_i, sum(train$class == "legit") - length(min_i), replace = TRUE)
train_up <- train[c(seq_len(nrow(train)), extra), ]
table(train_up$class)
#> 
#> legit fraud 
#>  1900  1900

# Same model, same test set, now trained on the balanced data.
fit_bal  <- rpart(class ~ amount + hour + foreign, data = train_up, method = "class")
pred_bal <- predict(fit_bal, test, type = "class")
round(c(recall = recall(pred_bal, test$class),
        precision = precision(pred_bal, test$class)), 2)
#>    recall precision 
#>      0.68      0.20
```

Same algorithm, same features, same test set. Oversampling lifted recall from 0.42 to 0.68: the tree now catches two-thirds of the fraud instead of under half. But precision fell from 0.66 to 0.20, because the balanced model flags many more transactions and most of the extra flags are false alarms.

[NOTE]
Rebalancing is a trade, not a free win. Here it caught far more fraud (recall up) but made four of every five flags a false alarm (precision 0.20). Whether that is worth it depends on the cost of a missed fraud versus a false alarm, which is exactly what Lesson 3 makes explicit. Always judge on an untouched, still-imbalanced test set.

=== step === concept
::eyebrow A smarter oversample
## SMOTE: synthesise, do not just copy

Plain oversampling has a weakness: it stacks identical copies of the same 100 fraud rows. The model sees those exact points over and over and can memorise them, which overfits.

**SMOTE** (Synthetic Minority Over-sampling Technique) fixes this by inventing *new* minority points instead of copying old ones. For a minority point \(x_i\), it picks one of its minority nearest neighbours \(x_j\) (another fraud case sitting close to it in the data) and drops a synthetic point somewhere on the line between them:

\[ x_{\text{new}} = x_i + \lambda\,(x_j - x_i), \qquad \lambda \sim \text{Uniform}(0,1) \]

Here \(\lambda\) is a random fraction between 0 and 1, so \(x_{\text{new}}\) lands between two real fraud cases rather than exactly on one. The class is balanced *and* more varied. Move the widget in the previous step to SMOTE to see the new points appear between the real ones.

In R, the tidymodels package **themis** does SMOTE as a recipe step. A recipe learns everything on the training data only, so it cannot leak into your test set (the whole point of the next step). Run this one in your local R session:

```r-static
library(recipes)
library(themis)

rec <- recipe(class ~ amount + hour + foreign, data = train) |>
  step_smote(class)                 # synthesise minority points to balance the class

train_smote <- prep(rec) |> bake(new_data = NULL)   # apply to the training data
table(train_smote$class)
#> 
#> legit fraud 
#>  1900  1900
```

=== step === concept
::eyebrow The pitfall that fools everyone
## Resample after you split, never before

Here is the mistake that inflates scores across countless projects: balance the whole dataset first, *then* split into train and test. It feels tidy. It quietly cheats.

When you oversample or SMOTE before splitting, copies (or synthetic children) of the same fraud rows land in **both** the training and the test set. The model is then tested partly on data it already saw. Your recall looks great in the notebook and collapses in production.

The rule is simple: **split first, and resample only the training fold** (the rows you kept for training). The test set must keep the real, imbalanced class rates, because that is what production looks like.

::widget process-flow {"steps":[{"title":"Split first","sub":"hold out the test set BEFORE you touch the class balance"},{"title":"Resample the training fold only","sub":"oversample or SMOTE inside the training rows, never the test rows"},{"title":"Fit the model","sub":"train on the rebalanced training fold"},{"title":"Evaluate on the untouched test set","sub":"the test set keeps the real 95 / 5 class rates"}]}

This is exactly why themis lives inside a recipe: a recipe is fit on the training fold during cross-validation (repeated train/test rounds that rotate which rows are held out), so the resampling is redone fresh on each fold and never sees held-out rows.

=== step === quiz
::eyebrow Check yourself
## Where does SMOTE belong?

You have an imbalanced fraud dataset and want to use SMOTE. At which point do you apply it?

::quiz {"correct":3,"gate":true,"difficulty":"intermediate"}
- To the whole dataset first, then split into train and test ::no That leaks: synthetic copies of the same fraud rows end up in both train and test, so your test score is fake.
- To both the training and the test set, so they are balanced the same way ::no Never touch the test set. It must keep the real, imbalanced rates that production will show.
- To the training fold only, after the split ::ok Correct. Split first, resample only the training data. The test set stays untouched and imbalanced, so its score is honest.

=== step === tryit
::eyebrow Your turn
## Oversample the training minority

Balance the training set by duplicating fraud rows up to the number of legit rows. There are 100 fraud rows but you need 1,800 more, so you must draw the same rows repeatedly. Fill in the blank that allows that.

```r
min_i    <- which(train$class == "fraud")
n_needed <- sum(train$class == "legit") - length(min_i)   # 1900 - 100 = 1800
extra    <- sample(min_i, n_needed, replace = ____)        # draw duplicate rows
train_up <- train[c(seq_len(nrow(train)), extra), ]
table(train_up$class)
```
::check {"regex":"replace\\s*=\\s*TRUE","gate":true,"difficulty":"beginner","ok":"Right. With replacement you can draw the same 100 fraud rows as many times as needed to reach 1,900.","no":"You need 1,800 draws from only 100 rows, so you must sample WITH replacement: replace = TRUE."}
::solution
```r
min_i    <- which(train$class == "fraud")
n_needed <- sum(train$class == "legit") - length(min_i)
extra    <- sample(min_i, n_needed, replace = TRUE)
train_up <- train[c(seq_len(nrow(train)), extra), ]
table(train_up$class)
```

=== step === concept
::eyebrow Know your options
## Beyond resampling

Resampling is the most direct fix, but not the only one, and not always the best. Three alternatives to keep in your pocket:

1. **Class weights.** Instead of changing the rows, tell the model to care more about the rare class. Many R models take a weight or cost argument (`randomForest(classwt = ...)`, `glm(weights = ...)`, `rpart(parms = list(loss = ...))`). No data is duplicated or discarded.
2. **Move the threshold.** A classifier outputs a probability; the default cutoff of 0.5 is arbitrary. Lowering it flags more fraud without retraining at all. That is the whole of Lesson 3.
3. **Recalibrate afterwards.** Resampling changes the base rate the model thinks it sees, so its predicted probabilities come out too high. If you need trustworthy probabilities (not just a yes/no), you have to recalibrate. That is Lesson 5.

[WARNING]
Resampling is a training-time trick, not a metric. It can lift recall while distorting predicted probabilities and denting precision. Always judge the result on an untouched, still-imbalanced test set, using recall and precision, not accuracy.

=== step === concept
::eyebrow Go deeper
## References

- [Chawla et al. (2002), SMOTE: Synthetic Minority Over-sampling Technique, JAIR 16](https://doi.org/10.1613/jair.953) - the original SMOTE paper, with the interpolation idea in full.
- [He & Garcia (2009), Learning from Imbalanced Data, IEEE TKDE](https://doi.org/10.1109/TKDE.2008.239) - the standard survey of imbalance methods and metrics.
- [themis package documentation (tidymodels)](https://themis.tidymodels.org/) - the R package for step_smote, step_upsample and step_downsample.
- [tidymodels: subsampling for class imbalances](https://www.tidymodels.org/learn/models/sub-sampling/) - the leak-free way to resample inside cross-validation.
- [King and Zeng (2001), Logistic Regression in Rare Events Data](https://doi.org/10.1093/pan/9.2.137) - why rare-event models need probability correction, the seed of Lesson 5.

=== step === complete
## Lesson 2 complete

You saw why accuracy lies on a rare class, rebalanced a training set by over- and undersampling, met SMOTE's synthetic points, and, most importantly, learned to resample the training fold only so the fix never leaks into your test score.

You also saw the honest catch: resampling lifts recall but can cost precision and distort probabilities. That sets up the next two ideas.

Next, Lesson 3: Thresholds Under Asymmetric Costs. When a missed fraud costs far more than a false alarm, you do not touch the data at all, you move the decision cutoff, and let the cost of each mistake decide where it goes.
