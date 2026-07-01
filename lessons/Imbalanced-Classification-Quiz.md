---
title: "Imbalanced Classification in R: Quiz"
description: "A short, graded check on the imbalanced-classification section: multiclass metrics, resampling a rare class, cost-based thresholds, ROC and PR curves, probability calibration, and why AUC alone is not enough."
keywords: "R quiz, imbalanced classification, class imbalance, resampling, threshold, ROC, precision recall, calibration, AUC, ds-imbalanced-classification"
post_type: "LESSON"
curriculum_id: "6.80.7"
webr: true
lesson_access: "free"
course_id: "ds-imbalanced-classification"
course_title: "Imbalanced Classification in R"
course_lesson: "7"
course_total: "7"
course_landing: "R-Imbalanced-Classification-Course.html"
lesson_kind: "quiz"
course_prev: "Why-AUC-Is-Not-Enough.html"
course_next: ""
catalog_blurb: "Check what stuck before you move on."
---

=== step === cover
::eyebrow Check your understanding
## Quiz
You have learned to classify into more than two classes and measure it fairly, rebalance a rare class without leaking, set the decision threshold by what errors cost, read ROC, PR, lift and gains curves, calibrate predicted probabilities, and see what a single AUC hides. This quiz checks what stuck. The last two steps are live R you can run.

=== step === quiz
::eyebrow Question 1 of 6
## The accuracy trap
A fraud model where 1% of cases are fraud reports 99% accuracy. The likely explanation is:
::quiz {"correct": 2, "gate": true, "difficulty": "intermediate"}
- The model is excellent and catches almost all fraud. ::no High accuracy on a rare class usually means the opposite.
- It predicts "not fraud" for everyone and rides the 99% majority. ::ok Correct: with 1% positives, always guessing the majority scores 99% while catching zero fraud.
- Accuracy is a good metric for rare events. ::no Accuracy is exactly the wrong metric under heavy imbalance.
- The dataset must be balanced. ::no The imbalance is what makes accuracy misleading here.

=== step === quiz
::eyebrow Question 2 of 6
## Resampling done right
When you upsample or apply SMOTE to fix class imbalance, you must:
::quiz {"correct": 1, "gate": true, "difficulty": "advanced"}
- Resample only the training folds, never the validation or test data. ::ok Correct: rebalancing the evaluation data leaks and inflates the score; test on the real distribution.
- Resample the entire dataset before splitting. ::no That leaks synthetic or duplicated rows into the test set.
- Resample the test set to match the training set. ::no The test set must reflect the real, imbalanced world.
- Only ever downsample, never upsample. ::no Both are valid; the rule is where you apply them, not which.

=== step === quiz
::eyebrow Question 3 of 6
## Setting the threshold
The default 0.5 classification cutoff is often wrong for imbalanced or costly problems because:
::quiz {"correct": 3, "gate": true, "difficulty": "intermediate"}
- Probabilities above 0.5 are always unreliable. ::no The issue is the cutoff choice, not the probabilities themselves.
- 0.5 is only valid for regression. ::no 0.5 is a classification cutoff; regression has no such thing.
- The best cutoff depends on what a false positive and a false negative each cost. ::ok Correct: when a missed fraud costs far more than a false alarm, you lower the threshold.
- Thresholds must always be above 0.9. ::no There is no fixed rule; the cost structure decides.

=== step === quiz
::eyebrow Question 4 of 6
## ROC versus PR
Under heavy class imbalance, the precision-recall curve is often more informative than ROC because:
::quiz {"correct": 2, "gate": true, "difficulty": "advanced"}
- ROC cannot be computed for imbalanced data. ::no ROC is always computable; it is just less sensitive here.
- ROC can look strong even when precision is poor, since the huge negative class inflates the true-negative side. ::ok Correct: PR focuses on the positive class you actually care about.
- PR ignores the positive class entirely. ::no PR is built around the positive class (precision and recall).
- The two curves are identical. ::no They can tell very different stories under imbalance.

=== step === quiz
::eyebrow Question 5 of 6
## What calibration means
A classifier is well-calibrated when:
::quiz {"correct": 1, "gate": true, "difficulty": "intermediate"}
- Among cases it scores 0.7, about 70% are actually positive. ::ok Correct: calibration means the predicted probability matches the observed frequency.
- Its accuracy is above 70%. ::no Accuracy and calibration are different properties.
- It always predicts probabilities near 0 or 1. ::no Extreme, overconfident scores are usually poorly calibrated.
- Its AUC equals 0.7. ::no AUC measures ranking, not whether a 0.7 means 70%.

=== step === quiz
::eyebrow Question 6 of 6
## What a single AUC hides
Reporting only AUC can mislead because AUC:
::quiz {"correct": 3, "gate": true, "difficulty": "advanced"}
- Depends on the exact threshold you pick. ::no AUC is threshold-independent; that is part of what it hides.
- Measures calibration directly. ::no AUC says nothing about whether probabilities are calibrated.
- Measures only ranking, so it ignores calibration and your actual operating point. ::ok Correct: two models with equal AUC can behave very differently at the threshold you deploy.
- Is only valid for balanced data. ::no AUC is defined regardless of balance; the issue is what it omits.

=== step === concept
::eyebrow Run it: the accuracy paradox
## High accuracy, zero recall
Build an imbalanced outcome, predict the majority class for everyone, and see accuracy stay high while recall collapses to zero.

```r
set.seed(1)
y    <- rbinom(1000, 1, 0.02)          # 2% positive
pred <- rep(0, 1000)                    # always predict the majority
accuracy <- mean(pred == y)
recall   <- sum(pred == 1 & y == 1) / sum(y == 1)
round(c(accuracy = accuracy, recall = recall), 3)
```

Accuracy near 0.98 looks great, but recall is 0: the model never catches a single positive. Accuracy alone would have hidden that completely.

=== step === concept
::eyebrow Run it: precision and recall from a threshold
## Moving the cutoff
Score cases, then compute precision and recall at a chosen threshold. Lower the cutoff and watch recall rise while precision falls.

```r
set.seed(1)
y <- rbinom(400, 1, 0.3)
p <- pmin(pmax(0.3 * y + rnorm(400, 0.3, 0.2), 0), 1)   # scores, higher for positives
metrics <- function(t) {
  pred <- as.integer(p >= t)
  c(precision = sum(pred & y) / max(sum(pred), 1),
    recall    = sum(pred & y) / sum(y))
}
round(rbind(t_0.5 = metrics(0.5), t_0.3 = metrics(0.3)), 3)
```

Dropping the threshold from 0.5 to 0.3 catches more positives (higher recall) at the cost of more false alarms (lower precision), the trade-off you tune by cost.

=== step === complete
## Section complete
Great work. You can measure multiclass models fairly, rebalance a rare class without leaking, set thresholds by cost, read ROC and PR curves, calibrate probabilities, and see past a single AUC. Next: unsupervised learning, where the data has no labels at all.
