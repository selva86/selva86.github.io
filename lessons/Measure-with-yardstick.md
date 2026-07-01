---
title: "tidymodels Lesson 5: Measure with yardstick"
catalog_blurb: "How to score a classifier honestly when accuracy alone misleads you."
description: "Accuracy can hide a weak classifier. Read a confusion matrix, choose precision, recall and ROC AUC with yardstick, and read each metric across your resampling folds."
keywords: "yardstick, classification metrics in R, confusion matrix, precision and recall, ROC AUC, metric_set, collect_metrics, accuracy paradox, tidymodels, imbalanced classes"
post_type: "LESSON"
curriculum_id: "6.50.5"
webr: true
mathjax: true
lesson_access: "free"
course_id: "ds-tidymodels"
course_title: "Modeling with tidymodels"
course_lesson: "5"
course_total: "7"
course_landing: "R-tidymodels-Course.html"
course_next: "Tune-with-the-tune-package.html"
course_prev: "Resample-with-rsample.html"
---

=== step === cover
::eyebrow Lesson 5 of 7
## Measure with yardstick

In Lesson 4 you cross-validated the lender's loan-default model and reported a steady accuracy of about 0.65. The risk team nods. Then someone asks the awkward question: of the applicants who actually defaulted, how many did the model catch?

Hold that thought, because a model that flags **nobody** as risky scores almost as high: 63% accuracy, by doing nothing at all. Accuracy, it turns out, can be the wrong yardstick. This lesson is about picking the right one.

By the end you will be able to:

- Explain why accuracy misleads when one class is rarer than the other
- Read a confusion matrix and compute precision and recall for the class you care about
- Choose a set of metrics, compute them at once, and read each one across your resampling folds

**Prerequisites:** you can run R and use the `|>` pipe, and you can [bundle a recipe and a model into a workflow](Bundle-Steps-with-workflows.html) (Lesson 3) and [score it across resamples](Resample-with-rsample.html) (Lesson 4). We reuse that exact loan-default workflow here.

::widget roc-curve {}

=== step === concept
::eyebrow The trap
## When accuracy lies

Here is the lender's loan book again, rebuilt right here so this page runs on its own. Each row is one applicant; `defaulted` is what we are trying to predict.

```r
set.seed(7)
n <- 240
loans <- data.frame(
  income   = round(runif(n, 22000, 98000)),   # annual income, dollars
  age      = round(runif(n, 21, 60)),
  employed = round(runif(n, 2, 160)),          # months at current job
  home     = factor(sample(c("own", "rent", "mortgage"), n, TRUE))
)
risk <- with(loans, plogis(-1.1 + 1.4 * (income < 45000) +
             1.0 * (employed < 20) + 0.6 * (home == "rent")))
loans$defaulted <- factor(ifelse(runif(n) < risk, "yes", "no"))
table(loans$defaulted)
#>
#>  no yes
#> 151  89
```

Of 240 applicants, 151 paid back and only 89 defaulted. The classes are **imbalanced**: "no" is almost twice as common as "yes". Drawn out, the lopsidedness is obvious.

::widget chart-plotter {"data":[{"x":"no","y":151},{"x":"yes","y":89}],"geoms":["bar"],"x":"status","y":"applicants"}

Now watch the trap spring. Build the laziest possible model, one that ignores every feature and just predicts "no" (will not default) for everyone:

```r
naive <- rep("no", nrow(loans))
round(mean(naive == loans$defaulted), 3)   # its accuracy
#> [1] 0.629
sum(loans$defaulted == "yes")              # real defaulters it lets straight through
#> [1] 89
```

This model is useless to the bank: it approves every loan and catches **zero** of the 89 defaulters. Yet it is right 63% of the time, because being right on the common class is easy. Any real model has to beat 63% just to look better than doing nothing. Accuracy alone would never tell you that.

[KEY INSIGHT]
On imbalanced data, accuracy is graded on a curve set by the majority class. A high number can hide a model that completely fails at the rare outcome, which is usually the outcome you built the model to find.

One bookkeeping step before we measure properly. yardstick, like the rest of tidymodels, treats the **first** level of the outcome factor as the event you are trying to detect. Our event is a default, the "yes", so we move it to the front.

```r
loans$defaulted <- relevel(loans$defaulted, ref = "yes")
levels(loans$defaulted)
#> [1] "yes" "no"
```

=== step === quiz
::eyebrow Check yourself
## Which model should the bank ship?

A defaulted loan costs the bank far more than the interest on a good one. You have two candidates. Model A flags no one: 63% accuracy, catches 0 of 89 defaulters. Model B flags the risky-looking applicants and catches most defaulters, but its overall accuracy is only 58%. Which should the bank prefer?

::quiz {"correct":2,"gate":true,"difficulty":"intermediate"}
- Model A, because 63% is the higher accuracy ::no That is the trap. Model A's accuracy comes entirely from the easy majority class; it never catches a single default, the exact thing the bank is paying to predict. A higher accuracy is not automatically a better model.
- Model B, because catching defaulters is the decision the model exists to support, even though its accuracy is lower ::ok Exactly. The right metric follows the decision. The bank loses money on missed defaults, so a model that catches them is worth more than one with a prettier accuracy that catches none.
- They are equivalent, since the two accuracies are within a few points ::no Accuracy being close hides a night-and-day difference: 0 defaulters caught versus most of them. The numbers that matter here are not close at all.

=== step === concept
::eyebrow Reading a classifier
## The confusion matrix, and the two numbers that matter

To measure a classifier honestly, stop counting "right vs wrong" and count the **four** outcomes separately. Fit the loan-default workflow from Lessons 3 and 4, get its predictions on the held-out test rows, and lay them in a confusion matrix.

```r
library(rsample); library(recipes); library(parsnip); library(workflows); library(yardstick)

set.seed(1)
split <- initial_split(loans, prop = 0.75, strata = defaulted)
train <- training(split)
test  <- testing(split)

rec  <- recipe(defaulted ~ ., data = train) |>
  step_normalize(all_numeric_predictors()) |>
  step_dummy(all_nominal_predictors())
spec <- logistic_reg() |> set_engine("glm") |> set_mode("classification")
wf   <- workflow() |> add_recipe(rec) |> add_model(spec)
fit  <- fit(wf, train)

preds <- augment(fit, test)   # adds .pred_class, .pred_yes, .pred_no to the test rows
conf_mat(preds, truth = defaulted, estimate = .pred_class)
#>           Truth
#> Prediction yes no
#>        yes   7  5
#>        no   16 33
```

Read that 2x2 in plain English. The test set held 61 applicants, 23 of whom truly defaulted. Naming the event "yes" (a default) the positive class:

- **True positives (7):** real defaulters the model flagged. Caught.
- **False negatives (16):** real defaulters the model cleared. The expensive misses, the bank lends to them and loses money.
- **False positives (5):** good applicants the model wrongly flagged. Annoying, possibly lost business.
- **True negatives (33):** good applicants the model correctly cleared.

Two summaries of that table answer two different questions. Writing \(TP\), \(FP\), \(FN\), \(TN\) for the four counts:

\[ \text{recall} = \frac{TP}{TP + FN}, \qquad \text{precision} = \frac{TP}{TP + FP} \]

**Recall** (also called sensitivity) asks: of all the applicants who actually defaulted, what fraction did we catch? **Precision** asks: of all the applicants we flagged, what fraction really defaulted? `yardstick` computes each one straight from the predictions.

```r
recall(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 recall  binary         0.304
precision(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 1 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 precision binary         0.583
```

So the model's accuracy is a respectable 0.656, but its recall is **0.30**: it catches only 7 of the 23 real defaulters and waves the other 16 through. The single accuracy number hid that completely. When you need one figure that balances the two, the **F1 score** is their harmonic mean, \( F_1 = \dfrac{2 \cdot \text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}} \), which here is about 0.40, far less flattering than 0.66.

=== step === widget
::eyebrow The dial behind the metrics
## The threshold and the ROC curve

Where did "yes" and "no" even come from? The model outputs a probability of default, and a rule turns it into a label: flag the applicant if that probability clears a **threshold**, by default 0.5. That threshold is a dial you can turn.

Drag it below. Lower the threshold and you flag more applicants: recall climbs (you catch more defaulters) but precision falls (more good applicants get swept up). Raise it and the trade reverses. No single cutoff is "correct"; it depends on what a miss costs you versus a false alarm.

::widget roc-curve {}

The **ROC curve** plots that whole trade at once: each point is one threshold, its true-positive rate (recall) against its false-positive rate. A model that ranks defaulters above non-defaulters hugs the top-left corner; random guessing rides the diagonal. The **AUC** (area under the curve) squeezes the entire curve into one threshold-free number between 0.5 (useless) and 1.0 (perfect). For our loan model:

```r
roc_auc(preds, truth = defaulted, .pred_yes)
#> # A tibble: 1 x 3
#>   .metric .estimator .estimate
#>   <chr>   <chr>          <dbl>
#> 1 roc_auc binary         0.625
```

An AUC of 0.625 says the model ranks a random defaulter above a random non-defaulter only 63% of the time: better than a coin flip, but not by much. Note that `roc_auc` reads the probability column `.pred_yes`, not the hard `yes/no` label, because it needs the scores it sweeps the threshold over.

=== step === quiz
::eyebrow Check yourself
## You turn the dial down

The loan model at the default 0.5 cutoff catches just 7 of 23 defaulters. You lower the threshold to 0.3 so more applicants get labelled "yes". What happens to recall and precision?

::quiz {"correct":1,"gate":true,"difficulty":"intermediate"}
- Recall usually goes up (you catch more defaulters), and precision usually goes down (more of your flags are false alarms) ::ok Right. A lower bar flags more applicants, so more true defaulters get caught (recall up), but more good applicants get caught too (precision down). You buy recall with precision; the ROC curve is the map of that trade.
- Both recall and precision go up, because a lower threshold is strictly better ::no There is no free lunch. Flagging more people cannot raise both at once: the extra flags include real defaulters and good applicants, so one metric rises while the other falls.
- Nothing changes, because the threshold only affects accuracy ::no The threshold changes which applicants are called "yes", so it moves every count in the confusion matrix, and therefore recall, precision and accuracy all shift.

=== step === concept
::eyebrow Compute them together
## A metric set, not a metric

You rarely want one metric in isolation; you want a small, fixed panel reported the same way every time. `metric_set` bundles several yardstick metrics into a single function you can call once.

```r
loan_metrics <- metric_set(accuracy, precision, recall, f_meas)
loan_metrics(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 4 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 accuracy  binary         0.656
#> 2 precision binary         0.583
#> 3 recall    binary         0.304
#> 4 f_meas    binary         0.4
```

One call, one tidy table, the whole story side by side: decent accuracy, mediocre precision, poor recall. A set can even mix label metrics with probability metrics like `roc_auc`; you just hand it both the predicted class and the probability column, and yardstick routes each metric to the column it needs.

[NOTE]
Decide your metric set **before** you look at the scores, and let the decision pick it: recall when misses are costly (defaults, disease, fraud), precision when false alarms are costly (spam filters), ROC AUC when you want to judge the ranking independently of any one threshold. Choosing the metric after seeing the numbers is just picking the one that makes the model look best.

=== step === concept
::eyebrow The payoff
## Read every metric across the resamples

One test split gives one draw of each metric, and Lesson 4 showed how much a single split can swing. The honest move is the same one as before: hand your metric set to `fit_resamples`, and it scores **every** metric on **every** fold. `collect_metrics` then returns each metric's average and its standard error across the folds.

```r
library(tune)
set.seed(1)
folds <- vfold_cv(train, v = 5, strata = defaulted)

set.seed(3)
cv <- fit_resamples(wf, folds,
                    metrics = metric_set(accuracy, precision, recall, roc_auc))
collect_metrics(cv)
#> # A tibble: 4 x 6
#>   .metric   .estimator  mean     n std_err .config
#>   <chr>     <chr>      <dbl> <int>   <dbl> <chr>
#> 1 accuracy  binary     0.681     5  0.0501 pre0_mod0_post0
#> 2 precision binary     0.644     5  0.127  pre0_mod0_post0
#> 3 recall    binary     0.333     5  0.0747 pre0_mod0_post0
#> 4 roc_auc   binary     0.624     5  0.0462 pre0_mod0_post0
```

Now the verdict is trustworthy and complete: across five folds the model averages 68% accuracy but only 33% recall, confirming the one-split story rather than relying on it. Look at the `std_err` column too. Precision wobbles hugely (standard error 0.127, because each small fold flags only a handful of applicants), so its 0.644 is a soft number, while recall and AUC are far steadier. Reading the spread, not just the mean, is what keeps you from over-trusting a lucky fold.

=== step === tryit
::eyebrow Your turn
## Build the set the bank needs

The risk team cares most about catching defaulters, so recall has to be in the panel. Complete the metric set so it reports accuracy, precision, **and** recall, then score the test predictions with it.

```r
catch_metrics <- metric_set(accuracy, precision, ____)
catch_metrics(preds, truth = defaulted, estimate = .pred_class)
```
::check {"regex":"recall","gate":true,"difficulty":"beginner","ok":"That is the panel: accuracy, precision and recall in one call, with recall front and centre because the misses are what cost the bank.","no":"Add recall to the set: metric_set(accuracy, precision, recall)."}
::solution
```r
catch_metrics <- metric_set(accuracy, precision, recall)
catch_metrics(preds, truth = defaulted, estimate = .pred_class)
#> # A tibble: 3 x 3
#>   .metric   .estimator .estimate
#>   <chr>     <chr>          <dbl>
#> 1 accuracy  binary         0.656
#> 2 precision binary         0.583
#> 3 recall    binary         0.304
```

=== step === concept
::eyebrow Go deeper
## References

A few authoritative places to take this further:

- [yardstick package documentation (tidymodels)](https://yardstick.tidymodels.org/) - the reference for `accuracy()`, `precision()`, `recall()`, `roc_auc()` and `metric_set()`, including the event-level convention.
- [Tidy Modeling with R, ch. 9: Judging model effectiveness](https://www.tmwr.org/performance) - Kuhn and Silge on choosing metrics that match the problem and reporting them across resamples.
- [An Introduction to Statistical Learning, ch. 4 (free PDF)](https://www.statlearning.com/) - the confusion matrix, sensitivity and specificity, and the ROC curve, with the underlying statistics.
- [Google ML Crash Course: ROC and AUC](https://developers.google.com/machine-learning/crash-course/classification/roc-and-auc) - a clear, visual walk-through of the threshold sweep and what AUC measures.

=== step === complete
## Lesson 5 complete

You stopped trusting a single accuracy number. You can read a confusion matrix, compute precision and recall for the class that actually matters, summarize the whole threshold trade with an ROC curve and its AUC, and report a chosen metric set across every resampling fold with `collect_metrics`. That is what "evaluating a model honestly" really means.

Next, Lesson 6: Tune with the tune package. You have a fair yardstick now, so you can finally use it to choose between models. You will search a grid of hyperparameters, score each candidate across resamples on the metric you care about, and let the winner finalize your workflow.
